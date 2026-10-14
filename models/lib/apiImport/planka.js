// Planka (https://github.com/plankanban/planka, self-hosted) client for the
// import page (models/lib/apiImportServices.js).
// credentials: { url, username, password } - the Planka address and a login.
// The password goes in the body of the login request only, never in a URL;
// the token it returns is used for this fetch and revoked at the end.
//
// Planka's REST API (server/config/routes.js), v1 and v2 alike:
//   POST   /api/access-tokens      { emailOrUsername, password } -> { item: token }
//   GET    /api/projects           -> { items: projects, included: { boards } }
//   GET    /api/boards/:id         -> { item: board, included: { lists, cards, ... } }
//   DELETE /api/access-tokens/me   logs out
// Comments: v2 has GET /api/cards/:cardId/comments ({ items: [{ text, userId }] });
// v1 has them as actions, GET /api/cards/:cardId/actions, type 'commentCard'
// with data.text. Both return 50 at a time, newest first, and take ?beforeId=.

export const MAX_COMMENT_CARDS = 5000;
export const MAX_COMMENT_PAGES = 100;
const PAGE = 50;

function base(credentials) {
  const url = credentials && typeof credentials.url === 'string' ? credentials.url.trim().replace(/\/+$/, '') : '';
  if (!/^https?:\/\//i.test(url)) throw new Error('The Planka address must start with https:// or http://');
  return url;
}

const idOf = value => {
  const id = typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? String(value) : typeof value === 'string' ? value.trim() : '';
  return /^[A-Za-z0-9_-]{1,64}$/.test(id) ? id : '';
};

async function login(credentials, request) {
  const url = base(credentials);
  const username = credentials && typeof credentials.username === 'string' ? credentials.username.trim() : '';
  const password = credentials && typeof credentials.password === 'string' ? credentials.password : '';
  if (!username || !password) throw new Error('A Planka username and password are required');
  const answer = await request(`${url}/api/access-tokens`, {
    method: 'POST', headers: {}, body: { emailOrUsername: username, password },
  });
  const token = answer && typeof answer.item === 'string' ? answer.item : '';
  // Planka asks for a TOTP code or accepting its terms with a pending token
  // instead; neither can be answered from the import page.
  if (!token) throw new Error('Planka did not log in (two-factor login or terms to accept are not supported)');
  return { url, headers: { Authorization: `Bearer ${token}` } };
}

async function logout(session, request) {
  try { await request(`${session.url}/api/access-tokens/me`, { method: 'DELETE', headers: session.headers }); } catch (error) { /* the token expires anyway */ }
}

const get = (session, path, request) => request(`${session.url}${path}`, { method: 'GET', headers: session.headers });

export async function list(credentials, request) {
  const session = await login(credentials, request);
  try {
    const answer = await get(session, '/api/projects', request);
    if (!answer || !Array.isArray(answer.items)) throw new Error('Planka returned an unexpected answer for its projects');
    const projects = new Map(answer.items.filter(p => p && idOf(p.id)).map(p => [idOf(p.id), p]));
    const boards = answer.included && Array.isArray(answer.included.boards) ? answer.included.boards : [];
    return boards
      .filter(board => board && idOf(board.id))
      .sort((a, b) => (Number(a.position) || 0) - (Number(b.position) || 0))
      .map(board => {
        const project = projects.get(idOf(board.projectId));
        const projectName = project && typeof project.name === 'string' ? project.name : '';
        const name = typeof board.name === 'string' && board.name ? board.name : 'Untitled';
        return { id: idOf(board.id), name: projectName ? `${projectName} / ${name}` : name };
      });
  } finally {
    await logout(session, request);
  }
}

// One card's comments, every page: v2's comments, or v1's comment actions
// when the v2 route is not there. `version` remembers which one answered.
async function cardComments(session, cardId, request, state) {
  const out = [];
  let beforeId = '';
  for (let page = 0; page < MAX_COMMENT_PAGES; page += 1) {
    const query = beforeId ? `?beforeId=${encodeURIComponent(beforeId)}` : '';
    let answer;
    if (state.version !== 1) {
      try {
        answer = await get(session, `/api/cards/${encodeURIComponent(cardId)}/comments${query}`, request);
        state.version = 2;
      } catch (error) {
        if (error && error.status === 404 && !state.version) state.version = 1;
        else throw error;
      }
    }
    if (state.version === 1) answer = await get(session, `/api/cards/${encodeURIComponent(cardId)}/actions${query}`, request);
    const items = answer && Array.isArray(answer.items) ? answer.items : [];
    const users = answer && answer.included && Array.isArray(answer.included.users) ? answer.included.users : [];
    users.forEach(user => { if (user && idOf(user.id)) state.users[idOf(user.id)] = { username: user.username || '', name: user.name || '' }; });
    for (const item of items) {
      if (!item) continue;
      const text = state.version === 1
        ? (item.type === 'commentCard' && item.data && typeof item.data.text === 'string' ? item.data.text : '')
        : (typeof item.text === 'string' ? item.text : '');
      if (text) out.push({ text, userId: idOf(item.userId) || null, createdAt: item.createdAt || null });
    }
    if (items.length < PAGE) break;
    beforeId = idOf(items[items.length - 1] && items[items.length - 1].id);
    if (!beforeId) break;
  }
  return out.reverse();
}

export async function fetch(credentials, id, request) {
  const boardId = idOf(id);
  if (!boardId) throw new Error('Choose a Planka board');
  const session = await login(credentials, request);
  try {
    const planka = await get(session, `/api/boards/${encodeURIComponent(boardId)}`, request);
    if (!planka || !planka.item || !planka.included) throw new Error('Planka returned an unexpected answer for the board');
    const cards = Array.isArray(planka.included.cards) ? planka.included.cards : [];
    const comments = {};
    const state = { version: 0, users: {} };
    let skipped = 0;
    let asked = 0;
    for (const card of cards) {
      const cardId = idOf(card && card.id);
      if (!cardId) continue;
      // v2 counts a card's comments; a card with none needs no request.
      if (card.commentsTotal === 0) continue;
      if (asked >= MAX_COMMENT_CARDS) { skipped += 1; continue; }
      asked += 1;
      const list = await cardComments(session, cardId, request, state);
      if (list.length) comments[cardId] = list;
    }
    const result = { planka, comments, commentUsers: state.users };
    if (skipped) result.commentsSkipped = skipped;
    return result;
  } finally {
    await logout(session, request);
  }
}
