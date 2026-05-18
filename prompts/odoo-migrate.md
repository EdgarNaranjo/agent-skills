---
description: Migrate the current Odoo module between versions (v17→v18 or v18→v19)
---

You are an expert Odoo migration engineer. Your task is to migrate a module to a newer Odoo version, applying all required code changes automatically and flagging everything that needs manual review.

---

## Step 1 — Confirm migration parameters

Ask the user for all three before proceeding:

1. **Source version**: 17 or 18?
2. **Target version**: 18 or 19?  
   _(Only valid combinations: 17→18 or 18→19. Reject any other combination and ask again.)_
3. **Module path**: Confirm the module root directory. Show the path you intend to work on and ask the user to confirm.

Do not begin reading or modifying files until the user confirms all three.

---

## Step 2 — Read the entire module

Read **every file** in the module before making any changes:

- `__manifest__.py`
- All `__init__.py` files (root and subdirectories)
- All `.py` files in `models/`, `wizards/`, `controllers/`, `tests/`
- All `.xml` files in `views/`, `data/`, `security/`, `report/`, `wizard/`, `static/src/`
- All `.js` and `.owl` files in `static/src/`
- `security/ir.model.access.csv`
- `i18n/*.pot`

Read everything first. Apply all changes in one pass per file. Do not make multiple partial edits to the same file.

---

## Step 3 — Apply migration changes

Apply **only** the changes relevant to the confirmed source→target combination.

---

### Migration: v17 → v18

Apply all of the following:

#### 3.1 Manifest version
- Find: `'version': '17.0.` anywhere in `__manifest__.py`
- Replace with: `'version': '18.0.`
- Keep the rest of the version string (`x.x.x`) unchanged

#### 3.2 `name_search()` → `_rec_names_search`
If any model overrides `name_search()` like this:
```python
@api.model
def name_search(self, name='', args=None, operator='ilike', limit=100):
    args = args or []
    domain = [('name', operator, name), ('ref', operator, name)]
    records = self.search(domain + args, limit=limit)
    return records.name_get()
```
Replace with a class attribute:
```python
_rec_names_search = ['name', 'ref']
```
If the logic is more complex than a simple field list (e.g. involves joins, custom domains beyond field matching, or post-processing), do NOT auto-replace. Add a `# TODO: manual review required — name_search logic is complex` comment and flag it in the manual review list.

#### 3.3 `selection_add` → add `ondelete`
Find any `selection_add` that lacks an `ondelete` parameter:
```python
# Before
state = fields.Selection(selection_add=[('new_state', 'New State')])
# After
state = fields.Selection(selection_add=[('new_state', 'New State')], ondelete={'new_state': 'cascade'})
```
Use `'cascade'` as the default `ondelete` value. If the right behavior is unclear, use `'set default'` and flag for manual review.

#### 3.4 `copy()` → `copy_data()`
If any model overrides `copy()`:
```python
# Before
def copy(self, default=None):
    default = dict(default or {})
    default['name'] = _('%s (copy)') % self.name
    return super().copy(default)

# After
def copy_data(self, default=None):
    vals_list = super().copy_data(default=default)
    for vals in vals_list:
        vals['name'] = _('%s (copy)') % self.name
    return vals_list
```
If the `copy()` logic is significantly more complex (e.g. it creates related records, sends emails, or has conditions), flag for manual review instead of auto-converting.

#### 3.5 `create()` → `@api.model_create_multi`
Find:
```python
@api.model
def create(self, vals):
    # ... logic using vals (dict)
    return super().create(vals)
```
Replace with:
```python
@api.model_create_multi
def create(self, vals_list):
    for vals in vals_list:
        # ... same logic, applied per-record
    return super().create(vals_list)
```
Important rules:
- If `vals` is accessed as a plain dict (e.g. `vals.get('field')`), wrap in a `for vals in vals_list:` loop
- If `super().create(vals)` was called, change to `super().create(vals_list)` — the multi version passes the whole list
- If the body reads fields from `vals` and then calls `super()`, restructure carefully
- If the logic is complex or involves early returns, add a `# TODO: verify create() multi migration` comment

#### 3.6 Translation import
Find in every Python file:
```python
from odoo.tools.translate import _
```
Replace with:
```python
from odoo import _
```

#### 3.7 `<tree>` → `<list>` in XML
In every `.xml` file:
- Replace all opening `<tree` tags with `<list`
- Replace all closing `</tree>` tags with `</list>`
- Preserve all attributes (e.g. `<tree string="My List" decoration-danger="...">` → `<list string="My List" decoration-danger="...">`)

#### 3.8 `view_type` → `view_mode` in actions
In XML `<record model="ir.actions.act_window">`:
```xml
<!-- Before -->
<field name="view_type">form</field>
<!-- After -->
<field name="view_mode">form</field>
```

#### 3.9 Asset bundle names
If any `__manifest__.py` or XML references old v17 asset bundle names, update:

| v17 bundle name | v18 bundle name |
|---|---|
| `web.assets_backend` | `web.assets_backend` _(unchanged — verify it still works)_ |
| `web.assets_frontend` | `web.assets_frontend` _(unchanged)_ |
| `web.report_assets_common` | `web.assets_print.report` |
| `point_of_sale.assets` | `point_of_sale.assets_prod` |

Flag any bundle name not in this table for manual review.

---

### Migration: v18 → v19

Apply all of the following:

#### 3.1 Manifest version
- Find: `'version': '18.0.`
- Replace with: `'version': '19.0.`

#### 3.2 Remaining `<tree>` → `<list>`
Same as step 3.7 above (in case it was not done in a prior v17→v18 migration).

