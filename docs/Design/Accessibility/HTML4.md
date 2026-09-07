# HTML4 compatibility mode

## Goal

WeKan must keep its normal URLs usable when JavaScript is disabled or the
browser cannot execute the JavaScript capabilities required by the Meteor
client. The compatibility response is server-rendered HTML 4.01, uses no
JavaScript, cookies or client-side storage, and performs navigation and changes
with HTML forms.
The interaction model follows progressive enhancement: server-rendered forms
remain functional without client JavaScript, while capable browsers upgrade to
the full application.

This is an alternate representation of WeKan data, not a second application or
a redirect to different URLs. Modern browsers continue to receive the existing
Meteor application.

## Selecting the representation with progressive enhancement

The representation is **not** selected from User-Agent names or versions. A
modern Firefox or Chrome with JavaScript disabled needs HTML4 just as much as an
Amiga browser, while a browser name alone cannot prove which features work.

Every document request first receives a small, functional HTML4 page. A tiny
inline bootstrap performs capability tests and upgrades that page to the Meteor
client only when every required feature works. The tests exercise behavior, not
the presence of a property. At minimum they verify supported JavaScript syntax,
DOM events, networking and native pointer/mouse/touch drag-and-drop behavior
needed by the board. Merely defining `draggable`, `DragEvent`, pointer events or
touch events is insufficient; the bootstrap must verify that the corresponding
event path can be installed and used.

If the test throws, times out, reports no working drag-and-drop path, or
JavaScript is disabled entirely, no upgrade occurs. The already rendered HTML4
page remains usable at the same URL. A `noscript` path therefore needs no
redirect, cookie, query parameter or User-Agent exception. This also gives
browsers without drag-and-drop explicit Move up, Move down, Move left, Move
right and destination-selection POST buttons rather than a board that can be
viewed but not rearranged.

The complete fallback is intentionally not duplicated inside `noscript`.
`noscript` is selected only when scripting is disabled; it does not help a
browser that recognizes scripts but cannot parse or execute Meteor's required
JavaScript. The semantic HTML4 page is therefore the document body itself. The
capability bootstrap replaces it with the HTML5/Meteor document only after every
test succeeds. A small `noscript` explanation may be present, but never contains
the sole copy of a page or operation.

The bootstrap must not load or parse the large Meteor bundles before the tests
pass. The upgrade state is an optimization only and never authentication or
authorization state. Every HTML4 form includes an internal representation field
so its next POST renders HTML4 directly, without a cookie and without putting
mode or credentials in the URL. The field is not accepted as authority to
access data.

## HTML contract

The normative widget and page rules are in
[Shared HTML4 and HTML5 component library](HTML4-Components.md). This document
defines representation selection, security and server architecture; the
component guide defines how the same semantic UI is rendered by Jade/HTML5 and
server HTML4.

- Emit the HTML 4.01 Transitional doctype and a declared character encoding.
  Transitional is intentional: IBrowse has no CSS support, so essential table
  colors, borders, spacing and alignment also need their HTML attribute fallback.
- Do not emit `script`, event-handler attributes, JavaScript URLs, cookies,
  local storage, SVG-only controls, or CSS-dependent hidden functionality.
- Escape every dynamic value according to its HTML context.
- Keep public navigation as ordinary links. Keep authenticated navigation and
  every mutation as POST forms whose `action` is the same clean WeKan URL.
- Every button has visible text. Tables have captions or adjacent headings,
  header cells and a plain-text empty state.
- Use one compact content table on every page, with no frames. The page follows
  the plain, dense Aminet-style HTML4 structure while retaining WeKan's product
  name, information hierarchy and translated labels. Safe server-resolved board,
  swimlane, list and card colors match their HTML5 counterparts; untrusted color
  strings can never enter a style attribute.
- Forms and visible page content live in that single table. Public navigation
  may use links, while authenticated navigation and operations use visible,
  signed POST buttons that work with keyboard-only and pointer-free browsers.
- The baseline is semantic and usable across disability groups: it has a skip
  link, one descriptive `h1`, a table caption, column and row headers with
  `scope`, associated form labels, grouped forms with legends, logical source
  and Tab order without positive `tabindex` overrides, visible high-contrast
  focus, text names for every action, and WCAG
  contrast-selected text on stored colors. Meaning is always present in text;
  color, position, sound, pointer precision and drag-and-drop are never the only
  way to understand or operate a control.
