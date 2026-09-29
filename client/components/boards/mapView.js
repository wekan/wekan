import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { ReactiveCache } from '/imports/reactiveCache';
import { Utils } from '/client/lib/utils';
import Attachments from '/models/attachments';
import { buildAttachmentUploadConfig } from '/client/lib/attachmentUploadConfig';
import { generateUniversalAttachmentUrl } from '/models/lib/universalUrlGenerator';

const { isPlaced, mapMarker, percentFromPoint } = require('/models/lib/boardMap');

// #3256: the Map board view (models/lib/boardMap.js).
function boardCards(board) {
  if (!board) return [];
  return ReactiveCache.getCards({ boardId: board._id, archived: false, type: { $ne: 'template-card' } }, { sort: { sort: 1 } });
}

function placeAt(event, cardId) {
  const card = cardId && ReactiveCache.getCard(cardId);
  const canvas = event.currentTarget.closest('.js-map-canvas');
  const point = canvas && percentFromPoint(event, canvas.getBoundingClientRect());
  if (card && point && point.x !== null && point.y !== null) card.setMapPosition(point.x, point.y);
}

Template.mapView.onCreated(function () {
  // The card chosen in the side list, waiting for a click on the map.
  this.placing = new ReactiveVar(null);
});

Template.mapView.helpers({
  mapImageUrl() {
    const board = Utils.getCurrentBoard();
    return board && board.mapImageAttachmentId ? generateUniversalAttachmentUrl(board.mapImageAttachmentId) : '';
  },
  markers() {
    const board = Utils.getCurrentBoard();
    return boardCards(board).filter(isPlaced).map(card => ({ cardId: card._id, marker: mapMarker(card, board) }));
  },
  unplaced() {
    return boardCards(Utils.getCurrentBoard()).filter(card => !isPlaced(card));
  },
  canEdit() {
    return Utils.canModifyBoard();
  },
  isBoardAdmin() {
    const user = ReactiveCache.getCurrentUser();
    const board = Utils.getCurrentBoard();
    return !!(user && board && user.isBoardAdmin(board._id));
  },
  placing() {
    return !!Template.instance().placing.get();
  },
  isPlacing(cardId) {
    return Template.instance().placing.get() === cardId;
  },
});

Template.mapView.events({
  'click .js-map-unplaced'(event, tpl) {
    event.preventDefault();
    const cardId = event.currentTarget.dataset.cardId;
    tpl.placing.set(tpl.placing.get() === cardId ? null : cardId);
  },
  'click .js-map-canvas'(event, tpl) {
    const cardId = tpl.placing.get();
    if (!cardId || event.target.closest('.js-map-marker')) return;
    placeAt(event, cardId);
    tpl.placing.set(null);
  },
  'click .js-map-marker'(event) {
    event.preventDefault();
    const card = ReactiveCache.getCard(event.currentTarget.dataset.cardId);
    const board = Utils.getCurrentBoard();
    if (card) FlowRouter.go('card', { boardId: card.boardId, slug: (board && board.slug) || 'board', cardId: card._id });
  },
  'dragstart .js-map-unplaced, dragstart .js-map-marker'(event) {
    if (!Utils.canModifyBoard()) return;
    const native = event.originalEvent || event;
    native.dataTransfer.setData('text/wekan-card-id', event.currentTarget.dataset.cardId);
    native.dataTransfer.effectAllowed = 'move';
  },
  'dragover .js-map-canvas'(event) {
    if (Utils.canModifyBoard()) event.preventDefault();
  },
  'drop .js-map-canvas'(event) {
    event.preventDefault();
    if (!Utils.canModifyBoard()) return;
    // Blaze may hand over the native event or a jQuery wrapper around it.
    const native = event.originalEvent || event;
    const cardId = native.dataTransfer.getData('text/wekan-card-id');
    placeAt({ clientX: native.clientX, clientY: native.clientY, currentTarget: event.currentTarget }, cardId);
  },
  'click .js-map-remove-image'(event) {
    event.preventDefault();
    const board = Utils.getCurrentBoard();
    if (board) board.setMapImage(null);
  },
});

// The map image is a board-level attachment (meta.source 'board-map'), uploaded
// the way board backgrounds are.
Template.mapImageUpload.onCreated(function () {
  this.uploading = new ReactiveVar(false);
  this.error = new ReactiveVar('');
});

Template.mapImageUpload.helpers({
  uploading() { return Template.instance().uploading.get(); },
  error() { return Template.instance().error.get(); },
});

Template.mapImageUpload.events({
  'click .js-map-upload-button'(event, tpl) {
    event.preventDefault();
    tpl.find('.js-map-upload-input').click();
  },
  async 'change .js-map-upload-input'(event, tpl) {
    const input = event.currentTarget;
    const file = input.files && input.files[0];
    const board = Utils.getCurrentBoard();
    if (!file || !board) return;
    tpl.error.set('');
    tpl.uploading.set(true);
    try {
      const uploader = await Attachments.insertAsync(buildAttachmentUploadConfig({
        file, meta: { boardId: board._id, source: 'board-map' },
      }), false);
      uploader.on('uploaded', async (err, fileRef) => {
        if (!err && fileRef && fileRef._id) await board.setMapImage(fileRef._id);
      });
      uploader.on('end', err => {
        tpl.uploading.set(false);
        if (err) tpl.error.set(err.reason || err.message || 'upload-failed');
      });
      uploader.start();
    } catch (error) {
      tpl.uploading.set(false);
      tpl.error.set((error && (error.reason || error.message)) || 'upload-failed');
    } finally {
      input.value = '';
    }
  },
});
