# Blaze PWA scaffold

Meteor 3.6-beta.0 supplies a Blaze/Rspack PWA skeleton with a dependency-free
service worker, manifest, icons, and offline page:

```bash
meteor create --release 3.6-beta.0 --pwa my-pwa
cd my-pwa
meteor
```

Inspect the selected release's generated client entry, `public/sw.js`,
manifest, icons, and `public/offline.html`. Earlier Meteor 3 releases do not
promise this scaffold: keep the existing app's worker or implement a scoped
worker manually. Do not run a new scaffold over an existing app.

## Select caching by execution mode

| Boundary | Scaffold behavior and required check |
|---|---|
| Development | Registration uses `/sw.js?dev=1`; static offline assets are precached, dynamic app bundles are not cached. Do not debug production offline behavior only in development. |
| Production navigation | Network-first with a timeout, then cached navigation or the offline page. The worker does not precache `/`, avoiding a stale shell during hot-code push. |
| Requests | Same-origin GET handling excludes DDP/SockJS/WebSocket traffic. Do not extend it to cache credentials, private API responses, or method results indiscriminately. |
| Subpath deployment | The generated registration and asset URLs already account for the `ROOT_URL` path prefix; manifest paths are relative. Verify the actual browser scope and any app modifications. Do not assume the scaffold requires a manual prefix rewrite. |
| Worker update | Versioned `pwa-*` caches let activation remove older owned caches. Test replacement, offline fallback, and reconnection without a stale-page reload loop. |

Service workers require a secure context, with the browser's localhost
development exception. Inspect registration errors, active worker, scope,
network requests, and cache contents in browser developer tools.

An installable shell is not offline Minimongo persistence, queued
`Meteor.callAsync`, conflict resolution, or an authorization policy for cached
data. Design those separately with the data and security skills. Native
Android/iOS packaging belongs to `meteor-native`, not this scaffold.

## Existing workers and migration

Workbox remains an optional application choice. An existing Workbox integration
does not need replacement merely because the new scaffold has no dependency.
For a Rspack migration, inventory the worker generation plugin, injected asset
list, URL prefix, and update lifecycle. Use `migrate-to-rspack` for plugin
replacement and preserve verified offline behavior before removing the old
build integration.

Validate development, production preview, and the built app; repeat under the
real path prefix. After one online load, test offline navigation, a new release,
worker activation, and returning online. Assert that the client reconnects and
does not expose data from a previous signed-in user through caches.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/cli/index.md
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/generators/changelog/versions/3.6.0.md
