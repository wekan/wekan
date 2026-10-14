// A GitHub wiki, read from its git repository (<repo>.wiki.git: GitHub has no
// API for wikis), and written as cards - one page one card - by the GitHub
// organization import. What a page becomes is decided in
// models/lib/githubWiki.js (pure, tested); this reads the repository with
// isomorphic-git and writes the cards, their links and their history.
//
// Every request of the clone goes through the SSRF guard (fetchSafe), which
// validates and DNS-pins each hop, and may only reach the wiki's own server:
// isomorphic-git's own HTTP client is not used. The clone is made in a
// temporary directory that is removed afterwards, whatever happens.
import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import { Random } from 'meteor/random';
import { fetchSafe } from '/server/lib/ssrfGuard';
import Cards from '/models/cards';
import Lists from '/models/lists';
import ChangeHistory from '/models/changeHistory';

const git = require('isomorphic-git');
const wiki = require('/models/lib/githubWiki');
const { prepareCardFieldHistory, persistSyncFieldHistory, SYNC_FIELDS } = require('/server/lib/syncHistoryBatch');

const MAX_WIKI_BYTES = 256 * 1024 * 1024;
const MAX_PAGE_BYTES = 2 * 1024 * 1024;
const MAX_COMMITS = 5000;

// isomorphic-git's HTTP plugin, on the SSRF guard, for one origin only.
function guardedHttp(origin, token) {
  return {
    async request({ url, method = 'GET', headers = {}, body }) {
      if (new URL(url).origin !== origin) throw new Error('the wiki clone tried to leave its server');
      let data;
      if (body) {
        const chunks = [];
        for await (const chunk of body) chunks.push(Buffer.from(chunk));
        data = Buffer.concat(chunks);
      }
      const sent = { ...headers };
      if (token) sent.Authorization = `Basic ${Buffer.from(`x-access-token:${token}`).toString('base64')}`;
      const res = await fetchSafe(url, {
        method, headers: sent, body: data, maxRedirects: 2,
        timeoutMs: 120000, totalTimeoutMs: 300000, maxResponseBytes: MAX_WIKI_BYTES,
      });
      const buffer = Buffer.from(await res.arrayBuffer());
      const out = {};
      res.headers.forEach((value, key) => { out[key] = value; });
      return { url, method, statusCode: res.status, statusMessage: res.statusText || '', headers: out, body: [new Uint8Array(buffer)] };
    },
  };
}

// The files of a commit's tree, as names. A name is only ever a string here:
// the clone has no working tree (noCheckout), nothing is written by name, and
// isomorphic-git writes nothing but its own object store under `dir`.
async function treeFiles(dir, oid, prefix = '') {
  const { tree } = await git.readTree({ fs, dir, oid });
  const files = [];
  for (const node of tree) {
    const name = prefix ? `${prefix}/${node.path}` : node.path;
    if (node.type === 'tree') files.push(...await treeFiles(dir, node.oid, name));
    else if (node.type === 'blob') files.push({ path: name, oid: node.oid });
  }
  return files;
}

/**
 * The pages of a wiki with their whole history, or null when the repository
 * has no wiki: [{ path, name, text, revisions: [{ commit, at, author, email,
 * message, text }] }], revisions oldest first.
 */
