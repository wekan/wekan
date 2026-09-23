const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'models/lib/multilineTitles.js'), 'utf8');
const helpers = import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));

test('one title preserves line breaks; separate titles ignore blank lines and normalize CRLF', async () => {
  const { creationTitles, splitTitleLines } = await helpers;
  assert.deepEqual(creationTitles('  Alpha\r\n\r\nBeta  '), ['Alpha\n\nBeta']);
  assert.deepEqual(creationTitles('  Alpha\r\n\r\nBeta  ', true), ['Alpha', 'Beta']);
  assert.deepEqual(splitTitleLines('A\rB\nC\r\nD'), ['A', 'B', 'C', 'D']);
  assert.deepEqual(creationTitles(' \n\t ', true), []);
  assert.deepEqual(creationTitles(' \n\t '), []);
  assert.deepEqual(creationTitles('<script>x</script>\n[Label] title', true), ['<script>x</script>', '[Label] title']);
});
test('batch positions preserve pasted order at top, bottom, between neighbours and on empty boards', async () => {
  const { titleSortIndexes } = await helpers;
  for (const [prev, next] of [[null, null], [null, -2], [5, null], [-2, -1], [0, 1]]) {
    const indexes = titleSortIndexes(prev, next, 4);
    assert.equal(new Set(indexes).size, 4);
    assert.deepEqual([...indexes].sort((a, b) => a - b), indexes);
    if (prev !== null) assert.ok(indexes.every(i => i > prev));
    if (next !== null) assert.ok(indexes.every(i => i < next));
  }
  assert.deepEqual(titleSortIndexes(0, 1, 0), []);
});
test('all creation paths share the choice; editing names uses textareas', () => {
  for (const file of ['boards/boardHeader', 'lists/listBody', 'lists/listHeader', 'swimlanes/swimlanes', 'swimlanes/swimlaneHeader']) {
    assert.match(fs.readFileSync(path.join(root, `client/components/${file}.jade`), 'utf8'), /\+multilineTitleChoice/);
    assert.match(fs.readFileSync(path.join(root, `client/components/${file}.js`), 'utf8'), /titlesFromComposer/);
  }
  for (const file of ['lists/listHeader', 'swimlanes/swimlaneHeader']) {
    const jade = fs.readFileSync(path.join(root, `client/components/${file}.jade`), 'utf8');
    assert.match(jade, /textarea\.list-name-input/);
    assert.doesNotMatch(jade, /input\.(?:list|swimlane)-name-input/);
  }
});

test('the choice is always visible with isolated radio groups and a one-item default', () => {
  const jade = fs.readFileSync(path.join(root, 'client/components/forms/multilineTitleChoice.jade'), 'utf8');
  const js = fs.readFileSync(path.join(root, 'client/components/forms/multilineTitleChoice.js'), 'utf8');
  assert.doesNotMatch(jade, /if multiple|select\./);
  assert.match(jade, /value="one" checked/);
  assert.match(jade, /value="separate"/);
  assert.match(js, /Random.id\(\)/);
  assert.match(js, /js-multiline-title-mode:checked/);
});

