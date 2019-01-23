#!/bin/bash
export $(cat config.env | grep -v ^# | xargs)

#Download and Upload new files on both directions
echo Removing old backup more than 30 days old from current folder
find *.archive -mtime +30 -exec rm {} \;

echo Uploading Files that are new or have changed
rsync -rtuvah . -e ssh $KEYREF:$BACKUP_FOLDER/

echo Downloading New Files on server
rsync -rtuvah -e ssh $KEYREF:$BACKUP_FOLDER/ .
