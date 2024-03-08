List what snaps you have installed. Core is part of snap itself.
```
sudo snap list
```
List what snap services are running:
```
sudo snap services
```
Uninstall Wekan snap and delete all Wekan data. If you have other snaps installed, you can remove them too. Don't remove core, it's part of snap itself.
```
sudo snap stop wekan

sudo snap disable wekan

sudo snap remove wekan
```
OPTIONAL ALTERNATIVE WAY, NOT REQUIRED: Disable some services of wekan using systemd:
```
sudo systemctl stop snap.wekan.wekan

sudo systemctl stop snap.wekan.mongodb

sudo systemctl stop snap.wekan.caddy

sudo systemctl disable snap.wekan.wekan

sudo systemctl disable snap.wekan.mongodb

sudo systemctl disable snap.wekan.caddy
```
Uninstall snap at CentOS:
```
sudo systemctl disable --now snapd.socket

sudo yum copr disable ngompa/snapcore-el7

sudo yum remove yum-plugin-copr snapd
```
Uninstall snap at Debian/Ubuntu/Mint:
```
sudo systemctl stop snapd

sudo systemctl disable snapd

sudo apt --purge remove snapd
```
Uninstall snap at [Ubuntu 14.04](https://github.com/wekan/wekan-snap/issues/34#issuecomment-378295168):
```
sudo service snapd stop

sudo update-rc.d -f snapd remove

sudo apt-get --purge remove snapd
```