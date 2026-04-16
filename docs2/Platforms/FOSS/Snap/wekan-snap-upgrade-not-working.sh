#!/bin/bash

# ==== SETTINGS START ======

MONGODB_PORT=27019

# MongoDB database name.
DATABASE=wekan

# Usually original snap name is wekan. Check with "sudo snap list".
# Migrating changes snap wekan from stable to candidate, and migrates attachments and avatars.
SNAPNAME=wekan

# Backup directory requires a lot of disk space. It will have copy of /var/snap/wekan/common and mongodump.
BACKUPDIR=/var/wekanbackup

# ==== SETTINGS END ======


if [ "$(id -u)" -ne 0 ]; then
        echo 'This script must be run by root' >&2
        exit 1
fi

#cpuavx=$(cat /proc/cpuinfo | grep avx)
#if [ -z "${cpuavx}" ]; then
#  echo "Your CPU does not support AVX. WeKan will add support for AVX soon, by running MongoDB 6 at Qemu."
#  exit 1
#fi

function pause(){
        read -p "$*"
}

echo "Backups will be stored to $BACKUPDIR . Change it at top of this script, to where is enough disk space."
echo "Backup directory requires a lot of disk space. It will have copy of /var/snap/wekan/common and mongodump."

PS3='Please enter your choice: '
options=("Upgrade WeKan Snap from 6.09 to newest" "Downgrade WeKan Snap from newest to 6.09" "Quit")

