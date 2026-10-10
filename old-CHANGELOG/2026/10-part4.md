# WeKan ® 2026-10 releases, part 4

Moved out of [CHANGELOG.md](../../CHANGELOG.md) to keep that
file small enough to open (wekan/wekan#6580). Nothing here has been changed:
a release section is a record, and it reads the same as it did there.

This is part 4 of 5, newest first: [1](10.md), [2](10-part2.md), [3](10-part3.md), 4, [5](10-part5.md).

Releases per day:

| 2026-10 | Releases |
| --- | --- |
| 01 | 1 |
| 02 | 1 |

# v12.15 2026-10-02 WeKan ® release

**In short:** A security release. **CacheBleed**, **SyncBleed** and
**CasTokenBleed** are fixed, with thirteen more newly named issues such as
**RepointBleed**, **TrayBleed** and **ZipBombBleed**, follow-up fixes for
earlier Hall of Fame entries, and assigned-only members limited to their own
cards on every read path. LDAP certificates are verified by default again,
password guessing is braked per account, and Admin Panel → Problems records
more attempts without disabling users for ordinary use. Dependency lines show
on instance boards, and translations cover more languages.

This release fixes the following CRITICAL SECURITY ISSUES:

**Attachments and avatars** - who may keep a copy of a file served after an
access check.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/77c3957e5c">Attachments and avatars are private, revalidated responses, never shared-cacheable</a>. Thanks to alham-rizvi and xet7.</summary>

[CacheBleed](https://wekan.fi/hall-of-fame/cachebleed/),
[GHSA-w3qg-pf27-g68r](https://github.com/wekan/wekan/security/advisories/GHSA-w3qg-pf27-g68r):
since v8.16, attachments were answered with `Cache-Control: public,
max-age=31536000` and no `Vary` after the board access check. A shared cache in
front of WeKan (CDN, caching reverse proxy, corporate proxy) could store a
member's copy and serve it to anyone with the URL and no credentials for a
year, also after the member was removed from the board. The same header was in
both `?download=1` branches and both avatar routes, and Meteor-Files' own
`/cdn/storage` route sent its default public one-year header.

Every file response, its 304 and the thumbnail now send `private, no-cache` and
`Vary: Cookie, Authorization, X-Auth-Token` from one helper,
`models/lib/fileCacheHeaders.js`. Public boards get the same policy, because a
board made private later would leave a public copy behind. The ETag keeps
revalidation a bodiless 304.

The test drives the policy against the shared-cache rules the report used. The
negative test fails on any public `Cache-Control`, a FilesCollection left on
the Meteor-Files default, or a file route sending an ETag without the policy,
anywhere in the tree. The Playwright thumbnail spec checks the headers on every
route. Nothing is refused, so there is no Admin Panel → Problems key.

</details>

**List Sync** - which servers a Sync source may reach, and what a failure shows.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2172f19d88">Requests go through the SSRF guard, and errors carry no response text</a>. Thanks to alham-rizvi and xet7.</summary>

[SyncBleed](https://wekan.fi/hall-of-fame/syncbleed/),
[GHSA-5q84-p3vr-f3xv](https://github.com/wekan/wekan/security/advisories/GHSA-5q84-p3vr-f3xv):
a board member with write access chooses the Gitea, Forgejo, GitLab or Jira
server address. It was fetched with the platform `fetch()`, so it reached
127.0.0.1, private networks and the cloud metadata address, and up to 200 bytes
of a failed response came back in the preview and in the list's last error. An
open and a closed internal port answered differently.

Every request now goes through `fetchSafe`: internal addresses refused, DNS
pinned, redirects refused, size and time bounded. An error carries the origin
and HTTP status only, and a refusal does not name what a host resolved to.
Saving Sync settings refuses an internal address too. A self-hosted tracker on
the server's network is allowed only by the administrator, with
`LIST_SYNC_ALLOWED_PRIVATE_HOSTS`. The browser test found that an IPv6 literal
such as `[::1]` was looked up as a name at save time; the shared validator now
checks it as an address.

The test reproduces the report on the real fetcher for every provider. The
negative test fails on a platform `fetch()` to anything but a fixed or
administrator-allowed host, or a response body copied into an error, anywhere
in the server tree. The browser test saves and previews internal addresses and
checks the mock tracker receives nothing. Refusals show as SyncBleed in Admin
Panel → Problems.

</details>

**Sign-in** - who can sign in as whom, and what the sign-in pages give away.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d3095fefd6">A CAS callback is accepted only from the browser that started that login</a>. Thanks to xet7.</summary>

[CasTokenBleed](https://wekan.fi/hall-of-fame/castokenbleed/): the CAS callback
stored the validated CAS identity under whatever `casToken` its URL carried,
and that token is chosen by the browser. An attacker could pick a token, get a
victim who is signed in to CAS to open a CAS login link carrying it, and then
log in to WeKan with that token as the victim. The browser that starts a CAS
login now sets a SameSite cookie holding its token, and the callback must
present it. A mismatch shows as CasTokenBleed in Admin Panel → Problems. A
`ticket` query parameter on an instance without CAS is left to its route.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/611093e957">Passwordless sign-in codes are long and short-lived enough not to be guessed</a>. Thanks to xet7.</summary>

[CodeBleed](https://wekan.fi/hall-of-fame/codebleed/): a sign-in code was
Meteor's default, 6 hex characters valid for an hour. The lockout counts
passwords, not codes, and the per-connection rate limit multiplies with
connections, so a thousand connections gave about one chance in ten per code.
Codes are now 10 characters and live 15 minutes, about one in three million
for the same spray. The code field takes the whole code and no longer asks for
a numeric keyboard. A wrong code looks like a mistyped one, so there is no
Problems record.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dd36db3641">A client sign-up cannot claim admin or LDAP account creation</a>. Thanks to xet7.</summary>

[SignupBleed](https://wekan.fi/hall-of-fame/signupbleed/), DDP sibling: the
REST fix did not cover the DDP sign-up methods, which accepted the options a
client sent. The guard in `server/lib/clientAccountCreationGuard.js` strips
`from` and `ldap` from client sign-ups and refuses sign-up while registration
is off, recording the attempt.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/433ff5506c">The sign-up form's own method is guarded too, and ordinary sign-up keeps working</a>. Thanks to xet7.</summary>

The real sign-up method is useraccounts' `ATCreateUserServer`; Meteor's
`createUser` is refused to clients anyway. The guard wraps both, and checks
the client's arguments first so `audit-argument-checks` does not reject every
sign-up.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c49d9d8d3e">A login lockout never disables the account being guessed</a>. Thanks to xet7.</summary>

[JamBleed](https://wekan.fi/hall-of-fame/jambleed/) regression: the lockout
record named the guessed account as its actor, and a high-severity blocked
record with a user id disables that account. Three wrong passwords from anyone
who knew a username disabled its owner until an admin noticed. The account is
now recorded as the target, the lockout key never disables, and an already
disabled account keeps the reason it was disabled for.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3156dec7bc">The login lockout starts even when one of its settings cannot be read</a>. Thanks to xet7.</summary>

One try/catch wrapped every lockout settings read at startup, so a single
failed read, for example while the database restarts, left the server with no
lockout at all. Each setting now falls back to its default.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fd8b51464f">Password guessing is braked per account without locking the owner out</a>. Thanks to xet7.</summary>

[BruteBleed](https://wekan.fi/hall-of-fame/brutebleed/): the lockouts count per
address and per account and address, so guessing spread over many addresses
was never slowed, and a hard per-account lockout would let a stranger lock the
owner out. After five failures on one account within 15 minutes, the account
accepts one attempt per slot, 1 s doubling to 30 s, over REST and DDP alike.
An early attempt is refused before the password is looked at, and addresses
the account has signed in from are not slowed. Refusals show as BruteBleed in
Admin Panel → Problems, naming the account as the target.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/daf6593adf">LDAP server certificates are verified by default again</a>. Thanks to xet7.</summary>

[LDAPBleed](https://wekan.fi/hall-of-fame/ldapbleed/) regression: the code
verified certificates when `LDAP_REJECT_UNAUTHORIZED` was unset, but the Docker
image and the snap set it to `false`, and an empty value disabled verification
too. The default is `true` everywhere and only the exact value `false` turns it
off. **Upgrade note:** an LDAPS or StartTLS server with a self-signed or
private-CA certificate needs that CA in `LDAP_CA_CERT`, or
`LDAP_REJECT_UNAUTHORIZED=false` set deliberately.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1b37bea1f0">The LDAP server details are published to site admins only</a>. Thanks to xet7.</summary>

[DirectoryInfoBleed](https://wekan.fi/hall-of-fame/directoryinfobleed/): every
visitor subscribes to `setting` before signing in, and it carried the
directory server's host, port, base DN, bind account DN, search filter and
encryption mode. Only Admin Panel → LDAP reads them.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/da394cf2ea">user-authenticationMethod answers for the caller's own account only</a>. Thanks to xet7.</summary>

[AuthMethodBleed](https://wekan.fi/hall-of-fame/authmethodbleed/): any signed-in
user could read any other user's organizations, teams and login method by
username.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/737faedef5">The REST admin checks fail closed on a null user</a>. Thanks to xet7.</summary>

`checkUserId`, `checkAdminOrCondition` and `checkBoardWriteAccess` refused
only when the admin lookup returned exactly `undefined`, so a `null` from the
cache or the request would have passed. They refuse any falsy value now.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ec6266134e">checkLoggedIn fails closed on a null user id too</a>. Thanks to xet7.</summary>

The same `=== undefined` comparison let a `null` user id through the logged-in
check.

</details>

**Board access and roles** - what members of each role may read and change.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1a218ead02">Assigned-only members see only their own cards on every read path</a>. Thanks to xet7.</summary>

[AssignedBleed](https://wekan.fi/hall-of-fame/assignedbleed/), read siblings:
the board publication showed an assigned-only member only their assigned
cards, but the attachment API (REST and DDP list, download and info), the
activities publication, Due Cards with all users, Global Search, the
structural move pickers and position history checked only membership. Each now
applies the same rule. A download or info request for another card's
attachment shows as AssignedBleed in Admin Panel → Problems.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a3da90833a">Assigned-only members cannot read the whole board over REST</a>. Thanks to xet7.</summary>

`Authentication.checkBoardAccess`, behind 32 REST routes that return
whole-board data, let the three assigned-only roles through, so such a
member's API client read every card the UI hides. They are refused there until
those routes scope to assigned cards.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7788e0c4e6">Assigned-only members copy and move only their own cards</a>. Thanks to xet7.</summary>

Copying a card, a list or a swimlane, saving a card as a template and moving a
list showed the copied content on a board the user controls. An assigned-only
member may now copy only a card assigned to them, never a whole list or
swimlane, through one rule, `mayCopyFromBoard`.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cd07d8db18">Clients may only mark and remove notification entries, never add them</a>. Thanks to xet7.</summary>

[TrayBleed](https://wekan.fi/hall-of-fame/traybleed/): `profile.notifications`
fell under the client-writable `profile.*`. An entry names an activity, and the
notification publications then send that activity's card, comments,
checklists and attachments from any board. A client may now only set an
entry's read state and pull entries. Anything else is denied and shows as
TrayBleed in Admin Panel → Problems.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3af89a6a00">Board imports honour "private boards only"</a>. Thanks to xet7.</summary>

[VisibilityBleed](https://wekan.fi/hall-of-fame/visibilitybleed/), import
sibling: Trello and WeKan imports write the board through `Boards.direct`,
which skips the hook that enforces Admin Panel's private-only policy, so an
export marked public or instance arrived open. Both importers now apply the
policy before writing.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3da444db74">Linked cards over REST follow the Link popup's rule</a>. Thanks to xet7.</summary>

[LinkedWriteBleed](https://wekan.fi/hall-of-fame/linkedwritebleed/), REST
sibling: the route and the method now share `createLinkedCardFor`, including
its assigned-only check.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1167a2ae2f">A subtask deposit board admits invitees only from its own inviters</a>. Thanks to xet7.</summary>

[SubtaskDepositBleed](https://wekan.fi/hall-of-fame/subtaskdepositbleed/),
invite sibling: inviting someone to a board also added them to its subtask
deposit board, checking the inviter's rights only on the first board. The
deposit board now admits them only when the inviter may invite there too.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c6f59fc923">The bulk card route checks the parent card, and refused parents show in Problems</a>. Thanks to xet7.</summary>

[ParentBleed](https://wekan.fi/hall-of-fame/parentbleed/), bulk sibling:
`POST .../cards/bulk` wrote each entry's `parentId` without asking whether the
parent's board is visible to the caller.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ebcaac1962">A client board insert names only its creator as member</a>. Thanks to xet7.</summary>

[OwnerBleed](https://wekan.fi/hall-of-fame/ownerbleed/), DDP sibling:
`Boards.insert` from a client accepted its own members array, so a board could
name somebody else as its admin or add people who never joined. Such an
insert is refused and shows as OwnerBleed in Admin Panel → Problems.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fd458543f9">Shared board display settings need write access</a>. Thanks to xet7.</summary>

[MutationBleed](https://wekan.fi/hall-of-fame/mutationbleed/) siblings: list
width, automatic width and sticky list headers change what every viewer sees,
and refused only non-members. They now require write access, and the list
width write is awaited.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d3a94fd2d9">Removed members no longer reach board ids or board copies</a>. Thanks to xet7.</summary>

[StaleBleed](https://wekan.fi/hall-of-fame/stalebleed/) and
[ManageBoardBleed](https://wekan.fi/hall-of-fame/manageboardbleed/) siblings:
`GET /api/user` and the migration status publication matched boards a member
was removed from, and the board copy route checked admin without `isActive`.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1f368e9c7c">History follows a list or swimlane to its current board</a>. Thanks to xet7.</summary>

[HistoryScopeBleed](https://wekan.fi/hall-of-fame/historyscopebleed/) sibling:
restoring, undoing or redoing a list or swimlane checked the board the
History row was recorded on, not the board it is on now, nor any board the row
moves something to. Both now need write access.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d2539ca1d2">In-app chart data follows the export rule</a>. Thanks to xet7.</summary>

[ExportScopeBleed](https://wekan.fi/hall-of-fame/exportscopebleed/) sibling:
`boardChartData` returned the titles, dates and assignees of cards an
assigned-only member cannot see. It now uses `canExportBoardData`.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3d080956be">Position history is written by the server only, and undo/redo stay on the entry's boards</a>. Thanks to xet7.</summary>

[PositionHistoryBleed](https://wekan.fi/hall-of-fame/positionhistorybleed/)
sibling: a client could insert a history entry naming another board's card,
and undo or redo moved it into the client's board or soft-deleted another
board's list. Client inserts are refused, and undo and redo check that the
entity is still on one of the entry's boards and that the user can write
there.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fb93c5f430">A Sandstorm import archives only the importer's own board</a>. Thanks to xet7.</summary>

[ArchiveBleed](https://wekan.fi/hall-of-fame/archivebleed/): on Sandstorm,
`importBoard` and `cloneBoard` archive the board the import was started from,
an id the client sends and nothing checked. Only a board admin's board is
replaced now; otherwise the import leaves that board alone.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c5eb9fc060">Custom translations are site-admin only</a>. Thanks to xet7.</summary>

[MegaBleed](https://wekan.fi/hall-of-fame/megableed/) and
[TenantBleed](https://wekan.fi/hall-of-fame/tenantbleed/) sibling: the
Translation collection's client rules let any user write a document whose id
equalled their user id. Custom translations replace text for everyone and some
render as HTML, so a member could plant markup for an admin's browser.

</details>

**Multitenancy** - which Organization a hostname belongs to.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/94a8c41b3c">Only a site admin assigns a tenant hostname, and never the instance's own</a>. Thanks to xet7.</summary>

[TenantBleed](https://wekan.fi/hall-of-fame/tenantbleed/) hardening: an
Organization's own admin could set its tenant hostnames to anything not yet
claimed, the instance's ROOT_URL host included, which put that Organization's
branding on everybody's sign-in page. The instance host is refused for
everyone, and an org admin's attempt shows as TenantBleed in Admin Panel →
Problems. A new hostname from an org admin is stored as a request that a site
admin assigns by saving it; dropping hostnames still applies at once. The new
messages are in English, pending Transifex.

</details>

**Rules, webhooks and integrations** - which board a rule acts on, and what a
webhook may send.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f02da1bfd2">Rule, webhook and custom-field documents cannot be moved to another board</a>. Thanks to xet7.</summary>

[RepointBleed](https://wekan.fi/hall-of-fame/repointbleed/): Triggers, Actions,
Rules and Integrations were authorized by the board they were on before an
update, and nothing refused the update changing it. A user could move a
trigger to `*`, which matched every board, and have a send-email action mail
them content from every private board, or move a webhook onto a private board.
A shared deny rule refuses the move, custom fields need write on every board
they are put on or taken off, and a rule runs only for its own board's
activity. Refusals show as RepointBleed in Admin Panel → Problems.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/047bde7546">A member cannot make WeKan post their own message through a board webhook</a>. Thanks to xet7.</summary>

[HookBleed](https://wekan.fi/hall-of-fame/hookbleed/): `outgoingWebhooks` built
the request from the caller's integration object and text, so any member,
read-only included, could post arbitrary text to the board's chat webhook as
WeKan or turn a one-way hook two-way. The request is built from the stored
integration, and a client may send only the card-opened notification.
Anything else shows as HookBleed in Admin Panel → Problems.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4af54face7">A board's webhook URLs are published to its admins only</a>. Thanks to xet7.</summary>

[HookUrlBleed](https://wekan.fi/hall-of-fame/hookurlbleed/): a chat
incoming-webhook URL carries its secret in the path, and the board publication
sent it to every reader of the board, anonymous visitors of a public board
included. Other readers now get only what the card-opened hook needs, and
`outgoingWebhooks` finds the integration by its id.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a8e836efd3">A chain of rules started by rules stops at a depth limit</a>. Thanks to xet7.</summary>

[BypassBleed](https://wekan.fi/hall-of-fame/bypassbleed/): the 2022 report's
second part, two rules undoing each other recursing without end, was never
fixed. A chain of rules started by rules now stops at depth 5 and shows in
Admin Panel → Problems as detected.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c63d909c81">A legacy rule action without a board acts on its own board</a>. Thanks to xet7.</summary>

[RuleBleed](https://wekan.fi/hall-of-fame/rulebleed/) sibling: an action
without a board id looked up lists and swimlanes by title on any board. It
now gets the activity's board before any lookup or check.

</details>

**Files, attachments and imports** - what may be stored, served and inflated.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/146d58df27">A board's background can only be one of its own attachments</a>. Thanks to xet7.</summary>

[BackgroundBleed](https://wekan.fi/hall-of-fame/backgroundbleed/): the
background download routes returned whatever attachment `backgroundImageId`
named, and a board admin could set it to any attachment id, so anyone could
create a board pointing at another board's private file and download it. Both
paths serve only the board's own live attachment, and setting another one is
refused and shows as BackgroundBleed in Admin Panel → Problems.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e7ed71ee2e">Zip imports count the bytes that really inflate, and need write access</a>. Thanks to xet7.</summary>

[ZipBombBleed](https://wekan.fi/hall-of-fame/zipbombbleed/): the Trello zip
import read sizes from a field unzipper's entries do not have, so every check
saw 0 and a small archive inflated without limit in memory; the WeKan zip
import had no cap at all. Entries are now read through `readZipEntryBounded`,
with per-entry and per-archive limits, and `POST /api/import/zip` requires
write access.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/de67550476">The live Trello import sends the Trello credential only to Trello's own hosts</a>. Thanks to xet7.</summary>

[RelayBleed](https://wekan.fi/hall-of-fame/relaybleed/): attachments, the board
background and member avatars were downloaded with the importer's Trello key
and token in the request, whatever host the URL named, so a renamed link
attachment on another host received the token. The credential now goes only to
`trello.com` and `api.trello.com` over HTTPS.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cd4c8064ae">API answers are no-store, and legacy attachments are private</a>. Thanks to xet7.</summary>

[CacheBleed](https://wekan.fi/hall-of-fame/cachebleed/) siblings: REST answers
(exports, base64 attachments, board data) carried no cache policy, and the
legacy attachment route served files without one for every method. API
answers are now `no-store`, and legacy attachments answer GET and HEAD only,
with the private file policy.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/36341213f1">The attachment API checks copy and move targets, and the copy's source</a>. Thanks to xet7.</summary>

The copy and move methods wrote the target card, list and swimlane ids as
given, checking only the target board, so a file could be planted on a card of
a board the caller cannot write. All three must be on the target board now,
and a copy follows the assigned-only copy rule.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a79e05223a">Attachment migration progress returns attachment ids only</a>. Thanks to xet7.</summary>

[MigrationBleed](https://wekan.fi/hall-of-fame/migrationbleed/): two methods
sent the full stored attachment documents, with storage paths and names of
files on cards the caller cannot see, to anybody who could read the board.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/06b8ea5750">An avatar's client-supplied file id cannot traverse paths</a>. Thanks to xet7.</summary>

[UploadPathBleed](https://wekan.fi/hall-of-fame/uploadpathbleed/), avatar
sibling: avatars used the client's file id in the on-disk name verbatim.
Attachments and avatars now share one rule, and avatars need a signed-in
uploader.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e14671efa6">Avatars are served inline only as images, and clients cannot change a file's type</a>. Thanks to xet7.</summary>

[AvatarMimeBleed](https://wekan.fi/hall-of-fame/avatarmimebleed/), prefix-route
sibling: the older avatar routes served an avatar inline under its stored
type, which its owner could change, so an upload could be re-labelled and
served as HTML. Only known image types are inline now, and clients may change
only a file's name.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6ba2e3d060">An attachment rename cannot store markup again</a>. Thanks to xet7.</summary>

FileNameBleed's server check: a 2023 build fix
deleted the server's check, leaving only the client's. Names are escaped on
display, so it did not execute; the server refuses such a name again.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0dd33ef806">A backup restore does not write through a symlink</a>. Thanks to xet7.</summary>

The attachment and avatar restore kept each entry's name inside the files
directory, then wrote with `createWriteStream`, which follows a symlink already
on that path. Such entries are skipped and files are replaced exclusively, as
the full-backup restore already did. Defence in depth: archive entries cannot
create symlinks themselves.

</details>

**The server itself** - what a request may do to the process, and what errors
and pages give away.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/875a0065ed">User-chosen ids can no longer pollute Object.prototype in the server</a>. Thanks to xet7.</summary>

[PrototypeBleed](https://wekan.fi/hall-of-fame/prototypebleed/): the per-user
layout methods wrote maps keyed by client ids, so
`setListCollapsedState('__proto__', 'isAdmin', true)` set a property on every
object in the server process until a restart. Every such map now checks its
keys, and a refusal shows as PrototypeBleed in Admin Panel → Problems.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c2905e17ce">A custom-field template regex cannot stop the server</a>. Thanks to xet7.</summary>

A string-template custom field runs a member's pattern on another member's
value, and rule e-mails format cards on the server, so a pattern like `(a+)+$`
stopped the event loop for everyone. The server runs it in its own V8 context
under a 50 ms limit, and pattern and value lengths are capped.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bb4c892254">With the REST API off, /API and encoded spellings are refused too</a>. Thanks to xet7.</summary>

The API gate checked `req.url.startsWith('/api')`, but Express routes
case-insensitively and on the decoded path, so `/API/...` and `/%61pi/...`
reached every handler. The gate now decides the same way. `isImpersonated`
answers only about the caller, or to a site admin.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/215293868b">Refused REST requests answer with their real status and a safe message</a>. Thanks to xet7.</summary>

[ErrorBleed](https://wekan.fi/hall-of-fame/errorbleed/) siblings: thirty-four
more REST handlers answered a refusal with HTTP 200 and the raw error object.
All answer through `publicErrorData()` now.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8fc9bd5a94">Board member REST routes never answer with the user document</a>. Thanks to xet7.</summary>

[HashBleed](https://wekan.fi/hall-of-fame/hashbleed/) siblings: the member add
and remove routes answered an unknown action with the target user's document,
password and login-token hashes included, to any board admin. An unknown action
is refused before the user is read.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a4b524a5fc">The /metrics token is compared in constant time, and an empty one admits nobody</a>. Thanks to xet7.</summary>

[MetricsBleed](https://wekan.fi/hall-of-fame/metricsbleed/) sibling: with
`METRICS_ACCESS_TOKEN` set but empty, `?access_token=` matched, and the loose
comparison leaked through timing how much of a guess was right.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dae1fd68e8">WeKan's pages refuse being framed by other sites again</a>. Thanks to xet7.</summary>

[FrameBleed](https://wekan.fi/hall-of-fame/framebleed/) regression: the
framing headers had been commented out. They are sent on the app's pages again,
and the test build turns the browser policy on.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a9e8bda47b">Member-written values are escaped in templated HTML notification mail</a>. Thanks to xet7.</summary>

[MailTitleBleed](https://wekan.fi/hall-of-fame/mailtitlebleed/) regression:
with an admin-defined activity mail template, member-written titles and
comments were substituted unescaped into the HTML body.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1076c08381">Every hidden HTML comment is made visible, not only the first</a>. Thanks to xet7.</summary>

[InvisibleBleed](https://wekan.fi/hall-of-fame/invisiblebleed/): the fix used
`replace` with a string, which changes only the first occurrence, so a second
hidden comment stayed hidden.

</details>

**Admin Panel → Problems** - that attempts show up, and that ordinary use does
not disable anybody.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9d323f2aaf">Problems records only attempts, and never disables users for ordinary use</a>. Thanks to xet7.</summary>

A blocked record of high severity that names a user disables that account, and
several were on paths ordinary users reach: writing back a card's assignees
after a member left, restoring history after a demotion, exporting as an
assigned-only member, a large import, an internal link in a Trello board, an
identity provider's avatar redirect and a cached older client's upload. Each
now records only real attempts, or records without disabling.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8ddce924ec">Problems keys that nothing recorded are recorded where their attack is refused</a>. Thanks to xet7.</summary>

Nine catalog keys had no caller, so their names could never appear in Admin
Panel → Problems. Now recorded: a hostname that resolves to an internal address
([DnsBleed](https://wekan.fi/hall-of-fame/dnsbleed/)), a webhook refused by the
SSRF guard ([IntegrationBleed](https://wekan.fi/hall-of-fame/integrationbleed/)),
a Trello import with a non-http source URL
([SourceBleed](https://wekan.fi/hall-of-fame/sourcebleed/)), a client call of
the OIDC-only organization and team methods
([OIDCBleed](https://wekan.fi/hall-of-fame/oidcbleed/)), a sign-up with a wrong
invitation code ([InviteBleed](https://wekan.fi/hall-of-fame/invitebleed/)) and a
read-only member's REST write
([ReadOnlyBleed](https://wekan.fi/hall-of-fame/readonlybleed/)). The keys that
nothing can attribute are listed with their reasons in the test.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c15f9486d8">TrayBleed and CasTokenBleed get Problems keys of their own</a>. Thanks to xet7.</summary>

ReadOnlyBleed gets the permissions test it was recorded without: it pins the
six Custom Field handlers and requires a write-level decision on every
mutating REST route.

</details>

and fixes the following bugs:

**Scrum** - copying and exporting a Scrum board.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/abda8c4e0f">Boards with sprints, releases or events export and copy again</a>. Thanks to xet7.</summary>

Since Scrum records got a per-lifetime `incarnation` (2026-09-30), the Scrum
transfer refused it as an unknown field, so board export and board copy of a
Scrum board with planning records answered 500. The transfer drops it, as
Scrum History does; any other unknown field is still refused.

</details>

**Board dependencies** - who sees the dependency lines.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2a75b8267f">Dependency lines show on instance boards to every signed-in user</a>. Thanks to xet7.</summary>

The dependency access rule allowed public boards and members only, so a
signed-in non-member of an instance-wide board could read its cards but not its
dependency lines. It now uses `readableWithoutMembership`, the rule every board
read shares, and the test covers signed-in and signed-out readers. A
[browser test](https://github.com/wekan/wekan/commit/9b6f840a67) imports My
Dependencies as a non-member of an instance board.

</details>

and has the following developer-facing changes:

**Security regression tests** - fixes held tree-wide rather than at one call
site.

- [BFLABleed and ExcelBleed are guarded tree-wide: every async access check is awaited](https://github.com/wekan/wekan/commit/1ef200aea1). Thanks to xet7.
- [CrashBleed's guard is checked on every activeUserByToken caller, not four files](https://github.com/wekan/wekan/commit/08a3a25c81). Thanks to xet7.
- [SheetColorBleed is pinned in the client viewer, where workbook colors reach CSS now](https://github.com/wekan/wekan/commit/d609dc7a88). Thanks to xet7.
- [RelayBleed and EmailBleed are counted in the coverage lists, matching names in any case](https://github.com/wekan/wekan/commit/d914ca02c6). Thanks to xet7.
- [The sticky list headers test follows the write-access rule](https://github.com/wekan/wekan/commit/5de71ba789). Thanks to xet7.
- [The RepointBleed browser test uses cryptographic randomness for its ids](https://github.com/wekan/wekan/commit/5d63862ec0). Thanks to xet7.
- [models/lib/boardBackground.js is restored after the BackgroundBleed fix overwrote it](https://github.com/wekan/wekan/commit/f9d9596e2a). Thanks to xet7.
- [Browser tests for TrayBleed, HookUrlBleed, DirectoryInfoBleed, AuthMethodBleed, MigrationBleed and assigned-only attachment reads](https://github.com/wekan/wekan/commit/d53f58bf52), and GET /api/boards/:boardId/attachments answers a refusal with its status instead of the app page. Thanks to xet7.
- [The coverage tests account for the thirteen Hall of Fame names published on 2026-10-02](https://github.com/wekan/wekan/commit/ad6117cc65). Thanks to xet7.
- [The RepointBleed browser test has time for its six sign-ins in slower browsers](https://github.com/wekan/wekan/commit/ece70ad9fb). Thanks to xet7.
- [The admin card reports are recorded as instance-wide by decision](https://github.com/wekan/wekan/commit/69f3358154). Thanks to xet7.

and updates the following translations:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f599111d3e">Translate Ladin reminders, saved filters and import reports</a>. Thanks to xet7.</summary>

- Fill 27 Ladin placeholders for notification activity types, due date
  reminders, duplicate dependencies, string template hints, saved filters,
  import reports and the draggable label, preserving template variables,
  `|urlencode` and the Admin Panel path. Low confidence pending
  native-speaker review.
- The Ladin key-order check now skips keys pending Transifex, which live in
  `en.i18n.json` only until the translating agent adds them. Batch checks pass,
  along with all 21 human-preference checks.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/261f3f4042">Translate Ladin import and rule messages</a>. Thanks to xet7.</summary>

- Fill 25 Ladin import, board-access, rule and notification placeholders,
  preserving rule variables, markup, URL schemes and access restrictions.
  Technical wording remains low confidence pending native-speaker review.
- Batch token, key-order and safeguard checks pass, along with all 21
  human-preference checks. Remaining placeholders, mixed-language corrections
  and browser review still need work.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4f5bc318e6">Translate Ladin archive and date filters</a>. Thanks to xet7.</summary>

- Fill 23 Ladin archive and date-filter placeholders, preserving filter
  syntax, date boundaries and archive safeguards. Technical phrasing remains
  low confidence pending native-speaker review.
- Batch placeholder, key-order and safeguard checks pass, along with all
  21 human-preference checks. Remaining placeholders, existing mixed-language
  entries and browser review still need work.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f98f22c428">Finish remaining Cornish recovery and history translations</a>. Thanks to xet7.</summary>

- Fill the final 19 reported Cornish prose placeholders and review 26 literal
  keyboard, platform and mathematical labels. The missing-string report is
  empty, including pending strings. Technical terminology remains low
  confidence pending native-speaker review.
- Both Cornish suites, shared completion checks and all 21 human-preference
  checks pass. Browser and full-language quality review remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/84d3688816">Translate Cornish activity recovery controls</a>. Thanks to xet7.</summary>

- Fill 29 Cornish activity recovery and synchronization time estimate
  messages, preserving retry, pause and permanent cancellation safeguards.
  Technical terminology remains low confidence pending native-speaker review.
- Batch placeholder, key-order and recovery-wording checks pass, along with
  all 21 human-preference checks. Full-language work and browser review remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/946d61a15c">Translate Cornish email recovery failures</a>. Thanks to xet7.</summary>

- Fill 20 Cornish email queue and delivery failure messages, preserving
  cancellation safeguards and warnings before retrying unconfirmed delivery.
  Technical terminology remains low confidence pending native-speaker review.
- Batch placeholder, key-order and recovery-wording checks pass, along with
  all 21 human-preference checks. Full-language work and browser review remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cf7dce7175">Translate Cornish synchronization diagnostics and email queue</a>. Thanks to xet7.</summary>

- Fill 20 Cornish synchronization diagnostics and email queue messages,
  preserving pause behavior, uncertain delivery warnings and the `null` token.
  Specialized terminology remains low confidence pending native-speaker
  review.
- Batch placeholder, key-order and recovery-wording checks pass, along with
  all 21 human-preference checks. Full-language work and browser review remain.

</details>


<details>
<summary><a href="https://github.com/wekan/wekan/commit/789e4fae25">Translate Cornish synchronization source and report messages</a>. Thanks to xet7.</summary>

- Fill 30 Cornish synchronization source, preview and report messages,
  preserving report limits, retention counts and partial-run warnings.
  Specialized terminology remains low confidence pending native-speaker
  review.
- Batch placeholder, key-order, shared-label and report-wording checks pass,
  along with all 21 human-preference checks. Full-language work and browser
  review remain.

</details>


<details>
<summary><a href="https://github.com/wekan/wekan/commit/46932c73b8">Translate Cornish synchronization conflicts and previews</a>. Thanks to xet7.</summary>

- Fill 22 Cornish synchronization conflict and preview messages, preserving
  local/source distinctions and the instructions for retaining card content.
  Technical phrasing remains low confidence pending native-speaker review.
- Batch placeholder, key-order, distinct-action and safeguard-wording checks
  pass, along with all 21 human-preference checks. Full-language work and
  browser review remain.

</details>


<details>
<summary><a href="https://github.com/wekan/wekan/commit/275f71f51b">Translate Cornish sprint status and observation reports</a>. Thanks to xet7.</summary>

- Fill 27 Cornish sprint-state and observation-report messages, preserving
  reference tokens, UTC terminology and the 366-observation limit.
  Specialized terminology remains low confidence pending native-speaker
  review.
- Batch placeholder, key-order, report-wording and distinct-state checks
  pass, along with all 21 human-preference checks. Full-language work and
  browser review remain.

</details>


<details>
<summary><a href="https://github.com/wekan/wekan/commit/d7e08667db">Translate Cornish sprint planning and reporting messages</a>. Thanks to xet7.</summary>

- Fill 30 Cornish sprint-planning and reporting messages, preserving count
  placeholders and the distinction between unknown and zero estimates.
  Specialized Scrum terminology remains low confidence pending
  native-speaker review.
- Batch key-order, placeholder, estimate-wording and distinct-action checks
  pass, along with all 21 human-preference checks. Full-language work and
  browser review remain.

</details>


<details>
<summary><a href="https://github.com/wekan/wekan/commit/1e81dae899">Translate Cornish map controls and Scrum planning labels</a>. Thanks to xet7.</summary>

- Fill 34 Cornish map, unnamed-key and Scrum planning messages. Specialized
  Scrum terminology remains low confidence pending native-speaker review.
- Batch key-order, placeholder, shared-label and distinct-action checks pass,
  along with all 21 human-preference checks. Full-language work and browser
  review remain.

</details>


<details>
<summary><a href="https://github.com/wekan/wekan/commit/d441c53296">Translate Cornish reminders saved filters and import reports</a>. Thanks to xet7.</summary>

- Fill 28 Cornish notification, reminder, saved-filter, dependency and import
  report messages. Technical phrasing remains low confidence pending
  native-speaker review.
- Batch placeholder, key-order, reminder-offset, template-variable and
  distinct-action checks pass, along with all 21 human-preference checks.
  Full-language work and browser review remain.

</details>


<details>
<summary><a href="https://github.com/wekan/wekan/commit/afbb6b3b62">Translate Cornish import access and automation messages</a>. Thanks to xet7.</summary>

- Fill 25 Cornish import, access, parent-card, automation and notification
  messages. Technical phrasing remains low confidence pending native-speaker
  review.
- Batch key-order, placeholder, rule-variable, markup and technical-literal
  checks pass, along with all 21 human-preference checks. Full-language work
  and browser review remain.

</details>


<details>
<summary><a href="https://github.com/wekan/wekan/commit/dae2d00be9">Translate Cornish date filters and archival settings</a>. Thanks to xet7.</summary>

- Fill 23 date-filter and archival messages in Cornish, preserving query
  fields, date literals and the rules for templates and list-entry dates.
  Technical phrasing remains low confidence pending native-speaker review.
- Batch key-order, placeholder, query-syntax and all 21 human-preference
  checks pass. The full Cornish test still reports 310 remaining entries;
  full-language work and browser review remain.

</details>


<details>
<summary><a href="https://github.com/wekan/wekan/commit/0fe8a14883">Translate Tigre dependency messages and repair completion checks</a>. Thanks to xet7.</summary>

- Add the 11 missing Tigre dependency messages with preserved placeholders
  and distinct personal/board labels and import/export actions. Technical
  prose remains low confidence pending native-speaker review.
- Require the literal Esperanto Pause keyboard label restored earlier,
  while continuing to require translated editor prose.
- Dependency translations, the shared completion suite and all 21
  human-preference checks pass. Other untranslated strings, wrong-language
  values and browser/native-speaker review remain.

</details>


<details>
<summary><a href="https://github.com/wekan/wekan/commit/1421039863">Translate missing Cherokee dependency layer messages</a>. Thanks to xet7.</summary>

- Add the 11 missing Cherokee dependency messages with distinct personal and
  board labels, import/export actions and unchanged count placeholders.
  Technical wording remains low confidence pending native-speaker review.
- Dependency translation and all 21 human-preference checks pass. The shared
  completion suite passes the Cherokee section and now fails on the same
  missing dependency keys in Tigre. Browser review remains.

</details>


<details>
<summary><a href="https://github.com/wekan/wekan/commit/71f1616b34">Complete remaining Assamese recovery and history translations</a>. Thanks to xet7.</summary>

- Fill the final 60 reported Assamese messages and retain 28 reviewed keyboard,
  platform and mathematical literals. No untranslated prose is reported.
  Recovery terminology remains low confidence pending native-speaker review.
- Assamese completion, key-order, markup and full-locale placeholder checks
  pass, along with all 21 human-preference checks. The shared completion
  suite still fails on 11 missing Cherokee dependency keys. Browser and
  native-speaker review remain.

</details>


<details>
<summary><a href="https://github.com/wekan/wekan/commit/5949c4f249">Translate Assamese email delivery queue messages</a>. Thanks to xet7.</summary>

- Fill 20 email delivery queue messages in Assamese. Recovery terminology
  remains low confidence pending native-speaker review.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass, as do all 21 human-preference checks. Full-language work and
  browser review remain.

</details>


<details>
<summary><a href="https://github.com/wekan/wekan/commit/feba3690d2">Translate Assamese synchronization reports and diagnostics</a>. Thanks to xet7.</summary>

- Fill 16 synchronization-report and diagnostic messages in Assamese.
  Specialized terminology remains low confidence pending native-speaker review.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass, as do all 21 human-preference checks. Full-language work and
  browser review remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bb18a11394">Translate Assamese synchronization previews and source fields</a>. Thanks to xet7.</summary>

- Fill 30 synchronization-preview and source-field messages in Assamese.
  Specialized terminology remains low confidence pending native-speaker review.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass, as do all 21 human-preference checks. Full-language work and
  browser review remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d653e514d0">Translate Assamese observations and synchronization conflicts</a>. Thanks to xet7.</summary>

- Fill 20 observation and synchronization-conflict messages in Assamese.
  Specialized terminology remains low confidence pending native-speaker review.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass, as do all 21 human-preference checks. Full-language work and
  browser review remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9219bd26a4">Translate Assamese sprint reports and workflow states</a>. Thanks to xet7.</summary>

- Fill 27 sprint-report and workflow-state messages in Assamese.
  Specialized terminology remains low confidence pending native-speaker review.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass, as do all 21 human-preference checks. Full-language work and
  browser review remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9b7dc399b2">Translate Assamese sprint planning and backlog messages</a>. Thanks to xet7.</summary>

- Fill 30 sprint, backlog and event messages in Assamese.
  Specialized terminology remains low confidence pending native-speaker review.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass, as do all 21 human-preference checks. Full-language work and
  browser review remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9e12507ca3">Translate Assamese rule editor and Scrum settings</a>. Thanks to xet7.</summary>

- Fill 30 rule-editor and Scrum planning messages in Assamese.
  Specialized terminology remains low confidence pending native-speaker review.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass, as do all 21 human-preference checks. Full-language work and
  browser review remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f8ef367c2f">Translate Assamese workspace search and block labels</a>. Thanks to xet7.</summary>

- Fill 30 workspace, search and block-label messages in Assamese.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass, as do all 21 human-preference checks. Full-language work,
  browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a7cc061ff8">Translate Assamese text processing and variable messages</a>. Thanks to xet7.</summary>

- Fill 30 text-processing, variable and workspace messages in Assamese.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass, as do all 21 human-preference checks. Full-language work,
  browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e5a5f2ca2b">Translate Assamese text lookup and extraction messages</a>. Thanks to xet7.</summary>

- Fill 30 text-lookup, extraction and joining messages in Assamese.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass, as do all 21 human-preference checks. Full-language work,
  browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fc1016b2dc">Translate Assamese navigation shortcuts and text operations</a>. Thanks to xet7.</summary>

- Fill 30 navigation-shortcut and text-operation messages in Assamese.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass, as do all 21 human-preference checks. Full-language work,
  browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0da1f43369">Translate Assamese accessibility and editing shortcuts</a>. Thanks to xet7.</summary>

- Fill 30 accessibility, editing and shortcut messages in Assamese.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass, as do all 21 human-preference checks. Full-language work,
  browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a2adf5056d">Translate Assamese workspace and function messages</a>. Thanks to xet7.</summary>

- Fill 30 workspace, variable and function messages in Assamese.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass, as do all 21 human-preference checks. Full-language work,
  browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fd6c746631">Translate Assamese mathematical function messages</a>. Thanks to xet7.</summary>

- Fill 30 rounding, logarithm and trigonometry messages in Assamese.
  Specialized terminology remains low confidence pending native-speaker review.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass, as do all 21 human-preference checks. Full-language work and
  browser review remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6b9029d4ba">Translate Assamese statistics and numeric operations</a>. Thanks to xet7.</summary>

- Fill 30 statistics and numeric-operation messages in Assamese.
  Specialized terminology remains low confidence pending native-speaker review.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass, as do all 21 human-preference checks. Full-language work and
  browser review remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9ddcf4363a">Translate Assamese arithmetic and number properties</a>. Thanks to xet7.</summary>

- Fill 30 logic, arithmetic and number-property messages in Assamese.
  Specialized terminology remains low confidence pending native-speaker review.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass, as do all 21 human-preference checks. Full-language work and
  browser review remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a593884d65">Translate Assamese sorting and logic messages</a>. Thanks to xet7.</summary>

- Fill 30 sorting, text-list conversion and logic messages in Assamese.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass, as do all 21 human-preference checks. Full-language work,
  browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a7a26d117b">Translate Assamese list editing and ordering messages</a>. Thanks to xet7.</summary>

- Fill 30 list-lookup, editing and ordering messages in Assamese.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass, as do all 21 human-preference checks. Full-language work,
  browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7cd2ebbb23">Translate Assamese list creation and item lookup</a>. Thanks to xet7.</summary>

- Fill 30 navigation, list-creation and item-lookup messages in Assamese.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass, as do all 21 human-preference checks. Full-language work,
  browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b0e76f3cde">Translate Assamese input and keyboard navigation messages</a>. Thanks to xet7.</summary>

- Fill 29 numeric-input, text-input and keyboard-navigation messages
  in Assamese.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass, as do all 21 human-preference checks. Full-language work,
  browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/994623c4b6">Translate Assamese list and numeric input labels</a>. Thanks to xet7.</summary>

- Fill 31 editor, list, loop and numeric-input labels in Assamese.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass, as do all 21 human-preference checks. Full-language work,
  browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f0665363dd">Translate Assamese bitmap and input editing messages</a>. Thanks to xet7.</summary>

- Fill 28 bitmap, input, variable and block-editing messages in Assamese.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass, as do all 21 human-preference checks. Full-language work,
  browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e8af577acd">Translate Assamese loops and block editing</a>. Thanks to xet7.</summary>

- Fill 29 loop, condition and block-editing messages in Assamese.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass, as do all 21 human-preference checks. Full-language work,
  browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2a1f3a713c">Translate Assamese editor and colour messages</a>. Thanks to xet7.</summary>

- Fill 28 editor, colour and loop-control messages in Assamese.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass, as do all 21 human-preference checks. Full-language work,
  browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4bb4875281">Translate Assamese block and field accessibility labels</a>. Thanks to xet7.</summary>

- Fill 28 block and field accessibility labels in Assamese.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass, as do all 21 human-preference checks. Full-language work,
  browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/395a6191a3">Translate Assamese map and accessibility messages</a>. Thanks to xet7.</summary>

- Fill 26 map, movement-announcement and accessibility messages in Assamese.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass, as do all 21 human-preference checks. Full-language work,
  browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f7350e2153">Translate Assamese reminders and saved filters</a>. Thanks to xet7.</summary>

- Fill 28 notification, reminder, saved-filter and import messages in Assamese.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass, as do all 21 human-preference checks. Full-language work,
  browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/324a492b91">Translate Assamese rules and activity notifications</a>. Thanks to xet7.</summary>

- Fill 25 import, board-visibility, rule and notification messages in Assamese.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass, as do all 21 human-preference checks. Full-language work,
  browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/92cca49aa9">Translate Assamese date filters and automatic archival</a>. Thanks to xet7.</summary>

- Fill 23 date-filter and automatic-archival messages in Assamese.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass, as do all 21 human-preference checks. Full-language work,
  browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7779a58811">Finish reported Amharic translation placeholders</a>. Thanks to xet7.</summary>

- Fill the remaining 26 recovery, sign-in and history messages in Amharic.
  Preserve 28 reviewed keyboard, platform and code literals. No untranslated
  prose is reported by the fill tool.
- Whole-file placeholder checks, Amharic progress tests and all 21
  human-preference checks pass. The shared completion suite still fails on
  missing dependency keys in another locale.
- Specialized terminology remains low confidence pending native-speaker
  review. Browser and full language-quality reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e3cdb4f153">Translate Amharic delivery errors and activity recovery</a>. Thanks to xet7.</summary>

- Fill 30 delivery-error, time-estimate and activity-recovery messages
  in Amharic. Specialized terminology remains low confidence pending
  native-speaker review.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass, as do all 21 human-preference checks. Full-language work and
  browser review remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d8e84ae9c9">Translate Amharic diagnostics and email queue messages</a>. Thanks to xet7.</summary>

- Fill 30 synchronization-diagnostic and email-queue messages in Amharic.
  Specialized terminology remains low confidence pending native-speaker review.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass, as do all 21 human-preference checks. Full-language work and
  browser review remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1b47a78495">Translate Amharic synchronization previews and reports</a>. Thanks to xet7.</summary>

- Fill 30 synchronization-preview, source-field and run-report messages
  in Amharic. Specialized terminology remains low confidence pending
  native-speaker review.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass, as do all 21 human-preference checks. Full-language work and
  browser review remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7a8f3d11d5">Translate Amharic observations and synchronization conflicts</a>. Thanks to xet7.</summary>

- Fill 30 daily-observation, synchronization-conflict and preview messages
  in Amharic. Specialized terminology remains low confidence pending
  native-speaker review.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass, as do all 21 human-preference checks. Full-language work and
  browser review remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cb23d5f75e">Translate Amharic sprint reports and workflow states</a>. Thanks to xet7.</summary>

- Fill 30 sprint-report, workflow-state and snapshot messages in Amharic.
  Specialized Scrum terminology remains low confidence pending
  native-speaker review.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass, as do all 21 human-preference checks. Full-language work and
  browser review remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fc5527d3d0">Translate Amharic sprint planning and backlog messages</a>. Thanks to xet7.</summary>

- Fill 30 sprint, backlog, release and event messages in Amharic. Specialized
  Scrum terminology remains low confidence pending native-speaker review.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass, as do all 21 human-preference checks. Full-language work and
  browser review remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f641f6d367">Translate Amharic rule editor and Scrum settings</a>. Thanks to xet7.</summary>

- Fill 30 rule-editor and Scrum planning messages in Amharic. Specialized Scrum
  terminology remains low confidence pending native-speaker review.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass, as do all 21 human-preference checks. Full-language work and
  browser review remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/82855e4c02">Translate Amharic workspace search and block labels</a>. Thanks to xet7.</summary>

- Fill 30 workspace, search, comment and block-label messages in Amharic.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass, as do all 21 human-preference checks. Full-language work,
  browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/07d15fb283">Translate Amharic text processing and variable messages</a>. Thanks to xet7.</summary>

- Fill 31 text-processing, input-prompt and variable messages in Amharic.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass, as do all 21 human-preference checks. Full-language work,
  browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/517ff755bf">Translate Amharic text operations and character lookup</a>. Thanks to xet7.</summary>

- Fill 31 text, letter-case, character-lookup and substring messages in Amharic.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass, as do all 21 human-preference checks. Full-language work,
  browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/75157327db">Translate Amharic editor keyboard shortcuts</a>. Thanks to xet7.</summary>

- Fill 34 navigation, movement, scrolling and accessibility shortcut messages
  in Amharic.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass, as do all 21 human-preference checks. Full-language work,
  browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/342570d53d">Translate Amharic functions and screen-reader messages</a>. Thanks to xet7.</summary>

- Fill 30 function-definition, variable, screen-reader and editing messages
  in Amharic.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass, as do all 21 human-preference checks. Full-language work,
  browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/761e3a00c3">Translate Amharic trigonometry and editor navigation</a>. Thanks to xet7.</summary>

- Fill 30 mathematics, workspace navigation and variable-creation messages in
  Amharic. Specialized mathematics terminology remains low confidence pending
  native-speaker review.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass, as do all 21 human-preference checks. Full-language work and
  browser review remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3446dcbae7">Translate Amharic statistics and rounding messages</a>. Thanks to xet7.</summary>

- Fill 30 statistics, rounding and numeric-function messages in Amharic.
  Specialized terminology remains low confidence pending native-speaker review.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass, as do all 21 human-preference checks. Full-language work and
  browser review remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fc233be834">Translate Amharic mathematical constants and number properties</a>. Thanks to xet7.</summary>

- Fill 30 constant, number-property and statistics messages in Amharic.
  Specialized terminology remains low confidence pending native-speaker review.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass, as do all 21 human-preference checks. Full-language work and
  browser review remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/67ea95be43">Translate Amharic comparisons, logic and arithmetic</a>. Thanks to xet7.</summary>

- Fill 30 comparison, logic and arithmetic messages in Amharic. Specialized
  mathematics wording remains low confidence pending native-speaker review.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass, as do all 21 human-preference checks. Full-language work and
  browser review remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1b5f9bf5f4">Translate Amharic list editing, sorting and basic logic</a>. Thanks to xet7.</summary>

- Fill 30 list editing, sorting, conversion and basic logic messages in Amharic.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass, as do all 21 human-preference checks. Full-language work,
  browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f2bb0e3633">Translate Amharic list lookup and removal messages</a>. Thanks to xet7.</summary>

- Fill 30 list lookup, removal, sublist and length messages in Amharic.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass, as do all 21 human-preference checks. Full-language work,
  browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/24bca79c69">Translate Amharic navigation and list creation</a>. Thanks to xet7.</summary>

- Fill 30 text-input, keyboard navigation and list messages in Amharic.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass, as do all 21 human-preference checks. Full-language work,
  browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b24d9645a9">Translate Amharic list and numeric input labels</a>. Thanks to xet7.</summary>

- Fill 30 list, loop, numeric and text input labels in Amharic.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass, as do all 21 human-preference checks. Full-language work,
  browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7a049d16f1">Translate Amharic bitmap editing and input labels</a>. Thanks to xet7.</summary>

- Fill 29 bitmap, editor and input labels in Amharic.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass, as do all 21 human-preference checks. Full-language work,
  browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/49e073a664">Translate Amharic loops and editing messages</a>. Thanks to xet7.</summary>

- Fill 27 Blockly loop, editing and bitmap messages in Amharic.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass, as do all 21 human-preference checks. Full-language work,
  browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/97418d5225">Translate Amharic Blockly colours and control flow</a>. Thanks to xet7.</summary>

- Fill 29 Blockly editor, colour and control-flow messages in Amharic.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass, as do all 21 human-preference checks. Full-language work,
  browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4fa490ee1c">Translate Amharic Blockly field and block labels</a>. Thanks to xet7.</summary>

- Fill 28 Blockly field and block labels in Amharic.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass, as do all 21 human-preference checks. Full-language work,
  browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4e0ef78a39">Translate Amharic map and accessibility messages</a>. Thanks to xet7.</summary>

- Fill 27 map and Blockly accessibility messages in Amharic.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass, as do all 21 human-preference checks. Full-language work,
  browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e7c29c5c69">Translate Amharic reminders, saved filters and import reports</a>. Thanks to xet7.</summary>

- Fill 28 notification, reminder, saved-filter and import messages in Amharic.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass, as do all 21 human-preference checks. Full-language work,
  browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a8c7fa04e5">Translate Amharic board visibility, rules and notifications</a>. Thanks to xet7.</summary>

- Fill 25 import, board visibility, rule and notification messages in Amharic.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass, as do all 21 human-preference checks. Full-language work,
  browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ec3da9d335">Translate Amharic archiving and date filters</a>. Thanks to xet7.</summary>

- Fill 23 archiving and date-filter messages in the Amharic locale.
- Batch script, key-order, placeholder, markup and query-field checks pass,
  as do all 21 human-preference checks. Full-language work, browser and
  native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/86573f0de4">Finish remaining Khmer prose translations and check full locales</a>. Thanks to xet7.</summary>

- Fill 31 recovery and history messages in both Khmer locale files; km-KH
  inherits the Cambodia translations. Retain 28 reviewed keyboard, platform
  and code/math literals. All three tags report no untranslated prose.
- Full-file placeholder, key-order and focused Khmer checks pass, as do all
  21 human-preference checks. The shared completion suite still fails on
  11 missing dependency keys in another locale.
- Browser and native-speaker reviews remain, including specialized mathematics
  terminology recorded as low confidence in earlier batches.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a90bdf4270">Translate Khmer email failures and activity recovery</a>. Thanks to xet7.</summary>

- Fill 30 email failure, time-estimate and activity-recovery messages in both
  Khmer locale files; km-KH inherits the Cambodia translations.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass for all three locale tags, as do all 21 human-preference checks.
  Full-language work, browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9aa9f86243">Translate Khmer Sync recovery and email queue messages</a>. Thanks to xet7.</summary>

- Fill 30 Sync recovery and email queue messages in both Khmer locale files;
  km-KH inherits the Cambodia translations.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass for all three locale tags, as do all 21 human-preference checks.
  Full-language work, browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/04a97fcbcf">Translate Khmer Sync previews and reports</a>. Thanks to xet7.</summary>

- Fill 30 Sync preview, source-field and report messages in both Khmer locale
  files; km-KH inherits the Cambodia translations.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass for all three locale tags, as do all 21 human-preference checks.
  Full-language work, browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/24548bf38f">Translate Khmer Scrum observations and Sync conflicts</a>. Thanks to xet7.</summary>

- Fill 30 Scrum observation, Sync conflict and preview messages in both Khmer
  locale files; km-KH inherits the Cambodia translations.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass for all three locale tags, as do all 21 human-preference checks.
  Full-language work, browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3af4cf03cb">Translate Khmer sprint events and reports</a>. Thanks to xet7.</summary>

- Fill 30 sprint event, report and workflow messages in both Khmer locale
  files; km-KH inherits the Cambodia translations.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass for all three locale tags, as do all 21 human-preference checks.
  Full-language work, browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bdec69ce17">Translate Khmer sprint planning messages</a>. Thanks to xet7.</summary>

- Fill 30 sprint planning, backlog and estimate messages in both Khmer locale
  files; km-KH inherits the Cambodia translations.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass for all three locale tags, as do all 21 human-preference checks.
  Full-language work, browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a903746966">Translate Khmer rule editor and Scrum settings</a>. Thanks to xet7.</summary>

- Fill 30 remaining block aliases, rule-editor messages and Scrum settings in
  both Khmer locale files; km-KH inherits the Cambodia translations.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass for all three locale tags, as do all 21 human-preference checks.
  Full-language work, browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/18b900c246">Translate Khmer variables, workspace and search messages</a>. Thanks to xet7.</summary>

- Fill 30 variable, workspace and search messages in both Khmer locale files;
  km-KH inherits the Cambodia translations.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass for all three locale tags, as do all 21 human-preference checks.
  Full-language work, browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ed4ff113ad">Translate Khmer text lookup and output messages</a>. Thanks to xet7.</summary>

- Fill 30 text lookup, output, replacement and trimming messages in both Khmer
  locale files; km-KH inherits the Cambodia translations.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass for all three locale tags, as do all 21 human-preference checks.
  Full-language work, browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/19991f3927">Translate Khmer shortcuts and text operations</a>. Thanks to xet7.</summary>

- Fill 31 shortcut, text and character-selection messages in both Khmer locale
  files; km-KH inherits the Cambodia translations.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass for all three locale tags, as do all 21 human-preference checks.
  Full-language work, browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/92e8f58ef4">Translate Khmer keyboard navigation shortcuts</a>. Thanks to xet7.</summary>

- Fill 30 keyboard navigation and editing shortcuts in both Khmer locale
  files; km-KH inherits the Cambodia translations.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass for all three locale tags, as do all 21 human-preference checks.
  Full-language work, browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/70c8d00b46">Translate Khmer functions and screenreader messages</a>. Thanks to xet7.</summary>

- Fill 30 function, editing and screenreader messages in both Khmer locale
  files; km-KH inherits the Cambodia translations.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass for all three locale tags, as do all 21 human-preference checks.
  Full-language work, browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4586df14af">Translate Khmer math functions and editor messages</a>. Thanks to xet7.</summary>

- Fill 29 mathematics and editor messages in both Khmer locale files; km-KH
  inherits the Cambodia translations. Specialized terminology remains low
  confidence pending native-speaker review.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass for all three locale tags, as do all 21 human-preference checks.
  Full-language work and browser review remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1ba0cc0336">Translate Khmer statistics and rounding messages</a>. Thanks to xet7.</summary>

- Fill 30 statistics, rounding and numeric function messages in both Khmer
  locale files; km-KH inherits the Cambodia translations. Specialized
  terminology remains low confidence pending native-speaker review.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass for all three locale tags, as do all 21 human-preference checks.
  Full-language work and browser review remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2ea2883509">Translate Khmer mathematical constants and number properties</a>. Thanks to xet7.</summary>

- Fill 30 mathematics messages in both Khmer locale files; km-KH inherits the
  Cambodia translations. Specialized terminology remains low confidence pending
  native-speaker review.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass for all three locale tags, as do all 21 human-preference checks.
  Full-language work and browser review remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/aa5fa12245">Translate Khmer comparisons, logic and arithmetic</a>. Thanks to xet7.</summary>

- Fill 29 comparison, Boolean logic and arithmetic messages in both Khmer
  locale files; km-KH inherits the Cambodia translations.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass for all three locale tags, as do all 21 human-preference checks.
  Full-language work, browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ae58ccf01d">Translate Khmer list lookup, editing and sorting</a>. Thanks to xet7.</summary>

- Fill 60 list lookup, removal, editing, sorting and conversion messages in
  both Khmer locale files; km-KH inherits the Cambodia translations.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass for all three locale tags, as do all 21 human-preference checks.
  Full-language work, browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fe812d5473">Translate Khmer numeric inputs, navigation and list creation</a>. Thanks to xet7.</summary>

- Fill 58 input, keyboard navigation and list messages in both Khmer locale
  files; km-KH inherits the Cambodia translations.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass for all three locale tags, as do all 21 human-preference checks.
  Full-language work, browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2b2135c309">Translate Khmer Blockly loops, bitmap editing and inputs</a>. Thanks to xet7.</summary>

- Fill 58 loop, editing, bitmap and input messages in both Khmer locale files;
  km-KH inherits the Cambodia translations.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass for all three locale tags, as do all 21 human-preference checks.
  Full-language work, browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8fb8dd6198">Translate Khmer Blockly colours and control flow</a>. Thanks to xet7.</summary>

- Fill 29 editor, colour and loop messages in both Khmer locale files;
  km-KH inherits the Cambodia translations.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass for all three locale tags, as do all 21 human-preference checks.
  Full-language work, browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ddddd414b3">Translate Khmer Blockly field and block labels</a>. Thanks to xet7.</summary>

- Fill 28 Blockly field, input and block labels in both Khmer locale files;
  km-KH inherits the Cambodia translations.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass for all three locale tags, as do all 21 human-preference checks.
  Full-language work, browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/93edb1ef03">Translate Khmer map and accessibility messages</a>. Thanks to xet7.</summary>

- Fill 27 map, movement-announcement and accessible-control messages in both
  Khmer locale files; km-KH inherits the Cambodia translations.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass for all three locale tags, as do all 21 human-preference checks.
  Full-language work, browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/348d8389e6">Translate Khmer reminders, saved filters and import reports</a>. Thanks to xet7.</summary>

- Fill 28 reminder, saved-filter, import-report and related messages in both
  Khmer locale files; km-KH inherits the Cambodia translations.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass for all three locale tags, as do all 21 human-preference checks.
  Full-language work, browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/602b6ea2fd">Translate Khmer board visibility, rules and notifications</a>. Thanks to xet7.</summary>

- Fill 25 import, visibility, parent-card, rule and notification messages
  in both Khmer locale files; km-KH inherits the Cambodia translations.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks pass for all three locale tags, as do all 21 human-preference checks.
  Full-language work, browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/807c00ea94">Translate Khmer archiving and date filters</a>. Thanks to xet7.</summary>

- Fill 23 archiving and date-filter messages in both Khmer locale files;
  the km-KH alias inherits the Cambodia translations.
- Batch script, key-order, placeholder, markup and query-field checks pass
  for all three locale tags, as do all 21 human-preference checks.
  Full-language work, browser and native-speaker reviews remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/93283b5a1c">Finish remaining Burmese prose translations and check full locale</a>. Thanks to xet7.</summary>

- Fill the last 19 reported prose placeholders, covering rule email,
  SAML sign-in, ordering and History requests. Retain 28 reviewed keyboard
  labels, platform names and code/math literals as notation.
- Both Burmese suites and all 21 human-preference checks pass, including
  full-locale key-order and placeholder coverage; the missing report is empty.
- The shared completion suite still fails on Cherokee's 11 missing
  dependency keys. Browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2da37f87b5">Translate Burmese activity notification recovery</a>. Thanks to xet7.</summary>

- Fill 26 activity-notification recovery, delivery and cancellation messages.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/53d9dfe2d3">Translate Burmese email failures and Sync time estimates</a>. Thanks to xet7.</summary>

- Fill 24 email-failure, queue-recovery and Sync time-estimate messages.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8df2dcef06">Translate Burmese Sync recovery and email queue controls</a>. Thanks to xet7.</summary>

- Fill 25 Sync-report, diagnostic, estimate-field and email-queue messages.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2610050f83">Translate Burmese Sync source details and report messages</a>. Thanks to xet7.</summary>

- Fill 24 Sync-preview, source-field, parser and report messages.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b13e405281">Translate Burmese Sync conflicts and previews</a>. Thanks to xet7.</summary>

- Fill 22 Sync-conflict, replacement-card and preview messages.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d3b7fa0b43">Translate Burmese Scrum observations and workflow states</a>. Thanks to xet7.</summary>

- Fill 22 Scrum-observation, workflow, import and report messages.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4b7f090b10">Translate Burmese sprint events and reporting</a>. Thanks to xet7.</summary>

- Fill 25 sprint-event, report, estimate and completion-state messages.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e8fecf24da">Translate Burmese Scrum planning and sprint controls</a>. Thanks to xet7.</summary>

- Fill 27 Scrum-goal, estimate, sprint-control and backlog-planning messages.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/acb6995099">Translate Burmese rule editor and Scrum settings</a>. Thanks to xet7.</summary>

- Fill 25 block-rule, Scrum-view, role and planning-setting messages.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ccaf0e8d68">Translate Burmese workspace and search messages</a>. Thanks to xet7.</summary>

- Fill 24 workspace-announcement, search, conditional and list messages.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e9e4a78295">Translate Burmese text output and variable messages</a>. Thanks to xet7.</summary>

- Fill 27 text-output, replacement, variable and workspace messages.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8909c6fa50">Translate Burmese character selection and text lookup</a>. Thanks to xet7.</summary>

- Fill 28 character-selection, substring, text-lookup and joining messages.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c69bc4a668">Translate Burmese shortcuts and text operations</a>. Thanks to xet7.</summary>

- Fill 28 navigation-shortcut, text-append and letter-case messages.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/894cfa06cf">Translate Burmese accessibility and shortcut messages</a>. Thanks to xet7.</summary>

- Fill 25 function-input, screenreader, navigation and shortcut messages.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/eff127c5ce">Translate Burmese function and block navigation messages</a>. Thanks to xet7.</summary>

- Fill 24 function-definition, block-navigation and backpack messages.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/169add7ab1">Translate Burmese math functions and editor messages</a>. Thanks to xet7.</summary>

- Fill 26 math-function, trigonometry and editor messages.
  Specialized trigonometry terminology has lower confidence and needs review.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/725fe6df78">Translate Burmese statistics and rounding messages</a>. Thanks to xet7.</summary>

- Fill 28 statistics, random-number, rounding and math-function messages.
  Specialized statistics terminology has lower confidence and needs review.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e73ce22de4">Translate Burmese mathematical constants and number properties</a>. Thanks to xet7.</summary>

- Fill 25 math-constant, number-property and list-statistic messages.
  Specialized math terminology has lower confidence and needs review.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/50da1b24e2">Translate Burmese comparisons, logic and arithmetic</a>. Thanks to xet7.</summary>

- Fill 26 comparison, conditional-value and arithmetic messages.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/31ef697ea2">Translate Burmese list editing, sorting and basic logic</a>. Thanks to xet7.</summary>

- Fill 30 list-editing, sorting, text-splitting and basic-logic messages.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7f3637854d">Translate Burmese list lookup, removal and sublists</a>. Thanks to xet7.</summary>

- Fill 30 list-lookup, removal, sublist and length messages.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f110ddf32a">Translate Burmese text inputs, navigation and list creation</a>. Thanks to xet7.</summary>

- Fill 30 text-input, keyboard-navigation and list-creation messages.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c369561da9">Translate Burmese list, loop and numeric input labels</a>. Thanks to xet7.</summary>

- Fill 32 list-position, loop, arithmetic and numeric input labels.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c6d74b9993">Translate Burmese bitmap editing and input labels</a>. Thanks to xet7.</summary>

- Fill 26 bitmap, field-editing, icon and input-condition messages.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9f7e1759e3">Translate Burmese Blockly loops and editing actions</a>. Thanks to xet7.</summary>

- Fill 24 condition, loop, copy, deletion and block-editing messages.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/90b9ba35ee">Translate Burmese Blockly editor and control flow</a>. Thanks to xet7.</summary>

- Fill 27 editor, color, loop and conditional-control messages.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/64277e8c24">Translate Burmese Blockly field and block labels</a>. Thanks to xet7.</summary>

- Fill 28 accessible field, input-removal and block-structure labels.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/993343cbbe">Translate Burmese map and accessibility messages</a>. Thanks to xet7.</summary>

- Fill 27 map, movement-announcement and accessible-control messages.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3884d2f1ec">Translate Burmese reminders, saved filters and import reports</a>. Thanks to xet7.</summary>

- Fill 28 reminder, notification, saved-filter, import-report and map messages.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b1eedc6721">Translate Burmese board visibility, rules and notifications</a>. Thanks to xet7.</summary>

- Fill 25 import, visibility, parent-card, rule and notification messages.
- Batch script, key-order, placeholder, rule-variable, markup and query-field
  checks and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5d796955ae">Translate Burmese archiving and date filters</a>. Thanks to xet7.</summary>

- Fill 23 automatic-archiving, date-range and list-age filter messages.
- Batch script, key-order, placeholder, markup and query-field checks and
  all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cc7c39a2c3">Finish remaining Malagasy prose translations and check full locale</a>. Thanks to xet7.</summary>

- Fill the last 19 reported prose placeholders, covering rule email,
  SAML sign-in, ordering and History requests. Retain 27 reviewed keyboard
  labels, platform names and mathematical symbols as literal notation.
- Full-locale key-order and placeholder checks, batch markup checks and all
  21 human-preference checks pass; the missing-string report is empty.
- The shared completion suite still fails on Cherokee's 11 missing
  dependency keys. Browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cb6a1bad27">Translate Malagasy activity notification recovery</a>. Thanks to xet7.</summary>

- Fill 26 activity-notification recovery, delivery and cancellation messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f521ca1b86">Translate Malagasy email failures and Sync time estimates</a>. Thanks to xet7.</summary>

- Fill 19 email-failure, queue-recovery and Sync time-estimate messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/730e3018d6">Translate Malagasy recovery and email queue messages</a>. Thanks to xet7.</summary>

- Fill 22 Sync-diagnostic, estimate-field and email-queue messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ae717b4ac5">Translate Malagasy Sync reports and source fields</a>. Thanks to xet7.</summary>

- Fill 24 Sync-report, source-field and parser-warning messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/de98a4fab1">Translate Malagasy Sync conflict and preview messages</a>. Thanks to xet7.</summary>

- Fill 23 Sync-conflict, card-replacement and preview messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0093fc59a6">Translate Malagasy Scrum observations and Sync conflicts</a>. Thanks to xet7.</summary>

- Fill 23 Scrum-observation, report and Sync-conflict messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7fc5096a3b">Translate Malagasy sprint reports and workflow messages</a>. Thanks to xet7.</summary>

- Fill 30 sprint-event, report and workflow messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fd4c131ccb">Translate Malagasy Scrum planning messages</a>. Thanks to xet7.</summary>

- Fill 30 Scrum settings, sprint-planning and backlog messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/522f6a8836">Translate Malagasy rule editor and Scrum labels</a>. Thanks to xet7.</summary>

- Fill 23 rule-editor, list, function and Scrum messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f3d0c94b47">Translate Malagasy workspace and search messages</a>. Thanks to xet7.</summary>

- Fill 25 workspace, search and variable messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b076eede8a">Translate Malagasy text processing and variable messages</a>. Thanks to xet7.</summary>

- Fill 29 text-processing, input-prompt and variable messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4d3b09dd7d">Translate Malagasy text selection messages</a>. Thanks to xet7.</summary>

- Fill 29 text-selection, case-conversion and editing messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a056aed841">Translate Malagasy editor shortcut labels</a>. Thanks to xet7.</summary>

- Fill 31 editor shortcut and navigation labels.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/912e31d758">Translate Malagasy function and accessibility controls</a>. Thanks to xet7.</summary>

- Fill 24 function, screen-reader and shortcut messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/47a44ff15f">Translate Malagasy variables and function controls</a>. Thanks to xet7.</summary>

- Fill 25 variable, function and editor messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7b1d5c4e83">Translate Malagasy mathematical function messages</a>. Thanks to xet7.</summary>

- Fill 26 mathematical-function labels and tooltips. Trigonometric terminology
  has lower confidence and needs native-speaker review.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f0a23be563">Translate Malagasy statistics and random number messages</a>. Thanks to xet7.</summary>

- Fill 25 statistics, random-number and arithmetic messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c5100e1cae">Translate Malagasy logic and arithmetic messages</a>. Thanks to xet7.</summary>

- Fill 29 logic, arithmetic and number-property messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c3fe641999">Translate Malagasy list sorting and logic messages</a>. Thanks to xet7.</summary>

- Fill 33 list-sorting, text-conversion and logic messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7fc671ef83">Translate Malagasy list operations</a>. Thanks to xet7.</summary>

- Fill 30 list selection, removal, insertion and sequence messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6ac005e4f7">Translate Malagasy keyboard navigation and list messages</a>. Thanks to xet7.</summary>

- Fill 28 keyboard-navigation and list messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/70d1125dcb">Translate Malagasy mathematical and text input labels</a>. Thanks to xet7.</summary>

- Fill 32 mathematical, loop and text-input labels.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dd02503c81">Translate Malagasy editor input labels</a>. Thanks to xet7.</summary>

- Fill 30 editor-input, condition, list and accessibility labels.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4d5086f2ba">Translate Malagasy editing and bitmap controls</a>. Thanks to xet7.</summary>

- Fill 23 loop, editing and bitmap messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/952ed395d0">Translate Malagasy editor controls and conditions</a>. Thanks to xet7.</summary>

- Fill 27 editor, colour, loop and condition messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ae04503dfd">Translate Malagasy editor field and block labels</a>. Thanks to xet7.</summary>

- Fill 27 editor field, block and accessibility labels.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dea18fd7fa">Translate Malagasy map and editor accessibility messages</a>. Thanks to xet7.</summary>

- Fill 29 map, editor movement and accessibility messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f2def48e3e">Translate Malagasy reminders and saved filters</a>. Thanks to xet7.</summary>

- Fill 28 reminder, saved-filter, import and map messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4c1e9063c3">Translate Malagasy rules and notification preferences</a>. Thanks to xet7.</summary>

- Fill 25 rule, notification, parent-card and board-access messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2a88dc05b8">Translate Malagasy date filters and archive settings</a>. Thanks to xet7.</summary>

- Fill 26 archive, date-filter, import and board-access messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d9883253b2">Complete remaining Uyghur prose translations and coverage</a>. Thanks to xet7.</summary>

- Fill the final 46 reported prose placeholders, covering activity recovery,
  rule email, sign-in and History. Retain 25 literal keyboard labels,
  platform names and mathematical symbols as reviewed exceptions.
- Full-locale placeholder and completeness checks and all 21 human-preference
  checks pass. The shared completion suite still fails on missing Cherokee
  dependency keys. Browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/073729754a">Translate Uyghur email delivery messages</a>. Thanks to xet7.</summary>

- Fill 25 email-delivery, recovery and time-estimate messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7559458a65">Translate Uyghur Sync reports and email recovery</a>. Thanks to xet7.</summary>

- Fill 25 Sync-report, diagnostics and email-recovery messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/243348c5a7">Translate Uyghur Sync preview messages</a>. Thanks to xet7.</summary>

- Fill 23 Sync preview, source-field and parser-report messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cf60cba547">Translate Uyghur Sync conflict messages</a>. Thanks to xet7.</summary>

- Fill 25 Scrum observation, Sync conflict and preview messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/769be70fc6">Translate Uyghur sprint reports and workflow messages</a>. Thanks to xet7.</summary>

- Fill 35 sprint-report, workflow and daily observation messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6565b353c2">Translate Uyghur Scrum settings and sprint planning</a>. Thanks to xet7.</summary>

- Fill 48 rule-status, Scrum settings, sprint planning and backlog messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/85c3834be2">Translate Uyghur workspace and rule editor messages</a>. Thanks to xet7.</summary>

- Fill 35 workspace, variable and rule-editor messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a6c03a80c4">Translate Uyghur text operations</a>. Thanks to xet7.</summary>

- Fill 46 text selection, search, conversion and editing messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5508e3471f">Translate Uyghur editor shortcut messages</a>. Thanks to xet7.</summary>

- Fill 41 shortcut and text-editing messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/25067d217a">Translate Uyghur functions and editor navigation</a>. Thanks to xet7.</summary>

- Fill 43 function, navigation, trigonometry and screen-reader messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/eb1d2e991a">Translate Uyghur logic and mathematics messages</a>. Thanks to xet7.</summary>

- Fill 49 comparison, mathematics and accessibility messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/32409e9a87">Translate Uyghur list operations</a>. Thanks to xet7.</summary>

- Fill 44 list selection, insertion, removal, sorting and text conversion
  messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a8a7757c34">Translate Uyghur keyboard navigation and list messages</a>. Thanks to xet7.</summary>

- Fill 24 input, keyboard navigation and list messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a70dfa89bd">Translate Uyghur loop and mathematical input labels</a>. Thanks to xet7.</summary>

- Fill 28 loop, mathematical and text input labels.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/98f5ed04ed">Translate Uyghur editor input and list labels</a>. Thanks to xet7.</summary>

- Fill 28 editor control, condition and list input labels.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/030040027c">Translate Uyghur block editing and bitmap controls</a>. Thanks to xet7.</summary>

- Fill 19 block editing, warning and bitmap control messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/24f94e8f83">Translate Uyghur block editor field and structure labels</a>. Thanks to xet7.</summary>

- Fill 26 block editor field, structure and accessibility labels.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/22a854343c">Translate Uyghur block editor accessibility announcements</a>. Thanks to xet7.</summary>

- Fill 24 movement announcement and accessibility control messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2aa4e6f4dd">Translate Uyghur saved filters, imports and map controls</a>. Thanks to xet7.</summary>

- Fill 23 saved filter, import report, template and map messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1ca3f21b66">Translate Uyghur notification preferences and reminders</a>. Thanks to xet7.</summary>

- Fill 24 rule control, notification and due-date reminder messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/151ddd16fb">Translate Uyghur filter guidance, visibility and rule variables</a>. Thanks to xet7.</summary>

- Fill 15 filter guidance, import, board visibility and rule messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/282c1f36ce">Translate Uyghur date filters and archive settings</a>. Thanks to xet7.</summary>

- Fill 20 date filter and automatic archival messages.
- Batch key-order, placeholder, rule-variable and markup checks and all 21
  human-preference checks pass. Full-language work remains; browser and
  native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/631eb19587">Complete Bashkir placeholder translations and verify coverage</a>. Thanks to xet7.</summary>

- Translate the final 19 rule email, sign-in and history messages; retain 27
  literal keyboard, platform and mathematical labels as locale exceptions.
- Bashkir has no reported untranslated prose, including pending source keys.
  Whole-locale key-order and placeholder checks and all 21 human-preference
  checks pass. The shared suite still fails on missing Cherokee dependency
  keys. Browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/eae64c06c2">Translate Bashkir activity notification recovery</a>. Thanks to xet7.</summary>

- Fill 29 time estimate and activity notification recovery messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f681afb5f8">Translate Bashkir email recovery controls and failures</a>. Thanks to xet7.</summary>

- Fill 30 email queue control, recovery and delivery failure messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3cc8a33470">Translate Bashkir sync diagnostics and email queue guidance</a>. Thanks to xet7.</summary>

- Fill 21 sync report, diagnostic and email queue messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/031ea1ef2b">Translate Bashkir sync previews and source fields</a>. Thanks to xet7.</summary>

- Fill 28 sync preview, replacement-card and source field messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/04cc4c96d5">Translate Bashkir sprint observations and sync conflicts</a>. Thanks to xet7.</summary>

- Fill 23 sprint observation and synchronization conflict messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/938119398f">Translate Bashkir sprint reports and statuses</a>. Thanks to xet7.</summary>

- Fill 30 sprint report, event and status messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/03cb8154dd">Translate Bashkir sprint planning and estimates</a>. Thanks to xet7.</summary>

- Fill 33 sprint planning, estimate and event messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5625d9b36d">Translate Bashkir workspace search, block rules and Scrum labels</a>. Thanks to xet7.</summary>

- Fill 28 workspace search, block-rule editing and Scrum messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9a97849a2d">Translate Bashkir variables and workspace messages</a>. Thanks to xet7.</summary>

- Fill 29 text trimming, variable and workspace messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/07aab95e69">Translate Bashkir text operations and prompts</a>. Thanks to xet7.</summary>

- Fill 30 text operation, prompt and editor shortcut messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a7b50d1f65">Translate Bashkir editor keyboard shortcuts</a>. Thanks to xet7.</summary>

- Fill 36 editor navigation, movement and keyboard shortcut descriptions.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/00fe8f46ce">Translate Bashkir functions and screen reader controls</a>. Thanks to xet7.</summary>

- Fill 25 function, variable and screen-reader control messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8fc828aa43">Translate Bashkir mathematical accessibility and editor controls</a>. Thanks to xet7.</summary>

- Fill 20 mathematical accessibility, variable and editor control messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/55b2725a18">Translate Bashkir list conversion and mathematical labels</a>. Thanks to xet7.</summary>

- Fill 27 list conversion, comparison and mathematical messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/947de94d7e">Translate Bashkir list operations and sorting</a>. Thanks to xet7.</summary>

- Fill 28 list range, insertion, replacement and sorting messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ecf4328832">Translate Bashkir navigation and list retrieval messages</a>. Thanks to xet7.</summary>

- Fill 28 keyboard navigation, list creation and list retrieval messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7c6e888700">Translate Bashkir mathematical and text input labels</a>. Thanks to xet7.</summary>

- Fill 32 mathematical, loop and text input labels.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5e3bbaffc3">Translate Bashkir editor input and list labels</a>. Thanks to xet7.</summary>

- Fill 30 editor control, condition and list input labels.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0bd986cd02">Translate Bashkir block editing and bitmap controls</a>. Thanks to xet7.</summary>

- Fill 23 block editing, variable and bitmap control messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/af8d81989b">Translate Bashkir block editor accessibility labels</a>. Thanks to xet7.</summary>

- Fill 30 block editor field, structure and accessibility labels.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1f5d21d245">Translate Bashkir map and accessibility messages</a>. Thanks to xet7.</summary>

- Fill 29 map control and accessibility messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ae24f46b9a">Translate Bashkir reminders, saved filters and import reports</a>. Thanks to xet7.</summary>

- Fill 26 reminder, saved filter and import report messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fe9120d454">Translate Bashkir board visibility, rules and notifications</a>. Thanks to xet7.</summary>

- Fill 24 board visibility, rule variable and notification messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ad4de76724">Translate Bashkir date filters and archive settings</a>. Thanks to xet7.</summary>

- Fill 24 date filter, archival and Leo import messages.
- Batch key-order, placeholder, markup and query-field checks and all 21
  human-preference checks pass. Full-language work remains; browser and
  native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c74eff39a1">Complete Sindhi placeholder translations and verify coverage</a>. Thanks to xet7.</summary>

- Translate the final five history messages; retain 28 literal keyboard,
  platform and code labels as locale-specific exceptions.
- Sindhi has no reported untranslated prose, including pending source keys.
  Whole-locale key-order and placeholder checks and all 21 human-preference
  checks pass. The shared suite still fails on missing Cherokee dependency
  keys. Browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5ee0b66feb">Translate Sindhi activity and rule email recovery messages</a>. Thanks to xet7.</summary>

- Fill 32 activity recovery, rule email delivery and related messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d290f86506">Translate Sindhi email failures and notification recovery</a>. Thanks to xet7.</summary>

- Fill 32 email failure, time estimate and notification recovery messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/74acb2a188">Translate Sindhi sync diagnostics and email queue messages</a>. Thanks to xet7.</summary>

- Fill 32 sync report, diagnostic and email queue messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/92cbef89d9">Translate Sindhi sync preview and source field messages</a>. Thanks to xet7.</summary>

- Fill 32 sync preview, duplicate-card and source field messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fbf8e4b701">Translate Sindhi sprint observations and sync conflicts</a>. Thanks to xet7.</summary>

- Fill 32 sprint observation, report and synchronization conflict messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3de6b30a6d">Translate Sindhi sprint planning and report messages</a>. Thanks to xet7.</summary>

- Fill 37 sprint planning, event, status and report messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/687994f394">Translate Sindhi block rules and Scrum settings</a>. Thanks to xet7.</summary>

- Fill 37 workspace search, block-rule editing and Scrum setting messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2ff1905779">Translate Sindhi text processing and workspace messages</a>. Thanks to xet7.</summary>

- Fill 37 text processing, variable and workspace navigation messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e3b61feac1">Translate Sindhi text operations and scrolling shortcuts</a>. Thanks to xet7.</summary>

- Fill 38 text operation, scrolling and editor shortcut messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7c7815a27a">Translate Sindhi function and editor shortcut messages</a>. Thanks to xet7.</summary>

- Fill 50 function, screen-reader and editor shortcut messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f3aabdfdbc">Translate Sindhi statistics, trigonometry and block navigation</a>. Thanks to xet7.</summary>

- Fill 43 statistics, mathematical function and block navigation messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a962642024">Translate Sindhi logic and mathematical messages</a>. Thanks to xet7.</summary>

- Fill 28 logic, comparison and mathematical operation messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0694cfafb7">Translate Sindhi list operations and sorting</a>. Thanks to xet7.</summary>

- Fill 32 list range, insertion, sorting and text-splitting messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0dabd416cb">Translate Sindhi navigation and list retrieval messages</a>. Thanks to xet7.</summary>

- Fill 32 navigation, input-label and list retrieval messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d4646a1356">Translate Sindhi list and mathematical input labels</a>. Thanks to xet7.</summary>

- Fill 32 list, loop, mathematical and text-input messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/925ba184d7">Translate Sindhi bitmap and editor input labels</a>. Thanks to xet7.</summary>

- Fill 30 bitmap control, icon and editor input messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b8bd3005e0">Translate Sindhi loops and editing controls</a>. Thanks to xet7.</summary>

- Fill 31 loop, conditional, warning and editing-control messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/572ce64e86">Translate Sindhi editor field and block labels</a>. Thanks to xet7.</summary>

- Fill 32 editor field, accessibility and block-label messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6da193c5f8">Translate Sindhi map and accessibility messages</a>. Thanks to xet7.</summary>

- Fill 29 map, import report and editor accessibility messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/672f1a5b2e">Translate Sindhi notifications and saved filters</a>. Thanks to xet7.</summary>

- Fill 30 notification, reminder, dependency and saved-filter messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a3793bdc86">Translate Sindhi visibility and rule messages</a>. Thanks to xet7.</summary>

- Fill 20 board visibility, import, rule and notification messages.
- Batch key-order, placeholder, rule-variable, markup and query-field checks
  and all 21 human-preference checks pass. Full-language work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/270b539ae1">Translate Sindhi date and archival filters</a>. Thanks to xet7.</summary>

- Fill 22 date filter and automatic archival messages.
- Batch key-order, placeholder and markup checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/357df8fbdd">Verify Kyrgyz translation completeness and literal labels</a>. Thanks to xet7.</summary>

- Review 21 literal keyboard and platform labels for Kyrgyz.
- The full Kyrgyz suite passes with source-key order and shared placeholder
  checks; no untranslated placeholders remain in its current report.
- Batch regression checks and all 21 human-preference checks pass.
  Other languages remain unfinished. Browser and native-speaker reviews
  were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2a9b3e0606">Translate Kyrgyz recovery and history messages</a>. Thanks to xet7.</summary>

- Fill 47 recovery, rule email, sign-in, time-estimate and history messages.
- Batch key-order, placeholder, rule-variable and markup checks and all 21
  human-preference checks pass. Literal-label review remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c527183b6b">Translate Kyrgyz email queue and delivery failures</a>. Thanks to xet7.</summary>

- Fill 32 email queue, delivery failure and time-estimate messages.
- Batch key-order, placeholder, rule-variable and markup checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0377f7d5f9">Translate Kyrgyz Sync reports and diagnostics</a>. Thanks to xet7.</summary>

- Fill 27 Sync report, diagnostic and source-field messages.
- Batch key-order, placeholder, rule-variable and markup checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/09f66bf1c7">Translate Kyrgyz Sync conflicts and previews</a>. Thanks to xet7.</summary>

- Fill 33 Sync conflict, preview and omitted-field messages.
- Batch key-order, placeholder, rule-variable and markup checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/68c70df522">Translate Kyrgyz sprint reports and observations</a>. Thanks to xet7.</summary>

- Fill 33 sprint report, workflow and daily observation messages.
- Batch key-order, placeholder, rule-variable and markup checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/987cb8248d">Translate Kyrgyz sprint planning and events</a>. Thanks to xet7.</summary>

- Fill 33 sprint planning, backlog and event messages.
- Batch key-order, placeholder, rule-variable and markup checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/594f9fc6d9">Translate Kyrgyz rule editor and Scrum settings</a>. Thanks to xet7.</summary>

- Fill 34 rule editor, list-input and Scrum setting messages.
- Batch key-order, placeholder, rule-variable and markup checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6573922a84">Translate Kyrgyz workspace and variable messages</a>. Thanks to xet7.</summary>

- Fill 32 workspace, search, variable and text-trimming messages.
- Batch key-order, placeholder, rule-variable and markup checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/571be0ea9b">Translate Kyrgyz text operations and prompts</a>. Thanks to xet7.</summary>

- Fill 32 text selection, joining, replacement and prompt messages.
- Batch key-order, placeholder, rule-variable and markup checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1b45f76446">Translate Kyrgyz navigation and text controls</a>. Thanks to xet7.</summary>

- Fill 30 navigation, scrolling and text-control messages.
- Batch key-order, placeholder, rule-variable and markup checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fb6ce977af">Translate Kyrgyz accessibility modes and shortcuts</a>. Thanks to xet7.</summary>

- Fill 30 screen-reader mode, keyboard shortcut and navigation messages.
- Batch key-order, placeholder, rule-variable and markup checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0a3ee06756">Translate Kyrgyz functions and workspace controls</a>. Thanks to xet7.</summary>

- Fill 29 function, warning, trigonometry and workspace-control messages.
- Batch key-order, placeholder, rule-variable and markup checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f92956a530">Translate Kyrgyz statistics and mathematical functions</a>. Thanks to xet7.</summary>

- Fill 32 statistics, random-number, rounding and mathematical messages.
- Batch key-order, placeholder, rule-variable and markup checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1e7e2131c4">Translate Kyrgyz sorting and number properties</a>. Thanks to xet7.</summary>

- Fill 31 sorting, text splitting and number-property messages.
- Batch key-order, placeholder, rule-variable and markup checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a2949d002b">Translate Kyrgyz list operations and ordering</a>. Thanks to xet7.</summary>

- Fill 32 list range, search, insertion and ordering messages.
- Batch key-order, placeholder, rule-variable and markup checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2195ff3324">Translate Kyrgyz navigation and list retrieval messages</a>. Thanks to xet7.</summary>

- Fill 32 keyboard navigation, list creation, retrieval and removal messages.
- Batch key-order, placeholder, rule-variable and markup checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/63d9a67b4d">Translate Kyrgyz mathematical and text input labels</a>. Thanks to xet7.</summary>

- Fill 35 mathematical, loop, list and text-input labels.
- Batch key-order, placeholder, rule-variable and markup checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/eb6b904fd8">Translate Kyrgyz editor input and icon labels</a>. Thanks to xet7.</summary>

- Fill 30 editor field, icon and list-input messages.
- Batch key-order, placeholder, rule-variable and markup checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e1493f95f3">Translate Kyrgyz block labels and editing controls</a>. Thanks to xet7.</summary>

- Fill 27 block description, editing control and bitmap-field messages.
- Batch key-order, placeholder, rule-variable and markup checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4fe2d494e9">Translate Kyrgyz editor accessibility messages</a>. Thanks to xet7.</summary>

- Fill 32 movement announcement, editor control and field-type messages.
- Batch key-order, placeholder, rule-variable and markup checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2306118ee0">Translate Kyrgyz saved filters and map messages</a>. Thanks to xet7.</summary>

- Fill 29 saved filter, map, import report and editor announcement messages.
- Batch key-order, placeholder, rule-variable and markup checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e6e70c0724">Translate Kyrgyz rule and notification messages</a>. Thanks to xet7.</summary>

- Fill 30 rule, notification, reminder and dependency messages.
- Batch key-order, placeholder, rule-variable and markup checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f339381178">Translate Kyrgyz filters and board visibility messages</a>. Thanks to xet7.</summary>

- Fill 30 date filter, archival, import and board visibility messages.
- Batch key-order, placeholder, markup and query-field checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f79410e842">Verify Javanese translation completeness and literal labels</a>. Thanks to xet7.</summary>

- Review 29 literal keyboard, platform and code labels for Javanese.
- The full Javanese suite passes with source-key order and shared placeholder
  checks; no untranslated placeholders remain in its current report.
- All 21 human-preference checks pass. The broader completion suite still
  finds missing dependency keys in another locale. Browser and native-speaker
  reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/edba6fe7b2">Translate Javanese recovery and history messages</a>. Thanks to xet7.</summary>

- Fill 44 activity recovery, rule email, sign-in and history messages.
- Focused key-order, placeholder and restriction checks and all 21
  human-preference checks pass. Literal-label review remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/991192c7a1">Translate Javanese email queue and delivery failures</a>. Thanks to xet7.</summary>

- Fill 36 email queue, delivery failure and time-estimate messages.
- Focused key-order, placeholder and restriction checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/84af13530f">Translate Javanese Sync reports and diagnostics</a>. Thanks to xet7.</summary>

- Fill 33 Sync report, omitted-field and diagnostic messages.
- Focused key-order, placeholder and restriction checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b35b128a22">Translate Javanese observations and Sync conflicts</a>. Thanks to xet7.</summary>

- Fill 33 daily observation, Sync conflict and change-preview messages.
- Focused key-order, placeholder and restriction checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/63abb1e264">Translate Javanese sprint reports and events</a>. Thanks to xet7.</summary>

- Fill 33 sprint report, event, workflow and completion messages.
- Focused key-order, placeholder and restriction checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c65cb4f136">Translate Javanese sprint planning messages</a>. Thanks to xet7.</summary>

- Fill 33 estimation, backlog, sprint planning and event labels.
- Focused key-order, placeholder and restriction checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/64274e3ec1">Translate Javanese rule editor and Scrum labels</a>. Thanks to xet7.</summary>

- Fill 36 editor labels, rule validation messages and Scrum settings.
- Focused key-order, placeholder and restriction checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/36b8614be5">Translate Javanese variables and workspace messages</a>. Thanks to xet7.</summary>

- Fill 36 text trimming, variable, workspace and search messages.
- Focused key-order, placeholder and restriction checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/48564fe698">Translate Javanese text operations and prompts</a>. Thanks to xet7.</summary>

- Fill 37 text selection, joining, replacement and input-prompt messages.
- Focused key-order, placeholder and restriction checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/63988505a0">Translate Javanese navigation shortcuts and text controls</a>. Thanks to xet7.</summary>

- Fill 37 navigation, movement, scrolling and text-control messages.
- Focused key-order, placeholder and restriction checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>
<details>
<summary><a href="https://github.com/wekan/wekan/commit/2e60668792">Translate Javanese function warnings and accessibility controls</a>. Thanks to xet7.</summary>

- Fill 32 function warnings, screen-reader controls and editing shortcuts.
- Focused key-order, placeholder and restriction checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1dfe97675e">Translate Javanese trigonometry and function editor</a>. Thanks to xet7.</summary>

- Fill 33 trigonometry, variable and function-editor messages.
- Focused key-order, placeholder and restriction checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/92f9b6436a">Translate Javanese mathematical functions</a>. Thanks to xet7.</summary>

- Fill 30 random-number, rounding and mathematical-function messages.
- Focused key-order, placeholder and restriction checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cb5f99e944">Translate Javanese number properties and statistics</a>. Thanks to xet7.</summary>

- Fill 35 number-property, constant and statistics messages.
- Focused key-order, placeholder and restriction checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5c1935e56f">Translate Javanese logic and arithmetic messages</a>. Thanks to xet7.</summary>

- Fill 33 comparison, Boolean-logic and arithmetic messages.
- Focused key-order, placeholder and restriction checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fdf1c8eac5">Translate Javanese list insertion and sorting</a>. Thanks to xet7.</summary>

- Fill 35 list-insertion, sorting and text-conversion messages.
- Focused key-order, placeholder and restriction checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e8de04ad0c">Translate Javanese list retrieval and removal</a>. Thanks to xet7.</summary>

- Fill 32 list-creation, retrieval, removal and sublist messages.
- Focused key-order, placeholder and restriction checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/937e231b54">Translate Javanese inputs and keyboard navigation</a>. Thanks to xet7.</summary>

- Fill 32 input, keyboard-navigation and list-creation messages.
- Focused key-order, placeholder and restriction checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e235f6e293">Translate Javanese editor input and icon labels</a>. Thanks to xet7.</summary>

- Fill 37 editor icon, list-input and numeric-input labels.
- Focused key-order, placeholder and restriction checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f98a3195e7">Translate Javanese editing and bitmap messages</a>. Thanks to xet7.</summary>

- Fill 33 editing commands, bitmap labels and keyboard-help messages.
- Focused key-order, placeholder and restriction checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/188ecb414e">Translate Javanese colours and loop controls</a>. Thanks to xet7.</summary>

- Fill 32 colour, loop and conditional messages.
- Focused key-order, placeholder and restriction checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3e93769ef0">Translate Javanese editor field and block labels</a>. Thanks to xet7.</summary>

- Fill 36 editor field, block and colour labels.
- Focused key-order, placeholder and restriction checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5aa9d038d5">Translate Javanese map and accessibility messages</a>. Thanks to xet7.</summary>

- Fill 35 map instructions, movement announcements and accessibility labels.
- Focused key-order, placeholder and restriction checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6503a6e4f4">Translate Javanese notifications and saved filters</a>. Thanks to xet7.</summary>

- Fill 32 notification, reminder, saved-filter and import-report strings.
- Focused key-order, placeholder and restriction checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8d36f60207">Translate Javanese visibility and rule messages</a>. Thanks to xet7.</summary>

- Fill 20 visibility, import, rule and notification messages, preserving
  permissions, query syntax and brace-delimited variables.
- Focused key-order, placeholder and restriction checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a2eaba4d5f">Translate Javanese date and archival filters</a>. Thanks to xet7.</summary>

- Fill 22 date-filter and archival messages, preserving template exclusions
  and the treatment of unknown list-entry dates.
- Focused key-order, placeholder and restriction checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1bfea1fb5f">Verify Tajik translation completeness and literal labels</a>. Thanks to xet7.</summary>

- Classify 28 printed key legends, platform names and code/math literals as
  intentional unchanged text. No untranslated Tajik prose is reported.
- The full Tajik suite and all 21 human-preference checks pass, including
  source keys, HTML tags and placeholders. The broader suite still fails on
  missing dependency keys in another locale. Browser and native-speaker
  reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8346a425eb">Translate Tajik recovery and history messages</a>. Thanks to xet7.</summary>

- Fill 44 recovery, sign-in and history messages, preserving retry and
  cancellation limitations.
- Focused key-order, placeholder and query-syntax checks and all 21
  human-preference checks pass. Literal labels still need review;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d1c713867c">Translate Tajik email queue and failure messages</a>. Thanks to xet7.</summary>

- Fill 37 email-queue, delivery-failure and estimate messages, preserving
  cancellation limits and repeated-delivery warnings.
- Focused key-order, placeholder and query-syntax checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/add45c747e">Translate Tajik Sync reports and diagnostics</a>. Thanks to xet7.</summary>

- Fill 34 Sync preview, report and diagnostic messages, preserving retention
  limits and warnings about partial changes.
- Focused key-order, placeholder and query-syntax checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e7cfa531fb">Translate Tajik observations and Sync conflicts</a>. Thanks to xet7.</summary>

- Fill 32 observation, Sync-conflict and preview messages, preserving
  report limitations and card-retention instructions.
- Focused key-order, placeholder and query-syntax checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1282d9495d">Translate Tajik sprint reports and events</a>. Thanks to xet7.</summary>

- Fill 37 sprint-event and report messages, preserving unknown-estimate
  distinctions and partial-report limitations.
- Focused key-order, placeholder and query-syntax checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1bc39d6efa">Translate Tajik Scrum settings and sprint planning</a>. Thanks to xet7.</summary>

- Fill 42 rule-save, Scrum settings and sprint-planning messages.
- Focused key-order, placeholder and query-syntax checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0830a89811">Translate Tajik workspace and rule editor messages</a>. Thanks to xet7.</summary>

- Fill 42 workspace, search and rule-editor messages, preserving access
  restrictions and conflict-reload instructions.
- Focused key-order, placeholder and query-syntax checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/49ce1e6897">Translate Tajik text processing and variables</a>. Thanks to xet7.</summary>

- Fill 41 text-processing, prompt and variable-control messages.
- Focused key-order, placeholder and query-syntax checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c5adc819a5">Translate Tajik navigation and text operations</a>. Thanks to xet7.</summary>

- Fill 38 navigation shortcuts, text-case and character-selection messages.
- Focused key-order, placeholder and query-syntax checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9065d4c64c">Translate Tajik function warnings and shortcuts</a>. Thanks to xet7.</summary>

- Fill 40 function warnings, screen-reader instructions and keyboard shortcuts.
- Focused key-order, placeholder and query-syntax checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5fe16502b5">Translate Tajik trigonometry and function editor</a>. Thanks to xet7.</summary>

- Fill 36 trigonometry, variable and function-editor messages.
- Focused key-order, placeholder and query-syntax checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/deebc2ea1a">Translate Tajik statistics and mathematical functions</a>. Thanks to xet7.</summary>

- Fill 34 statistics, random-number, rounding and mathematical-function strings.
- Focused key-order, placeholder and query-syntax checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/06d630acd4">Translate Tajik mathematical labels and tooltips</a>. Thanks to xet7.</summary>

- Fill 38 arithmetic, constant, number-property and statistical labels.
- Focused key-order, placeholder and query-syntax checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f4f14b8a36">Translate Tajik sorting and logic messages</a>. Thanks to xet7.</summary>

- Fill 38 sorting, logic and arithmetic messages, preserving sort arguments.
- Focused key-order, placeholder and query-syntax checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5cfe2570ec">Translate Tajik list operations</a>. Thanks to xet7.</summary>

- Fill 42 list retrieval, removal, insertion and ordering messages.
- Focused key-order, placeholder and query-syntax checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f30badcada">Translate Tajik navigation and list inputs</a>. Thanks to xet7.</summary>

- Fill 43 input labels, keyboard-navigation messages and list controls.
- Focused key-order, placeholder and query-syntax checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/23ab8ea968">Translate Tajik editor input labels</a>. Thanks to xet7.</summary>

- Fill 45 editor help messages, icon labels and input descriptions.
- Focused key-order, placeholder and query-syntax checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/730580d2be">Translate Tajik conditionals and editing commands</a>. Thanks to xet7.</summary>

- Fill 39 conditional-block, editing and bitmap messages.
- Focused key-order, placeholder and query-syntax checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/19505b6f5a">Translate Tajik editor colours and loop controls</a>. Thanks to xet7.</summary>

- Fill 43 block labels, colour controls and loop instructions.
- Focused key-order, placeholder and query-syntax checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/77ac017f81">Translate Tajik map and accessibility messages</a>. Thanks to xet7.</summary>

- Fill 43 map instructions, movement announcements and editor field labels.
- Focused key-order, placeholder and query-syntax checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/65cc8b5e84">Translate Tajik notifications and saved filters</a>. Thanks to xet7.</summary>

- Fill 40 notification, reminder, saved-filter, import-report and map strings.
- Focused key-order, placeholder and query-syntax checks and all 21
  human-preference checks pass. Full-language translation work remains;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e2c9fa2e74">Translate Tajik filters and rule controls</a>. Thanks to xet7.</summary>

- Fill 40 date-filter, archival, visibility and rule-control messages.
- The batch passes key-order, placeholder and query-syntax checks, and all
  21 human-preference checks pass. Existing full-language coverage remains
  failing on 856 untranslated entries. Browser and native-speaker reviews
  were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c1fe72be8f">Verify Cantonese translation completeness and literal labels</a>. Thanks to xet7.</summary>

- Check every Cantonese source key and placeholder; classify 28 printed key
  legends, platform names and code/math literals as intentional unchanged text.
- Cantonese has no reported untranslated prose, including pending keys.
  Focused checks and all 21 human-preference checks pass. The broader suite
  still fails on missing dependency keys in another locale; browser and
  native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5cc76ca933">Translate Cantonese recovery and delivery controls</a>. Thanks to xet7.</summary>

- Fill 68 messages for recovery, delivery failures, SAML sign-in and
  undo/redo requests, preserving cancellation and retry limitations.
- Cantonese key-order, translation and placeholder checks and all 21
  human-preference checks pass. Literal labels still need review;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d22b662419">Translate Cantonese Sync reports and email queue</a>. Thanks to xet7.</summary>

- Fill 37 messages for Sync diagnostics, report retention and email queue
  controls, preserving partial-failure and delivery-retry limitations.
- Cantonese key-order, translation and placeholder checks and all 21
  human-preference checks pass. Other untranslated strings remain;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c10cf18a30">Translate Cantonese Sync conflicts and previews</a>. Thanks to xet7.</summary>

- Fill 32 messages for conflict resolution, replacement cards and previews,
  preserving card-retention instructions and report limitations.
- Cantonese key-order, translation and placeholder checks and all 21
  human-preference checks pass. Other untranslated strings remain;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7329bac86d">Translate Cantonese sprint reports and observations</a>. Thanks to xet7.</summary>

- Fill 34 messages for sprint reports, daily observations and Sync conflicts,
  preserving reporting limitations, placeholders and source-system boundaries.
- Cantonese key-order, translation and placeholder checks and all 21
  human-preference checks pass. Other untranslated strings remain;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3a22185b85">Translate Cantonese sprint planning and events</a>. Thanks to xet7.</summary>

- Fill 37 messages for Scrum completion policies, sprint planning, events
  and work status, preserving existing translations.
- Cantonese key-order, translation and placeholder checks and all 21
  human-preference checks pass. Other untranslated strings remain;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4a22dabed3">Translate Cantonese rule editor and Scrum settings</a>. Thanks to xet7.</summary>

- Fill 32 messages for legacy editor labels, rule editing and Scrum settings,
  preserving existing translations and extending regression coverage.
- Cantonese key-order, translation and placeholder checks and all 21
  human-preference checks pass. Other untranslated strings remain;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e0614017a3">Translate Cantonese workspace and variable messages</a>. Thanks to xet7.</summary>

- Fill 37 messages for variables, workspace announcements, search and
  legacy block labels, preserving placeholders and keyboard instructions.
- Cantonese key-order, translation and placeholder checks and all 21
  human-preference checks pass. Other untranslated strings remain;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5a996eebb2">Translate Cantonese text processing and prompts</a>. Thanks to xet7.</summary>

- Fill 33 messages for text extraction, search, replacement, trimming and
  input prompts, preserving numbered placeholders.
- Cantonese key-order, translation and placeholder checks and all 21
  human-preference checks pass. Other untranslated strings remain;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dd48326373">Translate Cantonese shortcuts and text selection</a>. Thanks to xet7.</summary>

- Fill 33 messages for shortcuts, text case changes, character selection
  and text assembly, preserving numbered placeholders.
- Cantonese key-order, translation and placeholder checks and all 21
  human-preference checks pass. Other untranslated strings remain;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f6f32820e4">Translate Cantonese accessibility shortcuts</a>. Thanks to xet7.</summary>

- Fill 35 messages for screen-reader modes, navigation, focus and editor
  shortcuts, preserving numbered placeholders and existing terminology.
- Cantonese key-order, translation and placeholder checks and all 21
  human-preference checks pass. Other untranslated strings remain;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/519e186b51">Translate Cantonese functions and variable controls</a>. Thanks to xet7.</summary>

- Fill 31 messages for variables, function definitions, parameters and
  editor controls, preserving numbered placeholders and existing terminology.
- Cantonese key-order, translation and placeholder checks and all 21
  human-preference checks pass. Other untranslated strings remain;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c5368665cd">Translate Cantonese mathematical functions</a>. Thanks to xet7.</summary>

- Fill 35 messages for rounding, logarithms, trigonometry and editor
  controls, preserving notation and the degree-versus-radian distinction.
- Cantonese key-order, translation and placeholder checks and all 21
  human-preference checks pass. Other untranslated strings remain;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dc301d7ee4">Translate Cantonese number properties and statistics</a>. Thanks to xet7.</summary>

- Fill 36 messages for number properties, list statistics and random values,
  preserving placeholders and inclusive or exclusive bounds.
- Cantonese key-order, translation and placeholder checks and all 21
  human-preference checks pass. Other untranslated strings remain;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ba6d1d4b29">Translate Cantonese logic and arithmetic messages</a>. Thanks to xet7.</summary>

- Fill 31 messages for comparisons, logic, arithmetic and constants,
  preserving placeholders, mathematical notation and inclusive bounds.
- Cantonese key-order, translation and placeholder checks and all 21
  human-preference checks pass. Other untranslated strings remain;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a5191ece4f">Translate Cantonese list transformations and logic</a>. Thanks to xet7.</summary>

- Fill 38 messages for list transformations and Boolean comparisons.
  Match the sort label to Blockly's argument order.
- Cantonese key-order, translation and placeholder checks and all 21
  human-preference checks pass. Other untranslated strings remain;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1900b0b8d3">Translate Cantonese list indexing and removal</a>. Thanks to xet7.</summary>

- Fill 38 messages for list creation, indexing, retrieval, removal and
  ranges, preserving numbered placeholders and operation distinctions.
- Cantonese key-order, translation and placeholder checks and all 21
  human-preference checks pass. Other untranslated strings remain;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/38d9f7a49c">Translate Cantonese math and text input messages</a>. Thanks to xet7.</summary>

- Fill 38 labels and hints for math and text inputs, keyboard navigation
  and list creation, preserving numbered placeholders.
- Cantonese key-order, translation and placeholder checks and all 21
  human-preference checks pass. Other untranslated strings remain;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fa37380144">Translate Cantonese editor input labels</a>. Thanks to xet7.</summary>

- Fill 40 field, icon, list and loop input labels, preserving numbered
  placeholders and existing translations.
- Cantonese key-order, translation and placeholder checks and all 21
  human-preference checks pass. Other untranslated strings remain;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/60b9e529f2">Translate Cantonese editing actions and bitmap controls</a>. Thanks to xet7.</summary>

- Fill 31 messages for loop behaviour, editing actions, deletion prompts,
  block expansion and bitmap controls, preserving numbered placeholders.
- Cantonese key-order, translation and placeholder checks and all 21
  human-preference checks pass. Other untranslated strings remain;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8f85de9cf9">Translate Cantonese colour and control-flow blocks</a>. Thanks to xet7.</summary>

- Fill 35 editor commands and tooltips for colours, loops and conditional
  blocks, preserving numbered placeholders and variable tokens.
- Cantonese key-order, translation and placeholder checks and all 21
  human-preference checks pass. Other untranslated strings remain;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/808baa0e46">Translate Cantonese editor accessibility labels</a>. Thanks to xet7.</summary>

- Fill 38 accessibility labels for editor fields, blocks, comments and
  warnings, preserving numbered placeholders and literal keyboard names.
- Cantonese key-order, translation and placeholder checks and all 21
  human-preference checks pass. Other untranslated strings remain;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/11764dad80">Translate Cantonese maps and editor announcements</a>. Thanks to xet7.</summary>

- Fill 34 messages for saved filters, import reports, map placement and
  editor accessibility announcements, preserving numbered placeholders.
- Cantonese key-order, translation and placeholder checks and all 21
  human-preference checks pass. Other untranslated strings remain;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/841c5302f7">Translate Cantonese rules and notification preferences</a>. Thanks to xet7.</summary>

- Fill 35 messages for rules, notification categories, due reminders,
  dependency directions and saved filters.
- Cantonese regression checks now compare brace-delimited template variables
  as well as underscore and percent placeholders. These and all 21
  human-preference checks pass. Other untranslated strings remain;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ae743931bc">Translate Cantonese date filters and board visibility</a>. Thanks to xet7.</summary>

- Fill 30 Cantonese messages for date filters, automatic archiving, imports
  and board visibility, preserving query syntax and link scheme names.
- New regression checks cover placeholders, archival exceptions and board
  access restrictions. These and all 21 human-preference checks pass.
  Other untranslated strings remain; browser and native-speaker reviews
  were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5105fb00b7">Complete remaining Kazakh recovery and history translations</a>. Thanks to xet7.</summary>

- Fill the final 50 reported Kazakh placeholders for recovery, history and
  sign-in messages. Add Kazakh to full-locale completeness coverage.
- Kazakh now has no reported untranslated placeholders. Its completeness,
  regression, key-order and placeholder checks and all 21 human-preference
  checks pass. The broader suite still fails on missing Cherokee dependency
  keys. Other languages remain incomplete; browser and native-speaker
  reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f01302635b">Translate Kazakh Sync diagnostics and email recovery</a>. Thanks to xet7.</summary>

- Fill 36 messages for Sync diagnostics, estimate fields, email queue
  controls and delivery failures, preserving recovery action limitations.
- Kazakh regression checks, full-locale key and placeholder checks, and all
  21 human-preference checks pass. Other untranslated strings and missing
  Cherokee and Tigre keys remain. Browser and native-speaker reviews
  were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/81f98bc1cb">Translate Kazakh Sync previews and run reports</a>. Thanks to xet7.</summary>

- Fill 35 messages for Sync previews, source-field reports and run outcomes,
  preserving report limits, retention periods and partial-change warnings.
- Kazakh regression checks, full-locale key and placeholder checks, and all
  21 human-preference checks pass. Other untranslated strings and missing
  Cherokee and Tigre keys remain. Browser and native-speaker reviews
  were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e5de3fcf2f">Translate Kazakh Scrum observations and Sync conflicts</a>. Thanks to xet7.</summary>

- Fill 40 messages for Scrum observations, partial reports and Sync conflict
  resolution, preserving reporting limitations and source-system boundaries.
- Kazakh regression checks, full-locale key and placeholder checks, and all
  21 human-preference checks pass. Other untranslated strings and missing
  Cherokee and Tigre keys remain. Browser and native-speaker reviews
  were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e5e7ea6fde">Translate Kazakh sprint planning and reports</a>. Thanks to xet7.</summary>

- Fill 45 Scrum messages for sprint planning, events, reports and lifecycle
  confirmations. Preserve count and estimate placeholders and distinguish
  unknown estimates from zero estimates.
- Kazakh regression checks, full-locale key and placeholder checks, and all
  21 human-preference checks pass. Other untranslated strings and missing
  Cherokee and Tigre keys remain. Browser and native-speaker reviews
  were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a274a453ea">Translate Kazakh rule editor and Scrum settings</a>. Thanks to xet7.</summary>

- Fill 32 rule-editor and Scrum messages. Recognize 28 printed keyboard
  labels, platform names and mathematical symbols as locale-specific
  invariants, with checks that their literal values are retained.
- Kazakh regression checks, full-locale key and placeholder checks, and all
  21 human-preference checks pass. Other untranslated strings and missing
  Cherokee and Tigre keys remain. Browser and native-speaker reviews
  were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c75f567c4a">Translate Kazakh workspace and variable messages</a>. Thanks to xet7.</summary>

- Fill 37 editor messages for variables, workspace announcements, search
  and legacy block labels, preserving placeholders and keyboard instructions.
- Kazakh regression checks, full-locale key and placeholder checks, and all
  21 human-preference checks pass. Other untranslated strings and missing
  Cherokee and Tigre keys remain. Browser and native-speaker reviews
  were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e952ee95bf">Translate Kazakh text operations and prompts</a>. Thanks to xet7.</summary>

- Fill 51 editor messages for text search, replacement, extraction,
  formatting and input prompts, preserving placeholders and indexing rules.
- Kazakh regression checks, full-locale key and placeholder checks, and all
  21 human-preference checks pass. Other untranslated strings and missing
  Cherokee and Tigre keys remain. Browser and native-speaker reviews
  were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/24ff021edf">Translate Kazakh accessibility shortcuts and text controls</a>. Thanks to xet7.</summary>

- Fill 49 messages for screen-reader modes, keyboard shortcuts, variable
  renaming, text appending and letter case changes.
- Kazakh regression, dependency, full-locale key and placeholder checks,
  and all 21 human-preference checks pass. Other untranslated strings and
  missing Cherokee and Tigre keys remain. Browser and native-speaker reviews
  were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8282c39e32">Translate Kazakh functions and editor commands</a>. Thanks to xet7.</summary>

- Fill 48 messages for trigonometry, variable creation, function definitions
  and editor controls. Keep the existing block backpack terminology.
- Kazakh regression checks, full-locale key and placeholder checks, and all
  21 human-preference checks pass. Other untranslated strings and missing
  Cherokee and Tigre keys remain. Browser and native-speaker reviews
  were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ee7f92e489">Translate Kazakh statistics and mathematical functions</a>. Thanks to xet7.</summary>

- Fill 47 editor strings for list statistics, random numbers, rounding,
  powers, logarithms and inverse trigonometric functions. Random-number
  tooltips preserve inclusive and exclusive interval boundaries.
- Kazakh regression checks, full-locale key and placeholder checks, and all
  21 human-preference checks pass. Other untranslated strings and missing
  Cherokee and Tigre keys remain. Browser and native-speaker reviews
  were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/57cfaffdff">Translate Kazakh logic and arithmetic messages</a>. Thanks to xet7.</summary>

- Fill 48 editor labels and tooltips for comparisons, Boolean operations,
  arithmetic, constants and number properties.
- Kazakh regression checks, full-locale key and placeholder checks, and all
  21 human-preference checks pass. Other untranslated strings and missing
  Cherokee and Tigre keys remain. Browser and native-speaker reviews
  were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dedd2f5f8c">Translate Kazakh list transformations and logic labels</a>. Thanks to xet7.</summary>

- Fill 48 editor strings for list ranges, indexing, insertion, sorting,
  splitting and Boolean values. The sort label follows Blockly's actual
  argument order while preserving every numbered placeholder.
- Kazakh regression checks and all 21 human-preference checks pass.
  Other untranslated strings and missing Cherokee and Tigre keys remain.
  Browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3987948bd6">Translate Kazakh keyboard navigation and list operations</a>. Thanks to xet7.</summary>

- Fill 34 editor strings for keyboard navigation, list creation and element
  retrieval or removal, preserving numbered placeholders.
- Kazakh regression checks and all 21 human-preference checks pass.
  The broad completion suite still fails on missing Cherokee dependency keys.
  Other untranslated strings remain; browser and native-speaker reviews
  were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0c621101cf">Translate Kazakh input labels and recognize literal Pause key legends</a>. Thanks to xet7.</summary>

- Translate 42 list, loop, number and text input labels into Kazakh.
- Recognize the restored printed Pause key name in nine locale-specific
  invariant sets, so completeness checks do not mistake it for English prose.
- Dependency and audit review suites and all 21 human-preference checks pass.
  The broad completion suite passes the Kazakh checks but still fails on
  missing Cherokee dependency keys. Other untranslated strings remain.
  Browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dd4a637d18">Translate dependency messages into Wolaytta</a>. Thanks to xet7.</summary>

- Fill 11 dependency messages, bringing dependency coverage to 232
  non-English locale tags. Terminology and grammar, including the coined
  relationship noun, have low confidence and need native-speaker review.
- Dependency key-order and placeholder checks and all 21 human-preference
  checks pass. Other untranslated strings remain; browser and native-speaker
  reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/35436c6143">Translate dependency messages into Standard Moroccan Tamazight</a>. Thanks to xet7.</summary>

- Fill 11 dependency messages in Tifinagh, bringing dependency coverage to
  231 non-English locale tags. Terminology and grammar have low confidence
  and need native-speaker review.
- Dependency key-order and placeholder checks and all 21 human-preference
  checks pass. Other untranslated strings remain; browser and native-speaker
  reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f222f0a64c">Translate dependency messages into Inuktitut</a>. Thanks to xet7.</summary>

- Fill 11 dependency messages in syllabics, bringing dependency coverage to
  230 non-English locale tags. Terminology and grammar have low confidence
  and need native-speaker review.
- Dependency key-order and placeholder checks and all 21 human-preference
  checks pass. Other untranslated strings remain; browser and native-speaker
  reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/98cea3dcc7">Translate dependency messages into Nahuatl</a>. Thanks to xet7.</summary>

- Fill 11 dependency messages, bringing dependency coverage to 229
  non-English locale tags. Terminology and grammar have low confidence
  and need native-speaker review.
- Dependency key-order and placeholder checks and all 21 human-preference
  checks pass. Other untranslated strings remain; browser and native-speaker
  reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/55dc8d7628">Translate dependency messages into Greenlandic</a>. Thanks to xet7.</summary>

- Fill 11 dependency messages, bringing dependency coverage to 228
  non-English locale tags. Terminology and grammar have low confidence
  and need native-speaker review.
- Dependency key-order and placeholder checks and all 21 human-preference
  checks pass. Other untranslated strings remain; browser and native-speaker
  reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/196dcb9633">Translate dependency messages into Volapük</a>. Thanks to xet7.</summary>

- Fill 11 dependency messages, bringing dependency coverage to 227
  non-English locale tags. Wording has low confidence and needs fluent-speaker
  review. Older inconsistent translations remain for correction.
- Dependency key-order and placeholder checks and all 21 human-preference
  checks pass. Other untranslated strings remain; browser and fluent-speaker
  reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/67f22ce20b">Translate dependency messages into Klingon</a>. Thanks to xet7.</summary>

- Fill 11 dependency messages, bringing dependency coverage to 226
  non-English locale tags. Terminology and grammar have low confidence
  and need fluent-speaker review.
- Dependency key-order and placeholder checks and all 21 human-preference
  checks pass. Other untranslated strings remain; browser and fluent-speaker
  reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/eb97c9ec3b">Translate dependency messages into Ewe and Fula</a>. Thanks to xet7.</summary>

- Fill 11 dependency messages in each language, bringing dependency coverage
  to 225 non-English locale tags. Terminology and grammar have low confidence
  and need native-speaker review.
- Dependency key-order and placeholder checks and all 21 human-preference
  checks pass. Other untranslated strings remain; browser and native-speaker
  reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/da9d6d42ba">Translate dependency messages into Guarani and Kashmiri</a>. Thanks to xet7.</summary>

- Fill 11 dependency messages in each language, bringing dependency coverage
  to 223 non-English locale tags. Terminology and phrasing have low confidence
  and need native-speaker review. Older inconsistent terminology remains.
- Dependency key-order and placeholder checks and all 21 human-preference
  checks pass. Other untranslated strings remain; browser and native-speaker
  reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3253372ab1">Translate dependency messages into Tigrinya</a>. Thanks to xet7.</summary>

- Fill 11 dependency messages, bringing dependency coverage to 221
  non-English locale tags. Wording needs native-speaker review.
- Dependency key-order and placeholder checks and all 21 human-preference
  checks pass. Other untranslated strings remain; browser and native-speaker
  reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ca8c13b233">Translate dependency messages into Quechua and Aymara</a>. Thanks to xet7.</summary>

- Fill 11 dependency messages in each language, bringing dependency coverage
  to 220 non-English locale tags. Terminology and grammar have low confidence
  and need native-speaker review. Older mixed-language values still need work.
- Dependency key-order and placeholder checks and all 21 human-preference
  checks pass. Other untranslated strings remain; browser and native-speaker
  reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1161737572">Translate dependency messages into Tibetan and Dzongkha</a>. Thanks to xet7.</summary>

- Fill 11 dependency messages in each language, bringing dependency coverage
  to 218 non-English locale tags. Wording has low confidence and needs
  native-speaker review.
- Dependency key-order and placeholder checks and all 21 human-preference
  checks pass. Other untranslated strings remain; browser and native-speaker
  reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/deed1ecf18">Translate dependency messages into Cornish and Manx</a>. Thanks to xet7.</summary>

- Fill 11 dependency messages in each language, bringing dependency coverage
  to 216 non-English locale tags. Terminology and wording have low confidence
  and need native-speaker review.
- Dependency key-order and placeholder checks and all 21 human-preference
  checks pass. Other untranslated strings remain; browser and native-speaker
  reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d38eb308d8">Translate dependency messages into Buryat, Sakha and Chuvash</a>. Thanks to xet7.</summary>

- Fill 11 dependency messages in each language, bringing dependency coverage
  to 214 non-English locale tags. Wording has low confidence and needs
  native-speaker review.
- Dependency key-order and placeholder checks and all 21 human-preference
  checks pass. Other untranslated strings remain; browser and native-speaker
  reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3a0857625b">Translate dependency messages into Venetian, Veps and Northern Sámi</a>. Thanks to xet7.</summary>

- Fill 11 dependency messages in each language, bringing dependency coverage
  to 211 non-English locale tags. Wording has low confidence, especially
  Veps terminology, and needs native-speaker review.
- Dependency key-order and placeholder checks and all 21 human-preference
  checks pass. Other untranslated strings remain; browser and native-speaker
  reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/be4fd108e2">Translate dependency messages into Acehnese, Aromanian and Ladin</a>. Thanks to xet7.</summary>

- Fill 11 dependency messages in each language, bringing dependency coverage
  to 208 non-English locale tags. These translations have low confidence and
  need native-speaker review.
- Dependency key-order and placeholder checks and all 21 human-preference
  checks pass. Other untranslated strings remain; browser and native-speaker
  reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/22391b1a26">Translate dependency messages into Northern Ndebele, Venda and Arabic-script Uzbek</a>. Thanks to xet7.</summary>

- Fill 11 dependency messages in each locale, bringing dependency coverage
  to 205 non-English locale tags. Wording and Uzbek Arabic orthography have
  lower confidence and need native-speaker review.
- Dependency key-order and placeholder checks and all 21 human-preference
  checks pass. Other untranslated strings remain; browser and native-speaker
  reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a41b6733a1">Translate dependency messages into Akan, Bambara and Wolof</a>. Thanks to xet7.</summary>

- Fill 11 dependency messages in each language, bringing dependency coverage
  to 202 non-English locale tags. Wording has lower confidence and needs
  native-speaker review.
- Dependency key-order and placeholder checks and all 21 human-preference
  checks pass. Other untranslated strings remain; browser and native-speaker
  reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/168a175f1d">Translate dependency messages into Yoruba, Luganda, Oromo and Kirundi</a>. Thanks to xet7.</summary>

- Fill 11 dependency messages in each language, bringing dependency coverage
  to 199 non-English locale tags. Wording has lower confidence and needs
  native-speaker review.
- Dependency key-order and placeholder checks and all 21 human-preference
  checks pass. Other untranslated strings remain; browser and native-speaker
  reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/45f98c7d4a">Translate dependency messages into Walloon, Flemish and Waray</a>. Thanks to xet7.</summary>

- Fill 11 dependency messages in each locale, bringing dependency coverage
  to 195 non-English locale tags. Walloon and Waray wording has lower
  confidence and needs native-speaker review.
- Dependency key-order and placeholder checks and all 21 human-preference
  checks pass. Other untranslated strings remain; browser and native-speaker
  reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c73f5d98d0">Translate dependency messages into Hawaiian, Fijian and Tongan</a>. Thanks to xet7.</summary>

- Fill 11 dependency messages in each language, bringing dependency coverage
  to 192 non-English locale tags. Wording has lower confidence and needs
  native-speaker review.
- Dependency key-order and placeholder checks and all 21 human-preference
  checks pass. Other untranslated strings remain; browser and native-speaker
  reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d1a55f9b66">Translate dependency messages into Kashubian, Upper Sorbian, Silesian and Neapolitan</a>. Thanks to xet7.</summary>

- Fill 11 dependency messages in each language, bringing dependency coverage
  to 189 non-English locale tags. Wording has lower confidence and needs
  native-speaker review.
- Dependency key-order and placeholder checks and all 21 human-preference
  checks pass. Other untranslated strings remain; browser and native-speaker
  reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d7b471b192">Translate dependency messages into Māori, Samoan, Tok Pisin and Bislama</a>. Thanks to xet7.</summary>

- Fill 11 dependency messages in each language, bringing dependency coverage
  to 185 non-English locale tags. Wording has lower confidence and needs
  native-speaker review.
- Dependency key-order and placeholder checks and all 21 human-preference
  checks pass. Other untranslated strings remain; browser and native-speaker
  reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0c39c3b06b">Translate dependency messages into Bhojpuri, Maithili and Konkani</a>. Thanks to xet7.</summary>

- Fill 11 dependency messages in each language, bringing dependency coverage
  to 181 non-English locale tags. Wording has lower confidence and needs
  native-speaker review.
- Dependency key-order and placeholder checks and all 21 human-preference
  checks pass. Other untranslated strings remain; browser and native-speaker
  reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2fa9e5fc5e">Translate dependency messages into Cantonese, Wu, Yiddish and Moroccan Arabic</a>. Thanks to xet7.</summary>

- Fill 11 dependency messages in each locale, bringing dependency coverage
  to 178 non-English locale tags. Wording has lower confidence and needs
  native-speaker review.
- Dependency key-order and placeholder checks and all 21 human-preference
  checks pass. Other untranslated strings remain; browser and native-speaker
  reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/81dbbd456a">Translate dependency messages into six southern African languages</a>. Thanks to xet7.</summary>

- Fill 11 dependency messages in Shona, Southern Sotho, Tswana, Swati, Tsonga
  and Northern Sotho. Dependency coverage now reaches 174 non-English locale
  tags. Wording has lower confidence and needs native-speaker review.
- Dependency key-order and placeholder checks and all 21 human-preference
  checks pass. Other untranslated strings remain; browser and native-speaker
  reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/eb7b606d64">Translate dependency messages into six African languages</a>. Thanks to xet7.</summary>

- Fill 11 dependency messages in Hausa, Igbo, Chichewa, Kinyarwanda, Zulu and
  Xhosa, including the regional Zulu locale. Dependency coverage now reaches
  168 non-English locale tags. Wording has lower confidence and needs
  native-speaker review.
- Dependency key-order and placeholder checks and all 21 human-preference
  checks pass. Other untranslated strings remain; browser and native-speaker
  reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/774dd456b5">Translate dependency messages into Central Kurdish, Uyghur, Amharic and Assamese</a>. Thanks to xet7.</summary>

- Fill 11 dependency messages in each language, bringing dependency coverage
  to 161 non-English locale tags. Wording has lower confidence and needs
  native-speaker review.
- Dependency key-order and placeholder checks and all 21 human-preference
  checks pass. Other untranslated strings remain; browser and native-speaker
  reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1affaa292e">Translate dependency messages into Tatar, Bashkir, Kurmanji and Turkmen</a>. Thanks to xet7.</summary>

- Fill 11 dependency messages in each language, bringing dependency coverage
  to 157 non-English locale tags. Wording has lower confidence and needs
  native-speaker review.
- Dependency key-order and placeholder checks and all 21 human-preference
  checks pass. Other untranslated strings remain; browser and native-speaker
  reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0f64bf0a65">Translate dependency messages into five more Asian languages</a>. Thanks to xet7.</summary>

- Fill 11 dependency messages in Khmer, Burmese, Pashto, Sindhi and Odia,
  covering seven locale tags. Dependency coverage now reaches 153 non-English
  locale tags. Pashto, Sindhi and Odia wording has lower confidence and needs
  native-speaker review.
- Dependency key-order and placeholder checks and all 21 human-preference
  checks pass. The Khmer completeness suite still fails on its other
  untranslated strings; browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1044fe0873">Fill dependency messages and synchronize regional locales</a>. Thanks to xet7.</summary>

- Translate 11 dependency messages into Breton, West Frisian, Friulian and
  Romansh, including the Frisian regional locale. These translations have
  lower confidence and need native-speaker review.
- Fill the missing messages in Welsh and Japanese regional locales, bringing
  dependency coverage to 146 non-English locale tags. Synchronize eleven
  English regional files with the source messages.
- Dependency key-order and placeholder checks, Japanese completeness checks
  and all 21 human-preference checks pass. Other locales still need work;
  browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d74d2f3dd8">Repair audit regressions and extend dependency translations</a>. Thanks to xet7.</summary>

- Translate 11 dependency messages into Welsh, Irish, Scottish Gaelic and
  Faroese. Scottish Gaelic and Faroese wording has lower confidence and needs
  native-speaker review. Dependency coverage now includes 139 locale tags.
- Retain newer reviewed translations in the correction ledger, align the
  Asturian template dialog title, and restore literal Pause keyboard labels
  in nine locales.
- Update regression assertions for current Asturian and Aragonese wording
  and the checklist textarea. Five focused suites and all 21 human-preference
  checks pass. Broader completeness checks still fail on missing keys and
  untranslated strings; browser and native-speaker reviews were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/99bab720d3">Translate dependency layers in four more languages</a>. Thanks to xet7.</summary>

- Translate 11 dependency messages into Aragonese, Asturian, Sardinian
  and Sicilian. Wording has lower confidence and needs native-speaker review.
- Coverage now includes 135 locale tags; other locales remain pending.
- Focused key-order, placeholder and human-preference checks pass.
  Browser and native-speaker review were not run.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.14 2026-10-01 WeKan ® release

**In short:** A translation test now checks the Trello link by its parsed host,
closing **GitHub CodeQL** alert 547, and the **DOMPurify** sanitizer is updated
to 3.4.16.

This release fixes the following SECURITY ISSUES found by CodeQL code scanning:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a7ae58ea9f">Alert 547: check the Trello link in a translation test by its parsed host</a>. Thanks to GitHub CodeQL and xet7.</summary>

A substring check also passed for the link hidden in another URL's query or on
a lookalike host. The test now parses each link and requires `trello.com` and
`/app-key`, and a tree-wide suite fails on any URL or host checked as a
substring. No shipped code had the form, so there is no Hall of Fame row or
Problems key.

</details>

and updates the following dependencies:

- **dompurify 3.4.15 → 3.4.16** — the HTML sanitizer that cleans card text,
  comments and activity text ([the update](https://github.com/wekan/wekan/commit/da1a841369bb90b9591bc48723991e3565281ce7)).

Thanks to dependabot.

Thanks to above GitHub users for their contributions and translators for their translations.
