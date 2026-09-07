import { Meteor } from 'meteor/meteor';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import Settings from '/models/settings';
import AccessibilitySettings from '/models/accessibilitySettings';
import TableVisibilityModeSettings from '/models/tableVisibilityModeSettings';
import CardComments, { canEditComment } from '/models/cardComments';
import CardCommentReactions from '/models/cardCommentReactions';
import Checklists from '/models/checklists';
import ChecklistItems from '/models/checklistItems';
import Activities from '/models/activities';
import Attachments from '/models/attachments';
import EventLog from '/models/eventLog';
import CustomFields from '/models/customFields';
import Rules from '/models/rules';
import Triggers from '/models/triggers';
import Actions from '/models/actions';
import { CustomFieldStringTemplate } from '/imports/lib/customFields';
import { TAPi18n } from '/imports/i18n';
import { Query } from '/config/query-classes';
import { DEFAULT_LIMIT, OPERATOR_USER } from '/config/search-const';
import { searchBrokenCardsPage, searchCardsPage } from '/server/publications/cards';
import { cleanFileName } from '/imports/lib/fileNameDisplay';
import { attachmentKind } from '/models/lib/attachmentKind';
import getSlug from 'limax';
import {
  allowIsBoardAdmin,
  allowIsBoardMemberCommentOnly,
  allowIsBoardMemberWithWriteAccess,
} from '/server/lib/utils';
import { canEditCardOrLinkedCard } from '/server/lib/linkedCardPermission';
import { canUserSeeBoard, visibleBoardIds } from '/server/lib/visibleBoardIds';
import { getFeatureFlags } from '/models/lib/featureFlags';
import { localizedStoredRuleDescription } from '/models/lib/ruleDescriptionLocalization';
import { getProblemsOverview } from '/server/lib/systemStatus';
import { getCurrentCpu } from '/server/lib/cpuMonitor';
import { loginOfficesForAdmin } from '/server/methods/loginOffices';
import { impersonationReportForAdmin } from '/server/lib/impersonationReport';
import { recoveryReportCountForAdmin, recoveryReportForAdmin } from '/server/lib/recoveryReport';
import { boardsReportCountForAdmin, boardsReportForAdmin } from '/server/lib/boardsReport';
import { cardsReportCountForAdmin, cardsReportForAdmin } from '/server/lib/cardsReport';
const {
  UI_ICONS, uiAction, uiAttachment, uiCardDestinationForm, uiExportForm, uiFileForm, uiLink, uiSearchForm,
  uiBoardCreateForm, uiFieldsetForm, uiSelectForm, uiTextForm, uiTextareaForm,
} = require('/imports/lib/uiComponentLibrary');
const { mapLinkFor } = require('/models/lib/mapLink');
const { KEYBOARD_SHORTCUT_MAPPINGS } = require('/imports/lib/keyboardShortcutMappings');
const { starredPagesOf } = require('/models/lib/starredPages');
const { boardCardScope, assignedOnlyCardScope } = require('/models/lib/boardCardScope');
const { IMPORT_SOURCES, importSourceByKey, importSourceName } = require('/models/lib/importSources');
const { COMMENT_REACTIONS, commentReaction } = require('/models/lib/commentReactionCatalog');
const { STICKER_PICKER } = require('/models/metadata/stickers');
const {
  DEFAULT_DEPENDENCY_COLOR, DEFAULT_DEPENDENCY_ICON, DEPENDENCY_ICON_CHOICES,
  DEPENDENCY_TYPES, normalizeDependencies,
} = require('/models/metadata/dependencies');
const { isChecklistShownAtMinicard } = require('/models/lib/minicardChecklistVisibility');
const { cardActivityDescriptor } = require('/models/lib/cardActivityDescription');
const { GLOBAL_SEARCH_HELP_LINES, GLOBAL_SEARCH_HELP_TAGS } = require('/models/lib/globalSearchHelp');
const { buildCustomFieldsWD } = require('/models/lib/customFieldsWD');
const {
  WORKFLOW_ACTIONS,
  WORKFLOW_TRIGGERS,
} = require('/models/lib/ruleWorkflowCatalog');
const {
  PARAMETERIZED_ACTIONS,
  PARAMETERIZED_TRIGGERS,
} = require('/models/lib/ruleParameterizedCatalog');
const { CARD_COLORS } = require('/models/metadata/colors');
const { ADMIN_PAGES, ADMIN_PANE_TITLES } = require('/models/lib/adminUrls');
const { classifyAddress } = require('/models/lib/ipAddress');
const { countryFlag, locationLabel, officeLabel } = require('/models/lib/geoHeaders');
const { officeRowsByPerson } = require('/models/lib/loginTally');
const POKER_STATES = [
  'one', 'two', 'three', 'five', 'eight', 'thirteen', 'twenty', 'forty',
  'oneHundred', 'unsure',
];
const { BOARD_EXPORT_FIELDS, parseImportFields, toggleImportField } = require('/models/lib/exportFields');
const {
  allBoardsPath, defaultSection, menuSectionOrder, normalizeSection, sectionTitleKey,
  splitWorkspacePath, workspaceIdForSlugPath, workspaceNamePath, workspaceSlugPath,
} = require('/models/lib/allBoardsUrls');

function segment(value) {
  try { return decodeURIComponent(String(value || '')); } catch (_) { return ''; }
}

function boardPath(board) {
  return `/b/${encodeURIComponent(board._id)}/${encodeURIComponent(board.slug || 'board')}`;
}

function boardColor(board) {
  return Array.isArray(board.customThemeColors) && board.customThemeColors[0]
    ? board.customThemeColors[0] : board.color;
}

async function visibleBoard(boardId, userId) {
  const board = await Boards.findOneAsync(boardId);
  return board && board.isVisibleBy(userId ? { _id: userId } : null) ? board : null;
}

function parameterizedTriggerInputs(kind, translate, board) {
  const catalog = {
    triggerCardTitle: { name: 'triggerCardTitle',
      label: tr(translate, 'boardCardTitlePopup-title', 'Card title filter'), maxlength: 500 },
    triggerListName: { name: 'triggerListName',
      label: tr(translate, 'r-list-name', 'List name'), maxlength: 500 },
    triggerSwimlaneName: { name: 'triggerSwimlaneName',
      label: tr(translate, 'r-swimlane-name', 'Swimlane name'), maxlength: 500 },
    triggerUsername: { name: 'triggerUsername',
      label: tr(translate, 'username', 'Username'), maxlength: 500 },
    triggerLabelId: { type: 'select', name: 'triggerLabelId',
      label: tr(translate, 'r-label', 'Label'), options: [{ value: '*', label: '*' }]
        .concat((board.labels || []).map(label => ({ value: label._id,
          label: label.name || tr(translate, `color-${label.color}`, label.color) }))) },
    triggerChecklistName: { name: 'triggerChecklistName',
      label: tr(translate, 'r-checklist', 'Checklist'), maxlength: 500 },
    triggerChecklistItemName: { name: 'triggerChecklistItemName',
      label: tr(translate, 'r-item', 'Item'), maxlength: 500 },
    triggerScheduleType: { type: 'select', name: 'triggerScheduleType',
      label: tr(translate, 'r-schedule-type', 'Repeat'),
      options: ['once', 'daily', 'weekday', 'weekly', 'monthly'].map(value => ({ value,
        label: tr(translate, `r-schedule-${value}`, value) })) },
    triggerTime: { name: 'triggerTime', label: tr(translate, 'r-schedule-at-time', 'Time'),
      value: '09:00', maxlength: 5 },
    triggerWeekday: { type: 'select', name: 'triggerWeekday',
      label: tr(translate, 'r-schedule-on-weekday', 'Weekday'),
      options: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        .map((key, index) => ({ value: index === 6 ? 0 : index + 1,
          label: tr(translate, key, key) })) },
    triggerDayOfMonth: { name: 'triggerDayOfMonth',
      label: tr(translate, 'r-schedule-on-day', 'Day of month'), value: '1', maxlength: 2 },
    triggerDate: { name: 'triggerDate', label: tr(translate, 'r-schedule-on-date', 'Date'),
      maxlength: 10 },
    triggerDueCondition: { type: 'select', name: 'triggerDueCondition',
      label: tr(translate, 'r-when-due', 'Due date'),
      options: ['set', 'soon', 'overdue'].map(value => ({ value,
        label: tr(translate, `r-due-${value === 'set' ? 'is-set' : value}`, value) })) },
    triggerDays: { name: 'triggerDays', label: tr(translate, 'r-for-n-days', 'Days'),
      value: '1', maxlength: 5 },
    triggerButtonLabel: { name: 'triggerButtonLabel',
      label: tr(translate, 'r-button-label', 'Button label'),
      value: tr(translate, 'r-run', 'Run'), maxlength: 500 },
  };
  const card = ['triggerCardTitle', 'triggerListName', 'triggerSwimlaneName', 'triggerUsername'];
  let names = [];
  if (kind.startsWith('card-')) names = card;
  else if (kind.startsWith('label-')) names = ['triggerLabelId', 'triggerUsername'];
  else if (kind.startsWith('member-')) names = ['triggerUsername'];
  else if (kind.startsWith('attachment-')) names = ['triggerUsername'];
  else if (kind.startsWith('checklist-')) names = ['triggerChecklistName', 'triggerUsername'];
  else if (kind.startsWith('item-')) names = ['triggerChecklistItemName', 'triggerUsername'];
  else if (kind === 'scheduled-calendar') names = ['triggerScheduleType', 'triggerTime',
    'triggerWeekday', 'triggerDayOfMonth', 'triggerDate', 'triggerListName'];
  else if (kind === 'scheduled-due') names = ['triggerDueCondition', 'triggerDays', 'triggerTime'];
  else if (kind === 'scheduled-aging') names = ['triggerListName', 'triggerDays', 'triggerTime'];
  else if (kind.endsWith('-button')) names = ['triggerButtonLabel'];
  return names.map(name => catalog[name]);
}

function parameterizedActionInputs(kind, translate, board, visibleBoards) {
  const catalog = {
    actionBoardId: { type: 'select', name: 'actionBoardId',
      label: tr(translate, 'r-board', 'Board'), value: board._id,
      options: visibleBoards.map(candidate => ({ value: candidate._id,
        label: candidate._id === board._id ? tr(translate, 'current', 'Current') : candidate.title })) },
    actionCardName: { name: 'actionCardName', label: tr(translate, 'r-card', 'Card'), maxlength: 500 },
    actionListName: { name: 'actionListName', label: tr(translate, 'r-list-name', 'List name'), maxlength: 500 },
    actionFromListName: { name: 'actionFromListName',
      label: `${tr(translate, 'r-moved-from', 'From')} ${tr(translate, 'r-list', 'list')}`,
      maxlength: 500 },
    actionSwimlaneName: { name: 'actionSwimlaneName',
      label: tr(translate, 'r-swimlane-name', 'Swimlane name'), maxlength: 500 },
    actionLabelId: { type: 'select', name: 'actionLabelId',
      label: tr(translate, 'r-label', 'Label'), options: (board.labels || []).map(label => ({
        value: label._id, label: label.name || tr(translate, `color-${label.color}`, label.color),
      })) },
    actionUsername: { name: 'actionUsername', label: tr(translate, 'username', 'Username'), maxlength: 500 },
    actionSortField: { type: 'select', name: 'actionSortField',
      label: tr(translate, 'r-sort-by', 'Sort by'),
      options: ['due', 'name', 'created', 'modified'].map(value => ({ value,
        label: tr(translate, value === 'due' ? 'r-sort-due'
          : value === 'name' ? 'r-sort-name' : `${value}At`, value) })) },
    actionDateField: { type: 'select', name: 'actionDateField',
      label: tr(translate, 'r-datefield', 'Date field'),
      options: ['startAt', 'dueAt', 'endAt', 'receivedAt'].map(value => ({ value,
        label: tr(translate, `r-df-${value.replace('At', '-at')}`, value) })) },
    actionAmount: { name: 'actionAmount', label: tr(translate, 'r-for-n-days', 'Amount'),
      value: '0', maxlength: 6 },
    actionUnit: { type: 'select', name: 'actionUnit',
      label: tr(translate, 'r-unit-days', 'Unit'),
      options: ['minutes', 'hours', 'days', 'weeks', 'months'].map(value => ({ value,
        label: tr(translate, `r-unit-${value}`, value) })) },
    actionColor: { type: 'select', name: 'actionColor', label: tr(translate, 'r-set-color', 'Color'),
      options: CARD_COLORS.map(value => ({ value,
        label: tr(translate, `color-${value}`, value) })) },
    actionChecklistName: { name: 'actionChecklistName',
      label: tr(translate, 'r-checklist', 'Checklist'), maxlength: 500 },
    actionChecklistItemName: { name: 'actionChecklistItemName',
      label: tr(translate, 'r-item', 'Item'), maxlength: 500 },
    actionChecklistItems: { name: 'actionChecklistItems',
      label: tr(translate, 'r-items-list', 'Items'), maxlength: 10000 },
    actionEmailTo: { name: 'actionEmailTo', label: tr(translate, 'r-to', 'To'), maxlength: 500 },
    actionEmailSubject: { name: 'actionEmailSubject',
      label: tr(translate, 'r-subject', 'Subject'), maxlength: 500 },
    actionEmailMessage: { type: 'textarea', name: 'actionEmailMessage',
      label: tr(translate, 'r-d-send-email-message', 'Message'), maxlength: 10000,
      rows: 8, cols: 70 },
  };
  const placements = ['actionBoardId', 'actionListName', 'actionSwimlaneName'];
  const byKind = {
    'move-top': placements, 'move-bottom': placements,
    'add-swimlane': ['actionSwimlaneName'],
    'create-card': ['actionCardName', 'actionListName', 'actionSwimlaneName'],
    'link-card': placements,
    'sort-list': ['actionListName', 'actionSortField'],
    'move-all-cards': ['actionFromListName', 'actionListName'],
    'set-date': ['actionDateField'], 'update-date': ['actionDateField'],
    'remove-date': ['actionDateField'], 'add-label': ['actionLabelId'],
    'remove-label': ['actionLabelId'], 'add-member': ['actionUsername'],
    'remove-member': ['actionUsername'], 'set-color': ['actionColor'],
    'set-date-relative': ['actionDateField', 'actionAmount', 'actionUnit'],
    'add-checklist': ['actionChecklistName'], 'remove-checklist': ['actionChecklistName'],
    'check-all': ['actionChecklistName'], 'uncheck-all': ['actionChecklistName'],
    'check-item': ['actionChecklistName', 'actionChecklistItemName'],
    'uncheck-item': ['actionChecklistName', 'actionChecklistItemName'],
    'add-checklist-items': ['actionChecklistName', 'actionChecklistItems'],
    'send-email': ['actionEmailTo', 'actionEmailSubject', 'actionEmailMessage'],
  };
  return (byKind[kind] || []).map(name => catalog[name]);
}

