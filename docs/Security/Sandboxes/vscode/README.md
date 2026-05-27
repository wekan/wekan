# Secure Sandbox: VSCode at Debian 13 amd64

Related files at this repo `.vscode` at [this commit](https://github.com/wekan/wekan/commit/639ac9549f88069d8569de777c533ab4c9438088).

## 1) Install Debian

Install Debian with username `wekan`, so that WeKan repo here, only directory where VSCode will have access:
```
/home/wekan/repos/wekan
```

## 2) Install Flatpak and VSCode

```
sudo apt install flatpak

sudo apt install gnome-software-plugin-flatpak

flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo

sudo reboot

flatpak install flathub com.visualstudio.code
```

## 3) Edit VSCode desktop icon

```
nano ~/.local/share/applications/wekan-vscode.desktop
```
Content:
```
[Desktop Entry]
Name=VS Code - WeKan
Comment=Open the WeKan project with Flatpak
Exec=flatpak run com.visualstudio.code /home/wekan/repos/wekan
Icon=com.visualstudio.code
Terminal=false
Type=Application
Categories=Development;IDE;
StartupWMClass=code
```

## 4) Force VS Code to use the internal (isolated) browser

This setting is also added as git commit to VSCode settings.

This is the most important step. If this is "native", it will use the operating system window that sees everything.

1. Open VS Code.
2. Press `Ctrl + ,` (options).
3. Type in search: **Dialogs: Custom**
4. Change the `Files: Simple Dialog` setting to **on** (check the box).
5. Restart VS Code.

## 5) Set the strictest sandbox possible (in Terminal)

Run these two commands (the first clears everything, the second sets limits):

```bash
# Reset previous attempts
sudo flatpak override --reset com.visualstudio.code

# Block EVERYTHING except the display and the wekan folder
sudo flatpak override com.visualstudio.code \
  --nofilesystem=home \
  --nofilesystem=host \
  --nofilesystem=xdg-run/gvfs \
  --nofilesystem=xdg-run/gvfsd \
  --filesystem=~/repos/wekan:rw \
  --device=all \
  --socket=wayland \
  --socket=x11 \
  --share=network

```

If you have already set wrong Chrome sandbox env earlier, remove it:

```bash
sudo flatpak override --unset-env=CHROME_DEVEL_SANDBOX com.visualstudio.code
```

Why: inside this Flatpak, `/usr/sbin/chrome-devel-sandbox` does not exist, and Chromium aborts immediately if that env points there.

## 6) Test "File -> Open Folder"

Now when you go to **File -> Open Folder**:

1. You will no longer see the fancy system file window, but VS Code's own, simple list.
2. If you try to go to the parent folder or somewhere else, **the list is empty** or it only shows `~/repos/wekan`.

## 7) Where existing binaries are (verified)

These were found already present in this sandboxed setup:

- Node.js: `/home/wekan/repos/wekan/.tools/node-v22.13.1-linux-x64/bin/node`
- npm: `/home/wekan/repos/wekan/.tools/node-v22.13.1-linux-x64/bin/npm`
- npx: `/home/wekan/repos/wekan/.tools/node-v22.13.1-linux-x64/bin/npx`
- Meteor CLI symlink: `/home/wekan/.meteor/meteor`
- Playwright Chromium binary: `/home/wekan/.var/app/com.visualstudio.code/cache/ms-playwright/chromium-1223/chrome-linux64/chrome`
- Flatpak-provided chrome-sandbox binary (not SUID in this runtime): `/app/extra/vscode/chrome-sandbox`

## 8) Reuse same in-sandbox toolchain (tested)

Open VS Code integrated terminal and run:

```bash
cd /home/wekan/repos/wekan

# 1) Use repo-local Node/npm/npx
export PATH="$PWD/.tools/node-v22.13.1-linux-x64/bin:$PATH"

# 2) Use Meteor CLI installed at ~/.meteor (if present)
export PATH="/home/wekan/.meteor:$PATH"

# 3) IMPORTANT: avoid bad host path inherited from old overrides
unset CHROME_DEVEL_SANDBOX

# 4) Keep Playwright browsers in Flatpak-private cache
export PLAYWRIGHT_BROWSERS_PATH="/home/wekan/.var/app/com.visualstudio.code/cache/ms-playwright"
```

Quick checks:

```bash
node -v
npm -v
npx playwright --version
meteor --version
```

If `meteor` is missing first time, bootstrap it from local Node:

```bash
cd /home/wekan/repos/wekan
export PATH="$PWD/.tools/node-v22.13.1-linux-x64/bin:$PATH"
npx -y meteor
export PATH="/home/wekan/.meteor:$PATH"
```

If you keep `--nofilesystem=home`, allow Meteor directory explicitly:

```bash
sudo flatpak override com.visualstudio.code --filesystem=~/.meteor:rw
```

## 9) Run tests fully inside sandbox (headless)

Install Playwright deps and run Chromium-only tests:

```bash
cd /home/wekan/repos/wekan/tests/playwright
export PATH="/home/wekan/repos/wekan/.tools/node-v22.13.1-linux-x64/bin:$PATH"
unset CHROME_DEVEL_SANDBOX
export PLAYWRIGHT_BROWSERS_PATH="/home/wekan/.var/app/com.visualstudio.code/cache/ms-playwright"

npm install
npx playwright test --project=chromium
```

This runs headless browser tests inside Flatpak sandboxed VS Code terminal (no external/native browser window needed).

### Run Firefox/WebKit too

By default this repo runs only the `chromium` Playwright project.
To enable `firefox` and `webkit` projects, set:

```bash
export WEKAN_PLAYWRIGHT_ALL=1
```

Then run for example:

```bash
cd /home/wekan/repos/wekan/tests/playwright
export HOME="/home/wekan/repos/wekan/.tools"
unset CHROME_DEVEL_SANDBOX
export PLAYWRIGHT_BROWSERS_PATH="/home/wekan/.var/app/com.visualstudio.code/cache/ms-playwright"
export WEKAN_PLAYWRIGHT_ALL=1

/home/wekan/repos/wekan/.tools/.meteor/meteor npm exec playwright test -- --project=firefox
/home/wekan/repos/wekan/.tools/.meteor/meteor npm exec playwright test -- --project=webkit
```

Without `WEKAN_PLAYWRIGHT_ALL=1`, Playwright config exposes only `chromium`, and `--project=firefox`/`--project=webkit` will fail with "Project not found".

### If `playwright install-deps` fails because of unrelated apt repo keys

On some hosts, this command can fail even when browser deps are already installed:

```bash
sudo npx playwright install-deps
```

Example failure:

- `NO_PUBKEY ...`
- `The repository ... is not signed`

This is usually caused by a third-party apt source (PPA/repo), not by Playwright itself.

Use either of these approaches:

1. Install required packages directly (recommended fallback):

```bash
sudo apt install -y \
  libgtk-4-1 \
  libxml2 \
  libevent-2.1-7t64 \
  libflite1 \
  libjpeg-turbo8 \
  libmanette-0.2-0 \
  libenchant-2-2 \
  libwoff1
```

2. Or temporarily disable the broken third-party apt source, run `install-deps`, then re-enable it.

In this sandbox workflow, manual apt package install is enough and avoids failures caused by unrelated repositories.

### Verified WebKit status in this setup

After applying the sandbox env settings from this document and running with:

```bash
cd /home/wekan/repos/wekan/tests/playwright
export HOME="/home/wekan/repos/wekan/.tools"
unset CHROME_DEVEL_SANDBOX
export PLAYWRIGHT_BROWSERS_PATH="/home/wekan/.var/app/com.visualstudio.code/cache/ms-playwright"
export WEKAN_PLAYWRIGHT_ALL=1

/home/wekan/repos/wekan/.tools/.meteor/meteor npm exec playwright test -- --project=webkit
```

validated result:

- `105 passed` (WebKit project)

## 10) Optional smoke test for headless Chromium in sandbox

```bash
cd /home/wekan/repos/wekan/tests/playwright
export PATH="/home/wekan/repos/wekan/.tools/node-v22.13.1-linux-x64/bin:$PATH"
unset CHROME_DEVEL_SANDBOX

node -e "(async()=>{const {chromium}=require('playwright');const b=await chromium.launch({headless:true,args:['--no-sandbox']});const p=await b.newPage();await p.goto('about:blank');console.log('PW_OK');await b.close();})().catch(e=>{console.error(e);process.exit(1);});"
```

If output is `PW_OK`, headless Chromium launch is working inside sandbox.

## 11) Additional findings from real test runs (important)

These were verified while running the full Playwright suite in this exact sandbox setup.

### A) Wekan app startup for tests requires `WRITABLE_PATH`

If `WRITABLE_PATH` is missing, app startup can fail with:

`WRITABLE_PATH environment variable missing and/or unset`

Use a local writable test directory before starting app:

```bash
cd /home/wekan/repos/wekan
export WRITABLE_PATH="$PWD/.test-writable"
mkdir -p "$WRITABLE_PATH/files/attachments" "$WRITABLE_PATH/files/avatars"
```

Then run app:

```bash
/home/wekan/.meteor/meteor --port 3000
```

### B) Playwright seed helpers require `mongosh`

Playwright fixtures seed test data via `tests/playwright/helpers/db.js`, which calls `mongosh`.
If missing, tests fail early with:

`Error: spawnSync mongosh ENOENT`

Install `mongosh` as a dependency in Playwright test project:

```bash
cd /home/wekan/repos/wekan
/home/wekan/.meteor/meteor npm --prefix tests/playwright install mongosh
```

The helper now also searches `tests/playwright/node_modules/.bin` so this works in sandbox without system-wide mongosh.

### C) If repo-local `.tools/node...` does not exist

In some sandboxes the `.tools` Node path is missing. You can still run commands via Meteor wrapper:

```bash
/home/wekan/.meteor/meteor npm -v
/home/wekan/.meteor/meteor npm exec playwright --version
```

### D) Proven working execution order

Terminal 1 (start app):

```bash
cd /home/wekan/repos/wekan
export WRITABLE_PATH="$PWD/.test-writable"
mkdir -p "$WRITABLE_PATH/files/attachments" "$WRITABLE_PATH/files/avatars"
unset CHROME_DEVEL_SANDBOX
/home/wekan/.meteor/meteor --port 3000
```

Terminal 2 (run tests):

```bash
cd /home/wekan/repos/wekan/tests/playwright
unset CHROME_DEVEL_SANDBOX
export PLAYWRIGHT_BROWSERS_PATH="/home/wekan/.var/app/com.visualstudio.code/cache/ms-playwright"
/home/wekan/.meteor/meteor npm exec playwright test -- --project=chromium
```

Expected result from this validated setup:

- `105 passed` (Chromium project)

## 12) About `meteor test` in this sandbox

`meteor test --driver-package meteortesting:mocha` can start successfully but still report `0 passing` in this environment due to test discovery/driver behavior.

For reliable headless validation inside this sandbox, prefer Playwright run described above.

If you get `EROFS` errors writing to `~/.meteor/packages` (read-only home mount), run Meteor from the repo-local copy and point `HOME` to `.tools`:

```bash
cd /home/wekan/repos/wekan
export HOME="$PWD/.tools"
unset METEOR_WAREHOUSE_DIR
export WRITABLE_PATH="$PWD/.test-writable"
mkdir -p "$WRITABLE_PATH/files/attachments" "$WRITABLE_PATH/files/avatars"
unset CHROME_DEVEL_SANDBOX

"$PWD/.tools/.meteor/meteor" test --once --driver-package meteortesting:mocha --full-app --test server/lib/tests/attachmentApi.authContext.tests.js
```

## 13) Quick copy-paste: prepare + run Chromium tests

Use this when you want one command block that prepares required paths/dependencies and runs Playwright Chromium tests.

Note: this assumes Wekan app is already running at `http://localhost:3000` in another terminal.

```bash
cd /home/wekan/repos/wekan

# Ensure test writable directories exist
export WRITABLE_PATH="$PWD/.test-writable"
mkdir -p "$WRITABLE_PATH/files/attachments" "$WRITABLE_PATH/files/avatars"

# Sandbox-safe browser env
unset CHROME_DEVEL_SANDBOX
export PLAYWRIGHT_BROWSERS_PATH="/home/wekan/.var/app/com.visualstudio.code/cache/ms-playwright"

# Ensure Playwright-side mongosh exists for DB seeding
/home/wekan/.meteor/meteor npm --prefix tests/playwright install mongosh

# Run Chromium tests
cd tests/playwright
/home/wekan/.meteor/meteor npm exec playwright test -- --project=chromium
```

If you also need to start app in a separate terminal:

```bash
cd /home/wekan/repos/wekan
export WRITABLE_PATH="$PWD/.test-writable"
mkdir -p "$WRITABLE_PATH/files/attachments" "$WRITABLE_PATH/files/avatars"
unset CHROME_DEVEL_SANDBOX
/home/wekan/.meteor/meteor --port 3000
```

## 14) Minimal copy-paste only (no explanations)

Terminal 1:

```bash
cd /home/wekan/repos/wekan
export WRITABLE_PATH="$PWD/.test-writable"
mkdir -p "$WRITABLE_PATH/files/attachments" "$WRITABLE_PATH/files/avatars"
unset CHROME_DEVEL_SANDBOX
/home/wekan/.meteor/meteor --port 3000
```

Terminal 2:

```bash
cd /home/wekan/repos/wekan
unset CHROME_DEVEL_SANDBOX
export PLAYWRIGHT_BROWSERS_PATH="/home/wekan/.var/app/com.visualstudio.code/cache/ms-playwright"
/home/wekan/.meteor/meteor npm --prefix tests/playwright install mongosh
/home/wekan/.meteor/meteor npm --prefix tests/playwright exec playwright test -- --project=chromium
```
