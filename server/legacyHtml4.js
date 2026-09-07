import { WebApp } from 'meteor/webapp';
import { Meteor } from 'meteor/meteor';
import { DDP } from 'meteor/ddp';
import Settings from '/models/settings';
import { TAPi18n } from '/imports/i18n';
import {
  consumeLegacyHtml4DownloadSession,
  consumeLegacyHtml4Session,
  sessionFields,
} from '/server/lib/legacyHtml4Session';
import { legacyHtml4Page } from '/server/lib/legacyHtml4Pages';
import EventLog from '/models/eventLog';
import { repairBrokenCardsForAdmin } from '/server/methods/repairBrokenCards';
import { restoreListSwimlanesForAdmin } from '/server/methods/restoreListSwimlanes';
import {
  importLegacyHtml4File,
  importLegacyHtml4ScopedFile,
  importLegacyHtml4Text,
} from '/server/lib/legacyHtml4Imports';
import {
  isLegacyHtml4Multipart,
  receiveLegacyHtml4Multipart,
  removeLegacyHtml4Upload,
} from '/server/lib/legacyHtml4Multipart';
import {
  castAccessibleCardPoker,
  castAccessibleCardVote,
  createAccessibleCard,
  createAccessibleSubtask,
  moveAccessibleCard,
  moveAccessibleCardToList,
  moveAccessibleSubtask,
  removeAccessibleCardLocation,
  removeAccessibleCardDependency,
  removeAccessibleCardStickerAt,
  saveAccessibleCardLocation,
  saveAccessibleCardDependency,
  setAccessibleCardSticker,
  setAccessibleCardCustomFieldAssigned,
  setAccessibleCardLabel,
  setAccessibleCardIdentity,
  setAccessibleCardPerson,
  setAccessibleCardArchived,
  setAccessibleSubtaskArchived,
  updateAccessibleCardColor,
  updateAccessibleCardDate,
  updateAccessibleCardIdentityText,
  updateAccessibleCardMetric,
  updateAccessibleCardParent,
  updateAccessibleCardSort,
  updateAccessibleCardCustomField,
  updateAccessibleCardContent,
  updateAccessibleCardPoker,
  updateAccessibleCardVote,
  updateAccessibleSubtaskTitle,
} from '/server/lib/accessibleCardOperations';
import {
  createAccessibleComment,
  removeAccessibleComment,
  updateAccessibleComment,
} from '/server/lib/accessibleCommentOperations';
import { toggleAccessibleCommentReaction } from '/server/lib/accessibleCommentReactionOperations';
import { serveLegacyHtml4ChecklistExport } from '/server/lib/legacyHtml4ScopedExport';
import { serveAccessibleRulesExport } from '/server/lib/accessibleRuleExport';
import { serveLegacyHtml4Attachment } from '/server/lib/legacyHtml4AttachmentResponse';
import { permanentlyDeleteAttachmentFromFilesReport } from '/server/lib/permanentAttachmentDelete';
import { setProblemFeatureSettingForAdmin } from '/server/lib/problemFeatureSettings';
import { setPermanentDeleteEnabledForAdmin } from '/server/lib/permanentDeleteSetting';
import { checkNewestVersionsForAdmin } from '/server/statistics';
import {
  removeAccessibleAttachment,
  renameAccessibleAttachment,
  setAccessibleAttachmentCover,
} from '/server/lib/accessibleAttachmentOperations';
import {
  copyAccessibleBoard,
  createAccessibleBoardWithInitialSwimlanes,
  permanentlyDeleteAccessibleArchivedBoards,
  setAccessibleBoardWorkspace,
  setAccessibleBoardArchived,
  toggleAccessibleBoardStar,
  toggleAccessibleDefaultBoard,
} from '/server/lib/accessibleBoardListOperations';
import { updateAccessibleWatch } from '/server/notifications/watch';
import {
  copyAccessibleChecklist,
  convertAccessibleChecklistItemToCard,
  createAccessibleChecklist,
  createAccessibleChecklistItem,
  moveAccessibleChecklist,
  moveAccessibleChecklistItem,
  moveAccessibleChecklistToCard,
  removeAccessibleChecklist,
  removeAccessibleChecklistItem,
  toggleAccessibleChecklistItem,
  toggleAccessibleChecklistSetting,
  updateAccessibleChecklistItemTitle,
  updateAccessibleChecklistTitle,
} from '/server/lib/accessibleChecklistOperations';
import {
  createAccessibleWorkflowRule,
  createAccessibleParameterizedRule,
  importAccessibleRules,
  removeAccessibleRule,
  renameAccessibleRule,
  replaceAccessibleWorkflowAction,
} from '/server/lib/accessibleRuleOperations';
import {
  CAPABILITY_SCRIPT_PATH,
  capabilityScript,
  isDocumentRequest,
  renderLegacyHtml4Page,
} from '/imports/lib/legacyHtml4';

// Progressive enhancement starts with a usable document. A capable browser
// requests the normal Meteor document using a request header after the small
// external probe succeeds. No browser name, cookie or URL mode flag is used.
WebApp.handlers.get(CAPABILITY_SCRIPT_PATH, (req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(capabilityScript);
});

function requestLanguage(req) {
  const header = String(req.headers?.['accept-language'] || 'en');
  for (const part of header.split(',')) {
    const requested = part.split(';')[0].trim();
    const exact = TAPi18n.resolveTag(requested);
    const base = TAPi18n.resolveTag(requested.split('-')[0]);
    if (exact || base) return exact || base;
  }
  return 'en';
}

function translatedOr(translate, key, fallback, argumentsObject = {}) {
  const value = translate(key, argumentsObject);
  return value && value !== key ? value : fallback;
}

