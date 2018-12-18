#!/bin/bash
set -euxo pipefail

BUILD_DEPS="bsdtar gnupg wget curl bzip2 python git ca-certificates perl-Digest-SHA"
NODE_VERSION=v8.14.0
METEOR_RELEASE=1.6.0.1
USE_EDGE=false
METEOR_EDGE=1.5-beta.17
NPM_VERSION=latest
FIBERS_VERSION=2.0.0
ARCHITECTURE=linux-x64
#NODE_VERSION=v10.14.1

sudo yum groupinstall -y 'Development Tools'
sudo yum install -y http://opensource.wandisco.com/centos/7/git/x86_64/wandisco-git-release-7-2.noarch.rpm
sudo yum install -y git

sudo useradd --user-group --system --home-dir /home/wekan wekan
sudo mkdir -p /home/wekan
sudo chown wekan:wekan /home/wekan/

sudo -u wekan git clone https://github.com/wekan/wekan.git /home/wekan/app

sudo yum install -y ${BUILD_DEPS}

# Meteor installer doesn't work with the default tar binary, so using bsdtar while installing.
# https://github.com/coreos/bugs/issues/1095#issuecomment-350574389
sudo cp $(which tar) $(which tar)~
sudo ln -sf $(which bsdtar) $(which tar)

# Install nodejs
wget https://nodejs.org/dist/${NODE_VERSION}/node-${NODE_VERSION}-${ARCHITECTURE}.tar.gz
wget https://nodejs.org/dist/${NODE_VERSION}/SHASUMS256.txt.asc

grep ${NODE_VERSION}-${ARCHITECTURE}.tar.gz SHASUMS256.txt.asc | shasum -a 256 -c -

tar xvzf node-${NODE_VERSION}-${ARCHITECTURE}.tar.gz
rm node-${NODE_VERSION}-${ARCHITECTURE}.tar.gz
sudo mv node-${NODE_VERSION}-${ARCHITECTURE} /opt/nodejs
sudo rm -f /usr/bin/node
sudo rm -f /usr/bin/npm
sudo ln -s /opt/nodejs/bin/node /usr/bin/node || true
sudo ln -s /opt/nodejs/bin/npm /usr/bin/npm || true

sudo npm install -g npm@${NPM_VERSION}
sudo npm install -g node-gyp
sudo npm install -g --unsafe-perm fibers@${FIBERS_VERSION}

cd /home/wekan

#install meteor
sudo curl "https://install.meteor.com" -o /home/wekan/install_meteor.sh
sudo chmod +x /home/wekan/install_meteor.sh
sudo sed -i 's/VERBOSITY="--silent"/VERBOSITY="--progress-bar"/' ./install_meteor.sh
echo "Starting meteor ${METEOR_RELEASE} installation...   \n"

# Check if opting for a release candidate instead of major release
if [ "$USE_EDGE" = false ]; then
  sudo su -c '/home/wekan/install_meteor.sh' - wekan
else
  sudo -u wekan git clone --recursive --depth 1 -b release/METEOR@${METEOR_EDGE} git://github.com/meteor/meteor.git /home/wekan/.meteor;
fi;

# Get additional packages
sudo mkdir -p /home/wekan/app/packages
sudo chown wekan:wekan --recursive /home/wekan/app
cd /home/wekan/app/packages
sudo -u wekan git clone --depth 1 -b master git://github.com/wekan/flow-router.git kadira-flow-router
sudo -u wekan git clone --depth 1 -b master git://github.com/meteor-useraccounts/core.git meteor-useraccounts-core
sudo -u wekan git clone --depth 1 -b master git://github.com/wekan/meteor-accounts-cas.git
sudo -u wekan git clone --depth 1 -b master git://github.com/wekan/wekan-ldap.git
sudo sed -i 's/api\.versionsFrom/\/\/api.versionsFrom/' /home/wekan/app/packages/meteor-useraccounts-core/package.js
sudo -u wekan /home/wekan/.meteor/meteor -- help

# Build app
cd /home/wekan/app
meteor=/home/wekan/.meteor/meteor
sudo -u wekan ${meteor} add standard-minifier-js
sudo -u wekan ${meteor} npm install
sudo -u wekan ${meteor} build --directory /home/wekan/app_build
sudo cp /home/wekan/app/fix-download-unicode/cfs_access-point.txt /home/wekan/app_build/bundle/programs/server/packages/cfs_access-point.js
sudo chown wekan:wekan /home/wekan/app_build/bundle/programs/server/packages/cfs_access-point.js
cd /home/wekan/app_build/bundle/programs/server/
sudo npm install
sudo chown -R wekan:wekan ./node_modules
sudo mv /home/wekan/app_build/bundle /build
