# Saved mirror scanning alerts

Reviewed and hardened on **2026-09-14** from the two HTML reports in
`.tools/wekansec20`. No remote scanning alerts were changed.

| Alert | Source review | Changes |
| --- | --- | --- |
| 537: incomplete URL substring sanitization | `repositoryArchive` receives a directory host component, not a URL. The previous array `includes` already checked exact membership; the reported substring bypass is not reproducible. | Require a string and check a private `Set` of four exact hosts. Tests reject URLs, lookalikes, traversal and objects while preserving all four valid archive paths. |
| 539: environment-derived shell command | The reported `spawn(tool, args)` already forced `shell: false`. Checkout-path shell injection at that sink is not reproduced. Windows destination dispatch did separately construct a `cmd.exe` command string. | Restrict dispatch to the running Node executable or literal `bash`. Force shell-free arguments even if options request a shell. Windows now runs the existing engine directly with equivalent flags. Tests cover metacharacter paths/arguments, unknown executables, failures and read-only previews. |

These are mirror-tool hardening changes, not a confirmed remotely exploitable
application vulnerability; no misleading vulnerability Hall of Fame entry is
created. CLI denials surface as failed commands, not application RPC events.
No dependencies were added; offline operation and resumable archives remain.

Verification: focused mirror regressions passed on Linux arm64. Windows
dispatch was exercised through injected commands; native Windows execution
and a fresh remote CodeQL scan remain unverified. Existing static-browser
coverage is unchanged; the changed functionality is CLI process dispatch.

Reference: [Node child-process documentation](https://nodejs.org/api/child_process.html)
explains separate argument spawning and the command-shell requirement of
Windows batch files. Runtime code is in `tools/mirror-menu.mjs` and
`tools/mirror-repository.mjs`; regressions are in `tests/mirrorMenu.test.cjs`.
