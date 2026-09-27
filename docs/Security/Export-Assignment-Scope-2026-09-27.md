# ExportScopeBleed: assigned-only board export access

The source audit found nine exporter authorization methods that accepted board
visibility without checking assigned-only membership. Their underlying readers
include unassigned cards or board-wide files, comments and aggregates. A private
board member with an assigned-only role could therefore request an export beyond
their visible card scope. This is an authorization defect (CWE-863), high severity;
no CVE is assigned.

All nine methods now use one decision. Unfiltered exporters deny assigned-only
members, including card exporters whose related-data reads have not been proven
to respect that boundary. The Scrum Sprint and Velocity report loaders already
filter their cards and snapshots by the requester and retain access. Ordinary
board members retain export access. Anonymous public-board access follows the
existing public visibility policy; public content is not made private by a
member-specific assignment flag.

This change does not claim all export formats now support partial assigned-only
exports. Supporting those requires filtering every related collection and report
input before rendering. Native JSON/ZIP, CSV, calendar, PDF, Excel and other
adapters using the shared exporter refuse unfiltered requests in the meantime.
Board Excel and card PDF/Excel denials now return HTTP 403 rather than a 200 error message.

Executable policy tests cover all three assigned-only role flags, ordinary and
anonymous public access, hidden boards and the two scoped Scrum reports. A source
regression checks every exporter authorization method. HTTP regression tests
exercise the affected formats and preserve scoped Scrum report access. Additional
native Scrum export tests cover ordinary-member success, scope reduction, field
selection and anonymization. Chromium, Meteor and MongoDB are used locally;
Firefox, WebKit, FerretDB and Sandstorm are not verified here.

There is no new account-blocking canary: the existing export menus can lead an
assigned-only user to an unsupported operation during normal use. That refusal
alone cannot reliably identify an attack. Existing generic export-denial logging
is retained. The Hall of Fame coverage audit records this deliberate omission.
