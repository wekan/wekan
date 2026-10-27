#!/bin/bash
. "$(dirname "${BASH_SOURCE[0]}")/tools-env.sh"   # temporary files and downloads go to .tools/tmp
# The checkout is wherever this script is: ~/repos/wekan on Linux,
# ~/Documents/repos/wekan on macOS, Downloads\repos\wekan on Windows.
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ "$#" -ne 1 ]; then
  echo "Usage: ./release-bundle.sh <version>"
  exit 1
fi

# Downloads and release zips stay in .tools/tmp (releases/tools-env.sh), not
# in ~/Downloads or ~/Lataukset.
DOWNLOAD_DIR="${DOWNLOAD_DIR:-$WEKAN_DOWNLOADS}"

cd "$REPO_DIR"
#sudo apt-get -y install parallel
./releases/rebuild-release.sh
#./releases/delete-phantomjs.sh
cd "$REPO_DIR/.build"
zip -r wekan-$1-amd64.zip bundle

mkdir -p "$DOWNLOAD_DIR"
mv -f "wekan-$1-amd64.zip" "$DOWNLOAD_DIR/"

#{
  #scp "$REPO_DIR/releases/build-bundle-arm64.sh" a:/home/wekan/
  #scp "$REPO_DIR/releases/build-bundle-s390x.sh" s:/home/linux1/
  #scp "$REPO_DIR/releases/build-bundle-ppc64el.sh" o:/home/ubuntu/
  #scp "$REPO_DIR/releases/release-x2.sh" 20i:/data/websites/
  #scp wekan-$1-amd64.zip 20i:/data/websites/releases.wekan.team/
  #scp wekan-$1-amd64.zip a:/home/wekan/
  #scp wekan-$1-amd64.zip s:/home/linux1/
  #scp wekan-$1.zip o:/home/ubuntu/
#} | parallel -k

cd ..

#echo "x64 bundle and arm64/s390x build scripts uploaded to x2/a/s."
#echo "x64 bundle and build script uploaded to 20i."
echo "x64 bundle done: $DOWNLOAD_DIR/wekan-$1-amd64.zip"
