#!/bin/bash

sudo apt-get -y install parallel

{
  ~/repos/wekan/releases/up-a.sh $1
  ~/repos/wekan/releases/up-s.sh $1
  ~/repos/wekan/releases/up-o.sh $1
} | parallel -k
