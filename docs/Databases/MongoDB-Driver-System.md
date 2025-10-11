# MongoDB Driver System

## Overview

The MongoDB Driver System provides automatic MongoDB version detection and driver selection to support MongoDB versions 3.0 through 8.0 with compatible Node.js drivers. This system eliminates the need for manual driver configuration and provides seamless compatibility across all supported MongoDB versions.

## Features

- **Automatic Version Detection**: Detects MongoDB server version from wire protocol errors
- **Dynamic Driver Selection**: Automatically selects the appropriate Node.js driver based on detected version
- **Fallback Mechanism**: Tries multiple drivers if the first attempt fails
- **Connection Retry Logic**: Retries connections with different drivers on failure
- **Real-time Monitoring**: Provides connection statistics and monitoring capabilities
- **Meteor Integration**: Seamlessly integrates with Meteor's MongoDB connection system

## Supported MongoDB Versions

| MongoDB Version | Node.js Driver | Driver Version | Package Name |
|----------------|----------------|----------------|--------------|
| 3.0 - 3.6      | mongodb@3.7.4  | 3.7.4         | mongodb3legacy |
| 4.0 - 4.4      | mongodb@4.17.2 | 4.17.2        | mongodb4legacy |
| 5.0            | mongodb@5.9.2  | 5.9.2         | mongodb5legacy |
| 6.0            | mongodb@6.3.0  | 6.3.0         | mongodb6legacy |
| 7.0            | mongodb@7.0.1  | 7.0.1         | mongodb7legacy |
| 8.0            | mongodb@6.9.0  | 6.9.0         | mongodb8legacy |

## Architecture

### Core Components

1. **MongoDBDriverManager** (`models/lib/mongodbDriverManager.js`)
   - Manages driver compatibility matrix
   - Detects MongoDB version from wire protocol errors
   - Selects appropriate driver based on detected version
   - Tracks connection attempts and statistics

2. **MongoDBConnectionManager** (`models/lib/mongodbConnectionManager.js`)
   - Handles MongoDB connections with automatic driver selection
   - Implements connection retry logic with different drivers
   - Manages connection pooling and lifecycle
   - Provides fallback mechanism for unsupported versions

3. **MeteorMongoIntegration** (`models/lib/meteorMongoIntegration.js`)
   - Integrates with Meteor's MongoDB connection system
   - Overrides Meteor's connection methods to use custom drivers
   - Provides Meteor-compatible connection objects
   - Enhances collections with additional methods

4. **MongoDB Driver Startup** (`server/mongodb-driver-startup.js`)
   - Initializes the system on server startup
   - Provides server-side methods for monitoring and debugging
   - Sets up real-time monitoring publications

## Installation

The MongoDB driver system is automatically installed when you install Wekan dependencies:

```bash
npm install
```

All required driver packages are included in `package.json`:

```json
{
  "dependencies": {
    "mongodb3legacy": "npm:mongodb@3.7.4",
    "mongodb4legacy": "npm:mongodb@4.17.2",
    "mongodb5legacy": "npm:mongodb@5.9.2",
    "mongodb6legacy": "npm:mongodb@6.3.0",
    "mongodb7legacy": "npm:mongodb@7.0.1",
    "mongodb8legacy": "npm:mongodb@6.9.0"
  }
}
```

## Usage

### Automatic Operation

The system works automatically without any configuration required:

1. **Startup**: The system initializes automatically when Wekan starts
2. **Connection**: When connecting to MongoDB, the system detects the server version
3. **Driver Selection**: The appropriate driver is selected based on the detected version
4. **Fallback**: If the first driver fails, fallback drivers are tried automatically

### Manual Testing

You can test the system using the provided test script:

```bash
node test-mongodb-drivers.js
```

### Monitoring

The system provides several ways to monitor its operation:

#### Server-side Methods

```javascript
// Get connection statistics
Meteor.call('mongodb-driver-stats', (error, result) => {
  console.log('Connection Stats:', result);
});

// Test connection
Meteor.call('mongodb-driver-test-connection', (error, result) => {
  console.log('Connection Test:', result);
});

// Get supported versions
Meteor.call('mongodb-driver-supported-versions', (error, result) => {
  console.log('Supported Versions:', result);
});

// Reset system
Meteor.call('mongodb-driver-reset', (error, result) => {
  console.log('Reset Result:', result);
});
```

