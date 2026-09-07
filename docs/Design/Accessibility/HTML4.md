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

PDF and office-document attachments use the same server conversion pipeline as
the modern document viewer. A signed `Preview` POST resolves the exact
board/card/attachment tuple again, applies attachment size and storage policy,
and creates the cached plain-text, safe table and GIF-page representation in
Default Storage on first use. HTML4 renders one page inside the card's semantic
table, with selectable plain text (or the allowlisted Excel table), GIF images
and translated Previous/Next POST controls. It never embeds PDF, OOXML or active
document markup. Page numbers and aggregate response bytes are bounded; a
forged scope is refused and Security-reported. The separately stored unformatted
text remains the common attachment-search source for both representations.

Plain-text and JSON attachments have a distinct signed Preview operation. It
repeats the exact content scope and storage-read policy, accepts only the shared
text/JSON classification and buffers at most 2 MiB. The shared document-page
component renders the result in escaped selectable text, so attachment content
that resembles markup remains visible text. The original download stays a
separate purpose. A same-URL regression compares both viewers and proves a
foreign board substitution is refused and Security-reported.

Audio and video use another purpose-bound POST control. HTML4 does not require
a scripted media widget: the authorized response is `inline` with its validated
audio/video MIME type, allowing either the browser's native player or an
operating-system helper to handle it. Non-media types are rejected with 415;
original downloads remain forced attachments. The response repeats the same
scope, storage and configured-size checks as every other attachment read.

Filesystem reads resolve a relative `WRITABLE_PATH` against the launch directory
recorded by the process environment, not Meteor's generated runtime directory.
This keeps the containment boundary on the actual configured `files/` tree in
development as well as on absolute Docker and Snap paths.

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

Forgot Password is also a dedicated public baseline at `/forgot-password`. Its
labelled email form posts to a bounded server endpoint which invokes Meteor's own
password-recovery method. Existing, missing, malformed and mail-transport-failed
addresses receive the same rendered result so account existence is not exposed.
Because this HTTP path does not traverse the DDP dispatcher, it has its own equivalent
five-requests-per-minute trusted-address throttle; blocked attempts are recorded in
Problems / Security. A same-URL browser test submits a nonexistent address, verifies
the uniform result and captures both HTML4 and HTML5 views without sending mail.

The rest of the public mail-token lifecycle is also available at its normal URLs.
`/reset-password/:token` and `/enroll-account/:token` expose two naturally ordered,
labelled password fields; `/verify-email/:token` exposes an explicit verification
POST; and `/send-again` exposes a labelled email form with the same non-enumerating
result for absent, malformed, already verified and mail-transport-failed addresses.
Password and verification tokens are bounded, expiration-checked where Meteor's
account token has a lifetime, tied back to the recorded account address and claimed
with a token-valued atomic update before password hashing or verification. Successful
consumption removes the token, so concurrent requests and replay cannot apply a
second change. Reset/enrollment and verification HTTP routes have independent
trusted-address throttles; valid tokens clear their retry counter, while refusals are
attributed in Problems / Security. A two-factor-enabled account returns to Sign In
instead of creating a session, matching the modern account-token boundary.

Same-URL browser coverage creates real reset, enrollment and verification records,
submits them with JavaScript and cookies disabled, verifies their persisted single-use
effects, rejects a replay and captures HTML4/HTML5 screenshot pairs for all four
public account-token routes.

The signed-in Member Menu is being converted from popup-only controls to stable
same-URL pages. `/account/profile` is the first complete page and reuses one guarded
profile service from its Jade form and HTML4 form. It presents Full Name, Username,
Initials and Email in their natural order. Admin Panel's username/email self-change
switches decide whether those identity fields are editable; omitted controls are still
rechecked at the write boundary, so changing a hidden field cannot bypass policy.
Identity uniqueness is case-insensitive, a changed email becomes unverified, OAuth2
identity changes are refused, and bypass attempts retain request identity/location in
Problems / Security. The operation updates all accepted profile fields together rather
than allowing four client calls to leave a partly updated identity. A same-URL browser
test verifies the HTML4 write in MongoDB, the Jade view of the same values, the paired
screenshots and a Security-reported forged disabled-field write.

`/account/language` is the second complete Member Menu page. Both representations use
the same lazily loaded language metadata, including native names and RTL markers, and
the same exact supported-tag write service. HTML4 renders the full catalogue as one
labelled native select, persists the choice through a signed POST and immediately
rerenders in the chosen language. The cookieless session's saved profile language takes
precedence over `Accept-Language` on later pages. The direct Jade route also synchronizes
from the saved profile rather than reverting to the browser default. Unknown tags are
rejected and recorded with available actor/address/location details in Problems /
Security. Live coverage selects Finnish without JavaScript, verifies the database and
Finnish HTML4 response, verifies the selected Jade row, captures both views and submits
an injected unsupported option as its negative case.

`/account/password` is the third complete Member Menu page. Its Jade and HTML4
forms use the same three naturally ordered labelled controls: current password,
new password and repeated new password. One shared service bounds the secrets,
requires the repeated value to match, verifies the existing bcrypt password and
only then replaces it through Meteor Accounts while revoking reusable Meteor login
tokens. The HTML4 session remains an independent short-lived, address/user-agent-bound
session and receives freshly rotated action signatures with the response. OAuth2
accounts cannot create a local-password path through this endpoint. Current-password
checks have a five-failure-per-minute account-and-address throttle; reaching the limit
is attributed in Problems / Security without logging any password. A same-URL live
test captures both views, verifies that a wrong current password preserves the old
secret, changes it with the correct current password, then proves the old login fails
and the new login succeeds without JavaScript or cookies.

