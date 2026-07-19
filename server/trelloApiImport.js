import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { EJSON } from 'meteor/ejson';
import { Random } from 'meteor/random';
import { ReactiveCache } from '/imports/reactiveCache';
import { TrelloCreator } from '/models/trelloCreator';
import Users from '/models/users';
import Boards from '/models/boards';
import Avatars from '/models/avatars';
import TrelloImportJobs from '/models/trelloImportJobs';
import { generateUniversalAvatarUrl } from '/models/lib/universalUrlGenerator';
import { validateAttachmentUrl } from '/models/lib/attachmentUrlValidation';

// Server-only collection holding each user's saved Trello API key + token.
// It is defined here (not under /models) and never published, so the
// credentials never reach the browser — only the `profile.trelloApiSaved`
// boolean is published as a "saved" indicator.
const TrelloApiCredentials = new Mongo.Collection('trello_api_credentials');

// Resolve credentials for a user: prefer the ones passed from the client
// (when the user typed them), otherwise fall back to their saved credentials.
export async function resolveCreds(userId, key, token) {
  if (key && token) {
    return { key, token };
  }
  const saved = await TrelloApiCredentials.findOneAsync(userId);
  if (saved && saved.apiKey && saved.apiToken) {
    return { key: saved.apiKey, token: saved.apiToken };
  }
  return null;
}

async function storeCreds(userId, key, token) {
  await TrelloApiCredentials.upsertAsync(
    { _id: userId },
    { $set: { apiKey: key, apiToken: token } },
  );
  await Users.updateAsync(userId, { $set: { 'profile.trelloApiSaved': true } });
}

async function clearCreds(userId) {
  await TrelloApiCredentials.removeAsync(userId);
  await Users.updateAsync(userId, { $set: { 'profile.trelloApiSaved': false } });
}

// ---------------------------------------------------------------------------
// Live Trello import via the Trello REST API.
//
// The offline path (paste JSON + upload the attachments ZIP) works without
// credentials, but every board has to be exported and downloaded by hand.
// These methods let a logged-in user paste their Trello API key + token once
// and then list and import whole workspaces (Trello "organizations") and their
// boards directly, including attachments — which require OAuth to download and
// are therefore fetched server-side here and handed to the same TrelloCreator
// the offline importer uses.
// ---------------------------------------------------------------------------

const TRELLO_API = 'https://api.trello.com/1';

// Trello rate limits: 100 requests / 10 s per API key and 300 / 10 s per
// token (https://developer.atlassian.com/cloud/trello/guides/rest-api/rate-limits/).
// Strategy:
//  1. Proactive: keep a minimum gap between sequential requests so a bulk
//     import never approaches the limit in the first place.
//  2. Reactive: if Trello still answers 429, honour the `Retry-After` header
//     (seconds) when present, otherwise back off exponentially, and retry.
//  5xx / network errors are also retried with exponential backoff.
const MIN_REQUEST_GAP_MS = 120;
const MAX_RETRIES = 5;
const BASE_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30000;
let _lastRequestAt = 0;

const sleep = ms => new Promise(resolve => Meteor.setTimeout(resolve, ms));

async function throttle() {
  const now = Date.now();
  const wait = MIN_REQUEST_GAP_MS - (now - _lastRequestAt);
  if (wait > 0) {
    await sleep(wait);
  }
  _lastRequestAt = Date.now();
}

function authHeader(key, token) {
  // OAuth header is required to download attachment files; for normal API
  // calls the key/token are passed as query params instead.
  return `OAuth oauth_consumer_key="${key}", oauth_token="${token}"`;
}

