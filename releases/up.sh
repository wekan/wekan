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
sudo apt-get -y install parallel

# 3) Download releases from build servers and
#    upload releases to download server,
#    all at the same time in parallel.

{
  ~/repos/wekan/releases/up-a.sh $1
  ~/repos/wekan/releases/up-s.sh $1
  ~/repos/wekan/releases/up-o.sh $1
} | parallel -k
