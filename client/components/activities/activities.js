import DOMPurify from 'dompurify';
import { TAPi18n } from '/imports/i18n';

const activitiesPerPage = 500;

BlazeComponent.extendComponent({
  onCreated() {
    // XXX Should we use ReactiveNumber?
    this.page = new ReactiveVar(1);
    this.loadNextPageLocked = false;
    // TODO is sidebar always available? E.g. on small screens/mobile devices
    const sidebar = Sidebar;
    sidebar && sidebar.callFirstWith(null, 'resetNextPeak');
    this.autorun(() => {
      let mode = this.data().mode;
      const capitalizedMode = Utils.capitalize(mode);
      let searchId;
      if (mode === 'linkedcard' || mode === 'linkedboard') {
        searchId = Utils.getCurrentCard().linkedId;
        mode = mode.replace('linked', '');
      } else if (mode === 'card') {
        searchId = Utils.getCurrentCardId();
      } else {
        searchId = Session.get(`current${capitalizedMode}`);
      }
      const limit = this.page.get() * activitiesPerPage;
      const user = Meteor.user();
      const hideSystem = user ? user.hasHiddenSystemMessages() : false;
      if (searchId === null) return;

      this.subscribe('activities', mode, searchId, limit, hideSystem, () => {
        this.loadNextPageLocked = false;

        // TODO the guard can be removed as soon as the TODO above is resolved
        if (!sidebar) return;
        // If the sibear peak hasn't increased, that mean that there are no more
        // activities, and we can stop calling new subscriptions.
        // XXX This is hacky! We need to know excatly and reactively how many
        // activities there are, we probably want to denormalize this number
        // dirrectly into card and board documents.
        const nextPeakBefore = sidebar.callFirstWith(null, 'getNextPeak');
        sidebar.calculateNextPeak();
        const nextPeakAfter = sidebar.callFirstWith(null, 'getNextPeak');
        if (nextPeakBefore === nextPeakAfter) {
          sidebar.callFirstWith(null, 'resetNextPeak');
        }
      });
    });
  },
  loadNextPage() {
    if (this.loadNextPageLocked === false) {
      this.page.set(this.page.get() + 1);
      this.loadNextPageLocked = true;
    }
  },
}).register('activities');

Template.activities.helpers({
  activities() {
    const ret = this.card.activities();
    return ret;
  },
});

