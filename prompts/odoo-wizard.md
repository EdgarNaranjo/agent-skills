---
description: Add a wizard (TransientModel) with view, action, and trigger button to the current module
argument-hint: "<wizard_name>"
---

You are adding a wizard (TransientModel) to an existing Odoo module. The wizard name is: **$1**

If `$1` is empty or not provided, ask: "What is the wizard name in snake_case? (e.g. `cancel_order`, `send_report`)"

---

## Step 1 — Ask these questions before writing any code

Ask all at once in a single message:

1. **Odoo version:** 18 or 19?
2. **Module name:** What is the module folder name? (Only ask if not clear from context.)
3. **Target model:** Which model does this wizard operate on? (e.g. `sale.order`) — this is the model whose form view will get a button to open the wizard.
4. **What does the wizard do?** One or two sentences. This drives the action method name and the button label.
5. **Wizard fields:** List any fields needed on the wizard form (name, type, required/optional). Omit if the wizard only needs a confirm/cancel button with no inputs.

Wait for the user's answers before generating any code.

---

## Step 2 — Derive naming conventions from `$1`

Given the wizard name in snake_case (e.g. `cancel_order`), derive:

- **Python class name:** CamelCase + `Wizard` suffix (e.g. `CancelOrderWizard`)
- **Model technical name:** `<module>.<wizard_name>` replacing underscores with dots (e.g. `sale_custom.cancel_order`) — use the module name prefix
- **XML ID prefix:** `<module>_<wizard_name>` (e.g. `sale_custom_cancel_order`)
- **View XML filename:** `wizards/$1_views.xml`
- **Python filename:** `wizards/$1.py`
- **Test filename:** `tests/test_wizard_$1.py`
- **Action method name:** `action_<wizard_name>` (e.g. `action_cancel_order`)
- **Button label:** Title-cased, human-readable (e.g. "Cancel Order")

---

## Step 3 — Create all files

Apply **version-correct patterns** throughout:

| Pattern | v18 | v19 |
|---|---|---|
| List view tag | `<list>` | `<list>` |
| name_get() | Do not use | Do not use; use `_compute_display_name()` only if needed |
| create() override | Standard | Requires `@api.model_create_multi` |
| TransientModel | `models.TransientModel` | `models.TransientModel` (unchanged) |

---

### FILE: `wizards/$1.py`

```python
# © <YEAR> <Author>
# License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl-3.0).

from odoo import api, fields, models, _
from odoo.exceptions import UserError


class <WizardClassName>(models.TransientModel):
    _name = "<module>.$1"
    _description = "<Human-readable wizard description from user answer>"

    # Link back to the records this wizard acts on
    <target_model_field> = fields.Many2one(
        "<target.model>",
        string="<Target Model Label>",
        required=True,
        default=lambda self: self.env.context.get("active_id"),
    )

    # <USER-DEFINED WIZARD FIELDS GO HERE>
    # Example:
    # reason = fields.Text(string="Reason", required=True)
    # date = fields.Date(string="Effective Date", required=True, default=fields.Date.today)

    def <action_method_name>(self):
        """<Brief description of what this action does>."""
        self.ensure_one()
        target = self.<target_model_field>
        if not target:
            raise UserError(_("No record selected."))

        # TODO: implement wizard logic here
        # Example:
        # target.write({"state": "cancel", "cancel_reason": self.reason})

        # Return an action to refresh the parent view, or close the dialog:
        return {"type": "ir.actions.act_window_close"}
```

---

### FILE: `wizards/$1_views.xml`

Dialog-style form view with `<footer>` buttons — the standard pattern for wizards in Odoo:

```xml
<?xml version="1.0" encoding="utf-8"?>
<odoo>

    <!-- Wizard Form View -->
    <record id="<xml_id_prefix>_view_form" model="ir.ui.view">
        <field name="name"><module>.$1.view.form</field>
        <field name="model"><module>.$1</field>
        <field name="arch" type="xml">
            <form string="<Button Label>">
                <group>
                    <!-- USER FIELDS -->
                    <!-- Example:
                    <field name="reason"/>
                    <field name="date"/>
                    -->
                </group>
                <footer>
                    <button
                        name="<action_method_name>"
                        string="<Button Label>"
                        type="object"
                        class="btn-primary"
                    />
                    <button string="Cancel" class="btn-secondary" special="cancel"/>
                </footer>
            </form>
        </field>
    </record>

    <!-- Wizard Action -->
    <record id="<xml_id_prefix>_action" model="ir.actions.act_window">
        <field name="name"><Button Label></field>
        <field name="res_model"><module>.$1</field>
        <field name="view_mode">form</field>
        <field name="view_id" ref="<xml_id_prefix>_view_form"/>
        <field name="target">new</field>
        <field name="binding_model_id" ref="<target_model_xmlid>"/>
        <field name="binding_view_types">form</field>
    </record>

</odoo>
```

