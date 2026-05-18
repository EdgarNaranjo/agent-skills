/**
 * Odoo Context Extension
 *
 * Automatically detects Odoo modules in the current working directory and
 * injects that context into Claude's system prompt, making all Odoo code
 * generation context-aware instead of generic.
 *
 * What it does:
 * 1. session_start  — Scans ctx.cwd for __manifest__.py files and extracts
 *                     module metadata, models (_name / _inherit), and XML IDs.
 * 2. before_agent_start — Injects a structured "Odoo Module Context" block
 *                         into the system prompt (once per session).
 * 3. odoo_scan tool — Returns the full, un-truncated module data so the LLM
 *                     can reference exact model names and XML IDs when
 *                     generating code.
 *
 * Usage:
 *   Copy to ~/.pi/agent/extensions/odoo-context.ts   (global)
 *   or    .pi/extensions/odoo-context.ts              (project-local)
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OdooModule {
  /** Directory name, e.g. "sale_custom" */
  technical_name: string;
  /** 'name' field from __manifest__.py */
  display_name: string;
  /** 'version' field from __manifest__.py */
  version: string;
  /** 'depends' list from __manifest__.py */
  depends: string[];
  /** _name = "..." values found in models/ */
  models: string[];
  /** _inherit = "..." / ["..."] values found in models/ */
  inherits: string[];
  /** id="..." on <record> tags in views/, wizards/, report/ */
  view_xml_ids: string[];
}

// ---------------------------------------------------------------------------
// Manifest parsing helpers  (regex-based, no Python parser needed)
// ---------------------------------------------------------------------------

function parseManifestField(content: string, field: string): string {
  const re = new RegExp(`'${field}'\\s*:\\s*['"]([^'"]+)['"]`);
  const m = content.match(re);
  return m ? m[1] : "";
}

function parseManifestDepends(content: string): string[] {
  // Find the 'depends' key and capture the bracketed list that follows it.
  const blockMatch = content.match(/'depends'\s*:\s*\[([^\]]*)\]/s);
  if (!blockMatch) return [];
  const block = blockMatch[1];
  // Extract every quoted string inside the list.
  const items: string[] = [];
  const itemRe = /['"]([^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(block)) !== null) {
    items.push(m[1]);
  }
  return items;
}

// ---------------------------------------------------------------------------
// Python model scanning helpers
// ---------------------------------------------------------------------------

function extractModelsFromPy(content: string): { names: string[]; inherits: string[] } {
  const names: string[] = [];
  const inherits: string[] = [];

  // _name = "some.model"
  const nameRe = /_name\s*=\s*['"]([^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = nameRe.exec(content)) !== null) {
    names.push(m[1]);
  }

  // _inherit = "some.model"  OR  _inherit = ["a", "b"]
  const inheritSingleRe = /_inherit\s*=\s*['"]([^'"]+)['"]/g;
  while ((m = inheritSingleRe.exec(content)) !== null) {
    inherits.push(m[1]);
  }
  const inheritListMatch = content.match(/_inherit\s*=\s*\[([^\]]*)\]/s);
  if (inheritListMatch) {
    const listBlock = inheritListMatch[1];
    const listItemRe = /['"]([^'"]+)['"]/g;
    while ((m = listItemRe.exec(listBlock)) !== null) {
      inherits.push(m[1]);
    }
  }

  return { names, inherits };
}

// ---------------------------------------------------------------------------
// XML ID scanning helper
// ---------------------------------------------------------------------------

function extractXmlIds(content: string): string[] {
  const ids: string[] = [];
  // Match <record id="..." ...> — handles single or double quotes
  const re = /<record[^>]+\bid\s*=\s*["']([^"']+)["']/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    ids.push(m[1]);
  }
  return ids;
}

// ---------------------------------------------------------------------------
// File-system helpers
// ---------------------------------------------------------------------------

