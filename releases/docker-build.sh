#!/bin/bash

# Build Docker images locally, because builds at Quay.io and Docker Hub usually fail.
#
# To be done at ~/repos/wekan or ~/repos/w/wekan-gantt-gpl
#
# After building, you see created Docker image ID, that is then
# used with releases/docker-push-...sh scripts.

docker build .
