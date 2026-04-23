#!/bin/bash
# Add tag to repo of new release
# Example: add-tag.sh v1.62

if [ "$#" -ne 1 ]; then
  echo "Usage: ./add-tag.sh <version_tag>"
  exit 1
fi

git tag -a "$1" -m "$1"
git push origin "$1"
