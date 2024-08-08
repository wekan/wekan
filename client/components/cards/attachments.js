import { ReactiveCache } from '/imports/reactiveCache';
import { ObjectID } from 'bson';
import DOMPurify from 'dompurify';

const filesize = require('filesize');
const prettyMilliseconds = require('pretty-ms');

// We store current card ID and the ID of currently opened attachment in a
// global var. This is used so that we know what's the next attachment to open
// when the user clicks on the prev/next button in the attachment viewer.
let cardId = null;
let openAttachmentId = null;

// Used to store the start and end coordinates of a touch event for attachment swiping
let touchStartCoords = null;
let touchEndCoords = null;

// Stores link to the attachment for which attachment actions popup was opened
attachmentActionsLink = null;

Template.attachmentGallery.events({
  'click .open-preview'(event) {

    openAttachmentId = $(event.currentTarget).attr("data-attachment-id");
    cardId = $(event.currentTarget).attr("data-card-id");

    openAttachmentViewer(openAttachmentId);
  },
  'click .js-add-attachment': Popup.open('cardAttachments'),
  // If we let this event bubble, FlowRouter will handle it and empty the page
  // content, see #101.
  'click .js-download'(event) {
    event.stopPropagation();
  },
  'click .js-open-attachment-menu': Popup.open('attachmentActions'),
  'mouseover .js-open-attachment-menu'(event) { // For some reason I cannot combine handlers for "click .js-open-attachment-menu" and "mouseover .js-open-attachment-menu" events so this is a quick workaround.
    attachmentActionsLink = event.currentTarget.getAttribute("data-attachment-link");
  },
  'click .js-rename': Popup.open('attachmentRename'),
  'click .js-confirm-delete': Popup.afterConfirm('attachmentDelete', function() {
      Attachments.remove(this._id);
      Popup.back();
  }),
});

function getNextAttachmentId(currentAttachmentId, offset = 0) {
    const attachments = ReactiveCache.getAttachments({'meta.cardId': cardId});

  let i = 0;
  for (; i < attachments.length; i++) {
    if (attachments[i]._id === currentAttachmentId) {
      break;
    }
  }
  return attachments[(i + offset + 1 + attachments.length) % attachments.length]._id;
}

function getPrevAttachmentId(currentAttachmentId, offset = 0) {
  const attachments = ReactiveCache.getAttachments({'meta.cardId': cardId});

  let i = 0;
  for (; i < attachments.length; i++) {
    if (attachments[i]._id === currentAttachmentId) {
      break;
    }
  }
  return attachments[(i + offset - 1 + attachments.length) % attachments.length]._id;
}

function attachmentCanBeOpened(attachment) {
  return (
    attachment.isImage ||
    attachment.isPDF ||
    attachment.isText ||
    attachment.isJSON ||
    attachment.isVideo ||
    attachment.isAudio
  );
}

function openAttachmentViewer(attachmentId) {
  const attachment = ReactiveCache.getAttachment(attachmentId);

  // Check if we can open the attachment (if we have a viewer for it) and exit if not
  if (!attachmentCanBeOpened(attachment)) {
    return;
  }

  /*
  Instructions for adding a new viewer:
    - add a new case to the switch statement below
    - implement cleanup in the closeAttachmentViewer() function, if necessary
    - mark attachment type as openable by adding a new condition to the attachmentCanBeOpened function
  */
  switch(true){
    case (attachment.isImage):
      $("#image-viewer").attr("src", attachment.link());
      $("#image-viewer").removeClass("hidden");
      break;
    case (attachment.isPDF):
      $("#pdf-viewer").attr("data", attachment.link());
      $("#pdf-viewer").removeClass("hidden");
      break;
    case (attachment.isVideo):
      // We have to create a new <source> DOM element and append it to the video
      // element, otherwise the video won't load
      let videoSource = document.createElement('source');
      videoSource.setAttribute('src', attachment.link());
      $("#video-viewer").append(videoSource);

      $("#video-viewer").removeClass("hidden");
      break;
    case (attachment.isAudio):
      // We have to create a new <source> DOM element and append it to the audio
      // element, otherwise the audio won't load
      let audioSource = document.createElement('source');
      audioSource.setAttribute('src', attachment.link());
      $("#audio-viewer").append(audioSource);

      $("#audio-viewer").removeClass("hidden");
      break;
    case (attachment.isText):
    case (attachment.isJSON):
      $("#txt-viewer").attr("data", attachment.link());
      $("#txt-viewer").removeClass("hidden");
      break;
  }

  $('#attachment-name').text(attachment.name);
  $('#viewer-overlay').removeClass('hidden');
}

