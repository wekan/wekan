#!/bin/bash

# Push locally built docker images to Quay.io and Docker Hub.

# Check that there is 2 parameters of
# of Wekan version number:

if [ $# -ne 2 ]
  then
    echo "Usage: ./push-docker.sh DOCKERBUILDTAG WEKANVERSION"
    echo "Example: ./push-docker.sh 12345 5.70"
    exit 1
fi

# GitHub
docker tag $1 ghcr.io/wekan/wekan-gantt-gpl:v$2
docker push ghcr.io/wekan/wekan-gantt-gpl:v$2
docker tag $1 ghcr.io/wekan/wekan-gantt-gpl:latest
docker push ghcr.io/wekan/wekan-gantt-gpl:latest

~/repos/wekan/releases/docker-registry-sync.sh

# Quay
docker tag $1 quay.io/wekan/wekan-gantt-gpl:v$2
docker push quay.io/wekan/wekan-gantt-gpl:v$2
docker tag $1 quay.io/wekan/wekan-gantt-gpl:latest
docker push quay.io/wekan/wekan-gantt-gpl:latest

# Docker Hub
docker tag $1 wekanteam/wekan-gantt-gpl:v$2
docker push wekanteam/wekan-gantt-gpl:v$2
docker tag $1 wekanteam/wekan-gantt-gpl:latest
docker push wekanteam/wekan-gantt-gpl:latest
