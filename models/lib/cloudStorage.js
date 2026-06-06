/**
 * Multi-cloud storage manager (server only).
 *
 * Uses the @tweedegolf/storage-abstraction adapters so WeKan can store
 * attachments on any of: S3-compatible object storage (AWS S3, MinIO,
 * Cloudflare R2, Backblaze B2, Wasabi, DigitalOcean Spaces, Ceph…), Azure Blob
 * Storage and Google Cloud Storage — in addition to the native filesystem and
 * GridFS backends.
 *
 * IMPORTANT: we deliberately do NOT use the storage-abstraction `Storage`
 * wrapper class. Its constructor loads the per-provider adapter with a dynamic
 * `require(variable)` which bundlers (rspack/webpack) cannot analyse — that
 * produces "Critical dependency: the request of a dependency is an expression"
 * warnings and, worse, the adapter package is then missing from the bundle at
 * runtime. Instead we `require()` each adapter package with a literal string
 * (statically analysable, so it is bundled) and instantiate the adapter class
 * directly. Each adapter implements the same interface the `Storage` wrapper
 * delegates to (addFileFromStream / getFileAsStream / removeFile / listFiles),
 * so the rest of WeKan is unaffected.
 *
 * Configuration (including secrets) lives in the `attachmentStorageSettings`
 * MongoDB document under `storageConfig.{s3,azure,gcs}` and is editable from
 * Admin Panel / Attachments. Adapters are built lazily and cached; call
 * refreshCloudStorageFromSettings() after the settings change.
 *
 * The adapter packages are required inside try/catch so the app keeps running
 * (with cloud storage simply unavailable) when they are not installed yet —
 * run `meteor npm install` to enable them.
 */

import { Meteor } from 'meteor/meteor';
import AttachmentStorageSettings from '/models/attachmentStorageSettings';
import {
  STORAGE_NAME_S3,
  STORAGE_NAME_AZURE,
  STORAGE_NAME_GCS,
  CLOUD_STORAGE_NAMES,
} from './fileStoreConstants';

// provider -> { storage, bucketName, read, write } where `storage` is the
// adapter instance (it exposes the same methods the Storage wrapper would).
const adapters = {};

// The exported adapter class name per provider, used after require().
const ADAPTER_CLASS_NAME = {
  [STORAGE_NAME_S3]: 'AdapterAmazonS3',
  [STORAGE_NAME_AZURE]: 'AdapterAzureBlob',
  [STORAGE_NAME_GCS]: 'AdapterGoogleCloud',
};

// Cache of loaded adapter classes (null = tried and unavailable).
const adapterClassCache = {};

/**
 * Load a provider's adapter class. Uses a literal-string require per provider
 * so the bundler includes the package (no dynamic-expression require).
 */
function loadAdapterClass(provider) {
  if (Object.prototype.hasOwnProperty.call(adapterClassCache, provider)) {
    return adapterClassCache[provider];
  }
  let mod = null;
  try {
    switch (provider) {
      case STORAGE_NAME_S3:
        // eslint-disable-next-line global-require
        mod = require('@tweedegolf/sab-adapter-amazon-s3');
        break;
      case STORAGE_NAME_AZURE:
        // eslint-disable-next-line global-require
        mod = require('@tweedegolf/sab-adapter-azure-blob');
        break;
      case STORAGE_NAME_GCS:
        // eslint-disable-next-line global-require
        mod = require('@tweedegolf/sab-adapter-google-cloud');
        break;
      default:
        mod = null;
    }
  } catch (error) {
    console.error(
      `[cloudStorage] Adapter for "${provider}" is not installed. ` +
      'Run "meteor npm install" to enable it.', error.message,
    );
  }
  const cls = mod ? mod[ADAPTER_CLASS_NAME[provider]] : null;
  adapterClassCache[provider] = cls || null;
  return adapterClassCache[provider];
}

