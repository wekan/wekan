const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const observer = read('server/lib/debugSpeed.js');
const server = read('releases/debug-speed-server.sh');
const watcher = read('releases/debug-speed-watch.sh');
const traffic = read('releases/debug-speed-traffic.mjs');

// Positive: one opt-in switch reaches WeKan and the local FerretDB process, and
// writes measurements beside their console logs rather than into the database.
assert.match(observer, /process\.env\.DEBUGSPEED === 'true'/);
assert.match(server, /export DEBUGSPEED=true/);
assert.match(server, /export DEBUGSPEED_LOG_FILE="\$LOG_DIR\/wekan-debugspeed\.jsonl"/);
assert.match(server, /chmod 600 "\$DEBUGSPEED_LOG_FILE"/);
assert.match(observer, /appendFileSync\(LOG_FILE/);
assert.match(observer, /category: 'debug-speed'/);
assert.doesNotMatch(observer, /speedRecord|\/server\/lib\/speedLog/);
assert.doesNotMatch(observer, /RecoveryEvents|Admin Panel row/);
assert.match(server, /export FERRETDB_HANDLER=sqlite/);
assert.match(server, /export FERRETDB_LOG_LEVEL="\$\{DEBUGSPEED_FERRETDB_LOG_LEVEL:-info\}"/);
assert.match(server, /FerretDB diagnostics:.*ferretdb\.log/);
assert.match(server, /\.tools\/\.meteor\/meteor/);

// Negative/security: diagnostics describe query/handler SHAPES. They must not
// record DDP arguments or put the supplied password in output.
assert.doesNotMatch(observer, /JSON\.stringify\(args\)|detail:\s*args/);
assert.doesNotMatch(traffic, /console\.log\([^\n]*password|console\.error\([^\n]*password/);
assert.doesNotMatch(server, /DEBUGSPEED_FERRETDB_LOG_LEVEL:-debug/);
assert.doesNotMatch(server + watcher, /ps[^\n]*(args|command)|\/proc\/[^\n]*environ/);

// One supervisor owns every process. Ctrl-C stops the watcher, terminal log
// follower, WeKan/Meteor process group and FerretDB, then reaps every child.
assert.match(server, /WATCH_PID=''/);
assert.match(server, /WEKAN_PID=''/);
assert.match(server, /TAIL_PID=''/);
assert.match(server, /stop_process "\$WATCH_PID" "\$WATCH_GROUP"/);
assert.match(server, /stop_process "\$WEKAN_PID" "\$WEKAN_GROUP"/);
assert.match(server, /stop_process "\$FERRET_PID" "\$FERRET_GROUP"/);
assert.match(server, /trap interrupted INT TERM/);
assert.match(server, /resources\.tsv/);
assert.match(server, /debug-speed-watch\.sh/);
assert.match(watcher, /ps -eo pid=,ppid=,pcpu=,pmem=,rss=,vsz=,stat=,comm=/);

// The MongoDB choice must let Meteor start its own database; FerretDB is
// standalone polling and must never receive an OpLog URL.
assert.match(server, /unset MONGO_URL MONGO_OPLOG_URL/);
assert.match(server, /unset MONGO_OPLOG_URL/);
assert.match(server, /METEOR_REACTIVITY_ORDER=polling/);

console.log('debugSpeed: opt-in, redaction and database modes verified');
