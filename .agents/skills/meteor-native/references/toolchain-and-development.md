# Toolchain and development

## Resolve versions before installation

Read the app release and existing platform declarations. Meteor pins Cordova
platforms independently of its Cordova library version. Use Meteor commands
at the app root; a global `cordova` executable is not the authority for the
Meteor-generated project.

Meteor 3.5.2 uses `cordova-lib@13.0.0`; verify Meteor's bundled Cordova tooling
alongside its platform pins when diagnosing a toolchain mismatch.

| Target | Meteor 3.5.2 baseline | Verification |
|---|---|---|
| Android | `cordova-android@15.1.0`, JDK 17, SDK Platform 36, Build Tools 36.0.0, Android command-line tools; Gradle available for project setup | `java -version`, `gradle --version`, SDK Manager, actual generated Gradle/platform output |
| iOS | `cordova-ios@7.1.1`; macOS with Xcode, command-line tools, accepted Xcode license and CocoaPods | `xcode-select -p`, `xcodebuild -version`, `pod --version`, selected simulator/device and signing team |

On earlier Meteor releases, inspect that release's native platform pins and
the corresponding Cordova requirements. For example, a branch pinned to
Meteor 3.5.1 does not acquire 3.5.2's SDK 36 requirement. Preserve a requested
release constraint. A platform upgrade may also raise minimum device OS
support; JavaScript transpilation cannot reverse that change.

For the 3.5.2 Android baseline, install missing SDK components with SDK Manager
or:

```bash
sdkmanager 'platforms;android-36' 'build-tools;36.0.0'
```

Resolve `JAVA_HOME` and `ANDROID_HOME` to the actual host installations;
`ANDROID_SDK_ROOT`, if set, must agree. Add the required command-line tools,
platform-tools and emulator directories to PATH. Do not copy a macOS SDK path
onto Linux or Windows. Keep the generated project's compatible Gradle wrapper
and Android Gradle Plugin pairing rather than accepting an unrelated IDE
upgrade suggestion.

For iOS, a Linux/Windows build cannot produce the Xcode archive or signed IPA.
Use the project's macOS workstation or runner. Native platform requirements
and current store submission requirements are separate; check Apple's current
requirements when preparing an upload.

## Platform lifecycle

```bash
meteor list-platforms
meteor add-platform android
meteor run android
```

Use `meteor add-platform ios` and `meteor run ios` on macOS. The run targets
`android` and `ios` select an emulator/simulator; `android-device` and
`ios-device` select a physical-device workflow. Ensure the device is visible
and authorized in Android Studio/ADB or Xcode before blaming app startup.

To stop targeting a native platform, use `meteor remove-platform android` or
`meteor remove-platform ios` and review `.meteor/platforms`. Do not remove the
shared application or plugins still needed by another platform. Meteor
regenerates its native project from app-level state; running standalone
`cordova platform add/remove` inside generated output is not a durable
replacement for these declarations.

## Device networking and native IDEs

For the standard Android emulator, `10.0.2.2` reaches the host machine:

```bash
meteor run android --mobile-server=http://10.0.2.2:3000
```

For a physical device, use the development machine's reachable LAN address
and port, for example:

```bash
meteor run android-device --mobile-server=http://192.168.1.4:3000
```

Replace that address with the real endpoint. Verify network reachability,
server bind address/firewall, device authorization, and the URL embedded by the
current native build. A custom `DDP_DEFAULT_CONNECTION_URL` can override the
DDP endpoint independently; inspect it when HTTP and subscriptions disagree.
Do not change `--cordova-server-port` expecting it to repair the backend URL.
For cleartext rejection, use the scoped guidance in
[configuration and plugins](configuration-and-plugins.md).

Open the generated project for device logs and native diagnostics:

| Platform | Default development path |
|---|---|
| Android Studio | `.meteor/local/cordova-build/platforms/android/` |
| Xcode | `.meteor/local/cordova-build/platforms/ios/`; prefer the generated `.xcworkspace` when present |

Resolve custom local state first. Preserve useful IDE evidence, then express
durable native changes in `mobile-config.js` or the app's build overrides.

