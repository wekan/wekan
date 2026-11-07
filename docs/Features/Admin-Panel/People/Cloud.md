# Admin Panel / People / Cloud

`/admin/people/cloud` - only in the WeKan of [Weddy](https://github.com/wekan/weddy)'s
first domain, the one Weddy starts with `WEDDY_CLOUD_DIR`. A customer's WeKan
(`WEDDY_TENANT=true`), and any WeKan outside Weddy, does not show it, and a per-tenant
Global Admin never sees it. The whole feature is described in
[Cloud Panel](../../../Platforms/FOSS/Weddy/Cloud-Panel.md).

| Field | Example | What it does |
|-------|---------|--------------|
| Cloud Panel Domain | `cloud.wekan.team` | The domain where the Cloud Panel is shown. Weddy serves it with this same WeKan. |
| SuperAdmin Username | `lauri.ojansivu@wekan.fi` | The user - by username or e-mail address - who gets the Cloud Panel at the Cloud Panel Domain. |

Saving them writes `WEDDY_CLOUD_DIR/domains.json` for Weddy. A site admin changes them;
the server checks that again (`cloudSaveSettings`, server/methods/cloudPanel.js).
