/* eslint-disable */

// ------------------------------------------------------------------------
// Created by STRd6
// MIT License
// https://github.com/distri/jquery-image_reader/blob/master/paste.coffee.md
//
// Raymond re-write it to javascript

(function($) {
  $.event.fix = (function(originalFix) {
    return function(event) {
      event = originalFix.apply(this, arguments);
      if (
        event.type.indexOf('copy') === 0 ||
        event.type.indexOf('paste') === 0
      ) {
        event.clipboardData = event.originalEvent.clipboardData;
      }
      return event;
    };
  })($.event.fix);

  const defaults = {
    callback: $.noop,
    matchType: /image.*/,
  };

  return ($.fn.pasteImageReader = function(options) {
    if (typeof options === 'function') {
      options = {
        callback: options,
      };
    }
    options = $.extend({}, defaults, options);
    return this.each(function() {
      const element = this;
      return $(element).on('paste', function(event) {
        const types = event.clipboardData.types;
        const items = event.clipboardData.items;
        for (let i = 0; i < types.length; i++) {
          if (
            types[i].match(options.matchType) ||
            items[i].type.match(options.matchType)
          ) {
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
  });
})(jQuery);