// How long to wait before a retry. Prefers the server-provided Retry-After
// header (seconds, or an HTTP date), falling back to capped exponential backoff.
function retryDelayMs(res, attempt) {
  const header = res && res.headers && res.headers.get('retry-after');
  if (header) {
    const secs = Number(header);
    if (Number.isFinite(secs)) return Math.min(secs * 1000, MAX_BACKOFF_MS);
    const dateMs = Date.parse(header);
    if (!Number.isNaN(dateMs)) {
      return Math.max(0, Math.min(dateMs - Date.now(), MAX_BACKOFF_MS));
    }
  }
  return Math.min(BASE_BACKOFF_MS * 2 ** attempt, MAX_BACKOFF_MS);
}

// Single rate-limit/error-aware fetch. Retries 429 and 5xx (and network
// errors), honouring Retry-After; throws a Meteor.Error on a non-retryable
// failure or once retries are exhausted.
async function trelloFetch(url, options = {}) {
  let lastError;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    await throttle();
    let res;
    try {
      res = await fetch(url, options);
    } catch (networkErr) {
      // Transient network failure — back off and retry.
      lastError = networkErr;
      if (attempt < MAX_RETRIES) {
        await sleep(Math.min(BASE_BACKOFF_MS * 2 ** attempt, MAX_BACKOFF_MS));
        continue;
      }
      throw new Meteor.Error('trello-api-error', `Trello request failed: ${networkErr.message}`);
    }

    if (res.status === 429 || res.status >= 500) {
      lastError = res;
      if (attempt < MAX_RETRIES) {
        const delay = retryDelayMs(res, attempt);
        if (process.env.DEBUG === 'true') {
          console.warn(`Trello ${res.status}; retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
        }
        await sleep(delay);
        continue;
      }
    }
    return res;
  }
  // Retries exhausted on a 429/5xx.
  const status = lastError && lastError.status;
  throw new Meteor.Error(
    'trello-api-rate-limited',
    `Trello API still failing after ${MAX_RETRIES} retries (status ${status || 'network error'})`,
  );
}

async function trelloGet(path, key, token, params = {}) {
  const search = new URLSearchParams({ key, token, ...params });
  const res = await trelloFetch(`${TRELLO_API}${path}?${search.toString()}`);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    // Surface the common, actionable cases clearly.
    if (res.status === 401) {
      throw new Meteor.Error('trello-api-unauthorized', 'Trello rejected the API key or token (401)');
    }
    throw new Meteor.Error(
      'trello-api-error',
      `Trello API ${res.status} for ${path}: ${body.slice(0, 200)}`,
    );
  }
  return res.json();
}

async function downloadAttachmentBase64(url, key, token) {
  try {
    // SSRF fix (reported by meifukun): att.url comes from the Trello API response
    // and is attacker-controlled (a board owner sets link-attachment URLs on their
    // own board), and the fetched body is stored and readable back through the
    // attachment API. The offline JSON import already gates every attachment on
    // validateAttachmentUrl; the live path did not. Block loopback / private /
    // link-local / cloud-metadata URLs here too, before any request is made.
    const validation = await validateAttachmentUrl(url);
    if (!validation.valid) {
      if (process.env.DEBUG === 'true') {
        console.warn('Blocked attachment URL during live Trello import:', url, '-', validation.reason);
      }
      try {
        require('/server/lib/securityLog').record({
          key: 'ssrf.attachment', action: 'blocked', source: 'trelloLiveImport.attachment',
          detail: `blocked attachment url (${validation.reason})`,
        });
      } catch (e) { /* logging must never break the guard */ }
      return null;
    }
    const res = await trelloFetch(url, {
      headers: { Authorization: authHeader(key, token) },
    });
    if (!res.ok) {
      if (process.env.DEBUG === 'true') {
        console.warn('Trello attachment download HTTP', res.status, url);
      }
      return null;
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    return buffer.toString('base64');
  } catch (e) {
    if (process.env.DEBUG === 'true') {
      console.warn('Trello attachment download failed:', url, e && e.message);
    }
    return null;
  }
}

// Build the full board object in the shape TrelloCreator expects, mirroring a
// Trello "Export JSON": nested cards (with attachments), lists, labels,
// checklists, members, custom fields and the action log.
async function fetchBoard(boardId, key, token) {
  return trelloGet(`/boards/${boardId}`, key, token, {
    fields: 'all',
    actions: 'all',
    action_fields: 'all',
    actions_limit: '1000',
    cards: 'all',
    card_fields: 'all',
    card_attachments: 'true',
    card_stickers: 'true',
    lists: 'all',
    list_fields: 'all',
    labels: 'all',
    labels_limit: '1000',
    members: 'all',
    member_fields: 'all',
    checklists: 'all',
    checklist_fields: 'all',
    customFields: 'true',
    organization: 'true',
    organization_fields: 'all',
  });
}

// Download each uploaded attachment server-side (with OAuth) and inline the
// bytes as base64 on `att.file`, so TrelloCreator inserts them directly the
// same way it does for the offline attachments-ZIP path.
export async function inlineAttachments(board, key, token) {
  const logical = new Map();
  const collect = att => {
    if (!att) return;
    if (att.url && att.name === att.url) return; // attached link, not a file
    if (!att.url) return;
    const id = att.id || att._id || att.url;
    if (!logical.has(id)) logical.set(id, []);
    logical.get(id).push(att);
  };
  (board.cards || []).forEach(card => (card.attachments || []).forEach(collect));
  (board.actions || []).forEach(action => {
    if (action.type === 'addAttachmentToCard') {
      collect(action.data && action.data.attachment);
    }
  });

  let matched = 0;
  for (const occurrences of logical.values()) {
    const url = occurrences[0].url;
    const base64 = await downloadAttachmentBase64(url, key, token);
    if (base64) {
      occurrences.forEach(att => {
        att.file = base64;
      });
      matched += 1;
    }
  }
  return matched;
}

// Download the board background image server-side and inject it as
// board.backgroundFile so TrelloCreator can store it as a board-level
// attachment. Trello backgrounds are usually public (S3), so try without auth
// first and fall back to the OAuth header (custom backgrounds may need it).
export async function inlineBoardBackground(board, key, token) {
  const prefs = board.prefs || {};
  const scaled = Array.isArray(prefs.backgroundImageScaled)
    ? prefs.backgroundImageScaled
    : [];
  const url =
    prefs.backgroundImage ||
    (scaled.length && scaled[scaled.length - 1] && scaled[scaled.length - 1].url);
  if (!url || !/^https?:\/\//i.test(url)) {
    return;
  }
  // SSRF fix (reported by meifukun): block loopback/private/metadata background URLs.
  const bgValidation = await validateAttachmentUrl(url);
  if (!bgValidation.valid) {
    if (process.env.DEBUG === 'true') {
      console.warn('Blocked Trello background URL during live import:', url, '-', bgValidation.reason);
    }
    return;
  }
  const tryFetch = async withAuth => {
    const options = withAuth
      ? { headers: { Authorization: authHeader(key, token) } }
      : {};
    const res = await fetch(url, options);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const type = (res.headers.get('content-type') || 'image/jpeg').split(';')[0];
    const ext = type.split('/')[1] || 'jpg';
    return { file: buffer.toString('base64'), type, name: `trello-background.${ext}` };
  };
  try {
    let bf = null;
    try {
      bf = await tryFetch(false);
    } catch (e) {
      bf = null;
    }
    if (!bf) {
      bf = await tryFetch(true);
    }
    if (bf) {
      board.backgroundFile = bf;
    }
  } catch (e) {
    if (process.env.DEBUG === 'true') {
      console.warn('Trello board background download failed:', url, e && e.message);
    }
  }
}

// Download Trello member avatars and store them for the mapped WeKan users that
// have no avatar yet (existing avatars are never overwritten). `membersMapping`
// maps a Trello member id to a WeKan user id. Best-effort: a failed download
// never aborts the import.
export async function inlineMemberAvatars(board, membersMapping, key, token) {
  // Admin Panel / Features / Security: skip importing Trello member avatars when
  // import avatars is disabled.
  try {
    const { getImportExportSecuritySettings } = require('/models/lib/importExportSecurity');
    if ((await getImportExportSecuritySettings()).disableImportAvatars) return 0;
  } catch (e) { /* fall through (default: allowed) */ }
  const mapping = membersMapping || {};
  let count = 0;
  for (const member of board.members || []) {
    const wekanUserId = mapping[member.id];
    if (!wekanUserId || !member.avatarUrl) continue;
    try {
      const user = await Users.findOneAsync(wekanUserId, {
        fields: { 'profile.avatarUrl': 1 },
      });
      if (!user) continue;
      if (user.profile && user.profile.avatarUrl) continue; // don't overwrite

      // Trello avatar URLs are a base path; append a size to get a real image.
      const imgUrl = /\.(png|jpe?g|gif)$/i.test(member.avatarUrl)
        ? member.avatarUrl
        : `${member.avatarUrl}/170.png`;
      // SSRF fix (reported by meifukun): block loopback/private/metadata avatar URLs.
      const avValidation = await validateAttachmentUrl(imgUrl);
      if (!avValidation.valid) {
        if (process.env.DEBUG === 'true') {
          console.warn('Blocked Trello avatar URL during live import:', imgUrl, '-', avValidation.reason);
        }
        continue;
      }
      // Trello avatars are public (S3); try without auth, fall back to OAuth.
      let res = await fetch(imgUrl);
      if (!res.ok) {
        res = await fetch(imgUrl, { headers: { Authorization: authHeader(key, token) } });
      }
      if (!res.ok) continue;
      const buffer = Buffer.from(await res.arrayBuffer());
      const type = (res.headers.get('content-type') || 'image/png').split(';')[0];
      const ext = type.split('/')[1] || 'png';
      const fileRef = await Avatars.writeAsync(
        buffer,
        {
          fileName: `avatar-${member.username || wekanUserId}.${ext}`,
          type,
          userId: wekanUserId,
          meta: { userId: wekanUserId },
        },
        true,
      );
      if (fileRef && fileRef._id) {
        await Users.updateAsync(wekanUserId, {
          $set: { 'profile.avatarUrl': generateUniversalAvatarUrl(fileRef._id) },
        });
        count += 1;
      }
    } catch (e) {
      if (process.env.DEBUG === 'true') {
        console.warn('Trello avatar download failed:', member.username, e && e.message);
      }
    }
  }
  return count;
}

// A Trello "Export JSON" often omits card stickers. When credentials are
// available, fetch the board's cards with their stickers in a single API call
// and fill them in for any card that has none. TrelloCreator maps each
// sticker.image to a WeKan sticker icon. Best-effort: a failure never aborts.
export async function inlineStickers(board, key, token) {
  if (!board.id || !(board.cards || []).length) return 0;
  const needsStickers = (board.cards || []).filter(
    c => !(Array.isArray(c.stickers) && c.stickers.length),
  );
  if (!needsStickers.length) return 0; // every card already has stickers
  let cards;
  try {
    cards = await trelloGet(`/boards/${board.id}/cards`, key, token, {
      fields: 'id',
      stickers: 'true',
    });
  } catch (e) {
    if (process.env.DEBUG === 'true') {
      console.warn('Trello sticker fetch failed:', e && e.message);
    }
    return 0;
  }
  const byId = new Map((cards || []).map(c => [c.id, c.stickers || []]));
  let added = 0;
  for (const card of needsStickers) {
    const stickers = byId.get(card.id);
    if (stickers && stickers.length) {
      card.stickers = stickers;
      added += stickers.length;
    }
  }
  return added;
}

// Auto-map Trello members to existing Wekan users by username. Members without
// a matching Wekan account are left unmapped and attributed to the importer.
async function buildMembersMapping(board) {
  const mapping = {};
  for (const member of board.members || []) {
    if (!member.username) continue;
    // Match by WeKan username, then by a previously-recorded imported username
    // (set on earlier imports / by an admin in the People panel).
    const wekanUser =
      (await ReactiveCache.getUser({ username: member.username })) ||
      (await ReactiveCache.getUser({ importUsernames: member.username }));
    if (wekanUser) {
      mapping[member.id] = wekanUser._id;
    }
  }
  return mapping;
}

// --- Personal workspace tree helpers (same shape as server/models/users.js) -
function findNodeByName(nodes, name) {
  for (const node of nodes || []) {
    if (node.name === name) return node;
    if (node.children) {
      const found = findNodeByName(node.children, name);
      if (found) return found;
    }
  }
  return null;
}

// Ensure a workspace node named `name` exists for the user (under parentId if
// given), creating it only if absent. Returns its id.
async function ensureWorkspaceNode(userId, name, parentId) {
  const user = (await Users.findOneAsync(userId)) || {};
  const tree =
    user.profile && user.profile.boardWorkspacesTree
      ? EJSON.clone(user.profile.boardWorkspacesTree)
      : [];

  const existing = findNodeByName(tree, name);
  if (existing) return existing.id;

  const newNode = { id: Random.id(), name, children: [] };
  if (!parentId) {
    tree.push(newNode);
  } else {
    const insertInto = nodes => {
      for (const n of nodes) {
        if (n.id === parentId) {
          n.children = n.children || [];
          n.children.push(newNode);
          return true;
        }
        if (n.children && n.children.length && insertInto(n.children)) return true;
      }
      return false;
    };
    if (!insertInto(tree)) tree.push(newNode);
  }
  await Users.updateAsync(userId, {
    $set: { 'profile.boardWorkspacesTree': tree },
  });
  return newNode.id;
}

async function assignBoardToNode(userId, boardId, spaceId) {
  const user = await Users.findOneAsync(userId, {
    fields: { 'profile.boardWorkspaceAssignments': 1 },
  });
  const assignments = (user.profile && user.profile.boardWorkspaceAssignments) || {};
  assignments[boardId] = spaceId;
  await Users.updateAsync(userId, {
    $set: { 'profile.boardWorkspaceAssignments': assignments },
  });
}

Meteor.methods({
  // Save the user's Trello API key + token server-side (never returned to the
  // client). Only the profile.trelloApiSaved boolean becomes visible.
  async saveTrelloCredentials(key, token) {
    check(key, String);
    check(token, String);
    if (!this.userId) throw new Meteor.Error('error-notAuthorized');
    if (!key.trim() || !token.trim()) {
      throw new Meteor.Error('trello-api-credentials-required');
    }
    await storeCreds(this.userId, key.trim(), token.trim());
    return true;
  },

  // Remove the user's saved Trello API credentials from the database.
  async deleteTrelloCredentials() {
    if (!this.userId) throw new Meteor.Error('error-notAuthorized');
    await clearCreds(this.userId);
    return true;
  },

  // List the user's Trello workspaces (organizations) and their boards, plus a
  // synthetic "Personal Boards" workspace for boards with no organization.
  async trelloListWorkspaces(key, token) {
    check(key, String);
    check(token, String);
    if (!this.userId) throw new Meteor.Error('error-notAuthorized');

    const creds = await resolveCreds(this.userId, key, token);
    if (!creds) throw new Meteor.Error('trello-api-credentials-required');
    ({ key, token } = creds);

    const orgs = await trelloGet('/members/me/organizations', key, token, {
      fields: 'id,name,displayName',
    });
    const boards = await trelloGet('/members/me/boards', key, token, {
      fields: 'id,name,closed,idOrganization',
      filter: 'all',
    });

    const byOrg = new Map();
    orgs.forEach(org => {
      byOrg.set(org.id, {
        id: org.id,
        name: org.displayName || org.name,
        boards: [],
      });
    });
    const personal = { id: 'personal', name: 'Personal Boards', boards: [] };

    boards.forEach(board => {
      const entry = {
        id: board.id,
        name: board.name,
        closed: !!board.closed,
      };
      const ws = board.idOrganization && byOrg.get(board.idOrganization);
      (ws || personal).boards.push(entry);
    });

    const result = Array.from(byOrg.values()).filter(ws => ws.boards.length);
    if (personal.boards.length) result.push(personal);
    return result;
  },

});

// ---------------------------------------------------------------------------
// Background import jobs.
//
// The import runs server-side as a persisted job (TrelloImportJobs) so the user
// can navigate away and return to watch progress, resume after a fatal API
// error, or cancel and delete the imported boards. The API key/token are kept
// only in this in-memory map (never persisted) and must be re-supplied on
// resume — e.g. after a server restart.
// ---------------------------------------------------------------------------

const jobCreds = new Map(); // jobId -> { key, token }
const runningJobs = new Set(); // jobIds with an active loop

// A fatal error stops the whole import and is resumable (invalid credentials,
// or rate-limit still failing after retries). Anything else is a per-board
// failure: it is recorded and the import moves on to the next board.
function isFatalError(e) {
  const code = e && e.error;
  return code === 'trello-api-unauthorized' || code === 'trello-api-rate-limited';
}

function errMessage(e) {
  return (e && e.reason) || (e && e.message) || 'import failed';
}

// Remove the boards this job created (hooked remove cascades cards, lists,
// checklists, comments, attachments, …) and drop their workspace assignments,
// so the user can start the whole import over cleanly.
async function deleteJobBoards(job) {
  for (const boardId of job.createdBoardIds || []) {
    try {
      await Boards.removeAsync({ _id: boardId });
    } catch (e) {
      if (process.env.DEBUG === 'true') {
        console.warn('Failed to delete imported board', boardId, e && e.message);
      }
    }
  }
  // Clean the user's workspace assignments for the deleted boards.
  const user = await Users.findOneAsync(job.userId, {
    fields: { 'profile.boardWorkspaceAssignments': 1 },
  });
  const assignments = (user && user.profile && user.profile.boardWorkspaceAssignments) || {};
  let changed = false;
  (job.createdBoardIds || []).forEach(boardId => {
    if (assignments[boardId]) {
      delete assignments[boardId];
      changed = true;
    }
  });
  if (changed) {
    await Users.updateAsync(job.userId, {
      $set: { 'profile.boardWorkspaceAssignments': assignments },
    });
  }
  await TrelloImportJobs.updateAsync(job._id, {
    $set: { createdBoardIds: [], updatedAt: new Date() },
  });
}

async function finalizeCancel(jobId) {
  const job = await TrelloImportJobs.findOneAsync(jobId);
  if (!job) return;
  jobCreds.delete(jobId);
  if (job.deleteOnCancel) {
    await deleteJobBoards(job);
  }
  await TrelloImportJobs.updateAsync(jobId, {
    $set: { status: 'cancelled', finishedAt: new Date(), updatedAt: new Date() },
  });
}

async function runJob(jobId) {
  if (runningJobs.has(jobId)) return; // already processing
  runningJobs.add(jobId);
  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const job = await TrelloImportJobs.findOneAsync(jobId);
      if (!job) break;

      if (job.cancelRequested) {
        await finalizeCancel(jobId);
        break;
      }
      if (job.currentIndex >= job.boardIds.length) {
        await TrelloImportJobs.updateAsync(jobId, {
          $set: { status: 'done', finishedAt: new Date(), updatedAt: new Date() },
        });
        break;
      }

      let creds = jobCreds.get(jobId);
      if (!creds) {
        // In-memory token gone (e.g. server restarted) — fall back to the
        // user's saved credentials if they have any.
        creds = await resolveCreds(job.userId, '', '');
        if (creds) {
          jobCreds.set(jobId, creds);
        }
      }
      if (!creds) {
        // No credentials available — pause for the user to resume.
        await TrelloImportJobs.updateAsync(jobId, {
          $set: {
            status: 'paused',
            lastError: 'Credentials needed to resume',
            updatedAt: new Date(),
          },
        });
        break;
      }

      const trelloBoardId = job.boardIds[job.currentIndex];
      try {
        const board = await fetchBoard(trelloBoardId, creds.key, creds.token);
        const attachmentsImported = await inlineAttachments(board, creds.key, creds.token);
        await inlineBoardBackground(board, creds.key, creds.token);
        const membersMapping = await buildMembersMapping(board);
        const creator = new TrelloCreator({ membersMapping });
        const newBoardId = await creator.create(board, null);

        const wsName =
          (board.organization && board.organization.displayName) ||
          (board.organization && board.organization.name) ||
          'Personal Boards';
        const spaceId = await ensureWorkspaceNode(
          job.userId,
          wsName,
          job.parentWorkspaceNodeId || null,
        );
        await assignBoardToNode(job.userId, newBoardId, spaceId);

        await TrelloImportJobs.updateAsync(jobId, {
          $set: {
            currentIndex: job.currentIndex + 1,
            status: 'running',
            updatedAt: new Date(),
          },
          $push: {
            results: {
              trelloBoardId,
              boardId: newBoardId,
              title: board.name,
              attachmentsImported,
              success: true,
            },
            createdBoardIds: newBoardId,
          },
        });
      } catch (e) {
        const msg = errMessage(e);
        if (isFatalError(e)) {
          // Stop here; the user can fix credentials / wait and resume.
          await TrelloImportJobs.updateAsync(jobId, {
            $set: { status: 'error', lastError: msg, updatedAt: new Date() },
            $push: { errorLog: `[board ${trelloBoardId}] ${msg}` },
          });
          break;
        }
        // Per-board failure: record and continue with the next board.
        await TrelloImportJobs.updateAsync(jobId, {
          $set: { currentIndex: job.currentIndex + 1, updatedAt: new Date() },
          $push: {
            results: { trelloBoardId, success: false, error: msg },
            errorLog: `[board ${trelloBoardId}] ${msg}`,
          },
        });
      }
    }
  } catch (e) {
    await TrelloImportJobs.updateAsync(jobId, {
      $set: { status: 'error', lastError: errMessage(e), updatedAt: new Date() },
      $push: { errorLog: `[job] ${errMessage(e)}` },
    }).catch(() => {});
  } finally {
    runningJobs.delete(jobId);
  }
}

// Launch the loop detached so the Meteor method returns immediately and the
// import keeps running on the server.
function launchJob(jobId) {
  runJob(jobId).catch(e => {
    console.error('Trello import job crashed', jobId, e);
  });
}

Meteor.methods({
  // Start a background import of the selected boards. Returns the job id; the
  // client watches progress via the trelloImportJobs publication.
  async trelloStartImport(key, token, boardIds, parentWorkspaceNodeId) {
    check(key, String);
    check(token, String);
    check(boardIds, [String]);
    check(parentWorkspaceNodeId, Match.Maybe(String));
    if (!this.userId) throw new Meteor.Error('error-notAuthorized');
    if (!boardIds.length) {
      throw new Meteor.Error('no-boards', 'No boards selected');
    }
    if (boardIds.length > 100) {
      throw new Meteor.Error('too-many-boards', 'At most 100 boards per import');
    }

    const provided = !!(key && token);
    const creds = await resolveCreds(this.userId, key, token);
    if (!creds) throw new Meteor.Error('trello-api-credentials-required');
    // Remember credentials the user typed, so they don't have to re-enter them.
    if (provided) {
      await storeCreds(this.userId, creds.key, creds.token);
    }

    const now = new Date();
    const jobId = await TrelloImportJobs.insertAsync({
      userId: this.userId,
      status: 'running',
      boardIds,
      parentWorkspaceNodeId: parentWorkspaceNodeId || null,
      currentIndex: 0,
      total: boardIds.length,
      results: [],
      errorLog: [],
      createdBoardIds: [],
      cancelRequested: false,
      deleteOnCancel: false,
      lastError: '',
      createdAt: now,
      updatedAt: now,
    });
    jobCreds.set(jobId, { key: creds.key, token: creds.token });
    launchJob(jobId);
    return jobId;
  },

  // Resume a paused/errored job from where it stopped. Credentials come from
  // those typed now, else the user's saved credentials.
  async trelloResumeImport(jobId, key, token) {
    check(jobId, String);
    check(key, String);
    check(token, String);
    if (!this.userId) throw new Meteor.Error('error-notAuthorized');
    const job = await TrelloImportJobs.findOneAsync(jobId);
    if (!job || job.userId !== this.userId) {
      throw new Meteor.Error('error-notAuthorized');
    }
    if (!['paused', 'error', 'running'].includes(job.status)) {
      throw new Meteor.Error('not-resumable', `Job is ${job.status}`);
    }
    const creds = await resolveCreds(this.userId, key, token);
    if (!creds) throw new Meteor.Error('trello-api-credentials-required');
    jobCreds.set(jobId, { key: creds.key, token: creds.token });
    await TrelloImportJobs.updateAsync(jobId, {
      $set: {
        status: 'running',
        cancelRequested: false,
        lastError: '',
        updatedAt: new Date(),
      },
    });
    launchJob(jobId);
    return true;
  },

  // Cancel a job. When deleteImported is true, also delete the boards already
  // imported by this job so the whole process can be retried cleanly.
  async trelloCancelImport(jobId, deleteImported) {
    check(jobId, String);
    check(deleteImported, Boolean);
    if (!this.userId) throw new Meteor.Error('error-notAuthorized');
    const job = await TrelloImportJobs.findOneAsync(jobId);
    if (!job || job.userId !== this.userId) {
      throw new Meteor.Error('error-notAuthorized');
    }
    await TrelloImportJobs.updateAsync(jobId, {
      $set: {
        cancelRequested: true,
        deleteOnCancel: !!deleteImported,
        updatedAt: new Date(),
      },
    });
    // If the loop is running it will stop at the next board boundary and
    // finalize (including deletion). If it isn't running, finalize now.
    if (!runningJobs.has(jobId)) {
      await finalizeCancel(jobId);
    }
    return true;
  },

  // Delete a finished/cancelled job's record (and optionally its boards) so the
  // import page is clean for a fresh run.
  async trelloClearImportJob(jobId, deleteImported) {
    check(jobId, String);
    check(deleteImported, Boolean);
    if (!this.userId) throw new Meteor.Error('error-notAuthorized');
    const job = await TrelloImportJobs.findOneAsync(jobId);
    if (!job || job.userId !== this.userId) {
      throw new Meteor.Error('error-notAuthorized');
    }
    if (job.status === 'running' && runningJobs.has(jobId)) {
      throw new Meteor.Error('job-running', 'Cancel the running import first');
    }
    if (deleteImported) {
      await deleteJobBoards(job);
    }
    jobCreds.delete(jobId);
    await TrelloImportJobs.removeAsync(jobId);
    return true;
  },
});

// On server (re)start, any job left "running" has no live loop or credentials:
// flip it to paused so the user can resume it from the import page.
Meteor.startup(async () => {
  try {
    await TrelloImportJobs.updateAsync(
      { status: 'running' },
      {
        $set: {
          status: 'paused',
          lastError: 'Interrupted by server restart; resume to continue',
          updatedAt: new Date(),
        },
      },
      { multi: true },
    );
  } catch (e) {
    if (process.env.DEBUG === 'true') {
      console.warn('Trello import job recovery failed', e && e.message);
    }
  }
});
