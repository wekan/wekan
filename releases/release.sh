# Usage: ./release.sh 1.36

# Build Bundle
~/repos/wekan/releases/release-bundle.sh $1

# Build Sandstorm
~/repos/wekan/releases/release-sandstorm.sh $1

# Build Snap
#./release-snap.sh $1
