'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
const fi = JSON.parse(read('imports/i18n/data/fi.i18n.json'));

// Load the dependency-free ES module through a data URL, as the existing Node
// suites do for pure model helpers without asking Meteor to boot.
const moduleSource = read('models/lib/ruleDescriptionLocalization.js');

(async () => {
  const encoded = Buffer.from(moduleSource).toString('base64');
  const { localizeStoredRuleDescription } = await import(
    `data:text/javascript;base64,${encoded}`
  );
  const translations = Object.keys(en)
    .filter(key => key.startsWith('r-'))
    .map(key => ({ source: en[key], translated: fi[key] }));

  assert.strictEqual(
    localizeStoredRuleDescription('Move card to top of its list', translations),
    fi['r-d-move-to-top-gen'],
    'a whole action uses its natural Finnish sentence',
  );
  assert.strictEqual(localizeStoredRuleDescription('by', translations), fi['r-by'],
    'the current human translation remains authoritative');
  // Pin the grammar used by the boundary examples independently of future
  // Transifex wording; these assertions test replacement boundaries, not a
  // translator's choice of the Finnish rendering of the ambiguous word 'by'.
  const fragmentTranslations = [...translations, { source: 'by', translated: 'tekijänä' }];
  assert.strictEqual(
    localizeStoredRuleDescription(
      'when a card is moved to archive by *',
      fragmentTranslations,
    ),
    'kun kortti on siirretty arkistoon tekijänä *',
    'an assembled legacy trigger is translated piece by piece',
  );
  assert.strictEqual(
    localizeStoredRuleDescription('when a card is moved by byron', fragmentTranslations),
    'kun kortti on siirretty tekijänä byron',
    'a short rule word is translated without changing a username containing it',
  );
  assert.strictEqual(localizeStoredRuleDescription('', translations), '',
    'an absent legacy description remains harmless');
  assert.strictEqual(localizeStoredRuleDescription('Custom opaque value', []),
    'Custom opaque value', 'unknown imported prose is preserved');

  const details = read('client/components/rules/ruleDetails.js');
  assert.match(details, /getDefaultTranslations\('r-'\)/,
    'rule details use the complete canonical rule vocabulary');
  assert.match(details, /localizeStoredRuleDescription\(description, translations\)/,
    'both trigger and action pass through the common localizer');

  const tap = read('imports/i18n/tap.js');
  assert.match(tap, /getDefaultTranslations\(prefix = ''\)/,
    'the canonical English source is exposed without another static data import');

  console.log('ruleDetailsLocalization: Finnish legacy descriptions passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