- Use only printable ASCII for control glyphs: `v`, `>`, `<`, `^`, `+`, `-`,
  `=` and `[x]`. Each glyph is paired with translated text. Font Awesome, SVG,
  Unicode symbols and CSS generated content are enhancements, never the HTML4
  control itself.
- Preserve the existing URL families, including `/sign-in`, `/sign-up`, `/`,
  `/allboards/...`, `/b/...`, card URLs, search, import, account preferences and
  Admin Panel URLs. An unsupported action must render an explanatory page, not
  fall through to a JavaScript-only shell.
- Read the same Settings document and translation catalogue as the HTML5 view.
  Product name, login logo visibility/link, text below the logo, legal notice,
  registration and forgot-password visibility, field labels, action labels and
  route headings must therefore agree in both representations. Language comes
  from the request's supported `Accept-Language` preference until an
  authenticated cookieless session carries the user's saved language.

### Image attachments

The compatibility representation never asks the old browser to decode the
original PNG, JPEG, WebP, AVIF, BMP or SVG attachment. When a Legacy HTML4 controller
reads an image, the server converts it to GIF on demand; the original attachment
is not changed. Conversion detects and decodes the bytes on the server, limits
input bytes and decoded pixels, applies orientation, scales oversized images
down, and emits a 256-colour GIF. Its cache key includes the attachment identity,
content checksum or version metadata, size and update time, so changed content
cannot reuse an earlier conversion. On the first signed preview request that reads the
image, the generated data is saved as the attachment's `legacyHtml4Gif` version in
the backend selected by Admin Panel / Attachments / Default Storage. Later Legacy HTML4
loads read that stored version rather than converting again. The normal storage
write permissions and free-space protections apply.

Public-board pages may use the authorized GIF response as an `img` source.
Cookieless private pages must not put a session secret in an image URL: an
explicit POST `Preview` control returns the GIF from the authenticated form
request in a separate browsing context, leaving the card and its natural Tab
position intact. Every attachment also retains a separately labelled
`Download` control for the original file. Both responses use distinct,
purpose-bound, single-use signatures, so previewing one attachment cannot be
replayed as an original download or invalidate an unrelated form. The server
binds the submitted attachment to its exact content card and board, repeats
board visibility and storage read/write limits, corrects the safe detected
download filename on read, and emits no session value in a URL. Refusals are
recorded in Admin Panel / Problems / Security with available actor and request
context. All conversion and authorization remains server-side.

Attachment mutations also cross one shared server boundary. Both the Jade view
and HTML4 forms resolve the exact attachment, its content card and board, then
apply direct or live-linked-card write permission. HTML4 additionally binds the
submitted route board and card to that content target, so hidden-field changes
cannot turn a visible attachment control into a cross-board write. Rename uses
the common content-aware, exploit-rejecting, 30-character portable filename
sanitizer. Cover assignment accepts images only and delete clears an exact
matching cover before removing the exact scoped attachment. HTML4 renders a
uniquely labelled rename field, an image-only cover toggle and two signed POSTs
for delete confirmation. Scope probes use the same indistinguishable refusal
and are attributed as `AttachmentBleed` in Admin Panel / Problems / Security.

The login logo follows the same rule. The configured custom login-logo URL is
downloaded only through the SSRF-safe pinned resolver; without one, WeKan's
built-in SVG logo is read from the generated client asset manifest. Its first
Legacy HTML4 request creates a GIF system-asset version in Admin Panel /
Attachments / Default Storage. Later requests reuse it. Changing the configured
source URL selects a different content-derived system asset. Unsafe logo-link
and legal-notice URL schemes are never emitted into HTML.

## Cookieless authentication and request integrity

Successful sign-in creates a short-lived opaque server-side session. The session
identifier is carried only in hidden POST fields, never in a URL, Referer,
redirect, log message or response header. Reloading a GET therefore returns the
same public URL logged out.

Each rendered authenticated form carries a form-specific, single-use token bound
to the session, HTTP method, normalized target path and operation. Binary response
forms additionally bind the representation and exact object identifier in a
purpose string and keep an atomic consumed-signature set because a file response
cannot carry the next rotated page token. Tokens use a
constant-time comparison, expire with the session and are consumed atomically.
Navigation POSTs also rotate the token. Sign-in uses WeKan's common password,
LDAP, two-factor, lockout and timing-normalization path; compatibility mode must
not implement a weaker password checker. Sign-up uses the same registration
setting, validation and rate limits as the normal application.

