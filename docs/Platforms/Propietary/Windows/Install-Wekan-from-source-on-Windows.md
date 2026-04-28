# Newest Windows info here

https://github.com/wekan/wekan/wiki/Offline

## OLD INFO BELOW, DOES NOT WORK

Also see: [Excel and VBA](Excel-and-VBA)

a) Lowest resource usage: [Windows Subsystem for Linux, build from source](https://github.com/wekan/wekan/issues/2066#issuecomment-468328001)

b) Docker for Windows, [prebuilt without --build option, or build from source](https://github.com/wekan/wekan-dev/issues/12#issuecomment-468657290)

***


### Source install required dependencies

Questions, comments to old closed issue about nexe https://github.com/wekan/wekan/issues/710

Beginnings of build and run scripts, please add PRs for additional fixes etc:
- https://github.com/wekan/wekan/blob/edge/rebuild-wekan.bat
- https://github.com/wekan/wekan/blob/edge/start-wekan.bat

Script for using MongoDB portable:
- https://github.com/wekan/wekan/issues/883#issuecomment-283755906

Requirements:
- Install [MeteorJS](https://www.meteor.com/) 
- Install [NodeJS](https://nodejs.org/en/download/releases/) (Optional but recommended)
- Install Python 2.7 (Installation through Chocolatey(`choco install python2 -y`) is recomended)
- If you are on windows 7, Install .NET 4.5.1+
- **MUST MAKE SURE TO** Install [Visual C++ 2015 Build Tools](http://landinghub.visualstudio.com/visual-cpp-build-tools) or run this command from an elevated PowerShell or CMD.exe (run as Administrator) to install, `npm install --global --production windows-build-tools`
- Install Git
- Restart Windows (Optional but recommended)

From this point, it's advised to use **Git bash** to run commands to make sure everything works as is, but if you had trouble accessing meteor or npm commands via Git bash, windows CMD will most likely work without any problem.

Inside the Git Bash, run these commands:

```
npm config -g set msvs_version 2015

meteor npm config -g set msvs_version 2015
```

# Running Wekan
- Clone the repo (`https://github.com/wekan/wekan`)
- Browse the wekan directory and run `meteor`, 
- If you see any error regarding **xss**, do `meteor npm i --save xss` to install xss.
- Set the Environment variables, or create a .env file with the following data.
- open your browser, make changes and see it reflecting real-time.

## Example of setting environment variables

You need to have start-wekan.bat textfile with that content of those environment variables.
In Windows, .bat files use DOS style of setting varibles.

Similar file for Linux bash is here:
https://github.com/wekan/wekan-maintainer/blob/master/virtualbox/start-wekan.sh

ROOT_URL examples are here:
https://github.com/wekan/wekan/releases

```
SET MONGO_URL=mongodb://127.0.0.1:27017/wekan
SET ROOT_URL=http://127.0.0.1/
SET MAIL_URL=smtp://user:pass@mailserver.example.com:25/
SET MAIL_FROM=admin@example.com
SET PORT=8081
```

## Example contents of  `.env` file
```
MONGO_URL=mongodb://127.0.0.1:27017/wekan
ROOT_URL=http://127.0.0.1/
MAIL_URL=smtp://user:pass@mailserver.example.com:25/
MAIL_FROM=admin@example.com
PORT=8081
```

That URL format is: mongodb://ip-address-of-server:port/database-name

You can access MongoDB database with GUI like Robo 3T https://robomongo.org .
There is no username and password set by default.

## Overview,
Here is how it looks like,
```
git clone https://github.com/wekan/wekan
cd wekan
<SET ENV OR CREATE .env FILE>
meteor npm install --save xss
meteor
```

![](https://i.imgur.com/aNVBhj5.png)

# FAQ
### I am getting `node-gyp` related issues.
Make sure to install all required programs stated here, https://github.com/wekan/wekan/wiki/Install-Wekan-from-source-on-Windows#setup-required-dependencies

### I am getting `Error: Cannot find module 'fibers'` related problem.
Make sure to run the command `meteor` instead of `node`.