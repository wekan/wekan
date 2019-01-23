# Example of job definition:
# .---------------- minute (0 - 59)
# |  .------------- hour (0 - 23)
# |  |  .---------- day of month (1 - 31)
# |  |  |  .------- month (1 - 12) OR jan,feb,mar,apr ...
# |  |  |  |  .---- day of week (0 - 6) (Sunday=0 or 7)
# |  |  |  |  |
# *  *  *  *  *   command to be executed
# 0  1  *  *  *   sh /volumes/backup/database/cronjob.sh

#!/bin/bash
export $(cat config.env | grep -v "#" | xargs)

if [ "$MONGO_SERVER_REMOTE_HOST" != "" ]; then
    MONGO_SERVER_REMOTE_HOST="--host $MONGO_SERVER_REMOTE_HOST"
fi
if [ "$MONGO_SERVER_REMOTE_PORT" != "" ]; then
    MONGO_SERVER_REMOTE_PORT="--port $MONGO_SERVER_REMOTE_PORT"
fi
if [ "$MONGO_SERVER_REMOTE_USER" != "" ]; then
    MONGO_SERVER_REMOTE_USER="--username $MONGO_SERVER_REMOTE_USER"
fi
if [ "$MONGO_SERVER_REMOTE_PASSWORD" != "" ]; then
    MONGO_SERVER_REMOTE_PASSWORD="--password $MONGO_SERVER_REMOTE_PASSWORD"
fi
if [ "$MONGO_SERVER_REMOTE_DATABASE" != "" ]; then
    MONGO_SERVER_REMOTE_DATABASE="--db $MONGO_SERVER_REMOTE_DATABASE"
fi
if [ "$MONGO_SERVER_REMOTE_AUTHDB" != "" ]; then
    MONGO_SERVER_REMOTE_AUTHDB="--authenticationDatabase $MONGO_SERVER_REMOTE_AUTHDB"
fi



BKPTIME=$(date +'%Y_%m_%d_%H_%m_%s')
find $BACKUP_FOLDER/*.archive -mtime +30 -exec rm {} \;
mongodump $MONGO_SERVER_REMOTE_HOST $MONGO_SERVER_REMOTE_PORT $MONGO_SERVER_REMOTE_USER $MONGO_SERVER_REMOTE_PASSWORD $MONGO_SERVER_REMOTE_AUTHDB $MONGO_SERVER_REMOTE_DATABASE -vvvv --gzip --numParallelCollections 10 --archive=${BACKUP_FOLDER}/${BKPTIME}.archive
#curl --header "Content-Type: application/json" --request POST --data '{"channel": "#rafaelrglima","username": "rafaelrglima-bot","text": ":large_blue_circle: - Finished backup at path /volumes/backup/database","icon_emoji": ":cloud:"}' https://hooks.slack.com/services/T1AQP4GQY/BEBEE418S/sssdfsdfsdfsdfsdfsdf
