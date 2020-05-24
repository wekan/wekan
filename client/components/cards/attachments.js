Template.attachmentsGalery.events({
  'click .js-add-attachment': Popup.open('cardAttachments'),
  'click .js-confirm-delete': Popup.afterConfirm(
    'attachmentDelete',
    function() {
      Attachments.remove(this._id);
      Popup.close();
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
  url() {
    return Attachments.link(this, 'original', '/'); 
  },
  isUploaded() {
    return !this.meta.uploading;
  },
  isImage() {
    return !!this.isImage;
  },
});

Template.previewAttachedImagePopup.events({
  'click .js-large-image-clicked'() {
    Popup.close();
  },
});

Template.previewAttachedImagePopup.helpers({
  url() {
    return Attachments.link(this, 'original', '/');
  }
});

// For uploading popup

let uploadFileSize = new ReactiveVar('');
let uploadProgress = new ReactiveVar(0);

Template.cardAttachmentsPopup.events({
  'change .js-attach-file'(event, instance) {
    const card = this;
    const callbacks = {
		    onBeforeUpload: (err, fileData) => {
          Popup.open('uploading')(this.clickEvent);
          uploadFileSize.set('...');
          uploadProgress.set(0);
          return true;
        },
        onUploaded: (err, attachment) => {
          if (attachment && attachment._id && attachment.isImage) {
            card.setCover(attachment._id);
          }
          Popup.close();
        },
        onStart: (error, fileData) => {
          uploadFileSize.set(formatBytes(fileData.size));
        },
				onError: (err, fileObj) => {
          console.log('Error!', err);
        },
        onProgress: (progress, fileData) => {
          uploadProgress.set(progress);
        }
    };
    const processFile = f => {
      Utils.processUploadedAttachment(card, f, callbacks);
    };

    FS.Utility.eachFile(event, f => {
      if (
        MAX_IMAGE_PIXEL > 0 &&
        typeof f.type === 'string' &&
        f.type.match(/^image/)
      ) {
        // is image
        const reader = new FileReader();
        reader.onload = function(e) {
          const dataurl = e && e.target && e.target.result;
          if (dataurl !== undefined) {
            Utils.shrinkImage({
              dataurl,
              maxSize: MAX_IMAGE_PIXEL,
              ratio: COMPRESS_RATIO,
              toBlob: true,
              callback(blob) {
                if (blob === false) {
                  processFile(f);
                } else {
                  blob.name = f.name;
                  processFile(blob);
                }
              },
            });
          } else {
            // couldn't process it let other function handle it?
            processFile(f);
          }
        };
        reader.readAsDataURL(f);
      } else {
        processFile(f);
      }
    });
  },
  'click .js-computer-upload'(event, templateInstance) {
    this.clickEvent = event;
    templateInstance.find('.js-attach-file').click();
    event.preventDefault();
  },
  'click .js-upload-clipboard-image': Popup.open('previewClipboardImage'),
});

Template.uploadingPopup.helpers({
  fileSize: () => {
    return uploadFileSize.get();
  },
  progress: () => {
    return uploadProgress.get();
  }
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
    const results = pastedResults;
    if (results && results.file) {
      window.oPasted = pastedResults;
      const card = this;
      const settings = {
        file: results.file,
        streams: 'dynamic',
        chunkSize: 'dynamic',
      };
      if (!results.name) {
        // if no filename, it's from clipboard. then we give it a name, with ext name from MIME type
        if (typeof results.file.type === 'string') {
          settings.fileName =
            new Date().getTime() + results.file.type.replace('.+/', '');
        }
      }
      settings.meta = {};
      settings.meta.updatedAt = new Date().getTime();
      settings.meta.boardId = card.boardId;
      settings.meta.cardId = card._id;
      settings.meta.userId = Meteor.userId();
      const attachment = Attachments.insert(settings);

      if (attachment && attachment._id && attachment.isImage) {
        card.setCover(attachment._id);
      }

      pastedResults = null;
      $(document.body).pasteImageReader(() => {});
      Popup.close();
    }
  },
});

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
