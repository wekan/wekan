'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const i18next = require('i18next');
const sprintf = require('i18next-sprintf-postprocessor');
const root = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/mk.i18n.json'), 'utf8'));
(async () => {
  const translator = i18next.createInstance().use(sprintf);
  await translator.init({ lng: 'mk', fallbackLng: false, keySeparator: false,
    interpolation: { prefix: '__', suffix: '__', escapeValue: false },
    resources: { mk: { translation: data } }, postProcess: ['sprintf'] });
  assert.equal(translator.t('act-a-endAt', { timeValue: 'NEW_TIME', timeOldValue: 'OLD_TIME' }),
    'го промени времето на завршување во NEW_TIME од (OLD_TIME)');
  assert.equal(translator.t('activity-added-label', { sprintf: ['LABEL', 'CARD'] }),
    'додаде ознака «LABEL» на CARD');
  assert.equal(translator.t('activity-dueDate', { sprintf: ['DATE', 'CARD'] }),
    'го промени рокот во DATE на картата CARD');
  for (const [key, phrase] of [['activity-endDate', 'датумот на завршување'],
    ['activity-receivedDate', 'датумот на прием'], ['activity-startDate', 'датумот на почеток']]) {
    assert.equal(translator.t(key, { sprintf: ['DATE', 'CARD'] }), `го промени ${phrase} во DATE на картата CARD`);
  }
  assert.match(data['admin-people-filter-inactive'], /Неактивни/);
  assert.doesNotMatch(data['admin-people-user-active'], /платном|платен/);
  assert.equal(translator.t('activity-checklist-uncompleted', { sprintf: ['CHECKLIST', 'CARD'] }),
    'го поништи завршувањето на списокот за проверка CHECKLIST на CARD');
  assert.match(data['act-newDue'], /првата потсетница/);
  assert.match(data['act-removeChecklist'], /го отстрани списокот за проверка/);
  assert.doesNotMatch(data['act-removeChecklist'], /елемент|ставка/);
  assert.match(data['act-atUserComment'], /ве спомена/);
  assert.match(data['globalSearch-instructions-notes-2'], /\*ИЛИ\*/);
  assert.match(data['globalSearch-instructions-notes-3'], /\*И\*/);
  assert.match(data['globalSearch-instructions-notes-4'], /не разликуваат мали и големи букви/);
  assert.match(data['globalSearch-instructions-notes-3'], /`__operator_list__:Available __operator_label__:red`/);
  assert.match(data['globalSearch-instructions-operator-at'], /`__operator_user_abbrev__username`/);
  assert.match(data['globalSearch-instructions-operator-has'], /`has:-due`/);
  assert.doesNotMatch(data['globalSearch-instructions-operator-has'], /има:-/);
  assert.match(data['globalSearch-instructions-operator-label'], /бојата .* или името/);
  assert.match(data['globalSearch-instructions-status-ended'], /со датум на завршување/);
  assert.doesNotMatch(data['globalSearch-instructions-status-ended'], /окончани|завршени карти/);
  assert.match(data['globalSearch-instructions-status-private'], /само во приватни табли/);
  assert.match(data['globalSearch-instructions-status-public'], /само во јавни табли/);
  assert.match(data['hideCheckedChecklistItems'], /означените ставки/);
  assert.match(data['import-board-instruction-wekan'], /'Извези табла'/);
  assert.doesNotMatch(data['import-board-instruction-wekan'], /Унеси|Увези/);
  for (const menu of ['Menu', 'More', 'Print and Export', 'Export JSON']) {
    assert.ok(data['import-board-instruction-trello'].includes(`'${menu}'`));
  }
  assert.match(data['invite-people-success'], /регистрација/);
  assert.match(data['import-members-map-note'], /тековниот корисник/);
  assert.match(data['keyboard-shortcuts-disabled'], /Кликнете за да ги овозможите/);
  assert.match(data['keyboard-shortcuts-enabled'], /Кликнете за да ги оневозможите/);
  assert.match(data['list-delete-pop'], /нема да можете да го вратите списокот/);
  assert.match(data['list-delete-pop'], /не може да се поништи/);
  assert.match(data['last-admin-desc'], /барем еден администратор/);
  assert.equal(translator.t('list-title-not-found', { sprintf: ['LIST'] }), "Списокот 'LIST' не е пронајден.");
  assert.match(data['migration-cpu-threshold-description'], /надмине овој процент \(10-90\)/);
  assert.match(data['migration-batch-size-description'], /\(1-100\)/);
  assert.match(data['migration-delay-ms-description'], /\(100-10000\)/);
  assert.match(data['migration-info-text'], /продолжува во заднина дури и ако го затворите прелистувачот/);
  assert.match(data['migration-warning-text'], /Не го затворајте прелистувачот/);
  assert.match(data['migrations-admin-only'], /^Само администраторите на таблата/);
  for (const key of ['migrate-all-to-s3', 'move-all-attachments-of-board-to-s3']) {
    assert.match(data[key], /S3/);
    assert.doesNotMatch(data[key], /Amazon|облак/);
  }
  assert.match(data['normal-assigned-only-desc'], /^Видливи се само доделените карти/);
  assert.doesNotMatch(data['normal-assigned-only-desc'], /сите карти|пуна права/);
  assert.match(data['normal-desc'], /Не може да ги менува поставките/);
  assert.match(data['notify-participate'], /создавач или член/);
  assert.equal(translator.t('n-cards-found', { sprintf: ['7'] }), 'Пронајдени се 7 карти');
  assert.doesNotMatch(data['move-all-attachments-to-s3'], /Amazon|облак/);
  assert.match(data['operator-limit-invalid'], /позитивен цел број/);
  assert.equal(translator.t('operator-number-expected', { operator: 'LIMIT', value: 'BAD' }), "Операторот LIMIT очекуваше број, а доби 'BAD'");
  assert.equal(translator.t('page-maybe-private', { sprintf: ['/login'] }), "Оваа страница можеби е приватна. Можеби ќе можете да ја видите ако <a href='/login'>се најавите</a>.");
  assert.match(data['push-invite-text'], /ве поканува да се придружите/);
  assert.doesNotMatch(data['push-invite-text'], /пун увид|целосен пристап/);
  assert.match(data['public-desc'], /Само луѓето додадени на таблата можат да ја уредуваат/);
  for (const key of ['read-assigned-only-desc', 'read-only-desc']) {
    assert.match(data[key], /Не може да ги уредува/);
  }
  assert.match(data['read-assigned-only-desc'], /само доделените карти/);
  assert.match(data['r-d-move-to-bottom-gen'], /дното на нејзиниот список/);
  assert.match(data['r-d-move-to-top-gen'], /врвот на нејзиниот список/);
  assert.match(data['remove-labels-multiselect'], /1-9/);
  assert.match(data['remove-member-pop'], /Ќе добие известување/);
  assert.doesNotMatch(data['remove-organization-from-board'], /забран|увид/);
  assert.match(data['run-restore-lost-cards-migration-confirm'], /само неархивираните ставки/);
  assert.match(data['run-restore-all-archived-migration-confirm'], /СИТЕ архивирани ленти, списоци и карти/);
  assert.match(data['run-restore-all-archived-migration-confirm'], /не може лесно да се поништи/);
  assert.match(data['run-delete-duplicate-empty-lists-migration-confirm'], /празните списоци што имаат дупликат со ист наслов што содржи карти/);
  for (const field of ['swimlaneId', 'listId']) assert.ok(data['restore-lost-cards-migration-description'].includes(field));
  assert.match(data['s3-enabled-description'], /AWS S3 или MinIO/);
  assert.doesNotMatch(data['s3-ssl-enabled-description'], /Amazon/);
  assert.match(data['search-cards'], /описите и приспособените полиња/);
  for (const command of ['sudo snap logs wekan.wekan', 'sudo docker logs wekan-app']) {
    assert.ok(data['server-error-troubleshooting'].includes('`' + command + '`'));
  }
  for (const endpoint of ['s3.amazonaws.com', 'minio.example.com']) assert.ok(data['s3-endpoint-description'].includes(endpoint));
  assert.match(data['set-swimlane-height-value'], /пиксели/);
  assert.match(data['show-parent-in-minicard'], /родителската карта/);
  assert.match(data['showSum-field-on-list'], /збирот на полињата/);
  assert.doesNotMatch(data['showSum-field-on-list'], /број придружени/);
  assert.match(data['show-at-all-boards-page'], /Сите табли/);
  assert.equal(data['sidebar-close'], 'Затворете страничната лента');
  assert.equal(data['sidebar-open'], 'Отворете страничната лента');
  assert.match(data['smtp-port-description'], /излезни е-пораки/);
  assert.match(data['starred-boards-description'], /на врвот на вашиот список со табли/);
  assert.match(data['support-info-only-for-logged-in-users'], /само за најавени корисници/);
  assert.doesNotMatch(data['subtaskDeletePopup-title'], /посao|предмет/);
  assert.equal(data.list, 'Список');
  assert.equal(data.swimlane, 'Лента');
  console.log('macedonianAuditedTranslations: actual date and label rendering, checklist removal meaning and native labels passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
