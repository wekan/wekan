#!/bin/bash

if [ $# -ne 1 ]
  then
    echo "Syntax with Wekan version number:"
    echo "  ./releases/docker-build.sh 8.24"
    exit 1
fi

VERSION=$1

# Check is there script for deleting Docker containers
W_DIR="../w"
CLEANUP_DIR="$W_DIR/docker-cleanup-volumes"
if [ ! -d "$W_DIR" ]; then
    mkdir -p "$W_DIR"
fi
if [ ! -d "$CLEANUP_DIR" ]; then
    (cd "$W_DIR" && git clone https://github.com/wekan/docker-cleanup-volumes)
fi
# Delete Docker containers
(cd ../w/docker-cleanup-volumes && git pull && ./start.sh)

# Install Docker build deps
./releases/docker-build-deps.sh

# Ensure you are using the correct builder
docker buildx use mybuilder

# Use sudo prefix for docker commands if current user is not in docker group.
if docker info >/dev/null 2>&1; then
  DOCKER="docker"
else
  DOCKER="sudo docker"
fi

# Local check image tag (amd64 only, loaded into local daemon for inspection).
CHECK_IMAGE="wekan-check:v${VERSION}"

echo "=== Step 1: Build image locally for inspection (amd64) ==="
#  --platform linux/amd64,linux/arm64,linux/s390x,linux/ppc64le \
${DOCKER} buildx build \
  --platform linux/amd64 \
  --load \
  -t "${CHECK_IMAGE}" \
  .

echo "=== Step 2: Pre-push image checks for ${CHECK_IMAGE} ==="

# 2a: Ensure pebble binary is not present.
echo "  Checking for /usr/bin/pebble..."
${DOCKER} run --rm --pull=never --entrypoint sh "${CHECK_IMAGE}" -lc '
set -eu
if [ -x /usr/bin/pebble ]; then
  echo "ERROR: /usr/bin/pebble exists in image - build was not cleaned properly"
  exit 1
fi
echo "  OK: /usr/bin/pebble not present"
'

# 2b: Ensure no Go buildinfo ELF binaries remain in key runtime paths.
echo "  Checking for Go ELF binaries..."
${DOCKER} run --rm --pull=never --user 0:0 --entrypoint sh "${CHECK_IMAGE}" -lc '
set -eu
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq --no-install-recommends binutils file >/dev/null

found=""
for d in /build /usr/local/bin /usr/bin /bin; do
  [ -d "$d" ] || continue
  while IFS= read -r f; do
    file "$f" 2>/dev/null | grep -q ELF || continue
    readelf -S "$f" 2>/dev/null | grep -q "\.go\.buildinfo" || continue
    echo "    FOUND: $f"
    strings "$f" 2>/dev/null | grep -E "go1\.[0-9]+|golang\.org/x/net" | head -n 10 || true
    found="${found}${f}\n"
  done <<EOF
$(find "$d" -xdev -type f 2>/dev/null)
EOF
done

if [ -n "$found" ]; then
  echo "ERROR: Go buildinfo binaries still present - push aborted"
  printf "%b" "$found"
  exit 1
fi
echo "  OK: No Go buildinfo binaries found"
'

echo "=== Step 3: Checks passed - building and pushing multi-arch image to registries ==="
${DOCKER} buildx build \
  --platform linux/amd64,linux/arm64 \
  -t wekanteam/wekan:v${VERSION} \
  -t wekanteam/wekan:latest \
  -t quay.io/wekan/wekan:v${VERSION} \
  -t quay.io/wekan/wekan:latest \
  -t ghcr.io/wekan/wekan:v${VERSION} \
  -t ghcr.io/wekan/wekan:latest \
  --push \
  .

echo "=== Step 4: Cleanup local check image ==="
${DOCKER} rmi "${CHECK_IMAGE}" || true

echo "=== All done: v${VERSION} pushed to all registries ==="
