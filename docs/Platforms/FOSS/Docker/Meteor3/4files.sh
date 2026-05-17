#!/bin/bash

# Transfer attachments and avatars from server c1 Snap to server c2 Docker

if [ "$#" -ne 1 ]; then
  echo "Error: Enter the name of what snap files to transfer to Docker files."
  echo "Usage: $0 <database_name>"
  exit 1
fi

rsync -aur --progress c1:/var/snap/wekan_$1/common/files /var/lib/docker/volumes/$1_wekan-files/_data/
chown -R caddy:systemd-journal /var/lib/docker/volumes/$1_wekan-files/_data/files

# At c2:
#   ssh-keygen

# At c2 ~/.ssh/config:
#  Host c1
#       Hostname 123.123.123.123
#       User root
#       IdentityFile ~/.ssh/id_rsa

# At c1 ~/.ssh/authorized_keys has content of id_rsa at c1:
#   ssh-rsa ... root@c2

# At c1 file permissions:
#   chmod og-rwx ~/.ssh/authorized_keys