async function boardRulesPage(path, userId, requestFields, translate) {
  const match = /^\/b\/([^/]+)\/([^/]+)\/rules$/.exec(path);
  if (!match || !userId) return null;
  const board = await visibleBoard(segment(match[1]), userId);
  if (!board) return null;
  const user = await Meteor.users.findOneAsync(userId, { fields: { isAdmin: 1 } });
  const canAdmin = !!(user?.isAdmin || board.hasAdmin(userId));
  const rules = await Rules.find({ boardId: board._id }, { sort: { title: 1, _id: 1 } }).fetchAsync();
  const triggerIds = rules.map(rule => rule.triggerId).filter(Boolean);
  const actionIds = rules.map(rule => rule.actionId).filter(Boolean);
  const [triggers, actions] = await Promise.all([
    Triggers.find({ _id: { $in: triggerIds },
      $or: [{ boardId: board._id }, { boardId: { $exists: false } }] }).fetchAsync(),
    Actions.find({ _id: { $in: actionIds },
      $or: [{ boardId: board._id }, { boardId: { $exists: false } }] }).fetchAsync(),
  ]);
  const triggerById = new Map(triggers.map(trigger => [trigger._id, trigger]));
  const actionById = new Map(actions.map(action => [action._id, action]));
  const sources = TAPi18n.getDefaultTranslations('r-');
  const workflow = requestFields.rulesView === 'workflow';
  const viewFields = workflow ? { rulesView: 'workflow' } : {};
  const describe = value => localizedStoredRuleDescription(
    value, key => translate(key), sources,
  );
  const selected = rules.find(rule => rule._id === requestFields.viewRuleId);
  const builderTriggerStage = requestFields.legacyOperation === 'select-parameterized-trigger';
  const builderActionStage = requestFields.legacyOperation === 'select-parameterized-action';
  const navigationCells = [uiAction({
    action: boardPath(board), label: tr(translate, 'back', 'Back'), icon: 'previous',
  }), uiAction({
    action: path,
    label: workflow
      ? tr(translate, 'r-list-view', 'List view')
      : tr(translate, 'r-workflow-view', 'Workflow view'),
    fields: { rulesView: workflow ? 'list' : 'workflow' },
  }), board.title];
  if (workflow && !selected) navigationCells.push('');
  const rows = [{ rowHeader: false, cells: navigationCells }];
  if (!selected) {
    const exports = ['json', 'csv'].map(format => uiAction({
      action: path,
      label: tr(translate, `r-export-${format}`, `Export ${format.toUpperCase()}`),
      fields: { legacyOperation: 'export-rules', boardId: board._id,
        ruleExportFormat: format },
      authPurpose: `download:rules-${board._id}-${format}`,
      target: '_blank',
    }));
    const exportCells = [tr(translate, 'r-export', 'Export'), exports, ''];
    if (workflow) exportCells.push('');
    rows.push({ rowHeader: false, cells: exportCells });
    if (canAdmin) {
      const importForm = uiFieldsetForm({
        action: path,
        legend: tr(translate, 'r-import', 'Import'),
        id: 'rules-import',
        inputs: [
          { type: 'select', name: 'ruleImportFormat',
            label: tr(translate, 'r-workflow-format', 'Format'),
            options: [
              { value: 'json', label: 'JSON' },
              { value: 'csv', label: 'CSV' },
              { value: 'trello', label: 'Trello Butler' },
              { value: 'workflow-auto', label: tr(translate, 'r-format-auto', 'Auto-detect') },
              { value: 'n8n', label: 'n8n' },
              { value: 'nodered', label: 'Node-RED' },
            ] },
          { type: 'textarea', name: 'ruleImportText',
            label: tr(translate, 'r-import-paste', 'Paste rules'),
            maxlength: 1024 * 1024, rows: 10, cols: 70 },
        ],
        fields: { ...viewFields, legacyOperation: 'import-rules', boardId: board._id },
        submitLabel: tr(translate, 'r-import', 'Import'),
      });
      const importCells = [tr(translate, 'r-import', 'Import'), importForm, ''];
      if (workflow) importCells.push('');
      rows.push({ rowHeader: false, cells: importCells });
    }
  }
  if (requestFields.legacyRuleResult?.ok === true) rows.push({
    cells: [tr(translate, 'status', 'Status'), tr(translate, 'save', 'Saved'), '', ''],
  });
  if (requestFields.legacyRuleResult?.ok === false) rows.push({
    cells: [tr(translate, 'error', 'Error'),
      tr(translate, requestFields.legacyRuleResult.errorKey, 'Operation failed'), ''],
  });
  if (selected) {
    const trigger = triggerById.get(selected.triggerId);
    const action = actionById.get(selected.actionId);
    rows.push({ cells: [tr(translate, 'r-rule-details', 'Rule details'), selected.title, ''] });
    rows.push({ cells: [tr(translate, 'r-trigger', 'Trigger'),
      describe(trigger?.desc) || tr(translate, 'no-name', '(Unknown)'), ''] });
    rows.push({ cells: [tr(translate, 'r-action', 'Action'),
      describe(action?.desc) || tr(translate, 'no-name', '(Unknown)'), ''] });
    rows.push({ rowHeader: false, cells: [uiAction({
      action: path, label: tr(translate, 'back', 'Back'), icon: 'previous',
      fields: viewFields,
    }), '', ''] });
  } else {
    if (workflow && canAdmin) rows.push({ rowHeader: false, colspanLast: 3, cells: [
      tr(translate, 'r-add-rule', 'Add rule'), uiFieldsetForm({
        action: path,
        legend: tr(translate, 'r-add-rule', 'Add rule'),
        id: 'workflow-rule',
        inputs: [
          { name: 'ruleTitle', label: tr(translate, 'r-new-rule-name', 'Rule name'),
            maxlength: 500 },
          { type: 'select', name: 'triggerIndex',
            label: tr(translate, 'r-trigger', 'Trigger'),
            options: WORKFLOW_TRIGGERS.map((entry, index) => ({ value: index,
              label: tr(translate, entry.labelKey, entry.labelKey, entry.labelParams) })) },
          { type: 'select', name: 'actionIndex',
            label: tr(translate, 'r-action', 'Action'),
            options: WORKFLOW_ACTIONS.map((entry, index) => ({ value: index,
              label: tr(translate, entry.labelKey, entry.labelKey, entry.labelParams) })) },
        ],
        fields: { rulesView: 'workflow', legacyOperation: 'create-workflow-rule',
          boardId: board._id },
        submitLabel: tr(translate, 'r-add-rule', 'Add rule'),
      }),
    ] });
    if (workflow && canAdmin && !builderTriggerStage && !builderActionStage) rows.push({ rowHeader: false,
      colspanLast: 3, cells: [
      tr(translate, 'r-add-trigger', 'Add trigger'), uiFieldsetForm({
        action: path,
        legend: tr(translate, 'r-add-trigger', 'Add trigger'),
        id: 'parameterized-trigger',
        inputs: [
          { name: 'ruleTitle', label: tr(translate, 'r-new-rule-name', 'Rule name'),
            maxlength: 500 },
          { type: 'select', name: 'triggerKind', label: tr(translate, 'r-trigger', 'Trigger'),
            options: PARAMETERIZED_TRIGGERS.map(entry => ({ value: entry.value,
              label: tr(translate, entry.labelKey, entry.fallback) })) },
        ],
        fields: { rulesView: 'workflow', legacyOperation: 'select-parameterized-trigger',
          boardId: board._id },
        submitLabel: tr(translate, 'r-add-action', 'Add action'),
      }),
    ] });
    if (workflow && canAdmin && builderTriggerStage) {
      const triggerFields = {};
      for (const name of ['ruleTitle', 'triggerKind']) {
        triggerFields[name] = String(requestFields[name] || '');
      }
      rows.push({ rowHeader: false, colspanLast: 3, cells: [
        tr(translate, 'r-add-trigger', 'Add trigger'), uiFieldsetForm({
          action: path,
          legend: tr(translate, 'r-add-trigger', 'Add trigger'),
          id: 'parameterized-trigger-fields',
          inputs: parameterizedTriggerInputs(requestFields.triggerKind, translate, board).concat([
            { type: 'select', name: 'actionKind', label: tr(translate, 'r-action', 'Action'),
              options: PARAMETERIZED_ACTIONS.map(entry => ({ value: entry.value,
                label: tr(translate, entry.labelKey, entry.fallback) })) },
          ]),
          fields: { rulesView: 'workflow', legacyOperation: 'select-parameterized-action',
            boardId: board._id, ...triggerFields },
          submitLabel: tr(translate, 'r-add-action', 'Add action'),
        }),
      ] });
    }
    if (workflow && canAdmin && builderActionStage) {
      const visibleBoards = (await Boards.find({ archived: false }, { sort: { title: 1 } }).fetchAsync())
        .filter(candidate => allowIsBoardMemberWithWriteAccess(userId, candidate));
      const selectedFields = {};
      for (const name of ['ruleTitle', 'triggerKind', 'triggerCardTitle', 'triggerListName',
        'triggerSwimlaneName', 'triggerUsername', 'triggerLabelId', 'triggerChecklistName',
        'triggerChecklistItemName', 'triggerScheduleType', 'triggerTime', 'triggerWeekday',
        'triggerDayOfMonth', 'triggerDate', 'triggerDueCondition', 'triggerDays',
        'triggerButtonLabel', 'actionKind']) selectedFields[name] = String(requestFields[name] || '');
      rows.push({ rowHeader: false, colspanLast: 3, cells: [
        tr(translate, 'r-add-action', 'Add action'), uiFieldsetForm({
          action: path,
          legend: tr(translate, 'r-add-action', 'Add action'),
          id: 'parameterized-action',
          inputs: parameterizedActionInputs(requestFields.actionKind, translate, board, visibleBoards),
          fields: { rulesView: 'workflow', legacyOperation: 'create-parameterized-rule',
            boardId: board._id, ...selectedFields },
          submitLabel: tr(translate, 'r-add-rule', 'Add rule'),
        }),
      ] });
    }
    for (const rule of rules) {
      const controls = [uiAction({
        action: path, label: tr(translate, 'r-view-rule', 'View rule'),
        fields: { ...viewFields, viewRuleId: rule._id },
      })];
      if (canAdmin) {
        if (workflow) controls.push(uiSelectForm({
          action: path,
          label: tr(translate, 'r-action', 'Action'),
          name: 'actionIndex',
          options: WORKFLOW_ACTIONS.map((entry, index) => ({ value: index,
            label: tr(translate, entry.labelKey, entry.labelKey, entry.labelParams) })),
          fields: { ...viewFields, legacyOperation: 'replace-workflow-action',
            boardId: board._id, ruleId: rule._id },
          submitLabel: tr(translate, 'save', 'Save'),
        }));
        controls.push(uiTextForm({
          action: path, label: tr(translate, 'r-new-rule-name', 'Rule name'),
          name: 'ruleTitle', value: rule.title, maxlength: 500,
          fields: { ...viewFields, legacyOperation: 'rename-rule',
            boardId: board._id, ruleId: rule._id },
          submitLabel: tr(translate, 'r-edit-rule', 'Edit rule'),
        }));
        controls.push(requestFields.confirmRuleDelete === rule._id ? [
          uiAction({ action: path, label: tr(translate, 'r-delete-rule', 'Delete rule'),
            icon: 'delete', fields: { ...viewFields, legacyOperation: 'delete-rule',
              boardId: board._id, ruleId: rule._id } }),
          uiAction({ action: path, label: tr(translate, 'cancel', 'Cancel'),
            fields: viewFields }),
        ] : uiAction({ action: path, label: tr(translate, 'r-delete-rule', 'Delete rule'),
          icon: 'delete', fields: { ...viewFields, legacyOperation: 'confirm-delete-rule',
            boardId: board._id, ruleId: rule._id } }));
      }
      const triggerText = describe(triggerById.get(rule.triggerId)?.desc)
        || tr(translate, 'no-name', '(Unknown)');
      rows.push({ cells: workflow
        ? [rule.title, triggerText,
          describe(actionById.get(rule.actionId)?.desc)
            || tr(translate, 'no-name', '(Unknown)'), controls]
        : [rule.title, triggerText, controls] });
    }
  }
  return {
    heading: `${board.title}: ${tr(translate, 'r-board-rules', 'Board Rules')}`,
    columns: workflow && !selected
      ? [tr(translate, 'title', 'Title'), tr(translate, 'r-when', 'When'),
        tr(translate, 'r-action', 'Action'), tr(translate, 'actions', 'Actions')]
      : [tr(translate, 'title', 'Title'), tr(translate, 'r-trigger', 'Trigger'),
        tr(translate, 'actions', 'Actions')],
    rows, empty: tr(translate, 'r-no-rules', 'No rules'),
  };
}

function tr(translate, key, fallback, argumentsObject) {
  const value = typeof translate === 'function' ? translate(key, argumentsObject) : '';
  return value && value !== key ? value : fallback;
}

function operationError(translate, errorKey) {
  const message = tr(translate, errorKey, 'Operation failed');
  return message === 'Operation failed' && errorKey !== 'operation-failed'
    ? `${message} (${errorKey})` : message;
}

function boardListSection(path, user) {
  if (path === '/templates') return 'templates';
  if (path === '/remaining') return 'remaining';
  if (path === '/archive') return 'archive';
  const match = /^\/allboards(?:\/([^/]+))?(?:\/(.*))?$/.exec(path);
  const requested = normalizeSection(segment(match?.[1]));
  const starred = user?.profile?.starredBoards || [];
  return requested || defaultSection(starred.length > 0);
}

async function boardsPage(path, userId, publicOnly = false, requestFields = {}, translate) {
  let boards;
  let heading;
  let sectionRows = [];
  let profile = {};
  let currentUser = null;
  let section = '';
  const workspaceOptions = [];
  if (publicOnly) {
    boards = await Boards.find({ permission: 'public', archived: { $ne: true }, type: 'board' }, {
      fields: { title: 1, slug: 1, color: 1, customThemeColors: 1, permission: 1,
        type: 1, archived: 1, members: 1 },
      sort: { title: 1 }, limit: 200,
    }).fetchAsync();
    heading = tr(translate, 'public-boards', 'Public Boards');
  } else if (userId) {
    const user = await Meteor.users.findOneAsync(userId, { fields: {
      isAdmin: 1,
      'profile.starredBoards': 1, 'profile.defaultBoardId': 1,
      'profile.boardWorkspaceAssignments': 1, 'profile.boardWorkspacesTree': 1,
    } });
    section = boardListSection(path, user);
    currentUser = user;
    profile = user?.profile || {};
    const assignments = profile.boardWorkspaceAssignments || {};
    const selector = { type: { $in: ['board', 'template-container'] } };
    let archived = false;
    let workspaceNames = [];
    if (section === 'starred') selector._id = { $in: profile.starredBoards || [] };
    else if (section === 'templates') selector.type = 'template-container';
    else if (section === 'remaining') {
      selector.type = 'board';
      selector._id = { $nin: Object.keys(assignments) };
    } else if (section === 'home') {
      selector.type = 'board';
      selector._id = profile.defaultBoardId || '__no-home-board__';
    } else if (section === 'archive') {
      archived = true;
      selector.type = { $nin: ['template-container', 'template-board'] };
      selector.members = { $elemMatch: { userId, isActive: true, isAdmin: true } };
    } else if (section === 'workspaces') {
      const match = /^\/allboards\/workspaces(?:\/(.*))?$/.exec(path);
      const slugPath = splitWorkspacePath(match?.[1]);
      const tree = profile.boardWorkspacesTree || [];
      const workspaceId = workspaceIdForSlugPath(tree, slugPath, getSlug);
      workspaceNames = workspaceNamePath(tree, slugPath, getSlug);
      selector.type = 'board';
      selector._id = { $in: workspaceId
        ? Object.keys(assignments).filter(boardId => assignments[boardId] === workspaceId)
        : [] };
    }
    boards = await Boards.userBoards(userId, archived, selector, {
      fields: { title: 1, slug: 1, color: 1, customThemeColors: 1, permission: 1,
        type: 1, archived: 1, members: 1 },
      sort: { title: 1 }, limit: 200,
    }, { includePublic: false });
    const sectionName = tr(translate, sectionTitleKey(section), section);
    heading = [tr(translate, 'all-boards', 'All Boards'), sectionName, ...workspaceNames]
      .filter(Boolean).join(' / ');
    const hasStarred = (profile.starredBoards || []).length > 0;
    const standardActions = menuSectionOrder(hasStarred).map(item => uiAction({
      action: allBoardsPath(item, []),
      label: tr(translate, sectionTitleKey(item), item),
    }));
    const workspaceActions = [];
    workspaceOptions.push({ value: '', label: tr(translate, 'allboards.remaining', 'Remaining') });
    const visitWorkspaces = nodes => {
      for (const node of Array.isArray(nodes) ? nodes : []) {
        const slugPath = workspaceSlugPath(profile.boardWorkspacesTree || [], node.id, getSlug);
        if (slugPath) workspaceActions.push(uiAction({
          action: allBoardsPath('workspaces', slugPath), label: node.name || node.id,
        }));
        workspaceOptions.push({ value: node.id, label: node.name || node.id });
        visitWorkspaces(node.children);
      }
    };
    visitWorkspaces(profile.boardWorkspacesTree);
    sectionRows = [{ rowHeader: false, cells: [
      [...standardActions, ...workspaceActions],
      tr(translate, 'all-boards', 'All Boards'),
    ] }];
  } else boards = [];
  const resultRows = [];
  if (requestFields.legacyBoardListResult?.ok === true) resultRows.push({
    cells: [tr(translate, 'status', 'Status'), tr(translate, 'save', 'Saved')],
  });
  if (requestFields.legacyBoardListResult?.ok === false) resultRows.push({
    cells: [tr(translate, 'status', 'Status'),
      operationError(translate, requestFields.legacyBoardListResult.errorKey)],
  });
  const actionPath = path;
  if (userId && !['archive', 'home'].includes(section)) {
    const privateOnly = (await TableVisibilityModeSettings.findOneAsync(
      'tableVisibilityMode-allowPrivateOnly',
    ))?.booleanValue === true;
    const template = section === 'templates';
    resultRows.push({ rowHeader: false, cells: [uiBoardCreateForm({
      action: actionPath,
      titleLabel: tr(translate, 'title', 'Title'),
      permissionLabel: tr(translate, 'change-permissions', 'Permissions'),
      permissions: template || privateOnly
        ? [{ value: 'private', label: tr(translate, 'private', 'Private') }]
        : [
          { value: 'private', label: tr(translate, 'private', 'Private') },
          { value: 'public', label: tr(translate, 'public', 'Public') },
        ],
      fields: {
        legacyOperation: 'create-board',
        boardType: template ? 'template-container' : 'board',
      },
      submitLabel: tr(translate, template ? 'add-template-container' : 'add-board',
        template ? 'Add Template Container' : 'Add Board'),
    }), ''] });
  }
  return {
    heading: heading || tr(translate, 'all-boards', 'All Boards'),
    columns: [tr(translate, 'board', 'Board'), tr(translate, 'change-permissions', 'Permissions')],
    empty: tr(translate, 'no-boards-selected', 'No boards'),
    rows: [...sectionRows, ...resultRows, ...boards.flatMap(board => {
      const boardFields = { boardId: board._id };
      const isStarred = (profile.starredBoards || []).includes(board._id);
      const isDefault = profile.defaultBoardId === board._id;
      const canAdmin = !!(currentUser?.isAdmin || board.hasAdmin(userId));
      const actions = userId ? [uiAction({
        action: actionPath,
        label: tr(translate, isStarred ? 'click-to-unstar' : 'click-to-star',
          isStarred ? 'Unstar board' : 'Star board'),
        icon: isStarred ? 'select-on' : 'select-off',
        fields: { ...boardFields, legacyOperation: 'toggle-board-star' },
      })] : [];
      if (userId && board.type === 'board' && board.archived !== true) actions.push(uiAction({
        action: actionPath,
        label: tr(translate, isDefault ? 'unset-selected-home' : 'set-selected-home',
          isDefault ? 'Unset Home board' : 'Set Home board'),
        icon: isDefault ? 'select-on' : 'select-off',
        fields: { ...boardFields, legacyOperation: 'toggle-default-board' },
      }));
      if (canAdmin && board.archived === true) actions.push(uiAction({
        action: actionPath, label: tr(translate, 'restore-board', 'Restore board'),
        icon: 'move-up', fields: { ...boardFields, legacyOperation: 'restore-board' },
      }));
      const confirmingPermanentDelete = requestFields.confirmBoardPermanentDelete === board._id;
      if (currentUser?.isAdmin === true && board.archived === true
        && getFeatureFlags().enablePermanentDelete) actions.push(confirmingPermanentDelete ? [
        `${tr(translate, 'delete-board-confirm-popup', 'Permanently delete this board?')}`,
        uiAction({ action: actionPath, label: tr(translate, 'delete', 'Delete'),
          icon: 'remove', fields: {
            ...boardFields, legacyOperation: 'permanently-delete-board',
          } }),
        uiAction({ action: actionPath, label: tr(translate, 'cancel', 'Cancel') }),
      ] : uiAction({
        action: actionPath, label: tr(translate, 'delete', 'Delete'), icon: 'remove',
        fields: { ...boardFields, legacyOperation: 'confirm-permanently-delete-board' },
      }));
      const confirmingArchive = requestFields.confirmBoardArchive === board._id;
      if (canAdmin && board.archived !== true) actions.push(confirmingArchive ? [
        `${tr(translate, 'archive-board', 'Archive board')}?`,
        uiAction({ action: actionPath, label: tr(translate, 'archive-board', 'Archive board'),
          icon: 'remove', fields: { ...boardFields, legacyOperation: 'archive-board' } }),
        uiAction({ action: actionPath, label: tr(translate, 'cancel', 'Cancel') }),
      ] : uiAction({
        action: actionPath, label: tr(translate, 'archive-board', 'Archive board'),
        icon: 'remove',
        fields: { ...boardFields, legacyOperation: 'confirm-archive-board' },
      }));
      const confirmingCopy = requestFields.confirmBoardCopy === board._id;
      if (canAdmin && board.archived !== true) actions.push(confirmingCopy ? [
        `${tr(translate, 'duplicate-board-confirm', 'Duplicate this board?')}`,
        uiAction({ action: actionPath, label: tr(translate, 'duplicate-board', 'Duplicate Board'),
          icon: 'add', fields: { ...boardFields, legacyOperation: 'copy-board' } }),
        uiAction({ action: actionPath, label: tr(translate, 'cancel', 'Cancel') }),
      ] : uiAction({
        action: actionPath, label: tr(translate, 'duplicate-board', 'Duplicate Board'),
        icon: 'add', fields: { ...boardFields, legacyOperation: 'confirm-copy-board' },
      }));
      if (board.archived !== true && board.type === 'board'
        && !['home', 'templates', 'archive'].includes(section)) actions.push(uiSelectForm({
        action: actionPath,
        label: tr(translate, 'allboards.workspaces', 'Workspace'),
        name: 'workspaceId',
        value: profile.boardWorkspaceAssignments?.[board._id] || '',
        options: workspaceOptions,
        fields: { ...boardFields, legacyOperation: 'set-board-workspace' },
        submitLabel: tr(translate, 'save', 'Save'),
      }));
      return [{
        color: boardColor(board), boardTheme: true,
        cells: [userId
          ? uiAction({ action: boardPath(board), label: board.title || 'Board' })
          : uiLink({ href: boardPath(board), label: board.title || 'Board' }),
        [board.permission || '', ...actions]],
      }];
    })],
  };
}

async function boardPage(path, userId, requestFields = {}, translate) {
  const match = /^\/b\/([^/]+)/.exec(path);
  const board = match ? await visibleBoard(segment(match[1]), userId) : null;
  if (!board) return {
    heading: tr(translate, 'board', 'Board'),
    columns: [tr(translate, 'status', 'Status'), tr(translate, 'action', 'Action')], rows: [],
    empty: 'Board not found or access denied.',
  };
  const canWrite = allowIsBoardMemberWithWriteAccess(userId, board);
  const cardMatch = /^\/b\/[^/]+\/[^/]+\/([^/]+)$/.exec(path);
  if (cardMatch) return cardDetailsPage(
    board, segment(cardMatch[1]), userId, requestFields, translate,
  );
  const swimlanes = await Swimlanes.find({ boardId: board._id, archived: { $ne: true } }, {
    fields: { title: 1, color: 1, sort: 1 }, sort: { sort: 1 },
  }).fetchAsync();
  const swimlanePath = /\/swimlane\/([^/]+)$/.exec(path);
  const listPath = /\/list\/([^/]+)$/.exec(path);
  const selectedSwimlaneId = typeof requestFields.viewSwimlane === 'string'
    ? requestFields.viewSwimlane : segment(swimlanePath?.[1]);
  const firstSwimlane = swimlanes.find(item => item._id === selectedSwimlaneId) || swimlanes[0] || null;
  const listSelector = { boardId: board._id, archived: { $ne: true } };
  if (firstSwimlane) listSelector.$or = [
    { swimlaneId: firstSwimlane._id }, { swimlaneId: '' },
    { swimlaneId: null }, { swimlaneId: { $exists: false } },
  ];
  const lists = await Lists.find(listSelector, {
    fields: { title: 1, color: 1, sort: 1 }, sort: { sort: 1 },
  }).fetchAsync();
  const selectedListId = typeof requestFields.viewList === 'string'
    ? requestFields.viewList : segment(listPath?.[1]);
  const firstList = lists.find(item => item._id === selectedListId) || lists[0] || null;
  const rows = [{ rowHeader: false, cells: [uiAction({
    action: `${boardPath(board)}/rules`,
    label: tr(translate, 'r-board-rules', 'Board Rules'),
  }), ''] }];
  if (requestFields.legacyCardResult?.ok === true) rows.push({
    cells: [tr(translate, 'status', 'Status'), tr(translate, 'save', 'Saved')],
  });
  if (requestFields.legacyCardResult?.ok === false) rows.push({
    cells: [tr(translate, 'status', 'Status'),
      operationError(translate, requestFields.legacyCardResult.errorKey)],
  });
  if (firstSwimlane) rows.push({
    cells: [`Swimlane: ${firstSwimlane.title}`, swimlanes.map(item => userId ? uiAction({
      action: boardPath(board), label: item.title, fields: { viewSwimlane: item._id },
    }) : uiLink({ href: `${boardPath(board)}/swimlane/${encodeURIComponent(item._id)}`, label: item.title }))],
    color: firstSwimlane.color,
  });
  if (firstList) {
    rows.push({
      cells: [`List: ${firstList.title}`, lists.map(item => userId ? uiAction({
        action: boardPath(board), label: item.title,
        fields: { viewSwimlane: firstSwimlane?._id || '', viewList: item._id },
      }) : uiLink({ href: `${boardPath(board)}/list/${encodeURIComponent(item._id)}`, label: item.title }))],
      color: firstList.color,
    });
    if (canWrite) rows.push({ rowHeader: false, cells: [uiTextForm({
      action: boardPath(board), label: tr(translate, 'title', 'Card title'),
      name: 'cardTitle', maxlength: 1000,
      fields: {
        legacyOperation: 'create-card', boardId: board._id, listId: firstList._id,
        swimlaneId: firstSwimlane?._id || '', position: 'bottom',
      },
      submitLabel: tr(translate, 'add-card', 'Add card'),
    }), ''] });
    const otherSwimlaneIds = swimlanes.filter(item => item._id !== firstSwimlane?._id).map(item => item._id);
    const cards = await Cards.find({
      boardId: board._id, listId: firstList._id, archived: { $ne: true },
      deletedAt: null,
      ...(firstSwimlane ? { swimlaneId: { $nin: otherSwimlaneIds } } : {}),
    }, { fields: { title: 1, color: 1, sort: 1 }, sort: { sort: 1 }, limit: 200 }).fetchAsync();
    for (const card of cards) rows.push({
      color: card.color,
      cells: [card.title || '(untitled card)', userId ? [uiAction({
        action: `${boardPath(board)}/${encodeURIComponent(card._id)}`,
        label: tr(translate, 'card', 'Card'),
      }), ...(canWrite ? [uiAction({
        action: boardPath(board), label: tr(translate, 'move-card-up', 'Move card up'),
        icon: 'move-up', fields: { legacyOperation: 'move-card-up', cardId: card._id },
      }), uiAction({
        action: boardPath(board), label: tr(translate, 'move-card-down', 'Move card down'),
        icon: 'move-down', fields: { legacyOperation: 'move-card-down', cardId: card._id },
      })] : [])] : uiLink({
        href: `${boardPath(board)}/${encodeURIComponent(card._id)}`,
        label: tr(translate, 'card', 'Card'),
      })],
    });
  }
  return {
    heading: board.title || 'Board', caption: `${board.title || 'Board'} — upper-left list`,
    columns: [tr(translate, 'board', 'Content'), tr(translate, 'action', 'Action')], rows,
    empty: 'The upper-left swimlane or list is empty.',
  };
}

