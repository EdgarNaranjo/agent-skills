---
name: workflow-odoo
description: "Use when developing, reviewing, debugging or migrating Odoo 18 or 19 modules. Use before writing any model, view, wizard, report, controller, cron or OWL component."
---

# workflow-odoo

Automatic behaviors for Odoo 18/19 module development. These activate without being asked.

**Language:** Always respond in the same language the user writes in. If the user writes in Spanish, respond in Spanish. If in English, respond in English. If the user has not written anything yet, wait — do not generate any response until the user sends their first message.

---

## Default Behaviors

1. **Confirm Odoo version on first interaction.**
   When the user sends their first message, if the target version (18 or 19) is not already known, ask before writing any code. Do NOT ask proactively before the user writes anything. Store the answer and never ask again in the same session.
   Note to individual prompts: if the Odoo version was already established by the skill in this session, do not ask again. Use the stored version directly.

2. **Confirm UI language on first interaction.**
   On the first message, also ask: "What language should user-visible labels be in? (e.g. English, Spanish, French — default: English)"
   Store the answer and never ask again in the same session.

   Apply consistently:
   - **Always English:** field technical names, method names, variable names, XML IDs, code comments, `_description`, `_name`, file names.
   - **User's chosen language:** `string=` attributes, `help=` texts, menu item labels, button labels, report titles, wizard titles, selection values shown to users.

   If no language is specified, default to English for everything.

3. **Check module structure before changes.**
   Before touching any file, scan the module layout: `__manifest__.py`, `models/__init__.py`, `views/`, `security/`, `i18n/`, `tests/`. Note what exists and what is missing.

4. **Explain the approach before writing code.**
   State in one short paragraph: what you are about to do, why, and what alternatives exist. If a better pattern is available for the detected Odoo version, say so explicitly and let the user choose.

5. **Write unit tests for every new method or feature.**
   Place tests in `tests/test_<model>.py`. Use `@tagged('post_install', '-at_install')` unless the feature is install-time only. Use `setUpClass()` for shared fixtures, `setUp()` only for per-test state. Assert specific values, not just "no exception raised".

6. **Update existing tests when modifying existing code.**
   If a change alters behavior, method signature, or field names, find and update all affected test cases in the same response. Never leave tests in a broken state.

7. **Check translations after every UI-facing change.**
   Every string shown to users must be wrapped in `_()`. Import with `from odoo import _`. After adding or changing translatable strings, note that `.pot`/`.po` files should be regenerated with `i18n/` updated.

8. **Verify structure after changes.**
   After writing or editing files, confirm: the file is listed in `__manifest__.py` (`data`, `demo`, or `assets` as appropriate), `__init__.py` imports are correct, and security records exist for new models.

9. **Bump the module version in `__manifest__.py` on every change.**
   Every time a module is modified, increment the version following Odoo's format `{odoo}.{major}.{minor}.{patch}.{hotfix}`:
   - Bug fix / small correction → bump `patch` (e.g. `19.0.1.0.0` → `19.0.1.1.0`)
   - New feature / new field or view → bump `minor` (e.g. `19.0.1.0.0` → `19.0.2.0.0`)
   - Breaking change / data migration needed → bump `major` (e.g. `19.0.1.0.0` → `19.0.2.0.0` with migration script)
   Always show the old and new version in your response. Never leave a modified module at the same version.
   **Exception:** After running `/odoo-migrate`, the Odoo version prefix change (`18.0.x` → `19.0.x`) counts as the version bump for that operation. Do not apply an additional patch/minor increment on top of a migrate run.

10. **Apply version-correct patterns automatically.**
   Use the detected version to select the right API. Do not mix v16 patterns into v18/v19 code. When unsure, flag it and show both options.

---

## Gentle AI Behaviors

1. **Assess workload risk before generating large output.**
   Before writing any code, estimate the scope and assign a risk level:

   | Risk | Triggers | Action |
   |------|----------|--------|
   | 🟢 Low | ≤2 files, ≤80 lines, single area | Proceed directly |
   | 🟡 Medium | 3–5 files OR 80–200 lines OR 2 areas (e.g. model + view) | State scope, ask: "¿Procedo con todo o prefieres empezar por alguna parte?" |
   | 🔴 High | 6+ files OR 200+ lines OR 3+ areas (model + view + security + tests) | Pause. List what will change, flag the risk, recommend splitting into smaller steps |

   Areas counted separately: `models/`, `views/`, `security/`, `tests/`, `wizards/`, `reports/`, `controllers/`.

   **Exception — slash commands designed to be multi-area:** `/odoo-module`, `/odoo-model`, `/odoo-wizard`, `/odoo-report`, `/odoo-cron` intentionally touch multiple areas by design. Do NOT apply workload warning for these — their multi-file output is expected and normal. Apply workload assessment only for free-form requests ("add this feature", "change this behavior") not triggered by a specific slash command.

2. **Ask instead of assume when context is missing.**
   If a model, field, XML ID, or file does not exist in the detected module, ask before inventing it. Example: "No encuentro el modelo `X` en este módulo. ¿Es una herencia o lo creo nuevo?"

3. **Remind the user they are in control.**
   After a heavy response (3+ files generated or a complex explanation), append a one-liner: "Puedes decirme 'hazlo diferente', 'solo el modelo' o 'explícame primero' en cualquier momento."

4. **Never interrupt the current task for unrelated issues.**
   If a problem is spotted in code that was NOT part of this task, mention it at the END of the response as a brief note — do not stop or redirect the current task.

---

## Session Memory (optional)

At the start of the first interaction, offer session tracking once:

> "¿Quieres que cree un archivo `ODOO_SESSION.md` en tu módulo para rastrear las decisiones técnicas, archivos modificados y riesgos identificados durante esta sesión? (Es un archivo de texto local en tu repositorio — no se envía a ningún lado.) sí / no"

- If the user says **yes** → create or read `ODOO_SESSION.md` in the module root and keep it updated throughout the session.
- If the user says **no** → never mention it again.
- Do NOT ask again in the same session regardless of the answer.

When active, update `ODOO_SESSION.md` after each significant action:

```markdown
# ODOO_SESSION.md

## Session info
- Date: <today>
- Odoo version: <18 or 19>
- Module: <module name>

## Decisions
- <decision taken and why>

## Changes applied
- <file>: <what changed>

## Pending risks
- <risk or open question>
```

---

## References

- [quick-reference.md](quick-reference.md) — model skeleton, view snippets, manifest format, common mistakes
- [module-structure.md](module-structure.md) — canonical directory layout and checklist

- [module-structure.md](module-structure.md) — canonical directory layout and checklist
- [v18-changes.md](v18-changes.md) — API changes introduced in Odoo 18
- [v19-changes.md](v19-changes.md) — API changes introduced in Odoo 19
- [db-migrations.md](db-migrations.md) — migration scripts (`migrations/` folder): field rename, type change, XML ID rename, openupgradelib helpers
- [testing-patterns.md](testing-patterns.md) — test class setup, tagged tests, common assertions
- [translations.md](translations.md) — `_()` usage, `.pot` generation, i18n folder conventions
- [owl-patterns.md](owl-patterns.md) — `patch()`, custom field widgets, services, asset declaration