select opt in "${options[@]}"
do
    case $opt in
        "Upgrade WeKan Snap from 6.09 to newest")

              echo "STEP 1: BACKUP"

              # Original path
              export ORIGINAL_LD_LIBRARY_PATH=$LD_LIBRARY_PATH
              export ORIGINAL_PATH=$PATH

              # Path to old MongoDB
              export LD_LIBRARY_PATH=/snap/$SNAPNAME/current/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH
              export PATH=/snap/$SNAPNAME/current/bin:/snap/$SNAPNAME/current/usr/bin:$PATH

              # Stop Wekan
              snap stop $SNAPNAME.wekan
              snap start $SNAPNAME.mongodb

              sleep 2

              # Create backup directory
              mkdir -p $BACKUPDIR

              # Run MongoDB backup
              rm -rf $BACKUPDIR/common $BACKUPDIR/dump
              /snap/$SNAPNAME/current/bin/mongodump --port $MONGODB_PORT --out=$BACKUPDIR
              snap stop $SNAPNAME.mongodb
              sleep 2
              cp -pR /var/snap/$SNAPNAME/common $BACKUPDIR/
              snap get $SNAPNAME > $BACKUPDIR/snap.sh

              echo "STEP 2: UPGRADE WeKan"

              # Stop WeKan
              snap stop $SNAPNAME

              # Remove old files (after backup)
              rm -rf /var/snap/$SNAPNAME/common/*

              # Upgrade to latest version
              snap refresh $SNAPNAME --channel=latest/candidate --amend

              mkdir -p /var/snap/$SNAPNAME/common/files/attachments

              mkdir -p /var/snap/$SNAPNAME/common/files/avatars

              # Stop all services for clean start

              echo "STEP 3: RESTORE DATA"

              # Start MongoDB
              snap stop $SNAPNAME.wekan
              snap start $SNAPNAME.mongodb

              sleep 2

              # Restore database
              /snap/$SNAPNAME/current/bin/mongorestore --port $MONGODB_PORT --drop $BACKUPDIR/

              echo "STEP 4: MIGRATE ATTACHMENTS"

              /snap/$SNAPNAME/current/usr/bin/mongosh --port $MONGODB_PORT --host 127.0.0.1 \
                --db wekan --eval "db.attachments.files.drop()"

              /snap/$SNAPNAME/current/usr/bin/mongosh --port $MONGODB_PORT --host 127.0.0.1 \
                --db wekan --eval "db.attachments.chunks.drop()"

              /snap/$SNAPNAME/current/usr/bin/mongosh --port $MONGODB_PORT --host 127.0.0.1 \
                --db wekan --eval "db.avatars.files.drop()"

              /snap/$SNAPNAME/current/usr/bin/mongosh --port $MONGODB_PORT --host 127.0.0.1 \
                --db wekan --eval "db.avatars.chunks.drop()"

              /snap/$SNAPNAME/current/usr/bin/mongosh --port $MONGODB_PORT --host 127.0.0.1 \
                --db wekan --eval "db.cfs_gridfs.attachments.chunks.renameCollection('attachments.chunks')"

              /snap/$SNAPNAME/current/usr/bin/mongosh --port $MONGODB_PORT --host 127.0.0.1 \
                --db wekan --eval "db.cfs_gridfs.attachments.files.renameCollection('attachments.files')"

              /snap/$SNAPNAME/current/usr/bin/mongosh --port $MONGODB_PORT --host 127.0.0.1 \
                --db wekan --eval "db.cfs_gridfs.avatars.chunks.renameCollection('avatars.chunks')"

              /snap/$SNAPNAME/current/usr/bin/mongosh --port $MONGODB_PORT --host 127.0.0.1 \
                --db wekan --eval "db.cfs_gridfs.avatars.files.renameCollection('avatars.files')"

              /snap/$SNAPNAME/current/bin/mongoexport --port $MONGODB_PORT --host 127.0.0.1 \
                  --db wekan --collection cfs.attachments.filerecord > $BACKUPDIR/old_files.json

              while IFS= read -r line; do
                  # Extract key from copies.attachments
                  key=$(echo "$line" | grep -o '"key"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4)

                  if [ ! -z "$key" ]; then
                      echo "Processing file with key: $key"

                      # Extract all metadata
                      name=$(echo "$line" | grep -o '"original"[[:space:]]*:[[:space:]]*{[^}]*}' | grep -o '"name"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4)
                      type=$(echo "$line" | grep -o '"original"[[:space:]]*:[[:space:]]*{[^}]*}' | grep -o '"type"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4)
                      size=$(echo "$line" | grep -o '"size"[[:space:]]*:[[:space:]]*[0-9]*' | cut -d':' -f2 | tr -d ' ' | head -1)
                      boardId=$(echo "$line" | grep -o '"boardId"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4)
                      cardId=$(echo "$line" | grep -o '"cardId"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4)
                      userId=$(echo "$line" | grep -o '"userId"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4)
                      swimlaneId=$(echo "$line" | grep -o '"swimlaneId"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4)
                      listId=$(echo "$line" | grep -o '"listId"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4)

                      # Determine file extension
                      ext=$(echo "$name" | awk -F. '{print $NF}' | tr '[:upper:]' '[:lower:]')

                      # Determine file type
                      isPDF=$(echo "$type" | grep -q "pdf" && echo "true" || echo "false")
                      isImage=$(echo "$type" | grep -E -- "image|png|jpg|jpeg|gif|bmp|tiff|svg|webp|pcx" && echo "true" || echo "false")
                      isVideo=$(echo "$type" | grep -E -- "video|mp4|m4p|m4v|m4mov|qt|wmv|avi|mpeg|mpg|mp2|mpe|flv|webm|mkv|flv|ogg|mts|m2ts|ts|gifv" && echo "true" || echo "false")

                      echo "Creating new format for: $name"

                      # Create new record in new format
                      echo "{
                          \"_id\": \"$key\",
                          \"size\": $size,
                          \"type\": \"$type\",
                          \"name\": \"$name\",
                          \"meta\": {
                              \"boardId\": \"$boardId\",
                              \"swimlaneId\": \"$swimlaneId\",
                              \"listId\": \"$listId\",
                              \"cardId\": \"$cardId\"
                          },
                          \"ext\": \"$ext\",
                          \"extension\": \"$ext\",
                          \"extensionWithDot\": \".$ext\",
                          \"mime\": \"$type\",
                          \"mime-type\": \"$type\",
                          \"userId\": \"$userId\",
                          \"path\": \"/var/snap/$SNAPNAME/common/files/attachments/$key.$ext\",
                          \"versions\": {
                              \"original\": {
                                  \"path\": \"/var/snap/$SNAPNAME/common/files/attachments/$key-original-$name\",
                                  \"size\": $size,
                                  \"type\": \"$type\",
                                  \"extension\": \"$ext\",
                                  \"storage\": \"gridfs\",
                                  \"meta\": {
                                      \"gridFsFileId\": \"$key\"
                                  }
                              }
                          },
                          \"_downloadRoute\": \"/cdn/storage\",
                          \"_collectionName\": \"attachments\",
                          \"isVideo\": false,
                          \"isAudio\": false,
                          \"isImage\": $isImage,
                          \"isText\": false,
                          \"isJSON\": false,
                          \"isPDF\": $isPDF,
                          \"_storagePath\": \"/var/snap/$SNAPNAME/common/files/attachments\",
                          \"public\": false
                      }" > "$BACKUPDIR/new_$key.json"


                      echo "Importing to new format..."

                      /snap/$SNAPNAME/current/bin/mongoimport --port $MONGODB_PORT --host 127.0.0.1 \
                          --db wekan --collection attachments \
                          --file="$BACKUPDIR/new_$key.json"


                      echo "Completed migration for: $name"
                      echo "--------------------------"
                  fi
              done < $BACKUPDIR/old_files.json

              snap start $SNAPNAME

              echo "Upgrading completed."

              break
              ;;

    "Downgrade WeKan Snap from newest to 6.09")
              echo "Downgrading WeKan Snap from newest to 6.09."

              snap stop $SNAPNAME

              rm -rf /var/snap/$SNAPNAME/common/*

              snap refresh $SNAPNAME --channel=latest/stable --amend

              snap stop $SNAPNAME

              cp -pR $BACKUPDIR/common/* /var/snap/$SNAPNAME/common/

              sudo snap start $SNAPNAME

              echo "Downgrading completed."

              break
              ;;

    "Quit")
              break
              ;;
    *) echo invalid option;;
    esac
done

