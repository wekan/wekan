#!/bin/bash
# https://makandracards.com/makandra/621-git-delete-a-branch-local-or-remote

if [ "$#" -ne 1 ]; then
  echo "Usage: ./delete-branch-local-and-remote.sh <branch_name>"
  exit 1
fi

#git push origin --delete feature-oauth
git push origin --delete "$1"
