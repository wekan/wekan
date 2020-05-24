/* eslint-disable */

// ------------------------------------------------------------------------
// Created by STRd6
// MIT License
// https://github.com/distri/jquery-image_reader/blob/master/drop.coffee.md
//
// Raymond re-write it to javascript

(function($) {
  $.event.fix = (function(originalFix) {
    return function(event) {
      event = originalFix.apply(this, arguments);
      if (
        event.type.indexOf('drag') === 0 ||
        event.type.indexOf('drop') === 0
      ) {
        event.dataTransfer = event.originalEvent.dataTransfer;
      }
      return event;
    };
  })($.event.fix);

  const defaults = {
    callback: $.noop,
    matchType: /image.*/,
  };

  return ($.fn.dropImageReader = function(options) {
    if (typeof options === 'function') {
      options = {
        callback: options,
      };
    }
    options = $.extend({}, defaults, options);
    const stopFn = function(event) {
      event.stopPropagation();
      return event.preventDefault();
    };
    return this.each(function() {
      const element = this;
      $(element).on('dragenter dragover dragleave', stopFn);
      return $(element).on('drop', function(event) {
        stopFn(event);
        const files = event.dataTransfer.files;
        for (let i = 0; i < files.length; i++) {
          const f = files[i];
          if (f.type.match(options.matchType)) {
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
  });
})(jQuery);
