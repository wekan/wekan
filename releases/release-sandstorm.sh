# Usage: ./release.sh 1.36

# Delete old stuff
#cd ~/repos/wekan
#./releases/release-cleanup.sh

# Build Source
#cd ~/repos/wekan
#./releases/rebuild-release.sh

# Build Sandstorm
cd ~/repos/wekan
# Use Meteor 1.8.x and Node 8.17.0
sudo n 8.17.0
./releases/rebuild-release.sh
rm -rf .build
mkdir ../sandstorm-build
cp -pR .meteor ../sandstorm-build/
cp -pR .snap-meteor-1.8 ../sandstorm-build/
mv .snap-meteor-1.8/.meteor .
mv .snap-meteor-1.8/package.json .
mv .snap-meteor-1.8/package-lock.json .
# Meteor 1.9.x has changes to Buffer() => Buffer.alloc(), so reverting those
mv .snap-meteor-1.8/cfs_access-point.txt fix-download-unicode/
mv .snap-meteor-1.8/export.js models/
mv .snap-meteor-1.8/wekanCreator.js models/
mv .snap-meteor-1.8/ldap.js packages/wekan-ldap/server/ldap.js
mv .snap-meteor-1.8/oidc_server.js packages/wekan-oidc/oidc_server.js
rm -rf .snap-meteor-1.8
# Build bundle with Meteor 1.8.x and Node 8.17.0
./releases/rebuild-release.sh
# Build Sandstorm
meteor-spk pack wekan-$1.spk
spk publish wekan-$1.spk
scp wekan-$1.spk x2:/var/snap/wekan/common/releases.wekan.team/
mv wekan-$1.spk ..
sudo rm -rf .meteor-spk
# Back to Meteor 1.9 and Node 12.14.1
sudo n 12.14.1
rm -rf .meteor
mv ../sandstorm-build/.meteor .
mv ../sandstorm-build/.snap-meteor-1.8 .
rmdir ../sandstorm-build
# Delete old stuff
#cd ~/repos/wekan
#./releases/release-cleanup.sh

