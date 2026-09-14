# Rspack migration validation matrix

Compilation, server startup, client startup, and test execution are separate
results. Run the applicable rows after Rspack activation.

| Check | Run when | Required evidence |
|-------|----------|-------------------|
| Clean dependency install | Always | Manifest and lockfile stay unchanged. |
| Development server and browser startup | Client app | Expected DOM marker appears and the browser has no startup exception. |
| Development rebuild | Interactive app | A source edit triggers the expected HMR or full reload. |
| Server tests | Server tests exist | Expected suites execute; reject zero-test output. |
| Client tests | Client tests exist | Browser bundle compiles and expected suites execute. |
| Test-mode compilation | Client or test-only entry exists | The configured client test root and generated inputs compile through Meteor and Rspack. |
| Full-app initialization | App-test modules or server top-level await exist | On Meteor 3.5.2, configured app client/server bundles remain present with server-only test entries; awaited module initialization settles and the expected tests execute. Earlier integrations need a release-specific reproduction. |
| Production build | Always | Command exits nonzero on failure and the expected artifact exists. |
| Extracted bundle boot | Deployable app | Server reaches readiness from the production artifact. |
| Browser against production bundle | Client app | The real page starts; HTTP 200 from the server alone is insufficient. |
| Dynamic import | Lazy feature exists | The chunk loads and executes when the feature is invoked. |
| Non-root `ROOT_URL` | Subpath deployment | Assets and chunks load without duplicated or missing prefixes. |
| Legacy web architecture | Still supported | A legacy-targeted browser or equivalent bundle smoke starts. |
| Custom loader | Custom loader exists | Representative input passes parsing, transformation, and code generation through the actual loader entry. |
| Framework preprocessing | Svelte/TypeScript, PostCSS/SCSS or UI-library inputs changed | An affected component compiles, renders and responds to interaction; expected styles survive development rebuild and production output. |
| Compiler plugins | Lingui or another SWC plugin is configured | The actual bundler-hosted compiler transforms a representative input; translated output or the equivalent feature works in development and production. Run catalog extraction/generation when used. |
| Generated input | Client graph reaches generated source or data | A documented producer recreates it from a clean checkout before every consuming path. |
| Long watch session | Memory grows over time | Memory reaches a stable range across repeated rebuilds. |
| Shutdown and restart | Queues, migrations, workers | Critical async work follows the documented drain or failure policy. |

For each command record the mode, Meteor release, `rspack` Atmosphere package,
declared and installed npm integration versions, exit status, artifact path,
suite count, and first browser or server exception.
Existing service workers also need their cache/update and offline behavior
checked; a successful startup alone does not prove those capabilities.

Create a checkpoint before troubleshooting. Reproduce with one command, change
one variable, measure, and revert a disproven hypothesis before trying another.
Check known Meteor and Rspack fixes before retaining an application workaround.
