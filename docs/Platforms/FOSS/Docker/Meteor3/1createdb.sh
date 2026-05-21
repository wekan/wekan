#!/bin/bash

# Make sure to run as root
if [ "$EUID" -ne 0 ]; then
    echo "Error: This script needs to be run as root."
    echo "Use for example 'sudo su' before running this script."
    exit 1
fi

# Check that script has been given only one parameter
if [ "$#" -ne 1 ]; then
    echo "Error: Give a short lowecase ascii database name a parameter."
    echo "Example: $0 <databasename>"
    exit 1
fi

DB_NAME=$1
MONGO_PORT=27017
MONGO_HOST="localhost"
CONFIG_FILE="/etc/mongod.conf"
ADMIN_FILE="admin.txt"
TARGET_FILE="${DB_NAME}.txt"

# Function for generating random password
generate_password() {
    openssl rand -base64 12 | tr -dc 'a-zA-Z0-9' | head -c 16
}

# --- STEP 1: CHECK ADMIN-USER AND PASSWORDLESS MONGODB STATE ---

# Check is there already authorization enabled at mongod.conf
IS_AUTH_ENABLED=$(grep -A 5 "^security:" "$CONFIG_FILE" 2>/dev/null | grep "authorization:" | grep -q "enabled"; echo $?)

if [ ! -f "$ADMIN_FILE" ]; then
    # If admin.txt is missing, but database already requires auth, passwordless usage is not possible
    if [ "$IS_AUTH_ENABLED" -eq 0 ]; then
        echo "Error: MongoDB is already protected (authorization: enabled), but file $ADMIN_FILE is missing."
        echo "Script can not create admin-user without access to database. Exiting."
        exit 1
    fi

    echo "--- There is no Admin yet. Creating Admin to passwordless database... ---"
    
    ADMIN_USER="admin_root"
    ADMIN_PASS=$(generate_password)
    
    # Creating admin-user localhost by using exception
    mongosh --port $MONGO_PORT --eval "
      db = db.getSiblingDB('admin');
      db.createUser({
        user: '${ADMIN_USER}',
        pwd: '${ADMIN_PASS}',
        roles: [ { role: 'root', db: 'admin' } ]
      });
    " > /dev/null

    if [ $? -ne 0 ]; then
        echo "Error: Creating Admin-user failed. Check is MongoDB running?"
        exit 1
    fi

    # Save Admin-user details
    ADMIN_URL="mongodb://${ADMIN_USER}:${ADMIN_PASS}@${MONGO_HOST}:${MONGO_PORT}/admin"
    echo "MONGO_URL=${ADMIN_URL}" > "$ADMIN_FILE"
    echo "MONGOSH_CMD=mongosh \"${ADMIN_URL}\"" >> "$ADMIN_FILE"
    
    echo "Admin-user created successfully."
    echo "--- Changing MongoDB to require login (/etc/mongod.conf) ---"

    # Editing mongod.conf settings
    if grep -q "^security:" "$CONFIG_FILE"; then
        if grep -A 5 "^security:" "$CONFIG_FILE" | grep -q "authorization:"; then
            sed -i '/authorization:/c\  authorization: enabled' "$CONFIG_FILE"
        else
            sed -i '/^security:/a\  authorization: enabled' "$CONFIG_FILE"
        fi
    else
        echo -e "\nsecurity:\n  authorization: enabled" >> "$CONFIG_FILE"
    fi

    echo "--- Restarting MongoDB, so that using password is always required... ---"
    systemctl restart mongod
    sleep 2
    echo "MongoDB is password protected and restarted."
else
    echo "--- Found existing $ADMIN_FILE. Reading admin-password... ---"
    SAVED_URL=$(grep "MONGO_URL=" "$ADMIN_FILE" | cut -d'=' -f2)
    ADMIN_USER=$(echo "$SAVED_URL" | sed -e 's|mongodb://||' -e 's|@.*||' | cut -d':' -f1)
    ADMIN_PASS=$(echo "$SAVED_URL" | sed -e 's|mongodb://||' -e 's|@.*||' | cut -d':' -f2)
fi


# --- STEP 2: CHECK DOES TARGET DATABASE AND USER EXIST ---

echo "--- Check does database or user already exist... ---"

# Ask MongoDB is there does user already exist
USER_EXISTS=$(mongosh --port $MONGO_PORT -u "$ADMIN_USER" -p "$ADMIN_PASS" --authenticationDatabase "admin" --quiet --eval "
  db = db.getSiblingDB('${DB_NAME}');
  print(db.getUser('${DB_NAME}_user') !== null);
")

if [ "$USER_EXISTS" == "true" ] || [ -f "$TARGET_FILE" ]; then
    echo "--------------------------------------------------"
    echo "Database user '${DB_NAME}_user' or file '$TARGET_FILE' already exists."
    echo "Script did not make any changes. Exiting."
    echo "--------------------------------------------------"
    exit 0
fi


# --- STEP 3: CREATE READOPLOGONLY-ROLE (IF NOT EXIST YET) ---

echo "--- Checking does readOplogOnly-role exist at admin-database... ---"

mongosh --port $MONGO_PORT \
  -u "$ADMIN_USER" \
  -p "$ADMIN_PASS" \
  --authenticationDatabase "admin" \
  --eval "
    db = db.getSiblingDB('admin');
    if (db.getRole('readOplogOnly') === null) {
      db.runCommand({
        createRole: 'readOplogOnly',
        privileges: [
          {
            resource: { db: 'local', collection: 'oplog.rs' },
            actions: [ 'find' ]
          }
        ],
        roles: []
      });
      print('Role created.');
    } else {
      print('Role already exists.');
    }
" > /dev/null


# --- STEP 4: CREATE DATABASE ACCORGIND TO PARAMETER ---

echo "--- Creating database '$DB_NAME' and user... ---"

TARGET_PASS=$(generate_password)

mongosh --port $MONGO_PORT \
  -u "$ADMIN_USER" \
  -p "$ADMIN_PASS" \
  --authenticationDatabase "admin" \
  --eval "
    db = db.getSiblingDB('${DB_NAME}');
    db.createUser({
      user: '${DB_NAME}_user',
      pwd: '${TARGET_PASS}',
      roles: [
        { role: 'readWrite', db: '${DB_NAME}' },
        { role: 'dbAdmin', db: '${DB_NAME}' },
        { role: 'readOplogOnly', db: 'admin' }
      ]
    });
" > /dev/null

if [ $? -eq 0 ]; then
    # Creating also ready MONGO_OPLOG_URL to output / file for ease of use
    TARGET_URL="mongodb://${DB_NAME}_user:${TARGET_PASS}@${MONGO_HOST}:${MONGO_PORT}/${DB_NAME}?authSource=${DB_NAME}"
    OPLOG_URL="mongodb://${DB_NAME}_user:${TARGET_PASS}@${MONGO_HOST}:${MONGO_PORT}/local?replicaSet=rs0&authSource=${DB_NAME}"
    
    echo "MONGO_URL=${TARGET_URL}" > "$TARGET_FILE"
    echo "MONGO_OPLOG_URL=${OPLOG_URL}" >> "$TARGET_FILE"

    echo "--------------------------------------------------"
    echo "Ready! Database and user created successfully."
    echo "New database details saved to $TARGET_FILE"
    echo "--------------------------------------------------"
else
    echo "Error: Creating database failed."
    exit 1
fi
