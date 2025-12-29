#!/bin/bash

# Find text from all subdirectories
# and ignore all temporary directories:
# - node-modules = installed node modules
# - .build = Wekan bundle that is combined from source. Do not edit these, these are deleted and recreated.
# - .meteor = Meteor version, packages etc at .meteor/local
# - .git = git history

# If less or more that 1 parameter, show usage.
if (( $# != 1 )); then
    echo 'Usage: ./find.sh text-to-find'
    exit 0
fi

#find . | grep -v node_modules | grep -v .build | grep -v .meteor | grep -v .git | xargs grep --no-messages $1 | less
#find . -print0 | grep -v node_modules | grep -v .build | grep -v .meteor | grep -v .git | xargs -0 grep --no-messages $1 | less
find . -type f -not -path '*/node_modules/*' -not -path '*/.build/*' -not -path '*/.meteor/*' -not -path '*/.git/*' -exec grep -I --no-messages "$1" {} + | less
