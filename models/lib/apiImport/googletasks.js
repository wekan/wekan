// Google Tasks API client for the import page (models/lib/apiImportServices.js).
// credentials: { token } - an OAuth 2 access token with the scope
// https://www.googleapis.com/auth/tasks.readonly. The token goes in the
// Authorization header only, never in a URL.

const API = 'https://tasks.googleapis.com/tasks/v1';
export const ALL = 'all';
export const MAX_LISTS = 100;
export const MAX_PAGES = 200;
export const MAX_TASKS = 20000;

function headers(credentials) {
  const token = credentials && typeof credentials.token === 'string' ? credentials.token.trim() : '';
  if (!token) throw new Error('A Google Tasks access token is required');
  return { Authorization: `Bearer ${token}`, Accept: 'application/json' };
}

// Every item of a paged Google API collection, following nextPageToken. A
// page token seen before, too many pages or too many items stop it.
async function paged(url, credentials, request, limit) {
  const items = [];
  const seen = new Set();
  let pageToken = '';
  for (let page = 0; ; page += 1) {
    if (page >= MAX_PAGES) throw new Error('Google Tasks returned too many pages');
    const answer = await request(pageToken ? `${url}&pageToken=${encodeURIComponent(pageToken)}` : url,
      { method: 'GET', headers: headers(credentials) });
    if (!answer || typeof answer !== 'object') throw new Error('Google Tasks returned an unexpected answer');
    if (Array.isArray(answer.items)) items.push(...answer.items);
    if (items.length > limit) throw new Error(`Google Tasks has more than ${limit} items to import`);
    const next = typeof answer.nextPageToken === 'string' ? answer.nextPageToken : '';
    if (!next) return items;
    if (seen.has(next)) throw new Error('Google Tasks repeated a page token');
    seen.add(next);
    pageToken = next;
  }
}

const listsOf = (credentials, request) =>
  paged(`${API}/users/@me/lists?maxResults=100`, credentials, request, MAX_LISTS);

export async function list(credentials, request) {
  const lists = await listsOf(credentials, request);
  return [{ id: ALL, name: 'Google Tasks (all lists)' }, ...lists
    .filter(item => item && typeof item.id === 'string' && item.id)
    .map(item => ({ id: item.id, name: typeof item.title === 'string' && item.title.trim() ? item.title.trim() : item.id }))];
}

export async function fetch(credentials, id, request) {
  if (typeof id !== 'string' || !id) throw new Error('Choose what to import');
  let lists;
  if (id === ALL) {
    lists = (await listsOf(credentials, request)).filter(item => item && typeof item.id === 'string' && item.id);
  } else {
    const one = await request(`${API}/users/@me/lists/${encodeURIComponent(id)}`, { method: 'GET', headers: headers(credentials) });
    lists = [{ id, title: one && typeof one.title === 'string' ? one.title : id }];
  }
  let count = 0;
  const out = [];
  for (const taskList of lists) {
    const tasks = await paged(`${API}/lists/${encodeURIComponent(taskList.id)}/tasks?maxResults=100&showCompleted=true&showHidden=true`,
      credentials, request, MAX_TASKS - count);
    count += tasks.length;
    out.push({ id: taskList.id, title: typeof taskList.title === 'string' ? taskList.title : '', tasks });
  }
  return { googletasks: true, lists: out };
}
