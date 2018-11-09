# Usage: ./release.sh 1.36

# Build Sandstorm
cd ~/repos/wekan
./releases/release-sandstorm.sh $1

# Build Snap
cd ~/repos/wekan
./releases/release-snap.sh $1
