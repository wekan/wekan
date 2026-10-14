'use strict';

// The files of a Jira, Nextcloud Deck, OpenProject, Asana or GitLab import.
// Each export names its attachments but does not carry them; each service
// documents where a file is downloaded, behind the same sign-in as its API:
//
//   Jira         fields.attachment[].content - /rest/api/3/attachment/content/<id>,
//                which answers with a redirect to the file; Basic EMAIL:API-TOKEN
//   Deck         GET /index.php/apps/deck/api/v1.0|v1.1/boards/<board>/stacks/<stack>
//                /cards/<card>/attachments/<id> (v1.1 for the `file` type, the
//                Nextcloud Files ones of Deck 1.3+); Basic USER:APP-PASSWORD,
//                with OCS-APIRequest: true
//   OpenProject  _links.downloadLocation.href - /api/v3/attachments/<id>/content,
//                relative to the instance; Basic apikey:API-KEY
//   Asana        GET https://app.asana.com/api/1.0/attachments/<gid>?opt_fields=download_url
//                gives a download_url valid for two minutes, signed, so it is
//                fetched without the token; Bearer PERSONAL-ACCESS-TOKEN
//   GitLab       GET /api/v4/projects/<id>/uploads/<secret>/<file> (GitLab 17.4+)
//                for an /uploads/ link of a private project; Bearer TOKEN
//
// The import page asks for the address and the sign-in once per import. They
// go with that import only - never stored, never logged - and are sent ONLY to
// the address the member typed: an export file names any URL it likes, and a
// file that pointed an attachment at another host must not receive the
// sign-in. The download itself is fetchImportedAttachment, the SSRF guard
// that validates every hop and drops Authorization on a cross-origin redirect
// (Jira's redirect to its media store is one).
//
// Zenkit is not here: it publishes no way to download a file.
//
// Pure, no Meteor: tests/importAttachmentAuth.test.cjs.

const SOURCES = {
  jira: { url: true, username: true },
  deck: { url: true, username: true },
  openproject: { url: true, username: false },
  asana: { url: false, username: false, origin: 'https://app.asana.com' },
  gitlab: { url: true, username: false },
};

const MAX_FIELD = 2048;
const FIELDS = ['url', 'username', 'token'];

