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

for (const key of ['globalSearch-instructions-operator-org', 'globalSearch-instructions-operator-team']) assert.match(data[key], /pertencen a un taboleiro asignado/);
assert.match(data['globalSearch-instructions-operator-modified'], /días ou menos/);
assert.match(data['globalSearch-instructions-operator-swimlane'], /tarxetas en carrís/);
assert.match(data['globalSearch-instructions-operator-list'], /tarxetas en listas/);

assert.match(data['globalSearch-instructions-operator-user'], /\*membro\* ou \*asignado\*/);
assert.match(data['globalSearch-instructions-status-all'], /arquivadas e non arquivadas/);
assert.match(data['globalSearch-instructions-status-ended'], /cunha data de fin/);
assert.match(data['globalSearch-instructions-status-private'], /só en taboleiros privados/);
assert.match(data['globalSearch-instructions-status-public'], /só en taboleiros públicos/);
assert.match(data['globalSearch-title'], /todos os taboleiros/);

assert.match(data['has-overtime-cards'], /horas extra/);
assert.match(data['has-spenttime-cards'], /tempo empregado/);
assert.match(data.hideAllChecklistItems, /todos os elementos/);
assert.match(data['hide-finished-checklist'], /rematadas/);
assert.match(data['hide-minicard-label-text'], /texto das etiquetas na minitarxeta/);

assert.match(data.hideCheckedChecklistItems, /elementos marcados/);
assert.notEqual(data.hideCheckedChecklistItems, data.hideAllChecklistItems);
assert.match(data['import-board-instruction-about-errors'], /ás veces.*funciona igualmente.*Todos os taboleiros/);
assert.match(data['import-board-zip'], /\.zip.*JSON.*subcartafoles.*anexos/);
assert.match(data['import-members-map'], /Asocia os membros.*cos teus usuarios/);

assert.match(data['import-members-map-note'], /membros sen asociar.*usuario actual/);
assert.match(data['invalid-credentials'], /usuario ou contrasinal non válidos/);
assert.match(data['label-delete-pop'], /Non se pode desfacer.*todas as tarxetas.*destruirá o seu historial/);

assert.match(data['last-admin-desc'], /Non podes cambiar.*polo menos un administrador/);
assert.match(data['leave-board-pop'], /__boardTitle__.*todas as tarxetas deste taboleiro/);
assert.match(data['list-archive-cards-pop'], /todas as tarxetas.*devolvelas ao taboleiro.*«Menú» > «Arquivo»/);
assert.match(data['list-archive-pop'], /non será visible.*despois de arquivala/);
assert.match(data['list-archive-suggest'], /restaurar a lista.*Arquivo.*configuración do taboleiro/);
assert.match(data['list-delete-pop'], /Todas as accións.*non poderás recuperar a lista.*Non se pode desfacer/);
assert.match(data['list-delete-suggest-archive'], /Arquivo.*conservar a actividade/);
assert.notEqual(data['list-delete-pop'], data['list-delete-suggest-archive']);
assert.match(data['list-move-cards'], /todas as tarxetas desta lista/);
assert.match(data['list-select-cards'], /todas as tarxetas desta lista/);

assert.match(data['migration-warning-text'], /Non peche o navegador.*continuará en segundo plano.*pode tardar máis/);
assert.match(data['migrations-admin-only'], /^Só os administradores do taboleiro poden executar migracións$/);
assert.match(data['migrations-description'], /integridade dos datos deste taboleiro.*Cada migración pode executarse individualmente/);
assert.match(data['move-all-attachments-of-board-to-fs'], /todos os anexos.*sistema de ficheiros/);
assert.match(data['move-all-attachments-of-board-to-gridfs'], /todos os anexos.*a GridFS$/);
assert.match(data['move-all-attachments-of-board-to-s3'], /todos os anexos.*a S3$/);
assert.match(data['muted-info'], /Nunca.*ningún cambio neste taboleiro/);
assert.equal(data.moveChecklist, data['moveChecklistPopup-title']);
assert.match(data.newLineNewItem, /Unha liña de texto = un elemento/);
assert.equal(data['n-n-of-n-cards-found'].replace('__start__', '11').replace('__end__', '20').replace('__total__', '57'), '11-20 de 57 tarxetas atopadas');

