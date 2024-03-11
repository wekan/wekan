## CentOS 7 and RHEL7 and newer

Alternatives:

- Snap install like below. Automatic updates. Some time ago there were problems with [Snap on CentOS 7](https://github.com/wekan/wekan-snap/issues/103#issuecomment-571223099), that can result in updating not working properly, but that is a long time ago, and Snap version is currently 2020-04-29 installed at about 400 servers worldwide, according to Snap statistics that show only wordwide and per-country stats, not any more specific info. Please keep [daily backups](https://github.com/wekan/wekan/wiki/Backup).
- Docker or Bash/SystemD install from https://wekan.github.io

***

[Wekan snap bug reports and feature requests](https://github.com/wekan/wekan-snap/issues)

# Distro specific info how to install Snap on 64bit Linux

https://snapcraft.io

- CentOS 7, RHEL7 and newer, instructions below

# Install Wekan

### 1) Use root
```
sudo su
```

### 2) Install snap

2019-11-12 If instead of Caddy you use Nginx in front of Wekan on CentOS 7, you should
[disable selinux to prevent Nginx permission denied error](https://github.com/wekan/wekan/issues/2792).

2018-11-05 Also see [new snapd on EPEL](https://forum.snapcraft.io/t/snapd-updates-in-fedora-epel-for-enterprise-linux/8310).

Source: [Experimental CentOS7 snap](https://copr.fedorainfracloud.org/coprs/ngompa/snapcore-el7/) and [Forum post](https://forum.snapcraft.io/t/install-snapd-on-centos/1495/21)

```
yum makecache fast

yum install yum-plugin-copr epel-release

yum copr enable ngompa/snapcore-el7

yum install snapd

systemctl enable --now snapd.socket
```

### 3) Install Wekan. Set URL like (subdomain.)example.com(/suburl)
```
snap install wekan

snap set wekan root-url='https://boards.example.com'
```

[MORE ROOT-URL EXAMPLES](https://github.com/wekan/wekan/wiki/Settings)

### 4) Set port where Wekan runs, for example 80 if http, or local port 3001, if running behing proxy like Caddy
```
snap set wekan port='3001'

systemctl restart snap.wekan.wekan
```

### 5) Install all Snap updates automatically between 02:00AM and 04:00AM
```
snap set core refresh.schedule=02:00-04:00
```

Automatic upgrades happen sometime after Wekan is released, or at scheduled time, or with `sudo snap refresh`

### 6) Email and Other Settings

```
sudo snap set wekan mail-url='smtps://user:pass@mailserver.example.com:453'
sudo snap set wekan mail-from='Wekan Boards <support@example.com>'
```

[Troubleshooting Email](https://github.com/wekan/wekan/wiki/Troubleshooting-Mail)

## LDAP

See [Supported Settings Keys](Supported-settings-keys#ldap)

## [Matomo Web Analytics integration](Supported-settings-keys#matomo-web-analytics-integration)

See [Supported Settings Keys](Supported-settings-keys#matomo-web-analytics-integration)

## [Rocket.Chat providing OAuth2 login to Wekan](https://github.com/wekan/wekan/wiki/OAuth2)

Also, if you have Rocket.Chat using LDAP/SAML/Google/etc for logging into Rocket.Chat, then same users can login to Wekan when Rocket.Chat is providing OAuth2 login to Wekan. 

# Optional: Install Caddy - Every Site on HTTPS

a) Personal non-commercial use only, included

b) Commercial use: see https://caddyserver.com/products/licenses
   and [commercial usage issue](https://github.com/wekan/wekan-snap/issues/39),
   contact Wekan maintainer x@xet7.org about how to enable commercial version
   of caddy.


### 7) Add domain to Caddy config
```
nano /var/snap/wekan/common/Caddyfile
```

### 8) Replace first top line of text with (subdomain.)example.com(/suburl), without any beginning of http/https

Example Caddyfile config.

"alpn http/1.1" is because Firefox Inspect Console does not support http/2, so [turning it off](https://github.com/wekan/wekan/issues/934) so that Firefox would not show wss websocket errors. Chrome console supports http/2.

This uses free Let's Encrypt SSL. You can also use [free CloudFlare wildcard SSL or any other SSL cert](https://github.com/wekan/wekan/wiki/Caddy-Webserver-Config).
```
boards.example.com {
	tls {
	  alpn http/1.1
	}

	proxy / localhost:3001 {
	  websocket
	  transparent
	}
}
```
Caddyfile example of static directory listing:
```
# Files have these permissions:
#   chown root:root /var/snap/wekan/common/download.example.com
download.example.com {
	root /var/snap/wekan/common/download.example.com
	browse
}
```
[MORE Caddyfile EXAMPLES](https://github.com/caddyserver/examples)

### 9) Enable Caddy automatic https
```
snap set wekan caddy-enabled='true'
```
## 10) Reboot

## 11) Disable and enable wekan

```
$ sudo snap disable wekan
$ sudo snap enable wekan
```
If you use the mongodb port for another app, then, change it too:
```
$ sudo snap set wekan mongodb-port=27019
```

## 12) Add users

[Add users](https://github.com/wekan/wekan/wiki/Adding-users)

[Forgot Password](https://github.com/wekan/wekan/wiki/Forgot-Password)

## MongoDB CLI

1) Install MongoDB 3.2.x tools, and run on CLI:

`mongo --port 27019`

***


# Older install docs

```
$ sudo snap install wekan
```

IMPORTANT: SETUP [URL SETTINGS](#url-settings) BELOW, SO OPENING CARDS ETC WORKS CORRECTLY. More info at [Supported settings keys](Supported-settings-keys).

**IMPORTANT: Wekan Snap is bleeding edge, so any commits made to the wekan repository are pushed to the snap directly. Decide for yourself if you want to run wekan snap in production**  

Make sure you have connected all interfaces, check more by calling

```
$ snap interfaces
```

Wekan has two services, to check status/restart/stop use systemd commands:

You can use these service commands:
- status
- start
- stop
- restart

MongoDB service:

```
$ sudo systemctl status snap.wekan.mongodb
```

Wekan service:

```
$ sudo systemctl status snap.wekan.wekan
```

## URL settings

[Nginx and Snap settings for https://example.com/wekan sub-url](https://github.com/wekan/wekan/wiki/Nginx-Webserver-Config)

Full URL to your Wekan, for example:

### Run Wekan on local network on selected port on computer IP address

```
$ sudo snap set wekan root-url='http://192.168.10.100:5000'
```

### Run Wekan only locally on selected port

```
$ sudo snap set wekan root-url='http://localhost:5000'
```

### Nginx or Caddy webserver in front of Wekan

[Nginx](https://github.com/wekan/wekan/wiki/Nginx-Webserver-Config) or [Caddy](https://github.com/wekan/wekan/wiki/Caddy-Webserver-Config) is in front, full URL to real web address URL of Nginx or Caddy.

```
$ sudo snap set wekan root-url='https://example.com'
```

or

```
$ sudo snap set wekan root-url='https://example.com/wekan'
```

## Port settings

Localhost port where Wekan is running. This does not need to be exposed to Internet when running behind Nginx or Caddy.

```
$ sudo snap set wekan port='<your_port>'
```

## Restart Wekan after changes

```
$ sudo systemctl restart snap.wekan.wekan
```

When running without any additional settings, Wekan is at http://localhost:8080
