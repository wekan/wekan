#!/bin/bash

if [ "$#" -ne 1 ]; then
  echo "Usage: ./snap-push-to-store.sh <snap_file>"
  exit 1
fi

snapcraft upload "$1"