`/account/settings` is the fourth complete Member Menu page. Both representations
retain Show desktop drag handles, Submit editors with Enter, Open many cards at once,
the card-count threshold, start day of week and unsaved-description rescue. HTML4
groups them into one labelled fieldset and explicit Save POST; Jade's immediate
toggles and Save controls delegate their individual desired values to the same shared
service. That service accepts only the fixed field set, exact Booleans, a card threshold
from `-1` through `100000` and a weekday from `0` through `6`. Worker-hidden fields are
also forbidden at the service boundary. Thus removing, adding or changing submitted
controls cannot create an arbitrary profile write. Refused unknown, out-of-range or
worker-only values are attributed in Problems / Security. Live same-URL coverage saves
all six HTML4 values, verifies them in MongoDB and Jade, captures both views, and proves
an injected out-of-range threshold is reported without changing the persisted value.

`/account/color` and `/account/font` are the fifth and sixth complete Member Menu
pages. The color page exposes the same default override, complete shared board-theme
catalogue, flat/clear custom colors and All Boards tile preference as Jade. Because an
HTML4 form cannot reveal fields in response to a select change, both custom-color text
fields remain present with an accessible explanation: flat themes consume one, clear
themes consume two and fixed dark/special themes consume none. The server derives the
applicable count from the selected catalogued theme; each consumed value must be an
exact six-digit hex color.

The font page exposes the shared curated font catalogue, every named size preset and
the optional six-digit text color. HTML5 narrows the same catalogue to fonts detected
in that browser; HTML4 lists the safe catalogue because old browsers have no dependable
font-detection API and unavailable fonts fall back normally. Blank selections restore
the defaults. Both Jade's immediate controls and the two signed HTML4 Save forms use
one account-bound service. It accepts only fixed object keys and shared catalog values,
removes the retired text-background setting, and attributes unknown theme names, CSS
font payloads, malformed colors and other refusals in Problems / Security. Same-URL
live tests persist both HTML4 forms, verify their values in MongoDB and the direct Jade
routes, capture screenshot pairs, then prove injected select values cannot change the
profile and do create attributed Security reports.

`/account/avatar` is the seventh complete Member Menu page. It uses the same stable URL
for the Jade popup and HTML4 table and exposes the same current uploaded avatars,
initials fallback, upload, selection and confirmed deletion. The common self-service
boundary never accepts a target user: every lookup includes both the submitted avatar
ID and the authenticated user's ID. A foreign, missing or malformed ID therefore cannot
select or delete another account's image and is attributed in Problems / Security.
Deleting the selected file also clears its profile pointer after successful removal,
so neither representation can leave a broken selected image.

HTML4 multipart uploads use the shared bounded private temporary-file receiver, repeat
the Admin Panel avatar-upload block and configured byte limit, decode the content and
store a server-generated `avatar.gif` in Default Storage. Existing stored GIF avatars
are read only after the owner check and embedded in the cookieless HTML4 response as
bounded `data:image/gif` thumbnails. This avoids making private avatars public and does
not put a session credential in an image URL. Jade retains its chunked Meteor-Files
upload but shares the strict ID-based selection and deletion services. Its selected-row
state is initialized from an explicit authenticated state read, so a direct route does
not race Meteor's profile publication. Live coverage uploads a real PNG without
JavaScript or cookies, verifies GIF metadata and the durable profile pointer, captures
both views, rejects a forged foreign ID, confirms deletion and verifies both the stored
file and selected pointer are gone.

`/account/invite` and `/account/logout` complete the Member Menu conversion. The
invitation page keeps the same email list and board choices in Jade and in one
labelled HTML4 fieldset. Its shared server boundary normalizes and deduplicates at
most 100 addresses, bounds the board list, and accepts only non-archived boards on
which the actor is both active and an administrator. This check is repeated after
submission: inserting a hidden private, archived or unknown board ID cannot add it
to an invitation code. Refusals are attributed in Problems / Security with the
available username, address and location context.

The logout page provides an explicit submit control at the same URL in both views.
HTML4 consumes its one-use signed action, deletes exactly that account-bound
cookieless session and returns POST/303 to Sign In. It does not render another set
of authenticated action tokens after deletion, and replaying an older signed form
cannot restore the session. Live same-URL coverage compares both invitation and
logout pages, proves a forged foreign board creates no invitation code and does
create a Security report, and verifies logout removes the server session before the
login form is shown.

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

The full card destination dialog has the same semantic contract in Jade and
Legacy HTML4. A user can move or copy a card to any active swimlane and list on a
writable board, place it at the top or bottom, or place it immediately above or
below a selected card. The HTML4 form uses labelled native selects and keeps the
card title editable, while its quick ASCII controls move the current card directly
to the top or bottom of its list without drag-and-drop.

All of those controls call one acknowledged server boundary. It binds the source
card to its submitted route board, independently authorizes the destination board,
list and swimlane, bounds the sibling query, and derives sort from the persisted
destination order. An above/below reference must be an active card in that exact
destination; a forged board, placement or relative card trips `BoardBleed` for
Admin Panel / Problems / Security before any write. Copy additionally requires
membership on the source board, accepts only a bounded non-control title, and
then uses the existing complete card copy implementation for attachments,
checklists, subtasks, labels, custom fields and dependencies. The HTML5 popups and
top/bottom menu commands use these same operations rather than direct client
collection writes.

