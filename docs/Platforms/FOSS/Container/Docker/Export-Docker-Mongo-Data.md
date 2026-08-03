[Managing Docker containers with DockerBunker](https://github.com/chaosbunker/dockerbunker)

## Important info

You need to stop Wekan before importing MongoDB database with command:

`docker stop wekan-app`

And also check that in your start-wekan.sh or docker-compose.yml or similar that
you have corrent MongoDB database name admin, wekan, etc.
Otherwise it will be empty.

Docker containers are at `/var/lib/docker`, so it [may contain important data that could be hard to recover](https://github.com/wekan/wekan-mongodb/issues/8). Restoring mongodump files is much easier. [Related backup feature request](https://github.com/wekan/wekan/issues/1534). With backups it's important to [save file and directory permissions](https://askubuntu.com/questions/225865/copy-files-without-losing-file-folder-permissions).

***


Check from your Dockerfile or docker-compose.yml what is name of MongoDB container.
It can be wekan-db, mongodb or something else.

1) You can run Wekan on Docker locally like this on http://localhost:8080/
(or other port it you change 8080 in script):
```bash
docker run -d --restart=always --name wekan-db mongo:3.2.18

docker run -d --restart=always --name wekan-app --link "wekan-db:db" -e "MONGO_URL=mongodb://db" -e "ROOT_URL=http://localhost:8080" -p 8080:80 wekanteam/wekan:latest
```

2) List docker containers, your ID:s will be different:
```bash
docker ps
```
Result:
```bash
CONTAINER ID        IMAGE               COMMAND                  CREATED             STATUS              PORTS                  NAMES
1234wekanid        wekanteam/wekan:latest    "/bin/sh -c 'bash $ME"   About an hour ago   Up 46 minutes       0.0.0.0:8080->80/tcp   wekan-app
4321mongoid        mongo               "/entrypoint.sh mongo"   About an hour ago   Up 46 minutes       27017/tcp              wekan-db
```

3) Enter inside mongo container:
```bash
docker exec -it wekan-db bash
```

4) OPTIONAL: If you want to browse data inside container, you can use CLI commands like listed at

https://docs.mongodb.com/manual/reference/mongo-shell/

like this:

```bash
> mongo             <==== START MONGO CLI
MongoDB shell version: 3.2.18
connecting to: test
Server has startup warnings: 
2016-06-25T11:39:55.913+0000 I CONTROL  [initandlisten] 
2016-06-25T11:39:55.913+0000 I CONTROL  [initandlisten] ** WARNING: /sys/kernel/mm/transparent_hugepage/enabled is 'always'.
2016-06-25T11:39:55.913+0000 I CONTROL  [initandlisten] **        We suggest setting it to 'never'
2016-06-25T11:39:55.913+0000 I CONTROL  [initandlisten] 
2016-06-25T11:39:55.913+0000 I CONTROL  [initandlisten] ** WARNING: /sys/kernel/mm/transparent_hugepage/defrag is 'always'.
2016-06-25T11:39:55.913+0000 I CONTROL  [initandlisten] **        We suggest setting it to 'never'
2016-06-25T11:39:55.913+0000 I CONTROL  [initandlisten] 
> show dbs           <=== SHOW DATABASES
admin  0.034GB
local  0.000GB
> use admin          <=== CHANGE TO USE ADMIN DATABASE
switched to db admin
> show collections   <=== SHOWS TABLES
activities
boards
card_comments
cards
cfs._tempstore.chunks
cfs.attachments.filerecord
cfs_gridfs._tempstore.chunks
cfs_gridfs._tempstore.files
cfs_gridfs.attachments.chunks
cfs_gridfs.attachments.files
esCounts
lists
meteor-migrations
meteor_accounts_loginServiceConfiguration
presences
users
> db.users.find()     <=== LISTS ALL USERS
(list of all users here)
> exit                <=== EXIT MONGO CLI
```

5) Go to / directory:
```bash
cd /
```

6) Backup database to files inside container to directory /dump, only Wekan database with name "wekan" is included, not local:
```bash
mongodump -o /dump/
```

7) Exit from inside of container:
```bash
exit
```

8) Copy backup directory /dump from inside of container to current directory:
```bash
docker cp wekan-db:/dump .
```

9a) Restore backup later (restore from /data/dump):
```bash
docker cp dump wekan-db:/data/
docker exec -it wekan-db bash
cd /data
## Only if you get errors about existing indexes, use this instead:
## mongorestore --drop --noIndexRestore --db wekan /data/dump/wekan/
mongorestore --drop --db wekan /data/dump/wekan/
exit
```

That dbname can be for example wekan:
```
## Only if you get errors about existing indexes, use this instead:
## mongorestore --drop --noIndexRestore --db wekan /data/dump/wekan/
mongorestore --drop --db wekan /data/dump/wekan/
```

9b) Or restore to another mongo database, in different port:
```bash
mongorestore --port 11235
```

10) If you would like to browse mongo database that is outside of docker in GUI, you could try some admin interface:

https://docs.mongodb.com/ecosystem/tools/administration-interfaces/

11) If you sometime after backups want to remove wekan containers to reinstall them, do (CAREFUL):
```bash
docker stop wekan-app wekan-db
docker rm wekan-app wekan-db
```
Then you can reinstall from step 1.

12) If latest version of Wekan Docker image is broken, here's how to run older version:

https://github.com/wekan/wekan/issues/659

## Backup and restore scripts

Edit these to suit your own requirements - they will delete backups older than 7 days.

Backup Script
```bash
#!/bin/bash
DATE=$(date +%Y-%m-%d-%H-%M)
SCRIPTPATH="$( cd "$(dirname "$0")" ; pwd -P )"
cd $SCRIPTPATH
mkdir -p backups/$DATE
docker ps -a | grep 'wekan-db' &> /dev/null
if [ $? = 0 ]; then
  docker exec -t wekan-db bash -c "rm -fr /dump ; mkdir /dump ; mongodump -o /dump/"
  docker cp wekan-db:/dump $SCRIPTPATH/backups/$DATE
  tar -zc -f backups/$DATE.tgz -C $SCRIPTPATH/backups/$DATE/dump wekan
  if [ -f backups/$DATE.tgz ]; then
    rm -fr backups/$DATE
    find $SCRIPTPATH/backups/ -name "*.tgz" -mtime +7 -delete
  fi 
else
  echo "wekan-db container is not running"
  exit 1
fi
```

Restore Script
```bash
#!/bin/bash
if [ $# -eq 0 ]
  then
    echo "Supply a path to a tgz file!"
    exit 1
fi

SCRIPTPATH="$( cd "$(dirname "$0")" ; pwd -P )"
DATE=$(basename $1 .tgz)

docker ps -a | grep 'wekan-db' &> /dev/null
if [ $? = 0 ]; then

  if [ -f $1 ]; then
    docker stop wekan-app
    mkdir -p $SCRIPTPATH/backups/$DATE-restore
    tar -zx -f $1 -C $SCRIPTPATH/backups/$DATE-restore
    docker exec -t wekan-db bash -c "rm -fr /restore ; mkdir /restore"
    docker cp $SCRIPTPATH/backups/$DATE-restore/wekan wekan-db:/restore
    ## Only if you get errors about existing indexes, use this instead:
    ## docker exec -t wekan-db bash -c "mongorestore --drop --noIndexRestore --db wekan /restore/wekan/"
    docker exec -t wekan-db bash -c "mongorestore --drop --db wekan /restore/wekan/"
    docker start wekan-app
  fi
else
  echo "wekan-db container is not running"
  exit 1
fi

```