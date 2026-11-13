# Blaze jQuery and native DOM backends

Inspect `.meteor/versions`, `.meteor/packages`, `package.json`, the lockfile,
and any app-local Blaze overrides. Blaze is independently released; a Meteor
release label does not establish the installed backend capability.

| Resolved Blaze version | Backend decision |
|---|---|
| 3.0.x through 3.0.3 | jQuery is required at runtime. Retain the Meteor `jquery` wrapper and npm dependency unless another verified source supplies jQuery. Missing jQuery throws `jQuery not found` during initialization. |
| 3.1.0-alpha.0 | Prerelease introducing the optional native DOM backend. Removing jQuery is possible after resolving compatible Blaze packages, but this alpha has the native delegated-selector defect reported in issue 512. |
| 3.1.0-beta.0 | Prerelease retaining both backends and including the delegated-selector fix from PR 513. With jQuery loaded, Blaze selects it; without jQuery, Blaze selects native DOM. |

The reviewed Meteor Blaze scaffold includes `jquery` in `.meteor/packages`
and `jquery` in npm dependencies. Preserve generated dependencies until the
resolved runtime and other consumers support their removal.

## Removing jQuery deliberately

1. On Blaze 3.0.x, retain or restore jQuery first. Later `Blaze`,
   `meteorInstall`, or `require` errors can be consequences of failed startup;
   diagnose the earliest error before changing bundler configuration.
2. If native mode is required, choose compatible Blaze packages explicitly.
   Keep prerelease adoption deliberate, verify the resolved `blaze` and
   `blaze-html-templates` versions, and check their Meteor compatibility.
   A Meteor upgrade is needed only if the selected packages require it.
3. Audit application code, Atmosphere packages and DOM widgets for `$`,
   `jQuery` and `instance.$()` calls. In native mode, `instance.$()` returns
   an array of elements, not a jQuery object. Prefer `instance.find` /
   `instance.findAll` for backend-independent lookup; port jQuery methods and
   widget cleanup before removal. Keep jQuery when a required consumer needs it.
4. After the compatible runtime is resolved, remove the direct dependencies
   with `meteor remove jquery` and the project's npm/pnpm/Yarn uninstall
   command. Preserve the authoritative lockfile. Check transitive dependencies
   and global imports that might still supply jQuery.
5. Restart and inspect the console. The 3.1 prereleases log
   `[Blaze] jQuery ... detected as DOM backend` and its load source when using
   jQuery. Their absence is only a clue: verify successful startup, template
   rendering, subscriptions, delegated events and widget teardown. Do not
   make application behavior depend on private `_DOMBackend` fields.

Do not describe PR 513 as open: it merged on September 14, 2026, and the
September 23 beta history includes it. An alpha deployment with missing
delegated events needs the compatible fixed package set and a reproduction
of its selectors, not an assumption that removing jQuery was successful.

## Evidence

- [Stable runtime initialization](https://github.com/meteor/blaze/blob/e700f2d749ed037afae14dc3f055b9e52d5de375/packages/blaze/dombackend.js)
- [Alpha and beta release history](https://github.com/meteor/blaze/blob/068f0c09f4851bdc150e2e30f1a09bae3700914b/HISTORY.md)
- [Beta backend selection](https://github.com/meteor/blaze/blob/068f0c09f4851bdc150e2e30f1a09bae3700914b/packages/blaze/dombackend.js)
- [Scaffold package declarations](https://github.com/meteor/meteor/blob/4c94e92457c06cb73082a8d59908257bf6b518d1/tools/static-assets/skel-blaze/.meteor/packages)
- [Scaffold npm dependencies](https://github.com/meteor/meteor/blob/4c94e92457c06cb73082a8d59908257bf6b518d1/tools/static-assets/skel-blaze/package.json)
