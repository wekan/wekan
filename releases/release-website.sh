#!/bin/bash

# Release website with new Wekan version number
# and new API docs.

# 1) Check that there is only 2 parameters
#    of Wekan previous and new version number:

if [ $# -ne 2 ]
  then
    echo "Syntax with Wekan previous and new version number:"
    echo "  ./release-website.sh 5.09 5.10"
    exit 1
fi

# 2) Go to website directory
cd ~/repos/w/wekan.github.io

# 3) Get latest changes to website
git pull

# 4) Change version number in website
sed -i "s|>v$1<\/span>|>v$2<\/span>|g" index.html

# 5) Change version number in API docs index page
cd api
sed -i "s|v$1|v$2|g" index.html

# 6) Create directory for new docs
mkdir v$2

# 7) Go to new docs directory
cd v$2

# 8) Copy new docs from Wekan repo to new docs directory
cp ~/repos/wekan/public/api/* .

# 9) Move wekan.html to index.html
mv wekan.html index.html

# 10) Go to docs repo
cd ~/repos/w/wekan.github.io

# 11) Commit all changes to git and push website changes live
git add --all
git commit -m "v$2"
git push
