Use these instructions instead: [Offline](Offline)


***

Windows Updates:


1) WuMgr: Windows Update but Not Automatic

- https://github.com/DavidXanatos/wumgr

- https://news.ycombinator.com/item?id=34175466

2) Legacy Update

- https://legacyupdate.net

- https://news.ycombinator.com/item?id=34019900

3) Win7 Extended Security Updates Ending

- https://news.ycombinator.com/item?id=34307029
- How to create Win7.iso with all updates
  - https://www.youtube.com/watch?v=l5ADP-VZMsw
  - https://en.wikipedia.org/wiki/Windows_Update_MiniTool

4) Snappy Driver installer

- https://sdi-tool.org

***


## OLD BELOW: a) Bundle with Windows Node+MongoDB

This has **highest performance and lowest RAM usage**, because there is no virtualization like Docker, Windows Subsystem for Linux, etc. Wekan is run with Windows native version of Node.js and MongoDB, directly at Windows filesystem.

1. If you have important data in Wekan, do [backup](Backup).

2. Install newest Node.js LTS v12.x for Windows from https://nodejs.org . When installing, checkmark "Install additional tools" that will install also Chocolatey etc.

3. Run cmd.exe as Administrator, and there type:
```
choco install -y mongodb
```

4. Download and newest Wekan bundle wekan-x.xx.zip from https://releases.wekan.team

5. Unzip wekan-x.xx.zip, it has directory name `bundle`

