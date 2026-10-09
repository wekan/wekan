'use strict';

/**
 * html-to-markdown
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

var headingRegex = /<h(\d*)>([\s\S]*?)<\/h\d*>/gim
var pRegex = /<p[\s\S]*?>([\s\S]*?)<\/p>/gim
var ulRegex = /<ul>([\s\S]*?)<\/ul>/gim
var olRegex = /<ol>([\s\S]*?)<\/ol>/gim
var liRegex = /<li>([\s\S]*?)<\/li>/gim
var preRegex = /<pre>([\s\S]*?)<\/pre>/gim
var blockQuoteRegex = /<blockquote>([\s\S]*?)<\/blockquote>/gim
var boldRegex = /<(?:b|strong)[\s\S]*?>([\s\S]*?)<\/(?:b|strong)>/gim
var italicRegex = /<(?:i|em)[\s\S]*?>([\s\S]*?)<\/(?:i|em)>/gim
var spanRegex = /<span[\s\S]*?>([\s\S]*?)<\/span>/gim

/**
 * @description executes a regex to replace matched text with
 * selected group with optional pre and postfix
 * @method makeRegex
 * @param  {String}  regex  [description]
 * @param  {String}  doc    [description]
 * @param  {String}  before [description]
 * @param  {String}  after  [description]
 * @return {String}         [description]
 */
function makeRegex (regex, doc, before, after, replaceFn) {
  var matches = [];
  var newDoc = doc;
  var replaceString;
  while(matches = regex.exec(doc)){
    if(matches && matches[1]){
      replaceString = before || '';
      var replaceText = matches[1].trim()
      if(replaceFn && typeof(replaceFn) === 'function'){
        replaceText = replaceFn(matches)
      }
      replaceString += replaceText + "\n";
      replaceString += after || '';
      newDoc = newDoc.replace(matches[0],replaceString);
    }
  }
  return newDoc
}

/**
 * @description replaces html headings with equalent markdown
 * syntax
 * @method replaceHeading
 * @param  {String}       doc [description]
 * @return {String}           [description]
 */
function replaceHeading (doc) {
  return makeRegex(headingRegex, doc, null, null, function (match) {
    return addHashes(match[1]) + match[2]
  });
}

/**
 * @description replaces ul section with equalent markdown
 * syntax
 * @method replaceUl
 * @param  {String}       doc [description]
 * @return {String}           [description]
 */
function replaceUl (doc) {
  return makeRegex(ulRegex, doc, null, null, function (match) {
    return replaceLi(match[1],'ul')
  });
}

/**
 * @description replaces ol section with equalent markdown
 * syntax
 * @method replaceOl
 * @param  {String}       doc [description]
 * @return {String}           [description]
 */
function replaceOl (doc) {
  return makeRegex(olRegex, doc, null, null, function (match) {
    return replaceLi(match[1],'ol')
  });
}

/**
 * @description replaces paragraph section with equalent markdown
 * syntax
 * @method replaceParagraph
 * @param  {String}       doc [description]
 * @return {String}           [description]
 */
function replaceParagraph (doc) {
  return makeRegex(pRegex, doc, null, '\n\n');
}

/**
 * @description replaces pre section with equalent markdown
 * syntax
 * @method replacePre
 * @param  {String}       doc [description]
 * @return {String}           [description]
 */
function replacePre (doc) {
  return makeRegex(preRegex, doc, '`', '`');
}

/**
 * @description replaces blockquote section with equalent markdown
 * syntax
 * @method replaceBlockQuote
 * @param  {String}       doc [description]
 * @return {String}           [description]
 */
function replaceBlockQuote (doc) {
  return makeRegex(blockQuoteRegex, doc, '> ');
}

/**
 * @description replaces bold|strong section with equalent markdown
 * syntax
 * @method replaceBold
 * @param  {String}       doc [description]
 * @return {String}           [description]
 */
function replaceBold (doc) {
  return makeRegex(boldRegex, doc, '**', '**');
}

/**
 * @description replaces i|em section with equalent markdown
 * syntax
 * @method replaceItalic
 * @param  {String}       doc [description]
 * @return {String}           [description]
 */
function replaceItalic (doc) {
  return makeRegex(italicRegex, doc, '*', '*');
}

/**
 * @description replaces li tags with equalent markup based
 * upon their parent tag
 * @method replaceLi
 * @param  {String}  doc [description]
 * @param  {String}  tag [description]
 * @return {String}      [description]
 */
function replaceLi (doc, tag) {
  var matches = [];
  var newDoc = doc;
  var replaceIndex = 0;
  var replaceTag = '';
  while(matches = liRegex.exec(doc)) {
    if (matches && matches[1]) {
      if (tag !== 'ul') {
        replaceIndex++;
        replaceTag = replaceIndex + '. ';
      }else{
        replaceTag = '* ';
      }
      newDoc = newDoc.replace(matches[0],replaceTag+matches[1].trim());
    }
  }
  return newDoc
}

/**
 * @description replaces span section with equalent markdown
 * syntax
 * @method replaceSpan
 * @param  {String}       doc [description]
 * @return {String}           [description]
 */
 function replaceSpan (doc) {
  return makeRegex(spanRegex, doc);
}

/**
 * @descriptions adds number of hashes to headings
 * based upon heading weight
 * @method addHashes
 * @param  {Number}  count [description]
 */
function addHashes (count) {
  count = Number(count);
  var string = '';
  for(var x=0;x<count;x++){
    string += '#';
  }
  // Add space after hashes, so that it views correctly
  string += ' ';
  return string;
}

module.exports = [
  replaceHeading,
  replaceParagraph,
  replacePre,
  replaceUl,
  replaceOl,
  replaceBold,
  replaceItalic,
  replaceBlockQuote,
  replaceSpan
]
