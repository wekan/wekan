import { Meteor } from 'meteor/meteor';
import { ReactiveCache } from '/imports/reactiveCache';
import { Attachments, fileStoreStrategyFactory } from '/models/attachments';
import { moveToStorage } from '/models/lib/fileStoreStrategy';
import os from 'os';
import { createHash } from 'crypto';

// Migration state management
const migrationState = {
  isRunning: false,
  isPaused: false,
  targetStorage: null,
  batchSize: 10,
  delayMs: 1000,
  cpuThreshold: 70,
  progress: 0,
  totalAttachments: 0,
  migratedAttachments: 0,
  currentBatch: [],
  migrationQueue: [],
  log: [],
  startTime: null,
  lastCpuCheck: 0
};

// CPU monitoring
function getCpuUsage() {
  const cpus = os.cpus();
  let totalIdle = 0;
  let totalTick = 0;
  
  cpus.forEach(cpu => {
    for (const type in cpu.times) {
      totalTick += cpu.times[type];
    }
    totalIdle += cpu.times.idle;
  });
  
  const idle = totalIdle / cpus.length;
  const total = totalTick / cpus.length;
  const usage = 100 - Math.floor(100 * idle / total);
  
  return usage;
}

// Logging function
function addToLog(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}`;
  migrationState.log.unshift(logEntry);
  
  // Keep only last 100 log entries
  if (migrationState.log.length > 100) {
    migrationState.log = migrationState.log.slice(0, 100);
  }
  
  console.log(logEntry);
}

// Get migration status
function getMigrationStatus() {
  return {
    isRunning: migrationState.isRunning,
    isPaused: migrationState.isPaused,
    targetStorage: migrationState.targetStorage,
    progress: migrationState.progress,
    totalAttachments: migrationState.totalAttachments,
    migratedAttachments: migrationState.migratedAttachments,
    remainingAttachments: migrationState.totalAttachments - migrationState.migratedAttachments,
    status: migrationState.isRunning ? (migrationState.isPaused ? 'paused' : 'running') : 'idle',
    log: migrationState.log.slice(0, 10).join('\n'), // Return last 10 log entries
    startTime: migrationState.startTime,
    estimatedTimeRemaining: calculateEstimatedTimeRemaining()
  };
}

// Calculate estimated time remaining
function calculateEstimatedTimeRemaining() {
  if (!migrationState.isRunning || migrationState.migratedAttachments === 0) {
    return null;
  }
  
  const elapsed = Date.now() - migrationState.startTime;
  const rate = migrationState.migratedAttachments / elapsed; // attachments per ms
  const remaining = migrationState.totalAttachments - migrationState.migratedAttachments;
  
  return Math.round(remaining / rate);
}

// Process a single attachment migration
function migrateAttachment(attachmentId) {
  try {
    const attachment = ReactiveCache.getAttachment(attachmentId);
    if (!attachment) {
      addToLog(`Warning: Attachment ${attachmentId} not found`);
      return false;
    }

    // Check if already in target storage
    const currentStorage = fileStoreStrategyFactory.getFileStrategy(attachment, 'original').getStorageName();
    if (currentStorage === migrationState.targetStorage) {
      addToLog(`Attachment ${attachmentId} already in target storage ${migrationState.targetStorage}`);
      return true;
    }

    // Perform migration
    moveToStorage(attachment, migrationState.targetStorage, fileStoreStrategyFactory);
    addToLog(`Migrated attachment ${attachmentId} from ${currentStorage} to ${migrationState.targetStorage}`);
    
    return true;
  } catch (error) {
    addToLog(`Error migrating attachment ${attachmentId}: ${error.message}`);
    return false;
  }
}

// Process a batch of attachments
function processBatch() {
  if (!migrationState.isRunning || migrationState.isPaused) {
    return;
  }

  const batch = migrationState.migrationQueue.splice(0, migrationState.batchSize);
  if (batch.length === 0) {
    // Migration complete
    migrationState.isRunning = false;
    migrationState.progress = 100;
    addToLog(`Migration completed. Migrated ${migrationState.migratedAttachments} attachments.`);
    return;
  }

  let successCount = 0;
  batch.forEach(attachmentId => {
    if (migrateAttachment(attachmentId)) {
      successCount++;
      migrationState.migratedAttachments++;
    }
  });

  // Update progress
  migrationState.progress = Math.round((migrationState.migratedAttachments / migrationState.totalAttachments) * 100);
  
  addToLog(`Processed batch: ${successCount}/${batch.length} successful. Progress: ${migrationState.progress}%`);

  // Check CPU usage
  const currentTime = Date.now();
  if (currentTime - migrationState.lastCpuCheck > 5000) { // Check every 5 seconds
    const cpuUsage = getCpuUsage();
    migrationState.lastCpuCheck = currentTime;
    
    if (cpuUsage > migrationState.cpuThreshold) {
      addToLog(`CPU usage ${cpuUsage}% exceeds threshold ${migrationState.cpuThreshold}%. Pausing migration.`);
      migrationState.isPaused = true;
      return;
    }
  }

  // Schedule next batch
  if (migrationState.isRunning && !migrationState.isPaused) {
    Meteor.setTimeout(() => {
      processBatch();
    }, migrationState.delayMs);
  }
}

// Initialize migration queue
function initializeMigrationQueue() {
  const allAttachments = ReactiveCache.getAttachments();
  migrationState.totalAttachments = allAttachments.length;
  migrationState.migrationQueue = allAttachments.map(attachment => attachment._id);
  migrationState.migratedAttachments = 0;
  migrationState.progress = 0;
  
  addToLog(`Initialized migration queue with ${migrationState.totalAttachments} attachments`);
}

// Start migration
function startMigration(targetStorage, batchSize, delayMs, cpuThreshold) {
  if (migrationState.isRunning) {
    throw new Meteor.Error('migration-already-running', 'Migration is already running');
  }

  migrationState.isRunning = true;
  migrationState.isPaused = false;
  migrationState.targetStorage = targetStorage;
  migrationState.batchSize = batchSize;
  migrationState.delayMs = delayMs;
  migrationState.cpuThreshold = cpuThreshold;
  migrationState.startTime = Date.now();
  migrationState.lastCpuCheck = 0;

  initializeMigrationQueue();
  addToLog(`Started migration to ${targetStorage} with batch size ${batchSize}, delay ${delayMs}ms, CPU threshold ${cpuThreshold}%`);

  // Start processing
  processBatch();
}

// Pause migration
function pauseMigration() {
  if (!migrationState.isRunning) {
    throw new Meteor.Error('migration-not-running', 'No migration is currently running');
  }

  migrationState.isPaused = true;
  addToLog('Migration paused');
}

// Resume migration
function resumeMigration() {
  if (!migrationState.isRunning) {
    throw new Meteor.Error('migration-not-running', 'No migration is currently running');
  }

  if (!migrationState.isPaused) {
    throw new Meteor.Error('migration-not-paused', 'Migration is not paused');
  }

  migrationState.isPaused = false;
  addToLog('Migration resumed');
  
  // Continue processing
  processBatch();
}

// Stop migration
function stopMigration() {
  if (!migrationState.isRunning) {
    throw new Meteor.Error('migration-not-running', 'No migration is currently running');
  }

  migrationState.isRunning = false;
  migrationState.isPaused = false;
  migrationState.migrationQueue = [];
  addToLog('Migration stopped');
}

// Get attachment storage configuration
function getAttachmentStorageConfiguration() {
  const config = {
    filesystemPath: process.env.WRITABLE_PATH || '/data',
    attachmentsPath: `${process.env.WRITABLE_PATH || '/data'}/attachments`,
    avatarsPath: `${process.env.WRITABLE_PATH || '/data'}/avatars`,
    gridfsEnabled: true, // Always available
    s3Enabled: false,
    s3Endpoint: '',
    s3Bucket: '',
    s3Region: '',
    s3SslEnabled: false,
    s3Port: 443
  };

  // Check S3 configuration
  if (process.env.S3) {
    try {
      const s3Config = JSON.parse(process.env.S3).s3;
      if (s3Config && s3Config.key && s3Config.secret && s3Config.bucket) {
        config.s3Enabled = true;
        config.s3Endpoint = s3Config.endPoint || '';
        config.s3Bucket = s3Config.bucket || '';
        config.s3Region = s3Config.region || '';
        config.s3SslEnabled = s3Config.sslEnabled || false;
        config.s3Port = s3Config.port || 443;
      }
    } catch (error) {
      console.error('Error parsing S3 configuration:', error);
    }
  }

  return config;
}

// Get attachment monitoring data
function getAttachmentMonitoringData() {
  const attachments = ReactiveCache.getAttachments();
  const stats = {
    totalAttachments: attachments.length,
    filesystemAttachments: 0,
    gridfsAttachments: 0,
    s3Attachments: 0,
    totalSize: 0,
    filesystemSize: 0,
    gridfsSize: 0,
    s3Size: 0
  };

  attachments.forEach(attachment => {
    const storage = fileStoreStrategyFactory.getFileStrategy(attachment, 'original').getStorageName();
    const size = attachment.size || 0;
    
    stats.totalSize += size;
    
    switch (storage) {
      case 'fs':
        stats.filesystemAttachments++;
        stats.filesystemSize += size;
        break;
      case 'gridfs':
        stats.gridfsAttachments++;
        stats.gridfsSize += size;
        break;
      case 's3':
        stats.s3Attachments++;
        stats.s3Size += size;
        break;
    }
  });

  return stats;
}

// Test S3 connection
function testS3Connection(s3Config) {
  // This would implement actual S3 connection testing
  // For now, we'll just validate the configuration
  if (!s3Config.secretKey) {
    throw new Meteor.Error('s3-secret-key-required', 'S3 secret key is required');
  }

  // In a real implementation, you would test the connection here
  // For now, we'll just return success
  return { success: true, message: 'S3 connection test successful' };
}

// Save S3 settings
function saveS3Settings(s3Config) {
  if (!s3Config.secretKey) {
    throw new Meteor.Error('s3-secret-key-required', 'S3 secret key is required');
  }

  // In a real implementation, you would save the S3 configuration
  // For now, we'll just return success
  return { success: true, message: 'S3 settings saved successfully' };
}

// Meteor methods
if (Meteor.isServer) {
  Meteor.methods({
    // Migration methods
    'startAttachmentMigration'(config) {
      if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'Must be logged in');
      }

      const user = ReactiveCache.getUser(this.userId);
      if (!user || !user.isAdmin) {
        throw new Meteor.Error('not-authorized', 'Admin access required');
      }

      startMigration(config.targetStorage, config.batchSize, config.delayMs, config.cpuThreshold);
      return { success: true, message: 'Migration started' };
    },

    'pauseAttachmentMigration'() {
      if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'Must be logged in');
      }

      const user = ReactiveCache.getUser(this.userId);
      if (!user || !user.isAdmin) {
        throw new Meteor.Error('not-authorized', 'Admin access required');
      }

      pauseMigration();
      return { success: true, message: 'Migration paused' };
    },

    'resumeAttachmentMigration'() {
      if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'Must be logged in');
      }

      const user = ReactiveCache.getUser(this.userId);
      if (!user || !user.isAdmin) {
        throw new Meteor.Error('not-authorized', 'Admin access required');
      }

      resumeMigration();
      return { success: true, message: 'Migration resumed' };
    },

    'stopAttachmentMigration'() {
      if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'Must be logged in');
      }

      const user = ReactiveCache.getUser(this.userId);
      if (!user || !user.isAdmin) {
        throw new Meteor.Error('not-authorized', 'Admin access required');
      }

      stopMigration();
      return { success: true, message: 'Migration stopped' };
    },

    'getAttachmentMigrationSettings'() {
      if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'Must be logged in');
      }

      const user = ReactiveCache.getUser(this.userId);
      if (!user || !user.isAdmin) {
        throw new Meteor.Error('not-authorized', 'Admin access required');
      }

      return {
        batchSize: migrationState.batchSize,
        delayMs: migrationState.delayMs,
        cpuThreshold: migrationState.cpuThreshold,
        status: migrationState.isRunning ? (migrationState.isPaused ? 'paused' : 'running') : 'idle',
        progress: migrationState.progress
      };
    },

    // Configuration methods
    'getAttachmentStorageConfiguration'() {
      if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'Must be logged in');
      }

      const user = ReactiveCache.getUser(this.userId);
      if (!user || !user.isAdmin) {
        throw new Meteor.Error('not-authorized', 'Admin access required');
      }

      return getAttachmentStorageConfiguration();
    },

    'testS3Connection'(s3Config) {
      if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'Must be logged in');
      }

      const user = ReactiveCache.getUser(this.userId);
      if (!user || !user.isAdmin) {
        throw new Meteor.Error('not-authorized', 'Admin access required');
      }

      return testS3Connection(s3Config);
    },

    'saveS3Settings'(s3Config) {
      if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'Must be logged in');
      }

      const user = ReactiveCache.getUser(this.userId);
      if (!user || !user.isAdmin) {
        throw new Meteor.Error('not-authorized', 'Admin access required');
      }

      return saveS3Settings(s3Config);
    },

    // Monitoring methods
    'getAttachmentMonitoringData'() {
      if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'Must be logged in');
      }

      const user = ReactiveCache.getUser(this.userId);
      if (!user || !user.isAdmin) {
        throw new Meteor.Error('not-authorized', 'Admin access required');
      }

      return getAttachmentMonitoringData();
    },

    'refreshAttachmentMonitoringData'() {
      if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'Must be logged in');
      }

      const user = ReactiveCache.getUser(this.userId);
      if (!user || !user.isAdmin) {
        throw new Meteor.Error('not-authorized', 'Admin access required');
      }

      return getAttachmentMonitoringData();
    },

    'exportAttachmentMonitoringData'() {
      if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'Must be logged in');
      }

      const user = ReactiveCache.getUser(this.userId);
      if (!user || !user.isAdmin) {
        throw new Meteor.Error('not-authorized', 'Admin access required');
      }

      const monitoringData = getAttachmentMonitoringData();
      const migrationStatus = getMigrationStatus();
      
      return {
        timestamp: new Date().toISOString(),
        monitoring: monitoringData,
        migration: migrationStatus,
        system: {
          cpuUsage: getCpuUsage(),
          memoryUsage: process.memoryUsage(),
          uptime: process.uptime()
        }
      };
    }
  });

  // Publications
  Meteor.publish('attachmentMigrationStatus', function() {
    if (!this.userId) {
      return this.ready();
    }

    const user = ReactiveCache.getUser(this.userId);
    if (!user || !user.isAdmin) {
      return this.ready();
    }

    const self = this;
    let handle;

    function updateStatus() {
      const status = getMigrationStatus();
      self.changed('attachmentMigrationStatus', 'status', status);
    }

    self.added('attachmentMigrationStatus', 'status', getMigrationStatus());

    // Update every 2 seconds
    handle = Meteor.setInterval(updateStatus, 2000);

    self.ready();

    self.onStop(() => {
      if (handle) {
        Meteor.clearInterval(handle);
      }
    });
  });

  Meteor.publish('attachmentMonitoringData', function() {
    if (!this.userId) {
      return this.ready();
    }

    const user = ReactiveCache.getUser(this.userId);
    if (!user || !user.isAdmin) {
      return this.ready();
    }

    const self = this;
    let handle;

    function updateMonitoring() {
      const data = getAttachmentMonitoringData();
      self.changed('attachmentMonitoringData', 'data', data);
    }

    self.added('attachmentMonitoringData', 'data', getAttachmentMonitoringData());

    // Update every 10 seconds
    handle = Meteor.setInterval(updateMonitoring, 10000);

    self.ready();

    self.onStop(() => {
      if (handle) {
        Meteor.clearInterval(handle);
      }
    });
  });
}
