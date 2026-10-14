import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import CardComments from '/models/cardComments';
import { Utils } from '/client/lib/utils';
import { liveAttachments } from '/models/lib/attachmentSoftDelete';
import { IMPORT_SOURCES } from '/models/lib/importSources';

const vcs = require('/models/lib/versionControlView');

// Board View / Version Control (versionControlView.jade, server/versionControlView.js,
// models/lib/versionControlView.js). Everything shown is the board's own data,
// already on the client; the two writes that need the server (New issue,
// Close / Reopen) are methods, and a comment is an ordinary card comment.

const TAB_ICONS = { issues: 'fa-dot-circle-o', milestones: 'fa-map-signs', labels: 'fa-tag', releases: 'fa-tags', wiki: 'fa-book', files: 'fa-file-o', history: 'fa-history' };
const TAB_LABELS = { issues: 'vcs-issues', milestones: 'vcs-milestones', labels: 'labels', releases: 'vcs-releases', wiki: 'vcs-wiki', files: 'attachments', history: 'history' };
const SOURCES = ['github', 'gitlab', 'gitea', 'forgejo'];

// A click on a link inside a rendered title or label (inlineViewer), not on
// the title itself.
const inRenderedLink = event => {
  const link = event.target && event.target.closest && event.target.closest('a[href]');
  return !!(link && event.currentTarget.contains(link) && link !== event.currentTarget);
};
const SOURCE_NAMES = { github: 'GitHub', gitlab: 'GitLab', gitea: 'Gitea', forgejo: 'Forgejo', jira: 'Jira' };

// The view's state. One board view is drawn at a time, so it lives here and is
// reset whenever the view is created.
const tab = new ReactiveVar('issues');
const query = new ReactiveVar('is:open');
const selectedId = new ReactiveVar(null);
const creating = new ReactiveVar(false);
const createError = new ReactiveVar('');
const syncing = new ReactiveVar(null);
const wikiPageId = new ReactiveVar(null);
const wikiHistory = new ReactiveVar(false);

function userName(userId) {
  const user = userId && ReactiveCache.getUser(userId);
  return user ? user.username || (user.profile && user.profile.fullname) || '' : '';
}

function shortDate(date) {
  return date ? new Date(date).toLocaleDateString() : '';
}

