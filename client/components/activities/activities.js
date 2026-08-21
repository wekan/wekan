import { ReactiveCache } from '/imports/reactiveCache';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import DOMPurify from 'dompurify';
import { sanitizeHTML, sanitizeText } from '/imports/lib/secureDOMPurify';
import { TAPi18n } from '/imports/i18n';
import { Utils } from '/client/lib/utils';
import { getSidebarInstance } from '/client/features/sidebar/service';
import { activityCardLinkData } from '/models/lib/activityCardLink';

// #6480/#6481: 500 was far more than the sidebar/card activity feed ever shows
// at once, and with FerretDB (no oplog) every live cursor is re-run on a timer —
// so a 500-row activities cursor was re-fetched and re-diffed on every poll for
// each open board/card. 50 covers the visible feed; infinite scroll still pulls
// the next page on demand (the server cursor is index-bounded either way).
const activitiesPerPage = 50;

Template.activities.onCreated(function () {
  // Register with sidebar so it can call loadNextPage on us
  const Sidebar = getSidebarInstance();
  if (Sidebar) {
    Sidebar.activitiesInstance = this;
  }

  // XXX Should we use ReactiveNumber?
  this.page = new ReactiveVar(1);
  this.loadNextPageLocked = false;
  this.loadNextPage = () => {
    if (this.loadNextPageLocked === false) {
      this.page.set(this.page.get() + 1);
      this.loadNextPageLocked = true;
    }
  };

  // TODO is sidebar always available? E.g. on small screens/mobile devices
  const sidebar = getSidebarInstance();
  if (sidebar && sidebar.infiniteScrolling) {
    sidebar.infiniteScrolling.resetNextPeak();
  }
  this.autorun(() => {
    const data = Template.currentData();
    let mode = data?.mode;
    if (mode) {
      const capitalizedMode = Utils.capitalize(mode);
      let searchId;
      const showActivities = _showActivities(data);
      if (mode === 'linkedcard' || mode === 'linkedboard') {
        const currentCard = Utils.getCurrentCard();
        searchId = currentCard.linkedId;
        mode = mode.replace('linked', '');
      } else if (mode === 'card') {
        searchId = Utils.getCurrentCardId();
      } else {
        searchId = Session.get(`current${capitalizedMode}`);
      }
      const limit = this.page.get() * activitiesPerPage;
      if (searchId === null) return;

      this.subscribe('activities', mode, searchId, limit, showActivities, () => {
        this.loadNextPageLocked = false;

        // TODO the guard can be removed as soon as the TODO above is resolved
        if (!sidebar || !sidebar.infiniteScrolling) return;
        // If the sidebar peak hasn't increased, that means that there are no more
        // activities, and we can stop calling new subscriptions.
        const nextPeakBefore = sidebar.infiniteScrolling.getNextPeak();
        sidebar.calculateNextPeak();
        const nextPeakAfter = sidebar.infiniteScrolling.getNextPeak();
        if (nextPeakBefore === nextPeakAfter) {
          sidebar.infiniteScrolling.resetNextPeak();
        }
      });
    }
  });
});

function _showActivities(data) {
  // Instance-wide switch (Admin Panel / Settings / Hide board activities on all
  // boards). Read ONCE from the global settings; when it is on, no board shows
  // its activities and the per-board value is not consulted at all.
  if (ReactiveCache.getCurrentSetting()?.hideBoardActivitiesOnAllBoards) {
    return false;
  }
  let ret = false;
  let mode = data?.mode;
  if (mode) {
    if (mode === 'linkedcard' || mode === 'linkedboard') {
      const currentCard = Utils.getCurrentCard();
      ret = currentCard.showActivities ?? false;
    } else if (mode === 'card') {
      // The card's Activities section is COLLAPSED by default and renders this
      // template only when its caret has been opened - so being here means the
      // reader asked for the history, and the history is what they get.
      //
      // Until the section had a caret, the card carried a `showActivities` flag
      // toggled by an eye beside the heading, and `false` - the default -
      // subscribed to comments ONLY (server/publications/activities.js). The eye
      // is gone: one control for one idea. Nothing is fetched at all while the
      // section is closed, which is the cheaper half of what the flag was for,
      // and opening it now means the whole history rather than a filtered part
      // of it. Do not consult the obsolete per-card `showActivities` value here:
      // existing cards commonly persist its old default (`false`), which would
      // silently turn an explicitly opened Activities section into comments-only.
      ret = true;
    } else {
      ret = Utils.getCurrentBoard().showActivities ?? false;
    }
  }
  return ret;
}

