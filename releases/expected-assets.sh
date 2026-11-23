#!/bin/bash
#
# expected-assets.sh <version> - every asset a complete WeKan release carries.
#
# Prints one line per PRIMARY asset:
#
#   <kind> <selector> <asset-name> <sums|nosums>
#
# `kind` says WHICH build makes it, and that is the interesting part here,
# because only ONE of them runs Meteor:
#
#   meteor     wekan-<v>-amd64.zip. The Meteor build. Everything else below is
#              this bundle, repacked.
#   repack     arm64, win64 and mac-arm64 - the amd64 bundle with a different
#              Node.js and its native modules rebuilt, each on its own runner.
#   extra      the six architectures nobody else builds for, repacked under
#              QEMU by releases/repack-bundle-for-arch.sh.
#   appimage   AppImage.yml
#   mac        mac.yml
#   windows    windows.yml
#   flatpak    Flatpak.yml
#   sandstorm  the .spk
#   snap       the wekan snaps; variant the wekan-ondra and wekan-gantt-gpl
#              snaps (see the end)
#
# `selector` is what the matching workflow's `only` input filters its matrix on.
#
# CHECKSUMS are derived, not listed: every bundle is published with a
# `<name>.sha256sum` beside it, so `sums` means "and that as well", and an asset
# counts as present only when both are there. A bundle whose checksum upload
# failed is a half-published release.
#
# `nosums` is for the Sandstorm .spk, which is signed rather than checksummed,
# and for the snaps, which the Snap Store verifies.
#
# NOTE ON OLD RELEASES: the .sha256sum files were added during v10.58's
# development, so v10.57 and earlier carry none. Asking this about one of those
# will report every bundle missing, which is true as stated - they are missing
# their checksums - but it is not a reason to rebuild them. Point it at the
# release being built.

set -euo pipefail

v="${1:?usage: expected-assets.sh <version>   e.g. 10.58}"

echo "meteor amd64 wekan-${v}-amd64.zip sums"

# release-all.yml: build-arm64, build-win64, build-win-arm64, build-mac-arm64.
# Each starts from
# the amd64 bundle and runs on its own kind of runner, so they are not the
# emulated repack below and cannot be built by it.
echo "repack arm64 wekan-${v}-arm64.zip sums"
echo "repack win64 wekan-${v}-win64.zip sums"
echo "repack win-arm64 wekan-${v}-win-arm64.zip sums"
echo "repack mac-arm64 wekan-${v}-mac-arm64.zip sums"

# release-all.yml: build-extra-arches. The matrix, and it must match that job's
# - if an architecture is added there and not here, this will not notice it is
# missing.
for arch in s390x ppc64le riscv64 i386 armv6 armhf loong64; do
    echo "extra ${arch} wekan-${v}-${arch}.zip sums"
done

# AppImage.yml / Flatpak.yml. WeKan-, not wekan-: those two name their assets
# with the display capitalisation.
for arch in x86_64 aarch64; do
    echo "appimage ${arch} WeKan-${v}-${arch}.AppImage sums"
done
for arch in arm64 amd64; do
    echo "mac ${arch} WeKan-${v}-mac-${arch}.app.zip sums"
done
for arch in x86_64 aarch64; do
    echo "flatpak ${arch} WeKan-${v}-${arch}.flatpak sums"
done

# The single EXE is the win64 launcher with the win64 ZIP appended, so it
# exists exactly when that ZIP does. Windows ARM64 has no single EXE: the
# launcher is compiled for x64 only.
echo "windows win64 WeKan-${v}-win64.exe sums"

echo "sandstorm sandstorm wekan-${v}-sandstorm.spk nosums"

# The snaps. A snap is not checksummed beside it; the store verifies it.
#   snap     wekan, from release-all.yml's snap-native (amd64, arm64) and
#            snap-launchpad (the other four). Not built here: "Release all
#            missing" retries those jobs of the release (its recover job).
#   variant  wekan-ondra and wekan-gantt-gpl on EVERY architecture wekan
#            has: snap-variants builds amd64 and arm64, each snap-launchpad
#            leg makes the other four from its wekan snap. Buildable here: the
#            release's own wekan snap renamed (releases/snap-rename.sh). The
#            selector is <name>:<arch>.
#
#            From v13.30, the first release whose snap-launchpad makes them.
#            NOT for the releases before it: "Release all missing" would then
#            upload, say, wekan-ondra 13.20 for armhf AFTER 13.29 - a newer
#            revision NUMBER of an older version - and "Push Snap to Store"
#            releases the highest revision of each architecture, so stable
#            would go back to 13.20 there.
snap_arches="amd64 arm64 armhf ppc64el s390x riscv64"
variant_arches="amd64 arm64"
if [ "$(printf '%s\n%s\n' 13.30 "$v" | sort -V | head -n1)" = 13.30 ]; then
    variant_arches=$snap_arches
fi
for arch in $snap_arches; do
    echo "snap wekan:${arch} wekan_${v}_${arch}.snap nosums"
done
for name in wekan-ondra wekan-gantt-gpl; do
    for arch in $variant_arches; do
        echo "variant ${name}:${arch} ${name}_${v}_${arch}.snap nosums"
    done
done

# Bun has a separate ESM build; its catalog is also the workflow matrix.
python3 - "$v" "$(dirname "$0")/bun/targets.json" <<'PYBUN'
import json, sys
for item in json.load(open(sys.argv[2])):
    target = item['target']
    print(f'bun {target} wekan-{sys.argv[1]}-bun-{target}.zip sums')
PYBUN
