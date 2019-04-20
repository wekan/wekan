# Usage: ./release.sh 1.36

# Delete old stuff
cd ~/
sudo rm -rf .npm
cd ~/repos/wekan
sudo rm -rf parts prime stage .meteor-spk

# Set permissions
cd ~/repos
sudo chown -R $USER wekan
cd ~/
sudo chown -R $USER ~/.meteor
sudo rm -rf .cache/snapcraft
sudo chown -R $USER .config

# Back
cd ~/repos
