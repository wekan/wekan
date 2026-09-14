# Mobile and production

Read this reference for Cordova or HCP failures, device-only symptoms, and
production incidents where debugging actions need stronger safety boundaries.

## Mobile and HCP

For an Android build failure after upgrading to Meteor 3.5.2, check the native
toolchain before investigating HCP. This release uses Cordova CLI 13 and
`cordova-android@15.1.0`, requiring Android SDK Platform 36 and Build Tools
36.0.0:

```bash
sdkmanager 'platforms;android-36' 'build-tools;36.0.0'
```

Verify the SDK location and selected platform in the native build output.
Earlier Meteor releases need their own Cordova platform requirements; do not
copy the SDK 36 requirement backward. Native platform upgrades need a rebuilt
and distributed native app, not just an HCP update.

Collect evidence at each stage:

1. The server produced the expected client version.
2. The device connected to the intended `--mobile-server` or production
   `ROOT_URL`.
3. The client received a changed version hash.
4. The bundle and assets downloaded.
5. Compatibility checks accepted the update.
6. The client switched to the pending version and reloaded.

Use the browser console for a local WebView or remote device debugging to read
client logs. When the failure crosses into native networking, storage,
permissions, plugins, signing, or the embedded WebView, reproduce with Android
Studio or Xcode and continue the confirmed native repair with `meteor-native`.

Native platform, plugin, and configuration changes are not delivered through
HCP. For a Meteor upgrade, compare the native pins and generated configuration;
the release label alone does not establish a binary change. Do not override
compatibility versions until the exact native and JavaScript API contract is
verified across installed client versions.

Avoid unrestricted logging inside reactive HCP watchers. Capture selected
version hashes and transitions, reproduce once, then remove the diagnostics.

## Production incident boundaries

Start with read-only evidence:

| Evidence | Question |
|---|---|
| Deployment and release diff | What changed between working and failing versions? |
| Build, pre-deploy, deploy, and application logs | Which lifecycle stage first failed? |
| Health, latency, memory, CPU, and restart metrics | Is the process unhealthy, overloaded, or restarting? |
| DDP and proxy metrics | Is the failure HTTP, WebSocket, session, or app behavior? |
| Small redacted reproduction | Can staging reproduce the same boundary? |

Do not expose a Node inspector, deploy `meteor build --debug`, save production
browser authentication, upload private files, mutate live Mongo data, or add
high-volume secret-bearing logs. A production breakpoint also pauses a process
serving users.

Prefer an equivalent staging reproduction. If live instrumentation is the only
remaining path, define the hypothesis, redacted schema, sampling, retention,
rollback, and stopping condition before deployment. Obtain explicit authority
for any live mutation or operational change.

Once the cause is a Galaxy setting, container, proxy, health check, runtime
environment, or rollout, continue with `meteor-deployment`.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/troubleshooting/hot-code-push.md
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/about/cordova.md
