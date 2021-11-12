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

docker tag $1 quay.io/wekan/wekan-gantt-gpl:v$2
docker push quay.io/wekan/wekan-gantt-gpl:v$2

docker tag $1 quay.io/wekan/wekan-gantt-gpl:latest
docker push quay.io/wekan/wekan-gantt-gpl:latest

docker tag $1 wekanteam/wekan-gantt-gpl:v$2
docker push wekanteam/wekan-gantt-gpl:v$2

docker tag $1 wekanteam/wekan-gantt-gpl:latest
docker push wekanteam/wekan-gantt-gpl:latest
