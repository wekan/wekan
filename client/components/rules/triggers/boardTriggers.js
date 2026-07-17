import { TAPi18n } from '/imports/i18n';
import { Utils } from '/client/lib/utils';
import {
  cardTitleFilterOrWildcard,
  appendCardTitleFilterToDesc,
} from '/models/lib/ruleCardTitleFilter';

// #2345: fallback reference to the live boardTriggers template instance, so the
// card-title-filter popup can still store its value even if the Blaze
// data-context walk in Popup.getOpenerComponent() does not resolve (same
// module-level pattern as cardActions.js' sharedCardColorButtonValue).
let activeBoardTriggersTemplate = null;

// #2345: the trigger description is assembled from the wizard's DOM text, which
// never includes the card-title filter (it lives in a popup). Append it so the
// created rule's details actually show the filter.
function descWithCardTitleFilter(desc, cardTitle) {
  let label = 'card title filter';
  try {
    const translated = TAPi18n.__('boardCardTitlePopup-title');
    if (translated && translated !== 'boardCardTitlePopup-title') {
      label = translated.toLowerCase();
    }
  } catch (e) {
    // keep the English fallback label
  }
  return appendCardTitleFilterToDesc(desc, cardTitle, label);
}

Template.boardTriggers.onCreated(function () {
  this.provaVar = new ReactiveVar('');
  this.currentPopupTriggerId = 'def';
  this.cardTitleFilters = {};
  this.setNameFilter = (name) => {
    this.cardTitleFilters[this.currentPopupTriggerId] = name;
  };
  activeBoardTriggersTemplate = this;
});

Template.boardTriggers.onDestroyed(function () {
  if (activeBoardTriggersTemplate === this) {
    activeBoardTriggersTemplate = null;
  }
});

Template.boardTriggers.events({
  'click .js-open-card-title-popup'(event, tpl) {
    const funct = Popup.open('boardCardTitle');
    const divId = $(event.currentTarget.parentNode.parentNode).attr('id');
    tpl.currentPopupTriggerId = divId;
    // #2345: hand the already-stored filter to the popup as its data context so
    // reopening it shows the current value instead of an empty input.
    funct.call({ cardTitleFilter: tpl.cardTitleFilters[divId] || '' }, event);
  },
  'click .js-add-create-trigger'(event, tpl) {
    const datas = Template.currentData();
    const listName = tpl.find('#create-list-name').value;
    const swimlaneName = tpl.find('#create-swimlane-name').value;
    const boardId = Session.get('currentBoard');
    const divId = $(event.currentTarget.parentNode).attr('id');
    // #2345: an unset/empty filter is stored as the '*' wildcard so the trigger
    // document always carries a cardTitle field (the server matches with
    // cardTitle: { $in: [...] }, which a document missing the field never satisfies).
    const cardTitle = cardTitleFilterOrWildcard(tpl.cardTitleFilters[divId]);
    const desc = descWithCardTitleFilter(
      Utils.getTriggerActionDesc(event, tpl),
      cardTitle,
    );
    // move to generic funciont
    datas.triggerVar.set({
      activityType: 'createCard',
      boardId,
      cardTitle,
      swimlaneName,
      listName,
      desc,
    });
  },
  'click .js-add-moved-trigger'(event, tpl) {
    const datas = Template.currentData();
    const swimlaneName = tpl.find('#create-swimlane-name-2').value;
    const actionSelected = tpl.find('#move-action').value;
    const listName = tpl.find('#move-list-name').value;
    const boardId = Session.get('currentBoard');
    const divId = $(event.currentTarget.parentNode).attr('id');
    const cardTitle = cardTitleFilterOrWildcard(tpl.cardTitleFilters[divId]);
    const desc = descWithCardTitleFilter(
      Utils.getTriggerActionDesc(event, tpl),
      cardTitle,
    );
    if (actionSelected === 'moved-to') {
      datas.triggerVar.set({
        activityType: 'moveCard',
        boardId,
        listName,
        cardTitle,
        swimlaneName,
        oldListName: '*',
        desc,
      });
    }
    if (actionSelected === 'moved-from') {
      datas.triggerVar.set({
        activityType: 'moveCard',
        boardId,
        cardTitle,
        swimlaneName,
        listName: '*',
        oldListName: listName,
        desc,
      });
    }
  },
  'click .js-add-gen-moved-trigger'(event, tpl) {
    const datas = Template.currentData();
    const boardId = Session.get('currentBoard');
    const divId = $(event.currentTarget.parentNode).attr('id');
    // #2345: this trigger ignored the card-title-filter popup entirely AND
    // stored no cardTitle field at all — and since the server matches triggers
    // with cardTitle: { $in: [...] }, a moveCard trigger without the field
    // never fired for any card. Store the filter (or the '*' wildcard).
    const cardTitle = cardTitleFilterOrWildcard(tpl.cardTitleFilters[divId]);
    const desc = descWithCardTitleFilter(
      Utils.getTriggerActionDesc(event, tpl),
      cardTitle,
    );

    datas.triggerVar.set({
      activityType: 'moveCard',
      boardId,
      cardTitle,
      swimlaneName: '*',
      listName: '*',
      oldListName: '*',
      desc,
    });
  },
  'click .js-add-arch-trigger'(event, tpl) {
    const datas = Template.currentData();
    const actionSelected = tpl.find('#arch-action').value;
    const boardId = Session.get('currentBoard');
    const divId = $(event.currentTarget.parentNode).attr('id');
    // #2345: the archive/unarchive trigger also dropped the card-title filter.
    const cardTitle = cardTitleFilterOrWildcard(tpl.cardTitleFilters[divId]);
    const desc = descWithCardTitleFilter(
      Utils.getTriggerActionDesc(event, tpl),
      cardTitle,
    );
    if (actionSelected === 'archived') {
      datas.triggerVar.set({
        activityType: 'archivedCard',
        boardId,
        cardTitle,
        desc,
      });
    }
    if (actionSelected === 'unarchived') {
      datas.triggerVar.set({
        activityType: 'restoredCard',
        boardId,
        cardTitle,
        desc,
      });
    }
  },
});

Template.boardCardTitlePopup.events({
  submit(event) {
    // #2345: preventDefault FIRST — if anything below throws, a real form
    // submit would reload the page and silently drop the filter.
    event.preventDefault();
    const title = $(event.target)
      .find('.js-card-filter-name')
      .val()
      .trim();
    let opener = null;
    try {
      opener = Popup.getOpenerComponent();
    } catch (e) {
      opener = null;
    }
    if (!opener || typeof opener.setNameFilter !== 'function') {
      // #2345: fall back to the live boardTriggers instance when the Blaze
      // data-context walk cannot resolve the opener.
      opener = activeBoardTriggersTemplate;
    }
    if (opener && typeof opener.setNameFilter === 'function') {
      opener.setNameFilter(title);
    }
    Popup.back();
  },
});
