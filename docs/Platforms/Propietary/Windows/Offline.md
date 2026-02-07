Also see: [Windows](Windows)

[Other CPU/OS On-Premise WeKan install](https://github.com/wekan/wekan/wiki/Raspberry-Pi)

## Wekan Windows 64bit version On-Premise

INFO ABOUT SETTINGS: https://github.com/wekan/wekan/issues/5591#issuecomment-2503681293

This is without container (without Docker or Snap).

Right click and download files 1-4:

1. [wekan-8.29-amd64-windows.zip](https://github.com/wekan/wekan/releases/download/v8.29/wekan-8.29-amd64-windows.zip)

2. [node.exe](https://nodejs.org/dist/latest-v14.x/win-x64/node.exe)

3. [mongodb-windows-x86_64-7.0.29-signed.msi](https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-7.0.29-signed.msi)

4. [start-wekan.bat](https://raw.githubusercontent.com/wekan/wekan/main/start-wekan.bat)

5. Copy files from steps 1-4 with USB stick or DVD to offline Windows computer

6. Double click `mongodb-windows-x86_64-7.0.29-signed.msi` . In installer, uncheck downloading MongoDB compass.

7. Unzip `wekan-8.29-amd64-windows.zip` , inside it is directory `bundle`, to it copy other files:

```
bundle (directory)
  |_ start-wekan.bat (downloaded file)
  |_ node.exe (downloaded file)
  |_ main.js (extracted file)
```
8. Edit `start-wekan.bat` with Notepad. There add [Windows computer IP address](https://support.microsoft.com/en-us/windows/find-your-ip-address-in-windows-f21a9bbc-c582-55cd-35e0-73431160a1b9) , like this, then Wekan will be at http://IP-ADDRESS-HERE/sign-in , for example http://192.168.0.100/sign-in but your different IP address. Add there wekan server computer IP address, not localhost. `node.exe main.js` is at bottom of `start-wekan.bat`, change there longer filename:
```
SET ROOT_URL=http://IP-ADDRESS-HERE

SET PORT=80

node.exe main.js
```
If there is already some webserver at port 80, change to other port:
```
REM # Writable path required to exist and be writable for attachments to migrate and work correctly
SET WRITABLE_PATH=..

SET ROOT_URL=http://IP-ADDRESS-HERE:2000

SET PORT=2000
```
Then Wekan will be at http://IP-ADDRESS-HERE:2000/sign-in , for example http://192.168.0.100/sign-in , but with your different IP address.

9. Double click `start-wekan.bat` to run it. Give permission to network. If it does not work, try instead with right click, Run as Administrator.

10. For mobile devices, you can [create PWA app icon](PWA) using that http://IP-ADDRESS-HERE:2000/sign-in

RELATED INFO:
- Windows 2022 server example https://github.com/wekan/wekan/issues/5084
- Other settings example https://github.com/wekan/wekan/issues/4932

## SSL/TLS at internal network, that is not connected to Internet, and can not be used from Internet

Configuring Caddy for SSL/TLS on a local LAN without an internet connection requires you to **manually create and manage certificates**, as Caddy's automatic certificate provisioning relies on external services like Let's Encrypt, which need internet access. Here's a breakdown of the process:

#### Generate Certificates 🔑

First, you'll need to generate a self-signed certificate authority (CA) and then use it to sign a certificate for your local domain. You can use tools like **OpenSSL** or **Caddy's own `cert` command**.

1.  **Create a Root CA:**
    `openssl genrsa -out rootCA.key 2048`
    `openssl req -x509 -new -nodes -key rootCA.key -sha256 -days 365 -out rootCA.pem`

2.  **Create a Server Certificate:**

      * Create a configuration file (`server.csr.cnf`) for your server certificate.
      * `openssl req -new -nodes -newkey rsa:2048 -keyout server.key -out server.csr -config server.csr.cnf`
      * `openssl x509 -req -in server.csr -CA rootCA.pem -CAkey rootCA.key -CAcreateserial -out server.crt -days 365 -sha256 -extfile server.csr.cnf -extensions req_ext`

This process creates `server.crt` and `server.key`—the files Caddy will use.

#### Configure Caddyfile 📜

Next, you need to tell Caddy to use these specific certificates instead of trying to get them automatically. 
Modify your `Caddyfile` to use the `tls` directive with the paths to your generated files.

Caddyfile:
```
wekan.example.com {
        tls {
            load C:\wekan\certs\example.com.pem
            alpn http/1.1
        }
        proxy / localhost:2000 {
          websocket
          transparent
        }
}
```

  * **`your_local_domain.lan`** is the hostname you'll use to access the site from other computers on your network.
  * **`tls C:\path\to\server.crt C:\path\to\server.key`** is the key part. It explicitly tells Caddy to use these certificate and key files.

#### Trust the Certificate 🔒

Finally, for browsers and other clients on your network to trust the connection and not show a security warning, you must **install the root CA certificate (`rootCA.pem`) on each client machine**.

1.  On each client, navigate to the certificate management store (e.g., in Windows, search for "Manage computer certificates").
2.  Import the `rootCA.pem` file into the "Trusted Root Certification Authorities" store.

This tells the client that any certificate signed by this CA (like your `server.crt`) is trustworthy. Without this step, every client will display a **security warning** because the certificate isn't from a publicly trusted authority.

#### Add wekan.example.com to every computer hosts file

As Administrator, edit with Notepad, changing dropdown *.txt to All Files, C:\Windows\System32\drivers\etc\hosts textfile.

To hosts file, add WeKan server local IP address:

```
192.168.0.200 wekan.example.com
```

Alternatively, use some nameserver at Windows server to have domain names at local network.

#### Other remaining settings for local network SSL/TLS, not connected to Internet

Look at similar settings below.

## SSL/TLS with Caddy webserver, accessible at Internet

- [Other unrelated Caddy info](../../../Webserver/Caddy.md)

This will start Caddy, like this:

```
example.com CloudFlare SSL/TLS Origin Certificate HTTP 443
=> Public IPv4 Cable modem HTTPS port 443
=> Local IPv4 HTTPS port 443 Caddy
=> Local IPv4 HTTP port 2000 Node.js main.js WeKan
=> MongoDB port 27017
```

From CloudFlare to Caddy, all is SSL/TLS encrypted.
Caddy proxies all encrypted traffic to Node.js unencrypted HTTP port 2000.

At WeKan server laptop/desktop, locally between these executeable files,
HTTP traffic is not encrypted:

- Between Caddy and WeKan
- Between WeKan and MongoDB

But outside of that server, all is SSL/TLS encrypted.

#### 1) At your Internet router, forward ports HTTP 80 and HTTPS 443 to your server laptop/desktop IP address. Example:

Arris cable modem:

1. Login
2. Firewall / Virtual Server Port Forwarding
3. Add HTTP 80 and HTTPS 443:

HTTP 80:
```
Description: HTTP
Inbound Port: 80 to 80
Format: TCP
Private IP Address: YOUR-WEKAN-SERVER-LOCAL-IPv4-ADDRESS (example: 192.168.0.200)
Local Port: 80 to 80
```

HTTPS 443:
```
Description: HTTP
Inbound Port: 443 to 443
Format: TCP
Private IP Address: YOUR-WEKAN-SERVER-LOCAL-IPv4-ADDRESS (example: 192.168.0.200)
Local Port: 443 to 443
```


#### 2) Check your WeKan server Windows computer local IPv4 address

You can check your IP address on Windows 11 using either the **Settings app** or the **Command Prompt**.
These methods will show you your **local IP address**, which is the address your device uses to
communicate within your home or office network.

Your **public IP address**, which is what devices outside your network see, is assigned by your
internet service provider (ISP) and can be found using an online tool or a simple web search.

#### Method 1: Using the Settings App ⚙️

1.  Open the **Start menu** and click on **Settings** (or press the **Windows key + I**).
2.  In the left-hand menu, click on **Network & internet**.
3.  Click on the connection you're currently using, either **Wi-Fi** or **Ethernet**. 
4.  On the next screen, your IP address (both IPv4 and IPv6) will be listed under the **Properties** section.

#### Method 2: Using the Command Prompt 💻

1.  Click the **Start menu** or the **search icon** on your taskbar, type "**cmd**," and press **Enter**.
2.  In the Command Prompt window, type `ipconfig` and press **Enter**.
3.  Look for your active connection (e.g., "Ethernet adapter" or "Wireless LAN adapter Wi-Fi").
    Your IP address will be listed next to "**IPv4 Address**."

### 3) Finding Your Public IP Address 🌍

a) At Arris Cable Modem, public IP address is at Login / WAN Setup / DHCP / IP Address

b) To find your public IP address, simply open a web browser and search for "**what is my IP**."
   A search engine like Google will display your public IP address right at the top of the search results.

### 4) If you don't have domain name like example.com

1. Register and login to https://cloudflare.com

2. Buy a domain, like example.com

### 5) Add settings at CloudFlare

1. CloudFlare / Account Home / AI Audit: Block all AI crawlers, so that they do not slow down your websites and WeKan.
   But if you need Google Search to see your website like example.com, allow Googlebot.

2. CloudFlare / Account Home / example.com / DNS / Records / Add Record

```
Type: A
Name: wekan (for wekan.example.com, or kanban for kanban.example.com)
IPv4 Address: YOUR-PUBLIC-IPv4-ADDRESS (example: 80.123.123.123)
- Proxy Status: Orange cloud selected (not grey cloud)
- TTL: Auto
```
3. Click Save

4. CloudFlare / Account Home / example.com / SSL/TLS / Overview / SSL/TLS Encryption / Configure / Full (strict)

5. CloudFlare / Account Home / example.com / Origin Server / Create Cerfificate for example.com

6. At Notepad, copy paste SSL/TLS certs in this order from top to bottom to one textfile `example.com.pem`:

```
1. Private Cert
2. Public Cert
3. Certificate Chain
```

7. Have for example this directory structure (can also be D: or E: etc)

```
C:.
├───wekan directory
│   ├───files directory
│   ├───certs directory
│   │   └───example.com.pem
│   ├───bundle directory
│   │   └───main.js
│   ├───caddy.exe from .zip file
│   ├───Caddyfile textfile for Caddy 2 config
│   └───start-wekan.bat textfile
│ 
└───Program Files
```

8. Edit `start-wekan.bat` with Notepad, search and change these settings, change subdomain wekan.example.com
   and node saving cmd.exe text outout to log.txt for logging:

```
SET WRITABLE_PATH=..\FILES

SET ROOT_URL=https://wekan.example.com  

SET PORT=2000

node main.js > log.txt 2>&1
```
If you have problems with attachments, instead try:
```
SET WRITABLE_PATH=..\FILES\
```

9. Download newest Caddy webserver caddy_VERSION-NUMBER_windows_amd64.zip from
https://github.com/caddyserver/caddy/releases ,
extract .zip file, and copy caddy.exe to above directory structure.

- Caddy website https://caddyserver.com
- Caddy features https://caddyserver.com/features
- Caddy code https://github.com/caddyserver/caddy
- Caddy forum https://caddy.community/

10. To Caddyfile, with Notepad add this:

```
wekan.example.com {
        tls {
            load C:\wekan\certs\example.com.pem
            alpn http/1.1
        }
        proxy / localhost:2000 {
          websocket
          transparent
        }
}
```
11. Open `cmd.exe` terminal, write there:

```
C:

cd \wekan

wekan.bat
```

12. Open another `cmd.exe` terminal, write there this. It will format Caddyfile to have
    correct text format, and validate is Caddyfile configuration settings correct.

```
C:

cd \wekan

caddy fmt --overwrite Caddyfile

caddy validate
```
If there is errors, ask Google Search about that error, edit Caddyfile with Notepad to fix it.

If there is not any errors, start Caddy:
```
caddy
```
This will start Caddy, like this:

example.com CloudFlare SSL/TLS Origin Certificate HTTP 443
=> Public IPv4 Cable modem HTTPS port 443
=> Local IPv4 HTTPS port 443 Caddy
=> Local IPv4 HTTP port 2000 Node.js main.js WeKan
=> MongoDB port 27017

From CloudFlare to Caddy, all is SSL/TLS encrypted.
Caddy proxies all encrypted traffic to Node.js unencrypted HTTP port 2000.

At WeKan server laptop/desktop, locally between these executeable files,
HTTP traffic is not encrypted:
- Between Caddy and WeKan
- Between WeKan and MongoDB

But outside of that server, all is SSL/TLS encrypted.

## Docker WeKan Offline


At Internet connected computer, download:

1. Docker for Windows
2. docker-compose.yml from https://github.com/wekan/wekan
3. `docker-compose up -d` at Internet connected computer
4. Save wekan-app and wekan-db containers to files https://docs.docker.com/engine/reference/commandline/save/

At Offline Windows computer:

1. Install Docker for Windows
2. Load `wekan-app` container from file https://docs.docker.com/engine/reference/commandline/load/
3. Check what is ID of `wekan-app` container with `docker images`
4. Change at `docker-compose.yml` wekan-app contaier `image:gc....` to `image:ID` where ID from step 3 above
5. Do steps 2-4 also for `wekan-db` container
6. `docker-compose up -d`

## WeKan Updates

1. Updating only WeKan. Not updating Node.js and MongoDB.

1.1. Make backup, look at steps 2.1. and 2.2 below.

1.2. Download newest WeKan bundle .zip file from https://github.com/wekan/wekan/releases

1.3. Replace old bundle with new from that .zip file.

1.4. Start WeKan with `start-wekan.sh`

2. If it does not work, you maybe need to update Node.js and MongoDB.

2.1. Backup part 1/2. Try mongodump to backup database like this command. If mongodump command does not exist, download MongoDB Tools from https://www.mongodb.com/try/download/database-tools . Make backup:
```
mongodump
```
Backup will be is in directory `dump`. More info at https://github.com/wekan/wekan/wiki/Backup

2.2. Backup part 2/2. If there is files at `WRITABLE_PATH` directory mentioned at `start-wekan.bat` of https://github.com/wekan/wekan , also backup those. For example, if there is `WRITABLE_PATH=..`, it means previous directory. So when WeKan is started with `node main.js` in bundle directory, it may create in previous directory (where is bundle) directory `files`, where is subdirectories like `files\attachments`, `files\avatars` or similar. 

2.3. Check required compatible version of Node.js from https://wekan.fi `Install WeKan ® Server` section and Download that version node.exe for Windows 64bit from https://nodejs.org/dist/

2.4. Check required compatible version of MongoDB from https://wekan.fi `Install WeKan ® Server` section and Download that version Windows MongoDB .msi installer from https://www.mongodb.com/try/download/community

2.5. Remove old Node.js and MongoDB (at Windows, Control Panel / Add Remove Programs).

2.6. Install newest Node.js and MongoDB.

2.7. Restore database with mongorestore, like this:
```
mongorestore --drop
```
If there are errors, try this instead:
```
mongorestore --drop --noIndexRestore
```
2.8. Start wekan with `start-wekan.bat`

2.9. If WeKan does not start with your old start-wekan.bat, download newest [start-wekan.bat](https://raw.githubusercontent.com/wekan/wekan/master/start-wekan.bat) and look are there differences to your old start-wekan.bat . For example, with this command, could work on WSL or PowerShell or Linux or after installing git:
```
diff old-start-wekan.bat start-wekan.bat
```

## b) How to fix errors on Linux bundle to create Windows bundle

Download Linux bundle wekan-VERSION.zip from from https://github.com/wekan/wekan/releases or https://releases.wekan.team/

```
npm install -g node-pre-gyp

cd bundle\programs\server\npm\node_modules\meteor\accounts-password

npm remove bcrypt

npm install bcrypt
```

## c) WSL

[WSL](WSL)

## d) Wekan to VirtualBox Ubuntu offline

1. Install newest [VirtualBox](https://www.virtualbox.org/)

2. Install newest [Ubuntu 64bit](https://ubuntu.com) to VirtualBox

3. Install Wekan [Snap](https://github.com/wekan/wekan-snap/wiki/Install) version to Ubuntu with these commands:
```
sudo snap install wekan
```

4. Shutdown Ubuntu

5. At VirtualBox menu, export appliance to `wekan.ova` file

6. Copy `virtualbox-install.exe` and `wekan.ova` to offline computer

7. At offline computer, install virtualbox and import wekan.ova

8. Set virtualbox network to bridged:
https://github.com/wekan/wekan/wiki/virtual-appliance#how-to-use

9. Start VirtualBox and Ubuntu

10. In Ubuntu, type command:
```
ip address
```
=> it will show Ubuntu IP address

11. In Ubuntu Terminal, type with your IP address,
at below instead of 192.168.0.100:
```
sudo snap set wekan root-url='http://192.168.0.100'

sudo snap set wekan port='80'
```

12. Then at local network Wekan is at:
http://192.168.0.100

#### Windows notes (tested on Windows 11)

- **Attachments error fix**: if you get  
  `TypeError: The "path" argument must be of type string. Received undefined`  
  from `models/attachments.js`, create folders and set writable paths **before** start:
  - Create: `C:\wekan-data` and `C:\wekan-data\attachments`
  - PowerShell:
    ```
    $env:WRITABLE_PATH="C:\wekan-data"
    $env:ATTACHMENTS_STORE_PATH="C:\wekan-data\attachments"
    ```
  - CMD:
    ```
    set WRITABLE_PATH=C:\wekan-data
    set ATTACHMENTS_STORE_PATH=C:\wekan-data\attachments
    ```

- **LAN access in dev on Windows**:
  - PowerShell:
    ```
    $env:BIND_IP="0.0.0.0"
    $env:ROOT_URL="http://<YOUR-LAN-IP>:4000"
    meteor run --port 4000
    ```
  - CMD:
    ```
    set BIND_IP=0.0.0.0
    set ROOT_URL=http://<YOUR-LAN-IP>:4000
    meteor run --port 4000
    ```
