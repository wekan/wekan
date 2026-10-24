'use strict';

// The dummy WeKan database of the speed test: users, boards, lists, swimlanes and
// cards shaped the way WeKan stores them, in the proportions of a real instance.
//
// DETERMINISTIC: the same seed gives byte-for-byte the same documents, so every
// database is loaded with identical data and can be asked whether it answers
// identically. Nothing is random at run time; Math.random() is never used.
//
// The sizes are twice those of a production WeKan (see README.md):
//
//   users 15,058  boards 46,153  lists 110,519  cards 307,535  swimlanes 111,273
//
// and they are skewed the way real ones are - most boards are small, a few have
// thousands of cards, and a few users are members of hundreds of boards - because
// a flat distribution would hide exactly the queries that are slow in practice.

const PRODUCTION = {
  users: 15058,
  boards: 46153,
  lists: 110519,
  cards: 307535,
  swimlanes: 111273,
};

// 2026-01-01T00:00:00Z: every date is an offset from this, never "now".
const EPOCH = Date.UTC(2026, 0, 1);
const DAY = 24 * 60 * 60 * 1000;

function sizes(scale = 2) {
  const out = {};
  for (const [name, n] of Object.entries(PRODUCTION)) out[name] = Math.max(1, Math.round(n * scale));
  return out;
}

// mulberry32: small, fast, and the same on every platform.
function prng(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Meteor's Random.id(): 17 characters of this alphabet.
const ID_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz';
function idMaker(seed) {
  const rnd = prng(seed);
  const seen = new Set();
  return function id() {
    for (;;) {
      let s = '';
      for (let i = 0; i < 17; i += 1) s += ID_ALPHABET[Math.floor(rnd() * ID_ALPHABET.length)];
      if (!seen.has(s)) { seen.add(s); return s; }
    }
  };
}

const WORDS = ('alpha budget review sprint release design backlog customer invoice deploy ' +
  'server client report meeting roadmap feature bugfix testing marketing sales support ' +
  'onboarding hiring travel kitchen garden school library project migration database ' +
  'security audit backup network printer laptop website newsletter campaign workshop ' +
  'training contract license translation documentation analytics dashboard planning').split(' ');
const COLORS = ['green', 'yellow', 'orange', 'red', 'purple', 'blue', 'sky', 'lime', 'pink', 'black'];
const LIST_TITLES = ['To Do', 'Doing', 'Done', 'Backlog', 'Review', 'Blocked', 'Ideas', 'Waiting'];
const SWIMLANE_TITLES = ['Default', 'Team A', 'Team B', 'Urgent', 'Later', 'Customers'];

function title(rnd, words) {
  const out = [];
  for (let i = 0; i < words; i += 1) out.push(WORDS[Math.floor(rnd() * WORDS.length)]);
  out[0] = out[0][0].toUpperCase() + out[0].slice(1);
  return out.join(' ');
}

// Split `total` into `n` parts of at least `min` each, weighted by `weights`.
// Largest-remainder rounding, so the parts add up to `total` exactly.
function apportion(total, weights, min) {
  const n = weights.length;
  const rest = total - min * n;
  const sum = weights.reduce((a, b) => a + b, 0);
  const raw = weights.map(w => (rest * w) / sum);
  const parts = raw.map(r => min + Math.floor(r));
  let left = total - parts.reduce((a, b) => a + b, 0);
  const order = raw.map((r, i) => [r - Math.floor(r), i]).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  for (let k = 0; left > 0; k = (k + 1) % n, left -= 1) parts[order[k][1]] += 1;
  return parts;
}

// The PLAN: who is a member of what, how many lists/swimlanes/cards each board
// has. Small (a few MB for the default scale) and computed before any document is
// made, so the speed test can choose its query parameters - the biggest board,
// the busiest user - without asking the database, and so identically everywhere.
function plan({ scale = 2, seed = 6800 } = {}) {
  const n = sizes(scale);
  const rnd = prng(seed);
  const userId = idMaker(seed + 1);
  const boardId = idMaker(seed + 2);

  const users = [];
  for (let i = 0; i < n.users; i += 1) users.push(userId());

  // Pareto weights: a heavy tail of big boards and busy users.
  const pareto = alpha => 1 / Math.pow(1 - rnd() * 0.999999, 1 / alpha);
  const userWeight = users.map(() => pareto(1.2));
  const userCum = [];
  userWeight.reduce((acc, w, i) => { userCum[i] = acc + w; return userCum[i]; }, 0);
  const pickUser = () => {
    const x = rnd() * userCum[userCum.length - 1];
    let lo = 0;
    let hi = userCum.length - 1;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (userCum[mid] < x) lo = mid + 1; else hi = mid; }
    return lo;
  };

  const boardWeight = [];
  const boards = [];
  for (let i = 0; i < n.boards; i += 1) {
    boardWeight.push(pareto(1.1));
    const memberCount = 1 + Math.floor(Math.pow(rnd(), 3) * 12);
    const members = [];
    const seen = new Set();
    while (members.length < memberCount) {
      const u = pickUser();
      if (seen.has(u)) { if (seen.size >= users.length) break; continue; }
      seen.add(u);
      members.push(u);
    }
    boards.push({
      _id: boardId(),
      members,
      archived: rnd() < 0.1,
      type: rnd() < 0.04 ? 'template-container' : 'board',
      permission: rnd() < 0.1 ? 'public' : 'private',
    });
  }
  const lists = apportion(n.lists, boardWeight.map(w => Math.sqrt(w)), 1);
  const swimlanes = apportion(n.swimlanes, boardWeight.map(w => Math.sqrt(w)), 1);
  const cards = apportion(n.cards, boardWeight, 0);
  boards.forEach((b, i) => { b.lists = lists[i]; b.swimlanes = swimlanes[i]; b.cards = cards[i]; });
  return { scale, seed, sizes: n, users, boards };
}