function binaryPurpose(body = {}) {
  if (body.legacyOperation === 'export-rules') {
    const boardId = String(body.boardId || '').replace(/[^A-Za-z0-9_-]/g, '');
    const format = String(body.ruleExportFormat || '').replace(/[^a-z]/g, '');
    return `download:rules-${boardId}-${format}`;
  }
  if (body.legacyOperation === 'export-checklist') {
    return `download:${String(body.checklistId || '').replace(/[^A-Za-z0-9_-]/g, '')}`;
  }
  if (body.legacyOperation === 'preview-attachment-gif') {
    return `download:gif-${String(body.attachmentId || '').replace(/[^A-Za-z0-9_-]/g, '')}`;
  }
  if (body.legacyOperation === 'download-attachment-original') {
    return `download:original-${String(body.attachmentId || '').replace(/[^A-Za-z0-9_-]/g, '')}`;
  }
  if (body.legacyOperation === 'preview-admin-attachment-gif') {
    return `download:admin-gif-${String(body.attachmentId || '')
      .replace(/[^A-Za-z0-9_-]/g, '')}`;
  }
  if (body.legacyOperation === 'download-admin-attachment-original') {
    return `download:admin-original-${String(body.attachmentId || '')
      .replace(/[^A-Za-z0-9_-]/g, '')}`;
  }
  return '';
}