function isoDate(value) {
  return value instanceof Date && !Number.isNaN(value.getTime()) ? value.toISOString() : '';
}

function customFieldDisplayValue(field) {
  const { definition, trueValue, value } = field;
  if (definition.type === 'checkbox') return value ? UI_ICONS['select-on'].ascii
    : UI_ICONS['select-off'].ascii;
  if (definition.type === 'date') return isoDate(value);
  if (definition.type === 'currency') {
    return value === '' || value == null ? ''
      : `${definition.settings?.currencyCode || ''} ${value}`.trim();
  }
  if (definition.type === 'stringtemplate') {
    try {
      return new CustomFieldStringTemplate(definition).getFormattedValue(
        Array.isArray(value) ? value : [],
      );
    } catch (_) {
      return Array.isArray(value) ? value.join(definition.settings?.stringtemplateSeparator || '') : '';
    }
  }
  return trueValue == null ? '' : String(trueValue);
}

async function writableCardDestinationOptions(userId) {
  const boards = await Boards.userBoards(userId, false, { type: 'board' }, {
    fields: { title: 1, members: 1, permission: 1 }, sort: { title: 1 }, limit: 200,
  }, { includePublic: false });
  const checklistCards = [];
  const cardPlacements = [];
  for (const candidateBoard of boards) {
    if (!allowIsBoardMemberWithWriteAccess(userId, candidateBoard)) continue;
    const [swimlanes, lists, cards] = await Promise.all([
      Swimlanes.find({ boardId: candidateBoard._id, archived: { $ne: true } }, {
        fields: { title: 1, sort: 1 }, sort: { sort: 1, _id: 1 }, limit: 200,
      }).fetchAsync(),
      Lists.find({ boardId: candidateBoard._id, archived: { $ne: true } }, {
        fields: { title: 1, sort: 1 }, sort: { sort: 1, _id: 1 }, limit: 500,
      }).fetchAsync(),
      Cards.find({
        ...boardCardScope(candidateBoard),
        ...(assignedOnlyCardScope(candidateBoard, userId) || {}),
        archived: false,
        deletedAt: null,
      }, {
        fields: { title: 1, boardId: 1, listId: 1, swimlaneId: 1, sort: 1 },
        sort: { sort: 1, _id: 1 }, limit: 5000,
      }).fetchAsync(),
    ]);
    const listById = new Map(lists.map(list => [list._id, list]));
    const swimlaneById = new Map(swimlanes.map(swimlane => [swimlane._id, swimlane]));
    for (const swimlane of swimlanes) for (const list of lists) cardPlacements.push({
      value: `${candidateBoard._id}|${swimlane._id}|${list._id}|`,
      label: `${candidateBoard.title || candidateBoard._id} / `
        + `${swimlane.title || swimlane._id} / ${list.title || list._id}`,
    });
    for (const candidateCard of cards) {
      const list = listById.get(candidateCard.listId);
      const swimlane = swimlaneById.get(candidateCard.swimlaneId);
      if (!list || !swimlane) continue;
      checklistCards.push({
        value: `${candidateBoard._id}|${candidateCard._id}`,
        label: `${candidateBoard.title || candidateBoard._id} / `
          + `${candidateCard.title || candidateCard._id}`,
      });
      cardPlacements.push({
        value: `${candidateBoard._id}|${candidateCard.swimlaneId}|`
          + `${candidateCard.listId}|${candidateCard._id}`,
        label: `${candidateBoard.title || candidateBoard._id} / `
          + `${swimlane.title || swimlane._id} / ${list.title || list._id} / `
          + `${candidateCard.title || candidateCard._id}`,
      });
    }
    if (checklistCards.length >= 10000 || cardPlacements.length >= 10000) break;
  }
  return {
    checklistCards: checklistCards.slice(0, 10000),
    cardPlacements: cardPlacements.slice(0, 10000),
  };
}

async function parentCardOptions(userId, currentCardId) {
  const boards = await Boards.userBoards(userId, false, { type: 'board' }, {
    fields: { title: 1, members: 1, permission: 1 }, sort: { sort: 1 }, limit: 200,
  }, { includePublic: false });
  const options = [];
  for (const candidateBoard of boards) {
    const cards = await Cards.find({
      ...boardCardScope(candidateBoard),
      ...(assignedOnlyCardScope(candidateBoard, userId) || {}),
      _id: { $ne: currentCardId }, archived: false, deletedAt: null,
    }, {
      fields: { title: 1 }, sort: { sort: 1, _id: 1 }, limit: 5000,
    }).fetchAsync();
    for (const candidate of cards) options.push({
      value: candidate._id,
      label: `${candidateBoard.title || candidateBoard._id} / ${candidate.title || candidate._id}`,
    });
    if (options.length >= 10000) break;
  }
  return options.slice(0, 10000);
}

