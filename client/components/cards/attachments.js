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
  'click .js-preview-image'(evt) {
    Popup.open('previewAttachedImage').call(this, evt);
    // when multiple thumbnails, if click one then another very fast,
    // we might get a wrong width from previous img.
    // when popup reused, onRendered() won't be called, so we cannot get there.
    // here make sure to get correct size when this img fully loaded.
    const img = $('img.preview-large-image')[0];
    if (!img) return;
    const rePosPopup = () => {
      const w = img.width;
      const h = img.height;
      // if the image is too large, we resize & center the popup.
      if (w > 300) {
        $('div.pop-over').css({
          width: (w + 20),
          position: 'absolute',
          left: (window.innerWidth - w)/2,
          top: (window.innerHeight - h)/2,
        });
      }
    };
    const url = $(evt.currentTarget).attr('src');
    if (img.src === url && img.complete)
      rePosPopup();
    else
      img.onload = rePosPopup;
  },
});

Template.attachmentsGalery.helpers({
  isImage() {
    return this.contentType.indexOf('image/') === 0;
  },
  isUploaded() {
    return this.length > 0;
  },
  url(download) {
    return `${Attachments.baseURL}/${this.md5}${download ? '?download=true' :''}`;
  }
});

Template.previewAttachedImagePopup.events({
  'click .js-large-image-clicked'(){
    Popup.close();
  },
});

Template.previewAttachedImagePopup.helpers({
  url() {
    return `${Attachments.baseURL}/${this.md5}`;
  }
});

Template.cardAttachmentsPopup.onRendered(function() {
  Attachments.resumable.assignBrowse(this.find('.js-computer-upload'));
});

Template.cardAttachmentsPopup.events({
  'click .js-upload-clipboard-image': Popup.open('previewClipboardImage'),
});

let pastedResults = null;

Template.previewClipboardImagePopup.onRendered(() => {
  // we can paste image from clipboard
  $(document.body).pasteImageReader((results) => {
    if (results.dataURL.startsWith('data:image/')) {
      $('img.preview-clipboard-image').attr('src', results.dataURL);
      pastedResults = results;
    }
  });

  // we can also drag & drop image file to it
  $(document.body).dropImageReader((results) => {
    if (results.dataURL.startsWith('data:image/')) {
      $('img.preview-clipboard-image').attr('src', results.dataURL);
      pastedResults = results;
    }
  });
});

Template.previewClipboardImagePopup.events({
  'click .js-upload-pasted-image'() {
    if (pastedResults && pastedResults.file) {
      Attachments.resumable.addFile(pastedResults.file);
      pastedResults = null;
      $(document.body).pasteImageReader(() => {});
    }
  },
});
