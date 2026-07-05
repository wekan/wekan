# Reset previous attempts
sudo flatpak override --reset com.visualstudio.code

# Block EVERYTHING except the display and the wekan folder
sudo flatpak override com.visualstudio.code \
  --nofilesystem=home \
  --nofilesystem=host \
  --nofilesystem=xdg-run/gvfs \
  --nofilesystem=xdg-run/gvfsd \
  --filesystem=~/repos/wekan:rw \
  --filesystem=~/repos/log:rw \
  --filesystem=~/repos/w/wekan.fi:rw \
  --device=all \
  --socket=wayland \
  --socket=x11 \
  --share=network
