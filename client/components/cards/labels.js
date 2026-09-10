import { ReactiveCache } from '/imports/reactiveCache';
import { LABEL_COLORS } from '/models/metadata/colors';
import { isHexColor, toHex } from '/models/lib/contrastColor';
import { EscapeActions } from '/client/lib/escapeActions';
import { Utils } from '/client/lib/utils';

let labelColors;
Meteor.startup(() => {
  labelColors = LABEL_COLORS;
});

// #2802: read the label popup's optional due-date <input type="date">, e.g.
// "Sprint 1" due 2026-01-15. Returns a Date, or null when left blank/invalid
// so the caller can unset an existing label's due date.
const readLabelDueAt = templateInstance => {
  const value = templateInstance.$('.js-label-due-at').val();
  if (!value) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return isNaN(date.getTime()) ? null : date;
};

const getFallbackLabelColor = () => {
  if (Array.isArray(labelColors) && labelColors.length > 0) {
    return labelColors[0];
  }
  return 'green';
};

// Label popups opened from a linked card operate on the source card and its
// label catalogue. Do not infer this from the route: the route still names the
// board containing the linked representation.
const getCardLabelBoard = card =>
  card?.getRealBoard?.() || card?.board?.() || Utils.getCurrentBoard();

Template.formLabel.onCreated(function () {
  const initialColor = this.data?.color || getFallbackLabelColor();
  this.currentColor = new ReactiveVar(initialColor);
});

Template.formLabel.helpers({
  labels() {
    const colors = Array.isArray(labelColors) ? labelColors : [getFallbackLabelColor()];
    return colors.map(color => ({ color, name: '' }));
  },
  isSelected(color) {
    return Template.instance().currentColor.get() === color;
  },
  // #5514: current color as a '#rrggbb' hex for the color-wheel <input>, which
  // only accepts hex. Named colors map to their palette hex; fall back to green.
  currentColorHex() {
    return toHex(Template.instance().currentColor.get()) || '#3cb500';
  },
  // #2802: a label's optional "milestone" due date, formatted as the
  // yyyy-mm-dd a native <input type="date"> expects. Unset for a label with
  // no due date, and for the "create label" popup's blank starting label.
  dueAtValue() {
    const dueAt = Template.currentData()?.dueAt;
    if (!dueAt) return '';
    const date = dueAt instanceof Date ? dueAt : new Date(dueAt);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
  },
});

Template.formLabel.events({
  'click .js-palette-color'(event, tpl) {
    const paletteData = Blaze.getData(event.currentTarget);
    const selectedColor = paletteData?.color || Template.currentData()?.color || getFallbackLabelColor();
    tpl.currentColor.set(selectedColor);
  },
  // #5514: picking a color from the native color wheel stores a custom hex.
  'input .js-label-color-wheel'(event, tpl) {
    const value = event.currentTarget.value;
    if (isHexColor(value)) {
      tpl.currentColor.set(value);
    }
  },
});

Template.createLabelPopup.helpers({
  // This is the default color for a new label. We search the first color that
  // is not already used in the board (although it's not a problem if two
  // labels have the same color).
  defaultColor() {
    const board = getCardLabelBoard(Template.currentData());
    const colors = Array.isArray(labelColors) ? labelColors : [getFallbackLabelColor()];
    const labels = Array.isArray(board?.labels) ? board.labels : [];
    const usedColors = labels.map(l => l.color);
    const availableColors = colors.filter(c => !usedColors.includes(c));
    return availableColors.length > 0 ? availableColors[0] : colors[0];
  },
});

Template.cardLabelsPopup.onRendered(function () {
  const tpl = this;
  const itemsSelector = 'li.js-card-label-item:not(.placeholder)';
  const $labels = tpl.$('.edit-labels-pop-over');

  $labels.sortable({
    connectWith: '.edit-labels-pop-over',
    tolerance: 'pointer',
    appendTo: '.edit-labels-pop-over',
    helper(element, currentItem) {
      let ret = currentItem.clone();
      if (currentItem.closest('.popup-container-depth-0').length == 0)
      { // only set css transform at every sub-popup, not at the main popup
        const content = currentItem.closest('.content')[0]
        const offsetLeft = content.offsetLeft;
        const offsetTop = $('.pop-over > .header').height() * -1;
        ret.css("transform", `translate(${offsetLeft}px, ${offsetTop}px)`);
      }
      return ret;
    },
    distance: 7,
    items: itemsSelector,
    placeholder: 'card-label-wrapper placeholder',
    start(evt, ui) {
      ui.helper.css('z-index', 1000);
      ui.placeholder.height(ui.helper.height());
      EscapeActions.clickExecute(evt.target, 'inlinedForm');
    },
    stop(evt, ui) {
      const newLabelOrderOnlyIds = ui.item.parent().children().toArray().map(_element => Blaze.getData(_element)._id)
      const card = Blaze.getData(this);
      card.board().setNewLabelOrder(newLabelOrderOnlyIds);
    },
  });

  // Disable drag-dropping if the current user is not a board member or is comment only
  tpl.autorun(() => {
    if (Utils.isTouchScreenOrShowDesktopDragHandles()) {
      $labels.sortable({
        handle: '.label-handle',
      });
    }
  });
});

