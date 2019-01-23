#!/bin/bash
#export $(cat config.env | grep -v ^# | xargs)

export $(cat config.env | grep -v "#" | xargs)

echo Backup database on remote
ssh $KEYREF "cd $BACKUP_FOLDER && sh ${BACKUP_FOLDER}/cronjob.sh"

echo Start syncing directories
sh sync.sh

echo Restore Database on local
sh restore.sh
