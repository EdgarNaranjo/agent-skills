---
description: Add a complete model (Python + views + security + tests) to the current Odoo module
argument-hint: "<model.name>"
---

You are adding a new model to an existing Odoo module. The model technical name is: **$1**

If `$1` is empty or not provided, ask: "What is the model technical name? (dot.notation, e.g. `sale.order.line.custom`)"

---

## Step 1 — Ask these questions before writing any code

Ask all at once in a single message:

1. **Odoo version:** 18 or 19?
2. **Module directory:** What is the module folder name? (Can usually be inferred from context — only ask if ambiguous.)
3. **Fields:** List the fields to add. For each, provide: field name, type (`Char`, `Integer`, `Float`, `Boolean`, `Many2one`, `One2many`, `Many2many`, `Date`, `Datetime`, `Selection`, `Text`, `Html`), required or optional, and a short label.
4. **Inherit or new model?**
   - New model (`_name = "$1"`) — creates a new database table
   - Inherits existing (`_inherit = "<existing.model>"`) — extends an existing model
5. **Chatter?** Should this model have chatter (mail.thread + mail.activity.mixin)? yes / no

Wait for the user's answers before generating any code.

---

## Step 2 — Derive naming conventions from `$1`

Given the model name (e.g. `sale.order.custom`), derive:
- **Python class name:** CamelCase of the last parts (e.g. `SaleOrderCustom`)
- **Python filename:** dots → underscores (e.g. `sale_order_custom.py`)
- **XML ID prefix:** dots → underscores (e.g. `sale_order_custom`)
- **View XML filename:** `views/<python_filename_without_py>_views.xml` (e.g. `views/sale_order_custom_views.xml`)
- **Test filename:** `tests/test_<python_filename_without_py>.py`
- **Security CSV id:** `access_<xml_id_prefix>_user`

---

## Step 3 — Create and update all files

### FILE: `models/<python_filename>.py`

Apply these **version-correct patterns**:

| Pattern | v18 | v19 |
|---|---|---|
| Display name override | `_rec_names_search = ['name', ...]` for multi-field search | Same |
| name_get() | Do NOT override in v18/v19 | Do NOT use; use `_compute_display_name()` in v19 only if needed |
| List view tag | `<list>` (v17+) | `<list>` |
| create() override | `@api.model_create_multi` not required unless explicitly overriding | `@api.model_create_multi` required if overriding create() |

**Template for a NEW model (no chatter):**

```python
# © <YEAR> <Author>
# License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl-3.0).

from odoo import api, fields, models, _
from odoo.exceptions import UserError, ValidationError


class <ClassName>(models.Model):
    _name = "$1"
    _description = "<Human-readable description>"
    _order = "name asc"

    name = fields.Char(string="Name", required=True, copy=False)
    active = fields.Boolean(default=True)
    # <USER FIELDS GO HERE>
    notes = fields.Text(string="Notes")

    # --- Constraints ---
    _sql_constraints = [
        ("name_uniq", "unique(name)", "The name must be unique."),
    ]
```

**If chatter = yes, add to the class definition:**

```python
    _inherit = ["mail.thread", "mail.activity.mixin"]
```

And add `tracking=True` to key fields.

**Template for an INHERITED model:**

```python
class <ClassName>(models.Model):
    _inherit = "$1"

    # <USER FIELDS GO HERE>
```

---

### FILE: `models/__init__.py`

**Update** (do not overwrite) to add:
```python
from . import <python_filename_without_py>
```

---

### FILE: `views/<xml_id_prefix>_views.xml`

Use `<list>` (not `<tree>`) for the list view — correct for v17, v18, and v19.

