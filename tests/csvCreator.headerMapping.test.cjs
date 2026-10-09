/**
 * Test: CSV import header mapping
 *
 * Covers guessCsvMapping() and customFieldsOf() in
 * models/lib/csvImportMapping.js, the logic that turns a CSV/TSV header row
 * into the columns models/csvCreator.js reads each card row with when the
 * import page's mapping step was not used (a REST import, "Import many
 * boards"). This file used to test a copy of the creator's own header switch;
 * the logic now lives in a plain module, so the test runs the real code.
 * Failures throw (assert), so a regression exits non-zero.
 */

const assert = require('assert');

async function main() {
  const { guessCsvMapping, customFieldsOf } = await import('../models/lib/csvImportMapping.js');
  const columnsOf = header => guessCsvMapping(header).columns;

  // 1. Standard headers, case-insensitive, whitespace-tolerant.
  {
    const columns = columnsOf([
      ' Title ', 'Description', 'STATUS', 'Owner', 'Member', 'Label',
      'Due Date', 'Start Date', 'Finish Date', 'Created At', 'Updated At',
    ]);
    assert.strictEqual(columns.title, 0);
    assert.strictEqual(columns.description, 1);
    assert.strictEqual(columns.list, 2);
    assert.strictEqual(columns.owner, 3);
    assert.strictEqual(columns.members, 4);
    assert.strictEqual(columns.labels, 5);
    assert.strictEqual(columns.dueAt, 6);
    assert.strictEqual(columns.startAt, 7);
    assert.strictEqual(columns.endAt, 8);
    assert.strictEqual(columns.createdAt, 9);
    assert.strictEqual(columns.modifiedAt, 10);
  }

  // 2. Header aliases resolve to the same field.
  {
    for (const name of ['stage', 'state', 'status', 'List']) assert.strictEqual(columnsOf(['Title', name]).list, 1, name);
    assert.strictEqual(columnsOf(['Title', 'deadline']).dueAt, 1);
    assert.strictEqual(columnsOf(['Title', 'modified on']).modifiedAt, 1);
  }

  // 3. Unknown headers are not mapped, and not fatal.
  {
    const mapping = guessCsvMapping(['title', 'Some Unknown Column']);
    assert.deepStrictEqual(mapping.columns, { title: 0 });
    assert.strictEqual(customFieldsOf(['title', 'Some Unknown Column'], mapping).length, 0);
  }

  // 4. customfield-<name>-<type> plain custom field.
  {
    const header = ['Title', 'customfield-Budget-text'];
    assert.deepStrictEqual(customFieldsOf(header, guessCsvMapping(header)), [
      { name: 'Budget', type: 'text', position: 1 },
    ]);
  }

  // 5. customfield-<name>-dropdown-<opt1/opt2> dropdown custom field.
  {
    const header = ['Title', 'customfield-Priority-dropdown-Low/Medium/High'];
    assert.deepStrictEqual(customFieldsOf(header, guessCsvMapping(header)), [
      { name: 'Priority', type: 'dropdown', options: ['Low', 'Medium', 'High'], position: 1 },
    ]);
  }

  // 6. customfield-<name>-dropdownMultiSelect-<opt1/opt2> variant.
  {
    const header = ['Title', 'CustomField-Tags-dropdownMultiSelect-A/B/C'];
    const [field] = customFieldsOf(header, guessCsvMapping(header));
    assert.strictEqual(field.type, 'dropdownMultiSelect');
    assert.deepStrictEqual(field.options, ['A', 'B', 'C']);
  }

  // 7. customfield-<name>-currency-<code> currency custom field.
  {
    const header = ['Title', 'customfield-Cost-currency-USD'];
    assert.deepStrictEqual(customFieldsOf(header, guessCsvMapping(header)), [
      { name: 'Cost', type: 'currency', currencyCode: 'USD', position: 1 },
    ]);
  }

  // 8. Multiple custom fields keep their own position and order.
  {
    const header = ['title', 'customfield-Cost-currency-EUR', 'customfield-Priority-dropdown-Low/High'];
    const mapping = guessCsvMapping(header);
    assert.strictEqual(mapping.columns.title, 0);
    const fields = customFieldsOf(header, mapping);
    assert.deepStrictEqual(fields.map(f => f.position), [1, 2]);
  }

  // 9. #6620: undefined/null/number cells (a sparse row) do not throw and are
  // simply skipped rather than mapped to a field.
  {
    const mapping = guessCsvMapping(['title', undefined, null, 42]);
    assert.strictEqual(mapping.columns.title, 0);
    assert.strictEqual(Object.keys(mapping.columns).length, 1);
    assert.doesNotThrow(() => guessCsvMapping([undefined, null, 42, 'title']));
    assert.strictEqual(customFieldsOf(['title', undefined, null, 42], mapping).length, 0);
  }

  // 10. No title column: the first ordinary column is the title, so a list of
  // tasks under any heading imports; a known column is not taken for it.
  {
    assert.deepStrictEqual(columnsOf(['Status', 'Task to do']), { list: 0, title: 1 });
  }

  console.log('ok - csvCreator header mapping tests passed');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