Authorization is checked again on every request with the same board roles and
global-admin rules used by Meteor methods and REST endpoints. Hidden fields are
untrusted input. POSTs use bounded URL-encoded or multipart bodies, reject
duplicate security fields, and apply the existing input, import and filename
sanitizers. Security refusals are reported through Admin Panel / Problems /
Security in the same cases as their modern equivalents.

## Server architecture

One early document handler renders the HTML4 baseline and capability bootstrap.
After successful tests, the bootstrap loads the normal Meteor representation;
User-Agent parsing is not part of this decision. Assets, DDP, SockJS, REST API
and file-download routes are never captured. A single page shell owns headers,
escaping, language, navigation and messages.
Shared form helpers own hidden session fields and signed action tokens.

The initial board controller deliberately renders only the upper-left part of
the Kanban canvas: the first active swimlane, its first active list, and that
list's ordered cards. Direct item URLs may reveal the addressed item. This keeps
the baseline bounded and readable on small, memory-constrained browsers; moving
between lanes and lists is explicit POST navigation rather than horizontal drag
and drop.

Route handlers translate the existing URL into a page controller. Controllers
call shared domain operations; they must not duplicate collection writes from
client events. Read controllers request only fields that page needs and enforce
the same tenant and authorization filters as publications. POST controllers use
the same tested service functions as Meteor methods and REST routes, then render
the resulting URL directly because a redirect would discard the cookieless
session.

All Boards rows expose their per-user Star and Home state as `[x]` or `[ ]`,
plus Restore for archived boards and a two-POST Archive confirmation for board
or global administrators. These controls and the Meteor methods call one shared
boundary. Star and Home require the board to remain visible to the authenticated
user, Home additionally accepts only a live ordinary board, and archive/restore
repeat board-admin or global-admin authorization. A submitted inaccessible board
identifier changes nothing and is attributed as `BoardBleed` in Admin Panel /
Problems / Security. Section and nested-workspace selection stay at the same URL
family after each operation, without cookies, script or identifiers in a query.

Card content writes resolve both the visible pointer and its real linked target.
Changing a linked card requires the delegated card permission; changing a linked
board requires administrator permission on that target board. Archive and restore
validate every descendant before the first recursive write, bound the traversal,
and reject cycles. These checks belong to the shared server operation because a
trusted server call must not rely on client collection allow rules.

List movement uses the shared labelled select component. Its options contain only
active lists from the card's board; the submitted IDs are nevertheless untrusted.
The server repeats card and destination-board write checks, requires the active
list and swimlane to belong to that board, excludes the moving card from sibling
order calculation, and computes its new fractional position authoritatively.

Card sort order uses one labelled numeric-text form in HTML4 and the existing
Jade controls in the card details and minicard popup. All three call the same
acknowledged operation. It requires the complete submitted value to be a finite
decimal or exponent-form number within the bounded sort range; partial parses,
`NaN`, infinities and excessive values are rejected. Before moving anything the
server repeats route-board and card authorization and verifies that the card's
current list and swimlane still belong to that board.

Received, Start, Due and End use four naturally ordered labelled text forms with
unambiguous ISO 8601 values; an empty value clears the date. Jade date pickers
and HTML4 forms submit to the same acknowledged operation. It allowlists those
four fields, rejects ambiguous or invalid dates, repeats route-card and linked-
target write authorization, and never accepts a caller-selected update path.

Card color uses a labelled text form so both named palette values and the
HTML5 color wheel's `#rrggbb` values remain representable in HTML4. `white` or
an empty value removes the color. Both renderers call one acknowledged server
operation that repeats card and linked-target authorization and accepts only a
canonical shared palette name or exactly six hexadecimal digits.

Every content-board label is a textual `[x]` or `[ ]` POST control. Jade and
HTML4 submit the desired state rather than a replay-sensitive toggle. The shared
service resolves a linked card's real content card and board, verifies that the
label belongs to that board, and repeats write authorization before adding or
removing it; a route-board or foreign-label substitution is refused and reported.

Members and Assignees use one textual desired-state control per eligible person,
with the full name or username available in natural tab order. Both Jade pickers
and HTML4 call one acknowledged service. It resolves linked-card content, checks
that additions are active members of the real content board, binds every ID to
the route and permits removal of stale assignments. The existing Worker policy
is preserved explicitly: a Worker may change only their own Assignee state on a
normal card, never Members or another user.

