#!/bin/bash

# Check that the script was given exactly one parameter
if [ "$#" -ne 1 ]; then
  echo "Error: Enter a file/database name as a parameter."
  echo "Usage: $0 <database_name>"
  exit 1
fi

DB_PARAM=$1
TARGET_FILE="${DB_PARAM}.txt"

# Check if the .txt file exists
if [ ! -f "$TARGET_FILE" ]; then
  echo "Error: File '$TARGET_FILE' not found."
  exit 1
fi

# Display or retrieve MONGO_URL from the file.
# 'grep' searches for the correct line, and
# 'cut' cuts everything after the '=' sign.
MONGO_URL=$(grep "^MONGO_URL=" "$TARGET_FILE" | cut -d'=' -f2-)

# Make sure that something was actually found
# in the file and that it starts with mongodb://
if [[ -z "$MONGO_URL" || ! "$MONGO_URL" =~ ^mongodb:// ]]; then
  echo "Error: No valid MONGO_URL line found in file $TARGET_FILE."
  exit 1
fi

echo "--- Connecting to target: $DB_PARAM ---"

# Execute mongosh command with retrieved URL
mongosh "$MONGO_URL"