function humanSize(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

// Every card of the board as an issue row (models/lib/versionControlView.js).
function boardIssues() {
  const board = Utils.getCurrentBoard();
  if (!board) return [];
  const labels = board.labels || [];
  const labelById = new Map(labels.map(l => [l._id, l]));
  const milestones = vcs.boardMilestones(labels);
  const milestoneById = new Map(milestones.map(m => [m._id, m]));
  const listTitle = new Map((ReactiveCache.getLists({ boardId: board._id }) || []).map(l => [l._id, l.title]));
  const commentCount = new Map();
  CardComments.find({ boardId: board._id }, { fields: { cardId: 1 } }).forEach((c) => {
    commentCount.set(c.cardId, (commentCount.get(c.cardId) || 0) + 1);
  });
  // Releases and wiki pages have lists of their own; they are not issues.
  const notIssues = new Set((ReactiveCache.getLists({ boardId: board._id }) || [])
    .filter(l => [vcs.RELEASES_LIST_TITLE, vcs.WIKI_LIST_TITLE].includes(l.title)).map(l => l._id));
  const cards = (ReactiveCache.getCards({ boardId: board._id, type: { $nin: ['template-card', 'cardType-linkedBoard'] } }) || [])
    .filter(card => !notIssues.has(card.listId));
  return cards.map((card) => {
    const labelIds = card.labelIds || [];
    const plain = labelIds.filter(id => labelById.has(id) && !milestoneById.has(id));
    const ms = labelIds.filter(id => milestoneById.has(id));
    const assignees = [...new Set([...(card.assignees || []), ...(card.members || [])])];
    return {
      _id: card._id,
      number: vcs.issueNumber(card),
      title: card.title || '',
      body: vcs.issueBody(card.description),
      state: vcs.issueState(card, listTitle.get(card.listId)),
      labelIds,
      labels: plain.map(id => labelById.get(id)),
      labelNames: labelIds.map(id => (labelById.get(id) || {}).name).filter(Boolean),
      milestoneIds: ms,
      milestones: ms.map(id => milestoneById.get(id)),
      milestoneTitles: ms.map(id => milestoneById.get(id).title),
      author: card.requestedBy || userName(card.userId),
      authorId: card.userId,
      assignees,
      assigneeNames: assignees.map(userName).filter(Boolean),
      comments: commentCount.get(card._id) || 0,
      createdAt: card.createdAt,
      updatedAt: card.modifiedAt || card.dateLastActivity,
      synced: vcs.isSyncedIssue(card),
      syncSource: SOURCE_NAMES[card.syncSourceType] || card.syncSourceType || '',
    };
  });
}

// filterIssues compares `assignees` by name, the rows carry ids for avatars.
const searchable = issue => ({ ...issue, assignees: issue.assigneeNames });

function issueRow(issue) {
  return {
    ...issue,
    closed: issue.state === 'closed',
    numberText: issue.number ? `#${issue.number}` : '',
    date: shortDate(issue.createdAt),
  };
}

// `author:@me` is the current user, as on GitHub.
function effectiveQuery() {
  const me = userName(Meteor.userId());
  return query.get().replace(/(author|assignee):@me\b/gi, (m, key) => `${key}:${me || '@me'}`);
}

function openCardPopup(event, cardId) {
  const boardId = Utils.getCurrentBoardId();
  Meteor.subscribe('popupCardData', cardId, {
    onReady() {
      Session.set('popupCardId', cardId);
      Session.set('popupCardBoardId', boardId);
      if (!Popup.isOpen()) Popup.open('cardDetails')(event);
    },
  });
}

const SPECIAL_WIKI = ['_Sidebar', '_Footer'];

function specialList(title) {
  const boardId = Utils.getCurrentBoardId();
  return boardId ? ReactiveCache.getList({ boardId, title, archived: false }) : null;
}

function wikiCards() {
  const list = specialList(vcs.WIKI_LIST_TITLE);
  return list ? (ReactiveCache.getCards({ boardId: list.boardId, listId: list._id, archived: false }, { sort: { sort: 1 } }) || []) : [];
}

// The page shown: the chosen one, else Home, else the first.
function selectedWikiPage() {
  const cards = wikiCards().filter(c => !SPECIAL_WIKI.includes(c.title));
  return cards.find(c => c._id === wikiPageId.get()) || cards.find(c => /^home$/i.test(c.title)) || cards[0] || null;
}

const fileRow = file => ({ name: file.name, link: typeof file.link === 'function' ? file.link() : '' });

function filesOf(cardIds) {
  if (!cardIds.length) return [];
  return ReactiveCache.getAttachments(liveAttachments({ 'meta.cardId': { $in: cardIds } })) || [];
}

Template.versionControlView.onCreated(() => {
  tab.set('issues');
  wikiPageId.set(null);
  wikiHistory.set(false);
  query.set('is:open');
  selectedId.set(null);
  creating.set(false);
});

Template.versionControlView.helpers({
  boardId() { return Utils.getCurrentBoardId(); },
  boardTitle() {
    const board = Utils.getCurrentBoard();
    return board ? board.title : '';
  },
  isPublic() {
    const board = Utils.getCurrentBoard();
    return !!(board && board.permission === 'public');
  },
  canWrite() { return Utils.canModifyBoard(); },
  importSources() { return IMPORT_SOURCES.filter(s => SOURCES.includes(s.key)); },
  // The lists of this board that sync from a tracker (List menu / Sync):
  // "Sync now" brings the remaining issues, and with "Comments, labels, state
  // and files" their conversation too.
  syncedLists() {
    const boardId = Utils.getCurrentBoardId();
    return (ReactiveCache.getLists({ boardId, archived: false }) || [])
      .filter(l => l.syncSource && SOURCES.includes(l.syncSource.type))
      .map(l => ({ _id: l._id, title: l.title, source: SOURCE_NAMES[l.syncSource.type],
        project: l.syncSource.projectKey, error: l.syncSource.lastSyncError || '',
        busy: syncing.get() === l._id }));
  },
  tabs() {
    const board = Utils.getCurrentBoard();
    const issues = boardIssues();
    const counts = {
      issues: issues.filter(i => i.state === 'open').length,
      milestones: vcs.boardMilestones((board && board.labels) || []).length,
      labels: vcs.boardPlainLabels((board && board.labels) || []).length,
      files: filesOf(issues.map(i => i._id)).length,
    };
    return vcs.TABS.map(id => ({ id, icon: TAB_ICONS[id], labelKey: TAB_LABELS[id], count: counts[id], active: tab.get() === id }));
  },
  isTab(id) { return tab.get() === id; },
  creating() { return creating.get(); },
  query() { return query.get(); },
  stateIs(state) { return vcs.parseQuery(query.get()).state === state; },
  counts() { return vcs.stateCounts(boardIssues().map(searchable), effectiveQuery()); },
  sorts() {
    const current = vcs.parseQuery(query.get()).sort;
    return vcs.SORTS.map(id => ({ id, labelKey: `vcs-sort-${id}`, active: id === current }));
  },
  issues() {
    const rows = boardIssues();
    const byId = new Map(rows.map(r => [r._id, r]));
    return vcs.filterIssues(rows.map(searchable), effectiveQuery()).map(r => issueRow(byId.get(r._id)));
  },
  selectedIssue() {
    const id = selectedId.get();
    const issue = id && boardIssues().find(i => i._id === id);
    return issue ? issueRow(issue) : null;
  },
  milestones() {
    const board = Utils.getCurrentBoard();
    return vcs.milestoneProgress(vcs.boardMilestones((board && board.labels) || []), boardIssues())
      .map(m => ({ ...m, due: shortDate(m.dueAt) }));
  },
  labelRows() {
    const board = Utils.getCurrentBoard();
    return vcs.labelUsage((board && board.labels) || [], boardIssues());
  },
  // Releases: the cards of the Releases list, newest first.
  releases() {
    const list = specialList(vcs.RELEASES_LIST_TITLE);
    if (!list) return [];
    return (ReactiveCache.getCards({ boardId: list.boardId, listId: list._id, archived: false }) || [])
      .map(card => ({ _id: card._id, title: card.title, body: vcs.issueBody(card.description), date: shortDate(card.receivedAt || card.createdAt),
        at: new Date(card.receivedAt || card.createdAt || 0).getTime(), files: filesOf([card._id]).map(fileRow) }))
      .sort((a, b) => b.at - a.at);
  },
  // Wiki: the pages are the cards of the Wiki list (models/lib/githubWiki.js).
  wikiPages() {
    const current = selectedWikiPage();
    return wikiCards().filter(c => !SPECIAL_WIKI.includes(c.title)).map(c => ({ _id: c._id, title: c.title, active: current && current._id === c._id }));
  },
  wikiPage() {
    const page = selectedWikiPage();
    return page && { _id: page._id, title: page.title, text: page.description || '' };
  },
  wikiSidebar() { const c = wikiCards().find(x => x.title === '_Sidebar'); return c ? c.description || '' : ''; },
  wikiFooter() { const c = wikiCards().find(x => x.title === '_Footer'); return c ? c.description || '' : ''; },
  wikiHistory() { return wikiHistory.get(); },
  files() {
    const issues = new Map(boardIssues().map(i => [i._id, i]));
    return filesOf([...issues.keys()]).map((file) => {
      const issue = issues.get(file.meta && file.meta.cardId) || {};
      return {
        name: file.name,
        link: typeof file.link === 'function' ? file.link() : '',
        size: humanSize(file.size),
        cardId: issue._id,
        number: issue.number,
        numberText: issue.number ? `#${issue.number}` : '',
        issueTitle: issue.title,
        date: shortDate(file.uploadedAt || (file.meta && file.meta.uploadedAt)),
      };
    });
  },
});

function setQuery(tpl, value) {
  query.set(value);
  selectedId.set(null);
  tab.set('issues');
}

Template.versionControlView.events({
  'click .js-vcs-tab'(event) {
    event.preventDefault();
    tab.set(event.currentTarget.dataset.tab);
    selectedId.set(null);
    creating.set(false);
  },
  'keydown .js-vcs-search'(event, tpl) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    setQuery(tpl, String(event.currentTarget.value || ''));
  },
  'click .js-vcs-state'(event, tpl) {
    event.preventDefault();
    const rest = query.get().replace(/(^|\s)(is|state):(open|closed)\b/gi, ' ').trim();
    setQuery(tpl, `is:${event.currentTarget.dataset.state} ${rest}`.trim());
  },
  'change .js-vcs-sort'(event, tpl) {
    setQuery(tpl, vcs.withQualifier(query.get(), 'sort', event.currentTarget.value));
  },
  // The clickable titles and labels are spans with role=link: Enter and
  // Space click them, as on a link or a button.
  'keydown [role="link"]'(event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    event.currentTarget.click();
  },
  'click .js-vcs-label'(event, tpl) {
    // A link inside a rendered title opens itself.
    if (inRenderedLink(event)) return;
    event.preventDefault();
    setQuery(tpl, vcs.withQualifier(tab.get() === 'issues' ? query.get() : 'is:open', 'label', event.currentTarget.dataset.name));
  },
  'click .js-vcs-milestone'(event, tpl) {
    // A link inside a rendered title opens itself.
    if (inRenderedLink(event)) return;
    event.preventDefault();
    setQuery(tpl, vcs.withQualifier(tab.get() === 'issues' ? query.get() : 'is:open', 'milestone', event.currentTarget.dataset.title));
  },
  'click .js-vcs-open-issue'(event) {
    // A link inside a rendered title opens itself.
    if (inRenderedLink(event)) return;
    event.preventDefault();
    tab.set('issues');
    creating.set(false);
    selectedId.set(event.currentTarget.dataset.cardId);
  },
  'click .js-vcs-new'() {
    createError.set('');
    creating.set(true);
  },
  'click .js-vcs-sync'(event) {
    event.preventDefault();
    const listId = event.currentTarget.dataset.listId;
    if (!listId || syncing.get()) return;
    syncing.set(listId);
    Meteor.call('syncListNow', listId, () => syncing.set(null));
  },
  'click .js-vcs-wiki-page'(event) {
    // A link inside a rendered title opens itself.
    if (inRenderedLink(event)) return;
    event.preventDefault();
    wikiPageId.set(event.currentTarget.dataset.cardId);
    wikiHistory.set(false);
  },
  // A link between pages points at the other page's card: stay in the wiki.
  'click .vcs-wiki-body a'(event) {
    const href = event.currentTarget.getAttribute('href') || '';
    const target = wikiCards().find(c => href.endsWith(`/${c._id}`));
    if (!target) return;
    event.preventDefault();
    wikiPageId.set(target._id);
    wikiHistory.set(false);
  },
  'click .js-vcs-wiki-history'(event) {
    event.preventDefault();
    wikiHistory.set(!wikiHistory.get());
  },
  'click .js-vcs-wiki-edit'(event) {
    event.preventDefault();
    const page = selectedWikiPage();
    if (page) openCardPopup(event, page._id);
  },
  'click .js-vcs-export'(event) {
    event.preventDefault();
    Popup.open('exportBoard')(event);
  },
});

