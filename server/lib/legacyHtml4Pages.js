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
import TrelloImportJobs from '/models/trelloImportJobs';
import AttachmentBulkMoveStatus from '/models/attachmentBulkMoveStatus';
import EventLog from '/models/eventLog';
import CustomFields from '/models/customFields';
import Rules from '/models/rules';
import Triggers from '/models/triggers';
import Actions from '/models/actions';
import Integrations from '/models/integrations';
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
import {
  brokenCardsReportCountForAdmin,
  brokenCardsReportForAdmin,
} from '/server/lib/brokenCardsReport';
import {
  attachmentsReportCountForAdmin,
  attachmentsReportForAdmin,
} from '/server/lib/attachmentsReport';
import {
  rulesReportCountForAdmin,
  rulesReportForAdmin,
} from '/server/lib/rulesReport';
import {
  notificationFeatureSettingsForAdmin,
  securityFeatureSettingsForAdmin,
} from '/server/lib/problemFeatureSettings';
import { permanentDeleteSettingForAdmin } from '/server/lib/permanentDeleteSetting';
import { statisticsForAdmin } from '/server/statistics';
import { announcementForAdmin } from '/server/lib/adminAnnouncement';
import { accessibilityForAdmin } from '/server/lib/adminAccessibility';
import { pwaSettingsForAdmin } from '/server/lib/adminPwaSettings';
import { globalWebhooksForAdmin } from '/server/lib/adminGlobalWebhooks';
import { visibilitySettingsForAdmin } from '/server/lib/adminVisibilitySettings';
import { translationsPageForAdmin } from '/server/lib/adminTranslations';
import { inviteRolesForAdmin } from '/server/lib/adminInviteRoles';
import { sharedTemplatesForAdmin } from '/server/lib/adminSharedTemplates';
import { loginSettingsForAdmin } from '/server/lib/adminLoginSettings';
import { emailSettingsForAdmin } from '/server/lib/adminEmailSettings';
import { domainsPageForAdmin } from '/server/lib/adminDomains';
import {
  organizationForAdmin,
  organizationMembersForAdmin,
  organizationsPageForAdmin,
} from '/server/lib/adminOrganizations';
import { teamForAdmin, teamsPageForAdmin } from '/server/lib/adminTeams';
import { lockoutPageForAdmin } from '/server/lib/adminLockout';
import { peoplePageForAdmin, personAvatarsForAdmin,
  personForAdmin } from '/server/lib/adminPeople';
