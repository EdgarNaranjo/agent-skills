# pi-odoo-workflow

> Odoo 18/19 development workflow for [pi coding agent](https://pi.dev) — eliminates repetitive instructions, enforces quality automatically, and adds `/slash` commands for common tasks.

## What it does

### 🧠 Skill: `workflow-odoo19`

Loaded automatically when working on Odoo code. Claude will — without being asked:

- **Ask for version once** (18 or 19) and remember it for the session
- **Check module structure** before and after every change
- **Write tests** for every new method or feature
- **Update tests** when modifying existing code
- **Check translations** — all user-visible strings use `_()`
- **Explain decisions** before writing code, naming alternatives
- **Suggest better patterns** when they exist

Reference guides included:
| File | Content |
|------|---------|
| `module-structure.md` | OCA-compatible directory layout, naming conventions |
| `v18-changes.md` | v17 → v18 breaking changes with before/after code |
| `v19-changes.md` | v18 → v19 breaking changes with before/after code |
| `testing-patterns.md` | `@tagged`, `setUpClass`, wizard tests, exception tests |
| `translations.md` | `_()` usage, `.pot` generation, common mistakes |
| `owl-patterns.md` | `patch()`, custom field widgets, services, asset declaration |

### ⚡ Prompt Templates

Type `/command` in pi to expand into full instructions:

| Command | What it generates |
|---------|------------------|
| `/odoo-module <name>` | Complete module scaffold: dirs, manifest, `__init__.py`, security CSV, i18n, tests |
| `/odoo-model <model.name>` | Full model: Python + form/list views + security + tests + manifest update |
| `/odoo-wizard <name>` | TransientModel wizard: Python + dialog view + trigger button + tests |
| `/odoo-report <name>` | QWeb PDF report: action + template + paper format + Print menu binding |
| `/odoo-inherit <view_xml_id>` | View inheritance with correct XPath for 8 change types |
| `/odoo-cron <name>` | Scheduled action: Python method + ir.cron XML + manifest update |
| `/odoo-test` | Scans existing code and generates/updates tests for uncovered methods |
| `/odoo-review` | Full audit: structure, APIs, translations, tests, security — with ✅/⚠️/❌ |
| `/odoo-migrate` | Migrates module between versions (v17→v18 or v18→v19) |
| `/odoo-qa` | QA tester — validates implementation against spec, generates functional summary and APPROVED/REJECTED verdict |

## Install

```bash
# Con npx (recomendado — compatible con pi y Claude Code)
npx skills add EdgarNaranjo/agent-skills@workflow-odoo19 -g -y

# Con pi desde npm
pi install npm:pi-odoo-workflow

# Con pi desde GitHub
pi install git:github.com/EdgarNaranjo/agent-skills

# Probar sin instalar
pi -e git:github.com/EdgarNaranjo/agent-skills@workflow-odoo19
```

## What makes this different

Every other Odoo skill for AI agents is a **reference** — it tells Claude how Odoo works. This skill tells Claude **how to behave**: what to do automatically, what to check, what to generate, and why.

The prompt templates are unique — no other Odoo skill package has `/slash` commands.

## Compatible with

- [pi coding agent](https://pi.dev)
- Claude Code (`npx skills add`)
- Odoo 18 and 19

## Works well alongside

- [`unclecatvn/agent-skills@odoo-19.0`](https://github.com/unclecatvn/agent-skills) — deep API reference for Odoo 19
- [`alessandrorlm/agent-skills@odoo-17.0`](https://github.com/alessandrorlm/agent-skills) — reference for v17 patterns

## License

LGPL-3.0-or-later — same license as Odoo Community modules.

## Extensions (auto-loaded)

Two TypeScript extensions that run automatically — no commands needed:

### 🐍 Odoo Context Injector (`odoo-context.ts`)

When you open pi in a directory containing Odoo modules, it:
1. Detects all `__manifest__.py` files
2. Extracts module name, version, dependencies, models, inherited models, and view XML IDs
3. Notifies you: *"🐍 Odoo: my_module (v19.0.1.0.0)"*
4. Injects that context into Claude's system prompt automatically

Claude then knows exactly which models exist, which views can be inherited, and which XML IDs are available — without you having to explain anything.

Tool available to Claude: **`odoo_scan`** — returns the full module structure on demand.

### 🔍 Odoo XML-ID Finder (`odoo-xmlid.ts`)

Tool available to Claude: **`odoo_find_xmlid`** — finds the exact XML ID for any view, action, or record.

Searches in order:
1. **Local Odoo source** (if found at `~/odoo`, `~/src/odoo`, etc.) — instant grep
2. **GitHub API** (`odoo/odoo` repository) — fallback with direct raw file links

---

## Links

- **npm**: [pi-odoo-workflow](https://www.npmjs.com/package/pi-odoo-workflow)
- **GitHub**: [EdgarNaranjo/agent-skills](https://github.com/EdgarNaranjo/agent-skills)
- **pi.dev**: [pi-odoo-workflow](https://pi.dev/packages/pi-odoo-workflow)
- **Changelog**: [CHANGELOG.md](CHANGELOG.md)
