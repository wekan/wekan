'use strict';
const assert = require('node:assert/strict');
const data = require('../imports/i18n/data/gl-ES.i18n.json');
assert.match(data['accounts-lockout-known-users'], /usuarios coñecidos.*usuario correcto, contrasinal incorrecto/);
assert.match(data['accounts-lockout-unknown-users'], /usuarios descoñecidos.*usuario inexistente/);
for (const key of ['accounts-lockout-known-users', 'accounts-lockout-unknown-users']) assert.doesNotMatch(data[key], /usuários|senha|Configurações/);
assert.match(data['act-addChecklist'], /engadiu a lista de verificación/);
assert.match(data['delete-board-confirm-popup'], /todas as listas, tarxetas, etiquetas e actividades.*non poderás recuperar.*Non se pode desfacer/);
assert.match(data['delete-duplicate-empty-lists-migration-description'], /non teñen tarxetas E.*mesmo título.*contén tarxetas/);
assert.match(data['delete-linked-cards-before-this-list'], /eliminar antes.*apuntan a tarxetas desta lista/);
assert.match(data['delete-org-warning-message'], /Non se pode eliminar.*polo menos un usuario/);
for (const key of ['delete-all-notifications-confirm', 'delete-org-confirm-popup', 'delete-team-confirm-popup']) assert.match(data[key], /non se pode desfacer/i);

assert.equal(data.copyChecklistFromTemplate, data['copyChecklistFromTemplatePopup-title']);
assert.equal(data.copyChecklist, data['copyChecklistPopup-title']);
assert.match(data['custom-field-delete-pop'], /Non se pode desfacer.*todas as tarxetas.*destruirá o seu historial/);
const examples = JSON.parse(data['copyManyCardsPopup-format']);
assert.equal(examples.length, 3);
for (const example of examples) assert.deepEqual(Object.keys(example), ['title', 'description']);
assert.match(examples[0].description, /Descrición da primeira tarxeta/);
assert.doesNotMatch(examples[0].description, /Descrição|cartão/);

assert.match(data['conversion-info-text'], /unha vez por taboleiro.*mellora o rendemento.*seguir usando.*normalidade/);
assert.match(data['comprehensive-board-migration-description'], /orde das listas.*posicións das tarxetas.*estrutura dos carrís/);
assert.match(data['confirm-checklist-item-delete-popup'], /o elemento da lista/);
assert.notEqual(data['confirm-checklist-item-delete-popup'], data['confirm-checklist-delete-popup']);
assert.match(data.copyChecklistFromTemplate, /desde un modelo/);
assert.match(data['copy-card-link-to-clipboard'], /portapapeis/);

assert.match(data['checklistItemDeletePopup-title'], /o elemento da lista/);
assert.notEqual(data['checklistItemDeletePopup-title'], data['checklistDeletePopup-title']);
assert.match(data['comment-assigned-only-desc'], /Só son visibles as tarxetas asignadas.*Só pode comentar/);
assert.match(data['comment-not-found'], /tarxeta cun comentario/);
assert.match(data['close-board-pop'], /restaurar o taboleiro.*botón «Arquivo».*cabeceira de inicio/);

assert.match(data['card-delete-pop'], /Todas as accións.*non poderás reabrir.*Non se pode desfacer/);
assert.match(data['card-delete-suggest-archive'], /Arquivo.*conservar a actividade/);
assert.match(data.card_assignees, /responsables da tarxeta actual/);
assert.doesNotMatch(data.card_assignees, /administradores/);
assert.match(data.card_members, /neste taboleiro/);
assert.match(data['card-sorting-by-number-on-minicard'], /por número na minitarxeta/);

assert.match(data.board_assignees, /responsables de todas as tarxetas/);
assert.doesNotMatch(data.board_assignees, /administradores/);
assert.equal(data['boardInfoOnMyBoards-title'], data['board-info-on-my-boards']);
assert.equal(data['boardInfoOnMyBoardsPopup-title'], data['board-info-on-my-boards']);
assert.match(data['card-archive-pop'], /non será visible nesta lista.*arquivala/);
assert.match(data['card-archive-suggest-cancel'], /restaurar.*Arquivo máis tarde/);

for (const action of ['backup', 'cleanup']) {
  assert.match(data[`board-${action}-failed`], /Non se puido programar/);
  assert.match(data[`board-${action}-scheduled`], /programad[ao] correctamente/);
}
assert.match(data['board-delete-notice'], /eliminación é permanente.*todas as listas, tarxetas e accións/);
assert.match(data['board-private-info'], /<strong>privado<\/strong>/);
assert.match(data['board-public-info'], /<strong>público<\/strong>/);

