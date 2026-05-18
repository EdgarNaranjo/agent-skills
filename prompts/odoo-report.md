---
description: Scaffold a complete QWeb PDF report (Python action + XML template) for the current module
argument-hint: "<report_name>"
---

You are scaffolding a complete QWeb PDF report for an Odoo module.

The report name (in snake_case) is: **$1**

---

## Step 1 — Gather requirements

Before generating any files, ask the user these questions in a single message:

1. **Odoo version** — 18 or 19?
2. **Module name** — e.g. `my_module` (the technical name, not the display name)
3. **Target model** — which model does this report print records from? (e.g. `sale.order`, `account.move`)
4. **Paper format** — A4 or Letter? Portrait or Landscape?
5. **Print menu** — Should this report appear in the "Print" button menu on the model's form view? (yes/no)

Wait for the user's answers before proceeding.

---

## Step 2 — File generation

Once you have all answers, generate the following files. Replace every placeholder:

- `<name>` → the snake_case report name from $1 (e.g. `sale_order_custom`)
- `<module>` → the module name provided
- `<ModelName>` → CamelCase of the model (e.g. `sale.order` → `SaleOrder`)
- `<model.name>` → the dotted model name (e.g. `sale.order`)
- `<model_name>` → underscored model name (e.g. `sale_order`)
- `<ReportTitle>` → a human-readable title derived from $1 (e.g. `Sale Order Custom`)

---

### File A — `report/report_<name>.xml`

This file registers the `ir.actions.report` record.

```xml
<?xml version="1.0" encoding="utf-8"?>
<odoo>
    <data>

        <record id="action_report_<name>" model="ir.actions.report">
            <field name="name"><ReportTitle></field>
            <field name="model"><model.name></field>
            <field name="report_type">qweb-pdf</field>
            <field name="report_name"><module>.report_<name></field>
            <field name="report_file"><module>/report/report_<name>_template</field>
            <field name="print_report_name">'<ReportTitle> - %s' % object.name</field>
            <!-- Include the next two fields ONLY if the user said "yes" to Print menu -->
            <field name="binding_model_id" ref="model_<model_name>"/>
            <field name="binding_type">report</field>
        </record>

    </data>
</odoo>
```

> **Odoo 18/19 note:** `binding_model_id` uses the auto-generated XML ID
> `model_<model_name>` (underscores, no dots). For `sale.order` that is
> `model_sale_order`. This ID is always available without extra declaration.

---

### File B — `report/report_<name>_template.xml`

The QWeb template. `web.external_layout` automatically includes the company
header/footer and logo.

```xml
<?xml version="1.0" encoding="utf-8"?>
<odoo>
    <data>

        <template id="report_<name>">
            <t t-call="web.html_container">
                <t t-foreach="docs" t-as="doc">
                    <t t-call="web.external_layout">
                        <div class="page">

                            <!-- ── Report header ── -->
                            <div class="row mb-4">
                                <div class="col-6">
                                    <h2><ReportTitle></h2>
                                    <p>
                                        <strong>Reference:</strong>
                                        <span t-field="doc.name"/>
                                    </p>
                                    <p>
                                        <strong>Date:</strong>
                                        <span t-field="doc.date_order"
                                              t-options='{"widget": "date"}'/>
                                    </p>
                                </div>
                                <div class="col-6 text-end">
                                    <!-- Partner / customer block -->
                                    <t t-if="doc.partner_id">
                                        <address>
                                            <strong t-field="doc.partner_id.name"/><br/>
                                            <span t-field="doc.partner_id.street"/><br/>
                                            <t t-if="doc.partner_id.street2">
                                                <span t-field="doc.partner_id.street2"/><br/>
                                            </t>
                                            <span t-field="doc.partner_id.city"/>
                                            <t t-if="doc.partner_id.state_id">
                                                <span t-field="doc.partner_id.state_id.name"/>,
                                            </t>
                                            <span t-field="doc.partner_id.zip"/>
                                            <span t-field="doc.partner_id.country_id.name"/>
                                        </address>
                                    </t>
                                </div>
                            </div>

                            <!-- ── Lines table (adapt to the actual O2M field) ── -->
                            <table class="table table-sm o_main_table">
                                <thead>
                                    <tr>
                                        <th>Description</th>
                                        <th class="text-end">Qty</th>
                                        <th class="text-end">Unit Price</th>
                                        <th class="text-end">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <!-- Replace "order_line" with the real One2many field name -->
                                    <t t-foreach="doc.order_line" t-as="line">
                                        <tr>
                                            <td>
                                                <span t-field="line.product_id.name"/>
                                                <t t-if="line.name and line.name != line.product_id.name">
                                                    <br/><small class="text-muted" t-field="line.name"/>
                                                </t>
                                            </td>
                                            <td class="text-end">
                                                <span t-field="line.product_uom_qty"/>
                                            </td>
                                            <td class="text-end">
                                                <span t-field="line.price_unit"
                                                      t-options='{"widget": "monetary", "display_currency": doc.currency_id}'/>
                                            </td>
                                            <td class="text-end">
                                                <span t-field="line.price_subtotal"
                                                      t-options='{"widget": "monetary", "display_currency": doc.currency_id}'/>
                                            </td>
                                        </tr>
                                    </t>
                                </tbody>
                            </table>

                            <!-- ── Totals block ── -->
                            <div class="row">
                                <div class="col-6 offset-6">
                                    <table class="table table-sm">
                                        <tr t-if="doc.amount_untaxed is not None">
                                            <td><strong>Subtotal</strong></td>
                                            <td class="text-end">
                                                <span t-field="doc.amount_untaxed"
                                                      t-options='{"widget": "monetary", "display_currency": doc.currency_id}'/>
                                            </td>
                                        </tr>
                                        <tr t-if="doc.amount_tax is not None">
                                            <td>Tax</td>
                                            <td class="text-end">
                                                <span t-field="doc.amount_tax"
                                                      t-options='{"widget": "monetary", "display_currency": doc.currency_id}'/>
                                            </td>
                                        </tr>
                                        <tr class="border-top">
                                            <td><strong>Total</strong></td>
                                            <td class="text-end">
                                                <strong>
                                                    <span t-field="doc.amount_total"
                                                          t-options='{"widget": "monetary", "display_currency": doc.currency_id}'/>
                                                </strong>
                                            </td>
                                        </tr>
                                    </table>
                                </div>
                            </div>

                            <!-- ── Notes / terms ── -->
                            <t t-if="doc.note">
                                <div class="mt-3">
                                    <strong>Notes:</strong>
                                    <p t-field="doc.note"/>
                                </div>
                            </t>

                        </div>
                    </t>
                </t>
            </t>
        </template>

    </data>
</odoo>
```

