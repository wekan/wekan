#!/bin/bash

sudo apt-get -y install parallel

# Can not build ppc64le version because
# OpenPower Minicloud is having
# emergency maintenance.
#  ~/repos/wekan/releases/up-o.sh $1

{
  ~/repos/wekan/releases/up-a.sh $1
  ~/repos/wekan/releases/up-s.sh $1
} | parallel -k