import { textDatabaseMigrationStatusForAdmin } from '/server/methods/migrateTextDatabase';
import { backupPageDataForAdmin } from '/server/methods/backup';
import {
  INVITE_TO_BOARD_ROLES,
} from '/models/inviteToBoardRolesSettings';
import { adminThemeForUser } from '/server/lib/adminThemeSettings';
import { memberProfileForUser } from '/server/lib/memberProfile';
import { memberLanguageChoices } from '/server/lib/memberLanguage';
import { memberSettingsForUser } from '/server/lib/memberSettings';
import { memberAppearanceForUser } from '/server/lib/memberAppearance';
import { memberAvatarsForUser } from '/server/lib/memberAvatar';
import { invitationChoicesForUser } from '/server/models/settings';
import { categoryOf, customColorCount } from '/models/lib/themeCategories';
import { ALLOWED_WAIT_SPINNERS } from '/config/const';
import { BOARD_COLORS } from '/models/metadata/colors';
import { filesize } from 'filesize';
const {
  UI_ICONS, uiAction, uiAttachment, uiCardDestinationForm, uiDocumentPage, uiExportForm,
  uiFileForm, uiImage, uiLink, uiSearchForm, uiStatus,
  uiBoardCreateForm, uiFieldsetForm, uiSelectForm, uiTextForm, uiTextareaForm,
  uiTextareaGroupForm,
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
const { BOARD_ROLES, ROLE_CAPABILITIES } = require('/models/lib/boardRoleCapabilities');
const {
  SHARED_TEMPLATE_SCOPES,
  SHARED_TEMPLATE_SCOPE_LABELS,
  buildSharedTemplateScopeGroups,
  normalizeSharedTemplateScopes,
} = require('/models/lib/sharedTemplates');
const { ADMIN_PAGES, ADMIN_PANE_TITLES } = require('/models/lib/adminUrls');
const { PERMANENT_DELETE_RECOVERY_DESCRIPTION } =
  require('/models/lib/permanentDeleteDescription');
const { classifyAddress } = require('/models/lib/ipAddress');
const { countryFlag, locationLabel, officeLabel } = require('/models/lib/geoHeaders');
const {
  LIMIT_FIELDS,
  LIMIT_MODES,
  normalizeLimitSettings,
  pickModeForLimit,
  pickUnitForBytes,
  toDisplayValue,
} = require('/models/lib/attachmentTransferLimits');
const { CLOUD_CONFIG_FIELDS } = require('/models/lib/attachmentCloudConfig');
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
    sort: 1, cardNumber: 1, stickers: 1, customFields: 1, cardDependencies: 1,
    vote: 1, poker: 1,
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
  let contentCard = card;
  if (card.type === 'cardType-linkedCard' && card.linkedId) {
    // A linked card is both a placement/snapshot on this board and a pointer to
    // content on another board.  Read only the source board id until its ACL has
    // been checked: fetching the whole source first would put private fields in
    // this request even if rendering later tried to hide them.
    const sourceRef = await Cards.findOneAsync({ _id: card.linkedId, deletedAt: null }, {
      fields: { boardId: 1 },
    });
    if (sourceRef && await canUserSeeBoard(userId, sourceRef.boardId)) {
      contentCard = await Cards.findOneAsync({ _id: card.linkedId, deletedAt: null }) || card;
    }
  }
  const contentCardId = contentCard?._id || card._id;
  const contentBoardId = contentCard?.boardId || card.boardId;
  const cardNumberPrefix = board.allowsCardNumber === true
    && Number.isFinite(contentCard?.cardNumber) ? `#${contentCard.cardNumber} ` : '';
  const displayCardTitle = `${cardNumberPrefix}${contentCard?.title || ''}`;
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
  const showCardActivities = board.allowsActivities === true
    && allowIsBoardAdmin(userId, board)
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
      fields: { 'profile.moveAndCopyDialog': 1, 'profile.mapProvider': 1,
        'profile.dateFormat': 1 },
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
  const visible = {
    labels: board.allowsLabels === true,
    members: board.allowsMembers === true,
    assignees: board.allowsAssignee === true,
    creator: board.allowsCreator === true,
    requestedBy: board.allowsRequestedBy === true,
    assignedBy: board.allowsAssignedBy === true,
    list: board.allowsShowLists === true,
    sort: board.allowsCardSortingByNumber === true,
    receivedAt: board.allowsReceivedDate === true,
    startAt: board.allowsStartDate === true,
    dueAt: board.allowsDueDate === true,
    endAt: board.allowsEndDate === true,
    description: board.allowsDescriptionText === true,
    checklists: board.allowsChecklists === true,
    subtasks: board.allowsSubtasks === true,
    attachments: board.allowsAttachments === true,
    comments: board.allowsComments === true,
  };
  visible.dates = visible.receivedAt || visible.startAt || visible.dueAt || visible.endAt;
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
      label: tr(translate, 'title', 'Title'), name: 'cardTitle', value: contentCard?.title || '',
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
    if (board.allowsCustomFields !== false) {
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
    for (const label of visible.labels ? (contentBoard?.labels || []) : []) {
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
    if (visible.description) rows.push({ rowHeader: false, cells: [uiTextareaForm({
      action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
      label: tr(translate, 'description', 'Description'), name: 'cardDescription',
      value: contentCard?.description || '',
      fields: { ...commonFields, legacyOperation: 'edit-card-description' },
      submitLabel: tr(translate, 'save', 'Save'),
    }), ''] });
    rows.push({ rowHeader: false, cells: [uiTextForm({
      action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
      label: `${tr(translate, 'setCardColorPopup-title', 'Set color')} (name or #rrggbb)`,
      name: 'cardColor', value: contentCard?.color || 'white', maxlength: 20,
      fields: { ...commonFields, legacyOperation: 'edit-card-color' },
      submitLabel: tr(translate, 'save', 'Save'),
    }), ''] });
    if (visible.requestedBy) rows.push({ rowHeader: false, cells: [uiTextForm({
      action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
      label: tr(translate, 'requested-by', 'Requested By'),
      name: 'cardIdentityText', value: contentCard?.requestedBy || '', maxlength: 1000,
      fields: {
        ...commonFields, legacyOperation: 'edit-card-identity-text',
        cardIdentityTextField: 'requestedBy',
      },
      submitLabel: tr(translate, 'save', 'Save'),
    }), ''] });
    if (visible.assignedBy) rows.push({ rowHeader: false, cells: [uiTextForm({
      action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
      label: tr(translate, 'assigned-by', 'Assigned By'),
      name: 'cardIdentityText', value: contentCard?.assignedBy || '', maxlength: 1000,
      fields: {
        ...commonFields, legacyOperation: 'edit-card-identity-text',
        cardIdentityTextField: 'assignedBy',
      },
      submitLabel: tr(translate, 'save', 'Save'),
    }), ''] });
    if (visible.list) rows.push({ rowHeader: false, cells: [uiSelectForm({
      action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
      label: tr(translate, 'list', 'List'), name: 'cardListId', value: card.listId,
      options: activeLists.map(activeList => ({
        value: activeList._id, label: activeList.title || activeList._id,
      })),
      fields: { ...commonFields, legacyOperation: 'move-card-to-list', position: 'top' },
      submitLabel: tr(translate, 'r-move-card-to', 'Move card to'),
    }), ''] });
    rows.push({ rowHeader: false, cells: [[uiAction({
      action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
      label: tr(translate, 'move-card-to-top', 'Move card to top'), icon: 'move-up',
      fields: {
        ...commonFields, legacyOperation: 'move-card-to-position',
        swimlaneId: card.swimlaneId, listId: card.listId, position: 'top',
      },
    }), uiAction({
      action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
      label: tr(translate, 'move-card-to-bottom', 'Move card to bottom'), icon: 'move-down',
      fields: {
        ...commonFields, legacyOperation: 'move-card-to-position',
        swimlaneId: card.swimlaneId, listId: card.listId, position: 'bottom',
      },
    })], ''] });
    if (destinations.cardPlacements.length > 0) {
      const destinationValue = destinations.cardPlacements.some(
        option => option.value === rememberedCardDestinationValue,
      ) ? rememberedCardDestinationValue
        : `${card.boardId}|${card.swimlaneId}|${card.listId}|`;
      const positionOptions = [
        { value: 'top', label: tr(translate, 'move-card-to-top', 'Move card to top') },
        { value: 'bottom', label: tr(translate, 'move-card-to-bottom', 'Move card to bottom') },
        { value: 'above', label: tr(translate, 'above-selected-card', 'Above selected card') },
        { value: 'below', label: tr(translate, 'below-selected-card', 'Below selected card') },
      ];
      for (const [operation, submitKey, submitFallback] of [
        ['move-card-to-destination', 'moveCardPopup-title', 'Move Card'],
        ['copy-card-to-destination', 'copyCardPopup-title', 'Copy Card'],
      ]) rows.push({ rowHeader: false, cells: [uiCardDestinationForm({
        action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
        titleLabel: tr(translate, 'title', 'Title'), titleValue: contentCard?.title || '',
        destinationLabel: tr(translate, 'r-move-card-to', 'Move card to'),
        destinationValue, destinations: destinations.cardPlacements,
        positionLabel: tr(translate, 'sort', 'Sort'), positions: positionOptions,
        positionValue: 'top', fields: { ...commonFields, legacyOperation: operation },
        submitLabel: tr(translate, submitKey, submitFallback),
      }), ''] });
    }
    if (visible.sort) rows.push({ rowHeader: false, cells: [uiTextForm({
      action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
      label: tr(translate, 'card-sorting-by-number', 'Card sorting by number'),
      name: 'cardSort', value: String(card.sort ?? ''), maxlength: 40,
      fields: { ...commonFields, legacyOperation: 'edit-card-sort' },
      submitLabel: tr(translate, 'save', 'Save'),
    }), ''] });
    const dateFields = [
      ['receivedAt', 'r-df-received-at', 'Received', visible.receivedAt],
      ['startAt', 'r-df-start-at', 'Start', visible.startAt],
      ['dueAt', 'due-date', 'Due Date', visible.dueAt],
      ['endAt', 'r-df-end-at', 'End', visible.endAt],
    ];
    if (visible.dates) rows.push({ rowHeader: false, cells: [uiSelectForm({
      action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
      label: tr(translate, 'date-format', 'Date Format'), name: 'dateFormat',
      value: currentUser?.profile?.dateFormat || 'YYYY-MM-DD', options: [
        ['YYYY-MM-DD', 'date-format-yyyy-mm-dd'],
        ['DD-MM-YYYY', 'date-format-dd-mm-yyyy'],
        ['MM-DD-YYYY', 'date-format-mm-dd-yyyy'],
      ].map(([value, key]) => ({ value, label: tr(translate, key, value) })),
      fields: { ...commonFields, legacyOperation: 'set-card-date-format' },
      submitLabel: tr(translate, 'save', 'Save'),
    }), ''] });
    for (const [field, key, fallback, isVisible] of dateFields) {
      if (!isVisible) continue;
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
    if (canWrite && visible.members) {
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
    if (visible.assignees && (canWrite || (workerSelf && targetUserId === userId))) {
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
    if (canWrite && visible.requestedBy) {
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
    if (canWrite && visible.assignedBy) {
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
  const canComment = visible.comments && allowIsBoardMemberCommentOnly(userId, board);
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
  if (canWrite && visible.checklists) rows.push({ rowHeader: false, cells: [uiTextForm({
    action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
    label: tr(translate, 'add-checklist', 'Add checklist'), name: 'checklistTitle', value: '',
    fields: {
      boardId: card.boardId, cardId: card._id, position: 'bottom',
      legacyOperation: 'add-checklist',
    },
    submitLabel: tr(translate, 'add-checklist', 'Add checklist'),
  }), ''] });
  if (canWrite && visible.subtasks) rows.push({ rowHeader: false, cells: [uiTextForm({
    action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
    label: tr(translate, 'add-subtask', 'Add subtask'), name: 'subtaskTitle', value: '',
    maxlength: 1000,
    fields: { ...commonFields, legacyOperation: 'add-subtask' },
    submitLabel: tr(translate, 'add-subtask', 'Add subtask'),
  }), ''] });
  rows.push(
    { color: contentCard?.color, cells: [tr(translate, 'title', 'Title'), displayCardTitle] },
    ...(parentCard && parentBoard ? [{ cells: [tr(translate, 'parent-card', 'Parent card'), uiLink({
      href: `${boardPath(parentBoard)}/${encodeURIComponent(parentCard._id)}`,
      label: `${parentBoard.title || parentBoard._id} / ${parentCard.title || parentCard._id}`,
    })] }] : []),
    { cells: [tr(translate, 'board', 'Board'), board.title || ''] },
    ...(visible.list ? [{ cells: [tr(translate, 'list', 'List'), list?.title || ''] }] : []),
    { cells: ['Swimlane', swimlane?.title || ''] },
    ...(visible.description ? [{ cells: [tr(translate, 'description', 'Description'),
      contentCard?.description || ''] }] : []),
    ...(visible.labels ? [{ cells: [tr(translate, 'labels', 'Labels'),
      labels.map(label => label.name || label.color).join(', ')] }] : []),
    ...(visible.members ? [{ cells: [tr(translate, 'members', 'Members'),
      names(contentCard?.members)] }] : []),
    ...(visible.assignees ? [{ cells: [tr(translate, 'assignee', 'Assignee'),
      names(contentCard?.assignees)] }] : []),
    ...(visible.requestedBy ? [{ cells: [tr(translate, 'requested-by', 'Requested By'),
      names(contentCard?.requesters) || contentCard?.requestedBy || ''] }] : []),
    ...(visible.assignedBy ? [{ cells: [tr(translate, 'assigned-by', 'Assigned By'),
      names(contentCard?.assigners) || contentCard?.assignedBy || ''] }] : []),
    { cells: [tr(translate, 'stickers', 'Stickers'), stickers.map(sticker =>
      [sticker.name || sticker.icon, sticker.name ? sticker.icon : '', sticker.highlight || '']
        .filter(Boolean).join(' - ')).join(', ')] },
    ...(board.allowsCustomFields !== false ? customFields : []).map(field => ({
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
    ...(visible.creator ? [{ cells: [tr(translate, 'creator', 'Creator'),
      personById.get(contentCard?.userId) || ''] }] : []),
    ...(visible.receivedAt ? [{ cells: [tr(translate, 'r-df-received-at', 'Received'),
      isoDate(contentCard?.receivedAt)] }] : []),
    ...(visible.startAt ? [{ cells: [tr(translate, 'r-df-start-at', 'Start'),
      isoDate(contentCard?.startAt)] }] : []),
    ...(visible.dueAt ? [{ cells: [tr(translate, 'due-date', 'Due Date'),
      isoDate(contentCard?.dueAt)] }] : []),
    ...(visible.endAt ? [{ cells: [tr(translate, 'r-df-end-at', 'End'),
      isoDate(contentCard?.endAt)] }] : []),
    ...(board.allowsDueComplete === true ? [{
      cells: [tr(translate, 'card-mark-complete', 'Complete'),
        contentCard?.dueComplete === true ? tr(translate, 'yes', 'Yes') : tr(translate, 'no', 'No')],
    }] : []),
    { cells: [tr(translate, contentCard?.isOvertime ? 'overtime-hours' : 'spent-time-hours',
      contentCard?.isOvertime ? 'Overtime hours' : 'Spent time hours'),
      contentCard?.spentTime === undefined ? '' : String(contentCard.spentTime)] },
    { cells: [tr(translate, 'createdAt', 'Created at'), isoDate(contentCard?.createdAt)] },
    { cells: [tr(translate, 'modifiedAt', 'Modified at'), isoDate(contentCard?.modifiedAt)] },
    { cells: [tr(translate, 'watching', 'Watching'),
      isWatching ? tr(translate, 'yes', 'Yes') : tr(translate, 'no', 'No')] },
  );
  const cardTransferFields = { boardId: card.boardId, cardId: card._id };
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
        value: section.field, label: tr(translate, section.label, section.label),
      })),
    ],
    fields: { ...cardTransferFields, legacyOperation: 'export-card' },
    submitLabel: tr(translate, 'export-card', 'Export card'),
  }), ''] });
  if (canWrite) rows.push({ rowHeader: false, cells: [uiFileForm({
    action: boardPath(board) + `/${encodeURIComponent(card._id)}`,
    label: tr(translate, 'import', 'Import'),
    name: 'importFile', accept: '.json,application/json,.zip,application/zip',
    sections: BOARD_EXPORT_FIELDS.map(section => ({
      value: section.field, label: tr(translate, section.label, section.label),
    })),
    fields: { ...cardTransferFields, legacyOperation: 'import-card-file' },
    submitLabel: tr(translate, 'importCardPopup-title', 'Import card'),
  }), ''] });
  for (const checklist of visible.checklists ? checklists : []) {
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
  for (const subtask of visible.subtasks ? subtasks : []) {
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
  const hasCover = board.allowsCoverAttachmentOnCard === true && Boolean(contentCard?.coverId);
  const orderedAttachments = (visible.attachments ? [...attachments] : []).sort((left, right) =>
    Number(right._id === contentCard?.coverId) - Number(left._id === contentCard?.coverId));
  for (const attachment of orderedAttachments) {
    const kind = attachmentKind(attachment);
    const isCover = hasCover && kind.isImage && contentCard.coverId === attachment._id;
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
    if (kind.isPDF || kind.isOffice) actions.push({
      action: attachmentAction,
      label: tr(translate, 'preview', 'Preview'),
      icon: 'caret-right',
      fields: { ...responseFields, legacyOperation: 'preview-attachment-document',
        documentPage: 1 },
    });
    if (kind.isText || kind.isJSON) actions.push({
      action: attachmentAction,
      label: tr(translate, 'preview', 'Preview'), icon: 'caret-right',
      fields: { ...responseFields, legacyOperation: 'preview-attachment-text' },
    });
    if (kind.isAudio || kind.isVideo) actions.push({
      action: attachmentAction,
      label: tr(translate, kind.isAudio ? 'play' : 'preview', kind.isAudio ? 'Play' : 'Preview'),
      icon: 'caret-right', target: '_blank',
      authPurpose: `download:media-${attachment._id}`,
      fields: { ...responseFields, legacyOperation: 'preview-attachment-media' },
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
    rows.push({ cells: [tr(translate, isCover ? 'cover-image' : 'attachment',
      isCover ? 'Cover image' : 'Attachment'), uiAttachment({
      name: cleanFileName(attachment.name),
      type: attachment.type || 'application/octet-stream',
      size: Number(attachment.size) || 0,
      actions,
    })] });
    const preview = requestFields.legacyDocumentPreview;
    if (preview?.attachmentId === attachment._id) {
      const pageActions = [];
      if (preview.number > 1) pageActions.push(uiAction({
        action: attachmentAction, label: tr(translate, 'previous', 'Previous'), icon: 'previous',
        fields: { ...responseFields, legacyOperation: 'preview-attachment-document',
          documentPage: preview.number - 1 },
      }));
      if (preview.number < preview.pageCount) pageActions.push(uiAction({
        action: attachmentAction, label: tr(translate, 'next', 'Next'), icon: 'next',
        fields: { ...responseFields, legacyOperation: 'preview-attachment-document',
          documentPage: preview.number + 1 },
      }));
      rows.push({ cells: [tr(translate, 'preview', 'Preview'), uiDocumentPage({
        ...preview, actions: pageActions,
      })] });
    }
    const textPreview = requestFields.legacyTextPreview;
    if (textPreview?.attachmentId === attachment._id) rows.push({
      cells: [tr(translate, 'preview', 'Preview'), uiDocumentPage(textPreview)],
    });
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
  if (requestFields.legacyDocumentPreviewError) rows.push({ cells: [
    tr(translate, 'preview', 'Preview'),
    tr(translate, 'error', 'Error'),
  ] });
  if (requestFields.legacyTextPreviewError) rows.push({ cells: [
    tr(translate, 'preview', 'Preview'),
    operationError(translate, requestFields.legacyTextPreviewError),
  ] });
  const commentById = new Map(comments.map(comment => [comment._id, comment]));
  const reactionsByComment = new Map(commentReactionDocs.map(doc => [doc.cardCommentId,
    Array.isArray(doc.reactions) ? doc.reactions : []]));
  for (const comment of visible.comments ? comments : []) {
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
    heading: displayCardTitle || tr(translate, 'card', 'Card'),
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

async function accountProfilePage(path, userId, requestFields, translate) {
  if (path !== '/account/profile') return null;
  let profile;
  try {
    profile = await memberProfileForUser(userId, { req: requestFields.req });
  } catch (_) {
    return {
      heading: tr(translate, 'edit-profile', 'Edit Profile'),
      columns: [tr(translate, 'name', 'Name'), tr(translate, 'description', 'Description')],
      rows: [{ cells: [tr(translate, 'status', 'Status'),
        tr(translate, 'error-notAuthorized', 'Not authorized')] }],
    };
  }
  const rows = [];
  const inputs = [
    { name: 'fullname', type: 'text', label: tr(translate, 'fullname', 'Full Name'),
      value: profile.fullname, maxlength: 256 },
    { name: 'initials', type: 'text', label: tr(translate, 'initials', 'Initials'),
      value: profile.initials, maxlength: 20 },
  ];
  const hidden = {
    legacyOperation: 'update-own-profile',
  };
  if (profile.allowUsernameChange) inputs.splice(1, 0, {
    name: 'username', type: 'text', label: tr(translate, 'username', 'Username'),
    value: profile.username, maxlength: 255, required: true,
  });
  else {
    hidden.username = profile.username;
    rows.push({ cells: [tr(translate, 'username', 'Username'), profile.username] });
  }
  if (profile.allowEmailChange) inputs.push({
    name: 'email', type: 'email', label: tr(translate, 'email', 'Email'),
    value: profile.email, maxlength: 320, required: true,
  });
  else {
    hidden.email = profile.email;
    rows.push({ cells: [tr(translate, 'email', 'Email'), profile.email] });
  }
  rows.push({ rowHeader: false, cells: ['', uiFieldsetForm({
    action: path,
    legend: tr(translate, 'edit-profile', 'Edit Profile'),
    inputs,
    fields: hidden,
    submitLabel: tr(translate, 'save', 'Save'),
    id: 'member-profile',
  })] });
  if (requestFields.legacyProfileResult) rows.push({ cells: [
    tr(translate, 'status', 'Status'), requestFields.legacyProfileResult,
  ] });
  return {
    heading: tr(translate, 'edit-profile', 'Edit Profile'),
    columns: [tr(translate, 'name', 'Name'), tr(translate, 'description', 'Description')],
    rows,
  };
}

async function accountLanguagePage(path, userId, requestFields, translate) {
  if (path !== '/account/language') return null;
  const user = userId && await Meteor.users.findOneAsync(userId, {
    fields: { 'profile.language': 1 },
  });
  if (!user) return {
    heading: tr(translate, 'changeLanguagePopup-title', 'Change Language'),
    columns: [tr(translate, 'language', 'Language'), tr(translate, 'status', 'Status')],
    rows: [{ cells: [tr(translate, 'language', 'Language'),
      tr(translate, 'error-notAuthorized', 'Not authorized')] }],
  };
  const choices = memberLanguageChoices();
  const rows = [{ rowHeader: false, cells: ['', uiSelectForm({
    action: path,
    label: tr(translate, 'language', 'Language'),
    name: 'language',
    value: user.profile?.language || 'en',
    options: choices.map(item => ({ value: item.tag,
      label: `${item.name}${item.rtl ? ' (RTL)' : ''}` })),
    fields: { legacyOperation: 'set-member-language' },
    submitLabel: tr(translate, 'save', 'Save'),
  })] }];
  if (requestFields.legacyLanguageResult) rows.push({ cells: [
    tr(translate, 'status', 'Status'), requestFields.legacyLanguageResult,
  ] });
  return {
    heading: tr(translate, 'changeLanguagePopup-title', 'Change Language'),
    columns: [tr(translate, 'language', 'Language'), tr(translate, 'description', 'Description')],
    rows,
  };
}

async function accountPasswordPage(path, userId, requestFields, translate) {
  if (path !== '/account/password') return null;
  const user = userId && await Meteor.users.findOneAsync(userId, {
    fields: { authenticationMethod: 1 },
  });
  const allowed = user && (user.authenticationMethod || '').toLowerCase() !== 'oauth2';
  const rows = [];
  if (allowed) rows.push({ rowHeader: false, cells: ['', uiFieldsetForm({
    action: path,
    legend: tr(translate, 'changePasswordPopup-title', 'Change Password'),
    inputs: [
      { name: 'currentPassword', type: 'password',
        label: `${tr(translate, 'current', 'Current')} ${tr(translate, 'password', 'Password')}`,
        maxlength: 256, autocomplete: 'current-password', required: true },
      { name: 'newPassword', type: 'password',
        label: `${tr(translate, 'new', 'New')} ${tr(translate, 'password', 'Password')}`,
        maxlength: 256, autocomplete: 'new-password', required: true },
      { name: 'passwordAgain', type: 'password',
        label: tr(translate, 'password-again', 'Password (again)'), maxlength: 256,
        autocomplete: 'new-password', required: true },
    ],
    fields: { legacyOperation: 'change-own-password' },
    submitLabel: tr(translate, 'change-password', 'Change Password'),
    id: 'member-password',
  })] });
  else rows.push({ cells: [tr(translate, 'status', 'Status'),
    tr(translate, 'error-notAuthorized', 'Not authorized')] });
  if (requestFields.legacyPasswordResult) rows.push({ cells: [
    tr(translate, 'status', 'Status'), requestFields.legacyPasswordResult,
  ] });
  return {
    heading: tr(translate, 'changePasswordPopup-title', 'Change Password'),
    columns: [tr(translate, 'name', 'Name'), tr(translate, 'description', 'Description')],
    rows,
  };
}

async function accountSettingsPage(path, userId, requestFields, translate) {
  if (path !== '/account/settings') return null;
  let settings;
  try {
    settings = await memberSettingsForUser(userId, { req: requestFields.req });
  } catch (_) {
    return {
      heading: tr(translate, 'changeSettingsPopup-title', 'Change Settings'),
      columns: [tr(translate, 'name', 'Name'), tr(translate, 'description', 'Description')],
      rows: [{ cells: [tr(translate, 'status', 'Status'),
        tr(translate, 'error-notAuthorized', 'Not authorized')] }],
    };
  }
  const inputs = [
    { name: 'showDesktopDragHandles', type: 'checkbox', value: 'true',
      checked: settings.showDesktopDragHandles,
      label: tr(translate, 'show-desktop-drag-handles', 'Show desktop drag handles') },
    { name: 'submitOnEnter', type: 'checkbox', value: 'true',
      checked: settings.submitOnEnter, label: tr(translate, 'submit-on-enter', 'Submit on Enter'),
      description: tr(translate, 'submit-on-enter-description', '') },
    { name: 'openManyCardsAtOnce', type: 'checkbox', value: 'true',
      checked: settings.openManyCardsAtOnce,
      label: tr(translate, 'open-many-cards-at-once', 'Open many cards at once'),
      description: tr(translate, 'open-many-cards-at-once-description', '') },
  ];
  if (!settings.isWorker) inputs.push(
    { name: 'showCardsCountAt', type: 'text',
      label: tr(translate, 'show-cards-minimum-count', 'Show cards minimum count'),
      value: String(settings.showCardsCountAt), maxlength: 6, required: true },
    { name: 'startDayOfWeek', type: 'select',
      label: tr(translate, 'start-day-of-week', 'Start day of week'),
      value: String(settings.startDayOfWeek), options: [
        'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday',
      ].map((key, value) => ({ value: String(value), label: tr(translate, key, key) })) },
    { name: 'rescueCardDescription', type: 'checkbox', value: 'true',
      checked: settings.rescueCardDescription,
      label: tr(translate, 'rescue-card-description', 'Rescue card description') },
  );
  const rows = [{ rowHeader: false, cells: ['', uiFieldsetForm({
    action: path,
    legend: tr(translate, 'changeSettingsPopup-title', 'Change Settings'),
    inputs,
    fields: { legacyOperation: 'save-member-settings', isWorker: String(settings.isWorker) },
    submitLabel: tr(translate, 'save', 'Save'),
    id: 'member-settings',
  })] }];
  if (requestFields.legacyMemberSettingsResult) rows.push({ cells: [
    tr(translate, 'status', 'Status'), requestFields.legacyMemberSettingsResult,
  ] });
  return {
    heading: tr(translate, 'changeSettingsPopup-title', 'Change Settings'),
    columns: [tr(translate, 'name', 'Name'), tr(translate, 'description', 'Description')],
    rows,
  };
}

async function accountAppearancePage(path, userId, requestFields, translate) {
  if (path !== '/account/color' && path !== '/account/font') return null;
  let appearance;
  try {
    appearance = await memberAppearanceForUser(userId, { req: requestFields.req });
  } catch (_) {
    return {
      heading: tr(translate, path === '/account/color' ? 'change-color' : 'change-font',
        path === '/account/color' ? 'Change Color' : 'Change Font'),
      columns: [tr(translate, 'name', 'Name'), tr(translate, 'description', 'Description')],
      rows: [{ cells: [tr(translate, 'status', 'Status'),
        tr(translate, 'error-notAuthorized', 'Not authorized')] }],
    };
  }
  let form;
  if (path === '/account/color') {
    const color = appearance.themeColor;
    const customCount = color ? customColorCount(categoryOf(color)) : 0;
    form = uiFieldsetForm({
      action: path,
      legend: tr(translate, 'change-color', 'Change Color'),
      inputs: [
        { name: 'color', type: 'select', label: tr(translate, 'change-color', 'Change Color'),
          value: color, options: [
            { value: '', label: tr(translate, 'theme-default', 'Default theme') },
            ...appearance.themeColors.map(value => ({ value, label: value })),
          ] },
        { name: 'customColor1', type: 'text',
          label: `${tr(translate, 'custom-color', 'Custom color')} 1`,
          value: appearance.customThemeColors[0] || '', maxlength: 7,
          description: `${tr(translate, 'theme-category-flat', 'Flat')}: 1; ${tr(translate,
            'theme-category-clear', 'Clear')}: 2; ${tr(translate,
            'theme-category-dark', 'Dark')} / ${tr(translate,
            'theme-category-special', 'Special')}: 0` },
        { name: 'customColor2', type: 'text',
          label: `${tr(translate, 'custom-color', 'Custom color')} 2`,
          value: customCount === 2 ? appearance.customThemeColors[1] || '' : '', maxlength: 7 },
        { name: 'allBoardsThemeTiles', type: 'checkbox', value: 'true',
          checked: appearance.allBoardsThemeTiles,
          label: tr(translate, 'all-boards', 'All Boards') },
      ],
      fields: { legacyOperation: 'save-member-theme' },
      submitLabel: tr(translate, 'save', 'Save'), id: 'member-theme',
    });
  } else {
    form = uiFieldsetForm({
      action: path,
      legend: tr(translate, 'change-font', 'Change Font'),
      inputs: [
        { name: 'font', type: 'select', label: tr(translate, 'font', 'Font'),
          value: appearance.uiFont, options: [
            { value: '', label: tr(translate, 'font-default', 'Default font') },
            ...appearance.fonts.map(value => ({ value, label: value })),
          ] },
        { name: 'size', type: 'select', label: tr(translate, 'font-size', 'Font size'),
          value: appearance.uiFontSize, options: appearance.fontSizes.map(item => ({
            value: item.key, label: tr(translate, `font-size-${item.key}`, `${item.percent}%`),
          })) },
        { name: 'textColor', type: 'text', label: tr(translate, 'text-color', 'Text color'),
          value: appearance.uiTextColor, maxlength: 7 },
      ],
      fields: { legacyOperation: 'save-member-font' },
      submitLabel: tr(translate, 'save', 'Save'), id: 'member-font',
    });
  }
  const result = path === '/account/color'
    ? requestFields.legacyThemeResult : requestFields.legacyFontResult;
  const rows = [{ rowHeader: false, cells: ['', form] }];
  if (result) rows.push({ cells: [tr(translate, 'status', 'Status'), result] });
  return {
    heading: tr(translate, path === '/account/color' ? 'change-color' : 'change-font',
      path === '/account/color' ? 'Change Color' : 'Change Font'),
    columns: [tr(translate, 'name', 'Name'), tr(translate, 'description', 'Description')], rows,
  };
}

async function accountAvatarPage(path, userId, requestFields, translate) {
  if (path !== '/account/avatar') return null;
  let result;
  try {
    result = await memberAvatarsForUser(userId, { req: requestFields.req });
  } catch (_) {
    return {
      heading: tr(translate, 'change-avatar', 'Change Avatar'),
      columns: [tr(translate, 'name', 'Name'), tr(translate, 'description', 'Description')],
      rows: [{ cells: [tr(translate, 'status', 'Status'),
        tr(translate, 'error-notAuthorized', 'Not authorized')] }],
    };
  }
  const rows = [{ rowHeader: false, cells: [
    tr(translate, 'initials', 'Initials'),
    uiAction({ action: path, label: tr(translate, 'default-avatar', 'Default avatar'),
      fields: { legacyOperation: 'select-member-avatar', avatarId: '' } }),
  ] }];
  for (const avatar of result.avatars) {
    const selected = result.currentUrl.split('?')[0]
      === `/cdn/storage/avatars/${avatar._id}`;
    const confirming = requestFields.confirmDeleteMemberAvatar === avatar._id;
    rows.push({ rowHeader: false, cells: [
      [uiImage({ src: avatar.dataUrl || `/cdn/storage/avatars/${avatar._id}`,
        alt: avatar.name || tr(translate, 'change-avatar', 'Change Avatar'), width: 96 }),
      `${avatar.name || ''} (${avatar.type || ''}, ${avatar.size || 0})${selected ? ' [x]' : ''}`],
      [uiAction({ action: path, label: tr(translate, 'change-avatar', 'Change Avatar'),
        fields: { legacyOperation: 'select-member-avatar', avatarId: avatar._id } }),
      uiAction({ action: path,
        label: confirming ? tr(translate, 'delete-avatar-confirm', 'Confirm delete')
          : tr(translate, 'delete', 'Delete'), icon: 'remove',
        fields: { legacyOperation: confirming ? 'delete-member-avatar'
          : 'request-delete-member-avatar', avatarId: avatar._id } })],
    ] });
  }
  if (!result.uploadBlocked) rows.push({ rowHeader: false, cells: [
    tr(translate, 'upload-avatar', 'Upload avatar'),
    uiFileForm({ action: path, label: tr(translate, 'upload-avatar', 'Upload avatar'),
      name: 'avatarImage', accept: 'image/*',
      fields: { legacyOperation: 'upload-member-avatar' },
      submitLabel: tr(translate, 'upload', 'Upload') }),
  ] });
  else rows.push({ cells: [tr(translate, 'upload-avatar', 'Upload avatar'),
    tr(translate, 'avatars-upload-blocked-description', 'Avatar uploads are blocked')] });
  if (requestFields.legacyAvatarResult) rows.push({ cells: [
    tr(translate, 'status', 'Status'), requestFields.legacyAvatarResult,
  ] });
  return {
    heading: tr(translate, 'change-avatar', 'Change Avatar'),
    columns: [tr(translate, 'name', 'Name'), tr(translate, 'description', 'Description')],
    rows,
  };
}

async function accountInvitationPage(path, userId, requestFields, translate) {
  if (path !== '/account/invite') return null;
  let boards;
  try {
    boards = await invitationChoicesForUser(userId, { req: requestFields.req });
  } catch (_) {
    return {
      heading: tr(translate, 'invite-people', 'Invite People'),
      columns: [tr(translate, 'name', 'Name'), tr(translate, 'description', 'Description')],
      rows: [{ cells: [tr(translate, 'status', 'Status'),
        tr(translate, 'error-notAuthorized', 'Not authorized')] }],
    };
  }
  const form = uiFieldsetForm({
    action: path, legend: tr(translate, 'invite-people', 'Invite People'),
    id: 'member-invitation', inputs: [
      { type: 'textarea', name: 'invitationEmails',
        label: tr(translate, 'email-addresses', 'Email Addresses'), maxlength: 10000,
        rows: 5 },
      ...boards.map(board => ({ type: 'checkbox', name: 'invitationBoards',
        value: board._id, label: board.title || tr(translate, 'board', 'Board') })),
    ],
    fields: { legacyOperation: 'send-member-invitations' },
    submitLabel: tr(translate, 'invite', 'Invite'),
  });
  const rows = [{ rowHeader: false, cells: [tr(translate, 'invite-people', 'Invite People'), form] }];
  if (requestFields.legacyInvitationResult) rows.push({ cells: [
    tr(translate, 'status', 'Status'), requestFields.legacyInvitationResult,
  ] });
  return {
    heading: tr(translate, 'invite-people', 'Invite People'),
    columns: [tr(translate, 'name', 'Name'), tr(translate, 'description', 'Description')],
    rows,
  };
}

function accountLogoutPage(path, userId, translate) {
  if (path !== '/account/logout') return null;
  return {
    heading: tr(translate, 'log-out', 'Log Out'),
    columns: [tr(translate, 'name', 'Name'), tr(translate, 'actions', 'Actions')],
    rows: [{ cells: [tr(translate, 'username', 'Username'), uiAction({
      action: path, label: tr(translate, 'log-out', 'Log Out'),
      fields: { legacyOperation: 'logout-member' },
    })] }],
  };
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
    const pending = result && typeof result === 'object' && result.ok === true
      && result.pending === true && result.draft;
    const workspaceName = pending ? result.draft.workspaceName
      : String(requestFields.importWorkspaceName || '').slice(0, 100);
    if (pending) {
      const members = Array.isArray(result.draft.members) ? result.draft.members : [];
      rows.push({ rowHeader: false, cells: [uiFieldsetForm({
        action: `/import/${selected.key}`,
        legend: tr(translate, 'import-map-members', 'Map members'),
        id: 'import-member-map',
        fields: { importDraftId: result.draft.id },
        inputs: members.map((member, index) => ({
          type: 'text', name: `memberMap${index}`,
          label: `${member.fullName || member.username} (${member.username}) — ${tr(translate,
            'import-user-select', 'Pick your existing user you want to use as this member')}`,
          value: member.suggestedUserId ? member.username : '', maxlength: 500,
          description: tr(translate, 'import-members-map-note',
            'Unmapped members remain virtual members and can be mapped later.'),
        })),
        submitActions: [
          { name: 'legacyOperation', value: 'finish-board-import',
            label: tr(translate, 'done', 'Done') },
          { name: 'legacyOperation', value: 'finish-board-import-without-mapping',
            label: tr(translate, 'import-without-mapping-members',
              'Import without mapping members (map later)') },
        ],
      }), ''] });
    } else if (result && typeof result === 'object' && result.ok === true && result.boardId) {
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
    if (!pending && selected.key === 'excel') {
      rows.push({ rowHeader: false, cells: [uiFileForm({
        action: `/import/${selected.key}`,
        label: tr(translate, 'import-excel-file', 'Excel file (.xlsx)'),
        name: 'importFile',
        accept: '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        fields: { importFields, legacyOperation: 'import-board-file' },
        submitLabel: tr(translate, 'import', 'Import'),
      }), ''] });
    } else if (!pending) {
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
      if (selected.key === 'trello') rows.push({ rowHeader: false, cells: [uiTextForm({
        action: `/import/${selected.key}`,
        label: tr(translate, 'import-trello-workspace', 'Workspace'),
        name: 'importWorkspaceName', value: workspaceName, maxlength: 100,
        fields: { importFields },
        submitLabel: tr(translate, 'save', 'Save'),
      }), ''] });
      if (selected.key === 'wekan' || selected.key === 'trello') rows.push({
        rowHeader: false,
        cells: [uiFileForm({
          action: `/import/${selected.key}`,
          label: selected.key === 'wekan'
            ? tr(translate, 'import-wekan-file', 'Import from a .json export file:')
            : tr(translate, 'import-trello-json-file', 'Trello .json file'),
          name: 'importFile', accept: selected.key === 'wekan'
            ? '.json,.zip,application/json,application/zip' : '.json,application/json',
          fields: { importFields, importWorkspaceName: workspaceName,
            legacyOperation: 'import-board-file' },
          submitLabel: tr(translate, 'import', 'Import'),
        }), ''],
      });
      if (selected.key === 'trello') rows.push({
        rowHeader: false,
        cells: [uiFileForm({
          action: `/import/${selected.key}`,
          label: tr(translate, 'import-trello-zip-file', 'Trello .zip file'),
          name: 'importFile', accept: '.zip,application/zip',
          fields: { importFields, importWorkspaceName: workspaceName,
            legacyOperation: 'import-board-file' },
          submitLabel: tr(translate, 'import', 'Import'),
        }), ''],
      });
      rows.push({ rowHeader: false, cells: [uiTextareaForm({
        action: `/import/${selected.key}`,
        label: `${instruction} ${tr(translate, 'import-board-instruction-about-errors', '')}`.trim(),
        name: 'importText',
        value: result?.ok === false ? String(requestFields.importText || '') : '',
        fields: { importFields, importWorkspaceName: workspaceName,
          legacyOperation: 'import-board-text' },
        submitLabel: tr(translate, 'import', 'Import'),
      }), ''] });
    }
    if (selected.key === 'trello') {
      const trelloUser = await Meteor.users.findOneAsync(userId, {
        fields: { 'profile.trelloApiSaved': 1, 'profile.boardWorkspacesTree': 1 },
      });
      const saved = trelloUser?.profile?.trelloApiSaved === true;
      const trelloResult = requestFields.legacyTrelloResult;
      rows.push({ cells: [tr(translate, 'trello-api-import', 'Trello API import'),
        tr(translate, 'trello-api-import-desc',
          'Import Trello workspaces and boards directly with the Trello API.')] });
      if (trelloResult?.ok === false) rows.push({ cells: [tr(translate, 'status', 'Status'),
        tr(translate, trelloResult.errorKey, trelloResult.errorKey)] });
      rows.push({ rowHeader: false, cells: [uiFieldsetForm({
        action: path, legend: tr(translate, 'trello-api-import', 'Trello API import'),
        id: 'trello-api-credentials',
        inputs: [
          { type: 'text', name: 'trelloApiKey', maxlength: 500,
            autocomplete: 'off', label: tr(translate, 'trello-api-key', 'Trello API key') },
          { type: 'password', name: 'trelloApiToken', maxlength: 2000,
            autocomplete: 'off', label: tr(translate, 'trello-api-token', 'Trello API token') },
        ],
        submitActions: [
          { name: 'legacyOperation', value: 'trello-save-credentials',
            label: tr(translate, 'save', 'Save') },
          { name: 'legacyOperation', value: 'trello-delete-credentials', icon: 'remove',
            label: tr(translate, 'delete', 'Delete') },
        ],
      }), saved ? tr(translate, 'trello-api-credentials-saved', 'Credentials saved') : ''] });
      if (saved) rows.push({ cells: [tr(translate, 'trello-api-credentials-saved',
        'Credentials saved'), uiAction({ action: path,
        label: tr(translate, 'trello-list-workspaces', 'List Trello workspaces'),
        fields: { legacyOperation: 'trello-list-workspaces' } })] });

      const workspaces = Array.isArray(requestFields.trelloWorkspaces)
        ? requestFields.trelloWorkspaces.slice(0, 100) : [];
      if (workspaces.length) {
        const localWorkspaceOptions = [{ value: '',
          label: tr(translate, 'trello-parent-workspace-top', 'Top level') }];
        const addWorkspaceOptions = (nodes, depth = 0) => {
          for (const node of nodes || []) {
            localWorkspaceOptions.push({ value: node.id,
              label: `${'--'.repeat(depth)}${node.name || node.id}` });
            addWorkspaceOptions(node.children, depth + 1);
          }
        };
        addWorkspaceOptions(trelloUser?.profile?.boardWorkspacesTree);
        const boardInputs = [];
        for (const workspace of workspaces) {
          for (const board of (Array.isArray(workspace.boards) ? workspace.boards : []).slice(0, 100)) {
            boardInputs.push({ type: 'checkbox', name: 'trelloBoardIds', value: board.id,
              checked: true, label: `${workspace.name || ''}: ${board.name || board.id}${board.closed
                ? ` (${tr(translate, 'archived', 'Archived')})` : ''}` });
          }
        }
        rows.push({ rowHeader: false, cells: [uiFieldsetForm({
          action: path, legend: tr(translate, 'trello-import-selected', 'Import selected boards'),
          id: 'trello-api-board-selection',
          inputs: [{ type: 'select', name: 'parentWorkspaceNodeId', value: '',
            label: tr(translate, 'import-trello-parent-workspace', 'Parent workspace'),
            options: localWorkspaceOptions }, ...boardInputs],
          fields: { legacyOperation: 'trello-start-import' },
          submitLabel: tr(translate, 'trello-import-selected', 'Import selected boards'),
        }), ''] });
      }

      const job = await TrelloImportJobs.findOneAsync({ userId }, {
        sort: { createdAt: -1 }, fields: { status: 1, currentIndex: 1, total: 1,
          lastError: 1, results: 1, errorLog: 1, createdAt: 1 },
      });
      if (job) {
        const jobFields = { legacyOperation: 'trello-cancel-import', trelloJobId: job._id };
        const actions = [];
        if (job.status === 'running') actions.push(uiAction({ action: path,
          label: tr(translate, 'trello-cancel', 'Cancel'), fields: jobFields }));
        if (['paused', 'error'].includes(job.status)) actions.push(uiAction({ action: path,
          label: tr(translate, 'trello-resume', 'Resume'), fields: {
            legacyOperation: 'trello-resume-import', trelloJobId: job._id,
          } }));
        if (job.status !== 'running') actions.push(uiAction({ action: path,
          label: tr(translate, 'trello-clear-job', 'Clear job'), fields: {
            legacyOperation: 'trello-clear-job', trelloJobId: job._id,
          } }));
        actions.push(uiAction({ action: path, icon: 'remove',
          label: tr(translate, job.status === 'done' ? 'trello-delete-imported'
            : 'trello-cancel-delete', 'Delete imported boards'), fields: {
            legacyOperation: 'trello-request-cancel-delete', trelloJobId: job._id,
          } }));
        rows.push({ cells: [tr(translate, 'trello-import-progress', 'Import progress'),
          [`${tr(translate, 'status', 'Status')}: ${tr(translate, job.status, job.status)} `
            + `(${Number(job.currentIndex) || 0} / ${Number(job.total) || 0})`, ...actions]] });
        if (job.lastError) rows.push({ cells: [tr(translate, 'error', 'Error'), job.lastError] });
        for (const resultRow of (job.results || []).slice(-100)) rows.push({ cells: [
          resultRow.success ? tr(translate, 'success', 'Success') : tr(translate, 'error', 'Error'),
          resultRow.success
            ? `${resultRow.title || resultRow.trelloBoardId || ''} - ${Number(
              resultRow.attachmentsImported) || 0} ${tr(translate, 'attachments', 'Attachments')}`
            : `${resultRow.trelloBoardId || ''}: ${resultRow.error || ''}`,
        ] });
        if (Array.isArray(job.errorLog) && job.errorLog.length) rows.push({ cells: [
          tr(translate, 'trello-import-errors', 'Import errors'), job.errorLog.slice(-100).join('\n'),
        ] });
      }
      if (job && requestFields.confirmTrelloDeleteJobId === job._id) rows.push({
        rowHeader: false, cells: [uiFieldsetForm({
          action: path, legend: tr(translate, 'trello-cancel-delete-confirm',
            'Delete imported boards?'), id: 'trello-confirm-delete-imported',
          inputs: [{ type: 'checkbox', name: 'confirmed', value: 'true', checked: false,
            label: tr(translate, 'confirm', 'Confirm') }],
          fields: { legacyOperation: 'trello-confirm-cancel-delete', trelloJobId: job._id },
          submitLabel: tr(translate, 'delete', 'Delete'),
        }), ''],
      });
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

function adminSettingsNavigation(translate) {
  return Object.keys(ADMIN_PAGES.settings.panes).map(slug => {
    const title = ADMIN_PANE_TITLES.settings[slug] || {};
    return uiAction({ action: `/admin/settings/${slug}`,
      label: title.title || tr(translate, title.titleKey || slug, slug) });
  });
}

function adminPeopleNavigation(translate) {
  return Object.keys(ADMIN_PAGES.people.panes).map(slug => {
    const title = ADMIN_PANE_TITLES.people[slug] || {};
    return uiAction({ action: `/admin/people/${slug}`,
      label: title.title || tr(translate, title.titleKey || slug, slug) });
  });
}

const ADMIN_ATTACHMENT_PANES = Object.freeze([
  ['backup', 'backup', 'Backup'],
  ['move', 'attachment-move', 'Move attachment'],
  ['default-save-storage', 'default-save-storage', 'Default save storage'],
  ['limits', 'attachment-limits', 'Limits'],
  ['gridfs', 'mongodb-gridfs-storage', 'MongoDB GridFS storage'],
  ['filesystem', 'filesystem-storage', 'Filesystem storage'],
  ['s3', 's3-minio-storage', 'S3 / MinIO storage'],
  ['azure', 'azure-blob-storage', 'Azure Blob storage'],
  ['gcs', 'gcs-storage', 'Google Cloud storage'],
  ['database-migration', 'database-migration', 'Database migration'],
]);

function adminAttachmentsNavigation(translate, backupOnly = false) {
  return ADMIN_ATTACHMENT_PANES.filter(([slug]) => !backupOnly || slug === 'backup')
    .map(([slug, key, fallback]) => uiAction({
    action: `/admin/attachments/${slug}`,
    label: tr(translate, key, fallback),
    fields: {},
    }));
}

const BACKUP_STORAGE_OPTIONS = Object.freeze([
  ['filesystem', 'filesystem-storage', 'Filesystem storage'],
  ['s3', 's3-minio-storage', 'S3 / MinIO storage'],
  ['azure', 'azure-blob-storage', 'Azure Blob storage'],
  ['gcs', 'gcs-storage', 'Google Cloud storage'],
]);
const BACKUP_DAY_KEYS = Object.freeze([
  ['Sunday', 'sunday'], ['Monday', 'monday'], ['Tuesday', 'tuesday'],
  ['Wednesday', 'wednesday'], ['Thursday', 'thursday'], ['Friday', 'friday'],
  ['Saturday', 'saturday'],
]);

async function adminAttachmentsBackupPage(path, userId, requestFields, translate) {
  if (path !== '/admin/attachments/backup') return null;
  let data;
  try {
    data = await backupPageDataForAdmin(userId);
  } catch (error) {
    if (error?.error !== 'not-authorized') throw error;
    return {
      heading: tr(translate, 'admin-panel', 'Admin Panel'),
      columns: [tr(translate, 'attachments', 'Attachments'),
        tr(translate, 'status', 'Status')],
      rows: [{ cells: [tr(translate, 'backup', 'Backup'),
        tr(translate, 'error-notAuthorized', 'Not authorized')] }],
    };
  }
  const storageOptions = BACKUP_STORAGE_OPTIONS.map(([value, key, fallback]) => ({
    value, label: tr(translate, key, fallback),
  }));
  const scopeOptions = [
    ...(data.isSiteAdmin ? [{ value: '',
      label: tr(translate, 'backup-scope-instance', 'Whole instance') }] : []),
    ...data.scopes.map(scope => ({ value: scope._id, label: scope.orgDisplayName })),
  ];
  const defaultScope = data.isSiteAdmin ? '' : data.scopes[0]?._id || '';
  const schedule = data.schedule || {};
  const rows = [
    { rowHeader: false, cells: [tr(translate, 'attachments', 'Attachments'),
      adminAttachmentsNavigation(translate, !data.isSiteAdmin)] },
    { cells: [tr(translate, 'backup-description', 'Create and restore backups'),
      uiFieldsetForm({ action: path, legend: tr(translate, 'backup-now', 'Backup now'),
        inputs: [
          ...(scopeOptions.length > 1 || !data.isSiteAdmin ? [{ type: 'select',
            name: 'backupOrgId', label: tr(translate, 'backup-scope', 'Backup scope'),
            value: defaultScope, options: scopeOptions,
            description: tr(translate, 'backup-scope-description', '') }] : []),
          { type: 'checkbox', name: 'backupAttachments', value: 'true', checked: true,
            label: tr(translate, 'attachments', 'Attachments') },
          { type: 'checkbox', name: 'backupAvatars', value: 'true', checked: true,
            label: tr(translate, 'avatars', 'Avatars') },
          { type: 'checkbox', name: 'backupData', value: 'true', checked: true,
            label: tr(translate, 'backup-data', 'Data') },
          { type: 'select', name: 'backupStorage',
            label: tr(translate, 'backup-storage', 'Backup storage'),
            value: 'filesystem', options: storageOptions },
        ], fields: { legacyOperation: 'run-backup' },
        submitLabel: tr(translate, 'backup-now', 'Backup now'), id: 'legacy-backup-now' })] },
  ];
  if (requestFields.legacyAttachmentsResult) rows.push({ cells: [
    tr(translate, 'status', 'Status'), requestFields.legacyAttachmentsResult,
  ] });
  if (data.status) {
    rows.push({ cells: [tr(translate, 'database-migration-phase', 'Phase'),
      `${String(data.status.phase || 'idle')} ${String(data.status.detail || '')}`.trim()] });
    if (data.status.file) rows.push({ cells: [tr(translate, 'backup-path', 'Backup path'),
      String(data.status.file)] });
    if (data.status.error) rows.push({ cells: [tr(translate, 'server-error', 'Server error'),
      String(data.status.error).slice(0, 500)] });
  }
  if (data.isSiteAdmin) rows.push({ cells: [tr(translate, 'backup-schedule', 'Backup schedule'),
    uiFieldsetForm({ action: path, legend: tr(translate, 'backup-schedule', 'Backup schedule'),
      inputs: [
        { type: 'select', name: 'backupFrequency',
          label: tr(translate, 'backup-frequency', 'Frequency'),
          value: schedule.frequency || 'off', options: [
            ['off', 'backup-frequency-off', 'Off'], ['daily', 'backup-frequency-daily', 'Daily'],
            ['weekly', 'backup-frequency-weekly', 'Weekly'],
            ['monthly', 'backup-frequency-monthly', 'Monthly'],
          ].map(([value, key, fallback]) => ({ value, label: tr(translate, key, fallback) })) },
        { type: 'text', name: 'backupTime', label: tr(translate, 'backup-time', 'Time'),
          value: schedule.time || '04:00', maxlength: 5 },
        { type: 'select', name: 'backupDayOfWeek',
          label: tr(translate, 'backup-day-of-week', 'Day of week'),
          value: schedule.dayOfWeek || 'Sunday', options: BACKUP_DAY_KEYS.map(([value, key]) => ({
            value, label: tr(translate, key, value),
          })) },
        { type: 'select', name: 'backupDayOfMonth',
          label: tr(translate, 'backup-day-of-month', 'Day of month'),
          value: String(schedule.dayOfMonth || 1),
          options: Array.from({ length: 28 }, (_, index) => ({
            value: String(index + 1), label: String(index + 1),
          })) },
        { type: 'checkbox', name: 'backupAttachments', value: 'true',
          checked: schedule.attachments !== false, label: tr(translate, 'attachments', 'Attachments') },
        { type: 'checkbox', name: 'backupAvatars', value: 'true',
          checked: schedule.avatars !== false, label: tr(translate, 'avatars', 'Avatars') },
        { type: 'checkbox', name: 'backupData', value: 'true',
          checked: schedule.data !== false, label: tr(translate, 'backup-data', 'Data') },
        { type: 'select', name: 'backupStorage',
          label: tr(translate, 'backup-storage', 'Backup storage'),
          value: schedule.storage || 'filesystem', options: storageOptions },
      ], fields: { legacyOperation: 'save-backup-schedule' },
      submitLabel: tr(translate, 'save', 'Save'), id: 'legacy-backup-schedule' })] });
  rows.push({ cells: [tr(translate, 'backup-restore', 'Restore backup'), uiAction({
    action: path, label: tr(translate, 'backup-list', 'List backups'),
    fields: { legacyOperation: 'list-backups' },
  })] });
  const backups = requestFields.legacyBackupList;
  if (Array.isArray(backups)) {
    if (!backups.length) rows.push({ cells: [tr(translate, 'backup-list', 'Backups'),
      tr(translate, 'no-results', 'No results')] });
    else {
      rows.push(...backups.map(backup => ({ cells: [
        backup.orgId || tr(translate, 'backup-scope-instance', 'Whole instance'),
        `${backup.datetime || ''} - ${backup.storage || ''} - ${backup.path || ''}`,
      ] })));
      rows.push({ cells: [tr(translate, 'backup-restore', 'Restore backup'),
        uiFieldsetForm({ action: path, legend: tr(translate, 'backup-restore', 'Restore backup'),
          inputs: [
            { type: 'select', name: 'backupPath', label: tr(translate, 'backup-path', 'Backup path'),
              value: '', options: backups.map(backup => ({ value: backup.path,
                label: `${backup.datetime || ''} - ${backup.storage || ''} - ${backup.path || ''}` })) },
            { type: 'select', name: 'backupRestoreMode',
              label: tr(translate, 'backup-restore-mode', 'Restore mode'),
              value: 'add-missing', options: [
                { value: 'add-missing', label: tr(translate,
                  'backup-restore-add-missing', 'Add missing') },
                { value: 'replace-all', label: tr(translate,
                  'backup-restore-replace-all', 'Replace all') },
              ] },
            { type: 'checkbox', name: 'confirmed', value: 'true', checked: false,
              label: tr(translate, 'backup-restore-confirm', 'Confirm restore') },
          ], fields: { legacyOperation: 'restore-backup' },
          submitLabel: tr(translate, 'backup-restore', 'Restore backup'),
          id: 'legacy-backup-restore' })] });
    }
  }
  return {
    heading: `${tr(translate, 'admin-panel', 'Admin Panel')} / ${tr(translate,
      'attachments', 'Attachments')} / ${tr(translate, 'backup', 'Backup')}`,
    columns: [tr(translate, 'name', 'Name'), tr(translate, 'description', 'Description')],
    rows,
  };
}

async function attachmentSettingsForHtml4(userId) {
  return Meteor.server.method_handlers.getAttachmentStorageSettings.call({ userId });
}

function attachmentLimitInputs(settings, translate) {
  const normalized = normalizeLimitSettings(settings);
  const labels = {
    attachmentsUploadMaxBytes: tr(translate, 'attachment-upload-limit-label',
      'Attachment upload limit'),
    attachmentsDownloadMaxBytes: tr(translate, 'attachment-download-limit-label',
      'Attachment download limit'),
    apiUploadMaxBytes: tr(translate, 'api-upload-limit-label', 'API upload limit'),
    apiDownloadMaxBytes: tr(translate, 'api-download-limit-label', 'API download limit'),
  };
  const modeOptions = [
    { value: LIMIT_MODES.UNLIMITED,
      label: tr(translate, 'attachment-limit-mode-unlimited', 'Unlimited') },
    { value: LIMIT_MODES.MAX_SIZE,
      label: tr(translate, 'attachment-limit-mode-max-size', 'Maximum size') },
    { value: LIMIT_MODES.BLOCKED,
      label: tr(translate, 'attachment-limit-mode-blocked', 'Blocked') },
  ];
  const unitOptions = [
    { value: 'bytes', label: tr(translate, 'attachment-limit-unit-bytes', 'Bytes') },
    { value: 'mb', label: tr(translate, 'attachment-limit-unit-mb', 'MB') },
    { value: 'gb', label: tr(translate, 'attachment-limit-unit-gb', 'GB') },
  ];
  const inputs = [];
  for (const field of LIMIT_FIELDS) {
    const unit = pickUnitForBytes(normalized[field]);
    inputs.push({ type: 'select', name: `${field}Mode`,
      label: labels[field],
      value: pickModeForLimit(field, normalized), options: modeOptions });
    inputs.push({ type: 'text', name: `${field}Value`,
      label: `${labels[field]} - ${tr(translate, 'size', 'Size')}`,
      value: String(toDisplayValue(normalized[field], unit)), maxlength: 30 });
    inputs.push({ type: 'select', name: `${field}Unit`,
      label: `${labels[field]} (${tr(translate, 'size', 'Size')})`,
      value: unit, options: unitOptions });
  }
  inputs.push({ type: 'checkbox', name: 'avatarsUploadBlocked', value: 'true',
    checked: normalized.avatarsUploadBlocked,
    label: tr(translate, 'avatars-upload-blocked-description', 'Block avatar uploads') });
  return inputs;
}

async function adminAttachmentsCorePage(path, userId, requestFields, translate) {
  const match = path.match(/^\/admin\/attachments\/(default-save-storage|limits)$/);
  if (!match) return null;
  let settings;
  try {
    settings = await attachmentSettingsForHtml4(userId);
  } catch (error) {
    if (error?.error !== 'not-authorized') throw error;
    return {
      heading: tr(translate, 'admin-panel', 'Admin Panel'),
      columns: [tr(translate, 'attachments', 'Attachments'),
        tr(translate, 'status', 'Status')],
      rows: [{ cells: [tr(translate, match[1], match[1]),
        tr(translate, 'error-notAuthorized', 'Not authorized')] }],
    };
  }
  const rows = [{ rowHeader: false, cells: [
    tr(translate, 'attachments', 'Attachments'), adminAttachmentsNavigation(translate),
  ] }];
  if (requestFields.legacyAttachmentsResult) rows.push({ cells: [
    tr(translate, 'status', 'Status'), requestFields.legacyAttachmentsResult,
  ] });
  if (match[1] === 'default-save-storage') {
    rows.push({ cells: [tr(translate, 'default-save-storage-description',
      'Choose where new files are stored.'), uiSelectForm({
      action: path,
      label: tr(translate, 'default-save-storage', 'Default save storage'),
      name: 'storageName',
      value: settings.defaultStorage || 'fs',
      options: [
        ['fs', 'filesystem-storage', 'Filesystem storage'],
        ['gridfs', 'mongodb-gridfs-storage', 'MongoDB GridFS storage'],
        ['s3', 's3-minio-storage', 'S3 / MinIO storage'],
        ['azure', 'azure-blob-storage', 'Azure Blob storage'],
        ['gcs', 'gcs-storage', 'Google Cloud storage'],
      ].map(([value, key, fallback]) => ({ value, label: tr(translate, key, fallback) })),
      fields: { legacyOperation: 'set-default-attachment-storage' },
      submitLabel: tr(translate, 'save', 'Save'),
    })] });
  } else {
    rows.push({ cells: [tr(translate, 'attachment-transfer-limits-description',
      'Set upload and download limits.'), uiFieldsetForm({
      action: path,
      legend: tr(translate, 'attachment-transfer-limits-title', 'Transfer limits'),
      inputs: attachmentLimitInputs(settings, translate),
      fields: { legacyOperation: 'save-attachment-transfer-limits' },
      submitLabel: tr(translate, 'save', 'Save'),
      id: 'legacy-attachment-limits',
    })] });
  }
  const titleKey = match[1] === 'limits' ? 'attachment-limits' : 'default-save-storage';
  return {
    heading: `${tr(translate, 'admin-panel', 'Admin Panel')} / ${tr(translate,
      'attachments', 'Attachments')} / ${tr(translate, titleKey, match[1])}`,
    columns: [tr(translate, 'name', 'Name'),
      tr(translate, 'description', 'Description')],
    rows,
  };
}

async function adminAttachmentsMovePage(path, userId, requestFields, translate) {
  if (path !== '/admin/attachments/move') return null;
  try {
    await attachmentSettingsForHtml4(userId);
  } catch (error) {
    if (error?.error !== 'not-authorized') throw error;
    return {
      heading: tr(translate, 'admin-panel', 'Admin Panel'),
      columns: [tr(translate, 'attachments', 'Attachments'),
        tr(translate, 'status', 'Status')],
      rows: [{ cells: [tr(translate, 'attachment-move', 'Move attachment'),
        tr(translate, 'error-notAuthorized', 'Not authorized')] }],
    };
  }
  const status = await AttachmentBulkMoveStatus.findOneAsync('bulk', {
    fields: { running: 1, paused: 1, total: 1, done: 1, current: 1, name: 1,
      size: 1, source: 1, dest: 1, scope: 1, interrupted: 1, lastMove: 1,
      lastRepair: 1, updatedAt: 1 },
  });
  const storageOptions = [
    ['collectionfs', 'move-storage-collectionfs', 'CollectionFS'],
    ['gridfs', 'move-storage-gridfs', 'GridFS'],
    ['fs', 'move-storage-fs', 'Filesystem'],
    ['s3', 'move-storage-s3', 'S3 / MinIO'],
    ['azure', 'move-storage-azure', 'Azure'],
    ['gcs', 'move-storage-gcs', 'Google Cloud'],
  ];
  const rows = [
    { rowHeader: false, cells: [tr(translate, 'attachments', 'Attachments'),
      adminAttachmentsNavigation(translate)] },
  ];
  if (requestFields.legacyAttachmentsResult) rows.push({ cells: [
    tr(translate, 'status', 'Status'), requestFields.legacyAttachmentsResult,
  ] });
  rows.push({ cells: [tr(translate, 'attachment-move', 'Move attachment'),
    uiFieldsetForm({
      action: path,
      legend: tr(translate, 'attachment-move', 'Move attachment'),
      inputs: [
        { type: 'select', name: 'moveScope', label: tr(translate, 'move-scope', 'Scope'),
          value: 'attachments', options: [
            { value: 'attachments', label: tr(translate, 'attachments', 'Attachments') },
            { value: 'avatars', label: tr(translate, 'move-scope-avatars', 'Avatars') },
            { value: 'both', label: tr(translate, 'move-scope-both', 'Both') },
          ] },
        { type: 'select', name: 'moveSource', label: tr(translate, 'move-source', 'Source'),
          value: 'all', options: [
            { value: 'all', label: tr(translate, 'move-storage-all', 'All') },
            ...storageOptions.map(([value, key, fallback]) => ({
              value, label: tr(translate, key, fallback),
            })),
          ] },
        { type: 'select', name: 'moveDestination',
          label: tr(translate, 'move-destination', 'Destination'), value: 'fs',
          options: storageOptions.map(([value, key, fallback]) => ({
            value, label: tr(translate, key, fallback),
          })) },
      ],
      fields: { legacyOperation: 'start-attachment-move' },
      submitLabel: tr(translate, 'move-all-attachments', 'Move all attachments'),
      id: 'legacy-attachment-move',
    })] });
  rows.push({ cells: [tr(translate, 'attachment-repair-locations',
    'Repair file locations'), uiAction({ action: path,
    label: tr(translate, 'attachment-repair-locations', 'Repair file locations'),
    fields: { legacyOperation: 'repair-attachment-locations' },
  })] });
  if (status) {
    const summary = status.running
      ? `${status.current || status.done || 0} / ${status.total || 0} - ${status.name || ''}`
      : status.lastMove
        ? `${status.lastMove.source || ''} > ${status.lastMove.dest || ''} (${status.lastMove.scope || ''})`
        : status.interrupted ? 'Interrupted' : '';
    rows.push({ cells: [tr(translate, 'status', 'Status'), summary] });
    if (status.running) rows.push({ cells: [tr(translate, 'actions', 'Actions'), [
      uiAction({ action: path,
        label: tr(translate, status.paused ? 'move-progress-resume' : 'move-progress-pause',
          status.paused ? 'Resume' : 'Pause'),
        fields: { legacyOperation: status.paused
          ? 'resume-attachment-move' : 'pause-attachment-move' } }),
      uiAction({ action: path, label: tr(translate, 'move-progress-cancel', 'Cancel'),
        icon: 'remove', fields: { legacyOperation: 'cancel-attachment-move' } }),
    ]] });
  }
  return {
    heading: `${tr(translate, 'admin-panel', 'Admin Panel')} / ${tr(translate,
      'attachments', 'Attachments')} / ${tr(translate, 'attachment-move', 'Move attachment')}`,
    columns: [tr(translate, 'name', 'Name'), tr(translate, 'description', 'Description')],
    rows,
  };
}

async function adminAttachmentsLocalStoragePage(path, userId, requestFields, translate) {
  const match = path.match(/^\/admin\/attachments\/(filesystem|gridfs)$/);
  if (!match) return null;
  let settings;
  let paths;
  try {
    [settings, paths] = await Promise.all([
      attachmentSettingsForHtml4(userId),
      Meteor.server.method_handlers.getAttachmentStoragePaths.call({ userId }),
    ]);
  } catch (error) {
    if (error?.error !== 'not-authorized') throw error;
    return {
      heading: tr(translate, 'admin-panel', 'Admin Panel'),
      columns: [tr(translate, 'attachments', 'Attachments'),
        tr(translate, 'status', 'Status')],
      rows: [{ cells: [tr(translate, match[1] === 'filesystem'
        ? 'filesystem-storage' : 'mongodb-gridfs-storage', match[1]),
      tr(translate, 'error-notAuthorized', 'Not authorized')] }],
    };
  }
  const storage = match[1];
  const titleKey = storage === 'filesystem' ? 'filesystem-storage' : 'mongodb-gridfs-storage';
  const readEnabled = settings.storageConfig?.[storage]?.read !== false;
  const rows = [
    { rowHeader: false, cells: [tr(translate, 'attachments', 'Attachments'),
      adminAttachmentsNavigation(translate)] },
    { cells: [tr(translate, 'storage-read', 'Read'), uiAction({
      action: path,
      label: tr(translate, readEnabled ? 'disable' : 'enable',
        readEnabled ? 'Disable' : 'Enable'),
      icon: readEnabled ? 'select-on' : 'select-off',
      fields: { legacyOperation: 'set-local-storage-read', enabled: String(!readEnabled) },
    })] },
    { cells: [tr(translate, 'calculate-file-counts', 'Calculate file counts'), uiAction({
      action: path, label: tr(translate, 'calculate-file-counts', 'Calculate file counts'),
      fields: { legacyOperation: 'calculate-local-storage-stats' },
    })] },
  ];
  if (requestFields.legacyAttachmentsResult) rows.push({ cells: [
    tr(translate, 'status', 'Status'), requestFields.legacyAttachmentsResult,
  ] });
  const stats = requestFields.legacyAttachmentStorageStats;
  if (stats) {
    rows.push({ cells: [tr(translate, 'attachments', 'Attachments'), storage === 'gridfs'
      ? `${stats.attachments?.collectionFs || 0} CollectionFS / ${stats.attachments?.mongoFiles || 0} MongoDB`
      : String(stats.attachments || 0)] });
    rows.push({ cells: [tr(translate, 'avatars', 'Avatars'), storage === 'gridfs'
      ? `${stats.avatars?.collectionFs || 0} CollectionFS / ${stats.avatars?.mongoFiles || 0} MongoDB`
      : String(stats.avatars || 0)] });
  }
  if (storage === 'filesystem') {
    rows.push({ cells: [tr(translate, 'writable-path', 'Writable path'), paths.writablePath || ''] });
    rows.push({ cells: [tr(translate, 'attachments-path', 'Attachments path'),
      paths.attachments || ''] });
    rows.push({ cells: [tr(translate, 'avatars-path', 'Avatars path'), paths.avatars || ''] });
  } else {
    rows.push({ cells: [tr(translate, 'mongodb-compact', 'Compact MongoDB'), uiAction({
      action: path, label: tr(translate, 'mongodb-compact-run', 'Run compact'),
      fields: { legacyOperation: 'compact-gridfs' },
    })] });
    if (requestFields.legacyCompactResult) {
      const lines = [];
      for (const [node, nodeResult] of Object.entries(requestFields.legacyCompactResult)) {
        if (nodeResult && typeof nodeResult === 'object') {
          for (const [collection, state] of Object.entries(nodeResult)) {
            lines.push(`${node}: ${collection}: ${String(state)}`);
          }
        } else lines.push(`${node}: ${String(nodeResult)}`);
      }
      rows.push({ cells: [tr(translate, 'mongodb-compact-success', 'Compact completed'), lines] });
    }
  }
  return {
    heading: `${tr(translate, 'admin-panel', 'Admin Panel')} / ${tr(translate,
      'attachments', 'Attachments')} / ${tr(translate, titleKey, storage)}`,
    columns: [tr(translate, 'name', 'Name'), tr(translate, 'description', 'Description')],
    rows,
  };
}

const CLOUD_FIELD_LABELS = Object.freeze({
  s3: {
    enabled: ['storage-enabled', 'Enabled'], read: ['storage-read', 'Read'],
    endpoint: ['s3-endpoint', 'Endpoint', 's3-endpoint-description'],
    region: ['s3-region', 'Region', 's3-region-description'],
    bucket: ['s3-bucket', 'Bucket', 's3-bucket-description'],
    accessKeyId: ['s3-access-key', 'Access key ID', 's3-access-key-description'],
    secretAccessKey: ['s3-secret-key', 'Secret access key', 'cloud-secret-keep-blank'],
    forcePathStyle: ['s3-force-path-style', 'Force path style',
      's3-force-path-style-description'],
  },
  azure: {
    enabled: ['storage-enabled', 'Enabled'], read: ['storage-read', 'Read'],
    accountName: ['azure-account-name', 'Storage account name',
      'azure-account-name-description'],
    accountKey: ['azure-account-key', 'Storage account key', 'cloud-secret-keep-blank'],
    connectionString: ['azure-connection-string', 'Connection string',
      'azure-connection-string-description'],
    bucket: ['azure-container', 'Container name', 'azure-container-description'],
  },
  gcs: {
    enabled: ['storage-enabled', 'Enabled'], read: ['storage-read', 'Read'],
    projectId: ['gcs-project-id', 'Project ID', 'gcs-project-id-description'],
    bucket: ['gcs-bucket', 'Bucket', 'gcs-bucket-description'],
    keyFilename: ['gcs-key-filename', 'Service account key file path',
      'gcs-key-filename-description'],
    credentials: ['gcs-credentials', 'Service account key JSON',
      'gcs-credentials-description'],
  },
});

async function adminAttachmentsCloudPage(path, userId, requestFields, translate) {
  const match = path.match(/^\/admin\/attachments\/(s3|azure|gcs)$/);
  if (!match) return null;
  const provider = match[1];
  let settings;
  try {
    settings = await attachmentSettingsForHtml4(userId);
  } catch (error) {
    if (error?.error !== 'not-authorized') throw error;
    return {
      heading: tr(translate, 'admin-panel', 'Admin Panel'),
      columns: [tr(translate, 'attachments', 'Attachments'),
        tr(translate, 'status', 'Status')],
      rows: [{ cells: [provider, tr(translate, 'error-notAuthorized', 'Not authorized')] }],
    };
  }
  const title = provider === 's3'
    ? tr(translate, 's3-minio-storage', 'S3 / MinIO storage')
    : provider === 'azure'
      ? tr(translate, 'azure-blob-storage', 'Azure Blob storage')
      : tr(translate, 'gcs-storage', 'Google Cloud storage');
  const config = settings.storageConfig?.[provider] || {};
  const inputs = Object.entries(CLOUD_CONFIG_FIELDS[provider])
    .filter(([, definition]) => !definition.hidden)
    .map(([field, definition]) => {
    const [key, fallback, descriptionKey] = CLOUD_FIELD_LABELS[provider][field];
    if (definition.type === 'boolean') return {
      type: 'checkbox', name: field, value: 'true', checked: config[field] === true,
      label: tr(translate, key, fallback),
    };
    return {
      type: definition.type, name: field,
      value: definition.secret ? '' : String(config[field] || ''),
      label: `${tr(translate, key, fallback)}${definition.secret && config[`${field}Set`]
        ? ` (${tr(translate, 'cloud-secret-set', 'secret is set')})` : ''}`,
      description: descriptionKey ? tr(translate, descriptionKey, '') : '',
      maxlength: definition.max,
      rows: definition.type === 'textarea' ? 8 : undefined,
      autocomplete: definition.type === 'password' ? 'new-password' : undefined,
    };
    });
  const rows = [
    { rowHeader: false, cells: [tr(translate, 'attachments', 'Attachments'),
      adminAttachmentsNavigation(translate)] },
    ...(provider === 's3' ? [{ cells: [title,
      tr(translate, 's3-minio-storage-description', '')] }]
      : provider === 'gcs' ? [{ cells: [title, tr(translate, 'gcs-permissions-note', '')] }]
        : []),
    { cells: [title, uiFieldsetForm({ action: path, legend: title, inputs,
      submitActions: [
        { value: 'test-cloud-storage',
          label: tr(translate, 'test-cloud-connection', 'Test cloud connection') },
        { value: 'save-cloud-storage', label: tr(translate, 'save', 'Save') },
      ], id: `legacy-${provider}-storage`,
    })] },
    { cells: [tr(translate, 'calculate-file-counts', 'Calculate file counts'), uiAction({
      action: path, label: tr(translate, 'calculate-file-counts', 'Calculate file counts'),
      fields: { legacyOperation: 'calculate-cloud-storage-stats' },
    })] },
  ];
  if (requestFields.legacyAttachmentsResult) rows.push({ cells: [
    tr(translate, 'status', 'Status'), requestFields.legacyAttachmentsResult,
  ] });
  if (requestFields.legacyCloudTestResult) rows.push({ cells: [
    tr(translate, 'test-cloud-connection', 'Test cloud connection'),
    requestFields.legacyCloudTestResult.ok
      ? tr(translate, 'cloud-connection-success', 'Connection succeeded')
      : `${tr(translate, 'cloud-connection-failed', 'Connection failed')}: ${String(
        requestFields.legacyCloudTestResult.error || '')}`,
  ] });
  if (requestFields.legacyAttachmentStorageStats) {
    rows.push({ cells: [tr(translate, 'attachments', 'Attachments'),
      String(requestFields.legacyAttachmentStorageStats.attachments || 0)] });
    rows.push({ cells: [tr(translate, 'avatars', 'Avatars'),
      String(requestFields.legacyAttachmentStorageStats.avatars || 0)] });
  }
  return {
    heading: `${tr(translate, 'admin-panel', 'Admin Panel')} / ${tr(translate,
      'attachments', 'Attachments')} / ${title}`,
    columns: [tr(translate, 'name', 'Name'), tr(translate, 'description', 'Description')],
    rows,
  };
}

async function adminAttachmentsDatabaseMigrationPage(path, userId, requestFields, translate) {
  if (path !== '/admin/attachments/database-migration') return null;
  let status;
  try {
    await attachmentSettingsForHtml4(userId);
    status = await textDatabaseMigrationStatusForAdmin(userId);
  } catch (error) {
    if (error?.error !== 'not-authorized') throw error;
    return {
      heading: tr(translate, 'admin-panel', 'Admin Panel'),
      columns: [tr(translate, 'attachments', 'Attachments'),
        tr(translate, 'status', 'Status')],
      rows: [{ cells: [tr(translate, 'database-migration', 'Database migration'),
        tr(translate, 'error-notAuthorized', 'Not authorized')] }],
    };
  }
  const rows = [
    { rowHeader: false, cells: [tr(translate, 'attachments', 'Attachments'),
      adminAttachmentsNavigation(translate)] },
    { cells: [tr(translate, 'database-migration-description', 'Migrate text data'), [
      uiAction({ action: path,
        label: tr(translate, 'database-migrate-to-ferretdb', 'Migrate to FerretDB'),
        fields: { legacyOperation: 'start-database-migration', direction: 'toFerretDB' } }),
      uiAction({ action: path,
        label: tr(translate, 'database-migrate-to-mongodb', 'Migrate to MongoDB'),
        fields: { legacyOperation: 'start-database-migration', direction: 'toMongoDB' } }),
    ]] },
  ];
  if (requestFields.legacyAttachmentsResult) rows.push({ cells: [
    tr(translate, 'status', 'Status'), requestFields.legacyAttachmentsResult,
  ] });
  if (status) {
    rows.push({ cells: [tr(translate, 'database-migration-phase', 'Phase'),
      String(status.phase || 'idle')] });
    rows.push({ cells: [tr(translate, 'database-migration', 'Database migration'),
      `${status.collection || ''} ${status.collDone || 0}/${status.collTotal || 0}; ${status.collectionsDone || 0}/${status.collectionsTotal || 0}`] });
    if (status.error) rows.push({ cells: [tr(translate, 'server-error', 'Server error'),
      String(status.error).slice(0, 500)] });
  }
  return {
    heading: `${tr(translate, 'admin-panel', 'Admin Panel')} / ${tr(translate,
      'attachments', 'Attachments')} / ${tr(translate, 'database-migration',
      'Database migration')}`,
    columns: [tr(translate, 'name', 'Name'), tr(translate, 'description', 'Description')],
    rows,
  };
}

async function adminAttachmentsBaselinePage(path, userId, translate) {
  const match = path.match(/^\/admin\/attachments\/(backup|move|default-save-storage|limits|gridfs|filesystem|s3|azure|gcs|database-migration)$/);
  if (!match) return null;
  const actor = userId && await Meteor.users.findOneAsync(userId, {
    fields: { isAdmin: 1, orgs: 1 },
  });
  const isOrgAdmin = Array.isArray(actor?.orgs)
    && actor.orgs.some(membership => membership?.isAdmin === true);
  if (!actor?.isAdmin && !(match[1] === 'backup' && isOrgAdmin)) {
    return {
      heading: tr(translate, 'admin-panel', 'Admin Panel'),
      columns: [tr(translate, 'attachments', 'Attachments'),
        tr(translate, 'status', 'Status')],
      rows: [{ cells: [match[1], tr(translate, 'error-notAuthorized', 'Not authorized')] }],
    };
  }
  const pane = ADMIN_ATTACHMENT_PANES.find(([slug]) => slug === match[1]);
  return {
    heading: `${tr(translate, 'admin-panel', 'Admin Panel')} / ${tr(translate,
      'attachments', 'Attachments')} / ${tr(translate, pane[1], pane[2])}`,
    columns: [tr(translate, 'attachments', 'Attachments'),
      tr(translate, 'status', 'Status')],
    rows: [
      { rowHeader: false, cells: [tr(translate, 'attachments', 'Attachments'),
        adminAttachmentsNavigation(translate)] },
      { cells: [tr(translate, pane[1], pane[2]),
        'This pane has a Legacy HTML4 baseline. Its controls are being completed route by route.'] },
    ],
  };
}

function statisticsDuration(seconds, translate) {
  let remaining = Math.max(0, Number(seconds) || 0);
  const parts = [];
  for (const [unit, divisor] of [
    ['days', 86400], ['hours', 3600], ['minutes', 60], ['seconds', 1],
  ]) {
    const value = Math.floor(remaining / divisor);
    remaining %= divisor;
    if (value > 0 || (unit === 'seconds' && !parts.length)) {
      parts.push(`${value} ${tr(translate, unit, unit)}`);
    }
  }
  return parts.join(', ');
}

function statisticsSize(value) {
  return typeof value === 'number' ? filesize(value) : '';
}

async function adminSettingsVersionPage(path, userId, requestFields, translate) {
  if (path !== '/admin/settings/version') return null;
  const statistics = await statisticsForAdmin(userId);
  if (!statistics) return {
    heading: tr(translate, 'admin-panel', 'Admin Panel'),
    columns: [tr(translate, 'settings', 'Settings'), tr(translate, 'status', 'Status')],
    rows: [{ cells: [tr(translate, 'info', 'Info'),
      tr(translate, 'error-notAuthorized', 'Not authorized')] }],
  };

  const rows = [{ rowHeader: false, cells: [adminSettingsNavigation(translate), ''] }];
  rows.push({ rowHeader: false, cells: [uiAction({
    action: path,
    label: tr(translate, 'check-version', 'Check Version'),
    fields: { legacyOperation: 'check-newest-versions' },
  }), requestFields.legacyVersionResult || ''] });
  const category = key => rows.push({ rowHeader: false, colspanLast: 2,
    cells: [tr(translate, key, key)] });
  const field = (key, value, fallback) => rows.push({
    cells: [tr(translate, key, fallback || key), value ?? ''],
  });

  category('Platform');
  field('info', statistics.version, 'WeKan version');
  field('package', statistics.platform?.packaging, 'Package');
  category('OS');
  field('OS_Type', statistics.os?.type);
  field('OS_Platform', statistics.os?.platform);
  field('OS_Arch', statistics.os?.arch);
  field('OS_Release', statistics.os?.release);
  field('OS_Uptime', statisticsDuration(statistics.os?.uptime, translate));
  field('OS_Loadavg', (statistics.os?.loadavg || []).map(value =>
    Number(value).toFixed(2)).join(', '));
  field('OS_Totalmem', statisticsSize(statistics.os?.totalmem));
  field('OS_Freemem', statisticsSize(statistics.os?.freemem));
  field('OS_Cpus', statistics.os?.cpus?.length ?? 0);
  category('Meteor');
  field('Meteor_version', statistics.meteor?.meteorVersion);
  field('Reactivity_mode', statistics.mongo?.reactivity);
  field('Reactivity_order', statistics.mongo?.reactivityOrder);
  field('DDP_transport', statistics.mongo?.ddpTransport);
  category('Database');
  field('Database_type', statistics.mongo?.databaseType);
  field('MongoDB_version', statistics.mongo?.mongoVersion);
  field('Database_commit', statistics.mongo?.databaseCommit);
  if (statistics.mongo?.ferretdbVersion) {
    field('FerretDB_version', statistics.mongo.ferretdbVersion);
    field('FerretDB_commit', statistics.mongo.ferretdbCommit);
  }
  field('MongoDB_storage_engine', statistics.mongo?.mongoStorageEngine);
  field('MongoDB_Oplog_enabled', statistics.mongo?.mongoOplogEnabled
    ? tr(translate, 'yes', 'Yes') : tr(translate, 'no', 'No'));
  if (statistics.session?.sessionsCount !== undefined) {
    field('Mongo_sessions_count', statistics.session.sessionsCount);
  }
  category('Node');
  field('Node_version', statistics.process?.nodeVersion);
  const heapFields = [
    ['Node_heap_total_heap_size', 'totalHeapSize'],
    ['Node_heap_total_heap_size_executable', 'totalHeapSizeExecutable'],
    ['Node_heap_total_physical_size', 'totalPhysicalSize'],
    ['Node_heap_total_available_size', 'totalAvailableSize'],
    ['Node_heap_used_heap_size', 'usedHeapSize'],
    ['Node_heap_heap_size_limit', 'heapSizeLimit'],
    ['Node_heap_malloced_memory', 'mallocedMemory'],
    ['Node_heap_peak_malloced_memory', 'peakMallocedMemory'],
  ];
  for (const [label, key] of heapFields) {
    if (statistics.nodeHeapStats?.[key] !== undefined) {
      field(label, statisticsSize(statistics.nodeHeapStats[key]));
    }
  }
  for (const [label, key] of [
    ['Node_heap_does_zap_garbage', 'doesZapGarbage'],
    ['Node_heap_number_of_native_contexts', 'numberOfNativeContexts'],
    ['Node_heap_number_of_detached_contexts', 'numberOfDetachedContexts'],
  ]) {
    if (statistics.nodeHeapStats?.[key] !== undefined) field(label, statistics.nodeHeapStats[key]);
  }
  for (const [label, key] of [
    ['Node_memory_usage_rss', 'rss'], ['Node_memory_usage_heap_total', 'heapTotal'],
    ['Node_memory_usage_heap_used', 'heapUsed'], ['Node_memory_usage_external', 'external'],
  ]) {
    if (statistics.nodeMemoryUsage?.[key] !== undefined) {
      field(label, statisticsSize(statistics.nodeMemoryUsage[key]));
    }
  }
  return {
    heading: `${tr(translate, 'admin-panel', 'Admin Panel')} / ${tr(translate, 'settings', 'Settings')} / ${tr(translate, 'info', 'Info')}`,
    columns: [tr(translate, 'name', 'Name'), tr(translate, 'description', 'Description')],
    rows,
  };
}

async function adminSettingsAnnouncementPage(path, userId, requestFields, translate) {
  if (path !== '/admin/settings/announcement') return null;
  let announcement;
  try {
    announcement = await announcementForAdmin(userId);
  } catch (_) {
    return {
      heading: tr(translate, 'admin-panel', 'Admin Panel'),
      columns: [tr(translate, 'settings', 'Settings'), tr(translate, 'status', 'Status')],
      rows: [{ cells: [tr(translate, 'admin-announcement', 'Announcement'),
        tr(translate, 'error-notAuthorized', 'Not authorized')] }],
    };
  }
  const rows = [
    { rowHeader: false, cells: [adminSettingsNavigation(translate), ''] },
    { cells: [tr(translate, 'admin-announcement-active',
      'Active System-Wide Announcement'), uiSelectForm({
      action: path,
      label: tr(translate, 'admin-announcement-active',
        'Active System-Wide Announcement'),
      name: 'enabled',
      value: String(announcement.enabled),
      options: [
        { value: 'true', label: tr(translate, 'yes', 'Yes') },
        { value: 'false', label: tr(translate, 'no', 'No') },
      ],
      fields: { legacyOperation: 'set-announcement-enabled' },
      submitLabel: tr(translate, 'save', 'Save'),
    })] },
    { cells: [tr(translate, 'admin-announcement-title',
      'Announcement from Administrator'), uiTextareaForm({
      action: path,
      label: tr(translate, 'admin-announcement-title',
        'Announcement from Administrator'),
      name: 'announcementBody',
      value: announcement.body,
      maxlength: 10000,
      fields: { legacyOperation: 'set-announcement-body' },
      submitLabel: tr(translate, 'save', 'Save'),
    })] },
  ];
  if (requestFields.legacyAnnouncementResult) rows.push({
    cells: [tr(translate, 'status', 'Status'), requestFields.legacyAnnouncementResult],
  });
  return {
    heading: `${tr(translate, 'admin-panel', 'Admin Panel')} / ${tr(translate, 'settings', 'Settings')} / ${tr(translate, 'admin-announcement', 'Announcement')}`,
    columns: [tr(translate, 'name', 'Name'), tr(translate, 'description', 'Description')],
    rows,
  };
}

async function adminSettingsAccessibilityPage(path, userId, requestFields, translate) {
  if (path !== '/admin/settings/accessibility') return null;
  let setting;
  try {
    setting = await accessibilityForAdmin(userId);
  } catch (_) {
    return {
      heading: tr(translate, 'admin-panel', 'Admin Panel'),
      columns: [tr(translate, 'settings', 'Settings'), tr(translate, 'status', 'Status')],
      rows: [{ cells: [tr(translate, 'accessibility', 'Accessibility'),
        tr(translate, 'error-notAuthorized', 'Not authorized')] }],
    };
  }
  const rows = [
    { rowHeader: false, cells: [adminSettingsNavigation(translate), ''] },
    { cells: [tr(translate, 'accessibility', 'Accessibility'), uiLink({
      href: '/accessibility', label: tr(translate, 'accessibility', 'Accessibility'),
    })] },
    { cells: [tr(translate, 'accessibility-page-enabled',
      'Accessibility page enabled'), uiSelectForm({
      action: path,
      label: tr(translate, 'accessibility-page-enabled',
        'Accessibility page enabled'),
      name: 'enabled',
      value: String(setting.enabled),
      options: [
        { value: 'true', label: tr(translate, 'yes', 'Yes') },
        { value: 'false', label: tr(translate, 'no', 'No') },
      ],
      fields: { legacyOperation: 'set-accessibility-enabled' },
      submitLabel: tr(translate, 'save', 'Save'),
    })] },
    { cells: [tr(translate, 'accessibility-content', 'Accessibility content'),
      uiTextareaGroupForm({
        action: path,
        legend: tr(translate, 'accessibility-content', 'Accessibility content'),
        textareas: [
          { label: tr(translate, 'accessibility-title', 'Accessibility title'),
            name: 'accessibilityTitle', value: setting.title, maxlength: 500, rows: 4 },
          { label: tr(translate, 'accessibility-content', 'Accessibility content'),
            name: 'accessibilityBody', value: setting.body, maxlength: 10000, rows: 20 },
        ],
        fields: { legacyOperation: 'set-accessibility-content' },
        submitLabel: tr(translate, 'save', 'Save'),
      })] },
  ];
  if (requestFields.legacyAccessibilityResult) rows.push({
    cells: [tr(translate, 'status', 'Status'), requestFields.legacyAccessibilityResult],
  });
  return {
    heading: `${tr(translate, 'admin-panel', 'Admin Panel')} / ${tr(translate, 'settings', 'Settings')} / ${tr(translate, 'accessibility', 'Accessibility')}`,
    columns: [tr(translate, 'name', 'Name'), tr(translate, 'description', 'Description')],
    rows,
  };
}

async function adminSettingsPwaPage(path, userId, requestFields, translate) {
  if (path !== '/admin/settings/pwa') return null;
  let setting;
  try { setting = await pwaSettingsForAdmin(userId); } catch (_) {
    return {
      heading: tr(translate, 'admin-panel', 'Admin Panel'),
      columns: [tr(translate, 'settings', 'Settings'), tr(translate, 'status', 'Status')],
      rows: [{ cells: ['PWA', tr(translate, 'error-notAuthorized', 'Not authorized')] }],
    };
  }
  const rows = [{ rowHeader: false, cells: [adminSettingsNavigation(translate), ''] }];
  const toggle = (field, labelKey, operation) => rows.push({
    cells: [tr(translate, labelKey, labelKey), uiSelectForm({
      action: path, label: tr(translate, labelKey, labelKey), name: 'enabled',
      value: String(setting[field]), options: [
        { value: 'true', label: tr(translate, 'yes', 'Yes') },
        { value: 'false', label: tr(translate, 'no', 'No') },
      ], fields: { legacyOperation: operation, settingField: field },
      submitLabel: tr(translate, 'save', 'Save'),
    })],
  });
  toggle('customHeadEnabled', 'custom-head-tags-enabled', 'set-pwa-toggle');
  toggle('customManifestEnabled', 'custom-manifest-enabled', 'set-pwa-toggle');
  rows.push({ cells: [tr(translate, 'custom-head-meta-tags', 'Custom meta tags'),
    uiTextareaGroupForm({
      action: path, legend: tr(translate, 'custom-head-tags-enabled', 'Custom head tags'),
      textareas: [
        { label: tr(translate, 'custom-head-meta-tags', 'Custom meta tags'),
          name: 'customHeadMetaTags', value: setting.customHeadMetaTags, maxlength: 20000 },
        { label: tr(translate, 'custom-head-link-tags', 'Custom link tags'),
          name: 'customHeadLinkTags', value: setting.customHeadLinkTags, maxlength: 20000 },
        { label: tr(translate, 'custom-head-manifest-content', 'Manifest content'),
          name: 'customManifestContent', value: setting.customManifestContent,
          maxlength: 100000, rows: 20 },
      ], fields: { legacyOperation: 'set-pwa-head-content' },
      submitLabel: tr(translate, 'save', 'Save'),
    })] });
  toggle('customAssetLinksEnabled', 'custom-assetlinks-enabled', 'set-pwa-toggle');
  rows.push({ cells: [tr(translate, 'custom-assetlinks-content', 'Asset links content'),
    uiTextareaForm({
      action: path, label: tr(translate, 'custom-assetlinks-content',
        'Asset links content'), name: 'customAssetLinksContent',
      value: setting.customAssetLinksContent,
      fields: { legacyOperation: 'set-pwa-assetlinks' },
      submitLabel: tr(translate, 'save', 'Save'),
    })] });
  if (requestFields.legacyPwaResult) rows.push({
    cells: [tr(translate, 'status', 'Status'), requestFields.legacyPwaResult],
  });
  return {
    heading: `${tr(translate, 'admin-panel', 'Admin Panel')} / ${tr(translate, 'settings', 'Settings')} / PWA`,
    columns: [tr(translate, 'name', 'Name'), tr(translate, 'description', 'Description')],
    rows,
  };
}

async function adminSettingsGlobalWebhooksPage(path, userId, requestFields, translate) {
  if (path !== '/admin/settings/global-webhooks') return null;
  let webhooks;
  try { webhooks = await globalWebhooksForAdmin(userId); } catch (_) {
    return { heading: tr(translate, 'admin-panel', 'Admin Panel'),
      columns: [tr(translate, 'settings', 'Settings'), tr(translate, 'status', 'Status')],
      rows: [{ cells: [tr(translate, 'global-webhook', 'Global Webhooks'),
        tr(translate, 'error-notAuthorized', 'Not authorized')] }] };
  }
  const types = Integrations.Const.WEBHOOK_TYPES.map(value => ({
    value, label: tr(translate, value, value),
  }));
  const form = webhook => uiFieldsetForm({
    action: path,
    legend: webhook ? (webhook.title || webhook.url) : tr(translate, 'create', 'Create'),
    id: webhook?._id || 'new-global-webhook',
    inputs: [
      { name: 'title', label: tr(translate, 'webhook-title', 'Webhook Name'),
        value: webhook?.title || '', maxlength: 200 },
      { name: 'url', label: tr(translate, 'settings-group-url', 'URL'),
        value: webhook?.url || '', maxlength: 4096 },
      { name: 'token', label: tr(translate, 'webhook-token', 'Token (Optional for Authentication)'),
        value: '', maxlength: 4096 },
      { name: 'type', type: 'select', label: tr(translate, 'type', 'Type'),
        value: webhook?.type || Integrations.Const.ONEWAY, options: types },
      { name: 'enabled', type: 'checkbox', label: tr(translate, 'active', 'Active'),
        value: 'true', checked: !webhook || webhook.enabled !== false },
    ],
    fields: { legacyOperation: 'save-global-webhook', webhookId: webhook?._id || '' },
    submitLabel: tr(translate, webhook ? 'save' : 'create', webhook ? 'Save' : 'Create'),
  });
  const rows = [{ rowHeader: false, cells: [adminSettingsNavigation(translate), ''] },
    ...webhooks.map(webhook => ({ cells: [webhook.title || webhook.url, form(webhook)] })),
    { cells: [tr(translate, 'create', 'Create'), form(null)] }];
  if (requestFields.legacyGlobalWebhookResult) rows.push({
    cells: [tr(translate, 'status', 'Status'), requestFields.legacyGlobalWebhookResult],
  });
  return { heading: `${tr(translate, 'admin-panel', 'Admin Panel')} / ${tr(translate, 'settings', 'Settings')} / ${tr(translate, 'global-webhook', 'Global Webhooks')}`,
    columns: [tr(translate, 'name', 'Name'), tr(translate, 'description', 'Description')], rows };
}

async function adminSettingsVisibilityPage(path, userId, requestFields, translate) {
  if (path !== '/admin/settings/visibility') return null;
  let setting = null;
  let theme = null;
  try { setting = await visibilitySettingsForAdmin(userId); } catch (_) { /* tenant admin */ }
  try { theme = await adminThemeForUser(userId, requestFields.requestHeaders || {}); } catch (_) {}
  if (!setting && !theme) return { heading: tr(translate, 'admin-panel', 'Admin Panel'),
    columns: [tr(translate, 'settings', 'Settings'), tr(translate, 'status', 'Status')],
    rows: [{ cells: [tr(translate, 'visibility', 'Visibility'),
      tr(translate, 'error-notAuthorized', 'Not authorized')] }] };
  const rows = [{ rowHeader: false, cells: [adminSettingsNavigation(translate), ''] }];
  const save = tr(translate, 'save', 'Save');
  if (setting) {
    rows.push({ rowHeader: false, colspanLast: 2,
      cells: [tr(translate, 'all-boards-hide', 'All Boards: Hide')] });
    rows.push({ cells: [tr(translate, 'all-boards', 'All Boards'), uiFieldsetForm({
      action: path, legend: tr(translate, 'all-boards-hide', 'All Boards: Hide'), id: 'visibility-allboards',
      inputs: [
        { name: 'allowPrivateOnly', type: 'checkbox', value: 'true', checked: setting.allowPrivateOnly,
          label: tr(translate, 'public-boards', 'Public boards') },
        { name: 'hideBoardActivitiesOnAllBoards', type: 'checkbox', value: 'true',
          checked: setting.hideBoardActivitiesOnAllBoards === true,
          label: tr(translate, 'board-activities', 'Board activities') },
        { name: 'hideCardCounterList', type: 'checkbox', value: 'true',
          checked: setting.hideCardCounterList === true,
          label: tr(translate, 'card-counter-list', 'Card counter list') },
        { name: 'hideBoardMemberList', type: 'checkbox', value: 'true',
          checked: setting.hideBoardMemberList === true,
          label: tr(translate, 'board-member-list', 'Board member list') },
        { name: 'spinnerName', type: 'select', value: setting.spinnerName || ALLOWED_WAIT_SPINNERS[0],
          label: tr(translate, 'wait-spinner', 'Wait Spinner'),
          options: ALLOWED_WAIT_SPINNERS.map(value => ({ value,
            label: tr(translate, value, value) })) },
      ], fields: { legacyOperation: 'save-visibility-allboards' }, submitLabel: save,
    })] });
    rows.push({ rowHeader: false, colspanLast: 2,
      cells: [tr(translate, 'settings-group-url', 'URL')] });
    rows.push({ cells: [tr(translate, 'support', 'Support'), uiFieldsetForm({
      action: path, legend: tr(translate, 'settings-group-url', 'URL'), id: 'visibility-urls',
      inputs: [
        { name: 'supportPageEnabled', type: 'checkbox', value: 'true',
          checked: setting.supportPageEnabled === true,
          label: tr(translate, 'support-page-enabled', 'Support page enabled') },
        { name: 'supportPagePublic', type: 'checkbox', value: 'true',
          checked: setting.supportPagePublic === true, label: tr(translate, 'public', 'Public') },
        { name: 'supportTitle', label: tr(translate, 'support-title', 'Support title'),
          value: setting.supportTitle || '', maxlength: 1000 },
        { name: 'supportPageText', type: 'textarea', label: tr(translate, 'support-content', 'Support content'),
          value: setting.supportPageText || '', maxlength: 20000 },
        { name: 'customHelpLinkUrl', label: tr(translate, 'custom-help-link-url', 'Custom Help Link URL'),
          value: setting.customHelpLinkUrl || '', maxlength: 4096 },
        { name: 'legalNotice', label: tr(translate, 'custom-legal-notice-link-url', 'Custom legal notice page URL'),
          value: setting.legalNotice || '', maxlength: 4096 },
        { name: 'automaticLinkedUrlSchemes', type: 'textarea',
          label: tr(translate, 'automatic-linked-url-schemes', 'Automatic URL schemes'),
          value: setting.automaticLinkedUrlSchemes || '', maxlength: 1000 },
      ], fields: { legacyOperation: 'save-visibility-urls' }, submitLabel: save,
    })] });
    rows.push({ cells: [tr(translate, 'custom-product-name', 'Custom Product Name'), uiTextForm({
      action: path, label: tr(translate, 'custom-product-name', 'Custom Product Name'),
      name: 'productName', value: setting.productName || '', maxlength: 1000,
      fields: { legacyOperation: 'save-visibility-product' }, submitLabel: save,
    })] });
  }
  if (theme) rows.push({ cells: [tr(translate, 'change-color', 'Change Color'), uiFieldsetForm({
    action: path, legend: tr(translate, 'change-color', 'Change Color'), id: 'visibility-theme',
    inputs: [
      { name: 'themeColor', type: 'select', label: tr(translate, 'change-color', 'Change Color'),
        value: theme.color || '', options: [{ value: '', label: tr(translate, 'theme-default', 'Default') },
          ...BOARD_COLORS.map(value => ({ value, label: value }))] },
      { name: 'themeCustomColor1', label: tr(translate, 'custom-color', 'Custom color'),
        value: theme.custom?.[0] || '', maxlength: 7 },
      { name: 'themeCustomColor2', label: tr(translate, 'custom-color', 'Custom color'),
        value: theme.custom?.[1] || '', maxlength: 7 },
    ], fields: { legacyOperation: 'save-visibility-theme' }, submitLabel: save,
  })] });
  if (setting) {
    const image = (url, alt) => /^\/branding\/images\/[A-Za-z0-9_-]+\.gif$/.test(url || '')
      ? uiImage({ src: url, alt, width: 160 }) : '';
    rows.push({ rowHeader: false, colspanLast: 2,
      cells: [tr(translate, 'settings-group-logo', 'Logo')] });
    rows.push({ cells: [tr(translate, 'settings-group-logo', 'Logo'), uiFieldsetForm({
      action: path, legend: tr(translate, 'settings-group-logo', 'Logo'), id: 'visibility-logos',
      inputs: [
        { name: 'hideLogo', type: 'checkbox', value: 'true', checked: setting.hideLogo === true,
          label: tr(translate, 'hide-logo', 'Hide Logo') },
        { name: 'customLoginLogoLinkUrl', label: tr(translate, 'custom-login-logo-link-url', 'Custom Login Logo Link URL'), value: setting.customLoginLogoLinkUrl || '', maxlength: 4096 },
        { name: 'textBelowCustomLoginLogo', type: 'textarea', label: tr(translate, 'text-below-custom-login-logo', 'Text below Custom Login Logo'), value: setting.textBelowCustomLoginLogo || '', maxlength: 20000 },
        { name: 'customTopLeftCornerLogoLinkUrl', label: tr(translate, 'custom-top-left-corner-logo-link-url', 'Custom Top Left Corner Logo Link URL'), value: setting.customTopLeftCornerLogoLinkUrl || '', maxlength: 4096 },
        { name: 'customTopLeftCornerLogoHeight', label: tr(translate, 'custom-top-left-corner-logo-height', 'Custom Top Left Corner Logo Height'), value: setting.customTopLeftCornerLogoHeight || '', maxlength: 10 },
      ], fields: { legacyOperation: 'save-visibility-logos' }, submitLabel: save,
    })] });
    rows.push({ cells: [image(setting.customLoginLogoImageUrl,
      tr(translate, 'custom-login-logo-image-url', 'Custom login logo')), uiFileForm({ action: path,
      label: tr(translate, 'upload', 'Upload'), name: 'brandingImage', accept: 'image/*',
      fields: { legacyOperation: 'upload-visibility-logo', brandingSlot: 'login' },
      submitLabel: tr(translate, 'upload', 'Upload') })] });
    rows.push({ cells: [image(setting.customTopLeftCornerLogoImageUrl,
      tr(translate, 'custom-top-left-corner-logo-image-url', 'Custom top left corner logo')), uiFileForm({
      action: path, label: tr(translate, 'upload', 'Upload'), name: 'brandingImage', accept: 'image/*',
      fields: { legacyOperation: 'upload-visibility-logo', brandingSlot: 'topLeft' },
      submitLabel: tr(translate, 'upload', 'Upload') })] });
  }
  if (requestFields.legacyVisibilityResult) rows.push({ cells: [tr(translate, 'status', 'Status'),
    requestFields.legacyVisibilityResult] });
  return { heading: `${tr(translate, 'admin-panel', 'Admin Panel')} / ${tr(translate, 'settings', 'Settings')} / ${tr(translate, 'visibility', 'Visibility')}`,
    columns: [tr(translate, 'name', 'Name'), tr(translate, 'description', 'Description')], rows };
}

async function adminSettingsTranslationPage(path, userId, requestFields, translate) {
  if (path !== '/admin/settings/translation') return null;
  const search = String(requestFields.q || '');
  const requestedPage = Math.max(1,
    Math.min(100000, parseInt(requestFields.page, 10) || 1));
  let result;
  try {
    result = await translationsPageForAdmin(userId, search, requestedPage);
  } catch (_) {
    return {
      heading: tr(translate, 'admin-panel', 'Admin Panel'),
      columns: [tr(translate, 'settings', 'Settings'), tr(translate, 'status', 'Status')],
      rows: [{ cells: [tr(translate, 'translation', 'Translation'),
        tr(translate, 'error-notAuthorized', 'Not authorized')] }],
    };
  }
  const rows = [
    { rowHeader: false, cells: [adminSettingsNavigation(translate), '', '', ''] },
    { rowHeader: false, cells: [tr(translate, 'search', 'Search'), uiSearchForm({
      action: path, label: tr(translate, 'search', 'Search'), value: result.search,
      fields: { legacyOperation: 'search-translations' },
    }), '', ''] },
    { rowHeader: false, cells: [tr(translate, 'new', 'New'),
      uiFieldsetForm({
        action: path, legend: tr(translate, 'new', 'New'),
        id: 'new-translation', inputs: [
          { name: 'language', label: tr(translate, 'language', 'Language'), maxlength: 5 },
          { name: 'text', label: tr(translate, 'text', 'Text'), maxlength: 10000 },
          { name: 'translationText', type: 'textarea',
            label: tr(translate, 'translation', 'Translation'), maxlength: 20000, rows: 5 },
        ], fields: { legacyOperation: 'create-translation', q: result.search,
          page: result.page }, submitLabel: tr(translate, 'create', 'Create'),
      }), '', ''] },
  ];
  for (const translation of result.rows) {
    const deleting = requestFields.confirmTranslationDelete === translation._id;
    const remove = deleting
      ? uiAction({ action: path,
        label: tr(translate, 'delete-translation-confirm-popup', 'Confirm delete'),
        icon: 'remove', fields: { legacyOperation: 'delete-translation',
          translationId: translation._id, q: result.search, page: result.page } })
      : uiAction({ action: path, label: tr(translate, 'delete', 'Delete'), icon: 'remove',
        fields: { legacyOperation: 'request-delete-translation',
          translationId: translation._id, q: result.search, page: result.page } });
    rows.push({ cells: [translation.language || '', translation.text || '', uiTextForm({
      action: path, label: tr(translate, 'translation', 'Translation'),
      name: 'translationText', value: translation.translationText || '',
      maxlength: 20000, id: `translation-${translation._id}`,
      fields: { legacyOperation: 'update-translation', translationId: translation._id,
        q: result.search, page: result.page }, submitLabel: tr(translate, 'save', 'Save'),
    }), remove] });
  }
  const paging = [];
  if (result.page > 1) paging.push(uiAction({ action: path,
    label: tr(translate, 'previous-page', 'Previous page'), icon: 'previous',
    fields: { legacyOperation: 'translation-page', q: result.search,
      page: result.page - 1 } }));
  paging.push(`${result.page} / ${result.totalPages}`);
  if (result.page < result.totalPages) paging.push(uiAction({ action: path,
    label: tr(translate, 'next-page', 'Next page'), icon: 'next',
    fields: { legacyOperation: 'translation-page', q: result.search,
      page: result.page + 1 } }));
  rows.push({ rowHeader: false, cells: [tr(translate, 'page', 'Page'), paging, '', ''] });
  if (requestFields.legacyTranslationResult) rows.push({ rowHeader: false,
    cells: [tr(translate, 'status', 'Status'), requestFields.legacyTranslationResult, '', ''] });
  return {
    heading: `${tr(translate, 'admin-panel', 'Admin Panel')} / ${tr(translate, 'settings', 'Settings')} / ${tr(translate, 'translation', 'Translation')}`,
    columns: [tr(translate, 'language', 'Language'), tr(translate, 'text', 'Text'),
      tr(translate, 'translation', 'Translation'), tr(translate, 'actions', 'Actions')],
    rows,
  };
}

async function adminPeopleRolesPage(path, userId, requestFields, translate) {
  if (path !== '/admin/people/roles') return null;
  let allowedRoles;
  try { allowedRoles = await inviteRolesForAdmin(userId, { req: requestFields.req }); } catch (_) {
    return { heading: tr(translate, 'admin-panel', 'Admin Panel'),
      columns: [tr(translate, 'people', 'People'), tr(translate, 'status', 'Status')],
      rows: [{ cells: [tr(translate, 'roles', 'Roles'),
        tr(translate, 'error-notAuthorized', 'Not authorized')] }] };
  }
  const term = String(requestFields.q || '').trim().toLowerCase().slice(0, 500);
  const statusRoles = BOARD_ROLES.filter(role =>
    !term || String(tr(translate, role, role)).toLowerCase().includes(term));
  const rows = [{ rowHeader: false, cells: [adminPeopleNavigation(translate), '', '', '', '', ''] },
    { rowHeader: false, cells: [tr(translate, 'roles-info', 'Roles'),
      tr(translate, 'roles-info', 'Choose which board roles may perform each action.'),
      '', '', '', ''] },
    { rowHeader: false, cells: [tr(translate, 'allow-invite-to-board', 'Allow Invite to Board'),
      uiFieldsetForm({ action: path,
        legend: tr(translate, 'allow-invite-to-board', 'Allow Invite to Board'),
        id: 'invite-roles', inputs: INVITE_TO_BOARD_ROLES.map(role => ({
          type: 'checkbox', name: 'allowedRoles', value: role,
          checked: allowedRoles.includes(role), label: tr(translate, role, role),
        })), fields: { legacyOperation: 'save-invite-roles' },
        submitLabel: tr(translate, 'save', 'Save'),
      }), [uiAction({ action: path, label: tr(translate, 'all-board-members', 'All Board Members'),
        fields: { legacyOperation: 'all-invite-roles' } }),
      uiAction({ action: path, label: tr(translate, 'select-none', 'Select none'),
        fields: { legacyOperation: 'clear-invite-roles' } })], '', '', ''] },
    { rowHeader: false, cells: [tr(translate, 'search', 'Search'), uiSearchForm({
      action: path, label: tr(translate, 'search', 'Search'), value: term,
      fields: { legacyOperation: 'search-roles' },
    }), '', '', '', ''] }];
  for (const role of statusRoles) {
    const caps = ROLE_CAPABILITIES[role] || {};
    const yesNo = value => tr(translate, value ? 'yes' : 'no', value ? 'Yes' : 'No');
    rows.push({ cells: [tr(translate, role, role),
      yesNo(INVITE_TO_BOARD_ROLES.includes(role) && allowedRoles.includes(role)),
      tr(translate, caps.seesAllCards ? 'roles-status-sees-all' : 'roles-status-sees-assigned',
        caps.seesAllCards ? 'All' : 'Assigned only'),
      yesNo(caps.comment), yesNo(caps.write), yesNo(caps.manageBoard)] });
  }
  if (requestFields.legacyRolesResult) rows.push({ rowHeader: false,
    cells: [tr(translate, 'status', 'Status'), requestFields.legacyRolesResult, '', '', '', ''] });
  return { heading: `${tr(translate, 'admin-panel', 'Admin Panel')} / ${tr(translate, 'people', 'People')} / ${tr(translate, 'roles', 'Roles')}`,
    columns: [tr(translate, 'roles-status-role', 'Role'),
      tr(translate, 'roles-status-invite', 'Invite to board'),
      tr(translate, 'roles-status-sees', 'Sees cards'),
      tr(translate, 'roles-status-comment', 'Comment'),
      tr(translate, 'roles-status-write', 'Create and edit'),
      tr(translate, 'roles-status-manage', 'Board settings')], rows };
}

async function adminPeopleLoginPage(path, userId, requestFields, translate) {
  if (path !== '/admin/people/login') return null;
  let setting;
  try { setting = await loginSettingsForAdmin(userId, { req: requestFields.req }); } catch (_) {
    return { heading: tr(translate, 'admin-panel', 'Admin Panel'),
      columns: [tr(translate, 'people', 'People'), tr(translate, 'status', 'Status')],
      rows: [{ cells: [tr(translate, 'login', 'Login'),
        tr(translate, 'error-notAuthorized', 'Not authorized')] }] };
  }
  const labels = {
    forgotPassword: ['forgot-password', 'Forgot password'],
    registration: ['self-registration', 'Self-Registration'],
    usernameChange: ['accounts-allowUserNameChange', 'Username Change'],
    userDelete: ['accounts-allowUserDelete', 'Self delete user account'],
    displayAuthenticationMethod: ['display-authentication-method',
      'Display Authentication Method'],
  };
  const rows = [{ rowHeader: false, cells: [adminPeopleNavigation(translate), '', ''] },
    { rowHeader: false, cells: [tr(translate, 'login-allow', 'Login: Allow'), '', ''] }];
  for (const key of Object.keys(labels)) rows.push({ cells: [
    tr(translate, labels[key][0], labels[key][1]),
    tr(translate, setting[key] ? 'yes' : 'no', setting[key] ? 'Yes' : 'No'),
    uiAction({ action: path,
      label: tr(translate, setting[key] ? 'disable' : 'enable',
        setting[key] ? 'Disable' : 'Enable'),
      fields: { legacyOperation: 'set-login-allow', loginAllowKey: key,
        allowed: setting[key] ? 'false' : 'true' } }),
  ] });
  rows.push({ rowHeader: false, cells: [uiFieldsetForm({ action: path,
    legend: tr(translate, 'login', 'Login'), id: 'login-identity', inputs: [
      { type: 'select', name: 'defaultAuthenticationMethod',
        label: tr(translate, 'default-authentication-method',
          'Default Authentication Method'), value: setting.defaultAuthenticationMethod,
        options: setting.authenticationMethods.map(method => ({ value: method,
          label: tr(translate, method, method) })) },
      { name: 'oidcBtnText', label: tr(translate, 'oidc-button-text', 'OIDC button text'),
        value: setting.oidcBtnText, maxlength: 500 },
    ], fields: { legacyOperation: 'save-login-identity' },
    submitLabel: tr(translate, 'save', 'Save'),
  }), '', ''] });
  if (!setting.registration) {
    const boards = await Boards.find({ archived: false, members: { $elemMatch: {
      userId, isAdmin: true,
    } } }, { fields: { title: 1 }, sort: { sort: 1 }, limit: 500 }).fetchAsync();
    rows.push({ rowHeader: false, cells: [uiFieldsetForm({ action: path,
      legend: tr(translate, 'invite-people', 'Invite people'), id: 'login-invite', inputs: [
        { type: 'textarea', name: 'invitationEmails',
          label: tr(translate, 'email-addresses', 'Email addresses'), maxlength: 10000,
          rows: 5 },
        ...boards.map(board => ({ type: 'checkbox', name: 'invitationBoards',
          value: board._id, label: board.title || tr(translate, 'board', 'Board') })),
      ], fields: { legacyOperation: 'send-login-invitations' },
      submitLabel: tr(translate, 'invite', 'Invite'),
    }), '', ''] });
  }
  if (requestFields.legacyLoginResult) rows.push({ rowHeader: false,
    cells: [tr(translate, 'status', 'Status'), requestFields.legacyLoginResult, ''] });
  return { heading: `${tr(translate, 'admin-panel', 'Admin Panel')} / ${tr(translate,
    'people', 'People')} / ${tr(translate, 'login', 'Login')}`,
  columns: [tr(translate, 'name', 'Name'), tr(translate, 'status', 'Status'),
    tr(translate, 'actions', 'Actions')], rows };
}

async function adminPeopleEmailPage(path, userId, requestFields, translate) {
  if (path !== '/admin/people/email') return null;
  let setting;
  try { setting = await emailSettingsForAdmin(userId, { req: requestFields.req }); } catch (_) {
    return { heading: tr(translate, 'admin-panel', 'Admin Panel'),
      columns: [tr(translate, 'people', 'People'), tr(translate, 'status', 'Status')],
      rows: [{ cells: [tr(translate, 'email', 'Email'),
        tr(translate, 'error-notAuthorized', 'Not authorized')] }] };
  }
  const inputs = [
    { type: 'checkbox', name: 'mailEnabled', value: 'true', checked: setting.enabled,
      label: 'Enable below email settings' },
    { type: 'select', name: 'mailService', label: 'Email service',
      value: setting.service,
      options: setting.services.map(service => ({ value: service, label: service })) },
  ];
  // HTML4 has no client-side rerender when the service selector changes. Keep
  // the SMTP-only inputs present for every selected service so switching from
  // Gmail (or another provider) to SMTP remains possible in one POST. The
  // shared service deliberately ignores these fields for non-SMTP providers.
  inputs.push(
    { name: 'mailHost', label: tr(translate, 'smtp-host', 'SMTP host'),
      value: setting.configuration.host, maxlength: 1000 },
    { name: 'mailPort', label: tr(translate, 'smtp-port', 'SMTP port'),
      value: setting.configuration.port, maxlength: 20 },
    { type: 'checkbox', name: 'mailSecure', value: 'true',
      checked: setting.configuration.secure,
      label: tr(translate, 'smtp-tls-description', 'Use TLS') },
  );
  inputs.push(
    { name: 'mailUsername', label: tr(translate, 'smtp-username', 'Username'),
      value: setting.configuration.username, maxlength: 1000 },
    { type: 'password', name: 'mailPassword',
      label: `${tr(translate, 'smtp-password', 'Password')} - ${setting.passwordSet
        ? 'A password is saved. Leave blank to keep it.' : 'No password is saved.'}`,
      value: '', maxlength: 10000, autocomplete: 'new-password' },
    { name: 'mailFrom', label: tr(translate, 'send-from', 'Send from'),
      value: setting.configuration.from, maxlength: 1000 },
  );
  const rows = [
    { rowHeader: false, cells: [adminPeopleNavigation(translate), '', ''] },
    { rowHeader: false, cells: [uiAction({ action: path,
      label: tr(translate, 'send-smtp-test', 'Send SMTP test email'),
      fields: { legacyOperation: 'send-smtp-test-email' } }), '', ''] },
    { rowHeader: false, cells: [uiFieldsetForm({ action: path,
      legend: tr(translate, 'email', 'Email'), id: 'mail-transport', inputs,
      fields: { legacyOperation: 'save-mail-transport' },
      submitLabel: tr(translate, 'save', 'Save'),
    }), '', ''] },
    { rowHeader: false, cells: [uiFieldsetForm({ action: path,
      legend: tr(translate, 'email', 'Email'), id: 'email-access', inputs: [
        { name: 'mailDomainName', label: tr(translate,
          'email-domain-allowed-to-invite', 'Email domain allowed to invite people'),
        value: setting.mailDomainName, maxlength: 500 },
        { type: 'checkbox', name: 'allowEmailChange', value: 'true',
          checked: setting.allowEmailChange,
          label: tr(translate, 'accounts-allowEmailChange', 'Allow Email Change') },
      ], fields: { legacyOperation: 'save-email-access' },
      submitLabel: tr(translate, 'save', 'Save'),
    }), '', ''] },
  ];
  if (requestFields.legacyEmailResult) rows.push({ rowHeader: false,
    cells: [tr(translate, 'status', 'Status'), requestFields.legacyEmailResult, ''] });
  return { heading: `${tr(translate, 'admin-panel', 'Admin Panel')} / ${tr(translate,
    'people', 'People')} / ${tr(translate, 'email', 'Email')}`,
  columns: [tr(translate, 'name', 'Name'), tr(translate, 'status', 'Status'),
    tr(translate, 'actions', 'Actions')], rows };
}

async function adminPeopleDomainsPage(path, userId, requestFields, translate) {
  if (path !== '/admin/people/domains') return null;
  const search = String(requestFields.q || '').trim().slice(0, 500);
  const requestedPage = Math.max(1, Number(requestFields.page) || 1);
  let result;
  try {
    result = await domainsPageForAdmin(userId, {
      search, page: requestedPage, perPage: 10,
    }, { req: requestFields.req });
  } catch (_) {
    return { heading: tr(translate, 'admin-panel', 'Admin Panel'),
      columns: [tr(translate, 'people', 'People'), tr(translate, 'status', 'Status')],
      rows: [{ cells: [tr(translate, 'domains', 'Domains'),
        tr(translate, 'error-notAuthorized', 'Not authorized')] }] };
  }
  const rows = [
    { rowHeader: false, cells: [adminPeopleNavigation(translate), '', ''] },
    { rowHeader: false, cells: [tr(translate, 'search', 'Search'), uiSearchForm({
      action: path, label: tr(translate, 'search', 'Search'), value: search,
      fields: { page: 1 },
    }), `${result.total} ${tr(translate, 'domains', 'Domains')}`] },
    ...result.rows.map(row => ({ cells: [row.domain, String(row.count), ''] })),
    { rowHeader: false, cells: [
      `${tr(translate, 'page', 'Page')} ${result.page} / ${result.totalPages}`,
      result.page > 1 ? uiAction({ action: path,
        label: tr(translate, 'previous-page', 'Previous'), icon: 'previous',
        fields: { q: search, page: result.page - 1 } }) : '',
      result.page < result.totalPages ? uiAction({ action: path,
        label: tr(translate, 'next-page', 'Next'), icon: 'next',
        fields: { q: search, page: result.page + 1 } }) : '',
    ] },
  ];
  return { heading: `${tr(translate, 'admin-panel', 'Admin Panel')} / ${tr(translate,
    'people', 'People')} / ${tr(translate, 'domains', 'Domains')}`,
  columns: [tr(translate, 'domain', 'Domain'),
    tr(translate, 'domain-user-count', 'User count'),
    tr(translate, 'actions', 'Actions')], rows };
}

function organizationBaseInputs(org, translate) {
  return [
    { name: 'orgDisplayName', label: tr(translate, 'displayName', 'Display name'),
      value: org?.orgDisplayName || '', maxlength: 1000 },
    { name: 'orgDesc', label: tr(translate, 'description', 'Description'),
      value: org?.orgDesc || '', maxlength: 190 },
    { name: 'orgShortName', label: tr(translate, 'shortName', 'Short name'),
      value: org?.orgShortName || '', maxlength: 255 },
    { name: 'orgAutoAddUsersWithDomainName',
      label: tr(translate, 'autoAddUsersWithDomainName', 'Auto-add users with domain name'),
      value: org?.orgAutoAddUsersWithDomainName || '', maxlength: 255 },
    { name: 'orgWebsite', label: tr(translate, 'website', 'Website'),
      value: org?.orgWebsite || '', maxlength: 255 },
    { type: 'select', name: 'orgIsActive', label: tr(translate, 'active-org', 'Active'),
      value: org?.orgIsActive === true ? 'true' : 'false', options: [
        { value: 'false', label: tr(translate, 'no', 'No') },
        { value: 'true', label: tr(translate, 'yes', 'Yes') },
      ] },
  ];
}

function organizationTenantInputs(org, translate) {
  return [
    { name: 'orgDomains', label: tr(translate, 'org-domains', 'Organization domains'),
      value: org.orgDomains || '', maxlength: 1000 },
    { name: 'orgProductName', label: tr(translate, 'custom-product-name', 'Product name'),
      value: org.orgProductName || '', maxlength: 255 },
    { name: 'orgCustomLoginLogoLinkUrl',
      label: tr(translate, 'custom-login-logo-link-url', 'Login logo link URL'),
      value: org.orgCustomLoginLogoLinkUrl || '', maxlength: 1000 },
    { name: 'orgTextBelowCustomLoginLogo',
      label: tr(translate, 'text-below-custom-login-logo', 'Text below login logo'),
      value: org.orgTextBelowCustomLoginLogo || '', maxlength: 1000 },
    { name: 'orgCustomTopLeftCornerLogoLinkUrl',
      label: tr(translate, 'custom-top-left-corner-logo-link-url', 'Top-left logo link URL'),
      value: org.orgCustomTopLeftCornerLogoLinkUrl || '', maxlength: 1000 },
    { name: 'orgCustomHelpLinkUrl',
      label: tr(translate, 'custom-help-link-url', 'Help link URL'),
      value: org.orgCustomHelpLinkUrl || '', maxlength: 1000 },
    { name: 'orgLegalNotice',
      label: tr(translate, 'custom-legal-notice-link-url', 'Legal notice URL'),
      value: org.orgLegalNotice || '', maxlength: 1000 },
  ];
}

async function adminPeopleOrganizationsPage(path, userId, requestFields, translate) {
  if (path !== '/admin/people/organizations') return null;
  const search = String(requestFields.q || '').trim().slice(0, 500);
  const requestedPage = Math.max(1, Number(requestFields.page) || 1);
  let result;
  try {
    result = await organizationsPageForAdmin(userId, { search, page: requestedPage },
      { req: requestFields.req });
  } catch (_) {
    return { heading: tr(translate, 'admin-panel', 'Admin Panel'),
      columns: [tr(translate, 'people', 'People'), tr(translate, 'status', 'Status')],
      rows: [{ cells: [tr(translate, 'organizations', 'Organizations'),
        tr(translate, 'error-notAuthorized', 'Not authorized')] }] };
  }
  const pathFields = { q: result.search, page: result.page };
  const yes = tr(translate, 'yes', 'Yes');
  const no = tr(translate, 'no', 'No');
  const rows = [
    { rowHeader: false, cells: [adminPeopleNavigation(translate), '', '', '', '', '', '', '', '', ''] },
    { rowHeader: false, cells: [tr(translate, 'search', 'Search'), uiSearchForm({
      action: path, label: tr(translate, 'search', 'Search'), value: result.search,
      fields: { page: 1 },
    }), `${result.total} ${tr(translate, 'org-number', 'Organizations')}`, '', '', '', '', '', '', ''] },
  ];
  if (result.canManageInstance) {
    rows.push({ rowHeader: false, cells: [uiAction({ action: path,
      label: tr(translate, 'new', 'New'), icon: 'add',
      fields: { ...pathFields, legacyOperation: 'show-create-organization' } }),
    uiAction({ action: path,
      label: `${result.boardMembersFromSameOrgOnly ? '[x]' : '[ ]'} ${tr(translate,
        'board-members-same-org-only', 'Only add board members from same Organization')}`,
      fields: { ...pathFields, legacyOperation: 'set-board-members-same-org',
        enabled: result.boardMembersFromSameOrgOnly ? 'false' : 'true' } }), '', '', '', '', '', '', '', ''] });
    rows.push({ rowHeader: false, cells: [tr(translate, 'dueCardsViewChange-choice-all', 'All'),
      '', '', '', '', '', '', ...[
        ['orgSharedTemplates', 'org-shared-templates'],
        ['orgPropagateMembersToBoards', 'org-propagate-members-to-boards'],
        ['orgSyncMembersFromAuth', 'org-sync-members-from-auth'],
      ].map(([field, key]) => [true, false].map(enabled => uiAction({ action: path,
        label: `${enabled ? '[x]' : '[ ]'} ${tr(translate, key, field)}`,
        fields: { ...pathFields, legacyOperation: 'set-all-organizations-feature',
          organizationFeature: field, enabled: String(enabled) },
      }))) ] });
  }
  const feature = (org, field, key) => result.canManageInstance ? uiAction({ action: path,
    label: `${org[field] ? '[x]' : '[ ]'} ${tr(translate, key, field)}`,
    fields: { ...pathFields, legacyOperation: 'set-organization-feature', orgId: org._id,
      organizationFeature: field, enabled: String(!org[field]) },
  }) : (org[field] ? yes : no);
  for (const org of result.rows) {
    const actions = [uiAction({ action: path, label: tr(translate, 'edit', 'Edit'),
      fields: { ...pathFields, legacyOperation: 'show-edit-organization', orgId: org._id } }),
    uiAction({ action: path, label: tr(translate, 'org-admins', 'Organization admins'),
      fields: { ...pathFields, legacyOperation: 'show-organization-admins', orgId: org._id } })];
    if (result.canManageInstance) actions.push(uiAction({ action: path,
      label: tr(translate, 'delete', 'Delete'),
      fields: { ...pathFields, legacyOperation: 'request-delete-organization', orgId: org._id } }));
    rows.push({ rowHeader: false, cells: [actions, org.orgDisplayName || '', org.orgDesc || '',
      org.orgShortName || '', org.orgWebsite || '', org.createdAt ? String(org.createdAt) : '',
      org.orgIsActive ? yes : no,
      feature(org, 'orgSharedTemplates', 'org-shared-templates'),
      feature(org, 'orgPropagateMembersToBoards', 'org-propagate-members-to-boards'),
      feature(org, 'orgSyncMembersFromAuth', 'org-sync-members-from-auth')] });
  }
  if (requestFields.showCreateOrganization && result.canManageInstance) {
    rows.push({ rowHeader: false, cells: [uiFieldsetForm({ action: path,
      legend: tr(translate, 'new', 'New'), id: 'create-organization',
      inputs: organizationBaseInputs(null, translate),
      fields: { ...pathFields, legacyOperation: 'create-organization' },
      submitLabel: tr(translate, 'save', 'Save'),
    }), '', '', '', '', '', '', '', '', ''] });
  }
  const editOrgId = String(requestFields.editOrgId || '');
  if (editOrgId) {
    try {
      const org = await organizationForAdmin(userId, editOrgId, { req: requestFields.req });
      if (result.canManageInstance) rows.push({ rowHeader: false, cells: [uiFieldsetForm({
        action: path, legend: tr(translate, 'edit', 'Edit'), id: `edit-org-${org._id}`,
        inputs: organizationBaseInputs(org, translate),
        fields: { ...pathFields, legacyOperation: 'update-organization', orgId: org._id },
        submitLabel: tr(translate, 'save', 'Save'),
      }), '', '', '', '', '', '', '', '', ''] });
      rows.push({ rowHeader: false, cells: [uiFieldsetForm({ action: path,
        legend: tr(translate, 'org-tenant', 'Organization tenant'), id: `tenant-org-${org._id}`,
        inputs: organizationTenantInputs(org, translate),
        fields: { ...pathFields, legacyOperation: 'save-organization-tenant', orgId: org._id },
        submitLabel: tr(translate, 'save', 'Save'),
      }), '', '', '', '', '', '', '', '', ''] });
      const logo = (url, alt) => /^\/branding\/images\/[A-Za-z0-9_-]+\.gif$/.test(url || '')
        ? uiImage({ src: url, alt, width: 160 }) : '';
      for (const [slot, field, key] of [
        ['login', 'orgCustomLoginLogoImageUrl', 'custom-login-logo-image-url'],
        ['topLeft', 'orgCustomTopLeftCornerLogoImageUrl', 'custom-top-left-corner-logo-image-url'],
      ]) rows.push({ rowHeader: false, cells: [logo(org[field], tr(translate, key, slot)),
        uiFileForm({ action: path, label: tr(translate, 'upload', 'Upload'),
          name: 'brandingImage', accept: 'image/*', fields: {
            legacyOperation: 'upload-organization-logo', orgId: org._id, brandingSlot: slot },
          submitLabel: tr(translate, 'upload', 'Upload') }), '', '', '', '', '', '', '', ''] });
    } catch (_) { /* exact-scope service already reports refused reads */ }
  }
  const adminsOrgId = String(requestFields.adminsOrgId || '');
  if (adminsOrgId) {
    try {
      const members = await organizationMembersForAdmin(userId, adminsOrgId,
        { req: requestFields.req });
      rows.push({ rowHeader: false, cells: [tr(translate, 'org-admins', 'Organization admins'),
        ...Array(9).fill('')] });
      for (const member of members) rows.push({ rowHeader: false, cells: [
        member.username, member.fullname,
        member.isSiteAdmin ? tr(translate, 'admin', 'Admin') : '',
        uiAction({ action: path, label: `${member.isOrgAdmin ? '[x]' : '[ ]'} ${tr(translate,
          'org-admins', 'Organization admin')}`, fields: { ...pathFields,
          legacyOperation: 'set-organization-admin', orgId: adminsOrgId,
          targetUserId: member._id, enabled: String(!member.isOrgAdmin) } }),
        '', '', '', '', '', ''] });
    } catch (_) { /* exact-scope service already reports refused reads */ }
  }
  if (requestFields.confirmOrgDelete) rows.push({ rowHeader: false, cells: [
    tr(translate, 'delete-org-confirm-popup', 'Delete this Organization?'),
    uiAction({ action: path, label: tr(translate, 'delete', 'Delete'),
      fields: { ...pathFields, legacyOperation: 'delete-organization',
        orgId: String(requestFields.confirmOrgDelete) } }), '', '', '', '', '', '', '', ''] });
  rows.push({ rowHeader: false, cells: [
    `${tr(translate, 'page', 'Page')} ${result.page} / ${result.totalPages}`,
    result.page > 1 ? uiAction({ action: path, label: tr(translate, 'previous-page', 'Previous'),
      icon: 'previous', fields: { q: result.search, page: result.page - 1 } }) : '',
    result.page < result.totalPages ? uiAction({ action: path,
      label: tr(translate, 'next-page', 'Next'), icon: 'next',
      fields: { q: result.search, page: result.page + 1 } }) : '', '', '', '', '', '', '', ''] });
  if (requestFields.legacyOrganizationResult) rows.push({ rowHeader: false,
    cells: [tr(translate, 'status', 'Status'), requestFields.legacyOrganizationResult,
      '', '', '', '', '', '', '', ''] });
  return { heading: `${tr(translate, 'admin-panel', 'Admin Panel')} / ${tr(translate,
    'people', 'People')} / ${tr(translate, 'organizations', 'Organizations')}`,
  columns: [tr(translate, 'actions', 'Actions'), tr(translate, 'displayName', 'Display name'),
    tr(translate, 'description', 'Description'), tr(translate, 'shortName', 'Short name'),
    tr(translate, 'website', 'Website'), tr(translate, 'createdAt', 'Created'),
    tr(translate, 'active-org', 'Active'),
    tr(translate, 'org-shared-templates', 'Shared templates'),
    tr(translate, 'org-propagate-members-to-boards', 'Propagate members'),
    tr(translate, 'org-sync-members-from-auth', 'Sync members')], rows };
}

function teamInputs(team, translate) {
  return [
    { name: 'teamDisplayName', label: tr(translate, 'displayName', 'Display name'),
      value: team?.teamDisplayName || '', maxlength: 1000, required: true },
    { name: 'teamDesc', label: tr(translate, 'description', 'Description'),
      value: team?.teamDesc || '', maxlength: 190, required: true },
    { name: 'teamShortName', label: tr(translate, 'shortName', 'Short name'),
      value: team?.teamShortName || '', maxlength: 255, required: true },
    { name: 'teamWebsite', label: tr(translate, 'website', 'Website'),
      value: team?.teamWebsite || '', maxlength: 255 },
    { type: 'select', name: 'teamIsActive', label: tr(translate, 'active-team', 'Active'),
      value: team?.teamIsActive === true ? 'true' : 'false', options: [
        { value: 'false', label: tr(translate, 'no', 'No') },
        { value: 'true', label: tr(translate, 'yes', 'Yes') },
      ] },
  ];
}

async function adminPeopleTeamsPage(path, userId, requestFields, translate) {
  if (path !== '/admin/people/teams') return null;
  const search = String(requestFields.q || '').trim().slice(0, 500);
  const requestedPage = Math.max(1, Number(requestFields.page) || 1);
  let result;
  try {
    result = await teamsPageForAdmin(userId, { search, page: requestedPage },
      { req: requestFields.req });
  } catch (_) {
    return { heading: tr(translate, 'admin-panel', 'Admin Panel'),
      columns: [tr(translate, 'people', 'People'), tr(translate, 'status', 'Status')],
      rows: [{ cells: [tr(translate, 'teams', 'Teams'),
        tr(translate, 'error-notAuthorized', 'Not authorized')] }] };
  }
  const pathFields = { q: result.search, page: result.page };
  const yes = tr(translate, 'yes', 'Yes');
  const no = tr(translate, 'no', 'No');
  const rows = [
    { rowHeader: false, cells: [adminPeopleNavigation(translate), '', '', '', '', '', '', '', '', ''] },
    { rowHeader: false, cells: [tr(translate, 'search', 'Search'), uiSearchForm({
      action: path, label: tr(translate, 'search', 'Search'), value: result.search,
      fields: { page: 1 },
    }), `${result.total} ${tr(translate, 'team-number', 'Teams')}`, '', '', '', '', '', '', ''] },
    { rowHeader: false, cells: [uiAction({ action: path,
      label: tr(translate, 'new', 'New'), icon: 'add',
      fields: { ...pathFields, legacyOperation: 'show-create-team' } }),
    uiAction({ action: path,
      label: `${result.boardMembersFromSameTeamOnly ? '[x]' : '[ ]'} ${tr(translate,
        'board-members-same-team-only', 'Only add board members from same Team')}`,
      fields: { ...pathFields, legacyOperation: 'set-board-members-same-team',
        enabled: result.boardMembersFromSameTeamOnly ? 'false' : 'true' } }), '', '', '', '', '', '', '', ''] },
    { rowHeader: false, cells: [tr(translate, 'dueCardsViewChange-choice-all', 'All'),
      '', '', '', '', '', '', ...[
        ['teamSharedTemplates', 'team-shared-templates'],
        ['teamPropagateMembersToBoards', 'team-propagate-members-to-boards'],
        ['teamSyncMembersFromAuth', 'team-sync-members-from-auth'],
      ].map(([field, key]) => [true, false].map(enabled => uiAction({ action: path,
        label: `${enabled ? '[x]' : '[ ]'} ${tr(translate, key, field)}`,
        fields: { ...pathFields, legacyOperation: 'set-all-teams-feature',
          teamFeature: field, enabled: String(enabled) },
      }))) ] },
  ];
  const feature = (team, field, key) => uiAction({ action: path,
    label: `${team[field] ? '[x]' : '[ ]'} ${tr(translate, key, field)}`,
    fields: { ...pathFields, legacyOperation: 'set-team-feature', teamId: team._id,
      teamFeature: field, enabled: String(!team[field]) },
  });
  for (const team of result.rows) rows.push({ rowHeader: false, cells: [[
    uiAction({ action: path, label: tr(translate, 'edit', 'Edit'),
      fields: { ...pathFields, legacyOperation: 'show-edit-team', teamId: team._id } }),
    uiAction({ action: path, label: tr(translate, 'delete', 'Delete'),
      fields: { ...pathFields, legacyOperation: 'request-delete-team', teamId: team._id } }),
  ], team.teamDisplayName || '', team.teamDesc || '', team.teamShortName || '',
  team.teamWebsite || '', team.createdAt ? String(team.createdAt) : '',
  team.teamIsActive ? yes : no,
  feature(team, 'teamSharedTemplates', 'team-shared-templates'),
  feature(team, 'teamPropagateMembersToBoards', 'team-propagate-members-to-boards'),
  feature(team, 'teamSyncMembersFromAuth', 'team-sync-members-from-auth')] });
  if (requestFields.showCreateTeam) rows.push({ rowHeader: false, cells: [uiFieldsetForm({
    action: path, legend: tr(translate, 'new', 'New'), id: 'create-team',
    inputs: teamInputs(null, translate),
    fields: { ...pathFields, legacyOperation: 'create-team' },
    submitLabel: tr(translate, 'save', 'Save'),
  }), '', '', '', '', '', '', '', '', ''] });
  const editTeamId = String(requestFields.editTeamId || '');
  if (editTeamId) {
    try {
      const team = await teamForAdmin(userId, editTeamId, { req: requestFields.req });
      rows.push({ rowHeader: false, cells: [uiFieldsetForm({ action: path,
        legend: tr(translate, 'edit', 'Edit'), id: `edit-team-${team._id}`,
        inputs: teamInputs(team, translate), fields: { ...pathFields,
          legacyOperation: 'update-team', teamId: team._id },
        submitLabel: tr(translate, 'save', 'Save'),
      }), '', '', '', '', '', '', '', '', ''] });
    } catch (_) { /* exact Global Admin service already reports refused reads */ }
  }
  if (requestFields.confirmTeamDelete) rows.push({ rowHeader: false, cells: [
    tr(translate, 'delete-team-confirm-popup', 'Delete this Team?'),
    uiAction({ action: path, label: tr(translate, 'delete', 'Delete'),
      fields: { ...pathFields, legacyOperation: 'delete-team',
        teamId: String(requestFields.confirmTeamDelete) } }), '', '', '', '', '', '', '', ''] });
  rows.push({ rowHeader: false, cells: [
    `${tr(translate, 'page', 'Page')} ${result.page} / ${result.totalPages}`,
    result.page > 1 ? uiAction({ action: path, label: tr(translate, 'previous-page', 'Previous'),
      icon: 'previous', fields: { q: result.search, page: result.page - 1 } }) : '',
    result.page < result.totalPages ? uiAction({ action: path,
      label: tr(translate, 'next-page', 'Next'), icon: 'next',
      fields: { q: result.search, page: result.page + 1 } }) : '', '', '', '', '', '', '', ''] });
  if (requestFields.legacyTeamResult) rows.push({ rowHeader: false,
    cells: [tr(translate, 'status', 'Status'), requestFields.legacyTeamResult,
      '', '', '', '', '', '', '', ''] });
  return { heading: `${tr(translate, 'admin-panel', 'Admin Panel')} / ${tr(translate,
    'people', 'People')} / ${tr(translate, 'teams', 'Teams')}`,
  columns: [tr(translate, 'actions', 'Actions'), tr(translate, 'displayName', 'Display name'),
    tr(translate, 'description', 'Description'), tr(translate, 'shortName', 'Short name'),
    tr(translate, 'website', 'Website'), tr(translate, 'createdAt', 'Created'),
    tr(translate, 'active-team', 'Active'),
    tr(translate, 'team-shared-templates', 'Shared templates'),
    tr(translate, 'team-propagate-members-to-boards', 'Propagate members'),
    tr(translate, 'team-sync-members-from-auth', 'Sync members')], rows };
}

async function adminPeoplePeoplePage(path, userId, requestFields, translate) {
  if (path !== '/admin/people/people') return null;
  const search = String(requestFields.q || '').trim().slice(0, 500);
  const filter = String(requestFields.filter || 'all');
  const requestedPage = Math.max(1, Number(requestFields.page) || 1);
  let result;
  try {
    result = await peoplePageForAdmin(userId, { search, filter, page: requestedPage },
      { req: requestFields.req });
  } catch (_) {
    return { heading: tr(translate, 'admin-panel', 'Admin Panel'),
      columns: [tr(translate, 'people', 'People'), tr(translate, 'status', 'Status')],
      rows: [{ cells: [tr(translate, 'people', 'People'),
        tr(translate, 'error-notAuthorized', 'Not authorized')] }] };
  }
  const pathFields = { q: result.search, filter: result.filter, page: result.page };
  const yes = tr(translate, 'yes', 'Yes');
  const no = tr(translate, 'no', 'No');
  const personForm = (person = null) => uiFieldsetForm({
    action: path,
    legend: person ? tr(translate, 'edit', 'Edit') : tr(translate, 'new', 'New'),
    id: person ? `person-${person._id}` : 'new-person',
    inputs: [
      { name: 'fullname', label: tr(translate, 'fullname', 'Full name'),
        value: person?.profile?.fullname || '', maxlength: 256, required: true },
      { name: 'username', label: tr(translate, 'username', 'Username'),
        value: person?.username || '', maxlength: 255, required: true },
      { name: 'initials', label: tr(translate, 'initials', 'Initials'),
        value: person?.profile?.initials || '', maxlength: 20 },
      { name: 'email', type: 'email', label: tr(translate, 'email', 'Email'),
        value: person?.emails?.[0]?.address || '', maxlength: 320, required: true },
      { name: 'emailVerified', type: 'select', label: tr(translate, 'verified', 'Verified'),
        value: String(person?.emails?.[0]?.verified === true),
        options: [{ value: 'false', label: no }, { value: 'true', label: yes }] },
      { name: 'importUsernames', label: tr(translate, 'import-usernames', 'Import usernames'),
        value: (person?.importUsernames || []).join(', '), maxlength: 10000 },
      ...(result.canManageInstance ? [{ name: 'isAdmin', type: 'select',
        label: tr(translate, 'admin', 'Admin'), value: String(person?.isAdmin === true),
        options: [{ value: 'false', label: no }, { value: 'true', label: yes }] }] : []),
      { name: 'loginDisabled', type: 'select', label: tr(translate, 'active-person', 'Active'),
        value: String(person?.loginDisabled === true),
        options: [{ value: 'false', label: yes }, { value: 'true', label: no }] },
      { name: 'authenticationMethod', type: 'select',
        label: tr(translate, 'authentication-type', 'Authentication'),
        value: person?.authenticationMethod || 'password',
        options: [...new Set([...result.authenticationMethods,
          ...(person?.authenticationMethod ? [person.authenticationMethod] : [])])]
          .map(value => ({ value, label: tr(translate, value, value) })) },
      ...result.orgs.map(org => ({ name: 'orgIds', type: 'checkbox', value: org._id,
        checked: (person?.orgs || []).some(item => item.orgId === org._id),
        label: `${tr(translate, 'organizations', 'Organizations')}: ${org.orgDisplayName || ''}` })),
      ...result.teams.map(team => ({ name: 'teamIds', type: 'checkbox', value: team._id,
        checked: (person?.teams || []).some(item => item.teamId === team._id),
        label: `${tr(translate, 'teams', 'Teams')}: ${team.teamDisplayName || ''}` })),
      { name: 'password', type: 'password', label: tr(translate, 'password', 'Password'),
        autocomplete: 'new-password', maxlength: 1000, required: !person },
    ],
    fields: { ...pathFields,
      legacyOperation: person ? 'update-person' : 'create-person',
      ...(person ? { targetUserId: person._id } : {}) },
    submitLabel: person ? tr(translate, 'save', 'Save') : tr(translate, 'create', 'Create'),
  });
  const rows = [
    { rowHeader: false, cells: [adminPeopleNavigation(translate), '', '', '', '', '', '', '', ''] },
    { rowHeader: false, cells: [tr(translate, 'search', 'Search'), uiSearchForm({
      action: path, label: tr(translate, 'search', 'Search'), value: result.search,
      fields: { filter: result.filter, page: 1 },
    }), uiSelectForm({ action: path, label: tr(translate, 'admin-people-filter-show', 'Show'),
      name: 'filter', value: result.filter, fields: { q: result.search, page: 1 },
      options: [
        { value: 'all', label: tr(translate, 'admin-people-filter-all', 'All') },
        { value: 'locked', label: tr(translate, 'admin-people-filter-locked', 'Locked') },
        { value: 'active', label: tr(translate, 'admin-people-filter-active', 'Active') },
        { value: 'inactive', label: tr(translate, 'admin-people-filter-inactive', 'Inactive') },
        { value: 'admin', label: tr(translate, 'admin', 'Admin') },
      ], submitLabel: tr(translate, 'filter', 'Filter') }),
    `${result.total} ${tr(translate, 'people-number', 'People')}`, '', '', '', '', ''] },
  ];
  if (result.canManageInstance) rows.push({ rowHeader: false, cells: [
    requestFields.showCreatePerson ? personForm() : uiAction({ action: path,
      label: tr(translate, 'new', 'New'), icon: 'add',
      fields: { ...pathFields, legacyOperation: 'show-create-person' } }),
    '', '', '', '', '', '', '', ''] });
  for (const person of result.rows) {
    const countries = person.countries.map(country => uiAction({ action: path,
      label: `${country.flag || ''} ${country.country} (${country.count})`,
      fields: { ...pathFields, legacyOperation: 'show-login-country',
        targetUserId: person._id, locationCountry: country.country },
    }));
    const actions = [uiAction({ action: path, label: tr(translate, 'edit', 'Edit'),
      fields: { ...pathFields, legacyOperation: 'show-person', targetUserId: person._id } }),
    uiAction({ action: path,
      label: person.loginDisabled
        ? tr(translate, 'admin-people-user-inactive', 'Activate user')
        : tr(translate, 'admin-people-user-active', 'Deactivate user'),
      fields: { ...pathFields, legacyOperation: 'set-person-active',
        targetUserId: person._id, active: String(person.loginDisabled) } })];
    if (person.lock.locked) actions.push(uiAction({ action: path,
      label: tr(translate, 'accounts-lockout-click-to-unlock', 'Unlock'),
      fields: { ...pathFields, legacyOperation: 'request-unlock-person',
        targetUserId: person._id } }));
    if (result.canManageInstance) {
      actions.push(uiAction({ action: path,
        label: tr(translate, 'impersonate-user', 'Impersonate user'),
        fields: { ...pathFields, legacyOperation: 'request-impersonate-person',
          targetUserId: person._id } }));
      actions.push(uiAction({ action: path, label: tr(translate, 'delete', 'Delete'),
        icon: 'remove', fields: { ...pathFields, legacyOperation: 'request-delete-person',
          targetUserId: person._id } }));
    }
    rows.push({ rowHeader: false, cells: [actions,
      person.username, person.email, person.isAdmin ? yes : no,
      person.loginDisabled ? no : yes, countries,
      person.lock.locked
        ? `${tr(translate, 'accounts-lockout-user-locked', 'Locked')} (${person.lock.failedAttempts})`
        : tr(translate, 'accounts-lockout-user-unlocked', 'Unlocked'),
      person.createdAt ? String(person.createdAt) : '', ''] });
  }
  if (result.canManageInstance && result.teams.length && result.rows.length) {
    rows.push({ rowHeader: false, cells: [uiFieldsetForm({
      action: path, legend: tr(translate, 'teams', 'Teams'), id: 'people-bulk-team',
      inputs: [
        ...result.rows.map(person => ({ name: 'targetUserIds', type: 'checkbox',
          value: person._id, label: person.username })),
        { name: 'teamId', type: 'select', label: tr(translate, 'teams', 'Teams'),
          options: result.teams.map(team => ({ value: team._id,
            label: team.teamDisplayName || team._id })) },
        { name: 'teamAction', type: 'select', label: tr(translate, 'r-action', 'Action'),
          options: [{ value: 'add', label: tr(translate, 'add', 'Add') },
            { value: 'remove', label: tr(translate, 'delete', 'Delete') }] },
      ], fields: { ...pathFields, legacyOperation: 'update-people-team' },
      submitLabel: tr(translate, 'save', 'Save'),
    }), '', '', '', '', '', '', '', ''] });
  }
  const editPersonId = String(requestFields.editPersonId || '');
  if (editPersonId) {
    try {
      const person = await personForAdmin(userId, editPersonId, { req: requestFields.req });
      const avatars = await personAvatarsForAdmin(userId, editPersonId,
        { req: requestFields.req });
      rows.push({ rowHeader: false, cells: [personForm(person),
        person.profile?.avatarUrl ? uiImage({ src: person.profile.avatarUrl,
          alt: person.username || tr(translate, 'avatars', 'Avatars'), width: 96 }) : '',
        uiFileForm({ action: path, label: tr(translate, 'adminChangeAvatarPopup-title',
          'Change avatar'), name: 'avatarImage', accept: 'image/*',
        fields: { legacyOperation: 'upload-person-avatar', targetUserId: person._id },
        submitLabel: tr(translate, 'upload', 'Upload') }),
        uiAction({ action: path, label: tr(translate, 'initials', 'Initials'),
          fields: { ...pathFields, legacyOperation: 'clear-person-avatar',
            targetUserId: person._id } }), '', '', '', '', ''] });
      for (const avatar of avatars) {
        const deleting = requestFields.confirmDeletePersonAvatar === avatar._id;
        rows.push({ rowHeader: false, cells: [
          uiImage({ src: `/cdn/storage/avatars/${avatar._id}`,
            alt: avatar.name || person.username, width: 96 }),
          `${avatar.name || ''} (${avatar.type || ''}, ${avatar.size || 0})`,
          uiAction({ action: path, label: tr(translate, 'adminChangeAvatarPopup-title',
            'Change avatar'),
            fields: { ...pathFields, legacyOperation: 'select-person-avatar',
              targetUserId: person._id, avatarId: avatar._id } }),
          uiAction({ action: path,
            label: deleting ? tr(translate, 'delete-avatar-confirm', 'Confirm delete')
              : tr(translate, 'delete', 'Delete'), icon: 'remove',
            fields: { ...pathFields,
              legacyOperation: deleting ? 'delete-person-avatar'
                : 'request-delete-person-avatar',
              targetUserId: person._id, avatarId: avatar._id } }),
          '', '', '', '', ''] });
      }
    } catch (_) { /* exact people scope already reports refused reads */ }
  }
  const locationUserId = String(requestFields.locationUserId || '');
  const locationCountry = String(requestFields.locationCountry || '');
  if (locationUserId && locationCountry) {
    const person = result.rows.find(item => item._id === locationUserId);
    const country = person?.countries.find(item => item.country === locationCountry);
    if (person && country) for (const location of country.rows || []) rows.push({
      rowHeader: false, cells: [
        `${country.flag || ''} ${country.country}: ${location.city || ''}`,
        location.ipv4 || '', location.ipv6 || '',
        location.firstAt ? String(location.firstAt) : '',
        location.at ? String(location.at) : '', '', '', '', '',
      ],
    });
  }
  if (requestFields.confirmUnlockPerson) rows.push({ rowHeader: false, cells: [
    tr(translate, 'accounts-lockout-confirm-unlock', 'Unlock this user?'),
    uiAction({ action: path, label: tr(translate, 'accounts-lockout-click-to-unlock', 'Unlock'),
      fields: { ...pathFields, legacyOperation: 'unlock-person',
        targetUserId: String(requestFields.confirmUnlockPerson) } }), '', '', '', '', '', '', ''] });
  if (requestFields.confirmDeletePerson) rows.push({ rowHeader: false, cells: [
    tr(translate, 'delete-user-confirm-popup', 'Delete this user?'),
    uiAction({ action: path, label: tr(translate, 'delete', 'Delete'), icon: 'remove',
      fields: { ...pathFields, legacyOperation: 'delete-person',
        targetUserId: String(requestFields.confirmDeletePerson) } }),
    '', '', '', '', '', '', ''] });
  if (requestFields.confirmImpersonatePerson) rows.push({ rowHeader: false, cells: [
    tr(translate, 'impersonate-user', 'Impersonate user'),
    uiAction({ action: path, label: tr(translate, 'impersonate-user', 'Impersonate user'),
      fields: { ...pathFields, legacyOperation: 'impersonate-person',
        targetUserId: String(requestFields.confirmImpersonatePerson) } }),
    '', '', '', '', '', '', ''] });
  rows.push({ rowHeader: false, cells: [
    `${tr(translate, 'page', 'Page')} ${result.page} / ${result.totalPages}`,
    result.page > 1 ? uiAction({ action: path, label: tr(translate, 'previous-page', 'Previous'),
      icon: 'previous', fields: { q: result.search, filter: result.filter,
        page: result.page - 1 } }) : '',
    result.page < result.totalPages ? uiAction({ action: path,
      label: tr(translate, 'next-page', 'Next'), icon: 'next',
      fields: { q: result.search, filter: result.filter, page: result.page + 1 } }) : '',
    '', '', '', '', '', ''] });
  if (requestFields.legacyPeopleResult) rows.push({ rowHeader: false, cells: [
    tr(translate, 'status', 'Status'), requestFields.legacyPeopleResult,
    '', '', '', '', '', '', ''] });
  return { heading: `${tr(translate, 'admin-panel', 'Admin Panel')} / ${tr(translate,
    'people', 'People')} / ${tr(translate, 'people', 'People')}`,
  columns: [tr(translate, 'actions', 'Actions'), tr(translate, 'username', 'Username'),
    tr(translate, 'email', 'Email'), tr(translate, 'admin', 'Admin'),
    tr(translate, 'active-person', 'Active'), tr(translate, 'location', 'Location'),
    tr(translate, 'accounts-lockout-status', 'Lockout status'),
    tr(translate, 'createdAt', 'Created'), tr(translate, 'select-all', 'Select')], rows };
}

async function adminPeopleLockedUsersPage(path, userId, requestFields, translate) {
  if (path !== '/admin/people/locked-users') return null;
  let result;
  try {
    result = await lockoutPageForAdmin(userId, { req: requestFields.req });
  } catch (_) {
    return { heading: tr(translate, 'admin-panel', 'Admin Panel'),
      columns: [tr(translate, 'people', 'People'), tr(translate, 'status', 'Status')],
      rows: [{ cells: [tr(translate, 'accounts-lockout-locked-users', 'Locked users'),
        tr(translate, 'error-notAuthorized', 'Not authorized')] }] };
  }
  const settings = result.settings;
  const rows = [
    { rowHeader: false, cells: [adminPeopleNavigation(translate), '', '', '', '', ''] },
    { rowHeader: false, cells: [tr(translate, 'accounts-lockout-info',
      'Configure failed-login protection and unlock affected users.'), '', '', '', '', ''] },
    { rowHeader: false, cells: [uiFieldsetForm({ action: path,
      legend: tr(translate, 'accounts-lockout-settings', 'Lockout settings'),
      id: 'lockout-settings', inputs: [
        { type: 'number', name: 'knownFailuresBeforeLockout',
          label: `${tr(translate, 'accounts-lockout-known-users', 'Known users')} — ${tr(translate,
            'accounts-lockout-failures-before', 'Failures before lockout')}`,
          value: settings.knownFailuresBeforeLockout, min: 1, max: 10, required: true },
        { type: 'number', name: 'knownLockoutPeriod',
          label: `${tr(translate, 'accounts-lockout-known-users', 'Known users')} — ${tr(translate,
            'accounts-lockout-period', 'Lockout period')}`,
          value: settings.knownLockoutPeriod, min: 10, max: 600, required: true },
        { type: 'number', name: 'knownFailureWindow',
          label: `${tr(translate, 'accounts-lockout-known-users', 'Known users')} — ${tr(translate,
            'accounts-lockout-failure-window', 'Failure window')}`,
          value: settings.knownFailureWindow, min: 1, max: 60, required: true },
        { type: 'number', name: 'unknownFailuresBeforeLockout',
          label: `${tr(translate, 'accounts-lockout-unknown-users', 'Unknown users')} — ${tr(translate,
            'accounts-lockout-failures-before', 'Failures before lockout')}`,
          value: settings.unknownFailuresBeforeLockout, min: 1, max: 10, required: true },
        { type: 'number', name: 'unknownLockoutPeriod',
          label: `${tr(translate, 'accounts-lockout-unknown-users', 'Unknown users')} — ${tr(translate,
            'accounts-lockout-period', 'Lockout period')}`,
          value: settings.unknownLockoutPeriod, min: 10, max: 600, required: true },
        { type: 'number', name: 'unknownFailureWindow',
          label: `${tr(translate, 'accounts-lockout-unknown-users', 'Unknown users')} — ${tr(translate,
            'accounts-lockout-failure-window', 'Failure window')}`,
          value: settings.unknownFailureWindow, min: 1, max: 60, required: true },
      ], fields: { legacyOperation: 'save-lockout-settings' },
      submitLabel: tr(translate, 'save', 'Save'),
    }), '', '', '', '', ''] },
  ];
  if (!result.lockedUsers.length) rows.push({ rowHeader: false, cells: [
    tr(translate, 'accounts-lockout-no-locked-users', 'There are no locked users'),
    '', '', '', '', ''] });
  for (const user of result.lockedUsers) rows.push({ rowHeader: false, cells: [
    user.username, user.email, String(user.failedAttempts), String(user.lockedAddresses),
    `${user.remainingLockTime}s`, uiAction({ action: path,
      label: tr(translate, 'accounts-lockout-click-to-unlock', 'Unlock'),
      fields: { legacyOperation: 'request-unlock-user', targetUserId: user._id } }),
  ] });
  if (result.lockedUsers.length) rows.push({ rowHeader: false, cells: [
    uiAction({ action: path, label: tr(translate, 'accounts-lockout-unlock-all', 'Unlock all'),
      fields: { legacyOperation: 'request-unlock-all' } }), '', '', '', '', ''] });
  if (requestFields.confirmUnlockUser) rows.push({ rowHeader: false, cells: [
    tr(translate, 'accounts-lockout-confirm-unlock', 'Unlock this user?'),
    uiAction({ action: path,
      label: tr(translate, 'accounts-lockout-click-to-unlock', 'Unlock'),
      fields: { legacyOperation: 'unlock-user',
        targetUserId: String(requestFields.confirmUnlockUser) } }), '', '', '', ''] });
  if (requestFields.confirmUnlockAll) rows.push({ rowHeader: false, cells: [
    tr(translate, 'accounts-lockout-confirm-unlock-all', 'Unlock all users?'),
    uiAction({ action: path,
      label: tr(translate, 'accounts-lockout-unlock-all', 'Unlock all'),
      fields: { legacyOperation: 'unlock-all-users' } }), '', '', '', ''] });
  if (requestFields.legacyLockoutResult) rows.push({ rowHeader: false, cells: [
    tr(translate, 'status', 'Status'), requestFields.legacyLockoutResult, '', '', '', ''] });
  return { heading: `${tr(translate, 'admin-panel', 'Admin Panel')} / ${tr(translate,
    'people', 'People')} / ${tr(translate, 'accounts-lockout-locked-users', 'Locked users')}`,
  columns: [tr(translate, 'username', 'Username'), tr(translate, 'email', 'Email'),
    tr(translate, 'accounts-lockout-failed-attempts', 'Failed attempts'),
    tr(translate, 'location-address', 'Addresses'),
    tr(translate, 'accounts-lockout-remaining-time', 'Remaining time'),
    tr(translate, 'actions', 'Actions')], rows };
}

async function adminPeopleSharedTemplatesPage(path, userId, requestFields, translate) {
  if (path !== '/admin/people/shared-templates') return null;
  let templateRows;
  try {
    templateRows = await sharedTemplatesForAdmin(userId, { req: requestFields.req });
  } catch (_) {
    return { heading: tr(translate, 'admin-panel', 'Admin Panel'),
      columns: [tr(translate, 'people', 'People'), tr(translate, 'status', 'Status')],
      rows: [{ cells: [tr(translate, 'shared-templates', 'Shared templates'),
        tr(translate, 'error-notAuthorized', 'Not authorized')] }] };
  }
  const scopes = normalizeSharedTemplateScopes(requestFields.templateScopes);
  const rows = [
    { rowHeader: false, cells: [adminPeopleNavigation(translate), '', '', ''] },
    { rowHeader: false, cells: [tr(translate, 'shared-templates-info',
      'Browse users shared template boards by scope.'), '', '', ''] },
    { rowHeader: false, cells: [uiFieldsetForm({ action: path,
      legend: tr(translate, 'shared-templates', 'Shared templates'),
      id: 'shared-template-scopes',
      inputs: SHARED_TEMPLATE_SCOPES.map(scope => ({ type: 'checkbox',
        name: 'templateScopes', value: scope, checked: scopes.includes(scope),
        label: tr(translate, SHARED_TEMPLATE_SCOPE_LABELS[scope], scope) })),
      fields: { legacyOperation: 'filter-shared-templates' },
      submitLabel: tr(translate, 'filter', 'Filter'),
    }), '', '', ''] },
  ];
  if (!scopes.length) rows.push({ rowHeader: false, cells: [
    tr(translate, 'shared-templates-select-scope',
      'Select a scope above to show shared templates.'), '', '', '',
  ] });
  for (const scope of scopes) {
    const scopeLabel = tr(translate, SHARED_TEMPLATE_SCOPE_LABELS[scope], scope);
    const groups = buildSharedTemplateScopeGroups(scope, templateRows);
    if (!groups.length) rows.push({ cells: [scopeLabel,
      tr(translate, 'no-shared-templates', 'No shared templates'), '', ''] });
    for (const group of groups) for (const member of group.members) {
      if (!member.templateBoards.length) rows.push({ cells: [scopeLabel,
        group.groupName, member.label, tr(translate, 'no-shared-templates',
          'No shared templates')] });
      for (const board of member.templateBoards) rows.push({ cells: [scopeLabel,
        group.groupName, member.label, board.url ? uiAction({ action: board.url,
          label: board.title || tr(translate, 'board', 'Board') })
          : board.title || tr(translate, 'board', 'Board')] });
    }
  }
  return { heading: `${tr(translate, 'admin-panel', 'Admin Panel')} / ${tr(translate,
    'people', 'People')} / ${tr(translate, 'shared-templates', 'Shared templates')}`,
  columns: [tr(translate, 'type', 'Scope'), tr(translate, 'name', 'Group'),
    tr(translate, 'username', 'User'), tr(translate, 'board', 'Board')], rows };
}

async function adminPeopleBaselinePage(path, userId, translate) {
  const match = /^\/admin\/people\/([^/]+)$/.exec(path);
  const slug = match?.[1] || '';
  if (!Object.prototype.hasOwnProperty.call(ADMIN_PAGES.people.panes, slug)) return null;
  const user = userId && await Meteor.users.findOneAsync(userId, {
    fields: { isAdmin: 1 },
  });
  if (!user?.isAdmin) return { heading: tr(translate, 'admin-panel', 'Admin Panel'),
    columns: [tr(translate, 'people', 'People'), tr(translate, 'status', 'Status')],
    rows: [{ cells: [tr(translate, 'error-notAuthorized', 'Not authorized'), ''] }] };
  const title = ADMIN_PANE_TITLES.people[slug] || {};
  const label = title.title || tr(translate, title.titleKey || slug, slug);
  return {
    heading: `${tr(translate, 'admin-panel', 'Admin Panel')} / ${tr(translate, 'people', 'People')} / ${label}`,
    columns: [tr(translate, 'people', 'People'), tr(translate, 'status', 'Status')],
    rows: [{ rowHeader: false, cells: [adminPeopleNavigation(translate), ''] },
      { cells: [label, tr(translate, 'info', 'Info')] }],
  };
}

async function adminProblemsPerformancePage(path, userId, translate) {
  if (path !== '/admin/problems/performance') return null;
  const user = userId && await Meteor.users.findOneAsync(userId, {
    fields: { isAdmin: 1 },
  });
  if (!user?.isAdmin) return {
    heading: tr(translate, 'admin-panel', 'Admin Panel'),
    columns: [tr(translate, 'problems', 'Problems'),
      tr(translate, 'status', 'Status')],
    rows: [{ cells: [tr(translate, 'features-performance', 'Performance'),
      tr(translate, 'error-notAuthorized', 'Not authorized')] }],
  };
  return {
    heading: `${tr(translate, 'admin-panel', 'Admin Panel')} / ${tr(translate, 'problems', 'Problems')} / ${tr(translate, 'features-performance', 'Performance')}`,
    columns: [tr(translate, 'name', 'Name'),
      tr(translate, 'description', 'Description')],
    rows: [
      { rowHeader: false, cells: [tr(translate, 'problems', 'Problems'),
        adminProblemsNavigation(translate)] },
      { cells: [tr(translate, 'cards-loading', 'Card loading'),
        tr(translate, 'cards-loading-description',
          'WeKan loads board cards automatically according to board size.')] },
    ],
  };
}

const SECURITY_FEATURE_ROWS = [
  ['renderLinksAsPlainText', 'render-links-as-plain-text',
    'render-links-as-plain-text-description'],
  ['alwaysShowCodeAsText', 'always-show-code-as-text',
    'always-show-code-as-text-description'],
  ['disableAllImport', 'disable-all-import', 'disable-all-import-description'],
  ['disableAllExport', 'disable-all-export', 'disable-all-export-description'],
  ['disableImportAvatars', 'disable-import-avatars',
    'disable-import-avatars-description'],
  ['disableExportAvatars', 'disable-export-avatars',
    'disable-export-avatars-description'],
  ['anonymizeImportUsers', 'anonymize-import-users',
    'anonymize-import-users-description'],
  ['anonymizeExportUsers', 'anonymize-export-users',
    'anonymize-export-users-description'],
];

async function adminProblemsSecurityPage(path, userId, requestFields, translate) {
  if (path !== '/admin/problems/security') return null;
  let settings;
  try {
    settings = await securityFeatureSettingsForAdmin(userId);
  } catch (error) {
    if (error?.error !== 'not-authorized') throw error;
    return {
      heading: tr(translate, 'admin-panel', 'Admin Panel'),
      columns: [tr(translate, 'problems', 'Problems'),
        tr(translate, 'status', 'Status')],
      rows: [{ cells: [tr(translate, 'features-security', 'Security'),
        tr(translate, 'error-notAuthorized', 'Not authorized')] }],
    };
  }
  const columns = [tr(translate, 'settings', 'Settings'),
    tr(translate, 'description', 'Description'), tr(translate, 'status', 'Status')];
  const rows = [
    { rowHeader: false, colspanLast: columns.length - 1,
      cells: [tr(translate, 'problems', 'Problems'),
        adminProblemsNavigation(translate)] },
  ];
  if (requestFields.legacySecurityResult) rows.push({
    rowHeader: false, colspanLast: columns.length - 1,
    cells: [tr(translate, 'status', 'Status'),
      tr(translate, 'done', requestFields.legacySecurityResult)],
  });
  for (const [field, labelKey, descriptionKey] of SECURITY_FEATURE_ROWS) {
    const enabled = settings[field] === true;
    rows.push({ cells: [
      tr(translate, labelKey, labelKey),
      tr(translate, descriptionKey, descriptionKey),
      uiSelectForm({
        action: path,
        label: tr(translate, labelKey, labelKey),
        name: 'enabled',
        value: enabled ? 'true' : 'false',
        options: [
          { value: 'true', label: tr(translate, 'yes', 'Yes') },
          { value: 'false', label: tr(translate, 'no', 'No') },
        ],
        fields: { legacyOperation: 'set-security-feature', settingField: field },
        submitLabel: tr(translate, 'save', 'Save'),
      }),
    ] });
  }
  return {
    heading: `${tr(translate, 'admin-panel', 'Admin Panel')} / ${tr(translate, 'problems', 'Problems')} / ${tr(translate, 'features-security', 'Security')}`,
    columns, rows,
  };
}

async function adminProblemsDeletePage(path, userId, requestFields, translate) {
  if (path !== '/admin/problems/delete') return null;
  let enabled;
  try {
    enabled = await permanentDeleteSettingForAdmin(userId);
  } catch (error) {
    if (error?.error !== 'not-authorized') throw error;
    return {
      heading: tr(translate, 'admin-panel', 'Admin Panel'),
      columns: [tr(translate, 'problems', 'Problems'),
        tr(translate, 'status', 'Status')],
      rows: [{ cells: [tr(translate, 'delete', 'Delete'),
        tr(translate, 'error-notAuthorized', 'Not authorized')] }],
    };
  }
  const columns = [tr(translate, 'settings', 'Settings'),
    tr(translate, 'description', 'Description'), tr(translate, 'status', 'Status')];
  const rows = [
    { rowHeader: false, colspanLast: columns.length - 1,
      cells: [tr(translate, 'problems', 'Problems'),
        adminProblemsNavigation(translate)] },
  ];
  if (requestFields.legacyDeleteResult) rows.push({
    rowHeader: false, colspanLast: columns.length - 1,
    cells: [tr(translate, 'status', 'Status'), requestFields.legacyDeleteResult],
  });
  rows.push({ cells: [
    tr(translate, 'enable-permanent-delete', 'Enable permanent delete'),
    [tr(translate, 'enable-permanent-delete-description',
      'Allow Global Admins to permanently delete soft-deleted data.'),
    PERMANENT_DELETE_RECOVERY_DESCRIPTION],
    uiSelectForm({
      action: path,
      label: tr(translate, 'enable-permanent-delete', 'Enable permanent delete'),
      name: 'enabled',
      value: enabled ? 'true' : 'false',
      options: [
        { value: 'true', label: tr(translate, 'yes', 'Yes') },
        { value: 'false', label: tr(translate, 'no', 'No') },
      ],
      fields: { legacyOperation: 'set-permanent-delete' },
      submitLabel: tr(translate, 'save', 'Save'),
    }),
  ] });
  return {
    heading: `${tr(translate, 'admin-panel', 'Admin Panel')} / ${tr(translate, 'problems', 'Problems')} / ${tr(translate, 'delete', 'Delete')}`,
    columns, rows,
  };
}

const NOTIFICATION_FEATURE_ROWS = [
  ['disableActivities', 'disable-activities', 'disable-activities-description'],
  ['disableNotifications', 'disable-notifications',
    'disable-notifications-description'],
  ['disableWatch', 'disable-watch', 'disable-watch-description'],
];

async function adminProblemsNotificationsPage(path, userId, requestFields, translate) {
  if (path !== '/admin/problems/notifications') return null;
  let settings;
  try {
    settings = await notificationFeatureSettingsForAdmin(userId);
  } catch (error) {
    if (error?.error !== 'not-authorized') throw error;
    return {
      heading: tr(translate, 'admin-panel', 'Admin Panel'),
      columns: [tr(translate, 'problems', 'Problems'),
        tr(translate, 'status', 'Status')],
      rows: [{ cells: [tr(translate, 'features-notifications', 'Notifications'),
        tr(translate, 'error-notAuthorized', 'Not authorized')] }],
    };
  }
  const columns = [tr(translate, 'settings', 'Settings'),
    tr(translate, 'description', 'Description'), tr(translate, 'status', 'Status')];
  const rows = [
    { rowHeader: false, colspanLast: columns.length - 1,
      cells: [tr(translate, 'problems', 'Problems'),
        adminProblemsNavigation(translate)] },
  ];
  if (requestFields.legacyNotificationsResult) rows.push({
    rowHeader: false, colspanLast: columns.length - 1,
    cells: [tr(translate, 'status', 'Status'),
      requestFields.legacyNotificationsResult],
  });
  for (const [field, labelKey, descriptionKey] of NOTIFICATION_FEATURE_ROWS) {
    rows.push({ cells: [
      tr(translate, labelKey, labelKey), tr(translate, descriptionKey, descriptionKey),
      uiSelectForm({
        action: path,
        label: tr(translate, labelKey, labelKey),
        name: 'enabled',
        value: settings[field] ? 'true' : 'false',
        options: [
          { value: 'true', label: tr(translate, 'yes', 'Yes') },
          { value: 'false', label: tr(translate, 'no', 'No') },
        ],
        fields: { legacyOperation: 'set-notification-feature', settingField: field },
        submitLabel: tr(translate, 'save', 'Save'),
      }),
    ] });
  }
  return {
    heading: `${tr(translate, 'admin-panel', 'Admin Panel')} / ${tr(translate, 'problems', 'Problems')} / ${tr(translate, 'features-notifications', 'Notifications')}`,
    columns, rows,
  };
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

async function adminProblemsBrokenCardsPage(path, userId, requestFields, translate) {
  if (path !== '/admin/problems/broken-cards') return null;
  const search = String(requestFields.q || '').trim().slice(0, 500);
  const requestedPage = Math.max(1,
    Math.min(100000, parseInt(requestFields.page, 10) || 1));
  const perPage = 10;
  let report;
  let total;
  try {
    [report, total] = await Promise.all([
      brokenCardsReportForAdmin(userId, {
        search, limit: perPage, skip: (requestedPage - 1) * perPage,
      }),
      brokenCardsReportCountForAdmin(userId, search),
    ]);
  } catch (error) {
    if (error?.error !== 'not-authorized') throw error;
    return {
      heading: tr(translate, 'admin-panel', 'Admin Panel'),
      columns: [tr(translate, 'problems', 'Problems'),
        tr(translate, 'status', 'Status')],
      rows: [{ cells: [tr(translate, 'broken-cards', 'Broken Cards'),
        tr(translate, 'error-notAuthorized', 'Not authorized')] }],
    };
  }
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(requestedPage, totalPages);
  if (page !== requestedPage) report = await brokenCardsReportForAdmin(userId, {
    search, limit: perPage, skip: (page - 1) * perPage,
  });
  const named = documents => new Map(documents.map(document => [
    document._id, document.title || document._id,
  ]));
  const boards = named(report.boards);
  const swimlanes = named(report.swimlanes);
  const lists = named(report.lists);
  const unknown = tr(translate, 'no-name', '(Unknown)');
  const columns = ['Card Title', 'Id', 'Board', 'Swimlane', 'List', 'Type',
    tr(translate, 'createdAt', 'Created at')];
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
    card.title || '', card._id,
    boards.get(card.boardId) || card.boardId || unknown,
    swimlanes.get(card.swimlaneId) || card.swimlaneId || unknown,
    lists.get(card.listId) || card.listId || unknown,
    card.type || unknown, eventDate(card.createdAt),
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
    heading: `${tr(translate, 'admin-panel', 'Admin Panel')} / ${tr(translate, 'problems', 'Problems')} / ${tr(translate, 'broken-cards', 'Broken Cards')}`,
    columns, rows,
  };
}

async function adminProblemsFilesPage(path, userId, requestFields, translate) {
  if (path !== '/admin/problems/files') return null;
  const search = String(requestFields.q || '').trim().slice(0, 500);
  const requestedPage = Math.max(1,
    Math.min(100000, parseInt(requestFields.page, 10) || 1));
  const perPage = 10;
  let report;
  let total;
  try {
    [report, total] = await Promise.all([
      attachmentsReportForAdmin(userId, {
        search, limit: perPage, skip: (requestedPage - 1) * perPage,
      }),
      attachmentsReportCountForAdmin(userId, search),
    ]);
  } catch (error) {
    if (error?.error !== 'not-authorized') throw error;
    return {
      heading: tr(translate, 'admin-panel', 'Admin Panel'),
      columns: [tr(translate, 'problems', 'Problems'),
        tr(translate, 'status', 'Status')],
      rows: [{ cells: [tr(translate, 'filesReportTitle', 'Files Report'),
        tr(translate, 'error-notAuthorized', 'Not authorized')] }],
    };
  }
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(requestedPage, totalPages);
  if (page !== requestedPage) report = await attachmentsReportForAdmin(userId, {
    search, limit: perPage, skip: (page - 1) * perPage,
  });
  const permanentDelete = getFeatureFlags().enablePermanentDelete === true;
  const columns = [tr(translate, 'preview', 'Preview'), 'Filename', 'Size (kB)',
    'MIME Type', 'Attachment ID', 'Board ID', 'Card ID'];
  const rows = [
    { rowHeader: false, colspanLast: columns.length - 1,
      cells: [tr(translate, 'problems', 'Problems'),
        adminProblemsNavigation(translate)] },
    { rowHeader: false, colspanLast: columns.length - 1,
      cells: [tr(translate, 'filesReportTitle', 'Files Report'),
        'The permanent-delete setting must be enabled before a delete control is shown. Recovery logs setting changes and every successful, failed, or unauthorized permanent-delete attempt, including available identity, network address and location.'] },
    { rowHeader: false, colspanLast: columns.length - 1,
      cells: [tr(translate, 'search', 'Search'), uiSearchForm({
        action: path, label: tr(translate, 'search', 'Search'), value: search,
      })] },
  ];
  if (requestFields.legacyFilesResult) rows.push({
    rowHeader: false, colspanLast: columns.length - 1,
    cells: [tr(translate, 'status', 'Status'), requestFields.legacyFilesResult.ok
      ? tr(translate, 'done', 'Done')
      : tr(translate, requestFields.legacyFilesResult.errorKey, 'Operation failed')],
  });
  for (const attachment of report.attachments) {
    const name = cleanFileName(attachment.name);
    const kind = attachmentKind(attachment);
    const responseFields = { attachmentId: attachment._id };
    const actions = [];
    if (kind.isImage) actions.push({
      action: path, label: tr(translate, 'preview', 'Preview'),
      icon: 'caret-right', target: '_blank',
      authPurpose: `download:admin-gif-${attachment._id}`,
      fields: { ...responseFields, legacyOperation: 'preview-admin-attachment-gif' },
    });
    actions.push({
      action: path, label: tr(translate, 'download', 'Download'),
      icon: 'move-down', target: '_blank',
      authPurpose: `download:admin-original-${attachment._id}`,
      fields: { ...responseFields, legacyOperation: 'download-admin-attachment-original' },
    });
    const confirming = requestFields.confirmPermanentAttachmentDelete === attachment._id;
    if (permanentDelete) actions.push(confirming ? {
      action: path, label: tr(translate, 'delete', 'Delete'), icon: 'remove',
      fields: { attachmentId: attachment._id, q: search, page,
        legacyOperation: 'permanently-delete-admin-attachment' },
    } : {
      action: path, label: `${tr(translate, 'delete', 'Delete')}?`, icon: 'remove',
      fields: { attachmentId: attachment._id, q: search, page,
        legacyOperation: 'confirm-permanently-delete-admin-attachment' },
    });
    rows.push({ cells: [uiAttachment({
      name, type: attachment.type || 'application/octet-stream',
      size: Number(attachment.size) || 0, actions,
    }), name, (Number(attachment.size) / 1024).toFixed(1), attachment.type || '',
    attachment._id, attachment.meta?.boardId || '', attachment.meta?.cardId || ''] });
  }
  if (!report.attachments.length) rows.push({ rowHeader: false,
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
    heading: `${tr(translate, 'admin-panel', 'Admin Panel')} / ${tr(translate, 'problems', 'Problems')} / ${tr(translate, 'filesReportTitle', 'Files Report')}`,
    columns, rows,
  };
}

async function adminProblemsRulesPage(path, userId, requestFields, translate) {
  if (path !== '/admin/problems/rules') return null;
  const search = String(requestFields.q || '').trim().slice(0, 500);
  const requestedPage = Math.max(1,
    Math.min(100000, parseInt(requestFields.page, 10) || 1));
  const perPage = 10;
  let report;
  let total;
  try {
    [report, total] = await Promise.all([
      rulesReportForAdmin(userId, {
        search, limit: perPage, skip: (requestedPage - 1) * perPage,
      }),
      rulesReportCountForAdmin(userId, search),
    ]);
  } catch (error) {
    if (error?.error !== 'not-authorized') throw error;
    return {
      heading: tr(translate, 'admin-panel', 'Admin Panel'),
      columns: [tr(translate, 'problems', 'Problems'),
        tr(translate, 'status', 'Status')],
      rows: [{ cells: [tr(translate, 'rulesReportTitle', 'Rules Report'),
        tr(translate, 'error-notAuthorized', 'Not authorized')] }],
    };
  }
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(requestedPage, totalPages);
  if (page !== requestedPage) report = await rulesReportForAdmin(userId, {
    search, limit: perPage, skip: (page - 1) * perPage,
  });
  const named = (documents, field) => new Map(documents.map(document => [
    document._id, document[field] || document._id,
  ]));
  const boards = named(report.boards, 'title');
  const actions = named(report.actions, 'actionType');
  const triggers = named(report.triggers, 'activityType');
  const unknown = tr(translate, 'no-name', '(Unknown)');
  const columns = ['Rule Title', 'Board Title', 'actionType', 'activityType'];
  const rows = [
    { rowHeader: false, colspanLast: columns.length - 1,
      cells: [tr(translate, 'problems', 'Problems'),
        adminProblemsNavigation(translate)] },
    { rowHeader: false, colspanLast: columns.length - 1,
      cells: [tr(translate, 'search', 'Search'), uiSearchForm({
        action: path, label: tr(translate, 'search', 'Search'), value: search,
      })] },
  ];
  for (const rule of report.rules) rows.push({ cells: [
    rule.title || '', boards.get(rule.boardId) || rule.boardId || unknown,
    actions.get(rule.actionId) || rule.actionId || unknown,
    triggers.get(rule.triggerId) || rule.triggerId || unknown,
  ] });
  if (!report.rules.length) rows.push({ rowHeader: false,
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
    heading: `${tr(translate, 'admin-panel', 'Admin Panel')} / ${tr(translate, 'problems', 'Problems')} / ${tr(translate, 'rulesReportTitle', 'Rules Report')}`,
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
  if (['/', '/sign-in', '/sign-up', '/forgot-password', '/send-again'].includes(path)
    || /^\/(?:reset-password|enroll-account|verify-email)\/[^/]+$/.test(path)) return null;
  if (path === '/public') return boardsPage(path, userId, true, requestFields, translate);
  const information = await informationPage(path, userId, translate);
  if (information) return information;
  const accountProfile = await accountProfilePage(path, userId, requestFields, translate);
  if (accountProfile) return accountProfile;
  const accountLanguage = await accountLanguagePage(path, userId, requestFields, translate);
  if (accountLanguage) return accountLanguage;
  const accountPassword = await accountPasswordPage(path, userId, requestFields, translate);
  if (accountPassword) return accountPassword;
  const accountSettings = await accountSettingsPage(path, userId, requestFields, translate);
  if (accountSettings) return accountSettings;
  const accountAppearance = await accountAppearancePage(path, userId, requestFields, translate);
  if (accountAppearance) return accountAppearance;
  const accountAvatar = await accountAvatarPage(path, userId, requestFields, translate);
  if (accountAvatar) return accountAvatar;
  const accountInvitation = await accountInvitationPage(path, userId, requestFields, translate);
  if (accountInvitation) return accountInvitation;
  const accountLogout = accountLogoutPage(path, userId, translate);
  if (accountLogout) return accountLogout;
  const discovery = await cardDiscoveryPage(path, userId, requestFields, translate);
  if (discovery) return discovery;
  const importer = await importPage(path, userId, requestFields, translate);
  if (importer) return importer;
  const adminSettingsVersion = await adminSettingsVersionPage(
    path, userId, requestFields, translate,
  );
  if (adminSettingsVersion) return adminSettingsVersion;
  const adminSettingsAnnouncement = await adminSettingsAnnouncementPage(
    path, userId, requestFields, translate,
  );
  if (adminSettingsAnnouncement) return adminSettingsAnnouncement;
  const adminSettingsAccessibility = await adminSettingsAccessibilityPage(
    path, userId, requestFields, translate,
  );
  if (adminSettingsAccessibility) return adminSettingsAccessibility;
  const adminSettingsPwa = await adminSettingsPwaPage(
    path, userId, requestFields, translate,
  );
  if (adminSettingsPwa) return adminSettingsPwa;
  const adminSettingsGlobalWebhooks = await adminSettingsGlobalWebhooksPage(
    path, userId, requestFields, translate,
  );
  if (adminSettingsGlobalWebhooks) return adminSettingsGlobalWebhooks;
  const adminSettingsVisibility = await adminSettingsVisibilityPage(
    path, userId, requestFields, translate,
  );
  if (adminSettingsVisibility) return adminSettingsVisibility;
  const adminSettingsTranslation = await adminSettingsTranslationPage(
    path, userId, requestFields, translate,
  );
  if (adminSettingsTranslation) return adminSettingsTranslation;
  const adminPeopleRoles = await adminPeopleRolesPage(path, userId, requestFields, translate);
  if (adminPeopleRoles) return adminPeopleRoles;
  const adminPeopleLogin = await adminPeopleLoginPage(path, userId, requestFields, translate);
  if (adminPeopleLogin) return adminPeopleLogin;
  const adminPeopleEmail = await adminPeopleEmailPage(path, userId, requestFields, translate);
  if (adminPeopleEmail) return adminPeopleEmail;
  const adminPeopleDomains = await adminPeopleDomainsPage(path, userId, requestFields, translate);
  if (adminPeopleDomains) return adminPeopleDomains;
  const adminPeopleOrganizations = await adminPeopleOrganizationsPage(
    path, userId, requestFields, translate);
  if (adminPeopleOrganizations) return adminPeopleOrganizations;
  const adminPeopleTeams = await adminPeopleTeamsPage(path, userId, requestFields, translate);
  if (adminPeopleTeams) return adminPeopleTeams;
  const adminPeoplePeople = await adminPeoplePeoplePage(path, userId, requestFields, translate);
  if (adminPeoplePeople) return adminPeoplePeople;
  const adminPeopleLockedUsers = await adminPeopleLockedUsersPage(
    path, userId, requestFields, translate);
  if (adminPeopleLockedUsers) return adminPeopleLockedUsers;
  const adminPeopleSharedTemplates = await adminPeopleSharedTemplatesPage(
    path, userId, requestFields, translate,
  );
  if (adminPeopleSharedTemplates) return adminPeopleSharedTemplates;
  const adminPeopleBaseline = await adminPeopleBaselinePage(path, userId, translate);
  if (adminPeopleBaseline) return adminPeopleBaseline;
  const adminAttachmentsCore = await adminAttachmentsCorePage(
    path, userId, requestFields, translate,
  );
  if (adminAttachmentsCore) return adminAttachmentsCore;
  const adminAttachmentsMove = await adminAttachmentsMovePage(
    path, userId, requestFields, translate,
  );
  if (adminAttachmentsMove) return adminAttachmentsMove;
  const adminAttachmentsLocalStorage = await adminAttachmentsLocalStoragePage(
    path, userId, requestFields, translate,
  );
  if (adminAttachmentsLocalStorage) return adminAttachmentsLocalStorage;
  const adminAttachmentsCloud = await adminAttachmentsCloudPage(
    path, userId, requestFields, translate,
  );
  if (adminAttachmentsCloud) return adminAttachmentsCloud;
  const adminAttachmentsDatabaseMigration = await adminAttachmentsDatabaseMigrationPage(
    path, userId, requestFields, translate,
  );
  if (adminAttachmentsDatabaseMigration) return adminAttachmentsDatabaseMigration;
  const adminAttachmentsBackup = await adminAttachmentsBackupPage(
    path, userId, requestFields, translate,
  );
  if (adminAttachmentsBackup) return adminAttachmentsBackup;
  const adminAttachmentsBaseline = await adminAttachmentsBaselinePage(path, userId, translate);
  if (adminAttachmentsBaseline) return adminAttachmentsBaseline;
  const adminProblemsSummary = await adminProblemsSummaryPage(
    path, userId, requestFields, translate,
  );
  if (adminProblemsSummary) return adminProblemsSummary;
  const adminProblemsPerformance = await adminProblemsPerformancePage(
    path, userId, translate,
  );
  if (adminProblemsPerformance) return adminProblemsPerformance;
  const adminProblemsSecurity = await adminProblemsSecurityPage(
    path, userId, requestFields, translate,
  );
  if (adminProblemsSecurity) return adminProblemsSecurity;
  const adminProblemsDelete = await adminProblemsDeletePage(
    path, userId, requestFields, translate,
  );
  if (adminProblemsDelete) return adminProblemsDelete;
  const adminProblemsNotifications = await adminProblemsNotificationsPage(
    path, userId, requestFields, translate,
  );
  if (adminProblemsNotifications) return adminProblemsNotifications;
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
  const adminProblemsBrokenCards = await adminProblemsBrokenCardsPage(
    path, userId, requestFields, translate,
  );
  if (adminProblemsBrokenCards) return adminProblemsBrokenCards;
  const adminProblemsFiles = await adminProblemsFilesPage(
    path, userId, requestFields, translate,
  );
  if (adminProblemsFiles) return adminProblemsFiles;
  const adminProblemsRules = await adminProblemsRulesPage(
    path, userId, requestFields, translate,
  );
  if (adminProblemsRules) return adminProblemsRules;
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
    statusCode: 404,
    heading: tr(translate, 'page-not-found', 'Page not found'),
    columns: [tr(translate, 'page', 'Page'), tr(translate, 'status', 'Status')],
    rows: [{ cells: [uiStatus({ subject: path,
      status: tr(translate, 'page-not-found', 'Page not found') }), ''] }],
  };
}
