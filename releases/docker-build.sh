#!/bin/bash

if [ $# -ne 1 ]
  then
    echo "Syntax with Wekan version number:"
    echo "  ./releases/docker-build.sh 8.24"
    exit 1
fi

VERSION=$1

# Check is there script for deleting Docker containers
W_DIR="../w"
CLEANUP_DIR="$W_DIR/docker-cleanup-volumes"
if [ ! -d "$W_DIR" ]; then
    mkdir -p "$W_DIR"
fi
if [ ! -d "$CLEANUP_DIR" ]; then
    (cd "$W_DIR" && git clone https://github.com/wekan/docker-cleanup-volumes)
fi
# Delete Docker containers
(cd ../w/docker-cleanup-volumes && git pull && ./start.sh)

# Install Docker build deps
./releases/docker-build-deps.sh

# Ensure you are using the correct builder
docker buildx use mybuilder

docker buildx build \
  --platform linux/amd64,linux/arm64,linux/s390x,linux/ppc64le \
  -t wekanteam/wekan:v${VERSION} \
  -t wekanteam/wekan:latest \
  -t quay.io/wekan/wekan:v${VERSION} \
  -t quay.io/wekan/wekan:latest \
  -t ghcr.io/wekan/wekan:v${VERSION} \
  -t ghcr.io/wekan/wekan:latest \
  --push .

