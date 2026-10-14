// Microsoft To Do through Microsoft Graph (models/lib/apiImportServices.js):
// the member's lists, and the tasks of one list or of all of them, as the JSON
// models/lib/mstodoApiFormat.js reads. Plain Node; `request` is passed in.
//
// The token is a Microsoft Graph access token with Tasks.Read (Graph Explorer
// shows one). It goes only into the Authorization header of requests to
// graph.microsoft.com.

const GRAPH = 'https://graph.microsoft.com/v1.0';
const GRAPH_HOST = 'graph.microsoft.com';
export const ALL_LISTS = 'all';
export const MAX_MSTODO_PAGES = 1000;
export const MAX_MSTODO_TASKS = 50000;

function headersFor(credentials) {
  const token = credentials && typeof credentials.token === 'string' ? credentials.token.trim() : '';
  if (!token) throw new Error('token is required');
  return { Authorization: `Bearer ${token}`, Accept: 'application/json' };
}

// Graph pages with @odata.nextLink; a next link that leaves Graph would take
// the token with it, so it is refused.
function graphNext(link) {
  let url;
  try { url = new URL(link); } catch (error) { throw new Error('Microsoft Graph sent a next page link that is not a URL'); }
  if (url.protocol !== 'https:' || url.hostname !== GRAPH_HOST || url.username || url.password) {
    throw new Error('Microsoft Graph sent a next page link to another host');
  }
  return url.href;
}

async function getAll(url, headers, request, state, what) {
  const items = [];
  let next = url;
  while (next) {
    state.pages += 1;
    if (state.pages > MAX_MSTODO_PAGES) throw new Error(`Microsoft To Do has more than ${MAX_MSTODO_PAGES} pages of ${what}`);
    const page = await request(next, { method: 'GET', headers });
    if (!page || typeof page !== 'object' || !Array.isArray(page.value)) {
      throw new Error(`Microsoft Graph did not answer with a list of ${what}`);
    }
    items.push(...page.value);
    if (what === 'tasks' && state.tasks + items.length > MAX_MSTODO_TASKS) {
      throw new Error(`Microsoft To Do has more than ${MAX_MSTODO_TASKS} tasks`);
    }
    next = page['@odata.nextLink'] ? graphNext(page['@odata.nextLink']) : null;
  }
  return items;
}

async function todoLists(headers, request, state) {
  const lists = await getAll(`${GRAPH}/me/todo/lists`, headers, request, state, 'lists');
  return lists.filter(list => list && typeof list.id === 'string' && list.id);
}

export async function list(credentials, request) {
  const headers = headersFor(credentials);
  const lists = await todoLists(headers, request, { pages: 0, tasks: 0 });
  return [
    { id: ALL_LISTS, name: 'Microsoft To Do (all lists)' },
    ...lists.map(item => ({ id: item.id, name: String(item.displayName || item.id) })),
  ];
}

export async function fetch(credentials, id, request) {
  const headers = headersFor(credentials);
  if (typeof id !== 'string' || !id) throw new Error('Choose what to import');
  const state = { pages: 0, tasks: 0 };
  let lists = await todoLists(headers, request, state);
  if (id !== ALL_LISTS) {
    lists = lists.filter(item => item.id === id);
    if (!lists.length) throw new Error('Microsoft To Do has no such list');
  }
  const out = [];
  for (const item of lists) {
    const tasks = await getAll(`${GRAPH}/me/todo/lists/${encodeURIComponent(item.id)}/tasks?$expand=checklistItems`,
      headers, request, state, 'tasks');
    state.tasks += tasks.length;
    out.push({
      id: item.id,
      displayName: typeof item.displayName === 'string' ? item.displayName : '',
      wellknownListName: typeof item.wellknownListName === 'string' ? item.wellknownListName : 'none',
      tasks,
    });
  }
  return { mstodo: true, lists: out };
}
