'use strict';

const http = require('http');

const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';

module.exports = async function globalSetup() {
  const running = await new Promise(resolve => {
    http.get(BASE_URL, () => resolve(true)).on('error', () => resolve(false));
  });
  if (!running) {
    console.log(`\n[playwright] SKIP: WeKan is not running at ${BASE_URL}\n`);
    process.exit(0);
  }
};
