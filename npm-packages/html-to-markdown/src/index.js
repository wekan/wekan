'use strict';

/**
 * html-to-markdown
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

var formatters = require('./formatters');
var extrasRegex = /<\/?(?:div|address|section|article)>/gim

/**
 * @description replacing unncessary html tags
 * @method replaceExtras
 * @param  {String}      doc
 * @return {String}
 */
function replaceExtras(doc) {
  var matches = [];
  var newDoc = doc;
  newDoc = newDoc.replace(extrasRegex,'');
  return newDoc
}

module.exports = {

  /**
   * @description converts given html to a markdown
   * document
   * @method convert
   * @param  {String} html
   * @return {String}
   */
  convert: function (html) {

    /**
     * replacing unncessary html tags
     * @type {String}
     */
    html = replaceExtras(html);

    /**
     * looping through registered formatters
     */
    for(var x=0;x<formatters.length; x++){
      var formatter = formatters[x];
      if(typeof(formatter) === 'function'){
        html = formatter(html)
      }
    }
    return html;
  },

  /**
   * adding a new formatter to the list of formatters
   * @method use
   * @param  {Function} formatter
   * @return {void}
   */
  use: function (formatter) {
    formatters.push(formatter)
  }
}
