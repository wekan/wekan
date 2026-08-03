#!/bin/bash

# UFW firewall.

# After setting up ssh public key login,
# at /etc/ssh/sshd_config, only allow using SSH key,
# with public key auth, and not password:
#   PermitRootLogin without-password

sudo apt-get -y install ssh ufw mosh

sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw allow mosh

sudo ufw enable

sudo ufw status numbered

# sudo ufw delete NUMBER-OF-RULE

