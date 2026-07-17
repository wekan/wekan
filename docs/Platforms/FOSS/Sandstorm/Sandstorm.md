- At some cases [Hardened kernel may prevent creating new Wekan boards at Sandstorm](https://github.com/wekan/wekan/issues/1398)

## 1. Backup Sandstorm

1. Please first backup your Sandstorm https://docs.sandstorm.io/en/latest/administering/backups/
2. Please first download all of your grains to .zip files from top menu row down arrow button, just in case.

## 2. Upgrade Sandstorm WeKan 

Backup your Sandstorm first ! See above !

This new Sandstorm WeKan uses fork of FerretDB v1 SQLite at https://github.com/wekan/FerretDB

- FerretDB is drop-in replacement for MongoDB 7 Server
- FerretDB implements MongoDB 7 server wire protocol
- FerretDB converts MongoDB Javascript queries to SQLite SQL queries
- FerretDB saves data to SQLite database
- Fork has additional MongoDB features
- Fork is maintained by xet7

Migrating old MongoDB 3 data

- If there is old WeKan data, it is automatically migrated when opening old WeKan grain.
  Attachments are migrated from MongoDB to files/attachments.
  Text data is migrated from MongoDB to SQLite at files/db/wekan.sqlite .
- After migrating, you may get error, that browser can not open that page embedded to other page.
  So you need to close WeKan grain and open it again. Sorry, trying to fix it later.

All Boards page

- WeKan starts at All Boards page Favorites
- All your boards are at first at Remaining, until you Star to have your board at Favorites
- You can move boards from Remaining to your personal Workspaces or Sub-Workspaces

After migrating, free some disk space

- If after migrating you would like to free disk space of WeKan grain
  by deleting old MongoDB raw database files
- At right top corner, click your WeKan username at WeKan board (not at Sandstorm black backround) /
  Member Settings / Admin Panel / Attachments / Sandstorm / Delete raw MongoDB database files.

Cover image

- You can enable it for minicard and card at:
  Right Sidebar/Board Settings/Card Settings/Cover Image
  (at bottom of Card Settings list).

Download Official Version

- [Official Sandstorm Store](https://apps.sandstorm.io/app/m86q05rdvj14yvn78ghaxynqz7u2svw6rnttptxx49g1785cdv1h)

Download Newest Test Version

1. Please backup first.
2. Go to [Sandstorm Test App Loader](https://mnutt.github.io/sandstorm-test-app-loader/?spk_url=https%3A%2F%2Fgithub.com%2Fwekan%2Fwekan%2Freleases%2Fdownload%2Fv9.89%2Fwekan-sandstorm-2026_07_13-16_54_56.spk&package_id=1c39541fb4710bdb04a68d0b66e9d634)
3. Copy newest wekan.spk URL from https://github.com/wekan/wekan/releases to Sandstorm Test App Loader page
4. Write your Sandstorm Instance URL to Sandstorm Test Loader page
5. Click Install
6. Later, newest WeKan will also be added to [Experimental](https://apps.sandstorm.io/app/m86q05rdvj14yvn78ghaxynqz7u2svw6rnttptxx49g1785cdv1h?experimental=true)
   and [Official](https://apps.sandstorm.io/app/m86q05rdvj14yvn78ghaxynqz7u2svw6rnttptxx49g1785cdv1h) Sandstorm Store.

About CloudFlare and uploading wekan.spk file

- If your Sandstorm you use CloudFlare, there may be 100 MB file size upload limit,
  it prevents uploading wekan.spk as file to your Sandstorm
- So instead use above Sandstorm Test App Loader to install Newest Test Version

### Sandstorm Radicale: Calendars and Contacts

- 2025-08-05
  - Exporting Calendar and Contacts from Google Calendar and Google Contacts to Sandstorm Radicale works.
  - Importing Calendar .ics file back to Google Calendar does not work, because .ics file size is 2.1 MB.
    Google Calendar has problems importing .ics files bigger than 1 MB, it would need manual splitting to multiple files.
    Sandstorm Radicale can import .ics file 2.1 MB successfully.

### Sandstorm CloudFlare DNS settings

Sandstorm works when configured to full domain, with CloudFlare SSL/TLS, with Caddy.
Not subdomain, not sub-url, and not with Let's Encrypt that AFAIK does not support wildcard SSL/TLS.

Source: https://github.com/sandstorm-io/sandstorm/issues/3714#issuecomment-2366866243

For me, it works at CloudFlare DNS using TLS Strict checking and DNS setting clicking to orange cloud icon to make TLS proxy with Origin certificate, that is at /etc/caddy/certs/example.com.pem with above private key and below cert.

DNS records:
```
* A example.com ip-address
@ A example.com ip-address
```
Caddyfile, proxy to KVM VM that is running Debian and Sandstorm:
```
# Full domain where Sandstorm login is. Not subdomain. Not sub-url.
*.example.com example.com {
        tls {
                load /etc/caddy/certs
                alpn http/1.1
        }
        # If KVM VM, it's IP address:
        #reverse_proxy 123.123.123.123:80
        # Localhost port 81, when not in KVM VM 
        reverse_proxy 127.0.0.1:81
}

blog.somecompany.com {
        tls {
                load /etc/caddy/certs
                alpn http/1.1
        }
        # Blog hosted at Sandstorm WordPress
        reverse_proxy 127.0.0.1:81
}

othercompany.com {
        tls {
                load /etc/caddy/certs
                alpn http/1.1
        }
        # Website hosted at Sandstorm Hacker CMS
        reverse_proxy 127.0.0.1:81
}
```
If having Sandstorm inside of KVM VM: [Many Snaps on LXC](../Snap/Many-Snaps-on-LXC.md)

At /opt/sandstorm/sandstorm.conf is domain where Sandstorm login is, http port etc.
```
SERVER_USER=sandstorm
PORT=81
MONGO_PORT=6081
BIND_IP=127.0.0.1
BASE_URL=https://example.com
WILDCARD_HOST=*.example.com
UPDATE_CHANNEL=dev
ALLOW_DEV_ACCOUNTS=false
SMTP_LISTEN_PORT=25
#SANDCATS_BASE_DOMAIN=sandcats.io
#HTTPS_PORT=443
```
Some related info at:

[Caddy Webserver Config](../../../Webserver/Caddy.md)

I also had to wait that Origin certificate becomes active.

But this worked for me only at CloudFlare. It did not work at FreeDNS of Namecheap.

Also, I still need to write script to fix IP address if Dynamic DNS IP address changes, using CloudFlare API, because my cable modem does not have DDNS option for CloudFlare.

Now that there is also a way to run Sandstorm at Ubuntu, it would be possible for me to move Sandstorm from KVM VM to run directly at host, without VM, and proxy from Caddy to localhost port of Sandstorm.

https://groups.google.com/g/sandstorm-dev/c/4JFhr7B7QZU?pli=1

### Debian amd64

Installing Sandstorm works normally

### Ubuntu 24.04 amd64

At startup was a lot of errors and saw "Permission denied; name = /proc/self/setgroups"

I found this (run as root):
```
echo "kernel.apparmor_restrict_unprivileged_userns = 0" >/etc/sysctl.d/99-userns.conf
sysctl --system
```
And I ran it and restarted the Sandstorm service, everything seemed to work fine.
I hope this might be useful to someone.

Source: https://groups.google.com/g/sandstorm-dev/c/4JFhr7B7QZU

## Sandstorm Website

[Sandstorm Website](https://sandstorm.org)

If you have any grains at Sandstorm's **Oasis montly paid service**, please move those to self-hosted, because [only **Oasis grain hosting** part is shutting down](https://sandstorm.io/news/2019-09-15-shutting-down-oasis) - [HN](https://news.ycombinator.com/item?id=20979428). This does not affect any other parts like self-hosting at sandcats.io, App Market, updates, etc.

Works on Ubuntu 64bit, on Debian 64bit.

[Security audited](https://sandstorm.io/news/2017-03-02-security-review), recommended for security critical use on public internet or internal network. [Sandstorm Security Features](https://docs.sandstorm.io/en/latest/using/security-practices/). Sandstorm is [completely Open Source](https://sandstorm.io/news/2017-02-06-sandstorm-returning-to-community-roots), including [Blackrock Clustering](https://github.com/sandstorm-io/blackrock).

Install to your own server. Automatic updates, tested before release. Sandstorm Wekan has different features than Standalone.

**Works**
- Google/GitHub/LDAP/SAML/Passwordless email login.
- Import from Wekan JSON.
- Free SSL at https://yourservername.sandcats.io domain.
- [Rescuing MongoDB data from Sandstorm Grain .zip file to Standalone Wekan](Export-from-Wekan-Sandstorm-grain-.zip-file.md)

**Does not work**
- [Sandstorm open issues](https://github.com/wekan/wekan/issues?q=is%3Aissue+is%3Aopen+sandstorm+label%3ATargets%3ASandstorm)
- Import from Trello does not import attachments, because Sandstorm-compatible HTTP-access from Wekan to outside of Wekan grain sandbox is not implemented yet 
- [Copying/Moving card to another board](https://github.com/wekan/wekan/issues/1729).
- [REST API](https://github.com/wekan/wekan/issues/1279) 
- [Outgoing Webhooks](../../../Webhooks/Discord/Outgoing-Webhook-to-Discord.md)
- [Email from Wekan](https://github.com/wekan/wekan/issues/2208#issuecomment-469290305)

## Demo

[![Try on Sandstorm][sandstorm_button]][sandstorm_appdemo]

## Keep backups

- Keep backups. Download your Wekan grains.
- It's possible to [Export from Wekan Sandstorm grain .zip file to rescue data](Export-from-Wekan-Sandstorm-grain-.zip-file.md)

## Wekan App

Wekan at [experimental](https://apps.sandstorm.io/app/m86q05rdvj14yvn78ghaxynqz7u2svw6rnttptxx49g1785cdv1h?experimental=true) or
[official](https://apps.sandstorm.io/app/m86q05rdvj14yvn78ghaxynqz7u2svw6rnttptxx49g1785cdv1h) Sandstorm App Market. Note: Only use official. Experimental versions are broken.

Newest Wekap app .spk file download at https://releases.wekan.team/sandstorm/

## Bug reports and Feature Requests

[Wekan for Sandstorm bug reports and feature requests](https://github.com/wekan/wekan/issues)

[Sandstorm bug reports and feature requests](https://github.com/sandstorm-io/sandstorm/issues)

## Building Wekan for Sandstorm

[Building Wekan for Sandstorm](https://github.com/wekan/wekan-maintainer/wiki/Building-Wekan-for-Sandstorm)

## Wekan Sandstorm cards to CSV using Python

[Wekan Sandstorm cards to CSV using Python](Wekan-Sandstorm-cards-to-CSV-using-Python.md)

## Importing to Trello workaround

It is not possible to import attachments directly from Trello when using Sandstorm version of Wekan. This is because Wekan is in secure sandbox at Sandstorm, and does not yet have Sandstorm-compatible way to import attachments from outside of Sandstorm. You need to:
1. Install Standalone version of Wekan, for example Docker/Snap/VirtualBox, for example to your own computer
2. Import board from Trello
3. Export board as Wekan board. Exported JSON file includes attachments as base64 encoded files.
4. Import board as Wekan board to Sandstorm.

[sandstorm_button]: https://img.shields.io/badge/try-Wekan%20on%20Sandstorm-783189.svg
[sandstorm_appdemo]: https://demo.sandstorm.io/appdemo/m86q05rdvj14yvn78ghaxynqz7u2svw6rnttptxx49g1785cdv1h
