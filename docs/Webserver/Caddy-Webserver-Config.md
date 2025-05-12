## Infra Caddy Guy Scripts: Docker, Caddy Lightweight Server Management Bash TUI

- https://github.com/nguyenanhung/infra-caddy-guy
- https://news.ycombinator.com/item?id=43940096

----

[Caddy 2 .well-known/assetlinks.json config for WeKan Android Play Store app](../PWA#fullscreen-android-app-with-caddy-and-wekan-server)

# CloudFlare DNS

CNAME:

If some customer has CNAME to hosting platform subdomain,
hosting platform subdomain needs to be A record IP address to
hosting server Caddy webserver, because only that way
it can get Let's Encrypt TLS cert. It can not be nested like
customer CNAME to hosting CNAME to hosting A record,
because then getting Let's Encrypt TLS cert does not work.

Wildcard:

Wildcard DNS for Sandstorm only works with CloudFlare DNS.
It does not work with FreeDNS of Namecheap. More info at
https://github.com/wekan/wekan/wiki/Sandstorm

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

### PWA site.webmanifest icons override Caddy example

PWABuilder settings to create Android app at https://pwabuilder.com
- Web view (not Custom Tabs)
- Fullscreen (When not showing top and bottom toolbars. If you like to show those toolbars, change fullscreen to standalone)
- Notifications [X] Enable
- Signing key [X] Use mine

PWABuilder upgrades:
- Android app upgrade to Android SDK 34 was made with help of this video https://github.com/pwa-builder/PWABuilder/issues/4766#issuecomment-2229867608

Icons override at site.webmanifest:
- These settings at Caddyfile override icon URLs etc

If you like to show toolbars at top and bottom, change also here `fullscreen` to `standalone`

```
boards.wekan.team {
	tls {
		alpn http/1.1
	}
	header /.well-known/* Content-Type application/json
	header /.well-known/* Access-Control-Allow-Origin *
	respond /.well-known/assetlinks.json `[ {
		"relation": ["delegate_permission/common.handle_all_urls"],
		"target": {
			"namespace": "android_app",
			"package_name": "team.wekan.boards.twa",
			"sha256_cert_fingerprints": ["AA:AA:ED:7D:4C:9C:5A:A3:B5:DA:10:66:14:34:07:5D:EB:BE:96:CD:82:7B:09:46:47:13:65:29:5B:EA:96:30","61:41:86:5B:05:13:9B:64:5F:39:75:5A:16:C3:F2:22:25:6C:DA:74:B9:B0:8C:5F:93:B0:D2:26:65:16:1B:E6"]
		}
	}	]`
	header /site.webmanifest/* Content-Type application/json
	header /site.webmanifest/* Access-Control-Allow-Origin *
	respond /site.webmanifest ` {
		"name": "Wekan",
		"short_name": "Wekan",
		"icons": [ {
			"src": "svg-etc/wekan-logo-512.svg",
			"sizes": "any",
			"type": "image/svg"
		}		, {
			"src": "android-chrome-192x192.png",
			"sizes": "192x192",
			"type": "image/png"
		}		, {
			"src": "android-chrome-512x512.png",
			"sizes": "512x512",
			"type": "image/png"
		}		, {
			"src": "Square150x150Logo.scale-100.png",
			"sizes": "150x150",
			"type": "image/png"
		}		, {
			"src": "Square44x44Logo.scale-100.png",
			"sizes": "44x44",
			"type": "image/png"
		}		, {
			"src": "StoreLogo.scale-100.png",
			"sizes": "50x50",
			"type": "image/png"
		}		, {
			"src": "maskable_icon.png",
			"sizes": "474x474",
			"type": "image/png",
			"purpose": "maskable"
		}		, {
			"src": "monochrome-icon-512x512.png",
			"sizes": "512x512",
			"type": "image/png",
			"purpose": "monochrome"
		}		, {
			"src": "windows11/SmallTile.scale-100.png",
			"sizes": "71x71"
		}		, {
			"src": "windows11/SmallTile.scale-125.png",
			"sizes": "89x89"
		}		, {
			"src": "windows11/SmallTile.scale-150.png",
			"sizes": "107x107"
		}		, {
			"src": "windows11/SmallTile.scale-200.png",
			"sizes": "142x142"
		}		, {
			"src": "windows11/SmallTile.scale-400.png",
			"sizes": "284x284"
		}		, {
			"src": "windows11/Square150x150Logo.scale-100.png",
			"sizes": "150x150"
		}		, {
			"src": "windows11/Square150x150Logo.scale-125.png",
			"sizes": "188x188"
		}		, {
			"src": "windows11/Square150x150Logo.scale-150.png",
			"sizes": "225x225"
		}		, {
			"src": "windows11/Square150x150Logo.scale-200.png",
			"sizes": "300x300"
		}		, {
			"src": "windows11/Square150x150Logo.scale-400.png",
			"sizes": "600x600"
		}		, {
			"src": "windows11/Wide310x150Logo.scale-100.png",
			"sizes": "310x150"
		}		, {
			"src": "windows11/Wide310x150Logo.scale-125.png",
			"sizes": "388x188"
		}		, {
			"src": "windows11/Wide310x150Logo.scale-150.png",
			"sizes": "465x225"
		}		, {
			"src": "windows11/Wide310x150Logo.scale-200.png",
			"sizes": "620x300"
		}		, {
			"src": "windows11/Wide310x150Logo.scale-400.png",
			"sizes": "1240x600"
		}		, {
			"src": "windows11/LargeTile.scale-100.png",
			"sizes": "310x310"
		}		, {
			"src": "windows11/LargeTile.scale-125.png",
			"sizes": "388x388"
		}		, {
			"src": "windows11/LargeTile.scale-150.png",
			"sizes": "465x465"
		}		, {
			"src": "windows11/LargeTile.scale-200.png",
			"sizes": "620x620"
		}		, {
			"src": "windows11/LargeTile.scale-400.png",
			"sizes": "1240x1240"
		}		, {
			"src": "windows11/Square44x44Logo.scale-100.png",
			"sizes": "44x44"
		}		, {
			"src": "windows11/Square44x44Logo.scale-125.png",
			"sizes": "55x55"
		}		, {
			"src": "windows11/Square44x44Logo.scale-150.png",
			"sizes": "66x66"
		}		, {
			"src": "windows11/Square44x44Logo.scale-200.png",
			"sizes": "88x88"
		}		, {
			"src": "windows11/Square44x44Logo.scale-400.png",
			"sizes": "176x176"
		}		, {
			"src": "windows11/StoreLogo.scale-100.png",
			"sizes": "50x50"
		}		, {
			"src": "windows11/StoreLogo.scale-125.png",
			"sizes": "63x63"
		}		, {
			"src": "windows11/StoreLogo.scale-150.png",
			"sizes": "75x75"
		}		, {
			"src": "windows11/StoreLogo.scale-200.png",
			"sizes": "100x100"
		}		, {
			"src": "windows11/StoreLogo.scale-400.png",
			"sizes": "200x200"
		}		, {
			"src": "windows11/SplashScreen.scale-100.png",
			"sizes": "620x300"
		}		, {
			"src": "windows11/SplashScreen.scale-125.png",
			"sizes": "775x375"
		}		, {
			"src": "windows11/SplashScreen.scale-150.png",
			"sizes": "930x450"
		}		, {
			"src": "windows11/SplashScreen.scale-200.png",
			"sizes": "1240x600"
		}		, {
			"src": "windows11/SplashScreen.scale-400.png",
			"sizes": "2480x1200"
		}		, {
			"src": "windows11/Square44x44Logo.targetsize-16.png",
			"sizes": "16x16"
		}		, {
			"src": "windows11/Square44x44Logo.targetsize-20.png",
			"sizes": "20x20"
		}		, {
			"src": "windows11/Square44x44Logo.targetsize-24.png",
			"sizes": "24x24"
		}		, {
			"src": "windows11/Square44x44Logo.targetsize-30.png",
			"sizes": "30x30"
		}		, {
			"src": "windows11/Square44x44Logo.targetsize-32.png",
			"sizes": "32x32"
		}		, {
			"src": "windows11/Square44x44Logo.targetsize-36.png",
			"sizes": "36x36"
		}		, {
			"src": "windows11/Square44x44Logo.targetsize-40.png",
			"sizes": "40x40"
		}		, {
			"src": "windows11/Square44x44Logo.targetsize-44.png",
			"sizes": "44x44"
		}		, {
			"src": "windows11/Square44x44Logo.targetsize-48.png",
			"sizes": "48x48"
		}		, {
			"src": "windows11/Square44x44Logo.targetsize-60.png",
			"sizes": "60x60"
		}		, {
			"src": "windows11/Square44x44Logo.targetsize-64.png",
			"sizes": "64x64"
		}		, {
			"src": "windows11/Square44x44Logo.targetsize-72.png",
			"sizes": "72x72"
		}		, {
			"src": "windows11/Square44x44Logo.targetsize-80.png",
			"sizes": "80x80"
		}		, {
			"src": "windows11/Square44x44Logo.targetsize-96.png",
			"sizes": "96x96"
		}		, {
			"src": "windows11/Square44x44Logo.targetsize-256.png",
			"sizes": "256x256"
		}		, {
			"src": "windows11/Square44x44Logo.altform-unplated_targetsize-16.png",
			"sizes": "16x16"
		}		, {
			"src": "windows11/Square44x44Logo.altform-unplated_targetsize-20.png",
			"sizes": "20x20"
		}		, {
			"src": "windows11/Square44x44Logo.altform-unplated_targetsize-24.png",
			"sizes": "24x24"
		}		, {
			"src": "windows11/Square44x44Logo.altform-unplated_targetsize-30.png",
			"sizes": "30x30"
		}		, {
			"src": "windows11/Square44x44Logo.altform-unplated_targetsize-32.png",
			"sizes": "32x32"
		}		, {
			"src": "windows11/Square44x44Logo.altform-unplated_targetsize-36.png",
			"sizes": "36x36"
		}		, {
			"src": "windows11/Square44x44Logo.altform-unplated_targetsize-40.png",
			"sizes": "40x40"
		}		, {
			"src": "windows11/Square44x44Logo.altform-unplated_targetsize-44.png",
			"sizes": "44x44"
		}		, {
			"src": "windows11/Square44x44Logo.altform-unplated_targetsize-48.png",
			"sizes": "48x48"
		}		, {
			"src": "windows11/Square44x44Logo.altform-unplated_targetsize-60.png",
			"sizes": "60x60"
		}		, {
			"src": "windows11/Square44x44Logo.altform-unplated_targetsize-64.png",
			"sizes": "64x64"
		}		, {
			"src": "windows11/Square44x44Logo.altform-unplated_targetsize-72.png",
			"sizes": "72x72"
		}		, {
			"src": "windows11/Square44x44Logo.altform-unplated_targetsize-80.png",
			"sizes": "80x80"
		}		, {
			"src": "windows11/Square44x44Logo.altform-unplated_targetsize-96.png",
			"sizes": "96x96"
		}		, {
			"src": "windows11/Square44x44Logo.altform-unplated_targetsize-256.png",
			"sizes": "256x256"
		}		, {
			"src": "windows11/Square44x44Logo.altform-lightunplated_targetsize-16.png",
			"sizes": "16x16"
		}		, {
			"src": "windows11/Square44x44Logo.altform-lightunplated_targetsize-20.png",
			"sizes": "20x20"
		}		, {
			"src": "windows11/Square44x44Logo.altform-lightunplated_targetsize-24.png",
			"sizes": "24x24"
		}		, {
			"src": "windows11/Square44x44Logo.altform-lightunplated_targetsize-30.png",
			"sizes": "30x30"
		}		, {
			"src": "windows11/Square44x44Logo.altform-lightunplated_targetsize-32.png",
			"sizes": "32x32"
		}		, {
			"src": "windows11/Square44x44Logo.altform-lightunplated_targetsize-36.png",
			"sizes": "36x36"
		}		, {
			"src": "windows11/Square44x44Logo.altform-lightunplated_targetsize-40.png",
			"sizes": "40x40"
		}		, {
			"src": "windows11/Square44x44Logo.altform-lightunplated_targetsize-44.png",
			"sizes": "44x44"
		}		, {
			"src": "windows11/Square44x44Logo.altform-lightunplated_targetsize-48.png",
			"sizes": "48x48"
		}		, {
			"src": "windows11/Square44x44Logo.altform-lightunplated_targetsize-60.png",
			"sizes": "60x60"
		}		, {
			"src": "windows11/Square44x44Logo.altform-lightunplated_targetsize-64.png",
			"sizes": "64x64"
		}		, {
			"src": "windows11/Square44x44Logo.altform-lightunplated_targetsize-72.png",
			"sizes": "72x72"
		}		, {
			"src": "windows11/Square44x44Logo.altform-lightunplated_targetsize-80.png",
			"sizes": "80x80"
		}		, {
			"src": "windows11/Square44x44Logo.altform-lightunplated_targetsize-96.png",
			"sizes": "96x96"
		}		, {
			"src": "windows11/Square44x44Logo.altform-lightunplated_targetsize-256.png",
			"sizes": "256x256"
		}		, {
			"src": "android/android-launchericon-512-512.png",
			"sizes": "512x512"
		}		, {
			"src": "android/android-launchericon-192-192.png",
			"sizes": "192x192"
		}		, {
			"src": "android/android-launchericon-144-144.png",
			"sizes": "144x144"
		}		, {
			"src": "android/android-launchericon-96-96.png",
			"sizes": "96x96"
		}		, {
			"src": "android/android-launchericon-72-72.png",
			"sizes": "72x72"
		}		, {
			"src": "android/android-launchericon-48-48.png",
			"sizes": "48x48"
		}		, {
			"src": "ios/16.png",
			"sizes": "16x16"
		}		, {
			"src": "ios/20.png",
			"sizes": "20x20"
		}		, {
			"src": "ios/29.png",
			"sizes": "29x29"
		}		, {
			"src": "ios/32.png",
			"sizes": "32x32"
		}		, {
			"src": "ios/40.png",
			"sizes": "40x40"
		}		, {
			"src": "ios/50.png",
			"sizes": "50x50"
		}		, {
			"src": "ios/57.png",
			"sizes": "57x57"
		}		, {
			"src": "ios/58.png",
			"sizes": "58x58"
		}		, {
			"src": "ios/60.png",
			"sizes": "60x60"
		}		, {
			"src": "ios/64.png",
			"sizes": "64x64"
		}		, {
			"src": "ios/72.png",
			"sizes": "72x72"
		}		, {
			"src": "ios/76.png",
			"sizes": "76x76"
		}		, {
			"src": "ios/80.png",
			"sizes": "80x80"
		}		, {
			"src": "ios/87.png",
			"sizes": "87x87"
		}		, {
			"src": "ios/100.png",
			"sizes": "100x100"
		}		, {
			"src": "ios/114.png",
			"sizes": "114x114"
		}		, {
			"src": "ios/120.png",
			"sizes": "120x120"
		}		, {
			"src": "ios/128.png",
			"sizes": "128x128"
		}		, {
			"src": "ios/144.png",
			"sizes": "144x144"
		}		, {
			"src": "ios/152.png",
			"sizes": "152x152"
		}		, {
			"src": "ios/167.png",
			"sizes": "167x167"
		}		, {
			"src": "ios/180.png",
			"sizes": "180x180"
		}		, {
			"src": "ios/192.png",
			"sizes": "192x192"
		}		, {
			"src": "ios/256.png",
			"sizes": "256x256"
		}		, {
			"src": "ios/512.png",
			"sizes": "512x512"
		}		, {
			"src": "ios/1024.png",
			"sizes": "1024x1024"
		}
		],
		"screenshots": [ {
			"src": "screenshot1.webp",
			"sizes": "1280x720",
			"type": "image/webp"
		}		, {
			"src": "screenshot2.webp",
			"sizes": "1280x720",
			"type": "image/webp"
		}
		],
		"theme_color": "#000000",
		"background_color": "#000000",
		"start_url": "sign-in",
		"display": "fullscreen",
		"orientation": "any",
		"categories": [
		"productivity"
		],
		"iarc_rating_id": "70d7c4a4-3e5a-4714-a7dc-fa006613ba96",
		"description": "Open Source kanban with MIT license",
		"dir": "auto",
		"scope": "https://boards.wekan.team",
		"prefer_related_applications": false,
		"display_override": [
		"fullscreen"
		]
	}	`
	reverse_proxy 127.0.0.1:3025
}
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
