# Build and distribution

## Choose the native output and backend

Confirm the added platforms, host OS, app identity/version, installed native
platforms/plugins, production endpoint and intended distribution channel.
Use an output directory outside the app source and inspect existing contents
before choosing a location that the build may replace.

```bash
meteor build ../build-output --server=https://app.example.com
```

Native builds require an explicit `--server` when building an added native
platform. Do not rely on the CLI documentation's localhost default. Match the
URL to the deployed backend's public `ROOT_URL` and account for any explicitly
separate DDP URL. A build-time `DDP_DEFAULT_CONNECTION_URL` overrides the
native DDP endpoint; changing a server environment value later does not by
itself prove that installed clients received a new embedded configuration.

Use `--mobile-settings path/to/mobile-settings.json` when the native build
needs settings. Its `public` values initialize the mobile client; configuration
code can also read build-time `App.settings`. Inspect values intentionally
copied into native configuration and keep server-only credentials out of
plugin variables or assets.

| Command choice | Outcome |
|---|---|
| Default `meteor build ... --server=...` | Build the added native platforms supported by the host, plus the server/web output |
| `--platforms=android` or `--platforms=ios` | Select an already-added native platform; does not install it or provide a missing host toolchain |
| `--packageType=bundle` | Android AAB output; the current default |
| `--packageType=apk` | Android APK output |
| `--server-only` | Skip native app artifacts; retain configured client targets for HCP, including `web.cordova` when applicable |
| `--architecture=...` | Select server bundle architecture; does not enable iOS builds on Linux or choose a phone CPU |

On a release where an option's meaning is uncertain, verify `meteor help
build` for that app's Meteor tool. Preserve the `web.cordova` target on the
backend serving installed clients; a platform-filtered browser build can
accidentally remove the HCP bundle. Use `meteor-deployment` for hosting and
backend rollout.

## Android signing and installation

For the example output path, open `../build-output/android/project/` in
Android Studio. Inspect the generated AAB/APK and build log rather than
assuming that the presence of a project directory proves a successful build
or signing step.

Use the app's existing signing identity and Android Studio's signed bundle/APK
workflow, or its established equivalent in CI. Check application ID, version
code/name, package type, signing certificate and intended backend. Keep
keystores/passwords out of tracked source and logs. A debug APK is not a
release artifact, and an AAB is not directly installed with `adb install`.
Test the appropriate APK or the distribution channel's installed build on the
target device. Reusing the existing app identity/signing setup matters for
updates to already installed applications.

## iOS archive and distribution

On macOS, open `../build-output/ios/project/` in Xcode, using its generated
`.xcworkspace` when present. Meteor produces the Xcode project; it does not
prove a signed IPA exists. Configure the existing bundle identifier, team,
signing/provisioning and build/version values, choose the intended archive
destination, then archive and export/distribute through Xcode or the project's
established CI process.

Verify the resulting archive/export and device installation. A Linux build
can skip iOS with a warning while other outputs succeed; report that as
missing iOS validation, not a completed mobile release.

## Release verification

Check cold launch, target-device plugin/permission behavior, backend/DDP
connection, and a compatible web update for each intended platform. Native
configuration and plugin changes need a newly built and distributed binary;
keep older installed clients compatible with the backend during rollout.

Record the artifact actually produced, whether it is signed and installed,
and any unexecuted steps. Verify current Apple/Google submission requirements
at upload time. Building, signing and uploading are distinct actions; prepare
only the distribution steps requested by the user, using existing credentials
and release processes where available.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/about/cordova.md
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/cli/index.md
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/cli/environment-variables.md
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/api/app.md
