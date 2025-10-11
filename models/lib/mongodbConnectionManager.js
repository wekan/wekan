import { Meteor } from 'meteor/meteor';
import { mongodbDriverManager } from './mongodbDriverManager';

/**
 * MongoDB Connection Manager
 * 
 * This module handles MongoDB connections with automatic driver selection
 * based on detected MongoDB server version and wire protocol compatibility.
 * 
 * Features:
 * - Automatic driver selection based on MongoDB version
 * - Connection retry with different drivers on wire protocol errors
 * - Fallback mechanism for unsupported versions
 * - Connection pooling and management
 */

class MongoDBConnectionManager {
  constructor() {
    this.connections = new Map();
    this.connectionConfigs = new Map();
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1 second
  }

  /**
   * Create a MongoDB connection with automatic driver selection
   * @param {string} connectionString - MongoDB connection string
   * @param {Object} options - Connection options
   * @returns {Promise<Object>} - MongoDB connection object
   */
  async createConnection(connectionString, options = {}) {
    const connectionId = this.generateConnectionId(connectionString);
    
    // Check if we already have a working connection
    if (this.connections.has(connectionId)) {
      const existingConnection = this.connections.get(connectionId);
      if (existingConnection.status === 'connected') {
        return existingConnection;
      }
    }

    // Try to connect with automatic driver selection
    return await this.connectWithDriverSelection(connectionString, options, connectionId);
  }

  /**
   * Connect with automatic driver selection and retry logic
   * @param {string} connectionString - MongoDB connection string
   * @param {Object} options - Connection options
   * @param {string} connectionId - Connection identifier
   * @returns {Promise<Object>} - MongoDB connection object
   */
  async connectWithDriverSelection(connectionString, options, connectionId) {
    let lastError = null;
    let currentDriver = null;

    // First, try with the default driver (if we have a detected version)
    if (mongodbDriverManager.detectedVersion) {
      currentDriver = mongodbDriverManager.getDriverForVersion(mongodbDriverManager.detectedVersion);
    } else {
      // Start with the most recent driver
      currentDriver = 'mongodb8legacy';
    }

    // Try connection with different drivers
    for (let attempt = 0; attempt < this.retryAttempts; attempt++) {
      try {
        console.log(`Attempting MongoDB connection with driver: ${currentDriver} (attempt ${attempt + 1})`);
        
        const connection = await this.connectWithDriver(currentDriver, connectionString, options);
        
        // Record successful connection
        mongodbDriverManager.recordConnectionAttempt(
          currentDriver, 
          mongodbDriverManager.detectedVersion || 'unknown', 
          true
        );

        // Store connection
        this.connections.set(connectionId, {
          connection,
          driver: currentDriver,
          version: mongodbDriverManager.detectedVersion || 'unknown',
          status: 'connected',
          connectionString,
          options,
          createdAt: new Date()
        });

        return connection;

      } catch (error) {
        lastError = error;
        console.error(`Connection attempt ${attempt + 1} failed with driver ${currentDriver}:`, error.message);

        // Try to detect MongoDB version from error
        const detectedVersion = mongodbDriverManager.detectVersionFromError(error);
        if (detectedVersion && detectedVersion !== 'unknown') {
          mongodbDriverManager.detectedVersion = detectedVersion;
          currentDriver = mongodbDriverManager.getDriverForVersion(detectedVersion);
          console.log(`Detected MongoDB version ${detectedVersion}, switching to driver ${currentDriver}`);
        } else {
          // Try next fallback driver
          const nextDriver = mongodbDriverManager.getNextFallbackDriver();
          if (nextDriver) {
            currentDriver = nextDriver;
            console.log(`Trying fallback driver: ${currentDriver}`);
          } else {
            console.error('No more fallback drivers available');
            break;
          }
        }

        // Record failed attempt
        mongodbDriverManager.recordConnectionAttempt(
          currentDriver, 
          detectedVersion || 'unknown', 
          false, 
          error
        );

        // Wait before retry
        if (attempt < this.retryAttempts - 1) {
          await this.delay(this.retryDelay * (attempt + 1));
        }
      }
    }

    // All attempts failed
    throw new Error(`Failed to connect to MongoDB after ${this.retryAttempts} attempts. Last error: ${lastError?.message}`);
  }

