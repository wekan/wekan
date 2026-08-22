#!/bin/bash

echo "INSTALLING WEKAN SANDSTORM VERSION RELATED FILES:"
if command -v dnf >/dev/null 2>&1; then
  sudo dnf install -y 7zip wget curl
else
  sudo apt-get -y install p7zip-full wget curl
fi
cd ~
wget https://releases.wekan.team/dev/meteor-spk/projects.7z
7z x projects.7z
rm projects.7z
echo "export PATH=\$PATH:~/projects/meteor-spk/meteor-spk-0.6.0" >> ~/.bashrc
source ~/.bashrc
echo "INSTALL DEV VERSION OF SANDSTORM:"
curl https://install.sandstorm.io | bash
cd ~/repos/wekan
