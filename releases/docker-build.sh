#!/bin/bash

if [ $# -ne 1 ]
  then
    echo "Syntax with Wekan version number:"
    echo "  ./releases/docker-build.sh 8.24"
    exit 1
fi

# Ensure you are using the correct builder
docker buildx use mybuilder

docker buildx build \
  --platform linux/amd64,linux/arm64,linux/s390x \
  -t wekan/wekan:v$1 \
  --push .
