# OCA Module Structure — Odoo 18/19

Standard directory layout. All directories are optional except `__manifest__.py` and `__init__.py`, but follow this structure to be OCA-compatible.

```
my_module/
├── __init__.py                  # imports from models/, controllers/, wizards/
├── __manifest__.py              # module metadata
├── hooks.py                     # pre/post install hooks (if needed)
├── exceptions.py                # custom exception classes (if needed)
│
├── models/
│   ├── __init__.py              # imports all model files
│   └── my_model.py
│
├── controllers/
│   ├── __init__.py
│   └── main.py
│
├── wizards/                     # TransientModel classes
│   ├── __init__.py
│   ├── my_wizard.py
│   └── my_wizard_views.xml      # wizard views live here, not in views/
│
├── views/
│   ├── my_model_views.xml
│   └── res_partner_views.xml    # inherited model views: name from original model
│
├── report/
│   ├── my_report.xml            # QWeb report template
│   └── my_report_actions.xml    # ir.actions.report record
│
├── security/
│   ├── ir.model.access.csv      # model-level access rules
│   └── my_module_security.xml   # groups + record rules
│
├── data/
│   └── my_module_data.xml       # initial data loaded on install
│
├── demo/
│   └── my_module_demo.xml       # demo data (only loaded in demo mode)
│
├── i18n/
│   └── my_module.pot            # translation template (generate with `--i18n-export`)
│
├── static/
│   └── description/
│       ├── icon.png             # 128x128 module icon
│       └── index.html           # module description page
│
├── tests/
│   ├── __init__.py              # imports all test files
│   ├── test_my_model.py
│   └── test_my_wizard.py
│
└── readme/                      # OCA readme standard
    ├── DESCRIPTION.rst
    ├── INSTALL.rst
    ├── CONFIGURE.rst
    ├── USAGE.rst
    └── CHANGELOG.rst
```

## File Naming Conventions

| File type | Naming pattern | Example |
|-----------|---------------|---------|
| Model | `model_name.py` (underscores) | `sale_order_line.py` |
| View | `model_name_views.xml` | `sale_order_line_views.xml` |
| Inherited view | `res_partner_views.xml` | Name from original model |
| Wizard | `wizard_name.py` | `stock_move_wizard.py` |
| Wizard view | Next to `.py` in `wizards/` | `stock_move_wizard_views.xml` |
| Report template | `report_name.xml` | `report_sale_order.xml` |
| Security groups | `my_module_security.xml` | — |
| Tests | `test_model_name.py` | `test_sale_order.py` |

## manifest data load order

Always load in this order in `"data"`:
```python
"data": [
    "security/my_module_security.xml",   # groups first
    "security/ir.model.access.csv",       # then access rules
    "data/my_module_data.xml",            # then data
    "views/my_model_views.xml",           # then views
    "report/my_report_actions.xml",       # then reports
],
```

## __init__.py patterns

Root `__init__.py`:
```python
# Copyright 2025 Author Name
# License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl).
from . import controllers, models, wizards
```

`models/__init__.py`:
```python
# Copyright 2025 Author Name
# License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl).
from . import my_model, res_partner
```

## Inherited model: `_name` vs `_inherit`

```python
# Extend existing model (no new table, no new _name)
class ResPartner(models.Model):
    _inherit = "res.partner"
    my_field = fields.Char()

# Create new model that inherits from another (new table, new _name)
class MySpecialPartner(models.Model):
    _name = "my.special.partner"
    _inherit = "res.partner"
    _description = "My Special Partner"
```

## Copyright header

Every `.py` file:
```python
# Copyright 2025 Author Name
# License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl).
```

Every `.xml` file:
```xml
<!-- Copyright 2025 Author Name
     License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl). -->
```