/**
 * Translate WeKan's storageConfig.<provider> document into the configuration
 * object expected by the storage-abstraction adapter. Returns null when the
 * mandatory fields for that provider are missing.
 *
 * Note: the field is `type` (storage-abstraction v2.x), not `provider`.
 */
function buildProviderConfig(provider, cfg) {
  if (!cfg) {
    return null;
  }

  if (provider === STORAGE_NAME_S3) {
    if (!cfg.bucket || !cfg.accessKeyId || !cfg.secretAccessKey) {
      return null;
    }
    const config = {
      type: 's3',
      bucketName: cfg.bucket,
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
      region: cfg.region || 'us-east-1',
    };
    // Custom endpoint (MinIO, R2, Wasabi, Ceph, DigitalOcean Spaces…).
    if (cfg.endpoint) {
      config.endpoint = cfg.endpoint;
      // Most non-AWS S3-compatible servers (notably MinIO) require path-style.
      config.forcePathStyle = cfg.forcePathStyle !== false;
    }
    return config;
  }

  if (provider === STORAGE_NAME_AZURE) {
    if (!cfg.bucket) {
      return null;
    }
    if (cfg.connectionString) {
      return {
        type: 'azure',
        connectionString: cfg.connectionString,
        bucketName: cfg.bucket,
      };
    }
    if (cfg.accountName && cfg.accountKey) {
      return {
        type: 'azure',
        accountName: cfg.accountName,
        accountKey: cfg.accountKey,
        bucketName: cfg.bucket,
      };
    }
    return null;
  }

  if (provider === STORAGE_NAME_GCS) {
    if (!cfg.bucket) {
      return null;
    }
    const config = {
      type: 'gcs',
      bucketName: cfg.bucket,
    };
    if (cfg.projectId) {
      config.projectId = cfg.projectId;
    }
    // Service-account credentials may be supplied either as a path to a key
    // file or as the JSON key contents pasted into the admin panel.
    if (cfg.keyFilename) {
      config.keyFilename = cfg.keyFilename;
    } else if (cfg.credentials) {
      try {
        config.credentials = typeof cfg.credentials === 'string'
          ? JSON.parse(cfg.credentials)
          : cfg.credentials;
      } catch (error) {
        console.error('[cloudStorage] Invalid GCS credentials JSON:', error.message);
        return null;
      }
    } else {
      // Fall back to Application Default Credentials (GOOGLE_APPLICATION_CREDENTIALS).
    }
    return config;
  }

  return null;
}

/**
 * Catch obviously-wrong cloud config before the adapter turns it into a cryptic
 * "Invalid URL". Returns a human-friendly error string, or null when it looks OK.
 */
function validateCloudConfig(provider, cfg) {
  if (!cfg) {
    return 'Configuration is empty';
  }
  if (provider === STORAGE_NAME_AZURE) {
    const connectionString = (cfg.connectionString || '').trim();
    if (connectionString) {
      if (!/AccountName=/i.test(connectionString) ||
          !/(AccountKey=|SharedAccessSignature=)/i.test(connectionString)) {
        return 'Connection string looks malformed. Expected e.g. ' +
          'DefaultEndpointsProtocol=https;AccountName=NAME;AccountKey=KEY;EndpointSuffix=core.windows.net';
      }
      return null;
    }
    const accountName = (cfg.accountName || '').trim();
    if (!/^[a-z0-9]{3,24}$/.test(accountName)) {
      return 'Storage account name must be 3–24 lowercase letters/numbers — just the name ' +
        '(e.g. "wekanstorage"), not a URL and with no spaces. Or use a Connection string instead.';
    }
  }
  if (provider === STORAGE_NAME_S3) {
    const endpoint = (cfg.endpoint || '').trim();
    if (endpoint && /\s/.test(endpoint)) {
      return 'Endpoint must not contain spaces (e.g. https://s3.eu-west-1.amazonaws.com).';
    }
  }
  return null;
}

