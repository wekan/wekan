# Evaluation cases for `meteor-native`

Run each prompt in a fresh conversation or disposable project. Keep these
criteria hidden until the run finishes; record observable outcomes separately.

## Case 1: Android setup

Prompt: "Add Android development to our Meteor 3.5.2 app on Linux. We have JDK 17
and SDK 35 installed, but no Android platform in .meteor/platforms yet."

Pass if the agent checks the app release and adds Android through Meteor, installs
SDK Platform 36 and Build Tools 36.0.0 for the 3.5.2 baseline, verifies host paths
and prerequisites, and proposes an emulator/device check. Fail if SDK 35 is
treated as sufficient or a web build is claimed to validate Android.

## Case 2: earlier toolchain boundary

Prompt: "Our Meteor 3.5.1 Android branch must stay pinned. Can we copy all 3.5.2
native prerequisites and run cordova platform add android@latest?"

Pass if the agent preserves Meteor 3.5.1, inspects its platform pins and
requirements, and uses Meteor platform commands. Fail if it forces 3.5.2
prerequisites or installs the newest standalone Cordova platform.

## Case 3: physical device endpoint

Prompt: "Our Meteor 3.5.2 Android app works in the emulator. On my USB phone, it
starts but cannot connect. The native build uses http://localhost:3000;
DDP_DEFAULT_CONNECTION_URL was also set during the last build."

Pass if the agent distinguishes device localhost from the host, chooses a
reachable LAN endpoint, inspects the embedded DDP override, and verifies the
regenerated native configuration. Fail if it uses the standard emulator address as
a universal physical-device fix.

## Case 4: iOS build host

Prompt: "Our Meteor app has Android and iOS platforms. Linux CI reports build
success but produced no IPA. Can --architecture=os.osx.arm64 create it here?"

Pass if the agent explains that iOS archives require macOS and Xcode and
distinguishes server architecture from the native build host. Fail if it claims
Linux success proves an IPA exists or that --architecture supplies Xcode.

## Case 5: persistent native configuration

Prompt: "Update our existing Meteor Cordova app's display name, splash and Android
orientation. Keep its published app ID. My edits to generated config.xml disappear
whenever Meteor rebuilds."

Pass if the agent edits app-root mobile-config.js and source assets, preserves the
published ID, and verifies the regenerated native output. Fail if it makes durable
changes only in generated config.xml.

## Case 6: plugin installation and readiness

Prompt: "I added App.configurePlugin for our chosen camera plugin and called its
API at module top level. It is undefined on the phone and breaks web and server
startup. This code is shared by all clients."

Pass if the agent distinguishes plugin declaration, build-time variables, client
runtime and permission flow. It uses Meteor.isCordova with Meteor.startup or
equivalent readiness and retains browser/server behavior. Fail if configuration
alone installs a plugin or a timer replaces readiness.

## Case 7: narrow generated-state repair

Prompt: "We changed a Cordova plugin's install variables, but the generated config
still has the old values. METEOR_LOCAL_DIR=.meteor/native-local and our local
Mongo data matters. Should we delete .meteor/local and try again?"

Pass if the agent resolves .meteor/native-local/cordova-build, first verifies
stale plugin state, and preserves logs and IDE changes before narrowly
regenerating it. Fail if it deletes all local state, uses meteor reset --db, or
targets the default directory despite METEOR_LOCAL_DIR.

## Case 8: local plugin paths

Prompt: "A local Cordova plugin lives in a directory containing spaces, # and %.
We have an encoded file URL and a raw legacy path. How should we add it on Meteor
3.5.2, and what about our pinned 3.5.1 maintenance branch?"

Pass if the agent verifies plugin identity and path encoding, explains the 3.5.2
fix, and keeps the pinned earlier branch on a simple compatible path or verified
fix. Fail if it repeatedly decodes a raw path, passes an unquoted shell-sensitive
path, or promises local source changes ship without rebuilding.

## Case 9: network policy layers

Prompt: "Our Cordova client needs an HTTPS API, an embedded docs page and an
external custom-scheme link. Local Android HCP also logs cleartext denied. Should
we use App.accessRule('*') and disable certificate checks everywhere?"

Pass if the agent distinguishes access, navigation and intent rules from CORS,
CSP, runtime permissions and TLS. Any broad Android cleartext allowance is limited
to development and verified absent from release output. Fail if it uses wildcard
rules or disables certificate checks as a production repair.

## Case 10: HCP native incompatibility

Prompt: "The server deploy adds a native plugin that installed clients don't have.
Devices say the Cordova platform/plugin versions are incompatible. Can we force
AUTOUPDATE_VERSION so everyone gets the new feature immediately?"

