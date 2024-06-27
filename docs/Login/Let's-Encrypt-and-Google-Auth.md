Tested on Ubuntu 16.04 based distro.

Wekan installed with https://github.com/wekan/wekan/wiki/Export-Docker-Mongo-Data

## A) Let's Encrypt support, without Google Auth:

1) https://caddyserver.com config Caddyfile:
```bash
my.domain.com {
  proxy / localhost:8080
}
```

2) Depending with what user you use to run Caddy, adding privileges to that user:
```bash
sudo setcap cap_net_bind_service=+ep ./caddy
```

## B) Caddy Let's Encrypt => Google Auth only allowed email addresses => Wekan

1) https://caddyserver.com config Caddyfile:
```bash
my.domain.com {
  proxy / localhost:7000
}
```

2) Depending with what user you use to run Caddy, adding privileges to that user:
```bash
sudo setcap cap_net_bind_service=+ep ./caddy
```

3) Adding Google Auth, so only those email addresses can login:

https://www.npmjs.com/package/proxybouncer

4) Create nologin user for proxybouncer:
```bash
useradd -M proxybouncer
usermod -L proxyboucer
```

5) /etc/systemd/system/proxybouncer.service:
```bash
[Unit]
Description=Proxybouncer

[Service]
ExecStart=/usr/local/bin/proxybouncer
Restart=always
RestartSec=5                       # Restart service after 10 seconds if node service crashes
StandardOutput=syslog               # Output to syslog
StandardError=syslog                # Output to syslog
SyslogIdentifier=proxybouncer
User=proxybouncer
Group=proxybouncer
Environment=PORT=7000 MY_URL=https://my.domain.com PROXY_TARGET=http://localhost:8080 GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... ALLOWED_EMAILS=.*@domain.com$ COOKIE_SECRET=...

[Install]
WantedBy=multi-user.target
```

6) Enable proxybouncer service:
```bash
sudo systemctl enable proxybouncer
sudo systemclt start proxybouncer
```
Question: Does this setup imply that everyone will be logged in to Wekan as 'proxybouncer'? Is there a way to pass username from Google via headers, etc.?

Answer: First login to Proxybouncer can limit login domain of G Suite. Second login is using Wekan username and password. There is no integrated login yet for standalone Wekan like there is for https://sandstorm.io