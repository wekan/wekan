#!/bin/bash
export $(cat config.env | grep -v ^# | xargs)

LAST_BACKUP_FILENAME=$(ls *.archive -t | head -n1)

mongorestore --drop --host $MONGO_SERVER_LOCAL  --gzip --archive=$LAST_BACKUP_FILENAME


echo Executing Extra Script on local database after we restore
mongo --host $MONGO_SERVER_LOCAL < restore_postevent.js
