# NEWEST:

[UberLab/Uberspace 7 Manual: Wekan](https://lab.uberspace.de/guide_wekan.html) - ([Source](https://github.com/wekan/wekan/issues/2009#issuecomment-817010524))

***

# OLD:

**NOTE**:
- [Newest Node/Mongo/Meteor versions](https://github.com/wekan/wekan/blob/main/Dockerfile).
- For x64 wekan-VERSION.zip is at https://releases.wekan.team and some related install info https://github.com/wekan/wekan/wiki/Raspberry-Pi

**Purpose**: Install latest Wekan release on [Uberspace](https://uberspace.de/) 6 and run as [daemontools](https://cr.yp.to/daemontools/faq/create.html) service in local userspace.

This script installs Wekan on a fresh Uberspace 6. It setup Node 4, MongoDB, a Port, installs Wekan and starts it as a service. It's tested with Wekan versions 0.32 and 0.63.

You have two Options to use it.

# Option 1:
You can run the commands of the following script step-by-step in the shell.

At first step set the SMTP-Password variable. Replace the `$1` with the password in that way `SMTP_PASS="smtp_password"` and continue line-by-line.

# Option 2:
Or you can run it automatically.
* Save it as script in file `install_wekan.sh`
* Make it executable `chmod +x install_wekan.sh`
* And run it. Pass the SMTP-Password as command line parameter `./install_wekan.sh smtp_password`.

## ./install_wekan.sh
```
#!/bin/sh
##
## Usage: ./install_wekan.sh SMTP-password
##
## Draft
## Install Wekan (v0.63) on Uberspace 6 by Noodle / Chris
##
## Sources:
## https://github.com/wekan/wekan/wiki/Install-and-Update#manual-installation-steps
## https://wiki.uberspace.de/database:mongodb
## https://wiki.uberspace.de/development:nodejs
## https://wiki.uberspace.de/system:daemontools
## https://github.com/wekan/wekan/issues/907


## Set SMTP password
# SMTP_PASS="xxxxxxxxxx"

SMTP_PASS="$1"


#####################
### Setup Node.js ###
#####################

cat <<__EOF__ > ~/.npmrc
prefix = $HOME
umask = 077
__EOF__

echo 'export PATH=/package/host/localhost/nodejs-4/bin:$PATH' >> ~/.bash_profile
source ~/.bash_profile


#####################
### Setup MongoDB ###
#####################

test -d ~/service || uberspace-setup-svscan
TEMPMDB="$(uberspace-setup-mongodb)"

MONGO_USER="${USER}_mongoadmin"
MONGO_PORT="$(echo ${TEMPMDB} | grep -E -o 'm#:\s[0-9]{5}\sUs' | cut -d' ' -f 2)"
MONGO_PASS="$(echo ${TEMPMDB} | grep -E -o 'rd:\s.+\sTo\sconn' | cut -d' ' -f 2)"

echo -e "MONGO_USER: ${MONGO_USER} \nMONGO_PORT: ${MONGO_PORT} \nMONGO_PASS: ${MONGO_PASS}"


############################
### Setup Websocket Port ###
############################

export FREE_PORT="$(uberspace-add-port --protocol tcp --firewall | grep -E -o '[0-9]{5}')"

echo "FREE_PORT: ${FREE_PORT}"


###################
### Setup Wekan ###
###################

## Issue #907 - Port must be speccified in root url, when Version > 0.10.1
MONGO_URL="mongodb://${MONGO_USER}:${MONGO_PASS}@127.0.0.1:${MONGO_PORT}/wekan?authSource=admin"
ROOT_URL="http://${USER}.${HOSTNAME}:${FREE_PORT}/"
MAIL_URL="smtp://${USER}:${SMTP_PASS}@${HOSTNAME}:587/"
MAIL_FROM="${USER}@${HOSTNAME}"
PORT="${FREE_PORT}"

echo -e "MONGO_URL: ${MONGO_URL} \nPORT: ${PORT} \nROOT_URL: ${ROOT_URL} \nMAIL_URL ${MAIL_URL} \nMAIL_FROM: ${MAIL_FROM}"


#####################
### Install Wekan ###
#####################

mkdir ~/wekan && cd ~/wekan

# Tested versions 0.32, 0.63
WEKAN_VERSION=0.63
curl -OL https://github.com/wekan/wekan/releases/download/v${WEKAN_VERSION}/wekan-${WEKAN_VERSION}.tar.gz && tar xzf wekan-${WEKAN_VERSION}.tar.gz && rm wekan-${WEKAN_VERSION}.tar.gz

cd ~/wekan/bundle/programs/server && npm install
cd ~


#####################
### Setup Service ###
#####################

cat <<__EOF__ > ~/etc/wekan-setup
#!/bin/bash
export MONGO_URL=${MONGO_URL}
export ROOT_URL=${ROOT_URL}
export MAIL_URL=${MAIL_URL}
export MAIL_FROM=${MAIL_FROM}
export PORT=${PORT}
__EOF__

cat <<__EOF__ > ~/etc/wekan-start
#!/bin/bash
source ~/etc/wekan-setup
exec node ~/wekan/bundle/main.js
__EOF__

chmod 700 ~/etc/wekan-setup
chmod a+x ~/etc/wekan-start


## Init & Start as servcie
uberspace-setup-service wekan ~/etc/wekan-start

## Setup & Start in bg for debugging
# source ~/etc/wekan-setup && node ~/wekan/bundle/main.js &


#####################
###    Finish     ###
#####################

echo -e "\n  Login: ${ROOT_URL} \n\n"
```

# Control Wekan Service
Basic control of the Wekan service:
* Stop the service: `svc -d ~/service/wekan`
* Start the service: `svc -u ~/service/wekan`
* Keep an eye on the log while running the service: `tailf ~/service/wekan/log/main/current`

More about [daemontools](https://cr.yp.to/daemontools/faq/create.html).


# Uninstall Wekan
To remove Wekan from your uberspace you have to do the following steps.
* Stop and remove the service.
`uberspace-remove-service -s wekan`
* Remove the complete data.
```
mongo admin --port $MONGO_PORT -u $MONGO_USER -p $MONGO_PASS
use wekan
db.dropDatabase()
exit
```
* Remove the installation.
`rm -Rf ~/wekan/ ~/etc/wekan-*`
