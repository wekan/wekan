# Dependabot review, 2026-09-24

Reviewed the pull from `cee0c9c53` to `39d426be7`, covering Dependabot PRs
[#6716](https://github.com/wekan/wekan/pull/6716) through
[#6721](https://github.com/wekan/wekan/pull/6721), and the S3 dependency repair
described below. This is a bounded review, not a guarantee that dependencies
contain no unknown vulnerabilities or hidden behavior.

## Results

| Update | Result |
| --- | --- |
| hotkeys-js 4.0.7 → 4.0.8 | No reporting code identified in the library. Network-related matches were in bundled documentation assets. |
| @rspack/cli and core 2.2.0 → 2.2.6 | No telemetry endpoint identified. Worker processes, libc detection and development lazy-compilation requests have build-related purposes. |
| htmlparser2 10.1.0 → 12.0.0 | No reporting code identified in the parser or changed DOM/entity dependencies. This is a major upgrade; targeted tests do not establish full application compatibility. |
| @aws-sdk/lib-storage 3.1119.0 → 3.1137.0 | Confirmed incompatible locked S3 client. Repaired below. Network calls reviewed are upload operations through the configured S3 client. |
| @typescript-eslint/eslint-plugin 8.70.0 → 8.70.1 and related packages | No reporting implementation identified. XMLHttpRequest matches are browser type definitions. The manifest previously allowed versions from 8.65.0. |

The npm advisory service reported **zero known vulnerabilities** for the
pulled lockfile and again for the repaired lockfile. That check alone does
not detect telemetry, malicious code, or previously unknown vulnerabilities.

## Confirmed regression and repair

The merged lib-storage package requires `@aws-sdk/client-s3 ^3.1137.0`, but
the lockfile retained 3.1127.0. The supplied test log records npm `ERESOLVE`
before the application build. Pin the direct S3 client to 3.1137.0 and
regenerate the lockfile. The older exact client required by s3-presigned-post
remains nested beneath that package rather than satisfying lib-storage's peer.

The database-conformance stage separately reported a missing `mongodb` npm
package following the failed dependency installation. It did not run queries.
After repairing and installing dependencies, the MongoDB driver loads and
the S3 client and Upload object can be constructed without making requests.

`tests/dependencySecurityUpdates.test.cjs` now verifies that the locked S3
client satisfies the upload library's declared peer requirement.

## Inspection scope and evidence

- Compared manifests and lockfiles before and after the pull; distinguished
  release-version edits from dependency changes.
- Downloaded 43 changed source-package archives in the repaired dependency
  graph and checked their SHA-512 values against the lockfile before reading
  them. Examined manifests and matches for reporting, network and subprocess
  behavior. This was indicator-driven review, not a line-by-line audit of
  every source file.
- Verified the other 14 changed Rspack native/WASM archives against their
  lockfile hashes. Checked their package scripts and embedded URL strings
  for known telemetry destinations. No such destination was found. Binaries
  were not reverse engineered or independently rebuilt from source.
- No preinstall, install or postinstall hooks were found in the reviewed
  archive manifests. Downloading and inspecting archives executed no package
  code. Dependency installation used `--ignore-scripts`.
- Rspack's WebContainer-only fallback can invoke pnpm to fetch its matching
  WASM binding. This is conditional dependency loading, not a telemetry
  collector. Its libc probe and worker processes also explain subprocess hits.
- AWS credential-process support executes the command configured in an AWS
  profile. Uploads and credential providers can contact configured service
  endpoints; absence of telemetry does not mean absence of networking.
- domutils' `fetch()` matches are local DOM lookups, not network requests.
  htmlparser2's fetch examples are comments for its stream interface.
- The existing source/dependency indicator audit found no blocking indicators;
  it warned about changed comparison fingerprints. Baselines were not silently
  rewritten to turn those warnings into an approval.

Local evidence is in `.tools/tmp/dependabot-audit/`: `changes.json`,
`source-review.json`, `native-review.json`, `npm-audit.json`,
`npm-ci-check.log`, `install.log` and `tests.log`. These ignored files are
working evidence, not release artifacts.

Six focused Node suites pass: dependency security, dependency version selection,
attachment storage paths, HTML export safety, notification HTML safety and
keyboard-event handling. npm installation and `npm ci --dry-run` succeed.
The full Meteor/browser and database-conformance suites have not been rerun.

Upstream release information:
[Rspack 2.2.6](https://github.com/web-infra-dev/rspack/releases/tag/v2.2.6),
[htmlparser2 12.0.0](https://github.com/fb55/htmlparser2/releases/tag/v12.0.0).
