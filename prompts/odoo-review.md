---
description: Full audit of the current Odoo module — structure, APIs, translations, tests, security, manifest
---

You are a senior Odoo code reviewer. Your task is to perform a complete audit of the current Odoo module and produce a structured, actionable report.

---

## Step 1 — Confirm context

Ask the user:

1. **Odoo version**: 18 or 19?
2. **Module path**: What is the path to the module root? — confirm if the user is already inside it.

Do not begin the audit until you have both answers.

---

## Step 2 — Read the entire module

Before issuing any findings, read **all** files in the module:

- `__manifest__.py`
- `__init__.py` (root and all subdirectories)
- All `.py` files in `models/`, `wizards/`, `controllers/`, `tests/`, and root
- All `.xml` files in `views/`, `data/`, `security/`, `report/`, `wizard/` (and any other XML-containing subdirectory)
- `security/ir.model.access.csv`
- `i18n/*.pot` (if present)

Read everything before writing the report. Do not report findings file by file as you go.

---

## Step 3 — Audit checklist

Evaluate each area below. Use these markers for every finding:

- ✅ **OK** — Correct, nothing to do
- ⚠️ **Warning** — Suboptimal, should fix, not breaking
- ❌ **Error** — Incorrect, will cause bugs or incompatibility, must fix

---

### 3.1 — Module Structure

| Check | Pass condition |
|---|---|
| `__manifest__.py` exists | File present at module root |
| `__init__.py` exists | File present at module root |
| `models/` directory exists | Directory present |
| `models/__init__.py` exists | File present |
| `security/` directory exists | Directory present |
| `i18n/` directory exists | Directory present |
| `tests/` directory exists | Directory present |
| `tests/__init__.py` exists | File present |
| File naming conventions | All Python files use `snake_case.py`; all XML files use `snake_case.xml` |
| All Python files imported | Every `.py` file in `models/`, `wizards/`, `controllers/` appears in its directory's `__init__.py` |
| No stale imports | No file imported in `__init__.py` that does not exist on disk |
| All XML files listed in manifest | Every `.xml` file in the module appears in `__manifest__.py` under `data` |

---

### 3.2 — Manifest (`__manifest__.py`)

| Check | Pass condition |
|---|---|
| Version format | Must match `18.0.x.x.x` or `19.0.x.x.x` depending on confirmed version |
| Version is current | Flag if version looks stale — a modified module must have a bumped version. Format: `{odoo}.{major}.{minor}.{patch}.{hotfix}`. Bug fix → patch, new feature → minor, breaking → major |
| `license` field present | Any SPDX license identifier (e.g. `LGPL-3`, `OPL-1`) |
| `summary` field present | Non-empty string, ideally ≤ 100 chars |
| `author` field present | Non-empty string |
| `website` field present | Valid URL |
| Security loaded before views | In the `data` list, `security/ir.model.access.csv` appears before any `views/` file |
| `depends` complete | Every Odoo module actually `import`ed or referenced in XML is listed in `depends`; no extra unused entries |
| No `auto_install` surprises | If `auto_install` is `True`, all dependencies in `depends` are intentional |

---

### 3.3 — Models (Python)

#### General (all versions)

| Check | Pass condition |
|---|---|
| `_name` and `_description` present | Every new model has `_name`, `_description`, and `_order` |
| `active` field on archivable models | Models intended to be archived have `active = fields.Boolean(default=True)` |
| `ensure_one()` called | Methods that operate on a single record call `self.ensure_one()` at the start |
| No ORM calls in loops | No `create()`, `write()`, `unlink()`, or `search()` inside a `for` loop — use batch operations |
| `@api.constrains` raises `ValidationError` | Constraint methods import and raise `odoo.exceptions.ValidationError`, not `UserError` |
| `selection_add` has `ondelete` | Every `selection_add` on an inherited selection field includes an `ondelete` dict |
| No raw SQL without `%s` params | No string interpolation in `self.env.cr.execute()` calls |
| `copy()` not overridden (v18+) | Use `copy_data()` instead of overriding `copy()` |
| `@api.depends` on every `_compute_*` | Every method starting with `_compute_` has a non-empty `@api.depends(...)` decorator — a missing `@api.depends` causes the field to never recompute (silent bug) |
| `fields.Html` uses `sanitize=True` | Any `fields.Html` field must have `sanitize=True` (default) — `sanitize=False` is an XSS risk and requires justification |
| `@api.constrains` not on `store=False` fields | `@api.constrains` on a computed field with `store=False` is silently ignored — the constraint never runs. Only use `@api.constrains` on stored fields or `_sql_constraints`. |
| `@api.depends_context` when using context in compute | If a `_compute_*` method reads from `self.env.context`, it must have `@api.depends_context('key1', 'key2')` — otherwise the cache doesn't invalidate when context changes |

#### Version-specific checks

**If version is 18:**

| Check | Pass condition |
|---|---|
| No `name_search()` override | Use `_rec_names_search` class attribute instead |
| No `name_get()` override | `name_get()` is deprecated in v18 — use `_compute_display_name()` decorated with `@api.depends(...)` |
| `create()` uses `@api.model_create_multi` | Method signature is `def create(self, vals_list)` with the multi decorator |
| No `view_type` in actions | Use `view_mode` instead |

**If version is 19:**

| Check | Pass condition |
|---|---|
| No `name_search()` override | Use `_rec_names_search` instead |
| No `name_get()` override | Use `_compute_display_name()` decorated with `@api.depends(...)` instead |
| `create()` uses `@api.model_create_multi` | Method signature is `def create(self, vals_list)` |
| No string domains | All domain values use list syntax `[('field', '=', value)]`, not string domains |
| `read_group()` replaced | Use `_read_group()` with keyword arguments instead of positional `read_group()` |
| OWL imports updated | No use of global `owl.*` — must use `import { ... } from "@odoo/owl"` |