Requested By and Assigned By preserve both representations used by Jade: a
bounded free-text name and zero or more selected board members. HTML4 provides
labelled text forms and one desired-state person control per eligible member.
Shared services resolve linked content, enforce the content board's field toggle,
require an active member for additions, allow stale identities to be removed and
refuse Worker writes. Display and mutation both use the real content values.

Locations use the shared multi-field form component: one labelled field each
for name, address, latitude and longitude inside a fieldset with a meaningful
legend. Existing locations appear in document order with an HTTPS map link when
both coordinates exist; add, edit and remove remain usable in natural Tab order
without script. Jade and HTML4 call the same acknowledged server operations.
They bind the route card, resolve linked content, cap the location collection
and text lengths, require complete finite coordinate values in the latitude and
longitude ranges, and reject unknown location identifiers before one atomic
update. Legacy flat location fields are folded into the array only as part of a
successful write.

Stickers are text as well as decoration in HTML4: every existing entry exposes
its catalog name, icon and optional highlight style, followed by a labelled
native picker and signed remove controls. Both renderers submit desired state to
one acknowledged operation. The server resolves linked content, accepts new
entries only from the shared sticker catalog, caps the collection, derives the
human name rather than trusting it from the browser, validates removal indexes
against the current array and rewrites stable positions atomically.

Custom Fields expose the same board definitions and attached card values in
both representations. HTML4 renders field name, type and a plain-text value,
uses textual desired-state controls to attach or detach a field, and selects a
native labelled editor for text, integer number, checkbox, currency, ISO 8601
date, dropdown and multi-line string-template values. The shared server boundary
binds the route card and linked content board, requires the feature to be enabled,
requires the definition to belong to that board and the value field to be on the
card, then validates and bounds the value according to the stored definition.
Dropdown identifiers come only from its definition; number and currency parsing
must consume the complete finite value; string-template values have item and
aggregate limits. Formatting of string-template output is one isomorphic helper,
and every update replaces one bounded copy of the array atomically.

Card dependencies are links with text, not connector lines alone. HTML4 lists
the target title, translated relation, icon name and six-digit color, links to
the target card, and provides native add, edit and remove controls in source
order. Its multi-field forms use the shared fieldset component with native
selects, so type and icon choices do not depend on a popup or JavaScript. Jade
and HTML4 call the same acknowledged operation rather than directly rewriting a
client collection. The server binds the route card, resolves linked content,
requires the target to be an active card on the same content board, allowlists
relation and icon catalogs, accepts only a complete `#rrggbb` color, caps the
array, refuses stale removals and replaces one canonical bounded array atomically.

Voting preserves the same question, visibility, audience, deadline, counts and
current-user choice in both renderers. HTML4 creates a ballot with one labelled
fieldset, shows public voter names or private aggregate counts, and casts a
desired positive, negative or cleared state with textual `[x]`/`[ ]` controls.
The deadline editor and two-step delete remain usable without script. Jade and
HTML4 call a shared operation that binds the route and linked content, verifies
visibility for participants and write capability for configuration, bounds the
question, strictly parses ISO 8601 deadlines, rejects closed ballots and derives
the actor from the authenticated session before atomically canonicalizing votes.

Planning Poker preserves the same audience, optional deadline, ten estimates,
current-user choice, closed results, participant names, replay and final numeric
estimation in both renderers. HTML4 uses labelled native fields and textual
`[x]`/`[ ]` POST controls, reveals individual estimates only after the round is
closed, and keeps finish, replay, estimation and confirmed removal restricted to
board administrators. Jade and HTML4 call the same route-bound operation. It
strictly parses deadlines and estimations, allowlists every estimate, derives the
actor from the session, rejects closed rounds and moves one actor between estimate
arrays with a single atomic database modifier so concurrent participants do not
overwrite each other.

Card completion and spent time use the same desired-state controls in both
renderers. HTML4 presents due completion as a textual `[x]`/`[ ]` POST action and
spent time plus overtime as one labelled fieldset, with a separate clear action.
The shared acknowledged operation binds the route card and its linked card or
linked board target, observes the board's due-completion feature flag, requires
an actual Boolean state, accepts only a complete non-negative finite number, and
writes time plus overtime together. Clearing time also clears overtime, so an
interrupted or malicious request cannot leave a contradictory half-update.

Card Watch is an actor-bound desired-state action in both renderers. HTML4 shows
the current state with an ASCII `[x]`/`[ ]` button and a readable table row. The
signed form binds the real linked content card, while the shared service derives
the watcher from the authenticated session, observes the global feature switch,
accepts only the levels supported by each watchable type and repeats the same
public/member/active organisation, team or email-domain visibility check used by
publications. Anonymous and foreign-board requests cannot create watcher records.

