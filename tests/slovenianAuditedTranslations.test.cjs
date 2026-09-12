'use strict';
const assert = require('node:assert/strict');
for (const locale of ['sl', 'sl_SI']) {
  const data = require(`../imports/i18n/data/${locale}.i18n.json`);
  for (const key of ['Cube-Grid', 'Double-Bounce', 'MongoDB_storage_engine', 'Node_heap_does_zap_garbage', 'Node_heap_heap_size_limit', 'Node_heap_malloced_memory', 'Node_heap_number_of_detached_contexts', 'Node_heap_number_of_native_contexts']) assert.doesNotMatch(data[key], /[А-Яа-яЁё]/);
  assert.match(data['Double-Bounce'], /dvojnim odskakovanjem/);
  assert.doesNotMatch(data['Double-Bounce'], /tri pike/);
  assert.match(data['Node_heap_does_zap_garbage'], /bitnim vzorcem/);
  assert.doesNotMatch(data['Node_heap_does_zap_garbage'], /zbiranje smeti/);
  assert.match(data['Node_heap_malloced_memory'], /funkcijo malloc/);
  assert.match(data['Node_heap_number_of_detached_contexts'], /ločenih kontekstov/);
  assert.match(data['Node_heap_number_of_native_contexts'], /izvornih kontekstov/);
  assert.equal(data.MongoDB_storage_engine, 'Shranjevalni pogon MongoDB');
}
console.log('slovenianAuditedTranslations: both locales, spinner and memory meanings passed');
