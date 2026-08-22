#!/bin/bash
#
# Shared helper: install required CLI tools for the current platform if missing.
# Supports Debian/Ubuntu, Fedora, RHEL/Oracle Linux, Alpine, Arch, and macOS.
# The package-manager commands are architecture independent.
#
# Usage (source it, then call ensure_tools with the tools you need):
#   . "$(dirname "$0")/ensure-tools.sh"
#   ensure_tools curl wget git gh snapcraft
#
# Known special-cased tools include package names that differ between package
# managers. Everything else is installed by its command name.

_et_os() {
  case "${WEKAN_UNAME_S:-$(uname -s)}" in
    Linux)  echo linux ;;
    Darwin) echo macos ;;
    *)      echo unknown ;;
  esac
}
_et_linux_family() {
  local os_release="${WEKAN_OS_RELEASE_FILE:-/etc/os-release}"
  if [ -r "$os_release" ]; then
    ID=""; ID_LIKE=""
    # shellcheck disable=SC1090
    . "$os_release"
    case "${ID:-} ${ID_LIKE:-}" in
      *alpine*) echo alpine; return ;;
      *arch*) echo arch; return ;;
      *ol*|*oracle*|*rhel*|*centos*|*rocky*|*almalinux*) echo rhel; return ;;
      *fedora*) echo fedora; return ;;
      *debian*|*ubuntu*) echo debian; return ;;
    esac
  fi
  if _et_have apk; then echo alpine
  elif _et_have pacman; then echo arch
  elif _et_have dnf || _et_have yum; then echo rhel
  elif _et_have apt-get; then echo debian
  else echo unknown
  fi
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
  local os tool check family pm package major os_release linux_id
  os="$(_et_os)"
  for tool in "$@"; do
    check="$tool"; [ "$tool" = ripgrep ] && check=rg
    if _et_have "$check"; then
      continue
    fi
    echo "Installing missing tool for $os: $tool"
    case "$os" in
      linux)
        family="$(_et_linux_family)"
        case "$family" in
          fedora|rhel)
            pm=dnf; _et_have dnf || pm=yum
            case "$tool" in
              snapcraft)
                if [ "$family" = rhel ]; then
                  major="$(rpm -E %rhel)"
                  os_release="${WEKAN_OS_RELEASE_FILE:-/etc/os-release}"
                  linux_id="$(. "$os_release"; echo "${ID:-}")"
                  if [ "$linux_id" = ol ]; then
                    sudo "$pm" install -y "oracle-epel-release-el${major}"
                    sudo "$pm" config-manager --set-enable "ol${major}_developer_EPEL" || true
                  else
                    sudo "$pm" install -y "https://dl.fedoraproject.org/pub/epel/epel-release-latest-${major}.noarch.rpm"
                  fi
                fi
                sudo "$pm" install -y snapd
                sudo systemctl enable --now snapd.socket
                sudo ln -sfn /var/lib/snapd/snap /snap
                sudo snap install snapcraft --classic
                ;;
              g++) package=gcc-c++ ; sudo "$pm" install -y "$package" ;;
              7zip) [ "$family" = fedora ] && package=7zip || package=p7zip; sudo "$pm" install -y "$package" ;;
              *) sudo "$pm" install -y "$tool" ;;
            esac
            ;;
          alpine)
            case "$tool" in
              gh) package=github-cli ;;
              awk) package=gawk ;;
              pip3|python3-pip) package=py3-pip ;;
              7zip) package=p7zip ;;
              snapcraft) echo "snapcraft is not packaged for Alpine; use an Ubuntu VM/container." >&2; return 1 ;;
              *) package="$tool" ;;
            esac
            sudo apk add --no-cache "$package"
            ;;
          arch)
            case "$tool" in
              gh) package=github-cli ;;
              python3) package=python ;;
              g++) package=gcc ;;
              awk) package=gawk ;;
              pip3|python3-pip) package=python-pip ;;
              7zip) package=p7zip ;;
              snapcraft) echo "Install snapd from AUR, enable snapd.socket, then install snapcraft." >&2; return 1 ;;
              *) package="$tool" ;;
            esac
            sudo pacman -Sy --needed --noconfirm "$package"
            ;;
          debian)
            case "$tool" in
              gh) _et_apt_gh ;;
              snapcraft) sudo apt-get update; sudo apt-get install -y snapd; sudo systemctl enable --now snapd.socket; sudo snap install snapcraft --classic ;;
              *) sudo apt-get update && sudo apt-get install -y "$tool" ;;
            esac
            ;;
          *) echo "Unknown Linux distribution; install $tool manually." >&2; return 1 ;;
        esac
        ;;
      macos)
        _et_brew_ensure
        case "$tool" in
          python3|pip3|python3-pip) package=python ;;
          awk) package=gawk ;;
          g++) package=gcc ;;
          7zip) package=sevenzip ;;
          npm) package=node ;;
          *) package="$tool" ;;
        esac
        brew install "$package"
        ;;
      *)
        echo "  Unknown OS ($(uname -s)); please install '$tool' manually." >&2
        ;;
    esac
  done
}


# Install the native compiler and archive tools used by bundle scripts.
ensure_build_toolchain() {
  local pm
  case "$(_et_os):$(_et_linux_family)" in
    linux:alpine) sudo apk add --no-cache bash build-base python3 curl wget p7zip zip unzip ;;
    linux:arch) sudo pacman -Sy --needed --noconfirm base-devel python curl wget p7zip zip unzip ;;
    linux:fedora) sudo dnf group install -y development-tools; sudo dnf install -y gcc gcc-c++ make python3 curl wget 7zip zip unzip ;;
    linux:rhel) pm=dnf; _et_have dnf || pm=yum; sudo "$pm" groupinstall -y "Development Tools"; sudo "$pm" install -y gcc gcc-c++ make python3 curl wget p7zip zip unzip ;;
    linux:debian) sudo apt-get update; sudo apt-get install -y build-essential g++ make python3 curl wget p7zip-full zip unzip ;;
    macos:*) _et_brew_ensure; brew install make python curl wget sevenzip zip ;;
    *) echo "Unsupported platform: install a C/C++ toolchain, Python 3, curl, wget, 7zip, zip and unzip." >&2; return 1 ;;
  esac
}

# Install the download/archive tools used by Sandstorm and bundle conversion.
ensure_archive_tools() {
  local pm
  case "$(_et_os):$(_et_linux_family)" in
    linux:alpine) sudo apk add --no-cache curl wget p7zip zip unzip ;;
    linux:arch) sudo pacman -Sy --needed --noconfirm curl wget p7zip zip unzip ;;
    linux:fedora) sudo dnf install -y curl wget 7zip zip unzip ;;
    linux:rhel) pm=dnf; _et_have dnf || pm=yum; sudo "$pm" install -y curl wget p7zip zip unzip ;;
    linux:debian) sudo apt-get update; sudo apt-get install -y curl wget p7zip-full zip unzip ;;
    macos:*) _et_brew_ensure; brew install curl wget sevenzip zip ;;
    *) echo "Unsupported platform: install curl, wget, 7zip, zip and unzip." >&2; return 1 ;;
  esac
}