// The documents, collection by collection, in batches - never all of them in
// memory at once (two million card documents would be a few GB in V8).
function* userDocs(p, batch = 1000) {
  const rnd = prng(p.seed + 10);
  const boardsOf = new Map();
  p.boards.forEach((b) => b.members.forEach((u) => {
    if (!boardsOf.has(u)) boardsOf.set(u, []);
    boardsOf.get(u).push(b._id);
  }));
  let out = [];
  for (let i = 0; i < p.users.length; i += 1) {
    const id = p.users[i];
    const name = `user${String(i + 1).padStart(6, '0')}`;
    const created = new Date(EPOCH - (p.users.length - i) * 3 * 60 * 1000);
    const mine = boardsOf.get(i) || [];
    out.push({
      _id: id,
      createdAt: created,
      modifiedAt: new Date(created.getTime() + Math.floor(rnd() * 200) * DAY),
      username: name,
      emails: [{ address: `${name}@example.com`, verified: rnd() < 0.8 }],
      services: { password: { bcrypt: `$2b$10$${'x'.repeat(53)}` } },
      profile: {
        fullname: title(rnd, 2),
        initials: name.slice(0, 2).toUpperCase(),
        boardView: 'board-view-swimlanes',
        listSortBy: '-modifiedAt',
        starredBoards: mine.slice(0, Math.floor(rnd() * 3)),
        language: 'en',
      },
      isAdmin: i < 5,
      loginDisabled: rnd() < 0.02,
      authenticationMethod: 'password',
      orgs: [],
      teams: [],
    });
    if (out.length === batch) { yield out; out = []; }
  }
  if (out.length) yield out;
}

function* boardDocs(p, batch = 1000) {
  const rnd = prng(p.seed + 20);
  let out = [];
  for (let i = 0; i < p.boards.length; i += 1) {
    const b = p.boards[i];
    const created = new Date(EPOCH - (p.boards.length - i) * 60 * 1000);
    out.push({
      _id: b._id,
      title: title(rnd, 1 + Math.floor(rnd() * 3)),
      slug: 'board',
      archived: b.archived,
      createdAt: created,
      modifiedAt: new Date(created.getTime() + Math.floor(rnd() * 90) * DAY),
      stars: 0,
      labels: COLORS.slice(0, 6).map((color, k) => ({ _id: `${b._id.slice(0, 11)}L${k}`, name: '', color })),
      members: b.members.map((u, k) => ({
        userId: p.users[u],
        isAdmin: k === 0,
        isActive: true,
        isNoComments: false,
        isCommentOnly: false,
        isWorker: false,
      })),
      permission: b.permission,
      orgs: [],
      teams: [],
      color: COLORS[i % COLORS.length],
      // A board's own order on All Boards: unique, so a sort by it has no ties.
      sort: i,
      type: b.type,
      allowsCardCounterList: rnd() < 0.3,
      allowsBoardMemberList: rnd() < 0.3,
    });
    if (out.length === batch) { yield out; out = []; }
  }
  if (out.length) yield out;
}

