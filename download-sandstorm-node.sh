#!/bin/bash

echo "=== GETTING NEWEST NODE FROM SANDSTORM FORK OF NODE ==="
echo "=== SOURCE: https://github.com/sandstorm-io/node ==="

# From https://github.com/sandstorm-io/sandstorm/blob/master/branch.conf
SANDSTORM_BRANCH_NUMBER=0

# From https://github.com/sandstorm-io/sandstorm/blob/master/release.sh
SANDSTORM_CHANNEL=dev
SANDSTORM_LAST_BUILD=$(curl -fs https://install.sandstorm.io/$SANDSTORM_CHANNEL)

echo "=== LATEST SANDSTORM RELEASE: ${SANDSTORM_LAST_BUILD}==="

if (( SANDSTORM_LAST_BUILD / 1000 > SANDSTORM_BRANCH_NUMBER )); then
  echo "SANDSTORM BRANCH ERROR: $CHANNEL has already moved past this branch!" >&2
  echo "  I refuse to replace it with an older branch." >&2
  exit 1
fi

BASE_BUILD=$(( BRANCH_NUMBER * 1000 ))
BUILD=$(( BASE_BUILD > LAST_BUILD ? BASE_BUILD : LAST_BUILD + 1 ))
BUILD_MINOR="$(( $BUILD % 1000 ))"
DISPLAY_VERSION="${BRANCH_NUMBER}.${BUILD_MINOR}"
TAG_NAME="v${DISPLAY_VERSION}"
SIGNING_KEY_ID=160D2D577518B58D94C9800B63F227499DA8CCBD

TARBALL=sandstorm-$SANDSTORM_LAST_BUILD.tar.xz
NODE_EXE=sandstorm-$SANDSTORM_LAST_BUILD/bin/node

echo "=== DOWNLOADING SANDSTORM GPG KEYS TO VERIFY SANDSTORM RELEASE ==="

# Do verification in custom GPG workspace
# https://docs.sandstorm.io/en/latest/install/#option-3-pgp-verified-install
export GNUPGHOME=$(mktemp -d)

curl https://raw.githubusercontent.com/sandstorm-io/sandstorm/master/keys/release-keyring.gpg | \
    gpg --import

wget https://raw.githubusercontent.com/sandstorm-io/sandstorm/master/keys/release-certificate.kentonv.sig

gpg --decrypt release-certificate.kentonv.sig

echo "=== DOWNLOADING SANDSTORM RELEASE FROM https://dl.sandstorm.io/${TARBALL} ==="
wget https://dl.sandstorm.io/$TARBALL

echo "=== DOWNLOADING SIGNATURE FOR SANDSTORM RELEASE FROM https://dl.sandstorm.io/${TARBALL}.sig ==="
wget https://dl.sandstorm.io/$TARBALL.sig

echo "=== VERIFYING SIGNATURE OF SANDSTORM RELEASE ==="
gpg --verify $TARBALL.sig $TARBALL

if [ $? -eq 0 ]
then
  echo "=== ALL IS WELL. GOOD SIGNATURE IN SANDSTORM. ==="
else
 echo "=== PROBLEM WITH SANDSTORM SIGNATURE. ==="
 exit 1
fi

echo "=== EXTRACTING NODE FROM SANDSTORM RELEASE TARBALL ==="
# --strip 2 removes path of 2 subdirectories
tar -xf $TARBALL $NODE_EXE --strip=2

echo "=== REMOVING SANDSTORM RELEASE TARBALL AND SIGNATURE ==="
rm $TARBALL $TARBALL.sig release-certificate.kentonv.si*
