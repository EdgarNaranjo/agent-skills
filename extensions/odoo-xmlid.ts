import * as fs from "node:fs";
import * as path from "node:path";
import * as child_process from "node:child_process";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

export default function odooXmlidExtension(pi: ExtensionAPI) {
  pi.registerTool({
    name: "odoo_find_xmlid",
    label: "Find Odoo XML ID",
    description:
      "Search for XML IDs in Odoo source code. Use when you need the exact XML ID to inherit a view, reference a record, or find existing actions and menus. Searches local Odoo installation first, then GitHub. Example queries: 'sale order form', 'res.partner list view', 'stock picking form'",
    parameters: Type.Object({
      query: Type.String({
        description:
          'Search term — e.g. "sale order form view", "res.partner kanban"',
      }),
      version: Type.Optional(
        Type.String({
          description: 'Odoo version — "18" or "19". Defaults to "19"',
        })
      ),
      odoo_module: Type.Optional(
        Type.String({
          description:
            'Limit search to a specific Odoo module — e.g. "sale", "stock", "account"',
        })
      ),
    }),
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      const query: string = params.query;
      const version: string = params.version ?? "19";
      const odooModule: string | undefined = params.odoo_module;

      // ------------------------------------------------------------------ //
      //  STEP 1 — Locate local Odoo source                                  //
      // ------------------------------------------------------------------ //
      onUpdate({ type: "text", text: "🔍 Searching for local Odoo source…" });

      const HOME = process.env.HOME ?? "";
      const candidates = [
        path.join(HOME, "odoo"),
        path.join(HOME, "src", "odoo"),
        path.join(HOME, "Desktop", "odoo"),
        "/opt/odoo",
        path.join(process.cwd(), "..", "odoo"),
        path.join(process.cwd(), "..", "..", "odoo"),
      ];

      function isValidOdooRoot(p: string): boolean {
        return (
          fs.existsSync(path.join(p, "addons", "sale", "__manifest__.py")) ||
          fs.existsSync(path.join(p, "odoo", "__init__.py"))
        );
      }

      const odooRoot = candidates.find(isValidOdooRoot) ?? null;

      // ------------------------------------------------------------------ //
      //  STEP 2 — Local grep                                                 //
      // ------------------------------------------------------------------ //
      if (odooRoot !== null) {
        onUpdate({
          type: "text",
          text: `📂 Found local Odoo source at: ${odooRoot}\n🔎 Grepping for XML IDs…`,
        });

        try {
          // Determine the addons directory
          const addonsDir = fs.existsSync(path.join(odooRoot, "addons"))
            ? path.join(odooRoot, "addons")
            : odooRoot;

          // Scope to a specific module when requested
          const searchDir =
            odooModule && fs.existsSync(path.join(addonsDir, odooModule))
              ? path.join(addonsDir, odooModule)
              : addonsDir;

          // Build a word-based grep pattern from the query
          const words = query
            .trim()
            .toLowerCase()
            .split(/\s+/)
            .filter(Boolean);

          // First find XML files that contain 'id=' and match any query word
          const fileListCmd = `grep -rl 'id="' "${searchDir}" --include="*.xml" 2>/dev/null | head -30`;
          const fileListRaw = child_process
            .execSync(fileListCmd, { timeout: 15_000 })
            .toString()
            .trim();

          if (!fileListRaw) {
            return {
              content: [
                {
                  type: "text",
                  text: `No XML files with id attributes found in ${searchDir}.`,
                },
              ],
              details: { source: "local", odooRoot },
            };
          }

          const allFiles = fileListRaw.split("\n");

          // Filter files whose path contains at least one query word
          const relevantFiles = allFiles.filter((f) =>
            words.some((w) => f.toLowerCase().includes(w))
          );

          const filesToSearch =
            relevantFiles.length > 0 ? relevantFiles : allFiles.slice(0, 10);

          // For each file, extract lines that match the query words
          const results: Record<string, string[]> = {};

          for (const file of filesToSearch.slice(0, 15)) {
            const pattern = words.join("|");
            const grepCmd = `grep -iE 'id="[^"]*('${words
              .map((w) => `'${w}'`)
              .join("|")}')[^"]*"' "${file}" 2>/dev/null || true`;

            // Simpler, shell-safe approach
            const idGrepCmd = `grep -io 'id="[^"]*"' "${file}" 2>/dev/null || true`;
            let raw = "";
            try {
              raw = child_process
                .execSync(idGrepCmd, { timeout: 5_000 })
                .toString()
                .trim();
            } catch {
              continue;
            }

            if (!raw) continue;

            const ids = raw
              .split("\n")
              .map((line) => {
                const m = line.match(/id="([^"]+)"/);
                return m ? m[1] : null;
              })
              .filter((id): id is string => id !== null)
              .filter((id) =>
                words.some((w) => id.toLowerCase().includes(w))
              );

            if (ids.length > 0) {
              // Make the path relative to the addons dir for readability
              const rel = path.relative(addonsDir, file);
              // Derive the module name from the relative path (first segment)
              const mod = rel.split(path.sep)[0] ?? "";
              results[rel] = ids.map((id) =>
                id.includes(".") ? id : `${mod}.${id}`
              );
            }
          }

          if (Object.keys(results).length === 0) {
            return {
              content: [
                {
                  type: "text",
                  text:
                    `Found local Odoo source (v${version}) at ${odooRoot},\n` +
                    `but no XML IDs matching "${query}" were found.\n\n` +
                    `Try a broader query, e.g. just the model name or view type.`,
                },
              ],
              details: { source: "local", odooRoot, query },
            };
          }

          const lines: string[] = [
            `Found in local Odoo source (v${version}):\n`,
          ];
          for (const [file, ids] of Object.entries(results)) {
            lines.push(`${file}:`);
            for (const id of ids.slice(0, 20)) {
              lines.push(`  - ${id}`);
            }
            lines.push("");
          }

          return {
            content: [{ type: "text", text: lines.join("\n") }],
            details: { source: "local", odooRoot, matchedFiles: Object.keys(results) },
          };
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          onUpdate({
            type: "text",
            text: `⚠️ Local search failed (${message}), falling back to GitHub…`,
          });
          // Fall through to GitHub search
        }
      }

      // ------------------------------------------------------------------ //
      //  STEP 3 — GitHub API fallback                                        //
      // ------------------------------------------------------------------ //
      onUpdate({ type: "text", text: "🌐 Querying GitHub code search API…" });

      try {
        const branch = version === "18" ? "18.0" : "19.0";
        const moduleFilter = odooModule ? `+path:addons/${odooModule}` : "";
        const encodedQuery = encodeURIComponent(query);
        const apiUrl = `https://api.github.com/search/code?q=${encodedQuery}+repo:odoo/odoo+extension:xml${moduleFilter}&per_page=10`;
        const manualUrl = `https://github.com/search?q=${encodedQuery}+repo%3Aodoo%2Fodoo+extension%3Axml&type=code`;

        const response = await fetch(apiUrl, {
          headers: {
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "pi-odoo-workflow/1.0",
          },
          signal,
        });

        if (response.status === 403 || response.status === 429) {
          return {
            content: [
              {
                type: "text",
                text:
                  `⚠️ GitHub API rate limit reached.\n\n` +
                  `Search manually here:\n${manualUrl}\n\n` +
                  `Once you find the file, I can fetch its raw content with:\n` +
                  `https://raw.githubusercontent.com/odoo/odoo/${branch}/<file_path>`,
              },
            ],
            details: { source: "github-rate-limited", manualUrl },
          };
        }

        if (!response.ok) {
          return {
            content: [
              {
                type: "text",
                text:
                  `⚠️ GitHub API returned ${response.status}.\n\n` +
                  `Try searching manually:\n${manualUrl}`,
              },
            ],
            details: { source: "github-error", status: response.status },
          };
        }

        const data = (await response.json()) as {
          total_count: number;
          items: Array<{ path: string; html_url: string }>;
        };

        if (!data.items || data.items.length === 0) {
          return {
            content: [
              {
                type: "text",
                text:
                  `No results found on GitHub for "${query}".\n\n` +
                  `Try a different query or search manually:\n${manualUrl}`,
              },
            ],
            details: { source: "github", totalCount: data.total_count },
          };
        }

        const lines: string[] = [
          `Found ${data.total_count} result(s) on GitHub (odoo/odoo, branch ${branch}):\n`,
        ];
        for (const item of data.items) {
          const rawUrl = `https://raw.githubusercontent.com/odoo/odoo/${branch}/${item.path}`;
          lines.push(`📄 ${item.path}`);
          lines.push(`   Raw: ${rawUrl}`);
          lines.push("");
        }
        lines.push(
          `To see the XML IDs in these files, I can fetch them with \`bash\`:\n` +
            `  curl -s "https://raw.githubusercontent.com/odoo/odoo/${branch}/<file_path>" | grep -o 'id="[^"]*"'`
        );

        return {
          content: [{ type: "text", text: lines.join("\n") }],
          details: {
            source: "github",
            branch,
            totalCount: data.total_count,
            files: data.items.map((i) => i.path),
          },
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [
            {
              type: "text",
              text:
                `❌ Search failed: ${message}\n\n` +
                `No local Odoo source was found and the GitHub API is unreachable.\n\n` +
                `Manual search:\nhttps://github.com/search?q=${encodeURIComponent(query)}+repo%3Aodoo%2Fodoo+extension%3Axml&type=code`,
            },
          ],
          details: { source: "error", error: message },
        };
      }
    },
  });
}
