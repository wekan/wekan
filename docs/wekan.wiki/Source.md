## Build from source on Mac

[Build from source on Mac](Mac)

## Build from source on VirtualBox

At [Virtual Appliance](virtual-appliance) there is build scripts and all dependencies installed already.

## Build from source on Linux

To have [Node 100% CPU fixes](https://github.com/wekan/wekan/blob/main/CHANGELOG.md#v084-2018-04-16-wekan-release): Increase ulimit for node in systemd config to 100 000

Wekan:
- On any x64 hardware that has Ubuntu 14.04 or Debian 9 or newer installed directly or in VM:
[Build from source scripts](https://github.com/wekan/wekan/tree/edge/releases/virtualbox)

Wekan Meteor Bundle:
1. [Build from source scripts](https://github.com/wekan/wekan/tree/edge/releases/virtualbox) built on [Wekan VirtualBox Ubuntu 14.04 64bit](virtual-appliance)
2. Copy arhive directory wekan/.build/bundle to .zip file so it includes bundle directory and subdirectories as wekan-1.xx.tar.gz

Wekan for Sandstorm:
- Install above Wekan from source
- Install [Sandstorm locally](https://sandstorm.io/install) with `curl https://install.sandstorm.io | bash`, select dev install
- Install [meteor-spk](https://github.com/sandstorm-io/meteor-spk)
- Get 100% CPU issue fibers fixed node, and copy it to spk directory:<br />
`wget https://releases.wekan.team/node`<br />
`chmod +x node`<br />
`mv node ~/projects/meteor-spk/meteor-spk-0.4.0/meteor-spk.deps/bin/`
- Add to your /home/username/.bashrc : <br /> `export PATH=$PATH:$HOME/projects/meteor-spk/meteor-spk-0.4.0`
- Close and open your terminal, or read settings from .bashrc with<br />`source ~/.bashrc`
- `cd wekan && meteor-spk dev`
- Then Wekan will be visible at local sandstorm at http://local.sandstorm.io:6080/
- Sandstorm commands: `sudo sandstorm`. [Release scripts](https://github.com/wekan/wekan-maintainer/tree/master/releases). Official releases require publishing key that only xet7 has.

Docker:
- `git clone https://github.com/wekan/wekan`
- `cd wekan`
- Edit docker-compose.yml script ROOT_URL etc like documented at https://github.com/wekan/wekan-mongodb docker-compose.yml script
- `docker-compose up -d --build`

Wekan on Windows:
- [Docker, Windows Subsystem for Linux, and compile from source on Windows](Windows)

### (Optional) Run Wekan as service with startup script

[Build from source scripts](https://github.com/wekan/wekan-maintainer/tree/master/virtualbox) - from there run node-allow-port-80.sh and add etc-rc.local.txt before last line in your /etc/rc.local

### (Optional) Run Wekan as service with SystemD on Linux

This may need testing, does this work.

Add to to /etc/systemd/system/wekan@.service

```bash
; see `man systemd.unit` for configuration details
; the man section also explains *specifiers* `%x`
; update <username> with username below

[Unit]
Description=Wekan server %I
Documentation=https://github.com/wekan/wekan
After=network-online.target
Wants=network-online.target
Wants=systemd-networkd-wait-online.service

[Service]
ExecStart=/usr/local/bin/node /home/<username>/repos/wekan/.build/bundle/main.js
Restart=on-failure
StartLimitInterval=86400
StartLimitBurst=5
RestartSec=10
ExecReload=/bin/kill -USR1 $MAINPID
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=Wekan
User=<username>
Group=<username>
Environment=NODE_ENV=production
Environment=PWD=/home/<username>/repos/wekan/.build/bundle
Environment=PORT=3000
Environment=HTTP_FORWARDED_COUNT=1
Environment=MONGO_URL=mongodb://127.0.0.1:27017/admin
; https://example.com/wekan for deployment
Environment=ROOT_URL=http://localhost/wekan
Environment=MAIL_URL='smtp://user:pass@mailserver.example.com:25/'

[Install]
WantedBy=multi-user.target

```

#### To start Wekan and enable service, change to your username where Wekan files are:
```bash
sudo systemctl daemon-reload
sudo systemctl start wekan@<username>
sudo systemctl enable wekan@<username>
```

#### To stop Wekan and disable service, change to your username where Wekan files are:
```bash
sudo systemctl daemon-reload
sudo systemctl stop wekan@<username>
sudo systemctl disable wekan@<username>
```
Checkout instructions for setup with [[Caddy Webserver Config]] and [[Nginx Webserver Config]] respectively.

## Windows

Building on Windows (if it works) is a lot slower than on Linux/Mac.

[Windows](Windows)