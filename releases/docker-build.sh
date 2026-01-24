#!/bin/bash

# 1) Check that there is only one parameter
#    of Wekan version number:

if [ $# -ne 1 ]
  then
    echo "Syntax with Wekan version number:"
    echo "  ./release.sh 8.24"
    exit 1
fi

docker buildx build \
  --platform linux/amd64,linux/arm64,linux/s390x \
  -t wekan/wekan:v$1 \
  --push .

# OLD: docker build -t wekan .