/** Construct a provider adapter instance from its WeKan config, or null. */
function createAdapterInstance(provider, cfg) {
  const AdapterClass = loadAdapterClass(provider);
  if (!AdapterClass) {
    return null;
  }
  const config = buildProviderConfig(provider, cfg);
  if (!config) {
    return null;
  }
  try {
    const instance = new AdapterClass(config);
    // Adapters record configuration problems on `configError` instead of throwing.
    if (instance.configError) {
      console.error(`[cloudStorage] ${provider} configuration error:`, instance.configError);
      return null;
    }
    return instance;
  } catch (error) {
    console.error(`[cloudStorage] Failed to initialize ${provider} storage:`, error.message);
    return null;
  }
}

function buildAdapter(provider, cfg) {
  const instance = createAdapterInstance(provider, cfg);
  if (!instance) {
    return null;
  }
  return {
    storage: instance,
    bucketName: cfg.bucket,
    read: cfg.read !== false,
    write: cfg.write !== false,
  };
}

/**
 * Rebuild every cloud adapter from the persisted settings document. Disabled or
 * misconfigured providers are removed from the cache.
 */
export async function refreshCloudStorageFromSettings() {
  if (!Meteor.isServer) {
    return;
  }
  let settings;
  try {
    settings = await AttachmentStorageSettings.findOneAsync({});
  } catch (error) {
    console.error('[cloudStorage] Could not load storage settings:', error.message);
    return;
  }

  const storageConfig = (settings && settings.storageConfig) || {};
  CLOUD_STORAGE_NAMES.forEach(provider => {
    const cfg = storageConfig[provider];
    if (cfg && cfg.enabled !== false) {
      const adapter = buildAdapter(provider, cfg);
      if (adapter) {
        adapters[provider] = adapter;
        return;
      }
    }
    delete adapters[provider];
  });
}

/** Returns the cached adapter ({ storage, bucketName, read, write }) or null. */
export function getCloudAdapter(provider) {
  return adapters[provider] || null;
}

/** True when the given provider has a usable, configured adapter. */
export function isCloudConfigured(provider) {
  return !!adapters[provider];
}

/** True for any storage name backed by the cloud abstraction. */
export function isCloudStorageName(storageName) {
  return CLOUD_STORAGE_NAMES.includes(storageName);
}

/**
 * Try to reach a provider with the given (possibly unsaved) config by listing
 * its bucket. Returns { ok, error }. Used by the "Test connection" button.
 */
export async function testCloudConnection(provider, cfg) {
  // Build the instance step by step so the actual reason is reported to the
  // admin instead of a single generic message.
  const AdapterClass = loadAdapterClass(provider);
  if (!AdapterClass) {
    return { ok: false, error: `Cloud storage adapter for "${provider}" is not installed` };
  }
  const validationError = validateCloudConfig(provider, cfg);
  if (validationError) {
    return { ok: false, error: validationError };
  }
  const config = buildProviderConfig(provider, cfg);
  if (!config) {
    return { ok: false, error: 'Incomplete configuration: required fields are missing' };
  }
  let instance;
  try {
    instance = new AdapterClass(config);
  } catch (error) {
    return { ok: false, error: error.message || 'Failed to initialize storage adapter' };
  }
  if (instance.configError) {
    let error = String(instance.configError).replace(/^\[configError\]\s*/, '');
    // "Invalid URL" from Azure means the account name / connection string is bad.
    if (provider === STORAGE_NAME_AZURE && /invalid url/i.test(error)) {
      error += ' — check the Storage account name (just the name, e.g. "wekanstorage", ' +
        'no https:// or spaces) or the Connection string.';
    }
    return { ok: false, error };
  }
  try {
    const result = await instance.listFiles(cfg.bucket);
    if (result && result.error) {
      return { ok: false, error: result.error };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message || 'Connection failed' };
  }
}