Pass if the agent requires a new binary for the missing native plugin, preserves
backend compatibility during rollout, and rejects a blind version override. Fail
if AUTOUPDATE_VERSION is presented as delivering missing native code.

## Case 11: HCP switch and CSS behavior

Prompt: "Our Meteor Cordova app receives a new HCP version and downloads it, but
our custom window.location.reload() still loads old code. CSS-only deploys reload
too. How do we diagnose this?"

Pass if the agent checks pending-bundle selection before custom reload, describes
Cordova CSS updates as full client reloads, and treats custom
WebAppLocalServer/Reload hooks as version-sensitive. Fail if a plain
window.location.reload is assumed to activate a pending bundle or browser CSS HMR
is promised on native production.

## Case 12: native release artifacts

Prompt: "Prepare release builds for our Meteor 3.5.2 Android/iOS app on a Mac,
using https://app.example.com. We need an Android AAB and an iOS archive for
review, with the existing signing identities. Do not upload yet."

Pass if the agent selects the requested endpoint, inspects the Android AAB and
Xcode archive with existing app/signing identities, and distinguishes generated
projects, signing, device installation and upload. Fail if it claims artifacts or
signing were executed without evidence, installs an AAB with adb install, or
uploads without authorization.

## Case 13: settings exposure

Prompt: "Can mobile-config.js read a value from our mobile settings file to
configure a plugin? The same file has a server API secret and public app settings;
I want to put the server secret into App.configurePlugin."

Pass if the agent distinguishes build-time App.settings from public client
settings and keeps the server secret out of plugin variables, XML and assets. Fail
if a private key is considered secret after embedding in the native app.

## Case 14: modern output and OS compatibility

Prompt: "Did Cordova's default bundle become modern in Meteor 3.3.2 or 3.4? We
also support a pinned 3.3.1 branch. Will meteor.modern.cordova=false let our 3.5.2
Android app run below cordova-android's minimum supported OS?"

Pass if the agent identifies the 3.3.2 capability/opt-out floor, retains the
earlier legacy branch, and notes that affected default configuration must be
verified rather than promising all 3.3.2+ tools emit modern output. It
distinguishes JavaScript compatibility from the native platform minimum OS. Fail
if a legacy bundle is claimed to restore unsupported device OS versions.

## Case 15: splash readiness

Prompt: "Our React-based Meteor Cordova app uses mobile-experience. We hold the
splash until data arrives, but it stays visible offline. Can I import a mobile-
experience API and just wait ten seconds?"

Pass if the agent treats mobile-experience as a package bundle and uses balanced
LaunchScreen.hold/release behavior, including an offline fallback. Fail if it
invents a mobile-experience API or hides missing readiness with a fixed delay.

## Case 16: platform removal

Prompt: "We are dropping iOS from this Meteor app but retaining Android and the
web app. How do we stop Meteor generating the iOS project without losing our
shared plugins or application data?"

Pass if the agent removes only iOS with meteor remove-platform ios and reviews
platform declarations. Fail if it removes shared plugins, Android, the web app or
local data without a separate reason.

## Case 17: neighboring stack exclusions

Prompt: "Two separate tasks: our Expo React Native app consumes a Meteor backend,
and sharp fails in the Meteor server's Docker build. Should either task start by
adding Meteor's Cordova Android platform?"

Pass if the agent preserves the Expo stack and routes the server addon/container
failure to build or deployment guidance. Fail if it adds Cordova to either
project.

## Case 18: stale HCP manifest

Prompt: "Our Meteor 3.2.2 iOS app updates locally but stays on the old client
behind NGINX in production. Android updates. DDP announces the new version, but
the public /__cordova/manifest.json GET has an old version and a cache hit; the
origin GET has the new version. Plugins are unchanged. Fix the update path."

Pass if the agent diagnoses manifest caching, bypasses caching and purges stale
content only for the affected manifest route through the deployment workflow,
preserves hashed-asset caching, and verifies the next version reaches iOS. Fail if
it changes compatibility hashes, TLS policy or native plugins, or disables caching
for every asset.

## Case 19: fresh manifest with plugin mismatch

Prompt: "Our Meteor 3.5.2 iOS client downloads a fresh /__cordova/manifest.json,
whose version matches the origin. Logs reject the update because it adds a plugin
missing from installed clients. Should we apply the NGINX no-cache workaround?"

Pass if the agent rules out stale-manifest caching from the evidence and selects
compatible binary rollout. Fail if it repeats the caching workaround or forces HCP
past the native mismatch.

## Case 20: background color migration

Prompt: "Our Meteor 3.3.2 Android build fails while processing resources. mobile-
config.js has App.setPreference('BackgroundColor', '0xff0000ff'). There is also a
Gradle property-syntax deprecation warning. Should we change Gradle versions?"

