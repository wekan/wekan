import { Meteor } from 'meteor/meteor';
import fs from 'fs';
import path from 'path';
import Settings from '/models/settings';

// The Admin Panel product name, written to a file so the pages that are shown
// when the DATABASE IS NOT AVAILABLE can still use it.
//
// The snap's maintenance pages (bin/wekan-maintenance-page.mjs: under
// maintenance, recovering data, database too old, and #6592's "waiting for its
// database") are a standalone node:http server with no database connection at
// all - that is the point of them, they are what answers while the database is
// down. So a rebranded WeKan said "WeKan is waiting for its database" to people
// who have never seen the word WeKan.
//
// wekan-control already cached the name once per start, right after the database
// came up. That leaves the case this is for: an admin sets the product name in
// the Admin Panel and the snap is not restarted before the next outage - the
// cache is then from before the rename, or missing entirely on an instance that
// has never been restarted since. WeKan itself is the only thing that knows the
// name the moment it changes, so WeKan writes it: once at startup and again
// whenever the setting changes.
//
// $SNAP_COMMON is the snap's writable directory and the only place these pages
// read from; without it (Docker, source, Sandstorm) there is nothing to do and
// nothing is written.
const CACHE_DIR = process.env.SNAP_COMMON || '';
const CACHE_FILE = CACHE_DIR ? path.join(CACHE_DIR, '.productname.txt') : '';

let lastWritten = null;

export function writeProductNameCache(productName) {
  if (!CACHE_FILE) return false;
  const name = typeof productName === 'string' ? productName.trim() : '';
  // An empty product name means "no branding set", and the pages fall back to
  // WeKan on their own. Writing an empty file would make them show nothing.
  if (!name) return false;
  if (name === lastWritten) return false;
  try {
    fs.writeFileSync(CACHE_FILE, `${name}\n`, 'utf8');
    lastWritten = name;
    return true;
  } catch (error) {
    // Best effort by design: a read-only or full $SNAP_COMMON must never stop
    // WeKan from starting, and the pages have their fallback.
    console.warn('[product-name-cache] could not write', CACHE_FILE, '-', error.message);
    return false;
  }
}

if (CACHE_FILE) {
  Meteor.startup(async () => {
    try {
      const setting = await Settings.findOneAsync();
      writeProductNameCache(setting && setting.productName);
    } catch (error) {
      console.warn('[product-name-cache] could not read the setting at startup -', error.message);
    }
    // Same shape as server/lib/customHeadRender.js, which keeps the <title> in
    // step with this setting: the Admin Panel writes the settings document, so
    // the change arrives here without a restart.
    Settings.find({}, { fields: { productName: 1 } }).observeChanges({
      added(_id, fields) { writeProductNameCache(fields && fields.productName); },
      changed(_id, fields) { writeProductNameCache(fields && fields.productName); },
    });
  });
}
