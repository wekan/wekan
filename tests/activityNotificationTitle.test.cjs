const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const sourcePath = path.join(
  root,
  'server',
  'lib',
  'activityNotificationTitle.js',
);
const source = fs
  .readFileSync(sourcePath, 'utf8')
  .replace('export const ACTIVITY_NOTIFICATION_TITLE',
    'const ACTIVITY_NOTIFICATION_TITLE')
  .replace('export function formatActivityNotificationTitle',
    'function formatActivityNotificationTitle')
  .concat('\nresult = { ACTIVITY_NOTIFICATION_TITLE, formatActivityNotificationTitle };');
const context = { result: null };
vm.runInNewContext(source, context, { filename: sourcePath });

const {
  ACTIVITY_NOTIFICATION_TITLE,
  formatActivityNotificationTitle,
} = context.result;

assert.equal(
  formatActivityNotificationTitle(
    ACTIVITY_NOTIFICATION_TITLE.BOARD,
    { board: 'Roadmap' },
    () => assert.fail('hardcoded board title must not use a translation'),
    'fi',
  ),
  'Roadmap',
);

assert.equal(
  formatActivityNotificationTitle(
    ACTIVITY_NOTIFICATION_TITLE.CARD,
    { board: 'Roadmap', card: 'Ship it' },
    () => assert.fail('hardcoded card title must not use a translation'),
    'fi',
  ),
  '[Roadmap] Ship it',
);

assert.equal(
  formatActivityNotificationTitle(
    ACTIVITY_NOTIFICATION_TITLE.CARD,
    { card: 'Ship it' },
    () => assert.fail('hardcoded card title must not use a translation'),
    'fi',
  ),
  'Ship it',
);

let fallbackArgs;
assert.equal(
  formatActivityNotificationTitle(
    'act-atUserComment',
    { atUsername: 'xet7' },
    (...args) => {
      fallbackArgs = args;
      return 'translated';
    },
    'fi',
  ),
  'translated',
);
assert.deepEqual(fallbackArgs, [
  'act-atUserComment',
  { atUsername: 'xet7' },
  'fi',
]);

const localeFiles = fs
  .readdirSync(path.join(root, 'imports', 'i18n', 'data'))
  .filter(file => file.endsWith('.i18n.json'));

for (const file of localeFiles) {
  const messages = JSON.parse(fs.readFileSync(
    path.join(root, 'imports', 'i18n', 'data', file),
    'utf8',
  ));
  assert.equal(
    Object.hasOwn(messages, 'act-withBoardTitle'),
    false,
    `${file} must not expose the hardcoded board-title layout to translators`,
  );
  assert.equal(
    Object.hasOwn(messages, 'act-withCardTitle'),
    false,
    `${file} must not expose the hardcoded card-title layout to translators`,
  );
}

console.log(`activityNotificationTitle: ${localeFiles.length} locales passed`);
