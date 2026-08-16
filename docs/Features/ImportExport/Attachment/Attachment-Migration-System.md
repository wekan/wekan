# Enhanced Attachment Migration System

## Overview

The Enhanced Attachment Migration System provides a comprehensive solution for managing attachment storage across multiple backends (filesystem, MongoDB GridFS, S3/MinIO) with CPU throttling, real-time monitoring, and secure configuration management.

## Features

### 1. Multi-Backend Storage Support
- **Filesystem Storage**: Local file system storage using `WRITABLE_PATH`
- **MongoDB GridFS**: Database-based file storage
- **S3/MinIO**: Cloud and object storage compatibility

### 2. CPU Throttling
- **Automatic CPU Monitoring**: Real-time CPU usage tracking
- **Configurable Thresholds**: Set CPU usage limits (10-90%)
- **Automatic Pausing**: Migration pauses when CPU threshold is exceeded
- **Resume Capability**: Continue migration when CPU usage drops

### 3. Batch Processing
- **Configurable Batch Size**: Process 1-100 attachments per batch
- **Adjustable Delays**: Set delays between batches (100-10000ms)
- **Progress Tracking**: Real-time progress monitoring
- **Queue Management**: Intelligent migration queue handling

### 4. Security Features
- **Password Protection**: S3 secret keys are never displayed
- **Admin-Only Access**: All operations require admin privileges
- **Secure Configuration**: Environment-based configuration management
- **Audit Logging**: Comprehensive migration logging

### 5. Real-Time Monitoring
- **Storage Statistics**: Live attachment counts and sizes
- **Visual Charts**: Storage distribution visualization
- **Migration Status**: Real-time migration progress
- **System Metrics**: CPU, memory, and performance monitoring

## Admin Panel Interface

### Storage Settings
- **Filesystem Configuration**: View and configure filesystem paths
- **GridFS Status**: Monitor MongoDB GridFS availability
- **S3/MinIO Configuration**: Secure S3/MinIO setup and testing
- **Connection Testing**: Validate storage backend connections

### Migration Controls
- **Batch Configuration**: Set batch size, delays, and CPU thresholds
- **Migration Actions**: Start, pause, resume, and stop migrations
- **Progress Monitoring**: Real-time progress bars and statistics
- **Log Viewing**: Live migration logs with timestamps

### Monitoring Dashboard
- **Storage Distribution**: Visual breakdown of attachment storage
- **Size Analytics**: Total and per-storage size statistics
- **Performance Metrics**: System resource usage
- **Export Capabilities**: Download monitoring data

## Configuration

### Environment Variables

#### Filesystem Storage
```bash
# Base writable path for all file storage
WRITABLE_PATH=/data

# Attachments will be stored at: ${WRITABLE_PATH}/attachments
# Avatars will be stored at: ${WRITABLE_PATH}/avatars
```

#### S3/MinIO Storage
```bash
# S3 configuration (JSON format)
S3='{"s3":{"key":"access-key","secret":"secret-key","bucket":"bucket-name","endPoint":"s3.amazonaws.com","port":443,"sslEnabled":true,"region":"us-east-1"}}'

# Alternative: S3 secret file (Docker secrets)
S3_SECRET_FILE=/run/secrets/s3_secret
```

### Migration Settings

#### Default Configuration
- **Batch Size**: 10 attachments per batch
- **Delay**: 1000ms between batches
- **CPU Threshold**: 70% maximum CPU usage
- **Auto-pause**: When CPU exceeds threshold

#### Customization
All settings can be adjusted through the admin panel:
- Batch size: 1-100 attachments
- Delay: 100-10000ms
- CPU threshold: 10-90%

## Usage

### Starting a Migration

1. **Access Admin Panel**: Navigate to Settings → Attachment Settings
2. **Configure Migration**: Set batch size, delay, and CPU threshold
3. **Select Target Storage**: Choose filesystem, GridFS, or S3
4. **Start Migration**: Click the appropriate migration button
5. **Monitor Progress**: Watch real-time progress and logs

### Migration Process

1. **Queue Initialization**: All attachments are queued for migration
2. **Batch Processing**: Attachments are processed in configurable batches
3. **CPU Monitoring**: System continuously monitors CPU usage
4. **Automatic Pausing**: Migration pauses if CPU threshold is exceeded
5. **Resume Capability**: Migration resumes when CPU usage drops
6. **Progress Tracking**: Real-time progress updates and logging

### Monitoring Migration

- **Progress Bar**: Visual progress indicator
- **Statistics**: Total, migrated, and remaining attachment counts
- **Status Display**: Current migration status (running, paused, idle)
- **Log View**: Real-time migration logs with timestamps
- **Control Buttons**: Pause, resume, and stop migration

## API Reference

### Server Methods

#### Migration Control
```javascript
// Start migration
Meteor.call('startAttachmentMigration', {
  targetStorage: 'filesystem', // 'filesystem', 'gridfs', 's3'
  batchSize: 10,
  delayMs: 1000,
  cpuThreshold: 70
});

// Pause migration
Meteor.call('pauseAttachmentMigration');

// Resume migration
Meteor.call('resumeAttachmentMigration');

// Stop migration
Meteor.call('stopAttachmentMigration');
```

