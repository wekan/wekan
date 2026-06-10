#!/bin/bash
#
# Interactive helper to create the GitHub Actions secrets required by
# .github/workflows/release-all.yml. It walks you through creating ALL or ONE of
# the secrets, optionally sets them in GitHub via the gh CLI, and saves the
# results to ../wekan-github-secrets-YYYY-MM-DD_HH-MM-SS.txt
#
# Usage:
#   ./releases/create-github-secrets.sh
#
# ─────────────────────────────────────────────────────────────────────────────
# REQUIRED GITHUB SECRETS (used by .github/workflows/release-all.yml)
# ─────────────────────────────────────────────────────────────────────────────
# Add all of the secrets below in the GitHub repo at:
#   https://github.com/wekan/wekan/settings/secrets/actions
#   Menu path: GitHub repo -> Settings (top tab)
#                           -> Secrets and variables (left sidebar) -> Actions
#                           -> "New repository secret" (green button)
#   Set "Name" to the secret name shown below and "Secret" to the value produced
#   by its "Create the value" command, then click "Add secret".
#
# Note: base64 differs per OS. Use a SINGLE-LINE value (no trailing newline):
#   Linux:  printf '%s' 'user:token' | base64 -w0
#   macOS:  printf '%s' 'user:token' | base64        # already single line
#   (this script uses `base64 | tr -d '\n'`, which is correct on both.)
#
# ── DOCKERHUB_AUTH = base64("dockerhub-username:access-token") ───────────────
#   Create the token: https://app.docker.com/settings/personal-access-tokens
#     Menu path: Docker Hub -> top-right avatar -> Account settings
#                           -> Personal access tokens -> "Generate new token"
#                           -> Access permissions: Read & Write -> Generate.
#   Create the value:
#     printf '%s' 'DOCKERHUB_USERNAME:dckr_pat_xxx' | base64 -w0
#
# ── QUAY_AUTH = base64("robot-name:robot-token") ─────────────────────────────
#   Create the robot account: https://quay.io/organization/wekan?tab=robots
#     (for a user account: https://quay.io/user/<name>?tab=robots)
#     Menu path: Quay.io -> Account/Organization -> Robot Accounts
#                        -> "Create Robot Account" -> grant Write on wekan/wekan
#                        -> open the robot -> "Docker Configuration" shows the
#                           username (e.g. wekan+ci) and token.
#   Create the value:
#     printf '%s' 'wekan+ci:ROBOT_TOKEN' | base64 -w0
#
# ── GHCR_AUTH = base64("github-username:personal-access-token") ──────────────
#   Create the token (classic): https://github.com/settings/tokens
#     Menu path: GitHub -> top-right avatar -> Settings -> Developer settings
#                       -> Personal access tokens -> Tokens (classic)
#                       -> "Generate new token (classic)"
#                       -> scopes: write:packages, read:packages, delete:packages
#                       -> Generate token.
#   Create the value:
#     printf '%s' 'GITHUB_USERNAME:ghp_xxx' | base64 -w0
#
# ── SNAP_AUTH = Snap Store credentials (used as SNAPCRAFT_STORE_CREDENTIALS) ──
#   Create with the snapcraft CLI (install: sudo snap install snapcraft --classic):
#     snapcraft login        # log in to the Snap Store account that owns "wekan"
#     snapcraft export-login --snaps=wekan \
#       --acls=package_access,package_push,package_update,package_release \
#       --channels=edge,beta snap-store-credentials.txt
#   The value is the ENTIRE contents of snap-store-credentials.txt (paste as-is,
#   no base64). Manage at: https://snapcraft.io/wekan/listing
#
# ── LP_CREDENTIALS = base64 of the Launchpad credentials for remote-build ────
#   `snapcraft remote-build` builds the snap on Launchpad. Authenticate ONCE on a
#   machine with a browser (creates a Launchpad account at https://launchpad.net
#   if needed: top-right -> "Log in / Register"):
#     snapcraft remote-build --launchpad-accept-public-upload
#       # opens a browser; log in to Launchpad and authorize. This writes
#       # ~/.local/share/snapcraft/launchpad-credentials
#   Create the value:
#     base64 -w0 ~/.local/share/snapcraft/launchpad-credentials
#
# ── WEKAN_REPO_TOKEN = GitHub PAT with write access to wekan.fi + charts ──────
#   Used by the `website` and `charts` jobs in release-all.yml to push to the
#   separate wekan/wekan.fi and wekan/charts repos (the built-in GITHUB_TOKEN
#   only has access to wekan/wekan). Create a token owned by an account that has
#   write access to BOTH repos:
#     Fine-grained: https://github.com/settings/personal-access-tokens/new
#       Menu path: GitHub -> avatar -> Settings -> Developer settings
#                         -> Personal access tokens -> Fine-grained tokens
#                         -> "Generate new token"
#       Resource owner: wekan; Repository access: wekan/wekan.fi and wekan/charts
#       Permissions: Repository permissions -> Contents: Read and write.
#     Classic alternative: https://github.com/settings/tokens (scope: repo).
#   The value is the RAW token (no base64, no "user:" prefix), e.g.:
#     github_pat_xxx   (fine-grained)   or   ghp_xxx   (classic)
# ─────────────────────────────────────────────────────────────────────────────

