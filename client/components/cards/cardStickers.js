import { ReactiveCache } from '/imports/reactiveCache';
import { STICKER_PICKER } from '/models/metadata/stickers';

// Picker popup that lets a user add/remove stickers on a card. Each entry is
// { icon, highlight?, name? }: the plain Font Awesome icons plus the mascot
// (underlined) and computer (ringed) highlighted stickers. Opened from the card
// details stickers section with the card as the data context.

Template.cardStickersPopup.onCreated(function () {
  const data = Template.currentData();
  this.cardId = data && data._id;
});

function pickerCard(tpl) {
  return ReactiveCache.getCard(tpl.cardId);
}

Template.cardStickersPopup.helpers({
  stickerIcons() {
    return STICKER_PICKER;
  },
  isSelected() {
    const card = pickerCard(Template.instance());
    return !!(card && card.hasSticker(this.icon, this.highlight));
  },
  stickerTitle() {
    return this.name || this.icon;
  },
});

Template.cardStickersPopup.events({
  async 'click .js-select-sticker'(event) {
    event.preventDefault();
    const card = pickerCard(Template.instance());
    if (card) {
      await Meteor.callAsync('setAccessibleCardSticker', {
        cardId: card._id, boardId: card.boardId,
        icon: this.icon, highlight: this.highlight || '',
        enabled: !card.hasSticker(this.icon, this.highlight),
      });
    }
  },
});
