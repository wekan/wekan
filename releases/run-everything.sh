#!/usr/bin/env bash
# Every test WeKan and FerretDB have, one stage at a time.
#
#   ./releases/run-everything.sh
#
# The same thing as ./build.sh -> Tests -> "EVERYTHING (sequential)". It exists as
# its own script so build.bat can run it too: the WeKan stage builds a Meteor
# bundle and runs a server, which needs a POSIX shell throughout, so Windows hands
# the whole run to bash rather than carrying a second implementation that would
# drift.
#
# Three stages, in this order, nothing concurrent:
#
#   1. WeKan's own tests        - builds a fresh bundle, starts a server on :3000,
#                                 runs mocha, the node unit suites, the import
#                                 regression, the node E2E and all three browsers.
#   2. Database conformance     - builds FerretDB v1 from the FerretDB subdirectory
#                                 (cloning wekan/FerretDB if it is not there) and
#                                 runs one query catalogue against every database
#                                 that has a Docker image for this CPU.
#   3. FerretDB's own tests     - unit, vet, and the integration suite.
#
# Everything lands in one log/<datetime>/ directory, so "the newest test logs"
# is one place for all three.

set -uo pipefail
cd "$(dirname "$0")/.." || exit 1

exec ./build.sh --run-everything "${1:-${WEKAN_EVERYTHING_MODE:-two-worker}}"
