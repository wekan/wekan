# Usage: ./release.sh 1.36

# Delete old stuff
#cd ~/repos/wekan
#./releases/release-cleanup.sh

# Build Source
#cd ~/repos/wekan
#./releases/rebuild-release.sh

REPODIR=/home/wekan/repos
WEKANDIR=/home/wekan/repos/wekan
OLDDIR=/home/wekan/repos/sandstorm-build
METEDIR=/home/wekan/repos/wekan/.sandstorm-meteor-1.8

# Ensure sudo access
sudo echo .
# Build Sandstorm
cd $REPODIR
rm -rf $WEKANDIR
git clone git@github.com:wekan/wekan.git
cd $WEKANDIR
# Use Meteor 1.8.x and Node 8.17.0
sudo n 8.17.0
#sudo rm -rf /root/.cache/node-gyp/8.17.0
sudo mkdir -p /usr/local/lib/node_modules/fibers/.node-gyp
#sudo npm -g uninstall node-gyp node-pre-gyp fibers
#./releases/rebuild-release.sh
rm -rf $OLDDIR
mkdir $OLDDIR
mv .meteor $OLDDIR/
cp -pR .snap-meteor-1.8 $OLDDIR/
mv $METEDIR/.meteor .
mv $METEDIR/package.json .
mv $METEDIR/package-lock.json .
# Meteor 1.9.x has changes to Buffer() => Buffer.alloc(), so reverting those
mv $METEDIR/cfs_access-point.txt fix-download-unicode/
mv $METEDIR/export.js models/
mv $METEDIR/wekanCreator.js models/
mv $METEDIR/ldap.js packages/wekan-ldap/server/ldap.js
mv $METEDIR/oidc_server.js packages/wekan-oidc/oidc_server.js
rm -rf $METEDIR
# Build Wekan
./releases/rebuild-release.sh
# Build bundle with Meteor 1.8.x and Node 8.17.0
cd .build/bundle/programs/server
npm install node-gyp node-pre-gyp fibers@2.0.0
cd $WEKANDIR
# Build Sandstorm
meteor-spk pack wekan-$1.spk
#spk publish wekan-$1.spk
#scp wekan-$1.spk x2:/var/snap/wekan/common/releases.wekan.team/
#mv wekan-$1.spk ..
#sudo rm -rf .meteor-spk
# Back to Meteor 1.9 and Node 12.14.1
#sudo n 12.14.1
#sudo rm -rf .meteor
#mv ../sandstorm-build/.meteor .
#mv ../sandstorm-build/.snap-meteor-1.8 .
#rmdir ../sandstorm-build
# Delete old stuff
#cd ~/repos/wekan
#./releases/release-cleanup.sh

