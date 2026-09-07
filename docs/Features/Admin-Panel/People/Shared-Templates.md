# Admin Panel / People / Shared templates

Users' shareable template boards, browsable **by scope**: Organization, Team or
e-mail Domain. The checkboxes choose which of those scopes are offered.

A board is shared into a scope by its owner; the per-organization and per-team
**Shared Templates** switches in [Organizations](Organizations.md) and
[Teams](Teams.md) decide whether one group's templates reach its members, and this
pane is the instance-wide list of scopes to browse by.

The same URL has an equivalent semantic Legacy HTML4 view whenever JavaScript
drag and drop is unavailable. Its labelled Organizations, Teams and Domains
checkboxes submit a signed HTTP POST and the result stays in one accessible
table, grouped in the same scope, group, user and template-board order as the
modern view. Each template title is a signed same-site board action. With no
scope selected, neither renderer exposes a template row.

Both renderers call the same Global Admin-only discovery service and the same
pure grouping function. Only non-archived linked-board cards from a user's
Templates container are included; users with an empty container are omitted.
The service returns only the username/full name, organization and team labels,
verified-email domains, and resolved template-board identity needed by the
view. An anonymous or non-admin attempt returns no rows and is recorded as
`TemplateBleed` in Admin Panel / Problems / Security with the available actor,
address and location context.

Regression coverage includes a source contract, the existing six-case modern
browser suite, and a same-URL no-JavaScript/modern Chromium comparison. The live
fixture selects all three scopes, excludes an empty Templates container, checks
the board actions, captures both views and proves anonymous isolation.

## Related

- [Templates](../../Board/Templates.md)