WebApp.handlers.use(async (req, res, next) => {
  const path = new URL(req.url, 'http://wekan.invalid').pathname;
  let session = null;
  let multipartUpload = null;
  if (isLegacyHtml4Multipart(req, path)) {
    try {
      const multipart = await receiveLegacyHtml4Multipart(req);
      req.body = multipart.fields;
      multipartUpload = multipart.upload;
    } catch (_) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('Invalid or oversized import upload.');
      return;
    }
  }
  if (req.method === 'POST' && req.body?.legacySession) {
    session = ['export-rules', 'export-checklist', 'preview-attachment-gif',
      'download-attachment-original', 'preview-admin-attachment-gif',
      'download-admin-attachment-original'].includes(req.body?.legacyOperation)
      ? await consumeLegacyHtml4DownloadSession(req, path, binaryPurpose(req.body))
      : await consumeLegacyHtml4Session(req, path);
    if (!session) {
      await removeLegacyHtml4Upload(multipartUpload);
      try {
        require('/server/lib/canary').tripCanary('authz.legacy-html4-session', {
          req,
          detail: `refused invalid, expired or replayed HTML4 action for ${path}`,
        });
      } catch (_) { /* reporting must not weaken the refusal */ }
      res.statusCode = 303;
      res.setHeader('Location', path);
      res.end();
      return;
    }
  } else if (!isDocumentRequest(req)) {
    await removeLegacyHtml4Upload(multipartUpload);
    return next();
  }

  const setting = (await Settings.findOneAsync({})) || {};
  const language = requestLanguage(req);
  await TAPi18n.ensureLanguageLoaded(language);
  const translate = (key, argumentsObject = {}) => TAPi18n.__(key, argumentsObject, language);
  const user = session ? await Meteor.users.findOneAsync(session.userId, {
    fields: { username: 1, isAdmin: 1 },
  }) : null;
  const query = new URL(req.url, 'http://wekan.invalid').searchParams;
  const requestFields = { ...(req.body || {}) };
  const rulesPath = /^\/b\/([^/]+)\/[^/]+\/rules$/.exec(path);
  if (session && path === '/admin/settings/version'
    && requestFields.legacyOperation === 'check-newest-versions') {
    try {
      const result = await checkNewestVersionsForAdmin(session.userId);
      requestFields.legacyVersionResult = result.text;
    } catch (error) {
      requestFields.legacyVersionResult = translatedOr(
        translate, error?.error || 'version-check-failed',
        'It was not possible to check the version number.',
      );
    }
  }
  if (session && path === '/admin/problems/security'
    && requestFields.legacyOperation === 'set-security-feature') {
    try {
      if (requestFields.enabled !== 'true' && requestFields.enabled !== 'false') {
        throw new Meteor.Error('invalid-setting-value');
      }
      await setProblemFeatureSettingForAdmin(
        session.userId,
        'security',
        String(requestFields.settingField || ''),
        requestFields.enabled === 'true',
        { req },
      );
      requestFields.legacySecurityResult = translatedOr(
        translate, 'saved', 'Saved',
      );
    } catch (error) {
      requestFields.legacySecurityResult = translatedOr(
        translate, error?.error || 'operation-failed', 'Operation failed',
      );
    }
  }
  if (session && path === '/admin/problems/notifications'
    && requestFields.legacyOperation === 'set-notification-feature') {
    try {
      if (requestFields.enabled !== 'true' && requestFields.enabled !== 'false') {
        throw new Meteor.Error('invalid-setting-value');
      }
      await setProblemFeatureSettingForAdmin(
        session.userId,
        'notifications',
        String(requestFields.settingField || ''),
        requestFields.enabled === 'true',
        { req },
      );
      requestFields.legacyNotificationsResult = translatedOr(
        translate, 'done', 'Done',
      );
    } catch (error) {
      requestFields.legacyNotificationsResult = translatedOr(
        translate, error?.error || 'operation-failed', 'Operation failed',
      );
    }
  }
  if (session && path === '/admin/problems/delete'
    && requestFields.legacyOperation === 'set-permanent-delete') {
    try {
      if (requestFields.enabled !== 'true' && requestFields.enabled !== 'false') {
        throw new Meteor.Error('invalid-setting-value');
      }
      await setPermanentDeleteEnabledForAdmin(
        session.userId,
        requestFields.enabled === 'true',
        { httpHeaders: req.headers, clientAddress: req.socket?.remoteAddress },
      );
      requestFields.legacyDeleteResult = translatedOr(translate, 'done', 'Done');
    } catch (error) {
      requestFields.legacyDeleteResult = translatedOr(
        translate, error?.error || 'operation-failed', 'Operation failed',
      );
    }
  }
  if (session && path === '/admin/problems/summary'
    && ['acknowledge-problems', 'repair-broken-cards', 'restore-list-swimlanes']
      .includes(requestFields.legacyOperation)) {
    try {
      if (requestFields.legacyOperation === 'acknowledge-problems') {
        const streams = Array.isArray(requestFields.problemStreams)
          ? requestFields.problemStreams : requestFields.problemStreams
            ? [requestFields.problemStreams] : [];
        if (streams.length) {
          await EventLog.acknowledgeForAdmin(session.userId, streams);
          requestFields.legacyProblemResult = translatedOr(
            translate, 'acknowledge', 'Acknowledge',
          );
        }
      } else if (requestFields.legacyOperation === 'repair-broken-cards') {
        const result = await repairBrokenCardsForAdmin(session.userId);
        const fixed = (result.cardsAssigned || 0) + (result.cardsRescued || 0)
          + (result.archivedCardsFixed || 0) + (result.listsAssigned || 0)
          + (result.swimlanesAssigned || 0);
        requestFields.legacyProblemResult = result.unfixable > 0
          ? translate('repair-broken-cards-done-unfixable', {
            fixed, unfixable: result.unfixable,
          }) : translate('repair-broken-cards-done', { fixed });
      } else {
        const result = await restoreListSwimlanesForAdmin(session.userId);
        requestFields.legacyProblemResult = translate('restore-list-swimlanes-done', result);
      }
    } catch (error) {
      requestFields.legacyProblemResult = translatedOr(
        translate, error?.error || 'operation-failed', 'Operation failed',
      );
      try {
        require('/server/lib/canary').tripCanary('authz.legacy-html4-admin-problems', {
          req, userId: session.userId,
          detail: `refused HTML4 Problems Summary operation: ${String(error?.error || 'failed')}`,
        });
      } catch (_) { /* reporting must not weaken the refusal */ }
    }
  }
  if (session && rulesPath && requestFields.legacyOperation === 'export-rules') {
    try {
      const routeBoardId = decodeURIComponent(rulesPath[1]);
      if (requestFields.boardId !== routeBoardId) {
        throw new Meteor.Error('forbidden', 'Rule export does not belong to route board');
      }
      await serveAccessibleRulesExport({
        res,
        userId: session.userId,
        boardId: routeBoardId,
        format: requestFields.ruleExportFormat,
      });
    } catch (error) {
      try {
        require('/server/lib/canary').tripCanary('authz.legacy-html4-export', {
          req, userId: session.userId,
          detail: `refused HTML4 rules export: ${String(error?.error || 'failed')}`,
        });
      } catch (_) { /* reporting must not weaken the refusal */ }
      if (!res.headersSent) {
        res.statusCode = error?.error === 'forbidden' ? 403 : 400;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('Rules export denied.');
      } else res.end();
    }
    return;
  }
  if (session && rulesPath
    && requestFields.legacyOperation === 'confirm-delete-rule') {
    requestFields.confirmRuleDelete = String(requestFields.ruleId || '');
  }
  if (session && rulesPath
    && ['create-workflow-rule', 'create-parameterized-rule',
      'replace-workflow-action', 'import-rules',
      'rename-rule', 'delete-rule']
      .includes(requestFields.legacyOperation)) {
    try {
      const invocation = { userId: session.userId,
        connection: { clientAddress: String(session.address || '') } };
      const result = await DDP._CurrentMethodInvocation.withValue(invocation, () => {
        const input = {
          boardId: decodeURIComponent(rulesPath[1]),
          ruleId: String(requestFields.ruleId || ''),
        };
        if (requestFields.legacyOperation === 'create-workflow-rule') {
          return createAccessibleWorkflowRule(session.userId, {
            boardId: input.boardId,
            title: requestFields.ruleTitle,
            triggerIndex: requestFields.triggerIndex,
            actionIndex: requestFields.actionIndex,
          });
        }
        if (requestFields.legacyOperation === 'create-parameterized-rule') {
          const fields = {};
          for (const name of [
            'triggerCardTitle', 'triggerListName', 'triggerSwimlaneName',
            'triggerUsername', 'triggerLabelId', 'triggerChecklistName',
            'triggerChecklistItemName', 'triggerScheduleType', 'triggerTime',
            'triggerWeekday', 'triggerDayOfMonth', 'triggerDate',
            'triggerDueCondition', 'triggerDays', 'triggerButtonLabel',
            'actionBoardId', 'actionCardName', 'actionListName',
            'actionFromListName', 'actionSwimlaneName', 'actionLabelId',
            'actionUsername', 'actionSortField', 'actionDateField',
            'actionAmount', 'actionUnit', 'actionColor', 'actionChecklistName',
            'actionChecklistItemName', 'actionChecklistItems', 'actionEmailTo',
            'actionEmailSubject', 'actionEmailMessage',
          ]) fields[name] = requestFields[name];
          return createAccessibleParameterizedRule(session.userId, {
            boardId: input.boardId,
            title: requestFields.ruleTitle,
            triggerKind: requestFields.triggerKind,
            actionKind: requestFields.actionKind,
            fields,
          });
        }
        if (requestFields.legacyOperation === 'replace-workflow-action') {
          return replaceAccessibleWorkflowAction(session.userId, {
            ...input, actionIndex: requestFields.actionIndex,
          });
        }
        if (requestFields.legacyOperation === 'import-rules') {
          return importAccessibleRules(session.userId, {
            boardId: input.boardId,
            format: requestFields.ruleImportFormat,
            text: requestFields.ruleImportText,
          });
        }
        return requestFields.legacyOperation === 'rename-rule'
          ? renameAccessibleRule(session.userId, {
              ...input, title: requestFields.ruleTitle,
            })
          : removeAccessibleRule(session.userId, input);
      });
      requestFields.legacyRuleResult = { ok: true, result };
    } catch (error) {
      requestFields.legacyRuleResult = {
        ok: false,
        errorKey: typeof error?.error === 'string' && /^[a-z0-9_-]{1,100}$/i.test(error.error)
          ? error.error : 'operation-failed',
      };
    }
  }
  const cardOperations = [
    'create-card', 'move-card-up', 'move-card-down', 'edit-card-title',
    'edit-card-description', 'edit-card-date', 'edit-card-color', 'move-card-to-list',
    'toggle-card-label', 'toggle-card-person', 'toggle-card-identity',
    'edit-card-identity-text', 'edit-card-sort', 'save-card-location',
    'remove-card-location', 'set-card-sticker', 'remove-card-sticker',
    'assign-card-custom-field', 'edit-card-custom-field',
    'edit-card-custom-field-checkbox',
    'save-card-dependency', 'remove-card-dependency',
    'configure-card-vote', 'update-card-vote-end', 'cast-card-vote', 'remove-card-vote',
    'configure-card-poker', 'update-card-poker-end', 'cast-card-poker',
    'finish-card-poker', 'replay-card-poker', 'estimate-card-poker', 'remove-card-poker',
    'set-card-due-complete', 'set-card-spent-time', 'clear-card-spent-time',
    'set-card-watch', 'set-card-parent', 'add-subtask', 'edit-subtask-title',
    'move-subtask-up', 'move-subtask-down', 'archive-subtask',
    'archive-card', 'restore-card',
  ];
  const commentOperations = [
    'add-comment', 'edit-comment', 'delete-comment', 'toggle-comment-reaction',
  ];
  const checklistOperations = [
    'add-checklist', 'edit-checklist', 'delete-checklist', 'toggle-checklist-setting',
    'move-checklist-up', 'move-checklist-down', 'move-checklist-to-card',
    'copy-checklist-to-card',
    'add-checklist-item', 'edit-checklist-item', 'toggle-checklist-item',
    'delete-checklist-item', 'move-checklist-item-up', 'move-checklist-item-down',
    'convert-checklist-item-to-card',
  ];
  const attachmentOperations = [
    'rename-attachment', 'delete-attachment', 'set-attachment-cover',
  ];
  const boardListOperations = [
    'toggle-board-star', 'toggle-default-board', 'archive-board', 'restore-board',
    'create-board', 'copy-board',
    'set-board-workspace',
    'permanently-delete-board',
  ];
  const isBoardListPath = /^\/(?:allboards|templates|remaining|archive)(?:\/|$)/.test(path);
  if (session && isBoardListPath
    && requestFields.legacyOperation === 'confirm-archive-board') {
    requestFields.confirmBoardArchive = String(requestFields.boardId || '');
  }
  if (session && isBoardListPath
    && requestFields.legacyOperation === 'confirm-copy-board') {
    requestFields.confirmBoardCopy = String(requestFields.boardId || '');
  }
  if (session && isBoardListPath
    && requestFields.legacyOperation === 'confirm-permanently-delete-board') {
    requestFields.confirmBoardPermanentDelete = String(requestFields.boardId || '');
  }
  if (session && isBoardListPath
    && boardListOperations.includes(requestFields.legacyOperation)) {
    try {
      const invocation = { userId: session.userId,
        connection: { clientAddress: String(session.address || '') } };
      const result = await DDP._CurrentMethodInvocation.withValue(invocation, async () => {
        const boardId = String(requestFields.boardId || '');
        if (requestFields.legacyOperation === 'toggle-board-star') {
          return toggleAccessibleBoardStar(session.userId, boardId);
        }
        if (requestFields.legacyOperation === 'toggle-default-board') {
          return toggleAccessibleDefaultBoard(session.userId, boardId);
        }
        if (requestFields.legacyOperation === 'create-board') {
          const type = requestFields.boardType === 'template-container'
            ? 'template-container' : 'board';
          return createAccessibleBoardWithInitialSwimlanes(session.userId, {
            title: String(requestFields.boardTitle || ''),
            permission: String(requestFields.boardPermission || 'private'),
            type,
            migrationVersion: 1,
            swimlanes: type === 'template-container' ? [
              { title: 'Card Templates', sort: 1, type: 'template-container', role: 'card' },
              { title: 'List Templates', sort: 2, type: 'template-container', role: 'list' },
              { title: 'Board Templates', sort: 3, type: 'template-container', role: 'board' },
            ] : [{ title: 'Default' }],
          });
        }
        if (requestFields.legacyOperation === 'copy-board') {
          const source = await copyAccessibleBoard(session.userId, boardId, {});
          return source;
        }
        if (requestFields.legacyOperation === 'set-board-workspace') {
          return setAccessibleBoardWorkspace(
            session.userId, boardId, String(requestFields.workspaceId || ''),
          );
        }
        if (requestFields.legacyOperation === 'permanently-delete-board') {
          return permanentlyDeleteAccessibleArchivedBoards(
            session.userId, [boardId], invocation.connection,
          );
        }
        return setAccessibleBoardArchived(
          session.userId, boardId, requestFields.legacyOperation === 'archive-board',
        );
      });
      requestFields.legacyBoardListResult = { ok: true, result };
    } catch (error) {
      requestFields.legacyBoardListResult = {
        ok: false,
        errorKey: typeof error?.error === 'string' && /^[a-z0-9_-]{1,100}$/i.test(error.error)
          ? error.error : 'operation-failed',
      };
    }
  }
  const isFilesReportPath = path === '/admin/problems/files';
  if (session && isFilesReportPath
    && requestFields.legacyOperation === 'confirm-permanently-delete-admin-attachment') {
    requestFields.confirmPermanentAttachmentDelete = String(
      requestFields.attachmentId || '',
    );
  }
  if (session && isFilesReportPath
    && requestFields.legacyOperation === 'permanently-delete-admin-attachment') {
    try {
      const invocation = { userId: session.userId,
        connection: { clientAddress: String(session.address || '') } };
      await DDP._CurrentMethodInvocation.withValue(invocation, () =>
        permanentlyDeleteAttachmentFromFilesReport(
          session.userId, String(requestFields.attachmentId || ''),
          invocation.connection,
        ));
      requestFields.legacyFilesResult = { ok: true };
    } catch (error) {
      requestFields.legacyFilesResult = {
        ok: false,
        errorKey: typeof error?.error === 'string'
          && /^[a-z0-9_-]{1,100}$/i.test(error.error)
          ? error.error : 'operation-failed',
      };
    }
  }
  if (session && isFilesReportPath
    && ['preview-admin-attachment-gif', 'download-admin-attachment-original']
      .includes(requestFields.legacyOperation)) {
    try {
      await serveLegacyHtml4Attachment({
        res, userId: session.userId,
        attachmentId: requestFields.attachmentId,
        representation: requestFields.legacyOperation === 'preview-admin-attachment-gif'
          ? 'gif' : 'original',
        adminOnly: true,
      });
    } catch (error) {
      try {
        require('/server/lib/canary').tripCanary('authz.legacy-html4-admin-attachment', {
          req, userId: session.userId,
          detail: `refused HTML4 Admin attachment response: ${String(error?.message || 'failed')}`,
        });
      } catch (_) { /* reporting must not weaken the refusal */ }
      if (!res.headersSent) {
        res.statusCode = error?.statusCode || (error?.message === 'forbidden' ? 403 : 415);
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('Attachment response denied.');
      } else res.end();
    }
    return;
  }
  if (session && /^\/b\/[^/]+/.test(path)
    && ['preview-attachment-gif', 'download-attachment-original']
      .includes(requestFields.legacyOperation)) {
    try {
      await serveLegacyHtml4Attachment({
        res, userId: session.userId,
        boardId: requestFields.boardId,
        cardId: requestFields.cardId,
        attachmentId: requestFields.attachmentId,
        representation: requestFields.legacyOperation === 'preview-attachment-gif'
          ? 'gif' : 'original',
      });
    } catch (error) {
      try {
        require('/server/lib/canary').tripCanary('authz.legacy-html4-attachment', {
          req, userId: session.userId,
          detail: `refused HTML4 attachment response: ${String(error?.message || 'failed')}`,
        });
      } catch (_) { /* reporting must not weaken the refusal */ }
      if (!res.headersSent) {
        res.statusCode = error?.statusCode || (error?.message === 'forbidden' ? 403 : 415);
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('Attachment response denied.');
      } else res.end();
    }
    return;
  }
  if (session && /^\/b\/[^/]+/.test(path)
    && requestFields.legacyOperation === 'export-checklist') {
    try {
      await serveLegacyHtml4ChecklistExport({
        res,
        userId: session.userId,
        boardId: requestFields.boardId,
        cardId: requestFields.cardId,
        checklistId: requestFields.checklistId,
        format: requestFields.exportFormat,
        exportFields: requestFields.exportFields,
      });
    } catch (error) {
      try {
        require('/server/lib/canary').tripCanary('authz.legacy-html4-export', {
          req, userId: session.userId,
          detail: `refused HTML4 checklist export: ${String(error?.error || 'failed')}`,
        });
      } catch (_) { /* reporting must not weaken the refusal */ }
      if (!res.headersSent) {
        res.statusCode = error?.error === 'forbidden' ? 403 : 400;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('Checklist export denied.');
      } else res.end();
    }
    return;
  }
  if (session && /^\/b\/[^/]+/.test(path)
    && requestFields.legacyOperation === 'confirm-delete-comment') {
    requestFields.confirmCommentDelete = String(requestFields.commentId || '');
  }
  if (session && /^\/b\/[^/]+/.test(path)
    && requestFields.legacyOperation === 'start-comment-reply') {
    requestFields.replyToComment = String(requestFields.commentId || '');
  }
  if (session && /^\/b\/[^/]+/.test(path)
    && requestFields.legacyOperation === 'confirm-delete-checklist') {
    requestFields.confirmChecklistDelete = String(requestFields.checklistId || '');
  }
  if (session && /^\/b\/[^/]+/.test(path)
    && requestFields.legacyOperation === 'confirm-delete-checklist-item') {
    requestFields.confirmChecklistItemDelete = String(requestFields.itemId || '');
  }
  if (session && /^\/b\/[^/]+/.test(path)
    && requestFields.legacyOperation === 'confirm-delete-attachment') {
    requestFields.confirmAttachmentDelete = String(requestFields.attachmentId || '');
  }
  if (session && /^\/b\/[^/]+/.test(path)
    && requestFields.legacyOperation === 'confirm-remove-card-vote') {
    requestFields.confirmVoteRemove = String(requestFields.cardId || '');
  }
  if (session && /^\/b\/[^/]+/.test(path)
    && requestFields.legacyOperation === 'confirm-remove-card-poker') {
    requestFields.confirmPokerRemove = String(requestFields.cardId || '');
  }
  if (session && /^\/b\/[^/]+/.test(path)
    && requestFields.legacyOperation === 'confirm-archive-subtask') {
    requestFields.confirmSubtaskArchive = String(requestFields.subtaskId || '');
  }
  if (session && /^\/b\/[^/]+/.test(path)
    && [...cardOperations, ...commentOperations, ...checklistOperations, ...attachmentOperations]
      .includes(requestFields.legacyOperation)) {
    try {
      const invocation = { userId: session.userId,
        connection: { clientAddress: String(session.address || '') } };
      const result = await DDP._CurrentMethodInvocation.withValue(invocation, async () => {
        const attachmentInput = {
          boardId: requestFields.boardId, cardId: requestFields.cardId,
          attachmentId: requestFields.attachmentId,
        };
        if (requestFields.legacyOperation === 'rename-attachment') {
          return renameAccessibleAttachment(session.userId, {
            ...attachmentInput, name: requestFields.attachmentName,
          });
        }
        if (requestFields.legacyOperation === 'delete-attachment') {
          return removeAccessibleAttachment(session.userId, attachmentInput);
        }
        if (requestFields.legacyOperation === 'set-attachment-cover') {
          return setAccessibleAttachmentCover(session.userId, {
            ...attachmentInput, enabled: requestFields.coverState === 'on',
          });
        }
        if (requestFields.legacyOperation === 'add-comment') {
          return createAccessibleComment(session.userId, {
            boardId: requestFields.boardId, cardId: requestFields.cardId,
            text: requestFields.commentText, parentId: requestFields.parentId,
          });
        }
        if (requestFields.legacyOperation === 'edit-comment') {
          return updateAccessibleComment(session.userId, {
            boardId: requestFields.boardId, cardId: requestFields.cardId,
            commentId: requestFields.commentId, text: requestFields.commentText,
          });
        }
        if (requestFields.legacyOperation === 'delete-comment') {
          return removeAccessibleComment(session.userId, {
            boardId: requestFields.boardId, cardId: requestFields.cardId,
            commentId: requestFields.commentId,
          });
        }
        if (requestFields.legacyOperation === 'toggle-comment-reaction') {
          return toggleAccessibleCommentReaction(session.userId, {
            boardId: requestFields.boardId, cardId: requestFields.cardId,
            commentId: requestFields.commentId,
            reactionCodepoint: requestFields.reactionCodepoint,
          });
        }
        const checklistInput = {
          boardId: requestFields.boardId, cardId: requestFields.cardId,
          checklistId: requestFields.checklistId, itemId: requestFields.itemId,
        };
        if (requestFields.legacyOperation === 'add-checklist') {
          return createAccessibleChecklist(session.userId, {
            ...checklistInput, title: requestFields.checklistTitle,
            position: requestFields.position,
          });
        }
        if (requestFields.legacyOperation === 'edit-checklist') {
          return updateAccessibleChecklistTitle(session.userId, {
            ...checklistInput, title: requestFields.checklistTitle,
          });
        }
        if (requestFields.legacyOperation === 'delete-checklist') {
          return removeAccessibleChecklist(session.userId, checklistInput);
        }
        if (requestFields.legacyOperation === 'move-checklist-up'
          || requestFields.legacyOperation === 'move-checklist-down') {
          return moveAccessibleChecklist(session.userId, {
            ...checklistInput,
            direction: requestFields.legacyOperation === 'move-checklist-up' ? 'up' : 'down',
          });
        }
        if (requestFields.legacyOperation === 'move-checklist-to-card') {
          const [targetBoardId, targetCardId] = String(requestFields.targetCardRef || '').split('|');
          return moveAccessibleChecklistToCard(session.userId, {
            ...checklistInput, targetBoardId, targetCardId,
          });
        }
        if (requestFields.legacyOperation === 'copy-checklist-to-card') {
          const [targetBoardId, targetCardId] = String(requestFields.targetCardRef || '').split('|');
          return copyAccessibleChecklist(session.userId, {
            ...checklistInput, targetBoardId, targetCardId,
          });
        }
        if (requestFields.legacyOperation === 'toggle-checklist-setting') {
          return toggleAccessibleChecklistSetting(session.userId, {
            ...checklistInput, setting: requestFields.checklistSetting,
          });
        }
        if (requestFields.legacyOperation === 'add-checklist-item') {
          return createAccessibleChecklistItem(session.userId, {
            ...checklistInput, title: requestFields.checklistItemTitle,
            position: requestFields.position,
          });
        }
        if (requestFields.legacyOperation === 'edit-checklist-item') {
          return updateAccessibleChecklistItemTitle(session.userId, {
            ...checklistInput, title: requestFields.checklistItemTitle,
          });
        }
        if (requestFields.legacyOperation === 'toggle-checklist-item') {
          return toggleAccessibleChecklistItem(session.userId, checklistInput);
        }
        if (requestFields.legacyOperation === 'delete-checklist-item') {
          return removeAccessibleChecklistItem(session.userId, checklistInput);
        }
        if (requestFields.legacyOperation === 'convert-checklist-item-to-card') {
          const [targetBoardId, targetSwimlaneId, targetListId, targetCardId] =
            String(requestFields.cardDestination || '').split('|');
          return convertAccessibleChecklistItemToCard(session.userId, {
            ...checklistInput,
            title: requestFields.convertedCardTitle,
            targetBoardId,
            targetSwimlaneId,
            targetListId,
            targetCardId,
            position: requestFields.position,
          });
        }
        if (requestFields.legacyOperation === 'move-checklist-item-up'
          || requestFields.legacyOperation === 'move-checklist-item-down') {
          return moveAccessibleChecklistItem(session.userId, {
            ...checklistInput,
            direction: requestFields.legacyOperation === 'move-checklist-item-up' ? 'up' : 'down',
          });
        }
        if (requestFields.legacyOperation === 'create-card') {
          return createAccessibleCard(session.userId, {
            boardId: requestFields.boardId, listId: requestFields.listId,
            swimlaneId: requestFields.swimlaneId, title: requestFields.cardTitle,
            position: requestFields.position,
          });
        }
        if (requestFields.legacyOperation === 'move-card-up'
          || requestFields.legacyOperation === 'move-card-down') {
          return moveAccessibleCard(session.userId, requestFields.cardId,
            requestFields.legacyOperation === 'move-card-up' ? 'up' : 'down');
        }
        if (requestFields.legacyOperation === 'edit-card-title'
          || requestFields.legacyOperation === 'edit-card-description') {
          return updateAccessibleCardContent(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId,
            field: requestFields.legacyOperation === 'edit-card-title' ? 'title' : 'description',
            value: requestFields.legacyOperation === 'edit-card-title'
              ? requestFields.cardTitle : requestFields.cardDescription,
          });
        }
        if (requestFields.legacyOperation === 'edit-card-date') {
          return updateAccessibleCardDate(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId,
            field: requestFields.cardDateField, value: requestFields.cardDateValue,
          });
        }
        if (requestFields.legacyOperation === 'edit-card-color') {
          return updateAccessibleCardColor(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId,
            color: requestFields.cardColor,
          });
        }
        if (requestFields.legacyOperation === 'toggle-card-label') {
          return setAccessibleCardLabel(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId,
            labelId: requestFields.labelId, enabled: requestFields.enabled === 'true',
          });
        }
        if (requestFields.legacyOperation === 'toggle-card-person') {
          return setAccessibleCardPerson(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId,
            field: requestFields.cardPersonField,
            targetUserId: requestFields.targetUserId,
            enabled: requestFields.enabled === 'true',
          });
        }
        if (requestFields.legacyOperation === 'edit-card-identity-text') {
          return updateAccessibleCardIdentityText(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId,
            field: requestFields.cardIdentityTextField,
            value: requestFields.cardIdentityText,
          });
        }
        if (requestFields.legacyOperation === 'edit-card-sort') {
          return updateAccessibleCardSort(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId,
            sort: requestFields.cardSort,
          });
        }
        if (requestFields.legacyOperation === 'save-card-location') {
          return saveAccessibleCardLocation(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId,
            locationId: requestFields.locationId, name: requestFields.locationName,
            address: requestFields.locationAddress,
            latitude: requestFields.locationLatitude,
            longitude: requestFields.locationLongitude,
          });
        }
        if (requestFields.legacyOperation === 'remove-card-location') {
          return removeAccessibleCardLocation(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId,
            locationId: requestFields.locationId,
          });
        }
        if (requestFields.legacyOperation === 'set-card-sticker') {
          const stickerParts = String(requestFields.stickerChoice || '').split(':');
          if (stickerParts.length !== 2) throw new Meteor.Error('invalid-card-sticker');
          const [icon, highlight] = stickerParts;
          return setAccessibleCardSticker(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId,
            icon, highlight, enabled: true,
          });
        }
        if (requestFields.legacyOperation === 'remove-card-sticker') {
          return removeAccessibleCardStickerAt(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId,
            index: requestFields.stickerIndex,
          });
        }
        if (requestFields.legacyOperation === 'assign-card-custom-field') {
          return setAccessibleCardCustomFieldAssigned(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId,
            customFieldId: requestFields.customFieldId,
            assigned: requestFields.assigned === 'true',
          });
        }
        if (requestFields.legacyOperation === 'edit-card-custom-field'
          || requestFields.legacyOperation === 'edit-card-custom-field-checkbox') {
          return updateAccessibleCardCustomField(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId,
            customFieldId: requestFields.customFieldId,
            value: requestFields.legacyOperation === 'edit-card-custom-field-checkbox'
              ? requestFields.customFieldValue === 'true' : requestFields.customFieldValue,
          });
        }
        if (requestFields.legacyOperation === 'save-card-dependency') {
          return saveAccessibleCardDependency(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId,
            targetCardId: requestFields.targetCardId,
            type: requestFields.dependencyType,
            color: requestFields.dependencyColor,
            icon: requestFields.dependencyIcon,
          });
        }
        if (requestFields.legacyOperation === 'remove-card-dependency') {
          return removeAccessibleCardDependency(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId,
            targetCardId: requestFields.targetCardId,
          });
        }
        if (requestFields.legacyOperation === 'configure-card-vote') {
          return updateAccessibleCardVote(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId,
            action: 'configure', question: requestFields.voteQuestion,
            public: requestFields.votePublic === 'true',
            allowNonBoardMembers: requestFields.voteAllowNonBoardMembers === 'true',
            end: requestFields.voteEnd,
          });
        }
        if (requestFields.legacyOperation === 'update-card-vote-end') {
          return updateAccessibleCardVote(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId,
            action: 'end', end: requestFields.voteEnd,
          });
        }
        if (requestFields.legacyOperation === 'cast-card-vote') {
          const states = { positive: true, negative: false, clear: null };
          if (!Object.prototype.hasOwnProperty.call(states, requestFields.voteState)) {
            throw new Meteor.Error('invalid-vote-state');
          }
          return castAccessibleCardVote(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId,
            state: states[requestFields.voteState],
          });
        }
        if (requestFields.legacyOperation === 'remove-card-vote') {
          return updateAccessibleCardVote(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId, action: 'remove',
          });
        }
        if (requestFields.legacyOperation === 'configure-card-poker') {
          return updateAccessibleCardPoker(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId,
            action: 'configure',
            allowNonBoardMembers: requestFields.pokerAllowNonBoardMembers === 'true',
            end: requestFields.pokerEnd,
          });
        }
        if (requestFields.legacyOperation === 'update-card-poker-end'
          || requestFields.legacyOperation === 'finish-card-poker') {
          return updateAccessibleCardPoker(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId,
            action: requestFields.legacyOperation === 'finish-card-poker' ? 'finish' : 'end',
            end: requestFields.pokerEnd,
          });
        }
        if (requestFields.legacyOperation === 'cast-card-poker') {
          return castAccessibleCardPoker(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId,
            state: requestFields.pokerState === 'clear' ? null : requestFields.pokerState,
          });
        }
        if (requestFields.legacyOperation === 'replay-card-poker') {
          return updateAccessibleCardPoker(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId, action: 'replay',
          });
        }
        if (requestFields.legacyOperation === 'estimate-card-poker') {
          return updateAccessibleCardPoker(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId,
            action: 'estimation', estimation: requestFields.pokerEstimation,
          });
        }
        if (requestFields.legacyOperation === 'remove-card-poker') {
          return updateAccessibleCardPoker(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId, action: 'remove',
          });
        }
        if (requestFields.legacyOperation === 'set-card-due-complete') {
          return updateAccessibleCardMetric(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId,
            action: 'due-complete', value: requestFields.cardDueComplete === 'true',
          });
        }
        if (requestFields.legacyOperation === 'set-card-spent-time'
          || requestFields.legacyOperation === 'clear-card-spent-time') {
          return updateAccessibleCardMetric(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId,
            action: 'spent-time',
            value: requestFields.legacyOperation === 'clear-card-spent-time'
              ? '' : requestFields.cardSpentTime,
            isOvertime: requestFields.legacyOperation === 'set-card-spent-time'
              && requestFields.cardIsOvertime === 'true',
          });
        }
        if (requestFields.legacyOperation === 'set-card-watch') {
          return updateAccessibleWatch(session.userId, 'card', requestFields.watchCardId,
            requestFields.cardWatch === 'true' ? 'watching' : null);
        }
        if (requestFields.legacyOperation === 'set-card-parent') {
          return updateAccessibleCardParent(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId,
            parentCardId: requestFields.parentCardId || null,
          });
        }
        const subtaskInput = {
          parentCardId: requestFields.cardId,
          boardId: requestFields.boardId,
          subtaskId: requestFields.subtaskId,
        };
        if (requestFields.legacyOperation === 'add-subtask') {
          return createAccessibleSubtask(session.userId, {
            ...subtaskInput, title: requestFields.subtaskTitle,
          });
        }
        if (requestFields.legacyOperation === 'edit-subtask-title') {
          return updateAccessibleSubtaskTitle(session.userId, {
            ...subtaskInput, title: requestFields.subtaskTitle,
          });
        }
        if (requestFields.legacyOperation === 'move-subtask-up'
          || requestFields.legacyOperation === 'move-subtask-down') {
          return moveAccessibleSubtask(session.userId, {
            ...subtaskInput,
            direction: requestFields.legacyOperation === 'move-subtask-up' ? 'up' : 'down',
          });
        }
        if (requestFields.legacyOperation === 'archive-subtask') {
          return setAccessibleSubtaskArchived(session.userId, {
            ...subtaskInput, archived: true,
          });
        }
        if (requestFields.legacyOperation === 'toggle-card-identity') {
          return setAccessibleCardIdentity(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId,
            field: requestFields.cardIdentityField,
            targetUserId: requestFields.targetUserId,
            enabled: requestFields.enabled === 'true',
          });
        }
        if (requestFields.legacyOperation === 'move-card-to-list') {
          return moveAccessibleCardToList(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId,
            listId: requestFields.cardListId, position: requestFields.position,
          });
        }
        return setAccessibleCardArchived(session.userId, {
          cardId: requestFields.cardId, boardId: requestFields.boardId,
          archived: requestFields.legacyOperation === 'archive-card',
        });
      });
      requestFields.legacyCardResult = { ok: true, result };
    } catch (error) {
      const errorKey = typeof error?.error === 'string' && /^[a-z0-9_-]{1,100}$/i.test(error.error)
        ? error.error : 'operation-failed';
      requestFields.legacyCardResult = {
        ok: false,
        errorKey,
      };
    }
  }
  if (session && requestFields.legacyOperation === 'import-board-text') {
    const source = /^\/import\/([^/]+)$/.exec(path)?.[1] || '';
    requestFields.legacyImportResult = await importLegacyHtml4Text({
      userId: session.userId,
      source,
      text: requestFields.importText,
      fields: requestFields.importFields,
      clientAddress: session.address,
    });
  }
  if (session && multipartUpload && /^\/b\/[^/]+/.test(path)
    && requestFields.legacyOperation === 'import-checklist-file') {
    requestFields.legacyImportResult = await importLegacyHtml4ScopedFile({
      userId: session.userId,
      target: {
        boardId: requestFields.boardId,
        cardId: requestFields.cardId,
        checklistId: requestFields.checklistId,
      },
      upload: multipartUpload,
      fields: requestFields.importField,
      clientAddress: session.address,
    });
    if (!requestFields.legacyImportResult?.ok
      && requestFields.legacyImportResult?.errorKey === 'forbidden') {
      try {
        require('/server/lib/securityLog').record({
          category: 'authz', bleed: 'ImportBleed', severity: 'high',
          action: 'blocked', source: 'legacyHtml4:checklist-import', req,
          userId: session.userId,
          detail: 'refused checklist import with mismatched board, card or checklist scope',
        });
      } catch (_) { /* reporting must not weaken the refusal */ }
    }
    requestFields.legacyCardResult = requestFields.legacyImportResult;
  }
  if (session && multipartUpload && requestFields.legacyOperation === 'import-board-file') {
    const source = /^\/import\/([^/]+)$/.exec(path)?.[1] || '';
    requestFields.legacyImportResult = await importLegacyHtml4File({
      userId: session.userId,
      source,
      upload: multipartUpload,
      fields: requestFields.importFields,
      clientAddress: session.address,
    });
  }
  await removeLegacyHtml4Upload(multipartUpload);
  if (query.has('q')) requestFields.q = query.get('q');
  if (query.has('searchView')) requestFields.searchView = query.get('searchView');
  if (query.has('page')) requestFields.page = query.get('page');
  const page = await legacyHtml4Page(path, session?.userId || null, requestFields, translate);

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Vary', 'X-Wekan-Progressive-Client, Accept');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(renderLegacyHtml4Page(req.url, {
    productName: setting.productName || 'WeKan',
    hideLogo: setting.hideLogo === true,
    customLoginLogoLinkUrl: setting.customLoginLogoLinkUrl || '',
    textBelowCustomLoginLogo: setting.textBelowCustomLoginLogo || '',
    legalNotice: setting.legalNotice || '',
    disableRegistration: setting.disableRegistration === true,
    disableForgotPassword: setting.disableForgotPassword === true,
    loginFailed: new URL(req.url, 'http://wekan.invalid').searchParams.get('login') === 'failed',
    registrationFailed: new URL(req.url, 'http://wekan.invalid').searchParams.get('registration') === 'failed',
    authenticated: Boolean(session),
    username: user?.username || '',
    isAdmin: user?.isAdmin === true,
    sessionFields: session ? sessionFields(session, '/allboards') : null,
    actionFields: (action, purpose) => session ? sessionFields(session, action, purpose) : null,
    page,
    language,
    translate,
  }));
});