BlazeComponent.extendComponent({
  checkItem() {
    const checkItemId = this.currentData().activity.checklistItemId;
    const checkItem = ChecklistItems.findOne({ _id: checkItemId });
    return checkItem && checkItem.title;
  },

  boardLabelLink() {
    const data = this.currentData();
    const currentBoardId = Session.get('currentBoard');
    if (data.mode !== 'board') {
      // data.mode: card, linkedcard, linkedboard
      return createBoardLink(data.activity.board(), data.activity.listName ? data.activity.listName : null);
    }
    else if (currentBoardId != data.activity.boardId) {
      // data.mode: board
      // current activitie is linked
      return createBoardLink(data.activity.board(), data.activity.listName ? data.activity.listName : null);
    }
    return TAPi18n.__('this-board');
  },

  cardLabelLink() {
    const data = this.currentData();
    const currentBoardId = Session.get('currentBoard');
    if (data.mode == 'card') {
      // data.mode: card
      return TAPi18n.__('this-card');
    }
    else if (data.mode !== 'board') {
      // data.mode: linkedcard, linkedboard
      return createCardLink(data.activity.card(), null);
    }
    else if (currentBoardId != data.activity.boardId) {
      // data.mode: board
      // current activitie is linked
      return createCardLink(data.activity.card(), data.activity.board().title);
    }
    return createCardLink(this.currentData().activity.card(), null);
  },

  cardLink() {
    const data = this.currentData();
    const currentBoardId = Session.get('currentBoard');
    if (data.mode !== 'board') {
      // data.mode: card, linkedcard, linkedboard
      return createCardLink(data.activity.card(), null);
    }
    else if (currentBoardId != data.activity.boardId) {
      // data.mode: board
      // current activitie is linked
      return createCardLink(data.activity.card(), data.activity.board().title);
    }
    return createCardLink(this.currentData().activity.card(), null);
  },

  receivedDate() {
    const receivedDate = this.currentData().activity.card();
    if (!receivedDate) return null;
    return receivedDate.receivedAt;
  },

  startDate() {
    const startDate = this.currentData().activity.card();
    if (!startDate) return null;
    return startDate.startAt;
  },

  dueDate() {
    const dueDate = this.currentData().activity.card();
    if (!dueDate) return null;
    return dueDate.dueAt;
  },

  endDate() {
    const endDate = this.currentData().activity.card();
    if (!endDate) return null;
    return endDate.endAt;
  },

  lastLabel() {
    const lastLabelId = this.currentData().activity.labelId;
    if (!lastLabelId) return null;
    const lastLabel = Boards.findOne(
      this.currentData().activity.boardId,
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
    const lastCustomField = CustomFields.findOne(
      this.currentData().activity.customFieldId,
    );
    if (!lastCustomField) return null;
    return lastCustomField.name;
  },

  lastCustomFieldValue() {
    const lastCustomField = CustomFields.findOne(
      this.currentData().activity.customFieldId,
    );
    if (!lastCustomField) return null;
    const value = this.currentData().activity.value;
    if (
      lastCustomField.settings.dropdownItems &&
      lastCustomField.settings.dropdownItems.length > 0
    ) {
      const dropDownValue = _.find(
        lastCustomField.settings.dropdownItems,
        item => {
          return item._id === value;
        },
      );
      if (dropDownValue) return dropDownValue.name;
    }
    return value;
  },

  listLabel() {
    const activity = this.currentData().activity;
    const list = activity.list();
    return (list && list.title) || activity.title;
  },

  sourceLink() {
    const source = this.currentData().activity.source;
    if (source) {
      if (source.url) {
        return Blaze.toHTML(
          HTML.A(
            {
              href: source.url,
            },
            DOMPurify.sanitize(source.system, {
              ALLOW_UNKNOWN_PROTOCOLS: true,
            }),
          ),
        );
      } else {
        return DOMPurify.sanitize(source.system, {
          ALLOW_UNKNOWN_PROTOCOLS: true,
        });
      }
    }
    return null;
  },

  memberLink() {
    return Blaze.toHTMLWithData(Template.memberName, {
      user: this.currentData().activity.member(),
    });
  },

  attachmentLink() {
    const attachment = this.currentData().activity.attachment();
    // trying to display url before file is stored generates js errors
    return (
      (attachment &&
        attachment.path &&
        Blaze.toHTML(
          HTML.A(
            {
              href: `${attachment.link()}?download=true`,
              target: '_blank',
            },
            DOMPurify.sanitize(attachment.name),
          ),
        )) ||
      DOMPurify.sanitize(this.currentData().activity.attachmentName)
    );
  },

  customField() {
    const customField = this.currentData().activity.customField();
    if (!customField) return null;
    return customField.name;
  },

  events() {
    return [
      {
        // XXX We should use Popup.afterConfirmation here
        'click .js-delete-comment': Popup.afterConfirm('deleteComment', () => {
          const commentId = this.data().activity.commentId;
          CardComments.remove(commentId);
          Popup.back();
        }),
        'submit .js-edit-comment'(evt) {
          evt.preventDefault();
          const commentText = this.currentComponent()
            .getValue()
            .trim();
          const commentId = Template.parentData().activity.commentId;
          if (commentText) {
            CardComments.update(commentId, {
              $set: {
                text: commentText,
              },
            });
          }
        },
      },
    ];
  },
}).register('activity');

Template.activity.helpers({
  sanitize(value) {
    return DOMPurify.sanitize(value, { ALLOW_UNKNOWN_PROTOCOLS: true });
  },
});

Template.commentReactions.events({
  'click .reaction'(event) {
    if (Meteor.user().isBoardMember()) {
      const codepoint = event.currentTarget.dataset['codepoint'];
      const commentId = Template.instance().data.commentId;
      const cardComment = CardComments.findOne({_id: commentId});
      cardComment.toggleReaction(codepoint);
    }
  },
  'click .open-comment-reaction-popup': Popup.open('addReaction'),
})

Template.addReactionPopup.events({
  'click .add-comment-reaction'(event) {
    if (Meteor.user().isBoardMember()) {
      const codepoint = event.currentTarget.dataset['codepoint'];
      const commentId = Template.instance().data.commentId;
      const cardComment = CardComments.findOne({_id: commentId});
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
    return userIds.includes(Meteor.user()._id);
  },
  userNames(userIds) {
    return Users.find({_id: {$in: userIds}})
                .map(user => user.profile.fullname)
                .join(', ');
  }
})

function createCardLink(card, board) {
  if (!card) return '';
  let text = card.title;
  if (board) text = `${board} > ` + text;
  return (
    card &&
    Blaze.toHTML(
      HTML.A(
        {
          href: card.originRelativeUrl(),
          class: 'action-card',
        },
        DOMPurify.sanitize(text, { ALLOW_UNKNOWN_PROTOCOLS: true }),
      ),
    )
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
        DOMPurify.sanitize(text, { ALLOW_UNKNOWN_PROTOCOLS: true }),
      ),
    )
  );
}
