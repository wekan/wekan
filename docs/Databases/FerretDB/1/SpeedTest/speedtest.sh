#!/usr/bin/env bash
# The WeKan database speed test: every database this CPU runs, one at a time,
# loaded with the same dummy WeKan data and asked the same common WeKan queries.
# Writes Results.md beside this script. See README.md.
#
#   docs/Databases/FerretDB/1/SpeedTest/speedtest.sh
#
# It is releases/db-conformance.sh with WEKAN_DB_SUITE=speedtest: the same
# FerretDB built from source, the same databases started the same way, the same
# ports and the same log directory - only what is run against each differs.
#
#   WEKAN_SPEEDTEST_SCALE=2        data size: 2 = twice a production WeKan
#   WEKAN_SPEEDTEST_BUDGET_MS=10000  how long one query keeps being repeated
#   WEKAN_SPEEDTEST_RESULTS=...    where Results.md is written
#   WEKAN_CONFORMANCE_HANA=1       include SAP HANA (amd64, ~16 GB RAM)
set -euo pipefail
cd "$(dirname "$0")/../../../../.."
export WEKAN_DB_SUITE=speedtest
exec ./releases/db-conformance.sh "$@"