assert.match(data['automatically-field-on-card'], /tarxetas novas/);
assert.notEqual(data['automatically-field-on-card'], data['always-field-on-card']);
assert.match(data['board-archive-failed'], /Non se puido programar/);
assert.match(data['board-archive-scheduled'], /programado correctamente/);
assert.match(data['badge-attachment-on-minicard'], /Reconto de anexos na minitarxeta/);
assert.match(data['auto-watch'], /automaticamente.*cando se crean/);

assert.match(data['admin-people-user-active'], /está activo.*desactivalo/);
assert.match(data['admin-people-user-inactive'], /está inactivo.*activalo/);
assert.match(data['always-field-on-card'], /todas as tarxetas/);
assert.match(data['app-is-offline'], /causará perda de datos.*servidor non se detivese/);
assert.match(data['archive-board-confirm'], /arquivar este taboleiro/);
assert.doesNotMatch(data['archive-board-confirm'], /excluir|eliminar/);

assert.match(data['admin-desc'], /editar tarxetas, eliminar membros.*configuración do taboleiro.*actividades/);
assert.match(data['add-custom-html-after-body-start'], /despois do inicio de <body>/);
assert.match(data['add-custom-html-before-body-end'], /antes do fin de <\/body>/);
assert.match(data['add-cron-job-placeholder'], /estará dispoñible en breve/);
assert.match(data['add-cover'], /imaxe de portada á minitarxeta/);

(async () => {
  const translator = require('i18next').createInstance().use(require('i18next-sprintf-postprocessor'));
  await translator.init({ postProcess: ['sprintf'], lng: 'gl-ES', fallbackLng: false, keySeparator: false, interpolation: { prefix: '__', suffix: '__', escapeValue: false }, resources: { 'gl-ES': { translation: data } } });
  assert.equal(translator.t('act-addAttachment', { attachment: 'FILE', card: 'CARD', list: 'LIST', swimlane: 'LANE', board: 'BOARD' }), 'engadiu o anexo FILE á tarxeta CARD na lista LIST no carril LANE no taboleiro BOARD');
  assert.equal(data['act-addLabel'], data['act-addedLabel']);
  assert.equal(translator.t('act-addChecklistItem', { checklistItem: 'ITEM', checklist: 'CHECK', card: 'CARD', list: 'LIST', swimlane: 'LANE', board: 'BOARD' }), 'engadiu o elemento ITEM á lista de verificación CHECK na tarxeta CARD na lista LIST no carril LANE no taboleiro BOARD');
  assert.equal(translator.t('act-atUserComment', { card: 'CARD', comment: 'COMMENT', list: 'LIST', swimlane: 'LANE', board: 'BOARD' }), 'mencionoute na tarxeta CARD: COMMENT na lista LIST no carril LANE no taboleiro BOARD');
  assert.equal(translator.t('act-archivedSwimlane', { swimlane: 'LANE', board: 'BOARD' }), 'O carril LANE no taboleiro BOARD moveuse ao Arquivo');
  assert.equal(translator.t('act-createCustomField', { customField: 'FIELD', board: 'BOARD' }), 'creou o campo personalizado FIELD no taboleiro BOARD');
  assert.equal(translator.t('act-deleteCustomField', { customField: 'FIELD', board: 'BOARD' }), 'eliminou o campo personalizado FIELD no taboleiro BOARD');
  assert.equal(translator.t('act-importList', { list: 'LIST', swimlane: 'LANE', board: 'BOARD' }), 'importou a lista LIST ao carril LANE no taboleiro BOARD');
  assert.match(data['act-completeChecklist'], /completou a lista de verificación/);
  assert.match(data['act-deleteComment'], /eliminou o comentario/);
  assert.match(data['act-editComment'], /editou o comentario/);
  assert.equal(data['act-removeLabel'], data['act-removedLabel']);
  assert.equal(translator.t('act-moveCardToOtherBoard', { card: 'CARD', oldList: 'OLDLIST', oldSwimlane: 'OLDLANE', oldBoard: 'OLDBOARD', list: 'LIST', swimlane: 'LANE', board: 'BOARD' }), 'moveu a tarxeta CARD da lista OLDLIST no carril OLDLANE no taboleiro OLDBOARD á lista LIST no carril LANE no taboleiro BOARD');
  assert.equal(translator.t('act-removeChecklistItem', { checklistItem: 'ITEM', checkList: 'CHECK', card: 'CARD', list: 'LIST', swimlane: 'LANE', board: 'BOARD' }), 'eliminou o elemento ITEM da lista de verificación CHECK na tarxeta CARD na lista LIST no carril LANE no taboleiro BOARD');
  assert.equal(data['activity-checklist-completed-card'], data['act-completeChecklist']);
  assert.match(data['act-uncompleteChecklist'], /desmarcou como completada/);
  assert.notEqual(data['act-checkedItem'], data['act-uncheckedItem']);
  assert.equal(translator.t('activity-checked-item', { sprintf: ['ITEM', 'CHECK', 'CARD'] }), 'marcou ITEM na lista de verificación CHECK de CARD');
  assert.equal(translator.t('activity-checklist-completed', { sprintf: ['CHECK', 'CARD'] }), 'completou a lista de verificación CHECK de CARD');
  assert.equal(translator.t('activity-checklist-item-added', { sprintf: ['CHECK', 'CARD'] }), "engadiu un elemento á lista de verificación 'CHECK' en CARD");
  assert.equal(translator.t('activity-checklist-uncompleted', { sprintf: ['CHECK', 'CARD'] }), 'desmarcou como completada a lista de verificación CHECK de CARD');
  assert.equal(translator.t('activity-unchecked-item', { sprintf: ['ITEM', 'CHECK', 'CARD'] }), 'desmarcou ITEM na lista de verificación CHECK de CARD');
  assert.match(data['add-card-to-bottom-of-list'], /ao final da lista/);
  assert.match(data['add-card-to-top-of-list'], /ao principio da lista/);
  assert.equal(translator.t('email-invite-register-text', { user: 'USER', inviter: 'INVITER', url: 'LINK', icode: 'CODE' }), 'Estimado/a USER,\n\nINVITER convídate a un taboleiro kanban para colaborar.\n\nSegue a ligazón de abaixo:\nLINK\n\nE o teu código de convite é: CODE\n\nGrazas.');
  console.log('galicianRegionalAuditedTranslations: credential meanings and actual attachment rendering passed');
})().catch(error => { console.error(error); process.exitCode = 1; });