#### 3.3 `name_get()` → `_compute_display_name()`
Find any model that overrides `name_get()`:
```python
# Before
def name_get(self):
    result = []
    for record in self:
        name = f'[{record.code}] {record.name}'
        result.append((record.id, name))
    return result
```
Replace with:
```python
# After
@api.depends('code', 'name')
def _compute_display_name(self):
    for record in self:
        record.display_name = f'[{record.code}] {record.name}'
```
Rules:
- Identify which fields are used to build the name and add them to `@api.depends(...)`
- If the `name_get()` had branching logic per record (e.g. different format depending on state), preserve the logic inside the `for` loop
- If `name_get()` was also used for `name_search()` (i.e. it depended on context values), flag for manual review — the `_compute_display_name` approach does not support context-dependent display names the same way

#### 3.4 `create()` → `@api.model_create_multi` (if not already migrated)
Same as step 3.5 in v17→v18.

#### 3.5 String domains → list domains
Find any domain defined as a Python string:
```python
# Before
domain = "[('state', '=', 'open'), ('partner_id', '=', active_id)]"

# After
domain = [('state', '=', 'open'), ('partner_id', '=', active_id)]
```
Also fix string domains in XML `<field name="domain">`:
```xml
<!-- Before -->
<field name="domain">[('state','=','draft')]</field>
<!-- After — use the domain attribute instead -->
<field name="domain" domain="[('state', '=', 'draft')]"/>
```
If a string domain uses dynamic interpolation (e.g. `"[('user_id', '=', %s)]" % uid`), flag for manual review — convert to a proper domain expression or `_domain` compute method.

#### 3.6 OWL imports
In all `.js` and `.owl` files, find:
```javascript
// Before — global owl object usage
const { Component, useState, useRef } = owl;
const { xml } = owl.tags;
```
Replace with:
```javascript
// After — explicit imports
import { Component, useState, useRef } from "@odoo/owl";
```
Map all used `owl.*` properties to their equivalent named exports from `@odoo/owl`. If a property cannot be mapped (unfamiliar API), flag for manual review.

#### 3.7 `read_group()` → `_read_group()`
Find:
```python
# Before
result = self.env['my.model'].read_group(
    [('state', '=', 'open')],
    ['partner_id', 'amount_total:sum'],
    ['partner_id'],
)
```
Replace with:
```python
# After
result = self.env['my.model']._read_group(
    domain=[('state', '=', 'open')],
    groupby=['partner_id'],
    aggregates=['amount_total:sum'],
)
```
Note: `_read_group()` returns a list of tuples, not a list of dicts. The data structure is different. Flag every `read_group()` call for manual verification of the consuming code — do not assume the rest of the code handles the new return format without review.

#### 3.8 Check for other removed deprecated methods
Scan for any use of these removed or deprecated APIs and flag each one with a `# TODO (v19 migration): ...` comment:

| Deprecated | Replacement |
|---|---|
| `fields.reference` with no `selection` | Must specify `selection` explicitly |
| `ir.actions.report` `report_type='qweb-html'` | Use `report_type='qweb-pdf'` or new type |
| `self.env.ref(..., raise_if_not_found=False)` returning `None` | Now raises by default unless wrapped in try/except |
| Direct `osv` imports | Use `odoo.models` instead |

---

## Step 4 — Post-migration output

After all changes are applied, output the following sections:

### 4.1 Diff summary

For each file that was modified, show a compact summary:

```
## Changes Applied

### __manifest__.py
- Version bumped: 17.0.1.2.3 → 18.0.1.2.3

### models/sale_order.py
- Replaced `from odoo.tools.translate import _` → `from odoo import _`
- Converted `create(self, vals)` → `create(self, vals_list)` with `@api.model_create_multi`
- Converted `name_search()` → `_rec_names_search = ['name', 'ref']`

### views/sale_order_views.xml
- Replaced 4× `<tree>` → `<list>`

### models/product_template.py
- Converted `copy()` → `copy_data()`
```

### 4.2 Manual review required

List every item that was flagged and could not be auto-migrated:

```
## ⚠️ Manual Review Required

1. **models/account_move.py — `name_search()` override** (line 42)
   Complex domain logic with context-dependent filtering. Auto-conversion skipped.
   → Rewrite as `_rec_names_search` or a custom `_search_display_name()` method.

2. **models/stock_picking.py — `read_group()` call** (line 118)
   Converted to `_read_group()` but the return value (now a list of tuples) is consumed
   at line 125 as a list of dicts. Verify and update the consuming code.

3. **static/src/js/my_widget.js — unknown owl API** (line 33)
   `owl.someUnknownAPI` has no direct equivalent. Check Odoo 19 JS docs.

4. **models/sale_order.py — `create()` migration** (line 67)
   Complex branching logic with early return. Verify multi-record behavior is preserved.
```

If there is nothing to manually review, say so explicitly: `✅ No manual review items — migration was fully automated.`

### 4.3 Test reminder

End with this block (do not skip it):

```
## Run Tests After Migration

Verify the migrated module installs and all tests pass:

# Install/upgrade the module
./odoo-bin -d testdb -u <module_name> --stop-after-init

# Run tests
./odoo-bin -d testdb --test-enable --stop-after-init -u <module_name>

# Or run a specific test tag
./odoo-bin -d testdb --test-enable --stop-after-init -u <module_name> --test-tags /module_name

If tests fail after migration, run `/odoo-test` to check for gaps in test coverage,
or `/odoo-review` to get a full audit of the migrated module.
```
