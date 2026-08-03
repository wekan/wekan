#!/bin/bash

if [ "$#" -ne 2 ]; then
  echo "Update WeKan old version to new version."
  echo "Example: ./update-wekan-version.sh 9.10 9.11"
  exit 1
fi

# Replace version number at docker-compose.yml of every user
sed -i "s|ghcr.io/wekan/wekan:v$1|ghcr.io/wekan/wekan:v$2|g" restore/*/docker-compose.yml

# Loop through all subdirectories in the restore directory
for d in restore/*/ ; do
    # Extract JUST the clean folder name (e.g., "parameter" instead of "restore/parameter")
    TMP="${d%/}"
    FOLDER_NAME="${TMP##*/}"
    
    echo "--------------------------------------------------"
    echo "Processing folder: $FOLDER_NAME"
    echo "--------------------------------------------------"
    
    # Run inside a subshell () so the main script never leaves the root directory
    (
        cd "$d" || exit 1

        # Run the Docker commands using the clean folder name
        docker compose down
        docker rm "${FOLDER_NAME}-tenant" 2>/dev/null # 2>/dev/null ignores errors if it's already gone
        docker compose up -d --force-recreate
    )
done

echo "All folders processed!"