// Lists, swimlanes and cards are made board by board; their ids come from one
// generator per collection so they do not depend on the batch size.
function* childDocs(p, kind, batch = 1000) {
  const rnd = prng(p.seed + { lists: 30, swimlanes: 40, cards: 50 }[kind]);
  const listId = idMaker(p.seed + 3);
  const swimlaneId = idMaker(p.seed + 4);
  const cardId = idMaker(p.seed + 5);
  let out = [];
  let cardIndex = 0;
  for (let i = 0; i < p.boards.length; i += 1) {
    const b = p.boards[i];
    const created = EPOCH - (p.boards.length - i) * 60 * 1000;
    // The ids are drawn for every collection on every pass, so lists, swimlanes
    // and cards agree on them whichever collection is being generated.
    const lists = [];
    for (let k = 0; k < b.lists; k += 1) lists.push(listId());
    const lanes = [];
    for (let k = 0; k < b.swimlanes; k += 1) lanes.push(swimlaneId());
    if (kind === 'lists') {
      lists.forEach((id, k) => out.push({
        _id: id,
        title: LIST_TITLES[k % LIST_TITLES.length],
        boardId: b._id,
        swimlaneId: '',
        sort: k,
        archived: rnd() < 0.05,
        createdAt: new Date(created + k * 1000),
        modifiedAt: new Date(created + k * 1000 + Math.floor(rnd() * 30) * DAY),
        type: 'list',
        wipLimit: { value: 1, enabled: false, soft: false },
        width: '270px',
      }));
    } else if (kind === 'swimlanes') {
      lanes.forEach((id, k) => out.push({
        _id: id,
        title: SWIMLANE_TITLES[k % SWIMLANE_TITLES.length],
        boardId: b._id,
        sort: k,
        archived: rnd() < 0.05,
        createdAt: new Date(created + k * 1000),
        modifiedAt: new Date(created + k * 1000 + Math.floor(rnd() * 30) * DAY),
        type: 'swimlane',
      }));
    }
    const ids = [];
    for (let k = 0; k < b.cards; k += 1) ids.push(cardId());
    if (kind === 'cards') {
      const members = b.members.map(u => p.users[u]);
      for (let k = 0; k < b.cards; k += 1) {
        cardIndex += 1;
        const madeAt = created + 60 * 1000 + k * 7000;
        const card = {
          _id: ids[k],
          title: title(rnd, 2 + Math.floor(rnd() * 5)),
          members: rnd() < 0.4 ? [members[Math.floor(rnd() * members.length)]] : [],
          labelIds: rnd() < 0.5 ? [`${b._id.slice(0, 11)}L${Math.floor(rnd() * 6)}`] : [],
          customFields: [],
          listId: lists[Math.floor(rnd() * lists.length)],
          swimlaneId: lanes[Math.floor(rnd() * lanes.length)],
          boardId: b._id,
          // Unique within a board, so a sort by `sort` has no ties to resolve.
          sort: k,
          archived: rnd() < 0.08,
          parentId: '',
          coverId: '',
          createdAt: new Date(madeAt),
          modifiedAt: new Date(madeAt + Math.floor(rnd() * 60) * DAY),
          dateLastActivity: new Date(madeAt + Math.floor(rnd() * 60) * DAY),
          description: rnd() < 0.3 ? `${title(rnd, 12)}.\n\n${title(rnd, 20)}.` : '',
          requestedBy: '',
          assignedBy: '',
          assignees: rnd() < 0.3 ? [members[Math.floor(rnd() * members.length)]] : [],
          spentTime: 0,
          isOvertime: false,
          userId: members[0],
          subtaskSort: -1,
          type: 'cardType-card',
          linkedId: '',
          cardNumber: k + 1,
          vote: { question: '', positive: [], negative: [], end: null, public: false, allowNonBoardMembers: false },
        };
        // A due date on about one card in six. The millisecond part is the card's
        // own number, so no two due dates are equal and a sort by dueAt has no
        // ties for engines to break differently.
        if (rnd() < 0.16) card.dueAt = new Date(EPOCH + Math.floor(rnd() * 120 - 60) * DAY + cardIndex);
        out.push(card);
        if (out.length >= batch) { yield out; out = []; }
      }
    }
    if (out.length >= batch) { yield out; out = []; }
  }
  if (out.length) yield out;
}

function* documents(p, collection, batch) {
  if (collection === 'users') yield* userDocs(p, batch);
  else if (collection === 'boards') yield* boardDocs(p, batch);
  else yield* childDocs(p, collection, batch);
}

const COLLECTIONS = ['users', 'boards', 'lists', 'swimlanes', 'cards'];

module.exports = { PRODUCTION, EPOCH, DAY, COLLECTIONS, sizes, prng, plan, documents };
