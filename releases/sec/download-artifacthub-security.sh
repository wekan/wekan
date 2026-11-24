#!/usr/bin/env bash
# Download the whole Artifact Hub security report of a package - every image
# Artifact Hub scanned with Trivy, every vulnerability - to
# .tools/log/sec/_artifacthub/<kind>/<repository>/<package>/<YYYY-MM-DD_HH-MM-SS>/.
#
#   releases/sec/download-artifacthub-security.sh                 # helm/wekan/wekan
#   releases/sec/download-artifacthub-security.sh helm/wekan/wekan --version 13.30.0
#   releases/sec/download-artifacthub-security.sh --help
#
# Artifact Hub's API is public: no login is needed. download-github-security.sh
# runs this too, for the wekan organization. See releases/sec/README.md.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 is needed to run $here/download_artifacthub_security.py" >&2
  exit 2
fi

exec python3 -I "$here/download_artifacthub_security.py" "$@"