Parent-card assignment uses the same acknowledged operation from Jade and HTML4.
HTML4 shows the current parent as a textual board/card link and provides a labelled
native selector whose None value returns the card to the top level. The server binds
the submitted route board and visible card, resolves linked-card content, refuses
linked-board placeholders, verifies that the selected parent is visible to the
authenticated user, and walks the persisted ancestor chain before the first write.
Self-parenting, descendant-parenting, pre-existing loops, missing ancestors and
unbounded trees are rejected; clearing uses an atomic field removal. Consequently a
forged option cannot disclose a private card or make every ancestor renderer loop.

Comment forms call one common server boundary from both renderers. Creation binds
the submitted card to its real board and assigned-only scope, checks the board
role's comment capability, bounds non-empty text, and validates a reply parent in
the same card. Editing and deletion bind all three object IDs and then apply the
shared author/administrator and `restrictCommentEditing` policy. Refused boundary
or ownership probes enter Security reporting with the available actor data.
HTML4 deletion uses two one-use signed POSTs so its confirmation is functional
without script, cookies or client storage. Reply likewise opens with one signed
button and submits through a separately signed, uniquely labelled textarea. The
rendered reply states its parent text in prose, so indentation or color is never
the only indication of the relationship.

Comment reactions also use one common server operation. The accepted numeric
character references live in a fixed shared catalog rather than client popup
code. The server derives the reacting user from the authenticated invocation,
checks comment, card, board, role and assigned-only scope, and canonicalizes the
bounded aggregate; all direct client writes to that aggregate are denied and
reported in Admin Panel / Problems / Security. HTML4 renders each reaction as a
signed toggle with `[x]` or `[ ]`, count and member names, plus a labelled select
for adding one. Its catalog has printable ASCII names such as `+1`, `done` and
`smile`, so an absent emoji font does not erase meaning.

Checklist forms share authenticated server operations with the Jade card view.
The visible route card and board are always submitted, while the server resolves
a linked card's content target and repeats delegated-write authorization. Every
checklist and item lookup binds its identifier to the resolved card, board and
parent checklist, so a forged cross-board or cross-parent identifier cannot move,
change or delete another object. Titles are trimmed, non-empty and bounded; sort
positions are calculated from bounded server queries rather than trusted client
values. Removing a checklist removes its bound items before the parent.

The HTML4 table writes checklist progress as `(finished/total)`, finished state as
`[x]`, and each visibility setting as `[x]` or `[ ]`. Labelled signed controls add,
rename, move up/down, toggle and confirm-delete checklists and their items without
drag-and-drop. The same-URL browser regression exercises valid changes, linked
content display, ordering, deletion without orphan items and a forged foreign
checklist refusal, then captures both representations. Copy and cross-card move
use a bounded native destination selector containing cards from every writable
board. The server authorizes both source and destination before the first write,
resolves linked-card content targets, recalculates destination order and updates
the denormalized card and board identities on the checklist, its items and its
activities. Copying whitelists checklist and item fields rather than cloning an
untrusted document.

Checklist import and export use the same part catalogue, document format and
scope as the Jade popup. HTML4 renders a labelled native fieldset with section
checkboxes and PDF, Excel, JSON, JSON-without-attachments and ZIP choices. A
download is returned directly by its signed, single-use POST; neither the
cookieless session nor a reusable login token enters a URL. The server binds the
submitted checklist to its exact card and board before any exporter runs.
Import accepts only one bounded multipart JSON or ZIP upload, streams it to a
private temporary file, applies the common transfer sanitizer and import feature
switch, and runs the shared scoped importer under a deadline. The destination
board must grant write access, and checklist, card and board identities are
bound together before the first write. HTML5 exposes distinct Export and Import
rows and uses the same checklist scope instead of silently falling back to a
whole-board transfer. Missing write permission and mismatched board, card or
checklist identities are recorded with the available account, address and
request context in Admin Panel / Problems / Security.

Item-to-card conversion uses the shared card-destination component: title first,
then one bounded board/swimlane/list/card insertion-point selector, relative
above/below selection and submit. This is both its semantic reading order and
native Tab order. Empty lists are explicit destinations, while an existing card
can be selected for exact relative placement. The server binds the source item
to its checklist, content card and board before authorizing the destination
board, active swimlane and active list. If a relative card is submitted it must
belong to that exact placement. Card defaults, sequence number, automatic custom
fields and creation activity come from the same server card-creation operation
as the ordinary HTML4 and HTML5 add-card controls. Conversion retains the source
checklist item, matching the existing Jade behavior.

