'use strict';

const http = require('http');
const https = require('https');

const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';

module.exports = async function globalSetup() {
  const running = await new Promise(resolve => {
    const transport = new URL(BASE_URL).protocol === 'https:' ? https : http;
    const request = transport.get(BASE_URL, response => {
      response.resume();
      resolve(response.statusCode >= 200 && response.statusCode < 400);
    }).on('error', () => resolve(false));
    request.setTimeout(10_000, () => {
      request.destroy();
      resolve(false);
    });
  });
  if (!running) {
    throw new Error(`WeKan is not ready at ${BASE_URL}; no browser tests were run.`);
  }
};
