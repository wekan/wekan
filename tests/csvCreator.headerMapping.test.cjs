/**
 * Test: CSV import header mapping
 *
 * Covers models/csvCreator.js CsvCreator#mapHeadertoCardFieldIndex(), the
 * logic that turns a CSV/TSV header row into the field index the rest of
 * the importer uses to read each card row.
 *
 * models/csvCreator.js imports Meteor/model modules and can't run under
 * plain Node, so — following the convention of tests/trelloCreator.import.test.js
 * and the sibling wekanCreator.*.test.js files — this test re-implements the
 * mapping logic as a faithful copy of the production code and exercises it
 * directly. Failures throw (assert), so a regression exits non-zero.
 */

const assert = require('assert');

// --- Faithful copy of CsvCreator#mapHeadertoCardFieldIndex ----------------
function mapHeadertoCardFieldIndex(headerRow) {
  const index = {};
  index.customFields = [];
  for (let i = 0; i < headerRow.length; i++) {
    // #6620: a sparse/short CSV row can hand back undefined/null/a number for
    // a cell instead of a string - guard so an odd header is skipped instead
    // of throwing "toLowerCase is not a function".
    const header = typeof headerRow[i] === 'string' ? headerRow[i] : '';
    switch (header.trim().toLowerCase()) {
      case 'title':
        index.title = i;
        break;
      case 'description':
        index.description = i;
        break;
      case 'stage':
      case 'status':
      case 'state':
        index.stage = i;
        break;
      case 'owner':
        index.owner = i;
        break;
      case 'members':
      case 'member':
        index.members = i;
        break;
      case 'labels':
      case 'label':
        index.labels = i;
        break;
      case 'due date':
      case 'deadline':
      case 'due at':
        index.dueAt = i;
        break;
      case 'start date':
      case 'start at':
        index.startAt = i;
        break;
      case 'finish date':
      case 'end at':
        index.endAt = i;
        break;
      case 'creation date':
      case 'created at':
        index.createdAt = i;
        break;
      case 'update date':
      case 'updated at':
      case 'modified at':
      case 'modified on':
        index.modifiedAt = i;
        break;
    }
    if (header.toLowerCase().startsWith('customfield')) {
      if (header.split('-')[2] === 'dropdown' || header.split('-')[2] === 'dropdownMultiSelect') {
        index.customFields.push({
          name: header.split('-')[1],
          type: header.split('-')[2],
          options: header.split('-')[3].split('/'),
          position: i,
        });
      } else if (header.split('-')[2] === 'currency') {
        index.customFields.push({
          name: header.split('-')[1],
          type: header.split('-')[2],
          currencyCode: header.split('-')[3],
          position: i,
        });
      } else {
        index.customFields.push({
          name: header.split('-')[1],
          type: header.split('-')[2],
          position: i,
        });
      }
    }
  }
  return index;
}

// --- Tests ------------------------------------------------------------

// 1. Standard headers, case-insensitive, whitespace-tolerant.
{
  const index = mapHeadertoCardFieldIndex([
    ' Title ', 'Description', 'STATUS', 'Owner', 'Member', 'Label',
    'Due Date', 'Start Date', 'Finish Date', 'Created At', 'Updated At',
  ]);
  assert.strictEqual(index.title, 0);
  assert.strictEqual(index.description, 1);
  assert.strictEqual(index.stage, 2);
  assert.strictEqual(index.owner, 3);
  assert.strictEqual(index.members, 4);
  assert.strictEqual(index.labels, 5);
  assert.strictEqual(index.dueAt, 6);
  assert.strictEqual(index.startAt, 7);
  assert.strictEqual(index.endAt, 8);
  assert.strictEqual(index.createdAt, 9);
  assert.strictEqual(index.modifiedAt, 10);
}

// 2. Header aliases resolve to the same field.
{
  const index1 = mapHeadertoCardFieldIndex(['stage']);
  const index2 = mapHeadertoCardFieldIndex(['state']);
  assert.strictEqual(index1.stage, 0);
  assert.strictEqual(index2.stage, 0);

  const dl = mapHeadertoCardFieldIndex(['deadline']);
  assert.strictEqual(dl.dueAt, 0);

  const modOn = mapHeadertoCardFieldIndex(['modified on']);
  assert.strictEqual(modOn.modifiedAt, 0);
}

// 3. Unknown headers are ignored, not fatal.
{
  const index = mapHeadertoCardFieldIndex(['title', 'Some Unknown Column']);
  assert.strictEqual(index.title, 0);
  assert.strictEqual(index.customFields.length, 0);
}

// 4. customfield-<name>-plaintext-... plain custom field.
{
  const index = mapHeadertoCardFieldIndex(['customfield-Budget-text']);
  assert.strictEqual(index.customFields.length, 1);
  assert.deepStrictEqual(index.customFields[0], {
    name: 'Budget',
    type: 'text',
    position: 0,
  });
}

// 5. customfield-<name>-dropdown-<opt1/opt2> dropdown custom field.
{
  const index = mapHeadertoCardFieldIndex(['customfield-Priority-dropdown-Low/Medium/High']);
  assert.strictEqual(index.customFields.length, 1);
  assert.deepStrictEqual(index.customFields[0], {
    name: 'Priority',
    type: 'dropdown',
    options: ['Low', 'Medium', 'High'],
    position: 0,
  });
}

// 6. customfield-<name>-dropdownMultiSelect-<opt1/opt2> variant.
{
  const index = mapHeadertoCardFieldIndex(['customfield-Tags-dropdownMultiSelect-A/B/C']);
  assert.strictEqual(index.customFields[0].type, 'dropdownMultiSelect');
  assert.deepStrictEqual(index.customFields[0].options, ['A', 'B', 'C']);
}

// 7. customfield-<name>-currency-<code> currency custom field.
{
  const index = mapHeadertoCardFieldIndex(['customfield-Cost-currency-USD']);
  assert.strictEqual(index.customFields.length, 1);
  assert.deepStrictEqual(index.customFields[0], {
    name: 'Cost',
    type: 'currency',
    currencyCode: 'USD',
    position: 0,
  });
}

// 8. Multiple custom fields keep their own position and order.
{
  const index = mapHeadertoCardFieldIndex([
    'title', 'customfield-Cost-currency-EUR', 'customfield-Priority-dropdown-Low/High',
  ]);
  assert.strictEqual(index.title, 0);
  assert.strictEqual(index.customFields.length, 2);
  assert.strictEqual(index.customFields[0].position, 1);
  assert.strictEqual(index.customFields[1].position, 2);
}

// 9. #6620: undefined/null/number cells (a sparse row) do not throw and are
// simply skipped rather than mapped to a field.
{
  const index = mapHeadertoCardFieldIndex(['title', undefined, null, 42]);
  assert.strictEqual(index.title, 0);
  assert.strictEqual(index.customFields.length, 0);
  assert.doesNotThrow(() => mapHeadertoCardFieldIndex([undefined, null, 42, 'title']));
}

console.log('ok - csvCreator header mapping tests passed');
