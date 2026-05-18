---
description: Generate or update unit tests for the current Odoo module — covers all untested methods
---

You are an expert Odoo developer. Your task is to generate or update unit tests for the current Odoo module, ensuring complete coverage of all relevant public methods.

---

## Step 1 — Confirm context

Ask the user:

1. **Odoo version**: 18 or 19?
2. **Module path**: What is the path to the module root? (e.g. `addons/my_module`) — if the user is already in the module directory, confirm it.

Do not proceed until you have both answers.

---

## Step 2 — Scan the module

Read every `.py` file found in these directories (if they exist):

- `models/`
- `wizards/`
- `controllers/`

For each file, collect all method definitions. A method is **in scope** for test generation if it matches any of the following:

- It does **not** start with `_` (public method)
- It starts with `_check_` (constraint checker)
- It starts with `_compute_` (computed field)
- It starts with `_onchange_` (onchange handler)
- It starts with `_constraint_` (constraint method)

Exclude from scope:
- `__init__`, `__str__`, `__repr__`, and other dunder methods
- Methods decorated with `@property` (unless they contain business logic worth testing)
- Pure field definitions (not methods)

---

## Step 3 — Detect existing tests

Read every `.py` file in `tests/`. For each in-scope method found in Step 2, check whether a test method already exists in any test file whose name matches the pattern `test_<method_name>` (exact or with a `_<scenario>` suffix).

Build two lists:
- **Covered**: methods that already have at least one test
- **Uncovered**: methods with no test at all

---

## Step 4 — Generate tests

For each **uncovered** method, generate one or more test methods following these rules:

### Class structure

```python
from odoo.tests import tagged, TransactionCase

@tagged('post_install', '-at_install')
class TestMyModel(TransactionCase):

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        # Create shared records here — avoid creating in individual tests
        cls.partner = cls.env['res.partner'].create({...})
        cls.record = cls.env['my.model'].create({...})
```

- One test class per model/wizard/controller file being tested
- Place each test class in a separate file: `tests/test_<model_filename>.py`
- Use `setUpClass` (classmethod) for shared data — **never** use `setUp` for records that can be shared
- Use `self.env` in test methods (it wraps `cls.env` in a savepoint automatically)

### Test method naming

```
test_<method_name>_<scenario>
```

Examples:
- `test_action_confirm_happy_path`
- `test_action_confirm_missing_partner_raises`
- `test_compute_total_with_zero_lines`
- `test_check_dates_end_before_start`

### Coverage requirements per method type

**Regular public methods / actions:**
```python
def test_action_confirm_happy_path(self):
    """Confirming a valid record sets state to 'confirmed'."""
    self.record.action_confirm()
    self.assertEqual(self.record.state, 'confirmed')

def test_action_confirm_already_confirmed_raises(self):
    """Confirming an already-confirmed record raises ValidationError."""
    self.record.state = 'confirmed'
    with self.assertRaises(ValidationError):
        self.record.action_confirm()
```

Always cover:
1. Happy path (expected successful outcome)
2. At least one validation/error path using `self.assertRaises(ValidationError)` or `self.assertRaises(UserError)`
3. Edge cases (empty recordset, zero values, boundary dates, etc.) where relevant

**`@api.constrains` methods:**
The test MUST actually trigger the constraint (i.e. create or write a record that violates the constraint and assert the error is raised). Do not merely call the method directly.

```python
def test_check_date_range_invalid(self):
    """Creating a record with end < start raises ValidationError."""
    with self.assertRaises(ValidationError):
        self.env['my.model'].create({
            'date_start': '2024-12-31',
            'date_end': '2024-01-01',
        })
```

**`_compute_*` fields:**
Test that the value recomputes correctly when its dependencies change.

```python
def test_compute_total_updates_on_line_change(self):
    """total_amount recomputes when a line is added."""
    self.assertEqual(self.record.total_amount, 0.0)
    self.env['my.model.line'].create({
        'order_id': self.record.id,
        'price': 100.0,
        'qty': 2,
    })
    self.assertEqual(self.record.total_amount, 200.0)
```

**`_onchange_*` methods:**
Simulate the onchange by calling it directly on a new (unsaved) record and asserting side effects.

```python
def test_onchange_partner_sets_currency(self):
    """onchange_partner_id copies currency from partner."""
    record = self.env['my.model'].new({'partner_id': self.partner.id})
    record._onchange_partner_id()
    self.assertEqual(record.currency_id, self.partner.currency_id)
```

**Controllers:**
For HTTP controllers, use `HttpCase` instead of `TransactionCase` and use `self.url_open()` or `self.authenticate()` + requests.

---

## Step 5 — Update `tests/__init__.py`

Read the current `tests/__init__.py`. For every new test file created, add the corresponding import if it is not already present:

```python
from . import test_my_model
from . import test_my_wizard
```

Write the updated file back.

---

## Step 6 — Output a coverage summary

After generating all tests, print a structured summary:

```
## Test Coverage Summary

### ✅ Already covered
- `MyModel.action_confirm` — tests/test_my_model.py::TestMyModel::test_action_confirm_*
- `MyModel._compute_total` — tests/test_my_model.py::TestMyModel::test_compute_total_*

### 🆕 Tests generated
- `MyModel.action_validate` → tests/test_my_model.py (2 test methods)
- `MyModel._check_date_range` → tests/test_my_model.py (1 test method)
- `MyWizard.action_apply` → tests/test_my_wizard.py (3 test methods)

### ⏭️ Skipped (with reason)
- `MyModel._helper_format_name` — private helper, no public contract to test
- `MyController.index` — HTTP controller, needs HttpCase (out of scope for this run)

### Files modified
- tests/test_my_model.py (created)
- tests/test_my_wizard.py (created)
- tests/__init__.py (updated)
```

Be honest about what was skipped and why. Do not generate tests for methods where a meaningful test cannot be written without additional business context from the user.
