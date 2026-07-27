# MongoDB Compatibility Guide

## Overview

This guide documents MongoDB compatibility issues and fixes for Wekan across MongoDB versions 3.0 through 8.0, ensuring proper operation with Meteor.js 2.14.

## Current Status

- **Meteor.js Version**: 2.14
- **MongoDB Package**: mongo@1.16.8
- **Supported MongoDB Versions**: 3.0 - 8.0
- **Compatibility Status**: ✅ Fixed

## Compatibility Issues Fixed

### 1. Deprecated `.count()` Method

**Issue**: The `.count()` method is deprecated in newer MongoDB versions.

**Fixed Files**:
- `models/users.js` - Line 1839
- `server/migrations.js` - Line 209  
- `server/publications/cards.js` - Lines 709, 711, 713
- `client/components/settings/adminReports.js` - Line 115

**Fix Applied**:
```javascript
// Before (deprecated)
const count = collection.find().count();

// After (compatible)
const count = collection.find().countDocuments();
```

### 2. MongoDB 8.0 Null/Undefined Equality

**Issue**: MongoDB 8.0 changed behavior where equality matches to `null` no longer match `undefined` values.

**Fixed Files**:
- `models/customFields.js` - Custom field initialization
- `models/cards.js` - Card custom field initialization

**Fix Applied**:
```javascript
// Before (MongoDB 8.0 incompatible)
{ field: null }

// After (MongoDB 8.0 compatible)
{ field: { $in: [null, undefined] } }
```

## Direct Operations Analysis

### Purpose of Direct Operations

Direct operations (`.direct.insert()`, `.direct.update()`, `.direct.remove()`) are used intentionally in Wekan to:

1. **Bypass Meteor Security**: For system operations that need to bypass validation
2. **Migration Scripts**: For data migration operations
3. **Import/Export**: For bulk data operations
4. **System Initialization**: For setting up initial data

### Files Using Direct Operations

**Models**:
- `models/wekanCreator.js` - Wekan board creation
- `models/trelloCreator.js` - Trello import
- `models/cards.js` - Card operations
- `models/boards.js` - Board operations
- `models/lists.js` - List operations
- `models/swimlanes.js` - Swimlane operations
- `models/customFields.js` - Custom field operations
- `models/checklistItems.js` - Checklist operations
- `models/integrations.js` - Integration operations
- `models/csvCreator.js` - CSV export operations

**Server**:
- `server/migrations.js` - Database migrations
- `server/notifications/outgoing.js` - Notification operations

### Security Considerations

Direct operations bypass Meteor's security model, so they should only be used when:
- ✅ System-level operations (migrations, imports)
- ✅ Bulk operations that need performance
- ✅ Operations that need to bypass validation
- ❌ User-initiated operations (use regular methods)
- ❌ Operations that need security validation

## Raw Collection Usage

### Purpose of Raw Collections

Raw collections (`.rawCollection()`) are used for:
1. **Advanced Aggregation**: Complex aggregation pipelines
2. **Database Commands**: Direct database commands
3. **Index Management**: Creating/dropping indexes
4. **Migration Operations**: Complex data transformations

### Files Using Raw Collections

- `models/server/metrics.js` - Metrics aggregation
- `server/migrations.js` - Migration operations

### Security Considerations

Raw collections bypass all Meteor security, so they should only be used when:
- ✅ Server-side only operations
- ✅ System administration tasks
- ✅ Complex aggregation pipelines
- ❌ Client-side operations
- ❌ User data operations without validation

## Version-Specific Compatibility

### MongoDB 3.0 - 3.6
- ✅ Full compatibility
- ✅ Uses mongodb3legacy driver
- ✅ All operations supported

### MongoDB 4.0 - 4.4
- ✅ Full compatibility
- ✅ Uses mongodb4legacy driver
- ✅ All operations supported

### MongoDB 5.0
- ✅ Full compatibility
- ✅ Uses mongodb5legacy driver
- ✅ All operations supported

### MongoDB 6.0
- ✅ Full compatibility
- ✅ Uses mongodb6legacy driver
- ✅ All operations supported

### MongoDB 7.0
- ✅ Full compatibility
- ✅ Uses mongodb7legacy driver
- ✅ All operations supported

### MongoDB 8.0
- ✅ Full compatibility (after fixes)
- ✅ Uses mongodb8legacy driver
- ✅ Null/undefined equality fixed

