// Azure Blob attachment storage on @azure/storage-blob alone.
//
// models/lib/cloudStorage.js used @tweedegolf/sab-adapter-azure-blob, which
// loads @azure/identity when it is required - and with it @azure/msal-node,
// @azure/msal-common and @azure/msal-browser, 36 MiB in every bundle - for
// one branch: Microsoft Entra passwordless sign-in, used only when neither a
// connection string nor an account key is given. WeKan always gives one of
// them (buildProviderConfig), so that branch never ran. server/methods/backup.js
// already uses @azure/storage-blob directly.
//
// It is the adapter interface the other providers have (server/lib/webdavAdapter.js):
// getFileAsStream, addFileFromPath, addFileFromStream, removeFile, listFiles,
// each answering { value, error }, and configError for a configuration that
// cannot work. The answers are the old adapter's: a missing file to remove is
// not an error, and listFiles gives [name, size] pairs, with "container/prefix"
// listing only that prefix.
const fs = require('fs');

// Azure's own SDK, loaded when an Azure storage is configured.
function blobSdk() {
  // eslint-disable-next-line global-require
  return require('@azure/storage-blob');
}

function errorMessage(error) {
  return (error && (error.message || error.code)) || String(error);
}

class AdapterAzureBlob {
  constructor(config) {
    this.config = config || {};
    this.configError = null;
    this.client = null;
    const { connectionString, accountName, accountKey } = this.config;
    try {
      const { BlobServiceClient, StorageSharedKeyCredential } = blobSdk();
      if (connectionString) {
        this.client = BlobServiceClient.fromConnectionString(connectionString);
      } else if (accountName && accountKey) {
        this.client = new BlobServiceClient(`https://${accountName}.blob.core.windows.net`,
          new StorageSharedKeyCredential(accountName, accountKey));
      } else {
        this.configError = '[configError] Please provide a connection string, or an account name and an account key';
      }
    } catch (error) {
      this.configError = `[configError] ${errorMessage(error)}`;
    }
  }

  container(bucketName) {
    return this.client.getContainerClient(bucketName || this.config.bucketName);
  }

  async upload({ stream, bucketName, targetPath, options }) {
    try {
      const blob = this.container(bucketName).getBlockBlobClient(targetPath);
      // 64 KB blocks, 20 at a time - what the old adapter used.
      const response = await blob.uploadStream(stream, 64000, 20, options || {});
      return response && response.errorCode ? { value: null, error: response.errorCode } : { value: 'ok', error: null };
    } catch (error) {
      return { value: null, error: errorMessage(error) };
    }
  }

  async addFileFromPath({ origPath, bucketName, targetPath, options }) {
    let stream;
    try {
      await fs.promises.access(origPath, fs.constants.R_OK);
      stream = fs.createReadStream(origPath);
    } catch (error) {
      return { value: null, error: errorMessage(error) };
    }
    return this.upload({ stream, bucketName, targetPath, options });
  }

  async addFileFromStream({ stream, bucketName, targetPath, options }) {
    if (!stream) return { value: null, error: 'could not read local file, buffer or stream' };
    return this.upload({ stream, bucketName, targetPath, options });
  }

  // range: { start, end } with end inclusive (#6745), or nothing for the whole file.
  async getFileAsStream(bucketName, key, range) {
    try {
      const offset = range && range.start !== undefined ? range.start : 0;
      const count = range && range.end !== undefined ? range.end - offset + 1 : undefined;
      const response = await this.container(bucketName).getBlobClient(key).download(offset, count);
      return response.readableStreamBody
        ? { value: response.readableStreamBody, error: null }
        : { value: null, error: `No file '${key}' found in bucket '${bucketName}'` };
    } catch (error) {
      return { value: null, error: errorMessage(error) };
    }
  }

  async removeFile(bucketName, key) {
    try {
      await this.container(bucketName).getBlobClient(key).deleteIfExists();
      return { value: 'ok', error: null };
    } catch (error) {
      return { value: null, error: errorMessage(error) };
    }
  }

  async listFiles(bucketName, numFiles = 10000) {
    try {
      let name = bucketName || this.config.bucketName;
      let prefix = '';
      if (name.includes('/')) [name, prefix] = [name.slice(0, name.indexOf('/')), name.slice(name.indexOf('/') + 1)];
      const files = [];
      for await (const blob of this.container(name).listBlobsFlat({ prefix })) {
        if (blob.properties && blob.properties.contentLength !== undefined) files.push([blob.name, blob.properties.contentLength]);
        if (files.length >= numFiles) break;
      }
      return { value: files, error: null };
    } catch (error) {
      return { value: null, error: errorMessage(error) };
    }
  }
}

module.exports = { AdapterAzureBlob };
