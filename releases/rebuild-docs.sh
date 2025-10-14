#!/usr/bin/env bash
# Build API documentation using Node.js tooling only (Node 14.x compatible).
set -euo pipefail

# 1) Check that there is only one parameter
#    of Wekan version number:

if [ $# -ne 1 ]
  then
    echo "Syntax with Wekan version number:"
    echo "  ./rebuild-docs.sh 5.10"
    exit 1
fi

# 2) No Python dependencies; use npm/npx exclusively

# 2) Go to Wekan repo directory
cd ~/repos/wekan

# 3) Create api docs directory, if it does not exist
if [ ! -d public/api ]; then
  mkdir -p public/api
fi

# 4) Locate or generate an OpenAPI spec (YAML or JSON)
SPEC_YML="./public/api/wekan.yml"
SPEC_JSON="./public/openapi.json"
SPEC_ALT_YML="./public/openapi.yml"

if [ -s "$SPEC_YML" ]; then
  SPEC="$SPEC_YML"
elif [ -s "$SPEC_JSON" ]; then
  SPEC="$SPEC_JSON"
elif [ -s "$SPEC_ALT_YML" ]; then
  SPEC="$SPEC_ALT_YML"
else
  echo "No existing OpenAPI spec found. Generating from models with Node..."
  mkdir -p ./public/api
  node ./openapi/generate_openapi.js --release v$1 ./models > "$SPEC_YML"
  SPEC="$SPEC_YML"
fi
chmod 644 "$SPEC" 2>/dev/null || true

# Build static HTML docs (no global installs)
# 1) Prefer Redocly CLI
if npx --yes @redocly/cli@latest build-docs "$SPEC" -o ./public/api/wekan.html; then
  :
else
  # 2) Fallback to redoc-cli
  if npx --yes redoc-cli@latest bundle "$SPEC" -o ./public/api/wekan.html; then
    :
  else
    # 3) Fallback to api2html
    if npx --yes api2html@0.3.0 -c ./public/logo-header.png -o ./public/api/wekan.html "$SPEC"; then
      :
    else
      echo "All HTML generators failed. You can preview locally with:" >&2
      echo "  npx --yes @redocly/cli@latest preview-docs $SPEC" >&2
      exit 1
    fi
  fi
fi

# Copy docs to bundle
#cp -pR ./public/api ~/repos/wekan/.build/bundle/programs/web.browser/app/