assert.match(data['delete-team-warning-message'], /Non se pode eliminar.*polo menos un usuario/);
assert.match(data['dueCardsViewChange-choice-all-description'], /todas as tarxetas incompletas.*vencemento.*usuario ten permiso/);
for (const key of ['delete-user-confirm-popup', 'delete-translation-confirm-popup']) assert.match(data[key], /Non se pode desfacer/);

assert.equal(data['dueCardsViewChange-title'], data['dueCardsViewChangePopup-title']);
assert.match(data['error-board-notAMember'], /membro deste taboleiro/);
assert.match(data['error-board-notAdmin'], /administrador deste taboleiro/);
assert.match(data['error-csv-schema'], /separados por comas.*separados por tabulacións.*formato correcto/);

assert.match(data['error-json-malformed'], /non é un JSON válido/);
assert.match(data['error-json-schema'], /datos JSON.*información axeitada.*formato correcto/);
assert.match(data['error-notAuthorized'], /Non tes autorización/);
assert.match(data['export-card-excel-no-disk-space'], /Non se pode exportar.*non hai espazo libre abondo/);
assert.match(data['export-card-field-board-info'], /taboleiro, lista, carril/);

assert.match(data['globalSearch-instructions-notes-2'], /\*OU\*.*calquera das condicións/);
assert.match(data['globalSearch-instructions-description'], /`list:Blocked`.*`__operator_list__:"To Review"`/);
for (const key of ['fix-all-file-urls-migration-description', 'fix-avatar-urls-migration-description']) assert.match(data[key], /almacenamento correcto.*referencias.*rotas/);
assert.match(data['fix-missing-lists-migration-description'], /faltan ou están danadas.*estrutura do taboleiro/);

assert.match(data['globalSearch-instructions-notes-3'], /\*E\*.*todos os operadores diferentes/);
assert.match(data['globalSearch-instructions-notes-4'], /non distinguen maiúsculas de minúsculas/);
assert.match(data['globalSearch-instructions-notes-5'], /predeterminada non se procura.*arquivadas/);
assert.match(data['globalSearch-instructions-operator-comment'], /comentario que contén/);

assert.match(data['globalSearch-instructions-operator-created'], /días ou menos/);
assert.match(data['globalSearch-instructions-operator-limit'], /enteiro positivo.*por páxina/);
assert.match(data['globalSearch-instructions-operator-due'], /ata.*`__operator_due__:__predicate_overdue__`/);
assert.match(data['globalSearch-instructions-operator-has'], /`has:-due`.*sen data de vencemento/);
assert.match(data['globalSearch-instructions-operator-label'], /\*<color>\* ou \*<name>\*/);
