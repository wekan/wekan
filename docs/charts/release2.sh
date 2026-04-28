#!/bin/bash

# Release script 2 for wekan charts.

# 1) Check that there is only one parameter
#    of Wekan version number:

if [ $# -ne 1 ]
  then
    echo "Syntax with Wekan version number:"
    echo "  ./release.sh 9.10"
    exit 1
fi

git add --all
# Reads version number argument and adds .0 after it.
git commit -m "$1.0"
git push
