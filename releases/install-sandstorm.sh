#!/bin/bash

echo "INSTALLING WEKAN SANDSTORM VERSION RELATED FILES:"
sudo apt-get -y install p7zip-full wget curl
cd ~
wget https://releases.wekan.team/dev/meteor-spk/projects.7z
7z x projects.7z
rm projects.7z
echo "export PATH=\$PATH:~/projects/meteor-spk/meteor-spk-0.5.1" >> ~/.bashrc
source ~/.bashrc
echo "INSTALL DEV VERSION OF SANDSTORM:"
curl https://install.sandstorm.io | bash
cd ~/repos/wekan
