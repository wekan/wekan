#!/bin/bash
# Delete repo git tag from local and remote.
# Example: add-tag.sh v1.62

if [ "$#" -ne 1 ]; then
  echo "Usage: ./delete-tag.sh 8.81"
  exit 1
fi


git tag -d v$1
git push origin --delete v$1