```xml
<?xml version="1.0" encoding="utf-8"?>
<odoo>

    <!-- Form View -->
    <record id="<xml_id_prefix>_view_form" model="ir.ui.view">
        <field name="name">$1.view.form</field>
        <field name="model">$1</field>
        <field name="arch" type="xml">
            <form>
                <sheet>
                    <group>
                        <group>
                            <field name="name"/>
                            <!-- USER FIELDS (left column) -->
                        </group>
                        <group>
                            <field name="active"/>
                            <!-- USER FIELDS (right column) -->
                        </group>
                    </group>
                    <notebook>
                        <page string="Notes">
                            <field name="notes"/>
                        </page>
                    </notebook>
                </sheet>
                <!-- Add chatter if requested: -->
                <!-- <div class="oe_chatter">
                    <field name="message_follower_ids"/>
                    <field name="activity_ids"/>
                    <field name="message_ids"/>
                </div> -->
            </form>
        </field>
    </record>

    <!-- List View -->
    <record id="<xml_id_prefix>_view_list" model="ir.ui.view">
        <field name="name">$1.view.list</field>
        <field name="model">$1</field>
        <field name="arch" type="xml">
            <list>
                <field name="name"/>
                <!-- USER FIELDS -->
            </list>
        </field>
    </record>

    <!-- Window Action -->
    <record id="<xml_id_prefix>_action" model="ir.actions.act_window">
        <field name="name"><Model Display Name></field>
        <field name="res_model">$1</field>
        <field name="view_mode">list,form</field>
    </record>

    <!-- Menu Item — adjust parent to suit the module's menu structure -->
    <menuitem
        id="<xml_id_prefix>_menu"
        name="<Model Display Name>"
        action="<xml_id_prefix>_action"
        sequence="10"
    />

</odoo>
```

---

### FILE: `security/ir.model.access.csv`

**Update** (append row, do not remove header) with:

```
access_<xml_id_prefix>_user,$1 user,model_<model_underscored>,base.group_user,1,1,1,1
```

Where `model_<model_underscored>` uses underscores for all dots (e.g. `model_sale_order_custom`).

---

### FILE: `tests/test_<python_filename>.py`

```python
# © <YEAR> <Author>
# License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl-3.0).

from odoo.tests import tagged
from odoo.tests.common import TransactionCase


@tagged("post_install", "-at_install")
class Test<ClassName>(TransactionCase):

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.Model = cls.env["$1"]

    def test_create(self):
        """Test that a record can be created with minimum required fields."""
        record = self.Model.create({"name": "Test Record"})
        self.assertTrue(record.id)
        self.assertEqual(record.name, "Test Record")

    def test_required_fields(self):
        """Test that missing required fields raise a ValidationError."""
        from odoo.exceptions import ValidationError
        with self.assertRaises(Exception):
            self.Model.create({})

    # Add domain-specific test methods below:
    # def test_<feature>(self):
    #     ...
```

---

### FILE: `tests/__init__.py`

**Update** to add:
```python
from . import test_<python_filename_without_py>
```

---

### FILE: `__manifest__.py`

**Update** `"data"` list to include (if not already present):
```python
"security/ir.model.access.csv",
"views/<xml_id_prefix>_views.xml",
```

If chatter is enabled, also add `"mail"` to `"depends"` if not already there.

---

## Step 4 — After creating all files

Show this summary:

```
✅ Model `$1` added successfully.

Files created:
  models/<python_filename>.py
  views/<xml_id_prefix>_views.xml
  tests/test_<python_filename>.py

Files updated:
  models/__init__.py          ← added import
  tests/__init__.py           ← added import
  security/ir.model.access.csv ← added access row
  __manifest__.py             ← added view XML and security CSV to data[]

Version-specific patterns applied (v<VERSION>):
  ✓ List view uses <list> tag
  <if v19: ✓ _compute_display_name() used instead of name_get()>
  <if v19 + create override: ✓ @api.model_create_multi applied>

Next steps:
  - Run tests:     odoo-bin -t -d <db> --test-tags /<module>
  - Add a wizard:  /odoo-wizard <wizard_name>
```
