import { Meteor } from 'meteor/meteor';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import Settings from '/models/settings';
import AccessibilitySettings from '/models/accessibilitySettings';
import CardComments from '/models/cardComments';
import Checklists from '/models/checklists';
import ChecklistItems from '/models/checklistItems';
import Attachments from '/models/attachments';
import { cleanFileName } from '/imports/lib/fileNameDisplay';
const { UI_ICONS, uiAction, uiLink, uiSearchForm } = require('/imports/lib/uiComponentLibrary');
const { KEYBOARD_SHORTCUT_MAPPINGS } = require('/imports/lib/keyboardShortcutMappings');
const { starredPagesOf } = require('/models/lib/starredPages');
const { boardCardScope, assignedOnlyCardScope } = require('/models/lib/boardCardScope');

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

async function boardsPage(userId, publicOnly = false, translate) {
  let boards;
  if (publicOnly) {
    boards = await Boards.find({ permission: 'public', archived: { $ne: true }, type: 'board' }, {
      fields: { title: 1, slug: 1, color: 1, customThemeColors: 1, permission: 1 },
      sort: { title: 1 }, limit: 200,
    }).fetchAsync();
  } else if (userId) {
    boards = await Boards.userBoards(userId, false, {}, {
      fields: { title: 1, slug: 1, color: 1, customThemeColors: 1, permission: 1 },
      sort: { title: 1 }, limit: 200,
    });
  } else boards = [];
  return {
    heading: publicOnly ? tr(translate, 'public-boards', 'Public Boards') : tr(translate, 'all-boards', 'All Boards'),
    columns: [tr(translate, 'board', 'Board'), tr(translate, 'change-permissions', 'Permissions')],
    empty: tr(translate, 'no-boards-selected', 'No boards'),
    rows: boards.map(board => ({
      color: boardColor(board), boardTheme: true,
      cells: [userId
        ? uiAction({ action: boardPath(board), label: board.title || 'Board' })
        : uiLink({ href: boardPath(board), label: board.title || 'Board' }), board.permission || ''],
    })),
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
  const cardMatch = /^\/b\/[^/]+\/[^/]+\/([^/]+)$/.exec(path);
  if (cardMatch) return cardDetailsPage(board, segment(cardMatch[1]), userId, translate);
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
    const otherSwimlaneIds = swimlanes.filter(item => item._id !== firstSwimlane?._id).map(item => item._id);
    const cards = await Cards.find({
      boardId: board._id, listId: firstList._id, archived: { $ne: true },
      deletedAt: null,
      ...(firstSwimlane ? { swimlaneId: { $nin: otherSwimlaneIds } } : {}),
    }, { fields: { title: 1, color: 1, sort: 1 }, sort: { sort: 1 }, limit: 200 }).fetchAsync();
    for (const card of cards) rows.push({
      color: card.color,
      cells: [card.title || '(untitled card)', userId ? uiAction({
        action: `${boardPath(board)}/${encodeURIComponent(card._id)}`,
        label: tr(translate, 'card', 'Card'),
      }) : uiLink({
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

async function cardDetailsPage(board, cardId, userId, translate) {
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
    listId: 1, swimlaneId: 1, labelIds: 1, members: 1, assignees: 1,
    requesters: 1, assigners: 1, requestedBy: 1, assignedBy: 1, userId: 1,
    receivedAt: 1, startAt: 1, dueAt: 1, endAt: 1, createdAt: 1, modifiedAt: 1,
  } });
  if (!card) return {
    heading: tr(translate, 'card', 'Card'),
    columns: [tr(translate, 'status', 'Status'), tr(translate, 'action', 'Action')],
    rows: [], empty: 'Card not found or access denied.',
  };
  const checklists = await Checklists.find({ cardId: card._id, boardId: card.boardId }, {
    fields: { title: 1, sort: 1 }, sort: { sort: 1 }, limit: 200,
  }).fetchAsync();
  const checklistIds = checklists.map(checklist => checklist._id);
  const [comments, checklistItems, attachments] = await Promise.all([
    CardComments.find({ cardId: card._id, boardId: card.boardId }, {
      fields: { text: 1, userId: 1, createdAt: 1 }, sort: { createdAt: 1 }, limit: 500,
    }).fetchAsync(),
    ChecklistItems.find({ cardId: card._id, boardId: card.boardId,
      checklistId: { $in: checklistIds } }, {
      fields: { title: 1, isFinished: 1, checklistId: 1, sort: 1 }, sort: { sort: 1 }, limit: 2000,
    }).fetchAsync(),
    Attachments.collection.find({ 'meta.cardId': card._id, 'meta.boardId': card.boardId }, {
      fields: { name: 1, type: 1, size: 1, uploadedAt: 1 }, sort: { uploadedAt: 1 }, limit: 500,
    }).fetchAsync(),
  ]);
  const personIds = [...new Set([
    card.userId, ...(card.members || []), ...(card.assignees || []),
    ...(card.requesters || []), ...(card.assigners || []),
    ...comments.map(comment => comment.userId),
  ].filter(Boolean))];
  const [list, swimlane, people] = await Promise.all([
    Lists.findOneAsync({ _id: card.listId, boardId: card.boardId }, { fields: { title: 1 } }),
    Swimlanes.findOneAsync({ _id: card.swimlaneId, boardId: card.boardId }, { fields: { title: 1 } }),
    Meteor.users.find({ _id: { $in: personIds } }, {
      fields: { username: 1, 'profile.fullname': 1 },
    }).fetchAsync(),
  ]);
  const personById = new Map(people.map(person => [person._id,
    person.profile?.fullname || person.username || person._id]));
  const names = values => (values || []).map(id => personById.get(id) || id).join(', ');
  const labels = (board.labels || []).filter(label => (card.labelIds || []).includes(label._id));
  const rows = [
    { color: card.color, cells: [tr(translate, 'title', 'Title'), card.title || ''] },
    { cells: [tr(translate, 'board', 'Board'), board.title || ''] },
    { cells: [tr(translate, 'list', 'List'), list?.title || ''] },
    { cells: ['Swimlane', swimlane?.title || ''] },
    { cells: [tr(translate, 'description', 'Description'), card.description || ''] },
    { cells: [tr(translate, 'labels', 'Labels'), labels.map(label => label.name || label.color).join(', ')] },
    { cells: [tr(translate, 'members', 'Members'), names(card.members)] },
    { cells: [tr(translate, 'assignee', 'Assignee'), names(card.assignees)] },
    { cells: [tr(translate, 'requested-by', 'Requested By'), names(card.requesters) || card.requestedBy || ''] },
    { cells: [tr(translate, 'assigned-by', 'Assigned By'), names(card.assigners) || card.assignedBy || ''] },
    { cells: [tr(translate, 'creator', 'Creator'), personById.get(card.userId) || ''] },
    { cells: [tr(translate, 'r-df-received-at', 'Received'), isoDate(card.receivedAt)] },
    { cells: [tr(translate, 'r-df-start-at', 'Start'), isoDate(card.startAt)] },
    { cells: [tr(translate, 'due-date', 'Due Date'), isoDate(card.dueAt)] },
    { cells: [tr(translate, 'r-df-end-at', 'End'), isoDate(card.endAt)] },
    { cells: [tr(translate, 'createdAt', 'Created at'), isoDate(card.createdAt)] },
    { cells: [tr(translate, 'modifiedAt', 'Modified at'), isoDate(card.modifiedAt)] },
  ];
  for (const checklist of checklists) {
    rows.push({ cells: [tr(translate, 'checklist', 'Checklist'), checklist.title || ''] });
    for (const item of checklistItems.filter(candidate => candidate.checklistId === checklist._id)) {
      rows.push({ cells: [item.isFinished ? UI_ICONS['select-on'].ascii : UI_ICONS['select-off'].ascii,
        item.title || ''] });
    }
  }
  for (const attachment of attachments) rows.push({
    cells: [tr(translate, 'attachment', 'Attachment'),
      `${cleanFileName(attachment.name)} (${attachment.type || 'application/octet-stream'}, ${attachment.size || 0})`],
  });
  for (const comment of comments) rows.push({
    cells: [`${tr(translate, 'comment', 'Comment')} - ${personById.get(comment.userId) || comment.userId || ''}`,
      `${comment.text || ''}${isoDate(comment.createdAt) ? ` (${isoDate(comment.createdAt)})` : ''}`],
  });
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

export async function legacyHtml4Page(path, userId, requestFields = {}, translate) {
  if (path === '/' || path === '/sign-in' || path === '/sign-up') return null;
  if (path === '/public') return boardsPage(userId, true, translate);
  const information = await informationPage(path, userId, translate);
  if (information) return information;
  const discovery = await cardDiscoveryPage(path, userId, requestFields, translate);
  if (discovery) return discovery;
  if (/^\/(?:allboards|templates|remaining|archive)(?:\/|$)/.test(path)) return boardsPage(userId, false, translate);
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
