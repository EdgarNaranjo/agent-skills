---
description: Add a view inheritance (XPath) to extend an existing Odoo view
argument-hint: "<view_xml_id>"
---

You are generating a proper Odoo view inheritance to extend an existing view via XPath.

The view XML ID to inherit from is: **$1**

---

## Step 1 — Gather requirements

Before generating any files, ask the user these questions in a single message:

1. **Odoo version** — 18 or 19?
2. **Module name** — e.g. `my_module` (the technical name)
3. **What changes to make?** — choose one or more:
   - Add a new field (after/before an existing field)
   - Replace an existing field
   - Add a button to the header
   - Add a new page/tab (notebook)
   - Hide a field or element
   - Add a field to an existing group
   - Modify an attribute on an existing element (e.g. change a button label)
4. **Where exactly?** — for each change, specify:
   - Field name / button name / group name / page name it should go near
   - "after", "before", or "inside" / "replace"
5. **Model name** — e.g. `sale.order` (needed for the `model` field on the view record)

Wait for all answers before generating.

---

## Step 2 — Parse the inherited view reference

$1 is formatted as `<external_module>.<view_record_id>`, e.g. `sale.view_order_form`.

- `external_module` = the part before the dot → used in `inherit_id ref="..."`
- The model can usually be inferred from the view ID (e.g. `view_order_form` → `sale.order`), but confirm with the user.

---

## Step 3 — Generate `views/<model>_views.xml`

Use the underscored model name for the filename (e.g. `sale.order` → `sale_order_views.xml`).

If a `views/` file already exists for this model in the module, append the new record to it instead of creating a new file.

```xml
<?xml version="1.0" encoding="utf-8"?>
<odoo>
    <data>

        <record id="view_<model_name>_form_inherit_<module>" model="ir.ui.view">
            <field name="name"><module>.<model_name>.form.inherit</field>
            <field name="model"><model.name></field>
            <field name="inherit_id" ref="$1"/>
            <field name="arch" type="xml">

                <!-- XPath expressions go here — see Section 4 -->

            </field>
        </record>

    </data>
</odoo>
```

Naming conventions:
- Record `id`: `view_<model_name>_form_inherit_<module>` (or `list`, `tree`, `search`, etc.)
- `name` field: `<module>.<model_name>.<view_type>.inherit`

---

## Step 4 — XPath reference for every change type

Generate the correct `<xpath>` block for each change the user requested.
Use **all real field/button/group names** the user provided.

---

### 4A — Add a field after an existing field

```xml
<xpath expr="//field[@name='partner_id']" position="after">
    <field name="my_custom_field"/>
</xpath>
```

For fields that need a label override or widget:
```xml
<xpath expr="//field[@name='partner_id']" position="after">
    <field name="my_custom_field" widget="many2many_tags" string="Custom Label"/>
</xpath>
```

---

### 4B — Add a field before an existing field

```xml
<xpath expr="//field[@name='date_order']" position="before">
    <field name="my_custom_field"/>
</xpath>
```

---

### 4C — Replace an existing field entirely

```xml
<xpath expr="//field[@name='old_field_name']" position="replace">
    <field name="new_field_name"/>
</xpath>
```

> ⚠️ Use sparingly — if the original module changes `old_field_name`, your
> override silently disappears. Prefer `after`/`before` when possible.

---

### 4D — Add a button to the form header

After a specific existing button:
```xml
<xpath expr="//header//button[@name='action_confirm']" position="after">
    <button name="action_my_custom_action"
            string="My Action"
            type="object"
            class="btn-primary"
            attrs="{'invisible': [('state', 'not in', ['draft', 'sent'])]}"/>
</xpath>
```

Inside the header (append at end):
```xml
<xpath expr="//header" position="inside">
    <button name="action_my_custom_action"
            string="My Action"
            type="object"/>
</xpath>
```

> **Odoo 18/19 note:** `attrs` with `invisible` domain strings is still
> supported in Odoo 18 but Odoo 19 prefers the new `invisible` attribute
> directly: `invisible="state not in ('draft', 'sent')"`.
> Generate the correct syntax based on the version the user specified.

---

### 4E — Add a new page/tab to a notebook

```xml
<xpath expr="//notebook" position="inside">
    <page string="My Custom Tab" name="page_my_custom">
        <group>
            <group string="Left Column">
                <field name="my_field_1"/>
                <field name="my_field_2"/>
            </group>
            <group string="Right Column">
                <field name="my_field_3"/>
            </group>
        </group>
    </page>
</xpath>
```

To add before or after a specific existing page:
```xml
<xpath expr="//page[@name='order_line']" position="after">
    <page string="My Custom Tab" name="page_my_custom">
        ...
    </page>
</xpath>
```

> Always give pages a `name` attribute — this makes them referenceable by
> future inheritance without fragile positional XPath.

---

### 4F — Hide a field (make invisible)

**Odoo 18 style** (domain string in `attrs`):
```xml
<xpath expr="//field[@name='field_to_hide']" position="attributes">
    <attribute name="attrs">{'invisible': [(1, '=', 1)]}</attribute>
</xpath>
```

**Odoo 19 style** (new `invisible` attribute):
```xml
<xpath expr="//field[@name='field_to_hide']" position="attributes">
    <attribute name="invisible">1</attribute>
</xpath>
```

