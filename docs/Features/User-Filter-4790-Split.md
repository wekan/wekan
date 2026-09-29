# Splitting #4790 "User Filter" into separate issues

Maintainer decision 2026-09-29: [#4790](https://github.com/wekan/wekan/issues/4790)
is split into separate items and then closed. It was opened as a collection
of ideas ("I don't know what use cases it would cover, or is this actually
about different feature"), and a checklist of a dozen unrelated requests
cannot be fixed, reviewed or closed one piece at a time.

Creating and closing GitHub issues is a publishing step, so it is left to the
maintainer. This page is the split, ready to file.

## Status of every item, checked 2026-09-29

| Item in #4790 | Status |
| --- | --- |
| #3022 granular roles | Open on its own; stays as it is |
| Filters: show only assigned cards | Done: the assigned-only board roles |
| Labels for boards, organizations and teams | New issue 1 below |
| Board roles and what each may do | Covered by #3022 |
| meteor-roles package | Discussion only; noted in new issue 6 |
| Organizations: add users by email domain | Done: `models/lib/orgAutoAddByDomain.js` |
| Add users by domain to boards of an organization or team | Done: domain sharing (#5850) and #4178 |
| #4178 team/org membership follows boards | Open on its own; stays as it is |
| #4785 non-admins create labels | Closed |
| LDAP group name to user label | New issue 2 below |
| Exclude users with a label from boards with a label | New issue 3 below |
| Include users with a label in boards | New issue 3 below |
| Apply rules with a label to organizations and teams | New issue 4 below |
| Board role for an LDAP group | New issue 5 below |
| Commercial Support label | A label on GitHub, not a feature |
| #4739, #4593, #4740, #4736, #4737 | Closed |
| Sync organizations, teams and people | Done for LDAP groups (#4737); other sources are new issue 5 |
| #4530 | Closed |
| #4527 list permissions | Open on its own; stays as it is |
| #4756 card colour from list colour | Open on its own; stays as it is |
| Comments: rules versus roles speed, multitenancy | New issue 6 below |

## New issues to file

Run from the repository, signed in as the maintainer. Each body links back to
#4790 so the history stays connected.

```sh
gh issue create --title "Feature Request: Labels on organizations, teams, people and boards" \
  --body "Split from #4790. Labels exist on cards only. Allow labels on organizations, teams, people and boards, and a board list filtered by label, so that the rules in the other split issues have something to act on."

gh issue create --title "Feature Request: Give users a label from their LDAP group name" \
  --body "Split from #4790. When a signed-in user belongs to an LDAP group whose name contains a configured text (for example CONFIDENTIAL), give that user the matching label. Needs labels on people first."

gh issue create --title "Feature Request: Board membership by label - include or exclude users" \
  --body "Split from #4790. Add users with a label to boards with a label, and never add users with a label (for example CONFIDENTIAL) to boards with another label (for example SECRET). Needs labels on people and boards first."

gh issue create --title "Feature Request: Apply rules by label to organizations and teams" \
  --body "Split from #4790. Apply the rules that carry a label (for example Organize) to the organizations and teams that carry another label."

gh issue create --title "Feature Request: Board role for members of an LDAP group, and sync from other sources" \
  --body "Split from #4790. Give members of an LDAP group a board role (for example BoardAdmin) on chosen boards. LDAP groups already sync as organizations and teams (#4737); other identity sources are not synced yet."

gh issue create --title "Discussion: Roles package versus Rules for permissions, and multitenancy" \
  --body "Split from #4790. Whether permissions and assigned-only views should use meteor-roles instead of many Rules (speed with about 30 rules), and whether that could reach multitenancy across subdomains. Discussion, not a feature to implement yet."
```

Then close #4790 with a comment listing the new issue numbers and the items
above that are already done.
