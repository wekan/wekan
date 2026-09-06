import Boards from '/models/boards';
import Cards from '/models/cards';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';

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
    columns: [tr(translate, 'board', 'Board'), tr(translate, 'permission', 'Permission')],
    empty: tr(translate, 'no-boards', 'No boards'),
    rows: boards.map(board => ({
      color: boardColor(board), boardTheme: true,
      cells: [userId
        ? { action: boardPath(board), label: board.title || 'Board' }
        : { href: boardPath(board), label: board.title || 'Board' }, board.permission || ''],
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
    cells: [`Swimlane: ${firstSwimlane.title}`, swimlanes.map(item => userId ? ({
      action: boardPath(board), label: item.title, fields: { viewSwimlane: item._id },
    }) : ({ href: `${boardPath(board)}/swimlane/${encodeURIComponent(item._id)}`, label: item.title }))],
    color: firstSwimlane.color,
  });
  if (firstList) {
    rows.push({
      cells: [`List: ${firstList.title}`, lists.map(item => userId ? ({
        action: boardPath(board), label: item.title,
        fields: { viewSwimlane: firstSwimlane?._id || '', viewList: item._id },
      }) : ({ href: `${boardPath(board)}/list/${encodeURIComponent(item._id)}`, label: item.title }))],
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
      cells: [card.title || '(untitled card)', userId ? {
        action: `${boardPath(board)}/${encodeURIComponent(card._id)}`,
        label: tr(translate, 'open-card', 'Open card'),
      } : {
        href: `${boardPath(board)}/${encodeURIComponent(card._id)}`,
        label: tr(translate, 'open-card', 'Open card'),
      }],
    });
  }
  return {
    heading: board.title || 'Board', caption: `${board.title || 'Board'} — upper-left list`,
    columns: [tr(translate, 'content', 'Content'), tr(translate, 'action', 'Action')], rows,
    empty: 'The upper-left swimlane or list is empty.',
  };
}

export async function legacyHtml4Page(path, userId, requestFields = {}, translate) {
  if (path === '/' || path === '/sign-in' || path === '/sign-up') return null;
  if (path === '/public') return boardsPage(userId, true, translate);
  if (/^\/(?:allboards|templates|remaining|archive)(?:\/|$)/.test(path)) return boardsPage(userId, false, translate);
  if (/^\/b(?:\/|$)/.test(path)) return boardPage(path, userId, requestFields, translate);
  return {
    heading: path.split('/').filter(Boolean).join(' / ') || 'WeKan',
    columns: ['Page', 'Status'],
    rows: [{ cells: [path, 'This page has a Legacy HTML4 baseline. More controls will appear as its server controller is completed.'] }],
  };
}
