# Testing Patterns — Odoo 18/19

## Test Types

| Type | Class | When to use |
|------|-------|-------------|
| Unit / integration | `TransactionCase` | Most tests. DB rolled back after each test. |
| HTTP / tour | `HttpCase` | UI tests, JS tours |
| Saveable | `SavepointCase` | Deprecated in v18, use `TransactionCase` |

## Standard Pattern (v18/v19)

```python
# Copyright 2025 Author Name
# License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl).
from odoo.tests import tagged
from odoo.tests.common import TransactionCase
from odoo.exceptions import UserError, ValidationError


@tagged("post_install", "-at_install")
class TestMyModel(TransactionCase):
    """Tests for my.module.model."""

    @classmethod
    def setUpClass(cls):
        """Create shared test data once for all tests in this class."""
        super().setUpClass()
        cls.Model = cls.env["my.module.model"]
        cls.record = cls.Model.create({
            "name": "Test Record",
            "active": True,
        })

    def test_create_record(self):
        """Creating a record sets expected defaults."""
        record = self.Model.create({"name": "Another"})
        self.assertTrue(record.id)
        self.assertTrue(record.active)

    def test_constraint_empty_name(self):
        """Empty name raises ValidationError."""
        with self.assertRaises(ValidationError):
            self.Model.create({"name": ""})

    def test_action_does_something(self):
        """action_do_something changes state to done."""
        self.record.action_do_something()
        self.assertEqual(self.record.state, "done")

    def test_name_search(self):
        """_rec_names_search works on ref field."""
        results = self.Model.name_search("Test")
        self.assertTrue(any(r[0] == self.record.id for r in results))
```

## Tags

```python
@tagged("post_install", "-at_install")   # most common: run after install
@tagged("at_install")                    # run during install (avoid if possible)
@tagged("post_install")                  # run post-install (no -at_install = both)
@tagged("-standard", "my_tag")          # exclude from standard run, add custom tag
```

## setUpClass vs setUp

| | `setUpClass` | `setUp` |
|-|--------------|---------|
| Runs | Once per class | Before every test |
| Speed | Fast (shared records) | Slow (creates for every test) |
| Use for | Shared base data | Test-specific state |
| Access | `cls.record` | `self.record` |

**Always prefer `setUpClass`** for base data. Use `setUp` only when a test needs fresh state.

```python
@classmethod
def setUpClass(cls):
    super().setUpClass()
    cls.partner = cls.env.ref("base.res_partner_1")  # existing record

def setUp(self):
    super().setUp()
    self.temp = self.env["my.model"].create({"name": "Temp"})  # fresh each test
```

## Testing Inherited Models

```python
@tagged("post_install", "-at_install")
class TestResPartnerExtension(TransactionCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.partner = cls.env["res.partner"].create({
            "name": "Test Partner",
            "my_custom_field": "value",
        })

    def test_custom_field_default(self):
        partner = self.env["res.partner"].create({"name": "No custom field"})
        self.assertEqual(partner.my_custom_field, "default_value")
```

## Testing Wizards (TransientModel)

```python
@tagged("post_install", "-at_install")
class TestMyWizard(TransactionCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.record = cls.env["my.model"].create({"name": "Test"})

    def test_wizard_action(self):
        wizard = self.env["my.wizard"].with_context(
            active_id=self.record.id,
            active_model="my.model",
        ).create({"reason": "Testing"})
        wizard.action_confirm()
        self.assertEqual(self.record.state, "confirmed")
```

## Testing Exceptions

```python
def test_raises_user_error(self):
    with self.assertRaises(UserError):
        self.record.action_that_should_fail()

def test_raises_validation_error(self):
    with self.assertRaises(ValidationError):
        self.record.write({"name": ""})

def test_raises_access_error(self):
    # Test with a user that lacks permissions
    user = self.env.ref("base.user_demo")
    with self.assertRaises(Exception):
        self.record.with_user(user).action_restricted()
```

## Testing with Different Users

```python
def test_with_user_context(self):
    user = self.env.ref("base.user_demo")
    record_as_user = self.record.with_user(user)
    # Test what demo user can see/do
    self.assertTrue(record_as_user.name)
```

## Running Tests

```bash
# Run all tests for a module
./odoo-bin -d mydb --test-enable --stop-after-init -i my_module

# Run specific test class
./odoo-bin -d mydb --test-enable --stop-after-init \
    --test-tags my_module.TestMyModel

# Run with custom tag
./odoo-bin -d mydb --test-enable --stop-after-init \
    --test-tags my_tag

# Run with uv
uv run odoo-bin -d mydb --test-enable --stop-after-init -i my_module
```

## Checklist: Tests for Every Feature

For every new method/feature, write tests for:
- [ ] Happy path (normal use)
- [ ] Edge cases (empty, zero, max values)
- [ ] Exception paths (`assertRaises`)
- [ ] Permission boundaries (if access rules exist)
- [ ] Computed fields recalculate correctly
- [ ] `onchange` updates dependent fields
