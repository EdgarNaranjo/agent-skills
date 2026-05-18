---
description: Diagnose and fix Odoo errors — paste any traceback, error message, or unexpected behavior
argument-hint: "[error message or traceback]"
---

# Odoo Error Diagnosis

Error to diagnose: **$@**

_(If no error was provided above, please paste the full error message or traceback now.)_

---

## Your Task

You are an Odoo expert. Analyse the error provided and follow this exact process:

### 1 — Identify the Error Category

Match the error against the table below and state the category explicitly before doing anything else.

| # | Category | Signature patterns |
|---|----------|--------------------|
| 1 | **Access / Permission** | `AccessError: You don't have access`, `You are not allowed to modify` |
| 2 | **XML ID / External ID** | `ValueError: External ID not found`, `MissingError: No record found for` |
| 3 | **View Architecture** | `View arch validation error`, `Element … is not allowed here`, `Invalid field name` |
| 4 | **Asset / JavaScript** | `Asset bundle … CSS/JS compilation failed`, `Cannot find module '@web/…'`, `Template … not found` |
| 5 | **Database / ORM Constraints** | `psycopg2.errors.UniqueViolation`, `IntegrityError: NOT NULL constraint`, `ForeignKeyViolation` |
| 6 | **Python / ORM Code** | `AttributeError: '…' object has no attribute`, `KeyError: ir.model.access`, `TypeError` |
| 7 | **Cron / Scheduled Actions** | `OperationalError: server closed the connection`, cron silently not running |
| 8 | **Translation / i18n** | `Missing translation for`, untranslated strings appearing in the UI |

If the error does not clearly match any category, skip to **Section 5** at the bottom.

---

### 2 — Category-Specific Diagnosis

Provide the following for the matched category:

#### Category 1 — Access / Permission Errors

**Why this happens in Odoo:**
Odoo's security layer has three levels that are evaluated in order: model-level access (`ir.model.access`), record rules (`ir.rule`), and field-level access. A failure at any level raises `AccessError`. Common causes are missing CSV entries, a record rule whose domain excludes the current user, or a method that needs `sudo()` but does not use it.

**Primary fix — check `ir.model.access.csv`:**
```csv
id,name,model_id:id,group_id:id,perm_read,perm_write,perm_create,perm_unlink
access_my_model_user,my.model user,model_my_model,base.group_user,1,1,1,0
```
Make sure the file is listed in `__manifest__.py` under `'data'`.

**Primary fix — check record rules (`ir.rule`):**
```xml
<record id="my_model_rule_own" model="ir.rule">
    <field name="name">My Model: own records</field>
    <field name="model_id" ref="model_my_model"/>
    <field name="domain_force">[('user_id', '=', user.id)]</field>
    <field name="groups" eval="[(4, ref('base.group_user'))]"/>
</record>
```

**Primary fix — use `sudo()` when bypassing security intentionally:**
```python
# Read a record as super-user (bypass access checks)
record = self.env['my.model'].sudo().browse(record_id)
```

**Other possible causes:**
- The user's group (`res.groups`) was not assigned model access.
- A `_check_access_rights` override in the model rejects the operation.
- The action/button was called from a context where `uid` is the public user.

**Debug command:**
```bash
./odoo-bin -d mydb --log-level=debug 2>&1 | grep -i "access\|rule"
```

---

#### Category 2 — XML ID / External ID Errors

**Why this happens in Odoo:**
Every `<record id="…">` creates a row in `ir.model.data` mapping `module.xml_id` to a database ID. When Odoo cannot find that mapping it raises `ValueError` or `MissingError`. The most frequent cause is a typo in the XML ID or referencing an ID from a module that is not installed.

**Primary fix — verify the exact XML ID:**
Use the `odoo_find_xmlid` tool (if available) or:
```bash
grep -r 'id="my_xml_id"' addons/ --include="*.xml"
```
Also check via the Odoo shell:
```python
env.ref('module.xml_id')          # raises if not found
env.ref('module.xml_id', raise_if_not_found=False)  # returns None if missing
```

**Primary fix — wrong module prefix:**
The prefix must match the technical module name in `__manifest__.py`, not the display name.
```xml
<!-- ✗ Wrong -->
<field name="inherit_id" ref="Sale.view_order_form"/>
<!-- ✓ Correct -->
<field name="inherit_id" ref="sale.view_order_form"/>
```

**Other possible causes:**
- The record was deleted and its data file has `noupdate="1"` — Odoo will not recreate it without `-i module`.
- The module defining the XML ID is not in the `depends` list of your module's `__manifest__.py`.
- The XML ID belongs to a module installed on a different database.

**Debug command:**
```bash
./odoo-bin shell -d mydb -c odoo.conf
>>> env.ref('module.xml_id')
```

---

#### Category 3 — View Architecture Errors

