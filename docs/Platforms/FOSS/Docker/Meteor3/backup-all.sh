# Loop through all subdirectories in the current directory
for d in restore/*/ ; do
    # Get only directory name, without restore/ part
    FOLDER_NAME=$(basename "$d")
    echo "--------------------------------------------------"
    echo "Creating backup: $FOLDER_NAME"
    echo "--------------------------------------------------"
    ./backup.sh "$FOLDER_NAME" || continue
done

echo "All backups done!"
