'use strict';
const fs = require('node:fs');
const path = require('node:path');
function reserve(root, type, now = new Date()) {
  if (!/^[A-Za-z0-9_-]+$/.test(type)) throw new Error('Invalid log type');
  const pad = value => String(value).padStart(2, '0');
  const day = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  const parent = path.resolve(root, type);
  const stamp = `${day}_${time}`;
  fs.mkdirSync(parent, { recursive: true });
  for (let suffix = 0; ; suffix++) {
    const directory = path.join(parent, stamp + (suffix ? `-${suffix}` : ''));
    try { fs.mkdirSync(directory); return directory; }
    catch (error) { if (error.code !== 'EEXIST') throw error; }
  }
}
module.exports = { reserve };
if (require.main === module) {
  try { console.log(reserve(process.env.WEKAN_LOG_ROOT || path.join(__dirname, '../.tools/log'), process.argv[2])); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
