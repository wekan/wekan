#!/bin/bash

# 1) Check that there is only one parameter
#    of Wekan version number

if [ $# -ne 1 ]
  then
    echo "Syntax with Wekan version number:"
    echo "  ./up-w.sh 5.10"
    exit 1
fi

# 2) Upload windows release to download server
scp ../../win2016/wekan-$1-amd64-windows.zip x2w:/var/websites/releases.wekan.team/public/windows/
