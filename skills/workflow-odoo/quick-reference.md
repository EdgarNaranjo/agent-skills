# Quick Reference — Odoo 18/19

Common patterns and snippets for fast lookup.

---

## Model skeleton (v18/v19)

```python
from odoo import _, api, fields, models


class MyModel(models.Model):
    _name = "my.model"
    _description = "My Model"
    _rec_name = "name"
    _rec_names_search = ["name", "ref"]  # replaces name_search() override

    name = fields.Char(string="Name", required=True)
    ref = fields.Char(string="Reference")

    # v19: use _compute_display_name instead of name_get()
    # def _compute_display_name(self):
    #     for rec in self:
    #         rec.display_name = f"[{rec.ref}] {rec.name}"

    @api.model_create_multi          # required in v19; valid in v18
    def create(self, vals_list):
        for vals in vals_list:
            # pre-processing
            pass
        return super().create(vals_list)
```

---

## View snippet — use `<list>`, not `<tree>` (v17+)

```xml
<record id="view_my_model_list" model="ir.ui.view">
    <field name="name">my.model.list</field>
    <field name="model">my.model</field>
    <field name="arch" type="xml">
        <list>
            <field name="name"/>
            <field name="ref"/>
        </list>
    </field>
</record>
```

---

## Manifest version format

```python
# __manifest__.py
{
    "name": "My Module",
    "version": "18.0.1.0.0",   # or "19.0.1.0.0"
    "depends": ["base"],
    "data": [
        "security/ir.model.access.csv",
        "views/my_model_views.xml",
    ],
    "installable": True,
    "license": "LGPL-3",
}
```

---

## Access CSV format

```csv
id,name,model_id:id,group_id:id,perm_read,perm_write,perm_create,perm_unlink
access_my_model_user,my.model user,model_my_model,base.group_user,1,1,1,0
access_my_model_manager,my.model manager,model_my_model,base.group_system,1,1,1,1
```

---

## Common Mistakes

| Mistake | Correct pattern |
|---|---|
| Overriding `name_search()` | Use `_rec_names_search = [...]` on the model |
| `<tree>` tag in views | `<list>` (required since v17) |
| `selection_add` without `ondelete` | Always add `ondelete={"value": "cascade"}` (or desired action) |
| `from odoo.tools.translate import _` | `from odoo import _` |
| Test class with no `@tagged` | Add `@tagged('post_install', '-at_install')` |
| `setUp()` for shared DB fixtures | Use `setUpClass()` — `setUp()` runs before every test method |
| Hardcoded user-visible strings | Wrap in `_("...")` |
| Version `1.0.0` or `18.1.0` in manifest | Must follow `18.0.x.y.z` / `19.0.x.y.z` format |
| New XML file not listed in manifest `data` | Every view/data file must appear in `data` or `demo` |
| `name_get()` override in v19 | Override `_compute_display_name()` instead |
| `@api.model def create(self, vals)` in v19 | Must be `@api.model_create_multi` with `vals_list` |
