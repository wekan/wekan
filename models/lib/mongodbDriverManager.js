import { Meteor } from 'meteor/meteor';

/**
 * MongoDB Driver Manager
 * 
 * This module provides automatic MongoDB version detection and driver selection
 * to support MongoDB versions 3.0 through 8.0 with compatible Node.js drivers.
 * 
 * Features:
 * - Automatic MongoDB version detection from wire protocol errors
 * - Dynamic driver selection based on detected version
 * - Fallback mechanism for unsupported versions
 * - Connection retry with different drivers
 */

// MongoDB driver compatibility matrix
const DRIVER_COMPATIBILITY = {
  '3.0': { driver: 'mongodb3legacy', version: '3.7.4', minServer: '3.0', maxServer: '3.6' },
  '3.2': { driver: 'mongodb3legacy', version: '3.7.4', minServer: '3.0', maxServer: '3.6' },
  '3.4': { driver: 'mongodb3legacy', version: '3.7.4', minServer: '3.0', maxServer: '3.6' },
  '3.6': { driver: 'mongodb3legacy', version: '3.7.4', minServer: '3.0', maxServer: '3.6' },
  '4.0': { driver: 'mongodb4legacy', version: '4.17.2', minServer: '4.0', maxServer: '4.4' },
  '4.2': { driver: 'mongodb4legacy', version: '4.17.2', minServer: '4.0', maxServer: '4.4' },
  '4.4': { driver: 'mongodb4legacy', version: '4.17.2', minServer: '4.0', maxServer: '4.4' },
  '5.0': { driver: 'mongodb5legacy', version: '5.9.2', minServer: '5.0', maxServer: '5.0' },
  '6.0': { driver: 'mongodb6legacy', version: '6.3.0', minServer: '6.0', maxServer: '6.0' },
  '7.0': { driver: 'mongodb7legacy', version: '7.0.1', minServer: '7.0', maxServer: '7.0' },
  '8.0': { driver: 'mongodb8legacy', version: '6.9.0', minServer: '8.0', maxServer: '8.0' }
};

// Wire protocol error patterns for version detection
const VERSION_ERROR_PATTERNS = {
  // MongoDB 3.x wire protocol errors
  '3.0': [
    /unsupported wire protocol version/i,
    /wire protocol version 0/i,
    /protocol version 0/i
  ],
  '3.2': [
    /wire protocol version 1/i,
    /protocol version 1/i
  ],
  '3.4': [
    /wire protocol version 2/i,
    /protocol version 2/i
  ],
  '3.6': [
    /wire protocol version 3/i,
    /protocol version 3/i
  ],
  // MongoDB 4.x wire protocol errors
  '4.0': [
    /wire protocol version 4/i,
    /protocol version 4/i
  ],
  '4.2': [
    /wire protocol version 5/i,
    /protocol version 5/i
  ],
  '4.4': [
    /wire protocol version 6/i,
    /protocol version 6/i
  ],
  // MongoDB 5.x wire protocol errors
  '5.0': [
    /wire protocol version 7/i,
    /protocol version 7/i
  ],
  // MongoDB 6.x wire protocol errors
  '6.0': [
    /wire protocol version 8/i,
    /protocol version 8/i
  ],
  // MongoDB 7.x wire protocol errors
  '7.0': [
    /wire protocol version 9/i,
    /protocol version 9/i
  ],
  // MongoDB 8.x wire protocol errors
  '8.0': [
    /wire protocol version 10/i,
    /protocol version 10/i
  ]
};

// Generic error patterns that might indicate version incompatibility
const GENERIC_VERSION_ERRORS = [
  /unsupported wire protocol/i,
  /wire protocol version/i,
  /protocol version/i,
  /unsupported server version/i,
  /server version/i,
  /incompatible wire protocol/i,
  /wire protocol mismatch/i
];

class MongoDBDriverManager {
  constructor() {
    this.detectedVersion = null;
    this.selectedDriver = null;
    this.connectionAttempts = [];
    this.fallbackDrivers = ['mongodb6legacy', 'mongodb4legacy', 'mongodb3legacy'];
  }

  /**
   * Detect MongoDB version from wire protocol errors
   * @param {Error} error - The connection error
   * @returns {string|null} - Detected MongoDB version or null
   */
  detectVersionFromError(error) {
    if (!error || !error.message) {
      return null;
    }

    const errorMessage = error.message.toLowerCase();
    
    // Check specific version patterns
    for (const [version, patterns] of Object.entries(VERSION_ERROR_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(errorMessage)) {
          console.log(`MongoDB version detected from error: ${version}`);
          return version;
        }
      }
    }

