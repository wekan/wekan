Also see: [Windows](Windows)

[Other CPU/OS On-Premise WeKan install](https://github.com/wekan/wekan/wiki/Raspberry-Pi)

## Wekan Windows 64bit version On-Premise

INFO ABOUT SETTINGS: https://github.com/wekan/wekan/issues/5591#issuecomment-2503681293

This is without container (without Docker or Snap).

Right click and download files 1-4:

1. [wekan-7.91-amd64-windows.zip](https://github.com/wekan/wekan/releases/download/v7.91/wekan-7.91-amd64-windows.zip)

2. [node.exe](https://nodejs.org/dist/latest-v14.x/win-x64/node.exe)

3. [mongodb-windows-x86_64-6.0.23-signed.msi](https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-6.0.23-signed.msi)

4. [start-wekan.bat](https://raw.githubusercontent.com/wekan/wekan/main/start-wekan.bat)

5. Copy files from steps 1-4 with USB stick or DVD to offline Windows computer

6. Double click `mongodb-windows-x86_64-6.0.23-signed.msi` . In installer, uncheck downloading MongoDB compass.

7. Unzip `wekan-7.91-amd64-windows.zip` , inside it is directory `bundle`, to it copy other files:

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

2.3. Check required compatible version of Node.js from https://wekan.github.io `Install WeKan ® Server` section and Download that version node.exe for Windows 64bit from https://nodejs.org/dist/

2.4. Check required compatible version of MongoDB from https://wekan.github.io `Install WeKan ® Server` section and Download that version Windows MongoDB .msi installer from https://www.mongodb.com/try/download/community

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
