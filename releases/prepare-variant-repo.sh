#!/usr/bin/env bash

# Replace a variant repository's working tree with WeKan while retaining the
# package identity by which users install that variant.
set -euo pipefail

if [ "$#" -ne 4 ]; then
  echo "Usage: $0 SOURCE_DIR TARGET_DIR VARIANT_NAME VARIANT_TITLE" >&2
  exit 2
fi

SOURCE_DIR="${1%/}"
TARGET_DIR="${2%/}"
VARIANT_NAME="$3"
VARIANT_TITLE="$4"

case "$VARIANT_NAME" in
  wekan-ondra|wekan-gantt-gpl) ;;
  *)
    echo "Unsupported variant: $VARIANT_NAME" >&2
    exit 2
    ;;
esac

[ -d "$SOURCE_DIR" ] || { echo "Source directory does not exist: $SOURCE_DIR" >&2; exit 2; }
[ -d "$TARGET_DIR/.git" ] || { echo "Target is not a Git checkout: $TARGET_DIR" >&2; exit 2; }

# Copy exactly the committed source tree: no .git directory, ignored build
# output, local caches or other workspace-only files can leak into a variant.
# Removing through Git is recoverable until the sync commit is created.
if [ -n "$(git -C "$TARGET_DIR" status --porcelain)" ]; then
  echo "Target checkout has local changes: $TARGET_DIR" >&2
  exit 2
fi
git -C "$TARGET_DIR" rm -r -q --ignore-unmatch -- .
git -C "$SOURCE_DIR" archive --format=tar HEAD | tar -C "$TARGET_DIR" -xf -

# These repositories are release mirrors, not independent dependency owners.
# Dependency changes are reviewed and tested in wekan/wekan, then arrive here
# through this sync. Copying the configuration creates duplicate, stale PRs.
rm -f "$TARGET_DIR/.github/dependabot.yml" "$TARGET_DIR/.github/dependabot.yaml"

cd "$TARGET_DIR"

# Snap Store identity. Both bases must keep the variant name.
for file in snapcraft.yaml snapcraft-core26.yaml; do
  [ -f "$file" ] || continue
  sed -i "s/^name: wekan$/name: $VARIANT_NAME/" "$file"
  sed -i "s/^title: Wekan$/title: $VARIANT_TITLE/" "$file"
  sed -i "s|^source-code: https://github.com/wekan/wekan$|source-code: https://github.com/wekan/$VARIANT_NAME|" "$file"
done

# npm package identity. Only the root package carries this exact name in these
# files; dependency names such as @wekan/... remain untouched.
sed -i "s/\"name\": \"wekan\"/\"name\": \"$VARIANT_NAME\"/g" package.json package-lock.json
sed -i "s#github.com/wekan/wekan.git#github.com/wekan/$VARIANT_NAME.git#g" package.json

# Container identity. The Dockerfile still downloads release bundles from the
# canonical wekan/wekan repository, but images built FROM a variant repository
# identify and publish that variant. Compose examples must pull the same name.
sed -i "s#org.opencontainers.image.source=\"https://github.com/wekan/wekan\"#org.opencontainers.image.source=\"https://github.com/wekan/$VARIANT_NAME\"#" Dockerfile
for file in docker-compose*.yml; do
  [ -f "$file" ] || continue
  sed -i "s#ghcr.io/wekan/wekan:#ghcr.io/wekan/$VARIANT_NAME:#g" "$file"
  sed -i "s#quay.io/wekan/wekan:#quay.io/wekan/$VARIANT_NAME:#g" "$file"
  sed -i "s#wekanteam/wekan:#wekanteam/$VARIANT_NAME:#g" "$file"
done

# Fail closed: a successful sync may never leave a default package identity in
# a file that publishes or installs the variant.
grep -qxF "name: $VARIANT_NAME" snapcraft.yaml
grep -qxF "name: $VARIANT_NAME" snapcraft-core26.yaml
grep -qF "\"name\": \"$VARIANT_NAME\"" package.json
grep -qF "\"name\": \"$VARIANT_NAME\"" package-lock.json
grep -qF "org.opencontainers.image.source=\"https://github.com/wekan/$VARIANT_NAME\"" Dockerfile

echo "Prepared $VARIANT_NAME from $SOURCE_DIR in $TARGET_DIR"