Subtasks use the same parent-bound operations in both renderers. The HTML4 card
table lists each visible child as a link, including its board and list context,
and provides native create, title edit and ASCII up/down ordering controls. A
two-step archive control is rendered only for a board administrator. Every
operation resolves the real linked-content parent from the route, requires the
submitted child to belong to that parent and validates an active destination
board, swimlane and list before writing. The modern sortable control sends the
same previous/next boundary identifiers instead of writing a client-computed
sort value directly.

Card activity history is a read-only semantic table section for board
administrators, matching the Jade card's administrator-only Activities section.
Both renderers use one plain-text descriptor that selects the translation key
and ordered interpolation values; Jade retains its richer safe links while the
descriptor supplies its accessible name. HTML4 shows the actor, translated
description and ISO timestamp. It queries only the newest 50 events, obeys the
instance-wide activity-hiding setting and repeats visibility for a linked
content board before reading any history. Unknown or partly orphaned legacy
events degrade to escaped text rather than disappearing or becoming markup.

Global Search parses the same localized operator and predicate vocabulary in
HTML4 and HTML5. Both call one server search executor, including board, list,
swimlane, comment, label, person, organisation, team, number, date, status,
presence, text, sort and limit handling; selector execution guards and the
caller's current private-board scope are repeated immediately before each
database query. The HTML4 empty state shares the modern help-line catalogue and
shows the same board, list and label suggestions. My Cards/All Cards and native
Previous/Next POST controls retain the bounded query state. Result limits are
capped at 200, page offsets are bounded, and the total is counted without the
current cursor's skip/limit so later pages cannot disappear. Modern pagination
uses a new owned session document for each page, preventing a slow transport
from removing the old merged document before the new page is ready.

Broken Cards uses the same constructed query and guarded page executor in both
representations. The HTML4 table names the card, board, swimlane, list and type,
and says Unknown wherever the broken record has lost its context. Only cards on
boards still visible to the signed-in user can be returned. Card links and
bounded Previous/Next navigation are native signed POST controls.

Board Rules is delivered in vertical slices. The first slice shares the board-
scoped rule, trigger and action reader, localized stored-description formatter,
and exact rule mutation service between HTML5 and HTML4. A visible board member
may read titles and trigger/action descriptions. Only an active board admin or
site admin receives rename and two-step delete controls. Every mutation binds
the rule to the board named by the URL before writing, bounds the title, removes
the rule/trigger/action tuple together, and reports cross-board attempts through
the security canary. Native controls preserve natural title, details, rename,
delete-confirmation and back-to-board Tab order. Later slices add the creation
wizard and all import/export formats without weakening this baseline. The
workflow read slice presents each existing rule as When, then Action cells and
uses signed List/Workflow POST controls instead of making drag-and-drop a
condition for reading the graph. View, rename, confirmation and error states
preserve the chosen representation.

The Rules transfer slice starts with export. JSON and CSV use one portable
`wekan-rules-1.0.0` serializer shared with HTML5, include every rule field that
the current format already supports, remove database identity, timestamps,
prototype keys and secret-shaped fields, and neutralize spreadsheet formulas.
HTML4 exposes separate JSON and CSV download buttons. Each is a board- and
format-purpose-bound, single-use signed POST; immediately before sending bytes,
the server repeats authenticated board visibility and export-enabled checks.
No login or reusable session token enters the URL. JSON and CSV import is the
next slice: a labelled native form posts at most one
MiB and 1,000 rules. Parsing, format/version checks, prototype/secret/active-text
sanitization and trigger/action type allowlists all complete before the first
write. One board-admin-authorized server batch is shared by HTML4 and HTML5;
each rule's trigger, action and rule documents either all insert or its partial
documents are cleaned up. Submitted IDs, board IDs and timestamps are discarded.
Trello Butler text and n8n or Node-RED workflow JSON use the same form and
server batch. Workflow JSON crosses the structural boundary before graph edges
are traversed; auto-detection is shape-based, unknown edges are counted for the
result message, and recognized edges become the same portable rule tuples.

