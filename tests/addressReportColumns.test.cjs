'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { addressReportColumns } = require('../models/lib/addressReportColumns');

const columns = addressReportColumns({ map: true });
assert.deepEqual(columns.map(column => column.labelKey || column.label),
  ['event-ipv4', 'location', 'event-ipv6', 'IPv6 location']);

const v4 = { ipv4: '203.0.113.4', location: { country: 'FI', city: 'Helsinki',
  latitude: 60.17, longitude: 24.94 } };
assert.deepEqual(columns.map(column => column.value(v4)),
  ['203.0.113.4', 'Helsinki, FI', '', '']);
assert.equal(columns[1].flag(v4), '🇫🇮');
assert.equal(columns[3].flag(v4), '');
assert.deepEqual(columns[1].location(v4),
  { latitude: 60.17, longitude: 24.94, label: 'Helsinki, FI' });
assert.equal(columns[3].location(v4), null);

const v6 = { ipv6: '2001:db8::4', location: { country: 'SE', city: 'Stockholm' } };
assert.deepEqual(columns.map(column => column.value(v6)),
  ['', '', '2001:db8::4', 'Stockholm, SE']);
assert.equal(columns[1].flag(v6), '');
assert.equal(columns[3].flag(v6), '🇸🇪');

const dual = { ipv4: '203.0.113.5', ipv6: '2001:db8::5',
  ipv4Location: { country: 'FI', city: 'Turku' },
  ipv6Location: { country: 'SE', city: 'Uppsala' } };
assert.deepEqual(columns.map(column => column.value(dual)),
  ['203.0.113.5', 'Turku, FI', '2001:db8::5', 'Uppsala, SE']);
assert.equal(columns[1].flag(dual), '🇫🇮');
assert.equal(columns[3].flag(dual), '🇸🇪');

const old = { ip: '::ffff:203.0.113.9', location: { country: 'GB', city: 'London' } };
assert.deepEqual(columns.map(column => column.value(old)),
  ['203.0.113.9', 'London, GB', '', '']);
assert.deepEqual(columns.map(column => column.value({ ipv4: '203.0.113.4' })),
  ['203.0.113.4', '', '', '']);

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const admin = read('client/components/settings/adminProblems.js');
const people = read('client/components/settings/peopleBody.js');
assert.equal((admin.match(/\.\.\.addressReportColumns\(\)/g) || []).length, 3,
  'API, event and Recovery tables use the same four columns');
assert.match(admin, /\.\.\.addressReportColumns\(\{ map: true \}\)/,
  'Offices keeps map links for its location cells');
assert.match(people, /\.\.\.addressReportColumns\(\)/,
  'People login locations use the same four columns');
console.log('Address report columns: four-column order, IPv4/IPv6 attribution, legacy IP, empty location and all report wiring pass.');
