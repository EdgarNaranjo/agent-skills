---
description: Add an HTTP controller with @route endpoints (backend, portal, or JSON-RPC) to the current module
argument-hint: "<controller_name>"
---

You are adding an HTTP controller to an existing Odoo module. The controller name is: **$1**

If `$1` is empty or not provided, ask: "What is the controller name in snake_case? (e.g. `portal_order`, `api_patient`, `backend_dashboard`)"

---

## Step 1 — Ask these questions before writing any code

Ask all at once in a single message:

1. **Odoo version:** 18 or 19?
2. **Module name:** What is the module folder name? (Only ask if not clear from context.)
3. **Route type:** Which type of routes does this controller need?
   - `backend` — authenticated backend pages (auth=user, type=http, returns HTML)
   - `portal` — customer-facing portal pages (auth=public, website=True, returns HTML)
   - `json-rpc` — AJAX/OWL calls from the frontend (type=json, auth=user)
   - `api` — external REST-like API with custom auth (type=json, auth=none, csrf=False)
   - Multiple types allowed — list all that apply.
4. **URL path prefix:** What prefix should the routes use? (e.g. `/hospital`, `/my_module`, `/fleet`)
5. **Main model:** Which Odoo model does this controller primarily read from or write to? (e.g. `sale.order`, `hospital.patient`)
6. **HTTP methods:** GET, POST, or both? (Applies to backend/portal routes — JSON-RPC always uses POST.)
7. **Portal ownership check?** (Only for `portal` type) Should the controller verify that the logged-in portal user owns the record? yes / no

Wait for the user's answers before generating any code.

---

## Step 2 — Derive naming conventions from `$1`

Given the controller name in snake_case (e.g. `portal_order`), derive:

- **Python class name:** CamelCase + `Controller` suffix (e.g. `PortalOrderController`)
- **Python filename:** `controllers/$1.py`
- **Test filename:** `tests/test_controller_$1.py`
- **URL prefix:** as provided by the user (e.g. `/hospital`)

---

## Step 3 — Generate the controller file

Apply **version-correct patterns** throughout (both v18 and v19 share the same controller API — no breaking changes between them).

---

### FILE: `controllers/$1.py`

**For `backend` route type:**

```python
# © <YEAR> <Author>
# License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl-3.0).

from odoo import http
from odoo.http import request


class <ControllerClassName>(http.Controller):

    @http.route(
        "/<prefix>/list",
        type="http",
        auth="user",
        methods=["GET"],
    )
    def list_records(self, **kwargs):
        """Render a list of records for authenticated backend users."""
        records = request.env["<model>"].search([])
        values = {
            "records": records,
            "page_name": "<page_name>",
        }
        return request.render("<module>.<template_xmlid>", values)

    @http.route(
        "/<prefix>/<int:record_id>",
        type="http",
        auth="user",
        methods=["GET"],
    )
    def view_record(self, record_id, **kwargs):
        """Render a single record detail page."""
        record = request.env["<model>"].browse(record_id)
        if not record.exists():
            return request.not_found()
        values = {
            "record": record,
            "page_name": "<page_name>",
        }
        return request.render("<module>.<detail_template_xmlid>", values)

    @http.route(
        "/<prefix>/<int:record_id>/update",
        type="http",
        auth="user",
        methods=["POST"],
    )
    def update_record(self, record_id, **kwargs):
        """Handle a POST form submission to update a record."""
        record = request.env["<model>"].browse(record_id)
        if not record.exists():
            return request.not_found()
        # TODO: validate and apply kwargs to the record
        # record.write({"field": kwargs.get("field")})
        return request.redirect("/<prefix>/list")
```

---

**For `portal` route type:**

