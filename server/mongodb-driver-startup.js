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
  // MongoDB Driver System Startup (status available in Admin Panel)
  
  try {
    // Check if MONGO_URL is available
    const mongoUrl = process.env.MONGO_URL;
    if (!mongoUrl) {
      // MONGO_URL not found, skipping MongoDB driver initialization
      return;
    }

    // MONGO_URL found, initializing MongoDB driver system
    // Connection string: (credentials hidden for security)

    // Initialize the Meteor integration
    meteorMongoIntegration.initialize(mongoUrl);

    // Test the connection
    const testResult = await meteorMongoIntegration.testConnection();
    
    if (testResult.success) {
      // MongoDB connection test successful
      // Driver and version information available in Admin Panel
    } else {
      // MongoDB connection test failed
      // Error details available in Admin Panel
    }

    // Connection statistics available in Admin Panel
    const stats = meteorMongoIntegration.getStats();

    // Driver compatibility information available in Admin Panel
    const supportedVersions = mongodbDriverManager.getSupportedVersions();

    // MongoDB Driver System Ready (status available in Admin Panel)

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
