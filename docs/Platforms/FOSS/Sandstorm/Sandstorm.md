- At some cases [Hardened kernel may prevent creating new Wekan boards at Sandstorm](https://github.com/wekan/wekan/issues/1398)

# Sandstorm at Debian and Ubuntu

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
If having Sandstorm inside of KVM VM: https://github.com/wekan/wekan/blob/main/docs/Platforms/FOSS/Snap/Many-Snaps-on-LXC.md

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

https://github.com/wekan/wekan/wiki/Caddy-Webserver-Config

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
- [Rescuing MongoDB data from Sandstorm Grain .zip file to Standalone Wekan](Export-from-Wekan-Sandstorm-grain-.zip-file)

**Does not work**
- [Sandstorm open issues](https://github.com/wekan/wekan/issues?q=is%3Aissue+is%3Aopen+sandstorm+label%3ATargets%3ASandstorm)
- Import from Trello does not import attachments, because Sandstorm-compatible HTTP-access from Wekan to outside of Wekan grain sandbox is not implemented yet 
- [Copying/Moving card to another board](https://github.com/wekan/wekan/issues/1729).
- [REST API](https://github.com/wekan/wekan/issues/1279) 
- [Outgoing Webhooks](Outgoing-Webhook-to-Discord)
- [Email from Wekan](https://github.com/wekan/wekan/issues/2208#issuecomment-469290305)

## Demo

[![Try on Sandstorm][sandstorm_button]][sandstorm_appdemo]

## Keep backups

- Keep backups. Download your Wekan grains.
- It's possible to [Export from Wekan Sandstorm grain .zip file to rescue data](Export-from-Wekan-Sandstorm-grain-.zip-file)

## Wekan App

Wekan at [experimental](https://apps.sandstorm.io/app/m86q05rdvj14yvn78ghaxynqz7u2svw6rnttptxx49g1785cdv1h?experimental=true) or [official](https://apps.sandstorm.io/app/m86q05rdvj14yvn78ghaxynqz7u2svw6rnttptxx49g1785cdv1h) Sandstorm App Market. Note: Only use official. Experimental versions are broken.

Newest Wekap app .spk file download at https://releases.wekan.team/sandstorm/

## Bug reports and Feature Requests

[Wekan for Sandstorm bug reports and feature requests](https://github.com/wekan/wekan/issues)

[Sandstorm bug reports and feature requests](https://github.com/sandstorm-io/sandstorm/issues)

## Building Wekan for Sandstorm

[Building Wekan for Sandstorm](https://github.com/wekan/wekan-maintainer/wiki/Building-Wekan-for-Sandstorm)

## Wekan Sandstorm cards to CSV using Python

[Wekan Sandstorm cards to CSV using Python](Wekan-Sandstorm-cards-to-CSV-using-Python)

## Importing to Trello workaround

It is not possible to import attachments directly from Trello when using Sandstorm version of Wekan. This is because Wekan is in secure sandbox at Sandstorm, and does not yet have Sandstorm-compatible way to import attachments from outside of Sandstorm. You need to:
1. Install Standalone version of Wekan, for example Docker/Snap/VirtualBox, for example to your own computer
2. Import board from Trello
3. Export board as Wekan board. Exported JSON file includes attachments as base64 encoded files.
4. Import board as Wekan board to Sandstorm.

[sandstorm_button]: https://img.shields.io/badge/try-Wekan%20on%20Sandstorm-783189.svg
[sandstorm_appdemo]: https://demo.sandstorm.io/appdemo/m86q05rdvj14yvn78ghaxynqz7u2svw6rnttptxx49g1785cdv1h