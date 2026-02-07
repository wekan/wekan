import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { CustomFieldStringTemplate } from '/client/lib/customFields';
import { handleFileUpload } from './attachments';
import uploadProgressManager from '../../lib/uploadProgressManager';

// Template.cards.events({
//   'click .member': Popup.open('cardMember')
// });

BlazeComponent.extendComponent({
  template() {
    return 'minicard';
  },

  onRendered() {
    // cannot be done with CSS because newlines
    // rendered by the JADE engine count as non empty
    // and some "empty" divs are nested
    // this is not very robust and could probably be
    // done with a helper, but it could be in fact worse
    // because we would need to to if (allowsX() && X() && ...)
    const body = $(this.find('.minicard-body'));
    if (!body) {return}
    let emptyChildren;
    do  {
      emptyChildren = body.find('*').filter((_, e) => !e.classList.contains('fa') && $(e).html().trim().length === 0).remove();
    } while (emptyChildren.length > 0)
    if (body.html().trim().length === 0) {
      body.parent().find('hr:has(+ .minicard-body)').remove();
    }
  },

  formattedCurrencyCustomFieldValue(definition) {
    const customField = this.data()
      .customFieldsWD()
      .find(f => f._id === definition._id);
    const customFieldTrueValue =
      customField && customField.trueValue ? customField.trueValue : '';

    const locale = TAPi18n.getLanguage();
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: definition.settings.currencyCode,
    }).format(customFieldTrueValue);
  },

  formattedStringtemplateCustomFieldValue(definition) {
    const customField = this.data()
      .customFieldsWD()
      .find(f => f._id === definition._id);

    const customFieldTrueValue =
      customField && customField.trueValue ? customField.trueValue : [];

    const ret = new CustomFieldStringTemplate(definition).getFormattedValue(customFieldTrueValue);
    return ret;
  },

  isWatching() {
    const card = this.currentData();
    return card.findWatcher(Meteor.userId());
  },

  isSelected() {
    const card = this.currentData();
    return Session.get('currentCard') === card._id;
  },

  /** opens the card label popup only if clicked onto a label
   * <li> this is necessary to have the data context of the minicard.
   *      if .js-card-label is used at click event, then only the data context of the label itself is available at this.currentData()
   */
  cardLabelsPopup(event) {
    if (this.find('.js-card-label:hover')) {
      event.preventDefault();
      event.stopPropagation();
      Popup.open("cardLabels")(event, {dataContextIfCurrentDataIsUndefined: this.currentData()});
    }
  },

  async toggleChecklistItem() {
    const item = this.currentData();
    if (item && item._id) {
      await item.toggleItem();
    }
  },

  events() {
    return [
      {
        'click .js-linked-link'() {
          if (this.data().isLinkedCard()) Utils.goCardId(this.data().linkedId);
          else if (this.data().isLinkedBoard())
            Utils.goBoardId(this.data().linkedId);
        },
        'click .js-toggle-minicard-label-text'() {
          if (window.localStorage.getItem('hiddenMinicardLabelText')) {
            window.localStorage.removeItem('hiddenMinicardLabelText'); //true
          } else {
            window.localStorage.setItem('hiddenMinicardLabelText', 'true'); //true
          }
        },
        'click span.badge-icon.fa.fa-sort, click span.badge-text.check-list-sort' : Popup.open("editCardSortOrder"),
        'click .minicard-labels' : this.cardLabelsPopup,
        'click .js-open-minicard-details-menu'(event) {
          event.preventDefault();
          event.stopPropagation();
          Popup.open('cardDetailsActions').call(this, event);
        },
        // Drag and drop file upload handlers
        'dragover .minicard'(event) {
          // Only prevent default for file drags to avoid interfering with sortable
          const dataTransfer = event.originalEvent.dataTransfer;
          if (dataTransfer && dataTransfer.types && dataTransfer.types.includes('Files')) {
            event.preventDefault();
            event.stopPropagation();
          }
        },
        'dragenter .minicard'(event) {
          const dataTransfer = event.originalEvent.dataTransfer;
          if (dataTransfer && dataTransfer.types && dataTransfer.types.includes('Files')) {
            event.preventDefault();
            event.stopPropagation();
            const card = this.data();
            const board = card.board();
            // Only allow drag-and-drop if user can modify card and board allows attachments
            if (Utils.canModifyCard() && board && board.allowsAttachments) {
              $(event.currentTarget).addClass('is-dragging-over');
            }
          }
        },
        'dragleave .minicard'(event) {
          const dataTransfer = event.originalEvent.dataTransfer;
          if (dataTransfer && dataTransfer.types && dataTransfer.types.includes('Files')) {
            event.preventDefault();
            event.stopPropagation();
            $(event.currentTarget).removeClass('is-dragging-over');
          }
        },
        'drop .minicard'(event) {
          const dataTransfer = event.originalEvent.dataTransfer;
          if (dataTransfer && dataTransfer.types && dataTransfer.types.includes('Files')) {
            event.preventDefault();
            event.stopPropagation();
            $(event.currentTarget).removeClass('is-dragging-over');

            const card = this.data();
            const board = card.board();

            // Check permissions
            if (!Utils.canModifyCard() || !board || !board.allowsAttachments) {
              return;
            }

            // Check if this is a file drop (not a card reorder)
            if (!dataTransfer.files || dataTransfer.files.length === 0) {
              return;
            }

            const files = dataTransfer.files;
            if (files && files.length > 0) {
              handleFileUpload(card, files);
            }
          }
        },
      }
    ];
  },
}).register('minicard');

