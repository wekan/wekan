[Caddy 2 .well-known/assetlinks.json config for WeKan Android Play Store app](../PWA#fullscreen-android-app-with-caddy-and-wekan-server)

## Caddy 2

WeKan Snap Candidate for any Snap distros: https://github.com/wekan/wekan/wiki/OpenSuse , disable internal old Caddy 1, when using Caddy 2:
```
sudo snap set wekan caddy-enabled='false'
sudo snap set wekan port='3001'
sudo snap set wekan root-url='https://boards.example.com'
```
More info about root-url at https://github.com/wekan/wekan/wiki/Settings

Browser needs to have only one language https://github.com/wekan/wekan/issues/4803#issuecomment-1374354425

Install Caddy 2 stable release: https://caddyserver.com/docs/install#debian-ubuntu-raspbian

Like this:
```
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https

curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg

curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list

sudo apt update

sudo apt -y install caddy
```
Edit Caddyfile:

```
sudo nano /etc/caddy/Caddyfile
```

Example:

```
# Redirecting http to https

(redirect) {
        @http {
                protocol http
        }
        redir @http https://{host}{uri}
}

# WeKan board, proxy to localhost port, or IP-ADDRESS:PORT
boards.example.com {
        tls {
                load /var/snap/wekan/common/certs
                alpn http/1.1
        }

        reverse_proxy 127.0.0.1:3025
}

# Static website
example.com {
        tls {
                load /var/snap/wekan/common/certs
                alpn http/1.1
        }
        root * /var/websites/wekan.team
        file_server
}

# Files download directory browse website
files.example.com {
        root * /var/websites/ftp.secretchronicles.org/public
        file_server browse
}
```

Caddy commands list:
```
caddy help
```


***

[Caddy OAuth2 with Let's Encrypt SSL example](OAuth2)

***

## CloudFlare free wildcard SSL *start*

Also works with other SSL certs.

### 1) Requirements: You have changed nameservers to CloudFlare.

### 2) Get CloudFlare SSL wildcard Origin Certificate

Go to CloudFlare login/example.com/Crypto/Origin Certificates.
Create and download certs for `*.example.com, example.com`

### 3) Create directory /var/snap/wekan/common/certs
```
sudo su
cd /var/snap/wekan/common
mkdir certs
cd certs
```
### 4) Create cert file
Create file: `example.com.pem` with content of CloudFlare Origin Certificates.
```
nano example.com.pem
```
There add certs:
```
-----BEGIN PRIVATE KEY-----
-----END PRIVATE KEY-----
-----BEGIN CERTIFICATE-----
-----END CERTIFICATE-----
```

Then Save: Ctrl-o Enter

Then Exit: Ctrl-x.

### 5) Set permissions rw-r--r-- to example.com.pem:
```
chmod 644 example.com.pem
```

### 6) Edit Caddy webserver config
```
sudo nano /var/snap/wekan/common/Caddyfile
```
There change config:
```
http://example.com https://example.com {
        tls {
            load /var/snap/wekan/common/certs
            alpn http/1.1
        }
        proxy / localhost:3001 {
          websocket
          transparent
        }
}
```
Save: Ctrl-o Enter

Exit: Ctrl-x

Enable Caddy:
```
sudo snap set wekan caddy-enabled='true'
sudo snap set wekan port='3001'
sudo snap set wekan root-url='https://example.com'
```

### 7) Enable CloudFlare SSL

Click CloudFlare login/example.com/DNS.

Check that status of your domains have orange cloud color, so traffic goes through CloudFlare SSL.

Click CloudFlare login/example.com/Page Rules.
Set for example:
```
1) http://example.com/*
Always Use HTTPS
2) http://*.example.com/*
Always use HTTPS
```
Optionally, if you want caching:
```
3) *example.com/*
Cache Level: Cache Everything
```
## CloudFlare free wildcard SSL *end*

***

## Other config stuff

[List of Let's Encrypt implementations](https://community.letsencrypt.org/t/list-of-client-implementations/2103)

## Caddy webserver config with logs

Create directory for caddy, website and logs:
```bash
mkdir -p ~/caddy/example.com ~/caddy/logs
```

Add this config to ~/caddy/Caddyfile

There's also some extra examples.

```bash
example.com {
        root /home/username/caddy/example.com
        # Static website, markdown or html
        ext .md .html

        proxy /wekan 127.0.0.1:3000 {
                websocket
        }

	log /home/username/caddy/logs/wekan-access.log {
	    rotate {
		size 100 # Rotate after 100 MB
		age  7   # Keep log files for 7 days
		keep 52  # Keep at most 52 log files
	    }
	}
	errors {
		log /home/username/caddy/logs/wekan-error.log {
			size 100 # Rotate after 100 MB
			age  7   # Keep log files for 7 days
			keep 52  # Keep at most 52 log files
		}
	}
}

example.com/files {
	root /home/username/files
	# View files in directory, has sorting in browser
	browse
}
```

Install Caddy. Change username to what user you run caddy, like in /home/username , and Let's Encrypt email to your email adderess:

```bash
# Install caddy with some plugins
curl https://getcaddy.com | bash -s personal http.ipfilter,http.mailout,http.ratelimit,http.realip
```

# Give permissions to caddy to bind 80 and 443

```
sudo setcap cap_net_bind_service=+ep /usr/local/bin/caddy
```

And this service file for Caddy to /etc/systemd/system/caddy@.service

```bash
; see `man systemd.unit` for configuration details
; the man section also explains *specifiers* `%x`

[Unit]
Description=Caddy HTTP/2 web server %I
Documentation=https://caddyserver.com/docs
After=network-online.target
Wants=network-online.target
Wants=systemd-networkd-wait-online.service

[Service]
; run user and group for caddy
User=username
Group=username
ExecStart=/home/username/caddy/caddy -conf=/home/username/caddy/Caddyfile -agree -email="admin@example.com"
Restart=on-failure
StartLimitInterval=86400
StartLimitBurst=5
RestartSec=10
ExecReload=/bin/kill -USR1 $MAINPID
; limit the number of file descriptors, see `man systemd.exec` for more limit settings
LimitNOFILE=1048576
LimitNPROC=64
; create a private temp folder that is not shared with other processes
PrivateTmp=true
PrivateDevices=true
ProtectSystem=full
CapabilityBoundingSet=CAP_NET_BIND_SERVICE
AmbientCapabilities=CAP_NET_BIND_SERVICE
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
```

Start caddy and enable service:
```
sudo systemctl daemon-reload
sudo systemctl start caddy@username
sudo systemctl enable caddy@username
```