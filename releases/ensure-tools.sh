#!/bin/bash
#
# Shared helper: install required CLI tools for the CURRENT platform if they are
# not already installed. Supports Ubuntu (amd64/arm64, via apt) and macOS
# (amd64/arm64, via Homebrew). The package-manager commands are architecture
# independent — apt and brew install the correct binary for the running CPU.
#
# Usage (source it, then call ensure_tools with the tools you need):
#   . "$(dirname "$0")/ensure-tools.sh"
#   ensure_tools curl wget git gh snapcraft
#
# Known special-cased tools: gh (GitHub CLI apt repo), snapcraft (snap/brew).
# Everything else is installed by its own name via apt-get / brew.

_et_os() {
  case "$(uname -s)" in
    Linux)  echo linux ;;
    Darwin) echo macos ;;
    *)      echo unknown ;;
  esac
}

_et_have() { command -v "$1" >/dev/null 2>&1; }

# Ensure Homebrew exists and is on PATH (Apple Silicon: /opt/homebrew, Intel: /usr/local).
_et_brew_ensure() {
  if ! _et_have brew; then
    echo "  Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  fi
  [ -x /opt/homebrew/bin/brew ] && eval "$(/opt/homebrew/bin/brew shellenv)"
  [ -x /usr/local/bin/brew ] && eval "$(/usr/local/bin/brew shellenv)"
}

# Install the GitHub CLI on Ubuntu (gh is not in the default Ubuntu repos).
_et_apt_gh() {
  sudo mkdir -p -m 755 /etc/apt/keyrings
  curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
    | sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg >/dev/null
  sudo chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
    | sudo tee /etc/apt/sources.list.d/github-cli.list >/dev/null
  sudo apt-get update
  sudo apt-get install -y gh
}

# ensure_tools <tool> [<tool> ...] — install each tool if missing.
ensure_tools() {
  local os tool
  os="$(_et_os)"
  for tool in "$@"; do
    if _et_have "$tool"; then
      continue
    fi
    echo "Installing missing tool for $os: $tool"
    case "$os" in
      linux)
        case "$tool" in
          gh)        _et_apt_gh ;;
          snapcraft) sudo snap install snapcraft --classic ;;
          *)         sudo apt-get update && sudo apt-get install -y "$tool" ;;
        esac
        ;;
      macos)
        _et_brew_ensure
        brew install "$tool"
        ;;
      *)
        echo "  Unknown OS ($(uname -s)); please install '$tool' manually." >&2
        ;;
    esac
  done
}
