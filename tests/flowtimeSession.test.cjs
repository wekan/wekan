'use strict';

// Flowtime (#3919): "better than Pomodoro" - a work session with no fixed
// interval. Unlike the manual time-entry popup (cardTime.js/models/cards.js
// setSpentTime/setIsOvertime), the session itself (flowStartAt,
// flowInterruptions, flowUserId) is persisted server-side on the card, so a
// page reload does not lose it, and interruptions are tallied during the
// session WITHOUT stopping the clock. Stopping the session must feed its
// duration into the SAME `spentTime` total the manual popup edits - not a
// separate, untracked total - via the existing setSpentTime()-based helper.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const cardsModel = read('models/cards.js');

// --- schema: the three session fields exist, alongside the pre-existing
// spentTime/isOvertime fields they must not replace ---
assert.match(cardsModel, /spentTime:\s*\{/, 'existing spentTime field is untouched');
assert.match(cardsModel, /isOvertime:\s*\{/, 'existing isOvertime field is untouched');
assert.match(cardsModel, /flowStartAt:\s*\{[\s\S]{0,200}?type:\s*Date,/,
  'flowStartAt is a Date field');
assert.match(cardsModel, /flowInterruptions:\s*\{[\s\S]{0,200}?type:\s*Number,/,
  'flowInterruptions is a Number field');
assert.match(cardsModel, /flowUserId:\s*\{[\s\S]{0,200}?type:\s*String,/,
  'flowUserId is a String field');

// --- the manual time-entry popup's own methods are unchanged (additive
// only - Flowtime must not replace or shadow them) ---
assert.match(cardsModel, /setSpentTime\(spentTime\)\s*\{/);
assert.match(cardsModel, /setIsOvertime\(isOvertime\)\s*\{/);

// --- start/interrupt/stop session helpers exist ---
assert.match(cardsModel, /startFlowSession\(userId\)\s*\{/);
assert.match(cardsModel, /addFlowInterruption\(\)\s*\{/);
assert.match(cardsModel, /stopFlowSession\(\)\s*\{/);

// startFlowSession touches exactly the three session fields, resetting the
// interruption tally and stamping who started it - not spentTime, not
// isOvertime.
const startBody = cardsModel.match(/startFlowSession\(userId\)\s*\{([\s\S]*?)\n  \},/);
assert.ok(startBody, 'startFlowSession has a body');
assert.match(startBody[1], /flowStartAt:\s*new Date\(\)/);
assert.match(startBody[1], /flowInterruptions:\s*0/);
assert.match(startBody[1], /flowUserId:\s*userId/);
assert.doesNotMatch(startBody[1], /spentTime/,
  'starting a session must not touch spentTime directly');

// addFlowInterruption only increments the counter - it must not touch
// flowStartAt (the clock keeps running) or spentTime.
const addBody = cardsModel.match(/addFlowInterruption\(\)\s*\{([\s\S]*?)\n  \},/);
assert.ok(addBody, 'addFlowInterruption has a body');
assert.match(addBody[1], /\$inc:\s*\{\s*flowInterruptions:\s*1\s*\}/);
assert.doesNotMatch(addBody[1], /flowStartAt/,
  'adding an interruption must not touch flowStartAt - the clock keeps running');
assert.doesNotMatch(addBody[1], /spentTime/,
  'adding an interruption must not touch spentTime');

// stopFlowSession computes elapsed time and feeds it into the EXISTING
// spentTime field via the existing setSpentTime()-based helper, then clears
// the session fields.
const stopBody = cardsModel.match(/stopFlowSession\(\)\s*\{([\s\S]*?)\n  \},/);
assert.ok(stopBody, 'stopFlowSession has a body');
assert.match(stopBody[1], /this\.setSpentTime\(newSpentTime\)/,
  'stopping a session must add its duration through setSpentTime(), the same method the manual popup uses');
assert.match(stopBody[1], /\(this\.spentTime \|\| 0\) \+ elapsedHours/,
  'the session duration is ADDED to the existing spentTime total, not a separate one');
assert.match(stopBody[1], /flowStartAt:\s*null/);
assert.match(stopBody[1], /flowInterruptions:\s*0/);
assert.match(stopBody[1], /flowUserId:\s*null/);

// --- pure-logic reproduction of stopFlowSession's arithmetic, independent
// of Meteor/the collection, mirroring the loginCookieExpiry.test.cjs style ---
function computeStopResult(spentTime, flowStartAt, now) {
  const elapsedHours = (now - flowStartAt) / (1000 * 60 * 60);
  return (spentTime || 0) + elapsedHours;
}
const start = new Date('2026-01-01T10:00:00Z').getTime();
const stop = new Date('2026-01-01T11:30:00Z').getTime();
assert.equal(computeStopResult(0, start, stop), 1.5,
  'a 90-minute session with no prior spentTime adds 1.5 hours');
assert.equal(computeStopResult(2, start, stop), 3.5,
  'a 90-minute session ADDS to, rather than replaces, existing spentTime');

// --- cross-card leakage: only the three session methods WRITE flowStartAt/
// flowInterruptions/flowUserId (via $set/$inc), and each write is scoped to
// `this.getRealId()` (the CURRENT card), never a hardcoded id or every card
// in the collection ---
const flowFieldWriteSites = [...cardsModel.matchAll(
  /(\w+)\([^)]*\)\s*\{([\s\S]*?)\n  \},/g,
)].filter(m => /\$(?:set|inc)\s*:\s*\{[^}]*flow(?:StartAt|Interruptions|UserId)/.test(m[2]));
const writerNames = [...new Set(flowFieldWriteSites.map(m => m[1]))];
assert.deepEqual(writerNames.sort(),
  ['addFlowInterruption', 'startFlowSession', 'stopFlowSession'].sort(),
  'no method other than start/interrupt/stop actually WRITES the flow session fields');
for (const [, name, body] of flowFieldWriteSites) {
  assert.match(body, /this\.getRealId\(\)/,
    `${name} scopes its update to this.getRealId() - never a hardcoded id or the whole collection`);
}

// --- UI: buttons call the right card methods, and the ticking display uses
// the same Meteor.setInterval idiom already used elsewhere in the client
// (e.g. client/components/settings/problemsSummary.js) ---
const flowtimeJs = read('client/components/cards/cardFlowtime.js');
assert.match(flowtimeJs, /'click \.js-start-flow'/);
assert.match(flowtimeJs, /card\.startFlowSession\(Meteor\.userId\(\)\)/);
assert.match(flowtimeJs, /'click \.js-add-flow-interruption'/);
assert.match(flowtimeJs, /card\.addFlowInterruption\(\)/);
assert.match(flowtimeJs, /'click \.js-stop-flow'/);
assert.match(flowtimeJs, /card\.stopFlowSession\(\)/);
assert.match(flowtimeJs, /Meteor\.setInterval/);
assert.match(flowtimeJs, /Meteor\.clearInterval/, 'the ticking interval is cleared (onDestroyed), not leaked');
assert.match(flowtimeJs, /Utils\.canModifyCard\(\)/,
  'only canModifyCard() may interact with the session controls');

// --- the jade template wires the three buttons and is included from
// cardDetails.jade near the existing cardSpentTime badge, and the .jade/.js/
// .css trio is registered in client/features/cards.js the same way every
// other client/components/cards/*.jade/js/css file is (Meteor does not
// auto-load them - see tests/templateRegistration.test.cjs /
// clientBundleImports.test.cjs) ---
const flowtimeJade = read('client/components/cards/cardFlowtime.jade');
assert.match(flowtimeJade, /template\(name="cardFlowtime"\)/);
assert.match(flowtimeJade, /button\.js-start-flow/);
assert.match(flowtimeJade, /button\.js-add-flow-interruption/);
assert.match(flowtimeJade, /button\.js-stop-flow/);

const cardDetailsJade = read('client/components/cards/cardDetails.jade');
assert.match(cardDetailsJade, /\+cardFlowtime/, 'cardDetails.jade includes +cardFlowtime');

const cardsFeature = read('client/features/cards.js');
assert.match(cardsFeature, /import '\/client\/components\/cards\/cardFlowtime\.jade';/);
assert.match(cardsFeature, /import '\/client\/components\/cards\/cardFlowtime\.js';/);
assert.match(cardsFeature, /import '\/client\/components\/cards\/cardFlowtime\.css';/);

// The manual time-entry popup keeps its own template/events untouched -
// Flowtime is additive, not a replacement.
assert.match(cardsFeature, /import '\/client\/components\/cards\/cardTime\.jade';/);
const cardTimeJs = read('client/components/cards/cardTime.js');
assert.match(cardTimeJs, /Template\.editCardSpentTimePopup\.events\(\{/);
assert.match(cardTimeJs, /card\.setSpentTime\(spentTime\)/);

// --- i18n: the new keys exist in en.i18n.json, in the same position (right
// after "overtime") in every OTHER locale file, key order matches, and none
// of them are left equal to the English source (which would count as
// "untranslated" per releases/translations/fill-translations.mjs) ---
const enPath = path.join(root, 'imports/i18n/data/en.i18n.json');
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const NEW_KEYS = ['flowtime', 'flow-start', 'flow-stop', 'flow-add-interruption', 'flow-interruptions'];
for (const k of NEW_KEYS) {
  assert.ok(Object.prototype.hasOwnProperty.call(en, k), `en.i18n.json has "${k}"`);
}
// Order: these five keys are contiguous and directly follow "overtime" in
// en.i18n.json, exactly where they were inserted into every locale file.
const enKeys = Object.keys(en);
const overtimeIdx = enKeys.indexOf('overtime');
assert.equal(enKeys[overtimeIdx + 1], 'flowtime');
assert.equal(enKeys[overtimeIdx + 2], 'flow-start');
assert.equal(enKeys[overtimeIdx + 3], 'flow-stop');
assert.equal(enKeys[overtimeIdx + 4], 'flow-add-interruption');
assert.equal(enKeys[overtimeIdx + 5], 'flow-interruptions');

const dataDir = path.join(root, 'imports/i18n/data');
const localeFiles = fs.readdirSync(dataDir).filter(f => f.endsWith('.i18n.json'));
assert.ok(localeFiles.length > 200, 'sanity: there are many locale files');

let checked = 0;
for (const file of localeFiles) {
  const code = file.replace(/\.i18n\.json$/, '');
  const isEnglish = code === 'en' || code.startsWith('en-') || code.startsWith('en_');
  const data = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
  for (const k of NEW_KEYS) {
    assert.ok(Object.prototype.hasOwnProperty.call(data, k), `${file} has key "${k}"`);
  }
  // Same relative position: right after "overtime" (mirrors the insertion
  // done for every locale file).
  const keys = Object.keys(data);
  const idx = keys.indexOf('overtime');
  if (idx >= 0) {
    assert.equal(keys[idx + 1], 'flowtime', `${file}: flowtime keys are not contiguous after "overtime"`);
  }
  if (!isEnglish) {
    for (const k of NEW_KEYS) {
      assert.notEqual(data[k], en[k],
        `${file}: "${k}" must be a real translation, not left equal to the English source`);
    }
    checked++;
  }
  // Placeholders (%s) must be preserved exactly, translated prose only.
  assert.ok(data['flow-interruptions'].includes('%s'),
    `${file}: flow-interruptions must keep the %s placeholder`);
}
assert.ok(checked > 225, `expected to verify real translations for 225+ non-English locales, got ${checked}`);

console.log(`flowtimeSession: all assertions passed (${checked} locales verified with real translations)`);