Copy Template to Many Cards is the batch form of that same destination
component. Both renderers submit its JSON text to one server operation; neither
parses or loops over caller-controlled entries in the browser. The common parser
accepts a non-empty array of at most 200 objects and only the `title` and optional
`description` string fields, caps the UTF-8 document at 256 KiB, applies the
ordinary title/description limits and rejects control characters and unknown
fields. Each copy then passes through the same source, assigned-only and
destination authorization as a single copy. Top and below insertion reverse only
the execution order so the resulting visual order still matches the JSON array;
the returned identifiers remain in source order. HTML4 presents the example in a
labelled native textarea before the existing destination and position selects.

Permanent card deletion is a two-submit confirmation in HTML4 and the existing
confirmation popup in Jade. Both call one acknowledged server operation instead
of a direct client collection removal. The operation binds card and board, requires
board administration, and refuses deletion while any live linked card points to
the card; only then does the existing complete card remover delete descendants,
attachments and related rows and emit the deletion activity. A forged card/board
pair trips the authorization canary. Every successful, linked-card-refused or
unauthorized attempt also appends an attributed `card-permanently-deleted` event
to Admin Panel / Problems / Recovery, including success state, deleted-data state,
username, IPv4/IPv6 and available location through the common Recovery audit
helper. HTML4 never relies on JavaScript confirmation state or cookies.

Card sort order uses one labelled numeric-text form in HTML4 and the existing
Jade controls in the card details and minicard popup. All three call the same
acknowledged operation. It requires the complete submitted value to be a finite
decimal or exponent-form number within the bounded sort range; partial parses,
`NaN`, infinities and excessive values are rejected. Before moving anything the
server repeats route-board and card authorization and verifies that the card's
current list and swimlane still belong to that board.

Card Number is distinct from mutable sort order. When the route board enables
Card Number, the HTML4 heading and read-only Title row prepend the real content
card's `#number`, matching Jade's opened-card title. The number is queried only
for the authorized route card (or its already-authorized linked content card),
is never accepted from a form and remains absent when the board setting is off.

When Cover on Card is enabled and the real content card has an image cover,
HTML4 moves that attachment to the first attachment row and labels it Cover
Image. Its purpose-bound Preview opens the server-stored GIF representation;
the original remains a separate Download. This is the semantic small-browser
equivalent of Jade's visual cover at the top of the card and does not introduce
a credential-bearing image URL. Read-only users see the cover designation too.

Every Card Settings `allows*` switch is a renderer contract, not merely a Jade
CSS choice. HTML4 derives one explicit visibility map from the route board and
uses it for both editable controls and read-only rows: Labels, Members,
Assignee, Creator, Requested By, Assigned By, List, Sort, each date, Date Format,
Description text, Checklists, Subtasks, Attachments and Comments. A disabled
section emits neither its stored content nor a mutation form, while unrelated
sections remain available in natural Tab order. The same-URL regression tests
an all-enabled card and a card whose switches are all disabled in both renderers.

A linked-card route has two separate objects: its visible placement/snapshot and
its source content. HTML4 first reads only the source card's board identity, then
uses the shared board-visibility decision before fetching any source content.
When visible, Title, Card Number, Description, Color, people, dates and other
content fields come from that real card just as Jade's `getRealCard()` helpers do.
When the source board is private, HTML4 retains only the linked-card snapshot;
the source title, description, dates, labels, attachments and child collections
must not enter the response. This is a read boundary, not only display cleanup.

Received, Start, Due and End use four naturally ordered labelled text forms with
unambiguous ISO 8601 values; an empty value clears the date. Jade date pickers
and HTML4 forms submit to the same acknowledged operation. It allowlists those
four fields, rejects ambiguous or invalid dates, repeats route-card and linked-
target write authorization, and never accepts a caller-selected update path.

The Date Format control is a member preference shared by every card rather than
card content. HTML4 presents the same three translated choices as Jade before
the date fields. Both renderers call one account-bound service that accepts only
`YYYY-MM-DD`, `DD-MM-YYYY` or `MM-DD-YYYY`; a forged value leaves the preference
unchanged and is attributed in Admin Panel / Problems / Security.

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

Card-level Import and Export use the same shared transfer document, part catalog
and scoped importer/exporters as the Jade card menu. HTML4 exposes labelled PDF,
Excel, JSON, JSON-without-attachments and ZIP choices plus a bounded JSON/ZIP
upload. Export binds the requested card to the visible board and assigned-only
scope; import additionally requires write access and creates a new card below
the route card rather than editing existing content. The common transfer
sanitizer, attachment storage policy and import deadline apply unchanged.

An export response cannot carry a freshly rotated page of cookieless form
tokens. Therefore card export uses a purpose-bound, one-use download signature
whose purpose includes the exact card identifier. Replaying that download is
refused, while downloading does not consume the page action counter or invalidate
the Import and other controls already rendered beside it. A forged card or board
scope is rejected before reading or writing content and is attributed in Admin
Panel / Problems / Security.

Card History is one shared presentation and one pair of shared Meteor operations
in both renderers. The HTML4 card route opens a semantic nested history table with
column headers, native row checkboxes, a labelled search field, contributor
selector and signed Previous/Next and Restore POST controls. The table uses the
same `changeHistory.page` scope, 25-row paging, content summarizer and translated
change/group labels as the Jade popup. This is distinct from the read-only recent
Activities section: History is searchable, contributor-filtered and can restore a
selected stored state.

Restore keeps the existing history-integrity verification and append-only
provenance behavior. Before invoking it, the HTML4 boundary resolves the card from
the board and card identifiers in the current URL, resolves the real content card
for an editable linked card, caps a submission at 200 unique row identifiers and
requires every selected row to belong to that exact card. Changing a hidden card
or row identifier therefore cannot restore another card even when the same person
can edit both boards. Such a cross-scope attempt is refused and enters Admin Panel
/ Problems / Security as `PositionHistoryBleed`, with the available account,
address and location context. Stored content is always escaped by the HTML4
renderer; it never becomes markup.

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

