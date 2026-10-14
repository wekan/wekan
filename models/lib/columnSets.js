'use strict';

// #211: the same cards in several named column sets. A board keeps column
// sets (`columnSets`: [{ _id, name, columns: [{ _id, title, color }] }]) - say
// "Completion", "Priority", "Milestone" - and a card keeps which column it is
// in for each set (`columnSetValues`: { setId: columnId }). The Column sets
// view shows one set's columns and moves cards between them by dragging,
// which changes only the card's place in THAT set; each card also shows, as
// coloured badges, its column in the other sets. Lists, swimlanes, labels
// and members are not touched. Pure: tests/columnSets.test.cjs.

const MAX_SETS = 20;
const MAX_COLUMNS = 40;
const COLORS = Object.freeze(['', 'green', 'yellow', 'orange', 'red', 'purple', 'blue', 'sky', 'lime', 'pink', 'black', 'silver']);

function cleanName(value, max = 60) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

function sets(board) {
  return Array.isArray(board && board.columnSets) ? board.columnSets : [];
}

function addColumnSet(current, name, newId) {
  const n = cleanName(name);
  const list = Array.isArray(current) ? current : [];
  if (!n || list.length >= MAX_SETS) return null;
  return [...list, { _id: newId, name: n, columns: [] }];
}

function addColumn(current, setId, title, color, newId) {
  const t = cleanName(title);
  if (!t) return null;
  let done = false;
  const next = (Array.isArray(current) ? current : []).map(s => {
    if (s._id !== setId || (s.columns || []).length >= MAX_COLUMNS) return s;
    done = true;
    return { ...s, columns: [...(s.columns || []), { _id: newId, title: t, color: COLORS.includes(color) ? color : '' }] };
  });
  return done ? next : null;
}

function removeColumn(current, setId, columnId) {
  return (Array.isArray(current) ? current : []).map(s => (s._id === setId
    ? { ...s, columns: (s.columns || []).filter(c => c._id !== columnId) } : s));
}

function removeColumnSet(current, setId) {
  return (Array.isArray(current) ? current : []).filter(s => s._id !== setId);
}

// The column a card is in for `setId`, if that column still exists.
function cardColumnId(card, set) {
  const id = card && card.columnSetValues && card.columnSetValues[set && set._id];
  return id && (set.columns || []).some(c => c._id === id) ? id : null;
}

// The view's columns: "not placed" first, then the set's, each with its cards.
function columnsWithCards(set, cards) {
  const columns = [{ _id: null, title: null, color: '', cards: [] }, ...((set && set.columns) || []).map(c => ({ ...c, cards: [] }))];
  const byId = new Map(columns.map(c => [c._id, c]));
  for (const card of Array.isArray(cards) ? cards : []) byId.get(cardColumnId(card, set)).cards.push(card);
  return columns;
}

// Where the card is in every OTHER set, as badges.
function otherSetBadges(card, allSets, currentSetId) {
  return (Array.isArray(allSets) ? allSets : []).filter(s => s._id !== currentSetId).map(s => {
    const id = cardColumnId(card, s);
    const column = id && s.columns.find(c => c._id === id);
    return column ? { setName: s.name, title: column.title, color: column.color || '' } : null;
  }).filter(Boolean);
}

// The card update that puts it in `columnId` (null: not placed) of `setId`.
function placeModifier(set, columnId) {
  if (!set || typeof set._id !== 'string' || !/^[A-Za-z0-9_-]+$/.test(set._id)) return null;
  if (columnId === null || columnId === '') return { $unset: { [`columnSetValues.${set._id}`]: '' } };
  if (!(set.columns || []).some(c => c._id === columnId)) return null;
  return { $set: { [`columnSetValues.${set._id}`]: columnId } };
}

module.exports = { MAX_SETS, MAX_COLUMNS, COLORS, sets, addColumnSet, addColumn, removeColumn, removeColumnSet,
  cardColumnId, columnsWithCards, otherSetBadges, placeModifier };
