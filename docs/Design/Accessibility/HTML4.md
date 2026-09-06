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