The full Rules builder is schema-driven rather than a free JSON editor. Its
first native POST selects one of the board, label/member/attachment, checklist,
scheduled or manual-button triggers. The next form asks only for that trigger's
fields and selects an action; the third asks only for that action's board/card
placement, date, label/member, color, checklist or email fields. The final
server operation rebuilds both
documents from the shared typed catalog, resolves usernames and labels against
the source board, repeats destination-board write authorization, and inserts
the trigger/action/rule tuple with cleanup on failure. Empty fields retain the
modern builder's wildcard meaning. Controls remain in label-before-control DOM
order; fields irrelevant to the selected kind are ignored by the builder.

Admin Panel parity begins with `/admin/problems/summary`. A Global Admin reaches
it through the cookieless signed navigation and receives the same aggregated
in-progress work, detected data problems and unacknowledged event-stream counts
as the Jade page. Each Problems pane is reachable with a signed POST; the
summary's repeated, labelled native checkboxes submit one allowlisted batch to
the acknowledgement service shared with DDP. Broken-card and missing-swimlane
repair buttons call the same admin-gated services as Jade and render their
result in the returned document. The admin check precedes every report query,
anonymous and ordinary accounts receive no report content, and rejected writes
enter the Security report. HTML4 and HTML5 screenshots at this exact URL compare
the translated status, problems and available operations. The remaining Admin
Panel panes still require their own controllers.

The event-backed Problems panes share one second controller: Security, Speed,
Tests, CPU usage, Database problems, Filesystem integrity and API. Its route map
is a fixed stream allowlist; DDP and HTML4 then call the same Global Admin-gated,
500-character-search and bounded page services. The table preserves the modern
columns, including stored or legacy-resolved username, IPv4, IPv6, trusted
country flag and city, repeat count and combined detail. Ten-row signed Previous
and Next forms retain search state. CPU adds the monitor's current percent, core
count and load averages; API keeps call-count ordering and its endpoint/window
columns. A same-URL test searches twelve attributed Security rows, traverses the
second page and compares both representations.

Offices uses its existing person-first server service rather than reconstructing
address history in the renderer. DDP and HTML4 share its Global Admin check,
escaped 500-character search, database count, 25-person page and one-million-row
skip ceiling. Each person's address rows stay adjacent and repeat a readable
full name and username for screen readers. IPv4, IPv6, trusted country flag and
city, that person's login count, and first/last timestamps remain separate
columns. The pre-person-tally address-side fallback remains available after an
upgrade. A paired test searches 26 people, proves two pages and compares the
same `/admin/problems/office` URL with and without JavaScript.

Impersonation Report likewise has one Global Admin-only page service shared by
the Meteor publication and HTML4 controller. It applies the same literal,
500-character search to recorded administrator, user, board, attachment and
reason fields; caps the database window; counts without materialising rows; and
sorts newest first. Its ten-row table retains the modern Date, Administrator,
Impersonated user, Board and Reason columns. Referenced accounts are resolved in
one bounded query, while a deleted account remains identifiable by its recorded
id. Native search and Previous/Next forms preserve state. Table cells explicitly
permit normal and long-word wrapping, so a username, initials fallback, object
id or reason cannot paint over adjacent report text. The same-URL browser test
compares both representations, exercises two pages and a deliberately long
username, and proves that an anonymous request receives no audit data.

Recovery Report has the same shared-service boundary. The server accepts only
All, Done, Failed or Deleted status, applies its escaped 500-character search,
caps limit and skip, and counts through the database before either renderer
draws a page. HTML4 preserves the modern textual guidance and all nine fields:
Done/deleted outcome, Date, Event, User ID, Username, IPv4, IPv6, trusted
Location and Detail. The visual success, failure and deletion icons have
explicit text equivalents, so their meaning does not depend on color or an icon
font. Search and status forms retain each other's values, and page forms retain
both. The same-URL browser fixture filters twelve failed events, checks two
pages, both address families and a trusted flag/city, captures both views and
proves that an anonymous request receives no recovery history.

Every authenticated page's identity/navigation row spans all columns after its
row heading. This keeps the table structurally consistent when a report has more
than two columns and prevents old auto-layout engines from assigning most of the
width to a phantom second column.

Boards Report uses an instance-wide Global Admin service shared by its Meteor
publication and HTML4 controller. It accepts only All, Public or Private,
escapes and caps title search at 500 characters, limits the page and skip, and
counts the identical selector in the database. The current ten boards retain
the modern Title, Id, Permission, Archived, Members, Organizations and Teams
columns. Only active members are named; referenced users, Organizations and
Teams are deduplicated and loaded in three bounded page-local queries, with ids
as the durable fallback for deleted references. Search and permission forms
retain each other's values and Previous/Next retains both. The same-URL test
proves Public excludes Private, Private has two pages across twelve fixtures,
relationship names appear in both renderers, and anonymous callers receive no
instance inventory.

