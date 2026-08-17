'use strict';

const assert = require('assert');
const {
  buildExportCardDocument,
  formatExportFileSize,
} = require('../models/lib/cardExportDocument');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const data = {
  board: { title: 'Board', labels: [{ _id: 'l1', name: 'Urgent', color: 'red' }] },
  swimlane: { title: 'Lane' },
  list: { title: 'Doing' },
  card: {
    title: 'Card', userId: 'u1', members: ['u2'], assignees: ['u3'],
    requesters: ['u4'], assigners: ['u5'], labelIds: ['l1'], cardNumber: 7,
    createdAt: new Date('2026-08-17T10:00:00Z'), description: 'Text',
    customFields: [{ _id: 'cf1', value: 'v1' }],
  },
  checklists: [{ _id: 'cl1', title: 'Steps' }],
  checklistItems: [{ _id: 'ci1', checklistId: 'cl1', title: 'One' }],
  comments: [{ userId: 'u2', text: 'Comment' }],
  attachments: [{ _id: 'a1', name: 'photo.png', size: 2097152, userId: 'u3' }],
  images: [{ name: 'photo.png', data: Buffer.from('image') }],
  customFieldsById: { cf1: { _id: 'cf1', name: 'Field' } },
};
const options = {
  fields: ['labels', 'people', 'board-info', 'dates', 'description',
    'custom-fields', 'checklists', 'comments', 'attachments'],
  userName: id => ({ u1: 'Creator', u2: 'Member', u3: 'Assignee',
    u4: 'Requester', u5: 'Assigner' })[id] || id,
  formatDate: value => value ? 'formatted-date' : '',
  customFieldValue: (definition, value) => `${definition.name}: ${value}`,
  translate: (key, fallback) => fallback || key,
};

test('one adapter builds the complete medium-independent document', () => {
  const document = buildExportCardDocument(data, options);
  const sections = document.filter(block => block.type === 'section').map(block => block.key);
  assert.deepStrictEqual(sections,
    ['description', 'custom-fields', 'checklists', 'comments', 'attachments']);
  const text = JSON.stringify(document);
  for (const value of ['Board', 'Lane', 'Doing', 'Creator', 'Member', 'Assignee',
    'Requester', 'Assigner', 'Urgent', 'formatted-date', 'photo.png', '2.0 MB']) {
    assert.ok(text.includes(value), `${value} is carried`);
  }
});

test('one field selection removes a section before either renderer sees it', () => {
  const document = buildExportCardDocument(data, { ...options, fields: ['description'] });
  const sections = document.filter(block => block.type === 'section').map(block => block.key);
  assert.deepStrictEqual(sections, ['description']);
});

test('file sizes are identical in PDF and Excel data', () => {
  assert.strictEqual(formatExportFileSize(0), '0 B');
  assert.strictEqual(formatExportFileSize(1024), '1.0 KB');
  assert.strictEqual(formatExportFileSize(2097152), '2.0 MB');
});

console.log(`\ncardExportDocument: ${passed} tests passed`);