6. Download [start-wekan.bat](https://raw.githubusercontent.com/wekan/wekan/master/start-wekan.bat) to your bundle directory. Default settins are: `ROOT_URL=http://localhost` and `PORT=80`, so it works only in local [compatible browser](Browser-compatibility-matrix). You can edit [ROOT_URL](Settings) to be or `http://YOUR-IP-ADDRESS` so it works on local network with `http://YOUR-IP-ADDRESS` .

7. Start Wekan in cmd.exe as Administrator:
```
cd bundle
start-wekan.bat
```

8. Start MongoDB cmd.exe as Administrator:
```
net start mongodb
```
You can also stop MongoDB this way:
```
net stop mongodb
```
When you have MongoDB running, you can connect to database with nosqlbooster GUI, to localhost 27017.

You can create backup of MongoDB database with this mongodump command, that is similar to mysqldump:
```
"C:\Program Files\MongoDB\Server\4.2\bin\mongodump"
```
It will create subdirectory `dump` that contains backup. You can restore with:
```
"C:\Program Files\MongoDB\Server\4.2\bin\mongorestore"
```
You can connect to MongoDB CLI with this command:
```
"C:\Program Files\MongoDB\Server\4.2\bin\mongo"
```
There you can show databases. One MongoDB server can have many databases, similarly like MySQL server can have many databases created with MySQL `CREATE DATABASE` command:
```
show dbs
```
Then use Wekan database:
```
use wekan
```
List wekan database collections/tables:
```
show collections
```
Show content of users collection/table:
```
db.users.find()
```
Create new database:
```
use testing
```
Delete current database:
```
db.dropDatabase()
```
List databases again to show that database testing is not there anymore:
```
show dbs
```
Also see [Forgot Password](Forgot-Password)

Exit MongoDB CLI:
```
exit
```
You should not backup Windows MongoDB RAW database files that are here, when you in File Explorer folder properties show hidden system files and file extensions:
```
C:\ProgramData\MongoDB\data\db
```
[More info about MongoDB](Export-from-Wekan-Sandstorm-grain-.zip-file)

9. [Add users](Adding-users).


***

## b) [Docker](Docker)

Note: With Docker, please don't use latest tag. Only use release tags. See https://github.com/wekan/wekan/issues/3874

[Repair Docker](Repair-Docker)

If you don't need to build Wekan, use prebuilt container with docker-compose.yml from https://github.com/wekan/wekan like this:
```
docker-compose up -d
```

If you like to build from source, clone Wekan repo:
```
git clone https://github.com/wekan/wekan
```
Then edit docker-compose.yml with [these lines uncommented](https://github.com/wekan/wekan/blob/main/docker-compose.yml#L132-L142) this way:
```
   #-------------------------------------------------------------------------------------
    # ==== BUILD wekan-app DOCKER CONTAINER FROM SOURCE, if you uncomment these ====
    # ==== and use commands: docker-compose up -d --build
    build:
      context: .
      dockerfile: Dockerfile
      args:
        - NODE_VERSION=${NODE_VERSION}
        - METEOR_RELEASE=${METEOR_RELEASE}
        - NPM_VERSION=${NPM_VERSION}
        - ARCHITECTURE=${ARCHITECTURE}
        - SRC_PATH=${SRC_PATH}
        - METEOR_EDGE=${METEOR_EDGE}
        - USE_EDGE=${USE_EDGE}
    #-------------------------------------------------------------------------------------
```
Then you can build Wekan with 
```
docker-compose up -d --build
```

## c) Windows Subsystem for Linux on Windows 10
- [Install Windows Subsystem for Linux](https://docs.microsoft.com/en-us/windows/wsl/wsl2-install) in PowerShell as Administrator `Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux` and reboot
- Install Ubuntu 18.04 from Windows Store

If you don't need to build from source, download newest wekan-VERSION.zip from https://releases.wekan.team and unzip it. Then:
```
sudo apt update
sudo apt install npm mongodb-server mongodb-clients
sudo npm -g install n
sudo n 12.16.1
sudo npm -g install npm
```
Then edit `start-wekan.sh` to start at correct port, ROOT_URL setting, and MONGO_URL to port 27017, cd to correct bundle directory where `node main.js` can be run, and then:
```
./start-wekan.sh
```
More info at https://github.com/wekan/wekan/wiki/Raspberry-Pi
- You could try to proxy from IIS SSL website to Wekan localhost port, for example when ROOT_URL=https://example.com and PORT=3001 , and you make IIS config that supports websockets proxy to Wekan http port 3001.

If you need to build from source, do as above, and build Wekan with `wekan/rebuild-wekan.sh`.
After building, if you like to start meteor faster by excluding some parts, have rebuilds after file change, and test on local network devices, try with your computer IP address:
```
WITH_API=true RICHER_CARD_COMMENT_EDITOR=false ROOT_URL=http://192.168.0.200:4000 meteor --exclude-archs web.browser.legacy,web.cordova --port 4000
```
## d) VirtualBox with Ubuntu 19.10 64bit

Install Ubuntu to VirtualBox and then Wekan, for example Wekan Snap.

Currently Snap works only when installed to Ubuntu 19.10 64bit running on VirtualBox VM.

https://github.com/wekan/wekan-snap/wiki/Install

[Related VM info how to expose port with bridged networking](Virtual-Appliance)

[UCS has prebuilt VirtualBox VM](Platforms#production-univention-platform-many-apps-and-wekan)

***

# BELOW: DOES NOT WORK

## e) Probaby does not work

[Install from source directly on Windows](Install-Wekan-from-source-on-Windows) to get Wekan running natively on Windows. [git clone on Windows has been fixed](https://github.com/wekan/wekan/issues/977). Related: [running standalone](https://github.com/wekan/wekan/issues/883) and [nexe](https://github.com/wekan/wekan/issues/710).

## f) Install Meteor on Windows - does not build correctly, gives errors

https://github.com/zodern/windows-meteor-installer/

```
REM Install Chocolatey from
REM https://chocolatey.org/install
REM in PowerShell as Administrator

Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))

REM Install with cmd.exe or PowerShell as Administrator
REM - nodejs-lts, that is 12.x
REM - ndm, that is npm package manager for Windows

choco install -y nodejs-lts ndm git

REM Close and open cmd.exe or PowerShell as normal user.
REM Update npm:

npm -g install npm

REM Install meteor using https://github.com/zodern/windows-meteor-installer/

npm i -g @zodern/windows-meteor-installer

REM Close and open cmd.exe or PowerShell as normal user.

git clone https://github.com/wekan/wekan
cd wekan

REM a) For development, available at local network, at your computer IP address. Does rebuild when code changes.

SET WITH_API=true
SET RICHER_CARD_EDITOR=false
SET ROOT_URL=http://192.168.0.200:4000
meteorz --port 4000

REM b) For development, available only at http://localhost:4000 . Does rebuild when code changes.

SET WITH_API=true
SET RICHER_CARD_EDITOR=false
meteorz --port 4000

REM c) For production, after Wekan is built to "wekan/.build/bundle",
REM    edit "start-wekan.bat" to "cd" to correct bundle directory to run "node main.js"
```
## g) Snap

[WSL](WSL)

## Related

[Linux stuff in Windows 10 part 1](https://cepa.io/2018/02/10/linuxizing-your-windows-pc-part1/) and [part 2](https://cepa.io/2018/02/20/linuxizing-your-windows-pc-part2/).
