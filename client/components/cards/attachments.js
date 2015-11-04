Template.attachmentsGalery.events({
  'click .js-add-attachment'() {
    Popup.open('cardAttachments').apply(this, arguments);

    $('html').pasteImageReader(function(results) {
      Popup.pasted = results;
      $('img.preview-clipboard-image').attr('src', results.dataURL);
    });
  },
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
  'click .js-preview-image'() {
    Popup.open('previewAttachedImage').apply(this, arguments);

    setTimeout(function(){
      const img = $('img.preview-large-image');
      const w = img.width(), h = img.height();
      if(w > 300) {
        $('div.pop-over').css({
          width: (w + 20),
          position: 'absolute',
          left: (window.innerWidth - w)/2,
          top: (window.innerHeight - h)/2,
        });
      }
    }, 50);
  },
});

Template.previewAttachedImagePopup.events({
  'click .js-large-image-clicked'(){
    Popup.close();
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
  'click .js-upload-clipboard-image'() {
    const results = Popup.pasted;
    if((typeof Blob !== 'undefined') && (results.file instanceof Blob) && results.file) {
      const card = this;
      const file = new FS.File( results.file );
      if(typeof results.file.type === 'string') {
        const extname = results.file.type.split('/')[1];
        const filename = 'clipboard.png'.replace('png', extname);
        file.name( filename );
      }
      file.updatedAt(new Date());
      file.boardId = card.boardId;
      file.cardId  = card._id;
      Attachments.insert(file);
    }

    $('html').pasteImageReader(function(){});
    Popup.close();
  },
});

// ------------------------------------------------------------------------
// Created by STRd6
// MIT License
// jquery.paste_image_reader.js
(function($) {
  $.event.fix = (function(originalFix) {
    return function(event) {
      event = originalFix.apply(this, arguments);
      if (event.type.indexOf('copy') === 0 || event.type.indexOf('paste') === 0) {
        event.clipboardData = event.originalEvent.clipboardData;
      }
      return event;
    };
  })($.event.fix);

  const defaults = {
    callback: $.noop,
    matchType: /image.*/,
  };

  return $.fn.pasteImageReader = function(options) {
    if (typeof options === 'function') {
      options = {
        callback: options,
      };
    }
    options = $.extend({}, defaults, options);
    return this.each(function() {
      const element = this;
      return $(element).bind('paste', function(event) {
        const types = event.clipboardData.types;
        const items = event.clipboardData.items;
        for(let i=0; i<types.length; i++) {
          if(types[i].match(options.matchType) || items[i].type.match(options.matchType)) {
            const f = items[i].getAsFile();
            const reader = new FileReader();
            reader.onload = function(evt) {
              return options.callback.call(element, {
                dataURL: evt.target.result,
                event: evt,
                file: f,
                name: f.name,
              });
            };
            reader.readAsDataURL(f);
            return;
          }
        }
      });
    });
  };
})(jQuery);

