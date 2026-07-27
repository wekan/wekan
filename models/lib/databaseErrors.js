// What the database just said, what it means, and what to do about it.
//
// WeKan runs on MongoDB or on FerretDB v1 over SQLite, PostgreSQL, MySQL,
// MariaDB or SAP HANA. Each of those answers a broken query, a full disk or a
// refused login in its own words, and the words reach WeKan as an opaque error
// string - so an admin sees "Error 1064 (42000): You have an error in your SQL
// syntax" and has no way to know it came from MySQL, that it is FerretDB's bug
// and not their data, or that nothing they can configure will fix it.
//
// This module is the translation, and it is deliberately pure: a string in, a
// classification out, no database and no Meteor. server/lib/databaseProblems.js
// records what it returns, and Admin Panel / Problems shows it.

// The databases WeKan can be running on, as they are named in the UI.
const DATABASES = ['mongodb', 'sqlite', 'postgresql', 'mysql', 'mariadb', 'hana', 'unknown'];

// One rule: how to recognise it, what it is, and what the admin should do.
//
// `act` is the thing WeKan can do BY ITSELF when it sees this - and only where
// doing it is obviously right. Everything else is advice, because a database
// that is out of disk is not something an application should "handle".
const RULES = [
  // ── injection and malformed SQL: FerretDB's bug, never the admin's ────────
  {
    id: 'sql-guard-refused',
    match: /statement rejected by the SQL guard|SECURITY: refusing to execute/i,
    databases: ['postgresql', 'mysql', 'mariadb', 'sqlite'],
    severity: 'critical',
    kind: 'injection',
    means: 'FerretDB refused to run a statement that looked like it carried injected SQL.',
    whatToDo: 'Nothing was executed. Report it at https://github.com/wekan/FerretDB/issues ' +
      'with the statement from the FerretDB log - a client should not be able to cause this.',
    act: null,
  },
  {
    id: 'mysql-syntax',
    match: /Error 1064 \(42000\)|You have an error in your SQL syntax/i,
    databases: ['mysql', 'mariadb'],
    severity: 'critical',
    kind: 'syntax',
    means: 'MySQL/MariaDB rejected a statement FerretDB built. This is a FerretDB bug, ' +
      'not something in your data.',
    whatToDo: 'Upgrade FerretDB (wekan/FerretDB releases). If it persists, report it with ' +
      'the statement from the log.',
    act: null,
  },
  {
    id: 'postgres-syntax',
    match: /SQLSTATE 42601|syntax error at or near/i,
    databases: ['postgresql'],
    severity: 'critical',
    kind: 'syntax',
    means: 'PostgreSQL rejected a statement FerretDB built - a FerretDB bug, not your data.',
    whatToDo: 'Upgrade FerretDB. If it persists, report it with the statement from the log.',
    act: null,
  },
  {
    id: 'sqlite-syntax',
    match: /SQL logic error|near ".*": syntax error/i,
    databases: ['sqlite'],
    severity: 'critical',
    kind: 'syntax',
    means: 'SQLite rejected a statement FerretDB built - a FerretDB bug, not your data.',
    whatToDo: 'Upgrade FerretDB. If it persists, report it with the statement from the log.',
    act: null,
  },

  // ── permissions: the commonest FerretDB-on-SQL misconfiguration ───────────
  {
    id: 'mysql-access-denied-database',
    match: /Access denied for user .* to database/i,
    databases: ['mysql', 'mariadb'],
    severity: 'critical',
    kind: 'permission',
    means: 'FerretDB creates one SQL database per MongoDB database, and the user it ' +
      'connects as may not create them.',
    whatToDo: 'Connect FerretDB as a user that may CREATE DATABASE - the WeKan compose ' +
      'files use root for exactly this reason - or grant that right to the user in ' +
      '--mysql-url.',
    act: null,
  },
  {
    id: 'mysql-native-password',
    match: /this user requires mysql native password authentication/i,
    databases: ['mysql', 'mariadb'],
    severity: 'critical',
    kind: 'auth',
    means: 'The MySQL driver refused the server\'s password handshake.',
    whatToDo: 'Upgrade FerretDB: its driver configuration disabled native passwords, ' +
      'which every default MariaDB root account asks for. Fixed in wekan/FerretDB.',
    act: null,
  },
  {
    id: 'postgres-permission',
    match: /SQLSTATE 42501|permission denied for (schema|database|relation)/i,
    databases: ['postgresql'],
    severity: 'critical',
    kind: 'permission',
    means: 'PostgreSQL refused FerretDB the right to create or use a schema.',
    whatToDo: 'The role in --postgresql-url needs CREATE on the database. The WeKan ' +
      'compose file uses the database owner.',
    act: null,
  },
  {
    id: 'auth-failed',
    match: /authentication failed|password authentication failed|Authentication failed|bad auth/i,
    databases: DATABASES,
    severity: 'critical',
    kind: 'auth',
    means: 'The database rejected the credentials in the connection URL.',
    whatToDo: 'Check MONGO_URL (or FerretDB\'s backend URL) and the password of that user.',
    act: null,
  },

  // ── the machine underneath ───────────────────────────────────────────────
  {
    id: 'disk-full',
    match: /No space left on device|disk I\/O error|SQLSTATE 53100|database or disk is full|ENOSPC/i,
    databases: DATABASES,
    severity: 'critical',
    kind: 'disk',
    means: 'The database cannot write: the disk holding it is full.',
    whatToDo: 'Free space on the volume holding the database, then restart WeKan. ' +
      'Admin Panel / Problems / Disk usage shows what is using it.',
    act: null,
  },
  {
    id: 'too-many-connections',
    match: /too many connections|SQLSTATE 53300|max_connections|connection limit exceeded/i,
    databases: ['postgresql', 'mysql', 'mariadb', 'hana'],
    severity: 'warning',
    kind: 'connections',
    means: 'The database is refusing new connections because its limit is reached.',
    whatToDo: 'Raise max_connections on the database, or lower FerretDB\'s pool size. ' +
      'WeKan retries, so this is usually a burst rather than a fault.',
    act: 'retry',
  },
  {
    id: 'deadlock',
    match: /deadlock detected|SQLSTATE 40P01|Deadlock found when trying to get lock|database is locked/i,
    databases: ['postgresql', 'mysql', 'mariadb', 'sqlite'],
    severity: 'warning',
    kind: 'contention',
    means: 'Two writes wanted the same rows in a different order, or SQLite\'s single ' +
      'writer was busy.',
    whatToDo: 'Retried automatically. If it is constant on SQLite, that backend has one ' +
      'writer - move to PostgreSQL for a busy instance.',
    act: 'retry',
  },
  {
    id: 'connection-lost',
    match: /connection refused|ECONNREFUSED|server closed the connection|connection reset by peer|Topology is closed|no reachable servers/i,
    databases: DATABASES,
    severity: 'critical',
    kind: 'connection',
    means: 'WeKan cannot reach the database at all.',
    whatToDo: 'Check that the database container is running and that MONGO_URL points at ' +
      'it. WeKan reconnects by itself once it is back.',
    act: 'reconnect',
  },
  {
    id: 'timeout',
    match: /context deadline exceeded|operation exceeded time limit|ETIMEDOUT|statement timeout/i,
    databases: DATABASES,
    severity: 'warning',
    kind: 'timeout',
    means: 'A query took longer than the database or the driver allows.',
    whatToDo: 'Usually an unindexed query on a large collection. Admin Panel / Problems / ' +
      'Speed shows the slow ones.',
    act: 'retry',
  },

  // ── data and schema ──────────────────────────────────────────────────────
  {
    id: 'duplicate-key',
    match: /E11000|duplicate key|Duplicate entry|UNIQUE constraint failed|SQLSTATE 23505/i,
    databases: DATABASES,
    severity: 'info',
    kind: 'duplicate',
    means: 'A unique index rejected a write, which is the index doing its job.',
    whatToDo: 'Nothing, unless it repeats for the same document - then the data has two ' +
      'rows that must be one.',
    act: null,
  },
  {
    id: 'not-implemented',
    match: /is not implemented yet|is not supported/i,
    databases: ['sqlite', 'postgresql', 'mysql', 'mariadb', 'hana'],
    severity: 'warning',
    kind: 'unsupported',
    means: 'FerretDB does not implement something WeKan asked for.',
    whatToDo: 'Upgrade FerretDB, and report the operation if it stays missing. ' +
      'Admin Panel / Problems lists which operation it was.',
    act: null,
  },
  {
    id: 'unknown-handler',
    match: /unknown handler/i,
    databases: ['hana', 'mysql', 'mariadb', 'postgresql', 'sqlite'],
    severity: 'critical',
    kind: 'configuration',
    means: 'FerretDB was started with a --handler it was not built with.',
    whatToDo: 'The hana handler needs a binary built with the ferretdb_hana build tag. ' +
      'The wekan/FerretDB releases are; a binary built elsewhere may not be.',
    act: null,
  },
];

