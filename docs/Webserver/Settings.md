## Standalone Wekan Settings: Snap, Docker, Source etc (not Sandstorm)

## ROOT_URL / root-url
- See https://github.com/wekan/wekan/issues/4803
- Docker/Source/Bundle like this, no quotes, big letters, underscore: `ROOT_URL=http://192.168.0.100`
- **Snap** like this, single quotes, small letters: `sudo snap set wekan root-url='http://192.168.0.100'`

## Webserver config
* [Nginx](Nginx-Webserver-Config)
* [Apache](Apache)
* [Caddy](Caddy-Webserver-Config)

Examples:

1) nginx SSL or without SSL, available at internet:
- root-url='https://example.com'   or https://example.com/something or https://something.example.com , or with http
- port='3001'
- [Nginx example, proxying to local port 3001](Nginx-Webserver-Config)
=> Wekan at https://example.com

2) only wekan, no SSL, internal lan, caddy not enabled:
- root-url='http://192.168.1.150'
- port='80'
=> Wekan locally http://192.168.1.150

3) only wekan, no SSL, internal lan, caddy not enabled, wekan at different port:
- root-url='http://192.168.1.150:5000'
- port='5000'
=> Wekan locally http://192.168.1.150:5000

4) wekan's caddy SSL, available at Internet:
- root-url='https://example.com'   or https://example.com/something or https://something.example.com
- port='3001'
- [Caddyfile example](https://github.com/wekan/wekan-snap/wiki/Install#7-replace-first-top-line-of-text-with-subdomainexamplecomsuburl-without-any-beginning-of-httphttps)
=> Wekan at https://example.com

Wekan runs http server on local port, so it is without SSL. To get SSL, some webserver like Caddy and Nginx that have SSL, can proxy to local Wekan http port where node.js runs.

## Admin Panel

First registered Wekan user will get [Admin Panel](Features) on new
Docker and source based installs. You can also on MongoDB 
[enable Admin Panel](https://github.com/wekan/wekan/blob/main/CHANGELOG.md#v0111-rc2-2017-03-05-wekan-prerelease) and [change you as board admin](https://github.com/wekan/wekan/issues/1060#issuecomment-310545976).

## LAN + VPN

[Using same database for both LAN and VPN Wekan](https://github.com/wekan/wekan-mongodb/blob/master/docker-compose.yml#L86-L100)

## Proxy

[Using Proxy](https://github.com/wekan/wekan/issues/1480)

## Email

[Troubleshooting Mail](Troubleshooting-Mail). For Exchange, you can use [DavMail](http://davmail.sourceforge.net), Wekan SMTP => DavMail => Exchange.

## RAM usage

[RAM usage](https://github.com/wekan/wekan/issues/1088#issuecomment-311843230)