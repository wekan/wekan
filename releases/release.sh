# Usage: ./release.sh 1.36

# Build Sandstorm
./release-sandstorm.sh $1

# Build Snap
./release-snap.sh $1
