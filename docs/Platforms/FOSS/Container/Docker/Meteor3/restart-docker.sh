#!/bin/bash

# Loop through all subdirectories in the current directory
for d in */ ; do
    # Remove the trailing slash to get just the folder name
    FOLDER_NAME="${d%/}"
    
    echo "--------------------------------------------------"
    echo "Processing folder: $FOLDER_NAME"
    echo "--------------------------------------------------"
    
    # Change into the subdirectory, skip if it fails
    cd "$FOLDER_NAME" || continue

    # Run the Docker commands using the folder name
    docker compose down
    docker compose up -d --force-recreate
    #docker compose stop
    #docker compose start
    #docker rm "${FOLDER_NAME}-tenant"
    #docker compose up -d

    # Return to the parent directory
    cd ..
done

echo "All folders processed!"
