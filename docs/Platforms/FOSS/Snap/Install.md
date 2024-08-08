## Installing newest Snap WeKan

Newest Stable Snap is at Snap Candidate channel:

https://github.com/wekan/wekan/discussions/5385

Later, when xet7 gets database migrations working, newest version will be added to Snap Stable channel too.

***

OLD INFO:

Snap for Linux, install to your own server or laptop. Automatic Updates. Only Standalone Wekan.

If on Snap Stable automatic update breaks something, [report Wekan for Snap bugs and feature requests here](https://github.com/wekan/wekan-snap/issues), so it can be fixed on some automatic update. If security is critical, keep behind firewall, without any ports open to Internet.

# Distro specific info how to install Snap on 64bit Linux

https://snapcraft.io

- Recommended: Newest 1) Ubuntu 2) Debian based distro
- Arch
- Fedora
- Solus
- OpenSUSE
- Gentoo
- Manjaro
- Elementary OS
- [CentOS 7, RHEL7 and newer](CentOS-7)
- [CentOS 8](CentOS8)

How ROOT_URL is set:
https://github.com/wekan/wekan/wiki/Settings

Here is how to add users:
https://github.com/wekan/wekan/wiki/Adding-users

How to switch between WeKan and WeKan Gantt GPL:
https://github.com/wekan/wekan/issues/2870#issuecomment-721364824

Newest Snap WeKan does not yet have migration to newest MongoDB. Here is how to try newer WeKan test candidate version, and migrate database manually:
https://github.com/wekan/wekan/issues/4505#issuecomment-1158380746

Below is how to install Snap.

# Install Wekan

### 1) Use root
```
sudo su
```

### 2) Install snap

a) Debian or Ubuntu
```
apt install snapd
```

b) Other distros

See [Snapcraft website](https://snapcraft.io).

### 3) Install Wekan. Set URL like (subdomain.)example.com(/suburl)
```
snap install wekan

snap set wekan root-url='https://wekan.example.com'
```

[MORE ROOT-URL EXAMPLES](https://github.com/wekan/wekan/wiki/Settings)

### 4) Set port where Wekan runs, for example 80 if http, or local port 3001, if running behing proxy like Caddy
```
snap set wekan port='3001'

systemctl restart snap.wekan.wekan
```

### 5) Install all Snap updates automatically between 02:00AM and 04:00AM

#### NEW:

Use `refresh.timer`, see https://github.com/wekan/wekan/issues/5402

#### OLD:

```
snap set core refresh.schedule=02:00-04:00
```
Update once a week at Sunday between 02:00AM and 04:00AM
```
snap set core refresh.schedule=sun,02:00-04:00
```
Update last Sunday of the month between 02:00AM and 04:00AM
```
snap set core refresh.schedule=sun5,02:00-04:00
```
[Update until specific day](https://snapcraft.io/docs/keeping-snaps-up-to-date#heading--refresh-hold) and other examples.

If required, you can disable all Snap updates at `/etc/hosts` by adding a line:
```
127.0.0.1 api.snapcraft.io
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
