#!/bin/bash

# 1) Check that there is only one parameter
#    of Wekan version number

if [ $# -ne 1 ]
  then
    echo "Syntax with Wekan version number:"
    echo "  ./up-s.sh 5.10"
    exit 1
fi

# 2) Download release from s390x build server
scp s:/home/linux1/wekan-$1-s390x.zip .

# 3) Upload s390x release to download server
scp wekan-$1-s390x.zip x2:/var/snap/wekan/common/releases.wekan.team/s390x/