#### Configuration Management
```javascript
// Get storage configuration
Meteor.call('getAttachmentStorageConfiguration');

// Test S3 connection
Meteor.call('testS3Connection', { secretKey: 'new-secret-key' });

// Save S3 settings
Meteor.call('saveS3Settings', { secretKey: 'new-secret-key' });
```

#### Monitoring
```javascript
// Get monitoring data
Meteor.call('getAttachmentMonitoringData');

// Refresh monitoring data
Meteor.call('refreshAttachmentMonitoringData');

// Export monitoring data
Meteor.call('exportAttachmentMonitoringData');
```

### Publications

#### Real-Time Updates
```javascript
// Subscribe to migration status
Meteor.subscribe('attachmentMigrationStatus');

// Subscribe to monitoring data
Meteor.subscribe('attachmentMonitoringData');
```

## Performance Considerations

### CPU Throttling
- **Automatic Monitoring**: CPU usage is checked every 5 seconds
- **Threshold-Based Pausing**: Migration pauses when CPU exceeds threshold
- **Resume Logic**: Migration resumes when CPU usage drops below threshold
- **Configurable Limits**: CPU thresholds can be adjusted (10-90%)

### Batch Processing
- **Configurable Batches**: Batch size can be adjusted (1-100)
- **Delay Control**: Delays between batches prevent system overload
- **Queue Management**: Intelligent queue processing with error handling
- **Progress Tracking**: Real-time progress updates

### Memory Management
- **Streaming Processing**: Large files are processed using streams
- **Memory Monitoring**: System memory usage is tracked
- **Garbage Collection**: Automatic cleanup of processed data
- **Error Recovery**: Robust error handling and recovery

## Security

### Access Control
- **Admin-Only Access**: All operations require admin privileges
- **User Authentication**: Proper user authentication and authorization
- **Session Management**: Secure session handling

### Data Protection
- **Password Security**: S3 secret keys are never displayed in UI
- **Environment Variables**: Sensitive data stored in environment variables
- **Secure Transmission**: All data transmission is encrypted
- **Audit Logging**: Comprehensive logging of all operations

### Configuration Security
- **Read-Only Display**: Sensitive configuration is displayed as read-only
- **Password Updates**: Only new passwords can be set, not viewed
- **Connection Testing**: Secure connection testing without exposing credentials
- **Environment Isolation**: Configuration isolated from application code

## Troubleshooting

### Common Issues

#### Migration Not Starting
- **Check Permissions**: Ensure user has admin privileges
- **Verify Configuration**: Check storage backend configuration
- **Review Logs**: Check server logs for error messages
- **Test Connections**: Verify storage backend connectivity

#### High CPU Usage
- **Reduce Batch Size**: Decrease batch size to reduce CPU load
- **Increase Delays**: Add longer delays between batches
- **Lower CPU Threshold**: Reduce CPU threshold for earlier pausing
- **Monitor System**: Check system resource usage

#### Migration Pausing Frequently
- **Check CPU Threshold**: Verify CPU threshold settings
- **Monitor System Load**: Check for other high-CPU processes
- **Adjust Settings**: Increase CPU threshold or reduce batch size
- **System Optimization**: Optimize system performance

#### Storage Connection Issues
- **Verify Credentials**: Check S3/MinIO credentials
- **Test Connectivity**: Use connection test feature
- **Check Network**: Verify network connectivity
- **Review Configuration**: Validate storage configuration

### Debug Information

#### Migration Logs
- **Real-Time Logs**: View live migration logs in admin panel
- **Server Logs**: Check server console for detailed logs
- **Error Messages**: Review error messages for specific issues
- **Progress Tracking**: Monitor migration progress and statistics

#### System Monitoring
- **CPU Usage**: Monitor CPU usage during migration
- **Memory Usage**: Track memory consumption
- **Disk I/O**: Monitor disk input/output operations
- **Network Usage**: Check network bandwidth usage

## Best Practices

### Migration Planning
- **Schedule During Low Usage**: Run migrations during low-traffic periods
- **Test First**: Test migration with small batches first
- **Monitor Resources**: Keep an eye on system resources
- **Have Backup**: Ensure data backup before migration

### Performance Optimization
- **Optimize Batch Size**: Find optimal batch size for your system
- **Adjust Delays**: Set appropriate delays between batches
- **Monitor CPU**: Set realistic CPU thresholds
- **Use Monitoring**: Regularly check monitoring data

### Security Practices
- **Regular Updates**: Keep S3 credentials updated
- **Access Control**: Limit admin access to necessary users
- **Audit Logs**: Regularly review migration logs
- **Environment Security**: Secure environment variable storage

## Future Enhancements

### Planned Features
- **Incremental Migration**: Migrate only changed attachments
- **Parallel Processing**: Support for parallel migration streams
- **Advanced Scheduling**: Time-based migration scheduling
- **Compression Support**: Built-in file compression during migration

### Integration Opportunities
- **Cloud Storage**: Additional cloud storage providers
- **CDN Integration**: Content delivery network support
- **Backup Integration**: Automated backup during migration
- **Analytics**: Advanced storage analytics and reporting

## Support

For issues and questions:
1. Check this documentation
2. Review server logs
3. Use the monitoring tools
4. Consult the Wekan community
5. Report issues with detailed information

## License

This Enhanced Attachment Migration System is part of Wekan and is licensed under the MIT License.
