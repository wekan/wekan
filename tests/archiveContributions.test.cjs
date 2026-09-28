'use strict';
const assert = require('node:assert/strict');
const { archiveYear, archiveContributions } = require('../models/lib/archiveContributions');
for (const invalid of [null, {}, [], true, 0, 1899, 9999, 2024.5, 'x', Infinity]) {
  assert.throws(() => archiveYear(invalid), /Invalid archive year/);
}
assert.equal(archiveYear(undefined, new Date('2024-12-31T23:59Z')), 2024);
const report = archiveContributions(2024, [{ _id: '__proto__', name: '<b>Label</b>', color: '#abcdef' },
  { _id: 'bad', name: 'Bad color', color: 'red;position:fixed' }]);
const card = { archived: true, archivedAt: new Date('2024-02-29T23:59:59Z'), labelIds: ['__proto__', '__proto__', 'missing'] };
report.add(card);
report.add({ ...card, labelIds: ['bad'] });
for (const archivedAt of [new Date('2023-12-31T23:59:59Z'), new Date('2025-01-01'), new Date('bad'), undefined, '2024-02-29']) report.add({ ...card, archivedAt });
report.add({ ...card, archived: false });
const data = report.result();
assert.equal(data.days.length, 366);
assert.equal(data.days.reduce((sum, day) => sum + day.count, 0), 2);
assert.deepEqual(data.days.find(day => day.date === '2024-02-29'), { date: '2024-02-29', count: 2, level: 2,
  labels: [{ name: '<b>Label</b>', color: '#abcdef' }, { name: 'Bad color', color: 'gray' }] });
assert.equal(archiveContributions(2023).result().days.length, 365);
for (let i = 0; i < 30; i++) report.add(card);
assert.equal(report.result().days.find(day => day.count).level, 4);
console.log('archiveContributions: UTC boundaries, leap days, archive lifecycle, labels, intensity and invalid input passed');
