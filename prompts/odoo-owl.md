---
description: Add an OWL 2 component (field widget, standalone component, or service) to the current Odoo module
argument-hint: "<component_name>"
---

# OWL 2 Component Generator — Odoo 18/19

You are generating a production-ready OWL 2 component for Odoo 18/19.

Component requested: **$1**

---

## Step 1 — Gather requirements

Before generating any code, ask the following questions (all at once, in one message):

1. **Odoo version** — 18 or 19?
2. **Module name** — e.g. `my_module` (the technical name used in `__manifest__.py`)
3. **Component name** — provide both forms:
   - `snake_case` for filenames and registry key (e.g. `status_badge`)
   - `PascalCase` for the JS class name (e.g. `StatusBadge`)
4. **Component type** — which one?
   - **`field_widget`** — replaces or extends how a field is displayed in form/list views; referenced via `widget="..."` in XML view arch
   - **`standalone`** — reusable component not tied to a specific field; embedded via `t-component` or used inside another component
   - **`service`** — shared logic accessible from any component via `useService("...")`
5. **For `field_widget` only** — which field type(s) does it support? (e.g. `char`, `integer`, `many2one`, `selection`, `boolean`, `date`, `many2many`)
6. **RPC calls needed?** — Does the component need to call the backend? (yes/no). If yes: via `orm` (model methods) or `rpc` (custom controller route)?
7. **Tour test needed?** — Generate a UI tour test using `HttpCase`? (yes/no — recommended for all field widgets and standalone components with user interaction)

---

## Step 2 — Generate files

Use the answers from Step 1. Apply the correct template below.

---

### Template: `field_widget`

**`static/src/components/<name>/<name>.js`**

```javascript
import { Component, useState } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import { standardFieldProps } from "@web/views/fields/standard_field_props";

export class <PascalName> extends Component {
    static template = "<module>.<PascalName>";
    static props = {
        ...standardFieldProps,
        // add extra props here if needed
    };

    setup() {
        // All hooks and service calls go here
        this.orm = useService("orm");
        this.notification = useService("notification");
        this.state = useState({ loading: false });
    }

    get value() {
        return this.props.record.data[this.props.name];
    }

    async onChange(newValue) {
        if (this.props.readonly) return;
        await this.props.record.update({ [this.props.name]: newValue });
    }
}

registry.category("fields").add("<snake_name>", {
    component: <PascalName>,
    supportedTypes: [/* e.g. "char", "selection" */],
});
```

**`static/src/components/<name>/<name>.xml`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<templates xml:space="preserve">
    <t t-name="<module>.<PascalName>">
        <div class="o_<snake_name>">
            <!-- Edit mode -->
            <t t-if="!props.readonly">
                <!-- interactive control here -->
            </t>
            <!-- Readonly mode -->
            <t t-else="">
                <span t-esc="value"/>
            </t>
        </div>
    </t>
</templates>
```

**Usage in a view arch:**

```xml
<field name="your_field_name" widget="<snake_name>"/>
```

---

### Template: `standalone`

**`static/src/components/<name>/<name>.js`**

```javascript
import { Component, useState, onMounted } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";

export class <PascalName> extends Component {
    static template = "<module>.<PascalName>";
    static props = {
        // declare all expected props with types
        // example: recordId: { type: Number },
    };

    setup() {
        this.orm = useService("orm");
        this.notification = useService("notification");
        this.state = useState({ loading: false, data: null });

        onMounted(async () => {
            await this.loadData();
        });
    }

    async loadData() {
        this.state.loading = true;
        try {
            // example ORM call — adapt to your model/fields
            const records = await this.orm.searchRead(
                "your.model",
                [],
                ["name"],
                { limit: 10 }
            );
            this.state.data = records;
        } finally {
            this.state.loading = false;
        }
    }
}

// Optionally register as a reusable component
// registry.category("components").add("<snake_name>", <PascalName>);
```

**`static/src/components/<name>/<name>.xml`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<templates xml:space="preserve">
    <t t-name="<module>.<PascalName>">
        <div class="o_<snake_name>">
            <t t-if="state.loading">
                <i class="fa fa-spinner fa-spin"/>
            </t>
            <t t-elif="state.data">
                <t t-foreach="state.data" t-as="item" t-key="item.id">
                    <div t-esc="item.name"/>
                </t>
            </t>
        </div>
    </t>
</templates>
```

---

### Template: `service`

**`static/src/services/<name>.js`**

```javascript
import { registry } from "@web/core/registry";

const <camelName>Service = {
    dependencies: ["notification", "rpc", "orm"],

    start(env, { notification, rpc, orm }) {

        async function doSomething(recordId) {
            // Example: call a custom controller endpoint
            const result = await rpc("/<module>/api/action", { record_id: recordId });
            notification.add("Done!", { type: "success" });
            return result;
        }

        async function fetchData(domain = []) {
            return await orm.searchRead(
                "your.model",
                domain,
                ["name"],
            );
        }

        return { doSomething, fetchData };
    },
};

registry.category("services").add("<snake_name>", <camelName>Service);
```

**Consuming the service in any component:**

```javascript
import { useService } from "@web/core/utils/hooks";

export class MyComponent extends Component {
    setup() {
        this.<camelName> = useService("<snake_name>");
    }

    async handleAction() {
        const result = await this.<camelName>.doSomething(this.props.record.resId);
    }
}
```