Cards Report likewise uses one instance-wide Global Admin service from its
Meteor publication and HTML4 controller. Its escaped title search is capped at
500 characters, limit and skip are bounded, and the database counts the same
selector used for the page. Only Title, Board, Swimlane, List, Members and
Assignees are loaded. Referenced context and user names are deduplicated and
resolved in four page-local queries, with the stored id remaining visible after
a referenced document is deleted. HTML4 preserves all six modern columns,
complete text, a native search field and ten-row Previous/Next controls. The
same-URL fixture searches twelve cards, verifies two pages and every resolved
name in both renderers, captures both views and proves an anonymous request
cannot read the instance-wide card inventory.

## Delivery order

The compatibility layer is complete only when every client route has one of:

1. a read/write HTML4 controller with equivalent authorization;
2. a deliberately read-only controller where the normal route is read-only; or
3. an explanatory controller for a feature that cannot exist without a browser
   capability, with a server-side alternative where possible.

Implementation proceeds through classifier and security primitives, accounts,
boards/lists/cards, remaining user features, Admin Panel, import/export and
external integrations. A route inventory test compares `config/router.js` with
the HTML4 controller registry so a newly added WeKan URL cannot silently return
the Meteor shell to an affected browser.

## Tests

Positive tests cover the capability probe, HTML4 markup, same-path forms,
sign-in, navigation and representative button-based moves. Negative tests prove
a failed or missing drag-and-drop capability and JavaScript disabled in current
Firefox, Chromium and WebKit all retain HTML4; passing browsers upgrade to
Meteor; API/DDP/assets are not intercepted; GET cannot mutate; tokens cannot be
replayed or moved to another route; sessions never enter URLs; unauthorized data
is absent; and escaped content cannot create markup. Browser tests also disable
cookies and follow the route inventory. Security tests cover login throttling,
CSRF, fixation, replay, body limits, open redirects and cross-board
authorization.
The card-detail browser regression additionally forges an unknown active-markup
reaction, a submitted foreign user ID, a cross-board comment ID and a foreign
checklist parent; each is refused. Valid reaction and checklist changes are
visible in paired same-URL HTML4 and HTML5 screenshots. It also exercises valid
attachment rename, image cover selection and confirmed deletion, then forges a
route/attachment scope mismatch and verifies both non-mutation and the attributed
Security report.
It creates, renames and reorders subtasks through JavaScript-disabled HTML4,
checks their database order and modern HTML5 rendering at the same card URL,
then exercises the administrator-only two-step archive path. Paired screenshots
compare the semantic HTML4 table and the Jade subtask list.
The same regression seeds a card activity, verifies its translated text in
HTML4 and its shared accessible name in Jade, captures the two views, then
removes board administration and proves the HTML4 history is no longer emitted.
The All Boards path toggles Star and Home in both directions, restores and
confirm-archives a board, creates a public board with its default swimlane and
duplicates it only after confirmation. Creation and duplication share the same
server operations as Jade: Private-only is repeated server-side, copy properties
are allowlisted, and the source requires board-admin access. The browser test
forges an inaccessible copy source to verify both non-mutation and the attributed
Security event. Paired same-URL screenshots compare the created and copied board
titles, colors and available actions in HTML4 and HTML5.
The same test assigns and removes a board with the labelled Workspace selector,
then repeats the shared Meteor operations and captures both renderers at the
same nested Workspace URL. The server accepts only a visible, live ordinary
board and an identifier present in that authenticated user's Workspace tree;
unknown destinations are refused and reported rather than stored as orphaned
profile data.
Archive exposes physical deletion only when all three server-checked conditions
are true: the actor is Global Admin, the board is archived and Admin Panel /
Problems / Delete has enabled permanent deletion. Its first one-use POST only
renders the warning; the second calls the same bounded, validate-all-first
service as Jade bulk deletion. Every success or refusal retains the existing
actor, address, board ID and title reporting in Admin Panel / Problems /
Recovery. Browser coverage proves the disabled state has no control, the
confirmation does not write, deletion removes the board and its children, and
the attributed successful Recovery record exists; paired Archive screenshots
show the HTML4 confirmation and HTML5 multi-selection action.
