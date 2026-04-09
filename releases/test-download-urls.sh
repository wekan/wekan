#!/usr/bin/env bash

# Test that all download URLs used in snapcraft.yaml actually exist.
# Uses HTTP HEAD requests — nothing is downloaded.
#
# Summary of what the snap bundles per architecture:
#   amd64, arm64        — MongoDB 7.x prebuilt native binary + mongosh + db-tools
#   armhf, s390x, ppc64el — MongoDB 7.x amd64 binary run via qemu-x86_64-static
#                           (MongoDB Community Edition has no prebuilt builds for these arches)
# Note: on any platform whose CPU lacks instructions required by MongoDB (e.g. AVX),
#       mongodb-control automatically falls back to running via qemu-x86_64-static.
#
# Snap base:   core24 (Ubuntu 24.04 LTS — core26 is edge-only, not released yet)
# Docker base: ubuntu:24.04 (current LTS, support until 2029;
#              ubuntu:26.04 is pre-release until April 17 2026)
#
# Usage:
#   ./releases/test-download-urls.sh

set -euo pipefail

PASS=0
FAIL=0

check() {
    local label="$1"
    local url="$2"
    HTTP=$(curl -s -o /dev/null -w "%{http_code}" -L --head --max-time 20 "$url")
    if [ "$HTTP" = "200" ] || [ "$HTTP" = "302" ] || [ "$HTTP" = "301" ]; then
        printf "  OK  %s\n      %s\n" "$label" "$url"
        PASS=$((PASS + 1))
    else
        printf " FAIL [HTTP %s] %s\n      %s\n" "$HTTP" "$label" "$url"
        FAIL=$((FAIL + 1))
    fi
}

echo "=== MongoDB 7.0.14 (amd64 and arm64 native; amd64 also used via QEMU for armhf/s390x/ppc64el) ==="
check "MongoDB 7.0.14  amd64 (x86_64, ubuntu2204)" \
  "https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-ubuntu2204-7.0.14.tgz"
check "MongoDB 7.0.14  arm64 (aarch64, ubuntu2204)" \
  "https://fastdl.mongodb.org/linux/mongodb-linux-aarch64-ubuntu2204-7.0.14.tgz"
echo "  NOTE  MongoDB Community has no prebuilt builds for s390x, ppc64le, or arm/v7."
echo "        The amd64 binary above is also used on those arches via qemu-x86_64-static."
echo ""

echo "=== mongosh 2.8.2 (x64 for amd64/armhf/s390x/ppc64el via QEMU; arm64 native) ==="
check "mongosh 2.8.2  x64 (amd64 + armhf/s390x/ppc64el via QEMU)" \
  "https://downloads.mongodb.com/compass/mongosh-2.8.2-linux-x64.tgz"
check "mongosh 2.8.2  arm64" \
  "https://downloads.mongodb.com/compass/mongosh-2.8.2-linux-arm64.tgz"
echo ""

echo "=== mongodb-database-tools 100.13.0 (x86_64 for amd64/armhf/s390x/ppc64el; arm64 native) ==="
check "db-tools 100.13.0  x86_64 (amd64 + armhf/s390x/ppc64el via QEMU)" \
  "https://fastdl.mongodb.org/tools/db/mongodb-database-tools-ubuntu2404-x86_64-100.13.0.tgz"
check "db-tools 100.13.0  arm64" \
  "https://fastdl.mongodb.org/tools/db/mongodb-database-tools-ubuntu2404-arm64-100.13.0.tgz"
echo ""

echo "=== Node.js 24.14.1 (all snap architectures) ==="
check "Node.js 24.14.1  linux-x64     (amd64)" \
  "https://nodejs.org/dist/v24.14.1/node-v24.14.1-linux-x64.tar.gz"
check "Node.js 24.14.1  linux-arm64   (arm64)" \
  "https://nodejs.org/dist/v24.14.1/node-v24.14.1-linux-arm64.tar.gz"
check "Node.js 24.14.1  linux-armv7l  (armhf)" \
  "https://nodejs.org/dist/v24.14.1/node-v24.14.1-linux-armv7l.tar.gz"
check "Node.js 24.14.1  linux-s390x   (s390x)" \
  "https://nodejs.org/dist/v24.14.1/node-v24.14.1-linux-s390x.tar.gz"
check "Node.js 24.14.1  linux-ppc64le (ppc64el)" \
  "https://nodejs.org/dist/v24.14.1/node-v24.14.1-linux-ppc64le.tar.gz"
echo ""

echo "=== Results ==="
echo "  Passed: $PASS"
echo "  Failed: $FAIL"
echo ""

if [ "$FAIL" -gt 0 ]; then
    echo "Some URLs are broken — update snapcraft.yaml before releasing."
    exit 1
else
    echo "All URLs are reachable."
fi
