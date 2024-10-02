# NOTE: Using Candidate, that has MongoDB 6, that is newest version

Required time: If your database size is 500 GB, maybe 4 to 8 hours, or more. So bring enough of pizza, party snacks, limonade etc.

Warning: If you don't have enough disk space, you could get data loss.

Warning2: When starting WeKan Candidate, it could temporarily save all attachments to `/var/snap/wekan/common/files/` or other directory below `common`. That's why xet7 is working on trying to create separate migration app that moves attachments to S3, and that WeKan could upload to S3. This upgrade experience could be improved later. It's just that there are some unknown unknows if there would be automatic upgrade, could it handle all upgrade and migration cases.

If you are have time to try tro update Snap from WeKan Stable to newest WeKan Candidate, to see does update work or not.

If you have problems, add comment to issue https://github.com/wekan/wekan/issues/4780

## From WeKan Stable to Candidate

### Preparation

#### 1. Please read through all these below steps before starting, if possible.

#### 2. Check your database size, and do you have enough disk space for upgrade:
```
sudo du -sh /var/snap/wekan/common

df -h
```
For example, if your database size is 500 GB, and disk is nearly full, you need to stop WeKan and move to bigger disk. If disk gets full, there is possibility to MongoDB database corruption. Making mongodump could maybe take 2x of current size, or more.

Some external disk related steps are at https://github.com/wekan/wekan/wiki/Repair-MongoDB

#### 3. Problems usually are only, are attachments visible or not. Upgrade steps do not delete any files, if commands below are written correctly.

Optional steps:

