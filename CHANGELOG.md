# Changelog

All notable changes to `pi-odoo-workflow` are documented here.

Format: [Semantic Versioning](https://semver.org) — `MAJOR.MINOR.PATCH`

---

## [1.4.1] — 2026-05-25

### Fixed
- `CHANGELOG.md` added to npm `files` — was missing from published package, causing broken jsdelivr link
- Added `pi.changelog` field in `package.json` pointing directly to GitHub instead of jsdelivr CDN

---

## [1.4.0] — 2026-05-25

### Changed
- **Skill renamed** from `workflow-odoo19` to `workflow-odoo` — covers both v18 and v19, the `19` suffix was misleading
- Folder moved from `skills/workflow-odoo19/` to `skills/workflow-odoo/`
- Updated install commands, README references, and CI/CD workflow accordingly

### Added
- **Workload risk assessment** (Harness #18) in `workflow-odoo` skill:
  - 3-level risk table: 🟢 Low / 🟡 Medium / 🟥 High based on file count, line count, and areas touched
  - Areas counted separately: `models/`, `views/`, `security/`, `tests/`, `wizards/`, `reports/`, `controllers/`
  - At 🟥 High risk: pauses, lists what will change, recommends splitting
- **Evidence gate in `/odoo-qa`** (Harness #12):
  - New Step 5 — asks for test command and output before issuing verdict
  - New verdict: `🕐 PENDING` — code looks good but no test evidence provided
  - `✅ APPROVED` now requires confirmed passing tests, not just static review
- **Session memory** (Harness #10) — opt-in `ODOO_SESSION.md`:
  - Offered once at session start; never asked again if declined
  - Tracks: Odoo version, decisions taken, files changed, pending risks
- **`/odoo-plan` prompt** (Harness #6) — structured planning for large features:
  - 5 phases: Explore → Propose → Spec → Design → Tasks
  - Each phase requires user confirmation before proceeding
  - Any phase can be skipped with "saltamos esta fase"
  - Saves plan to `docs/ODOO_PLAN_<feature>.md` and hands off to existing prompts
  - Registered in README command table
- **UI language confirmation** on first interaction:
  - Asks once: what language for user-visible labels? (default: English)
  - Code structure, technical names, comments → always English
  - `string=`, `help=`, menu labels, button labels → user’s chosen language

---

## [1.2.0] — 2026-05-25

### Added
- **Gentle AI behaviors** in `workflow-odoo19` skill:
  - Confirms scope before generating large amounts of code
  - Asks instead of assuming when models/fields/XML IDs are not found
  - Reminds user they can redirect Claude at any time
  - Does not interrupt current task to fix unrelated issues
- **CI/CD GitHub Actions** (`.github/workflows/validate.yml`):
  - Validates `package.json` structure on every push
  - Validates `SKILL.md` frontmatter
  - Validates all internal file references exist
  - Validates all prompt templates have descriptions
  - Validates TypeScript extensions have correct structure

---

## [1.1.6] — 2026-05-24

### Fixed
- Removed `assets/` from npm package (image served from GitHub raw URL)
- Package size reduced from 930KB to 54KB

---

## [1.1.5] — 2026-05-23

### Added
- Preview image for pi.dev gallery

---

## [1.1.4] — 2026-05-23

### Fixed
- Respond in Spanish when user writes in Spanish
- Wait for first user message before responding (do not auto-generate on skill load)

---

## [1.1.3] — 2026-05-22

### Fixed
- Do not ask Odoo version proactively before user writes anything

---

## [1.1.2] — 2026-05-22

### Fixed
- Never respond in French; default to user's language

---

## [1.1.1] — 2026-05-21

### Fixed
- Correct install commands in README (`agent-skills` not `pi-odoo-workflow`)

---

## [1.1.0] — 2026-05-21

### Added
- Default behavior: bump `__manifest__.py` version on every module change
  - Bug fix → patch, new feature → minor, breaking change → major

---

## [1.0.1] — 2026-05-20

### Fixed
- Minor corrections

---

## [1.0.0] — 2026-05-19

### Added
- Initial release
- Skill `workflow-odoo19` with 9 automatic behaviors and 6 reference guides
- 10 prompt templates: `/odoo-module`, `/odoo-model`, `/odoo-wizard`, `/odoo-report`, `/odoo-inherit`, `/odoo-cron`, `/odoo-test`, `/odoo-review`, `/odoo-migrate`, `/odoo-debug`
- Extension `odoo-context.ts`: auto-detects Odoo modules, injects context into system prompt
- Extension `odoo-xmlid.ts`: finds XML IDs in local Odoo source or GitHub
- Reference guides: module structure, v18/v19 migration, testing, translations, OWL patterns
