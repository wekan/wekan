#!/bin/bash

# Save all setting of all Parallel Snaps that name start with wekan_ ,
# for example wekan_customer1, wekan_customer2, etc
# ../../Snap/Many-Snaps-on-LXC.md

# Make sure the script is run as root (snap get often requires root privileges)
  if [ "$EUID" -ne 0 ]; then
  echo "Error: This script must be run as root."
  exit 1
fi

echo "--- Looking for snap packages starting with wekan_... ---"

# List all installed snap packages and filter out those starting with "wekan_"
# Extract only the package name (first column)
SNAP_PACKAGES=$(snap list | awk 'NR>1 {print $1}' | grep '^wekan_')

if [ -z "$SNAP_PACKAGES" ]; then
  echo "No snap packages starting with 'wekan_' were found."
  exit 0
fi

# Go through each package found
for SNAP in $SNAP_PACKAGES; do
  OUTPUT_FILE="${SNAP}.txt"
  echo "Processing package: $SNAP -> Saving to file: $OUTPUT_FILE"
  # Empty the file if it already exists, or create a new one
  > "$OUTPUT_FILE"
  # Get the snap settings.
  # 'tail -n +2' omits the header line (Key / Value).
  # 'awk' separates the key and value at the first space/tab.
  snap get -l "$SNAP" | tail -n +2 | while read -r KEY VALUE; do
    # If the line is empty (e.g. an empty value), skip
    if [ -z "$KEY" ]; then
      continue
    fi
    # Change the key to UPPERCASE and replace dashes with underscores
    # e.g. "root-url" -> "ROOT_URL"
    CONVERTED_KEY=$(echo "$KEY" | tr '[:lower:]' '[:upper:]' | tr '-' '_')
    # Write the variable to the file in the format AVAIN=arvo
    echo "${CONVERTED_KEY}=${VALUE}" >> "$OUTPUT_FILE"
  done
  echo "Package $SNAP settings saved."
done

echo "------------------------------------------------"
echo "Done! All wekan_ package settings exported."
echo "------------------------------------------------"