Whole-board JSON, CSV, Jira and Kanboard imports retain the Jade member-mapping
step in the cookieless baseline. Parsing and the common transfer sanitizer run
before a short-lived import draft is written into the authenticated HTML4
session; the browser receives only its random identifier and the bounded public
member labels. Each source member has a labelled native username field in source
order, followed by Map and Import without mapping controls. This is also the
semantic reading and Tab order. Exact username matches are selected initially,
while an explicit empty choice preserves the existing virtual-member behavior.

The final signed POST binds the draft identifier to the same session, account,
address and user agent. The server accepts mapping keys only from the staged
source-member set, resolves every submitted target to a currently existing
account, and atomically removes the draft before invoking an importer, so a
replayed form cannot create a second board. Cancellation, replacement, expiry
and successful use remove the draft. Raw import text and mappings are never
placed in a URL or returned as hidden fields. Excel and multi-board ZIP imports
continue to use the Jade view's direct import-without-mapping behavior; WeKan
ZIP attachments remain streamed into Default Storage rather than copied into a
session document.

Trello file imports also share the modern optional personal-workspace
destination. In HTML4 the workspace name is a labelled, 100-character text
field saved before the file is chosen, so a navigation cannot silently discard
the selected upload. The normalized name travels inside the signed POST and,
when member mapping is needed, inside the server-only single-use draft. Only
after a successful JSON or ZIP import does the authenticated server operation
find or create that exact workspace and assign every resulting board to it.
Control characters, oversized names, fields injected into another import source
and multipart fields outside the explicit allowlist are rejected. The browser
never supplies a workspace id and cannot assign another user's board.

Direct Trello API import has the same server-owned credential and persisted-job
model in both representations. HTML4 renders labelled key and password-token
fields, but never puts either secret back in a value, URL, hidden control or job
document. Because a cookieless page cannot safely carry a secret across the
workspace-listing POST, the user explicitly saves the credentials first; the
page then lists the server-fetched Trello workspaces and boards as native checked
choices and the user's existing local workspace tree as a labelled parent
selector. The shared methods validate unique 24-hex-character Trello board IDs,
at most 100 boards, a parent node from that exact user's tree and bounded
control-character-free credentials before a job is created.

The newest job for that user is rendered as text: translated state, current and
total counts, bounded results, attachment counts, last error and error log.
Resume, Cancel and Clear are signed POST controls. Deleting already imported
boards is a separate request followed by an unchecked confirmation control;
the common job method repeats ownership before deletion. A restarted server
continues to reclaim the same persisted job as it does for Jade. Another user's
job ID, a forged board/workspace ID, an unknown operation and a bypassed
confirmation are refused and written with available request identity to Admin
Panel / Problems / Security. Ordinary Trello network and rate-limit errors stay
job errors rather than being misreported as attacks.

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

Admin Panel Broken Cards Report shares its broken-card definition and bounded
Global Admin service between the Meteor publication and HTML4 controller. The
definition covers a missing board, swimlane or list and an unsupported card
type; a title search is escaped and capped at 500 characters. The page projects
only Card Title, Id, Board, Swimlane, List, Type and Created at, sorts on the
existing board/creation index, and resolves the three contexts in deduplicated
page-local queries. A missing context is explicit Unknown text in HTML4 instead
of a blank cell. Native search and ten-row Previous/Next controls retain state.
The same-URL fixture searches twelve broken cards, verifies two pages, present
and missing contexts in both renderers, captures both views and proves an
anonymous request receives no instance repair inventory.

Files Report uses one bounded Global Admin metadata service in its Meteor
publication and HTML4 controller. The service reads the plain attachments
collection so legacy CFS compatibility lookup cannot block the report, escapes
and caps filename search at 500 characters, sorts on the indexed filename, and
counts the identical selector in the database. HTML4 retains Preview, Filename,
Size, MIME Type, Attachment ID, Board ID and Card ID. Its shared attachment
component exposes an image's server-stored GIF representation and every
original through separate purpose-bound POST controls, without placing a
cookieless session secret in an image URL. Search and ten-row paging retain
state.

Permanent delete is absent unless the Global Admin setting is enabled. When it
is enabled, the Files Report uses the same two-step confirmation and deletion
service in HTML4 and HTML5. The service repeats the Global Admin and setting
checks, and Recovery records every successful or refused attempt with the
available user, network/location metadata, attachment id, sanitized filename
and card id. The same-URL fixture verifies twelve files, an image preview
control, original controls, the disabled and enabled delete states, actual
deletion and its Recovery record, two-page parity, screenshots and anonymous
isolation.

Rules Report uses one bounded Global Admin service in its Meteor publication
and HTML4 controller. A literal title search is escaped and capped at 500
characters; the report sorts on the indexed board id, counts in the database
and reads ten rows at a time. Rule Title, Board Title, actionType and
activityType match the modern table. Board, Action and Trigger documents are
resolved with three deduplicated page-local queries, and a missing relation
retains its id or explicit Unknown text instead of producing a blank cell.
Signed search and Previous/Next controls retain their state without JavaScript
or cookies. The same-URL fixture searches twelve rules, verifies two pages and
all resolved contexts in both renderers, captures both views and proves an
anonymous request cannot read the instance-wide rule inventory.

Problems / Performance has a dedicated Global Admin-only HTML4 controller for
the same translated Card loading guidance as its Jade pane. The semantic Name
and Description table retains the complete operator explanation, including the
automatic large-board behavior and optional `CARDS_LOADING` environment
override. Signed Problems navigation reaches it without JavaScript or cookies.
The same-URL fixture compares the Finnish content in both renderers, captures
both views and proves an anonymous request receives neither the pane data nor
its deployment detail.

