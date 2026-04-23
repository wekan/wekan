Development is usually done on Xubuntu 16.04 64bit. This could also work on other Ubuntu or Debian based distros, that are 64bit.

Standalone and Sandstorm Wekan has same code. Only difference is, that at Sandstorm, some features are hidden from web UI by checking `isSandstorm` environment variable that is defined at `wekan/sandstorm*` code files. You see checking at webpage templates `wekan/client/components/*/*.jade` and `wekan/client/components/*/*.js` Javascript code that clicking triggers. See [Directory Structure](https://github.com/wekan/wekan/wiki/Directory-Structure). Also, at Sandstorm there is single SSO login, with code at `wekan/server/authentication.js` and `wekan/sandstorm*`. Sandstorm does not use username and passwords, instead Sandstorm saves sandstorm ID to MongoDB, so that database structure is different on Sandstorm. Database tables/collections are defined at `wekan/models/*`.

Read:
- [Developer Docs](https://github.com/wekan/wekan/wiki/Developer-Documentation)
- [Directory Structure](https://github.com/wekan/wekan/wiki/Directory-Structure)



## 1) Install Sandstorm

Start install:
```
curl https://install.sandstorm.io | bash
```

Use options for development / dev install.

Edit Sandstorm config:
```
sudo nano /opt/sandstorm/sandstorm.conf
```
Uncomment this line this way, so Sandstorm packages are not updated automatically:
```
#UPDATE_CHANNEL=dev
```
Stop and start Sandstorm:
```
sudo sandstorm stop
sudo sandstorm start
```

## 2) Download meteor-spk packaging tool

[Info source](https://github.com/sandstorm-io/meteor-spk)

```
mkdir ~/repos
cd ~/repos
curl https://dl.sandstorm.io/meteor-spk-0.4.0.tar.xz | tar Jxf -
echo "export PATH=$PATH:~/repos/meteor-spk-0.4.0" >> ~/.bashrc
```

## 3) Fork Wekan, and clone your fork

Fork repo https://github.com/wekan/wekan
```
cd ~/repos
git clone git@github.com:YOUR-USER-NAME-HERE/wekan.git
```
Add Wekan as upstream repo:
```
git remote add upstream https://github.com/wekan/wekan.git
```
Change to master repo, to work there:
```
git checkout master
```
Get latest changes from master:
```
git fetch upstream
git merge upstream/master
```

## 4) Install deps and build Wekan

```
cd ~/repos
./rebuild-wekan.sh
```
First with option 1, to install deps.

Then same `./rebuild-wekan.sh` again with option 2, to build Wekan.

## 5) Developing with Standalone Wekan

```
cd ~/repos/wekan
meteor --port 4000
```
Wekan is at http://localhost:4000

When you make changes to files, Meteor automatically notices that, and rebuilds Wekan. If Meteor does not notice change, you need to Ctrl-c and `./rebuild-wekan.sh` option 2.

## 6) Using MongoDB

Install MongoDB 3.2.x tools and shell from https://docs.mongodb.com/v3.2/tutorial/install-mongodb-on-ubuntu/

You need to add repo, key etc from above before this step:
```
sudo apt-get -y install mongodb-org-shell mongodb-org-tools
```
And connect to next port after meteor node above:
```
mongo --port 4001
```
or alternatively:
```
meteor mongo
```
You can also connect with MongoDB GUI to localhost 4001:
https://www.nosqlbooster.com/downloads

## 7) Test feature at Sandstorm

When your feature works at Standalone Wekan, you can also test it at Sandstorm.

First build wekan with option 2:
```
cd ~/repos/wekan
./rebuild-wekan.sh
```
Then build Sandstorm Wekan dev version
```
meteor-spk dev
```

## 8) After building Wekan, last line of text should be:

`App in now available from Sandstorm server. Ctrl-C to disconnect.`

With Firefox/Chromium/Chrome/Edge/Chromium Edge browser, open http://local.sandstorm.io:6080/

Login with premade local dev account Alice.

## 9) Go to Apps / Wekan. Wekan has grey "dev mode" background. Click Wekan.

## 10) Click + (Dev) Create new board

## 11) Check is everything working in Wekan.

## 12) When it works: Commit, push, make pull request

```
git add --all
git commit -a -m "Add Feature: ADD-YOUR-FEATURE-DESCRIPTION-HERE"
git push
```
Then at GitHub your fork of Wekan, click `Create Pull Request`

Then wait for comments or merge by xet7. You can see when your change is at Wekan new release at website https://wekan.fi click `Stable ChangeLog`, newest changes at top.

Thanks for your contributions!