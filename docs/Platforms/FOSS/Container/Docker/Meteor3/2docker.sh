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

mkdir -p restore/$1
cat restore/docker-start.yml > restore/$1/docker-compose.yml
sed -i "s|PARAMETER|${1}|g" restore/$1/docker-compose.yml
cat $1.txt >> restore/$1/docker-compose.yml
cat snap-settings/wekan_$1.txt >> restore/$1/docker-compose.yml
cat restore/docker-end.yml >> restore/$1/docker-compose.yml

