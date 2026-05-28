# Changelog

All notable changes to `pi-odoo-workflow` are documented here.

Format: [Semantic Versioning](https://semver.org) — `MAJOR.MINOR.PATCH`

---

## [1.12.1] — 2026-05-28

### Fixed
- README: add preview image
- README: remove deleted `@workflow-odoo` branch from `pi -e` and `npx skills add` install commands

---

## [1.12.0] — 2026-05-28

### Added — Nuevos prompts + fixes finales para alcanzar 9.6/10

**2 nuevos prompts:**
- **`/odoo-controller`** — controladores HTTP con `@route`: backend (auth=user), portal (auth=public, website=True), JSON-RPC (type=json), API externa (auth=none, csrf=False). Security checklist de 8 puntos + tests con `HttpCase`
- **`/odoo-owl`** — componentes OWL 2: field widget (standardFieldProps, modo edición/readonly), standalone component, service (registry factory). Asset declaration, patrones RPC, OWL 2 checklist de 12 items, tour test opcional

### Fixed
- `odoo-review.md`: `@api.constrains` en `store=False` — silenciosamente ignorado (bug clásico)
- `odoo-review.md`: `@api.depends_context` faltante cuando compute usa `self.env.context`
- `odoo-debug.md`: `OperationalError: could not serialize access due to concurrent update` — `with_lock()` y retry con backoff
- `odoo-test.md`: tests para scripts de migración — patrón de test de estado final
- `README.md`: `/odoo-review` y `/odoo-qa` diferenciados: pre-commit audit vs post-spec validation
- `README.md`: sección FAQ con 5 preguntas frecuentes
- `README.md`: 15 prompts documentados en tabla (antes 11)

---

## [1.11.0] — 2026-05-28

### Added — Gaps de cobertura para alcanzar 9.3/10

- `odoo-model.md`: `@api.depends` compute field stub + `@api.onchange` handler en template
- `odoo-model.md`: siempre genera search view; genera kanban view si se pide (nueva pregunta #6)
- `odoo-model.md`: `view_mode` actualizado a `list,form,search`
- `odoo-module.md`: pregunta #4 sobre security groups; genera `security/groups.xml` con user + manager
- `testing-patterns.md`: sección "Modern Assertion Helpers" — `assertRecordValues`, `odoo.tests.Form`, `with_user()`, `mock.patch`
- `odoo-test.md`: bloque "Recommended helpers"
- `odoo-module.md`: smoke test real `test_module_installed` (reemplaza `assertTrue(True)`)
- `v18-changes.md`: `_compute_display_name()` documentado como preparación opcional para v19
- `v19-changes.md`: PostgreSQL corregido de `15+` a `14+`
- `odoo-plan.md`: `argument-hint` en frontmatter
- `SKILL.md`: prompts individuales no repiten la pregunta de versión si ya fue establecida en la sesión

---

## [1.10.0] — 2026-05-28

### Fixed — 16 issues from final multi-role evaluation

**CRITICAL:**
- `odoo-wizard.md`: `</div>` huérfano + clase `oe_stat_button` incorrecta en Option A → XML inválido
- `db-migrations.md`: `CREATE INDEX CONCURRENTLY` dentro de transacción → error de PostgreSQL
- `odoo-model.md`: `assertRaises(Exception)` → `assertRaises(ValidationError)`
- `odoo-qa.md`: `name_get()` marcado "v19 only" → alineado a "deprecated in v18, removed in v19"

**HIGH:**
- `odoo-wizard.md`: `binding_model_id ref="base.model_*"` → patrón correcto `<module>.model_*` con ejemplos
- `odoo-cron.md`: Step 6 duplicado → renombrado a Step 7
- `odoo-model.md`: `_rec_names_search` mislabeled como "Display name override"
- `odoo-review.md`: `<tree>` deprecated desde v17, no v18
- `odoo-review.md`: checks añadidos: `_name`/`_description`/`_order`, `active`, `fields.Html sanitize`
- `odoo-debug.md`: `ProgrammingError: column does not exist` añadido a Category 5

**MEDIUM:** `$ARGUMENTS` → `$1` unificado; `## Quickstart` en README; Task 0 condicional en plan; CONDITIONAL criteria en qa

---

## [1.9.0] — 2026-05-28

### Fixed — 22 issues from multi-role testing (developer + QA tester + end-user)

**HIGH:**
- `odoo-plan.md`: Task 0 `/odoo-module` en Phase 5 + git commit en hand-off + link spec para qa
- `README.md`: `/odoo-debug` faltaba en tabla de prompts
- `README.md`: `pi -e` sin explicar
- `odoo-debug.md`: regla para nested exceptions (clasificar por el más interno)
- `odoo-debug.md`: `res.partner` vs `res.users.partner_id` — confusión más común en Odoo
- `db-migrations.md`: rename model ahora cubre `ir.model.data`, `ir.model.access.csv`, `ir.rule`
- `odoo-review.md`: `name_get()` también deprecado en v18
- `odoo-qa.md`: evidence gate — tests pasando con spec incompleta no desbloquea APPROVED

**MEDIUM:** `/odoo-qa` busca spec en `docs/ODOO_PLAN_*.md`; workload 🔴 exento para prompts scaffold; `ODOO_SESSION.md` clarificado; cron reproducible manualmente; decision guide pre+post; "What works where" movida al inicio; `@api.model_create_multi` stub; XPath `//tree` en review; boundaries compuestas en test

**LOW:** version bump exception post-migrate; `CREATE INDEX CONCURRENTLY` pattern; migrations/ en scaffold

---

## [1.8.0] — 2026-05-28

### Fixed — 15 MEDIUM/LOW issues from automated test suite

- `odoo-inherit.md`: `odoo_find_xmlid` verification + version bump in Step 6
- `odoo-report.md`: test scaffolding + adapter comment in QWeb template
- `odoo-cron.md`: thin-wrapper pattern + test scaffolding with 3 test methods
- `odoo-plan.md`: Phase 1 user roles + Phase 4 Migration/Test strategy + filename derivation
- `odoo-wizard.md`: upstream inheritance check + `binding_model_id` ref pattern documented
- `odoo-review.md`: `sudo()` aligned — must not be used to work around missing ACL
- `odoo-qa.md`: widget–field compatibility check in Views section
- `odoo-db-migrate.md`: Rule 4 — "Prefer ORM" instead of absolute "only ORM"

---

## [1.7.0] — 2026-05-28

### Fixed — 34 issues from automated test suite (CRITICAL + HIGH + MEDIUM)

**CRITICAL (install-breaking):**
- `odoo-report.md`: `report.paper.format` → `report.paperformat`
- `odoo-wizard.md`: Typo `%(< xml_id_prefix>` → `%(<xml_id_prefix>`

**HIGH:**
- `odoo-migrate.md`: `eval()` not removed after domain conversion; OWL lifecycle hooks not migrated to OWL 2
- `odoo-inherit.md`: `tree` removed from naming hint; Section 4I (list XPath) added
- `odoo-review.md`: `@api.depends` check for all `_compute_*` fields
- `odoo-test.md`: branch coverage for `_compute_*`; empty-result test for `search()`
- `odoo-qa.md`: no-tests verdict — REJECTED, not PENDING
- `odoo-debug.md`: `sudo()` reframed as diagnostic tool; SQL query for `ir.model.access` added
- `odoo-module.md`: real test file generated (not just empty placeholder)
- `odoo-model.md`: read-first instruction + version bump when adding a model
- `odoo-db-migrate.md`: `Char → Many2one` example added; classification table fixed

**MEDIUM:** XPath `//tree` review check, CONDITIONAL in QA evidence gate, field-level access in debug, db-migrations.md `pass` → `_logger.warning`

---

## [1.6.0] — 2026-05-28

### Added
- New reference guide `db-migrations.md` — module-level DB migration scripts, openupgradelib patterns, pre/post decision guide, common mistakes
- New prompt `/odoo-db-migrate` — generates `pre/post-migration.py` from plain-language description
- `/odoo-migrate` links to `/odoo-db-migrate` at end of process
- `SKILL.md` references `db-migrations.md`
- README: `/odoo-db-migrate` added (12 → 13 prompts)

---

## [1.5.0] — 2026-05-28

### Fixed — migration prompt improvements (v18→v19)
- `odoo-migrate.md`: XPath `//tree` → `//list` in inherited views (install-breaking gap)
- `odoo-migrate.md`: `_compute_display_name` `@api.depends` enforcement + `display_name` conflict check
- `odoo-migrate.md`: `_read_group()` consuming code patterns (tuples vs dicts)
- `odoo-migrate.md`: Python 3.12 compat — Step 3.9 (`datetime.utcnow()`, removed stdlib)
- `odoo-migrate.md`: `ir.rule` `domain_force` clarification; `view_mode=tree,form` → `list,form`
- `v19-changes.md`, `quick-reference.md`: all above reflected

### Changed
- README: "What works where" table (pi vs Claude Code); install section split; extensions marked pi-only

---

## [1.4.1] — 2026-05-25

### Fixed
- `CHANGELOG.md` added to npm `files`
- `pi.changelog` field in `package.json` pointing to GitHub

---

## [1.4.0] — 2026-05-25

### Changed
- Skill renamed from `workflow-odoo19` to `workflow-odoo` (covers v18 and v19)

### Added
- Workload risk assessment (🟢/🟡/🔴)
- Evidence gate in `/odoo-qa` with `🕐 PENDING` verdict
- Session memory — opt-in `ODOO_SESSION.md`
- `/odoo-plan` prompt — 5-phase structured planning
- UI language confirmation on first interaction

---

## [1.2.0] — 2026-05-25

### Added
- Gentle AI behaviors (scope confirmation, ask-instead-of-assume, don't interrupt)
- CI/CD GitHub Actions (`.github/workflows/validate.yml`)

---

## [1.1.6] — 2026-05-24

### Fixed
- Removed `assets/` from npm package — size 930KB → 54KB

---

## [1.1.5] — 2026-05-23

### Added
- Preview image for pi.dev gallery

---

## [1.1.4] — 2026-05-23

### Fixed
- Respond in Spanish when user writes in Spanish
- Wait for first user message before responding

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
- Correct install commands in README

---

## [1.1.0] — 2026-05-21

### Added
- Default behavior: bump `__manifest__.py` version on every module change

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
