#!/bin/bash

# Convert Stylus to CSS.
# npm -g install stylus
#

sedi() {
  if [ "$(uname)" = "Darwin" ]; then
    sed -i '' "$@"
  else
    sed -i "$@"
  fi
}

sedi "s|@import 'nib'|//@import 'nib'|g" *.styl
ls *.styl | xargs stylus