async function cardDetailsPage(board, cardId, userId, requestFields, translate) {
  const assignedScope = assignedOnlyCardScope(board, userId);
  const selector = {
    _id: cardId,
    ...boardCardScope(board),
    // MongoDB equality to null also matches a missing optional field.
    deletedAt: null,
    ...(assignedScope || {}),
  };
  const card = await Cards.findOneAsync(selector, { fields: {
    title: 1, description: 1, color: 1, archived: 1, boardId: 1,
    coverId: 1,
    type: 1, linkedId: 1,
    listId: 1, swimlaneId: 1, labelIds: 1, members: 1, assignees: 1,
    requesters: 1, assigners: 1, requestedBy: 1, assignedBy: 1, userId: 1,
    sort: 1, stickers: 1, customFields: 1, cardDependencies: 1, vote: 1, poker: 1,
    dueComplete: 1, spentTime: 1, isOvertime: 1, watchers: 1, parentId: 1,
    locations: 1, locationName: 1, locationAddress: 1,
    locationLatitude: 1, locationLongitude: 1,
    receivedAt: 1, startAt: 1, dueAt: 1, endAt: 1, createdAt: 1, modifiedAt: 1,
  } });
  if (!card) return {
    heading: tr(translate, 'card', 'Card'),
    columns: [tr(translate, 'status', 'Status'), tr(translate, 'action', 'Action')],
    rows: [], empty: 'Card not found or access denied.',
  };
  const contentCard = card.type === 'cardType-linkedCard' && card.linkedId
    ? await Cards.findOneAsync({ _id: card.linkedId, deletedAt: null }) : card;
  const contentCardId = contentCard?._id || card._id;
  const contentBoardId = contentCard?.boardId || card.boardId;
  const contentBoard = contentBoardId === board._id
    ? board : await Boards.findOneAsync(contentBoardId);
  const activeContentMemberIds = (contentBoard?.members || [])
    .filter(member => member.isActive !== false).map(member => member.userId).filter(Boolean);
  const checklists = await Checklists.find({ cardId: contentCardId, boardId: contentBoardId }, {
    fields: {
      title: 1, sort: 1, hideCheckedChecklistItems: 1,
      hideAllChecklistItems: 1, showChecklistAtMinicard: 1,
    }, sort: { sort: 1 }, limit: 200,
  }).fetchAsync();
  const checklistIds = checklists.map(checklist => checklist._id);
  const dependencies = normalizeDependencies(contentCard?.cardDependencies);
  const dependencyIds = dependencies.map(dependency => dependency.cardId);
  const activitySetting = await Settings.findOneAsync({}, {
    fields: { hideBoardActivitiesOnAllBoards: 1 },
  });
  const activityBoardVisible = await canUserSeeBoard(userId, contentBoardId);
  const showCardActivities = allowIsBoardAdmin(userId, board)
    && activityBoardVisible
    && activitySetting?.hideBoardActivitiesOnAllBoards !== true;
  const [comments, commentReactionDocs, checklistItems, attachments, customFieldDefinitions,
    dependencyTargetCards, dependencyCandidateCards, candidateSubtasks, activities] = await Promise.all([
    CardComments.find({ cardId: contentCardId, boardId: contentBoardId }, {
      fields: { text: 1, userId: 1, parentId: 1, createdAt: 1 },
      sort: { createdAt: 1 }, limit: 500,
    }).fetchAsync(),
    CardCommentReactions.find({ cardId: contentCardId, boardId: contentBoardId }, {
      fields: { cardCommentId: 1, reactions: 1 }, limit: 500,
    }).fetchAsync(),
    ChecklistItems.find({ cardId: contentCardId, boardId: contentBoardId,
      checklistId: { $in: checklistIds } }, {
      fields: { title: 1, isFinished: 1, checklistId: 1, sort: 1 }, sort: { sort: 1 }, limit: 2000,
    }).fetchAsync(),
    Attachments.collection.find({ 'meta.cardId': contentCardId, 'meta.boardId': contentBoardId }, {
      fields: { name: 1, type: 1, size: 1, uploadedAt: 1 }, sort: { uploadedAt: 1 }, limit: 500,
    }).fetchAsync(),
    CustomFields.find({ boardIds: contentBoardId }, {
      fields: { name: 1, type: 1, settings: 1, alwaysOnCard: 1 },
      sort: { name: 1, _id: 1 }, limit: 500,
    }).fetchAsync(),
    Cards.find({ _id: { $in: dependencyIds }, boardId: contentBoardId, deletedAt: null }, {
      fields: { title: 1 }, limit: 500,
    }).fetchAsync(),
    Cards.find({ boardId: contentBoardId, archived: { $ne: true }, deletedAt: null }, {
      fields: { title: 1, sort: 1 }, sort: { title: 1, _id: 1 }, limit: 1000,
    }).fetchAsync(),
    Cards.find({ parentId: contentCardId, archived: false, deletedAt: null }, {
      fields: { title: 1, boardId: 1, listId: 1, sort: 1 },
      sort: { sort: 1, _id: 1 }, limit: 10001,
    }).fetchAsync(),
    showCardActivities ? Activities.find({ cardId: contentCardId }, {
      fields: {
        activityType: 1, userId: 1, memberId: 1, boardId: 1, oldBoardId: 1,
        listId: 1, oldListId: 1, cardId: 1, cardTitle: 1, boardName: 1,
        oldBoardName: 1, listName: 1, oldListName: 1, attachmentId: 1,
        attachmentName: 1, checklistId: 1, checklistTitle: 1,
        checklistItemId: 1, checklistItemTitle: 1, commentId: 1, commentText: 1,
        customFieldId: 1, customFieldName: 1, labelId: 1, labelName: 1,
        memberName: 1, source: 1, value: 1, createdAt: 1,
      },
      sort: { createdAt: -1 }, limit: 50,
    }).fetchAsync() : [],
  ]);
  const allowedSubtaskBoardIds = await visibleBoardIds(
    userId,
    [...new Set(candidateSubtasks.map(subtask => subtask.boardId).filter(Boolean))],
  );
  const subtasks = candidateSubtasks.slice(0, 10000)
    .filter(subtask => allowedSubtaskBoardIds.has(subtask.boardId));
  const subtaskBoardIds = [...new Set(subtasks.map(subtask => subtask.boardId))];
  const subtaskListIds = [...new Set(subtasks.map(subtask => subtask.listId))];
  const [subtaskBoards, subtaskLists] = await Promise.all([
    Boards.find({ _id: { $in: subtaskBoardIds } }, {
      fields: { title: 1, slug: 1 }, limit: 10000,
    }).fetchAsync(),
    Lists.find({ _id: { $in: subtaskListIds } }, {
      fields: { title: 1, boardId: 1 }, limit: 10000,
    }).fetchAsync(),
  ]);
  const subtaskBoardById = new Map(subtaskBoards.map(item => [item._id, item]));
  const subtaskListById = new Map(subtaskLists.map(item => [item._id, item]));
  const checklistById = new Map(checklists.map(item => [item._id, item]));
  const checklistItemById = new Map(checklistItems.map(item => [item._id, item]));
  const attachmentById = new Map(attachments.map(item => [item._id, item]));
  const customFieldById = new Map(customFieldDefinitions.map(item => [item._id, item]));
  const personIds = [...new Set([
    card.userId, contentCard?.userId, ...(card.members || []), ...(card.assignees || []),
    ...(contentCard?.members || []), ...(contentCard?.assignees || []),
    ...(card.requesters || []), ...(card.assigners || []),
    ...(contentCard?.requesters || []), ...(contentCard?.assigners || []),
    ...activeContentMemberIds,
    ...comments.map(comment => comment.userId),
    ...activities.flatMap(activity => [activity.userId, activity.memberId]),
    ...commentReactionDocs.flatMap(doc => (doc.reactions || [])
      .flatMap(reaction => reaction.userIds || [])),
    ...(contentCard?.vote?.positive || []), ...(contentCard?.vote?.negative || []),
    ...POKER_STATES.flatMap(state => contentCard?.poker?.[state] || []),
  ].filter(Boolean))];
  const activityListIds = [...new Set(activities
    .flatMap(activity => [activity.listId, activity.oldListId]).filter(Boolean))];
  const [list, swimlane, people, activeLists, currentUser, activityLists] = await Promise.all([
    Lists.findOneAsync({ _id: card.listId, boardId: card.boardId }, { fields: { title: 1 } }),
    Swimlanes.findOneAsync({ _id: card.swimlaneId, boardId: card.boardId }, { fields: { title: 1 } }),
    Meteor.users.find({ _id: { $in: personIds } }, {
      fields: { username: 1, 'profile.fullname': 1 },
    }).fetchAsync(),
    Lists.find({ boardId: card.boardId, archived: { $ne: true } }, {
      fields: { title: 1, sort: 1 }, sort: { sort: 1, _id: 1 }, limit: 500,
    }).fetchAsync(),
    Meteor.users.findOneAsync(userId, {
      fields: { 'profile.moveAndCopyDialog': 1, 'profile.mapProvider': 1 },
    }),
    Lists.find({ _id: { $in: activityListIds } }, {
      fields: { title: 1 }, limit: 100,
    }).fetchAsync(),
  ]);
  const personById = new Map(people.map(person => [person._id,
    person.profile?.fullname || person.username || person._id]));
  const activityListById = new Map(activityLists.map(item => [item._id, item]));
  let parentCard = null;
  let parentBoard = null;
  if (contentCard?.parentId) {
    const candidate = await Cards.findOneAsync({ _id: contentCard.parentId, deletedAt: null }, {
      fields: { title: 1, boardId: 1 },
    });
    if (candidate && await canUserSeeBoard(userId, candidate.boardId)) {
      parentCard = candidate;
      parentBoard = candidate.boardId === board._id
        ? board : await Boards.findOneAsync(candidate.boardId, { fields: { title: 1, slug: 1 } });
    }
  }
  const names = values => (values || []).map(id => personById.get(id) || id).join(', ');
  const labels = (contentBoard?.labels || [])
    .filter(label => (contentCard?.labelIds || []).includes(label._id));
  const locations = contentCard?.getLocations ? contentCard.getLocations() : [];
  const stickers = contentCard?.getStickers ? contentCard.getStickers() : [];
  const customFields = buildCustomFieldsWD(
    contentCard?.customFields || [], customFieldDefinitions,
  );
  const dependencyTargetById = new Map(dependencyTargetCards.map(target => [target._id, target]));
  const canWrite = await canEditCardOrLinkedCard(userId, card);
  const vote = contentCard?.vote && typeof contentCard.vote === 'object'
    ? contentCard.vote : null;
  const voteEnd = vote?.end instanceof Date && Number.isFinite(vote.end.getTime())
    ? vote.end : (vote?.end ? new Date(vote.end) : null);
  const voteClosed = voteEnd instanceof Date && Number.isFinite(voteEnd.getTime())
    && voteEnd.getTime() <= Date.now();
  const voteState = (vote?.positive || []).includes(userId) ? 'positive'
    : ((vote?.negative || []).includes(userId) ? 'negative' : 'clear');
  const canVote = Boolean(vote?.question) && !voteClosed
    && (activeContentMemberIds.includes(userId) || vote?.allowNonBoardMembers === true);
  const poker = contentCard?.poker && typeof contentCard.poker === 'object'
    ? contentCard.poker : null;
  const pokerEnd = poker?.end instanceof Date && Number.isFinite(poker.end.getTime())
    ? poker.end : (poker?.end ? new Date(poker.end) : null);
  const pokerClosed = pokerEnd instanceof Date && Number.isFinite(pokerEnd.getTime())
    && pokerEnd.getTime() <= Date.now();
  const pokerState = POKER_STATES.find(state => (poker?.[state] || []).includes(userId)) || null;
  const canPlayPoker = poker?.question === true && !pokerClosed
    && (activeContentMemberIds.includes(userId) || poker?.allowNonBoardMembers === true);
  const canAdminPoker = allowIsBoardAdmin(userId, board);
  const isWatching = (contentCard?.watchers || []).includes(userId);
  const destinations = canWrite ? await writableCardDestinationOptions(userId)
    : { checklistCards: [], cardPlacements: [] };
  const parentOptions = canWrite ? await parentCardOptions(userId, contentCardId) : [];
  const checklistCardOptions = destinations.checklistCards;
  const rememberedCardDestination = currentUser?.profile?.moveAndCopyDialog?.[board._id];
  const rememberedCardDestinationValue = rememberedCardDestination
    ? `${rememberedCardDestination.boardId || ''}|${rememberedCardDestination.swimlaneId || ''}|`
      + `${rememberedCardDestination.listId || ''}|${rememberedCardDestination.cardId || ''}`
    : '';
  const rows = [];
  const commonFields = { cardId: card._id, boardId: card.boardId };
  if (requestFields.legacyCardResult?.ok === true) rows.push({
    cells: [tr(translate, 'status', 'Status'), tr(translate, 'save', 'Save')],
  });
  if (requestFields.legacyCardResult?.ok === false) rows.push({
    cells: [tr(translate, 'status', 'Status'),
      operationError(translate, requestFields.legacyCardResult.errorKey)],
  });
  if (canWrite) {
    rows.push({ rowHeader: false, cells: [uiTextForm({
      action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
      label: tr(translate, 'title', 'Title'), name: 'cardTitle', value: card.title || '',
      maxlength: 1000, fields: { ...commonFields, legacyOperation: 'edit-card-title' },
      submitLabel: tr(translate, 'save', 'Save'),
    }), ''] });
    if (board.allowsDueComplete === true) {
      const dueComplete = contentCard?.dueComplete === true;
      rows.push({ rowHeader: false, cells: [uiAction({
        action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
        label: `${dueComplete ? UI_ICONS['select-on'].ascii : UI_ICONS['select-off'].ascii} `
          + tr(translate, dueComplete ? 'card-mark-incomplete' : 'card-mark-complete',
            dueComplete ? 'Mark incomplete' : 'Mark complete'),
        fields: { ...commonFields, legacyOperation: 'set-card-due-complete',
          cardDueComplete: dueComplete ? 'false' : 'true' },
      }), ''] });
    }
    rows.push({ rowHeader: false, cells: [uiFieldsetForm({
      action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
      legend: tr(translate, 'editCardSpentTimePopup-title', 'Edit spent time'),
      inputs: [
        { name: 'cardSpentTime', label: tr(translate, 'time', 'Time'),
          value: contentCard?.spentTime ?? '', maxlength: 100 },
        { type: 'select', name: 'cardIsOvertime', label: tr(translate, 'overtime', 'Overtime'),
          value: contentCard?.isOvertime === true ? 'true' : 'false', options: [
            { value: 'false', label: tr(translate, 'no', 'No') },
            { value: 'true', label: tr(translate, 'yes', 'Yes') },
          ] },
      ],
      fields: { ...commonFields, legacyOperation: 'set-card-spent-time' },
      submitLabel: tr(translate, 'save', 'Save'), id: 'card-spent-time',
    }), uiAction({
      action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
      label: tr(translate, 'delete', 'Delete'), icon: 'remove',
      fields: { ...commonFields, legacyOperation: 'clear-card-spent-time' },
    })] });
    rows.push({ rowHeader: false, cells: [uiSelectForm({
      action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
      label: tr(translate, 'parent-card', 'Parent card'), name: 'parentCardId',
      value: contentCard?.parentId || '', options: [
        { value: '', label: tr(translate, 'custom-field-dropdown-none', 'None') },
        ...parentOptions,
      ],
      fields: { ...commonFields, legacyOperation: 'set-card-parent' },
      submitLabel: tr(translate, 'save', 'Save'),
    }), ''] });
    const locationInputs = location => [
      { label: tr(translate, 'location-name', 'Location name'),
        name: 'locationName', value: location?.name || '', maxlength: 1000 },
      { label: tr(translate, 'location-address', 'Address'),
        name: 'locationAddress', value: location?.address || '', maxlength: 1000 },
      { label: tr(translate, 'location-latitude', 'Latitude'),
        name: 'locationLatitude', value: location?.latitude ?? '', maxlength: 40 },
      { label: tr(translate, 'location-longitude', 'Longitude'),
        name: 'locationLongitude', value: location?.longitude ?? '', maxlength: 40 },
    ];
    for (const location of locations) {
      rows.push({ rowHeader: false, cells: [uiFieldsetForm({
        action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
        legend: location.name || tr(translate, 'location', 'Location'),
        id: `location-${location._id}`, inputs: locationInputs(location),
        fields: {
          ...commonFields, legacyOperation: 'save-card-location', locationId: location._id,
        },
        submitLabel: tr(translate, 'save', 'Save'),
      }), uiAction({
        action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
        label: tr(translate, 'delete', 'Delete'), icon: 'remove',
        fields: {
          ...commonFields, legacyOperation: 'remove-card-location', locationId: location._id,
        },
      })] });
    }
    rows.push({ rowHeader: false, cells: [uiFieldsetForm({
      action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
      legend: tr(translate, 'add-location', 'Add location'), id: 'new-location',
      inputs: locationInputs(null),
      fields: { ...commonFields, legacyOperation: 'save-card-location', locationId: '' },
      submitLabel: tr(translate, 'add-location', 'Add location'),
    }), ''] });
    stickers.forEach((sticker, index) => {
      const description = [sticker.name || sticker.icon,
        sticker.name ? sticker.icon : '', sticker.highlight || ''].filter(Boolean).join(' - ');
      rows.push({ rowHeader: false, cells: [
        `${tr(translate, 'stickers', 'Stickers')}: ${description}`,
        uiAction({
          action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
          label: tr(translate, 'remove-sticker', 'Remove sticker'), icon: 'remove',
          fields: {
            ...commonFields, legacyOperation: 'remove-card-sticker', stickerIndex: index,
          },
        }),
      ] });
    });
    rows.push({ rowHeader: false, cells: [uiSelectForm({
      action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
      label: tr(translate, 'add-sticker', 'Add sticker'), name: 'stickerChoice',
      options: STICKER_PICKER.map(sticker => ({
        value: `${sticker.icon}:${sticker.highlight || ''}`,
        label: sticker.name || `${sticker.icon}${sticker.highlight ? ` - ${sticker.highlight}` : ''}`,
      })),
      fields: { ...commonFields, legacyOperation: 'set-card-sticker' },
      submitLabel: tr(translate, 'add-sticker', 'Add sticker'),
    }), ''] });
    if (contentBoard?.allowsCustomFields !== false) {
      for (const definition of customFieldDefinitions) {
        const assigned = customFields.some(field => field._id === definition._id);
        rows.push({ rowHeader: false, cells: [uiAction({
          action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
          label: `${tr(translate, 'custom-fields', 'Custom Fields')}: `
            + `${assigned ? UI_ICONS['select-on'].ascii : UI_ICONS['select-off'].ascii} `
            + definition.name,
          fields: {
            ...commonFields, legacyOperation: 'assign-card-custom-field',
            customFieldId: definition._id, assigned: assigned ? 'false' : 'true',
          },
        }), ''] });
      }
      for (const field of customFields) {
        const definition = field.definition;
        const editorFields = {
          ...commonFields, legacyOperation: 'edit-card-custom-field',
          customFieldId: field._id,
        };
        const label = `${definition.name} (${definition.type})`;
        let editor;
        if (definition.type === 'dropdown') {
          editor = uiSelectForm({
            action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
            label, name: 'customFieldValue', value: field.value ?? '',
            options: [{ value: '', label: tr(translate, 'custom-field-dropdown-none', 'None') },
              ...(definition.settings?.dropdownItems || []).map(item => ({
                value: item._id, label: item.name,
              }))],
            fields: editorFields, submitLabel: tr(translate, 'save', 'Save'),
          });
        } else if (definition.type === 'checkbox') {
          editor = uiAction({
            action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
            label: `${label}: ${field.value ? UI_ICONS['select-on'].ascii
              : UI_ICONS['select-off'].ascii}`,
            fields: {
              ...editorFields, legacyOperation: 'edit-card-custom-field-checkbox',
              customFieldValue: field.value ? 'false' : 'true',
            },
          });
        } else if (definition.type === 'text' || definition.type === 'stringtemplate') {
          editor = uiTextareaForm({
            action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
            label, name: 'customFieldValue',
            value: definition.type === 'stringtemplate'
              ? (Array.isArray(field.value) ? field.value.join('\n') : '') : field.value ?? '',
            fields: editorFields, submitLabel: tr(translate, 'save', 'Save'),
            id: `custom-field-${field._id}`,
          });
        } else {
          editor = uiTextForm({
            action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
            label, name: 'customFieldValue',
            value: definition.type === 'date' ? isoDate(field.value) : field.value ?? '',
            maxlength: definition.type === 'date' ? 40 : 100,
            fields: editorFields, submitLabel: tr(translate, 'save', 'Save'),
            id: `custom-field-${field._id}`,
          });
        }
        rows.push({ rowHeader: false, cells: [editor, ''] });
      }
    }
    const dependencyTypeOptions = DEPENDENCY_TYPES.map(type => ({
      value: type.id,
      label: tr(translate, `dependency-type-${type.id}`, type.id),
    }));
    const dependencyIconOptions = DEPENDENCY_ICON_CHOICES.map(icon => ({
      value: icon, label: icon,
    }));
    const dependencyAction = boardPath(board) + `/${encodeURIComponent(card._id)}`;
    for (const dependency of dependencies) {
      const dependencyCard = dependencyTargetById.get(dependency.cardId);
      rows.push({ rowHeader: false, cells: [uiFieldsetForm({
        action: dependencyAction,
        legend: `${tr(translate, 'card-dependencies', 'Dependencies')}: `
          + (dependencyCard?.title || dependency.cardId),
        inputs: [
          { type: 'select', name: 'dependencyType',
            label: tr(translate, 'dependency-type', 'Dependency type'),
            value: dependency.type, options: dependencyTypeOptions },
          { name: 'dependencyColor', label: tr(translate, 'dependency-color', 'Dependency color'),
            value: dependency.color, maxlength: 7 },
          { type: 'select', name: 'dependencyIcon',
            label: tr(translate, 'dependency-icon', 'Dependency icon'),
            value: dependency.icon, options: dependencyIconOptions },
        ],
        fields: {
          ...commonFields, legacyOperation: 'save-card-dependency',
          targetCardId: dependency.cardId,
        },
        submitLabel: tr(translate, 'save', 'Save'), id: `dependency-${dependency.cardId}`,
      }), uiAction({
        action: dependencyAction,
        label: tr(translate, 'remove-dependency', 'Remove dependency'), icon: 'remove',
        fields: {
          ...commonFields, legacyOperation: 'remove-card-dependency',
          targetCardId: dependency.cardId,
        },
      })] });
    }
    const existingDependencyIds = new Set(dependencies.map(dependency => dependency.cardId));
    const dependencyCandidates = dependencyCandidateCards
      .filter(candidate => candidate._id !== contentCardId
        && !existingDependencyIds.has(candidate._id))
      .map(candidate => ({ value: candidate._id, label: candidate.title || candidate._id }));
    if (dependencyCandidates.length) {
      rows.push({ rowHeader: false, cells: [uiFieldsetForm({
        action: dependencyAction,
        legend: tr(translate, 'add-dependency', 'Add dependency'),
        inputs: [
          { type: 'select', name: 'targetCardId',
            label: tr(translate, 'card', 'Card'), options: dependencyCandidates },
          { type: 'select', name: 'dependencyType',
            label: tr(translate, 'dependency-type', 'Dependency type'),
            value: DEPENDENCY_TYPES[0].id, options: dependencyTypeOptions },
          { name: 'dependencyColor', label: tr(translate, 'dependency-color', 'Dependency color'),
            value: DEFAULT_DEPENDENCY_COLOR, maxlength: 7 },
          { type: 'select', name: 'dependencyIcon',
            label: tr(translate, 'dependency-icon', 'Dependency icon'),
            value: DEFAULT_DEPENDENCY_ICON, options: dependencyIconOptions },
        ],
        fields: { ...commonFields, legacyOperation: 'save-card-dependency' },
        submitLabel: tr(translate, 'add-dependency', 'Add dependency'), id: 'dependency-new',
      }), ''] });
    }
    const voteAction = boardPath(board) + `/${encodeURIComponent(card._id)}`;
    const booleanOptions = [
      { value: 'false', label: tr(translate, 'no', 'No') },
      { value: 'true', label: tr(translate, 'yes', 'Yes') },
    ];
    if (!vote?.question) {
      rows.push({ rowHeader: false, cells: [uiFieldsetForm({
        action: voteAction, legend: tr(translate, 'vote-question', 'Voting question'),
        inputs: [
          { name: 'voteQuestion', label: tr(translate, 'vote-question', 'Voting question'),
            maxlength: 10000 },
          { type: 'select', name: 'votePublic',
            label: tr(translate, 'vote-public', 'Show who voted what'), options: booleanOptions },
          { type: 'select', name: 'voteAllowNonBoardMembers',
            label: tr(translate, 'allowNonBoardMembers', 'Allow all logged in users'),
            options: booleanOptions },
          { name: 'voteEnd', label: tr(translate, 'card-end', 'End'), maxlength: 40 },
        ],
        fields: { ...commonFields, legacyOperation: 'configure-card-vote' },
        submitLabel: tr(translate, 'save', 'Save'), id: 'vote-new',
      }), ''] });
    } else {
      rows.push({ rowHeader: false, cells: [uiTextForm({
        action: voteAction, label: tr(translate, 'card-end', 'End'), name: 'voteEnd',
        value: voteEnd instanceof Date && Number.isFinite(voteEnd.getTime())
          ? voteEnd.toISOString() : '', maxlength: 40,
        fields: { ...commonFields, legacyOperation: 'update-card-vote-end' },
        submitLabel: tr(translate, 'save', 'Save'), id: 'vote-end',
      }), requestFields.confirmVoteRemove === card._id ? [
        tr(translate, 'vote-delete-pop', 'Delete voting?'),
        uiAction({
          action: voteAction, label: tr(translate, 'delete', 'Delete'), icon: 'remove',
          fields: { ...commonFields, legacyOperation: 'remove-card-vote' },
        }),
      ] : uiAction({
        action: voteAction, label: tr(translate, 'delete', 'Delete'), icon: 'remove',
        fields: { ...commonFields, legacyOperation: 'confirm-remove-card-vote' },
      })] });
    }
    if (!poker?.question) {
      rows.push({ rowHeader: false, cells: [uiFieldsetForm({
        action: voteAction, legend: tr(translate, 'poker-question', 'Planning Poker'),
        inputs: [
          { type: 'select', name: 'pokerAllowNonBoardMembers',
            label: tr(translate, 'allowNonBoardMembers', 'Allow all logged in users'),
            options: booleanOptions },
          { name: 'pokerEnd', label: `${tr(translate, 'card-end', 'End')} (ISO 8601)`,
            maxlength: 40 },
        ],
        fields: { ...commonFields, legacyOperation: 'configure-card-poker' },
        submitLabel: tr(translate, 'save', 'Save'), id: 'poker-new',
      }), ''] });
    } else {
      rows.push({ rowHeader: false, cells: [uiTextForm({
        action: voteAction, label: `${tr(translate, 'card-end', 'End')} (ISO 8601)`,
        name: 'pokerEnd', value: pokerEnd instanceof Date
          && Number.isFinite(pokerEnd.getTime()) ? pokerEnd.toISOString() : '', maxlength: 40,
        fields: { ...commonFields, legacyOperation: 'update-card-poker-end' },
        submitLabel: tr(translate, 'save', 'Save'), id: 'poker-end',
      }), canAdminPoker ? (requestFields.confirmPokerRemove === card._id ? [
        tr(translate, 'poker-delete-pop', 'Delete planning poker?'),
        uiAction({
          action: voteAction, label: tr(translate, 'delete', 'Delete'), icon: 'remove',
          fields: { ...commonFields, legacyOperation: 'remove-card-poker' },
        }),
      ] : uiAction({
        action: voteAction, label: tr(translate, 'delete', 'Delete'), icon: 'remove',
        fields: { ...commonFields, legacyOperation: 'confirm-remove-card-poker' },
      })) : ''] });
    }
    for (const label of contentBoard?.labels || []) {
      const selected = (contentCard?.labelIds || []).includes(label._id);
      rows.push({ color: label.color, rowHeader: false, cells: [uiAction({
        action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
        label: `${selected ? UI_ICONS['select-on'].ascii : UI_ICONS['select-off'].ascii} `
          + `${label.name || tr(translate, `color-${label.color}`, label.color)}`,
        fields: {
          ...commonFields, legacyOperation: 'toggle-card-label', labelId: label._id,
          enabled: selected ? 'false' : 'true',
        },
      }), ''] });
    }
    rows.push({ rowHeader: false, cells: [uiTextareaForm({
      action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
      label: tr(translate, 'description', 'Description'), name: 'cardDescription',
      value: card.description || '',
      fields: { ...commonFields, legacyOperation: 'edit-card-description' },
      submitLabel: tr(translate, 'save', 'Save'),
    }), ''] });
    rows.push({ rowHeader: false, cells: [uiTextForm({
      action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
      label: `${tr(translate, 'setCardColorPopup-title', 'Set color')} (name or #rrggbb)`,
      name: 'cardColor', value: card.color || 'white', maxlength: 20,
      fields: { ...commonFields, legacyOperation: 'edit-card-color' },
      submitLabel: tr(translate, 'save', 'Save'),
    }), ''] });
    if (contentBoard?.allowsRequestedBy !== false) rows.push({ rowHeader: false, cells: [uiTextForm({
      action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
      label: tr(translate, 'requested-by', 'Requested By'),
      name: 'cardIdentityText', value: contentCard?.requestedBy || '', maxlength: 1000,
      fields: {
        ...commonFields, legacyOperation: 'edit-card-identity-text',
        cardIdentityTextField: 'requestedBy',
      },
      submitLabel: tr(translate, 'save', 'Save'),
    }), ''] });
    if (contentBoard?.allowsAssignedBy !== false) rows.push({ rowHeader: false, cells: [uiTextForm({
      action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
      label: tr(translate, 'assigned-by', 'Assigned By'),
      name: 'cardIdentityText', value: contentCard?.assignedBy || '', maxlength: 1000,
      fields: {
        ...commonFields, legacyOperation: 'edit-card-identity-text',
        cardIdentityTextField: 'assignedBy',
      },
      submitLabel: tr(translate, 'save', 'Save'),
    }), ''] });
    rows.push({ rowHeader: false, cells: [uiSelectForm({
      action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
      label: tr(translate, 'list', 'List'), name: 'cardListId', value: card.listId,
      options: activeLists.map(activeList => ({
        value: activeList._id, label: activeList.title || activeList._id,
      })),
      fields: { ...commonFields, legacyOperation: 'move-card-to-list', position: 'top' },
      submitLabel: tr(translate, 'r-move-card-to', 'Move card to'),
    }), ''] });
    rows.push({ rowHeader: false, cells: [uiTextForm({
      action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
      label: tr(translate, 'card-sorting-by-number', 'Card sorting by number'),
      name: 'cardSort', value: String(card.sort ?? ''), maxlength: 40,
      fields: { ...commonFields, legacyOperation: 'edit-card-sort' },
      submitLabel: tr(translate, 'save', 'Save'),
    }), ''] });
    const dateFields = [
      ['receivedAt', 'r-df-received-at', 'Received'],
      ['startAt', 'r-df-start-at', 'Start'],
      ['dueAt', 'due-date', 'Due Date'],
      ['endAt', 'r-df-end-at', 'End'],
    ];
    for (const [field, key, fallback] of dateFields) {
      rows.push({ rowHeader: false, cells: [uiTextForm({
        action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
        label: `${tr(translate, key, fallback)} (ISO 8601)`,
        name: 'cardDateValue', value: isoDate(card[field]), maxlength: 40,
        fields: {
          ...commonFields, legacyOperation: 'edit-card-date', cardDateField: field,
        },
        submitLabel: tr(translate, 'save', 'Save'),
      }), ''] });
    }
    rows.push({ rowHeader: false, cells: [uiAction({
      action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
      label: tr(translate, card.archived ? 'restore' : 'archive-card',
        card.archived ? 'Restore' : 'Move Card to Archive'),
      icon: card.archived ? 'move-up' : 'remove',
      fields: { ...commonFields, legacyOperation: card.archived ? 'restore-card' : 'archive-card' },
    }), ''] });
  }
  if (!getFeatureFlags().disableWatch) rows.push({ rowHeader: false, cells: [uiAction({
    action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
    label: `${isWatching ? UI_ICONS['select-on'].ascii : UI_ICONS['select-off'].ascii} `
      + tr(translate, isWatching ? 'unwatch' : 'watch', isWatching ? 'Unwatch' : 'Watch'),
    fields: { ...commonFields, legacyOperation: 'set-card-watch',
      watchCardId: contentCardId, cardWatch: isWatching ? 'false' : 'true' },
  }), ''] });
  if (canVote) {
    const voteAction = boardPath(board) + `/${encodeURIComponent(card._id)}`;
    for (const [state, key, fallback] of [
      ['positive', 'vote-for-it', 'for it'], ['negative', 'vote-against', 'against'],
    ]) {
      const selected = voteState === state;
      rows.push({ rowHeader: false, cells: [uiAction({
        action: voteAction,
        label: `${selected ? UI_ICONS['select-on'].ascii : UI_ICONS['select-off'].ascii} `
          + tr(translate, key, fallback),
        fields: {
          ...commonFields, legacyOperation: 'cast-card-vote',
          voteState: selected ? 'clear' : state,
        },
      }), ''] });
    }
  }
  if (canPlayPoker) {
    const pokerAction = boardPath(board) + `/${encodeURIComponent(card._id)}`;
    for (const state of POKER_STATES) {
      const selected = pokerState === state;
      rows.push({ rowHeader: false, cells: [uiAction({
        action: pokerAction,
        label: `${selected ? UI_ICONS['select-on'].ascii : UI_ICONS['select-off'].ascii} `
          + tr(translate, `poker-${state}`, state),
        fields: { ...commonFields, legacyOperation: 'cast-card-poker', pokerState: state },
      }), ''] });
    }
    if (canAdminPoker) rows.push({ rowHeader: false, cells: [uiAction({
      action: pokerAction, label: tr(translate, 'poker-finish', 'Finish'),
      fields: { ...commonFields, legacyOperation: 'finish-card-poker' },
    }), ''] });
  }
  if (poker?.question && pokerClosed && canAdminPoker) {
    const pokerAction = boardPath(board) + `/${encodeURIComponent(card._id)}`;
    rows.push({ rowHeader: false, cells: [uiAction({
      action: pokerAction, label: tr(translate, 'poker-replay', 'Replay'),
      fields: { ...commonFields, legacyOperation: 'replay-card-poker' },
    }), uiTextForm({
      action: pokerAction, label: tr(translate, 'set-estimation', 'Set estimation'),
      name: 'pokerEstimation', value: poker.estimation ?? '', maxlength: 40,
      fields: { ...commonFields, legacyOperation: 'estimate-card-poker' },
      submitLabel: tr(translate, 'save', 'Save'), id: 'poker-estimation',
    })] });
  }
  const workerSelf = card.type !== 'cardType-linkedCard'
    && card.type !== 'cardType-linkedBoard'
    && (board.members || []).some(member => member.userId === userId
      && member.isActive !== false && member.isWorker === true);
  const personCandidates = [...new Set([
    ...activeContentMemberIds, ...(contentCard?.members || []),
    ...(contentCard?.assignees || []), ...(contentCard?.requesters || []),
    ...(contentCard?.assigners || []),
  ])];
  for (const targetUserId of personCandidates) {
    const name = personById.get(targetUserId) || targetUserId;
    if (canWrite) {
      const selected = (contentCard?.members || []).includes(targetUserId);
      rows.push({ rowHeader: false, cells: [uiAction({
        action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
        label: `${tr(translate, 'members', 'Members')}: `
          + `${selected ? UI_ICONS['select-on'].ascii : UI_ICONS['select-off'].ascii} ${name}`,
        fields: {
          ...commonFields, legacyOperation: 'toggle-card-person', cardPersonField: 'members',
          targetUserId, enabled: selected ? 'false' : 'true',
        },
      }), ''] });
    }
    if (canWrite || (workerSelf && targetUserId === userId)) {
      const selected = (contentCard?.assignees || []).includes(targetUserId);
      rows.push({ rowHeader: false, cells: [uiAction({
        action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
        label: `${tr(translate, 'assignee', 'Assignee')}: `
          + `${selected ? UI_ICONS['select-on'].ascii : UI_ICONS['select-off'].ascii} ${name}`,
        fields: {
          ...commonFields, legacyOperation: 'toggle-card-person', cardPersonField: 'assignees',
          targetUserId, enabled: selected ? 'false' : 'true',
        },
      }), ''] });
    }
    if (canWrite && contentBoard?.allowsRequestedBy !== false) {
      const selected = (contentCard?.requesters || []).includes(targetUserId);
      rows.push({ rowHeader: false, cells: [uiAction({
        action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
        label: `${tr(translate, 'requested-by', 'Requested By')}: `
          + `${selected ? UI_ICONS['select-on'].ascii : UI_ICONS['select-off'].ascii} ${name}`,
        fields: {
          ...commonFields, legacyOperation: 'toggle-card-identity',
          cardIdentityField: 'requesters', targetUserId,
          enabled: selected ? 'false' : 'true',
        },
      }), ''] });
    }
    if (canWrite && contentBoard?.allowsAssignedBy !== false) {
      const selected = (contentCard?.assigners || []).includes(targetUserId);
      rows.push({ rowHeader: false, cells: [uiAction({
        action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
        label: `${tr(translate, 'assigned-by', 'Assigned By')}: `
          + `${selected ? UI_ICONS['select-on'].ascii : UI_ICONS['select-off'].ascii} ${name}`,
        fields: {
          ...commonFields, legacyOperation: 'toggle-card-identity',
          cardIdentityField: 'assigners', targetUserId,
          enabled: selected ? 'false' : 'true',
        },
      }), ''] });
    }
  }
  const canComment = allowIsBoardMemberCommentOnly(userId, board);
  if (canComment) {
    rows.push({ rowHeader: false, cells: [uiTextareaForm({
      action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
      label: tr(translate, 'comment', 'Comment'), name: 'commentText', id: 'newComment', value: '',
      fields: {
        boardId: card.boardId, cardId: card._id, parentId: '', legacyOperation: 'add-comment',
      },
      submitLabel: tr(translate, 'comment', 'Comment'),
    }), ''] });
  }
  if (canWrite) rows.push({ rowHeader: false, cells: [uiTextForm({
    action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
    label: tr(translate, 'add-checklist', 'Add checklist'), name: 'checklistTitle', value: '',
    fields: {
      boardId: card.boardId, cardId: card._id, position: 'bottom',
      legacyOperation: 'add-checklist',
    },
    submitLabel: tr(translate, 'add-checklist', 'Add checklist'),
  }), ''] });
  if (canWrite) rows.push({ rowHeader: false, cells: [uiTextForm({
    action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
    label: tr(translate, 'add-subtask', 'Add subtask'), name: 'subtaskTitle', value: '',
    maxlength: 1000,
    fields: { ...commonFields, legacyOperation: 'add-subtask' },
    submitLabel: tr(translate, 'add-subtask', 'Add subtask'),
  }), ''] });
  rows.push(
    { color: card.color, cells: [tr(translate, 'title', 'Title'), card.title || ''] },
    ...(parentCard && parentBoard ? [{ cells: [tr(translate, 'parent-card', 'Parent card'), uiLink({
      href: `${boardPath(parentBoard)}/${encodeURIComponent(parentCard._id)}`,
      label: `${parentBoard.title || parentBoard._id} / ${parentCard.title || parentCard._id}`,
    })] }] : []),
    { cells: [tr(translate, 'board', 'Board'), board.title || ''] },
    { cells: [tr(translate, 'list', 'List'), list?.title || ''] },
    { cells: ['Swimlane', swimlane?.title || ''] },
    { cells: [tr(translate, 'description', 'Description'), card.description || ''] },
    { cells: [tr(translate, 'labels', 'Labels'), labels.map(label => label.name || label.color).join(', ')] },
    { cells: [tr(translate, 'members', 'Members'), names(card.members)] },
    { cells: [tr(translate, 'assignee', 'Assignee'), names(card.assignees)] },
    { cells: [tr(translate, 'requested-by', 'Requested By'),
      names(contentCard?.requesters) || contentCard?.requestedBy || ''] },
    { cells: [tr(translate, 'assigned-by', 'Assigned By'),
      names(contentCard?.assigners) || contentCard?.assignedBy || ''] },
    { cells: [tr(translate, 'stickers', 'Stickers'), stickers.map(sticker =>
      [sticker.name || sticker.icon, sticker.name ? sticker.icon : '', sticker.highlight || '']
        .filter(Boolean).join(' - ')).join(', ')] },
    ...customFields.map(field => ({
      cells: [`${tr(translate, 'custom-fields', 'Custom Fields')}: ${field.definition.name}`,
        customFieldDisplayValue(field)],
    })),
    ...dependencies.map(dependency => {
      const dependencyCard = dependencyTargetById.get(dependency.cardId);
      return {
        color: dependency.color,
        cells: [tr(translate, 'card-dependencies', 'Dependencies'), uiLink({
          href: `${boardPath(contentBoard)}/${encodeURIComponent(dependency.cardId)}`,
          label: `${dependency.icon}: ${dependencyCard?.title || dependency.cardId} - `
            + tr(translate, `dependency-type-${dependency.type}`, dependency.type),
        })],
      };
    }),
    ...(vote?.question ? [
      { cells: [tr(translate, 'vote-question', 'Voting question'), vote.question] },
      { cells: [tr(translate, 'vote-for-it', 'for it'), vote.public
        ? names(vote.positive) : String((vote.positive || []).length)] },
      { cells: [tr(translate, 'vote-against', 'against'), vote.public
        ? names(vote.negative) : String((vote.negative || []).length)] },
      { cells: [tr(translate, 'card-end', 'End'), voteEnd instanceof Date
        && Number.isFinite(voteEnd.getTime()) ? voteEnd.toISOString() : ''] },
    ] : []),
    ...(poker?.question ? [
      { cells: [tr(translate, 'poker-question', 'Planning Poker'),
        pokerClosed ? tr(translate, 'poker-finish', 'Finished') : tr(translate, 'active', 'Active')] },
      { cells: [tr(translate, 'card-end', 'End'), pokerEnd instanceof Date
        && Number.isFinite(pokerEnd.getTime()) ? pokerEnd.toISOString() : ''] },
      ...(poker.estimation !== undefined ? [{
        cells: [tr(translate, 'set-estimation', 'Estimation'), String(poker.estimation)],
      }] : []),
      ...(pokerClosed ? POKER_STATES.map(state => ({
        cells: [tr(translate, `poker-${state}`, state),
          `${(poker[state] || []).length} - ${names(poker[state])}`],
      })) : []),
    ] : []),
    ...locations.map(location => {
      const hasCoordinates = typeof location.latitude === 'number'
        && typeof location.longitude === 'number';
      const locationText = [location.name, location.address,
        hasCoordinates ? `${location.latitude}, ${location.longitude}` : ''].filter(Boolean);
      if (hasCoordinates) locationText.push(uiLink({
        href: mapLinkFor(currentUser?.profile?.mapProvider || 'openstreetmap',
          location.latitude, location.longitude),
        label: tr(translate, 'location-open-map', 'Open in map'),
      }));
      return { cells: [tr(translate, 'location', 'Location'), locationText] };
    }),
    { cells: [tr(translate, 'creator', 'Creator'), personById.get(card.userId) || ''] },
    { cells: [tr(translate, 'r-df-received-at', 'Received'), isoDate(card.receivedAt)] },
    { cells: [tr(translate, 'r-df-start-at', 'Start'), isoDate(card.startAt)] },
    { cells: [tr(translate, 'due-date', 'Due Date'), isoDate(card.dueAt)] },
    { cells: [tr(translate, 'r-df-end-at', 'End'), isoDate(card.endAt)] },
    { cells: [tr(translate, 'card-mark-complete', 'Complete'),
      contentCard?.dueComplete === true ? tr(translate, 'yes', 'Yes') : tr(translate, 'no', 'No')] },
    { cells: [tr(translate, contentCard?.isOvertime ? 'overtime-hours' : 'spent-time-hours',
      contentCard?.isOvertime ? 'Overtime hours' : 'Spent time hours'),
      contentCard?.spentTime === undefined ? '' : String(contentCard.spentTime)] },
    { cells: [tr(translate, 'createdAt', 'Created at'), isoDate(card.createdAt)] },
    { cells: [tr(translate, 'modifiedAt', 'Modified at'), isoDate(card.modifiedAt)] },
    { cells: [tr(translate, 'watching', 'Watching'),
      isWatching ? tr(translate, 'yes', 'Yes') : tr(translate, 'no', 'No')] },
  );
  for (const checklist of checklists) {
    const items = checklistItems.filter(candidate => candidate.checklistId === checklist._id);
    const finished = items.filter(item => item.isFinished).length;
    const checklistFields = {
      boardId: card.boardId, cardId: card._id, checklistId: checklist._id,
    };
    const checklistTransferFields = {
      boardId: contentBoardId, cardId: contentCardId, checklistId: checklist._id,
    };
    rows.push({ cells: [tr(translate, 'checklist', 'Checklist'),
      `${checklist.title || ''} (${finished}/${items.length})`] });
    rows.push({ rowHeader: false, cells: [uiExportForm({
      action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
      label: tr(translate, 'export', 'Export'),
      formats: [
        { value: 'pdf', label: 'PDF' },
        { value: 'xlsx', label: 'Excel' },
        { value: 'json', label: 'JSON' },
        { value: 'json-no-attachments', label: `JSON (${tr(translate,
          'export-board-without-attachments', 'without attachments')})` },
        { value: 'zip', label: `.zip (${tr(translate, 'attachments', 'Attachments')})` },
      ],
      sections: [
        { value: 'card-details', label: tr(translate, 'export-card-details', 'Card details') },
        ...BOARD_EXPORT_FIELDS.map(section => ({
          value: section.field,
          label: tr(translate, section.label, section.label),
        })),
      ],
      fields: { ...checklistTransferFields, legacyOperation: 'export-checklist' },
      submitLabel: tr(translate, 'export', 'Export'),
    }), ''] });
    if (canWrite) {
      rows.push({ rowHeader: false, cells: [uiFileForm({
        action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
        label: tr(translate, 'import', 'Import'),
        name: 'importFile', accept: '.json,application/json,.zip,application/zip',
        sections: BOARD_EXPORT_FIELDS.map(section => ({
          value: section.field,
          label: tr(translate, section.label, section.label),
        })),
        fields: { ...checklistTransferFields, legacyOperation: 'import-checklist-file' },
        submitLabel: tr(translate, 'import', 'Import'),
      }), ''] });
      rows.push({ rowHeader: false, cells: [uiTextForm({
        action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
        label: tr(translate, 'checklist', 'Checklist'), name: 'checklistTitle',
        value: checklist.title || '', fields: { ...checklistFields, legacyOperation: 'edit-checklist' },
        submitLabel: tr(translate, 'save', 'Save'),
      }), ''] });
      rows.push({ rowHeader: false, cells: ['', [uiAction({
        action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
        label: `${tr(translate, 'moveChecklist', 'Move Checklist')} ${UI_ICONS['move-up'].ascii}`,
        icon: 'move-up',
        fields: { ...checklistFields, legacyOperation: 'move-checklist-up' },
      }), uiAction({
        action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
        label: `${tr(translate, 'moveChecklist', 'Move Checklist')} ${UI_ICONS['move-down'].ascii}`,
        icon: 'move-down',
        fields: { ...checklistFields, legacyOperation: 'move-checklist-down' },
      })]] });
      if (checklistCardOptions.length > 0) {
        const destination = `${contentBoardId}|${contentCardId}`;
        rows.push({ rowHeader: false, cells: ['', uiSelectForm({
          action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
          label: tr(translate, 'moveChecklist', 'Move Checklist'),
          name: 'targetCardRef', value: destination, options: checklistCardOptions,
          fields: { ...checklistFields, legacyOperation: 'move-checklist-to-card' },
          submitLabel: tr(translate, 'moveChecklist', 'Move Checklist'),
        })] });
        rows.push({ rowHeader: false, cells: ['', uiSelectForm({
          action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
          label: tr(translate, 'copyChecklist', 'Copy Checklist'),
          name: 'targetCardRef', value: destination, options: checklistCardOptions,
          fields: { ...checklistFields, legacyOperation: 'copy-checklist-to-card' },
          submitLabel: tr(translate, 'copyChecklist', 'Copy Checklist'),
        })] });
      }
      const settings = [
        ['hideCheckedChecklistItems', 'hideCheckedChecklistItems', 'Hide checked checklist items',
          checklist.hideCheckedChecklistItems === true],
        ['hideAllChecklistItems', 'hideAllChecklistItems', 'Hide all checklist items',
          checklist.hideAllChecklistItems === true],
        ['showChecklistAtMinicard', 'show-on-minicard', 'Show on minicard',
          isChecklistShownAtMinicard(checklist,
            contentBoard?.allowsChecklistsOnMinicard === true)],
      ];
      for (const [setting, key, fallback, selected] of settings) rows.push({
        rowHeader: false,
        cells: ['', uiAction({
          action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
          label: `${selected ? UI_ICONS['select-on'].ascii : UI_ICONS['select-off'].ascii} `
            + tr(translate, key, fallback),
          fields: { ...checklistFields, legacyOperation: 'toggle-checklist-setting',
            checklistSetting: setting },
        })],
      });
      const confirmingChecklist = requestFields.confirmChecklistDelete === checklist._id;
      rows.push({ rowHeader: false, cells: ['', confirmingChecklist ? [
        `${tr(translate, 'delete', 'Delete')}?`,
        uiAction({
          action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
          label: tr(translate, 'delete', 'Delete'), icon: 'remove',
          fields: { ...checklistFields, legacyOperation: 'delete-checklist' },
        }),
        uiAction({ action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
          label: tr(translate, 'cancel', 'Cancel') }),
      ] : uiAction({
        action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
        label: tr(translate, 'delete', 'Delete'), icon: 'remove',
        fields: { ...checklistFields, legacyOperation: 'confirm-delete-checklist' },
      })] });
      rows.push({ rowHeader: false, cells: [uiTextForm({
        action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
        label: tr(translate, 'add-checklist-item', 'Add checklist item'),
        name: 'checklistItemTitle', value: '',
        fields: { ...checklistFields, position: 'bottom', legacyOperation: 'add-checklist-item' },
        submitLabel: tr(translate, 'add-checklist-item', 'Add checklist item'),
      }), ''] });
    }
    for (const item of items) {
      const itemFields = { ...checklistFields, itemId: item._id };
      rows.push({ cells: [canWrite ? uiAction({
        action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
        label: `${item.isFinished ? UI_ICONS['select-on'].ascii : UI_ICONS['select-off'].ascii} `
          + (item.title || ''),
        fields: { ...itemFields, legacyOperation: 'toggle-checklist-item' },
      }) : item.isFinished ? UI_ICONS['select-on'].ascii : UI_ICONS['select-off'].ascii,
      canWrite ? uiTextForm({
        action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
        label: tr(translate, 'checklist', 'Checklist'), name: 'checklistItemTitle',
        value: item.title || '', fields: { ...itemFields, legacyOperation: 'edit-checklist-item' },
        submitLabel: tr(translate, 'save', 'Save'),
      }) : item.title || ''] });
      if (canWrite) {
        if (destinations.cardPlacements.length > 0) rows.push({
          rowHeader: false,
          cells: ['', uiCardDestinationForm({
            action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
            titleLabel: tr(translate, 'title', 'Title'),
            titleName: 'convertedCardTitle', titleValue: item.title || '',
            destinationLabel: tr(translate, 'r-move-card-to', 'Move card to'),
            destinationName: 'cardDestination',
            destinationValue: destinations.cardPlacements.some(
              option => option.value === rememberedCardDestinationValue,
            ) ? rememberedCardDestinationValue
              : `${card.boardId}|${card.swimlaneId}|${card.listId}|`,
            destinations: destinations.cardPlacements,
            positionLabel: tr(translate, 'sort', 'Sort'),
            positions: [
              { value: 'above', label: tr(translate, 'above-selected-card', 'Above selected card') },
              { value: 'below', label: tr(translate, 'below-selected-card', 'Below selected card') },
            ],
            positionValue: 'above',
            fields: { ...itemFields, legacyOperation: 'convert-checklist-item-to-card' },
            submitLabel: tr(translate, 'convertChecklistItemToCardPopup-title',
              'Convert checklist item to card'),
          })],
        });
        rows.push({ rowHeader: false, cells: ['', [uiAction({
          action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
          label: `${tr(translate, 'moveChecklist', 'Move Checklist')} ${UI_ICONS['move-up'].ascii}`,
          icon: 'move-up',
          fields: { ...itemFields, legacyOperation: 'move-checklist-item-up' },
        }), uiAction({
          action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
          label: `${tr(translate, 'moveChecklist', 'Move Checklist')} ${UI_ICONS['move-down'].ascii}`,
          icon: 'move-down',
          fields: { ...itemFields, legacyOperation: 'move-checklist-item-down' },
        })]] });
        const confirmingItem = requestFields.confirmChecklistItemDelete === item._id;
        rows.push({ rowHeader: false, cells: ['', confirmingItem ? [
          `${tr(translate, 'delete', 'Delete')}?`,
          uiAction({
            action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
            label: tr(translate, 'delete', 'Delete'), icon: 'remove',
            fields: { ...itemFields, legacyOperation: 'delete-checklist-item' },
          }),
          uiAction({ action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
            label: tr(translate, 'cancel', 'Cancel') }),
        ] : uiAction({
          action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
          label: tr(translate, 'delete', 'Delete'), icon: 'remove',
          fields: { ...itemFields, legacyOperation: 'confirm-delete-checklist-item' },
        })] });
      }
    }
  }
  for (const subtask of subtasks) {
    const subtaskBoard = subtaskBoardById.get(subtask.boardId);
    const subtaskList = subtaskListById.get(subtask.listId);
    if (!subtaskBoard) continue;
    const subtaskFields = {
      ...commonFields,
      subtaskId: subtask._id,
    };
    rows.push({ cells: [tr(translate, 'subtasks', 'Subtasks'), uiLink({
      href: `${boardPath(subtaskBoard)}/${encodeURIComponent(subtask._id)}`,
      label: subtask.title || subtask._id,
    })] });
    rows.push({ cells: [tr(translate, 'list', 'List'),
      subtask.boardId === contentBoardId
        ? subtaskList?.title || ''
        : `${subtaskBoard.title || subtaskBoard._id} / ${subtaskList?.title || ''}`] });
    if (!canWrite) continue;
    rows.push({ rowHeader: false, cells: [uiTextForm({
      action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
      label: tr(translate, 'subtasks', 'Subtasks'), name: 'subtaskTitle',
      value: subtask.title || '', maxlength: 1000,
      fields: { ...subtaskFields, legacyOperation: 'edit-subtask-title' },
      submitLabel: tr(translate, 'save', 'Save'),
    }), ''] });
    rows.push({ rowHeader: false, cells: ['', [uiAction({
      action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
      label: `${tr(translate, 'subtasks', 'Subtasks')} ${UI_ICONS['move-up'].ascii}`,
      icon: 'move-up',
      fields: { ...subtaskFields, legacyOperation: 'move-subtask-up' },
    }), uiAction({
      action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
      label: `${tr(translate, 'subtasks', 'Subtasks')} ${UI_ICONS['move-down'].ascii}`,
      icon: 'move-down',
      fields: { ...subtaskFields, legacyOperation: 'move-subtask-down' },
    })]] });
    if (canAdminPoker) {
      const confirmingArchive = requestFields.confirmSubtaskArchive === subtask._id;
      rows.push({ rowHeader: false, cells: ['', confirmingArchive ? [
        `${tr(translate, 'archive-card', 'Move Card to Archive')}?`,
        uiAction({
          action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
          label: tr(translate, 'archive-card', 'Move Card to Archive'), icon: 'remove',
          fields: { ...subtaskFields, legacyOperation: 'archive-subtask' },
        }),
        uiAction({ action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
          label: tr(translate, 'cancel', 'Cancel') }),
      ] : uiAction({
        action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
        label: tr(translate, 'archive-card', 'Move Card to Archive'), icon: 'remove',
        fields: { ...subtaskFields, legacyOperation: 'confirm-archive-subtask' },
      })] });
    }
  }
  const attachmentAction = boardPath(board) + `/${encodeURIComponent(card._id)}`;
  for (const attachment of attachments) {
    const kind = attachmentKind(attachment);
    const responseFields = {
      boardId: contentBoardId, cardId: contentCardId, attachmentId: attachment._id,
    };
    // Mutations are bound to the card the user is actually visiting. The shared
    // operation resolves a linked card's content target itself and refuses a
    // submitted board/card/attachment combination that does not match exactly.
    const mutationFields = {
      boardId: card.boardId, cardId: card._id, attachmentId: attachment._id,
    };
    const actions = [];
    if (kind.isImage) actions.push({
      action: attachmentAction,
      label: tr(translate, 'preview', 'Preview'),
      icon: 'caret-right',
      target: '_blank',
      authPurpose: `download:gif-${attachment._id}`,
      fields: { ...responseFields, legacyOperation: 'preview-attachment-gif' },
    });
    actions.push({
      action: attachmentAction,
      label: tr(translate, 'download', 'Download'),
      icon: 'move-down',
      target: '_blank',
      authPurpose: `download:original-${attachment._id}`,
      fields: { ...responseFields, legacyOperation: 'download-attachment-original' },
    });
    if (canWrite && kind.isImage) {
      actions.push({
        action: attachmentAction,
        label: tr(translate, contentCard?.coverId === attachment._id ? 'remove-cover' : 'add-cover',
          contentCard?.coverId === attachment._id
            ? 'Remove cover image from minicard' : 'Add cover image to minicard'),
        icon: contentCard?.coverId === attachment._id ? 'remove' : 'add',
        fields: {
          ...mutationFields, legacyOperation: 'set-attachment-cover',
          coverState: contentCard?.coverId === attachment._id ? 'off' : 'on',
        },
      });
    }
    rows.push({ cells: [tr(translate, 'attachment', 'Attachment'), uiAttachment({
      name: cleanFileName(attachment.name),
      type: attachment.type || 'application/octet-stream',
      size: Number(attachment.size) || 0,
      actions,
    })] });
    if (canWrite) {
      rows.push({ rowHeader: false, cells: ['', uiTextForm({
        action: attachmentAction,
        id: `attachment-name-${attachment._id}`,
        label: tr(translate, 'rename', 'Rename'), name: 'attachmentName',
        value: cleanFileName(attachment.name), maxlength: 1000,
        fields: { ...mutationFields, legacyOperation: 'rename-attachment' },
        submitLabel: tr(translate, 'save', 'Save'),
      })] });
      const confirmingAttachment = requestFields.confirmAttachmentDelete === attachment._id;
      rows.push({ rowHeader: false, cells: ['', confirmingAttachment ? [
        `${tr(translate, 'delete', 'Delete')}?`,
        uiAction({
          action: attachmentAction,
          label: tr(translate, 'delete', 'Delete'), icon: 'remove',
          fields: { ...mutationFields, legacyOperation: 'delete-attachment' },
        }),
        uiAction({ action: attachmentAction, label: tr(translate, 'cancel', 'Cancel') }),
      ] : uiAction({
        action: attachmentAction,
        label: tr(translate, 'delete', 'Delete'), icon: 'remove',
        fields: { ...mutationFields, legacyOperation: 'confirm-delete-attachment' },
      })] });
    }
  }
  const commentById = new Map(comments.map(comment => [comment._id, comment]));
  const reactionsByComment = new Map(commentReactionDocs.map(doc => [doc.cardCommentId,
    Array.isArray(doc.reactions) ? doc.reactions : []]));
  for (const comment of comments) {
    const parent = comment.parentId ? commentById.get(comment.parentId) : null;
    const replyDescription = parent
      ? `${tr(translate, 'comment-in-reply-to', 'In reply to')}: ${parent.text || ''} - ` : '';
    rows.push({
      cells: [`${tr(translate, 'comment', 'Comment')} - ${personById.get(comment.userId) || comment.userId || ''}`,
        `${replyDescription}${comment.text || ''}${isoDate(comment.createdAt) ? ` (${isoDate(comment.createdAt)})` : ''}`],
    });
    const reactionFields = {
      boardId: card.boardId, cardId: card._id, commentId: comment._id,
      legacyOperation: 'toggle-comment-reaction',
    };
    for (const reaction of reactionsByComment.get(comment._id) || []) {
      const catalogued = commentReaction(reaction.reactionCodepoint);
      if (!catalogued || !Array.isArray(reaction.userIds) || reaction.userIds.length === 0) continue;
      const selected = reaction.userIds.includes(userId);
      rows.push({ rowHeader: false, cells: [
        `${tr(translate, 'addReactionPopup-title', 'Add reaction')}: ${catalogued.ascii}`,
        canComment ? uiAction({
          action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
          label: `${selected ? UI_ICONS['select-on'].ascii : UI_ICONS['select-off'].ascii} `
            + `${catalogued.ascii} (${reaction.userIds.length}) - `
            + names(reaction.userIds),
          fields: { ...reactionFields, reactionCodepoint: catalogued.codepoint },
        }) : `${catalogued.ascii} (${reaction.userIds.length}) - ${names(reaction.userIds)}`,
      ] });
    }
    if (canComment) rows.push({ rowHeader: false, cells: ['', uiSelectForm({
      action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
      label: tr(translate, 'addReactionPopup-title', 'Add reaction'),
      name: 'reactionCodepoint',
      options: COMMENT_REACTIONS.map(reaction => ({
        value: reaction.codepoint, label: reaction.ascii,
      })),
      fields: reactionFields,
      submitLabel: tr(translate, 'addReactionPopup-title', 'Add reaction'),
    })] });
    const mayMutate = canEditComment({
      isAuthor: userId === comment.userId,
      isBoardAdmin: board.hasAdmin(userId),
      restrictCommentEditing: Boolean(board.restrictCommentEditing),
    });
    if (mayMutate) {
      const fields = { boardId: card.boardId, cardId: card._id, commentId: comment._id };
      const confirmingDelete = requestFields.confirmCommentDelete === comment._id;
      rows.push({ rowHeader: false, cells: [uiTextareaForm({
        action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
        label: tr(translate, 'comment', 'Comment'), name: 'commentText',
        id: `editComment-${comment._id}`, value: comment.text || '',
        fields: { ...fields, legacyOperation: 'edit-comment' },
        submitLabel: tr(translate, 'save', 'Save'),
      }), confirmingDelete ? [
        `${tr(translate, 'delete', 'Delete')}?`,
        uiAction({
          action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
          label: tr(translate, 'delete', 'Delete'), icon: 'remove',
          fields: { ...fields, legacyOperation: 'delete-comment' },
        }),
        uiAction({
          action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
          label: tr(translate, 'cancel', 'Cancel'), icon: 'caret-right',
        }),
      ] : uiAction({
          action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
          label: tr(translate, 'delete', 'Delete'), icon: 'remove',
          fields: { ...fields, legacyOperation: 'confirm-delete-comment' },
        })] });
    }
    if (canComment) {
      const replyFields = { boardId: card.boardId, cardId: card._id, parentId: comment._id };
      if (requestFields.replyToComment === comment._id) {
        rows.push({ rowHeader: false, cells: [uiTextareaForm({
          action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
          label: `${tr(translate, 'comment-in-reply-to', 'In reply to')}: ${comment.text || ''}`,
          name: 'commentText', id: `replyComment-${comment._id}`, value: '',
          fields: { ...replyFields, legacyOperation: 'add-comment' },
          submitLabel: tr(translate, 'comment-reply', 'Reply'),
        }), uiAction({
          action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
          label: tr(translate, 'cancel', 'Cancel'),
        })] });
      } else {
        rows.push({ rowHeader: false, cells: ['', uiAction({
          action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
          label: tr(translate, 'comment-reply', 'Reply'),
          fields: { commentId: comment._id, legacyOperation: 'start-comment-reply' },
        })] });
      }
    }
  }
  for (const activity of activities) {
    const activityComment = commentById.get(activity.commentId);
    const label = (contentBoard?.labels || []).find(item => item._id === activity.labelId);
    const dateValue = activity.activityType === 'a-receivedAt' ? contentCard?.receivedAt
      : activity.activityType === 'a-startAt' ? contentCard?.startAt
        : activity.activityType === 'a-dueAt' ? contentCard?.dueAt
          : activity.activityType === 'a-endAt' ? contentCard?.endAt : activity.value;
    const descriptor = cardActivityDescriptor(activity, {
      card: tr(translate, 'this-card', 'this card'),
      board: contentBoard?.title || activity.boardName,
      oldBoard: activity.oldBoardName,
      list: activityListById.get(activity.listId)?.title || activity.listName,
      oldList: activityListById.get(activity.oldListId)?.title || activity.oldListName,
      attachment: attachmentById.get(activity.attachmentId)?.name || activity.attachmentName,
      checklist: checklistById.get(activity.checklistId)?.title || activity.checklistTitle,
      item: checklistItemById.get(activity.checklistItemId)?.title || activity.checklistItemTitle,
      comment: activity.commentText || activityComment?.text,
      value: dateValue instanceof Date ? isoDate(dateValue) : dateValue,
      customField: customFieldById.get(activity.customFieldId)?.name || activity.customFieldName,
      label: label?.name || label?.color || activity.labelName,
      member: personById.get(activity.memberId) || activity.memberName,
      source: activity.source?.system,
    });
    let description = tr(translate, descriptor.key, descriptor.activityType, {
      sprintf: descriptor.args,
    });
    if (activity.activityType === 'addComment' && activityComment?.text) {
      description += `: ${activityComment.text}`;
    }
    rows.push({
      cells: [
        `${tr(translate, 'activities', 'Activities')} - `
          + `${personById.get(activity.userId) || activity.userId || ''}`,
        `${description}${isoDate(activity.createdAt) ? ` (${isoDate(activity.createdAt)})` : ''}`,
      ],
    });
  }
  if (card.archived) rows.unshift({ cells: [tr(translate, 'status', 'Status'),
    tr(translate, 'card-archived', 'This card is moved to Archive.')] });
  return {
    heading: card.title || tr(translate, 'card', 'Card'),
    caption: `${board.title || ''} / ${swimlane?.title || ''} / ${list?.title || ''}`,
    columns: [tr(translate, 'card', 'Card'), tr(translate, 'description', 'Description')],
    rows,
  };
}

