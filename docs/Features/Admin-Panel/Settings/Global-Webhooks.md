# Admin Panel / Settings / Global Webhooks

Outgoing webhooks for the whole instance, added and edited with the same form a board
uses for its own webhooks — the difference is only that these fire for every board.

Each webhook has a name, URL, active state, type, and optional authentication
token. Leaving an existing webhook's URL empty removes it. Leaving its token
empty keeps the stored secret rather than exposing or clearing it.

The modern and Legacy HTML4 views use the same Global Admin-only server
operation. URLs receive DNS-aware SSRF validation before storage, webhook types
come from a fixed allowlist, values are bounded, and direct client collection
writes to global hooks are denied. Tokens are write-only and are never published
or rendered. Refused authorization, invalid type and unsafe-target attempts are
reported in Admin Panel / Problems / Security with the available request context.

At `/admin/settings/global-webhooks`, the Legacy HTML4 view exposes the same
operations through signed, labelled POST forms in natural keyboard order. It
works without JavaScript or cookies.

## Related

- [Outgoing webhooks](../../Webhooks/) — the payload, the types, and per-board
  webhooks.
