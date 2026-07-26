# Admin Panel / Settings / Version

The **first** pane of Settings, and the one that opens with the Admin Panel: what an
admin usually comes here to read, or to paste into an issue.

It shows, as a plain two-column table:

- **WeKan version**, Meteor version, Node version.
- **Database** — type (MongoDB or FerretDB v1), the compatible MongoDB version, the
  database commit, and the storage engine.
- **Reactivity** — whether the oplog is enabled, the live reactivity driver
  (changeStreams / oplog / polling), the configured `METEOR_REACTIVITY_ORDER`, and
  the DDP transport.
- **OS** — type, platform, architecture, release and uptime.

It used to be a tab of its own in the Admin Panel bar, with a one-entry left menu.
A page whose menu had a single entry was a page in name only, so it became this
pane; the old `/information` URL redirects to Settings.

## Related

- [Databases](../../../Databases/) — MongoDB and FerretDB, and migrating between them.
- [Problems / CPU usage](../Problems/CPU-usage.md) — when the database is the reason
  pages are slow.