## Testing Recommendations

### Test Matrix

| MongoDB Version | Driver | Status | Test Priority |
|----------------|--------|--------|---------------|
| 3.0 | mongodb3legacy | ✅ Compatible | High |
| 3.2 | mongodb3legacy | ✅ Compatible | High |
| 3.4 | mongodb3legacy | ✅ Compatible | High |
| 3.6 | mongodb3legacy | ✅ Compatible | High |
| 4.0 | mongodb4legacy | ✅ Compatible | High |
| 4.2 | mongodb4legacy | ✅ Compatible | High |
| 4.4 | mongodb4legacy | ✅ Compatible | High |
| 5.0 | mongodb5legacy | ✅ Compatible | Medium |
| 6.0 | mongodb6legacy | ✅ Compatible | Medium |
| 7.0 | mongodb7legacy | ✅ Compatible | Medium |
| 8.0 | mongodb8legacy | ✅ Compatible | High |

### Test Scenarios

1. **Basic Operations**:
   - Create/Read/Update/Delete operations
   - Collection queries and filters
   - Index operations

2. **Advanced Operations**:
   - Aggregation pipelines
   - Complex queries with null/undefined
   - Direct operations
   - Raw collection operations

3. **Migration Operations**:
   - Database migrations
   - Data import/export
   - Schema changes

4. **Performance Testing**:
   - Large dataset operations
   - Concurrent operations
   - Memory usage

## Monitoring and Debugging

### MongoDB Driver System

The MongoDB driver system provides:
- Automatic version detection
- Driver selection based on MongoDB version
- Connection monitoring
- Error tracking

### Debug Methods

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
```

### Real-time Monitoring

```javascript
// Subscribe to monitoring
Meteor.subscribe('mongodb-driver-monitor');

// Access data in template
Template.yourTemplate.helpers({
  driverStats() {
    return MongoDBDriverMonitor.findOne('stats');
  }
});
```

## Best Practices

### Query Optimization

1. **Use Indexes**: Ensure proper indexes for frequently queried fields
2. **Limit Results**: Use `.limit()` and `.skip()` for pagination
3. **Project Fields**: Use projection to limit returned fields
4. **Aggregation**: Use aggregation pipelines for complex operations

### Security

1. **Validate Input**: Always validate user input
2. **Use Regular Methods**: Prefer regular methods over direct operations
3. **Server-side Only**: Keep sensitive operations server-side
4. **Audit Logging**: Log important operations

### Performance

1. **Connection Pooling**: Use connection pooling for better performance
2. **Batch Operations**: Use batch operations for bulk data
3. **Caching**: Implement caching for frequently accessed data
4. **Monitoring**: Monitor query performance and optimize as needed

## Troubleshooting

### Common Issues

1. **Connection Failures**:
   - Check MONGO_URL configuration
   - Verify MongoDB server is running
   - Check network connectivity

2. **Query Errors**:
   - Verify query syntax
   - Check field names and types
   - Validate MongoDB version compatibility

3. **Performance Issues**:
   - Check indexes
   - Optimize queries
   - Monitor connection pool usage

### Debug Commands

```bash
# Check MongoDB version
mongo --eval "db.version()"

# Check connection status
mongo --eval "db.runCommand({connectionStatus: 1})"

# Check indexes
mongo --eval "db.collection.getIndexes()"

# Check query performance
mongo --eval "db.collection.find().explain('executionStats')"
```

## Migration Guide

### From Older MongoDB Versions

1. **Backup Data**: Always backup before migration
2. **Test Compatibility**: Test with target MongoDB version
3. **Update Drivers**: Use appropriate driver for MongoDB version
4. **Run Migrations**: Execute any necessary data migrations
5. **Validate**: Verify all functionality works correctly

### To Newer MongoDB Versions

1. **Check Compatibility**: Verify all queries are compatible
2. **Update Queries**: Fix any deprecated method usage
3. **Test Thoroughly**: Test all functionality
4. **Monitor Performance**: Watch for performance changes
5. **Update Documentation**: Update any version-specific documentation

## Support

For MongoDB compatibility issues:

1. Check this guide for known issues and solutions
2. Review MongoDB release notes for version-specific changes
3. Test with the MongoDB driver system
4. Use the monitoring tools to diagnose issues
5. Consult the Wekan community for additional help

## License

This MongoDB Compatibility Guide is part of Wekan and is licensed under the MIT License.