**Why this happens in Odoo:**
When Odoo loads a view (at startup or on first render) it validates the XML architecture against the model's field list and against OWL/QWeb tag rules. Common mistakes are referencing a field that does not exist on the model, using deprecated tags (`<tree>` instead of `<list>` in v17+), a broken XPath in an inherited view, or forgetting `inherit_id`.

**Primary fix — field doesn't exist on model:**
```bash
# Check if the field is defined in the model
grep -r "my_field" addons/my_module/models/ --include="*.py"
# Make sure you ran: ./odoo-bin -u my_module -d mydb
```

**Primary fix — wrong tag (Odoo 17+):**
```xml
<!-- ✗ Deprecated in v17+ -->
<tree>…</tree>
<!-- ✓ Correct -->
<list>…</list>
```

**Primary fix — broken XPath in inherited view:**
```xml
<!-- Always test your XPath against the base arch first -->
<xpath expr="//field[@name='partner_id']" position="after">
    <field name="my_field"/>
</xpath>
```

**Other possible causes:**
- `inherit_id` is missing or points to a non-existent base view.
- The view is referencing a Many2many or One2many widget that needs a `comodel_name` attribute.
- An invisible condition references a field not loaded in the view's `fields_get`.

**Debug command:**
```bash
./odoo-bin -u my_module -d mydb --log-level=debug 2>&1 | grep -i "arch\|view"
```

---

#### Category 4 — Asset / JavaScript Errors

**Why this happens in Odoo:**
Odoo 16+ uses asset bundles defined in the module manifest. If a JS/CSS/OWL file is not declared in the correct bundle, or the bundle name is wrong, the file is silently ignored or the bundle fails to compile. OWL template names must follow the `my_module.ComponentName` format.

**Primary fix — declare asset in `__manifest__.py`:**
```python
'assets': {
    'web.assets_backend': [
        'my_module/static/src/js/my_widget.js',
        'my_module/static/src/scss/my_style.scss',
        'my_module/static/src/xml/my_template.xml',
    ],
},
```

**Primary fix — OWL template naming:**
```xml
<!-- ✗ Wrong -->
<templates><t t-name="MyComponent">…</t></templates>
<!-- ✓ Correct -->
<templates><t t-name="my_module.MyComponent">…</t></templates>
```

**Primary fix — importing a module from `@web/`:**
```js
// ✓ Correct OWL/ES6 import
import { Component } from "@odoo/owl";
import { registry } from "@web/core/registry";
```

**Other possible causes:**
- Restarting the server without clearing the asset cache: visit `/web?debug=assets` then hard-refresh.
- SCSS syntax error — check the server log for the exact line.
- Referring to `web.assets_common` instead of `web.assets_backend` (or vice-versa).

**Debug command:**
```bash
# Clear compiled assets
./odoo-bin -u my_module -d mydb
# Then open: http://localhost:8069/web?debug=assets
```

---

#### Category 5 — Database / ORM Constraint Errors

**Why this happens in Odoo:**
Odoo mirrors Python-level constraints to the PostgreSQL schema. A `UniqueViolation` means you tried to insert a duplicate value in a column that has a `UNIQUE` index. `NOT NULL` violations mean a required field was left empty. `ForeignKeyViolation` means a related record was deleted while a FK still points to it.

**Primary fix — unique constraint:**
```python
# In your model
_sql_constraints = [
    ('name_unique', 'UNIQUE(name)', 'This name already exists.'),
]
```
To override an existing Odoo constraint with a softer one:
```python
_sql_constraints = [
    ('name_unique', 'CHECK(1=1)', ''),  # disable inherited constraint
]
```

**Primary fix — NOT NULL / required field:**
```python
my_field = fields.Char(string="My Field", required=True, default="default_value")
```
Or provide the value explicitly in the create/write call.

**Primary fix — ForeignKeyViolation:**
Add `ondelete` to the Many2one field:
```python
partner_id = fields.Many2one('res.partner', string="Partner", ondelete='cascade')
# Options: 'cascade', 'set null', 'restrict'
```

**Other possible causes:**
- A migration script (in `migrations/`) did not handle existing rows before adding a NOT NULL column.
- A `_sql_constraints` entry was added after data was already created — run `-u module` then fix the data.
- Two concurrent transactions tried to create the same unique record (race condition).

**Debug command:**
```bash
# Check existing constraints in the DB
psql -d mydb -c "\d+ my_table"
```

---

#### Category 6 — Python / ORM Code Errors

**Why this happens in Odoo:**
`AttributeError` on a field usually means the module was not updated after adding the field to the model, or the `_inherit` points to the wrong model. `KeyError` on access rights means the `ir.model.access.csv` entry for the model is missing.

**Primary fix — module not updated:**
```bash
./odoo-bin -u my_module -d mydb
```
Always restart the server after updating Python code.

