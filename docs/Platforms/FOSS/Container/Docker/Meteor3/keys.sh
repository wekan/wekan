#!/bin/bash

# Create MongoDB keyfile

# Make sure to run as root
if [ "$EUID" -ne 0 ]; then
    echo "Error: This script needs to be run as root."
    echo "Use for example 'sudo su' before running this script."
    exit 1
fi

# Create a folder for the key if it doesn't exist
mkdir -p /var/lib/mongodb/keys

# Generate a random 756 byte key in base64 format
openssl rand -base64 756 > /var/lib/mongodb/keys/mongo-keyfile

# Change the file owner to the mongodb user
chown -R mongodb:mongodb /var/lib/mongodb/keys

# Set strict permissions: only the owner can read
# (very important, otherwise Mongo won't start!)
chmod 400 /var/lib/mongodb/keys/mongo-keyfile
