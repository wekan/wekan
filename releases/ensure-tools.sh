#!/bin/bash
. "$(dirname "${BASH_SOURCE[0]}")/tools-env.sh"   # temporary files and downloads go to .tools/tmp
#
# Shared helper: install required CLI tools for the current platform if missing.
# Supports Debian/Ubuntu, Fedora, RHEL/Oracle Linux, Alpine, Arch (and the
# Arch-based Omarchy, EndeavourOS, CachyOS, Manjaro ...), and macOS.
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
      # Omarchy (https://omarchy.org) is Arch with Hyprland on top: pacman,
      # the Arch repositories and yay for the AUR. Named explicitly so it is
      # recognised whether its os-release says ID=omarchy, ID=arch or ID_LIKE=arch.
      *omarchy*|*arch*|*manjaro*|*endeavouros*|*cachyos*) echo arch; return ;;
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

# Omarchy is detected by its own tooling, for the messages that name its
# update command; everything else treats it as the Arch family it is.
_et_is_omarchy() {
  _et_have omarchy-update || [ -d "${HOME:-/nonexistent}/.local/share/omarchy" ]
}

# Install Arch packages WITHOUT a partial upgrade. `pacman -Sy <pkg>` refreshes
# the package lists but upgrades nothing else, which Arch does not support: the
# new package can be linked against libraries newer than the installed ones
# (https://wiki.archlinux.org/title/System_maintenance#Partial_upgrades_are_unsupported).
# So: `-S --needed` against the lists the system already has. A container that
# has never synced (archlinux:latest ships with no sync databases) gets a full
# `-Syu`, which is the supported way to sync, and so does WEKAN_PACMAN_SYU=1.
_et_pacman() {
  local sync_dir="${WEKAN_PACMAN_SYNC_DIR:-/var/lib/pacman/sync}"
  if [ "${WEKAN_PACMAN_SYU:-0}" = 1 ] || ! ls "$sync_dir"/*.db >/dev/null 2>&1; then
    sudo pacman -Syu --needed --noconfirm "$@"
    return
  fi
  if ! sudo pacman -S --needed --noconfirm "$@"; then
    echo "pacman could not install: $*" >&2
    if _et_is_omarchy; then
      echo "  The package lists are probably older than the mirrors. Update first with omarchy-update" >&2
    else
      echo "  The package lists are probably older than the mirrors. Update first with sudo pacman -Syu" >&2
    fi
    echo "  (or rerun with WEKAN_PACMAN_SYU=1 to do that full upgrade here), then run this again." >&2
    return 1
  fi
}

# Install from the AUR with the helper that is there: Omarchy ships yay, other
# Arch installs often have paru. Neither runs as root, so no sudo here.
_et_aur() {
  local helper
  for helper in yay paru; do
    if _et_have "$helper"; then
      "$helper" -S --needed --noconfirm "$@"
      return
    fi
  done
  echo "No AUR helper (yay or paru) found; install $* from https://aur.archlinux.org manually." >&2
  return 1
}

# The OpenSSH server unit is ssh.service on Debian/Ubuntu and sshd.service on
# Arch/Omarchy, Fedora, RHEL and Alpine.
_et_ssh_unit() {
  if [ "$(_et_linux_family)" = debian ]; then echo ssh; else echo sshd; fi
}

# How to make en_US.UTF-8 available, per distribution, for the build notes.
_et_locale_hint() {
  case "$(_et_linux_family)" in
    debian) echo "run sudo dpkg-reconfigure locales." ;;
    fedora|rhel) echo "install glibc-langpack-en and enable en_US.UTF-8." ;;
    arch) echo "uncomment en_US.UTF-8 in /etc/locale.gen and run sudo locale-gen." ;;
    alpine) echo "Alpine uses musl; install musl-locales if the build requires locale data." ;;
    *) echo "generate the en_US.UTF-8 locale with your distribution's tools." ;;
  esac
}

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
              go) sudo "$pm" install -y golang ;;
              ssh|scp|sftp) sudo "$pm" install -y openssh-clients ;;
              node) sudo "$pm" install -y nodejs ;;
              7zip) [ "$family" = fedora ] && package=7zip || package=p7zip; sudo "$pm" install -y "$package" ;;
              *) sudo "$pm" install -y "$tool" ;;
            esac
            ;;
          alpine)
            case "$tool" in
              gh) package=github-cli ;;
              ssh|scp|sftp) package=openssh-client ;;
              node) package=nodejs ;;
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
              ssh|scp|sftp) package=openssh ;;
              node) package=nodejs ;;
              python3) package=python ;;
              g++) package=gcc ;;
              awk) package=gawk ;;
              pip3|python3-pip) package=python-pip ;;
              # Arch replaced p7zip with 7zip (7-Zip itself) in its repositories.
              7zip) package=7zip ;;
              snapcraft)
                # snapd is in the AUR, not the Arch repositories.
                _et_aur snapd || return 1
                sudo systemctl enable --now snapd.socket
                sudo ln -sfn /var/lib/snapd/snap /snap
                sudo snap install snapcraft --classic
                continue
                ;;
              *) package="$tool" ;;
            esac
            _et_pacman "$package"
            ;;
          debian)
            case "$tool" in
              gh) _et_apt_gh ;;
              go) sudo apt-get update && sudo apt-get install -y golang-go ;;
              ssh|scp|sftp) sudo apt-get update && sudo apt-get install -y openssh-client ;;
              node) sudo apt-get update && sudo apt-get install -y nodejs ;;
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
          ssh|scp|sftp) package=openssh ;;
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

_forge_go_arch() {
  case "$1" in
    x86_64|amd64) echo amd64 ;;
    aarch64|arm64) echo arm64 ;;
    i386|i486|i586|i686|x86) echo 386 ;;
    armv6l|armv7l|armv8l) echo armv6l ;;
    ppc64le|ppc64el) echo ppc64le ;;
    loongarch64|loong64) echo loong64 ;;
    *) echo "$1" ;;
  esac
}

# Older Debian/Ubuntu Go packages cannot download newer module toolchains.
# Bootstrap from the official current stable archive when Go predates 1.21.
ensure_forge_go() {
  local version minor os arch metadata filename checksum archive actual go_dir
  if command -v go >/dev/null 2>&1; then
    version="$(go env GOVERSION 2>/dev/null)"
    minor="${version#go1.}"; minor="${minor%%.*}"
    case "$minor" in ''|*[!0-9]*) ;; *) [ "$minor" -ge 21 ] && return 0 ;; esac
  fi
  os="$(_et_os)"; [ "$os" = macos ] && os=darwin
  arch="$(_forge_go_arch "$(uname -m)")"
  metadata="$(curl -fsSL 'https://go.dev/dl/?mode=json')" || return 1
  filename="$(printf '%s' "$metadata" | jq -r --arg os "$os" --arg arch "$arch" '[.[] | select(.stable) | .files[] | select(.os == $os and .arch == $arch and .kind == "archive")][0].filename // empty')"
  checksum="$(printf '%s' "$metadata" | jq -r --arg file "$filename" '[.[].files[] | select(.filename == $file)][0].sha256 // empty')"
  case "$filename" in *[!a-zA-Z0-9._-]*) return 1 ;; esac
  case "$filename" in go*.*.tar.gz) ;; *) echo "No official Go archive for $os/$arch; install a supported native Go toolchain." >&2; return 1 ;; esac
  [ "${#checksum}" -eq 64 ] || return 1
  go_dir="$WEKAN_TOOLS_DIR/forge-go/${filename%.tar.gz}"
  if [ ! -x "$go_dir/go/bin/go" ]; then
    mkdir -p "$go_dir" "$WEKAN_TOOLS_DIR/tmp" || return 1
    archive="$WEKAN_TOOLS_DIR/tmp/$filename"
    curl -fL "https://go.dev/dl/$filename" -o "$archive" || return 1
    if command -v sha256sum >/dev/null 2>&1; then actual="$(sha256sum "$archive")"
    elif command -v shasum >/dev/null 2>&1; then actual="$(shasum -a 256 "$archive")"
    else echo "A SHA-256 tool is required to verify Go." >&2; return 1; fi
    [ "${actual%% *}" = "$checksum" ] || { echo "Go archive checksum mismatch." >&2; return 1; }
    tar -xzf "$archive" -C "$go_dir" || return 1
    rm -f "$archive"
  fi
  export GOROOT="$go_dir/go"
  export PATH="$go_dir/go/bin:$PATH"
  "$go_dir/go/bin/go" version
}


# Install the native compiler and archive tools used by bundle scripts.
ensure_build_toolchain() {
  local pm
  case "$(_et_os):$(_et_linux_family)" in
    linux:alpine) sudo apk add --no-cache bash build-base python3 curl wget p7zip zip unzip ;;
    linux:arch) _et_pacman base-devel python curl wget 7zip zip unzip ;;
    linux:fedora) sudo dnf group install -y development-tools; sudo dnf install -y gcc gcc-c++ make python3 curl wget 7zip zip unzip ;;
    linux:rhel) pm=dnf; _et_have dnf || pm=yum; sudo "$pm" groupinstall -y "Development Tools"; sudo "$pm" install -y gcc gcc-c++ make python3 curl wget p7zip zip unzip ;;
    linux:debian) sudo apt-get update; sudo apt-get install -y libatomic1 build-essential g++ make python3 curl wget p7zip-full zip unzip ;;
    macos:*) _et_brew_ensure; brew install make python curl wget sevenzip zip ;;
    *) echo "Unsupported platform: install a C/C++ toolchain, Python 3, curl, wget, 7zip, zip and unzip." >&2; return 1 ;;
  esac
}

# Install the download/archive tools used by Sandstorm and bundle conversion.
ensure_archive_tools() {
  local pm
  case "$(_et_os):$(_et_linux_family)" in
    linux:alpine) sudo apk add --no-cache curl wget p7zip zip unzip ;;
    linux:arch) _et_pacman curl wget 7zip zip unzip ;;
    linux:fedora) sudo dnf install -y curl wget 7zip zip unzip ;;
    linux:rhel) pm=dnf; _et_have dnf || pm=yum; sudo "$pm" install -y curl wget p7zip zip unzip ;;
    linux:debian) sudo apt-get update; sudo apt-get install -y curl wget p7zip-full zip unzip ;;
    macos:*) _et_brew_ensure; brew install curl wget sevenzip zip ;;
    *) echo "Unsupported platform: install curl, wget, 7zip, zip and unzip." >&2; return 1 ;;
  esac
}

# The shared libraries Playwright's Chromium and Firefox load, for the
# distributions where `playwright install --with-deps` cannot install them
# (it runs apt-get). Debian/Ubuntu keep using --with-deps.
ensure_playwright_system_deps() {
  local pm
  case "$(_et_os):$(_et_linux_family)" in
    linux:arch)
      # Arch and Omarchy. A desktop Omarchy already has nearly all of these;
      # --needed makes that a no-op rather than a reinstall.
      _et_pacman nss at-spi2-core libcups libdrm libxkbcommon libxcomposite \
        libxdamage libxrandr libxfixes mesa pango cairo alsa-lib gtk3 dbus-glib ;;
    linux:fedora|linux:rhel)
      pm=dnf; _et_have dnf || pm=yum
      sudo "$pm" install -y nss atk at-spi2-atk cups-libs libdrm libxkbcommon \
        libXcomposite libXdamage libXrandr libXfixes mesa-libgbm pango cairo \
        alsa-lib gtk3 dbus-glib ;;
    linux:alpine)
      echo "Playwright publishes no musl browsers; use WEKAN_PLAYWRIGHT_DOCKER=1 on Alpine." >&2 ;;
    *) : ;;
  esac
}