async function informationPage(path, userId, translate) {
  if (path === '/shortcuts') return {
    heading: tr(translate, 'keyboard-shortcuts', 'Keyboard shortcuts'),
    columns: [tr(translate, 'keyboard-shortcuts', 'Keyboard shortcuts'), tr(translate, 'action', 'Action')],
    rows: KEYBOARD_SHORTCUT_MAPPINGS.map(mapping => ({
      cells: [mapping.keys.join(' / '), tr(translate, mapping.action, mapping.action)],
    })),
  };
  if (path === '/accessibility') {
    const setting = await AccessibilitySettings.findOneAsync({});
    const allowed = Boolean(userId);
    return {
      heading: setting?.title || tr(translate, 'accessibility-title', 'Accessibility'),
      columns: [tr(translate, 'accessibility', 'Accessibility'), tr(translate, 'status', 'Status')],
      rows: [{ cells: [allowed && setting?.enabled && setting?.body
        ? setting.body : allowed
          ? tr(translate, 'accessibility-info-not-added-yet', 'Accessibility info has not been added yet')
          : tr(translate, 'support-info-only-for-logged-in-users', 'Information is only for logged in users.'),
      allowed && setting?.enabled
        ? tr(translate, 'accessibility-page-enabled', 'Accessibility page enabled')
        : tr(translate, 'change-permissions', 'Permissions')] }],
    };
  }
  if (path === '/support') {
    const setting = (await Settings.findOneAsync({})) || {};
    const allowed = setting.supportPagePublic === true || Boolean(userId);
    const body = !allowed
      ? tr(translate, 'support-info-only-for-logged-in-users', 'Support info is only for logged in users.')
      : setting.supportPageEnabled && setting.supportPageText
        ? setting.supportPageText
        : tr(translate, 'support-info-not-added-yet', 'Support info has not been added yet');
    return {
      heading: setting.supportTitle || tr(translate, 'support', 'Support'),
      columns: [tr(translate, 'support', 'Support'), tr(translate, 'status', 'Status')],
      rows: [{ cells: [body, allowed
        ? tr(translate, 'support', 'Support')
        : tr(translate, 'change-permissions', 'Permissions')] }],
    };
  }
  return null;
}