    // Check for generic version errors
    for (const pattern of GENERIC_VERSION_ERRORS) {
      if (pattern.test(errorMessage)) {
        console.log('Generic MongoDB version error detected, will try fallback drivers');
        return 'unknown';
      }
    }

    return null;
  }

  /**
   * Get the appropriate driver for a MongoDB version
   * @param {string} version - MongoDB version
   * @returns {string} - Driver package name
   */
  getDriverForVersion(version) {
    if (DRIVER_COMPATIBILITY[version]) {
      return DRIVER_COMPATIBILITY[version].driver;
    }

    // Fallback logic for unknown versions
    if (version === 'unknown') {
      return this.fallbackDrivers[0]; // Start with most recent fallback
    }

    // Try to determine from version string
    const majorVersion = version.split('.')[0];
    if (majorVersion === '3') {
      return 'mongodb3legacy';
    } else if (majorVersion === '4') {
      return 'mongodb4legacy';
    } else if (majorVersion === '5') {
      return 'mongodb5legacy';
    } else if (majorVersion === '6') {
      return 'mongodb6legacy';
    } else if (majorVersion === '7') {
      return 'mongodb7legacy';
    } else if (majorVersion === '8') {
      return 'mongodb8legacy';
    }

    return this.fallbackDrivers[0];
  }

  /**
   * Get the next fallback driver
   * @returns {string|null} - Next fallback driver or null if none left
   */
  getNextFallbackDriver() {
    const currentIndex = this.fallbackDrivers.indexOf(this.selectedDriver);
    if (currentIndex >= 0 && currentIndex < this.fallbackDrivers.length - 1) {
      return this.fallbackDrivers[currentIndex + 1];
    }
    return null;
  }

  /**
   * Record a connection attempt
   * @param {string} driver - Driver used
   * @param {string} version - MongoDB version attempted
   * @param {boolean} success - Whether connection was successful
   * @param {Error} error - Error if connection failed
   */
  recordConnectionAttempt(driver, version, success, error = null) {
    this.connectionAttempts.push({
      driver,
      version,
      success,
      error: error ? error.message : null,
      timestamp: new Date()
    });

    if (success) {
      this.selectedDriver = driver;
      this.detectedVersion = version;
      console.log(`Successfully connected using ${driver} for MongoDB ${version}`);
    }
  }

  /**
   * Get connection statistics
   * @returns {Object} - Connection statistics
   */
  getConnectionStats() {
    const total = this.connectionAttempts.length;
    const successful = this.connectionAttempts.filter(attempt => attempt.success).length;
    const failed = total - successful;

    return {
      total,
      successful,
      failed,
      currentDriver: this.selectedDriver,
      detectedVersion: this.detectedVersion,
      attempts: this.connectionAttempts
    };
  }

  /**
   * Reset connection state
   */
  reset() {
    this.detectedVersion = null;
    this.selectedDriver = null;
    this.connectionAttempts = [];
  }

  /**
   * Get driver information
   * @param {string} driver - Driver package name
   * @returns {Object} - Driver information
   */
  getDriverInfo(driver) {
    for (const [version, info] of Object.entries(DRIVER_COMPATIBILITY)) {
      if (info.driver === driver) {
        return { version, ...info };
      }
    }
    return null;
  }

  /**
   * Get all supported MongoDB versions
   * @returns {Array} - Array of supported versions
   */
  getSupportedVersions() {
    return Object.keys(DRIVER_COMPATIBILITY);
  }

  /**
   * Check if a MongoDB version is supported
   * @param {string} version - MongoDB version to check
   * @returns {boolean} - Whether version is supported
   */
  isVersionSupported(version) {
    return version in DRIVER_COMPATIBILITY;
  }
}

// Create singleton instance
const mongodbDriverManager = new MongoDBDriverManager();

// Export for use in other modules
export { mongodbDriverManager, MongoDBDriverManager };

// Log initialization
if (Meteor.isServer) {
  console.log('MongoDB Driver Manager initialized');
  console.log(`Supported MongoDB versions: ${mongodbDriverManager.getSupportedVersions().join(', ')}`);
}
