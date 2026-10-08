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
assert.match(data['close-board-pop'], /restaurar o taboleiro.*«Arquivo».*páxina «Todos os taboleiros»/);
assert.doesNotMatch(data['close-board-pop'], /cabeceira de inicio|botón «Arquivo»/);

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

assert.match(data['username-password-required'], /nome de usuario e o contrasinal/);
assert.match(data['username-too-short'], /polo menos 3 caracteres/);
assert.match(data['worker-desc'], /^Só pode mover tarxetas, asignarse a si mesmo a unha tarxeta e comentar/);
assert.doesNotMatch(data.MongoDB_storage_engine, /Versión|Versão/);
assert.match(data.Node_heap_heap_size_limit, /heap.*límite de tamaño do heap/);
assert.doesNotMatch(data.Node_heap_total_heap_size, /Pilha|pila/);
assert.match(data.Node_heap_malloced_memory, /memoria asignada con malloc/);
assert.match(data.Node_heap_peak_malloced_memory, /pico de memoria asignada con malloc/);
assert.match(data.Node_memory_usage_heap_total, /tamaño total do heap asignado/);
assert.match(data.Node_memory_usage_heap_used, /memoria realmente usada/);
assert.match(data.Node_memory_usage_rss, /tamaño do conxunto residente/);

assert.match(data.acceptance_of_our_legalNotice, /^Ao continuar, acepta o noso$/);
assert.match(data['account-locked'], /bloqueada temporalmente.*demasiados intentos.*máis tarde/);
assert.match(data['accounts-lockout-failure-window'], /\(segundos\)$/);
assert.match(data['accounts-lockout-period'], /\(segundos\)$/);
assert.match(data['accounts-lockout-show-locked-users'], /só os usuarios bloqueados/);
for (const key of ['a-dueAt', 'a-endAt', 'a-receivedAt', 'a-startAt', 'act-a-dueAt', 'act-a-endAt', 'act-a-receivedAt', 'act-a-startAt']) assert.match(data[key], /data e hora/);
for (const key of ['act-a-endAt', 'act-a-receivedAt', 'act-a-startAt']) assert.match(data[key], /__timeValue__ desde \(__timeOldValue__\)/);
assert.match(data['act-almostdue'], /está a achegarse$/);
assert.match(data['act-duenow'], /é agora$/);
assert.match(data['act-pastdue'], /xa pasou$/);
assert.match(data['act-newDue'], /1º recordatorio de vencemento/);

assert.match(data['activity-checklist-item-removed'], /un elemento da lista de verificación '%s' en %s/);
assert.match(data['activity-imported'], /%s en %s desde %s/);
assert.match(data['activity-set-customfield'], /campo personalizado '%s' a '%s' en %s/);
assert.match(data['activity-unset-customfield'], /baleirou o valor do campo personalizado/);
assert.doesNotMatch(data['activity-unset-customfield'], /eliminou o campo/);
assert.match(data['admin-announcement-active'], /en todo o sistema/);
assert.match(data.allowNonBoardMembers, /todos os usuarios con sesión iniciada/);
assert.match(data['archive-swimlane'], /carril ao Arquivo/);
assert.match(data['allboards.delete-workspace-confirm-check'], /Confirmar a eliminación do espazo de traballo/);

assert.match(data['automatic-linked-url-schemes'], /Un esquema de URL por liña/);
assert.match(data['click-to-disable-auto-width'], /activada.*desactivar/);
assert.match(data['click-to-enable-auto-width'], /desactivada.*activar/);
assert.equal(data['card-edit-custom-fields'], 'Editar campos personalizados');
assert.equal(data['cardCustomFieldsPopup-title'], data['card-edit-custom-fields']);
assert.match(data['created-at-newest-first'], /máis recentes primeiro/);
assert.match(data['created-at-oldest-first'], /máis antigos primeiro/);
for (const action of ['delete', 'pause', 'resume', 'start']) assert.match(data[`cron-job-${action}-failed`], /^Non se puido/);
for (const action of ['deleted', 'paused', 'resumed', 'started']) assert.match(data[`cron-job-${action}`], /correctamente$/);