Hide conditionally (Odoo 18):
```xml
<xpath expr="//field[@name='discount']" position="attributes">
    <attribute name="attrs">{'invisible': [('pricelist_id', '=', False)]}</attribute>
</xpath>
```

Hide conditionally (Odoo 19):
```xml
<xpath expr="//field[@name='discount']" position="attributes">
    <attribute name="invisible">not pricelist_id</attribute>
</xpath>
```

---

### 4G — Add a field to an existing named group

```xml
<xpath expr="//group[@name='sale_header_left']" position="inside">
    <field name="my_custom_field"/>
</xpath>
```

If the group has no `name`, use a nearby field as anchor instead:
```xml
<xpath expr="//field[@name='partner_id']/.." position="inside">
    <field name="my_custom_field"/>
</xpath>
```

> ⚠️ Avoid `//div[1]` or `//group[1]` — positional XPath breaks whenever the
> parent view changes structure. Always anchor on `@name` or `@string`.

---

### 4H — Modify an attribute on an existing element

Change a button label:
```xml
<xpath expr="//button[@name='action_confirm']" position="attributes">
    <attribute name="string">Approve</attribute>
</xpath>
```

Add a CSS class to an existing element:
```xml
<xpath expr="//field[@name='amount_total']" position="attributes">
    <attribute name="class">text-danger fw-bold</attribute>
</xpath>
```

Make a field required conditionally (Odoo 19):
```xml
<xpath expr="//field[@name='my_field']" position="attributes">
    <attribute name="required">state == 'draft'</attribute>
</xpath>
```

---

## Step 5 — XPath construction rules (always follow these)

1. **Prefer semantic selectors** — `//field[@name='x']`, `//button[@name='y']`,
   `//group[@name='z']`, `//page[@name='w']` — over positional `//div[2]`.

2. **Never use bare `//div`** or `//td` with a positional index. These break
   when the parent view adds or removes elements.

3. **For buttons in headers**, always use `@name` (the method name string):
   `//button[@name='action_confirm']`, not `//button[@string='Confirm']`.
   (The `string` attribute is translated; `name` is not.)

4. **For groups without `name`**, climb to the parent with `..` or anchor on a
   sibling field rather than using a positional index.

5. **Test XPath in the Odoo debug view** — go to the view record in
   Settings > Technical > User Interface > Views, enable developer mode,
   and check the "Arch" tab to validate your XPath manually.

6. **Do not chain multiple changes in one `<xpath>`** — use one `<xpath>`
   block per logical change. This makes future debugging and override removal
   much easier.

---

## Step 6 — Update `__manifest__.py`

Add the view file to the `data` list:

```python
'data': [
    # ... existing entries ...
    'views/<model_name>_views.xml',
],
```

Show the user the exact line to insert, with context from their current manifest.

---

## Step 7 — Apply the change

After generating, remind the user to upgrade the module:

```bash
python odoo-bin -d <database_name> -u <module_name>
```

Or from the Odoo UI: Apps → search for the module → click **Upgrade**.

---

## Common mistakes — warn the user explicitly

After generating the files, always append this warning block:

**❌ Wrong `inherit_id` reference:**
```xml
<!-- Wrong: missing the external module prefix -->
<field name="inherit_id" ref="view_order_form"/>

<!-- Correct: always include the module prefix -->
<field name="inherit_id" ref="sale.view_order_form"/>
```

**❌ Inheriting from a module that is not a dependency:**
Make sure `<external_module>` (the part before the dot in `$1`) is listed in
`__manifest__.py` under `'depends'`. If not, add it:
```python
'depends': ['base', '<external_module>'],
```

**❌ Using `position="replace"` on a field referenced elsewhere:**
If the original module references the replaced field in another view or action,
your replacement breaks those too. Prefer `position="after"` + hiding the old
field when possible.

**❌ Fragile XPath after an Odoo version upgrade:**
Positional XPath like `//group[1]//field[3]` becomes wrong as soon as the
parent view changes. If your XPath is failing after an upgrade, open the view
in Settings > Technical and re-examine the arch.

**❌ Invisible fields still required:**
If you hide a field that has `required=True` on the model level, form
submission will still fail. Either make `required` conditional in the model or
also override the `required` attribute in the same XPath.

---

## Odoo 18 vs 19 — `invisible` / `attrs` syntax

| What                          | Odoo 18                                          | Odoo 19                            |
|-------------------------------|--------------------------------------------------|------------------------------------|
| Static invisible              | `attrs="{'invisible': [(1,'=',1)]}"`             | `invisible="1"`                    |
| Conditional invisible         | `attrs="{'invisible': [('state','=','done')]}"` | `invisible="state == 'done'"`      |
| Conditional required          | `attrs="{'required': [('state','=','draft')]}"` | `required="state == 'draft'"`      |
| Conditional readonly          | `attrs="{'readonly': [('state','!=','draft')]}"` | `readonly="state != 'draft'"`      |

Generate the correct syntax based on the Odoo version the user specified in Step 1.
Both syntaxes are accepted by Odoo 18 (old `attrs` still works), but Odoo 19
may deprecate `attrs` — prefer the new syntax for Odoo 19.