**Primary fix — wrong `_inherit`:**
```python
# ✗ Wrong — 'res.partner.address' does not exist in modern Odoo
class MyExtension(models.Model):
    _inherit = 'res.partner.address'

# ✓ Correct
class MyExtension(models.Model):
    _inherit = 'res.partner'
```

**Primary fix — field access on empty recordset:**
```python
# ✗ Will raise if record is empty
name = self.partner_id.name

# ✓ Safe
name = self.partner_id.name if self.partner_id else ''
```

**Other possible causes:**
- Using `self.env['model'].search(...)` returns a recordset; calling `.name` on a multi-record set gives the first value in some Odoo versions but raises in others — always ensure a single record with `ensure_one()` or index `[0]`.
- A mixin or abstract model method is called before the concrete model defines a required field.
- A `@api.depends` decorator is missing, so a computed field returns `False` instead of a value.

**Debug command:**
```bash
./odoo-bin shell -d mydb -c odoo.conf
>>> env['my.model'].fields_get(['my_field'])
```

---

#### Category 7 — Cron / Scheduled Action Errors

**Why this happens in Odoo:**
Cron methods run inside their own transaction. An unhandled exception rolls back everything and may crash the worker process (causing `OperationalError: server closed the connection`). Long-running crons that process thousands of records can also exhaust memory or hit the PostgreSQL `statement_timeout`.

**Primary fix — always wrap cron body in try/except:**
```python
def _my_cron_job(self):
    try:
        records = self.env['my.model'].search([('state', '=', 'pending')])
        for record in records:
            try:
                record._process()
                self.env.cr.commit()   # commit per record for large batches
            except Exception as e:
                _logger.error("Failed processing record %s: %s", record.id, e)
                self.env.cr.rollback()
    except Exception as e:
        _logger.error("Cron _my_cron_job failed: %s", e)
```

**Primary fix — cron is inactive:**
```xml
<record id="ir_cron_my_job" model="ir.cron">
    <field name="active" eval="True"/>
    …
</record>
```

**Other possible causes:**
- The cron's `nextcall` date is in the future — check in Settings → Technical → Automation → Scheduled Actions.
- The `numbercall` field was set to `1` and the cron ran once then deactivated itself.
- In multi-worker setups, cron workers are separate (`--workers` vs `--max-cron-threads`) — ensure at least one cron worker is configured.

**Debug command:**
```bash
./odoo-bin -d mydb --max-cron-threads=1 --log-level=debug 2>&1 | grep -i "cron\|scheduler"
```

---

#### Category 8 — Translation / i18n Errors

**Why this happens in Odoo:**
Odoo extracts translatable strings at export time. If a string is not wrapped in `_()` (Python) or `_t()` (JS/OWL), it will never appear in `.pot` files and can never be translated. If the language is not installed in the database, all translations are silently dropped.

**Primary fix — wrap strings correctly:**
```python
# Python model / controller
from odoo import _
raise UserError(_("The document is not confirmed yet."))

# JavaScript / OWL
import { _t } from "@web/core/l10n/translation";
const msg = _t("The document is not confirmed yet.");
```

**Primary fix — update `.pot` file and re-import:**
```bash
./odoo-bin -d mydb --i18n-export=my_module/i18n/my_module.pot --modules=my_module
```
Then translate in Weblate / POEdit and import:
```bash
./odoo-bin -d mydb --i18n-import=my_module/i18n/es.po --language=es_ES --modules=my_module
```

**Other possible causes:**
- The language is not installed: Settings → Translations → Languages → Activate.
- Dynamic strings built with `%` or f-strings are never extracted — always pass the full literal to `_()`.
- `noupdate="1"` on a `ir.translation` record prevents re-import without `-i module`.

**Debug command:**
```bash
./odoo-bin -d mydb --log-level=debug 2>&1 | grep -i "translat\|i18n"
```

---

### 3 — Summary Fix Checklist

After the diagnosis, always provide a short numbered checklist the developer can follow:

1. ✅ [most likely fix]
2. ✅ [second most likely fix]
3. ✅ [verification step — e.g., restart server, update module, check logs]

---

### 4 — If the Primary Fix Doesn't Solve It

List 2–3 additional things to check, each with a one-liner explanation of why it could be the real cause.

---

### 5 — Error Category Not Recognised

If the error does not match any of the 8 categories above, respond with:

> I need a bit more context to diagnose this accurately. Please provide:
> 1. **Full traceback** (copy everything from `Traceback (most recent call last):` to the final error line)
> 2. **Odoo version** (e.g., 18.0, 19.0)
> 3. **What action triggered the error** (e.g., clicking Save, opening a view, running a cron, installing the module)
> 4. **Module name** where the error originates (check the last file in the traceback)

---

*Tip: Run Odoo with `--log-level=debug` to get the most detailed output. For view errors, append `?debug=assets` to the URL.*
