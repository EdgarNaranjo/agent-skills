# OWL Patterns for Odoo 18/19 — Advanced Reference

> **Audience:** Backend Odoo developers who write frontend code occasionally.  
> **Assumption:** You know Python/Odoo well. You know OWL moderately.  
> **Goal:** Get the hard/underdocumented stuff right the first time.

---

## 1. `patch()` — Extending Existing Odoo Components

This is the single most-used pattern when customizing Odoo frontend. It lets you extend or override methods on existing components without replacing them entirely.

### Import

```javascript
import { patch } from "@web/core/utils/patch";
```

### Basic Pattern

```javascript
import { patch } from "@web/core/utils/patch";
import { FormController } from "@web/views/form/form_controller";

patch(FormController.prototype, {
    setup() {
        super.setup(...arguments);
        // your additions — runs AFTER original setup
        this.myCustomState = useState({ dirty: false });
    },

    async beforeLeave() {
        // runs before the user navigates away from the form
        if (this.myCustomState.dirty) {
            console.warn("Custom: unsaved changes detected");
        }
        return super.beforeLeave(...arguments);  // always call super
    },
});
```

> `patch()` returns an unpatch function. In tests, call it to restore the original.

### Real Example: Patching `ListRenderer` to Highlight Rows

```javascript
import { patch } from "@web/core/utils/patch";
import { ListRenderer } from "@web/views/list/list_renderer";

patch(ListRenderer.prototype, {
    getRowClass(record) {
        const base = super.getRowClass(record);
        if (record.data.state === "cancel") {
            return base + " text-muted o_row_cancelled";
        }
        return base;
    },
});
```

### Calling the Original Method (the `_super` equivalent)

OWL 2 uses native `super`. The pattern is:

```javascript
patch(SomeComponent.prototype, {
    myMethod(...args) {
        const result = super.myMethod(...args);
        // do your thing
        return result;
    },
});
```

There is **no `_super` variable** like in Odoo's legacy JS. Use `super` directly.

### `patch()` vs Inheriting a New Component

| Situation | Use |
|---|---|
| You want to modify behavior of an existing view/widget everywhere | `patch()` |
| You want a new widget that builds on an existing one | Extend with `class MyWidget extends ExistingWidget` |
| You only need to override in one specific view | XML `t-component` override in the view arch |
| You need to conditionally apply changes | `patch()` with runtime guard inside the method |

### Test Cleanup

```javascript
// in a test file
const unpatch = patch(FormController.prototype, { ... });
// ... test body ...
unpatch(); // restore original
```

---

## 2. Custom Field Widgets

### Key Facts (v18/v19)