assert.match(data['cron-no-failed-migrations'], /Non hai migracións fallidas que reintentar/);
assert.match(data['cron-no-paused-migrations'], /Non hai migracións pausadas que retomar/);
assert.match(data['custom-field-stringtemplate-format'], /%\{value\}/);
assert.match(data['custom-field-stringtemplate-separator'], /&#32; ou &nbsp; para un espazo/);
assert.match(data['custom-head-tags-enabled'], /etiquetas head/);
assert.match(data['custom-assetlinks-content'], /assetlinks\.json.*\(JSON\)/);
assert.match(data['custom-top-left-corner-logo-height'], /esquina superior esquerda.*Predeterminado: 27/);
assert.match(data['custom-login-logo-image-url'], /URL da imaxe/);
assert.match(data['custom-login-logo-link-url'], /URL da ligazón/);
assert.match(data['delete-duplicate-empty-lists-migration'], /listas baleiras duplicadas/);
assert.match(data['deposit-subtasks-list'], /Lista de destino.*aquí:/);

assert.match(data['editPokerEndDatePopup-title'], /fin da votación do Planning Poker/);
assert.match(data['email-enrollAccount-text'], /Ola __user__,\n\n.*\n\n__url__\n\nGrazas\./);
assert.match(data['email-resetPassword-text'], /restablecer o teu contrasinal/);
assert.match(data['email-verifyEmail-text'], /correo electrónico da túa conta/);
assert.match(data['enter-zoom-level'], /50-300%/);
assert.match(data['export-card-field-dates'], /creación, recepción, inicio, vencemento, fin/);
assert.match(data['export-card-field-people'], /creador, propietario, membros, asignados/);
assert.doesNotMatch(data['export-card-field-people'], /administrador/i);
assert.match(data['external-link-pattern-url'], /\{number\}/);
assert.equal(data['filter-custom-fields-label'], 'Filtrar por campos personalizados');

assert.match(data['globalSearch-instructions-notes-3-2'], /número enteiro positivo ou negativo/);
assert.match(data['globalSearch-instructions-operator-hash'], /__operator_label__:<color>.*__operator_label__:<name>/);
assert.match(data['globalSearch-instructions-operator-sort'], /descendente.*`-` diante do nome/);
assert.match(data['import-board-instruction-csv'], /comas \(CSV\).*tabulacións \(TSV\)/);
assert.match(data['import-csv-placeholder'], /^Pega.*válidos$/);
assert.match(data['invalid-file'], /non é válido.*cancélase o envío ou o renomeado/);
assert.match(data['keyboard-shortcuts-disabled'], /desactivados.*activar/);
assert.match(data['keyboard-shortcuts-enabled'], /activados.*desactivar/);
assert.match(data['max-avatar-filesize'], /en bytes:/);
assert.match(data['max-upload-filesize'], /en bytes:/);
assert.match(data['migration-batch-size-description'], /anexos.*cada lote \(1-100\)/);

assert.match(data['migration-cpu-threshold-description'], /Pausar.*supere esta porcentaxe \(10-90\)/);
assert.match(data['migration-delay-ms-description'], /milisegundos \(100-10000\)/);
assert.match(data['migration-info-text'], /unha vez.*segundo plano aínda que peche o navegador/);
assert.notEqual(data['migration-paused'], data['migration-stopped']);
assert.match(data['migration-paused'], /pausadas/);
assert.match(data['migration-stopped'], /detidas/);
assert.match(data['migration-stop-confirm'], /todas as migracións/);
assert.match(data['monitoring-refresh-failed'], /^Non se puideron actualizar os datos/);
assert.match(data['operator-number-expected'], /__operator__.*número.*'__value__'/);
assert.match(data['page-maybe-private'], /Quizais.*<a href='%s'>iniciando sesión<\/a>/);
assert.match(data['poker-delete-pop'], /permanente.*todas as accións/);
assert.match(data['r-board-note'], /campo baleiro.*calquera valor posible/);

assert.match(data['s3-enabled-description'], /AWS S3 ou MinIO/);
assert.match(data['s3-endpoint-description'], /punto de acceso.*s3.amazonaws.com ou minio.example.com/);
assert.match(data['s3-port-description'], /porto do punto de acceso/);
assert.match(data['s3-region-description'], /us-east-1/);
assert.match(data['s3-settings-save-failed'], /^Non se puido gardar/);
assert.match(data['s3-settings-saved'], /gardada correctamente$/);
assert.match(data['server-error-troubleshooting'], /`sudo snap logs wekan.wekan`.*\n.*`sudo docker logs wekan-app`/);
assert.match(data['set-wip-limit-value'], /número máximo de tarefas nesta lista/);
assert.match(data['show-week-of-year'], /ISO 8601/);
assert.match(data['showSum-field-on-list'], /suma.*parte superior da lista/);

assert.match(data['swimlane-height-error-message'], /enteiro positivo/);
assert.match(data['support-info-only-for-logged-in-users'], /só para usuarios con sesión iniciada/);
assert.match(data['vote-delete-pop'], /permanente.*todas as accións/);
assert.match(data['wipLimitErrorPopup-dialog-pt1'], /maior que o límite WIP/);
assert.match(data['wipLimitErrorPopup-dialog-pt2'], /tarefas fóra desta lista ou.*límite WIP máis alto/);
assert.match(data['calendar-system-islamic-rgsa'], /Arabia Saudita, observación da lúa/);
assert.match(data['calendar-system-islamic-tbla'], /tabular, época astronómica/);
for (const example of ["'Field 1' == 'Value 1'", "Field1 == I\\'m", 'F1 == V1 && ( F2 == V2 || F2 == V3 )', 'F1 == /Tes.*/i']) assert.ok(data['advanced-filter-description'].includes(example), example);

const baseGalician = require('../imports/i18n/data/gl.i18n.json');
for (const key of ['advanced-filter-description', 'calendar-system-islamic-rgsa', 'calendar-system-islamic-tbla', 'globalSearch-instructions-operator-due', 'globalSearch-instructions-operator-label']) assert.equal(baseGalician[key], data[key]);

const repairedLabels = {
  "board": "Taboleiro",
  "card": "Tarxeta",
  "swimlane": "Carril",
  "add-existing-card-as-subtask-empty": "Non se atoparon tarxetas coincidentes",
  "convertChecklistItemToCardPopup-title": "Converter en tarxeta",
  "and-n-other-card": "E __count__ tarxeta máis",
  "and-n-other-card_plural": "E __count__ tarxetas máis",
  "archived-boards": "Taboleiros no Arquivo",
  "no-archived-boards": "Non hai taboleiros no Arquivo.",
  "board-not-found": "Non se atopou o taboleiro",
  "boardChangeTitlePopup-title": "Renomear o taboleiro",
  "boardMenuPopup-title": "Configuración do taboleiro",
  "boardChangeViewPopup-title": "Vista do taboleiro",
  "board-view": "Vista do taboleiro",
  "card-archived": "Esta tarxeta moveuse ao Arquivo.",
  "card-settings-linked-card": "Tarxeta ligada",
  "cardDeletePopup-title": "Eliminar a tarxeta?",
  "cardArchivePopup-title": "Arquivar a tarxeta?",
  "cardDetailsActionsPopup-title": "Accións da tarxeta",
  "bookmarksPopup-title": "Taboleiros favoritos",
  "cards-count-one": "Tarxeta",
  "cardType-card": "Tarxeta",
  "cardType-linkedCard": "Tarxeta ligada",
  "cardType-linkedBoard": "Taboleiro ligado",
  "close-board": "Pechar o taboleiro",
  "close-card": "Pechar a tarxeta",
  "linkCardPopup-title": "Ligar tarxeta",
  "copyCardPopup-title": "Copiar a tarxeta",
  "email-resetPassword-subject": "Restablece o teu contrasinal en __siteName__",
  "error-board-doesNotExist": "Este taboleiro non existe",
  "export-card": "Exportar a tarxeta",
  "export-card-pdf": "Exportar a tarxeta a PDF",
  "exportCardPopup-title": "Exportar a tarxeta"
};
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const englishLabels = require('../imports/i18n/data/en.i18n.json');
for (const [key, value] of Object.entries(repairedLabels)) {
  assert.equal(data[key], value, key);
  assert.deepEqual(translationTokens(data[key]), translationTokens(englishLabels[key]), key);
  assert.doesNotMatch(data[key], /Cartão|cartão|cartões|Quadro|quadro|senha|Configurações|não|Sem /, key);
}

const furtherRepairedLabels = {
  "act-createBoard": "creou o taboleiro __board__",
  "act-importBoard": "importou o taboleiro __board__",
  "leaveBoardPopup-title": "Saír do taboleiro?",
  "link-card": "Ligar a esta tarxeta",
  "linkCardToBoardPopup-title": "Ligar ao taboleiro",
  "linkCardToNewBoard": "Crear taboleiro a partir desta tarxeta",
  "my-boards": "Os meus taboleiros",
  "no-archived-cards": "Non hai tarxetas no Arquivo.",
  "remove-from-board": "Eliminar do taboleiro",
  "remove-member-from-card": "Eliminar da tarxeta",
  "rename-board": "Renomear o taboleiro",
  "select-board": "Seleccionar taboleiro",
  "shortcut-filter-my-cards": "Filtrar as miñas tarxetas",
  "starred-boards": "Taboleiros destacados",
  "go-to-board": "Ir ao taboleiro",
  "card-templates-swimlane": "Modelos de tarxeta",
  "board-templates-swimlane": "Modelos de taboleiro",
  "tableVisibilityMode": "Visibilidade dos taboleiros",
  "boardDeletePopup-title": "Eliminar o taboleiro?",
  "delete-board": "Eliminar taboleiro",
  "card-settings": "Configuración da tarxeta",
  "boardCardSettingsPopup-title": "Configuración da tarxeta",
  "description-on-minicard": "Descrición na minitarxeta",
  "change-card-parent": "Cambiar o pai da tarxeta",
  "parent-card": "Tarxeta pai",
  "source-board": "Taboleiro de orixe",
  "r-board-rules": "Regras do taboleiro",
  "r-board": "Taboleiro",
  "r-mark-complete": "Marcar a tarxeta como completa",
  "r-mark-incomplete": "Marcar a tarxeta como incompleta",
  "r-when-a-card": "Cando unha tarxeta",
  "r-the-board": "o taboleiro",
  "r-move-card-to": "Mover a tarxeta a",
  "r-card": "tarxeta",
  "r-remove-all-labels": "Elimina todas as etiquetas da tarxeta",
  "r-create-card": "Crear nova tarxeta",
  "r-link-card": "Ligar a tarxeta a",
  "duplicate-board": "Duplicar taboleiro",
  "above-selected-card": "Enriba da tarxeta seleccionada",
  "below-selected-card": "Debaixo da tarxeta seleccionada",
  "show-on-card": "Mostrar na tarxeta",
  "show-on-minicard": "Mostrar na minitarxeta",
  "board-admin": "Administrador do taboleiro",
  "my-cards": "As miñas tarxetas",
  "myCardsViewChange-title": "Vista das miñas tarxetas",
  "myCardsViewChangePopup-title": "Vista das miñas tarxetas",
  "myCardsSortChange-title": "Ordenación das miñas tarxetas",
  "myCardsSortChangePopup-title": "Ordenación das miñas tarxetas",
  "myCardsSortChange-choice-board": "Por taboleiro",
  "dueCards-title": "Tarxetas con vencemento",
  "globalSearchViewChange-choice-me": "As miñas tarxetas",
  "globalSearchViewChange-choice-all": "Todas as tarxetas",
  "broken-cards": "Tarxetas danadas",
  "no-cards-found": "Non se atoparon tarxetas",
  "one-card-found": "Atopouse unha tarxeta",
  "n-cards-found": "Atopáronse %s tarxetas",
  "operator-board": "taboleiro",
  "globalSearch-instructions-status-archived": "`__predicate_archived__` - tarxetas arquivadas",
  "sort-cards": "Ordenar tarxetas",
  "sort-boards": "Ordenar taboleiros",
  "cardsSortPopup-title": "Ordenar tarxetas",
  "creator-on-minicard": "Creador na minitarxeta",
  "boardsReportTitle": "Informe de taboleiros",
  "cardsReportTitle": "Informe de tarxetas",
  "maximize-card": "Maximizar tarxeta",
  "minimize-card": "Minimizar tarxeta",
  "cardDetailsPopup-title": "Detalles da tarxeta",
  "card-show-lists": "A tarxeta mostra as listas",
  "card-id": "ID da tarxeta",
  "board-id": "ID do taboleiro",
  "board-title": "Título do taboleiro",
  "board-status": "Estado do taboleiro",
  "board-status-cards-with-time": "Tarxetas con tempo empregado",
  "password-again": "Contrasinal (de novo)",
  "forgot-password": "Esqueceu o contrasinal",
  "minicardDetailsActionsPopup-title": "Detalles da tarxeta",
  "drag-board": "Arrastrar taboleiro",
  "accounts-lockout-locked-users": "Usuarios bloqueados",
  "accounts-lockout-user-locked": "O usuario está bloqueado",
  "board-operations": "Operacións do taboleiro",
  "schedule-board-backup": "Programar a copia de seguridade do taboleiro",
  "attachment-settings": "Configuración de anexos",
  "back-to-settings": "Volver á configuración",
  "board-migration": "Migración do taboleiro",
  "board-migrations": "Migracións de taboleiros",
  "lost-cards": "Tarxetas perdidas",
  "step-fix-orphaned-cards": "Corrixir as tarxetas orfas",
  "step-update-cards": "Actualizar as tarxetas",
  "step-restore-cards": "Restaurar as tarxetas",
  "converting-board": "Convertendo o taboleiro",
  "unmigrated-boards": "Taboleiros sen migrar",
  "password-mismatch": "Os contrasinais non coinciden",
  "user-exists": "O usuario xa existe"
};
for (const [key, value] of Object.entries(furtherRepairedLabels)) {
  assert.equal(data[key], value, key);
  assert.deepEqual(translationTokens(data[key]), translationTokens(englishLabels[key]), key);
  assert.doesNotMatch(data[key], /cartão|cartões|quadro|usuário|senha|configurações/i, key);
}
assert.match(data['r-mark-complete'], /como completa/);
assert.match(data['r-mark-incomplete'], /como incompleta/);
assert.match(data['above-selected-card'], /Enriba/);
assert.match(data['below-selected-card'], /Debaixo/);
assert.match(data['password-mismatch'], /non coinciden/);

const sharedRepairs = {
  "act-deleteCard": "eliminou a tarxeta __card__ da lista __list__ no carril __swimlane__ do taboleiro __board__",
  "act-removeBoard": "eliminou o taboleiro __board__",
  "act-removeList": "eliminou a lista __list__ do taboleiro __board__",
  "act-removeSwimlane": "eliminou o carril __swimlane__ do taboleiro __board__",
  "set-selected-starred": "Marcar como favoritos os taboleiros seleccionados",
  "set-selected-home": "Definir como taboleiro de inicio (ábrese despois de iniciar sesión)",
  "home-board-badge": "Taboleiro de inicio (ábrese despois de iniciar sesión)",
  "home-board-empty": "Arrastra aquí só un taboleiro para abrilo despois de iniciar sesión",
  "home-board-remove-confirm": "Quitar este taboleiro do Inicio? O taboleiro non se elimina.",
  "list-width-shared-note": "Esta anchura compártese con todas as persoas deste taboleiro.",
  "boardBackgroundsPopup-title": "Fondos do taboleiro",
  "restoreArchivedCardToListPopup-title": "Restaurar a tarxeta na lista",
  "card-aging": "Envellecemento das tarxetas (esvaecer as tarxetas antigas)",
  "move-card-up": "Mover a tarxeta cara arriba",
  "move-card-down": "Mover a tarxeta cara abaixo",
  "confirm-move-list-to-swimlane": "Mover esta lista e todas as súas tarxetas ao outro carril?",
  "error-notAllowed": "O teu rol no taboleiro non permite facer iso",
  "import-trello-zip-no-boards": "Non se atoparon ficheiros .json de taboleiros de Trello no .zip.",
  "import-trello-zip-progress": "Importando taboleiros do .zip, agarda…",
  "import-trello-workspace-placeholder": "O taboleiro importado colócase neste espazo de traballo, que se crea se non existe",
  "trello-import-selected": "Importar os taboleiros seleccionados",
  "trello-importing": "Importando taboleiros…",
  "trello-select-boards": "Selecciona polo menos un taboleiro para importar.",
  "trello-import-more": "Importar máis taboleiros",
  "trello-delete-imported": "Eliminar os taboleiros importados",
  "set-default-board-title": "Preme para abrir este taboleiro automaticamente despois de iniciar sesión.",
  "org-propagate-members-to-boards": "Propagar os membros aos taboleiros",
  "team-propagate-members-to-boards": "Propagar os membros aos taboleiros",
  "checklist-count-on-minicard": "Reconto de elementos da lista de verificación (0/0) na minitarxeta",
  "r-w-card-created": "Créase unha tarxeta",
  "r-w-card-archived": "Arquívase unha tarxeta",
  "r-w-card-unarchived": "Desarquívase unha tarxeta",
  "r-of-cards-in-list": "para as tarxetas da lista",
  "r-when-due": "Cando a data de vencemento dunha tarxeta",
  "r-when-card-in-list": "Cando unha tarxeta leva na lista",
  "r-card-button": "Botón de tarxeta",
  "r-board-button": "Botón de taboleiro",
  "allow-invite-to-board": "Permitir convidar ao taboleiro",
  "drag-template-here-to-share": "Arrastra aquí un taboleiro modelo para compartilo",
  "remove-domain-from-board": "Seguro que queres quitar este dominio deste taboleiro?",
  "search-boards": "Buscar taboleiros",
  "drag-to-connect": "Arrastra para conectar con outra tarxeta",
  "import-dependencies-empty": "Selecciona un taboleiro e proporciona polo menos unha liña de dependencia",
  "board-backgrounds": "Fondos do taboleiro",
  "boardBackgrounds-title": "Fondos do taboleiro",
  "set-as-active": "Establecer como fondo do taboleiro",
  "board-status-loading-mode": "Carga de tarxetas",
  "board-status-overtime-cards": "Tarxetas con horas extra",
  "cards-loading": "Carga de tarxetas",
  "cards-loading-auto": "Automática (baixo demanda só para taboleiros grandes)",
  "cards-loading-all": "Todas as tarxetas",
  "cards-loading-lazy": "Baixo demanda (só as tarxetas visibles)",
  "board-view-aging-wip": "Envellecemento do traballo en curso"
};
for (const code of ['gl', 'gl-ES']) {
  const catalog = require('../imports/i18n/data/' + code + '.i18n.json');
  for (const [key, value] of Object.entries(sharedRepairs)) {
    assert.equal(catalog[key], value, code + ': ' + key);
    assert.deepEqual(translationTokens(catalog[key]), translationTokens(englishLabels[key]), key);
    assert.doesNotMatch(catalog[key], /cartão|cartões|quadro|preguiçoso/i, key);
  }
  assert.match(catalog['home-board-empty'], /só un taboleiro/);
  assert.match(catalog['home-board-remove-confirm'], /non se elimina/);
  assert.match(catalog['cards-loading-lazy'], /só as tarxetas visibles/);
  assert.doesNotMatch(catalog['cards-loading-all'], /predeterminado/);
  for (const literal of ['.json', 'Trello', '.zip']) assert.ok(catalog['import-trello-zip-no-boards'].includes(literal));
}

const settingsKeys = ["external-link-rules", "external-link-rules-description", "external-link-identifier-aliases", "read-only-field", "r-moved-forward", "r-moved-back", "r-assignee", "r-add-actinguser-assignee", "r-remove-all-assignees", "ldap-sync-now", "ldap-sync-now-done", "ldap-sync-now-error", "ldap-sync-now-nothing", "oauth-providers-allowed-email-domains", "scrum-release-scope", "scrum-releases-select-help", "scrum-import-into-board", "scrum-import-into-board-hint", "scrum-import-preview", "scrum-import-choose-file"];
for (const code of ['gl', 'gl-ES']) {
  const catalog = require('../imports/i18n/data/' + code + '.i18n.json');
  for (const key of settingsKeys) {
    assert.ok(catalog[key]?.trim(), key);
    assert.notEqual(catalog[key], englishLabels[key], code + ': ' + key);
    assert.deepEqual(translationTokens(catalog[key]), translationTokens(englishLabels[key]), key);
  }
  assert.match(catalog['read-only-field'], /só os administradores do taboleiro poden cambialo/);
  assert.match(catalog['scrum-import-into-board-hint'], /nunca se duplican/);
  assert.match(catalog['scrum-import-into-board-hint'], /non coinciden.*sen cambios/);
  assert.match(catalog['r-moved-forward'], /adiante.*posterior/);
  assert.match(catalog['r-moved-back'], /atrás.*anterior/);
  assert.match(catalog['oauth-providers-allowed-email-domains'], /en branco permítense todos/);
  for (const literal of ['LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS', 'LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED']) assert.ok(catalog['ldap-sync-now-nothing'].includes(literal));
  assert.ok(catalog['external-link-rules-description'].includes('[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}'));
  assert.deepEqual(catalog['external-link-rules-description'].match(/\{[^{}]+\}/g), englishLabels['external-link-rules-description'].match(/\{[^{}]+\}/g));
  assert.ok(catalog['external-link-identifier-aliases'].includes('TK=Task, IN=Incident'));
}

const planningKeys = ["scrum-import-invalid-file", "scrum-import-preview-sprints", "scrum-import-preview-releases", "scrum-import-preview-cards", "scrum-import-preview-nothing", "scrum-import-into-board-done", "scrum-import-card-not-matched", "scrum-import-card-ambiguous", "scrum-import-card-on-another-board", "scrum-import-record-ambiguous", "scrum-import-record-not-imported", "scrum-import-sprint-finished", "sync-planning-sprint", "sync-planning-releases", "sync-planning-fields", "sync-planning-hint", "stuck-sync-operation-heading"];
for (const code of ['gl', 'gl-ES']) {
  const catalog = require('../imports/i18n/data/' + code + '.i18n.json');
  for (const key of planningKeys) {
    assert.ok(catalog[key]?.trim(), key);
    assert.notEqual(catalog[key], englishLabels[key], code + ': ' + key);
    assert.deepEqual(translationTokens(catalog[key]), translationTokens(englishLabels[key]), key);
  }
  assert.match(catalog['scrum-import-invalid-file'], /non é JSON válido/);
  assert.match(catalog['scrum-import-card-on-another-board'], /outro taboleiro.*sen cambios/);
  assert.match(catalog['scrum-import-sprint-finished'], /Non se moveu.*sprint finalizado/);
  assert.match(catalog['sync-planning-hint'], /primeiro polo ID da fonte e despois polo nome/);
  assert.match(catalog['sync-planning-hint'], /primeira sincronización nunca elimina a planificación/);
  assert.match(catalog['sync-planning-hint'], /cambio local.*mantense ata que a fonte cambia/);
  assert.doesNotMatch(catalog['sync-planning-hint'], /primeira sincronización elimina/);
}

const syncRecoveryKeys = ["stuck-sync-operation-description", "stuck-sync-operation-list", "stuck-sync-operation-progress", "stuck-sync-operation-reason", "stuck-sync-operation-applied", "stuck-sync-operation-reason-scope-changed", "stuck-sync-operation-reason-access-denied", "stuck-sync-operation-reason-trigger-unknown", "stuck-sync-operation-reason-intent-missing", "stuck-sync-operation-reason-unknown", "stuck-sync-operation-replayable-now", "stuck-sync-operation-discard", "stuck-sync-operation-discard-confirm", "stuck-sync-operation-refresh", "stuck-sync-operation-empty", "stuck-sync-operation-truncated", "stuck-sync-operation-unavailable", "stuck-sync-operation-missing", "stuck-sync-operation-not-stuck", "stuck-sync-operation-replayable", "stuck-sync-operation-busy"];
for (const code of ['gl', 'gl-ES']) {
  const catalog = require('../imports/i18n/data/' + code + '.i18n.json');
  for (const key of syncRecoveryKeys) {
    assert.ok(catalog[key]?.trim(), key);
    assert.notEqual(catalog[key], englishLabels[key], code + ': ' + key);
    assert.deepEqual(translationTokens(catalog[key]), translationTokens(englishLabels[key]), key);
  }
  assert.match(catalog['stuck-sync-operation-description'], /cambios xa aplicados mantéñense/);
  assert.match(catalog['stuck-sync-operation-description'], /cambios gardados pendentes nunca se escriben/);
  assert.match(catalog['stuck-sync-operation-discard-confirm'], /cambios que xa aplicou mantéñense/);
  assert.doesNotMatch(catalog['stuck-sync-operation-discard-confirm'], /cambios que xa aplicou elimínanse/);
  assert.match(catalog['stuck-sync-operation-reason-access-denied'], /xa non ten acceso de escritura a toda a lista/);
  assert.match(catalog['stuck-sync-operation-replayable-now'], /non se pode descartar/);
  assert.match(catalog['stuck-sync-operation-not-stuck'], /non se pode descartar/);
  assert.match(catalog['stuck-sync-operation-replayable'], /non se descartou/);
  assert.match(catalog['stuck-sync-operation-truncated'], /50 máis antigas/);
}

const recoveryResultKeys = ["stuck-sync-operation-failed", "interrupted-import-heading", "interrupted-import-description", "interrupted-import-board", "interrupted-import-progress", "interrupted-import-created", "interrupted-import-source", "interrupted-import-state-stopped", "interrupted-import-state-failed", "interrupted-import-state-discarding", "interrupted-import-scrum", "interrupted-import-counts", "interrupted-import-no-board", "interrupted-import-keep", "interrupted-import-discard", "interrupted-import-keep-confirm", "interrupted-import-discard-confirm", "interrupted-import-refresh", "interrupted-import-empty", "interrupted-import-truncated", "interrupted-import-unavailable", "interrupted-import-missing", "interrupted-import-not-interrupted", "interrupted-import-foreign-board", "interrupted-import-scrum-busy", "interrupted-import-failed", "scrum-history-checkpoint-stuck", "scrum-history-checkpoint-counts", "scrum-history-checkpoint-hint", "scrum-history-checkpoint-rollback", "scrum-history-checkpoint-discard", "scrum-history-checkpoint-discard-confirm", "scrum-history-checkpoint-ask-admin", "login-setting-env-only"];
for (const code of ['gl', 'gl-ES']) {
  const catalog = require('../imports/i18n/data/' + code + '.i18n.json');
  for (const key of recoveryResultKeys) {
    assert.ok(catalog[key]?.trim(), key);
    assert.notEqual(catalog[key], englishLabels[key], code + ': ' + key);
    assert.deepEqual(translationTokens(catalog[key]), translationTokens(englishLabels[key]), key);
  }
  assert.match(catalog['interrupted-import-description'], /non se pode continuar porque non se conserva o ficheiro de orixe/);
  assert.match(catalog['interrupted-import-description'], /incluído todo o que se engadiu desde entón/);
  assert.match(catalog['interrupted-import-keep-confirm'], /Non se elimina nada/);
  assert.match(catalog['interrupted-import-discard-confirm'], /todo o seu contido elimínanse permanentemente/);
  assert.match(catalog['interrupted-import-foreign-board'], /non se modificou/);
  assert.match(catalog['interrupted-import-truncated'], /50 máis antigas/);
  assert.match(catalog['scrum-history-checkpoint-hint'], /só se ofrece cando ninguén máis modificou/);
  assert.match(catalog['scrum-history-checkpoint-hint'], /non modifica ningún rexistro/);
  assert.match(catalog['scrum-history-checkpoint-stuck'], /bloqueada ata que se resolva/);
  assert.match(catalog['login-setting-env-only'], /Só o contorno do servidor.*só para lectura/);
  assert.doesNotMatch(catalog['interrupted-import-keep-confirm'], /elimínase o taboleiro/);
}
