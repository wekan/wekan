# Design research: Organizations, Teams and managing many people

Status: research report for the maintainer, 2026-10-10. It describes options and
a recommendation; nothing here is decided or implemented by this document.

## Summary

- **72 open issues** were read in full (body and comments). **22** of them ask,
  directly or partly, for organization / team / group / role / identity-provider
  features. The core is [#802](https://github.com/wekan/wekan/issues/802)
  (Teams/Organizations like Trello, open since 2017), with
  [#4178](https://github.com/wekan/wekan/issues/4178) (membership should follow
  into boards, and be revoked),
  [#5141](https://github.com/wekan/wekan/issues/5141) (board admins should share
  a board with an org/team), [#4265](https://github.com/wekan/wekan/issues/4265)
  (60 people per board, one by one),
  [#3022](https://github.com/wekan/wekan/issues/3022) (granular roles) and the
  umbrellas [#4790](https://github.com/wekan/wekan/issues/4790) and
  [#5847](https://github.com/wekan/wekan/issues/5847).
- **WeKan already has much more than the issues suggest**: flat Organizations
  and Teams, membership stored on the user, sharing a board with an
  org/team/email domain, per-org admins (multitenancy), LDAP and OIDC group
  sync into orgs/teams (add-only), nested AD groups
  (`LDAP_GROUP_FILTER_NESTED`), a bulk "add selected users to a team" action, and
  "propagate members to boards". What is missing is mostly **semantics**:
  revocation, provenance of a membership ("who put this person here?"), a
  relationship between orgs and teams, hierarchy, delegated team management, and
  a permission-safe picker for board admins.
- **Recommendation in one paragraph:** keep the two existing concepts, but give
  them one clear meaning each (Organization = *who administers* and tenant
  boundary; Team = *who gets access*), add a `parentId` + `ancestorIds` tree to
  Teams (not to Orgs first), record *where each membership came from*
  (manual / LDAP / OIDC / SAML / SCIM / domain rule) so sync can remove exactly
  what it added, and make board access *computed from team membership* instead of
  copied into `board.members`. Manage it in Admin Panel with a **tree on the left
  and a table on the right** (bulk select, filter, paginate); offer a **board-like
  drag view only for one small team's sub-teams**; let **board admins** pick
  teams they can see; let **team maintainers** manage their own team. Start with
  small fixes that close #5141 and #4178, then hierarchy, then SCIM.

## Contents

1. [How the issues were found](#1-how-the-issues-were-found)
2. [Catalog of open issues by theme](#2-catalog-of-open-issues-by-theme)
3. [What WeKan does today](#3-what-wekan-does-today)
4. [Prior art in other software](#4-prior-art-in-other-software)
5. [Question 1: what features are asked for](#5-question-1-what-features-are-asked-for)
6. [Question 2: where to manage what](#6-question-2-where-to-manage-what)
7. [Question 3: group and bulk actions](#7-question-3-group-and-bulk-actions)
8. [Question 4: nested hierarchy data model](#8-question-4-nested-hierarchy-data-model)
9. [Question 5: groups from LDAP, SAML, OAuth2/OIDC, SCIM](#9-question-5-groups-from-ldap-saml-oauth2oidc-scim)
10. [Question 6: table, board or tree UI](#10-question-6-table-board-or-tree-ui)
11. [Question 7: what to copy from others](#11-question-7-what-to-copy-from-others)
12. [Suggested phased roadmap](#12-suggested-phased-roadmap)
13. [Open questions for the maintainer](#13-open-questions-for-the-maintainer)

## 1. How the issues were found

- `gh issue list -R wekan/wekan --state open` returned **72** open issues on
  2026-10-10. All 72 were downloaded with their comments and scored by keyword
  (organization, team, group, LDAP, SAML, OIDC, OAuth, Keycloak, Active
  Directory, Azure, hierarchy, nested, department, tenant, role, permission,
  bulk). The search API was also queried with ~45 terms (org, team, members,
  bulk, invite, role, LDAP, SAML, OIDC, Keycloak, hierarchy, department,
  tenant, user management, admin panel, ...).
- Every issue with any hit was read in full; the relevant ones are below.
- Closed issues are not in scope, but closed ones that the open issues link to
  (and which changed the code) are mentioned in section 3 for context.

## 2. Catalog of open issues by theme

"Where" is where the request expects the feature: **AP** = Admin Panel,
**BA** = board admin (board sidebar), **M** = every member / All Boards,
**IdP** = identity provider configuration.

### 2.1 Organizations and Teams as a model

| Issue | What is asked | Where | Maintainer notes in the thread |
| --- | --- | --- | --- |
| [#802](https://github.com/wekan/wekan/issues/802) Teams/Organizations similar to Trello | Org/Team CRUD (done), team board overview page, private teams, user delete, LDAP subgroups, map LDAP roles, admin takes ownership of boards, departments hierarchy, `@team` mentions, assign a Team as card member, Org > Team > Person, only see people of your org/team, LDAP OU mapping, Teams from AD groups | AP, BA, M, IdP | 2019: "Company Group / Company / Department / Organization / Team / User?", "make it possible to create and edit nested structure", Grafana `org`/`org_user`/`team`/`team_member` + dashboard ACL as schema example, board sidebar tabs Organizations / Teams / Members (2021), All Boards tabs per org/team. A commenter argued for flat LDAP-style groups (Nextcloud) instead of nesting; xet7: "I do need hierarchy for my many use cases". |
| [#4178](https://github.com/wekan/wekan/issues/4178) Adding/removing user to/from Team/Org should add/remove them on all its boards | Late joiners get edit rights; removal revokes; "what is the difference between organizations and teams?"; 4-level university hierarchy (pro-rectories, departments, coordinations, sectors); org-chart view; All Boards folders per org | AP, M | xet7: an org chart could be an HTML page generated from membership; folders like UCS. Removing and re-adding an org demoted board admins (2023 comment). |
| [#5141](https://github.com/wekan/wekan/issues/5141) Board admin should be able to set organizations/teams | Only site admins can share a board with an org/team today; "annoying to add 40 people one by one" | BA | none yet |
| [#4265](https://github.com/wekan/wekan/issues/4265) Hidden Boards, and reorganize Board OrgsTeamsPeople | 60 people per board: checkbox list; team members cannot leave a team-shared board individually | BA, M | xet7 lists: move individual members to a team, move team to individuals, opt-out of a team board, inactive team member of a board, nested Org/Team/Individual grouping |
| [#4791](https://github.com/wekan/wekan/issues/4791) All Boards page automatic organization | Group boards by first letter, by label, by org/team subfolders | M | 2026-10-10: per-user workspaces and templates exist |
| [#4575](https://github.com/wekan/wekan/issues/4575) Public board writable for all users | Give everyone "normal" without inviting each; auto-add all new (LDAP) users to a team | AP | 2026-10-10: public board is read only |
| [#2761](https://github.com/wekan/wekan/issues/2761) Common labels for all boards | Admin-managed label set | AP | REST loop or template board as workaround |
| [#4698](https://github.com/wekan/wekan/issues/4698) Shared labels | xet7 asks: shared to all users, or to selected Orgs/Teams? | AP / org | open question |
| [#2026](https://github.com/wekan/wekan/issues/2026) Push notifications | Broadcast to team members | AP | team as a notification audience |

### 2.2 Roles and permissions per group

| Issue | What is asked | Where | Notes |
| --- | --- | --- | --- |
| [#3022](https://github.com/wekan/wekan/issues/3022) Granular roles | Custom roles with permission checkboxes; many issues merged into it (restrict board creation, registration by email domain, default member per board, anonymous edit, see only own cards...) | AP | Plan: meteor-roles (alanning:roles) used "like tags" for Organization, Team and Role; bounty 2000 EUR. xet7: "I really don't know how to implement Teams/Organizations #802 without Granular Roles." |
| [#4527](https://github.com/wekan/wekan/issues/4527) Permissions for lists | One list editable by all signed-in users on a read-only board | BA | Option c) "only logged-in users" chosen by reporter |
| [#2217](https://github.com/wekan/wekan/issues/2217) Rules for non-admins | Show Rules to more roles; "superadmin, admin, user" | AP | |
| [#4790](https://github.com/wekan/wekan/issues/4790) User Filter (umbrella) | Labels on orgs/teams/people/boards; rules like "domain X -> add to boards of Org1 with Normal"; "LDAP group -> BoardAdmin"; multitenancy | AP, IdP | Split prepared in [User-Filter-4790-Split.md](../Features/User-Filter-4790-Split.md) |

### 2.3 Identity providers and group sync

| Issue | What is asked | Where | Notes |
| --- | --- | --- | --- |
| [#5847](https://github.com/wekan/wekan/issues/5847) Accounts improvement initiative | Umbrella: LDAP "better sync of users and teams like ldap-sync.py", Keycloak, SAML, CAS, 2FA, logout, meteor-roles | IdP, AP | |
| [#5758](https://github.com/wekan/wekan/issues/5758) Kerberos/NTLM SSO | Windows integrated login (AD) | IdP | needs real AD |
| [#6549](https://github.com/wekan/wekan/issues/6549) OAuth2 via Rocket.Chat -> G Suite SAML | provider chain | IdP | environment specific |
| [#1324](https://github.com/wekan/wekan/issues/1324) Bitbucket login | also "a page for admin to manage people" | IdP, AP | |
| [#687](https://github.com/wekan/wekan/issues/687) Nextcloud integration | Nextcloud groups / SSO | IdP | |
| [#2167](https://github.com/wekan/wekan/issues/2167) Document Sandstorm API | Sandstorm permissions should apply to all boards of a grain; xet7 asks whether org structures could live inside a grain | Sandstorm | |
| [#2208](https://github.com/wekan/wekan/issues/2208) Sandstorm feature requests | role changes of grain users | Sandstorm | |

### 2.4 Multitenancy (mentioned inside the above)

- #802 comments: one install for many companies, "multiple LDAP domains", org
  per domain, team per LDAP group. #4790 comment: subdomains per customer.
  This is now [Multitenancy option D](Multitenancy/Multitenancy.md)
  (Organizations as tenants), implemented.

### 2.5 Closed issues that shaped today's code

[#4737](https://github.com/wekan/wekan/issues/4737) LDAP groups as orgs/teams,
[#4104](https://github.com/wekan/wekan/issues/4104) import LDAP groups to teams,
[#4593](https://github.com/wekan/wekan/issues/4593) late team members get board
rights, [#4510](https://github.com/wekan/wekan/issues/4510) People filtered by
team, [#5050](https://github.com/wekan/wekan/issues/5050) add all users to a
board (closed as "use a team"), [#5339](https://github.com/wekan/wekan/issues/5339)
default OIDC organization, [#6744](https://github.com/wekan/wekan/issues/6744)
nested AD groups, [#6116](https://github.com/wekan/wekan/issues/6116) only add
people from the same org/team, [#4736](https://github.com/wekan/wekan/issues/4736)
OAuth2 only for existing users.

## 3. What WeKan does today

### 3.1 Data model

| Thing | Where | Shape |
| --- | --- | --- |
| Organization | `models/org.js`, collection `org` | flat; name, short name, description, website, active, `orgAutoAddUsersWithDomainName`, three flags (`orgSharedTemplates`, `orgPropagateMembersToBoards`, `orgSyncMembersFromAuth`), tenant domains and branding. **No parent, no list of teams, no member list.** |
| Team | `models/team.js`, collection `team` | flat; the same minus domains/branding. **No parent, no owning org, no member list.** |
| Membership | `models/users.js` `orgs[]` `{orgId, orgDisplayName, isAdmin}` and `teams[]` `{teamId, teamDisplayName}` | stored **on the user** (the 2021 suggestion of jrsupplee in #802). `orgs.$.isAdmin` = per-tenant admin. **No role inside a team, no source of the membership.** |
| `orgUser` | `models/orgUser.js` | numeric-id join table from the early Grafana-like plan; unused by the current UI as far as could be found. |
| Board sharing | `models/boards.js` `orgs[]`, `teams[]`, `domains[]` each with `isActive` | share entries; `isActive:false` is the revoke switch (`models/lib/boardVisibilitySelectors.js`). |
| Board roles | `docs/Features/Members/Members.md`, `models/lib/boardRoleCapabilities.js` | nine per-board roles on `board.members[]` (admin, normal, no comments, comment only, worker, read only, assigned-only variants). |
| Board permission | `models/lib/boardPermission.js` | `private`, `instance` (all signed-in users read), `public`. |

Important consequence: **a share with an org/team grants read visibility only.**
Write access needs an entry in `board.members`. That is why late joiners could
only read (#4593), and why WeKan *copies* team members into `board.members`
in several places:

- when a board admin adds a team (`client/components/sidebar/sidebar.js`
  `addBoardTeamPopup`, server `setBoardTeams` in `server/models/boards.js`,
  reconciled by `models/lib/reconcileBoardTeamMembers.js`);
- when a user **gains** a team (`addUserToTeamBoards` in
  `server/models/users.js`, logic in `models/lib/teamBoardMemberSync.js`) -
  **teams only, gain only**; losing a team removes nothing on purpose, because
  the data cannot tell a team-derived member from an individually invited one;
- when the org/team flag "Propagate Members To Boards" is on
  (`server/propagateOrgTeamMembers.js`, `models/lib/propagateMembers.js`) -
  add-only, also run by the LDAP background sync.

### 3.2 Admin Panel / People

- Panes: People, Organizations, Teams, Locked Users, Roles, Shared Templates,
  Domains, Login/OAuth2/SAML/LDAP settings (`client/components/settings/peopleBody.jade`).
  Docs: [People](../Features/Admin-Panel/People/People.md),
  [Organizations](../Features/Admin-Panel/People/Organizations.md),
  [Teams](../Features/Admin-Panel/People/Teams.md),
  [Roles](../Features/Admin-Panel/People/Roles.md).
- All are the shared paginated [table page](../Features/Page/Table.md)
  (search, total, prev/next).
- **Bulk:** People has per-row checkboxes, select-all for the page, and a
  **Teams** action that adds or removes one team for the selected users
  (`Template.modifyTeamsUsers` in `client/components/settings/peopleBody.js`;
  one `editUser` call per user). There is **no** equivalent for organizations,
  no CSV import of users or memberships, and no "select all N matching the
  filter" beyond the page.
- People can be narrowed to one team (#4510).
- Organization admins (per-tenant) are appointed from an org row's menu
  (`orgAdminsPopup`; rules in `models/lib/tenantAdmin.js`); they see only their
  org's people. **There is no equivalent "team maintainer".**
- Org/Team flags have select-all/unselect-all per column, and REST endpoints
  `/api/admin/orgs`, `/api/admin/teams` (+ `/features`) in
  `server/models/org.js` and `server/models/team.js`. There is **no REST API to
  add/remove members of a team or org**; membership changes go through
  `PUT /api/users/:userId` or Meteor methods.
- Settings `boardMembersFromSameOrgOnly` / `boardMembersFromSameTeamOnly`
  restrict whom a board can invite (`server/lib/orgTeamRestriction.js`).

### 3.3 Board level

- Board sidebar Members has tabs People / Organizations / Teams / Domains
  (`client/components/sidebar/sidebar.jade`). The `+` for orgs/teams is shown to
  board admins, and `setBoardOrgs`/`setBoardTeams` accept board admins
  (`allowIsBoardAdmin`). **But the picker subscribes to the `org` and `team`
  publications** (`server/publications/org.js`, `team.js`), which return rows only
  to a site admin (or org admin for orgs). A plain board admin therefore gets an
  empty list - this is exactly #5141, and is also how the 2026-09-27 audit
  describes it
  ([All-Open-Issues-Audit-2026-09-27.md](../DeveloperDocs/All-Open-Issues-Audit-2026-09-27.md)).
- Boards can also be shared by dragging onto an org/team/domain target on All
  Boards (`shareBoardWith` in `client/components/boards/boardsList.js`).

### 3.4 Identity providers

| Source | What exists | Where |
| --- | --- | --- |
| LDAP / AD | Group filter for login (`LDAP_GROUP_FILTER_ENABLE`, `_OBJECTCLASS`, `_GROUP_ID_ATTRIBUTE`, `_GROUP_MEMBER_ATTRIBUTE`, `_GROUP_MEMBER_FORMAT`, `_GROUP_NAME`, `LDAP_GROUP_BASEDN`); **nested AD groups** via `LDAP_GROUP_FILTER_NESTED=true` using `member:1.2.840.113556.1.4.1941:` (commit dc2e7592a3, #6744); admin from groups (`LDAP_SYNC_ADMIN_STATUS`, `LDAP_SYNC_ADMIN_GROUPS`, also during background sync); `LDAP_SYNC_GROUP_ROLES`; **groups -> Orgs/Teams** (`LDAP_SYNC_ORGANIZATIONS[_GROUPS]`, `LDAP_SYNC_TEAMS[_GROUPS]`, wildcards); background sync (`LDAP_BACKGROUND_SYNC*`, can disable vanished users). Org/team sync is **add-only** and matches by display name. | `packages/wekan-ldap/`, `server/ldapGroupSync.js`, [LDAP.md](../Features/Login/LDAP.md), external script [ldap-sync.py](../Features/Login/ldap-sync/ldap-sync.py) which also removes |
| OAuth2 / OIDC | Claim read from `userinfo.wekanGroups` or `userinfo.groups` (hard-coded names, `packages/wekan-oidc/oidc_server.js`); `OAUTH2_ADMIN_GROUPS` (admin from groups, #5876); with `PROPAGATE_OIDC_DATA`, `addGroupsWithAttributes` creates orgs/teams from a custom group object (`displayName`, `isOrganisation`, `isAdmin`, `forceCreate`) sent in a "wekanGroup" scope - **not** the standard plain-string `groups` claim of Keycloak/Entra/Okta; pushes memberships (add-only) and grants team boards; `OAUTH2_DEFAULT_ORGANIZATION` (#5339). | `packages/wekan-oidc/loginHandler.js`, [OAuth2.md](../Features/Login/OAuth2.md) |
| SAML | Login with attribute mapping for the profile (`SAML_ATTRIBUTES`, `SAML_LOCAL_PROFILE_MATCH_ATTRIBUTE`). **No group/role mapping found.** | `packages/wekan-accounts-saml/`, [SAML.md](../Features/Login/SAML.md) |
| Email domain | `orgAutoAddUsersWithDomainName` (`models/lib/orgAutoAddByDomain.js`); board sharing by domain (#5850) | |
| SCIM | **Nothing** (no `scim` anywhere in code). | |
| CAS | Login gate only: `Meteor.settings.cas.allowedLdapGroups` matched against `cas:memberOf` (settings.json only, no env var). No org/team/admin mapping. | `packages/wekan-accounts-cas/cas_server.js`, `groupPolicy.js` |
| Header login | No group/role header. | `server/header-login.js` |
| Sandstorm | `configure` permission -> WeKan `isAdmin`; `participate` mapped to nothing; administrator role commented out. Open questions in #2167. | `sandstorm-pkgdef.capnp`, `sandstorm.js` `updateUserPermissions` |

Defects found while reading the code (worth fixing before building on them):

- **`LDAP_SYNC_GROUP_ROLES` cannot work.** `packages/wekan-ldap/server/loginHandler.js`
  calls `Roles.setUserRoles(...)` (lines 224 and 273), but no roles package is in
  `.meteor/packages`, so a user with groups would hit a ReferenceError at login
  (inferred from reading; not run). The variable is still advertised in
  `Dockerfile`, `docker-compose.yml` and `snap-src/bin/config`.
- **OIDC organization creation passes the wrong arguments.** `createObject` /
  `updateObject` in `packages/wekan-oidc/loginHandler.js` pass 5/6 values, while
  `setCreateOrgFromOidc` / `setOrgAllFieldsFromOidc` in `server/models/org.js`
  take an extra `orgAutoAddUsersWithDomainName`, so website lands in the domain
  slot and the boolean in `orgWebsite` (fails `check(String)`). The team variant
  matches. Also `setTeamAllFieldsFromOidc` overwrites team fields from the claim
  with `isActive` defaulting to `false`. The whole path runs only with
  `PROPAGATE_OIDC_DATA`, only for an already existing user (from the second
  login), and is documented only in a code comment.
- **`orgSyncMembersFromAuth` / `teamSyncMembersFromAuth` are only markers.** The
  LDAP sync sets them to true, but no code reads them to gate sync or removal.
- **`orgAutoAddUsersWithDomainName` applies at account creation only**
  (`Accounts.onCreateUser` in `server/models/users.js`), not on later logins,
  email changes, admin-created users or retroactively.
- **Admin sync is authoritative both ways** (LDAP and `OAUTH2_ADMIN_GROUPS`):
  with sync on, a manually granted admin outside the admin groups is demoted.
  This is the right model for synced data, and the opposite of how org/team
  sync behaves (add-only) - an inconsistency to resolve in one place.
- The external [ldap-sync.py](../Features/Login/ldap-sync/ldap-sync.py) is
  authoritative (it `$set`s teams and rewrites `board.members`), unlike the
  in-app add-only sync.

### 3.5 Verdict

| Capability | State |
| --- | --- |
| Flat orgs and teams, CRUD in Admin Panel | done |
| Share board with org/team/domain | done (site admin); **broken for board admins (#5141)** |
| Team member gains board write access | done for teams; orgs only via "propagate" flag |
| Removal follows (revoke) | **missing (#4178)** - no provenance |
| Bulk add/remove users to team | done for one page; **missing for orgs, CSV, filter-wide** |
| Team maintainers (delegation) | **missing**; org admins exist for tenants |
| Org owns teams / hierarchy | **missing** |
| IdP groups -> orgs/teams | LDAP and custom OIDC: add-only; SAML none; SCIM none |
| Group -> board role (e.g. BoardAdmin for an LDAP group) | **missing** (#4790 split item 5) |
| Custom roles | **missing (#3022)** |
| Team as card assignee, `@team` mention | **missing (#802 comments)** |

## 4. Prior art in other software

How these sources were checked (2026-10-10): every link in this section was
fetched and read, **except** the ones marked *(not fetched)*, which were seen
only in search results or linked from a fetched page. Statements marked
*unverified* could not be confirmed from an official page. The Keycloak manual
was read through a summarising fetch, so its exact option labels should be
checked on the page itself.

### 4.1 Product by product

**GitHub**

- Teams form a tree: "A parent team can have multiple child teams, while each
  child team only has one parent team." Child teams inherit the parent's access,
  and child-team members are notified when the parent is @mentioned. Secret
  teams cannot be nested.
  [About teams](https://docs.github.com/en/organizations/organizing-members-into-teams/about-teams)
- Maximum nesting depth: *unverified* (the page states none).
- Delegation: a **team maintainer** administers one team.
  [Roles in an organization](https://docs.github.com/en/organizations/managing-peoples-access-to-your-organization-with-roles/roles-in-an-organization)
- Team sync (Enterprise Cloud, Entra ID or Okta): once linked, "You cannot
  manage team membership on GitHub or using the API"; up to 5 IdP groups per
  team, groups of at most 5,000 members, refreshed at least hourly; it is not
  provisioning - users must already be org members.
  [Managing team sync](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-saml-single-sign-on-for-your-organization/managing-team-synchronization-for-your-organization),
  [Synchronizing a team](https://docs.github.com/en/enterprise-cloud@latest/organizations/organizing-members-into-teams/synchronizing-a-team-with-an-identity-provider-group)
- Enterprise Managed Users: the IdP owns the user lifecycle via SCIM 2.0
  (Entra ID, Okta, PingFederate).
  [About EMU](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/understanding-iam-for-enterprises/about-enterprise-managed-users)

**GitLab**

- Subgroups can "Be nested up to 20 levels. To avoid performance problems, nest
  groups to a maximum of five levels or fewer." Membership is inherited down; a
  subgroup cannot give a user a lower role than a parent gives.
  [Subgroups](https://docs.gitlab.com/user/group/subgroups/)
- Members table: columns Account, **Source (direct / inherited)**, Role,
  Expiration, Activity; Direct/Indirect filter, search, sorting; bulk path
  "import another project's direct members"; no CSV import mentioned.
  [Members](https://docs.gitlab.com/user/project/members/)
- Sharing a group with a group: only *direct* members of the invited group get
  access, each with the lower of the invite's maximum role and their own.
  [Sharing](https://docs.gitlab.com/user/project/members/sharing_projects_groups/)
- SAML Group Sync (paid): IdP groups map many-to-many to GitLab groups, evaluated
  at each SAML sign-in, highest role wins, unmapped users are removed, and it
  "does not create groups".
  [SAML group sync](https://docs.gitlab.com/user/group/saml_sso/group_sync/)
- LDAP sync (paid, self-managed): groups hourly, users daily; does not create
  users; `admin_group`; AD nested groups resolved with `active_directory: true`.
  [LDAP synchronization](https://docs.gitlab.com/administration/auth/ldap/ldap_synchronization/)

**Atlassian: Jira, Guard, Trello, Jira Service Management**

- Jira: "Group membership is global whereas project role membership is
  project-specific." Jira admins manage groups; project admins put people and
  groups into project roles.
  [Managing project roles (Data Center page)](https://confluence.atlassian.com/display/JIRA/Managing+Project+Roles);
  the Cloud wording is *unverified* (the Cloud page did not load its content).
- Atlassian Guard provisioning (SCIM 2.0) syncs users and groups from Okta,
  Entra, Google and others; synced groups are **read-only** in Atlassian; limits
  1M users, 250k groups, 290k users per group.
  [Understand user provisioning](https://support.atlassian.com/provisioning-users/docs/understand-user-provisioning/)
- Trello Workspace admins control private boards, board creation/deletion and
  guests; on the free plan every member is an admin; no bulk/CSV tools are
  described.
  [Workspace admin capabilities](https://support.atlassian.com/trello/docs/workspace-admin-capabilities/),
  [Multi-board guests](https://support.atlassian.com/trello/docs/multi-board-guests/),
  [Board guests](https://support.atlassian.com/trello/docs/board-guests/)
- Trello Enterprise dashboard: list of all members with filters (managed,
  admin, activity) and search; membership is still per Workspace.
  [Enterprise admin dashboard](https://support.atlassian.com/trello/docs/enterprise-admin-dashboard),
  [Manage Enterprise members](https://support.atlassian.com/trello/docs/manage-enterprise-members-and-licenses-on-atlassian-admin/)
- JSM organizations are "groups of customers that are shared across service
  spaces", can be filled automatically by email domain, and appear flat (the
  page says nothing about nesting).
  [Customers and organizations](https://support.atlassian.com/jira-service-management-cloud/docs/what-are-service-desk-customers-and-organizations/),
  [Manage organizations](https://support.atlassian.com/jira-service-management-cloud/docs/manage-customer-organizations-using-jira-product-settings/)

**Microsoft Active Directory and Entra ID**

- An OU is "the smallest scope or unit to which you can assign Group Policy
  settings or delegate administrative authority"; groups grant access.
  [OUs (legacy, official)](https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-server-2008-R2-and-2008/cc771811(v=ws.11))
- `LDAP_MATCHING_RULE_IN_CHAIN` (1.2.840.113556.1.4.1941) "walks the chain of
  ancestry in objects all the way to the root", e.g.
  `(member:1.2.840.113556.1.4.1941:=cn=user1,...)`; high fan-out queries can be
  processor intensive.
  [Search filter syntax](https://learn.microsoft.com/en-us/windows/win32/adsi/search-filter-syntax)
- `memberOf` is the system-only back-link of `member`.
  [memberOf](https://learn.microsoft.com/en-us/windows/win32/adschema/a-memberof)
- Entra nested groups work for security groups, but not for Microsoft 365
  groups, on-prem-synced groups, role-assignable groups, licensing, or app
  assignment: "Nested groups don't gain access to shared resources and
  applications that are assigned to the parent group."
  [Manage groups](https://learn.microsoft.com/en-us/entra/fundamentals/how-to-manage-groups)
- Dynamic membership groups: rules like `user.department -eq "Sales"`, no
  manual members, at most 15,000 dynamic groups per tenant, P1 licence; check
  who can write the attributes a rule reads.
  [Dynamic membership](https://learn.microsoft.com/en-us/entra/identity/users/groups-dynamic-membership)
- Administrative units scope delegated admin roles; they "can't be nested", and
  adding a group to one does not bring its members into scope.
  [Administrative units](https://learn.microsoft.com/en-us/entra/identity/role-based-access-control/administrative-units)
- **Groups claim limit: 150 for SAML tokens, 200 for JWT, and nested groups
  count.** Above it the claim is **omitted**; a JWT then carries
  `_claim_names`/`_claim_sources` (or `hasgroups`) pointing at Microsoft Graph.
  The implicit flow is limited to 5 groups. Microsoft recommends "Groups
  assigned to the application" or app roles.
  [Groups overage claim](https://learn.microsoft.com/en-us/entra/identity-platform/id-token-claims-reference#groups-overage-claim),
  [Group claims](https://learn.microsoft.com/en-us/entra/identity/hybrid/connect/how-to-connect-fed-group-claims)
- Bulk create/delete/download users from CSV with a job-status page.
  [Bulk add users](https://learn.microsoft.com/en-us/entra/identity/users/users-bulk-add);
  [bulk add group members](https://learn.microsoft.com/en-us/entra/identity/users/groups-bulk-import-members)
  *(not fetched)*.

**Google Workspace**

- Each user is in exactly one OU (for policy, inherited from the parent OU);
  groups are separate and used for access and configuration.
  [Organizational structure](https://knowledge.workspace.google.com/admin/users/advanced/how-the-organizational-structure-works)
- Nested groups: child-group members are not direct members of the parent, but
  do get what is shared with it.
  [Add a group to another group](https://knowledge.workspace.google.com/admin/groups/add-a-group-to-another-group)
- Dynamic groups from a query, users only, no manual adds (higher editions).
  [Dynamic groups](https://knowledge.workspace.google.com/admin/groups/manage-membership-automatically-with-dynamic-groups)
- Admin UI: OU tree beside a filterable user table; bulk changes by CSV with an
  Org Unit Path column.
  [Find a user](https://knowledge.workspace.google.com/admin/users/find-a-user-account),
  [CSV bulk update](https://knowledge.workspace.google.com/admin/users/add-or-update-multiple-users-from-a-csv-file)

**Keycloak** - all from the
[Server Administration Guide](https://www.keycloak.org/docs/latest/server_admin/index.html)
(read through a summariser):

- "Groups are hierarchical. A group can have multiple subgroups but a group can
  have only one parent. Subgroups inherit the attributes and role mappings from
  their parent."
- Realm roles, client roles, composite roles, default roles.
- The Group Membership mapper has a "Full group path" option (`/parent/child`
  in the token); the LDAP group mapper has READ_ONLY / LDAP_ONLY / IMPORT modes
  and "Preserve Group Inheritance".
- Keycloak 25+ Organizations (multi-tenant B2B in one realm):
  [announcement](https://www.keycloak.org/2024/06/announcement-keycloak-organizations)
  *(not fetched)*.

**Okta**

- Group rules fill groups from user attributes (Okta Expression Language);
  2,000 rules per org; rules cannot assign admin groups.
  [About group rules](https://help.okta.com/en-us/content/topics/users-groups-profiles/usgp-about-group-rules.htm),
  [Create group rules](https://help.okta.com/en-us/content/topics/users-groups-profiles/usgp-create-group-rules.htm)
- Group Push sends Okta groups and members to provisioning-enabled apps, with
  Okta as source of truth.
  [Group Push](https://help.okta.com/en-us/content/topics/users-groups-profiles/usgp-about-group-push.htm)
- Groups claim configured with a filter (e.g. regex) or expression.
  [Customize groups claim](https://developer.okta.com/docs/guides/customize-tokens-groups-claim/main/);
  a 100-group claim limit appears only in a
  [support article](https://support.okta.com/help/s/article/how-to-exceed-the-100-groups-limitation-on-a-claim)
  *(not fetched, unverified)*.
- SCIM for Okta: 2.0 recommended, TLS, OAuth/Basic/header token; `userName`,
  names, `emails`, stable `id`, `active` for deactivation.
  [Prepare SCIM](https://developer.okta.com/docs/guides/scim-provisioning-integration-prepare/main/)

**Mattermost and Rocket.Chat**

- Mattermost syncs selected AD/LDAP groups, maps them to roles, includes nested
  group members in parents, and **group-synced** teams/private channels add and
  remove users from LDAP membership and block manual invites of outsiders.
  [AD/LDAP groups synchronization](https://docs.mattermost.com/administration-guide/onboard/ad-ldap-groups-synchronization.html);
  [team/channel membership](https://docs.mattermost.com/administration-guide/onboard/managing-team-channel-membership-using-ad-ldap-sync-groups.html)
  *(not fetched)*.
- Rocket.Chat (premium): LDAP groups to roles with "Auto remove user roles",
  groups to channels via a JSON map with "Auto Remove Users from Channels", team
  mapping validated at each login, background sync on a cron schedule.
  [LDAP premium settings](https://docs.rocket.chat/docs/ldap-premium-settings)

**Nextcloud**

- Groups are flat. Group administrators (subadmins) create and remove users in
  their groups and edit them, but "are not allowed to add existing users to
  their groups".
  [User management](https://docs.nextcloud.com/server/latest/admin_manual/configuration_user/user_configuration.html)
- LDAP backend: a "Nested Groups" checkbox; the login and user filters must
  then use `memberof:1.2.840.113556.1.4.1941:=`.
  [LDAP](https://docs.nextcloud.com/server/latest/admin_manual/configuration_user/user_auth_ldap.html)
- Group folders (admin-configured, for a group) and Team folders (1:1 with a
  team, managed by the team) are two features.
  [groupfolders README](https://github.com/nextcloud/groupfolders)
- Nextcloud Teams (formerly Circles) are user-created groups usable by any app.
  [circles](https://github.com/nextcloud/circles). Member levels and nesting of
  Teams: *unverified*.

**OpenProject, Redmine, Kanboard, Taiga**

- OpenProject: a group is assigned to a project with a role; groups can have a
  parent group, and parent members and permissions apply to subgroups.
  [Groups](https://www.openproject.org/docs/system-admin-guide/users-permissions/groups/)
  LDAP group sync (Enterprise): one-way, hourly, removes only synced
  memberships, nested LDAP groups "not supported".
  [LDAP group synchronization](https://www.openproject.org/docs/system-admin-guide/authentication/ldap-connections/ldap-group-synchronization/)
- Redmine: "Groups can be added as members of projects just like regular users,
  using the same Roles."
  [RedmineGroups](https://www.redmine.org/projects/redmine/wiki/RedmineGroups).
  LDAP group sync only via the unmaintained
  [redmine_ldap_sync](https://redmine.org/plugins/redmine_ldap_sync) plugin
  *(not fetched)*; absence in core is *unverified*.
- Kanboard: "sync automatically LDAP groups with Kanboard groups. Each group can
  have a different project role assigned" (`LDAP_GROUP_PROVIDER`,
  `LDAP_GROUP_FILTER`, `LDAP_GROUP_ADMIN_DN`, ...).
  [LDAP](https://docs.kanboard.org/v1/admin/ldap/)
- Taiga: per-project roles, one role per member, admin toggle per member -
  from Taiga's [community](https://community.taiga.io/t/multiple-roles-for-project-members/2859)
  and [resources](https://resources.taiga.io/getting-started/) sites; *no
  official docs page verified*.

**Grafana** (the schema xet7 cited in #802 in 2019)

- Organizations isolate users and resources; teams and folders are per org.
  [Organizations](https://grafana.com/docs/grafana/latest/administration/organization-management/)
- Teams have Admin and Member roles; teams get permissions on folders and
  dashboards; across teams the highest permission wins; nesting not
  documented.
  [Teams](https://grafana.com/docs/grafana/latest/administration/team-management/)
- Team sync (Enterprise/Cloud) from LDAP, SAML, OAuth providers, at login unless
  LDAP background sync is on; **manually added members are kept**.
  [Team sync](https://grafana.com/docs/grafana/latest/setup-grafana/configure-access/configure-team-sync/)
- Folder permissions propagate down nested folders; a child cannot be set lower
  than the parent grants.
  [Dashboard permissions](https://grafana.com/docs/grafana/latest/administration/user-management/manage-dashboard-permissions/)

**SCIM 2.0**

- [RFC 7643](https://datatracker.ietf.org/doc/html/rfc7643): User (`userName`
  required, unique), Group with `members` (`value`, `$ref`, `display`), and
  "the intention of the 'Group' type is to allow the service provider to support
  nested groups"; `User.groups` is read-only, so membership changes go through
  the Group resource; the Enterprise User extension has department, manager etc.
- [RFC 7644](https://datatracker.ietf.org/doc/html/rfc7644): `/Users`,
  `/Groups`, `/ServiceProviderConfig`, `/ResourceTypes`, `/Schemas`, optional
  `/Bulk`; filtering, `startIndex`/`count` paging, PATCH add/remove/replace.
- For Entra provisioning an app must: create users, get by id, PATCH users and
  groups, query users by `userName`/`externalId` and groups by `displayName`,
  accept `excludedAttributes=members`, paginate, soft-delete with
  `active=false`, serve `/Schemas`, accept one bearer token, match PATCH `op`
  case-insensitively ("Add", "Replace", "Remove"); groups need PATCH and unique
  `displayName`; TLS 1.2; cycles about every 40 minutes.
  [Use SCIM with Entra](https://learn.microsoft.com/en-us/entra/identity/app-provisioning/use-scim-to-provision-users-and-groups)

**Trees in MongoDB, and FerretDB**

- MongoDB documents five tree patterns:
  [overview](https://www.mongodb.com/docs/manual/applications/data-models-tree-structures/),
  [parent references](https://www.mongodb.com/docs/manual/tutorial/model-tree-structures-with-parent-references/),
  [child references](https://www.mongodb.com/docs/manual/tutorial/model-tree-structures-with-child-references/),
  [array of ancestors](https://www.mongodb.com/docs/manual/tutorial/model-tree-structures-with-ancestors-array/),
  [materialized paths](https://www.mongodb.com/docs/manual/tutorial/model-tree-structures-with-materialized-paths/),
  [nested sets](https://www.mongodb.com/docs/manual/tutorial/model-tree-structures-with-nested-sets/).
- [`$graphLookup`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/graphlookup/)
  does recursive search (`startWith`, `connectFromField`, `connectToField`,
  `maxDepth`), spills to disk above 100 MB, returns results unsorted.
- **WeKan's FerretDB v1 fork does not implement `$graphLookup`** (verified in
  source: `.tools/FerretDB/internal/handler/common/aggregations/stages/stages.go`
  `unsupportedStages`; `docs/reference/supported-commands.md`; `ROADMAP.md`).
  Its `$lookup` is the basic equality join only. Upstream FerretDB v2's
  [compatibility page](https://docs.ferretdb.io/migration/compatibility/) does
  not list `$graphLookup`; upstream's position is *unverified*. This is why
  section 8 chooses an ancestors array, which needs only indexed `find`.

**UI patterns for large user lists**

- Entra: CSV bulk create/delete/download with a job page; group member lists
  with checkbox selection and Remove (links above).
- Google Admin: OU tree beside a user table with filter chips; CSV bulk update
  (links above).
- GitLab: Source (direct/inherited) column and filter (link above).
- [Carbon data table](https://carbondesignsystem.com/components/data-table/usage/):
  "Once an item from the table is selected, the batch action bar appears at the
  top of the table"; header checkbox with indeterminate state; row actions are
  disabled in batch mode.
- [PatternFly bulk selection](https://www.patternfly.org/patterns/bulk-selection):
  a split-button checkbox with "Select none / Select page / Select all" and a
  count of selected items across pages.
- [Atlassian dynamic table](https://atlassian.design/components/dynamic-table)
  *(not fetched)*: sorting, pagination, row reordering; batch selection not
  described.

### 4.2 Summary table

| Product | Hierarchy | IdP sync behaviour | Delegation |
| --- | --- | --- | --- |
| GitHub | nested teams, one parent; depth limit *unverified* | team sync: IdP-owned, no manual edits | team maintainers |
| GitLab | subgroups, max 20 (5 recommended) | SAML/LDAP group sync removes unmapped users | group Owners/Maintainers |
| Jira / Guard | flat groups + per-project roles | SCIM; synced groups read-only | project admins |
| Trello | Enterprise > Workspaces | via Guard | Workspace admins |
| AD / Entra | OU tree (policy) vs nestable groups (access); AUs not nestable | groups claim 150 SAML / 200 JWT, then omitted | OU delegation, AUs |
| Google | one OU per user vs groups | | delegated admin per OU |
| Keycloak | group tree, inheritance of roles/attributes | full-path groups in tokens | |
| Okta | flat groups + rules | Group Push, SCIM | |
| Mattermost | teams > channels | group-synced teams add and remove | team admins |
| Nextcloud | flat groups | LDAP incl. nested | subadmins |
| OpenProject | parent groups apply to subgroups | LDAP removes only synced memberships | project admins |
| Grafana | flat teams, nested folders | team sync keeps manual members | team Admins |

### 4.3 Patterns that repeat

1. **Two different trees.** Administrative structure (AD OU, Google OU, GitLab
   group, Trello Enterprise) answers *who administers / which policy*. Access
   groups (AD groups, Google Groups, GitHub teams) answer *who may open what*.
   Mixing them is the usual source of confusion - and is exactly the "what is the
   difference between organizations and teams?" question in #4178.
2. **Inheritance flows down, never up.** GitHub nested teams, GitLab subgroups,
   Keycloak subgroups, OpenProject parent groups, Grafana folders. A child can
   get more, not less.
3. **Synced membership is owned by the sync - with two variants.** Strict:
   GitHub team sync, Mattermost group-synced teams and Atlassian Guard groups
   are IdP-owned and block manual edits. Mixed: Grafana team sync keeps manually
   added members, and OpenProject's LDAP sync removes only memberships it
   created. Either way the app knows where each membership came from.
4. **Groups map to roles per resource** (Jira project roles, Redmine and
   Kanboard group roles, Grafana folder permissions, GitLab group links with a
   maximum role).
5. **Delegation** is common: team maintainers, Nextcloud subadmins, OU and
   administrative-unit admins.
6. **Rule-based membership** exists in Entra, Google and Okta, always with "no
   manual members" for those groups.
7. **Admin UIs are tables with bulk actions**; trees appear as a navigator
   (Google OU tree) and CSV is the bulk path (Entra, Google).

## 5. Question 1: what features are asked for

Grouped from section 2, most requested first:

1. **Membership follows into boards, both ways** (#4178, #4265, #5050 closed,
   #4575): add a person to a team once and they can work on every board of
   the team; remove them and they lose it; do not demote board admins.
2. **Board admins share boards with orgs/teams themselves** (#5141, #4265).
3. **Bulk handling of people** (#4265 "60 people", #5141 "40 people", #802
   "Board group template", #4575 "auto-add all new users to a team").
4. **Identity-provider groups become WeKan groups** (#802 LDAP subgroups / OU /
   AD groups, #5847, #4790): including nested AD groups, admin and roles from
   groups, removal when the IdP removes.
5. **Hierarchy** (#802 departments, #4178 four university levels, #4791
   subfolders): Org > Department > Team > Person, visible as a tree / org chart
   and usable for browsing boards.
6. **Group-scoped roles and permissions** (#3022, #4790 "BoardAdmin to LDAP
   group", #4527, #2217).
7. **Group-scoped shared things**: labels (#2761, #4698), templates (done:
   Shared Templates), All Boards tabs/folders per org/team (#802, #4791).
8. **Teams as actors**: team as card assignee, `@team` mention, notification
   audience (#802, #2026).
9. **Visibility limits**: see only people in my org/team (#802; partly done by
   #6116 restriction settings).
10. **Admin powers over boards**: list all boards, take ownership (#802 comments).

## 6. Question 2: where to manage what

Options:

- **A. Everything in Admin Panel** (today's state). Simple, safe; does not
  scale socially: the site admin becomes the bottleneck for every team change
  (#5141).
- **B. Admin Panel for structure, board admins for sharing** - board admins pick
  from teams they are allowed to see.
- **C. B plus delegated team maintainers / org admins** (GitHub, Nextcloud
  subadmins, Mattermost team admins).
- **D. Self-service** (anyone creates teams, like Trello Workspaces). Most
  flexible; conflicts with IdP-owned groups and with tenant isolation.

Recommendation: **C**, with D only as an Admin Panel setting later.

| Task | Site admin (Admin Panel) | Org admin (exists) | Team maintainer (new) | Board admin | Member |
| --- | --- | --- | --- | --- | --- |
| Create/delete orgs, tenant domains | yes | own org settings only | | | |
| Create teams, place them in tree | yes | inside own org | sub-teams of own team (option) | | |
| Add/remove team members | yes | in own org | own team (not IdP-synced ones) | | |
| Configure IdP sync, SCIM tokens | yes | | | | |
| Share board with a team, choose its role | yes | yes | yes | **yes - teams visible to them** | |
| Hide a team-shared board for myself / leave | | | | | **yes** (#4265) |
| See my teams and their boards | | | | | yes (All Boards tabs/workspaces) |

"Teams visible to a board admin" needs a rule. Options: (1) teams the board
admin is a member of; (2) all teams of the board admin's orgs; (3) teams marked
"visible to everyone"; (4) all teams. Recommend **(1)+(2)+(3)**, with names only
(no member list) published through a new small publication, so #5141 is fixed
without publishing admin data (the concern raised in the 2026-09-27 audit).

## 7. Question 3: group and bulk actions

Yes - and they should be built on *teams* rather than on copying users around.

Bulk actions worth having, ordered by value per effort:

1. **People table: "select all N matching filter"**, not only the page; actions
   *Add to team*, *Remove from team*, *Add to organization*, *Remove from
   organization*, *Set active/inactive*. One server method taking the filter or
   id list, not one `editUser` call per user (today's
   `Template.modifyTeamsUsers`).
2. **Team detail: "Add members"** with a multi-select search box that accepts
   pasted lists (usernames or emails, one per line or comma separated) - the
   GitHub/GitLab "invite many" pattern. Reports unknown names.
3. **CSV import/export of memberships**: `username,team,role` (and `org`).
   Export gives an admin a spreadsheet to edit and re-import; dry-run preview
   before applying.
4. **Rule-based (dynamic) teams**: membership computed from email domain
   (exists for orgs), IdP group, auth method, or a user field - like Entra
   dynamic groups / Okta group rules. Generalises `orgAutoAddUsersWithDomainName`
   and `OAUTH2_DEFAULT_ORGANIZATION`.
5. **By IdP group**: map IdP group -> team (section 9).
6. **Board side**: "Add team" plus "convert these 60 individual members into a
   team" (#4265 a) and "expand team into individuals" (#4265 b).
7. **REST**: `POST/DELETE /api/teams/:id/members` and the same for orgs, for
   scripts (#2761's REST loop approach, generalised).

Every bulk write should go through one server method that writes in batches,
logs one activity summary, and is idempotent.

## 8. Question 4: nested hierarchy data model

### 8.1 What to nest

- **Option N1: nest Teams only** (`team.parentId`), keep Orgs flat as the
  administrative/tenant boundary, and give each team an `orgId`. This is the
  GitHub model (org > nested teams) and matches the "two trees" pattern.
- **Option N2: nest Organizations** (departments as sub-orgs). Clashes with
  orgs being tenants (domains, branding, backups, org admins in
  `models/lib/tenantAdmin.js`): a sub-org would need rules for inheriting all of
  that.
- **Option N3: one generic "group" tree** replacing both. Cleanest on paper,
  but a large migration of `users.orgs/teams`, `boards.orgs/teams`, settings,
  REST and the tenant code.

Recommend **N1**. A "department" is a team with children.

### 8.2 Storage options in MongoDB / FerretDB

MongoDB documents the standard patterns in
[Model Tree Structures](https://www.mongodb.com/docs/manual/applications/data-models-tree-structures/).

| Pattern | Read subtree | Read ancestors | Move a subtree | Fit for WeKan |
| --- | --- | --- | --- | --- |
| Parent reference (`parentId`) | recursive queries, or `$graphLookup` | walk up | 1 update | simple, but subtree queries need `$graphLookup` |
| Array of ancestors (`parentId` + `ancestorIds[]`) | `{ancestorIds: X}` with an index | read the array | update every descendant | **best fit** |
| Materialized path (`path: ",a,b,c,"`) | regex prefix | parse | update descendants | good, string matching is fragile with renames if names are used |
| Nested sets (left/right) | range | range | renumber many docs | poor for frequent edits |
| Closure table (separate collection of ancestor/descendant pairs) | 1 query | 1 query | many rows | heavy; SQL idiom |

`$graphLookup` is **not implemented** in WeKan's FerretDB v1 fork:
`.tools/FerretDB/internal/handler/common/aggregations/stages/stages.go` lists it
in `unsupportedStages`, and `.tools/FerretDB/ROADMAP.md` marks it
`ErrNotImplemented`. Since FerretDB on SQLite is a default WeKan database, any
design that needs `$graphLookup` would break there. **Array of ancestors** needs
only plain equality queries on an indexed array, which every backend supports.

Suggested schema addition to `models/team.js`:

```
orgId:       String   // owning organization (optional for old teams)
parentId:    String   // null for a root team
ancestorIds: [String] // root first; maintained server-side only
depth:       Number   // ancestorIds.length, for limits and indentation
sort:        Number   // order among siblings
```

### 8.3 Inheritance

Two possible directions; pick one and say it in the UI:

- **Access inherits down (recommended, GitHub/GitLab):** a board shared with
  team *Faculty* is also visible to members of its sub-teams. Implementation:
  a user's *effective* team ids = their direct team ids plus every
  `ancestorIds` of those teams; board visibility selectors
  (`models/lib/boardVisibilitySelectors.js`) already accept a `teamIds` list,
  so only the list computation changes.
- **Membership rolls up (org-chart reading):** members of sub-teams count as
  members of the parent. This is the same as above seen from the other side;
  avoid offering both, it doubles the mental model.

Roles: a board's team share carries a role (`teams[].role`), and a member's
effective role on the board is the **highest** of their direct member role and
the roles of all shares they reach (GitLab's "can raise, not lower").

### 8.4 Integrity rules

- Cycle prevention: refuse a move where the new parent is the team itself or
  in its subtree (`newParent.ancestorIds` contains the team id). WeKan already
  has this exact rule for workspaces in `models/lib/workspacesTree.js`, and its
  before/inside/after drop logic can be reused for the tree UI.
- Depth limit (e.g. 10; GitLab allows 20 and recommends 5 or fewer) and a
  limit on the number of children per parent shown without paging.
- Moves are server-side, in one method that rewrites descendants' `ancestorIds`
  in a batch; a team and its parent must be in the same org.
- Deleting a team with children: refuse, or "move children to parent" - never
  orphan them.

## 9. Question 5: groups from LDAP, SAML, OAuth2/OIDC, SCIM

### 9.1 Standard mechanisms

| Source | Mechanism | Hierarchy | Notes |
| --- | --- | --- | --- |
| LDAP / AD | user `memberOf`, or group `member`/`uniqueMember`/`memberUid`; AD transitive search `(member:1.2.840.113556.1.4.1941:=<userDN>)` | AD nested groups (already supported by `LDAP_GROUP_FILTER_NESTED`); OUs are visible in the user's DN | Can be read at login and by background sync. Only source that can be *polled*. |
| OIDC / OAuth2 | `groups` (or `roles`) claim in ID token / userinfo, usually a list of strings; Keycloak can send full paths `/Uni/Faculty/Dept` | Keycloak full path gives a tree for free | Only refreshed **at login**; Entra omits the claim above 150 groups (SAML) or 200 (JWT), nested groups counted, and a JWT then points to Microsoft Graph instead. |
| SAML | attribute statement, commonly `memberOf`/`groups`/`http://schemas.microsoft.com/ws/2008/06/identity/claims/groups` | flat strings | Only at login. WeKan reads no group attribute today. |
| SCIM 2.0 | IdP calls the app's `/scim/v2/Users` and `/scim/v2/Groups` (RFC 7644), PATCH adds/removes `members` | flat | Push, near real time, includes deprovisioning. Entra ID, Okta, Keycloak (extension) and Authentik speak it. |

### 9.2 Recommended sync semantics

1. **Provenance on every membership.** Change `users.teams[]` entries to
   `{teamId, teamDisplayName, source, sourceRef, addedAt}` where `source` is
   `manual | ldap | oidc | saml | scim | rule`. This single field is what lets
   #4178 removal be safe: a sync removes only memberships *it* created; a
   manual membership survives. Mirror it on board members created from a team
   share (`members[].viaTeamId`), so removing someone from a team removes only
   the board entries the team gave them and never touches board admins or
   individually invited people (the demotion in #4178's 2023 comment).
2. **A team is either synced or manual.** `teamSyncMembersFromAuth` already
   exists; make it mean "this team is owned by source X, group Y" and lock manual
   edits in the UI (Mattermost/GitHub team-sync behaviour). Map by **stable
   group id** (DN, objectGUID, Keycloak group id), not by display name as
   `server/ldapGroupSync.js` does today.
3. **Mapping table instead of name matching.** Admin Panel / Teams / *Sync*:
   rows of `source, group pattern -> team (create if missing), role on team`.
   Today's env vars (`LDAP_SYNC_TEAMS_GROUPS` with wildcards) become the default
   rows.
4. **Hierarchy from the IdP** (optional): from Keycloak group paths or AD DN /
   nested groups, create the team tree automatically under a chosen root.
5. **Login-time vs background.** OIDC/SAML only update at login: say so in the
   UI ("last synced at login on ..."). For immediate deprovisioning recommend
   LDAP background sync or SCIM.
6. **Support the standard OIDC `groups` claim** (list of strings, configurable
   claim name), not only the WeKan-specific group objects of
   `addGroupsWithAttributes`; and the SAML group attribute.
7. **SCIM endpoint** (later): `/scim/v2/Users`, `/scim/v2/Groups`, bearer token
   per IdP, mapped to users and synced teams. Large but standard; it is what
   enterprise IdPs expect and it closes the "removal is late" gap.

## 10. Question 6: table, board or tree UI

| View | Good for | Bad for |
| --- | --- | --- |
| **Table** (sortable, filterable, paged, bulk select) | thousands of people; search; bulk edits; audit; keyboard | seeing structure |
| **Tree / org chart** | navigating departments; moving a sub-team; seeing who reports where | many people per node; bulk edits |
| **Board** (columns = teams, cards = people, drag to move) | a handful of teams with tens of people, re-planning who is in which squad; very "WeKan" | hundreds of people (columns become endless), people in several teams (a card can only sit in one column), IdP-synced teams |

Recommendation: **tree on the left + table on the right**, with the board as an
optional view of *one* team's direct sub-teams.

Admin Panel / People / Teams (sketch):

```
+-- Teams ----------------+  Faculty of Science  (synced: LDAP cn=sci)  [Edit]
| [search teams      ]    |  Members 212 | Sub-teams 4 | Boards 31 | Sync
| v University (Org)      |  -----------------------------------------------
|   v Faculty of Science  |  [search people   ] [Source: all v] [Role: all v]
|     > Mathematics   48  |  [x] 212 selected (all matching)    [Actions v]
|     > Physics       61  |  ---------------------------------------------
|     > Chemistry     55  |  [x] Name        Username  Team role  Source  Since
|   > Faculty of Arts     |  [x] A. Virtanen avirtanen maintainer manual  2025
|   > Administration      |  [x] B. Korhonen bkorhonen member     ldap    2026
| + New team              |  ...                      page 1 / 9   < >
+-------------------------+
 Actions: Add people... | Remove | Move to team... | Set team role | Export CSV
```

- Drag a tree node onto another to re-parent (reuse the workspace tree drop
  zones, `models/lib/workspacesTree.js`); drag selected table rows onto a tree
  node to add them to that team.
- The table is the existing [table page](../Features/Page/Table.md) with a
  selection column; counts in the tree come from one aggregate.
- Tabs "Boards" and "Sync" on the right show the team's board shares (with
  role) and the IdP mapping.

Board view of a team (optional, small teams):

```
Faculty of Science / Physics   [Table | Board]
| Lab A (8)      | Lab B (12)     | Unassigned (3) |
| [A. Virtanen]  | [C. Nieminen]  | [D. Mäkinen]   |
| ...            | ...            |                |
```

Only for manual teams, with a cap (e.g. 200 people) beyond which the toggle
is disabled with an explanation.

Board sidebar / Teams tab (board admin):

```
Teams with access                    role
  Physics (61, + 2 sub-teams)        Normal     [v] [x]
  Physics maintainers (3)            Board admin[v] [x]
[+ Add team]  (lists teams you belong to or that are visible)
[Convert 60 individual members into a new team...]
```

Member (All Boards): a tab or workspace per team the user belongs to (#802,
#4791), and "Hide this board for me" for team-shared boards (#4265).

## 11. Question 7: what to copy from others

1. **GitHub**: org > nested teams, team maintainers, team as access unit,
   `@org/team` mentions, team sync with IdP.
2. **GitLab**: inheritance down the tree with "raise, never lower"; a fixed depth
   limit; group links with a maximum role.
3. **Jira**: groups are mapped to *roles per board*, rather than permissions on
   groups - matches WeKan's per-board roles and #3022.
4. **Mattermost / GitHub team sync**: a synced team is owned by the sync; removal
   is automatic; manual edits are blocked for those teams.
5. **AD / Google**: keep administrative structure (Org) separate from access
   groups (Team).
6. **Entra / Okta**: dynamic rule-based membership for "all users with domain X"
   or "all LDAP users" (#4575).
7. **Nextcloud**: subadmins - delegated admins limited to their groups (WeKan
   already did this for orgs).
8. **SCIM**: the standard way enterprises provision and deprovision; one
   endpoint serves Entra, Okta and others.
9. **Grafana** (already the 2019 reference in #802): permissions entries that
   name a user *or* a team with a role, which is exactly a board share with a
   role.

## 12. Suggested phased roadmap

Each phase is useful on its own and keeps existing data working.

### Phase 0 - fix what is half done (small)

- Publication of *team/org names visible to me* for the board sidebar picker;
  board admins can add teams/orgs. Closes **#5141**.
- Org gain hook equal to the team one (`addUserToTeamBoards` for orgs), and the
  bulk Organizations action beside the Teams one in People.
- Server method for bulk team/org membership changes (filter or id list).
- Fix the defects listed at the end of section 3.4: remove or implement
  `LDAP_SYNC_GROUP_ROLES`, fix the OIDC org argument order, document
  `PROPAGATE_OIDC_DATA`, make the `*SyncMembersFromAuth` flags mean something.
- Default "Add all new users to team X" rule (generalise domain rule and
  `OAUTH2_DEFAULT_ORGANIZATION`). Answers **#4575**'s follow-up.

### Phase 1 - provenance and revocation

- `source` on `users.teams[]`/`users.orgs[]`, `viaTeamId`/`viaOrgId` on
  `board.members[]`; migration marks existing entries `manual` / unknown.
- Removing a person from a team removes only board entries the team created,
  never admins, never individually invited members. Closes **#4178**.
- LDAP/OIDC sync can remove memberships it created (opt-in), mapped by group id.
- Member "hide / leave a team board for me" (**#4265**).

### Phase 2 - teams carry roles; groups map to roles

- `board.teams[].role` (one of the nine board roles); effective role = highest.
- IdP group -> team mapping table; standard OIDC `groups` claim; SAML group
  attribute. Closes the LDAP-group-to-BoardAdmin item of **#4790** and parts of
  **#802**/**#5847**.
- Team maintainers (delegation) and team-scoped CSV import/export.

### Phase 3 - hierarchy

- `orgId`, `parentId`, `ancestorIds` on teams; access inherits down; tree +
  table Admin Panel; tree from Keycloak paths / AD nesting optionally.
- All Boards: tabs/workspaces per team, grouped by the tree (**#4791**, #802
  team overview page).
- Covers the hierarchy requests in **#802** and **#4178**.

### Phase 4 - standards and extras

- SCIM 2.0 `/Users` and `/Groups` (provisioning and deprovisioning).
- Team as card assignee and `@team` mention (#802), team notification audience
  (#2026), shared labels per org/team (#2761, #4698).
- Custom roles (#3022) can then be defined once and *assigned to teams*, which is
  where custom roles pay off.

## 13. Open questions for the maintainer

1. Is it acceptable to define **Organization = administrative/tenant boundary,
   Team = access group**, and to say so in the UI and docs?
2. Should team-derived board access stay **copied into `board.members`** (as
   today, with provenance added), or become **computed** from `board.teams` at
   permission-check time (simpler revocation, more code paths to touch:
   `board.hasMember`, `allowIsBoardMember*` in `server/lib/utils.js`,
   attachments, export)? Copying with provenance is the smaller step; computing
   is the cleaner end state.
3. Which teams may a board admin see in the picker (section 6)?
4. Hierarchy for Teams only (recommended) or also Organizations?
5. Is a SCIM endpoint in scope for WeKan, or should LDAP background sync remain
   the deprovisioning path?
6. Should synced teams be locked against manual edits, or allow manual
   additions that the sync never removes?
