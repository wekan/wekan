// Builds one person's personal-data export (WP-5) from the plan of
// models/lib/personalDataExport.js: their account without secrets, every row
// of every collection the inventory says holds their data, and a manifest
// that says what is in the file and what is not, and why.
import { MongoInternals } from 'meteor/mongo';

const { exportPlan, addressRows, exportRow, userRecord } = require('/models/lib/personalDataExport');

// Rows per collection. A person with more has the first ones and the manifest
// says the collection was cut, rather than a download that never finishes.
export const MAX_ROWS = 20000;

export async function buildPersonalDataExport(user, now = new Date()) {
  const plan = exportPlan(user);
  if (!plan) throw new Error('personal-data-export-no-user');
  const db = MongoInternals.defaultRemoteCollectionDriver().mongo.db;
  const files = { 'user.json': userRecord(user) };
  const included = [];
  const emails = (user.emails || []).map(e => e && e.address);
  for (const { collection, selector } of [...plan.queries, ...addressRows(emails)]) {
    try {
      const rows = await db.collection(collection).find(selector).limit(MAX_ROWS + 1).toArray();
      if (!rows.length) continue;
      files[`data/${collection}.json`] = rows.slice(0, MAX_ROWS).map(row => exportRow(collection, row, user._id));
      included.push({ collection, rows: Math.min(rows.length, MAX_ROWS), cut: rows.length > MAX_ROWS });
    } catch (error) {
      included.push({ collection, error: String((error && error.message) || error).slice(0, 200) });
    }
  }
  files['manifest.json'] = {
    about: 'Everything this WeKan holds about one account, as JSON. Secrets (password hash, login tokens, keys) are never included. Board content is in the board exports.',
    userId: user._id,
    username: user.username || '',
    createdAt: now.toISOString(),
    included,
    notIncluded: plan.skipped,
  };
  return files;
}
