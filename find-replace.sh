#!/bin/bash

# Recursive find/replace of literal text, skipping the same generated and
# temporary directories as find.sh.
# Syntax: ./find-replace.sh searchtext replacetext
#
# The text is matched and replaced as written: no regular expression, so
# "a.b" or "C++" mean exactly that. perl does the work because `sed -i`
# differs between GNU (Linux) and BSD (macOS), and BSD grep's -Z means
# decompress rather than GNU's NUL-separated output.

if (( $# != 2 )); then
    echo 'Usage: ./find-replace.sh searchtext replacetext'
    exit 1
fi

export FIND_REPLACE_SEARCH="$1" FIND_REPLACE_WITH="$2"
find . -type f -not -path '*/node_modules/*' -not -path '*/.build/*' -not -path '*/_build/*' \
    -not -path '*/.meteor/*' -not -path '*/.git/*' -not -path '*/.tools/*' -print0 |
    xargs -0 grep -IlF --null -- "$1" 2>/dev/null |
    xargs -0 perl -pi -e 's/\Q$ENV{FIND_REPLACE_SEARCH}\E/$ENV{FIND_REPLACE_WITH}/g'