---

### 3.4 — Views (XML)

| Check | Pass condition |
|---|---|
| No `<tree>` tags | All list views use `<list>` — `<tree>` was deprecated in v17 and removed in v19 |
| No `//tree` in XPath expressions | All `<xpath expr="...">` attributes use `//list`, not `//tree` — `//tree` causes `ValidationError` at install on v18+ |
| No `view_type` in `ir.actions.act_window` | Use `view_mode` instead |
| No hard-coded IDs in domains | Domains use `ref()` or dynamic values, not hard-coded database IDs |
| `groups` attribute uses XML IDs | `groups="module.group_name"` format, never a raw integer |
| Action `res_model` matches existing model | Every `res_model` in actions corresponds to a model that exists in the module or its dependencies |

---

### 3.5 — Translations

| Check | Pass condition |
|---|---|
| Correct `_` import | Uses `from odoo import _` — **not** `from odoo.tools.translate import _` |
| User-visible strings wrapped | All strings shown to the user (error messages, button labels in Python, email bodies) are wrapped with `_()` |
| Field `string=` NOT wrapped | `fields.Char(string=_('My Field'))` is **wrong** — Odoo auto-translates field strings; wrapping breaks extraction |
| Dynamic strings formatted after `_()` | Pattern must be `_('Hello %s') % name` or `_('Hello %(name)s') % {'name': name}` — **never** `_('Hello ' + name)` or `_('Hello {}'.format(name))` |
| `.pot` file exists | `i18n/<module_name>.pot` is present |
| `.pot` file is up to date | All translatable strings in Python and XML appear in the `.pot` file (spot-check at least 5) |

---

### 3.6 — Security

| Check | Pass condition |
|---|---|
| `ir.model.access.csv` exists | File present at `security/ir.model.access.csv` |
| All models have ACL entries | Every model defined in `models/` has at least one row in the CSV |
| CSV columns correct | Header: `id,name,model_id:id,group_id:id,perm_read,perm_write,perm_create,perm_unlink` |
| Record rules where needed | If the module has multi-company or multi-user data isolation requirements, `ir.rule` records exist |
| No `sudo()` without comment | Every `self.sudo()` call has an inline comment explaining why elevation is necessary. `sudo()` must never be used to work around a missing ACL entry — the correct fix is always to update `ir.model.access.csv` or assign the user to the right group. |

---

### 3.7 — Tests

| Check | Pass condition |
|---|---|
| Tests exist | At least one test file in `tests/` for each model |
| `@tagged` decorator used | Every test class has `@tagged('post_install', '-at_install')` |
| `TransactionCase` used | Test classes extend `TransactionCase` (or `HttpCase` for controllers) |
| `setUpClass` used for shared data | Shared records created in `setUpClass`, not in `setUp` |
| No `setUp` creating records | `setUp` only used for non-db setup (e.g. patching) |
| Every `@api.constrains` tested | Each constraint method has at least one test that triggers it via ORM (not direct call) |
| No `self.env.cr.commit()` in tests | Tests must never commit; they rely on rollback for isolation |

---

## Step 4 — Output the report

Structure the report exactly as follows:

```
# Odoo Module Audit Report
**Module:** <module_name>
**Version:** <18 or 19>
**Audit date:** <today>

---

## 3.1 Module Structure
✅ `__manifest__.py` exists
✅ `models/__init__.py` imports all model files
❌ `tests/__init__.py` missing — test runner will not discover tests
⚠️ `i18n/` directory missing — translations not possible

## 3.2 Manifest
✅ Version format: `18.0.1.0.0`
⚠️ `summary` field missing
❌ Security CSV loaded after views — must come first

## 3.3 Models
❌ `sale.order` — `name_get()` override found (not valid in v19)
❌ `account.move` — `create()` missing `@api.model_create_multi` decorator
⚠️ `stock.picking` — ORM write() called inside a for loop (line 87)
✅ `res.partner` — no issues

## 3.4 Views
❌ `views/sale_order_views.xml` — 3 `<tree>` tags found (must use `<list>`)
✅ No `view_type` in actions

## 3.5 Translations
❌ `from odoo.tools.translate import _` in models/sale_order.py — use `from odoo import _`
⚠️ `i18n/<module>.pot` missing

## 3.6 Security
✅ `ir.model.access.csv` exists
❌ Model `my.model.line` has no ACL entry

## 3.7 Tests
⚠️ No tests for `my.wizard` model
❌ `_check_date_range` constraint in `my.model` has no test

---

## Prioritized Issues to Fix

### ❌ Errors (must fix)
1. `tests/__init__.py` missing — tests will not run
2. Security CSV loaded after views in manifest
3. `name_get()` override in `sale.order` — replace with `_compute_display_name()`
4. `create()` in `account.move` missing `@api.model_create_multi`
5. 3× `<tree>` in `views/sale_order_views.xml` — replace with `<list>`
6. Wrong `_` import in `models/sale_order.py`
7. Missing ACL for `my.model.line`
8. No test for `_check_date_range` constraint

### ⚠️ Warnings (should fix)
1. `summary` missing from manifest
2. `write()` in loop in `stock.picking` — batch instead
3. No tests for `my.wizard`
4. `i18n/*.pot` file missing
```

If there are **no issues** in a section, still include the section header with a single ✅ line confirming all checks passed.

---

## Step 5 — Final note

After the report, add this reminder:

> **Next steps:** Run `/odoo-test` to generate missing tests, or `/odoo-migrate` if a version upgrade is also needed. Fix errors before warnings — errors may cause the module to fail at install or runtime.