> **Adaptation guidance:**
> - Remove or rename fields that don't exist on the chosen model.
> - If the model has no `order_line`, replace that `<tbody>` block with the
>   appropriate One2many or simply remove the table.
> - If the model has no `currency_id`, drop the `t-options` monetary widget
>   and use `t-field` alone, or pass `doc.company_id.currency_id`.

---

### File C — `report/__init__.py`

Create an **empty** `__init__.py` so the `report/` directory is a valid Python
package (required if you later add a Python controller or parser):

```python
# report/__init__.py
```

---

## Step 3 — Update `__manifest__.py`

Append both XML files to the `data` list. The **action record** (`report_<name>.xml`)
must come **after** the **template** (`report_<name>_template.xml`) because
Odoo loads data in order and the action references the template by name.

```python
'data': [
    # ... existing entries ...
    'report/report_<name>_template.xml',  # template first
    'report/report_<name>.xml',           # action second
],
```

Show the user the exact lines to add, with their current manifest open for
context, so they can insert them in the right position.

---

## Step 4 — Paper format

If the user chose a non-default paper format, also generate or reference a
`report.paperformat` record. For Odoo 18/19 the built-in XML IDs are:

| Format    | Orientation | XML ID                                     |
|-----------|-------------|--------------------------------------------|
| A4        | Portrait    | `base.paperformat_euro` (default)          |
| A4        | Landscape   | *(create a custom paperformat record)*     |
| Letter    | Portrait    | `base.paperformat_us`                      |
| Letter    | Landscape   | *(create a custom paperformat record)*     |

For landscape or non-standard formats, add this to `report/report_<name>.xml`
**before** the `ir.actions.report` record and add a reference to it:

```xml
<record id="paperformat_<name>_landscape" model="report.paper.format">
    <field name="name"><ReportTitle> Landscape</field>
    <field name="default">False</field>
    <field name="format">A4</field>  <!-- or custom -->
    <field name="orientation">Landscape</field>
    <field name="margin_top">10</field>
    <field name="margin_bottom">10</field>
    <field name="margin_left">10</field>
    <field name="margin_right">10</field>
    <field name="header_line">False</field>
    <field name="header_spacing">20</field>
    <field name="dpi">90</field>
</record>
```

Then in the `ir.actions.report` record add:
```xml
<field name="paperformat_id" ref="<module>.paperformat_<name>_landscape"/>
```

---

## Step 5 — Testing instructions

After all files are created, show the user exactly how to test:

### In-browser PDF test URL
```
http://localhost:8069/report/pdf/<module>.action_report_<name>/<record_id>
```
Replace `<record_id>` with the database ID of a real record (e.g. `1`).

### From the Odoo shell
```bash
# Start the shell
python odoo-bin shell -d <database_name>

# Trigger the report and save the output
report = env['ir.actions.report'].search([('report_name', '=', '<module>.report_<name>')], limit=1)
pdf_content, content_type = report._render_qweb_pdf([1])  # pass list of IDs
with open('/tmp/test_report.pdf', 'wb') as f:
    f.write(pdf_content)
print("PDF written to /tmp/test_report.pdf")
```

### Via Print menu (if binding was enabled)
1. Open a record of model `<model.name>` in the form view.
2. Click the **⚙ Print** button (top-right area).
3. The report should appear in the dropdown.

---

## Odoo version-specific notes

| Feature                        | Odoo 18                        | Odoo 19                        |
|--------------------------------|--------------------------------|--------------------------------|
| `web.external_layout`          | ✅ supported                   | ✅ supported                   |
| `t-options` monetary widget    | `display_currency` key         | `display_currency` key         |
| `binding_model_id` auto XML ID | `model_<model_name>`           | `model_<model_name>`           |
| wkhtmltopdf / Chromium         | wkhtmltopdf (check server)     | May use headless Chromium      |

For Odoo 19, if the instance uses headless Chromium as the PDF renderer, CSS
`@page` rules and `page-break-*` properties take effect — mention this to the
user so they can style accordingly.

---

## Common mistakes to warn about

After generating the files, remind the user of these pitfalls:

- **Wrong `report_name`**: must match `<module>.<template_id>` exactly — this
  is the QWeb template ID, not the file path.
- **Wrong `report_file`**: must be the file path *without* `.xml`, relative to
  the addons root (e.g. `my_module/report/report_sale_order_custom_template`).
- **Missing `__init__.py`**: without it, `report/` won't be treated as a
  Python package if you add controllers later.
- **Data order in manifest**: action XML must come after template XML.
- **`binding_model_id` with wrong name**: use underscores, not dots
  (`model_sale_order`, not `model_sale.order`).
- **Installing**: after adding new XML files, always run
  `python odoo-bin -d <db> -u <module>` to reload the module.
