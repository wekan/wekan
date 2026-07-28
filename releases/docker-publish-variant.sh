#!/usr/bin/env bash
# ── Publish a variant Docker image, by hand ──────────────────────────────────
#
# wekanteam/wekan-gantt-gpl and wekanteam/wekan-ondra are the same WeKan as
# wekanteam/wekan: the variant repositories are byte-identical to wekan/wekan
# apart from the snap name in snapcraft.yaml. So this does not rebuild anything
# - it points a variant tag at the multi-arch manifest the release already built
# and verified (`docker buildx imagetools create`): same digests, all five
# architectures, seconds instead of a half-hour emulated build, and no way for
# the variant image to drift from the release it claims to be.
#
# This is deliberately MANUAL. release-all.yml publishes wekanteam/wekan on
# every release; the variant images are published when you decide to. The same
# thing from the Actions tab: .github/workflows/docker-variant.yml
# ("Publish variant Docker image (manual)").
#
# If a variant repository ever stops being identical to wekan/wekan, this retag
# becomes wrong: build that repository's own Dockerfile instead.
#
# Usage:
#   releases/docker-publish-variant.sh [wekan-gantt-gpl|wekan-ondra] [VERSION] [--no-latest]
#
#   VERSION without the v (e.g. 10.49). Omitted: the newest wekan/wekan release.
#   Needs `docker login docker.io` with an account that may push to wekanteam/.

set -euo pipefail

IMAGE="${1:-wekan-gantt-gpl}"
VERSION="${2:-}"
MOVE_LATEST=1
for arg in "$@"; do
  [ "$arg" = "--no-latest" ] && MOVE_LATEST=0
done

case "$IMAGE" in
  wekan-gantt-gpl|wekan-ondra) ;;
  *)
    echo "Unknown variant image: $IMAGE" >&2
    echo "Use wekan-gantt-gpl or wekan-ondra (or add the new one here first)." >&2
    exit 1
    ;;
esac

if [ -z "$VERSION" ]; then
  VERSION="$(curl -sSL -H 'Accept: application/vnd.github+json' \
    https://api.github.com/repos/wekan/wekan/releases/latest \
    | sed -n 's/.*"tag_name": *"v\{0,1\}\([^"]*\)".*/\1/p' | head -1)"
fi
VERSION="${VERSION#v}"
if [ -z "$VERSION" ]; then
  echo "No version given and the newest release could not be read from GitHub." >&2
  exit 1
fi

SRC="wekanteam/wekan:v${VERSION}"
DST="wekanteam/${IMAGE}:v${VERSION}"
WANT="linux/amd64 linux/arm64 linux/ppc64le linux/s390x linux/riscv64"

echo "=== Publishing $DST from $SRC ==="

# The source must exist and carry every architecture, or the variant tag would
# quietly cover fewer than wekanteam/wekan does.
if ! platforms="$(docker buildx imagetools inspect "$SRC" \
      --format '{{range .Manifest.Manifests}}{{.Platform.OS}}/{{.Platform.Architecture}} {{end}}' 2>&1)"; then
  echo "$SRC cannot be inspected - is v$VERSION released and pushed?" >&2
  echo "$platforms" >&2
  exit 1
fi
echo "    $SRC covers: $platforms"
for want in $WANT; do
  case " $platforms " in
    *" $want "*) ;;
    *) echo "$SRC has no $want, so the variant image would be missing it too." >&2; exit 1 ;;
  esac
done

tags=(-t "$DST")
[ "$MOVE_LATEST" -eq 1 ] && tags+=(-t "wekanteam/${IMAGE}:latest")

echo "--- docker buildx imagetools create ${tags[*]} $SRC ---"
docker buildx imagetools create "${tags[@]}" "$SRC"

# Pushed is not the same as pushed correctly: ask Docker Hub what it has.
got="$(docker buildx imagetools inspect "$DST" \
  --format '{{range .Manifest.Manifests}}{{.Platform.OS}}/{{.Platform.Architecture}} {{end}}')"
echo "    $DST covers: $got"
for want in $WANT; do
  case " $got " in
    *" $want "*) ;;
    *) echo "$DST is missing $want after the push." >&2; exit 1 ;;
  esac
done

echo "=== OK: $DST published (same digests as $SRC) ==="
[ "$MOVE_LATEST" -eq 1 ] && echo "    wekanteam/${IMAGE}:latest now points at it too."
echo "    https://hub.docker.com/r/wekanteam/${IMAGE}/tags"
