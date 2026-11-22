# Admin Panel / Settings / PWA

## What it is

What a browser reads about the app itself: extra tags in every page's `<head>`,
the web manifest that lets WeKan be installed as a Progressive Web App, and the
`assetlinks.json` that lets an Android app open WeKan links. WeKan installs as
a PWA from the browser, with separate phone and desktop layouts.

The pane was called **Layout**. Everything that was in it about branding and
All Boards moved to [Appearance](Appearance.md); what is left is:

- **Custom head tags** — whether they are enabled, plus custom `<meta>` and `<link>`
  tags as HTML.
- **Custom web manifest** — whether it is enabled, and its JSON.
- **Custom assetlinks.json** — whether it is enabled, and its JSON (Android app
  links).

## Read more

- [Progressive web app](https://en.wikipedia.org/wiki/Progressive_web_app) on
  Wikipedia, and MDN's [Progressive web apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps).
- [Web app manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest) on
  MDN.
- [The meta element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta)
  on MDN, and [Meta element](https://en.wikipedia.org/wiki/Meta_element) on
  Wikipedia.
- [Verify Android App Links](https://developer.android.com/training/app-links/verify-android-applinks) -
  what `assetlinks.json` is for.

## How to use it

**Custom head tags and the web manifest**

1. Open **Admin Panel / Settings / PWA** (`/admin/settings/pwa`).
2. Tick **Enable custom head tags** (saved at once).
3. Write **Custom meta tags (HTML)** and **Custom link tags (HTML)**.
4. To replace the web manifest, tick **Enable custom web manifest** and paste
   the JSON into **Custom web manifest content (JSON)**.
5. Press **Save**. Invalid JSON is refused with *Invalid manifest JSON* and
   nothing is saved.

**assetlinks.json**

1. Tick **Enable custom assetlinks.json** (saved at once).
2. Paste the JSON into **Custom assetlinks.json content (JSON)**.
3. Press its **Save**. Invalid JSON is refused with *Invalid assetlinks JSON*.

## How the numbers are calculated

- At most **100** custom meta tags are written into a page (`MAX_TAGS` in
  [models/lib/customHeadMetaTags.js](../../../../models/lib/customHeadMetaTags.js));
  the rest are dropped.
- Every switch is off by default. When a custom file is off or empty, the
  default file is served instead.

## How it works in WeKan

- **Fields** on the settings document
  ([models/settings.js](../../../../models/settings.js)): `customHeadEnabled`,
  `customHeadMetaTags`, `customHeadLinkTags`, `customManifestEnabled`,
  `customManifestContent`, `customAssetLinksEnabled`,
  `customAssetLinksContent`. The pane is template `pwaSettings` in
  [settingBody.jade](../../../../client/components/settings/settingBody.jade)
  with its handlers in
  [settingBody.js](../../../../client/components/settings/settingBody.js),
  which validate and re-indent the JSON before saving.
- **The head**: [server/lib/customHeadRender.js](../../../../server/lib/customHeadRender.js)
  adds to every page the `<title>` (the product name, from
  [Appearance](Appearance.md)), a responsive viewport tag and the LibreJS link,
  and then, when custom head tags are on:
  - the meta tags, **as `<meta>` elements only** (`safeMetaTags()`): a
    `<script>`, `<style>` or second `<title>` is dropped, and so is a meta tag
    with `http-equiv` `refresh` or `set-cookie`, because those act on every
    visitor (#4042);
  - the link tags as written, except a `rel="manifest"` link when the custom
    manifest is on;
  - `<link rel="manifest" href="/site.webmanifest">` when the custom manifest is
    on.
- **The files**: [server/routes/customHeadAssets.js](../../../../server/routes/customHeadAssets.js)
  serves `/site.webmanifest` (the custom one only when **both** custom head tags
  and the custom manifest are on, otherwise `public/site.webmanifest.default`)
  and `/.well-known/assetlinks.json` and `/well-known/assetlinks.json` (the
  custom one when on, otherwise `public/.well-known/assetlinks.json.default`).
- **Tests**: [tests/customHeadMetaTags.test.cjs](../../../../tests/customHeadMetaTags.test.cjs)
  and [tests/customAssetLinksRoute.test.cjs](../../../../tests/customAssetLinksRoute.test.cjs).

## Commits

 - [The custom meta tags are rendered, as meta elements only (#4042)](https://github.com/wekan/wekan/commit/6c3db838accaa58e29993678897b696678d43878)
 - [assetlinks.json is served at the well-known address](https://github.com/wekan/wekan/commit/99570e213f70dd7b2937fe7bfe2fe164b020aafd)
 - [Layout becomes PWA, holding only the PWA settings](https://github.com/wekan/wekan/commit/fa0da917882bc2701b9c2e2348e80863713a9b04)
 - [A responsive viewport tag on every page (#6419)](https://github.com/wekan/wekan/commit/0298670ac9989dbfbe5af8610fac2821ed438fab)
 - [The default assetlinks.json is found again](https://github.com/wekan/wekan/commit/36741d7ae5018693f51215b01924a8f7cc709477)
 - [Custom head meta and link tags, the web manifest and assetlinks.json](https://github.com/wekan/wekan/commit/b5a13f0206ff9b44329a1cf8d4f2b84ca1c7bd91)