Template.activities.helpers({
  showActivities() {
    const data = Template.currentData();
    return _showActivities(data);
  },

  activities() {
    const activities = this.card?.activities?.();
    return activities || [];
  },
});

Template.boardActivities.helpers({
  boardActivitiesList() {
    const board = Utils.getCurrentBoard();
    const activities = board?.activities?.();
    return activities || [];
  },
});

Template.cardActivities.helpers({
  cardActivitiesList() {
    const data = Template.currentData();
    const card = data?.card;
    const activities = card?.activities?.();
    return activities || [];
  },
});

Template.activity.helpers({
  checkItem() {
    const checkItemId = this.activity.checklistItemId;
    const checkItem = ReactiveCache.getChecklistItem(checkItemId);
    return checkItem && checkItem.title;
  },

  boardLabelLink() {
    const currentBoardId = Session.get('currentBoard');
    if (this.mode !== 'board') {
      return createBoardLink(this.activity.board(), this.activity.listName ? this.activity.listName : null);
    }
    else if (currentBoardId != this.activity.boardId) {
      return createBoardLink(this.activity.board(), this.activity.listName ? this.activity.listName : null);
    }
    return TAPi18n.__('this-board');
  },

  cardLabelLink() {
    const currentBoardId = Session.get('currentBoard');
    if (this.mode == 'card') {
      return TAPi18n.__('this-card');
    }
    else if (this.mode !== 'board') {
      return createCardLink(this.activity, this.activity.card(), null);
    }
    else if (currentBoardId != this.activity.boardId) {
      return createCardLink(this.activity, this.activity.card(), this.activity.board().title);
    }
    return createCardLink(this.activity, this.activity.card(), null);
  },

  cardLink() {
    const currentBoardId = Session.get('currentBoard');
    if (this.mode !== 'board') {
      return createCardLink(this.activity, this.activity.card(), null);
    }
    else if (currentBoardId != this.activity.boardId) {
      return createCardLink(this.activity, this.activity.card(), this.activity.board().title);
    }
    return createCardLink(this.activity, this.activity.card(), null);
  },

  receivedDate() {
    const card = this.activity.card();
    if (!card) return null;
    return card.receivedAt;
  },

  startDate() {
    const card = this.activity.card();
    if (!card) return null;
    return card.startAt;
  },

  dueDate() {
    const card = this.activity.card();
    if (!card) return null;
    return card.dueAt;
  },

  endDate() {
    const card = this.activity.card();
    if (!card) return null;
    return card.endAt;
  },

  lastLabel() {
    const lastLabelId = this.activity.labelId;
    if (!lastLabelId) return null;
    const lastLabel = ReactiveCache.getBoard(
      this.activity.boardId,
    ).getLabelById(lastLabelId);
    if (lastLabel && (lastLabel.name === undefined || lastLabel.name === '')) {
      return lastLabel.color;
    } else if (lastLabel.name !== undefined && lastLabel.name !== '') {
      return lastLabel.name;
    } else {
      return null;
    }
  },

  lastCustomField() {
    const lastCustomField = ReactiveCache.getCustomField(
      this.activity.customFieldId,
    );
    if (!lastCustomField) return null;
    return lastCustomField.name;
  },

  lastCustomFieldValue() {
    const lastCustomField = ReactiveCache.getCustomField(
      this.activity.customFieldId,
    );
    if (!lastCustomField) return null;
    const value = this.activity.value;
    if (
      lastCustomField.settings.dropdownItems &&
      lastCustomField.settings.dropdownItems.length > 0
    ) {
      const dropDownValue = lastCustomField.settings.dropdownItems.find(
        item => {
          return item._id === value;
        },
      );
      if (dropDownValue) return dropDownValue.name;
    }
    return value;
  },

  listLabel() {
    const activity = this.activity;
    const list = activity.list();
    return (list && list.title) || activity.title;
  },

  sourceLink() {
    const source = this.activity.source;
    if (source) {
      // XSS fix (reported by meifukun): source.url is imported from an external
      // board (e.g. a Trello board's `url`) and was rendered as an <a href> with
      // no scheme check, so a `javascript:` (or data:/vbscript:) URL executed in
      // the board admin's session on click and could exfiltrate Meteor.loginToken.
      // Only render a link for an http(s) URL; otherwise show the plain (sanitized)
      // source name with no href.
      if (source.url && /^https?:\/\//i.test(String(source.url))) {
        return Blaze.toHTML(
          HTML.A(
            {
              href: source.url,
            },
            sanitizeHTML(source.system),
          ),
        );
      }
      return sanitizeHTML(source.system);
    }
    return null;
  },

  memberLink() {
    return Blaze.toHTMLWithData(Template.memberName, {
      user: this.activity.member(),
    });
  },

  attachmentLink() {
    const attachment = this.activity.attachment();
    const attachmentUrl = attachment && typeof attachment.link === 'function'
      ? attachment.link()
      : '';
    // trying to display url before file is stored generates js errors
    return (
      (attachment &&
        attachment.path &&
        attachmentUrl &&
        Blaze.toHTML(
          HTML.A(
            {
              href: `${attachmentUrl}?download=true`,
              target: '_blank',
            },
            sanitizeText(attachment.name),
          ),
        )) ||
      sanitizeText(this.activity.attachmentName)
    );
  },

  customField() {
    const customField = this.activity.customField();
    if (!customField) return null;
    return customField.name;
  },
});