Template.versionControlIssue.helpers({
  canWrite() { return Utils.canModifyBoard(); },
  canComment() { return Utils.currentUserCan('comment'); },
  conversation() {
    return CardComments.find({ cardId: this._id }, { sort: { createdAt: 1 } }).fetch().map(c => ({
      _id: c._id,
      userId: c.userId,
      author: userName(c.userId),
      time: c.createdAt ? new Date(c.createdAt).toLocaleString() : '',
      text: c.text,
    }));
  },
  issueFiles() {
    return filesOf([this._id]).map(file => ({
      name: file.name,
      link: typeof file.link === 'function' ? file.link() : '',
    }));
  },
});

Template.versionControlIssue.events({
  'click .js-vcs-back'(event) {
    event.preventDefault();
    selectedId.set(null);
  },
  'submit .js-vcs-comment'(event, tpl) {
    event.preventDefault();
    const input = tpl.$('.js-vcs-comment-text');
    const text = String(input.val() || '').trim();
    const card = ReactiveCache.getCard(this._id);
    if (!text || !card) return;
    CardComments.insert({ text, boardId: card.boardId, cardId: card._id, parentId: '' });
    input.val('');
  },
  'click .js-vcs-set-state'(event) {
    event.preventDefault();
    Meteor.call('vcsSetIssueState', this._id, event.currentTarget.dataset.state);
  },
  'click .js-vcs-open-card'(event) {
    event.preventDefault();
    openCardPopup(event, this._id);
  },
});

Template.versionControlNewIssue.helpers({
  error() { return createError.get(); },
  boardLabels() {
    const board = Utils.getCurrentBoard();
    return ((board && board.labels) || []).filter(l => l && l._id);
  },
});

Template.versionControlNewIssue.events({
  'click .js-vcs-cancel'() { creating.set(false); },
  'submit .js-vcs-create'(event, tpl) {
    event.preventDefault();
    const input = {
      title: String(tpl.$('.js-vcs-new-title').val() || ''),
      body: String(tpl.$('.js-vcs-new-body').val() || ''),
      labelIds: tpl.$('.js-vcs-new-label:checked').toArray().map(el => el.value),
    };
    createError.set('');
    Meteor.call('vcsCreateIssue', Utils.getCurrentBoardId(), input, (error, result) => {
      if (error) {
        createError.set(TAPi18n.__(String(error.error || error.reason || 'error')));
        return;
      }
      creating.set(false);
      if (result && result.cardId) selectedId.set(result.cardId);
    });
  },
});