test('board batches serialize creation, share settings and reject overlapping or empty submissions', async () => {
  const vm = require('node:vm');
  const src = fs.readFileSync(path.join(root, 'client/components/boards/boardHeader.js'), 'utf8');
  const fn = src.slice(src.indexOf('async function createBoardSubmit('), src.indexOf('async function createOneBoard('));
  const calls = [], navigations = [], stars = [];
  const session = new Map([['createBoardAsTemplate', true], ['createBoardInWorkspace', 'workspace']]);
  const button = { disabled: false };
  const input = { value: 'First\nSecond' };
  const event = { preventDefault() {}, currentTarget: { querySelector: s => s === '[type=submit]' ? button : input } };
  let id = null, release;
  const waiting = new Promise(resolve => { release = resolve; });
  const owner = { boardId: { get: () => id } };
  const context = vm.createContext({
    titlesFromComposer: el => el.value.trim() ? el.value.split('\n') : [],
    Session: { get: k => session.get(k), set: (k,v) => session.set(k,v) },
    createOneBoard: async (_owner,title,template,workspace) => {
      calls.push({ title, template, workspace }); await waiting; id = title;
    },
    Meteor: { callAsync: async (_method, boardId) => stars.push(boardId) },
    FlowRouter: { go: (_route, args) => navigations.push(args) },
    getSlug: s => s.toLowerCase(), console, window: { alert: msg => assert.fail(msg) },
  });
  vm.runInContext(fn, context);
  const running = context.createBoardSubmit(owner, event, true);
  assert.equal(button.disabled, true);
  await context.createBoardSubmit(owner, event, true);
  assert.equal(calls.length, 1);
  release(); await running;
  assert.deepEqual(calls.map(c => c.title), ['First', 'Second']);
  assert.ok(calls.every(c => c.template && c.workspace === 'workspace'));
  assert.deepEqual(stars, ['First', 'Second']);
  assert.equal(navigations.length, 1);
  assert.equal(navigations[0].id, 'Second');
  assert.equal(button.disabled, false);
  input.value = '  ';
  await context.createBoardSubmit(owner, event);
  assert.equal(calls.length, 2);
});

function validateCreationLabels(strings, english, isEnglish, name) {
  for (const key of ['add-many-lines-as', 'many-items']) {
    assert.equal(typeof strings[key], 'string', `${name}: ${key}`);
    assert.ok(strings[key].trim(), `${name}: ${key}`);
    assert.deepEqual(strings[key].match(/__[^\s]+?__|%(?:\d+\$)?[A-Za-z]/g) || [],
      english[key].match(/__[^\s]+?__|%(?:\d+\$)?[A-Za-z]/g) || [], `${name}: ${key} tokens`);
    if (isEnglish) assert.equal(strings[key], english[key], name);
    else assert.notEqual(strings[key], english[key], `${name}: ${key} untranslated`);
  }
}

test('creation labels are translated with exact tokens and key order in every locale', async () => {
  const directory = path.join(root, 'imports/i18n/data');
  const english = JSON.parse(fs.readFileSync(path.join(directory, 'en.i18n.json'), 'utf8'));
  const i18n = require('i18next').createInstance();
  await i18n.init({ lng: 'test', fallbackLng: false,
    interpolation: { prefix: '__', suffix: '__', escapeValue: false } });
  for (const name of fs.readdirSync(directory).filter(n => n.endsWith('.i18n.json'))) {
    const strings = JSON.parse(fs.readFileSync(path.join(directory, name), 'utf8'));
    validateCreationLabels(strings, english, /^en(?:[-_.])/.test(name), name);
    assert.deepEqual(Object.keys(strings), Object.keys(english), name);
    i18n.addResourceBundle('test', 'translation', strings, true, true);
    for (const noun of ['boards', 'cards', 'lists', 'swimlanes']) {
      assert.equal(i18n.t('many-items', { items: i18n.t(noun) }),
        strings['many-items'].replace('__items__', strings[noun]), `${name}: ${noun}`);
    }
  }
});

test('creation translation validation rejects fallbacks and damaged interpolation', () => {
  const english = { 'add-many-lines-as': 'Add many lines as:', 'many-items': 'Many __items__' };
  const translated = { 'add-many-lines-as': 'Lisää useita rivejä muodossa:', 'many-items': '__items__ (useita)' };
  for (const bad of ['', 'Many __items__', 'Useita', '__kohteet__', '__items__ __items__', '__items__ %s']) {
    assert.throws(() => validateCreationLabels({ ...translated, 'many-items': bad }, english, false, 'fi'));
  }
  assert.throws(() => validateCreationLabels({ ...translated, 'add-many-lines-as': english['add-many-lines-as'] }, english, false, 'fi'));
});