function safeReadFile(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

function safeReadDir(dirPath: string): string[] {
  try {
    return fs.readdirSync(dirPath);
  } catch {
    return [];
  }
}

function isDirectory(p: string): boolean {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Core scanner
// ---------------------------------------------------------------------------

function scanPyDir(dir: string): { names: string[]; inherits: string[] } {
  const allNames: string[] = [];
  const allInherits: string[] = [];
  const files = safeReadDir(dir);
  for (const f of files) {
    if (!f.endsWith(".py")) continue;
    const content = safeReadFile(path.join(dir, f));
    if (!content) continue;
    const { names, inherits } = extractModelsFromPy(content);
    allNames.push(...names);
    allInherits.push(...inherits);
  }
  return { names: allNames, inherits: allInherits };
}

function scanXmlDir(dir: string): string[] {
  const all: string[] = [];
  const files = safeReadDir(dir);
  for (const f of files) {
    if (!f.endsWith(".xml")) continue;
    const content = safeReadFile(path.join(dir, f));
    if (!content) continue;
    all.push(...extractXmlIds(content));
  }
  return all;
}

/** Returns an OdooModule if `moduleDir` contains __manifest__.py, else null. */
function scanModule(moduleDir: string, technicalName: string): OdooModule | null {
  const manifestPath = path.join(moduleDir, "__manifest__.py");
  const manifest = safeReadFile(manifestPath);
  if (!manifest) return null;

  const display_name = parseManifestField(manifest, "name") || technicalName;
  const version = parseManifestField(manifest, "version") || "";
  const depends = parseManifestDepends(manifest);

  // Models
  const modelsDir = path.join(moduleDir, "models");
  const { names: models, inherits } = isDirectory(modelsDir)
    ? scanPyDir(modelsDir)
    : { names: [], inherits: [] };

  // XML IDs — check views/, wizards/, report/
  const xmlDirs = ["views", "wizards", "report"];
  const view_xml_ids: string[] = [];
  for (const sub of xmlDirs) {
    const subDir = path.join(moduleDir, sub);
    if (isDirectory(subDir)) {
      view_xml_ids.push(...scanXmlDir(subDir));
    }
  }

  return {
    technical_name: technicalName,
    display_name,
    version,
    depends,
    models: [...new Set(models)],
    inherits: [...new Set(inherits)],
    view_xml_ids: [...new Set(view_xml_ids)],
  };
}

/** Discover all Odoo modules inside `cwd`. */
function discoverModules(cwd: string): OdooModule[] {
  const modules: OdooModule[] = [];

  // Check if cwd itself is an Odoo module
  const cwdModule = scanModule(cwd, path.basename(cwd));
  if (cwdModule) {
    modules.push(cwdModule);
  }

  // Scan immediate subdirectories
  let entries: string[] = [];
  try {
    entries = fs.readdirSync(cwd);
  } catch {
    return modules;
  }

  for (const entry of entries) {
    const fullPath = path.join(cwd, entry);
    if (!isDirectory(fullPath)) continue;
    // Skip hidden / common non-module directories
    if (entry.startsWith(".") || entry === "node_modules" || entry === "__pycache__") continue;
    // Skip if already added as cwd itself
    if (cwdModule && fullPath === cwd) continue;
    const mod = scanModule(fullPath, entry);
    if (mod) modules.push(mod);
  }

  return modules;
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function formatModuleForPrompt(mod: OdooModule): string {
  const lines: string[] = [];
  lines.push(`**${mod.technical_name}** — "${mod.display_name}"${mod.version ? ` (v${mod.version})` : ""}`);
  if (mod.depends.length > 0) lines.push(`- Depends on: ${mod.depends.join(", ")}`);
  if (mod.models.length > 0) lines.push(`- Models defined: ${mod.models.join(", ")}`);
  if (mod.inherits.length > 0) lines.push(`- Models inherited: ${mod.inherits.join(", ")}`);
  if (mod.view_xml_ids.length > 0)
    lines.push(`- View XML IDs: ${mod.view_xml_ids.join(", ")}`);
  return lines.join("\n");
}

function formatModuleForTool(mod: OdooModule): string {
  const lines: string[] = [];
  lines.push(`MODULE: ${mod.technical_name}`);
  lines.push(`  Display name: ${mod.display_name}`);
  lines.push(`  Version: ${mod.version || "(not set)"}`);
  lines.push(`  Depends: ${mod.depends.length > 0 ? mod.depends.join(", ") : "(none)"}`);
  lines.push(
    `  Models (_name): ${mod.models.length > 0 ? mod.models.join(", ") : "(none)"}`,
  );
  lines.push(
    `  Inherits (_inherit): ${mod.inherits.length > 0 ? mod.inherits.join(", ") : "(none)"}`,
  );
  if (mod.view_xml_ids.length > 0) {
    lines.push("  View XML IDs:");
    for (const id of mod.view_xml_ids) {
      lines.push(`    - ${id}`);
    }
  } else {
    lines.push("  View XML IDs: (none)");
  }
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Extension entry point
// ---------------------------------------------------------------------------

export default function odooContextExtension(pi: ExtensionAPI) {
  let modules: OdooModule[] = [];
  let injected = false; // Inject system-prompt context only once per session

  // ── 1. session_start: scan for Odoo modules ──────────────────────────────
  pi.on("session_start", async (_event, ctx) => {
    // Reset state for new / resumed sessions
    modules = [];
    injected = false;

    try {
      modules = discoverModules(ctx.cwd);
    } catch {
      // Never crash — just leave modules empty
      modules = [];
    }

    if (modules.length > 0) {
      for (const mod of modules) {
        const label = mod.version ? `${mod.technical_name} (v${mod.version})` : mod.technical_name;
        ctx.ui.notify(`🐍 Odoo: ${label}`, "info");
      }
    }
  });

  // ── 2. before_agent_start: inject context into system prompt (once) ───────
  pi.on("before_agent_start", async (event) => {
    if (modules.length === 0 || injected) return;
    injected = true;

    const moduleBlocks = modules.map(formatModuleForPrompt).join("\n\n");

    const injection = `

## Odoo Module Context (auto-detected)

You are working in the following Odoo module(s):

${moduleBlocks}

Use these exact technical names, model names, and XML IDs when generating code for this module.
Before generating view inheritances, call the odoo_scan tool to get the full XML ID list.`;

    return {
      systemPrompt: event.systemPrompt + injection,
    };
  });

  // ── 3. odoo_scan tool ────────────────────────────────────────────────────
  pi.registerTool({
    name: "odoo_scan",
    label: "Scan Odoo Modules",
    description:
      "Returns the full structure of Odoo modules in the current directory: module names, versions, dependencies, models defined, models inherited, and view XML IDs. Call before generating code that references model names or XML IDs.",
    parameters: Type.Object({}),

    async execute(_toolCallId, _params, _signal, _onUpdate, _ctx) {
      if (modules.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: "No Odoo modules detected in the current working directory.",
            },
          ],
          details: { modules: [] },
        };
      }

      const text = modules.map(formatModuleForTool).join("\n\n");

      return {
        content: [{ type: "text" as const, text }],
        details: { modules },
      };
    },
  });
}
