# Installation and PATH

## Preflight

Check the host before selecting a command:

| Check | Decision |
|---|---|
| OS and architecture | Meteor supports 64-bit Windows, Linux, and macOS. Use the npm installer for one cross-platform path. |
| Host Node and npm | For the latest CLI, follow the current installation page. For a pinned installer package, check that package version's `engines`; do not infer the host requirement only from the Node version bundled inside Meteor. |
| Existing project | Read `.meteor/release`. The project release is separate from the npm installer package version. |
| Existing executable | Run `meteor --version`. Do not reinstall only to replace a project-specific release. |

Current Meteor 3.5 installation documentation requires host Node 24 or newer.
Earlier Meteor 3 installers can have earlier host requirements. Preserve the
selected release when the user supplied one instead of silently choosing the
latest installer.

## Install

Use the official npm installer first:

```bash
npx meteor
```

Select an npm installer package when required:

```bash
npx meteor@<version> install
```

The npm package version and the installed Meteor release are separate
identifiers and have not always mapped one-to-one. Read the installer's output
and verify `meteor --version`. Pin the application release separately.

On Linux or macOS, the documented shell installer remains an alternative:

```bash
curl https://install.meteor.com/ | sh
```

Do not offer the shell installer on Windows. If `npx` installation still fails
after cache recovery, use the documented npm fallback:

```bash
npm install -g meteor --foreground-script
```

Do not place `meteor` in an application's dependencies or devDependencies.

## Verify PATH

The default user installation is `~/.meteor` on Linux and macOS and
`%LOCALAPPDATA%\.meteor` on Windows. The installer updates supported shell PATH
configuration, but the current terminal may not see that update.

1. Open a new terminal and run `meteor --version`.
2. If lookup still fails, confirm the platform-specific Meteor directory and
   executable exist before editing PATH.
3. Inspect the actual login shell and its PATH configuration. Do not append the
   same entry repeatedly or edit an unrelated shell profile.
4. For fish on Linux, add the existing Meteor directory to fish's PATH. For
   bash or zsh, let the installer manage the documented profile files unless
   the user disabled PATH setup.

Node version managers can keep separate global npm package directories for
each host Node version. If `meteor` disappears immediately after switching the
host Node version, suggest rerunning the official npm installer under the
selected Node version. Do not remove the user Meteor directory unless separate
evidence shows that installation is corrupt.

To install without changing PATH, set
`npm_config_ignore_meteor_setup_exec_path=true` or use the documented npm flag.
In that mode, report how the caller will invoke or expose the executable.

## Recover an `npx` failure

Use the smallest recovery that matches the failure:

1. Preserve the full npm error and check proxy, certificate, disk, and
   permission evidence.
2. With an HTTPS proxy, pass `https_proxy` or `HTTPS_PROXY` rather than
   disabling TLS verification.
3. Suggest the documented cache helper and explain that it removes temporary
   `npx` installer state:

   ```bash
   npx clear-npx-cache
   ```

4. Run the helper only after the user confirms that cleanup. If it fails,
   suggest deleting only the resolved npm `_npx` cache directory and require a
   second confirmation before manual deletion. Do not delete the entire npm
   cache or application dependencies.
5. After authorized cleanup, retry once. If the same failure remains, use the
   documented npm fallback or report the blocking host prerequisite. Do not
   loop through installers.

Avoid root installation. Use `sudo` only when the user explicitly accepts the
documented root-install risks and cannot repair their npm permissions.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/about/install.md
