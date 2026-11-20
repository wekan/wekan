// Microsoft OneNote through Microsoft Graph (models/lib/apiImportServices.js):
// the member's notebooks, and one notebook's sections and pages with each
// page's HTML, as the JSON models/lib/onenoteApiFormat.js reads. Plain Node;
// `request` is passed in.
//
// The token is a Microsoft Graph access token with Notes.Read (Graph
// Explorer shows one). It goes only into the Authorization header of
// requests to graph.microsoft.com.
import { GRAPH, graphHeaders, graphAll } from './graph.js';

export const MAX_ONENOTE_REQUESTS = 5000;
export const MAX_ONENOTE_PAGES = 20000;
const id = value => encodeURIComponent(String(value));

export async function list(credentials, request) {
  const headers = graphHeaders(credentials);
  const notebooks = await graphAll(`${GRAPH}/me/onenote/notebooks`, headers, request, { pages: 0 },
    { what: 'OneNote notebooks', max: MAX_ONENOTE_REQUESTS });
  return notebooks.filter(n => n && typeof n.id === 'string' && n.id)
    .map(n => ({ id: n.id, name: String(n.displayName || n.id) }));
}

export async function fetch(credentials, notebookId, request) {
  const headers = graphHeaders(credentials);
  if (typeof notebookId !== 'string' || !notebookId) throw new Error('Choose what to import');
  const state = { pages: 0 };
  const limit = { max: MAX_ONENOTE_REQUESTS };
  const notebooks = await graphAll(`${GRAPH}/me/onenote/notebooks`, headers, request, state, { what: 'OneNote notebooks', ...limit });
  const notebook = notebooks.find(n => n && n.id === notebookId);
  if (!notebook) throw new Error('OneNote has no such notebook');
  const sections = await graphAll(`${GRAPH}/me/onenote/notebooks/${id(notebookId)}/sections`, headers, request, state,
    { what: 'OneNote sections', ...limit });
  let total = 0;
  const out = [];
  for (const section of sections.filter(s => s && typeof s.id === 'string')) {
    const pages = await graphAll(`${GRAPH}/me/onenote/sections/${id(section.id)}/pages?$select=id,title,level,order,createdDateTime`,
      headers, request, state, { what: 'OneNote pages', ...limit });
    total += pages.length;
    if (total > MAX_ONENOTE_PAGES) throw new Error(`OneNote has more than ${MAX_ONENOTE_PAGES} pages in this notebook`);
    const withContent = [];
    for (const page of pages.filter(p => p && typeof p.id === 'string')) {
      state.pages += 1;
      if (state.pages > MAX_ONENOTE_REQUESTS) throw new Error(`more than ${MAX_ONENOTE_REQUESTS} requests to OneNote`);
      // The page's HTML: the request function answers text that is not JSON as a string.
      const content = await request(`${GRAPH}/me/onenote/pages/${id(page.id)}/content`, { method: 'GET', headers: { ...headers, Accept: 'text/html' } });
      withContent.push({ id: page.id, title: String(page.title || ''), level: Number(page.level) || 0, order: Number(page.order) || 0,
        createdDateTime: page.createdDateTime || '', content: typeof content === 'string' ? content : '' });
    }
    out.push({ id: section.id, displayName: String(section.displayName || ''), pages: withContent });
  }
  return { onenote: true, notebooks: [{ id: notebook.id, displayName: String(notebook.displayName || ''), sections: out }] };
}
