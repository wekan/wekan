# `browser-policy` CSP recipes

`BrowserPolicy` is server-only. Call its functions at module top level or
inside `Meteor.startup` so policy initialization is deterministic. The policy
is process-global, not request-specific. Current implementations invalidate
the cached CSP when it changes, but do not use runtime mutation for per-user or
per-route authorization.

## Install

```bash
meteor add browser-policy
```

Pulls in both `browser-policy-content` (CSP) and `browser-policy-framing`
(X-Frame-Options). Add either standalone for a smaller surface.

## Tight default

```javascript
import { BrowserPolicy } from "meteor/browser-policy-common";

await BrowserPolicy.content.disallowInlineScripts();
BrowserPolicy.content.disallowEval();
BrowserPolicy.framing.disallow();
```

`disallowInlineScripts`, `allowInlineScripts`, and `setPolicy` are async in
current Meteor. Await them from an async startup callback when startup order
matters.

Removes `eval`, inline `<script>` blocks, and embedding by other sites.

## Stripe Checkout / Elements

```javascript
BrowserPolicy.content.allowScriptOrigin("https://js.stripe.com");
BrowserPolicy.content.allowFrameOrigin("https://js.stripe.com");
BrowserPolicy.content.allowFrameOrigin("https://hooks.stripe.com");
BrowserPolicy.content.allowConnectOrigin("https://api.stripe.com");
```

Inspect CSP violation reports for the Stripe features actually enabled. Add a
new origin only to the directive named by the violation.

## Google Maps / Fonts / GTM

```javascript
BrowserPolicy.content.allowScriptOrigin("https://maps.googleapis.com");
BrowserPolicy.content.allowConnectOrigin("https://maps.googleapis.com");
BrowserPolicy.content.allowStyleOrigin("https://fonts.googleapis.com");
BrowserPolicy.content.allowFontOrigin("https://fonts.gstatic.com");
BrowserPolicy.content.allowScriptOrigin("https://www.googletagmanager.com");
```

Do not replace these calls with `allowOriginForAll`. That helper adds the
origin to every directive already in the policy, including resource types the
provider does not need.

## Inline styles (framework injects them)

```javascript
BrowserPolicy.content.allowInlineStyles();
```

Tradeoff: weakens style protection. Use only when the framework (e.g.
Material UI, styled-components) genuinely needs it.

## Frame-ancestors (Chrome / Safari)

`X-Frame-Options` is partly ignored by Chrome / Safari. To restrict
framing across browsers, use the CSP `frame-ancestors` directive:

```javascript
BrowserPolicy.content.allowFrameAncestorsOrigin("https://example.com");
```

## Reset

```javascript
await BrowserPolicy.content.setPolicy(...) // override entire content policy
BrowserPolicy.framing.allowAll()       // unset X-Frame-Options
```

Used in tests where the default policy interferes.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/packages/browser-policy.md