set -u

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TIMESTAMP="$(date +%Y-%m-%d_%H-%M-%S)"
OUT_FILE="$REPO_DIR/../wekan-github-secrets-${TIMESTAMP}.txt"
GH_REPO="wekan/wekan"
SET_IN_GITHUB="no"
REPLY_SECRET=""

# Install the tools needed to create the secrets for the current platform
# (Ubuntu amd64/arm64 via apt, macOS amd64/arm64 via brew) if not present yet.
. "$(cd "$(dirname "$0")" && pwd)/ensure-tools.sh"
ensure_tools curl gh snapcraft

# Portable single-line base64 (works on both Linux and macOS).
b64() { base64 | tr -d '\n'; }

ensure_out_file() {
  if [ ! -f "$OUT_FILE" ]; then
    umask 077
    {
      echo "# WeKan GitHub Actions secrets"
      echo "# Created: $TIMESTAMP"
      echo "# Add at: https://github.com/${GH_REPO}/settings/secrets/actions"
      echo "#   Settings -> Secrets and variables -> Actions -> New repository secret"
      echo "# KEEP THIS FILE PRIVATE. Delete it once the secrets are stored in GitHub."
      echo
    } > "$OUT_FILE"
    chmod 600 "$OUT_FILE"
  fi
}

save_secret() {
  # $1 = NAME, $2 = VALUE (may be multi-line)
  local name="$1" value="$2"
  ensure_out_file
  {
    echo "########## ${name} ##########"
    printf '%s\n' "$value"
    echo
  } >> "$OUT_FILE"
  echo "  Saved ${name} -> ${OUT_FILE}"

  if [ "$SET_IN_GITHUB" = "yes" ]; then
    if printf '%s' "$value" | gh secret set "$name" --repo "$GH_REPO" >/dev/null 2>&1; then
      echo "  Set ${name} in GitHub repo ${GH_REPO}."
    else
      echo "  WARNING: 'gh secret set ${name}' failed; add it manually."
    fi
  fi
}

read_hidden() {
  # $1 = prompt; result in $REPLY_SECRET
  printf '%s' "$1" >&2
  read -rs REPLY_SECRET
  echo >&2
}

create_dockerhub() {
  echo "=== DOCKERHUB_AUTH = base64(\"username:token\") ==="
  echo "  Token: https://app.docker.com/settings/personal-access-tokens (Read & Write)"
  local user
  read -rp "  Docker Hub username: " user
  read_hidden "  Docker Hub access token (hidden): "
  save_secret "DOCKERHUB_AUTH" "$(printf '%s:%s' "$user" "$REPLY_SECRET" | b64)"
  REPLY_SECRET=""
}

create_quay() {
  echo "=== QUAY_AUTH = base64(\"robot-name:token\") ==="
  echo "  Robot (Write on wekan/wekan): https://quay.io/organization/wekan?tab=robots"
  local user
  read -rp "  Quay robot username (e.g. wekan+ci): " user
  read_hidden "  Quay robot token (hidden): "
  save_secret "QUAY_AUTH" "$(printf '%s:%s' "$user" "$REPLY_SECRET" | b64)"
  REPLY_SECRET=""
}

create_ghcr() {
  echo "=== GHCR_AUTH = base64(\"github-username:token\") ==="
  echo "  Classic token (write:packages, read:packages, delete:packages):"
  echo "    https://github.com/settings/tokens"
  local user
  read -rp "  GitHub username: " user
  read_hidden "  GitHub personal access token (hidden): "
  save_secret "GHCR_AUTH" "$(printf '%s:%s' "$user" "$REPLY_SECRET" | b64)"
  REPLY_SECRET=""
}