async function cardRows(cards, userId, translate) {
  const boardIds = [...new Set(cards.map(card => card.boardId))];
  const listIds = [...new Set(cards.map(card => card.listId))];
  const [boards, lists] = await Promise.all([
    Boards.find({ _id: { $in: boardIds } }, { fields: { title: 1, slug: 1 } }).fetchAsync(),
    Lists.find({ _id: { $in: listIds } }, { fields: { title: 1 } }).fetchAsync(),
  ]);
  const boardById = new Map(boards.map(board => [board._id, board]));
  const listById = new Map(lists.map(list => [list._id, list]));
  return cards.flatMap(card => {
    const board = boardById.get(card.boardId);
    if (!board) return [];
    const destination = `${boardPath(board)}/${encodeURIComponent(card._id)}`;
    return [{
      color: card.color,
      cells: [uiAction({ action: destination, label: card.title || tr(translate, 'card', 'Card') }),
        `${board.title || ''} / ${listById.get(card.listId)?.title || ''}`,
        card.dueAt instanceof Date ? card.dueAt.toISOString() : ''],
    }];
  });
}

async function cardDiscoveryPage(path, userId, requestFields, translate) {
  if (!userId) return null;
  if (path === '/bookmarks') {
    const user = await Meteor.users.findOneAsync(userId, { fields: { 'profile.starredPages': 1 } });
    return {
      heading: tr(translate, 'bookmarksPopup-title', 'Starred boards'),
      columns: [tr(translate, 'title', 'Title'), tr(translate, 'link', 'Link')],
      rows: starredPagesOf(user?.profile?.starredPages).map(page => ({
        cells: [page.title, uiAction({ action: page.url, label: page.title })],
      })),
      empty: tr(translate, 'no-results', 'No results'),
    };
  }
  if (!['/my-cards', '/due-cards', '/global-search', '/broken-cards'].includes(path)) return null;
  if (path === '/broken-cards') {
    const result = await searchBrokenCardsPage(userId, requestFields.page);
    const boardIds = [...new Set(result.cards.map(card => card.boardId).filter(Boolean))];
    const listIds = [...new Set(result.cards.map(card => card.listId).filter(Boolean))];
    const swimlaneIds = [...new Set(result.cards.map(card => card.swimlaneId).filter(Boolean))];
    const [boards, lists, swimlanes] = await Promise.all([
      Boards.find({ _id: { $in: boardIds } }, { fields: { title: 1, slug: 1 } }).fetchAsync(),
      Lists.find({ _id: { $in: listIds } }, { fields: { title: 1 } }).fetchAsync(),
      Swimlanes.find({ _id: { $in: swimlaneIds } }, { fields: { title: 1 } }).fetchAsync(),
    ]);
    const boardById = new Map(boards.map(board => [board._id, board]));
    const listById = new Map(lists.map(list => [list._id, list]));
    const swimlaneById = new Map(swimlanes.map(swimlane => [swimlane._id, swimlane]));
    const unknown = tr(translate, 'no-name', '(Unknown)');
    const rows = result.cards.map(card => {
      const board = boardById.get(card.boardId);
      return { color: card.color, cells: [board ? uiAction({
        action: `${boardPath(board)}/${encodeURIComponent(card._id)}`,
        label: card.title || tr(translate, 'card', 'Card'),
      }) : card.title || tr(translate, 'card', 'Card'), board?.title || unknown,
      swimlaneById.get(card.swimlaneId)?.title || unknown,
      listById.get(card.listId)?.title || unknown, card.type || unknown] };
    });
    rows.push({ cells: [tr(translate, 'broken-cards', 'Broken Cards'),
      `${result.totalHits} (${result.page} / ${result.totalPages})`, '', '', [
        result.page > 1 ? uiAction({
          action: path, label: tr(translate, 'previous-page', 'Previous'), icon: 'previous',
          fields: { page: result.page - 1 },
        }) : '',
        result.page < result.totalPages ? uiAction({
          action: path, label: tr(translate, 'next-page', 'Next'), icon: 'next',
          fields: { page: result.page + 1 },
        }) : '',
      ]] });
    return {
      heading: tr(translate, 'broken-cards', 'Broken Cards'),
      columns: [tr(translate, 'card', 'Card'), tr(translate, 'board', 'Board'),
        tr(translate, 'swimlane', 'Swimlane'), tr(translate, 'list', 'List'),
        tr(translate, 'type', 'Type')],
      rows, empty: tr(translate, 'no-results', 'No results'),
    };
  }
  if (path === '/global-search') {
    const queryText = String(requestFields.q || '').trim().slice(0, 2000);
    const searchView = requestFields.searchView === 'me' ? 'me' : 'all';
    const query = new Query();
    query.buildParams(queryText, key => translate(key));
    const currentUser = searchView === 'me'
      ? await Meteor.users.findOneAsync(userId, { fields: { username: 1 } }) : null;
    if (currentUser?.username) query.getQueryParams().addPredicate(
      OPERATOR_USER, currentUser.username,
    );
    const parseErrors = query.errors();
    const shouldSearch = !query.hasErrors() && Boolean(queryText || searchView === 'me');
    const result = shouldSearch
      ? await searchCardsPage(
          userId, query.getQueryParams().getParams(), query.getQueryParams().text,
          requestFields.page,
        )
      : { cards: [], totalHits: 0, errors: [], page: 1, totalPages: 1, limit: DEFAULT_LIMIT };
    const rows = [{ rowHeader: false, cells: [uiSearchForm({
      action: path,
      label: tr(translate, 'globalSearch-title', 'Search All Boards'),
      value: queryText,
      fields: { searchView },
    }), '', ''] }, {
      rowHeader: false,
      cells: [[uiAction({
        action: path,
        label: `${searchView === 'all' ? UI_ICONS['select-on'].ascii : UI_ICONS['select-off'].ascii} `
          + tr(translate, 'globalSearchViewChange-choice-all', 'All cards'),
        fields: { q: queryText, searchView: 'all', page: 1 },
      }), uiAction({
        action: path,
        label: `${searchView === 'me' ? UI_ICONS['select-on'].ascii : UI_ICONS['select-off'].ascii} `
          + tr(translate, 'globalSearchViewChange-choice-me', 'My cards'),
        fields: { q: queryText, searchView: 'me', page: 1 },
      })], '', ''],
    }];
    for (const error of [...parseErrors, ...(result.errors || [])]) {
      const argumentsObject = error?.value && typeof error.value === 'object'
        ? error.value : { sprintf: [String(error?.value || '')] };
      rows.push({ cells: [tr(translate, 'error', 'Error'),
        tr(translate, error?.tag || 'operation-failed', error?.tag || 'Operation failed',
          argumentsObject), ''] });
    }
    if (!shouldSearch) {
      const suggestionBoardIds = await Boards.userBoardIds(
        userId, false, {}, { includePublic: false },
      );
      const [suggestionBoards, suggestionLists] = await Promise.all([
        Boards.find({ _id: { $in: suggestionBoardIds } }, {
          fields: { title: 1, labels: 1 }, sort: { title: 1 }, limit: 200,
        }).fetchAsync(),
        Lists.find({ boardId: { $in: suggestionBoardIds }, archived: { $ne: true } }, {
          fields: { title: 1 }, sort: { title: 1 }, limit: 200,
        }).fetchAsync(),
      ]);
      for (const suggestion of suggestionBoards) rows.push({
        cells: [tr(translate, 'boards', 'Boards'), suggestion.title || '', ''],
      });
      for (const suggestion of suggestionLists) rows.push({
        cells: [tr(translate, 'lists', 'Lists'), suggestion.title || '', ''],
      });
      const seenLabels = new Set();
      for (const label of suggestionBoards.flatMap(item => item.labels || [])) {
        const value = String(label.name || label.color || '').trim();
        if (!value || seenLabels.has(value)) continue;
        seenLabels.add(value);
        rows.push({ cells: [tr(translate, 'labels', 'Labels'), value, ''] });
      }
      const helpTags = Object.fromEntries(Object.entries(GLOBAL_SEARCH_HELP_TAGS)
        .map(([name, key]) => [name, tr(translate, key, key)]));
      for (const [prefix, key] of GLOBAL_SEARCH_HELP_LINES) rows.push({
        cells: [prefix.includes('#') ? tr(translate, key, key, helpTags) : '',
          `${prefix.replace(/[#\n]/g, '').trim()} ${tr(translate, key, key, helpTags)}`.trim(), ''],
      });
    }
    rows.push(...await cardRows(result.cards || [], userId, translate));
    if (shouldSearch) rows.push({ cells: [
      tr(translate, 'globalSearch-title', 'Search All Boards'),
      `${result.totalHits} (${result.page} / ${result.totalPages})`,
      [result.page > 1 ? uiAction({
        action: path, label: tr(translate, 'previous-page', 'Previous'), icon: 'previous',
        fields: { q: queryText, searchView, page: result.page - 1 },
      }) : '', result.page < result.totalPages ? uiAction({
        action: path, label: tr(translate, 'next-page', 'Next'), icon: 'next',
        fields: { q: queryText, searchView, page: result.page + 1 },
      }) : ''],
    ] });
    return {
      heading: tr(translate, 'globalSearch-title', 'Search All Boards'),
      columns: [tr(translate, 'card', 'Card'), tr(translate, 'board', 'Board'),
        tr(translate, 'due-date', 'Due Date')],
      rows, empty: tr(translate, 'no-results', 'No results'),
    };
  }
  const boardIds = await Boards.userBoardIds(userId, false, {}, { includePublic: false });
  const selector = {
    boardId: { $in: boardIds }, type: 'cardType-card', archived: false,
    deletedAt: null,
  };
  if (path === '/my-cards' || path === '/due-cards') selector.$or = [
    { members: userId }, { assignees: userId }, { requesters: userId },
    { assigners: userId }, { userId },
  ];
  if (path === '/due-cards') selector.dueAt = { $exists: true, $nin: [null, ''] };
  const cards = await Cards.find(selector, {
    fields: { title: 1, color: 1, boardId: 1, listId: 1, dueAt: 1 },
    sort: path === '/due-cards' ? { dueAt: 1 } : { modifiedAt: -1 }, limit: 200,
  }).fetchAsync();
  const headings = {
    '/my-cards': tr(translate, 'my-cards', 'My Cards'),
    '/due-cards': tr(translate, 'dueCards-title', 'Due Cards'),
    '/global-search': tr(translate, 'globalSearch-title', 'Search All Boards'),
  };
  const rows = await cardRows(cards, userId, translate);
  return {
    heading: headings[path],
    columns: [tr(translate, 'card', 'Card'), tr(translate, 'board', 'Board'), tr(translate, 'due-date', 'Due Date')],
    rows, empty: tr(translate, 'no-results', 'No results'),
  };
}

