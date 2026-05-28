---
description: Scaffold a complete new Odoo 18/19 module with all boilerplate
argument-hint: "<module_name>"
---

You are scaffolding a brand-new Odoo module. The module technical name is: **$1**

If `$1` is empty or not provided, ask the user: "What should the module technical name be? (snake_case, e.g. `sale_custom_discount`)"

---

## Step 1 — Ask these 3 questions before writing any code

Ask all three together in a single message so the user can answer at once:

1. **Odoo version:** 18 or 19?
2. **One-line description:** What does this module do? (Used in `__manifest__.py` summary field)
3. **Main dependency besides `base`:** e.g. `sale`, `stock`, `account` — or just `base` if none.
4. **Security groups?** Should this module define custom user groups (e.g. `group_my_module_user`, `group_my_module_manager`)?
   - yes → generate `security/groups.xml` with 2 groups (user + manager) and update manifest
   - no (default) → skip groups, use `base.group_user` for access rules

Wait for the user's answers before proceeding.

---

## Step 2 — Create all files

Use the answers to fill in the templates below. Replace `<module>` with `$1`, `<VERSION>` with `18` or `19`, `<DESCRIPTION>` with the user's description, and `<DEPENDS>` with `["base", "<their dependency>"]` (omit the extra dependency if they said "just base").

### `<module>/__init__.py`

```python
# © <YEAR> <Author>
# License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl-3.0).

from . import models
```

### `<module>/__manifest__.py`

```python
# © <YEAR> <Author>
# License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl-3.0).

{
    "name": "<Module Display Name>",
    "summary": "<DESCRIPTION>",
    "version": "<VERSION>.0.1.0.0",
    "category": "Uncategorized",
    "website": "",
    "author": "",
    "license": "LGPL-3",
    "depends": <DEPENDS>,
    "data": [
        "security/ir.model.access.csv",
        # View XML files go here, e.g.:
        # "views/<module>_views.xml",
    ],
    "installable": True,
    "application": False,
    "auto_install": False,
}
```

**Version format rules:**
- Odoo 18 → `"version": "18.0.1.0.0"`
- Odoo 19 → `"version": "19.0.1.0.0"`

### `<module>/models/__init__.py`

```python
# © <YEAR> <Author>
# License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl-3.0).

# Import your models here, e.g.:
# from . import sale_order_custom
```

### `<module>/views/.gitkeep`

Empty placeholder file. After creating it, remind the user:
> ⚠️ Add your view XML filenames to the `"data"` list in `__manifest__.py` before installing.

### `<module>/security/ir.model.access.csv`

```csv
id,name,model_id:id,group_id:id,perm_read,perm_write,perm_create,perm_unlink
```

Header row only. New access rows will be added by `/odoo-model`.

### `<module>/security/groups.xml` *(only if the user answered yes to question 4)*

```xml
<?xml version="1.0" encoding="utf-8"?>
<odoo>
    <data>

        <record id="group_<module>_user" model="res.groups">
            <field name="name"><Module> User</field>
            <field name="category_id" ref="base.module_category_hidden"/>
            <field name="implied_ids" eval="[(4, ref('base.group_user'))]"/>
        </record>

        <record id="group_<module>_manager" model="res.groups">
            <field name="name"><Module> Manager</field>
            <field name="category_id" ref="base.module_category_hidden"/>
            <field name="implied_ids" eval="[(4, ref('group_<module>_user'))]"/>
        </record>

    </data>
</odoo>
```

If groups are generated, add `"security/groups.xml"` to the `"data"` list in `__manifest__.py` **before** `"security/ir.model.access.csv"`.

### `<module>/i18n/<module>.pot`

```pot
# Translation of <module> in English
# This file contains the translation of the following modules:
#   * <module>
#
msgid ""
msgstr ""
"Project-Id-Version: Odoo Server <VERSION>.0\n"
"Report-Msgid-Bugs-To: \n"
"POT-Creation-Date: 2025-01-01 00:00+0000\n"
"PO-Revision-Date: 2025-01-01 00:00+0000\n"
"Last-Translator: <>\n"
"Language-Team: \n"
"MIME-Version: 1.0\n"
"Content-Type: text/plain; charset=UTF-8\n"
"Content-Transfer-Encoding: \n"
"Plural-Forms: \n"
```

### `<module>/tests/__init__.py`

```python
# © <YEAR> <Author>
# License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl-3.0).

from . import test_<module>
```

### `<module>/tests/test_<module>.py`

```python
# © <YEAR> <Author>
# License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl-3.0).

from odoo.tests import tagged
from odoo.tests.common import TransactionCase


@tagged("post_install", "-at_install")
class Test<ModuleName>(TransactionCase):
    """Smoke tests for <module> module."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        # TODO: create shared fixtures here
        # cls.partner = cls.env['res.partner'].create({'name': 'Test Partner'})

    def test_module_installed(self):
        """Module is installed and accessible."""
        module = self.env['ir.module.module'].search([
            ('name', '=', '<module_name>'),
            ('state', '=', 'installed'),
        ])
        self.assertTrue(module, "Module '<module_name>' should be installed")

    def test_base_model_accessible(self):
        """Base model is accessible and returns a recordset."""
        # Replace with your module's main model once added via /odoo-model
        # records = self.env['<module>.<model>'].search([], limit=1)
        # self.assertIsNotNone(records)
        pass  # TODO: replace with real model test after running /odoo-model
```

### `<module>/static/description/index.html`

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8"/>
</head>
<body>
    <h1><Module Display Name></h1>
    <p><DESCRIPTION></p>
</body>
</html>
```

---

## Step 3 — After creating all files

Show this summary:

```
✅ Module scaffold complete for: <module>

Files created:
  <module>/__init__.py
  <module>/__manifest__.py
  <module>/models/__init__.py
  <module>/views/.gitkeep
  <module>/security/ir.model.access.csv
  <module>/i18n/<module>.pot
  <module>/tests/__init__.py
  <module>/static/description/index.html

  migrations/   (empty — add version folders here when schema changes are needed)

Next steps:
  1. Add your first model:         /odoo-model <module>.<record>
  2. Add a wizard if needed:       /odoo-wizard <wizard_name>
  3. Install in Odoo:              odoo-bin -i <module> --dev=all
  4. When you rename/change field types later, use /odoo-db-migrate
```