```python
# © <YEAR> <Author>
# License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl-3.0).

from odoo import http
from odoo.http import request


class <ControllerClassName>(http.Controller):

    @http.route(
        "/<prefix>/portal",
        type="http",
        auth="public",
        website=True,
        methods=["GET"],
    )
    def portal_list(self, **kwargs):
        """Render the portal list page (public — no login required to view)."""
        # Use sudo() only to confirm existence; apply domain to limit visibility
        records = request.env["<model>"].sudo().search([
            ("partner_id", "=", request.env.user.partner_id.id),
        ])
        values = {
            "records": records,
            "page_name": "<page_name>",
        }
        return request.render("<module>.<portal_list_template>", values)

    @http.route(
        "/<prefix>/portal/<int:record_id>",
        type="http",
        auth="public",
        website=True,
        methods=["GET"],
    )
    def portal_record(self, record_id, **kwargs):
        """Render a single portal record page with ownership check."""
        record = request.env["<model>"].sudo().browse(record_id)
        if not record.exists():
            return request.not_found()

        # Ownership check: redirect non-owners to login
        if request.env.user._is_public():
            return request.redirect("/web/login?redirect=/<prefix>/portal/%d" % record_id)
        if record.partner_id != request.env.user.partner_id:
            return request.not_found()

        values = {
            "record": record,
            "page_name": "<page_name>",
        }
        return request.render("<module>.<portal_detail_template>", values)
```

> **Note on `sudo()`:** Use `sudo()` only to check record existence. Do NOT use `sudo()` when calling business methods (e.g. `record.sudo().action_confirm()`) unless you have explicitly verified the security implications — this bypasses all record rules.

---

**For `json-rpc` route type:**

```python
# © <YEAR> <Author>
# License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl-3.0).

from odoo import http
from odoo.http import request


class <ControllerClassName>(http.Controller):

    @http.route(
        "/<prefix>/api/list",
        type="json",
        auth="user",
        methods=["POST"],
    )
    def api_list(self, domain=None, limit=80, offset=0, **kwargs):
        """Return a JSON list of records. Called from JS/OWL via jsonrpc()."""
        domain = domain or []
        records = request.env["<model>"].search(domain, limit=limit, offset=offset)
        return {
            "records": [
                {"id": r.id, "name": r.name}
                for r in records
            ],
            "total": request.env["<model>"].search_count(domain),
        }

    @http.route(
        "/<prefix>/api/get",
        type="json",
        auth="user",
        methods=["POST"],
    )
    def api_get(self, record_id, **kwargs):
        """Return a single record as JSON."""
        if not record_id:
            return {"error": "record_id is required"}
        record = request.env["<model>"].browse(int(record_id))
        if not record.exists():
            return {"error": "Record not found"}
        return {
            "id": record.id,
            "name": record.name,
            # Add more fields here
        }

    @http.route(
        "/<prefix>/api/write",
        type="json",
        auth="user",
        methods=["POST"],
    )
    def api_write(self, record_id, values=None, **kwargs):
        """Update a record via JSON. Values is a dict of field: value."""
        if not record_id or not values:
            return {"error": "record_id and values are required"}
        record = request.env["<model>"].browse(int(record_id))
        if not record.exists():
            return {"error": "Record not found"}
        record.write(values)
        return {"status": "ok", "id": record.id}
```

> **How to call a JSON-RPC endpoint from OWL / JS:**
> ```js
> import { jsonrpc } from "@web/core/network/rpc";
> const result = await jsonrpc("/<prefix>/api/get", { record_id: this.props.recordId });
> ```

---

**For `api` route type (external API, custom auth):**

