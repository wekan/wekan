// Google Keep through its REST API (models/lib/apiImportServices.js has the
// contract). The Keep API is for Google Workspace: the token is an OAuth 2
// access token with the scope https://www.googleapis.com/auth/keep.readonly,
// from an app the Workspace admin allows or a service account with
// domain-wide delegation. It is sent as a header, never in a URL.
//
// Keep has no notebooks, so there is one thing to import: all notes.
//   GET https://keep.googleapis.com/v1/notes?pageSize=100[&pageToken=...]
//   -> { notes: [note], nextPageToken }
// Without a filter the API leaves trashed notes out. Attachments are listed
// in each note but not downloaded; the parser reports them.

const API = 'https://keep.googleapis.com/v1';
export const ALL_NOTES = 'all';
export const MAX_GOOGLE_KEEP_PAGES = 200;
export const MAX_GOOGLE_KEEP_NOTES = 20000;

function headers(credentials) {
  const token = credentials && typeof credentials.token === 'string' ? credentials.token : '';
  if (!token) throw new Error('token is required');
  return { Authorization: `Bearer ${token}`, Accept: 'application/json' };
}

export async function list(credentials) {
  headers(credentials);
  return [{ id: ALL_NOTES, name: 'Google Keep (all notes)' }];
}

export async function fetch(credentials, id, request) {
  if (id !== ALL_NOTES) throw new Error('Unknown Google Keep source');
  const auth = headers(credentials);
  const notes = [];
  const seen = new Set();
  let pageToken = '';
  for (let page = 0; ; page += 1) {
    if (page >= MAX_GOOGLE_KEEP_PAGES) throw new Error(`Google Keep has more than ${MAX_GOOGLE_KEEP_PAGES} pages of notes`);
    const url = `${API}/notes?pageSize=100${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`;
    const answer = await request(url, { method: 'GET', headers: auth });
    if (!answer || typeof answer !== 'object' || Array.isArray(answer)) throw new Error('Google Keep answered with something that is not a list of notes');
    if (answer.notes !== undefined && !Array.isArray(answer.notes)) throw new Error('Google Keep answered with something that is not a list of notes');
    notes.push(...(answer.notes || []));
    if (notes.length > MAX_GOOGLE_KEEP_NOTES) throw new Error(`Google Keep has more than ${MAX_GOOGLE_KEEP_NOTES} notes`);
    const next = typeof answer.nextPageToken === 'string' ? answer.nextPageToken : '';
    if (!next) break;
    // A page token that comes back again would page forever.
    if (seen.has(next)) throw new Error('Google Keep repeated a page token');
    seen.add(next);
    pageToken = next;
  }
  return { googlekeep: true, notes };
}
