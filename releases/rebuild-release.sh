#!/bin/bash
if [ -n "${ZSH_VERSION:-}" ]; then exec /bin/bash "$0" "$@"; fi

# Check dependencies for every supported host family.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$SCRIPT_DIR/ensure-tools.sh"
if [ "$(_et_os)" = macos ]; then
  _et_brew_ensure
  command -v meteor >/dev/null 2>&1 || brew install meteor
  command -v zip >/dev/null 2>&1 || brew install zip
else
  ensure_tools npm zip
  if ! command -v meteor >/dev/null 2>&1; then
    sudo npm install -g meteor --unsafe-perm --foreground-script
  fi
fi

echo "Note: If you use other locale than en_US.UTF-8 , you need to additionally install en_US.UTF-8"
case "$(_et_linux_family)" in
  fedora|rhel) echo "      install glibc-langpack-en and enable en_US.UTF-8." ;;
  debian) echo "      run sudo dpkg-reconfigure locales." ;;
  arch) echo "      enable en_US.UTF-8 in /etc/locale.gen and run locale-gen." ;;
  alpine) echo "      Alpine uses musl; install musl-locales if the build requires locale data." ;;
esac
echo "      You can still use any other locale as your main locale."

echo "Building Wekan."
sudo chown -R $(id -u):$(id -g) $HOME/.npm $HOME/.meteor
rm -rf node_modules .meteor/local .build
(meteor update --npm 2>/dev/null || true) && meteor npm install
#METEOR_PROFILE=100 meteor build .build --directory
meteor build .build --directory
