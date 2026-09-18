#!/usr/bin/env bash
# Use Snapcraft's own interpreter, libraries, environment and credentials.
set -euo pipefail
script_dir=$(cd "$(dirname "$0")" && pwd)
exec snap run --shell snapcraft -c 'exec "$SNAP/bin/python" "$@"' \
  snapcraft-remote-compat "$script_dir/snapcraft-remote-compat.py" "$@"
