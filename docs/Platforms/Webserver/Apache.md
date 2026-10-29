## 1) Enable Mod_Proxy

```
sudo a2enmod ssl proxy proxy_http proxy_wstunnel proxy_balancer
```

[Apache Mod_Proxy documentation](https://httpd.apache.org/docs/current/mod/mod_proxy.html)

Use Apache httpd **2.4.60 or newer**. It fixes the 2024
[Confusion Attacks](https://blog.orange.tw/posts/2024-08-confusion-attacks-en/)
(CVE-2024-38472 to CVE-2024-38477 and CVE-2024-39573), and the examples below
pass WeKan's WebSocket with `upgrade=websocket`, which needs 2.4.47 or newer.

WeKan needs a reverse proxy only. Never enable `ProxyRequests On`: that turns
Apache into a forward proxy through which Internet clients can request arbitrary
third-party hosts. `ProxyMaxForwards` limits a forwarding chain's length; it does
not close an open proxy. The virtual-host examples below set `ProxyRequests Off`
explicitly so an unsafe global setting cannot leak into the WeKan host.

## 2) Restart Apache

Systemd:
```
sudo systemctl restart apache2
```
Init.d:
```
sudo service apache2 restart
```

## 3) Enable SSL in Apache config
```
Listen 443
```
## 4) Set Apache proxy

Remember to set `- ROOT_URL=` to the full URL used for your reverse proxy or as `ServerName`.

### a) Main URL

SSL with [Certbot](https://certbot.eff.org).

Config at `/etc/apache2/sites-available/example.com.conf`:

```ApacheConf
<VirtualHost *:443>

    ServerName example.com

    SSLEngine On
    SSLCertificateFile      /etc/letsencrypt/live/example.com/fullchain.pem
    SSLCertificateKeyFile   /etc/letsencrypt/live/example.com/privkey.pem
    Include /etc/letsencrypt/options-ssl-apache.conf
    ServerSignature Off
    ProxyRequests Off

    <Location />
     require all granted
    </Location>

    ProxyPass        "/" "http://127.0.0.1:3001/" upgrade=websocket
    ProxyPassReverse "/" "http://127.0.0.1:3001/"

</VirtualHost>
```

### b) Sub URL
Currently, favicon loading does not work with sub-url [wekan/issues/1692](https://github.com/wekan/wekan/issues/1692)

Config at `/etc/apache2/sites-available/example.com.conf`:

```ApacheConf
<VirtualHost *:443>

    ServerName example.com

    SSLEngine On
    SSLCertificateFile      /etc/letsencrypt/live/example.com/fullchain.pem
    SSLCertificateKeyFile   /etc/letsencrypt/live/example.com/privkey.pem
    Include /etc/letsencrypt/options-ssl-apache.conf
    ServerSignature Off
    ProxyRequests Off

    ProxyPass        "/wekan" "http://127.0.0.1:3001/wekan" upgrade=websocket
    ProxyPassReverse "/wekan" "http://127.0.0.1:3001/wekan"

</VirtualHost>
```
To run as default site:
```ApacheConf
<VirtualHost _default_:443>
```

### c) What not to add

WeKan does its own access control and serves nothing from Apache's disk, so
Apache only has to pass requests on. Each of these has turned that into a hole
([Confusion Attacks](https://blog.orange.tw/posts/2024-08-confusion-attacks-en/)):

- **No `RewriteRule` or `ProxyPassMatch` that puts part of the request into
  the target**, such as `RewriteRule "^/x/(.*)$" "/$1"` or `... "ws://host/$1"`.
  mod_rewrite cuts a target at a decoded `?` (`%3F`) and tries a rewritten path
  both inside and outside `DocumentRoot`, so a capture can reach files anywhere
  on the server, or another proxy target. The plain `ProxyPass` above maps a
  fixed prefix, and `upgrade=websocket` replaced the `ProxyPassMatch` these
  examples used for the WebSocket.
- **No `<Files>` or `<Location>` rule to protect part of WeKan**, such as an
  admin page behind a password. Apache matches its own idea of the name, which
  a request can make differ from what WeKan serves; WeKan checks permissions
  itself.
- **Keep `AllowEncodedSlashes` Off and `MergeSlashes` On**, the defaults. On
  Windows, `AllowEncodedSlashes On` let a request reach a UNC path and send the
  server's NTLM hash to another host (CVE-2024-38472).
- **Keep `<Directory />` at `Require all denied`**, and do not grant directories
  such as `/usr/share` in the WeKan virtual host: nothing there is WeKan's.

## 5) Enable your site

```
sudo a2ensite example.com
```
Or, add symlink manually:
```
sudo su

cd /etc/apache2/sites-enabled

ln -s ../sites-available/example.com.conf example.com.conf
```
On some distributions, Apache config is at different path:
```
cd /etc/httpd/conf.d
```

## 6) Reload Apache

Systemd:
```
sudo systemctl restart apache2
```
Init.d:
```
sudo service apache2 restart
```

## 7) Snap settings

### a) Main URL
```
sudo snap set wekan port='3001'

sudo snap set wekan root-url='https://example.com'
```
### b) Sub URL
```
snap set wekan port='3001'

snap set wekan root-url='https://example.com/wekan'
```

[All snap settings](https://github.com/wekan/wekan-snap/wiki/Supported-settings-keys)
