# Usage: ./release.sh 4.37

# Commit and push version number changes
cd ~/repos/wekan
git add --all
git commit -m "v$1"
git push

# Add release tag
~/repos/wekan/releases/add-tag.sh v$1

# Push to repo
git push

# Build Bundle
~/repos/wekan/releases/release-bundle.sh $1

# Build Sandstorm
#~/repos/wekan/releases/release-sandstorm.sh $1

# Build Snap
#./release-snap.sh $1