async function importPage(path, userId, requestFields, translate) {
  if (!userId || !/^\/import(?:\/|$)/.test(path)) return null;
  const setting = (await Settings.findOneAsync({}, { fields: { productName: 1 } })) || {};
  const selectedKey = segment(/^\/import\/([^/]+)$/.exec(path)?.[1]);
  const selected = importSourceByKey(selectedKey);
  const selectedFields = requestFields.toggleImportField
    ? toggleImportField(requestFields.importFields, requestFields.toggleImportField)
    : parseImportFields(requestFields.importFields);
  const importFields = selectedFields.join(',');
  const rows = IMPORT_SOURCES.map(source => ({
    cells: [source.key === selected?.key ? UI_ICONS['select-on'].ascii : UI_ICONS['select-off'].ascii,
      uiAction({ action: `/import/${source.key}`, label: importSourceName(source, setting.productName || 'WeKan'),
        fields: { importFields } })],
  }));
  if (selected) {
    rows.push({ cells: [tr(translate, 'export-select-what-to-include', 'Select what to include:'),
      tr(translate, 'import-parts-instruction', 'Only the ticked parts are imported.')] });
    for (const part of BOARD_EXPORT_FIELDS) rows.push({ cells: [
      selectedFields.includes(part.field) ? UI_ICONS['select-on'].ascii : UI_ICONS['select-off'].ascii,
      uiAction({
        action: `/import/${selected.key}`, label: tr(translate, part.label, part.label),
        fields: { importFields, toggleImportField: part.field },
        icon: selectedFields.includes(part.field) ? 'select-on' : 'select-off',
      }),
    ] });
    const result = requestFields.legacyImportResult;
    if (result && typeof result === 'object' && result.ok === true && result.boardId) {
      const importedBoard = await Boards.findOneAsync({ _id: result.boardId }, {
        fields: { title: 1, slug: 1 },
      });
      if (importedBoard) rows.push({ cells: [tr(translate, 'import-done', 'Imported:'),
        uiAction({ action: boardPath(importedBoard), label: importedBoard.title || 'Board' })] });
    } else if (result && typeof result === 'object' && result.ok === false) {
      const fallbacks = {
        'error-json-malformed': 'Your text is not valid JSON',
        'error-csv-schema': 'The CSV data is invalid',
        'error-notAuthorized': 'Not authorized',
        'import-file-too-large': 'The import text is too large',
        'invalid-import-source': 'Unknown import source',
      };
      rows.push({ cells: [tr(translate, 'status', 'Status'),
        tr(translate, result.errorKey, fallbacks[result.errorKey] || 'Import failed')] });
    }
    if (selected.key === 'excel') {
      rows.push({ rowHeader: false, cells: [uiFileForm({
        action: `/import/${selected.key}`,
        label: tr(translate, 'import-excel-file', 'Excel file (.xlsx)'),
        name: 'importFile',
        accept: '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        fields: { importFields, legacyOperation: 'import-board-file' },
        submitLabel: tr(translate, 'import', 'Import'),
      }), ''] });
    } else {
      const issueSources = {
        github: ['GitHub', 'GET /repos/OWNER/REPO/issues'],
        gitlab: ['GitLab', 'GET /projects/ID/issues'],
        gitea: ['Gitea', 'GET /repos/OWNER/REPO/issues'],
        forgejo: ['Forgejo', 'GET /repos/OWNER/REPO/issues'],
      };
      const issue = issueSources[selected.key];
      const instruction = issue
        ? translate('import-board-instruction-issues', { sourceName: issue[0], endpoint: issue[1] })
        : tr(translate, `import-board-instruction-${selected.key}`, 'Paste the exported data here.');
      if (selected.key === 'wekan' || selected.key === 'trello') rows.push({
        rowHeader: false,
        cells: [uiFileForm({
          action: `/import/${selected.key}`,
          label: selected.key === 'wekan'
            ? tr(translate, 'import-wekan-file', 'Import from a .json export file:')
            : tr(translate, 'import-trello-json-file', 'Trello .json file'),
          name: 'importFile', accept: selected.key === 'wekan'
            ? '.json,.zip,application/json,application/zip' : '.json,application/json',
          fields: { importFields, legacyOperation: 'import-board-file' },
          submitLabel: tr(translate, 'import', 'Import'),
        }), ''],
      });
      if (selected.key === 'trello') rows.push({
        rowHeader: false,
        cells: [uiFileForm({
          action: `/import/${selected.key}`,
          label: tr(translate, 'import-trello-zip-file', 'Trello .zip file'),
          name: 'importFile', accept: '.zip,application/zip',
          fields: { importFields, legacyOperation: 'import-board-file' },
          submitLabel: tr(translate, 'import', 'Import'),
        }), ''],
      });
      rows.push({ rowHeader: false, cells: [uiTextareaForm({
        action: `/import/${selected.key}`,
        label: `${instruction} ${tr(translate, 'import-board-instruction-about-errors', '')}`.trim(),
        name: 'importText',
        value: result?.ok === false ? String(requestFields.importText || '') : '',
        fields: { importFields, legacyOperation: 'import-board-text' },
        submitLabel: tr(translate, 'import', 'Import'),
      }), ''] });
    }
  }
  return {
    heading: selected
      ? `${tr(translate, 'import-source-heading', 'Import from:')} ${importSourceName(selected, setting.productName || 'WeKan')}`
      : tr(translate, 'import-source-heading', 'Import from:'),
    columns: [tr(translate, 'status', 'Status'), tr(translate, 'import', 'Import')],
    rows,
  };
}

const PROBLEM_STREAM_LABELS = {
  security: 'securityReportTitle',
  speed: 'speedReportTitle',
  tests: 'testsReportTitle',
  cpu: 'cpu-usage',
  database: 'database-problems',
  integrity: 'filesystem-integrity',
};

const PROBLEM_REPORT_STREAMS = {
  'security-report': 'security',
  speed: 'speed',
  tests: 'tests',
  cpu: 'cpu',
  database: 'database',
  integrity: 'integrity',
  api: 'api',
};

function eventDate(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value)
    : date.toISOString().replace('T', ' ').slice(0, 19);
}

function adminProblemsNavigation(translate) {
  return Object.keys(ADMIN_PAGES.problems.panes).map(slug => {
    const title = ADMIN_PANE_TITLES.problems[slug] || {};
    return uiAction({ action: `/admin/problems/${slug}`,
      label: title.title || tr(translate, title.titleKey || slug, slug) });
  });
}

async function adminProblemsEventPage(path, userId, requestFields, translate) {
  const match = /^\/admin\/problems\/([^/]+)$/.exec(path);
  const slug = match?.[1] || '';
  const stream = PROBLEM_REPORT_STREAMS[slug];
  if (!stream) return null;
  const user = userId && await Meteor.users.findOneAsync(userId, {
    fields: { isAdmin: 1 },
  });
  if (!user?.isAdmin) return {
    heading: tr(translate, 'admin-panel', 'Admin Panel'),
    columns: [tr(translate, 'problems', 'Problems'), tr(translate, 'status', 'Status')],
    rows: [{ cells: [tr(translate, 'error-notAuthorized', 'Not authorized'), ''] }],
  };

  const search = String(requestFields.q || '').trim().slice(0, 500);
  const requestedPage = Math.max(1, Math.min(100000, parseInt(requestFields.page, 10) || 1));
  const perPage = 10;
  const total = await EventLog.countForAdmin(userId, stream, search);
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(requestedPage, totalPages);
  const events = await EventLog.pageForAdmin(
    userId, stream, perPage, (page - 1) * perPage, search,
  );
  const oldUserIds = [...new Set(events.map(event => event.userId).filter(Boolean))];
  const oldUsers = oldUserIds.length ? await Meteor.users.find(
    { _id: { $in: oldUserIds } }, { fields: { username: 1 } },
  ).fetchAsync() : [];
  const usernames = new Map(oldUsers.map(item => [item._id, item.username || '']));
  const normalColumns = [
    ['event-datetime', 'Date and time'], ['event-category', 'Category'],
    ['event-bleed', 'Name'], ['event-severity', 'Severity'],
    ['event-action', 'Action'], ['event-source', 'Source'],
    ['username', 'Username'], ['event-ipv4', 'IPv4 address'],
    ['event-ipv6', 'IPv6 address'], ['location', 'Location'],
    ['event-attempts', 'Attempts'], ['event-detail', 'Detail'],
  ];
  const apiColumns = [
    ['username', 'Username'], ['api-endpoint', 'API'], ['api-calls', 'Calls'],
    ['api-first-called', 'First called'], ['api-last-called', 'Last called'],
    ['event-ipv4', 'IPv4 address'], ['event-ipv6', 'IPv6 address'],
    ['location', 'Location'],
  ];
  const columnSpec = stream === 'api' ? apiColumns : normalColumns;
  const columns = columnSpec.map(([key, fallback]) => tr(translate, key, fallback));
  const rows = [{ rowHeader: false, colspanLast: columns.length - 1,
    cells: [tr(translate, 'problems', 'Problems'), adminProblemsNavigation(translate)] }];
  if (stream === 'cpu') {
    const cpu = getCurrentCpu();
    rows.push({ colspanLast: columns.length - 1, cells: [
      tr(translate, 'cpu-usage-current', 'Current CPU usage'),
      `${cpu.percent || 0}% / ${cpu.cores || 0} ${tr(translate, 'cpu-cores-suffix', 'cores')} / ${tr(translate, 'cpu-load-average', 'load average')} ${(cpu.loadAverage || []).join(' / ')}`,
    ] });
  }
  rows.push({ rowHeader: false, colspanLast: columns.length - 1, cells: [
    tr(translate, 'search', 'Search'), uiSearchForm({
      action: path, label: tr(translate, 'search', 'Search'), value: search,
    }),
  ] });
  const address = event => {
    const fallback = classifyAddress(event.ip);
    return [event.ipv4 || fallback.ipv4 || '', event.ipv6 || fallback.ipv6 || ''];
  };
  const location = event => [countryFlag(event.location?.country), locationLabel(event.location)]
    .filter(Boolean).join(' ');
  for (const event of events) {
    const [ipv4, ipv6] = address(event);
    const username = event.username || usernames.get(event.userId) || '';
    rows.push({ cells: stream === 'api' ? [
      username, event.api || '', event.count || 0, eventDate(event.firstAt),
      eventDate(event.at), ipv4, ipv6, location(event),
    ] : [
      eventDate(event.at), event.db || event.category || '',
      event.bleed || event.kind || '', event.severity || '',
      event.action || event.type || '', event.source || '', username,
      ipv4, ipv6, location(event), event.count > 1 ? String(event.count) : '',
      [event.detail, event.message].filter(Boolean).join(' — '),
    ] });
  }
  if (!events.length) rows.push({ rowHeader: false, colspanLast: columns.length,
    cells: [tr(translate, stream === 'api' ? 'api-no-calls' : 'no-new-problems',
      stream === 'api' ? 'No REST API calls have been recorded.' : 'No new problems.')] });
  rows.push({ rowHeader: false, colspanLast: columns.length - 1, cells: [
    `${page} / ${totalPages}`,
    [page > 1 ? uiAction({ action: path, label: tr(translate, 'previous-page', 'Previous'),
      icon: 'previous', fields: { q: search, page: page - 1 } }) : '',
    page < totalPages ? uiAction({ action: path, label: tr(translate, 'next-page', 'Next'),
      icon: 'next', fields: { q: search, page: page + 1 } }) : ''],
  ] });
  const title = ADMIN_PANE_TITLES.problems[slug] || {};
  return {
    heading: `${tr(translate, 'admin-panel', 'Admin Panel')} / ${tr(translate, 'problems', 'Problems')} / ${title.title || tr(translate, title.titleKey || slug, slug)}`,
    columns, rows,
  };
}

async function adminProblemsOfficesPage(path, userId, requestFields, translate) {
  if (path !== '/admin/problems/office') return null;
  const user = userId && await Meteor.users.findOneAsync(userId, {
    fields: { isAdmin: 1 },
  });
  if (!user?.isAdmin) return {
    heading: tr(translate, 'admin-panel', 'Admin Panel'),
    columns: [tr(translate, 'problems', 'Problems'), tr(translate, 'status', 'Status')],
    rows: [{ cells: [tr(translate, 'error-notAuthorized', 'Not authorized'), ''] }],
  };
  const search = String(requestFields.q || '').trim().slice(0, 500);
  const requestedPage = Math.max(1, Math.min(40000, parseInt(requestFields.page, 10) || 1));
  const perPage = 25;
  let result = await loginOfficesForAdmin(userId, {
    limit: perPage, skip: (requestedPage - 1) * perPage, search,
  });
  const totalPages = Math.max(1, Math.ceil((result.total || 0) / perPage));
  const page = Math.min(requestedPage, totalPages);
  if (page !== requestedPage) result = await loginOfficesForAdmin(userId, {
    limit: perPage, skip: (page - 1) * perPage, search,
  });
  const columns = [
    ['office-people', 'People'], ['event-ipv4', 'IPv4 address'],
    ['event-ipv6', 'IPv6 address'], ['office-location', 'Location'],
    ['office-logins', 'Logins'], ['office-first-seen', 'First seen'],
    ['office-last-seen', 'Last seen'],
  ].map(([key, fallback]) => tr(translate, key, fallback));
  const rows = [
    { rowHeader: false, colspanLast: columns.length - 1,
      cells: [tr(translate, 'problems', 'Problems'), adminProblemsNavigation(translate)] },
    { rowHeader: false, colspanLast: columns.length - 1,
      cells: [tr(translate, 'officeReportTitle', 'Offices'),
        tr(translate, 'office-report-desc', 'Where people log in from, with IPv4 and IPv6 addresses.')] },
    { rowHeader: false, colspanLast: columns.length - 1,
      cells: [tr(translate, 'search', 'Search'), uiSearchForm({
        action: path, label: tr(translate, 'search', 'Search'), value: search,
      })] },
  ];
  for (const item of officeRowsByPerson(result.people || [])) {
    const place = officeLabel(item.location);
    rows.push({ cells: [
      item.fullname ? `${item.fullname} (${item.username})` : item.username || '',
      item.ipv4 || '', item.ipv6 || '',
      [place.flag, place.text || item.locationLabel].filter(Boolean).join(' '),
      item.logins || 0, eventDate(item.firstAt), eventDate(item.at),
    ] });
  }
  if (!(result.people || []).length) rows.push({
    rowHeader: false, colspanLast: columns.length,
    cells: [tr(translate, 'office-no-results', 'No offices found.')],
  });
  rows.push({ rowHeader: false, colspanLast: columns.length - 1, cells: [
    `${page} / ${totalPages}`,
    [page > 1 ? uiAction({ action: path, label: tr(translate, 'previous-page', 'Previous'),
      icon: 'previous', fields: { q: search, page: page - 1 } }) : '',
    page < totalPages ? uiAction({ action: path, label: tr(translate, 'next-page', 'Next'),
      icon: 'next', fields: { q: search, page: page + 1 } }) : ''],
  ] });
  return {
    heading: `${tr(translate, 'admin-panel', 'Admin Panel')} / ${tr(translate, 'problems', 'Problems')} / ${tr(translate, 'officeReportTitle', 'Offices')}`,
    columns, rows,
  };
}

