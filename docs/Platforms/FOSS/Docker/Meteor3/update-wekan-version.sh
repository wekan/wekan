#!/bin/bash

if [ "$#" -ne 2 ]; then
  echo "Update WeKan old version to new version."
  echo "Example: ./update-wekan-version.sh 9.10 9.11"
  exit 1
fi

# Replace version number at docker-compose.yml of every user
sed -i "s|ghcr.io/wekan/wekan:v$1|ghcr.io/wekan/wekan:v$2|g" restore/*/docker-compose.yml

# Loop through all subdirectories in the current directory
for d in restore/*/ ; do
    # Remove the trailing slash to get just the folder name
    FOLDER_NAME="${d%/}"
    
    echo "--------------------------------------------------"
    echo "Processing folder: $FOLDER_NAME"
    echo "--------------------------------------------------"
    
    # Change into the subdirectory, skip if it fails
    cd "$FOLDER_NAME" || continue

    # Run the Docker commands using the folder name
    docker compose stop
    docker rm "${FOLDER_NAME}-app"
    docker compose up -d

    # Return to the parent directory
    cd ..
done

echo "All folders processed!"
