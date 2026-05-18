---
description: Add a scheduled action (ir.cron) with its Python method to the current module
argument-hint: "<cron_name>"
---

You are generating a complete Odoo scheduled action (ir.cron) with the accompanying Python method.

The cron name (in snake_case) is: **$1**

---

## Step 1 — Gather requirements

Before generating any files, ask the user these questions in a single message:

1. **Odoo version** — 18 or 19?
2. **Module name** — e.g. `my_module` (the technical name)
3. **Target model** — which model should have the `_cron_$1` method?
   - Provide an existing model name (e.g. `sale.order`, `my.custom.model`), OR
   - Say "create a new model" and describe what it should represent.
4. **What should the cron do?** — a plain-language description of its purpose.
   This drives the method body and the cron record's human-readable name.
5. **Default interval** — how often should it run by default?
   - Options: every N minutes / hours / daily / weekly / monthly

Wait for all answers before generating.

---

## Step 2 — Add the Python method to the model

Open the appropriate model file (e.g. `models/<model_name>.py`) and add the
following **at class level** (not inside `__init__` or `create`):

```python
# ── Scheduled action ────────────────────────────────────────────────────────

@api.model
def _cron_$1(self):
    """Scheduled action: <description from user>.

    Called by ir.cron. Handles its own exceptions to avoid blocking the
    Odoo scheduler — an unhandled exception here would prevent ALL other
    scheduled actions from running.
    """
    _logger = logging.getLogger(__name__)
    try:
        # ── Find the records to process ─────────────────────────────────
        # Adapt the domain to the real business logic.
        records = self.search([
            ('state', '=', 'draft'),
            # ('active', '=', True),  # usually implicit — see note below
        ])

        if not records:
            _logger.info("_cron_$1: no records to process, exiting early")
            return

        # ── Process each record ─────────────────────────────────────────
        processed = 0
        for record in records:
            try:
                # Replace with the real business logic
                # record.action_confirm()
                # record.write({'cron_processed': True})
                processed += 1
            except Exception as record_err:
                # Log per-record errors but continue with the rest
                _logger.error(
                    "_cron_$1: failed on record %s (%d): %s",
                    record.name if hasattr(record, 'name') else '?',
                    record.id,
                    str(record_err),
                )

        _logger.info("_cron_$1: processed %d / %d records", processed, len(records))

    except Exception as e:
        _logger.error("_cron_$1: unexpected error: %s", str(e))
        # Do NOT re-raise — let the scheduler continue with other crons.
```

**Ensure `logging` is imported** at the top of the file (add if missing):
```python
import logging
```

> **Why `@api.model`?**
> Cron methods are called by Odoo as `model._cron_$1()` with no specific
> recordset in context. `@api.model` makes `self` the model class, not an
> empty recordset, which is the correct contract for cron entry points.

---

## Step 3 — Generate `data/cron_$1.xml`

Create the file `data/cron_$1.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<odoo>
    <data noupdate="1">
        <!--
            noupdate="1" means Odoo will NOT overwrite this record when the
            module is upgraded — preserving any interval changes made in the UI.
            Remove noupdate if you want upgrades to reset the schedule.
        -->

        <record id="ir_cron_$1" model="ir.cron">
            <!-- Human-readable name shown in Settings > Scheduled Actions -->
            <field name="name"><Module>: <Description of what it does></field>

            <!--
                model_id: always use the auto-generated XML ID.
                Pattern: model_<model_name_with_underscores>
                Example: sale.order  →  model_sale_order
                         my.custom.model  →  model_my_custom_model
            -->
            <field name="model_id" ref="model_<model_name>"/>

            <!-- state="code" means Odoo evaluates the "code" field below -->
            <field name="state">code</field>

            <!--
                "model" here refers to the model instance inside the cron runner.
                Call your method exactly as shown — no arguments.
            -->
            <field name="code">model._cron_$1()</field>

            <!-- ── Schedule ─────────────────────────────────────────── -->
            <!--
                interval_type options: minutes | hours | days | weeks | months
                Set interval_number + interval_type to match the user's choice.
            -->
            <field name="interval_number">1</field>
            <field name="interval_type">days</field>

            <!--
                numbercall: how many times to run total.
                -1 = run forever (recommended for production crons).
                 N = run exactly N times then deactivate.
            -->
            <field name="numbercall">-1</field>

            <!-- active: set to False to ship the cron disabled by default -->
            <field name="active">True</field>

            <!--
                user_id: the user context for the cron.
                base.user_root (OdooBot) is standard.
                Change to a specific user if you need record rules / groups.
            -->
            <field name="user_id" ref="base.user_root"/>
        </record>

    </data>
</odoo>
```