// Which database produced this, as far as the text betrays it. `configured` is
// what WeKan believes it is talking to (from MONGO_URL / the FerretDB handler),
// and it wins unless the message itself names another - a MySQL error code in a
// PostgreSQL-configured instance means the configuration is wrong, and saying so
// is more useful than trusting it.
function databaseOf(message, configured) {
  const text = String(message || '');

  if (/Error \d+ \(\d{5}\)|mysqld|MySQL/i.test(text)) {
    return /maria/i.test(text) ? 'mariadb' : 'mysql';
  }
  if (/SQLSTATE|pq: |pgx|PostgreSQL/i.test(text)) return 'postgresql';
  if (/SQL logic error|sqlite/i.test(text)) return 'sqlite';
  if (/hdb|SAP HANA/i.test(text)) return 'hana';
  if (/E11000|Topology is closed|MongoServerError/i.test(text) && configured === 'mongodb') {
    return 'mongodb';
  }

  return DATABASES.includes(configured) ? configured : 'unknown';
}

// Classify one database error.
//
// Always returns a classification - an unrecognised error is `kind: 'unknown'`
// with the message kept, because an admin looking at Problems needs to see that
// something happened even when this module has no rule for it.
function classifyDatabaseError(error, options = {}) {
  const message = String(
    (error && (error.message || error.errmsg || error.reason)) || error || '',
  ).slice(0, 2000);
  const configured = options.configured || 'unknown';
  const database = databaseOf(message, configured);

  for (const rule of RULES) {
    if (!rule.match.test(message)) continue;
    if (!rule.databases.includes(database) && database !== 'unknown') continue;

    return {
      id: rule.id,
      database,
      severity: rule.severity,
      kind: rule.kind,
      means: rule.means,
      whatToDo: rule.whatToDo,
      act: rule.act,
      message,
      operation: options.operation || '',
    };
  }

  return {
    id: 'unclassified',
    database,
    severity: 'warning',
    kind: 'unknown',
    means: 'The database returned an error WeKan has no rule for.',
    whatToDo: 'Read the message below; if it is one WeKan should recognise, add a rule ' +
      'to models/lib/databaseErrors.js.',
    act: null,
    message,
    operation: options.operation || '',
  };
}

// The database WeKan believes it is talking to, from the environment. FerretDB
// speaks the MongoDB protocol, so MONGO_URL alone cannot tell them apart - the
// handler is what decides, and WEKAN_DB names it when the launcher set it.
function configuredDatabase(env = {}) {
  const db = String(env.WEKAN_DB || '').toLowerCase();
  if (DATABASES.includes(db)) return db;
  if (db === 'ferretdb') return 'sqlite'; // the default FerretDB backend WeKan ships
  if (env.MONGO_URL && /ferretdb/i.test(env.MONGO_URL)) return 'sqlite';
  if (env.MONGO_URL) return 'mongodb';
  return 'unknown';
}

module.exports = { classifyDatabaseError, configuredDatabase, databaseOf, DATABASES, RULES };