## WebView JavaScript compatibility

Meteor 3.3.2 introduced modern Cordova output with a legacy opt-out. Earlier
Meteor 3 releases used the legacy default. On 3.3.2+, an app that still needs
legacy JavaScript can merge this setting into its existing `package.json`:

```json
{
  "meteor": {
    "modern": { "cordova": false }
  }
}
```

Preserve the other options' effective values; modern objects enable omitted
options, as detailed below. Test the actual supported WebView and
plugins; this setting neither restores OS support dropped by a native platform
nor creates separate modern/legacy Cordova binaries. Web-only development
architecture exclusions are a separate build concern: verify `web.cordova`
is produced when developing native apps or serving HCP.

Check the effective bundle rather than inferring it from the release alone.
Affected 3.3.2 through 3.5 tools can normalize an absent modern setting to
legacy; Meteor 3.5.1 fixes that defaulting defect. Inspect `METEOR_MODERN` and
`meteor.modern` overrides first. On an affected pinned release, explicitly set
`meteor.modern.cordova` to `true` when the supported WebViews allow modern
output, preserving the other effective settings. Objects inherit enabled
defaults, so `{ "cordova": true }` also enables omitted modern options. For an
affected app with no modern setting and no environment override, preserve its
otherwise disabled options with:

```json
{
  "meteor": {
    "modern": {
      "transpiler": false,
      "minifier": false,
      "webArchOnly": false,
      "watcher": false,
      "cordova": true
    }
  }
}
```

Merge this into the existing `meteor` object. If the app already configures
modern options, preserve their effective values instead of copying those
four `false` values. Preserve a deliberate Cordova legacy requirement.
[Fix and regression coverage](https://github.com/meteor/meteor/pull/14411).

Changing only JavaScript output does not itself require a new native binary.
Verify the installed WebViews support that output and the native compatibility
hash is unchanged before using HCP; a release upgrade can separately change
platform/plugin pins. See [hot code push](hot-code-push.md).

## Version-specific startup failures

Match the first exception and resolved package before selecting a repair.
Inspect `.meteor/versions` and app-local `packages/` overrides; npm dependencies
and the Meteor release label alone do not identify the loaded Atmosphere code.

| Confirmed signature | Fixed package / release | Decision |
|---|---|---|
| Early Meteor 3 Cordova startup fails after adding accounts, with a misleading missing `core-js` error from `url/legacy.js` | `url@1.3.5`, shipped in Meteor 3.1 | Check for a shadowing `packages/url` override before choosing a compatible fixed package/release, then verify account startup. Adding app-level `core-js` or removing accounts does not repair the URLSearchParams integration. [Fix](https://github.com/meteor/meteor/pull/13459) |
| `Map.keys`, `Map.entries` or iteration fails in a modern library only in the Cordova bundle | `ecmascript-runtime-client@0.13.0`, shipped in Meteor 3.4.1 | Check whether legacy polyfills replaced native Map/Set/Symbol. Modern transpilation alone is not this fix. Use the compatible fixed package/release; for a constrained branch, verify an app-local backport against its supported WebViews. Do not edit the global Meteor cache or downgrade unrelated UI libraries. [Meteor 3 confirmation](https://forums.meteor.com/t/solved-vue3-does-not-work-with-cordova/61109/10) |
| Meteor 3.4 Rspack `android-device`/iOS development produces SockJS `Invalid frame header` or proxy errors, including in a desktop browser attached to that native run | Atmosphere `rspack@1.1.0`, shipped in Meteor 3.4.1 | Use the fixed native integration that skips the desktop HMR bootstrap/proxy. Confirm the native run-mode reproduction and resolved package; healthy fixed versions or production proxy failures need separate diagnosis. [Fix](https://github.com/meteor/meteor/pull/14226) |

On earlier constrained releases, verify package compatibility before a
selective update or backport. Retest both the native client and any affected
browser clients. Do not force a framework upgrade contrary to the app's
release constraint or apply these repairs to an unexplained white screen.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/about/cordova.md
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/cli/index.md
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/cli/environment-variables.md
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/generators/changelog/versions/3.3.2.md
