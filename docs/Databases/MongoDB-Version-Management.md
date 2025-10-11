# MongoDB Version Management System

This document describes the MongoDB version management system that automatically detects MongoDB server versions and switches to the appropriate binary and Node.js driver.

## Overview

The system provides:
- **Automatic version detection** based on connection attempts and wire protocol errors
- **Automatic binary switching** to the correct MongoDB server version
- **Automatic driver selection** using the appropriate Node.js MongoDB driver
- **Support for MongoDB versions 3-8** with fallback mechanisms

## Current Status

### Available MongoDB Server Binaries
- ✅ **MongoDB 3.2.22** - Available at `/snap/wekan/current/migratemongo/bin/`
- ❌ **MongoDB 4.4.28** - Not available (needs to be added to snap package)
- ❌ **MongoDB 5.0.28** - Not available (needs to be added to snap package)
- ❌ **MongoDB 6.0.15** - Not available (needs to be added to snap package)
- ✅ **MongoDB 7.0.25** - Available at `/snap/wekan/current/bin/`
- ❌ **MongoDB 8.0.4** - Not available (needs to be added to snap package)

### Available MongoDB Node.js Drivers
- ✅ **MongoDB 3.7.4** - Available as `mongodb3legacy`
- ✅ **MongoDB 4.17.2** - Available as `mongodb4legacy`
- ✅ **MongoDB 5.9.2** - Available as `mongodb5legacy`
- ✅ **MongoDB 6.3.0** - Available as `mongodb6legacy`
- ✅ **MongoDB 7.0.1** - Available as `mongodb7legacy`
- ✅ **MongoDB 8.0** - Available as `mongodb8legacy`

## How It Works

### 1. Version Detection
The system attempts to connect to MongoDB using the latest available binary (MongoDB 7.x) and analyzes the response:

- **Success**: If connection succeeds, it's MongoDB 7.x
- **Wire Protocol Error**: If connection fails with wire protocol errors, it detects the version based on the protocol version number:
  - Protocol 0-3: MongoDB 3.x
  - Protocol 4: MongoDB 4.x
  - Protocol 5: MongoDB 5.x
  - Protocol 6: MongoDB 6.x
  - Protocol 7: MongoDB 7.x
  - Protocol 8: MongoDB 8.x

### 2. Binary Switching
Based on the detected version, the system switches to the appropriate MongoDB server binary:

```bash
# MongoDB 3.x
export PATH="/snap/wekan/current/migratemongo/bin:$PATH"
export LD_LIBRARY_PATH="/snap/wekan/current/migratemongo/lib:$LD_LIBRARY_PATH"

# MongoDB 7.x (default)
export PATH="/snap/wekan/current/bin:$PATH"
export LD_LIBRARY_PATH="/snap/wekan/current/usr/lib:$LD_LIBRARY_PATH"
```

### 3. Driver Selection
The Node.js application automatically selects the appropriate MongoDB driver based on the detected version using the `mongodbDriverManager` system.

## Files Modified

### Removed Migration Files
- ❌ `snap-src/bin/mongodb-migrate` - Removed
- ❌ `snap-src/bin/mongodb-migration-web` - Removed  
- ❌ `snap-src/bin/mongodb-migration-status` - Removed

### Updated Files
- ✅ `snap-src/bin/mongodb-control` - Completely rewritten with version detection
- ✅ `snap-src/bin/mongodb-version-manager` - New utility for managing versions

### Node.js Driver System
- ✅ `models/lib/mongodbDriverManager.js` - Manages multiple MongoDB drivers
- ✅ `models/lib/mongodbConnectionManager.js` - Handles connections with version detection
- ✅ `models/lib/meteorMongoIntegration.js` - Integrates with Meteor's Mongo.Collection
- ✅ `server/mongodb-driver-startup.js` - Initializes the driver system

## Adding Missing MongoDB Server Binaries

