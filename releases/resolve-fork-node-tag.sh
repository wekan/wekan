#!/usr/bin/env bash
#
# resolve-fork-node-tag.sh <asset> <major>
#
# Print the NEWEST wekan/node release tag "v<major>.x" that actually carries the
# release asset <asset> (e.g. node-win32.exe, node-mac-x64), or an empty line if
# none does. WeKan pins the Node MAJOR ($NODE_VERSION is '24'); the fork tags its
# releases by full version (v24.19.0), so the native jobs resolve the concrete tag
# here rather than guessing .../download/24/<asset> (which 404s).
#
# Uses the authenticated GitHub API when $GITHUB_TOKEN is set (the release
# workflow exports it), so the call is not 60/hour-rate-limited across runners.
# Lives in a file, not inline in the workflow, because a multi-line python heredoc
# cannot be indented into a YAML `run: |` block without breaking one or the other.

set -uo pipefail

asset="${1:?usage: resolve-fork-node-tag.sh <asset> <major>}"
major="${2:?usage: resolve-fork-node-tag.sh <asset> <major>}"

auth=()
[ -n "${GITHUB_TOKEN:-}" ] && auth=(-H "Authorization: Bearer ${GITHUB_TOKEN}")

releases_json="$(curl -fsSL "${auth[@]}" \
  "https://api.github.com/repos/wekan/node/releases?per_page=100" 2>/dev/null || true)"
[ -n "$releases_json" ] || { echo ""; exit 0; }

printf '%s' "$releases_json" | ASSET="$asset" MAJOR="$major" python3 -c '
import json, os, sys
major = "v" + os.environ["MAJOR"] + "."
asset = os.environ["ASSET"]
def key(t):
    try:
        return [int(x) for x in t.lstrip("v").split(".")[:3]]
    except Exception:
        return [0, 0, 0]
tags = [r["tag_name"] for r in json.load(sys.stdin)
        if r.get("tag_name", "").startswith(major)
        and any(a.get("name") == asset for a in r.get("assets", []))]
print(sorted(set(tags), key=key, reverse=True)[0] if tags else "")
' 2>/dev/null || echo ""
