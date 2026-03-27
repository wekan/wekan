#!/bin/bash

# Release website with new WeKan version number and new API docs.
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

# Go to website directory and pull latest changes
cd ~/repos/w/wekan.fi
git pull

# install/index.html
#   The version appears inside a specific HTML span tag.
#   This pattern is already precise enough to match only the WeKan version.
sed -i "s|>v$OLD<\/span>|>v$NEW<\/span>|g" install/index.html

# api/index.html
#   The version appears in href attributes and as link text, e.g.:
#     <a href="v8.42/">v8.42</a>
#   Replace "v8.42" only when followed by a non-digit character
#   (/, <, ", space, etc.) so that a future version like "v8.421"
#   would not be accidentally matched.
#   The capture group \1 restores the character that follows the version.
#   A second expression handles the rare case of the version at end of line.
cd api
sed -i "s|v$OLD\([^0-9]\)|v$NEW\1|g; s|v$OLD$|v$NEW|g" index.html

# Create directory for new API docs, copy from WeKan repo, rename entry point
cd ..
mkdir -p api/v$NEW
cp ~/repos/wekan/public/api/* api/v$NEW/
mv api/v$NEW/wekan.html api/v$NEW/index.html

# Commit and push website changes live
git add --all
git commit -m "v$NEW"
git push