BlazeComponent.extendComponent({
  template() {
    return 'minicardChecklist';
  },

  events() {
    return [
      {
        'click .js-open-checklist-menu'(event) {
          const data = this.currentData();
          const checklist = data.checklist || data;
          const card = data.card || this.data();
          const context = { currentData: () => ({ checklist, card }) };
          Popup.open('checklistActions').call(context, event);
        },
      },
    ];
  },

  visibleItems() {
    const checklist = this.currentData().checklist || this.currentData();
    const items = checklist.items();

    return items.filter(item => {
      // Hide finished items if hideCheckedChecklistItems is true
      if (item.isFinished && checklist.hideCheckedChecklistItems) {
        return false;
      }
      // Hide all items if hideAllChecklistItems is true
      if (checklist.hideAllChecklistItems) {
        return false;
      }
      return true;
    });
  },
}).register('minicardChecklist');

Template.minicard.helpers({
  hiddenMinicardLabelText() {
    const currentUser = ReactiveCache.getCurrentUser();
    if (currentUser) {
      return (currentUser.profile || {}).hiddenMinicardLabelText;
    } else if (window.localStorage.getItem('hiddenMinicardLabelText')) {
      return true;
    } else {
      return false;
    }
  },
  // XXX resolve this nasty hack for https://github.com/veliovgroup/Meteor-Files/issues/763
  sess() {
    return Meteor.connection && Meteor.connection._lastSessionId
      ? Meteor.connection._lastSessionId
      : null;
  },
  isWatching() {
    return this.findWatcher(Meteor.userId());
  },
  // Upload progress helpers
  hasActiveUploads() {
    return uploadProgressManager.hasActiveUploads(this._id);
  },
  uploads() {
    return uploadProgressManager.getUploadsForCard(this._id);
  },
  uploadCount() {
    return uploadProgressManager.getUploadCountForCard(this._id);
  },
  listName() {
    const list = this.list();
    return list ? list.title : '';
  },

  shouldShowListOnMinicard() {
    return Utils.allowsShowLists();
  },
});

BlazeComponent.extendComponent({
  events() {
    return [
      {
        'keydown input.js-edit-card-sort-popup'(evt) {
          // enter = save
          if (evt.keyCode === 13) {
            this.find('button[type=submit]').click();
          }
        },
        'click button.js-submit-edit-card-sort-popup'(event) {
          // save button pressed
          event.preventDefault();
          const sort = this.$('.js-edit-card-sort-popup')[0]
            .value
            .trim();
          if (!Number.isNaN(sort)) {
            let card = this.data();
            card.move(card.boardId, card.swimlaneId, card.listId, sort);
            Popup.back();
          }
        },
      }
    ]
  }
}).register('editCardSortOrderPopup');

