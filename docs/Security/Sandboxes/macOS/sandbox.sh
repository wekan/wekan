#!/bin/bash
#
# sandbox.sh - install VSCodium and start it in a macOS sandbox that can read
# and write only this WeKan checkout (~/Documents/repos/wekan).
#
#   Usage: docs/Security/Sandboxes/macOS/sandbox.sh [--setup-only|--check|--claude-token]
#
#     (no option)     set up what is missing, then start VSCodium in the sandbox
#     --setup-only    set up, and write the Finder launcher, but do not start it
#     --check         show what the sandbox allows and refuses, then exit
#     --claude-token  save a token from `claude setup-token` for Claude Code
#                     in the sandbox, then set up (see 2b below)
#
# The macOS counterpart of the Flatpak sandbox on Linux
# (docs/Security/Sandboxes/vscodium). The design, what is and is not
# protected, and why: README.md beside this file.
#
# Everything this writes is inside the checkout's .tools/ (ignored by git and
# by Meteor), except VSCodium itself, which Homebrew installs into
# /Applications when it is not there yet.
set -euo pipefail

if [ "$(uname -s)" != Darwin ]; then
	echo "sandbox.sh: this is the macOS sandbox. On Linux use docs/Security/Sandboxes/vscodium." >&2
	exit 1
fi

MODE=run
case "${1:-}" in
	'') ;;
	--setup-only) MODE=setup ;;
	--check) MODE=check ;;
	--claude-token) MODE=claude-token ;;
	*) echo "Usage: $0 [--setup-only|--check|--claude-token]" >&2; exit 2 ;;
esac

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
if [ "$REPO" != "$HOME/Documents/repos/wekan" ]; then
	echo "Note: the documented macOS checkout is ~/Documents/repos/wekan; this one is $REPO."
	echo "      The sandbox is made for $REPO."
fi
TOOLS="$REPO/.tools"
APP="${VSCODIUM_APP:-/Applications/VSCodium.app}"
PROFILE="$TOOLS/sandbox/vscodium-macos.sb"
LAUNCHER="$TOOLS/sandbox/WeKan VSCodium.command"
# Work from the checkout. Finder starts the launcher in the home directory,
# which the sandbox refuses: VSCodium (Node.js) then fails at its first
# process.cwd() with "EPERM: process.cwd failed with error operation not
# permitted, uv_cwd", and so would any other program started in the sandbox.
cd "$REPO"
mkdir -p "$TOOLS/tmp" "$TOOLS/home" "$TOOLS/sandbox" \
	"$TOOLS/vscodium/user-data" "$TOOLS/vscodium/extensions"

# 1) VSCodium, from Homebrew, when it is not installed yet.
if [ ! -x "$APP/Contents/MacOS/VSCodium" ]; then
	if ! command -v brew >/dev/null 2>&1; then
		echo "VSCodium is not in $APP and Homebrew is not installed." >&2
		echo "Install VSCodium from https://vscodium.com/ or Homebrew from https://brew.sh/, then run this again." >&2
		exit 1
	fi
	echo "Installing VSCodium with Homebrew ..."
	brew install --cask vscodium
fi

# 2) The commit author. Inside the sandbox ~/.gitconfig cannot be read, so
#    the name and e-mail are kept in this checkout's own .git/config.
for key in user.name user.email; do
	if [ -z "$(git -C "$REPO" config --local --get "$key" 2>/dev/null || true)" ]; then
		value="$(git config --global --get "$key" 2>/dev/null || true)"
		if [ -n "$value" ]; then
			git -C "$REPO" config --local "$key" "$value"
			echo "Set $key for this checkout: $value"
		else
			echo "Warning: no $key in ~/.gitconfig; set it with: git -C \"$REPO\" config $key ..." >&2
		fi
	fi
done

