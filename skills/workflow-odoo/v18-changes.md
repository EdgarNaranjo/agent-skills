# Odoo v17 → v18 Breaking Changes

Reference for migrating or developing modules targeting Odoo 18.

## Python Requirements

- **Python 3.10+** required (v17 required 3.7+)
- **PostgreSQL 14+** required

---

## ORM Changes

### `_rec_names_search` replaces `name_search()` override

```python
# ❌ v17 and earlier
class MyModel(models.Model):
    _name = "my.model"

    @api.model
    def name_search(self, name="", args=None, operator="ilike", limit=100):
        args = args or []
        domain = ["|", ("name", operator, name), ("ref", operator, name)]
        return self.search(domain + args, limit=limit).name_get()

# ✅ v18+
class MyModel(models.Model):
    _name = "my.model"
    _rec_names_search = ["name", "ref"]  # Odoo handles search automatically
```

### `selection_add` requires `ondelete`

```python
# ❌ v17 — ondelete was optional
class MyModel(models.Model):
    _inherit = "sale.order"
    state = fields.Selection(
        selection_add=[("custom_state", "Custom State")]
    )

# ✅ v18 — ondelete is mandatory
class MyModel(models.Model):
    _inherit = "sale.order"
    state = fields.Selection(
        selection_add=[("custom_state", "Custom State")],
        ondelete={"custom_state": "cascade"},  # or "set default", "set null", callable
    )
```

### `copy_data()` replaces `copy()` for duplicating records

```python
# ❌ v17
class MyModel(models.Model):
    def copy(self, default=None):
        default = dict(default or {})
        default["name"] = _("%s (copy)") % self.name
        return super().copy(default)

# ✅ v18 — copy_data returns a list of value dicts
class MyModel(models.Model):
    def copy_data(self, default=None):
        vals_list = super().copy_data(default=default)
        for vals in vals_list:
            vals["name"] = _("%s (copy)") % self.name
        return vals_list
```

### `@api.model_create_multi` is now the standard for `create()`

```python
# ❌ v17 — overriding create() with single dict
class MyModel(models.Model):
    @api.model
    def create(self, vals):
        vals["computed_field"] = "value"
        return super().create(vals)

# ✅ v18 — always use create_multi signature
class MyModel(models.Model):
    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            vals["computed_field"] = "value"
        return super().create(vals_list)
```

---

## View Changes

### `<tree>` → `<list>` (enforced in v17, required in v18)

```xml
<!-- ❌ v16 and older -->
<tree string="My Records">
    <field name="name"/>
</tree>

<!-- ✅ v17+ / v18+ -->
<list string="My Records">
    <field name="name"/>
</list>
```

### `<tree>` inside `<field>` (One2many) also changes to `<list>`

```xml
<!-- ❌ -->
<field name="order_line_ids">
    <tree editable="bottom">
        <field name="product_id"/>
    </tree>
</field>

<!-- ✅ -->
<field name="order_line_ids">
    <list editable="bottom">
        <field name="product_id"/>
    </list>
</field>
```

---

## Asset Bundle Changes

### Bundle names updated

```xml
<!-- ❌ v16/v17 old names -->
<template id="my_assets" inherit_id="web.assets_web">
<template id="my_assets" inherit_id="web.assets_common">

<!-- ✅ v18 correct names -->
<template id="my_assets" inherit_id="web.assets_backend">
<template id="my_assets" inherit_id="web.assets_frontend">
```

### OWL components: asset declaration

```xml
<!-- v18: declare OWL components in manifest or assets bundle -->
<odoo>
    <template id="my_module_assets" inherit_id="web.assets_backend">
        <xpath expr="." position="inside">
            <script type="text/javascript" src="/my_module/static/src/js/my_component.js"/>
        </xpath>
    </template>
</odoo>
```

---

## Mail / Chatter Changes

### `mail.thread` — `_mail_get_message_subtypes` signature changed

```python
# ❌ v17
def _mail_get_message_subtypes(self):
    return super()._mail_get_message_subtypes()

# ✅ v18 — check method signature in base if overriding
# Use message_subscribe / message_unsubscribe as before
```

### Tracking: `tracking=True` on fields still works

```python
name = fields.Char(tracking=True)  # unchanged, still valid in v18
```

---

## `ir.actions` Changes

### `view_type` is deprecated in `ir.actions.act_window`

```xml
<!-- ❌ -->
<field name="view_type">form</field>

<!-- ✅ Use view_mode only -->
<field name="view_mode">list,form</field>
```

---

## Import Changes

### Never import `_` from `odoo.tools.translate`

```python
# ❌ deprecated
from odoo.tools.translate import _

# ✅ always
from odoo import _
```

---

## `base.automation` (Automated Actions) Changes

| v17 field | v18 field |
|-----------|-----------|
| `filter_pre_domain` | still exists |
| `filter_domain` | still exists |
| `action_code` (Python code) | `code` field in some contexts |
| `trigger` values | some new trigger options added |

---

## `_check_company` Pattern

```python
# v18: use _check_company_auto and company_id fields correctly
class MyModel(models.Model):
    _name = "my.model"
    _check_company_auto = True  # enables automatic company check on write/create

    company_id = fields.Many2one("res.company", required=True, default=lambda self: self.env.company)
    partner_id = fields.Many2one("res.partner", check_company=True)
```
