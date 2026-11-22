'use strict';
// /metrics' address allowlist: the deployment files set METRICS_ALLOWED_IP_ADDRESSES
// (Docker Compose, the Dockerfile, start-wekan.sh, the Snap's
// metrics-allowed-ip-addresses), and models/server/metrics.js read only
// METRICS_ACCEPTED_IP_ADDRESS - an allowlist set the documented way never
// applied. Both names are read now.
// Run: node tests/metricsAllowedAddresses.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const src = fs.readFileSync(path.join(__dirname, '..', 'models/server/metrics.js'), 'utf8');
const body = src.slice(src.indexOf('function acceptedIpAddresses'), src.indexOf('function acceptedIpAddress(ipAddress)'));
// eslint-disable-next-line no-new-func
const acceptedIpAddresses = new Function('process', `${body}; return acceptedIpAddresses;`)({ env: {} });
assert.deepEqual(acceptedIpAddresses({ METRICS_ALLOWED_IP_ADDRESSES: '192.168.0.100, 192.168.0.200' }), ['192.168.0.100', '192.168.0.200']);
assert.deepEqual(acceptedIpAddresses({ METRICS_ACCEPTED_IP_ADDRESS: '10.0.0.1', METRICS_ALLOWED_IP_ADDRESSES: '10.0.0.2' }), ['10.0.0.1'], 'the older name first');
assert.deepEqual(acceptedIpAddresses({ METRICS_ACCEPTED_IP_ADDRESS: '', METRICS_ALLOWED_IP_ADDRESSES: '10.0.0.2' }), ['10.0.0.2'], 'an empty older name falls through');
// Negative: nothing set, or an empty list, allows nobody.
assert.deepEqual(acceptedIpAddresses({}), []);
assert.deepEqual(acceptedIpAddresses({ METRICS_ALLOWED_IP_ADDRESSES: ' , ' }), []);
for (const f of ['docker-compose.yml', 'Dockerfile', 'start-wekan.sh', 'snap-src/bin/config']) {
  assert.match(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'), /METRICS_ALLOWED_IP_ADDRESSES/, `${f} sets the name that is read`);
}
console.log('metricsAllowedAddresses: both names read, trimmed, empty allows nobody');
