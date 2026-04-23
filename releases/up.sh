#!/bin/bash

# 1) Check that there is only one parameter
#    of Wekan version number

if [ $# -ne 1 ]
  then
    echo "Syntax with Wekan version number:"
    echo "  ./maintainer-make-bundle-o.sh 5.10"
    exit 1
fi


# 2) Install parallel if it's not installed yet
if [ "$(uname)" = "Darwin" ]; then
  if ! command -v brew >/dev/null 2>&1; then
    echo "Homebrew not found. Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  fi
  if ! command -v parallel >/dev/null 2>&1; then
    echo "GNU parallel not found. Installing with brew..."
    brew install parallel
  fi
else
  if ! command -v parallel >/dev/null 2>&1; then
    echo "GNU parallel not found. Installing with apt-get..."
    sudo apt-get -y install parallel
  fi
fi

# 3) Download releases from build servers and
#    upload releases to download server,
#    all at the same time in parallel.

{
  ~/repos/wekan/releases/up-a.sh $1
  ~/repos/wekan/releases/up-s.sh $1
  #~/repos/wekan/releases/up-o.sh $1
  ~/repos/wekan/releases/up-w.sh $1
} | parallel -k