async function adminProblemsImpersonationPage(path, userId, requestFields, translate) {
  if (path !== '/admin/problems/impersonation') return null;
  const search = String(requestFields.q || '').trim().slice(0, 500);
  const requestedPage = Math.max(1, Math.min(100000, parseInt(requestFields.page, 10) || 1));
  const perPage = 10;
  let report;
  try {
    report = await impersonationReportForAdmin(userId, {
      search, limit: perPage, skip: (requestedPage - 1) * perPage,
    });
  } catch (error) {
    if (error?.error !== 'not-authorized') throw error;
    return {
      heading: tr(translate, 'admin-panel', 'Admin Panel'),
      columns: [tr(translate, 'problems', 'Problems'), tr(translate, 'status', 'Status')],
      rows: [{ cells: [tr(translate, 'impersonationReportTitle', 'Impersonation Report'),
        tr(translate, 'error-notAuthorized', 'Not authorized')] }],
    };
  }
  const totalPages = Math.max(1, Math.ceil(report.total / perPage));
  const page = Math.min(requestedPage, totalPages);
  if (page !== requestedPage) report = await impersonationReportForAdmin(userId, {
    search, limit: perPage, skip: (page - 1) * perPage,
  });
  const names = new Map(report.users.map(user => [user._id,
    user.username || user.profile?.fullname || user.profile?.initials || user._id]));
  const columns = [
    ['date', 'Date'], ['impersonation-admin', 'Administrator'],
    ['impersonation-user', 'Impersonated user'], ['board', 'Board'],
    ['reason', 'Reason'],
  ].map(([key, fallback]) => tr(translate, key, fallback));
  const rows = [
    { rowHeader: false, colspanLast: columns.length - 1,
      cells: [tr(translate, 'problems', 'Problems'), adminProblemsNavigation(translate)] },
    { rowHeader: false, colspanLast: columns.length - 1,
      cells: [tr(translate, 'search', 'Search'), uiSearchForm({
        action: path, label: tr(translate, 'search', 'Search'), value: search,
      })] },
  ];
  for (const item of report.rows) rows.push({ cells: [
    eventDate(item.createdAt), names.get(item.adminId) || item.adminId || '',
    names.get(item.userId) || item.userId || '', item.boardId || '', item.reason || '',
  ] });
  if (!report.rows.length) rows.push({ rowHeader: false, colspanLast: columns.length,
    cells: [tr(translate, 'no-results', 'No results')] });
  rows.push({ rowHeader: false, colspanLast: columns.length - 1, cells: [
    `${page} / ${totalPages}`,
    [page > 1 ? uiAction({ action: path, label: tr(translate, 'previous-page', 'Previous'),
      icon: 'previous', fields: { q: search, page: page - 1 } }) : '',
    page < totalPages ? uiAction({ action: path, label: tr(translate, 'next-page', 'Next'),
      icon: 'next', fields: { q: search, page: page + 1 } }) : ''],
  ] });
  return {
    heading: `${tr(translate, 'admin-panel', 'Admin Panel')} / ${tr(translate, 'problems', 'Problems')} / ${tr(translate, 'impersonationReportTitle', 'Impersonation Report')}`,
    columns, rows,
  };
}

async function adminProblemsRecoveryPage(path, userId, requestFields, translate) {
  if (path !== '/admin/problems/recovery') return null;
  const search = String(requestFields.q || '').trim().slice(0, 500);
  const status = ['all', 'done', 'failed', 'deleted'].includes(requestFields.status)
    ? requestFields.status : 'all';
  const requestedPage = Math.max(1, Math.min(100000, parseInt(requestFields.page, 10) || 1));
  const perPage = 10;
  let report;
  let total;
  try {
    [report, total] = await Promise.all([
      recoveryReportForAdmin(userId, {
        search, status, limit: perPage, skip: (requestedPage - 1) * perPage,
      }),
      recoveryReportCountForAdmin(userId, search, status),
    ]);
  } catch (error) {
    if (error?.error !== 'not-authorized') throw error;
    return {
      heading: tr(translate, 'admin-panel', 'Admin Panel'),
      columns: [tr(translate, 'problems', 'Problems'), tr(translate, 'status', 'Status')],
      rows: [{ cells: [tr(translate, 'recoveryReportTitle', 'Recovery'),
        tr(translate, 'error-notAuthorized', 'Not authorized')] }],
    };
  }
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(requestedPage, totalPages);
  if (page !== requestedPage) report = await recoveryReportForAdmin(userId, {
    search, status, limit: perPage, skip: (page - 1) * perPage,
  });
  const columns = [
    ['done', 'Done'], ['date', 'Date'], ['recovery-event', 'Event'],
    [null, 'User ID'], ['username', 'Username'],
    ['event-ipv4', 'IPv4 address'], ['event-ipv6', 'IPv6 address'],
    ['location', 'Location'], ['recovery-detail', 'Detail'],
  ].map(([key, fallback]) => key ? tr(translate, key, fallback) : fallback);
  const rows = [
    { rowHeader: false, colspanLast: columns.length - 1,
      cells: [tr(translate, 'problems', 'Problems'), adminProblemsNavigation(translate)] },
    { rowHeader: false, colspanLast: columns.length - 1,
      cells: [tr(translate, 'recoveryReportTitle', 'Recovery'), [
        tr(translate, 'recovery-report-desc', 'Automatic recovery and remediation history.'),
        'The permanent-delete setting must be enabled before a delete icon is shown. Recovery logs setting changes and every successful, failed, or unauthorized permanent-delete attempt, including Done status, user ID, username, trusted IPv4 or IPv6 address and available location. Board deletion records IDs and titles; file deletion records the attachment ID, sanitized filename and card ID.',
      ]] },
    { rowHeader: false, colspanLast: columns.length - 1,
      cells: [tr(translate, 'search', 'Search'), [
        uiSearchForm({ action: path, label: tr(translate, 'search', 'Search'),
          value: search, fields: { status } }),
        uiSelectForm({ action: path, label: 'Show',
          name: 'status', value: status, fields: { q: search },
          submitLabel: tr(translate, 'filter', 'Filter'), options: [
            { value: 'all', label: 'All' },
            { value: 'done', label: tr(translate, 'done', 'Done') },
            { value: 'failed', label: 'Failed' },
            { value: 'deleted', label: 'Deleted' },
          ] }),
      ]] },
  ];
  for (const item of report.rows) {
    const place = [countryFlag(item.location?.country), locationLabel(item.location)]
      .filter(Boolean).join(' ');
    const state = [item.done === false
      ? 'Failed' : tr(translate, 'done', 'Done'),
    item.deletedData === true ? 'Deleted' : '']
      .filter(Boolean).join(' / ');
    rows.push({ cells: [state, eventDate(item.createdAt), item.type || '',
      item.userId || '', item.username || '', item.ipv4 || '', item.ipv6 || '',
      place, item.detail || ''] });
  }
  if (!report.rows.length) rows.push({ rowHeader: false, colspanLast: columns.length,
    cells: [tr(translate, 'recovery-no-events', 'No recovery events.')] });
  rows.push({ rowHeader: false, colspanLast: columns.length - 1, cells: [
    `${page} / ${totalPages}`,
    [page > 1 ? uiAction({ action: path, label: tr(translate, 'previous-page', 'Previous'),
      icon: 'previous', fields: { q: search, status, page: page - 1 } }) : '',
    page < totalPages ? uiAction({ action: path, label: tr(translate, 'next-page', 'Next'),
      icon: 'next', fields: { q: search, status, page: page + 1 } }) : ''],
  ] });
  return {
    heading: `${tr(translate, 'admin-panel', 'Admin Panel')} / ${tr(translate, 'problems', 'Problems')} / ${tr(translate, 'recoveryReportTitle', 'Recovery')}`,
    columns, rows,
  };
}

async function adminProblemsBoardsPage(path, userId, requestFields, translate) {
  if (path !== '/admin/problems/boards') return null;
  const search = String(requestFields.q || '').trim().slice(0, 500);
  const permission = ['all', 'public', 'private'].includes(requestFields.permission)
    ? requestFields.permission : 'all';
  const requestedPage = Math.max(1, Math.min(100000, parseInt(requestFields.page, 10) || 1));
  const perPage = 10;
  let report;
  let total;
  try {
    [report, total] = await Promise.all([
      boardsReportForAdmin(userId, {
        search, permission, limit: perPage, skip: (requestedPage - 1) * perPage,
      }),
      boardsReportCountForAdmin(userId, search, permission),
    ]);
  } catch (error) {
    if (error?.error !== 'not-authorized') throw error;
    return {
      heading: tr(translate, 'admin-panel', 'Admin Panel'),
      columns: [tr(translate, 'problems', 'Problems'), tr(translate, 'status', 'Status')],
      rows: [{ cells: [tr(translate, 'boardsReportTitle', 'Boards Report'),
        tr(translate, 'error-notAuthorized', 'Not authorized')] }],
    };
  }
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(requestedPage, totalPages);
  if (page !== requestedPage) report = await boardsReportForAdmin(userId, {
    search, permission, limit: perPage, skip: (page - 1) * perPage,
  });
  const names = new Map(report.users.map(user => [user._id, user.username || user._id]));
  const orgNames = new Map(report.orgs.map(org => [org._id, org.orgDisplayName || org._id]));
  const teamNames = new Map(report.teams.map(team => [team._id,
    team.teamDisplayName || team._id]));
  const columns = ['Title', 'Id', 'Permission', 'Archived?', 'Members',
    'Organizations', 'Teams'];
  const rows = [
    { rowHeader: false, colspanLast: columns.length - 1,
      cells: [tr(translate, 'problems', 'Problems'), adminProblemsNavigation(translate)] },
    { rowHeader: false, colspanLast: columns.length - 1,
      cells: [tr(translate, 'search', 'Search'), [
        uiSearchForm({ action: path, label: tr(translate, 'search', 'Search'),
          value: search, fields: { permission } }),
        uiSelectForm({ action: path, label: 'Permission', name: 'permission',
          value: permission, fields: { q: search }, submitLabel: tr(translate, 'filter', 'Filter'),
          options: [
            { value: 'all', label: 'All' },
            { value: 'public', label: tr(translate, 'public', 'Public') },
            { value: 'private', label: tr(translate, 'private', 'Private') },
          ] }),
      ]] },
  ];
  for (const board of report.boards) rows.push({ cells: [
    board.title || '', board._id, board.permission || '',
    tr(translate, board.archived ? 'yes' : 'no', board.archived ? 'Yes' : 'No'),
    (board.members || []).filter(member => member.isActive !== false)
      .map(member => names.get(member.userId) || member.userId).join(', '),
    (board.orgs || []).map(org => orgNames.get(org.orgId) || org.orgId).join(', '),
    (board.teams || []).map(team => teamNames.get(team.teamId) || team.teamId).join(', '),
  ] });
  if (!report.boards.length) rows.push({ rowHeader: false, colspanLast: columns.length,
    cells: [tr(translate, 'no-results', 'No results')] });
  rows.push({ rowHeader: false, colspanLast: columns.length - 1, cells: [
    `${page} / ${totalPages}`,
    [page > 1 ? uiAction({ action: path, label: tr(translate, 'previous-page', 'Previous'),
      icon: 'previous', fields: { q: search, permission, page: page - 1 } }) : '',
    page < totalPages ? uiAction({ action: path, label: tr(translate, 'next-page', 'Next'),
      icon: 'next', fields: { q: search, permission, page: page + 1 } }) : ''],
  ] });
  return {
    heading: `${tr(translate, 'admin-panel', 'Admin Panel')} / ${tr(translate, 'problems', 'Problems')} / ${tr(translate, 'boardsReportTitle', 'Boards Report')}`,
    columns, rows,
  };
}

async function adminProblemsCardsPage(path, userId, requestFields, translate) {
  if (path !== '/admin/problems/cards') return null;
  const search = String(requestFields.q || '').trim().slice(0, 500);
  const requestedPage = Math.max(1,
    Math.min(100000, parseInt(requestFields.page, 10) || 1));
  const perPage = 10;
  let report;
  let total;
  try {
    [report, total] = await Promise.all([
      cardsReportForAdmin(userId, {
        search, limit: perPage, skip: (requestedPage - 1) * perPage,
      }),
      cardsReportCountForAdmin(userId, search),
    ]);
  } catch (error) {
    if (error?.error !== 'not-authorized') throw error;
    return {
      heading: tr(translate, 'admin-panel', 'Admin Panel'),
      columns: [tr(translate, 'problems', 'Problems'),
        tr(translate, 'status', 'Status')],
      rows: [{ cells: [tr(translate, 'cardsReportTitle', 'Cards Report'),
        tr(translate, 'error-notAuthorized', 'Not authorized')] }],
    };
  }
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(requestedPage, totalPages);
  if (page !== requestedPage) report = await cardsReportForAdmin(userId, {
    search, limit: perPage, skip: (page - 1) * perPage,
  });
  const mapNames = documents => new Map(documents.map(document => [
    document._id, document.title || document.username || document._id,
  ]));
  const boards = mapNames(report.boards);
  const swimlanes = mapNames(report.swimlanes);
  const lists = mapNames(report.lists);
  const users = mapNames(report.users);
  const columns = ['Card Title', 'Board', 'Swimlane', 'List', 'Members',
    'Assignees'];
  const rows = [
    { rowHeader: false, colspanLast: columns.length - 1,
      cells: [tr(translate, 'problems', 'Problems'),
        adminProblemsNavigation(translate)] },
    { rowHeader: false, colspanLast: columns.length - 1,
      cells: [tr(translate, 'search', 'Search'), uiSearchForm({
        action: path, label: tr(translate, 'search', 'Search'), value: search,
      })] },
  ];
  for (const card of report.cards) rows.push({ cells: [
    card.title || '', boards.get(card.boardId) || card.boardId || '',
    swimlanes.get(card.swimlaneId) || card.swimlaneId || '',
    lists.get(card.listId) || card.listId || '',
    (card.members || []).map(id => users.get(id) || id).join(', '),
    (card.assignees || []).map(id => users.get(id) || id).join(', '),
  ] });
  if (!report.cards.length) rows.push({ rowHeader: false,
    colspanLast: columns.length,
    cells: [tr(translate, 'no-results', 'No results')] });
  rows.push({ rowHeader: false, colspanLast: columns.length - 1, cells: [
    `${page} / ${totalPages}`,
    [page > 1 ? uiAction({ action: path,
      label: tr(translate, 'previous-page', 'Previous'), icon: 'previous',
      fields: { q: search, page: page - 1 } }) : '',
    page < totalPages ? uiAction({ action: path,
      label: tr(translate, 'next-page', 'Next'), icon: 'next',
      fields: { q: search, page: page + 1 } }) : ''],
  ] });
  return {
    heading: `${tr(translate, 'admin-panel', 'Admin Panel')} / ${tr(translate, 'problems', 'Problems')} / ${tr(translate, 'cardsReportTitle', 'Cards Report')}`,
    columns, rows,
  };
}

async function adminProblemsSummaryPage(path, userId, requestFields, translate) {
  if (path !== '/admin/problems/summary') return null;
  const user = userId && await Meteor.users.findOneAsync(userId, {
    fields: { isAdmin: 1 },
  });
  if (!user?.isAdmin) return {
    heading: tr(translate, 'admin-panel', 'Admin Panel'),
    columns: [tr(translate, 'problems', 'Problems'), tr(translate, 'status', 'Status')],
    rows: [{ cells: [tr(translate, 'summary', 'Summary'),
      tr(translate, 'error-notAuthorized', 'Not authorized')] }],
  };

  const [overview, areas] = await Promise.all([
    getProblemsOverview(),
    EventLog.problemAreasForAdmin(userId),
  ]);
  const rows = [];
  rows.push({ rowHeader: false, cells: [tr(translate, 'problems', 'Problems'),
    adminProblemsNavigation(translate)] });

  const inProgress = Array.isArray(overview?.inProgress) ? overview.inProgress : [];
  rows.push({ cells: [tr(translate, 'problems-status-title', 'Status'),
    inProgress.length
      ? [tr(translate, 'problems-in-progress-help', 'Repairs are running.'),
        ...inProgress.map(item => String(item.message || ''))]
      : tr(translate, 'problems-none-in-progress', 'No migrations or repairs are in progress.')] });

  for (const problem of Array.isArray(overview?.problems) ? overview.problems : []) {
    const controls = [];
    if (problem.id === 'broken-cards') controls.push(uiAction({
      action: path, label: tr(translate, 'repair-broken-cards', 'Repair broken cards'),
      icon: 'add', fields: { legacyOperation: 'repair-broken-cards' },
    }));
    if (problem.id === 'unbound-lists') controls.push(uiAction({
      action: path, label: tr(translate, 'restore', 'Restore'), icon: 'add',
      fields: { legacyOperation: 'restore-list-swimlanes' },
    }));
    rows.push({ cells: [`${problem.title || problem.id}${problem.count ? ` (${problem.count})` : ''}`,
      [String(problem.detail || ''), ...controls]] });
  }

  if (requestFields.legacyProblemResult) rows.push({
    cells: [tr(translate, 'status', 'Status'), requestFields.legacyProblemResult],
  });
  if (areas.length) {
    rows.push({ rowHeader: false, cells: [tr(translate, 'problems', 'Problems'),
      tr(translate, 'problems-summary-help', 'Select reviewed problem areas.') ] });
    rows.push({ rowHeader: false, cells: ['', uiFieldsetForm({
      action: path,
      legend: tr(translate, 'acknowledge', 'Acknowledge'),
      inputs: areas.map(area => ({ type: 'checkbox', name: 'problemStreams',
        value: area.stream,
        label: `${tr(translate, PROBLEM_STREAM_LABELS[area.stream] || area.stream, area.stream)}: ${area.count} ${tr(translate, 'new-problems', 'new problems')}` })),
      fields: { legacyOperation: 'acknowledge-problems' },
      submitLabel: tr(translate, 'acknowledge', 'Acknowledge'),
    })] });
  } else rows.push({ cells: [tr(translate, 'problems', 'Problems'),
    tr(translate, 'no-new-problems', 'No new problems.')] });

  return {
    heading: `${tr(translate, 'admin-panel', 'Admin Panel')} / ${tr(translate, 'problems', 'Problems')} / ${tr(translate, 'summary', 'Summary')}`,
    columns: [tr(translate, 'name', 'Name'), tr(translate, 'description', 'Description')],
    rows,
  };
}

export async function legacyHtml4Page(path, userId, requestFields = {}, translate) {
  if (path === '/' || path === '/sign-in' || path === '/sign-up') return null;
  if (path === '/public') return boardsPage(path, userId, true, requestFields, translate);
  const information = await informationPage(path, userId, translate);
  if (information) return information;
  const discovery = await cardDiscoveryPage(path, userId, requestFields, translate);
  if (discovery) return discovery;
  const importer = await importPage(path, userId, requestFields, translate);
  if (importer) return importer;
  const adminProblemsSummary = await adminProblemsSummaryPage(
    path, userId, requestFields, translate,
  );
  if (adminProblemsSummary) return adminProblemsSummary;
  const adminProblemsEvent = await adminProblemsEventPage(
    path, userId, requestFields, translate,
  );
  if (adminProblemsEvent) return adminProblemsEvent;
  const adminProblemsOffices = await adminProblemsOfficesPage(
    path, userId, requestFields, translate,
  );
  if (adminProblemsOffices) return adminProblemsOffices;
  const adminProblemsImpersonation = await adminProblemsImpersonationPage(
    path, userId, requestFields, translate,
  );
  if (adminProblemsImpersonation) return adminProblemsImpersonation;
  const adminProblemsRecovery = await adminProblemsRecoveryPage(
    path, userId, requestFields, translate,
  );
  if (adminProblemsRecovery) return adminProblemsRecovery;
  const adminProblemsBoards = await adminProblemsBoardsPage(
    path, userId, requestFields, translate,
  );
  if (adminProblemsBoards) return adminProblemsBoards;
  const adminProblemsCards = await adminProblemsCardsPage(
    path, userId, requestFields, translate,
  );
  if (adminProblemsCards) return adminProblemsCards;
  if (/^\/(?:allboards|templates|remaining|archive)(?:\/|$)/.test(path)) {
    return boardsPage(path, userId, false, requestFields, translate);
  }
  const rules = await boardRulesPage(path, userId, requestFields, translate);
  if (rules) return rules;
  if (/^\/b(?:\/|$)/.test(path)) return boardPage(path, userId, requestFields, translate);
  if (path === '/accessibility/components') return {
    heading: 'Legacy HTML4 component library',
    caption: 'Shared controls rendered with printable ASCII',
    columns: ['Component', 'HTML4 control', 'Meaning'],
    rows: [
      { cells: ['Expanded section', `${UI_ICONS['caret-down'].ascii} Section`, 'Collapse an expanded section'] },
      { cells: ['Collapsed section', `${UI_ICONS['caret-right'].ascii} Section`, 'Expand a collapsed section'] },
      { cells: ['Add', `${UI_ICONS.add.ascii} Add`, 'Add an item'] },
      { cells: ['Menu', `${UI_ICONS.menu.ascii} Menu`, 'Open actions'] },
    ],
  };
  return {
    heading: path.split('/').filter(Boolean).join(' / ') || 'WeKan',
    columns: ['Page', 'Status'],
    rows: [{ cells: [path, 'This page has a Legacy HTML4 baseline. More controls will appear as its server controller is completed.'] }],
  };
}
