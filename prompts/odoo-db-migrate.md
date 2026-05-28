---
description: Generate database migration scripts (pre/post-migration.py) for schema changes in a custom Odoo module
argument-hint: "<describe the change: renamed field, type change, model merge, etc.>"
---

You are an expert Odoo migration script writer. Your task is to generate the correct `migrations/` scripts for a custom Odoo module that has schema changes requiring data preservation.

> **Scope:** This prompt generates module-level migration scripts (`migrations/<version>/pre-migration.py` and `post-migration.py`). It does NOT cover full-database upgrades between major Odoo versions (that is [OCA/OpenUpgrade](https://github.com/OCA/OpenUpgrade)'s job).

---

## Step 1 — Understand the change

If `$1` is provided, use it as the description of the change. Otherwise, ask:

> "What schema change needs a migration script? Describe it in plain terms, for example:
> - 'Renamed field `partner_name` (Char) to `partner_id` (Many2one on res.partner)'
> - 'Added required field `company_type` with no default'
> - 'Renamed model `my.old.model` to `my.new.model`'
> - 'Renamed XML ID `my_module.old_action` to `my_module.new_action`'
> - 'Split field `full_name` into `first_name` + `last_name`'"

---

## Step 2 — Collect context

Before generating any code, ask for or confirm:

1. **Module name** — technical name (e.g. `my_module`)
2. **Current version in `__manifest__.py`** — the OLD version before this change
3. **New version** — what the version will be bumped to (e.g. if old is `19.0.1.0.0`, new is `19.0.1.1.0`)
4. **Odoo version** — 18 or 19
5. **openupgradelib available?** — ask: "Can you add `openupgradelib` to the module's dependencies? It gives cleaner helpers but is optional."

Do not generate code until you have all five answers.

---

## Step 3 — Classify the change

Classify the user's change into one or more of these categories:

| Category | pre needed? | post needed? |
|---|---|---|
| Field rename | ✅ pre | ❌ |
| Model rename | ✅ pre | ❌ |
| Add required field without default | ✅ pre | ❌ |
| Field type change (compatible, e.g. Char → Text) | ❌ | ✅ post |
| Field type change (incompatible, e.g. Char → Many2one) | ✅ pre (save data) | ✅ post (restore data) |
| XML ID rename | ❌ | ✅ post |
| Delete stale records | ❌ | ✅ post |
| Load updated noupdate XML | ❌ | ✅ post |
| Split one field into two | ✅ pre (copy data) | ✅ post (fill new fields) |
| Merge two fields into one | ✅ pre | ✅ post |
| Module rename | ✅ pre | ✅ post |

If the change is ambiguous, explain the classification and ask for confirmation before writing code.

---

## Step 4 — Generate the scripts

Create the following files. Only generate files that are actually needed.

### Directory structure to create:

```
<module_name>/
└── migrations/
    └── <new_version>/
        ├── pre-migration.py    (if needed)
        └── post-migration.py   (if needed)
```

### Script rules:

1. **Always include the `if not version: return` guard** — prevents running on fresh installs.
2. **Use `openupgradelib` if available** — it handles edge cases (Many2many tables, translations, etc.) better than raw SQL.
3. **Use raw SQL in `pre-migration.py`** when accessing data before ORM schema is updated.
4. **Prefer ORM in `post-migration.py`** — the schema is stable by then. Use raw SQL in post only for performance-critical bulk updates where ORM overhead is prohibitive (e.g. updating 100k+ records).
5. **Never call `env.cr.commit()`** inside a migration script.
6. **Always log what the script does** using `_logger = logging.getLogger(__name__)`.
7. **Add a `# TODO:` comment** for any value that cannot be automatically determined (e.g. how to resolve ambiguous Many2one lookups).

---

## Step 5 — Show the script output

Show each file with its full path. Use this format:

```
## Files to create

### migrations/<new_version>/pre-migration.py
<full file content>

### migrations/<new_version>/post-migration.py
<full file content>  (only if needed)
```

Then show the manifest version bump:

```
## __manifest__.py — version bump
'version': '<old_version>'  →  'version': '<new_version>'
```

---

## Step 6 — Manual review items

List anything that could not be automated:

```
## ⚠️ Manual review required

1. <item> — <reason> — <suggested action>
```

If everything was automated: `✅ No manual review items.`

---

## Step 7 — Verification commands

Always end with:

```
## Verify the migration

# Apply on test database
./odoo-bin -d testdb -u <module_name> --stop-after-init

# Check the result
./odoo-bin -d testdb --test-enable --stop-after-init -u <module_name>

# Inspect the table after pre-migration (before post-migration)
# Run with --stop-after-init right after a specific migration step if needed
psql testdb -c "\d <table_name>"

# Check for stale ir.model.data entries
psql testdb -c "SELECT name, res_id FROM ir_model_data WHERE module = '<module_name>'"
```

---

## Examples of generated output

### Example A: field rename (`partner_name` Char → keep as Char, just renamed to `contact_name`)

```python
# migrations/19.0.1.1.0/pre-migration.py
import logging
from openupgradelib import openupgrade

_logger = logging.getLogger(__name__)


@openupgrade.migrate()
def migrate(env, version):
    if not version:
        return
    _logger.info("my_module: renaming partner_name -> contact_name")
    openupgrade.rename_fields(
        env,
        [("my.model", "my_model", "partner_name", "contact_name")],
    )
```

### Example B: field type change (`state` Char → Selection)

```python
# migrations/19.0.1.1.0/pre-migration.py
import logging
from openupgradelib import openupgrade

_logger = logging.getLogger(__name__)


@openupgrade.migrate()
def migrate(env, version):
    if not version:
        return
    # Save old char values before ORM possibly changes the column type
    openupgrade.logged_query(
        env.cr,
        "ALTER TABLE my_model ADD COLUMN IF NOT EXISTS _migr_state VARCHAR",
    )
    openupgrade.logged_query(
        env.cr,
        "UPDATE my_model SET _migr_state = state WHERE state IS NOT NULL",
    )
```

```python
# migrations/19.0.1.1.0/post-migration.py
import logging
from openupgradelib import openupgrade

_logger = logging.getLogger(__name__)

# Map old free-text values to new selection keys
STATE_MAP = {
    "draft": "draft",
    "in progress": "in_progress",
    "done": "done",
    "cancelled": "cancel",
}


@openupgrade.migrate()
def migrate(env, version):
    if not version:
        return
    env.cr.execute("SELECT id, _migr_state FROM my_model WHERE _migr_state IS NOT NULL")
    for record_id, old_state in env.cr.fetchall():
        new_state = STATE_MAP.get(old_state)
        if new_state:
            env.cr.execute(
                "UPDATE my_model SET state = %s WHERE id = %s",
                (new_state, record_id),
            )
        else:
            _logger.warning(
                "my_module: unknown state value '%s' for record %s — set to 'draft'",
                old_state, record_id,
            )
            env.cr.execute(
                "UPDATE my_model SET state = 'draft' WHERE id = %s",
                (record_id,),
            )
    openupgrade.logged_query(
        env.cr, "ALTER TABLE my_model DROP COLUMN IF EXISTS _migr_state"
    )
```

### Example C: Char → Many2one (incompatible type change)

When a `Char` field that stored a user's name is changed to `Many2one(res.users)`,
the ORM drops and recreates the column. The old data must be saved first and then resolved.

```python
# migrations/19.0.1.1.0/pre-migration.py
import logging
from openupgradelib import openupgrade

_logger = logging.getLogger(__name__)


@openupgrade.migrate()
def migrate(env, version):
    if not version:
        return
    # Save old char values BEFORE ORM drops the column and recreates as INTEGER
    openupgrade.logged_query(
        env.cr,
        "ALTER TABLE my_model ADD COLUMN IF NOT EXISTS _migr_responsible VARCHAR",
    )
    openupgrade.logged_query(
        env.cr,
        "UPDATE my_model SET _migr_responsible = responsible WHERE responsible IS NOT NULL",
    )
```

```python
# migrations/19.0.1.1.0/post-migration.py
import logging
from openupgradelib import openupgrade

_logger = logging.getLogger(__name__)


@openupgrade.migrate()
def migrate(env, version):
    if not version:
        return
    # After ORM created the new Many2one (INTEGER) column, restore values by lookup
    env.cr.execute("SELECT id, _migr_responsible FROM my_model WHERE _migr_responsible IS NOT NULL")
    for record_id, old_name in env.cr.fetchall():
        user = env['res.users'].search([('name', '=', old_name)], limit=1)
        if user:
            env.cr.execute(
                "UPDATE my_model SET responsible = %s WHERE id = %s",
                (user.id, record_id),
            )
        else:
            _logger.warning(
                "my_module migration: could not resolve responsible '%s' for record %s — left NULL",
                old_name, record_id,
            )
            # TODO: manual review — check these records after migration
    # Clean up temp column
    openupgrade.logged_query(
        env.cr, "ALTER TABLE my_model DROP COLUMN IF EXISTS _migr_responsible"
    )
```

### Example D: XML ID rename

```python
# migrations/19.0.1.1.0/post-migration.py
import logging
from openupgradelib import openupgrade

_logger = logging.getLogger(__name__)


@openupgrade.migrate()
def migrate(env, version):
    if not version:
        return
    openupgrade.rename_xmlids(
        env.cr,
        [
            ("my_module.old_action_name", "my_module.new_action_name"),
            ("my_module.old_menu_item", "my_module.new_menu_item"),
        ],
    )
```
