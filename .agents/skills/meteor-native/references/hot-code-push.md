# Native hot code push

## Decide whether the update can use HCP

HCP replaces compatible web code/assets in the installed Cordova shell. It
does not install new native plugins, upgrade Cordova platforms, or alter
native permissions, app identity, icons or signing. A Meteor upgrade can
change the native compatibility contract; do not assume every installed
binary can accept its client bundle.

Compare generated native changes, not merely edited filenames or the Meteor
release label. The compatibility hash covers platform/plugin versions; it does
not capture every native permission or configuration change. Those changes
still need a new binary even when the hash is unchanged.

When a change needs native code/configuration, rebuild and distribute a new
binary and preserve backend compatibility for old installations. Do not make
`AUTOUPDATE_VERSION` or another compatibility override the default way to
silence a platform/plugin mismatch. Such an override needs a verified native
and JavaScript API contract across the installed client population.

## Find the failed stage

Inspect `.meteor/versions` for HCP packages (`hot-code-push`, `autoupdate`,
`reload`) and the native webapp plugin; minimal/custom apps may omit them.
The default `meteor-base` setup supplies HCP. Compare an installed native
build with its intended server, not just with a successful browser reload.

| Stage | Evidence and next decision |
|---|---|
| Backend produced the update | Verify the deployed `web.cordova` bundle and changed version. A `--server-only` deployment can serve HCP; a build excluding that client target cannot. |
| Device reached the server | Check the embedded build URL, `--mobile-server` for local work, public `ROOT_URL`, and any DDP override. Distinguish network/TLS/cleartext failures from compatibility. |
| Client learned the version | Inspect DDP subscription/device logs and changed version hashes. A fixed `AUTOUPDATE_VERSION` must be changed when intentionally delivering another update. |
| Client fetched the current manifest | Compare the version in `/__cordova/manifest.json` through the public proxy/CDN and directly at the origin. Inspect GET response headers and cache hits. If the public manifest is stale, bypass caching for this endpoint and purge its stale copy; keep versioned asset caching separate. |
| Native shell accepted it | Read compatibility rejection logs. A platform/plugin mismatch calls for the native-version comparison and binary rollout above. |
| Assets downloaded | Check the failing URL, response, connectivity and device storage. Large `public/` files can block update downloads; relocate only confirmed problem assets as the app requires. |
| Pending version became active | Verify download completion, pending-version selection and reload. Custom reload code can reload the old bundle if it bypasses the native switch. |
| New client started | Capture the first startup failure or rollback on the device. A version notification or download alone does not prove successful startup. |

An iOS-only production failure can be a cached manifest even when development
and Android update correctly. A [Meteor 3.2.2 reporter confirmed this repair](https://forums.meteor.com/t/cordova-ios-hot-push-code/63707/6).
Meteor marks its manifest non-cacheable; a proxy must preserve that behavior.
Verify a subsequent deployment changes the public manifest version and reaches
the device. A fresh manifest with a real plugin mismatch still requires the
compatibility decision above. Use `meteor-deployment` for the proxy change.

Use selected version values and stage transitions for diagnostics. Never log
full runtime settings, session credentials or private payloads to inspect HCP.
Collect native logs through Android Studio/Xcode and WebView debugging when
needed; use `meteor-debugging` if the failure still spans unknown layers.

## Reload behavior

Cordova HCP reloads the whole client even for CSS-only changes. Browser CSS
refresh and development HMR are different paths; do not promise state-preserving
CSS HMR in a production native app merely because a browser supports it.

Prefer the built-in reload path. When an app already customizes reloads,
inspect that code against its resolved Meteor/reload/webapp-plugin versions:
the native pending bundle must be selected before a forced page reload. The
docs describe `WebAppLocalServer.switchToPendingVersion` and the retry callback
of `Reload._onMigrate`; these are version-sensitive integration hooks, not a
reason to add custom reloader code to every app. Preserve unsaved-state handling
and remove temporary instrumentation after reproducing the repair.

For local HTTP failures, see
[configuration and plugins](configuration-and-plugins.md). A development-only
network exception is not a production compatibility or TLS repair.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/troubleshooting/hot-code-push.md
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/packages/autoupdate.md
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/about/cordova.md
