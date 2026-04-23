#!/bin/bash

if [ "$#" -ne 1 ]; then
  echo "Usage: ./sandstorm-make-spk.sh <version>"
  exit 1
fi

meteor-spk pack "wekan-$1.spk"