assert.match(data.newlineBecomesNewChecklistItemOriginOrder, /Cada liña.*nun elemento.*na orde orixinal/);
assert.match(data['normal-assigned-only-desc'], /Só son visibles as tarxetas asignadas.*usuario normal/);
assert.match(data['notify-participate'], /tarxetas.*creador ou membro/);
assert.match(data['notify-watch'], /taboleiros, listas ou tarxetas.*vixiar/);
assert.match(data['operator-has-invalid'], /comprobación de existencia/);
assert.match(data['operator-limit-invalid'], /número enteiro positivo/);
assert.doesNotMatch(data['operator-limit-invalid'], /não|Deve/);
assert.match(data['private-desc'], /Só as persoas engadidas ao taboleiro poden velo e editalo/);
assert.match(data['public-desc'], /calquera que teña a ligazón.*buscadores como Google.*Só as persoas engadidas ao taboleiro poden editalo/);
assert.equal(data['push-invite-text'].replace('__user__', 'USER').replace('__inviter__', 'INVITER').replace('__board__', 'BOARD').replace('__url__', 'LINK'), 'Estimado/a USER,\n\nINVITER convídate a unirte ao taboleiro "BOARD" para colaborar.\n\nSegue a ligazón de abaixo:\n\nLINK\n\nGrazas.');

assert.match(data['r-checklist-note'], /valores separados por comas/);
assert.match(data['r-when-a-card-is-moved'], /se move a outra lista$/);
assert.doesNotMatch(data['r-when-a-card-is-moved'], /de outra lista/);
assert.match(data['r-d-move-to-bottom-gen'], /final da súa lista$/);
assert.match(data['r-d-move-to-top-gen'], /principio da súa lista$/);
assert.match(data['r-move-all-cards'], /todas as tarxetas da lista/);
assert.match(data['r-remove-all'], /todos os membros da tarxeta/);
assert.match(data['read-assigned-only-desc'], /Só son visibles as tarxetas asignadas.*Non pode editar/);
assert.match(data['read-only-desc'], /Só pode ver as tarxetas.*Non pode editar/);
assert.match(data['remove-member-pop'], /__name__ \(__username__\).*__boardTitle__.*todas as tarxetas deste taboleiro.*notificación/);
assert.match(data['rescue-card-description-dialogue'], /Sobrescribir a descrición actual.*cos teus cambios/);
assert.match(data['restore-all-archived-migration-description'], /todos os carrís, listas e tarxetas arquivados.*swimlaneId ou listId/);
assert.match(data['restore-lost-cards-migration-description'], /tarxetas e listas sen swimlaneId ou listId.*Crea un carril "Tarxetas perdidas"/);
assert.match(data['restore-lost-cards-nothing-to-restore'], /Non hai carrís, listas nin tarxetas perdidos/);

assert.match(data['run-delete-duplicate-empty-lists-migration-confirm'], /primeiro as listas compartidas en listas por carril.*listas baleiras.*mesmo título con tarxetas.*Só.*realmente redundantes/);
assert.match(data['run-restore-all-archived-migration-confirm'], /TODOS os carrís, listas e tarxetas arquivados.*non se pode desfacer facilmente/);
assert.match(data['run-restore-lost-cards-migration-confirm'], /swimlaneId ou listId.*Só afecta aos elementos non arquivados/);
assert.match(data['scheduled-board-operations'], /^Operacións programadas/);
assert.match(data['search-cards'], /títulos, descricións e campos personalizados.*neste taboleiro/);
assert.notEqual(data['shortcut-add-self'], data['shortcut-assign-self']);
assert.match(data['shortcut-add-self'], /Engadirte/);
assert.match(data['shortcut-assign-self'], /Asignarte/);
assert.match(data['show-cards-minimum-count'], /se a lista contén máis de$/);

assert.match(data['showLabel-field-on-card'], /etiqueta do campo na minitarxeta/);
assert.match(data['star-board-title'], /parte superior da túa lista de taboleiros/);
assert.match(data['step-scan-files'], /ficheiros anexos do taboleiro/);
assert.match(data['step-scan-users'], /avatares dos membros do taboleiro/);
assert.match(data['swimlane-archive-suggest'], /restaurar o carril.*Arquivo.*configuración/);
assert.match(data['swimlane-delete-pop'], /Todas as accións.*fluxo de actividade.*non poderás recuperar o carril.*Non se pode desfacer/);
assert.match(data['tableVisibilityMode-allowPrivateOnly'], /permitir só taboleiros privados/);
assert.match(data['toggle-assignees'], /asignados 1-9.*orde de engadido ao taboleiro/);
assert.doesNotMatch(data['toggle-assignees'], /administrador/);
assert.match(data['toggle-labels'], /selección múltiple engade as etiquetas 1-9/);
assert.match(data['tracking-info'], /creador ou membro/);
assert.match(data['user-can-not-export-card-to-excel'], /non pode exportar.*Excel/);
assert.match(data['user-can-not-export-card-to-pdf'], /non pode exportar.*PDF/);
