# Usage: ./release.sh 1.36

# Delete old stuff
cd ~/
sudo rm -rf .npm
cd ~/repos/wekan
sudo rm -rf parts prime stage .meteor-spk

# Set permissions
cd ~/repos
sudo chown user:user wekan -R
cd ~/
sudo chown user:user .meteor -R
#sudo chown user:user .cache/snapcraft -R
sudo rm -rf .cache/snapcraft
sudo chown user:user .config -R

# Back
cd ~/repos