Problems / Security exposes all eight Jade security toggles in a dedicated
semantic HTML4 table: plain-text links, always-visible source, global import and
export disabling, avatar import/export disabling and imported/exported user
anonymization. Each row uses the shared labelled select form with explicit
Kyllä/Ei state and a signed Save POST. Both renderers call one server operation
whose fixed field allowlist, strict Boolean input and repeated Global Admin
check precede the Settings write. An unauthorized write or an attempt to name a
different Settings field is refused and recorded as SettingsBleed in Problems /
Security with available identity, address and location. The same-URL fixture
changes a setting in HTML4, observes it in HTML5, restores it through Jade,
captures both views and proves anonymous isolation.

Problems / Notifications exposes the same Disable activities, Disable
notifications and Disable watch switches and translated explanations as Jade.
Each is a labelled Kyllä/Ei select with a signed Save POST. The generalized
feature-setting service keeps Security and Notifications in separate fixed
allowlists, validates pane, field and Boolean value, reloads the Global Admin,
and reports unauthorized or cross-pane writes as SettingsBleed with available
identity, address and location. Jade and HTML4 call the same Meteor/server
operation. The same-URL fixture changes Disable notifications in HTML4,
observes and restores it in HTML5, captures both views and proves anonymous
isolation.

Problems / Delete exposes the same permanent-delete switch and complete Recovery
warning as Jade. The warning is one shared component string used by Delete,
Recovery, Files Report and both renderers. HTML4 uses a labelled Kyllä/Ei select
and signed Save POST. One extracted server service now backs the Jade method and
HTML4 handler; it strictly validates the Boolean, reloads the Global Admin,
updates only `enablePermanentDelete`, and writes the existing successful or
failed Recovery audit with username, trusted address and location. The same-URL
fixture disables the setting in HTML4, verifies the Recovery row, observes and
restores it in HTML5, captures both views and proves anonymous isolation.

The Admin Panel Problems registry is also an executable completeness boundary.
A source audit derives all 20 pane slugs from the shared menu definition and
requires each one to resolve to a dedicated HTML4 controller, including every
stream in the fixed event-report map; a newly added pane cannot silently fall
back to the generic baseline. Same-URL browser coverage now captures both HTML4
and HTML5 for every Problems pane. In particular, Speed, Tests, CPU usage, API,
Database problems and Filesystem integrity each have their own seeded report
fixture and screenshot pair instead of relying on Security Report as a
representative of their shared controller.

Admin Panel / Settings / Version is the first dedicated Settings controller.
It renders the same single semantic table as Jade, retaining the Platform, OS,
Meteor, Database and Node category order and every conditionally available
field. Both views call one Global Admin-gated statistics service, so package,
runtime, reactivity, database and memory facts cannot diverge between delivery
modes. The Check Version POST calls the same ten-second, fixed-origin,
strict-manifest service as the Meteor method and renders only its validated plain
text or the translated fixed failure message. Global navigation names Settings
and Problems separately, and signed Settings navigation reaches all seven pane
URLs. A same-URL browser test compares populated Finnish HTML4 and HTML5 tables,
executes the cookieless check, captures both views and proves anonymous
requests receive no system details.

Admin Panel / Settings / Announcement uses a second shared Global Admin service.
It reads only the active state and body, and accepts only an exact Boolean
`enabled` or a trimmed, 10,000-character-bounded `body`; attempts to write any
other field or write without the role are refused and recorded as SettingsBleed
with available request identity. The modern toggle and Save button no longer
write the collection directly. HTML4 presents the same translated active state
as a labelled Yes/No select and the same body as a labelled textarea, each with
a signed native POST. Its same-URL test writes both values without JavaScript,
observes them through Jade, captures both views, restores the prior global state
and proves anonymous requests cannot read the announcement settings.

Admin Panel / Settings / Accessibility shares its complete three-field service
with Jade. The service reloads the Global Admin, strictly types the enabled
state, trims title and body, and caps them at 500 and 10,000 characters. Both
Accessibility and Announcement now deny all direct client collection updates,
so a DDP caller cannot bypass those field boundaries; refused service writes
are recorded as SettingsBleed with available request context. HTML4 uses a
labelled Yes/No form plus one shared textarea-group component whose `fieldset`
submits title and body atomically, matching Jade's Save operation. The same-URL
test writes all fields without JavaScript, reads the result through Jade and the
public `/accessibility` HTML4 controller, captures both admin views, restores
the prior global state and proves anonymous settings isolation.

Admin Panel / Settings / PWA shares all seven custom-head, manifest and
assetlinks fields between HTML4 and Jade. Three labelled Boolean POSTs and two
atomic textarea groups call one Global Admin service; direct DDP updates of
these Settings fields are denied and forged field names are SettingsBleed
events. The server accepts only parsed `meta` or `link` elements with fixed
attribute allowlists and HTTP(S) link targets. Manifest input must be one JSON
object and assetlinks one JSON array, both bounded and canonically formatted;
trailing data and attempted recovery of malformed JSON are rejected. The same
validator runs again for existing stored values at both HTML boilerplate sinks
and both JSON routes, which carry `nosniff` and fall back to bundled defaults
when old content is invalid. This also fixes the previously stored-but-unused
custom meta field and brings custom head tags to the separately rendered HTML4
document. The live same-URL test writes and reads every field, checks both head
documents and JSON assets, captures both panes, restores global state and proves
anonymous isolation.