---

### Template: Tour test (when tour test = yes)

**`static/src/tours/<name>_tour.js`**

```javascript
import { registry } from "@web/core/registry";

registry.category("web_tour.tours").add("<snake_name>_tour", {
    url: "/web",
    steps: () => [
        {
            trigger: ".o_app[data-menu-xmlid='<module>.menu_root']",
            content: "Open <module>",
            run: "click",
        },
        {
            trigger: ".o_<snake_name>",
            content: "Component is visible",
        },
        // Add steps that exercise the component's interactive behavior
    ],
});
```

**`tests/test_<name>_tour.py`**

```python
from odoo.tests import HttpCase, tagged


@tagged("post_install", "-at_install")
class Test<PascalName>Tour(HttpCase):

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        # Create any test records needed for the tour here

    def test_<snake_name>_tour(self):
        self.start_tour("/web", "<snake_name>_tour", login="admin")
```

---

## Step 3 — Asset declaration

Always show the exact lines to add to `__manifest__.py`. Adapt paths to the module name and file locations.

**For `field_widget` or `standalone`:**

```python
"assets": {
    "web.assets_backend": [
        "<module>/static/src/components/<name>/<name>.js",
        "<module>/static/src/components/<name>/<name>.xml",
    ],
},
```

**For `service`:**

```python
"assets": {
    "web.assets_backend": [
        "<module>/static/src/services/<name>.js",
    ],
},
```

**If tour test was generated, also add:**

```python
"web.assets_tests": [
    "<module>/static/src/tours/<name>_tour.js",
],
```

> ⚠️ **Order matters**: JS files that reference a template must come before (or alongside) their XML file. When in doubt, list `.js` before `.xml`.

If `assets` already exists in the manifest, merge the new entries into the existing dict — do not duplicate the `"assets"` key.

---

## Step 4 — RPC patterns (only if RPC = yes)

### Via `orm` (model methods — preferred)

```javascript
// In setup():
this.orm = useService("orm");

// Call a Python @api.model or @api.multi method
const result = await this.orm.call(
    "your.model",
    "your_method_name",
    [[this.props.record.resId]],  // positional args
    { extra_kwarg: "value" }       // keyword args
);

// search_read
const records = await this.orm.searchRead(
    "your.model",
    [["state", "=", "active"]],
    ["name", "state"],
    { limit: 20, order: "name asc" }
);
```

### Via `rpc` (custom HTTP controller — only when `orm` is not enough)

```javascript
// In setup():
this.rpc = useService("rpc");

// Call a custom JSON-RPC route
const data = await this.rpc("/<module>/api/your_endpoint", {
    record_id: this.props.record.resId,
});
```

Python controller to pair with it:

```python
from odoo import http
from odoo.http import request

class <PascalName>Controller(http.Controller):

    @http.route("/<module>/api/your_endpoint", type="json", auth="user")
    def your_endpoint(self, record_id):
        record = request.env["your.model"].browse(record_id)
        return {"status": record.state, "name": record.name}
```

---

## Step 5 — OWL 2 checklist

Print this checklist after generating every component. Do not skip it.

```
## OWL 2 checklist

- [ ] Imports use `@odoo/owl` (not global `owl`)
- [ ] Lifecycle hooks (`onMounted`, `onWillUnmount`, etc.) are called inside `setup()` — not as class methods
- [ ] `useService()` calls are inside `setup()` only — not inside event handlers or async methods
- [ ] `static template` name matches the `t-name` in the XML exactly: `"<module>.<PascalName>"`
- [ ] Component registered in the correct registry category (`fields`, `services`, `components`)
- [ ] `registry.category(...).add(...)` called at module top level — not inside a function or class
- [ ] Files declared in `__manifest__.py` under `web.assets_backend` (and `web.assets_tests` for tours)
- [ ] Field values read via `this.props.record.data[this.props.name]` — never mutated directly
- [ ] Field values written via `await this.props.record.update({ [this.props.name]: newValue })`
- [ ] `standardFieldProps` spread into `static props` if it's a field widget
- [ ] Readonly mode handled: no interactive controls when `props.readonly === true`
- [ ] All ORM and RPC calls use `await`
- [ ] Reactive state uses `useState({...})` — not plain object assignment
- [ ] No `AbstractField` import (that's Odoo ≤16 — it does not exist in 18/19)
```

---

## Reference: common imports

```javascript
// OWL core
import { Component, useState, useRef, useEffect,
         onMounted, onWillUnmount, onWillUpdateProps } from "@odoo/owl";

// Odoo utilities
import { registry }            from "@web/core/registry";
import { patch }               from "@web/core/utils/patch";
import { useService }          from "@web/core/utils/hooks";

// Field widget base props
import { standardFieldProps }  from "@web/views/fields/standard_field_props";

// Common dialogs
import { ConfirmationDialog }  from "@web/core/confirmation_dialog/confirmation_dialog";
import { Dialog }              from "@web/core/dialog/dialog";

// Existing Odoo components (for patch() or extension)
import { FormController }      from "@web/views/form/form_controller";
import { ListRenderer }        from "@web/views/list/list_renderer";
import { KanbanRenderer }      from "@web/views/kanban/kanban_renderer";
```
