# Usage: ./release.sh 1.36

# Delete old stuff
#cd ~/repos/wekan
#./releases/release-cleanup.sh

# Build Source
#cd ~/repos/wekan
#./releases/rebuild-release.sh

# Build Sandstorm
cd ~/repos/wekan
meteor-spk pack wekan-$1.spk
spk publish wekan-$1.spk
scp wekan-$1.spk x2:/var/snap/wekan/common/releases.wekan.team/
mv wekan-$1.spk ..
sudo rm -rf .meteor-spk
# Delete old stuff
#cd ~/repos/wekan
#./releases/release-cleanup.sh

