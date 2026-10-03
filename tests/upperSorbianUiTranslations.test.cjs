'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const en = read('en');
const keys = [
  "import-board-instruction-leo",
  "instance",
  "instance-desc",
  "board-instance-info",
  "automatic-linked-url-schemes-hint",
  "other-parent-cards",
  "add-parent-card",
  "remove-parent-card",
  "r-when-card-date",
  "r-trigger-vars-hint",
  "r-insert-variable",
  "r-vars-people-hint",
  "r-rule-any-trigger-help",
  "r-add-trigger-to-rule",
  "r-add-action-to-rule",
  "r-remove-rule-part",
  "notification-activity-heading",
  "notification-activity-description",
  "notification-activity-labels",
  "notification-activity-members",
  "notification-activity-assignees",
  "notification-activity-comments",
  "notification-activity-moves",
  "notification-activity-dates",
  "notification-activity-checklists",
  "notification-activity-attachments",
  "notification-activity-customFields",
  "notification-activity-archive",
  "notification-activity-created",
  "due-reminder-heading",
  "due-reminder-days-label",
  "due-reminder-off",
  "due-reminder-webhook",
  "due-reminder-invalid",
  "due-reminder-saved",
  "dependency-type-duplicates",
  "dependency-type-is-duplicated-by",
  "custom-field-stringtemplate-context-hint",
  "filter-presets",
  "filter-preset-choose",
  "filter-preset-name",
  "filter-preset-save",
  "filter-preset-replace-hint",
  "filter-preset-saved",
  "filter-preset-applied",
  "filter-preset-deleted",
  "filter-preset-error",
  "filter-card-text-label",
  "import-report-heading",
  "import-report-description",
  "import-report-open-board",
  "draggable",
  "board-view-map",
  "map-view-empty",
  "map-view-upload",
  "map-view-remove-image",
  "map-view-unplaced",
  "map-view-place-hint",
  "map-view-all-placed",
  "saml-login-not-started",
  "move-selection-before",
  "move-selection-after",
  "history-request-pending-undo",
  "history-request-pending-redo",
  "history-request-hint",
  "history-request-retry",
  "history-request-forget"
];
for (const code of ['hsb', 'szl', 'wuu-Hans']) {
const locale = read(code);
assert.deepEqual(Object.keys(locale), Object.keys(en));
for (const key of keys) {
 assert.ok(locale[key]?.trim(), key);
 assert.notEqual(locale[key], en[key], `${key}: translated`);
 assert.deepEqual(translationTokens(locale[key]), translationTokens(en[key]), `${key}: exact placeholders`);
 assert.deepEqual(locale[key].match(/\d+/g), en[key].match(/\d+/g), `${key}: numeric limits`);
 assert.deepEqual(locale[key].match(/\{[^}]+\}/g), en[key].match(/\{[^}]+\}/g), `${key}: literal rule variables`);
 assert.deepEqual(locale[key].match(/<[^>]+>/g), en[key].match(/<[^>]+>/g), `${key}: markup`);
}
if (code === 'hsb') {
assert.match(locale['instance-desc'], /Njepřizjewjenym.*ženje njepokazuje/);
assert.match(locale['instance-desc'], /Jenož wosoby.*tafli přidate.*wobdźěłać/);
assert.match(locale['automatic-linked-url-schemes-hint'], /javascript, data, vbscript.*ženje njewotkazuja/);
assert.match(locale['notification-activity-description'], /Dopomnjeća.*@zmjenki přeco dóńdu/);
assert.match(locale['filter-preset-replace-hint'], /Priwatne.*samsnym mjenom je naruna/);
assert.match(locale['history-request-hint'], /samsne naprašowanje.*njemóže ženje druhu změnu cofnyć/);
assert.match(locale['saml-login-not-started'], /njeje so w tutym rajtarku/);
assert.notEqual(locale['move-selection-before'], locale['move-selection-after']);
assert.notEqual(locale['dependency-type-duplicates'], locale['dependency-type-is-duplicated-by']);
} else if (code === 'szl') {
 assert.match(locale['instance-desc'], /Nigdy niy je pokŏzowanŏ niyzalogowanym/);
 assert.match(locale['instance-desc'], /Ino ôsoby dodane do tabule mogōm edytować/);
 assert.match(locale['automatic-linked-url-schemes-hint'], /javascript, data, vbscript.*nigdy niy sōm linkowane/);
 assert.match(locale['notification-activity-description'], /Przipōmniynia.*@wspōmnienia przichodzōm zawdy/);
 assert.match(locale['filter-preset-replace-hint'], /Prywatne.*tym samym mianym zastympuje/);
 assert.match(locale['history-request-hint'], /to samo żōndanie.*nigdy niy może cofnōńć drugij zmiany/);
 assert.match(locale['saml-login-not-started'], /niy było zaczynte we tyj karcie/);
 assert.notEqual(locale['move-selection-before'], locale['move-selection-after']);
 assert.notEqual(locale['dependency-type-duplicates'], locale['dependency-type-is-duplicated-by']);
 } else {
 assert.match(locale['instance-desc'], /呒没登录个人绝勿会看到伊/);
 assert.match(locale['instance-desc'], /只有加到看板里个人才好修改/);
 assert.match(locale['automatic-linked-url-schemes-hint'], /javascript、data、vbscript.*绝勿会变成链接/);
 assert.match(locale['notification-activity-description'], /到期提醒搭 @提及总归会送到/);
 assert.match(locale['filter-preset-replace-hint'], /只有侬自己好用.*同样个名字.*替换/);
 assert.match(locale['history-request-hint'], /同一个请求.*绝勿会再撤销第二趟改动/);
 assert.match(locale['saml-login-not-started'], /勿是从浏览器搿个标签页开始个/);
 assert.notEqual(locale['move-selection-before'], locale['move-selection-after']);
 assert.notEqual(locale['dependency-type-duplicates'], locale['dependency-type-is-duplicated-by']);
}
}
console.log('Upper Sorbian, Silesian and Wu UI translations: 67 messages each passed');
