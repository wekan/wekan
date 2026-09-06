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
import Attachments from '/models/attachments';
import CustomFields from '/models/customFields';
import { CustomFieldStringTemplate } from '/imports/lib/customFields';
import { cleanFileName } from '/imports/lib/fileNameDisplay';
import { attachmentKind } from '/models/lib/attachmentKind';
import getSlug from 'limax';
import {
  allowIsBoardAdmin,
  allowIsBoardMemberCommentOnly,
  allowIsBoardMemberWithWriteAccess,
} from '/server/lib/utils';
import { canEditCardOrLinkedCard } from '/server/lib/linkedCardPermission';
import { canUserSeeBoard } from '/server/lib/visibleBoardIds';
import { getFeatureFlags } from '/models/lib/featureFlags';
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
const { buildCustomFieldsWD } = require('/models/lib/customFieldsWD');
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

function tr(translate, key, fallback) {
  const value = typeof translate === 'function' ? translate(key) : '';
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
  const rows = [];
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
  const [comments, commentReactionDocs, checklistItems, attachments, customFieldDefinitions,
    dependencyTargetCards, dependencyCandidateCards] = await Promise.all([
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
  ]);
  const personIds = [...new Set([
    card.userId, contentCard?.userId, ...(card.members || []), ...(card.assignees || []),
    ...(contentCard?.members || []), ...(contentCard?.assignees || []),
    ...(card.requesters || []), ...(card.assigners || []),
    ...(contentCard?.requesters || []), ...(contentCard?.assigners || []),
    ...activeContentMemberIds,
    ...comments.map(comment => comment.userId),
    ...commentReactionDocs.flatMap(doc => (doc.reactions || [])
      .flatMap(reaction => reaction.userIds || [])),
    ...(contentCard?.vote?.positive || []), ...(contentCard?.vote?.negative || []),
    ...POKER_STATES.flatMap(state => contentCard?.poker?.[state] || []),
  ].filter(Boolean))];
  const [list, swimlane, people, activeLists, currentUser] = await Promise.all([
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
  ]);
  const personById = new Map(people.map(person => [person._id,
    person.profile?.fullname || person.username || person._id]));
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
  if (!['/my-cards', '/due-cards', '/global-search'].includes(path)) return null;
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
  if (path === '/global-search') {
    const query = String(requestFields.q || '').trim().slice(0, 200);
    if (query) {
      const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      selector.$and = [{ $or: [{ title: new RegExp(escaped, 'i') }, { description: new RegExp(escaped, 'i') }] }];
    } else selector._id = null;
  }
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
  if (path === '/global-search') rows.unshift({ rowHeader: false, cells: [uiSearchForm({
    action: path, label: tr(translate, 'globalSearch-title', 'Search All Boards'), value: requestFields.q,
  }), '', ''] });
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

export async function legacyHtml4Page(path, userId, requestFields = {}, translate) {
  if (path === '/' || path === '/sign-in' || path === '/sign-up') return null;
  if (path === '/public') return boardsPage(path, userId, true, requestFields, translate);
  const information = await informationPage(path, userId, translate);
  if (information) return information;
  const discovery = await cardDiscoveryPage(path, userId, requestFields, translate);
  if (discovery) return discovery;
  const importer = await importPage(path, userId, requestFields, translate);
  if (importer) return importer;
  if (/^\/(?:allboards|templates|remaining|archive)(?:\/|$)/.test(path)) {
    return boardsPage(path, userId, false, requestFields, translate);
  }
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
