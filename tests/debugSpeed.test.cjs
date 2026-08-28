const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const observer = read('server/lib/debugSpeed.js');
const server = read('releases/debug-speed-server.sh');
const traffic = read('releases/debug-speed-traffic.mjs');

// Positive: one opt-in switch reaches WeKan, the local FerretDB process and the
// existing admin-only Speed event stream.
assert.match(observer, /process\.env\.DEBUGSPEED === 'true'/);
assert.match(observer, /speedRecord\(/);
assert.match(server, /export DEBUGSPEED=true/);
assert.match(server, /DEBUGSPEED=true FERRETDB_HANDLER=sqlite/);
assert.match(server, /FERRETDB_LOG_LEVEL="\$\{DEBUGSPEED_FERRETDB_LOG_LEVEL:-info\}"/);
assert.match(server, /FerretDB diagnostics:.*ferretdb\.log/);
assert.match(server, /\.tools\/\.meteor\/meteor/);

// Negative/security: diagnostics describe query/handler SHAPES. They must not
// record DDP arguments or put the supplied password in output.
assert.doesNotMatch(observer, /JSON\.stringify\(args\)|detail:\s*args/);
assert.doesNotMatch(traffic, /console\.log\([^\n]*password|console\.error\([^\n]*password/);
assert.doesNotMatch(server, /DEBUGSPEED_FERRETDB_LOG_LEVEL:-debug/);

// The MongoDB choice must let Meteor start its own database; FerretDB is
// standalone polling and must never receive an OpLog URL.
assert.match(server, /unset MONGO_URL MONGO_OPLOG_URL/);
assert.match(server, /unset MONGO_OPLOG_URL/);
assert.match(server, /METEOR_REACTIVITY_ORDER=polling/);

console.log('debugSpeed: opt-in, redaction and database modes verified');
