# Translations / i18n — Odoo 18/19

## Rule: All User-Visible Strings Must Be Wrapped

If a user can see it → wrap it with `_()`. No exceptions.

## Python

```python
from odoo import _  # always import from odoo, not from odoo.tools.translate

# ❌ not translatable
raise UserError("This action is not allowed.")
name = "Draft"

# ✅ translatable
raise UserError(_("This action is not allowed."))
# Do NOT translate field default values or technical strings
```

### In class body (field labels) — DO NOT wrap

```python
# ❌ wrong — Odoo translates field strings automatically
name = fields.Char(string=_("Name"))

# ✅ correct — Odoo handles field label translation
name = fields.Char(string="Name")
# _description, _name, and field `string` are auto-translated by Odoo
```

### Dynamic strings — format AFTER translation

```python
# ❌ wrong — interpolation happens before translation
message = _("Record %s is invalid." % self.name)

# ✅ correct — translate first, then format
message = _("Record %s is invalid.") % self.name

# ✅ also correct with named placeholders
message = _("Record %(name)s with ref %(ref)s.") % {
    "name": self.name,
    "ref": self.ref,
}
```

### Multi-line strings

```python
# ✅ use parentheses, not backslash
raise UserError(
    _("This is a long error message that explains "
      "what went wrong in detail.")
)
```

## XML Views

```xml
<!-- Field labels: Odoo translates automatically — no action needed -->
<field name="name"/>

<!-- Translatable text in views -->
<button string="Confirm Order"/>          <!-- auto-translated -->
<field name="description" translate="1"/> <!-- marks field as translatable in DB -->

<!-- Static text in templates -->
<t t-esc="'Not translatable'"/>
<t t-out="record.display_name"/>

<!-- QWeb templates: use _() in Python controller, or t-translation in XML -->
<div t-translation="off">Technical content not for translation</div>
```

## i18n Directory and .pot File

Every module MUST have an `i18n/` directory with a `.pot` file (translation template).

```
my_module/
└── i18n/
    ├── my_module.pot    # master template — generated, never edit manually
    ├── es.po            # Spanish translation
    ├── fr.po            # French translation
    └── de.po            # German translation
```

### Generate .pot file

```bash
# With odoo-bin
./odoo-bin --i18n-export=my_module/i18n/my_module.pot \
    --modules=my_module -d mydb

# With uv
uv run odoo-bin --i18n-export=my_module/i18n/my_module.pot \
    --modules=my_module -d mydb
```

### Import a translation

```bash
./odoo-bin --i18n-import=my_module/i18n/es.po \
    --language=es -d mydb --modules=my_module
```

## Translation Checklist

For every file in the module:

### Python files
- [ ] `from odoo import _` is imported
- [ ] All `raise UserError(...)` strings wrapped
- [ ] All `raise ValidationError(...)` strings wrapped
- [ ] All user-facing `name` fields / labels wrapped
- [ ] Dynamic strings formatted AFTER `_()`
- [ ] Field `string=` parameter is NOT wrapped (Odoo handles it)

### XML files
- [ ] Buttons have `string=` attribute (auto-translated)
- [ ] Translatable `Char`/`Text` fields have `translate="1"` in field definition
- [ ] No hardcoded user-visible text outside of standard Odoo attributes

### i18n
- [ ] `i18n/` directory exists
- [ ] `.pot` file generated or updated after any string changes
- [ ] Existing `.po` files updated if strings changed (run `msgmerge`)

## Selection Field Labels

```python
# Selection values are translated automatically by Odoo
state = fields.Selection([
    ("draft", "Draft"),        # "Draft" will be extracted to .pot
    ("confirmed", "Confirmed"),
    ("done", "Done"),
], default="draft")

# No need to wrap with _() — Odoo handles selection label translation
```

## Common Mistakes

| ❌ Mistake | ✅ Fix |
|-----------|--------|
| `from odoo.tools.translate import _` | `from odoo import _` |
| `_("Hello %s" % name)` | `_("Hello %s") % name` |
| `string=_("My Field")` on fields | `string="My Field"` — auto-translated |
| No `i18n/` directory | Always create it with `.pot` |
| Missing `.pot` update after new strings | Run `--i18n-export` after every change |
| `translate="1"` on numeric/date fields | Only for `Char`, `Text`, `Html` |