Admin Panel / Settings / Global Webhooks now has complete create, edit, disable
and delete-equivalent behavior in one semantic HTML4 table. Each existing hook
and the create row use the shared labelled fieldset component in natural title,
URL, token, type and active-state tab order. An empty URL removes an existing
hook, matching the Jade form; a blank token on edit preserves the stored secret.
Both delivery modes call one Global Admin service which bounds every string,
allowlists the two webhook types and performs the authoritative DNS-aware SSRF
validation before storing the URL. Direct DDP writes to instance-wide hooks are
denied, tokens are excluded from both readers, and refused authorization, type
or network-target attempts are recorded in Problems / Security with available
request context. The live same-URL test creates a two-way webhook without
JavaScript, reads it in Jade, proves the token is absent in both documents,
rejects a loopback target, captures both panes and proves anonymous isolation.

Admin Panel / Settings / Visibility exposes all five modern groups in HTML4:
All Boards, URL and Support, Product name, Change color and Logo. Labelled
fieldset forms retain the Jade order and atomic per-group Save behavior. Both
views use one fixed-field Global Admin service for instance values, including
the separate private-only collection; it bounds text, restricts spinner names,
accepts only HTTP(S) or root-relative links and strictly parses logo height.
Direct DDP writes to every covered field are denied and Security-reported. The
theme reader/writer was extracted from the Meteor method so both views retain
the same host-derived tenant target, shared theme catalog and hex validation.
HTML4 image controls use the shared file and image components. Multipart image
bytes stay in a private temporary file, repeat authorization, pass the same
size/pixel decoder, convert server-side to GIF and enter the selected Default
Storage through the same branding operation as Jade. A live same-URL test writes
all groups and uploads a logo without JavaScript, verifies their complete Jade
state and screenshot, refuses a JavaScript URL, restores global state and proves
anonymous settings isolation.

Admin Panel / Settings / Translation completes the seven-pane Settings group.
Its one semantic table exposes the same source language, source text, override
text and actions as Jade. Labelled signed forms provide create, edit, literal
search, 25-row Previous/Next paging and two-stage delete without JavaScript or
cookies, in natural source and Tab order. Both views call one Global Admin
service; clients submit inert search text rather than executable Mongo selectors,
the server trims and caps it at 500 characters, escapes regular-expression
metacharacters and fixes the maximum result window. Mutations accept bounded
values and one exact persisted ID. Direct DDP writes are denied and recorded as
TranslationBleed with available actor and request context. The same-URL browser
fixture checks create, timestamps, edit, a literal `[x]` search, two pages,
confirmation before deletion, anonymous isolation and paired screenshots. The
comparison also guards that Jade and HTML4 calculate the same page count.

Admin Panel / People / Roles is the first dedicated People controller. Its
labelled checkbox fieldset exposes every invite-capable board role plus the Jade
bulk-all behavior, a native clear-all alternative and Save. The following
read-only table renders all nine roles and the same invitation, card visibility,
comment, write and board-management capability matrix enforced by server policy.
Search and every action remain keyboard reachable signed POST controls without
JavaScript or cookies. Both views write through one Global Admin service which
deduplicates and allowlists role keys in canonical order and targets the single
settings ID. Direct DDP changes are denied and RolesBleed-reported. Its publication
now refuses non-admin readers. A separate validated exact-language feed supplies
public runtime translation overrides, fixing the old i18n loader's unsafe selector
call and its visible 500 errors. The live same-URL fixture exercises selected,
all and empty states, checks the modern capability table, captures both views and
proves anonymous isolation. The global HTML4 navigation now reaches all four Admin
Panel page groups, and every People URL exposes the signed People pane menu.

Admin Panel / People / Shared templates is the second dedicated People
controller. A labelled checkbox fieldset preserves the modern Organizations,
Teams and Domains filters as one signed POST that works without JavaScript or
cookies. The single semantic table then renders scope, group, user and every
template-board link in the same order as Jade; selecting no scope reveals no
template row. Both renderers use one pure scope normalizer/grouping function and
one Global Admin discovery service. The service reads only active linked-board
cards from non-empty personal Templates containers and returns the minimum
identity, group, domain and board fields required by the page. Refused readers
receive no data and are TemplateBleed-reported with available request context.
The live same-URL fixture covers all three scopes, excludes an empty container,
checks signed board navigation, captures both views and proves anonymous
isolation. The pre-existing six-case Jade suite also passes after the shared
service extraction.

Admin Panel / People / Login is the third dedicated People controller. Five
signed desired-state POST controls expose Forgot password, Self-Registration,
Username Change, Self delete and Display Authentication Method with one
consistent allowed-state meaning. A labelled fieldset preserves the enabled
authentication-method dropdown and bounded OIDC label. With registration
disabled, another fieldset preserves multi-address invitations and the current
administrator's board choices; the Meteor method and HTML4 route share the same
explicit-actor invitation operation. Login reads and writes one Global Admin
service with fixed keys and enabled-method validation. Direct Settings and
AccountSettings writes are denied and LoginSettingsBleed-reported. The work also
repairs the modern pane's subscription and invitation-board helper after its
move from Settings to People, and binds a board's user/admin test to one member
with `$elemMatch`. The live fixture changes all settings, exercises both
renderers, captures paired screenshots, restores global state and proves
anonymous isolation; separate invitation tests retain success and SMTP-failure
coverage.