a) Optionally, you could use [nosqlbooster](https://github.com/wekan/wekan/wiki/Backup#using-nosqlbooster-closed-source-mongodb-gui-with-wekan-snap-to-edit-mongodb-database) to save attachments to files, and export JSON to textfiles, before trying to update. There could also be files at `/var/snap/wekan/common/files` or other subdirectories. When saving attachments, note that there could be many files with same filename.

b) Optinally, you can also save [all database content to JSON](https://github.com/wekan/wekan/wiki/Export-from-Wekan-Sandstorm-grain-.zip-file#11b-dump-database-to-json-text-files), but if your database is about 500 GB then it could be too much disk space required, because attachments are at base64 encoded text in JSON files. It's better ot save attachments with [nosqlbooster](https://github.com/wekan/wekan/wiki/Backup#using-nosqlbooster-closed-source-mongodb-gui-with-wekan-snap-to-edit-mongodb-database).

#### 4. ssh to your server
```
ssh wekanserver
```
#### 5. Save snap settings and set it as executeable
```
sudo snap get wekan | awk '{if(NR>1) print "sudo snap set wekan " $1 "=" "\"" $2 "\""}' > snap-settings.sh

chmod +x snap-settings.sh
```
#### 6. Edit `snap-settings.sh` to look like this, with nano or similar
```
sudo snap set wekan root-url='https://wekan.example.com'
sudo snap set wekan port='80'
```
At nano, Save: Ctrl-o Enter

At nano. Exit: Ctrl-x

#### 7. Download newest MongoDB tools for your distro version that will work with MongoDB 5.x, but do not install it yet

https://www.mongodb.com/try/download/database-tools

For example, for Ubuntu 22.04, [mongodb-database-tools-ubuntu2204-x86_64-100.6.1.deb](https://fastdl.mongodb.org/tools/db/mongodb-database-tools-ubuntu2204-arm64-100.6.1.deb)

#### 8. Remove old versions of MongoDB tools etc, if you have those

List them:
```
dpkg -l | grep mongo
```
If that shows that you have old mongodb server also, check do you really use it, what is the size of database server files?
```
sudo du -sh /var/lib/mongodb
```
Do you have these files, or similar, that show where else mongodb raw database directory could be?
```
/etc/mongod.conf
/etc/mongod/mongod.conf
```
Try to connect to it, and see if there is anything?
```
mongo
```
If it does not connect, maybe start MongoDB database, for example some of these commands:
```
sudo systemctl enable mongod
sudo systemctl start mongod

sudo systemctl enable mongodb
sudo systemctl start mongod

sudo /etc/init.d/mongod start
```
Try then again connect, and view what is there. In this example, if there is wekan database listed with `show dbs`:
```
mongo

show dbs

use wekan

show collections

db.users.count()

db.users.find()
```
Also look is there `mongodb.list` packages repo?
```
sudo ls /etc/apt/sources.list.d/
```
If you have all of mongodb-org, try to remove all of them, with all related files:
```
sudo apt-get --purge remove mongo*
```
Delete mongodb repo:
```
sudo ls /etc/apt/sources.list.d/mongo*

sudo apt update

sudo apt clean

sudo apt -y autoclean

sudo apt -y autoremove
```

### Upgrade

#### 9. Stop wekan app
```
sudo snap stop wekan.wekan
```
#### 10. Use WeKan Stable Snap mongodump version for dumping database
```
export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/snap/wekan/current/lib/x86_64-linux-gnu

export PATH="$PATH:/snap/wekan/current/bin"

mongodump --port 27019
```
#### 11. Move common directory contents. There are raw database files and maybe some attachments.
```
sudo snap stop wekan

sudo mkdir common

sudo mv /var/snap/wekan/common/* common/

sudo rm -rf /var/snap/wekan/common/*
```
#### 12. Change from Stable to Candidate
```
sudo snap refresh wekan --channel=latest/candidate
```
#### 13. Exit ssh and connect again, to not use old mongodump version anymore
```
exit

ssh wekanserver
```
#### 14. Install mongodb tools for your distro version (from [step 7](#7-download-newest-mongodb-tools-for-your-distro-version-that-will-work-with-mongodb-5x-but-do-not-install-it-yet) above)
```
sudo dpkg -i mongodb-database-tools-ubuntu2204-x86_64-100.6.1.deb
```
If there is any errors, please copy all text from install process to comment to issue https://github.com/wekan/wekan/issues/4780

When installing some package, if some dependendencies are missing, they can usually be installed with some of these commands, and installing continued with::
```
sudo apt-get -f install

sudo dpkg --configure -a
```
If you get this kind of error, it means you have existing version of MongoDB Tools still installed, you should remove all those like at step 7 above:
```
Unpacking mongodb-database-tools (100.6.1) ...
dpkg: error processing archive mongodb-database-tools-ubuntu2004-x86_64-100.6.1.deb (--install):
 trying to overwrite '/usr/bin/bsondump', which is also in package mongo-tools 3.6.3-0ubuntu1
```
Sure there are options to force install this, for example this way, but not recommended:
```
sudo rm /usr/bin/bsondump

sudo dpkg -i ...
```
Or other not recommended way, forcing overwrite:
```
sudo dpkg -i --force-overwrite mongodb-database-tools-ubuntu2004-x86_64-100.6.1.deb
```
But better would be to use that [step 7](#7-download-newest-mongodb-tools-for-your-distro-version-that-will-work-with-mongodb-5x-but-do-not-install-it-yet) above to remove all old mongodb packages and repo, and then install MongoDB tools.

#### 15. Restore
```
sudo snap stop wekan

sudo snap start wekan.mongodb

mongorestore --drop --port 27019 --noIndexRestore
```
#### 16. Add back settings

Recommended is to use [Caddy 2](https://github.com/wekan/wekan/wiki/Caddy-Webserver-Config) instead of Caddy1 that is included in WeKan Snap currently at 2022-12-21. Caddy 2 maybe will be included to WeKan Snap later.

See if in your `snap-settings.sh` is this kind of command, are you using Caddy1 ?
```
sudo snap set wekan caddy-enabled='true'
```
If you use Caddy1, and have any domain settings in your `common/Caddyfile`, copy it back:
```
sudo cp common/Caddyfile /var/snap/wekan/common/
```

At [step 6](#6-edit-snap-settingssh-to-look-like-this-with-nano-or-similar) above, you did create script that adds back snap settings. Run it to restore those settings:
```
./snap-settings.sh
```
You could also copy that file to common directory, if you like, or just keep it in your current directory:
```
sudo cp snap-settings.sh /var/snap/wekan/common/
```
#### 17. Start WeKan
```
sudo snap start wekan
```
#### 18. Test are WeKan attachments visible

#### 19. If you are using WeKan Snap Caddy1, if it does not work, change to Caddy2 https://github.com/wekan/wekan/wiki/Caddy-Webserver-Config

#### 20. Backup and cleanup

Create archive of old files, and transer it to your local laptop, save somewhere safe:
```
ssh wekanserver

sudo su

7z a old-wekan.7z snap-settings.sh common dump

exit

scp wekanserver:/root/old-wekan.7z .
```
And then delete old files from server. Do not delete `snap-settings.sh`.
```
ssh wekanserver

rm -rf common dump
```
Also, keep [Daily Backups](https://github.com/wekan/wekan/wiki/Backup)


## Oops it did not work. From WeKan Candidate back to Stable

```
sudo snap stop wekan

sudo rm -rf /var/snap/wekan/common/*

sudo snap refresh wekan --channel=latest/stable

sudo snap stop wekan

sudo rm -rf /var/snap/wekan/common/*

sudo mv common/* /var/snap/wekan/common/

sudo snap start wekan

./snap-settings.sh
```

If you have problems, add comment to issue https://github.com/wekan/wekan/issues/4780

## From WeKan Gantt GPL to WeKan Candidate

- This is discontinued, Gantt features will be later added to WeKan MIT version.
- Gantt version files are instead at `/var/snap/wekan-gantt-gpl/`
- Gantt snap name is wekan-gantt-gpl
