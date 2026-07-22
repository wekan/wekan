import { Mongo } from 'meteor/mongo';

// Persisted snapshot of the MongoDB <-> FerretDB v1 (SQLite) text-data migration
// progress (server/methods/migrateTextDatabase.js keeps the live copy in memory;
// this single doc `_id: 'text-migration'` mirrors it to the database). Persisting
// it lets a SEPARATE process — the Admin Panel / Problems status method and the
// `snap run wekan.problems` command — see whether a migration/repair is running,
// which an in-memory-only object could not do.
const TextMigrationStatus = new Mongo.Collection('text_migration_status');

export default TextMigrationStatus;
