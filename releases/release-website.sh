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

# Go to website directory and pull latest changes
if [ -d "$HOME/repos/wekan/docs" ]; then
  cd "$HOME/repos/wekan/docs" || exit 1
elif [ -d "$HOME/Documents/repos/wekan/docs" ]; then
  cd "$HOME/Documents/repos/wekan/docs" || exit 1
else
  echo "Website directory not found, ignoring."
  exit 0
fi
git pull
# Update MongoDB version in install/index.html from snapcraft.yaml
MONGO_LINE=$(grep -o 'mongodb-linux-x86_64-ubuntu[0-9]\+-7\.[0-9][0-9]*\.[0-9][0-9]*' ../../snapcraft.yaml | head -1)
if [ -n "$MONGO_LINE" ]; then
  UBUNTU_VER=$(echo "$MONGO_LINE" | sed -E 's/.*ubuntu([0-9]+)-7\..*/\1/')
  MONGODB_VERSION=$(echo "$MONGO_LINE" | sed -E 's/.*-7/7/')
  # Update MongoDB version string (e.g. MongoDB 7.0.31 Ubuntu 2204)
  sedi "s|MongoDB 7\\.x|MongoDB $MONGODB_VERSION Ubuntu $UBUNTU_VER|g" install/index.html
fi

# Update Meteor, Node.js, and NPM versions in install/index.html
METEOR_VERSION=$(grep -o 'METEOR@[^ "\\]*' ../../.meteor/release | head -1)
NODE_VERSION=$(grep -o 'NODE_VERSION=[^ \\]*' ../../Dockerfile | head -1 | cut -d= -f2 | tr -d '"')
NPM_VERSION=$(grep -o 'NPM_VERSION=[^ \\]*' ../../Dockerfile | head -1 | cut -d= -f2 | tr -d '"')

sedi "s|<span id=\"meteor-version\">[^<]*</span>|<span id=\"meteor-version\">$METEOR_VERSION</span>|g" install/index.html
sedi "s|<span id=\"node-version\">[^<]*</span>|<span id=\"node-version\">$NODE_VERSION</span>|g" install/index.html
sedi "s|<span id=\"npm-version\">[^<]*</span>|<span id=\"npm-version\">$NPM_VERSION</span>|g" install/index.html

# install/index.html
#   The version appears inside a specific HTML span tag.
#   This pattern is already precise enough to match only the WeKan version.
sedi "s|>v$OLD<\/span>|>v$NEW<\/span>|g" install/index.html

# Also update Meteor and Node.js versions in the <h2 class="fw-bold"> line
sedi "s|\(Meteor \)[^,]*,|\1${METEOR_VERSION},|g" install/index.html
sedi "s|\(Node\.js \)[0-9][0-9]*\.[x0-9a-zA-Z.-]*|\1${NODE_VERSION}|g" install/index.html
sedi "s|>v$OLD<\/span>|>v$NEW<\/span>|g" install/index.html

# api/index.html
#   The version appears in href attributes and as link text, e.g.:
#     <a href="v8.42/">v8.42</a>
#   Replace "v8.42" only when followed by a non-digit character
#   (/, <, ", space, etc.) so that a future version like "v8.421"
#   would not be accidentally matched.
#   The capture group \1 restores the character that follows the version.
#   A second expression handles the rare case of the version at end of line.
cd api
sedi "s|v$OLD\([^0-9]\)|v$NEW\1|g; s|v$OLD$|v$NEW|g" index.html

# Create directory for new API $HOME/repos/wekan/docs, copy from WeKan repo, rename entry point
cd ..
mkdir -p api/v$NEW
if [ -d "$HOME/repos/wekan" ]; then
  cp "$HOME/repos/wekan/public/api/"* api/v$NEW/
elif [ -d "$HOME/Documents/repos/wekan" ]; then
  cp "$HOME/Documents/repos/wekan/public/api/"* api/v$NEW/
else
  cp public/api/* api/v$NEW/ || true
fi
mv api/v$NEW/wekan.html api/v$NEW/index.html

# Commit and push website changes live
git add --all
git commit -m "v$NEW"
git push