// The shape the import method accepts: three optional strings, nothing else.
function isAttachmentAuthShape(value) {
  if (value === undefined || value === null) return true;
  if (typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.keys(value).every(key => FIELDS.includes(key)
    && typeof value[key] === 'string' && value[key].length <= MAX_FIELD);
}

function originOf(url) {
  try {
    const parsed = new URL(String(url).trim());
    if (!/^https?:$/.test(parsed.protocol) || parsed.username || parsed.password) return null;
    return parsed.origin;
  } catch (e) {
    return null;
  }
}

// The sign-in of one import, or null when it is missing or incomplete.
// { origin, base, headers }: base is the instance's address (a Nextcloud or a
// GitLab may live under a path).
function attachmentSignIn(source, auth) {
  const spec = SOURCES[source];
  if (!spec || !auth || !isAttachmentAuthShape(auth)) return null;
  const token = String(auth.token || '').trim();
  const username = String(auth.username || '').trim();
  if (!token || (spec.username && !username)) return null;
  let origin = spec.origin;
  let base = spec.origin;
  if (spec.url) {
    origin = originOf(auth.url);
    if (!origin) return null;
    base = String(auth.url).trim().replace(/\/+$/, '');
  }
  const basic = (user, password) => `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`;
  const headers = {
    jira: () => ({ Authorization: basic(username, token) }),
    deck: () => ({ Authorization: basic(username, token), 'OCS-APIRequest': 'true' }),
    openproject: () => ({ Authorization: basic('apikey', token) }),
    asana: () => ({ Authorization: `Bearer ${token}` }),
    gitlab: () => ({ Authorization: `Bearer ${token}` }),
  }[source]();
  return { origin, base, headers };
}

// GitLab's web link to an upload, as models/lib/issueAttachments.js finds it:
// <instance>/<group>/<project>/uploads/<secret>/<file>, or the
// /-/project/<id>/uploads/ form newer GitLab writes.
// Matched below the instance's own address, so only an upload of the GitLab
// the member typed is rewritten.
const GITLAB_UPLOAD = /^(?:-\/project\/(\d+)|([^/?#]+(?:\/[^/?#]+)*?))\/uploads\/([0-9a-f]{32})\/([^/?#]+)$/i;

function gitlabApiUpload(url, signIn) {
  if (!signIn || originOf(url) !== signIn.origin) return null;
  const prefix = `${signIn.base}/`;
  if (!String(url).startsWith(prefix)) return null;
  const match = String(url).slice(prefix.length).match(GITLAB_UPLOAD);
  if (!match) return null;
  const [, projectId, projectPath, secret, file] = match;
  const project = projectId || encodeURIComponent(projectPath);
  return `${signIn.base}/api/v4/projects/${project}/uploads/${secret}/${file}`;
}

// How to fetch one attachment a parser found:
//   { url, headers }               download it
//   { url, headers, then: 'asana' } read download_url from this answer, and
//                                   download that without headers
//   { lost: reason }               it cannot be fetched; the import says why
// `attachment` is { name, url } (absolute), { name, path } (relative to the
// instance), or { name, asanaGid, url? }.
function attachmentRequest(source, attachment, auth) {
  const signIn = attachmentSignIn(source, auth);
  const att = attachment || {};
  const withHeaders = url => (signIn && originOf(url) === signIn.origin ? { ...signIn.headers } : {});
  if (source === 'asana' && att.asanaGid) {
    if (signIn && /^\d+$/.test(String(att.asanaGid))) {
      return { url: `${signIn.base}/api/1.0/attachments/${att.asanaGid}?opt_fields=download_url,name`,
        headers: { ...signIn.headers }, then: 'asana' };
    }
    // An export made moments ago may still hold a live download_url.
    if (att.url) return { url: att.url, headers: {} };
    return { lost: 'not downloaded: give an Asana access token on the import page' };
  }
  if (att.path) {
    if (!signIn) return { lost: 'not downloaded: give the service address and sign-in on the import page' };
    if (!/^\/(?!\/)/.test(String(att.path))) return { lost: 'not downloaded: not a path on the service' };
    // A relative link is the instance's own: OpenProject's start at its root.
    const url = `${signIn.origin}${att.path}`;
    return { url, headers: withHeaders(url) };
  }
  if (att.deck) {
    if (!signIn) return { lost: 'not downloaded: give the Nextcloud address and app password on the import page' };
    const { boardId, stackId, cardId, id, type } = att.deck;
    if (![boardId, stackId, cardId, id].every(v => /^\d+$/.test(String(v)))) return { lost: 'not downloaded: incomplete Deck ids' };
    const version = type === 'file' ? 'v1.1' : 'v1.0';
    const url = `${signIn.base}/index.php/apps/deck/api/${version}/boards/${boardId}/stacks/${stackId}/cards/${cardId}/attachments/${id}`;
    return { url, headers: withHeaders(url) };
  }
  if (!att.url) return { lost: 'not downloaded: no address' };
  // Jira serves no attachment without a sign-in.
  if (source === 'jira' && !signIn) return { lost: 'not downloaded: give the Jira address, email and API token on the import page' };
  if (source === 'gitlab') {
    const api = gitlabApiUpload(att.url, signIn);
    if (api) return { url: api, headers: withHeaders(api) };
  }
  return { url: att.url, headers: withHeaders(att.url) };
}

module.exports = {
  ATTACHMENT_AUTH_SOURCES: Object.keys(SOURCES),
  attachmentAuthFields: source => (SOURCES[source] ? { url: !!SOURCES[source].url, username: !!SOURCES[source].username } : null),
  isAttachmentAuthShape,
  attachmentSignIn,
  attachmentRequest,
};