export async function readGithubWiki({ owner, repo, token, host = 'https://github.com' }) {
  const origin = new URL(host).origin;
  const dir = path.join(process.env.WRITABLE_PATH || os.tmpdir(), 'wekan-wiki-import', Random.id());
  await fs.promises.mkdir(dir, { recursive: true });
  try {
    try {
      await git.clone({ fs, http: guardedHttp(origin, token), dir, url: `${origin}/${owner}/${repo}.wiki.git`,
        singleBranch: true, noCheckout: true, noTags: true });
    } catch (error) {
      // No wiki, or a wiki nobody wrote yet: GitHub answers 404 / 401.
      if (/HttpError|404|401|403|NotFound/i.test(`${error && (error.code || error.name)} ${error && error.message}`)) return null;
      throw error;
    }
    const commits = (await git.log({ fs, dir, depth: MAX_COMMITS })).reverse();
    const last = new Map();
    const revisions = new Map();
    for (const c of commits) {
      // eslint-disable-next-line no-await-in-loop
      const files = (await treeFiles(dir, c.commit.tree)).filter(f => wiki.pageNameFromPath(f.path));
      const present = new Set(files.map(f => f.path));
      const meta = {
        commit: c.oid,
        at: new Date(c.commit.author.timestamp * 1000),
        author: c.commit.author.name,
        email: c.commit.author.email,
        message: c.commit.message.trim(),
      };
      for (const file of files) {
        if (last.get(file.path) === file.oid) continue;
        last.set(file.path, file.oid);
        // eslint-disable-next-line no-await-in-loop
        const { blob } = await git.readBlob({ fs, dir, oid: file.oid });
        const text = Buffer.from(blob).subarray(0, MAX_PAGE_BYTES).toString('utf8');
        if (!revisions.has(file.path)) revisions.set(file.path, []);
        revisions.get(file.path).push({ ...meta, text });
      }
      for (const [file] of last) {
        if (present.has(file) || last.get(file) === null) continue;
        last.set(file, null);
        revisions.get(file).push({ ...meta, text: null });
      }
    }
    const pages = [];
    for (const [file, history] of revisions) {
      const current = history[history.length - 1];
      if (!current || current.text === null) continue; // deleted since
      pages.push({ path: file, name: wiki.pageNameFromPath(file), text: current.text, revisions: history });
    }
    return wiki.sortPages(pages);
  } finally {
    await fs.promises.rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

/**
 * The pages as cards in the board's Wiki list: the title on the minicard,
 * the text in the description with [[links]] pointing at the linked pages'
 * cards and those cards attached ("link to card"), and every revision as
 * an edit of the description in the card's history, dated as committed.
 * Returns the number of pages written.
 */
export async function writeWikiCards({ board, swimlaneId, pages, userId, repoWikiUrl }) {
  if (!pages || !pages.length) return 0;
  let list = await Lists.findOneAsync({ boardId: board._id, title: wiki.WIKI_LIST_TITLE, archived: false });
  if (!list) {
    const lists = await Lists.find({ boardId: board._id }, { fields: { sort: 1 } }).fetchAsync();
    const listId = await Lists.insertAsync({ title: wiki.WIKI_LIST_TITLE, boardId: board._id, archived: false,
      sort: lists.reduce((m, l) => Math.max(m, Number(l.sort) || 0), -1) + 1, createdAt: new Date() });
    list = await Lists.findOneAsync(listId);
  }
  const cardByKey = new Map();
  for (let i = 0; i < pages.length; i += 1) {
    const page = pages[i];
    // eslint-disable-next-line no-await-in-loop
    const cardId = await Cards.insertAsync({
      title: page.name, description: '', boardId: board._id, listId: list._id, swimlaneId,
      userId, sort: i, cardNumber: await board.getNextCardNumber(),
    });
    // eslint-disable-next-line no-await-in-loop
    const card = await Cards.findOneAsync(cardId);
    cardByKey.set(wiki.pageKey(page.name), { _id: cardId, url: card.originRelativeUrl(board), card });
  }
  const cardFor = key => cardByKey.get(key) || null;
  for (const page of pages) {
    const { card } = cardByKey.get(wiki.pageKey(page.name));
    // The history first, oldest to newest, each revision with its links
    // pointing at the cards; then the card holds the newest text.
    let previous = '';
    for (const edit of wiki.pageHistory(page.revisions)) {
      const next = edit.next === null ? '' : wiki.rewriteWikiLinks(edit.next, { repoWikiUrl, cardFor }).text;
      if (next === previous) continue;
      const base = { _id: card._id, boardId: board._id, listId: list._id, swimlaneId };
      const plan = prepareCardFieldHistory({
        before: { ...base, description: previous }, after: { ...base, description: next },
        effectId: crypto.createHash('sha256').update(`wiki:${card._id}:${edit.commit}`).digest('hex'),
        userId, createdAt: new Date(edit.at), fields: SYNC_FIELDS,
      });
      // eslint-disable-next-line no-await-in-loop
      await persistSyncFieldHistory({ history: ChangeHistory, plan, assertCurrent: async () => {} });
      previous = next;
    }
    const { text, linkedCardIds } = wiki.rewriteWikiLinks(page.text, { repoWikiUrl, cardFor });
    // `.direct`: the history above already records this text as the newest
    // edit; a hooked write would record it a second time, dated today.
    // eslint-disable-next-line no-await-in-loop
    await Cards.direct.updateAsync(card._id, { $set: {
      description: text,
      ...(linkedCardIds.length ? { attachedCardIds: linkedCardIds.filter(id => id !== card._id).slice(0, 100) } : {}),
    } });
  }
  return pages.length;
}
