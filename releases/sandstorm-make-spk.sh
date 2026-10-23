#!/bin/bash
# Make the WeKan Sandstorm .spk (build.sh: Sandstorm -> Make the .spk package).
#
# Built the same way the workflows build it: with only what a grain runs
# (releases/sandstorm-slim-spk.sh,
# docs/Platforms/FOSS/Container/Sandstorm/Smaller-wekan-spk.md). The
# meteor-spk.deps tree is the one next to the meteor-spk on PATH, as
# sandstorm-src/build-deps.sh assembles it; set DEPS to use another one.

if [ "$#" -ne 1 ]; then
  echo "Usage: ./sandstorm-make-spk.sh <version>"
  exit 1
fi

if [ -z "${DEPS:-}" ] && command -v meteor-spk >/dev/null 2>&1; then
  DEPS="$(readlink -f "$(command -v meteor-spk)").deps"
  export DEPS
fi

exec bash "$(dirname "$0")/sandstorm-slim-spk.sh" "wekan-$1.spk"