Admin Panel / People / Email is the fourth dedicated People controller. A
labelled transport fieldset preserves the enabled state, fixed Nodemailer
provider catalog, provider-specific identity, write-only password, From address
and custom SMTP host, port and TLS fields. HTML4 keeps SMTP fields present even
while another provider is selected, because it cannot reveal them after a
selector change; the shared service ignores those fields for non-SMTP providers.
Separate signed POST controls send the administrator a test message and save the
invite-domain and account-email-change policy. Both views use one Global
Admin-only service, bound and normalize every field and publish only a
`passwordSet` indicator. A blank secret preserves the stored credential and no
publication, response or browser store receives it. Direct collection writes are
denied and refused methods are MailSettingsBleed-reported. The same-URL browser
fixture writes both settings groups in HTML4, observes and changes them in Jade,
checks the secret boundary, captures paired screenshots, restores global state
and proves anonymous isolation. The pre-existing service test also verifies that
non-admin DDP calls receive the intended authorization error.

Admin Panel / People / Domains is the fifth dedicated People controller. It
preserves the modern read-only domain and primary-account count columns, literal
search, total, fixed ten-row window and clamped Previous/Next paging in one
semantic table. Every navigation and search control is a signed POST that retains
the current query without JavaScript or cookies. The Jade method and HTML4
controller share one Global Admin service which reads only the primary e-mail
field, normalizes the domain and returns only domain/count rows. Refused account
enumeration is DomainBleed-reported. The same-URL browser fixture seeds twelve
unique domains, verifies both pages and both renderers, captures paired
screenshots and proves anonymous isolation; the existing board-domain suite also
checks counts, non-admin denial and the resulting Security report.

Admin Panel / People / Organizations is the sixth dedicated People controller.
Its single semantic table preserves the modern ten columns, literal search,
total and ten-row paging. Signed controls retain New, Edit, all three row and
bulk feature switches, the same-Organization member restriction, Organization
administrator management and two-stage deletion without JavaScript or cookies.
The edit view also retains the complete tenant domain, text and safe-link fields.
The two tenant logos use the common bounded upload path: image bytes are detected,
sanitized, converted to GIF and stored in Default Storage before the resulting
local URL is written.

Jade methods and HTML4 POSTs use one service boundary with fixed projections,
field allowlists, size limits, literal escaped search and Organization scope for
tenant administrators. Only a site administrator can create, edit, bulk-change
or delete Organizations. A tenant administrator can view their Organizations,
edit their tenant fields and appoint only members they are entitled to manage;
they can never modify a site administrator. A non-empty Organization is retained
and the expected constraint is reported at medium severity, while forged scope
and authorization attempts are blocked and TenantBleed-reported at high severity.
The same-URL Chromium fixture exercises the operations, denormalized display-name
update, normalized domain, GIF logo, guarded deletion and both renderers, captures
paired screenshots and proves anonymous isolation.

Admin Panel / People / Teams is the seventh dedicated People controller. It
preserves the modern ten columns, literal search, total and ten-row paging in one
semantic table. Signed POST controls retain creation, editing, the three per-row
and bulk feature switches, the same-Team board-member restriction and confirmed
deletion without JavaScript or cookies. Jade and HTML4 call one Global Admin-only
service with fixed projections, bounded fields, escaped search, exact identifiers
and denormalized member-display-name updates. Non-empty deletion is retained and
reported at medium severity; authorization and allowlist violations are blocked
and TeamBleed-reported at high severity. The live same-URL Chromium fixture
exercises the operations and guarded deletion, captures both renderers and proves
anonymous isolation.

Admin Panel / People / Locked Users is the eighth dedicated People controller.
Both renderers now show the six known/unknown-user protection settings and the
current locked-user rows: username, primary e-mail, failed-attempt count, locked
address count, remaining time and actions. Labelled HTML4 fields and signed POST
controls save the complete fixed integer setting set and provide confirmed single
or all-user unlock without JavaScript or cookies. A single Global Admin service
validates the bounds, writes and activates the configuration, derives summaries
from per-address lock state and performs unlocks. Modern writes no longer bypass
that service through client collections, and the admin-only publication no longer
exposes settings anonymously. Unauthorized calls are JamBleed-reported. The live
same-URL fixture changes every setting, unlocks one then all seeded accounts,
captures paired screenshots, restores global state and proves anonymous isolation.

Admin Panel / People / People is the ninth dedicated People controller. Its first
delivery preserves the nine-column account list, literal search, all/locked/
active/inactive/admin filters, total and fixed 25-row paging. Signed controls show
the account detail, change the desired active state, confirm an individual unlock
and disclose grouped country rows containing city, IPv4, IPv6 and timestamps.
The shared reader uses a fixed projection and combines the existing tenant People
scope with the requested query, so crafted search or filter input cannot widen an
Organization administrator's scope. Refused access is UserBleed-reported. A live
same-URL Chromium fixture verifies filtering, location disclosure, state changes,
modern parity, anonymous isolation and paired screenshots. Creation, complete
editing, avatar, bulk Team membership, impersonation and deletion were originally
left for the next People delivery rather than represented by inert controls.

The second People delivery adds creation and complete account editing. One
labelled fieldset preserves the modern identity, profile, verification, role,
active, authentication, import-alias, Organization, Team and optional password
fields in natural Tab order. HTML4 and Jade now submit one operation instead of a
race among profile, username, e-mail and password methods. The shared service
bounds every value, resolves membership display names from exact scoped IDs,
allows enabled authentication methods, enforces case-insensitive uniqueness,
preserves secondary addresses, protects the current and last administrator,
rolls back incomplete creation and reuses Team-to-board membership propagation.
A same-URL live test creates and edits an account and verifies persisted values;
the existing modern suite verifies list, edit, active-state and password flows.
The third People delivery completes the route. Multipart avatar uploads are
bounded, decoded and converted to GIF; the edit view lists existing avatars with
signed select and confirmed-delete controls and can return to initials. Deleting
an unused historical avatar no longer clears a different selected avatar. A
labelled page-selection fieldset adds or removes one exact Team, with gained-board
propagation. Confirmed account deletion protects the current and last
administrator. Confirmed impersonation writes the normal audit document, changes
the server-held cookieless session identity and renders the target's All Boards
view. Jade active-state and Team bulk controls use the same services instead of
direct client writes or one method per selected user. The live test covers all of
these operations and forges a cross-user avatar selection to prove refusal,
UserBleed Security reporting and automatic attacker-account blocking.

