---
name: workflow-odoo19
description: "Use when developing Odoo 18 or 19 modules — triggers automatic version confirmation, structure verification, test generation, translation checks, and explanations before every code change."
---

# workflow-odoo19

Automatic behaviors for Odoo 18/19 module development. These activate without being asked.

---

## Default Behaviors

1. **Confirm Odoo version once per session.**
   If the target version (18 or 19) is not already known, ask before writing any code. Store the answer and never ask again in the same session.

2. **Check module structure before changes.**
   Before touching any file, scan the module layout: `__manifest__.py`, `models/__init__.py`, `views/`, `security/`, `i18n/`, `tests/`. Note what exists and what is missing.

3. **Explain the approach before writing code.**
   State in one short paragraph: what you are about to do, why, and what alternatives exist. If a better pattern is available for the detected Odoo version, say so explicitly and let the user choose.

4. **Write unit tests for every new method or feature.**
   Place tests in `tests/test_<model>.py`. Use `@tagged('post_install', '-at_install')` unless the feature is install-time only. Use `setUpClass()` for shared fixtures, `setUp()` only for per-test state. Assert specific values, not just "no exception raised".

5. **Update existing tests when modifying existing code.**
   If a change alters behavior, method signature, or field names, find and update all affected test cases in the same response. Never leave tests in a broken state.

6. **Check translations after every UI-facing change.**
   Every string shown to users must be wrapped in `_()`. Import with `from odoo import _`. After adding or changing translatable strings, note that `.pot`/`.po` files should be regenerated with `i18n/` updated.

7. **Verify structure after changes.**
   After writing or editing files, confirm: the file is listed in `__manifest__.py` (`data`, `demo`, or `assets` as appropriate), `__init__.py` imports are correct, and security records exist for new models.

8. **Bump the module version in `__manifest__.py` on every change.**
   Every time a module is modified, increment the version following Odoo's format `{odoo}.{major}.{minor}.{patch}.{hotfix}`:
   - Bug fix / small correction → bump `patch` (e.g. `19.0.1.0.0` → `19.0.1.1.0`)
   - New feature / new field or view → bump `minor` (e.g. `19.0.1.0.0` → `19.0.2.0.0`)
   - Breaking change / data migration needed → bump `major` (e.g. `19.0.1.0.0` → `19.0.2.0.0` with migration script)
   Always show the old and new version in your response. Never leave a modified module at the same version.

9. **Apply version-correct patterns automatically.**
   Use the detected version to select the right API. Do not mix v16 patterns into v18/v19 code. When unsure, flag it and show both options.

---

## Quick Reference

### Model skeleton (v18/v19)

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

### View snippet — use `<list>`, not `<tree>` (v17+)

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

### Manifest version format

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

### Access CSV format

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

---

## References

- [module-structure.md](module-structure.md) — canonical directory layout and checklist
- [v18-changes.md](v18-changes.md) — API changes introduced in Odoo 18
- [v19-changes.md](v19-changes.md) — API changes introduced in Odoo 19
- [testing-patterns.md](testing-patterns.md) — test class setup, tagged tests, common assertions
- [translations.md](translations.md) — `_()` usage, `.pot` generation, i18n folder conventions
- [owl-patterns.md](owl-patterns.md) — `patch()`, custom field widgets, services, asset declaration
