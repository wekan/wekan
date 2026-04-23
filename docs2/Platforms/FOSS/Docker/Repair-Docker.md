## 1) Create Backups first

[Backup](Backup)

Docker data is usually at `/var/lib/docker` or `/var/snap/docker/common/` (in Snap version of Docker).

## 2) No errors of MongoDB ?

- Check does docker-compose.yml have like `mongod --logpath=/dev/null --quiet`. Well, it's very quiet.
- Just remove logpath, or set it to syslog with `--syslog`.
- Or add path to somewhere where mongod service has write access, like `--logpath=/var/lib/docker/mongodb.log` or `--logpath=/var/snap/docker/common/mongodb.log`.
- If you remove `--quiet`, you get even more verbose logs.

## 3) Errors of Wekan connecting to MongoDB ?

Probably did upgrade your kernel. Please reboot.

## 4) Errors about too new or old version of MongoDB ?

Check your docker-compose.yml . Did newer Wekan with newest docker-compose.yml from https://github.com/wekan/wekan have different version of MongoDB? If yes, you should change to that old version. For example:
```
docker-compose stop
```
Then in docker-compose.yml, `image: mongo:latest` to some other like `image: mongo:3.2` or 3.2.22 or 4.2 or something. Then:
```
docker-compose start
```
Or alternatively:
```
docker-compose up -d
```
## 5) MongoDB corruption?

a) [Repair MongoDB](Repair-MongoDB)

b) [Using Meteor MongoDB to repair files](Export-from-Wekan-Sandstorm-grain-.zip-file)

## 6) Trying to upgrade Wekan?

### 1) [Backup](Backup)

### 2a) Nice way:
```
docker-compose stop

docker rm wekan-app
```
Then edit docker-compose.yml wekan-app version tag, for example:
```
image: quay.io/wekan/wekan:v4.55
```
And start Wekan:
```
docker-compose up -d
```
Done!

### 2b) Brutal way: Destroy all Docker data!

Deletes all containers etc! Clean, empty, data loss possible if you did not backup all Docker containers, and no conflicts when installing.
```
git clone https://github.com/wekan/docker-cleanup-volumes

cd docker-cleanup-columes

./start.sh
```
If you have Snap version of Docker, you need to add to scripts path of docker command, that is `/snap/bin/docker`.

Get newest docker-compose.yml from https://github.com/wekan/wekan

Start Wekan
```
docker-compose up -d
```
[Restore](Backup)