Pass if the agent checks the invalid preference as the concrete cause, uses a
supported # hex value while preserving the intended color, and verifies generated
resources/build output. Fail if it blindly changes Gradle or copies an ambiguous
color-name assertion from a forum.

## Case 21: transitive plugin on pinned 3.0.4

Prompt: "Our Meteor 3.0.4 branch must stay pinned this week. Android meteor build
started failing with Cannot find module cordova-android after adding cordova-
plugin-screen-orientation@3.0.4. Its plugin.xml declares es6-promise-plugin@4.2.2,
but the generated dependencies disappear. What durable workaround fits?"

Pass if the agent recognizes the incomplete 3.0.4 fix, keeps the release
constraint, and explicitly declares only the verified transitive plugin through
Meteor. It names 3.1 as the complete tool fix and verifies the next build. Fail if
it edits generated package.json permanently, installs an unrelated global Cordova,
or claims 3.0.4 already fixed it.

## Case 22: plugin failure after the tool fix

Prompt: "A Meteor 3.5.2 Android build cannot find a custom plugin module. The
generated Cordova dependencies are present and that plugin has no es6-promise-
plugin dependency. Should we add es6-promise-plugin@4.2.2 because a closed Meteor
issue says it fixes missing modules?"

Pass if the agent rejects the historical workaround for this evidence and examines
the actual plugin declaration, compatibility and generated source. Fail if it adds
the old dependency or treats every missing-module error as issue 13303.

## Case 23: misleading core-js error

Prompt: "Our Meteor 3.0.4 Cordova app starts in the browser but shows a white
screen after adding accounts-base on Android and iOS. The first exception comes
from url/legacy.js and says core-js is missing. Installing core-js in the app did
not help. .meteor/versions has url@1.3.4. How do we repair it?"

Pass if the agent identifies the URLSearchParams integration fix in url@1.3.5
shipped with Meteor 3.1, checks compatible package/release selection and
overrides, and verifies accounts startup. Fail if it removes accounts, repeatedly
installs app-level core-js, or diagnoses every white screen identically.

## Case 24: runtime iterators versus modern output

Prompt: "Our Meteor 3.4 Vue Cordova app emits modern JavaScript, but Vue Router
and another library fail with Map.entries is not a function or its return value is
not iterable. .meteor/versions has ecmascript-runtime-client@0.12.3. The same
WebView works when browsing the server URL. Should we downgrade Vue or set
modern.cordova=true?"

Pass if the agent distinguishes runtime constructor replacement from
transpilation, inspects the loaded polyfills, and selects the compatible
ecmascript-runtime-client@0.13.0 fix shipped in 3.4.1. Fail if it considers modern
output alone sufficient or blindly downgrades Vue.

## Case 25: runtime fix with a release constraint

Prompt: "Our Meteor 3.2.2 maintenance branch must stay pinned. A Cordova-only
Map.entries failure matches the ecmascript-runtime-client fix, and someone
suggests editing ~/.meteor/packages or copying the whole devel packages folder.
What is the smallest supportable approach?"

Pass if the agent preserves the release constraint, verifies whether the fixed
runtime package can be used compatibly, or scopes a verified app-local backport of
the relevant fix. It tests the supported native and browser clients. Fail if it
forces a release upgrade, edits the global cache or imports unrelated packages.

## Case 26: native Rspack proxy failure

Prompt: "Meteor 3.4 with Atmosphere rspack@1.0.0 works in normal web development.
meteor run android-device produces SockJS Invalid frame header errors in both
Android and a desktop browser attached to that run. The same deployment proxy
works in normal mode. What should we check and change?"

Pass if the agent matches the native run-mode proxy defect, identifies the fixed
Atmosphere rspack@1.1.0 integration shipped in 3.4.1, and verifies compatible
package/release selection plus both clients. Fail if it only changes production
proxy settings, treats Map errors as the same cause, or promises native Rspack
HMR.

## Case 27: absent modern config on older tools

Prompt: "Our Meteor 3.5 Cordova app has no meteor.modern field and METEOR_MODERN
is unset. The generated web.cordova bundle is still legacy. We want modern Cordova
output without changing other build options; another branch intentionally uses
modern.cordova=false. A thread says 3.5 fixed the default."

Pass if the agent distinguishes the 3.3.2 capability from the defaulting defect
fixed in 3.5.1, verifies actual output, and suggests a narrow explicit cordova
setting on the pinned tool or a fixed release. It preserves other options and the
intentional legacy branch, accounting for object-form configuration inheriting
enabled defaults. Fail if it treats the reporter statement as proof for 3.5, sets
every modern feature true, removes the legacy opt-out, or requires a new binary
solely for changing JavaScript output with unchanged native compatibility and
supported WebViews.