# 2b) Claude Code's sign-in. Claude Code keeps its login in the macOS Keychain,
#     which the sandbox cannot reach ("A keychain cannot be found to store
#     'user'"), so a login made inside the sandbox is lost at once. Instead a
#     long-lived token, made with `claude setup-token` outside the sandbox, is
#     kept in .tools/secrets/claude-oauth-token and given to the sandbox as
#     CLAUDE_CODE_OAUTH_TOKEN. Save it with: sandbox.sh --claude-token
CLAUDE_TOKEN_FILE="$TOOLS/secrets/claude-oauth-token"
if [ "$MODE" = claude-token ]; then
	(umask 077; mkdir -p "$TOOLS/secrets")
	# `claude setup-token` prints the token wrapped over several lines, so
	# reading one pasted line would keep only the first part of it ("401
	# Invalid bearer token"). Take it from the clipboard, or read lines until
	# an empty one, and drop the line breaks.
	token="$(pbpaste 2>/dev/null | tr -d '[:space:]' || true)"
	case "$token" in
		sk-ant-*) echo "Token taken from the clipboard." ;;
		*)
			echo 'Paste the token from `claude setup-token` (not shown), then press Return twice:'
			token=""
			while IFS= read -rs line && [ -n "$line" ]; do token="$token$line"; done
			token="$(printf '%s' "$token" | tr -d '[:space:]')"
			;;
	esac
	case "$token" in
		sk-ant-oat*) ;;
		*) echo "That is not a token from \`claude setup-token\` (it starts with sk-ant-oat); nothing saved." >&2; exit 1 ;;
	esac
	if [ "${#token}" -lt 90 ]; then
		echo "The token is only ${#token} characters, so part of it is missing; nothing saved." >&2
		echo "Copy all of it, every line, and run this again." >&2
		exit 1
	fi
	(umask 077; printf '%s\n' "$token" > "$CLAUDE_TOKEN_FILE")
	echo "Saved to $CLAUDE_TOKEN_FILE (readable only by you)."
	MODE=setup
fi
claude_env=()
if [ -s "$CLAUDE_TOKEN_FILE" ]; then
	claude_env=(CLAUDE_CODE_OAUTH_TOKEN="$(tr -d '[:space:]' < "$CLAUDE_TOKEN_FILE")")
	# With a token Claude Code would still show its login screen until its
	# onboarding is marked done, and the VS Code extension until its login
	# prompt is turned off.
	cj="$TOOLS/home/.claude.json"
	if [ ! -s "$cj" ]; then
		printf '{\n  "hasCompletedOnboarding": true\n}\n' > "$cj"
	elif [ "$(plutil -extract hasCompletedOnboarding raw -o - "$cj" 2>/dev/null)" != true ]; then
		cp "$cj" "$cj.bak"
		plutil -replace hasCompletedOnboarding -bool YES "$cj" 2>/dev/null ||
			echo "Note: add \"hasCompletedOnboarding\": true to $cj by hand." >&2
	fi
	vs="$TOOLS/vscodium/user-data/User/settings.json"
	mkdir -p "$(dirname "$vs")"
	if [ ! -s "$vs" ]; then
		printf '{\n  "claudeCode.disableLoginPrompt": true\n}\n' > "$vs"
	elif ! grep -q '"claudeCode.disableLoginPrompt"' "$vs"; then
		echo "Note: add \"claudeCode.disableLoginPrompt\": true to VSCodium's settings ($vs)." >&2
	fi
fi

# 3) The sandbox profile (Seatbelt, the language of sandbox-exec), written for
#    this checkout's own path. Everything is allowed except the file system
#    under /Users and /Volumes, of which only the checkout is opened again.
sb_string() { printf '"%s"' "$(printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g')"; }
ancestors=""
dir="$REPO"
while [ "$dir" != "/" ]; do
	dir="$(dirname "$dir")"
	ancestors="$ancestors (literal $(sb_string "$dir"))"
