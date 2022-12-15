#!/bin/bash

# 1) Check that there is only one parameter
#    of Wekan version number

if [ $# -ne 1 ]
  then
    echo "Syntax with Wekan version number:"
    echo "  ./up-a.sh 5.10"
    exit 1
fi

# 2) Download release from arm64 build server
scp a:/home/wekan/wekan-$1-arm64.zip .

# 3) Upload arm64 release to download server
scp wekan-$1-arm64.zip x2:/data/websites/releases.wekan.team/public/raspi3/
