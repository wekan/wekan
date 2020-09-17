Template.attachmentsGalery.events({
  'click .js-add-attachment': Popup.open('cardAttachments'),
  'click .js-confirm-delete': Popup.afterConfirm(
    'attachmentDelete',
    function() {
      Attachments.remove(this._id);
      Popup.back();
    },
  ),
  // If we let this event bubble, FlowRouter will handle it and empty the page
  // content, see #101.
  'click .js-download'(event) {
    event.stopPropagation();
  },
  'click .js-add-cover'() {
    Cards.findOne(this.meta.cardId).setCover(this._id);
  },
  'click .js-remove-cover'() {
    Cards.findOne(this.meta.cardId).unsetCover();
  },
  'click .js-preview-image'(event) {
    Popup.open('previewAttachedImage').call(this, event);
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
          width: w + 20,
          position: 'absolute',
          left: (window.innerWidth - w) / 2,
          top: (window.innerHeight - h) / 2,
        });
      }
    };
    const url = $(event.currentTarget).attr('src');
    if (img.src === url && img.complete) rePosPopup();
    else img.onload = rePosPopup;
  },
});

Template.attachmentsGalery.helpers({
  isBoardAdmin() {
    return Meteor.user().isBoardAdmin();
  },
  fileSize(size) {
    return Math.round(size / 1024);
  },
});

Template.previewAttachedImagePopup.events({
  'click .js-large-image-clicked'() {
    Popup.back();
  },
});

Template.cardAttachmentsPopup.events({
  'change .js-attach-file'(event) {
    const card = this;
    if (event.currentTarget.files && event.currentTarget.files[0]) {
      const uploader = Attachments.insert(
        {
          file: event.currentTarget.files[0],
          meta: Utils.getCommonAttachmentMetaFrom(card),
          chunkSize: 'dynamic',
        },
        false,
      );
      uploader.on('uploaded', (error, fileRef) => {
        if (!error) {
          if (fileRef.isImage) {
            card.setCover(fileRef._id);
          }
        }
      });
      uploader.on('end', (error, fileRef) => {
        Popup.back();
      });
      uploader.start();
    }
  },
  'click .js-computer-upload'(event, templateInstance) {
    templateInstance.find('.js-attach-file').click();
    event.preventDefault();
  },
  'click .js-upload-clipboard-image': Popup.open('previewClipboardImage'),
});

const MAX_IMAGE_PIXEL = Utils.MAX_IMAGE_PIXEL;
const COMPRESS_RATIO = Utils.IMAGE_COMPRESS_RATIO;
let pastedResults = null;

Template.previewClipboardImagePopup.onRendered(() => {
  // we can paste image from clipboard
  const handle = results => {
    if (results.dataURL.startsWith('data:image/')) {
      const direct = results => {
        $('img.preview-clipboard-image').attr('src', results.dataURL);
        pastedResults = results;
      };
      if (MAX_IMAGE_PIXEL) {
        // if has size limitation on image we shrink it before uploading
        Utils.shrinkImage({
          dataurl: results.dataURL,
          maxSize: MAX_IMAGE_PIXEL,
          ratio: COMPRESS_RATIO,
          callback(changed) {
            if (changed !== false && !!changed) {
              results.dataURL = changed;
            }
            direct(results);
          },
        });
      } else {
        direct(results);
      }
    }
  };

  $(document.body).pasteImageReader(handle);

  // we can also drag & drop image file to it
  $(document.body).dropImageReader(handle);
});

Template.previewClipboardImagePopup.events({
  'click .js-upload-pasted-image'() {
    const card = this;
    if (pastedResults && pastedResults.file) {
      const file = pastedResults.file;
      window.oPasted = pastedResults;
      const uploader = Attachments.insert(
        {
          file,
          meta: Utils.getCommonAttachmentMetaFrom(card),
          fileName: file.name || file.type.replace('image/', 'clipboard.'),
          chunkSize: 'dynamic',
        },
        false,
      );
      uploader.on('uploaded', (error, fileRef) => {
        if (!error) {
          if (fileRef.isImage) {
            card.setCover(fileRef._id);
          }
        }
      });
      uploader.on('end', (error, fileRef) => {
        pastedResults = null;
        $(document.body).pasteImageReader(() => {});
        Popup.back();
      });
      uploader.start();
    }
  },
});
