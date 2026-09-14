## About markdown changes

Wekan v4.29 changes markdown rendering from [marked](https://github.com/markedjs/marked) to [markdown-it](https://github.com/markdown-it/markdown-it).

## About emoji

With markdown-it, also [markdown-it-emoji](https://github.com/markdown-it/markdown-it-emoji) plugin has been added, supporting [full list of GitHub emojis](https://github.com/markdown-it/markdown-it-emoji/blob/master/lib/data/full.json).

Example emoji code, that you can add for example to card name, card description etc:
```
:rainbow: :thumbsup: :100:
```
That shows emojis :rainbow: :thumbsup: :100:

## About other markdown-it plugins

For markdown-it, there are also other [syntax extensions](https://github.com/markdown-it/markdown-it#syntax-extensions) where some are listed at that markdown-it page, and [others at npmjs.com](https://www.npmjs.org/browse/keyword/markdown-it-plugin).

For example, how to get some [mermaid plugin](https://www.npmjs.com/search?q=markdown-it-mermaid) working so that some syntax works for https://mermaid-js.github.io/mermaid/ ?

## How you could add another plugin

Using newest Ubuntu amd64:

# Meteor 2

### 1. Install git and configure it
```
sudo apt -y install git

git config --global user.name "Yourfirstname Yourlastname"

git config --global user.email email-address-you-use-at-github@example.com

git config --global push.default simple

nano .ssh/config
```
There add your User (GitHub username) and IdentityFile (Your ssh private key. Not public key that has .pub).
For indentation, use one tab.
```
Host *
        IdentitiesOnly=yes

Host github.com
        Hostname github.com
        User xet7
        IdentityFile ~/.ssh/id_xet7ed
```
Save and Exit with Ctrl-o Enter Ctrl-x Enter

If you do not have ssh key, create it:
```
ssh-keygen
```
And press Enter about 3 times, until you have private key at `~/.ssh/id_rsa` and public key at `~/.ssh/id_rsa.pub`

Add public key `.pub` to your github account web interface.

Add path to Meteor:
```
nano .bashrc
```
There at bottom add:
```
export PATH=~/.meteor:$PATH
```
Save and Exit with Ctrl-o Enter Ctrl-x Enter

### 2. Create fork of `https://github.com/wekan/wekan` at GitHub web page

```
mkdir repos

cd repos

git clone git@github.com:YourGithubUsername/wekan.git

cd wekan
```
### 3. Run the menu: Setup -> Install dependencies, then Setup -> Build WeKan, then Dev server -> localhost:3000

`build.sh` shows a two-level menu. The top level is:

```
1) Setup   2) Dev server   3) Tests   4) Docker   5) Tools   6) Quit
```

Pick a category number, then the item number inside it (each submenu also has a `Back` entry to return to the top level). To build from source and run it:

```
# Install dependencies: Setup -> Install dependencies
./build.sh
1        # Setup
1        # Install dependencies

# Build WeKan: Setup -> Build WeKan
./build.sh
1        # Setup
2        # Build WeKan

# Run in development mode: Dev server -> localhost:3000
./build.sh
2        # Dev server
1        # localhost:3000
```

The **Setup -> Build WeKan** step compiles WeKan, and **Dev server -> localhost:3000** starts it in development mode with the `meteor` command, so it detects file changes and tries to rebuild automatically and reload the web browser. Still, sometimes it may need stopping with Ctrl-c and a full **Setup -> Build WeKan** again.

Building writes two directories, and the names are close enough to be worth
telling apart:

| | what it is |
| --- | --- |
| `.build/` | the RELEASE bundle, from `meteor build .build --directory`. `.build/bundle` is what gets deployed, tested and packaged. |
| `_build/` | rspack's compiled output, written by ANY Meteor compile — a dev run, a test run, a release build. Meteor reads the app's main modules from `_build/main-prod/`, so it is a HANDOFF rather than a leftover. |

Both are generated and gitignored; neither is ever edited or committed. `_build/`
must **not** be added to `.meteorignore` — ignoring it breaks the build outright,
and that file says why. It also holds a bundled second copy of every source
file, so any script that walks the repository should skip it.

If a dev server is already running, the **Dev server** options now stop it automatically before starting a fresh one — freeing **both** the app port and the rspack dev server's port `8080` (a leftover rspack dev server on 8080 otherwise makes the new server crash with `Error: listen EADDRINUSE ... :8080`), so you don't have to kill the old processes yourself.

The other **Dev server** options run WeKan the same way on different addresses/ports: `localhost:3000 + trace warnings`, `localhost:3000 + bundle visualizer`, `CURRENT-IP:3000`, `CURRENT-IP:3000 + MONGO_URL 27019`, and `CUSTOM-IP:PORT` (which asks you for the IP and port). There is also a **Kill all dev servers** option that frees every dev/test port the script uses at once (3000/3001, 3100/3101, 4000/4001 and 8080) — handy if a previous run left something behind.

And then [register and login](../Features/Login/Adding-users.md) at http://localhost:3000

### OPTIONAL, NOT NEEDED: 5. Add new plugin package
```
meteor npm install markdown-it-something --save
```

Edit file `wekan/packages/markdown/src-integration.js` and add using that new package, using code example from that new plugin page, or similar like emoji plugin was added.

### 7. Test

Test does that new plugin syntax work, for example in card title, card description etc on other input fields.

### 8. If it works, create pull request

If normal markdown, emoji, and your new added plugin syntax all work, commit your changes:
```
git add --all

git commit -m "Added plugin markdown-it-something."

git push
```
And then at your GitHub for `https://github.com/YOUR-GITHUB-USERNAME/wekan` click `Create pull request`.

# Meteor 3

At 2024-06-26, it looks like from https://nodejs.org/en that Node.js LTS version is 20.15.0 , so change to newest Node.js LTS, delete old Meteor:
```
sudo n 20.15.0

sudo npm -g install npm

cd

rm -rf .meteor
```
Check how to install newest Meteor from Meteor 3 PR at https://github.com/meteor/meteor/pull/13163 , for example:
```
npx meteor@rc
```
Check what branches there are:
```
cd repos/wekan

git branch -a
```
Change to Meteor 3 branch:
```
git checkout feature-meteor3
```
Build wekan (Setup -> Build WeKan):
```
./build.sh
1        # Setup
2        # Build WeKan
```
If there are errors, try to fix them.

Or try to run wekan (Dev server -> localhost:3000):
```
./build.sh
2        # Dev server
1        # localhost:3000
```
# Updating

There are usually updates both for npm packages and Meteor

Updating npm packages:
```
npm update
```
Checking for vulnerable packages:
```
npm audit
```
Fixing vulnerable npm packages by updating to newer packages:
```
npm audit fix
```
If that did not help, use force:
```
npm audit fix --force
```
If that did not help, read links from that `npm audit` command did show, remove deprecated dependencies, update to other maintained dependencies.

Updating to next Meteor release:
```
meteor update
```
Updating to specific Meteor release:
```
meteor update --release METEOR@3.0-rc.4
```
Trying to update all Meteor packages:
```
meteor update --release METEOR@3.0-rc.4 --all-packages
```
Allowing incompatible updates, that may sometime work:
```
meteor update --release METEOR@3.0-rc.4 --all-packages --allow-incompatible-update
```
If you are changing Meteor and Node.js versions, you may need to reset Meteor:
```
meteor reset
```
Or alternatively, delete wekan repo (if you did not need any changes you made), and clone wekan repo again, and then build etc.

The `build.sh` development bundle option announces cache removal, compilation to resolve Meteor plugin npm
dependencies, dependency installation and compilation before each starts.
Each stage streams its output to the terminal and the printed build log:
`.tools/log/build-dev-bundle/YYYY-MM-DD_HH-MM-SS/dev.txt` for development bundles and
`.tools/log/build-release-bundle/YYYY-MM-DD_HH-MM-SS/release.txt` for release bundles.
Both scripts print the selected build log path again when the build finishes, including
failed builds. Successful shell builds also append that completion message to the log.
Each build gets its own time directory, keeping earlier runs separate. Same-second
builds reserve a directory with a numeric suffix to avoid collisions. EVERYTHING also keeps its existing run-level `wekan-build.log`. Quiet stages report elapsed time and their process ID every
15 seconds; this indicates that the command is running, rather than a percentage
of completion. Required cache removal or dependency installation failures stop
the build. Meteor plugin npm dependency compilation remains best effort and reports a warning
when it fails. Release bundle preparation uses the same progress reporting and makes
Meteor’s read-only server package manifest writable before updating node-gyp and
installing the server dependencies, matching the release workflow.

Build stages print the exact command before it starts. npm uses verbose logging
and runs dependency lifecycle scripts in the foreground so their output is
visible. Meteor bundle compilation uses its supported `--verbose` option;
`meteor update --npm` has no verbose option and compiles the app to resolve
plugin npm dependencies. `METEOR_PROFILE` defaults to 100 milliseconds, exposing
Meteor tool timing diagnostics when available. Profiling output may appear only
when a measured operation finishes; elapsed status still appears while it is quiet.

During builds, Node module debugging prints module resolution as it happens. The
local `tools/build-command-output.cjs` preload prints resolver subprocess commands
and echoes their captured stdout and stderr while preserving exit codes and callback
results. Both terminal and build log receive this output. Command arguments redact
common credential fields; the tracer does not print the process environment.

All logging managed by `build.sh` and `build.bat` uses
`.tools/log/<operation>/YYYY-MM-DD_HH-MM-SS/`. Both honor `WEKAN_LOG_ROOT`.
Same-second runs reserve a numeric suffix; previous run directories stay intact.

| Operation | Directory type | Main log |
| --- | --- | --- |
| Development bundle | `build-dev-bundle` | `dev.txt` |
| Release bundle | `build-release-bundle` | `release.txt` |
| Development server | `dev-server` | `wekan-dev-server.log` (shell), `dev.txt` (Windows) |
| Single test | `test-<test-name>` | `wekan-<test-name>.log` |
| Full test matrix | `test-all-<mode>` | Existing per-job logs |
| EVERYTHING (shell or Windows via Bash) | `test-everything-<mode>` | Existing per-stage logs |
| All browsers (shell) | `test-playwright-all` | Existing per-browser logs |

`WEKAN_LOGDIR` keeps child test jobs in the parent run directory. Windows build
commands stream through PowerShell to the selected log; command exit status is
retained. Native Windows execution was not available for this change; directory
reservation logic and Windows menu/logger wiring are tested locally.

Log directory naming is shared by Unix and Windows builds and release tools:
`.tools/log/<operation>/YYYY-MM-DD_HH-MM-SS/`, using local time. Same-second
starts reserve distinct directories with `-1`, `-2`, etc. to preserve earlier
logs. Translation upload reports use `translations-push`, mirror archive/sync
reports use `mirror-data`, mirror launcher output uses `mirror`, database
conformance uses `test-db-conformance`, and speed diagnostics use `debug-speed`.
Existing log directories remain where they were written. Dates inside JSON
records retain their data format; this naming rule applies to log directories.
