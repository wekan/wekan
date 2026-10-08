'use strict';

// Admin Panel / Settings / Visibility / Features: the card fields this WeKan
// shows, instance-wide - one checkbox per field type of Board Settings / Card
// (models/lib/cardSettingsRows.js), all ticked by default.
//
// Pure CommonJS, no Meteor: the Admin Panel page, the server method that saves
// it, the client's board read (imports/reactiveCache.js), Board Settings /
// Card's row list and tests/cardFieldVisibility.test.cjs all load this ONE
// catalog and these decisions.
//
// What an unticked field means:
//   * VISIBILITY ONLY. The field is not drawn on any card or minicard of any
//     board, and its row is not offered in any board's Board Settings / Card.
//   * Nothing is written: no card data and no board setting changes. Every
//     board keeps its own choice, and ticking the field again shows each
//     board exactly as it was set before.
//   * No ordering here - the order of the fields is each board's own.
//
// Stored on the Settings document:
//   cardFieldStates: { '<field key>': true|false } - missing means shown, so
//   an install that never saved this page is unchanged.
//
// HOW IT HIDES. A field is drawn when the board's flag for that side says so
// (`currentBoard.allowsPomodoro`, `board.allowsPomodoroOnMinicard`, the
// board's Scrum visibility, ...), read in many templates. Rather than a second
// condition in each of them, the client's board read returns the board with
// the hidden fields' flags reading false (applyCardFieldVisibility below), so
// every one of those reads agrees without being edited. The board document in
// the database, and on the server, is never changed.

const { CARD_SETTINGS_ROWS } = require('./cardSettingsRows');

// The personal "Labels text" row is the same field type as the board's own
// "Labels text" row - the user's override of it - so it has no checkbox of its
// own here and follows that one.
const FOLLOWS = { labelTextPersonal: 'labelText' };

// One entry per field type, in Board Settings / Card's table order.
const CARD_FIELDS = CARD_SETTINGS_ROWS
  .filter(row => !FOLLOWS[row.key])
  .map(row => ({
    key: row.key,
    icons: row.icons,
    label: row.label,
    labelSeparator: row.labelSeparator || ' ',
  }));

const CARD_FIELD_KEYS = CARD_FIELDS.map(field => field.key);

function isCardFieldKey(key) {
  return CARD_FIELD_KEYS.includes(key);
}

// The checkbox a Board Settings / Card row answers to.
function fieldKeyOfRow(rowKey) {
  return FOLLOWS[rowKey] || rowKey;
}

function storedStates(setting) {
  const states = setting && setting.cardFieldStates;
  return states && typeof states === 'object' && !Array.isArray(states) ? states : {};
}

// Shown unless an administrator unticked it.
function isCardFieldEnabled(setting, key) {
  return storedStates(setting)[fieldKeyOfRow(key)] !== false;
}

// The field keys unticked on this install, in catalog order.
function hiddenCardFieldKeys(setting) {
  const states = storedStates(setting);
  return CARD_FIELD_KEYS.filter(key => states[key] === false);
}

// Board Settings / Card: is this row offered at all?
function isRowVisible(setting, rowKey) {
  return isCardFieldEnabled(setting, rowKey);
}

// The rows of the Admin Panel page: no position, no arrows - only the tick.
function cardFieldRows(setting) {
  return CARD_FIELDS.map(field => ({
    key: field.key,
    icons: field.icons,
    label: field.label,
    labelSeparator: field.labelSeparator,
    enabled: isCardFieldEnabled(setting, field.key),
  }));
}

// The page's Save of this group, turned into the value to store, or { error }.
// Every catalog field gets an explicit decision, so what the administrator saw
// is what is stored; an unknown key is refused rather than stored.
function cardFieldStatesValue(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { error: 'invalid' };
  const unknown = Object.keys(input).filter(key => !isCardFieldKey(key));
  if (unknown.length) return { error: 'unknown-card-field', keys: unknown };
  const cardFieldStates = {};
  for (const key of CARD_FIELD_KEYS) {
    if (typeof input[key] !== 'boolean') return { error: 'invalid' };
    cardFieldStates[key] = input[key];
  }
  return { cardFieldStates };
}

// The board fields a hidden row's sides read. Every side of the table is a
// board flag of the same name except the minicard's "Labels text", whose
// helper reads the board's showLabelText (models/lib/boardSettingsColumns.js
// knows the same exception). Scrum sides are a path in board.scrum.visibility;
// the personal sides (a user's or a card's own setting) have no board field
// and are answered by isCardFieldHiddenOnBoard() where they are read.
function boardFieldOfSide(spec) {
  if (!spec || spec.scrum || spec.personal) return null;
  return spec.field === 'allowsLabelText' ? 'showLabelText' : spec.field;
}

const HIDDEN_MARK = '__hiddenCardFields';
const cache = typeof WeakMap === 'function' ? new WeakMap() : null;

// The board as the card and the minicard should see it: when nothing is
// hidden, the SAME object (an install that never unticked a field pays
// nothing); otherwise a copy, with the same prototype so every board helper
// still works, whose hidden fields' flags read false. The copy is cached per
// board document and hidden set, so repeated reads return one object.
function applyCardFieldVisibility(board, setting) {
  if (!board || typeof board !== 'object') return board;
  const hidden = hiddenCardFieldKeys(setting);
  if (!hidden.length) return board;
  const signature = hidden.join(',');
  const cached = cache && cache.get(board);
  if (cached && cached.signature === signature) return cached.view;

  const overrides = {};
  let scrumVisibility = null;
  CARD_SETTINGS_ROWS
    .filter(row => hidden.includes(fieldKeyOfRow(row.key)))
    .forEach(row => {
      ['card', 'minicard'].forEach(side => {
        const spec = row[side];
        if (!spec) return;
        if (spec.scrum) {
          scrumVisibility = scrumVisibility || {};
          scrumVisibility[spec.scrum] = false;
          return;
        }
        const field = boardFieldOfSide(spec);
        if (field) overrides[field] = false;
      });
    });

  const view = Object.assign(Object.create(Object.getPrototypeOf(board)), board, overrides);
  if (scrumVisibility) {
    const scrum = board.scrum && typeof board.scrum === 'object' ? board.scrum : {};
    view.scrum = { ...scrum, visibility: { ...(scrum.visibility || {}), ...scrumVisibility } };
  }
  Object.defineProperty(view, HIDDEN_MARK, { value: hidden, enumerable: false });
  if (cache) cache.set(board, { signature, view });
  return view;
}

// For the reads that are not a board flag (the card's own List title, the
// user's own Labels text): whether this board, as returned by the client's
// board read, has `key` hidden by the administrator.
function isCardFieldHiddenOnBoard(board, key) {
  const hidden = board && board[HIDDEN_MARK];
  return Array.isArray(hidden) && hidden.includes(fieldKeyOfRow(key));
}

module.exports = {
  CARD_FIELDS,
  CARD_FIELD_KEYS,
  isCardFieldKey,
  fieldKeyOfRow,
  isCardFieldEnabled,
  hiddenCardFieldKeys,
  isRowVisible,
  cardFieldRows,
  cardFieldStatesValue,
  boardFieldOfSide,
  applyCardFieldVisibility,
  isCardFieldHiddenOnBoard,
};
