#!/bin/bash
if [ -n "${ZSH_VERSION:-}" ]; then exec /bin/bash "$0" "$@"; fi

# Check dependencies for every supported host family.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$SCRIPT_DIR/ensure-tools.sh"
. "$SCRIPT_DIR/tools-env.sh"   # Meteor, npm cache and temporary files in .tools
if [ "$(_et_os)" = macos ]; then
  _et_brew_ensure
  command -v zip >/dev/null 2>&1 || brew install zip
else
  ensure_tools npm zip
fi
# Meteor as https://docs.meteor.com/about/install.html installs it: `npx meteor`,
# as this user, never sudo, into .tools/.meteor (see build.sh's Install dependencies):
# HOME is pointed at .tools for the installer only.
if [ ! -x "$WEKAN_TOOLS_DIR/.meteor/meteor" ]; then
  HOME="$WEKAN_TOOLS_DIR" npx -y meteor
  . "$SCRIPT_DIR/tools-env.sh"
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
mkdir -p "$npm_config_cache"
[ -w "$npm_config_cache" ] || sudo chown -R "$(id -u):$(id -g)" "$npm_config_cache"
rm -rf node_modules .meteor/local .build
(meteor update --npm 2>/dev/null || true) && meteor npm install
#METEOR_PROFILE=100 meteor build .build --directory
meteor build .build --directory