function closeAttachmentViewer() {
  $("#viewer-overlay").addClass("hidden");

  // We need to reset the viewers to avoid showing previous attachments
  $("#image-viewer").attr("src", "");
  $("#image-viewer").addClass("hidden");

  $("#pdf-viewer").attr("data", "");
  $("#pdf-viewer").addClass("hidden");

  $("#txt-viewer").attr("data", "");
  $("#txt-viewer").addClass("hidden");

  $("#video-viewer").get(0).pause(); // Stop playback
  $("#video-viewer").get(0).currentTime = 0;
  $("#video-viewer").empty();
  $("#video-viewer").addClass("hidden");

  $("#audio-viewer").get(0).pause(); // Stop playback
  $("#audio-viewer").get(0).currentTime = 0;
  $("#audio-viewer").empty();
  $("#audio-viewer").addClass("hidden");
}

function openNextAttachment() {
  closeAttachmentViewer();

    let i = 0;
    // Find an attachment that can be opened
    while (true) {
      const id = getNextAttachmentId(openAttachmentId, i);
      const attachment = ReactiveCache.getAttachment(id);
      if (attachmentCanBeOpened(attachment)) {
        openAttachmentId = id;
        openAttachmentViewer(id);
        break;
      }
      i++;
    }
}

function openPrevAttachment() {
  closeAttachmentViewer();

    let i = 0;
    // Find an attachment that can be opened
    while (true) {
      const id = getPrevAttachmentId(openAttachmentId, i);
      const attachment = ReactiveCache.getAttachment(id);
      if (attachmentCanBeOpened(attachment)) {
        openAttachmentId = id;
        openAttachmentViewer(id);
        break;
      }
      i--;
    }
}

function processTouch(){

  xDist = touchEndCoords.x - touchStartCoords.x;
  yDist = touchEndCoords.y - touchStartCoords.y;

  console.log("xDist: " + xDist);

  // Left swipe
  if (Math.abs(xDist) > Math.abs(yDist) && xDist < 0) {
    openNextAttachment();
  }

  // Right swipe
  if (Math.abs(xDist) > Math.abs(yDist) && xDist > 0) {
    openPrevAttachment();
  }

  // Up swipe
  if (Math.abs(yDist) > Math.abs(xDist) && yDist < 0) {
    closeAttachmentViewer();
  }

}

Template.attachmentViewer.events({
  'touchstart #viewer-container'(event) {
    console.log("touchstart")
    touchStartCoords = {
      x: event.changedTouches[0].screenX,
      y: event.changedTouches[0].screenY
    }
  },
  'touchend #viewer-container'(event) {
    console.log("touchend")
    touchEndCoords = {
      x: event.changedTouches[0].screenX,
      y: event.changedTouches[0].screenY
    }
    processTouch();
  },
  'click #viewer-container'(event) {

    // Make sure the click was on #viewer-container and not on any of its children
    if(event.target !== event.currentTarget) {
      event.stopPropagation();
      return;
    }

    closeAttachmentViewer();
  },
  'click #viewer-content'(event) {

    // Make sure the click was on #viewer-content and not on any of its children
    if(event.target !== event.currentTarget) {
      event.stopPropagation();
      return;
    }

    closeAttachmentViewer();
  },
  'click #viewer-close'() {
    closeAttachmentViewer();
  },
  'click #next-attachment'() {
    openNextAttachment();
  },
  'click #prev-attachment'() {
    openPrevAttachment();
  },
});

Template.attachmentGallery.helpers({
  isBoardAdmin() {
    return ReactiveCache.getCurrentUser().isBoardAdmin();
  },
  fileSize(size) {
    const ret = filesize(size);
    return ret;
  },
  sanitize(value) {
    return DOMPurify.sanitize(value);
  },
});

Template.cardAttachmentsPopup.onCreated(function() {
  this.uploads = new ReactiveVar([]);
});

Template.cardAttachmentsPopup.helpers({
  getEstimateTime(upload) {
    const ret = prettyMilliseconds(upload.estimateTime.get());
    return ret;
  },
  getEstimateSpeed(upload) {
    const ret = filesize(upload.estimateSpeed.get(), {round: 0}) + "/s";
    return ret;
  },
  uploads() {
    return Template.instance().uploads.get();
  }
});

