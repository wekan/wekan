// #687: WebDAV attachment storage - Nextcloud Files, ownCloud, or any WebDAV
// server - as one more cloud provider beside S3, Azure and GCS
// (models/lib/cloudStorage.js). It implements the adapter interface those
// use: getFileAsStream, addFileFromPath, addFileFromStream, removeFile,
// listFiles - each answering { value } or { error }. Files go to
// `<endpoint>/<folder>/<key>`; the folders of a key are made with MKCOL.
// The endpoint is set by a site administrator in Admin Panel / Attachments
// (like an S3 endpoint), so it may be on the internal network.
const fs = require('fs');
const { Readable } = require('stream');

const { webdavObjectUrl, webdavCollectionUrls } = require('/models/lib/webdavStorage');

class AdapterWebDav {
  constructor(config) {
    this.config = config || {};
    this.configError = this.config.endpoint ? null : 'WebDAV endpoint missing';
  }

  headers(extra = {}) {
    const { username, password } = this.config;
    return username || password
      ? { Authorization: `Basic ${Buffer.from(`${username || ''}:${password || ''}`).toString('base64')}`, ...extra } : { ...extra };
  }

  async request(url, options = {}) {
    return fetch(url, { ...options, headers: this.headers(options.headers), redirect: 'error', signal: AbortSignal.timeout(120000) });
  }

  async ensureFolders(bucketName, key) {
    for (const url of webdavCollectionUrls(this.config.endpoint, bucketName, key)) {
      const res = await this.request(url, { method: 'MKCOL' });
      // 201 made, 405 already there; anything else is reported by the PUT.
      if (![201, 405, 301].includes(res.status)) break;
    }
  }

  async addFileFromPath({ origPath, bucketName, targetPath }) {
    try {
      await this.ensureFolders(bucketName, targetPath);
      const res = await this.request(webdavObjectUrl(this.config.endpoint, bucketName, targetPath), {
        method: 'PUT', body: Readable.toWeb(fs.createReadStream(origPath)), duplex: 'half' });
      return res.ok ? { value: targetPath } : { error: `WebDAV PUT ${res.status}` };
    } catch (error) {
      return { error: error.message };
    }
  }

  async addFileFromStream({ stream, bucketName, targetPath }) {
    try {
      await this.ensureFolders(bucketName, targetPath);
      const res = await this.request(webdavObjectUrl(this.config.endpoint, bucketName, targetPath), {
        method: 'PUT', body: Readable.toWeb(stream), duplex: 'half' });
      return res.ok ? { value: targetPath } : { error: `WebDAV PUT ${res.status}` };
    } catch (error) {
      return { error: error.message };
    }
  }

  async getFileAsStream(bucketName, key, range) {
    try {
      const headers = range ? { Range: `bytes=${range.start}-${range.end === undefined ? '' : range.end}` } : {};
      const res = await this.request(webdavObjectUrl(this.config.endpoint, bucketName, key), { method: 'GET', headers });
      if (!res.ok || !res.body) return { error: `WebDAV GET ${res.status}` };
      return { value: Readable.fromWeb(res.body) };
    } catch (error) {
      return { error: error.message };
    }
  }

  async removeFile(bucketName, key) {
    try {
      const res = await this.request(webdavObjectUrl(this.config.endpoint, bucketName, key), { method: 'DELETE' });
      return res.ok || res.status === 404 ? { value: key } : { error: `WebDAV DELETE ${res.status}` };
    } catch (error) {
      return { error: error.message };
    }
  }

  // Used to test the connection: the folder can be listed.
  async listFiles(bucketName) {
    try {
      await this.ensureFolders(bucketName, 'x');
      const res = await this.request(webdavObjectUrl(this.config.endpoint, bucketName, ''), { method: 'PROPFIND', headers: { Depth: '1' } });
      return res.status === 207 ? { value: [] } : { error: `WebDAV PROPFIND ${res.status}` };
    } catch (error) {
      return { error: error.message };
    }
  }
}

module.exports = { AdapterWebDav };
