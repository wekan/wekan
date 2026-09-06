# HTML4 compatibility mode

## Goal

WeKan must keep its normal URLs usable when JavaScript is disabled or the
browser cannot execute the JavaScript capabilities required by the Meteor
client. The compatibility response is server-rendered HTML 4.01, uses no
JavaScript, cookies or client-side storage, and performs navigation and changes
with HTML forms.
The interaction model follows the maintained Omi design in
`.tools/omi/docs/WEB_DESIGN.md`; Wami's static pages are presentation references.

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

The bootstrap must not load or parse the large Meteor bundles before the tests
pass. The upgrade state is an optimization only and never authentication or
authorization state. Every HTML4 form includes an internal representation field
so its next POST renders HTML4 directly, without a cookie and without putting
mode or credentials in the URL. The field is not accepted as authority to
access data.

## HTML contract

- Emit the HTML 4.01 Strict doctype and a declared character encoding.
- Do not emit `script`, event-handler attributes, JavaScript URLs, cookies,
  local storage, SVG-only controls, or CSS-dependent hidden functionality.
- Escape every dynamic value according to its HTML context.
- Keep public navigation as ordinary links. Keep authenticated navigation and
  every mutation as POST forms whose `action` is the same clean WeKan URL.
- Every button has visible text. Tables have captions or adjacent headings,
  header cells and a plain-text empty state.
- Preserve the existing URL families, including `/sign-in`, `/sign-up`, `/`,
  `/allboards/...`, `/b/...`, card URLs, search, import, account preferences and
  Admin Panel URLs. An unsupported action must render an explanatory page, not
  fall through to a JavaScript-only shell.

## Cookieless authentication and request integrity

Successful sign-in creates a short-lived opaque server-side session. The session
identifier is carried only in hidden POST fields, never in a URL, Referer,
redirect, log message or response header. Reloading a GET therefore returns the
same public URL logged out, as in Omi.

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
