#!/bin/bash

# Check that the script was given exactly one parameter
if [ "$#" -ne 1 ]; then
  echo "Error: Enter the name of the database to be backed up as a parameter."
  echo "Usage: $0 <database_name>"
  exit 1
fi

DB_PARAM=$1
TARGET_FILE="${DB_PARAM}.txt"

# 1. Check if the credentials file exists
if [ ! -f "$TARGET_FILE" ]; then
  echo "Error: File '$TARGET_FILE' not found. Unable to retrieve login information."
  exit 1
fi

# 2. Retrieve MONGO_URL from file
MONGO_URL=$(grep "^MONGO_URL=" "$TARGET_FILE" | cut -d'=' -f2-)

if [[ -z "$MONGO_URL" || ! "$MONGO_URL" =~ ^mongodb:// ]]; then
  echo "Error: No valid MONGO_URL row found in file $TARGET_FILE."
  exit 1
fi

# 3. Remove the database name from the end of the URL for mongodump,
# so that the connection is made to the server root (e.g. mongodb://user:pass@host:port/)
CONNECTION_URI=$(echo "$MONGO_URL" | sed 's/\/[^\/]*$/\//')

# 4. Create a timestamp and destination folder path (Format: YYYY-MM-DD_HH-MM-SS)
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_PATH="backup/${DB_PARAM}/${TIMESTAMP}"

echo "--- Starting backup of database '$DB_PARAM' ---"
echo "Destination folder: $BACKUP_PATH"
echo "--------------------------------------------------"

# Run mongodump
# --uri = connection address with ID
# --db = from which database the dump is taken
# --out = destination folder where the data is saved
mongodump --uri="$CONNECTION_URI" --db="$DB_PARAM" --out="$BACKUP_PATH"

# Backup attachments and avatars
cp -pR "/var/lib/docker/volumes/${DB_PARAM}_wekan-files/_data/files" "${BACKUP_PATH}/"

# Check if the backup was successful
if [ $? -eq 0 ]; then
  echo "------------------------------------------------"
  echo "Done! Backup saved successfully to:"
  echo "$BACKUP_PATH"
  echo "------------------------------------------------"
else
  echo "Error: mongodump failed."
  exit 1
fi