Admin Panel / Attachments starts with one signed navigation covering all ten
modern pane URLs, so an HTML4 browser can move between them before each pane's
controls are complete. Default Save Storage and Limits are the first two complete
controllers. Both read and write through the same Global Admin-only Meteor
services as Jade. Default Storage accepts only the five supported backends.
Limits preserves all four upload/download and API modes, positive byte/MB/GB
values and the avatar-upload block in one labelled fieldset and natural Tab
order. Limit normalization and safe-integer conversion live in one common module
used by both renderers; unknown modes, units, non-positive values and overflow are
refused and Security-reported. A same-URL live Chromium fixture changes both
panes, verifies Jade observes the resulting settings, captures both renderers,
restores global state and proves a non-admin receives no fields.

Move Attachment is the third complete Attachments controller. Its labelled
scope, read-source and destination selectors submit the existing resumable
server job; persisted progress and the last operation remain readable after
navigation, and running jobs expose Pause/Resume and Cancel. Repair File
Locations calls the same guarded scanner as Jade. Server allowlists reject an
unknown scope/backend and equal explicit source/destination, while the HTML4
route accepts only its five named operations and Security-reports refusals. The
same-URL fixture verifies both forms and captures matching HTML4/Jade views
without moving production files.

Filesystem and MongoDB GridFS are the fourth and fifth complete Attachments
controllers. Each exposes the desired Read state and server-calculated attachment
and avatar counts. Filesystem additionally shows the actual server-resolved
writable, attachment and avatar paths; no client-side environment guess is used.
GridFS distinguishes legacy CollectionFS from current MongoDB file counts and
offers the same compaction operation and result rows as Jade. The shared methods
repeat Global Admin authorization, while the HTML4 dispatcher derives the storage
from the route and permits compaction only on GridFS. The live test toggles both
Read settings, calculates both reports, verifies Jade state and captures four
same-URL screenshots; it deliberately verifies but does not execute the expensive
compaction control.

S3 / MinIO, Azure Blob and Google Cloud Storage are the sixth through eighth
complete Attachments controllers. A shared fieldset component now supports two
semantic submit actions, allowing Test Connection and Save to submit the same
labelled current values without JavaScript. Every provider exposes its modern
Enabled/Read state, non-secret fields, write-only secret fields, file counts and
connection test; stored secrets are represented only by a translated set marker.
One common provider schema bounds fields, rejects unknown fields and types, and
requires GCS credential JSON to be an object before either HTML4, DDP or REST can
save/test it. Blank secrets retain existing values. The route derives the provider
and the methods repeat Global Admin authorization. The live test disables each
backend before setting harmless test names, verifies Jade receives all three,
captures six same-URL screenshots and restores the exact original configurations;
it verifies but does not contact unconfigured external services.

Database Migration is the ninth complete Attachments controller. It reads phase,
per-collection and total progress and exposes the two modern migration directions as
signed POST buttons. The HTML4 request and shared service both enforce the fixed
direction allowlist, repeat Global Admin authorization and refuse a second concurrent
migration; denied requests are Security-reported. The Meteor methods delegate to the
same service instead of being invoked outside a DDP context. A same-URL live fixture
verifies both actions and status in HTML4 and Jade and captures paired screenshots
without starting a destructive migration.

Backup is the tenth complete Attachments controller, completing the Attachments tab.
It exposes scope, three content choices, four storage targets, live background state,
the site-wide schedule, scoped archive listing and confirmed add-missing/replace-all
restore. Site administrators can select the instance or an Organization; tenant
administrators see only their Organizations, no schedule and no links to instance
storage panes. HTML4 and Jade share services that strictly validate every option and
repeat tenant/archive authorization. Restore accepts only a path in the caller's
fresh scoped list. The live same-URL test exercises listing, verifies all controls and
captures paired screenshots without starting a backup or restore.

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

Legacy Admin Panel bookmarks have the same canonicalization as the modern
router. Bare and former Settings, People, Problems and Attachments addresses,
including `/setting`, `/information` and `/translation`, return a no-cache 303
to the named current pane. The exact `/attachments` bookmark is distinguishable
from `/attachments/...` file responses, which remain outside HTML rendering.
The router wildcard likewise matches the modern Not Found contract: unknown
paths render a localized semantic content table and return HTTP 404 rather than
pretending an unfinished feature exists at that address. Its same-URL browser
regression checks the status, heading and table with JavaScript disabled, then
captures both Legacy HTML4 and modern Not Found representations.

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
The document-preview regression creates a two-page OOXML document in the live
Default Storage path, opens it at the same card URL with JavaScript/cookies
disabled and with the modern viewer, verifies selectable page text and native
HTML4 Previous/Next controls, and captures both representations. It also forges
the route board while retaining the real attachment and verifies an attributed
Security refusal. Unit coverage rejects executable generated-table markup,
out-of-range pages, oversized responses and runtime-directory-relative storage.
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
A focused same-URL card regression changes the Date Format through a labelled
JavaScript-disabled form, verifies the persisted preference in the Jade selector,
captures both representations, then submits an injected option and verifies
non-mutation plus its attributed Security report.
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