Template.activity.helpers({
  sanitize(value) {
    return sanitizeHTML(value);
  },
});

Template.commentReactions.events({
  'click .reaction'(event) {
    const user = ReactiveCache.getCurrentUser();
    if (user && user.isBoardMember()) {
      const codepoint = event.currentTarget.dataset['codepoint'];
      const commentId = Template.instance().data.commentId;
      const cardComment = ReactiveCache.getCardComment(commentId);
      cardComment.toggleReaction(codepoint);
    }
  },
  'click .open-comment-reaction-popup': Popup.open('addReaction'),
})

Template.addReactionPopup.events({
  'click .add-comment-reaction'(event) {
    const user = ReactiveCache.getCurrentUser();
    if (user && user.isBoardMember()) {
      const codepoint = event.currentTarget.dataset['codepoint'];
      const commentId = Template.instance().data.commentId;
      const cardComment = ReactiveCache.getCardComment(commentId);
      cardComment.toggleReaction(codepoint);
    }
    Popup.back();
  },
})

Template.addReactionPopup.helpers({
  codepoints() {
    // Starting set of unicode codepoints as comment reactions
    return [
      '&#128077;',
      '&#128078;',
      '&#128064;',
      '&#9989;',
      '&#10060;',
      '&#128591;',
      '&#128079;',
      '&#127881;',
      '&#128640;',
      '&#128522;',
      '&#129300;',
      '&#128532;'];
  }
})

Template.commentReactions.helpers({
  isSelected(userIds) {
    return Meteor.userId() && userIds.includes(Meteor.userId());
  },
  userNames(userIds) {
    const ret = ReactiveCache.getUsers({_id: {$in: userIds}})
      .map(user => user.profile.fullname)
      .join(', ');
    return ret;
  }
})

// #3144: the card is not always here. An ARCHIVED card is not published to the
// client, so `activity.card()` returned nothing and every sentence that named it
// was rendered around a hole - "Activities for archived card displayed as
// undefined on board settings".
//
// The activity itself recorded the title in most cases (`cardTitle`), and a card
// URL can be built from the ids it carries, so the link survives the card not
// being here. models/lib/activityCardLink.js decides what to show;
// this turns it into the anchor, and marks an archived card the way the reporter
// asked for: "{{ card title }} [archived]".
function createCardLink(activity, card, boardTitle) {
  const link = activityCardLinkData(activity, card, card ? card.board && card.board() : null);
  if (!link) {
    // Nothing named the card - an old activity from before the titles were
    // recorded, on a card this client cannot see. Say "this card" rather than
    // leaving a gap in the middle of a sentence.
    return sanitizeHTML(TAPi18n.__('this-card'));
  }
  let text = link.title;
  if (link.archived) text = `${text} [${TAPi18n.__('archived')}]`;
  if (boardTitle) text = `${boardTitle} > ` + text;
  if (!link.url) return sanitizeHTML(text);
  return Blaze.toHTML(
    HTML.A(
      {
        href: link.url,
        class: 'action-card',
      },
      sanitizeHTML(text),
    ),
  );
}

function createBoardLink(board, list) {
  let text = board.title;
  if (list) text += `: ${list}`;
  return (
    board &&
    Blaze.toHTML(
      HTML.A(
        {
          href: board.originRelativeUrl(),
          class: 'action-board',
        },
        sanitizeHTML(text),
      ),
    )
  );
}