To add MongoDB versions 4, 5, 6, and 8 to the snap package, you need to:

### 1. Download MongoDB Server Binaries
Download the appropriate MongoDB server binaries for each version:

```bash
# MongoDB 4.4.28
wget https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-4.4.28.tgz

# MongoDB 5.0.28  
wget https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-5.0.28.tgz

# MongoDB 6.0.15
wget https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-6.0.15.tgz

# MongoDB 8.0.4
wget https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-8.0.4.tgz
```

### 2. Extract and Install in Snap Package
Extract each version to the appropriate directory in the snap package:

```bash
# Extract MongoDB 4.x
tar -xzf mongodb-linux-x86_64-4.4.28.tgz
mkdir -p /snap/wekan/current/mongodb4/bin
cp mongodb-linux-x86_64-4.4.28/bin/* /snap/wekan/current/mongodb4/bin/

# Extract MongoDB 5.x
tar -xzf mongodb-linux-x86_64-5.0.28.tgz
mkdir -p /snap/wekan/current/mongodb5/bin
cp mongodb-linux-x86_64-5.0.28/bin/* /snap/wekan/current/mongodb5/bin/

# Extract MongoDB 6.x
tar -xzf mongodb-linux-x86_64-6.0.15.tgz
mkdir -p /snap/wekan/current/mongodb6/bin
cp mongodb-linux-x86_64-6.0.15/bin/* /snap/wekan/current/mongodb6/bin/

# Extract MongoDB 8.x
tar -xzf mongodb-linux-x86_64-8.0.4.tgz
mkdir -p /snap/wekan/current/mongodb8/bin
cp mongodb-linux-x86_64-8.0.4/bin/* /snap/wekan/current/mongodb8/bin/
```

### 3. Update Snap Package Build
Modify the snap package build process to include these binaries in the final package.

## Usage

### Check Available Versions
```bash
$SNAP/bin/mongodb-version-manager versions
```

### Check Current Active Version
```bash
$SNAP/bin/mongodb-version-manager active
```

### Force Version Detection
```bash
$SNAP/bin/mongodb-version-manager detect
```

### View Detection Log
```bash
$SNAP/bin/mongodb-version-manager log
```

## Configuration

### Environment Variables
- `MONGO_URL` - MongoDB connection URL (default: `mongodb://127.0.0.1:27017/wekan`)
- `SNAP_COMMON` - Snap common directory for logs and version files

### Version Files
- `${SNAP_COMMON}/mongodb-active-version` - Caches the currently active version
- `${SNAP_COMMON}/mongodb-version-detection.log` - Logs version detection events

## Benefits

1. **No Downtime**: Automatic version detection and switching without manual intervention
2. **Backward Compatibility**: Works with existing MongoDB 3.x databases
3. **Forward Compatibility**: Ready for MongoDB 8.x when available
4. **Automatic Fallback**: Falls back to MongoDB 7.x if detection fails
5. **Comprehensive Logging**: Detailed logs for troubleshooting
6. **No Migrations**: Eliminates the need for database migrations

## Troubleshooting

### Version Detection Not Working
1. Check the detection log: `$SNAP/bin/mongodb-version-manager log`
2. Force re-detection: `$SNAP/bin/mongodb-version-manager detect`
3. Restart MongoDB service

### Wrong Version Selected
1. Clear the cached version: `rm ${SNAP_COMMON}/mongodb-active-version`
2. Restart MongoDB service

### Connection Issues
1. Verify MongoDB server is running
2. Check MONGO_URL environment variable
3. Review MongoDB server logs

## Future Enhancements

1. **Add Missing Binaries**: Include MongoDB 4, 5, 6, and 8 server binaries in snap package
2. **Health Checks**: Add health monitoring for different MongoDB versions
3. **Performance Metrics**: Track performance across different versions
4. **Auto-Upgrade**: Automatically upgrade to newer versions when available