Fill in the interval based on the user's answer:

| User choice | `interval_number` | `interval_type` |
|-------------|-------------------|-----------------|
| Every N minutes | N | `minutes`  |
| Hourly          | 1 | `hours`    |
| Every N hours   | N | `hours`    |
| Daily           | 1 | `days`     |
| Weekly          | 1 | `weeks`    |
| Monthly         | 1 | `months`   |

---

## Step 4 — Update `__manifest__.py`

Add the cron XML file to the `data` list. Cron files belong **after security
files** and **before view files** (they have no dependency on views):

```python
'data': [
    'security/ir.model.access.csv',  # security first
    'data/cron_$1.xml',              # data/crons before views
    'views/my_model_views.xml',      # views last
],
```

Show the user the exact line to add, with context from their current manifest.

---

## Step 5 — Testing instructions

After generating, show the user how to test the cron in three ways:

### 5A — Odoo shell (fastest, recommended during development)

```bash
# Start the interactive shell
python odoo-bin shell -d <database_name>

# Call the cron method directly — same as the scheduler would
env['<model.name>']._cron_$1()

# Commit the transaction if you want changes to persist
env.cr.commit()
```

### 5B — Odoo UI — trigger manually

1. Activate developer mode (Settings → General Settings → Developer Tools).
2. Go to **Settings > Technical > Automation > Scheduled Actions**.
3. Search for `<cron name>`.
4. Open the record and click **▶ Run Manually**.
5. Check the logs (Settings > Technical > Logging or server console) for
   `_cron_$1` log lines.

### 5C — Temporarily shorten the interval for testing

In the Scheduled Actions UI, temporarily set the interval to 1 minute and
`Next Execution Date` to now. Remember to restore it afterward.

---

## Step 6 — Critical warnings (always include these)

After generating the files, append this warning block verbatim:

---

### ⚠️ Cron method rules — do not skip

**1. Always catch exceptions inside the cron method.**

An unhandled exception in a cron method causes the Odoo scheduler to mark that
cron as failed and — in some Odoo versions — skip ALL subsequent crons in the
same scheduler run. The try/except pattern in the generated code is mandatory,
not optional.

```python
# ❌ Wrong — exception propagates, breaks the scheduler
@api.model
def _cron_$1(self):
    records = self.search([...])
    records.do_something()  # if this raises, scheduler stops here

# ✅ Correct — exception is caught and logged
@api.model
def _cron_$1(self):
    try:
        records = self.search([...])
        records.do_something()
    except Exception as e:
        logging.getLogger(__name__).error("_cron_$1 failed: %s", e)
```

**2. Never call `self.env.cr.commit()` inside a cron.**

Odoo's scheduler manages the transaction. A manual commit inside a cron:
- Prevents rollback if something fails later in the same run.
- Can cause partial data corruption.
- Is never necessary — the scheduler commits for you.

```python
# ❌ NEVER do this inside a cron
self.env.cr.commit()
```

**3. Use `with_context(active_test=False)` only when you need archived records.**

By default `self.search([])` applies `('active', '=', True)` automatically
(for models with an `active` field). If you genuinely need to process archived
records, be explicit:

```python
records = self.with_context(active_test=False).search([('state', '=', 'cancel')])
```

**4. Test with small batches before enabling on large datasets.**

Before activating the cron in production:
```python
# In the shell — limit to 5 records to validate logic
env['<model.name>'].search([('state', '=', 'draft')], limit=5)._cron_$1()
```

Then check the logs and the data before running without a limit.

**5. `noupdate="1"` in the XML means interval changes survive upgrades.**

With `noupdate="1"`, any schedule changes made via the UI will not be
overwritten when the module is upgraded. This is almost always what you want
in production. If you need the upgrade to reset the schedule (e.g. you changed
the default interval in the XML), temporarily remove `noupdate` for one
upgrade, then add it back.

---

## Odoo version-specific notes

| Topic                              | Odoo 18                        | Odoo 19                            |
|------------------------------------|--------------------------------|------------------------------------|
| `@api.model` on cron methods       | Required                       | Required                           |
| `ir.cron` model structure          | Unchanged                      | Unchanged                          |
| `model_id` auto XML ID pattern     | `model_<name>`                 | `model_<name>`                     |
| Scheduler runner                   | Single-threaded per DB         | Single-threaded per DB             |
| Exception isolation between crons  | Best-effort                    | Improved in 19 (check release notes)|

For Odoo 19, also check if the server is configured with `--max-cron-threads`
— setting this to 0 disables the cron runner entirely (useful in worker-only
deployments where a separate cron process is used).
