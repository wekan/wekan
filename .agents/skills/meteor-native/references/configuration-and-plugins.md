# Configuration and plugins

## Keep configuration in application sources

`mobile-config.js` belongs at the Meteor app root and executes during the
native build. It is not imported by application startup. Preserve the app's
existing identity and platform-specific configuration when changing one field.

```js
// mobile-config.js
App.info({
  id: 'com.example.myapp',
  name: 'My App',
  version: '1.0.0'
});
App.setPreference('Orientation', 'portrait', 'android');
```

For `BackgroundColor`, use a supported `#` hex value, for example
`App.setPreference('BackgroundColor', '#ffffffff')` for opaque white. Old
examples using `0x...` caused Android build failures during Meteor 3 migrations.
Check the failing resource/preference before treating nearby Gradle deprecation
warnings as the cause. Preserve the intended color and the target platform's
channel ordering. See the [confirmed 3.3.2 repair](https://forums.meteor.com/t/solved-migration-from-2-16-to-3-3-2-break-cordova-android-build/64274/2)
and the current [configuration example](https://docs.meteor.com/api/app).

| Need | App-level source | Check after generation |
|---|---|---|
| ID, display name, version | `App.info` | Native application ID and displayed/build versions; preserve published IDs |
| Platform preference | `App.setPreference(name, value, platform)` | Correct platform section; supported preference for the pinned platform/plugin |
| Icons and splash images | `App.icons`, `App.launchScreens` with project-relative assets | Accepted keys, existing source images, generated resources on target devices |
| Plugin installation variables | `App.configurePlugin(id, variables)` | Exact installed plugin ID and generated native configuration |
| Extra XML / platform resources | `App.appendToConfig`, `App.addResourceFile(src, target, platform)` | Correct generated XML/resource target, without replacing unrelated configuration |
| Native files outside those APIs | App-root `cordova-build-override/`, mirroring the generated Cordova project tree | Narrow override remains compatible with the selected native platform |

Meteor copies build overrides into the generated Cordova project. Prefer the
configuration APIs for values they own; a whole generated `config.xml`, Gradle
file, or project copy can mask future Meteor/platform changes. Rebuild and
inspect output after changing native configuration. Do not treat edits under
`.meteor/local/cordova-build` as the permanent source.

`App.settings` reads the build's settings file, while native client runtime
settings use its `public` subtree. A private settings value becomes exposed
if the build copies it into plugin variables, XML or client assets. Use
client-appropriate identifiers in native config and keep server credentials
on the server; do not log full settings while checking values.

## Network access, navigation, and OS policy

Choose the rule for the requested operation:

```js
// mobile-config.js
App.accessRule('https://api.example.com');
App.accessRule('https://docs.example.com', { type: 'navigation' });
App.accessRule('myapp:*', { type: 'intent' });
```

The default rule type is network access; navigation allows the WebView to move
to a URL; intent permits asking the OS to open it. An intent rule does not
register an inbound deep-link handler. Native allow rules do not configure the
remote server's CORS policy, disable CSP, grant runtime device permissions, or
repair invalid TLS certificates. Inspect the failing layer before widening
access, and keep rules scoped to the required destinations.

For local Android HTTP development, first verify the `--mobile-server` URL.
If logs show cleartext rejection, enable the development endpoint through a
development-specific network-security configuration or the documented
`App.appendToConfig` manifest edit below:

```js
App.appendToConfig(`<edit-config file="app/src/main/AndroidManifest.xml"
  mode="merge" target="/manifest/application"
  xmlns:android="http://schemas.android.com/apk/res/android">
  <application android:usesCleartextTraffic="true" />
</edit-config>`);
```

That example is an application-wide cleartext allowance, not a per-domain
rule. Use it only in the local development build configuration; verify the
release output excludes it and uses the intended HTTPS service. Do not add
wildcard access or a production TLS bypass as an HCP fix.

## Install, configure, and call plugins

Use Meteor's plugin declarations. Replace the identifiers/versions below with
the selected plugin's verified npm ID and compatible exact version:

```text
meteor add cordova:PLUGIN_ID@EXACT_VERSION
meteor remove cordova:PLUGIN_ID
```

Review `.meteor/cordova-plugins` and the generated installed plugin list.
Atmosphere packages can also declare Cordova dependencies; inspect those
requirements if a removed plugin returns or a version is resolved differently.
`meteor npm install` alone does not register a Cordova plugin, and
`App.configurePlugin` only supplies its build-time variables. Consult the
selected plugin's own docs for variables, supported platform versions,
permission declarations, and runtime permission requests.

On Meteor 3.0.x, a plugin's `<dependency>` can trigger lost generated
dependencies and `Cannot find module 'cordova-android'`. The complete tool fix
ships in Meteor 3.1; 3.0.4's initial fix was incomplete. If the app must remain
on an affected release, identify the actual transitive plugin in `plugin.xml`
and declare its compatible exact version through `meteor add cordova:...`.
For the reported `cordova-plugin-screen-orientation@3.0.4` case, that dependency
was `es6-promise-plugin@4.2.2`. Do not add it to unrelated apps or permanently
edit generated `package.json`. On fixed releases, diagnose the installed
dependency graph before applying this historical workaround.
[Resolution and workaround](https://github.com/meteor/meteor/issues/13303),
[complete fix](https://github.com/meteor/meteor/pull/13416).

Native APIs belong in client code after device readiness:

```js
import { Meteor } from 'meteor/meteor';

Meteor.startup(() => {
  if (!Meteor.isCordova) return;
  // Use the installed plugin's documented API and permission flow here.
});
```

Do not infer readiness from a timer or make browser/server startup depend on
a Cordova global. Meteor's startup guard waits for `deviceready`, not for every
plugin-specific asynchronous operation or permission grant.

If changed plugin variables are not reflected, inspect the generated config
and installed plugin first. Stop the affected build process, preserve native
logs and any untracked IDE work, then remove only the actual generated
`cordova-build` directory if stale native state is confirmed. Re-run the
Meteor build/run command. Never substitute `meteor reset --db` or deletion of
all `.meteor/local` for this recovery.

## Local plugin development

Meteor supports `cordova:PLUGIN_ID@file://...` specifications. Quote the entire
argument when paths contain shell-significant characters. Meteor 3.5.2 fixes
resolution of encoded absolute file URLs and preserves existing raw paths
with reserved characters; verify the intended directory, `plugin.xml` ID and
generated plugin source before rebuilding. Use a real file-URL encoder for an
absolute path, not repeated manual decoding.

Earlier releases can mishandle those paths. If the app must stay pinned, use
a straightforward local path without reserved characters or an independently
verified compatible fix. Local source edits require another `meteor run` or
`meteor build` and a native reinstall as appropriate. Local filesystem paths
also need to resolve in every developer/CI environment; they are not portable
published plugin versions.

## Native launch and status UI

`meteor add mobile-experience` pulls in `mobile-status-bar` and `launch-screen`
defaults. It has no JavaScript API of its own. Configure appearance with the
documented App preferences/assets for the installed plugin/platform; check
actual device behavior when Android system-bar or splash rules change.

To hold the splash for app readiness, use `LaunchScreen.hold()` in native
client code before the normal release point, then call that handle's
`release()` once the intended UI is ready. Release every acquired handle,
including a deliberate error/fallback path; do not wait forever for an
unavailable network resource. Guard native use with `Meteor.isCordova` rather
than promising a browser implementation. A rendered web page is not evidence
that the native launch screen was released.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/api/app.md
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/tutorials/application-structure/index.md
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/packages/autoupdate.md
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/troubleshooting/hot-code-push.md
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/packages/mobile-experience.md
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/packages/launch-screen.md
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/packages/mobile-status-bar.md
