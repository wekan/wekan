# Usage: ./release.sh 1.36

# Cleanup
cd ~/repos/wekan/releases
./release-cleanup.sh

# Build Source
cd ~/repos/wekan
./releases/rebuild-release.sh

# Build Snap
cd ~/repos/wekan
sudo snapcraft

# Cleanup
cd ~/repos/wekan
./releases/release-cleanup.sh

# Push snap
cd ~/repos/wekan
sudo snap install --dangerous wekan_$1_amd64.snap
echo "Now you can test local installed snap."
snapcraft push wekan_$1_amd64.snap
scp wekan_$1_amd64.snap x2:/var/www/releases.wekan.team/
mv wekan_$1_amd64.snap ..