#### Real-time Monitoring

Subscribe to the monitoring publication:

```javascript
Meteor.subscribe('mongodb-driver-monitor');
```

Access the data in your template:

```javascript
Template.yourTemplate.helpers({
  driverStats() {
    return MongoDBDriverMonitor.findOne('stats');
  }
});
```

## Wire Protocol Error Detection

The system detects MongoDB versions by analyzing wire protocol errors. Here are the error patterns used:

### MongoDB 3.x
- `unsupported wire protocol version`
- `wire protocol version 0/1/2/3`
- `protocol version 0/1/2/3`

### MongoDB 4.x
- `wire protocol version 4/5/6`
- `protocol version 4/5/6`

### MongoDB 5.x
- `wire protocol version 7`
- `protocol version 7`

### MongoDB 6.x
- `wire protocol version 8`
- `protocol version 8`

### MongoDB 7.x
- `wire protocol version 9`
- `protocol version 9`

### MongoDB 8.x
- `wire protocol version 10`
- `protocol version 10`

## Configuration

### Environment Variables

The system uses the standard MongoDB environment variables:

- `MONGO_URL`: MongoDB connection string
- `MONGO_OPLOG_URL`: MongoDB oplog connection string (optional)

### Connection Options

You can customize connection options by modifying the default options in `mongodbConnectionManager.js`:

```javascript
const defaultOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  // Add your custom options here
};
```

## Troubleshooting

### Common Issues

1. **Driver Not Found**
   - Ensure all driver packages are installed: `npm install`
   - Check that package.json contains all required drivers

2. **Connection Failures**
   - Verify MONGO_URL is correctly set
   - Check MongoDB server is running and accessible
   - Review connection logs for specific error messages

3. **Version Detection Issues**
   - Check if MongoDB server is responding
   - Verify wire protocol error patterns match your MongoDB version
   - Review connection attempt logs

### Debugging

Enable debug logging by setting the DEBUG environment variable:

```bash
DEBUG=mongodb-driver* node main.js
```

### Logs

The system provides detailed logging:

```
=== MongoDB Driver System Startup ===
MONGO_URL found, initializing MongoDB driver system...
Connection string: mongodb://***:***@localhost:27017/wekan
Initializing Meteor MongoDB Integration...
Testing MongoDB connection...
✅ MongoDB connection test successful
   Driver: mongodb6legacy
   Version: 6.0
MongoDB Driver System Statistics:
   Initialized: true
   Custom Connection: true
   Supported Versions: 3.0, 3.2, 3.4, 3.6, 4.0, 4.2, 4.4, 5.0, 6.0, 7.0, 8.0
=== MongoDB Driver System Ready ===
```

## Performance Considerations

- **Connection Pooling**: Each driver maintains its own connection pool
- **Driver Selection**: Version detection happens only on first connection
- **Fallback Overhead**: Fallback attempts add minimal overhead
- **Memory Usage**: Multiple drivers are loaded but only one is active

## Security

- **Credential Protection**: Connection strings are logged with credentials masked
- **Access Control**: Monitoring methods require user authentication
- **Error Handling**: Sensitive information is not exposed in error messages

## Migration from Standard MongoDB

If you're migrating from standard MongoDB connections:

1. **No Code Changes Required**: The system is backward compatible
2. **Automatic Detection**: Version detection happens automatically
3. **Gradual Migration**: You can test with specific drivers before full migration
4. **Rollback**: You can disable the system and return to standard connections

## Future Enhancements

- **Additional MongoDB Versions**: Support for newer MongoDB versions as they're released
- **Performance Optimization**: Connection pooling optimizations
- **Enhanced Monitoring**: More detailed metrics and alerting
- **Configuration UI**: Web interface for driver configuration

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review the logs for specific error messages
3. Test with the provided test script
4. Use the monitoring methods to gather diagnostic information

## License

This MongoDB Driver System is part of Wekan and is licensed under the MIT License.
