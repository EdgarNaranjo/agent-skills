# Database Migration Scripts for Odoo Modules

Reference for writing `migrations/` scripts when upgrading a custom module between versions.

> **Scope:** This guide covers module-level database migration scripts — what a module developer writes when their custom module has schema changes (field renames, type changes, etc.). For migrating an entire Odoo database between major versions, use [OCA/OpenUpgrade](https://github.com/OCA/OpenUpgrade).

---

## When you need a migration script

A migration script is required whenever your module upgrade changes the database schema in a way that would lose or corrupt existing data:

| Change | Needs script? | Why |
|---|---|---|
| Add a new optional field | ❌ No | ORM adds the column with NULL |
| Add a field with `required=True` and `default=` | ❌ No | ORM fills existing rows with default |
| Add a field with `required=True` and no default | ✅ **Yes (pre)** | Odoo raises `NOT NULL` violation |
| Add a field with `required=True` (Many2one, value must be resolved via ORM) | ✅ **Yes (pre + post)** | pre adds nullable column; post fills it via ORM lookup before NOT NULL is enforced |
| Rename a field | ✅ **Yes (pre)** | Old column stays orphaned, new column starts empty |
| Change field type (`Char` → `Many2one`) | ✅ **Yes (pre+post)** | Incompatible types; data must be migrated manually |
| Remove a field | ❌ No | Odoo drops the column automatically |
| Rename a model | ✅ **Yes (pre)** | Old table stays, new table starts empty |
| Rename an XML ID | ✅ **Yes (post)** | Stale `ir.model.data` entry causes `MissingError` |
| Delete a record that others may reference | ✅ **Yes (post)** | Foreign key errors on upgrade |
| Move a field from one module to another | ✅ **Yes (post)** | `ir.model.data` module ownership changes |

---

## Folder structure

Place migration scripts inside your module under `migrations/<version>/`:

```
my_module/
├── __manifest__.py          # version must match the migration folder name
└── migrations/
    └── 19.0.1.1.0/          # must match the NEW version in __manifest__.py
        ├── pre-migration.py  # runs BEFORE ORM updates tables
        └── post-migration.py # runs AFTER ORM updates tables
```

The folder name must exactly match the version in `__manifest__.py`. If the module is at `19.0.1.0.0` and you bump it to `19.0.1.1.0`, create `migrations/19.0.1.1.0/`.

---

## Script skeleton

Both `pre-migration.py` and `post-migration.py` follow the same pattern:

```python
# migrations/19.0.1.1.0/pre-migration.py
import logging
from openupgradelib import openupgrade  # optional but recommended

_logger = logging.getLogger(__name__)


@openupgrade.migrate()
def migrate(env, version):
    """
    Runs BEFORE the ORM updates the database schema.
    Use for: column renames, table renames, data prep before type changes.
    """
    if not version:
        return  # fresh install, no migration needed
    _logger.info("Running pre-migration for my_module %s", version)
    # ... your migration code here
```

```python
# migrations/19.0.1.1.0/post-migration.py
import logging
from openupgradelib import openupgrade

_logger = logging.getLogger(__name__)


@openupgrade.migrate()
def migrate(env, version):
    """
    Runs AFTER the ORM has updated the database schema.
    Use for: XML ID renames, data transformations, field value migrations.
    """
    if not version:
        return
    # ... your migration code here
```

### Without openupgradelib (stdlib only)

If you cannot depend on `openupgradelib`, use raw SQL:

```python
# pre-migration.py without openupgradelib
import logging

_logger = logging.getLogger(__name__)


def migrate(cr, version):
    """Note: receives cr (cursor), not env, when not using @openupgrade.migrate()"""
    if not version:
        return
    cr.execute("""
        ALTER TABLE my_model
        RENAME COLUMN old_field TO new_field
    """)
    _logger.info("Renamed column old_field -> new_field")
```

---

## Common patterns

### Rename a field

Always done in **pre-migration** (before ORM touches the table):

```python
# pre-migration.py
from openupgradelib import openupgrade


@openupgrade.migrate()
def migrate(env, version):
    if not version:
        return
    openupgrade.rename_fields(
        env,
        [
            # (model_name, table_name, old_field, new_field)
            ("my.model", "my_model", "old_field_name", "new_field_name"),
        ],
    )
```

Manual equivalent (without openupgradelib):

```python
def migrate(cr, version):
    if not version:
        return
    cr.execute("""
        ALTER TABLE my_model
        RENAME COLUMN old_field_name TO new_field_name
    """)
```

### Rename a model

```python
# pre-migration.py
from openupgradelib import openupgrade


@openupgrade.migrate()
def migrate(env, version):
    if not version:
        return
    openupgrade.rename_models(
        env.cr,
        [("my.old.model", "my.new.model")],
    )
    openupgrade.rename_tables(
        env.cr,
        [("my_old_model", "my_new_model")],
    )
```

**After renaming a model, also update these in post-migration:**

```python
# post-migration.py
from openupgradelib import openupgrade


@openupgrade.migrate()
def migrate(env, version):
    if not version:
        return
    # 1. Rename the ir.model.data entry (the model's own XML ID)
    #    rename_models() does NOT update this automatically.
    openupgrade.rename_xmlids(
        env.cr,
        [
            # base.model_my_old_model → base.model_my_new_model
            ("base.model_my_old_model", "base.model_my_new_model"),
        ],
    )
    # 2. Update ir.model.access.csv in your module:
    #    Change model_my_old_model → model_my_new_model in the model_id:id column
    # 3. Update any ir.rule records that reference the old model_id.
    # 4. If other modules have Many2one fields pointing to the old model,
    #    those fields' comodel_name also needs updating in their source code.
```

### Rename XML IDs

Done in **post-migration** (after ORM runs, `ir.model.data` is updated):

```python
# post-migration.py
from openupgradelib import openupgrade


@openupgrade.migrate()
def migrate(env, version):
    if not version:
        return
    openupgrade.rename_xmlids(
        env.cr,
        [
            # (old_xmlid, new_xmlid)
            ("my_module.old_record_id", "my_module.new_record_id"),
        ],
    )
```

### Add a NOT NULL column with computed default

The ORM will fail if existing rows would violate `NOT NULL`. Add the column in **pre-migration**, fill it, then the ORM upgrade proceeds normally:

```python
# pre-migration.py
from openupgradelib import openupgrade


@openupgrade.migrate()
def migrate(env, version):
    if not version:
        return
    # Step 1: add the column as nullable
    openupgrade.logged_query(
        env.cr,
        "ALTER TABLE my_model ADD COLUMN IF NOT EXISTS new_required_field VARCHAR",
    )
    # Step 2: fill existing rows before ORM adds the NOT NULL constraint
    openupgrade.logged_query(
        env.cr,
        "UPDATE my_model SET new_required_field = 'default_value' WHERE new_required_field IS NULL",
    )
```

### Change field type (`Char` → `Many2one`)

The type change is incompatible — the ORM will drop and recreate the column. Save the data first:

```python
# pre-migration.py — copy old values before ORM drops the column
from openupgradelib import openupgrade


@openupgrade.migrate()
def migrate(env, version):
    if not version:
        return
    # Preserve old char values in a temp column
    openupgrade.logged_query(
        env.cr,
        "ALTER TABLE my_model ADD COLUMN IF NOT EXISTS _migr_partner_name VARCHAR",
    )
    openupgrade.logged_query(
        env.cr,
        "UPDATE my_model SET _migr_partner_name = partner_id WHERE partner_id IS NOT NULL",
    )
```

```python
# post-migration.py — after ORM created the new Many2one column
from openupgradelib import openupgrade


@openupgrade.migrate()
def migrate(env, version):
    if not version:
        return
    # Resolve old char values to res.partner IDs
    records = env["my.model"].search([])
    for record in records:
        env.cr.execute(
            "SELECT _migr_partner_name FROM my_model WHERE id = %s", (record.id,)
        )
        old_name = env.cr.fetchone()[0]
        if old_name:
            partner = env["res.partner"].search([("name", "=", old_name)], limit=1)
            if partner:
                record.partner_id = partner
            else:
                _logger.warning(
                    "my_module migration: could not resolve partner '%s' for record %s — left NULL",
                    old_name, record_id,
                )
                # TODO: manual review — run after migration: SELECT id FROM my_model WHERE partner_id IS NULL

    # Clean up temp column
    openupgrade.logged_query(
        env.cr, "ALTER TABLE my_model DROP COLUMN IF EXISTS _migr_partner_name"
    )
```

### Delete stale records safely

```python
# post-migration.py
from openupgradelib import openupgrade


@openupgrade.migrate()
def migrate(env, version):
    if not version:
        return
    openupgrade.delete_records_safely_by_xml_id(
        env,
        [
            "my_module.old_action_that_no_longer_exists",
            "my_module.old_menu_item",
        ],
    )
```

### Load updated XML data

When a record's data changes between versions (e.g. a `noupdate="1"` record):

```python
# post-migration.py
from openupgradelib import openupgrade


@openupgrade.migrate()
def migrate(env, version):
    if not version:
        return
    openupgrade.load_data(
        env,
        "my_module",
        "19.0.1.1.0/noupdate_changes.xml",  # path relative to migrations folder
    )
```

---

## openupgradelib quick reference

Install: `pip install openupgradelib`

| Function | Pre/Post | What it does |
|---|---|---|
| `rename_fields(env, [(model, table, old, new)])` | pre | Rename column in DB + update all references |
| `rename_columns(cr, {table: [(old_col, new_col)]})` | pre | Low-level column rename (no reference update) |
| `rename_models(cr, [(old_model, new_model)])` | pre | Rename model in ORM metadata |
| `rename_tables(cr, [(old_table, new_table)])` | pre | Rename DB table |
| `rename_xmlids(cr, [(old_xmlid, new_xmlid)])` | post | Update `ir.model.data` entries |
| `add_columns(env, [(model, field, type, default, table)])` | pre | Add column before ORM |
| `logged_query(cr, sql, args=None)` | both | Execute SQL with logging |
| `load_data(env, module, filename)` | post | Load XML data file |
| `delete_records_safely_by_xml_id(env, [xmlids])` | post | Delete records ignoring FK errors |
| `delete_record_translations(cr, module, [xmlids])` | post | Remove translations for deleted records |
| `delete_sql_constraint_safely(env, module, table, name)` | pre | Drop a constraint safely |
| `is_module_installed(cr, module)` | both | Check if a module is installed |
| `m2o_to_x2m(cr, model, table, field, source_field)` | post | Convert Many2one to x2many |
| `merge_models(cr, old_model, new_model, ref_field)` | pre | Merge two models into one |
| `update_module_names(cr, [(old, new)])` | pre | Rename a module |
| `chunked(records, single=True)` | post | Iterate large recordsets in batches |

---

## Pre vs Post — decision guide

```
Does the change affect a DB column BEFORE the ORM runs?
├── YES → pre-migration.py
│   Examples: rename column, add column for NOT NULL, save data before type change
└── NO → post-migration.py
    Examples: rename XML IDs, transform field values using ORM, load XML data,
              delete stale records, fill Many2one from old Char values
```

**Cases that need BOTH pre AND post:**

| Change | Pre does | Post does |
|---|---|---|
| Incompatible type change (e.g. Char → Many2one) | Save old values to temp column | Resolve values via ORM, drop temp column |
| Rename a model | Rename tables + ORM metadata | Update XML IDs, ir.model.access, ir.rule refs |
| Split one field into two | Copy data to temp | Fill new fields via ORM logic |

---

### Add a database index

For performance improvements on large tables. **Important:** `CREATE INDEX CONCURRENTLY` cannot run inside a transaction, so it **cannot be used inside `@openupgrade.migrate()`**. Use `CREATE INDEX IF NOT EXISTS` (without CONCURRENTLY) for migration scripts:

```python
# post-migration.py — safe inside a transaction
from openupgradelib import openupgrade


@openupgrade.migrate()
def migrate(env, version):
    if not version:
        return
    # Standard index creation — safe inside migration transaction
    # Note: this briefly locks the table. Acceptable for upgrades.
    openupgrade.logged_query(
        env.cr,
        "CREATE INDEX IF NOT EXISTS idx_my_model_state ON my_model (state)",
    )
```

If you need a **non-locking index** on a table with millions of rows in production, run `CREATE INDEX CONCURRENTLY` as a **manual SQL step after the upgrade completes** — not inside a migration script:

```sql
-- Run manually AFTER odoo-bin -u my_module --stop-after-init
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_my_model_state ON my_model (state);
```

---

## Running and testing

```bash
# Apply migration on a test database
./odoo-bin -d testdb -u my_module --stop-after-init

# Apply with debug logging to see migration output
./odoo-bin -d testdb -u my_module --stop-after-init --log-level=debug 2>&1 | grep -i "my_module\|migration"

# Run tests after migration
./odoo-bin -d testdb --test-enable --stop-after-init -u my_module

# Verify columns after pre-migration
psql testdb -c "\d my_model"

# Check ir.model.data is clean
psql testdb -c "SELECT * FROM ir_model_data WHERE module = 'my_module' AND name LIKE 'old_%'"
```

---

## Common mistakes

| Mistake | Correct pattern |
|---|---|
| Renaming a field in `post-migration.py` | Always in **pre** — post runs after ORM, old column is already gone |
| Renaming XML IDs in `pre-migration.py` | Always in **post** — ORM needs to finish updating `ir.model.data` first |
| Not checking `if not version: return` | New installs pass `version=None`; the guard prevents running scripts on fresh install |
| Using `env.cr.commit()` in migration script | Never commit inside a migration — Odoo manages the transaction |
| Accessing `env["my.model"]` in `pre-migration.py` | The ORM schema may not match yet; use raw SQL in pre-migration |
| Forgetting to update `__manifest__.py` version | Odoo only runs migration scripts when the stored version < manifest version |
| Migration folder name doesn't match manifest version | Scripts are silently skipped — folder name must be exact |
