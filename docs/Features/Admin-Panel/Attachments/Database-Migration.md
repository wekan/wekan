# Database Migration

Admin Panel / Attachments / Database Migration copies WeKan text data between
MongoDB and FerretDB v1 (SQLite). Attachments and avatars remain in their configured
file storage. The other database must already be running at the address described on
the page before an administrator starts either direction.

The HTML5 and Legacy HTML4 views use the same administrator-only service for starting
a migration and reading its phase and collection progress. The HTML4 view exposes the
two directions as semantic signed HTTP POST buttons and needs neither JavaScript nor
cookies. The route accepts only `toFerretDB` and `toMongoDB`; the service validates the
direction again, refuses non-administrators and prevents two simultaneous migrations.
Rejected HTML4 operations are reported in Admin Panel / Problems / Security.

Migration runs in the background. Both views show the current phase, per-collection
and total collection progress, and a bounded error message when one exists. Starting
a migration changes data, so screenshot tests verify the controls and status at the
same URL without executing either action against the live test databases.