> **Note on `binding_model_id`:** Using it registers the wizard as an Action in the ⚙ Action menu of the target model's form. If you want a dedicated button instead (see below), you can remove `binding_model_id` and `binding_view_types`.

---

### FILE: `wizards/__init__.py`

Create if it does not exist, or append to it:

```python
# © <YEAR> <Author>
# License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl-3.0).

from . import $1
```

---

### FILE: `__init__.py` (module root)

**Update** to import wizards if not already imported:

```python
from . import wizards
```

---

### FILE: `__manifest__.py`

**Update** `"data"` list to include (preserving existing entries):

```python
"wizards/$1_views.xml",
```

---

### UPDATE: Target model's form view XML

Add a button inside the `<header>` (status bar area) or in a `<sheet>` `<div class="oe_button_box">` that opens the wizard with `target="new"`.

**Option A — Status bar button (common for state-machine models like sale.order):**

```xml
<header>
    <!-- existing statusbar buttons ... -->
    <button
        name="%(< xml_id_prefix>_action)d"
        string="<Button Label>"
        type="action"
        class="btn-secondary"
    />
</header>
```

**Option B — Smart button in button box:**

```xml
<div class="oe_button_box" name="button_box">
    <button
        name="%(< xml_id_prefix>_action)d"
        type="action"
        class="oe_stat_button"
        icon="fa-times-circle"
    >
        <div class="o_field_widget o_stat_info">
            <span class="o_stat_text"><Button Label></span>
        </div>
    </button>
</div>
```

Show both options and ask the user which they prefer, then apply the right one to the correct view file.

---

### FILE: `tests/test_wizard_$1.py`

```python
# © <YEAR> <Author>
# License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl-3.0).

from odoo.tests import tagged
from odoo.tests.common import TransactionCase


@tagged("post_install", "-at_install")
class TestWizard<WizardClassName>(TransactionCase):

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.Wizard = cls.env["<module>.$1"]
        # Create a minimal target record to operate on
        # cls.target = cls.env["<target.model>"].create({...})

    def test_wizard_creates(self):
        """Test that the wizard can be instantiated."""
        wizard = self.Wizard.create({
            # Minimum required fields
            # "<target_model_field>": self.target.id,
        })
        self.assertTrue(wizard.id)

    def test_wizard_action(self):
        """Test that the wizard action method executes without error."""
        wizard = self.Wizard.create({
            # "<target_model_field>": self.target.id,
        })
        result = wizard.<action_method_name>()
        # Wizard should return a close action or a dict
        self.assertIn("type", result)

    # def test_wizard_<specific_behavior>(self):
    #     """Test <specific behavior> of the wizard."""
    #     ...
```

---

### FILE: `tests/__init__.py`

**Update** to add:

```python
from . import test_wizard_$1
```

---

## Step 4 — After creating all files

Show this summary:

```
✅ Wizard `$1` added successfully.

Files created:
  wizards/$1.py
  wizards/$1_views.xml
  wizards/__init__.py          (created or updated)
  tests/test_wizard_$1.py

Files updated:
  __init__.py                  ← added: from . import wizards
  __manifest__.py              ← added wizard XML to data[]
  views/<target_model>_views.xml ← added trigger button (Option <A or B>)
  tests/__init__.py            ← added import

Version-specific patterns applied (v<VERSION>):
  ✓ TransientModel with ensure_one() guard
  ✓ Dialog-style form with <footer> buttons
  ✓ target="new" on trigger action
  <if v19: ✓ @api.model_create_multi noted for any create() overrides>

How to open the wizard manually (for debugging):
  In Odoo shell:
    env["<module>.$1"].create({"<target_field>": <id>}).<action_method_name>()

Run tests:
  odoo-bin -t -d <db> --test-tags /<module>
```
