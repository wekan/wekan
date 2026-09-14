# Client graph preflight

Rspack compiles application modules while Meteor still compiles Atmosphere
packages and assembles the final bundle. Audit both systems at the boundaries
that shape the browser graph.

## Build separate reachability graphs

Start from every configured root:

- `meteor.mainModule.client`;
- `meteor.testModule.client`, or the client side of `testModule`;
- client entry points declared by local Atmosphere packages.

Follow static imports, re-exports, and literal `require()` calls. Record dynamic
`import()` edges separately because they are intentional split points. Do not
classify a module only from `client/`, `server/`, or `imports/` in its path.

## Resolve clean-checkout inputs

Resolve every static edge from each client and client-test root in a clean
checkout before activation. A missing module can be:

- a checked-in source file;
- a generated file excluded by Git;
- a virtual module supplied by a loader or plugin;
- an alias resolved by Rspack, TypeScript, Babel, or SWC;
- a package export selected by browser conditions.

Do not require every import target to exist as a physical file. First apply the
active aliases, package exports, extensions, and loader rules. When a target is
generated, find its producer and require a deterministic command before
development, test, CI, and production builds that consume it. Do not commit
generated output automatically. Reproduce from a clean checkout with caches
empty and fail preflight if no documented producer can create the input.

Server unit tests do not prove this graph compiles. Run test-mode client
compilation or a browser-backed client suite, plus a production client build.

## Flag risky client-reachable modules

| Finding | Interpretation | Action |
|---------|----------------|--------|
| `module.exports` or `exports.*` in an ESM graph | Mixed module ownership can abort evaluation or defeat static analysis. | Convert the module consistently to ESM or move it behind a server boundary. |
| Node built-in import | Browser code may be reaching server-only behavior. Rspack does not add Node polyfills automatically. | Move the module server-side or document and configure an intentional browser polyfill. |
| Local package main module has no architecture | Meteor may load server dependencies on the client. | Add the correct `client` or `server` architecture in `package.js`. |
| Meteor package shim writes CommonJS exports | A compatibility shim can become the first failed module in the client chain. | Export valid ESM or keep the shim outside the Rspack client graph. |

Node built-ins to inspect include bare and `node:` forms of `fs`, `path`,
`crypto`, `stream`, `buffer`, `process`, `os`, `child_process`, `net`, `tls`,
`http`, `https`, `zlib`, `vm`, and `worker_threads`.
[Rspack does not automatically polyfill Node built-ins](https://rspack.dev/config/resolve#resolvefallback)
for a web target.

Do not flag these automatically as application defects:

- Rspack config files and Node-only scripts;
- server and server-test graph nodes;
- npm packages with browser exports that remove the built-in edge;
- explicit `resolve.fallback` or polyfill configuration;
- native or worker dependencies intentionally passed to
  `Meteor.compileWithMeteor`.

Inspect the resolved graph before editing an indirect dependency.

## Preserve lazy boundaries

Inventory existing `import()` callsites before converting modules. Mark routes,
locales, editors, and other features that must remain lazy. Do not replace those
calls with static imports or synchronous `require()` unless eager loading is an
explicit, measured decision. Compare build chunks before and after migration.
[Rspack treats dynamic `import()` as an async split point](https://rspack.dev/guide/optimization/code-splitting#dynamic-imports).

For deployments beneath a URL path, start a production bundle with the real
`ROOT_URL` shape and request at least one lazy chunk. Reject duplicated or
missing asset path segments.

## Protect Meteor's handoff

Resolve `meteor.buildContext`, `meteor.assetsContext`, and
`meteor.chunksContext`, including any suffix derived from `METEOR_LOCAL_DIR`.
Generated contexts belong in `.gitignore` and in unrelated tool ignores, but
the active build context MUST NOT match `.meteorignore` or `METEOR_IGNORE`.
Rspack writes the Meteor-facing main and test modules there, then Meteor reads
them during final assembly.

Separately compare top-level directory size and file count with `.gitignore`
and `.meteorignore`. Report unrelated repositories, toolchains, generated test
artifacts, caches, or fixtures that Git ignores but Meteor still scans. Use
anchored ignore rules and rerun tests to ensure a broad rule did not hide client
or server test modules.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/about/modern-build-stack/rspack-bundler-integration.md
