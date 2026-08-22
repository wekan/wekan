#!/bin/bash
if [ -n "${ZSH_VERSION:-}" ]; then exec /bin/bash "$0" "$@"; fi

# 1) Check that there is only one parameter
#    of Wekan version number

if [ $# -ne 1 ]
  then
    echo "Syntax with Wekan version number:"
    echo "  ./maintainer-make-bundle-o.sh 5.10"
    exit 1
fi
# 2) Install GNU parallel with the current platform package manager.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$SCRIPT_DIR/ensure-tools.sh"
ensure_tools parallel

# 3) Download releases from build servers and
#    upload releases to download server,
#    all at the same time in parallel.

{
  ~/repos/wekan/releases/up-a.sh $1
  ~/repos/wekan/releases/up-s.sh $1
  #~/repos/wekan/releases/up-o.sh $1
  ~/repos/wekan/releases/up-w.sh $1
} | parallel -k
