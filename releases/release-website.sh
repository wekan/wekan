#!/bin/bash

# Release website with new WeKan version number and new API $HOME/repos/wekan/docs.
#
# Usage:
#   ./releases/release-website.sh 8.42 8.43

if [ $# -ne 2 ]; then
  echo "Syntax with Wekan previous and new version number:"
  echo "  ./releases/release-website.sh 8.42 8.43"
  exit 1
fi

OLD="$1"
NEW="$2"

sedi() {
  if [ "$(uname)" = "Darwin" ]; then
    sed -i '' "$@"
  else
    sed -i "$@"
  fi
}

# The website lives in the separate wekan.fi repo at ../w/wekan.fi (a sibling of
# the wekan repo). The remote (GitHub Actions) flow sets WEBDIR and WEKANREPODIR
# explicitly to point at the repos it checked out; otherwise detect the common
# local sibling layouts.
if [ -n "${WEBDIR:-}" ] && [ -n "${WEKANREPODIR:-}" ]; then
  echo "Using WEBDIR=$WEBDIR and WEKANREPODIR=$WEKANREPODIR from environment."
elif [ -d "$HOME/repos/w/wekan.fi" ]; then
  WEBDIR="$HOME/repos/w/wekan.fi"
  WEKANREPODIR="$HOME/repos/wekan"
elif [ -d "$HOME/Documents/repos/w/wekan.fi" ]; then
  WEBDIR="$HOME/Documents/repos/w/wekan.fi"
  WEKANREPODIR="$HOME/Documents/repos/wekan"
else
  echo "Website directory (../w/wekan.fi) not found, ignoring."
  exit 0
fi
#git pull
# Update MongoDB version string in $WEBDIR/install/index.html.
# Show the supported major versions ("MongoDB 7.x or 6.x"), not the snapcraft.yaml
# patch version and Ubuntu build (e.g. not "MongoDB 7.0.34 Ubuntu 2204 (or 6.x)").
# Pattern is self-healing: it re-normalizes whatever "MongoDB 7..." string is there.
sedi "s|MongoDB 7[^,]*,|MongoDB 7.x or 6.x,|g" $WEBDIR/install/index.html

# Update Meteor, Node.js, and NPM versions in $WEBDIR/install/index.html
# Strip the "METEOR@" prefix so the website shows e.g. "Meteor 3.5-rc.2", not "Meteor METEOR@3.5-rc.2".
METEOR_VERSION=$(grep -o 'METEOR@[^ "\\]*' $WEKANREPODIR/.meteor/release | head -1 | sed 's|^METEOR@||')
NODE_VERSION=$(grep -o 'NODE_VERSION=[^ \\]*' $WEKANREPODIR/Dockerfile | head -1 | cut -d= -f2 | tr -d '"')
NPM_VERSION=$(grep -o 'NPM_VERSION=[^ \\]*' $WEKANREPODIR/Dockerfile | head -1 | cut -d= -f2 | tr -d '"')

sedi "s|<span id=\"meteor-version\">[^<]*</span>|<span id=\"meteor-version\">$METEOR_VERSION</span>|g" $WEBDIR/install/index.html
sedi "s|<span id=\"node-version\">[^<]*</span>|<span id=\"node-version\">$NODE_VERSION</span>|g" $WEBDIR/install/index.html
sedi "s|<span id=\"npm-version\">[^<]*</span>|<span id=\"npm-version\">$NPM_VERSION</span>|g" $WEBDIR/install/index.html

# $WEBDIR/install/index.html
#   The WeKan version lives in <span class="version-number">v<x></span>.
#   Anchor on the class (the stable identifier), NOT on the old version number,
#   so this re-normalizes whatever version is currently there to v$NEW. The old
#   ">v$OLD</span>" pattern silently no-op'd whenever $OLD did not match the
#   (possibly already stale) value on the page, which is how the published page
#   got stuck at an old version while every release passed a newer $OLD that no
#   longer matched. This self-healing form recovers from any stale value.
sedi -E "s#(<span class=\"version-number\">)v[0-9][^<]*(</span>)#\1v${NEW}\2#g" $WEBDIR/install/index.html
if ! grep -qF "<span class=\"version-number\">v${NEW}</span>" $WEBDIR/install/index.html; then
  echo "Error: failed to set version-number span to v${NEW} in $WEBDIR/install/index.html." >&2
  exit 1
fi

# Also update Meteor and Node.js versions in the <h2 class="fw-bold"> line
sedi "s|\(Meteor \)[^,]*,|\1${METEOR_VERSION},|g" $WEBDIR/install/index.html
sedi "s|\(Node\.js \)[0-9][0-9]*\.[x0-9a-zA-Z.-]*|\1${NODE_VERSION}|g" $WEBDIR/install/index.html

# Update the Node.js DOWNLOAD URL paths so the install page's links stay valid
# after a Node.js version bump. The version appears both in the path (…/vX.Y.Z/)
# and in the filename (node-vX.Y.Z-linux-<arch>.tar.*). Handle BOTH the OFFICIAL
# nodejs.org build (amd64/arm64/s390x/ppc64le) and the UNOFFICIAL
# unofficial-builds.nodejs.org build (riscv64, which nodejs.org has no binary for).
# NODE_VERSION already includes the leading 'v' (e.g. v24.18.0). Patterns are
# anchored to Node URLs/filenames, so no other version numbers are touched, and
# they no-op if the page has no such links.
sedi -E "s#(nodejs\.org/dist/)v[0-9]+\.[0-9]+\.[0-9]+#\1${NODE_VERSION}#g" $WEBDIR/install/index.html
sedi -E "s#(unofficial-builds\.nodejs\.org/download/release/)v[0-9]+\.[0-9]+\.[0-9]+#\1${NODE_VERSION}#g" $WEBDIR/install/index.html
sedi -E "s#node-v[0-9]+\.[0-9]+\.[0-9]+-linux-#node-${NODE_VERSION}-linux-#g" $WEBDIR/install/index.html

# api/index.html
#   The version appears in href attributes and as link text, e.g.:
#     <a href="v8.42/">v8.42</a>
#   Replace "v8.42" only when followed by a non-digit character
#   (/, <, ", space, etc.) so that a future version like "v8.421"
#   would not be accidentally matched.
#   The capture group \1 restores the character that follows the version.
#   A second expression handles the rare case of the version at end of line.
sedi "s|v$OLD\([^0-9]\)|v$NEW\1|g; s|v$OLD$|v$NEW|g" $WEBDIR/api/index.html

# Create directory for the new API version under ../w/wekan.fi/api/v$NEW, copy
# the freshly built docs from public/api (wekan.html + wekan.yml), and rename
# the HTML entry point to index.html:
#   ../w/wekan.fi/api/v$NEW/index.html   (from public/api/wekan.html)
#   ../w/wekan.fi/api/v$NEW/wekan.yml    (from public/api/wekan.yml)
mkdir -p "$WEBDIR/api/v$NEW"
cp "$WEKANREPODIR/public/api/"* "$WEBDIR/api/v$NEW/"
mv "$WEBDIR/api/v$NEW/wekan.html" "$WEBDIR/api/v$NEW/index.html"

# Commit and push website changes live. Enabled in the remote (GitHub Actions)
# flow via RELEASE_PUSH_WEBSITE=1; the manual flow leaves publishing to the
# maintainer (who reviews and pushes ../w/wekan.fi by hand).
if [ "${RELEASE_PUSH_WEBSITE:-0}" = "1" ]; then
  (
    cd "$WEBDIR"
    git add --all
    if git diff --cached --quiet; then
      echo "No website changes to commit in $WEBDIR."
    else
      git commit -m "v$NEW"
      git push
    fi
  )
fi