- Base class is `Component` from `@odoo/owl` — **not** `AbstractField` (that's v16, gone)
- Register in `registry.category("fields")`
- The component receives standardized props from the view framework

### Props Received by a Field Widget

```javascript
// props injected by the view framework:
{
    record: Object,      // DataPoint — the record being displayed
    name: String,        // field name, e.g. "partner_id"
    readonly: Boolean,   // computed from view mode + field attrs
    required: Boolean,
    invisible: Boolean,
    decorations: Object, // decoration classes if any
}
```

### Reading and Writing Field Values

```javascript
// READ
const value = this.props.record.data[this.props.name];

// WRITE — always go through record.update(), never mutate directly
await this.props.record.update({ [this.props.name]: newValue });
```

### Minimal Real Example: Color Picker for a Char Field

**`static/src/js/color_picker_field.js`**

```javascript
import { Component } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { standardFieldProps } from "@web/views/fields/standard_field_props";

const COLORS = ["#FF5733", "#33FF57", "#3357FF", "#F3FF33", "#FF33F3"];

export class ColorPickerField extends Component {
    static template = "my_module.ColorPickerField";
    static props = {
        ...standardFieldProps,
    };

    get currentColor() {
        return this.props.record.data[this.props.name] || "#FFFFFF";
    }

    async onColorClick(color) {
        if (!this.props.readonly) {
            await this.props.record.update({ [this.props.name]: color });
        }
    }

    getColors() {
        return COLORS;
    }
}

registry.category("fields").add("color_picker", ColorPickerField);
```

**`static/src/xml/color_picker_field.xml`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<templates xml:space="preserve">
    <t t-name="my_module.ColorPickerField">
        <div class="o_color_picker_field d-flex gap-1">
            <t t-foreach="getColors()" t-as="color" t-key="color">
                <div
                    class="o_color_swatch rounded"
                    t-att-style="'background-color:' + color + ';width:24px;height:24px;cursor:pointer;'"
                    t-att-class="{ 'border border-2 border-dark': color === currentColor }"
                    t-on-click="() => onColorClick(color)"
                />
            </t>
            <span t-if="props.readonly" t-esc="currentColor" class="ms-2 text-muted small"/>
        </div>
    </t>
</templates>
```

**Usage in a view arch:**

```xml
<field name="color_code" widget="color_picker"/>
```

### Declaring `standardFieldProps`

Always spread `standardFieldProps` in your `static props` — it satisfies OWL's prop validation for all the standard injected props:

```javascript
import { standardFieldProps } from "@web/views/fields/standard_field_props";

static props = {
    ...standardFieldProps,
    // your own extra props here
    extraOption: { type: String, optional: true },
};
```

---

## 3. The Registry System

Odoo's frontend is wired together through a central registry. You add to it; the framework reads from it.

### Import

```javascript
import { registry } from "@web/core/registry";
```

### Key Categories

```javascript
// Field widgets — referenced by widget="..." in view arch
registry.category("fields").add("my_widget", MyWidgetComponent);

// View types — full custom views (kanban, list, form, etc.)
registry.category("views").add("my_view_type", {
    type: "my_view_type",
    display_name: "My View",
    icon: "fa fa-bars",
    multiRecord: true,
    Controller: MyViewController,
    Renderer: MyViewRenderer,
    Model: MyViewModel,
    ControlPanel: standardControlPanel,
});

// Action handlers — called when doAction() is triggered with type matching
registry.category("actions").add("my_action_type", MyActionComponent);

// Services — available via useService("my_service")
registry.category("services").add("my_service", {
    name: "my_service",
    start(env, deps) {
        return {
            doSomething() { /* ... */ },
        };
    },
});
```

### Extending an Existing Registry Entry

To wrap/extend an existing field widget (e.g., add behavior to `many2one`):

```javascript
import { registry } from "@web/core/registry";
import { Many2OneField } from "@web/views/fields/many2one/many2one_field";

class ExtendedMany2One extends Many2OneField {
    static template = "my_module.ExtendedMany2One";

    get displayName() {
        const base = super.displayName;
        return base ? `⭐ ${base}` : base;
    }
}

registry.category("fields").add("extended_many2one", ExtendedMany2One);
```

---

## 4. Key Services via `useService()`

### Import

```javascript
import { useService } from "@web/core/utils/hooks";
```

All services are called inside `setup()`:

```javascript
setup() {
    this.orm         = useService("orm");
    this.notification = useService("notification");
    this.action      = useService("action");
    this.dialog      = useService("dialog");
    this.rpc         = useService("rpc");
}
```

---

### `orm` — Call Model Methods

```javascript
// Call a Python method on a model
const result = await this.orm.call(
    "sale.order",              // model
    "action_confirm",          // method
    [[this.props.record.resId]], // args: list of ids
    {}                         // kwargs (optional)
);

// Read records
const records = await this.orm.read("res.partner", [1, 2, 3], ["name", "email"]);

// Search
const ids = await this.orm.search("res.partner", [["is_company", "=", true]]);

// search_read
const data = await this.orm.searchRead(
    "product.product",
    [["active", "=", true]],
    ["name", "list_price"],
    { limit: 10, order: "name asc" }
);
```

---

### `notification` — Show Toasts

```javascript
// Success
this.notification.add("Order confirmed!", { type: "success" });

// Warning
this.notification.add("Check the delivery date.", { type: "warning" });

// Error
this.notification.add("Something went wrong.", { type: "danger" });

// With title and sticky
this.notification.add("Please review before continuing.", {
    title: "Action Required",
    type: "warning",
    sticky: true,
});
```

---

### `action` — Navigate / Execute Actions

```javascript
// Open a named action (XML id)
await this.action.doAction("sale.action_quotations_with_onboarding");

// Open an action by object (e.g. returned from orm.call)
const action = await this.orm.call("sale.order", "action_confirm", [[id]]);
await this.action.doAction(action);

// Open a record form view directly
await this.action.doAction({
    type: "ir.actions.act_window",
    res_model: "sale.order",
    res_id: 42,
    views: [[false, "form"]],
    target: "current",
});

// Go back
await this.action.doAction({ type: "ir.actions.act_window_close" });
```

---

### `dialog` — Open Confirmation Dialogs

```javascript
import { ConfirmationDialog } from "@web/core/confirmation_dialog/confirmation_dialog";

// In a method:
this.dialog.add(ConfirmationDialog, {
    title: "Delete Record",
    body: "Are you sure you want to delete this record? This cannot be undone.",
    confirm: async () => {
        await this.orm.unlink("sale.order", [this.props.record.resId]);
        this.notification.add("Record deleted.", { type: "success" });
        await this.action.doAction({ type: "ir.actions.act_window_close" });
    },
    cancel: () => {},
});
```

Opening a **custom dialog**:

```javascript
import { Dialog } from "@web/core/dialog/dialog";

this.dialog.add(MyCustomDialogComponent, {
    // props passed to your dialog component
    orderId: this.props.record.resId,
    onSave: (data) => { /* handle result */ },
});
```

---

### `rpc` — Direct JSON-RPC Calls

Use `orm` for model methods. Use `rpc` only for custom controllers or non-model endpoints:

```javascript
// Call a custom Python controller route
const result = await this.rpc("/my_module/custom_endpoint", {
    order_id: this.props.record.resId,
    extra_param: "value",
});
```

Python side:

```python
from odoo import http
from odoo.http import request

class MyController(http.Controller):
    @http.route("/my_module/custom_endpoint", type="json", auth="user")
    def custom_endpoint(self, order_id, extra_param=None):
        order = request.env["sale.order"].browse(order_id)
        return {"status": order.state}
```

---

## 5. Asset Declaration in Manifest (v18/v19)

### `__manifest__.py` — Primary Method

```python
"assets": {
    # Backend (web client)
    "web.assets_backend": [
        "my_module/static/src/js/my_component.js",
        "my_module/static/src/xml/my_component.xml",
        "my_module/static/src/scss/my_style.scss",
    ],
    # Frontend (website/portal)
    "web.assets_frontend": [
        "my_module/static/src/js/frontend_widget.js",
        "my_module/static/src/scss/frontend.scss",
    ],
    # Shared between backend and frontend
    "web.assets_common": [
        "my_module/static/src/js/shared_utils.js",
    ],
},
```

### Inserting at a Specific Position

```python
"assets": {
    "web.assets_backend": [
        # Insert BEFORE another file
        ("before", "web/static/src/views/form/form_controller.js",
         "my_module/static/src/js/patch_form_controller.js"),

        # Insert AFTER another file
        ("after", "web/static/src/core/registry.js",
         "my_module/static/src/js/my_registrations.js"),

        # Remove a file (rarely needed)
        ("remove", "some_module/static/src/js/unwanted.js"),
    ],
},
```

### Alternative: XML `ir.asset` Record

```xml
<record id="my_module_assets" model="ir.asset">
    <field name="name">My Module - Backend Assets</field>
    <field name="bundle">web.assets_backend</field>
    <field name="path">my_module/static/src/js/my_component.js</field>
</record>
```

> Use `ir.asset` only when you need dynamic/conditional asset loading. For normal modules, the manifest `assets` key is simpler and preferred.

---

## 6. Component File Structure

### Standard Layout

```
my_module/
└── static/
    └── src/
        ├── js/
        │   ├── my_component.js          # Component class + registry
        │   └── patch_form_controller.js # Patches go in separate files
        ├── xml/
        │   └── my_component.xml         # QWeb template
        └── scss/
            └── my_component.scss        # Scoped styles
```

### Minimal Working Component

**`static/src/js/my_component.js`**

```javascript
import { Component, useState } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import { standardFieldProps } from "@web/views/fields/standard_field_props";

export class MyComponent extends Component {
    static template = "my_module.MyComponent";   // must match XML t-name exactly
    static props = {
        ...standardFieldProps,
    };

    setup() {
        this.orm = useService("orm");
        this.notification = useService("notification");
        this.state = useState({
            loading: false,
        });
    }

    get fieldValue() {
        return this.props.record.data[this.props.name];
    }

    async onButtonClick() {
        this.state.loading = true;
        try {
            await this.props.record.update({ [this.props.name]: "updated" });
            this.notification.add("Updated!", { type: "success" });
        } finally {
            this.state.loading = false;
        }
    }
}

registry.category("fields").add("my_component", MyComponent);
```

**`static/src/xml/my_component.xml`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<templates xml:space="preserve">
    <t t-name="my_module.MyComponent">
        <div class="o_my_component d-flex align-items-center gap-2">
            <span t-esc="fieldValue" class="fw-bold"/>
            <button
                class="btn btn-sm btn-primary"
                t-att-disabled="state.loading || props.readonly"
                t-on-click="onButtonClick"
            >
                <t t-if="state.loading">
                    <i class="fa fa-spinner fa-spin me-1"/>
                </t>
                Update
            </button>
        </div>
    </t>
</templates>
```

**`__manifest__.py` (relevant section)**

```python
"assets": {
    "web.assets_backend": [
        "my_module/static/src/js/my_component.js",
        "my_module/static/src/xml/my_component.xml",
    ],
},
```

**Usage in view:**

```xml
<field name="my_char_field" widget="my_component"/>
```

---

## 7. Common Mistakes with OWL in Odoo

| Mistake | Wrong | Correct |
|---|---|---|
| Importing OWL from global | `owl.Component` | `import { Component } from "@odoo/owl"` |
| Wrong OWL 1 lifecycle hooks | `mounted() {}` | `onMounted(() => { ... })` inside `setup()` |
| Wrong OWL 1 lifecycle hooks | `willUnmount() {}` | `onWillUnmount(() => { ... })` inside `setup()` |
| Template name mismatch | `static template = "MyComponent"` | `static template = "my_module.MyComponent"` |
| Forgetting `static template` | *(no template declared)* | Always declare `static template = "..."` |
| Mutating props directly | `this.props.record.data.name = "x"` | `await this.props.record.update({ name: "x" })` |
| Forgetting `await` on ORM calls | `this.orm.call(...)` | `await this.orm.call(...)` |
| Watching reactive state wrong | `this.state = { count: 0 }` | `this.state = useState({ count: 0 })` |
| Using old AbstractField | `class X extends AbstractField` | `class X extends Component` |
| Files not in manifest | *(file exists but not declared)* | Add path to `web.assets_backend` in manifest |
| Calling `useService` outside `setup` | In a method: `useService("orm")` | Call only inside `setup()`, assign to `this` |
| Modifying registry after load | Calling `.add()` outside module scope | Always call `.add()` at module top level |

### OWL 1 vs OWL 2 Lifecycle — Quick Map

| OWL 1 (Odoo ≤16) | OWL 2 (Odoo 17+) |
|---|---|
| `mounted()` | `onMounted(() => {})` |
| `willUnmount()` | `onWillUnmount(() => {})` |
| `willUpdateProps(nextProps)` | `onWillUpdateProps((nextProps) => {})` |
| `patched()` | `onPatched(() => {})` |
| `willPatch()` | `onWillPatch(() => {})` |
| `willStart()` | `onWillStart(async () => {})` |

All these hooks are imported from `@odoo/owl`:

```javascript
import { Component, useState, useRef, onMounted, onWillUnmount } from "@odoo/owl";

export class MyComponent extends Component {
    setup() {
        this.containerRef = useRef("container");

        onMounted(() => {
            // DOM is ready, this.containerRef.el is available
            console.log("mounted", this.containerRef.el);
        });

        onWillUnmount(() => {
            // cleanup — remove event listeners, timers, etc.
        });
    }
}
```

---

## Quick Reference: Most Common Imports

```javascript
// OWL core
import { Component, useState, useRef, useEffect,
         onMounted, onWillUnmount, onWillUpdateProps } from "@odoo/owl";

// Odoo utilities
import { registry } from "@web/core/registry";
import { patch } from "@web/core/utils/patch";
import { useService } from "@web/core/utils/hooks";

// Field widget base props
import { standardFieldProps } from "@web/views/fields/standard_field_props";

// Common dialogs
import { ConfirmationDialog } from "@web/core/confirmation_dialog/confirmation_dialog";
import { Dialog } from "@web/core/dialog/dialog";

// Common components from Odoo
import { FormController } from "@web/views/form/form_controller";
import { ListRenderer } from "@web/views/list/list_renderer";
import { KanbanRenderer } from "@web/views/kanban/kanban_renderer";
```