Template.cardLabelsPopup.helpers({
  board() {
    const card = Template.currentData();
    // The linked source board is preferred when it is published. Fall back to
    // the card's placement/current board: a missing linked source must not turn
    // the whole label picker into the lone "Create label" row (#6616).
    return getCardLabelBoard(card);
  },
  isLabelSelected(cardId) {
    const card = ReactiveCache.getCard(cardId);
    return (card?.getRealCard().labelIds || []).includes(this._id);
  },
  // #2802: a short, locale-formatted date next to the label in the labels
  // list — the "milestone" due date filtering by this label already gives.
  formatLabelDueAt(dueAt) {
    if (!dueAt) return '';
    const date = dueAt instanceof Date ? dueAt : new Date(dueAt);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString();
  },
});

Template.cardLabelsPopup.events({
  async 'click .js-select-label'(event, templateInstance) {
    // The event's `this` is the label row. Keep the popup template's card data
    // explicitly so a linked card updates its source instead of trying to call
    // toggleLabel on the row context.
    const card = templateInstance.data;
    const labelId = this._id;
    event.preventDefault();
    if (!card?.toggleLabel) return;
    await card.toggleLabel(labelId);
  },
  'click .js-edit-label': Popup.open('editLabel'),
  'click .js-add-label': Popup.open('createLabel'),
});

Template.createLabelPopup.events({
  // Create the new label
  'submit .create-label'(event, templateInstance) {
    event.preventDefault();
    const board = getCardLabelBoard(templateInstance.data);
    if (!board) {
      return;
    }
    const name = templateInstance
      .$('#labelName')
      .val()
      .trim();
    const selectedColorIcon = templateInstance.find('.js-palette-color .fa-check');
    const selectedPaletteNode = selectedColorIcon?.closest
      ? selectedColorIcon.closest('.js-palette-color')
      : null;
    const selectedColorData = selectedPaletteNode && Blaze.getData(selectedPaletteNode);
    // #5514: a named swatch (has the check icon) wins; otherwise fall back to
    // the custom color-wheel hex, then to the default palette color.
    let color = selectedColorData?.color;
    if (!color) {
      const wheel = templateInstance.find('.js-label-color-wheel');
      if (wheel && isHexColor(wheel.value)) {
        color = wheel.value;
      }
    }
    color = color || getFallbackLabelColor();
    const dueAt = readLabelDueAt(templateInstance);
    board.addLabel(name, color, dueAt);
    Popup.back();
  },
});

Template.editLabelPopup.events({
  'click .js-delete-label': Popup.afterConfirm('deleteLabel', function () {
    const board = Utils.getCurrentBoard();
    board.removeLabel(this._id);
    Popup.back(2);
  }),
  'submit .edit-label'(event, templateInstance) {
    event.preventDefault();
    const board = Utils.getCurrentBoard();
    if (!board) {
      return;
    }
    const name = templateInstance
      .$('#labelName')
      .val()
      .trim();
    const selectedColorIcon = templateInstance.find('.js-palette-color .fa-check');
    const selectedPaletteNode = selectedColorIcon?.closest
      ? selectedColorIcon.closest('.js-palette-color')
      : null;
    const selectedColorData = selectedPaletteNode && Blaze.getData(selectedPaletteNode);
    // #5514: a named swatch (has the check icon) wins; otherwise fall back to
    // the custom color-wheel hex, then to the default palette color.
    let color = selectedColorData?.color;
    if (!color) {
      const wheel = templateInstance.find('.js-label-color-wheel');
      if (wheel && isHexColor(wheel.value)) {
        color = wheel.value;
      }
    }
    color = color || getFallbackLabelColor();
    const dueAt = readLabelDueAt(templateInstance);
    board.editLabel(this._id, name, color, dueAt);
    Popup.back();
  },
});
