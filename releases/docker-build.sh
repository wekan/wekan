#!/bin/bash

if [ $# -ne 1 ]
  then
    echo "Syntax with Wekan version number:"
    echo "  ./releases/docker-build.sh 8.24"
    exit 1
fi

VERSION=$1

# Ensure you are using the correct builder
docker buildx use mybuilder

docker buildx build \
  --platform linux/amd64,linux/arm64,linux/s390x \
  -t wekanteam/wekan:v${VERSION} \
  -t wekanteam/wekan:latest \
  -t quay.io/wekan/wekan:v${VERSION} \
  -t quay.io/wekan/wekan:latest \
  -t ghcr.io/wekan/wekan:v${VERSION} \
  -t ghcr.io/wekan/wekan:latest \
  --push .
