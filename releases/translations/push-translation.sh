#!/bin/sh
# Push one language's translations to Transifex. Usage: push-translation.sh ja
#
# -f is REQUIRED: without it the Go tx CLI skips the language whenever the local
# file is not newer than the server copy (internal/txlib/push.go shouldSkipPush),
# so a freshly reverted file silently uploads nothing and the next `tx pull`
# reverts it back to English again. Run from the repo root; needs ../tx and auth.
[ -z "$1" ] && { echo "usage: $0 <lang>"; exit 1; }
../tx push -t -l "$1" -f