create_snap() {
  echo "=== SNAP_AUTH = snapcraft store credentials ==="
  if ! command -v snapcraft >/dev/null 2>&1; then
    echo "  snapcraft not found. Install: sudo snap install snapcraft --classic"
    return
  fi
  echo "  Logging in to the Snap Store account that owns the 'wekan' snap..."
  if ! snapcraft login; then
    echo "  snapcraft login failed; skipping SNAP_AUTH."
    return
  fi
  local tmp; tmp="$(mktemp)"
  if snapcraft export-login --snaps=wekan \
       --acls=package_access,package_push,package_update,package_release \
       --channels=edge,beta "$tmp"; then
    save_secret "SNAP_AUTH" "$(cat "$tmp")"
  else
    echo "  snapcraft export-login failed; skipping SNAP_AUTH."
  fi
  rm -f "$tmp"
}

create_lp() {
  echo "=== LP_CREDENTIALS = base64 of Launchpad credentials ==="
  local lp="$HOME/.local/share/snapcraft/launchpad-credentials"
  if [ ! -f "$lp" ] && command -v snapcraft >/dev/null 2>&1; then
    echo "  Not found: $lp"
    echo "  Authenticate once (opens a browser to log in to Launchpad):"
    echo "    snapcraft remote-build --launchpad-accept-public-upload"
    local run
    read -rp "  Run that now in $REPO_DIR? (y/N): " run
    case "$run" in
      y|Y) ( cd "$REPO_DIR" && snapcraft remote-build --launchpad-accept-public-upload ) || true ;;
    esac
  fi
  if [ -f "$lp" ]; then
    save_secret "LP_CREDENTIALS" "$(b64 < "$lp")"
  else
    echo "  No Launchpad credentials file; skipping LP_CREDENTIALS."
  fi
}

create_wekan_repo_token() {
  echo "=== WEKAN_REPO_TOKEN = GitHub PAT (write to wekan.fi + charts) ==="
  echo "  Fine-grained token, Contents: Read and write on wekan/wekan.fi + wekan/charts:"
  echo "    https://github.com/settings/personal-access-tokens/new"
  echo "  (Classic alternative: https://github.com/settings/tokens, scope: repo.)"
  read_hidden "  GitHub personal access token (hidden): "
  save_secret "WEKAN_REPO_TOKEN" "$REPLY_SECRET"
  REPLY_SECRET=""
}

create_all() {
  create_dockerhub
  create_quay
  create_ghcr
  create_snap
  create_lp
  create_wekan_repo_token
}

# ── Optionally set secrets in GitHub directly via the gh CLI ─────────────────
read -rp "Also set the secrets in GitHub now via the gh CLI? (y/N): " want_gh
case "$want_gh" in
  y|Y)
    if ! command -v gh >/dev/null 2>&1; then
      echo "gh CLI not found (https://cli.github.com/). Will only save to file."
    elif ! gh auth status >/dev/null 2>&1; then
      echo "gh is not authenticated. Run 'gh auth login' first. Will only save to file."
    else
      SET_IN_GITHUB="yes"
      echo "Secrets will also be set in ${GH_REPO} via gh."
    fi
    ;;
esac

# ── Menu loop ────────────────────────────────────────────────────────────────
while true; do
  echo
  echo "Create which GitHub secret?"
  echo "  1) DOCKERHUB_AUTH   (Docker Hub)"
  echo "  2) QUAY_AUTH        (Quay.io)"
  echo "  3) GHCR_AUTH        (GitHub Container Registry)"
  echo "  4) SNAP_AUTH        (Snap Store)"
  echo "  5) LP_CREDENTIALS   (Launchpad remote-build)"
  echo "  6) WEKAN_REPO_TOKEN (push to wekan.fi + charts)"
  echo "  a) ALL of the above"
  echo "  q) Quit"
  read -rp "> " choice
  case "$choice" in
    1) create_dockerhub ;;
    2) create_quay ;;
    3) create_ghcr ;;
    4) create_snap ;;
    5) create_lp ;;
    6) create_wekan_repo_token ;;
    a|A) create_all ;;
    q|Q) break ;;
    *) echo "Unknown choice: $choice" ;;
  esac
done

if [ -f "$OUT_FILE" ]; then
  echo
  echo "Secrets saved to: $OUT_FILE"
  echo "KEEP IT PRIVATE and delete it once the secrets are stored in GitHub:"
  echo "  https://github.com/${GH_REPO}/settings/secrets/actions"
else
  echo
  echo "No secrets were created."
fi
