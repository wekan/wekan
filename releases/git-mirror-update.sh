#!/bin/bash

function mirror() {
  if [ ! -d "~/repos/wekan/.tools" ]; then
    mkdir -p ~/repos/wekan/.tools
    if [ ! -d "~/repos/wekan/.tools/wekan-$1" ]; then
      (cd ~/repos/wekan/.tools && git clone $3 wekan-$1 && \
       cd wekan-$1 && git remote add upstream https://github.com/wekan/wekan)
    fi
    (cd ~/repos/wekan/.tools/wekan-$1 && git pull && git fetch upstream && git merge upstream/main && git push)
  fi
}

mirror "gitlab"   "gitlab.com"   "git@gitlab.com:wekan/wekan"
mirror "codeberg" "codeberg.org" "git@codeberg.org:wekan/wekan"
