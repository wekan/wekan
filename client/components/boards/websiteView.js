// Board View / Website (websiteView.jade, models/lib/websiteView.js). The
// board's own subscription brings its lists, swimlanes, cards and
// attachments - for a visitor of a public board too - so the site is drawn
// from them as they change. Which page is open is in the address (?page=),
// so a page of the site can be linked to.
import { ReactiveCache } from '/imports/reactiveCache';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { Utils } from '/client/lib/utils';

const { websiteOf, pageFor } = require('/models/lib/websiteView');

function site() {
  const boardId = Utils.getCurrentBoardId();
  if (!boardId) return websiteOf({});
  return websiteOf({
    lists: ReactiveCache.getLists({ boardId, archived: false }) || [],
    swimlanes: ReactiveCache.getSwimlanes({ boardId, archived: false }) || [],
    cards: ReactiveCache.getCards({ boardId, archived: false }) || [],
  });
}

function currentId() {
  return FlowRouter.getQueryParam('page') || '';
}

Template.websiteView.helpers({
  boardTitle() {
    const board = Utils.getCurrentBoard();
    return board ? board.title : '';
  },
  site,
  currentId,
  shown() {
    return pageFor(site(), currentId());
  },
  shownCard() {
    const page = pageFor(site(), currentId());
    return page.cardId ? ReactiveCache.getCard(page.cardId) : null;
  },
  postDate() {
    const when = this.receivedAt || this.startAt || this.createdAt;
    return when ? new Date(when).toISOString().slice(0, 10) : '';
  },
  images() {
    return (ReactiveCache.getAttachments({ 'meta.cardId': this._id }) || [])
      .filter(a => a.isImage).map(a => ({ name: a.name, url: typeof a.link === 'function' ? a.link() : '' })).filter(a => a.url);
  },
  files() {
    return (ReactiveCache.getAttachments({ 'meta.cardId': this._id }) || [])
      .filter(a => !a.isImage).map(a => ({ name: a.name, url: typeof a.link === 'function' ? a.link() : '' })).filter(a => a.url);
  },
});

Template.websiteView.events({
  'click .js-website-page'(evt) {
    evt.preventDefault();
    FlowRouter.setQueryParams({ page: evt.currentTarget.getAttribute('data-id') });
    window.scrollTo(0, 0);
  },
  'click .js-website-home'(evt) {
    evt.preventDefault();
    FlowRouter.setQueryParams({ page: null });
  },
});