```python
# © <YEAR> <Author>
# License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl-3.0).

from odoo import http
from odoo.http import request


class <ControllerClassName>(http.Controller):

    def _validate_api_key(self, api_key):
        """Validate the provided API key against stored keys.

        Replace this stub with your actual key validation logic,
        e.g. checking an ir.config_parameter or a custom model.
        """
        expected = request.env["ir.config_parameter"].sudo().get_param(
            "<module>.api_key", default=None
        )
        return expected and api_key == expected

    @http.route(
        "/<prefix>/api/v1/list",
        type="json",
        auth="none",
        methods=["POST"],
        csrf=False,
    )
    def external_list(self, **kwargs):
        """External API endpoint — validates X-API-Key header before proceeding."""
        api_key = request.httprequest.headers.get("X-API-Key")
        if not api_key or not self._validate_api_key(api_key):
            return {"error": "Unauthorized", "code": 401}

        # Use sudo() because auth='none' — no user session exists
        records = request.env["<model>"].sudo().search([])
        return {
            "records": [{"id": r.id, "name": r.name} for r in records],
        }

    @http.route(
        "/<prefix>/api/v1/get/<int:record_id>",
        type="json",
        auth="none",
        methods=["POST"],
        csrf=False,
    )
    def external_get(self, record_id, **kwargs):
        """Get a single record by ID — external API."""
        api_key = request.httprequest.headers.get("X-API-Key")
        if not api_key or not self._validate_api_key(api_key):
            return {"error": "Unauthorized", "code": 401}

        record = request.env["<model>"].sudo().browse(record_id)
        if not record.exists():
            return {"error": "Not found", "code": 404}
        return {"id": record.id, "name": record.name}
```

> **Note on `auth='none'` + `csrf=False`:** Only use this combination for routes consumed by external systems with their own authentication mechanism. Never expose writable endpoints without proper key validation.

---

### FILE: `controllers/__init__.py`

Create if it does not exist, or append to it:

```python
# © <YEAR> <Author>
# License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl-3.0).

from . import $1
```

---

### FILE: `__init__.py` (module root)

**Update** to import controllers if not already imported:

```python
from . import controllers
```

---

### FILE: `__manifest__.py`

No entry is needed in `"data"` for controllers (they are auto-discovered from `controllers/`). However, if any QWeb templates were created for backend or portal views, add them:

```python
"data": [
    # Only if you created QWeb template XML files:
    # "views/templates_$1.xml",
],
```

---

## Step 4 — Generate tests

### FILE: `tests/test_controller_$1.py`

> **Use `HttpCase`, not `TransactionCase`** — `HttpCase` spins up a real HTTP server and allows `url_open()` and `authenticate()`.

```python
# © <YEAR> <Author>
# License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl-3.0).

import json

from odoo.tests import HttpCase, tagged


@tagged("post_install", "-at_install")
class TestController<ControllerClassName>(HttpCase):

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        # Create a minimal record to use in route tests
        cls.record = cls.env["<model>"].create({"name": "Test Record"})

    # ------------------------------------------------------------------
    # Backend / Portal route tests
    # ------------------------------------------------------------------

    def test_route_unauthenticated_redirects(self):
        """Unauthenticated request to auth='user' route returns 302."""
        response = self.url_open("/<prefix>/list")
        self.assertEqual(response.status_code, 302)

    def test_route_authenticated_returns_200(self):
        """Authenticated user can access the backend route."""
        self.authenticate("admin", "admin")
        response = self.url_open("/<prefix>/list")
        self.assertEqual(response.status_code, 200)

    def test_route_invalid_record_returns_404(self):
        """Route with a non-existent record ID returns 404."""
        self.authenticate("admin", "admin")
        response = self.url_open("/<prefix>/99999999")
        self.assertEqual(response.status_code, 404)

    # ------------------------------------------------------------------
    # JSON-RPC endpoint tests
    # ------------------------------------------------------------------

    def _jsonrpc(self, path, params=None):
        """Helper: perform a JSON-RPC call and return the parsed response."""
        payload = json.dumps({
            "jsonrpc": "2.0",
            "method": "call",
            "id": 1,
            "params": params or {},
        })
        response = self.url_open(
            path,
            data=payload.encode(),
            headers={"Content-Type": "application/json"},
        )
        return response.json()

    def test_json_endpoint_returns_list(self):
        """JSON list endpoint returns a dict with 'records' key."""
        self.authenticate("admin", "admin")
        result = self._jsonrpc("/<prefix>/api/list")
        self.assertIn("records", result.get("result", {}))

    def test_json_endpoint_get_valid_record(self):
        """JSON get endpoint returns the correct record."""
        self.authenticate("admin", "admin")
        result = self._jsonrpc("/<prefix>/api/get", {"record_id": self.record.id})
        data = result.get("result", {})
        self.assertEqual(data.get("id"), self.record.id)
        self.assertEqual(data.get("name"), "Test Record")

    def test_json_endpoint_get_invalid_record(self):
        """JSON get endpoint returns error for non-existent record."""
        self.authenticate("admin", "admin")
        result = self._jsonrpc("/<prefix>/api/get", {"record_id": 99999999})
        data = result.get("result", {})
        self.assertIn("error", data)

    def test_json_endpoint_missing_param(self):
        """JSON get endpoint handles missing record_id gracefully."""
        self.authenticate("admin", "admin")
        result = self._jsonrpc("/<prefix>/api/get", {})
        data = result.get("result", {})
        self.assertIn("error", data)

    # ------------------------------------------------------------------
    # External API tests (auth='none', X-API-Key)
    # ------------------------------------------------------------------

    # def test_external_api_missing_key_returns_401(self):
    #     """External API returns 401 when no API key is provided."""
    #     result = self._jsonrpc("/<prefix>/api/v1/list")
    #     self.assertEqual(result.get("result", {}).get("code"), 401)
    #
    # def test_external_api_valid_key_returns_200(self):
    #     """External API returns data when a valid API key is provided."""
    #     # Set up the expected key in ir.config_parameter
    #     self.env["ir.config_parameter"].set_param("<module>.api_key", "test-secret")
    #     payload = json.dumps({"jsonrpc": "2.0", "method": "call", "id": 1, "params": {}})
    #     response = self.url_open(
    #         "/<prefix>/api/v1/list",
    #         data=payload.encode(),
    #         headers={"Content-Type": "application/json", "X-API-Key": "test-secret"},
    #     )
    #     data = response.json().get("result", {})
    #     self.assertIn("records", data)
```

