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
cannot reuse an earlier conversion. On the first Legacy HTML4 page load that reads the
image, the generated data is saved as the attachment's `legacyHtml4Gif` version in
the backend selected by Admin Panel / Attachments / Default Storage. Later Legacy HTML4
loads read that stored version rather than converting again. The normal storage
write permissions and free-space protections apply.

Public-board pages may use the authorized GIF response as an `img` source.
Cookieless private pages must not put a session secret in an image URL: an
explicit POST `Show image` control returns the GIF from the authenticated form
request. Every attachment also retains a separately labelled original-file
download control. All conversion and authorization remains server-side.

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
to the session, HTTP method, normalized target path and operation. Tokens use a
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
