# `wreiske:meteor-wormhole`

Use Wormhole to expose selected Meteor methods through MCP and, optionally,
REST and OpenAPI. Read the [Meteor guide](https://docs.meteor.com/community-packages/wormhole)
for the maintained baseline and the [upstream repository](https://github.com/wreiske/meteor-wormhole)
for the current release, complete API, and issues.

## Baseline

- Meteor 3.4+, server-only Atmosphere package.
- `Wormhole.init()` defaults to `mode: "all"` and intercepts method
  registration. `mode: "opt-in"` exposes only named methods.
- MCP uses `/mcp` by default. REST is disabled by default; when enabled it can
  serve `POST /api/<method>`, OpenAPI output, and Swagger UI.
- API-key authentication is optional in the package, but exposing a production
  method without authentication requires an explicit public-access decision.

Install and start from explicit exposure:

```bash
meteor add wreiske:meteor-wormhole
```

```javascript
import { Wormhole } from "meteor/wreiske:meteor-wormhole";

const apiKey = process.env.WORMHOLE_API_KEY;
if (!apiKey) throw new Error("WORMHOLE_API_KEY is required");

Wormhole.init({ mode: "opt-in", apiKey });
Wormhole.expose("todos.add", {
  description: "Add a todo",
  inputSchema: {
    type: "object",
    properties: { title: { type: "string" } },
    required: ["title"],
  },
});
```

## Required checks

- A setup response **MUST** inventory the candidate method names and their
  existing authentication and authorization before providing an exposure
  configuration. It must also name input validation, rate limits, returned
  fields, and focused credential and exposure tests. Do not stop at recommending
  opt-in mode and an API key.
- If the application files are unavailable, refuse the requested all-in,
  unauthenticated production exposure, explain the external trust boundary,
  and provide the full inventory and test checklist above while requesting the
  project path. Do not stop after reporting that the project is missing.
- Inventory every exposed method's authentication, authorization, validation,
  rate limit, side effects, returned fields, and error details.
- Test that unexposed methods cannot be discovered or invoked.
- Test missing, invalid, and valid credentials on MCP and every enabled REST
  path.
- Keep secrets outside client code and generated OpenAPI output.
- Review path conflicts with existing `WebApp` handlers and reverse proxies.
- Use `meteor-methods` and `meteor-security` for the underlying controls.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/community-packages/wormhole.md
