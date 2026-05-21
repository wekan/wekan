#!/bin/bash

if [ "$#" -ne 1 ]; then
  echo "Error: Enter the name of the database to restore as a parameter."
  echo "Usage: $0 <database_name>"
  exit 1
fi

DB_PARAM=$1
RESTORE_DIR=restore
TARGET_FILE="${DB_PARAM}.txt"

# Checking the identity file
if [ ! -f "$TARGET_FILE" ]; then
  echo "Error: File '$TARGET_FILE' not found."
  exit 1
fi

# IMPORTANT CHANGE: Pointing to the dump folder as the root, not the wekan folder!
if [ -d "./${RESTORE_DIR}/${DB_PARAM}/dump" ]; then
  BACKUP_DIR="./${RESTORE_DIR}/${DB_PARAM}/dump"
else
  BACKUP_DIR="./${RESTORE_DIR}/${DB_PARAM}"
fi

# Retrieving MONGO_URL
MONGO_URL=$(grep "^MONGO_URL=" "$TARGET_FILE" | cut -d'=' -f2-)
if [[ -z "$MONGO_URL" || ! "$MONGO_URL" =~ ^mongodb:// ]]; then
  echo "Error: No valid MONGO_URL line found in file $TARGET_FILE."
  exit 1
fi

CONNECTION_URI=$(echo "$MONGO_URL" | sed 's/\/[^\/]*$/\//')

echo "--- Starting the restore of database '$DB_PARAM' ---"
echo "Using backup from: $BACKUP_DIR"
echo "---------------------------------------------------"

# Run mongorestore by giving it a dump folder.
# The tool reads the "wekan" subfolder from there and changes it to "PARAMETER".
mongorestore --uri="$CONNECTION_URI" \
             --authenticationDatabase="$DB_PARAM" \
             --drop \
             --nsFrom="wekan.*" \
             --nsTo="${DB_PARAM}.*" \
             --dir="$BACKUP_DIR"

if [ $? -eq 0 ]; then
  echo "--------------------------------------------------"
  echo "Done! Database '$DB_PARAM' restored successfully."
  echo "------------------------------------------------"
else
  echo "Error: mongorestore failed."
  exit 1
fi
