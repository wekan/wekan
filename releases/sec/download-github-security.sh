#!/usr/bin/env bash
# Download a GitHub organization's "Security and quality" alerts - Dependabot,
# code scanning, secret scanning and security advisories - per repository, to
# .tools/log/sec/<organization>/<repository>/<YYYY-MM-DD_HH-MM-SS>/.
#
#   releases/sec/download-github-security.sh wekan
#   releases/sec/download-github-security.sh wekan --repo wekan --state open
#   releases/sec/download-github-security.sh --help
#
# Run it outside the editor's Flatpak sandbox, where the GitHub CLI (gh) and
# its login are: `gh auth login` first, with an account that may read the
# organization's security alerts. See releases/sec/README.md.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 is needed to run $here/download_github_security.py" >&2
  exit 2
fi

exec python3 -I "$here/download_github_security.py" "$@"
