# Usage: ./release.sh 1.36

# Cleanup
cd ~/repos
./release-cleanup.sh

# Build Source
cd ~/repos
./rebuild-release.sh

# Build Snap
cd ~/repos/wekan
rm -rf packages
sudo snapcraft

# Cleanup
cd ~/repos
./release-cleanup.sh

# Push snap
cd ~/repos/wekan
sudo snap install --dangerous wekan_$1_amd64.snap
echo "Now you can test local installed snap."
snapcraft push wekan_$1_amd64.snap
#scp wekan_$1_amd64.snap x2:/var/snap/wekan/common/releases.wekan.team/
scp wekan_$1_amd64.snap x2:/var/www/releases.wekan.team/
mv wekan_$1_amd64.snap ..
