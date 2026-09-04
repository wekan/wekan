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
#   windows    windows.yml
#   flatpak    Flatpak.yml
#   sandstorm  the .spk
#
# `selector` is what the matching workflow's `only` input filters its matrix on.
#
# CHECKSUMS are derived, not listed: every bundle is published with a
# `<name>.sha256sum` beside it, so `sums` means "and that as well", and an asset
# counts as present only when both are there. A bundle whose checksum upload
# failed is a half-published release.
#
# `nosums` is for the Sandstorm .spk, which is signed rather than checksummed.
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
for arch in x86_64 aarch64; do
    echo "flatpak ${arch} WeKan-${v}-${arch}.flatpak sums"
done

# The single EXE is the win64 launcher with the win64 ZIP appended, so it
# exists exactly when that ZIP does. Windows ARM64 has no single EXE: the
# launcher is compiled for x64 only.
echo "windows win64 WeKan-${v}-win64.exe sums"

echo "sandstorm sandstorm wekan-${v}-sandstorm.spk nosums"