Template.cardAttachmentsPopup.events({
  'change .js-attach-file'(event, templateInstance) {
    const card = this;
    const files = event.currentTarget.files;
    if (files) {
      let uploads = [];
      for (const file of files) {
        const fileId = new ObjectID().toString();
        let fileName = DOMPurify.sanitize(file.name);

        // If sanitized filename is not same as original filename,
        // it could be XSS that is already fixed with sanitize,
        // or just normal mistake, so it is not a problem.
        // That is why here is no warning.
        if (fileName !== file.name) {
          // If filename is empty, only in that case add some filename
          if (fileName.length === 0) {
            fileName = 'Empty-filename-after-sanitize.txt';
          }
        }

        const config = {
          file: file,
          fileId: fileId,
          fileName: fileName,
          meta: Utils.getCommonAttachmentMetaFrom(card),
          chunkSize: 'dynamic',
        };
        config.meta.fileId = fileId;
        const uploader = Attachments.insert(
          config,
          false,
        );
        uploader.on('start', function() {
          uploads.push(this);
          templateInstance.uploads.set(uploads);
        });
        uploader.on('uploaded', (error, fileRef) => {
          if (!error) {
            if (fileRef.isImage) {
              card.setCover(fileRef._id);
            }
          }
        });
        uploader.on('end', (error, fileRef) => {
          uploads = uploads.filter(_upload => _upload.config.fileId != fileRef._id);
          templateInstance.uploads.set(uploads);
          if (uploads.length == 0 ) {
            Popup.back();
          }
        });
        uploader.start();
      }
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
      const fileId = new ObjectID().toString();
      const config = {
        file,
        fileId: fileId,
        meta: Utils.getCommonAttachmentMetaFrom(card),
        fileName: file.name || file.type.replace('image/', 'clipboard.'),
        chunkSize: 'dynamic',
      };
      config.meta.fileId = fileId;
      const uploader = Attachments.insert(
        config,
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

BlazeComponent.extendComponent({
  isCover() {
    const ret = ReactiveCache.getCard(this.data().meta.cardId).coverId == this.data()._id;
    return ret;
  },
  isBackgroundImage() {
    //const currentBoard = Utils.getCurrentBoard();
    //return currentBoard.backgroundImageURL === $(".attachment-thumbnail-img").attr("src");
    return false;
  },
  events() {
    return [
      {
        'click .js-add-cover'() {
          ReactiveCache.getCard(this.data().meta.cardId).setCover(this.data()._id);
          Popup.back();
        },
        'click .js-remove-cover'() {
          ReactiveCache.getCard(this.data().meta.cardId).unsetCover();
          Popup.back();
        },
        'click .js-add-background-image'() {
          const currentBoard = Utils.getCurrentBoard();
          currentBoard.setBackgroundImageURL(attachmentActionsLink);
          Utils.setBackgroundImage(attachmentActionsLink);
          Popup.back();
          event.preventDefault();
        },
        'click .js-remove-background-image'() {
          const currentBoard = Utils.getCurrentBoard();
          currentBoard.setBackgroundImageURL("");
          Utils.setBackgroundImage("");
          Popup.back();
          Utils.reload();
          event.preventDefault();
        },
        'click .js-move-storage-fs'() {
          Meteor.call('moveAttachmentToStorage', this.data()._id, "fs");
          Popup.back();
        },
        'click .js-move-storage-gridfs'() {
          Meteor.call('moveAttachmentToStorage', this.data()._id, "gridfs");
          Popup.back();
        },
        'click .js-move-storage-s3'() {
          Meteor.call('moveAttachmentToStorage', this.data()._id, "s3");
          Popup.back();
        },
      }
    ]
  }
}).register('attachmentActionsPopup');

BlazeComponent.extendComponent({
  getNameWithoutExtension() {
    const ret = this.data().name.replace(new RegExp("\." + this.data().extension + "$"), "");
    return ret;
  },
  events() {
    return [
      {
        'keydown input.js-edit-attachment-name'(evt) {
          // enter = save
          if (evt.keyCode === 13) {
            this.find('button[type=submit]').click();
          }
        },
        'click button.js-submit-edit-attachment-name'(event) {
          // save button pressed
          event.preventDefault();
          const name = this.$('.js-edit-attachment-name')[0]
            .value
            .trim() + this.data().extensionWithDot;
          if (name === DOMPurify.sanitize(name)) {
            Meteor.call('renameAttachment', this.data()._id, name);
          }
          Popup.back();
        },
      }
    ]
  }
}).register('attachmentRenamePopup');
