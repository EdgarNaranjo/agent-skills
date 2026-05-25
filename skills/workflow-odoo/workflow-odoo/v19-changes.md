# Odoo v18 → v19 Breaking Changes

Reference for migrating or developing modules targeting Odoo 19.

## Requirements

- **Python 3.12+** required (v18 required 3.10+)
- **PostgreSQL 15+** required
- **Node.js 18+** required (for assets compilation)

---

## ORM Changes

### `@api.model_create_multi` is now the only valid `create()` signature

In v18 `@api.model_create_multi` was strongly recommended. In v19 it is the only accepted override signature. Single-dict `create()` overrides are deprecated and will log warnings.

```python
# ❌ v18 still tolerated but v19 deprecated
@api.model
def create(self, vals):
    return super().create(vals)

# ✅ v19 required
@api.model_create_multi
def create(self, vals_list):
    for vals in vals_list:
        vals.setdefault("status", "draft")
    return super().create(vals_list)
```

### `name_get()` is deprecated — use `_compute_display_name()`

```python
# ❌ v18 and older
def name_get(self):
    return [(rec.id, f"[{rec.ref}] {rec.name}") for rec in self]

# ✅ v19
def _compute_display_name(self):
    for rec in self:
        rec.display_name = f"[{rec.ref}] {rec.name}"
```

### `read_group()` signature changed

```python
# ❌ v18 positional args
self.env["my.model"].read_group(domain, fields, groupby, offset=0, limit=None)

# ✅ v19 — all args after domain must be keyword
self.env["my.model"]._read_group(
    domain=[],
    groupby=["state"],
    aggregates=["id:count"],
)
```

---

## View Changes

### `<tree>` completely removed — only `<list>` accepted

```xml
<!-- ❌ removed in v19 -->
<tree>...</tree>

<!-- ✅ required -->
<list>...</list>
```

### `optional` attribute on list columns

```xml
<!-- v19: columns can be hidden by default but togglable by user -->
<list string="Orders">
    <field name="name"/>
    <field name="date_order" optional="show"/>
    <field name="note" optional="hide"/>  <!-- hidden by default, user can enable -->
</list>
```

### Form view `<header>` statusbar

```xml
<!-- v19: statusbar_visible replaces filter on selection -->
<header>
    <field name="state" widget="statusbar" statusbar_visible="draft,confirmed,done"/>
</header>
```

---

## JavaScript / OWL Changes

### OWL 2 — component lifecycle

```javascript
// ❌ v18 OWL 1 style (if still used)
class MyComponent extends owl.Component {
    mounted() { ... }
    willUnmount() { ... }
}

// ✅ v19 OWL 2
import { Component, onMounted, onWillUnmount } from "@odoo/owl";

class MyComponent extends Component {
    setup() {
        onMounted(() => { ... });
        onWillUnmount(() => { ... });
    }
}
```

### Module system: use `@odoo/owl` imports

```javascript
// ❌ old global owl reference
const { useState } = owl;

// ✅ v19
import { useState, useRef } from "@odoo/owl";
```

### Asset declaration: `<bundle>` tag (v19 new syntax)

```xml
<!-- v19: prefer <bundle> over xpath for simple asset additions -->
<odoo>
    <template id="my_assets" inherit_id="web.assets_backend">
        <bundle>
            <script src="/my_module/static/src/js/my_component.js"/>
            <link rel="stylesheet" href="/my_module/static/src/css/my_style.css"/>
        </bundle>
    </template>
</odoo>
```

---

## `ir.ui.menu` Changes

### `action` field now uses Many2one to `ir.actions` base model

```xml
<!-- v19: action binding simplified -->
<record id="menu_my_module" model="ir.ui.menu">
    <field name="name">My Module</field>
    <field name="action" ref="action_my_model"/>
</record>
```

---

## Domain Changes

### `domain` fields: always use list syntax, never string

```python
# ❌ string domains deprecated
domain = "[('state', '=', 'draft')]"

# ✅ list domains required
domain = [("state", "=", "draft")]
```

---

## `ir.rule` (Record Rules) Changes

### `domain_force` must be proper domain list

```xml
<record id="my_rule" model="ir.rule">
    <field name="name">My Rule</field>
    <field name="model_id" ref="model_my_model"/>
    <field name="domain_force">[('user_id', '=', user.id)]</field>
    <field name="groups" eval="[(4, ref('base.group_user'))]"/>
</record>
```

---

## Removed in v19

| Feature | Replacement |
|---------|-------------|
| `name_get()` override | `_compute_display_name()` |
| `<tree>` view tag | `<list>` |
| Positional `read_group()` | `_read_group()` with keyword args |
| `@api.model def create(self, vals)` | `@api.model_create_multi def create(self, vals_list)` |
| String domains | List domains |
| `owl.useState` (global) | `import { useState } from "@odoo/owl"` |

---

## Deprecation Warnings to Fix

Run Odoo with `--log-level=debug` and look for `DeprecationWarning` in logs. Common ones:

```
DeprecationWarning: name_get() is deprecated, use _compute_display_name() instead
DeprecationWarning: tree view tag is deprecated, use list instead
DeprecationWarning: Single-dict create() signature is deprecated
```
