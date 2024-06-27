[Sandstorm](Sandstorm) - [Sandstorm Backup](Export-from-Wekan-Sandstorm-grain-.zip-file)

# Upcoming

[Transferring to Minio and SQLite](https://github.com/wekan/minio-metadata)

# Backup Docker

[Also see: Upgrading Synology with Wekan quay images](https://github.com/wekan/wekan/issues/3874#issuecomment-867526249)

Note: Do not run `docker-compose down` without verifying your docker-compose file, it does not delete the data by default but caution is advised. Refer to https://docs.docker.com/compose/reference/down/.

[docker-compose.yml](https://raw.githubusercontent.com/wekan/wekan/master/docker-compose.yml)

This presumes your Wekan Docker is currently running with:
```bash
docker-compose up -d
```
Backup to directory dump:
```bash
docker stop wekan-app
docker exec wekan-db rm -rf /data/dump
docker exec wekan-db mongodump -o /data/dump
docker cp wekan-db:/data/dump .
docker start wekan-app
```
Copy dump directory to other server or to your backup.

# Restore Docker
```bash
docker stop wekan-app
docker exec wekan-db rm -rf /data/dump
docker cp dump wekan-db:/data/
docker exec wekan-db mongorestore --drop --dir=/data/dump
docker start wekan-app
```
# Upgrade Docker Wekan version

## Newest info

https://github.com/wekan/wekan/discussions/5367

## Old info

Note: Do not run `docker-compose down` without verifying your docker-compose file, it does not delete the data by default but caution is advised. Refer to https://docs.docker.com/compose/reference/down/.
```bash
docker-compose stop
docker rm wekan-app
```
a) For example, if you in docker-compose.yml use `image: wekanteam/wekan` or `image: quay.io/wekan/wekan` for latest development version

b) Or in docker-compose.yml change version tag, or use version tag like `image: wekanteam/wekan:v5.50` or `image: quay.io/wekan/wekan:v5.50`
```bash
docker-compose up -d
```

# Backup Wekan Snap to directory dump
```bash
sudo snap stop wekan.wekan
export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/snap/wekan/current/lib/x86_64-linux-gnu
export PATH="/snap/wekan/current/bin:$PATH"
mongodump --port 27019
sudo snap get wekan > snap-settings.sh
```
NOTE for Arch Linux: Use this path instead. [Source](https://github.com/wekan/wekan/issues/3941).
```bash
export LD_LIBRARY_PATH=${LD_LIBRARY_PATH-}:/var/lib/snapd/snap/wekan/current/lib/x86_64-linux-gnu
```
username is your /home/username
```bash
sudo chown username:username snap-settings.sh
sudo snap start wekan.wekan
```
Modify snap-settings.sh so that it has commands like:
```bash
sudo snap set wekan root-url='http://localhost'
```
Set snap-settings.sh executeable:
```bash
chmod +x snap-settings.sh
```

# Restore Wekan Snap
```bash
sudo snap stop wekan.wekan
export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/snap/wekan/current/lib/x86_64-linux-gnu
export PATH="$PATH:/snap/wekan/current/bin"
mongorestore --drop --port 27019
sudo snap start wekan.wekan
./snap-settings.sh
```
# Upgrade Snap manually immediately (usually it updates automatically)

```bash
sudo snap refresh
```

# Backup Wekan Gantt GPLv2 Snap to directory dump
```bash
sudo snap stop wekan-gantt-gpl.wekan
export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/snap/wekan-gantt-gpl/current/lib/x86_64-linux-gnu
export PATH="$PATH:/snap/wekan-gantt-gpl/current/bin"
mongodump --port 27019
sudo snap get wekan-gantt-gpl > snap-settings.sh
```
username is your /home/username
```bash
sudo chown username:username snap-settings.sh
sudo snap start wekan-gantt-gpl.wekan
```
Modify snap-settings.sh so that it has command like:
```bash
sudo snap set wekan-gantt-gpl root-url='http://localhost'
```
Set snap-settings.sh executeable:
```bash
chmod +x snap-settings.sh
```

# Restore Wekan Gantt GPLv2 Snap
```bash
sudo snap stop wekan-gantt-gpl.wekan
export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/snap/wekan-gantt-gpl/current/lib/x86_64-linux-gnu
export PATH="$PATH:/snap/wekan-gantt-gpl/current/bin"
mongorestore --drop --port 27019
sudo snap start wekan-gantt-gpl.wekan
./snap-settings.sh
```

# DBGate, Open Source MongoDB GUI

https://dbgate.org - https://github.com/dbgate/dbgate

# Using nosqlbooster closed source MongoDB GUI with Wekan Snap to edit MongoDB database

https://nosqlbooster.com/downloads

### At server where Wekan Snap is installed, MongoDB is running at localhost port 27019

<img src="https://wekan.github.io/nosqlbooster-basic-connection.png" width="60%" alt="Wekan logo" />

### You can tunnel via SSH to server, using password auth or private key auth dropdown selection

<img src="https://wekan.github.io/nosqlbooster-ssh-tunnel.png" width="60%" alt="Wekan logo" />

# Scheduled backups to local or remote server

For below scheduled backup scripts, no info from above of this wiki page is required. Backup scripts below have the required settings.

This does backup of [Wekan+RocketChat snap databases](OAuth2) and php website etc.

If you need to backup some remote server or cloud, you can use scp, or read [rclone docs](https://rclone.org/docs/) about how to configure saving to some other remote server or cloud.

The following .sh bash scripts are added as root user to your `/root/` directory.

Backups are created to subdirectories of `/root/backups/`.

Cron is used to schedule backups, for example once a day.

1. To add bash scripts, you change to root user with this command, and your sudo or root password.
```bash
sudo su
```
2. Use nano editor for editing cron. If you don't have it installed, type:
```bash
apt install nano
```
3. Then we set text editor to be nano. Otherwise it probably uses vi, that is harder to use.
```bash
export EDITOR=nano
```
4. Now we start editing cron scheduler. 
```bash
crontab -e
```
For more info how to make cron time, see https://crontab.guru

In this example, we set backups every day at 04:00, then it runs backup.sh script, and saves output of the backup commands to the bottom of textfile backup.log.txt
```bash
# m h  dom mon dow   command
0 4 * * * /root/backup.sh >> /root/backup.log.txt 2>&1
```
- For changing to `/root` directory, type: `cd /root`
- for editing backup.sh file, type: `nano backup.sh`
- For saving in nano, press Ctrl-o Enter
- For exiting nano, press Ctrl-x Enter
- Set every .sh file as executeable, for example: `chmod +x backup.sh`

This is content of `backup.sh` script. It runs all the other backup scripts.
If you do not need to backup rocketchat or website, or do not need to use rclone,
you don't need to add those command lines at all.
```bash
cd /root
./backup-wekan.sh
./backup-rocketchat.sh
./backup-website.sh
rclone move backups cloudname:backup.example.com
```
More about rclone:

/root/rclone-ls-all.sh , shows directory contests at cloud:
```bash
rclone lsd cloudname:
```
In this example, cron does run backup scripts as root.
This is if you edit cron with command `crontab -e` as root user,
so it edits the cron of root user.

If mongodump command works as normal user for you, you could instead
run backups as normal user, by exiting root user with `exit` and
then as normal user editing cron with `crontab -e`.
You can also list current cron with command `crontab -l`.

If you like to backup Wekan snap settings with this command, then it
only works with sudo at front, or as a root user without sudo at front.
```bash
sudo snap get wekan > snap-settings.txt
```

This below is backup script for backing up Wekan.

/root/backup-wekan.sh
```bash
#!/bin/bash

makeDump()
{

    # Backups will be created below this directory.
    backupdir="/root/backups/wekan"

    # Gets the version of the snap.
    version=$(snap list | grep wekan | awk -F ' ' '{print $3}')

    # Gets current time to variable "now"
    now=$(date +'%Y-%m-%d_%H.%M.%S')

    # Creates new backup directory like BACKUPDIR/BACKUPVERSIO-TIMENOW
    mkdir -p $backupdir/$version-$now

    # Targets the dump file.
    #dump=$"/snap/wekan/$version/bin/mongodump"

    # Changes to backup directory
    cd $backupdir/$version-$now

    # Backup Caddy settings
    snap get wekan > snap-settings.txt

    # Show text that database backup is in progress
    printf "\nThe database backup is in progress.\n\n"

    # Backup to current directory, creates subdirectory called "dump"
    # with database dump files
    mongodump --port 27019

    # Change diretory (=cd) to parent directory
    cd ..

    # Show text "Makes the tar.gz archive file"
    printf "\nMakes the tar.gz archive file.\n"

    # Creates tar.gz archive file. This works similarly like creating .zip file.
    tar -zcvf $version-$now.tar.gz $version-$now

    # Delete temporary files that have already been
    # compressed to above tar.gz file
    rm -rf $version-$now

    # Shows text "Backup done."
    printf "\nBackup done.\n"

    # Show where backup archive file is.
    echo "Backup is archived to .tar.gz file at $backupdir/${version}-${now}.tar.gz"
}

# Checks is the user is sudo/root
if [ "$UID" -ne "0" ]
then
    echo "This program must be launched with sudo/root."
    exit 1
fi

# Starts
makeDump
```bash
/root/backup-rocketchat.sh
```bash
#!/bin/bash

makeDump()
{

    backupdir="/root/backups/rocketchat"

    # Gets the version of the snap.
    version=$(snap list | grep wekan | awk -F ' ' '{print $3}')

    # Prepares.
    now=$(date +'%Y-%m-%d_%H.%M.%S')
    mkdir -p $backupdir/$version-$now

    # Targets the dump file.
    dump=$"/snap/wekan/$version/bin/mongodump"

    # Makes the backup.
    cd $backupdir/$version-$now
    printf "\nThe database backup is in progress.\n\n"
    $dump --port 27017

    # Makes the tar.gz file.
    cd ..
    printf "\nMakes the tar.gz file.\n"
    tar -zcvf $version-$now.tar.gz $version-$now

    # Cleanups
    rm -rf $version-$now

    # End.
    printf "\nBackup done.\n"
    echo "Backup is archived to .tar.gz file at $backupdir/${version}-${now}.tar.gz"
}

# Checks is the user is sudo/root
if [ "$UID" -ne "0" ]
then
    echo "This program must be launched with sudo/root."
    exit 1
fi

# Starts
makeDump
```
/root/backup-website.sh
```bash
#!/bin/bash

makeDump()
{

    backupdir="/root/backups/example.com"

    # Gets the version of the snap.
    version=$(snap list | grep wekan | awk -F ' ' '{print $3}')

    # Prepares.
    now=$(date +'%Y-%m-%d_%H.%M.%S')
    mkdir -p $backupdir/$version-$now

    # Makes the backup.
    cd $backupdir/$version-$now
    printf "\nThe file backup is in progress.\n\n"

    # Makes the tar.gz file.
    cd ..
    printf "\nMakes the tar.gz file.\n"
    cp -pR /var/snap/wekan/common/example.com $version-$now
    tar -zcvf $version-$now.tar.gz $version-$now

    # Cleanups
    rm -rf $version-$now

    # End.
    printf "\nBackup done.\n"
    echo "Backup is archived to .tar.gz file at $backupdir/${version}-${now}.tar.gz"
}

# Checks is the user is sudo/root
if [ "$UID" -ne "0" ]
then
    echo "This program must be launched with sudo/root."
    exit 1
fi

# Starts
makeDump
```
/var/snap/wekan/common/Caddyfile
```bash
chat.example.com {
	proxy / localhost:3000 {
	  websocket
	  transparent
	}
}

https://boards.example.com {
	proxy / localhost:3001 {
	  websocket
	  transparent
	}
}

example.com {
	root /var/snap/wekan/common/example.com
	fastcgi / /var/run/php/php7.0-fpm.sock php
}

matomo.example.com {
        root /var/snap/wekan/common/matomo.example.com
        fastcgi / /var/run/php/php7.0-fpm.sock php
}

# Example CloudFlare free wildcard SSL Origin Certificate, there is example.com.pem at certificates directory with private key at to and cert at bottom.
http://example.com https://example.com {
        tls {
            load /var/snap/wekan/common/certificates
            alpn http/1.1
        }
        root /var/snap/wekan/common/example.com
        browse
}

static.example.com {
	root /var/snap/wekan/common/static.example.com
}
```

## Related talk about MongoDB backup

Related talk, search for "mongodb" this page:
https://fosdem.org/2020/schedule/events/

There is this:

Percona Backup for MongoDB: Status and Plans

Open Source solution for consistent backups of multi-shard MongoDB

- [Slides](https://fosdem.org/2020/schedule/event/perconamongodb/attachments/slides/3768/export/events/attachments/perconamongodb/slides/3768/Percona_Backup_for_MongoDB.pdf)
- [Video webm](https://video.fosdem.org/2020/UD2.119/perconamongodb.webm)
- [Same Video mp4](https://video.fosdem.org/2020/UD2.119/perconamongodb.mp4)

## Related Sandstorm issue

[Creating a backup while the grain is running could cause corruption](https://github.com/sandstorm-io/sandstorm/issues/3186).

## Combining old and new Wekan version data

Note: Do mongodump/mongorestore only when Wekan is stopped: wekan.wekan (Snap) or wekan-app (Docker).

1. From new Wekan export all boards to Wekan JSON.
2. Backup new Wekan with mongodump.
3. Backup old Wekan with mongodump.
4. Restore old Wekan data to new Wekan with mongorestore.
5. Restore new Wekan JSON exported boards by importing them.

## Rescuing board that does not load

Wekan web UI Import/Export JSON does not have all content currently. To upgrade from old Wekan version, use mongodump/mongorestore to newest Wekan, like described below.

To import big JSON file, on Linux you can use xclip to copy textfile to clipboard:
```bash
sudo apt-get install xclip
cat board.json | xclip -se c
```
Then paste to webbrowser Wekan Add Board / Import / From previous export.

You can [save all MongoDB database content as JSON files](Export-from-Wekan-Sandstorm-grain-.zip-file). Files are base64 encoded in JSON files.

Export board to Wekan JSON, and import as Wekan JSON can make some part of board to load, but you should check is some data missing.

With Wekan Snap, you can use [nosqlbooster GUI](https://nosqlbooster.com/downloads) to login through SSH to Wekan server localhost port 27019 and browse data.

You could use [daff](https://github.com/paulfitz/daff) to compare tables.

## Using Snap Mongo commands on your bash CLI

Add to your `~/.bashrc`
```bash
export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/snap/wekan/current/lib/x86_64-linux-gnu
export PATH="$PATH:/snap/wekan/current/bin"
```
Then you can backup:
```bash
mongodump --port 27019
```
And restore:
```bash
mongorestore --drop --port 27019
```

## MongoDB shell on Wekan Snap

mongoshell.sh
```bash
#/bin/bash
export LC_ALL=C
export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/snap/wekan/current/lib/x86_64-linux-gnu
version=$(snap list | grep wekan | awk -F ' ' '{print $3}')
mongo=$"/snap/wekan/$version/bin/mongo"
$mongo --port 27019
```

***

# Snap backup-restore v2

Originally from https://github.com/wekan/wekan-snap/issues/62#issuecomment-470622601

## Backup

wekan-backup.sh
```bash
#!/bin/bash
export LC_ALL=C
export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/snap/wekan/current/lib/x86_64-linux-gnu

version=$(snap list | grep wekan | awk -F ' ' '{print $3}')
now=$(date +"%Y%m%d-%H%M%S")
parent_dir="/data/backups/wekan"
backup_dir="${parent_dir}/${now}"
log_file="${parent_dir}/backup-progress.log.${now}"

error () {
  printf "%s: %s\n" "$(basename "${BASH_SOURCE}")" "${1}" >&2
  exit 1
}

trap 'error "An unexpected error occurred."' ERR

take_backup () {
  mkdir -p "${backup_dir}"

  cd "${backup_dir}"

  /snap/wekan/$version/bin/mongodump --quiet --port 27019

  cd ..

  tar -zcf "${now}.tar.gz" "${now}"

  rm -rf "${now}"
}

printf "\n======================================================================="
printf "\nWekan Backup"
printf "\n======================================================================="
printf "\nBackup in progress..."

take_backup 2> "${log_file}"

if [[ -s "${log_file}" ]]
then
  printf "\nBackup failure! Check ${log_file} for more information."
  printf "\n=======================================================================\n\n"
else
  rm "${log_file}"
  printf "...SUCCESS!\n"
  printf "Backup created at ${backup_dir}.tar.gz"
  printf "\n=======================================================================\n\n"
fi
```
wekan-restore.sh
```bash
#!/bin/bash
export LC_ALL=C
export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/snap/wekan/current/lib/x86_64-linux-gnu

makesRestore()
{
    file=$1

    ext=$"$(basename $file)"
    parentDir=$"${file:0:${#file}-${#ext}}"
    cd "${parentDir}"

    printf "\nMakes the untar of the archive.\n"

    tar -zxvf "${file}"
    file="${file:0:${#file}-7}"

    version=$(snap list | grep wekan | awk -F ' ' '{print $3}')

    restore=$"/snap/wekan/${version}/bin/mongorestore"

    printf "\nThe database restore is in progress.\n\n"

    ## Only if you get errors about existing indexes, use this below instead:
    ## $restore --quiet --drop --noIndexRestore -d wekan --port 27019 "${file}/dump/wekan"

    $restore --quiet --drop -d wekan --port 27019 "${file}/dump/wekan"

    rm -rf "${file}"

    printf "\nRestore done.\n"
}

makesRestore $1
```

***

# Snap backup-restore v1

## Backup script for MongoDB Data, if running Snap MongoDB at port 27019

```bash
#!/bin/bash

makeDump()
{
    # Gets the version of the snap.
    version=$(snap list | grep wekan | awk -F ' ' '{print $3}')

    # Prepares.
    now=$(date +'%Y-%m-%d_%H.%M.%S')
    mkdir -p /var/backups/wekan/$version-$now

    # Targets the dump file.
    dump=$"/snap/wekan/$version/bin/mongodump"

    # Makes the backup.
    cd /var/backups/wekan/$version-$now
    printf "\nThe database backup is in progress.\n\n"
    $dump --port 27019

    # Makes the tar.gz file.
    cd ..
    printf "\nMakes the tar.gz file.\n"
    tar -zcvf $version-$now.tar.gz $version-$now

    # Cleanups
    rm -rf $version-$now

    # End.
    printf "\nBackup done.\n"
    echo "Backup is archived to .tar.gz file at /var/backups/wekan/${version}-${now}.tar.gz"
}

# Checks is the user is sudo/root
if [ "$UID" -ne "0" ]
then
    echo "This program must be launched with sudo/root."
    exit 1
fi


# Starts
makeDump

```

## Restore script for MongoDB Data, if running Snap MongoDB at port 27019 with a tar.gz archive.

```bash
#!/bin/bash

makesRestore()
{
    # Prepares the folder used for the backup.
    file=$1
    if [[ "$file" != *tar.gz* ]]
    then
        echo "The backup archive must be a tar.gz."
        exit -1
    fi

    # Goes into the parent directory.
    ext=$"$(basename $file)"
    parentDir=$"${file:0:${#file}-${#ext}}"
    cd $parentDir

    # Untar the archive.
    printf "\nMakes the untar of the archive.\n"
    tar -zxvf $file
    file="${file:0:${#file}-7}"
    
    # Gets the version of the snap.
    version=$(snap list | grep wekan | awk -F ' ' '{print $3}')

    # Targets the dump file.
    restore=$"/snap/wekan/$version/bin/mongorestore"

    # Restores.
    printf "\nThe database restore is in progress.\n\n"
    ## Only if you get errors about existing indexes, use this below instead:
    ## $restore --drop --noIndexRestore wekan --port 27019 $file/dump/wekan
    $restore --drop wekan --port 27019 $file/dump/wekan
    printf "\nRestore done.\n"

    # Cleanups
    rm -rf $file
}

# Checks is the user is sudo/root.
if [ "$UID" -ne "0" ]
then
    echo "This program must be launched with sudo/root."
    exit 1
fi


# Start.
makesRestore $1

```

## Docker Backup and Restore

[Docker Backup and Restore](Export-Docker-Mongo-Data)

[Wekan Docker Upgrade](https://github.com/wekan/wekan-mongodb#backup-before-upgrading)

## Snap Backup

[Snap Backup and Restore](https://github.com/wekan/wekan-snap/wiki/Backup-and-restore)

[Wekan Snap upgrade](https://github.com/wekan/wekan-snap/wiki/Install#5-install-all-snap-updates-automatically-between-0200am-and-0400am)

## Sandstorm Backup

Download Wekan grain with arrow down download button to .zip file. You can restore it later.

[Export data from Wekan Sandstorm grain .zip file](Export-from-Wekan-Sandstorm-grain-.zip-file)

## <a name="cloudron">Cloudron

If those [Backup](Backup) ways are not easily found at [Cloudron](Cloudron), one way is to install [Redash](https://redash.io/) and then backup this way:

Redash works with this kind of queries:
```json
{
	"collection": "accountSettings",
	"query": {
		"type": 1
	},
	"fields": {
		"_id": 1,
		"booleanValue": 1,
		"createdAt": 1,
		"modifiedAt": 1,		
	}
}
```
So:

1) Create this kind of query:
```json
{
	"collection": "boards"
}
```

Later when you modify query, you can remove text like boards with double-click-with-mouse and delete-key-at-keyboard (or select characters with mouse and delete-key-at-keyboard), and then click collection/table >> button to insert name of next collection/table.

2) Click Save

3) Click Execute. This will cache query for use with REST API.

4) Click at right top `[...]` => `Show API key`

It looks like this:

https://redash.example.com/api/queries/1/results.json?api_key=...

5) Only when saving first collection/table, Save API key to text file script like this `dl.sh` 
```bash
#!/bin/bash

# Example: ./dl.sh boards

export APIKEY=https://redash.example.com/api/queries/1/results.json?api_key=...

curl -o $1.json $APIKEY
```

6) Run save script like:
```bash
./dl.sh boards
```
Note: 1) Save 2) Execute => webbrowser can give this kind of timeout,
but downloading with API script still works:

> wekan
> Error running query: failed communicating with server. Please check your Internet connection and try again.

7) Repeat steps 1-4 and 6 for every collection/table like boards,cards, etc

8) Remove from downloaded .json files extra query related data, so that it is similar like [any other Wekan database backup JSON files](Export-from-Wekan-Sandstorm-grain-.zip-file)

9) Insert data to some other Wekan install with nosqlbooster like mentioned at page [Backup](Backup)


