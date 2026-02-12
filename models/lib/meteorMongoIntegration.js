import { Meteor } from 'meteor/meteor';
import { DDP } from 'meteor/ddp';
import { mongodbConnectionManager } from './mongodbConnectionManager';
import { mongodbDriverManager } from './mongodbDriverManager';

/**
 * Meteor MongoDB Integration
 *
 * This module integrates the MongoDB driver manager with Meteor's
 * built-in MongoDB connection system to provide automatic driver
 * selection and version detection.
 *
 * Features:
 * - Hooks into Meteor's MongoDB connection process
 * - Automatic driver selection based on detected version
 * - Fallback mechanism for connection failures
 * - Integration with Meteor's DDP and reactive systems
 */

class MeteorMongoIntegration {
  constructor() {
    this.originalMongoConnect = null;
    this.originalMongoCollection = null;
    this.isInitialized = false;
    this.connectionString = null;
    this.customConnection = null;
  }

  /**
   * Initialize the integration
   * @param {string} connectionString - MongoDB connection string
   */
  initialize(connectionString) {
    if (this.isInitialized) {
      console.log('Meteor MongoDB Integration already initialized');
      return;
    }

    this.connectionString = connectionString;
    console.log('Initializing Meteor MongoDB Integration...');

    // Store original methods
    this.originalMongoConnect = Meteor.connect;
    this.originalMongoCollection = Mongo.Collection;

    // Override Meteor's connection method
    this.overrideMeteorConnection();

    // Override Mongo.Collection to use our connection manager
    this.overrideMongoCollection();

    this.isInitialized = true;
    // Meteor MongoDB Integration initialized successfully (status available in Admin Panel)
  }

  /**
   * Override Meteor's connection method
   */
  overrideMeteorConnection() {
    const self = this;

    // Override Meteor.connect if it exists
    if (typeof Meteor.connect === 'function') {
      Meteor.connect = async function(url, options) {
        try {
          console.log('Meteor.connect called, using custom MongoDB connection manager');
          return await self.createCustomConnection(url, options);
        } catch (error) {
          console.error('Custom connection failed, falling back to original method:', error.message);
          return self.originalMongoConnect.call(this, url, options);
        }
      };
    }
  }

  /**
   * Override Mongo.Collection to use our connection manager
   */
  overrideMongoCollection() {
    const self = this;
    const originalCollection = Mongo.Collection;

    // Override Mongo.Collection constructor
    Mongo.Collection = function(name, options = {}) {
      // If we have a custom connection, use it
      if (self.customConnection) {
        options.connection = self.customConnection;
      }

      // Create the collection with original constructor
      const collection = new originalCollection(name, options);

      // Add our custom methods
      self.enhanceCollection(collection);

      return collection;
    };

    // Copy static methods from original constructor
    Object.setPrototypeOf(Mongo.Collection, originalCollection);
    Object.assign(Mongo.Collection, originalCollection);
  }

  /**
   * Create a custom MongoDB connection
   * @param {string} url - MongoDB connection URL
   * @param {Object} options - Connection options
   * @returns {Promise<Object>} - MongoDB connection object
   */
  async createCustomConnection(url, options = {}) {
    try {
      console.log('Creating custom MongoDB connection...');

      // Use our connection manager
      const connection = await mongodbConnectionManager.createConnection(url, options);

      // Store the custom connection
      this.customConnection = connection;

      // Create a Meteor-compatible connection object
      const meteorConnection = this.createMeteorCompatibleConnection(connection);

      console.log('Custom MongoDB connection created successfully');
      return meteorConnection;

    } catch (error) {
      console.error('Failed to create custom MongoDB connection:', error.message);
      throw error;
    }
  }

  /**
   * Create a Meteor-compatible connection object
   * @param {Object} connection - MongoDB connection object
   * @returns {Object} - Meteor-compatible connection
   */
  createMeteorCompatibleConnection(connection) {
    const self = this;

    return {
      // Basic connection properties
      _driver: connection,
      _name: 'custom-mongodb-connection',

      // Collection creation method
      createCollection: function(name, options = {}) {
        const db = connection.db();
        return db.collection(name);
      },

      // Database access
      db: function(name = 'meteor') {
        return connection.db(name);
      },

      // Connection status
      status: function() {
        return {
          status: 'connected',
          connected: true,
          retryCount: 0
        };
      },

      // Close connection
      close: async function() {
        try {
          await connection.close();
          self.customConnection = null;
          console.log('Meteor-compatible connection closed');
        } catch (error) {
          console.error('Error closing Meteor-compatible connection:', error.message);
        }
      },

      // Raw connection access
      rawConnection: connection
    };
  }

  /**
   * Enhance a collection with additional methods
   * @param {Object} collection - Mongo.Collection instance
   */
  enhanceCollection(collection) {
    const self = this;

    // Add connection info method
    collection.getConnectionInfo = function() {
      if (self.customConnection) {
        const stats = mongodbConnectionManager.getConnectionStats();
        const driverStats = mongodbDriverManager.getConnectionStats();
        return {
          connectionType: 'custom',
          driver: driverStats.currentDriver,
          version: driverStats.detectedVersion,
          connectionStats: stats,
          driverStats: driverStats
        };
      }
      return {
        connectionType: 'default',
        driver: 'meteor-default',
        version: 'unknown'
      };
    };

    // Add version detection method
    collection.detectMongoDBVersion = async function() {
      try {
        if (self.customConnection) {
          const admin = self.customConnection.db().admin();
          const buildInfo = await admin.buildInfo();
          return buildInfo.version;
        }
        return null;
      } catch (error) {
        console.error('Error detecting MongoDB version:', error.message);
        return null;
      }
    };
  }

  /**
   * Get connection statistics
   * @returns {Object} - Connection statistics
   */
  getStats() {
    return {
      isInitialized: this.isInitialized,
      hasCustomConnection: !!this.customConnection,
      connectionString: this.connectionString,
      connectionStats: mongodbConnectionManager.getConnectionStats(),
      driverStats: mongodbDriverManager.getConnectionStats()
    };
  }

  /**
   * Reset the integration
   */
  reset() {
    if (this.originalMongoConnect) {
      Meteor.connect = this.originalMongoConnect;
    }

    if (this.originalMongoCollection) {
      Mongo.Collection = this.originalMongoCollection;
    }

    this.isInitialized = false;
    this.connectionString = null;
    this.customConnection = null;

    mongodbConnectionManager.reset();
    mongodbDriverManager.reset();

    console.log('Meteor MongoDB Integration reset');
  }

  /**
   * Test the connection
   * @returns {Promise<Object>} - Test results
   */
  async testConnection() {
    try {
      if (!this.customConnection) {
        throw new Error('No custom connection available');
      }

      const db = this.customConnection.db();
      const result = await db.admin().ping();

      return {
        success: true,
        result,
        driver: mongodbDriverManager.selectedDriver,
        version: mongodbDriverManager.detectedVersion
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        driver: mongodbDriverManager.selectedDriver,
        version: mongodbDriverManager.detectedVersion
      };
    }
  }
}

// Create singleton instance
const meteorMongoIntegration = new MeteorMongoIntegration();

// Export for use in other modules
export { meteorMongoIntegration, MeteorMongoIntegration };

// Auto-initialize if MONGO_URL is available
if (Meteor.isServer && process.env.MONGO_URL) {
  // Auto-initializing Meteor MongoDB Integration with MONGO_URL (status available in Admin Panel)
  meteorMongoIntegration.initialize(process.env.MONGO_URL);
}

// Meteor MongoDB Integration module loaded (status available in Admin Panel)
