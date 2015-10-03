Template.attachmentsGalery.events({
  'click .js-add-attachment': Popup.open('cardAttachments'),
  'click .js-confirm-delete': Popup.afterConfirm('attachmentDelete',
    function() {
      Attachments.remove(this._id);
      Popup.close();
    }
  ),
  // If we let this event bubble, FlowRouter will handle it and empty the page
  // content, see #101.
  'click .js-download'(event) {
    event.stopPropagation();
  },
  'click .js-open-viewer'() {
    // XXX Not implemented!
  },
  'click .js-add-cover'() {
    Cards.findOne(this.cardId).setCover(this._id);
  },
  'click .js-remove-cover'() {
    Cards.findOne(this.cardId).unsetCover();
  },
});

Template.cardAttachmentsPopup.events({
  'change .js-attach-file'(evt) {
    const card = this;
    FS.Utility.eachFile(evt, (f) => {
      const file = new FS.File(f);
      file.boardId = card.boardId;
      file.cardId  = card._id;

      Attachments.insert(file);
      Popup.close();
    });
  },
  'click .js-computer-upload'(evt, tpl) {
    tpl.find('.js-attach-file').click();
    evt.preventDefault();
  },
});
