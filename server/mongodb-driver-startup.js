import { Meteor } from 'meteor/meteor';
import { mongodbConnectionManager } from '/models/lib/mongodbConnectionManager';
import { mongodbDriverManager } from '/models/lib/mongodbDriverManager';
import { meteorMongoIntegration } from '/models/lib/meteorMongoIntegration';

/**
 * MongoDB Driver Startup
 * 
 * This module initializes the MongoDB driver system on server startup,
 * providing automatic version detection and driver selection for
 * MongoDB versions 3.0 through 8.0.
 */

// Initialize MongoDB driver system on server startup
Meteor.startup(async function() {
  console.log('=== MongoDB Driver System Startup ===');
  
  try {
    // Check if MONGO_URL is available
    const mongoUrl = process.env.MONGO_URL;
    if (!mongoUrl) {
      console.log('MONGO_URL not found, skipping MongoDB driver initialization');
      return;
    }

    console.log('MONGO_URL found, initializing MongoDB driver system...');
    console.log(`Connection string: ${mongoUrl.replace(/\/\/.*@/, '//***:***@')}`); // Hide credentials

    // Initialize the Meteor integration
    meteorMongoIntegration.initialize(mongoUrl);

    // Test the connection
    console.log('Testing MongoDB connection...');
    const testResult = await meteorMongoIntegration.testConnection();
    
    if (testResult.success) {
      console.log('✅ MongoDB connection test successful');
      console.log(`   Driver: ${testResult.driver}`);
      console.log(`   Version: ${testResult.version}`);
    } else {
      console.log('❌ MongoDB connection test failed');
      console.log(`   Error: ${testResult.error}`);
      console.log(`   Driver: ${testResult.driver}`);
      console.log(`   Version: ${testResult.version}`);
    }

    // Log connection statistics
    const stats = meteorMongoIntegration.getStats();
    console.log('MongoDB Driver System Statistics:');
    console.log(`   Initialized: ${stats.isInitialized}`);
    console.log(`   Custom Connection: ${stats.hasCustomConnection}`);
    console.log(`   Supported Versions: ${mongodbDriverManager.getSupportedVersions().join(', ')}`);

    // Log driver compatibility information
    console.log('MongoDB Driver Compatibility:');
    const supportedVersions = mongodbDriverManager.getSupportedVersions();
    supportedVersions.forEach(version => {
      const driverInfo = mongodbDriverManager.getDriverInfo(
        mongodbDriverManager.getDriverForVersion(version)
      );
      if (driverInfo) {
        console.log(`   MongoDB ${version}: ${driverInfo.driver} v${driverInfo.version}`);
      }
    });

    console.log('=== MongoDB Driver System Ready ===');

  } catch (error) {
    console.error('Error during MongoDB driver system startup:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Don't fail the entire startup, just log the error
    console.log('Continuing with default MongoDB connection...');
  }
});

// Add server-side methods for debugging and monitoring
if (Meteor.isServer) {
  // Method to get MongoDB driver statistics
  Meteor.methods({
    'mongodb-driver-stats': function() {
      if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'Must be logged in');
      }
      
      return {
        connectionStats: mongodbConnectionManager.getConnectionStats(),
        driverStats: mongodbDriverManager.getConnectionStats(),
        integrationStats: meteorMongoIntegration.getStats()
      };
    },

    'mongodb-driver-test-connection': async function() {
      if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'Must be logged in');
      }
      
      return await meteorMongoIntegration.testConnection();
    },

    'mongodb-driver-reset': function() {
      if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'Must be logged in');
      }
      
      meteorMongoIntegration.reset();
      return { success: true, message: 'MongoDB driver system reset' };
    },

    'mongodb-driver-supported-versions': function() {
      if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'Must be logged in');
      }
      
      return {
        supportedVersions: mongodbDriverManager.getSupportedVersions(),
        compatibility: mongodbDriverManager.getSupportedVersions().map(version => {
          const driverInfo = mongodbDriverManager.getDriverInfo(
            mongodbDriverManager.getDriverForVersion(version)
          );
          return {
            version,
            driver: driverInfo?.driver || 'unknown',
            driverVersion: driverInfo?.version || 'unknown',
            minServer: driverInfo?.minServer || 'unknown',
            maxServer: driverInfo?.maxServer || 'unknown'
          };
        })
      };
    }
  });

  // Add a publication for real-time monitoring
  Meteor.publish('mongodb-driver-monitor', function() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }

    const self = this;
    
    // Send initial data
    const stats = meteorMongoIntegration.getStats();
    self.added('mongodbDriverMonitor', 'stats', stats);
    
    // Update every 30 seconds
    const interval = setInterval(() => {
      const updatedStats = meteorMongoIntegration.getStats();
      self.changed('mongodbDriverMonitor', 'stats', updatedStats);
    }, 30000);

    // Clean up on unsubscribe
    self.onStop(() => {
      clearInterval(interval);
    });

    self.ready();
  });
}

// Export for use in other modules
export { mongodbConnectionManager, mongodbDriverManager, meteorMongoIntegration };