done
cat > "$PROFILE" <<EOF
;; Generated by docs/Security/Sandboxes/macOS/sandbox.sh - edit that, not this.
(version 1)
(allow default)
;; No user's files: not the home directory (Desktop, Documents, Downloads,
;; ~/.ssh, ~/.gitconfig, browser profiles, ~/Library), not other users' homes,
;; not /Users/Shared, not other disks.
(deny file-read* file-write* (subpath "/Users") (subpath "/Volumes"))
;; ...except this checkout, and the names of the folders on the way to it.
(allow file-read-metadata$ancestors)
(allow file-read* file-write* (subpath $(sb_string "$REPO")))
;; No ssh-agent: the socket of the login session's agent.
(deny file-read* file-write* network-outbound
	(regex #"^/private/tmp/com\\.apple\\.launchd\\.[^/]+/Listeners\$"))
EOF

# 4) A launcher Finder can open (double-click, or drag it to the Dock).
cat > "$LAUNCHER" <<EOF
#!/bin/bash
exec $(printf '%q' "$REPO/docs/Security/Sandboxes/macOS/sandbox.sh")
EOF
chmod +x "$LAUNCHER"

# What the sandboxed VSCodium, its terminals and its extensions see: HOME is
# .tools/home (as Flatpak gives an app its own home), temporary files are in
# .tools/tmp, and the tools in .tools/ come first on PATH. env -i drops the
# rest - SSH_AUTH_SOCK, and ELECTRON_RUN_AS_NODE when this is started from an
# editor's terminal, which would make VSCodium start as plain Node.js.
sandboxed() {
	sandbox-exec -f "$PROFILE" /usr/bin/env -i \
		HOME="$TOOLS/home" TMPDIR="$TOOLS/tmp" TMP="$TOOLS/tmp" TEMP="$TOOLS/tmp" \
		USER="$USER" LOGNAME="$USER" SHELL=/bin/zsh LANG="${LANG:-en_US.UTF-8}" \
		WEKAN_DIR="$REPO" WEKAN_TOOLS_DIR="$TOOLS" \
		npm_config_cache="$TOOLS/npm-cache" PLAYWRIGHT_BROWSERS_PATH="$TOOLS/ms-playwright" \
		PATH="$TOOLS/bin:$TOOLS/.meteor:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin" \
		${claude_env[@]+"${claude_env[@]}"} \
		"$@"
}

if [ "$MODE" = check ]; then
	echo "Profile: $PROFILE"
	sandboxed /bin/bash -c '
		try() { if eval "$2" >/dev/null 2>&1; then echo "  allowed  $1"; else echo "  refused  $1"; fi; }
		try "read ~/Desktop"           "ls \"'"$HOME"'/Desktop\""
		try "read ~/.ssh"              "ls \"'"$HOME"'/.ssh\""
		try "read ~/.gitconfig"        "cat \"'"$HOME"'/.gitconfig\""
		try "write the home directory" "touch \"'"$HOME"'/.wekan-sandbox-test\""
		try "read /Users/Shared"       "ls /Users/Shared"
		try "write this checkout"      "touch \"$WEKAN_TOOLS_DIR/tmp/.sandbox-test\" && rm \"$WEKAN_TOOLS_DIR/tmp/.sandbox-test\""
		try "git in this checkout"     "git -C \"$WEKAN_DIR\" status --short"
		try "the network"              "curl -fsS -o /dev/null https://github.com"
	'
	rm -f "$HOME/.wekan-sandbox-test" 2>/dev/null || true
	exit 0
fi

echo "Sandbox ready. Finder launcher: $LAUNCHER"
[ "$MODE" = setup ] && exit 0

# 5) VSCodium in the sandbox. --no-sandbox turns off Chromium's own sandbox
#    for its helper processes: it cannot start inside sandbox-exec ("sandbox
#    initialization failed: Operation not permitted"), and every process
#    VSCodium starts is inside this sandbox instead. Its settings and
#    extensions are in .tools/vscodium, not in ~/Library and ~/.vscode-oss.
#    --use-mock-keychain: the login keychain is in ~/Library/Keychains, which
#    the sandbox refuses, so Electron's safeStorage would ask for a keychain
#    to store "VSCodium Key" in ("A keychain cannot be found", with a "Reset
#    To Defaults" button that would replace the user's login keychain). With
#    it, Chromium's OSCrypt uses a mock keychain with a fixed key and never
#    touches the real one, so extension secrets in .tools/vscodium are only
#    obfuscated. (--password-store=basic does the same on Linux only.)
#    nohup and </dev/null: the launcher's Terminal window may close as soon
#    as this script exits, and VSCodium must not go with it.
sandboxed /usr/bin/nohup "$APP/Contents/MacOS/VSCodium" --no-sandbox --use-mock-keychain \
	--user-data-dir "$TOOLS/vscodium/user-data" \
	--extensions-dir "$TOOLS/vscodium/extensions" \
	"$REPO" </dev/null >"$TOOLS/sandbox/vscodium.log" 2>&1 &
echo "VSCodium started in the sandbox (log: $TOOLS/sandbox/vscodium.log)."