---

### FILE: `tests/__init__.py`

**Update** to add:

```python
from . import test_controller_$1
```

---

## Step 5 — Security checklist (always include at the end of your response)

```
## Security checklist for controllers

- [ ] Routes that modify data use POST (not GET)
- [ ] `auth='public'` routes don't expose sensitive data without checking record ownership
- [ ] `type='json'` routes validate all input params before using them in domain/search
- [ ] `csrf=False` is only used on external API routes that implement custom auth
- [ ] Portal routes use `sudo()` only to check existence, not to bypass business rules
- [ ] `auth='none'` routes always validate credentials before touching the ORM
- [ ] Request parameters are sanitized before use in SQL or domain expressions
- [ ] Routes returning file content set the correct Content-Type header
```

---

## Step 6 — After creating all files

Show this summary:

```
✅ Controller `$1` added successfully.

Files created:
  controllers/$1.py
  tests/test_controller_$1.py

Files updated:
  controllers/__init__.py     ← added: from . import $1 (created if missing)
  __init__.py                 ← added: from . import controllers
  tests/__init__.py           ← added import

Route types generated:
  <list each type: ✓ backend | ✓ portal | ✓ json-rpc | ✓ api>

Version-specific notes (v<VERSION>):
  ✓ Controller API is identical in v18 and v19
  ✓ JSON-RPC endpoints use type='json' — params arrive as kwargs
  ✓ HttpCase used for all controller tests (not TransactionCase)

How to test manually (Odoo shell / curl):
  # JSON-RPC endpoint
  curl -s -X POST http://localhost:8069/<prefix>/api/list \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"call","id":1,"params":{}}'

  # External API
  curl -s -X POST http://localhost:8069/<prefix>/api/v1/list \
    -H "Content-Type: application/json" \
    -H "X-API-Key: your-key" \
    -d '{"jsonrpc":"2.0","method":"call","id":1,"params":{}}'

Run tests:
  odoo-bin -t -d <db> --test-tags /<module>

Next steps:
  - Add a QWeb template:  create views/templates_$1.xml and add to __manifest__
  - Add a wizard:         /odoo-wizard <wizard_name>
  - Add a model:          /odoo-model <model.name>
```
