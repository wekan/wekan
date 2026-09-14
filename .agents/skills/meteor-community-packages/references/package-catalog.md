# Documented package selection

Use this page to choose a candidate, then open only its local guide. Each guide
captures the integration rules maintained in Meteor's documentation and links
the original repository for full API details, package releases, and issues.
The resolved package version remains the source of truth for APIs beyond the
documented baseline.

## Community catalog

| Need | Candidate | Documented boundary | Adoption concern |
|---|---|---|---|
| Expose Meteor methods through MCP, REST, or OpenAPI | [`wreiske:meteor-wormhole`](wormhole.md) | Server-only, Meteor 3.4+ | Prefer explicit opt-in exposure. Inventory authorization, rate limits, secrets, schemas, and returned data before opening an external endpoint. |
| Typed RPC for a React client | [`meteor-rpc`](meteor-rpc.md) | npm package, Meteor 2.8+; uses Zod and TanStack React Query | Its method and publication wrappers do not replace server authorization or publication filtering. Verify npm peer dependencies and the lockfile. |
| Structured methods and optimistic UI | [`jam:method`](jam-method.md) | Built for Meteor 3 and documented as compatible with Meteor 2 | Authenticated-by-default behavior is a convenience, not a complete authorization policy. Review client-visible shared code and offline replay integration. |
| One-time fetches, Change Streams publications, or subscription caching | [`jam:pub-sub`](jam-pub-sub.md) | Expects the promise-based collection APIs available since Meteor 2.8.1 | Choose `.once`, `.stream`, and cache behavior deliberately. Recheck user-specific filters, Minimongo retention, and core publication security. |
| Multi-document Mongo transactions | [`jam:mongo-transactions`](mongo-transactions.md) | Meteor 2.8.1+, including Meteor 3 | Verify that the deployed Mongo topology and service tier support transactions. Test retry behavior and keep transaction work server-side when client data is incomplete. |
| Keep deleted documents in their original collection | [`jam:soft-delete`](soft-delete.md) | Meteor 2.8.1+ and 3.0+ | By default it changes `removeAsync` and query filters. Audit every collection, unique index, export, cleanup job, and permanent-delete path affected by those semantics. |
| Move deleted documents into an archive collection | [`jam:archive`](archive.md) | Meteor 3.0.2+; unavailable on 3.0.0 and 3.0.1 unless the app upgrades | By default it changes `removeAsync`. Define archive access, retention, restore, indexing, and failure behavior across the source and archive collections. |
| Persist Minimongo and replay methods offline | [`jam:offline`](offline.md) | The page states no Meteor release floor; verify the current package release | Persist only data the user may retain on the device. Review `.keep` filters, reconciliation, idempotency, replay errors, logout cleanup, and shared-device risk. |
| Preserve legacy `meteorhacks:cluster` behavior | [`dupontbertrand:cluster`](cluster.md) | Meteor 3.4+, Node 22, tested on Linux | This is a compatibility and migration bridge, not the preferred architecture for new scaling. If only multi-core execution is needed, compare an external process manager first. |
| Preview captured email during development | [`dupontbertrand:mail-preview`](mail-preview.md) | Meteor 3.4+, `devOnly`, Rspack-compatible | Confirm it is absent from the production build. Test account email and custom `Email.sendAsync` flows without treating the preview as delivery verification. |

## Promoted core package

| Need | Package | Version branch | Adoption concern |
|---|---|---|---|
| Roles and scoped permissions | [`roles`](roles.md) | Core package since Meteor 3.1.0, previously `alanning:roles`. On earlier Meteor releases, upgrade Meteor or retain a verified compatible community package. | Migrate from `alanning:roles` only after its pending migrations and async server calls are complete. Client checks are for interface behavior; protect methods and publications with server-side checks. |

## Selection notes

Soft delete and archive are alternatives. Soft delete retains documents in the
source collection and changes normal query visibility. Archive moves documents
to a separate collection. Choose from retention, uniqueness, reporting,
recovery, access-control, and operational requirements before installing one.

`jam:pub-sub` and `meteor-rpc` wrap core data boundaries. Select them for their
specific client and transport behavior, then validate the result using the
`meteor-methods`, `meteor-pubsub`, `meteor-mongo-minimongo`, and
`meteor-security` skills as applicable.

Wormhole creates a new external trust boundary. Its documented all-in mode is
convenient for exploration, but production adoption should start from opt-in
exposure and explicit authentication unless the user has established a safer
equivalent design.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/community-packages/index.md
