Also see [Docker Backup and Restore](https://github.com/wekan/wekan/wiki/Export-Docker-Mongo-Data)

# MongoDB client based backup

## Install MongoDB shell 3.2.x

[MongoDB 3.2.x shell for Ubuntu](https://docs.mongodb.com/v3.2/tutorial/install-mongodb-on-ubuntu/)

## Backup script for MongoDB Data, if running Snap MongoDB at port 27019

```sh
#!/bin/bash
now=$(date +'%Y-%m-%d_%H.%M.%S')
mkdir -p backups/$now
cd backups/$now
mongodump --port 27019
# if running on source install, run for example: mongodump --port 27017)
cd ..
zip -r $now.zip $now
cd ../..
echo "\nBACKUP DONE."
echo "Backup is at directory backups/${now}."
echo "Backup is also archived to .zip file backups/${now}.zip"
```

# Manual Backup

## Stop Wekan and Backup to directory called dump

```
sudo snap stop wekan.wekan

mongodump --port 27019

sudo snap start wekan.wekan
```
## Stop Wekan and Restore

```
sudo snap stop wekan.wekan

## Only if you get errors about existing indexes, use this instead:
## mongorestore -d wekan --drop --noIndexRestore --port 27019
mongorestore -d wekan --drop --port 27019

sudo snap start wekan.wekan
```


***


# Snap based backup (less reliable, can disappear with snap remove wekan)

## Setup backup directory

Create backup directory and set permissions

```
$ sudo mkdir /var/snap/wekan/common/db-backups
$ sudo chmod 777 /var/snap/wekan/common/db-backups
```

## Backup

As normal user as archive:

```
$ wekan.database-backup
```

Backup is created in directory:

```
/var/snap/wekan/common/db-backups
```

There is optional Backup file is optional parameter `$ wekan.database-backup BACKUPFILENAME`, but probably it does not work.

## List backups

You need to first create one backup, otherwise this command shows error.

To list existing backups in default directory, as normal user:

```
$ wekan.database-list-backups
```

## Restore backup

As normal user:

```
$ wekan.database-restore FULL-PATH-TO-BACKUP-FILENAME
```