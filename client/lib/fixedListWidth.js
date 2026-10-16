import { ReactiveCache } from '/imports/reactiveCache';
import { DEFAULT_LIST_WIDTH, MIN_LIST_WIDTH } from '/models/lib/listWidth';

// #5729 Fixed (same) width for all lists is a per-viewer, per-board setting.
// Logged-in users store it in their profile (profile.fixedListWidthBoards /
// profile.fixedListWidths); anonymous (public board) users in localStorage.
// Shared by the list (client/components/lists/list.js), which draws and
// resizes with it, and the list header menu (listHeader.js), which sets it.

const ENABLED_KEY = 'wekan-fixed-list-width-enabled';
const WIDTH_KEY = 'wekan-fixed-list-width';

function readMap(key) {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : {};
}

function writeEntry(key, boardId, value, what) {
  try {
    const map = readMap(key);
    map[boardId] = value;
    localStorage.setItem(key, JSON.stringify(map));
  } catch (e) {
    console.warn(`Error saving fixed list ${what} to localStorage:`, e);
  }
}

export function readAnonFixedListWidthEnabled(boardId) {
  try {
    return readMap(ENABLED_KEY)[boardId] === true;
  } catch (e) {
    console.warn('Error reading fixed list width flag from localStorage:', e);
  }
  return false;
}

export function readAnonFixedListWidth(boardId) {
  try {
    const w = readMap(WIDTH_KEY)[boardId];
    if (typeof w === 'number' && w >= MIN_LIST_WIDTH) return w;
  } catch (e) {
    console.warn('Error reading fixed list width from localStorage:', e);
  }
  return DEFAULT_LIST_WIDTH;
}

// Whether the current viewer has fixed width mode enabled for this board.
export function isFixedListWidth(boardId) {
  const user = ReactiveCache.getCurrentUser();
  if (user) return !!user.isFixedListWidth(boardId);
  return readAnonFixedListWidthEnabled(boardId);
}

// The single width every list should use when fixed width mode is enabled.
export function fixedListWidthValue(boardId) {
  const user = ReactiveCache.getCurrentUser();
  if (user) return user.getFixedListWidth(boardId);
  return readAnonFixedListWidth(boardId);
}

export function setAnonFixedListWidthEnabled(boardId, enabled) {
  writeEntry(ENABLED_KEY, boardId, !!enabled, 'width flag');
}

export function setAnonFixedListWidth(boardId, width) {
  writeEntry(WIDTH_KEY, boardId, width, 'width');
}
