// Microsoft Graph for the import clients (OneNote, Teams): the Authorization
// header of the member's access token, and every page of a list. A next link
// that leaves Graph would take the token with it, so it is refused. Plain
// Node; `request` is passed in (models/lib/apiImportServices.js).

export const GRAPH = 'https://graph.microsoft.com/v1.0';
const GRAPH_HOST = 'graph.microsoft.com';

export function graphHeaders(credentials, accept = 'application/json') {
  const token = credentials && typeof credentials.token === 'string' ? credentials.token.trim() : '';
  if (!token) throw new Error('token is required');
  return { Authorization: `Bearer ${token}`, Accept: accept };
}

export function graphNext(link) {
  let url;
  try { url = new URL(link); } catch (error) { throw new Error('Microsoft Graph sent a next page link that is not a URL'); }
  if (url.protocol !== 'https:' || url.hostname !== GRAPH_HOST || url.username || url.password) {
    throw new Error('Microsoft Graph sent a next page link to another host');
  }
  return url.href;
}

// Every item of a Graph list, following @odata.nextLink; `state.pages`
// counts the requests against `max`.
export async function graphAll(url, headers, request, state, { what, max, maxItems }) {
  const items = [];
  let next = url;
  while (next) {
    state.pages += 1;
    if (state.pages > max) throw new Error(`more than ${max} pages of ${what}`);
    const page = await request(next, { method: 'GET', headers });
    if (!page || typeof page !== 'object' || !Array.isArray(page.value)) throw new Error(`Microsoft Graph did not answer with a list of ${what}`);
    items.push(...page.value);
    if (maxItems && items.length > maxItems) throw new Error(`more than ${maxItems} ${what}`);
    next = page['@odata.nextLink'] ? graphNext(page['@odata.nextLink']) : null;
  }
  return items;
}
