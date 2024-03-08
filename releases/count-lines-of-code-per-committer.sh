#!/bin/bash

# At 2024, GitHub removed feature of counting lines of code from
# https://github.com/wekan/wekan/graphs/contributors
# "Contributions to main, line counts have been omitted because commit count exceeds 10,000."
#
# This code counts lines of code per email address:
# https://github.com/orgs/community/discussions/89886#discussioncomment-8650093

if [ $# -ne 1 ]
  then
    echo "Syntax to count lines of code per committer, by email address:"
    echo "  ./releases/count-lines-of-code-per-committer.sh x@xet7.org"
    echo "Example result at 2024-03-08:"
    echo "  added lines: 4594802, removed lines: 4416066, total lines: 178736, added:deleted ratio:1.04047"
    exit 1
fi

git log --author=$1 --pretty=tformat: --numstat | awk '{ adds += $1; subs += $2; loc += $1 - $2 } END { printf "added lines: %s, removed lines: %s, total lines: %s, added:deleted ratio:%s\n", adds, subs, loc, adds/subs }' -

# Related: Most active GitHub users in Finland:
# https://committers.top/finland.html
# at 2024-03-08, xet7 was 3rd.