  /**
   * Connect using a specific driver
   * @param {string} driverName - Driver package name
   * @param {string} connectionString - MongoDB connection string
   * @param {Object} options - Connection options
   * @returns {Promise<Object>} - MongoDB connection object
   */
  async connectWithDriver(driverName, connectionString, options) {
    try {
      // Dynamically import the driver
      const driver = await import(driverName);
      const MongoClient = driver.MongoClient;

      // Set default options
      const defaultOptions = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        ...options
      };

      // Create connection
      const client = new MongoClient(connectionString, defaultOptions);
      await client.connect();

      // Test the connection
      await client.db('admin').admin().ping();

      return client;

    } catch (error) {
      throw new Error(`Failed to connect with driver ${driverName}: ${error.message}`);
    }
  }

  /**
   * Get connection by ID
   * @param {string} connectionId - Connection identifier
   * @returns {Object|null} - Connection object or null
   */
  getConnection(connectionId) {
    return this.connections.get(connectionId) || null;
  }

  /**
   * Close a connection
   * @param {string} connectionId - Connection identifier
   * @returns {Promise<boolean>} - Whether connection was closed successfully
   */
  async closeConnection(connectionId) {
    const connection = this.connections.get(connectionId);
    if (connection && connection.connection) {
      try {
        await connection.connection.close();
        this.connections.delete(connectionId);
        console.log(`Closed MongoDB connection: ${connectionId}`);
        return true;
      } catch (error) {
        console.error(`Error closing MongoDB connection ${connectionId}:`, error.message);
        return false;
      }
    }
    return false;
  }

  /**
   * Close all connections
   * @returns {Promise<number>} - Number of connections closed
   */
  async closeAllConnections() {
    let closedCount = 0;
    const connectionIds = Array.from(this.connections.keys());
    
    for (const connectionId of connectionIds) {
      if (await this.closeConnection(connectionId)) {
        closedCount++;
      }
    }

    console.log(`Closed ${closedCount} MongoDB connections`);
    return closedCount;
  }

  /**
   * Get connection statistics
   * @returns {Object} - Connection statistics
   */
  getConnectionStats() {
    const connections = Array.from(this.connections.values());
    const connected = connections.filter(conn => conn.status === 'connected').length;
    const disconnected = connections.length - connected;

    return {
      total: connections.length,
      connected,
      disconnected,
      connections: connections.map(conn => ({
        id: this.getConnectionIdFromConnection(conn),
        driver: conn.driver,
        version: conn.version,
        status: conn.status,
        createdAt: conn.createdAt
      }))
    };
  }

  /**
   * Generate a unique connection ID
   * @param {string} connectionString - MongoDB connection string
   * @returns {string} - Unique connection ID
   */
  generateConnectionId(connectionString) {
    // Create a hash of the connection string for unique ID
    let hash = 0;
    for (let i = 0; i < connectionString.length; i++) {
      const char = connectionString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `mongodb_${Math.abs(hash)}`;
  }

  /**
   * Get connection ID from connection object
   * @param {Object} connection - Connection object
   * @returns {string} - Connection ID
   */
  getConnectionIdFromConnection(connection) {
    return this.generateConnectionId(connection.connectionString);
  }

  /**
   * Utility function to delay execution
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} - Promise that resolves after delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Reset all connections and driver manager state
   */
  reset() {
    this.connections.clear();
    this.connectionConfigs.clear();
    mongodbDriverManager.reset();
  }
}

// Create singleton instance
const mongodbConnectionManager = new MongoDBConnectionManager();

// Export for use in other modules
export { mongodbConnectionManager, MongoDBConnectionManager };

// Log initialization
if (Meteor.isServer) {
  console.log('MongoDB Connection Manager initialized');
}
