#!/bin/bash

# With this, clone all release related repos.

# 1) Check that this script has no parameters
if [ $# -ne 0 ]
  then
    echo "Syntax, no parameters:"
    echo "  ./releases/clone-release-repos.sh"
    exit 1
fi

# 2) Create directories, clone repos
mkdir ../w
cd ../w
git clone git@github.com:wekan/wekan.github.io.git
git clone git@github.com:wekan/wekan-ondra.git
git clone git@github.com:wekan/wekan-gantt-gpl.git

# 3) Set upstreams
cd wekan-ondra
git remote add upstream https://github.com/wekan/wekan

cd ../wekan-gantt-gpl
git remote add upstream https://github.com/wekan/wekan

# 4) Go back to Wekan repo directory
cd ../wekan

echo "Release repos ondra, gantt-gpl, and website cloned and upstreams set."
