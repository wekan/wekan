# Installing snapcraft from source

This is old and already fixed, was only needed when [snap build servers were broken](https://github.com/wekan/wekan-snap/issues/58) and [snapcraft had bug](https://forum.snapcraft.io/t/permission-denied-when-building-with-snapcore-snapcraft/7186/14?u=xet7) that has [fix that was not released to snap channel yet](https://github.com/snapcore/snapcraft/pull/2240). All this is fixed now.

So I removed snap version, and installed snapcraft from source, and it seems to work for me.

## Snapcraft source install on Ubuntu 16.04 64bit

Add to /root/.bashrc:
```
export PATH="$PATH:/home/user/repos/snapcraft/bin"
```
## Install dependencies
```
sudo apt install python3-yaml python3-tabulate python3-pymacaroons \
python3-progressbar python3-requests-unixsocket python3-petname \
python3-pyelftools python3-click python3-simplejson \
python3-requests-toolbelt python3-jsonschema xdelta3
```
## Install snapcraft
```
cd ~/repos
git clone https://github.com/snapcore/snapcraft.git
cd snapcraft
sudo python3 setup.py install
```
## [Workaround bug](https://bugs.launchpad.net/snapcraft/+bug/1656884/comments/1)
```
sudo ln -s /usr/local/lib/python3.5/dist-packages/snapcraft-2.43-py3.5.egg/share/snapcraft/ /usr/share/snapcraft
```
## Build package
```
cd ~/repos/wekan
sudo snapcraft
```
## Install snap package locally to test it
```
sudo snap install --dangerous wekan_1.*_amd64.snap
```
## Changing back to stable or edge snap

https://github.com/wekan/wekan-snap/wiki/Snap-Developer-Docs

## Login to snapcraft

If you have access to publishing snaps.

## Push package to snap store
```
sudo snapcraft push wekan_1.*_amd64.snap
```
## Publish at snap store

https://dashboard.snapcraft.io/dev/snaps/7867
