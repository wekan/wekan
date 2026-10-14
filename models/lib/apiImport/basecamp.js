// Basecamp (Basecamp 4 / 3 API, https://github.com/basecamp/bc3-api) client
// for the import page (models/lib/apiImportServices.js).
// credentials: { account, token } - the account id, the number after
// basecamp.com/ in the address, and an OAuth 2 access token. The token goes in
// the Authorization header only, never in a URL. Basecamp refuses a request
// without a User-Agent naming the app.
//
// One project is fetched: its card tables (the dock's kanban_board) with each
// column's cards, and its to-do set's to-do lists with their pending and
// completed to-dos. The flat routes (/card_tables/2.json) are the ones bc3-api
// documents as canonical; the project-scoped /buckets/1/... ones are legacy.
//
// Paging: Basecamp sends the next page in a Link header, which `request` does
// not hand back (it resolves to the JSON body only). Every collection also
// answers ?page=N, so pages are read N = 1, 2, ... until an empty one, at most
// MAX_PAGES of them.

const HOST = 'https://3.basecampapi.com';
const USER_AGENT = 'WeKan (https://wekan.fi)';
export const MAX_PAGES = 200;
export const MAX_PROJECTS = 5000;
export const MAX_CARD_TABLES = 20;
export const MAX_LISTS = 200;
export const MAX_ITEMS = 20000;
export const MAX_COMMENTS = 20000;

function base(credentials) {
  const account = credentials && typeof credentials.account === 'string' ? credentials.account.trim() : '';
  if (!/^\d{1,20}$/.test(account)) throw new Error('The Basecamp account id is the number in the Basecamp address');
  return `${HOST}/${account}`;
}

function headers(credentials) {
  const token = credentials && typeof credentials.token === 'string' ? credentials.token.trim() : '';
  if (!token) throw new Error('A Basecamp access token is required');
  return { Authorization: `Bearer ${token}`, Accept: 'application/json', 'User-Agent': USER_AGENT };
}

const idOf = value => {
  const id = typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? String(value) : typeof value === 'string' ? value.trim() : '';
  return /^\d{1,20}$/.test(id) ? id : '';
};

const get = (url, credentials, request) => request(url, { method: 'GET', headers: headers(credentials) });

// Every item of a paged collection: ?page=1, 2, ... until an empty page.
async function paged(url, credentials, request, limit, what) {
  const items = [];
  const join = url.includes('?') ? '&' : '?';
  for (let page = 1; ; page += 1) {
    if (page > MAX_PAGES) throw new Error(`Basecamp returned too many pages of ${what}`);
    const answer = await get(`${url}${join}page=${page}`, credentials, request);
    if (!Array.isArray(answer)) throw new Error(`Basecamp returned an unexpected answer for ${what}`);
    if (!answer.length) return items;
    items.push(...answer);
    if (items.length > limit) throw new Error(`Basecamp has more than ${limit} ${what} to import`);
  }
}

// A URL Basecamp handed back (comments_url) is only followed below the
// account's own API address, so the token is never sent anywhere else.
function ownUrl(value, root) {
  if (typeof value !== 'string') return '';
  let parsed;
  try { parsed = new URL(value); } catch (error) { return ''; }
  if (parsed.origin !== HOST || parsed.username || parsed.password) return '';
  return parsed.pathname.startsWith(`${new URL(root).pathname}/`) ? `${parsed.origin}${parsed.pathname}` : '';
}

export async function list(credentials, request) {
  const root = base(credentials);
  const projects = await paged(`${root}/projects.json`, credentials, request, MAX_PROJECTS, 'projects');
  return projects
    .filter(project => project && idOf(project.id))
    .map(project => ({ id: idOf(project.id), name: typeof project.name === 'string' && project.name.trim() ? project.name.trim() : idOf(project.id) }));
}

export async function fetch(credentials, id, request) {
  const root = base(credentials);
  const projectId = idOf(id);
  if (!projectId) throw new Error('Choose a Basecamp project to import');
  const project = await get(`${root}/projects/${projectId}.json`, credentials, request);
  if (!project || typeof project !== 'object' || Array.isArray(project)) throw new Error('Basecamp returned an unexpected project');
  const dock = (Array.isArray(project.dock) ? project.dock : []).filter(tool => tool && tool.enabled !== false && idOf(tool.id));
  const budget = { items: 0, comments: 0 };

  // Comments of a recording, only when it says it has some.
  const commentsOf = async (recording) => {
    const count = Number(recording.comments_count ?? recording.comment_count) || 0;
    const url = count > 0 ? ownUrl(recording.comments_url, root) : '';
    if (!url) return [];
    const comments = await paged(url, credentials, request, MAX_COMMENTS - budget.comments, 'comments');
    budget.comments += comments.length;
    return comments;
  };
  const withComments = async (items) => {
    budget.items += items.length;
    if (budget.items > MAX_ITEMS) throw new Error(`Basecamp has more than ${MAX_ITEMS} cards and to-dos to import`);
    const out = [];
    for (const item of items) {
      if (!item || typeof item !== 'object') continue;
      out.push({ ...item, comments: await commentsOf(item) });
    }
    return out;
  };

  const cardTables = [];
  for (const tool of dock.filter(tool => tool.name === 'kanban_board').slice(0, MAX_CARD_TABLES)) {
    const table = await get(`${root}/card_tables/${idOf(tool.id)}.json`, credentials, request);
    const lists = [];
    for (const column of (table && Array.isArray(table.lists) ? table.lists : []).slice(0, MAX_LISTS)) {
      const listId = column && idOf(column.id);
      if (!listId) continue;
      const cards = await paged(`${root}/card_tables/lists/${listId}/cards.json`, credentials, request, MAX_ITEMS - budget.items, 'cards');
      lists.push({ id: listId, title: column.title, type: column.type, color: column.color, cards: await withComments(cards) });
    }
    cardTables.push({ id: idOf(tool.id), title: (table && table.title) || tool.title, lists });
  }

  const todolists = [];
  for (const tool of dock.filter(tool => tool.name === 'todoset').slice(0, MAX_CARD_TABLES)) {
    const lists = await paged(`${root}/todosets/${idOf(tool.id)}/todolists.json`, credentials, request, MAX_LISTS, 'to-do lists');
    for (const todolist of lists) {
      const listId = todolist && idOf(todolist.id);
      if (!listId) continue;
      const pending = await paged(`${root}/todolists/${listId}/todos.json`, credentials, request, MAX_ITEMS - budget.items, 'to-dos');
      const done = await paged(`${root}/todolists/${listId}/todos.json?completed=true`, credentials, request, MAX_ITEMS - budget.items - pending.length, 'to-dos');
      todolists.push({ id: listId, title: todolist.title || todolist.name, description: todolist.description,
        todos: await withComments([...pending, ...done]) });
    }
  }

  return {
    basecamp: true,
    project: { id: projectId, name: project.name, description: project.description, created_at: project.created_at },
    cardTables,
    todolists,
  };
}
