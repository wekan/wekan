#!/usr/bin/env bash

# Test that all download URLs used in snapcraft.yaml actually exist.
# Uses HTTP HEAD requests — nothing is downloaded.
#
# Summary of what the snap bundles per architecture:
#   amd64, arm64        — MongoDB Community 8.0 (newest) + mongosh + db-tools
#   armhf, s390x, ppc64el — FerretDB 2.7.0 built from Go 1.24.13 source + PostgreSQL 16
#                           (MongoDB Community Edition has no Community builds for these arches)
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

echo "=== MongoDB Community 8.0.20 (amd64 and arm64 only) ==="
check "MongoDB 8.0.20  amd64 (x86_64, ubuntu2404)" \
  "https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-ubuntu2404-8.0.20.tgz"
check "MongoDB 8.0.20  arm64 (aarch64, ubuntu2404)" \
  "https://fastdl.mongodb.org/linux/mongodb-linux-aarch64-ubuntu2404-8.0.20.tgz"
echo "  NOTE  MongoDB Community has never published builds for s390x, ppc64le, or arm/v7"
echo "        (those are Enterprise-only). FerretDB 2 + PostgreSQL is used instead."
echo ""

echo "=== mongosh 2.8.2 (amd64 and arm64) ==="
check "mongosh 2.8.2  amd64 (x64)" \
  "https://downloads.mongodb.com/compass/mongosh-2.8.2-linux-x64.tgz"
check "mongosh 2.8.2  arm64" \
  "https://downloads.mongodb.com/compass/mongosh-2.8.2-linux-arm64.tgz"
echo "  NOTE  mongosh is not published for s390x, ppc64le, or armhf"
echo ""

echo "=== mongodb-database-tools 100.13.0 (amd64 and arm64) ==="
check "db-tools 100.13.0  amd64 (x86_64, ubuntu2404)" \
  "https://fastdl.mongodb.org/tools/db/mongodb-database-tools-ubuntu2404-x86_64-100.13.0.tgz"
check "db-tools 100.13.0  arm64 (ubuntu2404)" \
  "https://fastdl.mongodb.org/tools/db/mongodb-database-tools-ubuntu2404-arm64-100.13.0.tgz"
echo "  NOTE  db-tools is not published for s390x, ppc64le, or armhf"
echo ""

echo "=== Go 1.24.13 toolchain (used to build FerretDB 2 on armhf/s390x/ppc64le) ==="
check "Go 1.24.13  linux-armv6l  (armhf snap builder)" \
  "https://dl.google.com/go/go1.24.13.linux-armv6l.tar.gz"
check "Go 1.24.13  linux-s390x   (s390x snap builder)" \
  "https://dl.google.com/go/go1.24.13.linux-s390x.tar.gz"
check "Go 1.24.13  linux-ppc64le (ppc64el snap builder)" \
  "https://dl.google.com/go/go1.24.13.linux-ppc64le.tar.gz"
echo ""

echo "=== FerretDB 2.7.0 Go module (built from source via Go proxy) ==="
FERRETDB_MOD="https://proxy.golang.org/github.com/!ferret!d!b/!ferret!d!b/v2/@v/v2.7.0.info"
HTTP=$(curl -s -o /dev/null -w "%{http_code}" -L --max-time 20 "$FERRETDB_MOD")
if [ "$HTTP" = "200" ]; then
    printf "  OK  FerretDB v2/cmd/ferretdb@v2.7.0 available on Go proxy\n"
    PASS=$((PASS + 1))
else
    printf " FAIL [HTTP %s] FerretDB v2.7.0 not found on Go proxy\n      %s\n" "$HTTP" "$FERRETDB_MOD"
    FAIL=$((FAIL + 1))
fi
echo ""

echo "=== Node.js 22.22.2 (all snap architectures) ==="
check "Node.js 22.22.2  linux-x64     (amd64)" \
  "https://nodejs.org/dist/v22.22.2/node-v22.22.2-linux-x64.tar.gz"
check "Node.js 22.22.2  linux-arm64   (arm64)" \
  "https://nodejs.org/dist/v22.22.2/node-v22.22.2-linux-arm64.tar.gz"
check "Node.js 22.22.2  linux-armv7l  (armhf)" \
  "https://nodejs.org/dist/v22.22.2/node-v22.22.2-linux-armv7l.tar.gz"
check "Node.js 22.22.2  linux-s390x   (s390x)" \
  "https://nodejs.org/dist/v22.22.2/node-v22.22.2-linux-s390x.tar.gz"
check "Node.js 22.22.2  linux-ppc64le (ppc64el)" \
  "https://nodejs.org/dist/v22.22.2/node-v22.22.2-linux-ppc64le.tar.gz"
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
