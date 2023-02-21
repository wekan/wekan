#!/bin/bash

# 1) Check that there is only one parameter
#    of Wekan version number

if [ $# -ne 1 ]
  then
    echo "Syntax with Wekan version number:"
    echo "  ./up-o.sh 5.10"
    exit 1
fi

# 2) Download release from ppc64le build server
scp o:/home/ubuntu/wekan-$1-ppc64le.zip .

# 3) Upload ppc64le release to download server
scp wekan-$1-ppc64le.zip x2:/data/websites/releases.wekan.team/ppc64le/
