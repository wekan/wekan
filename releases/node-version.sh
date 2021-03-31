#!/bin/bash
cat ~/repos/wekan/Dockerfile | grep NODE_VERSION=v | sed 's|\\||g' - | sed 's| ||g' - | sed 's|NODE_VERSION=v||g' -
