(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;

/* Package-scope variables */
var HTML, IDENTITY, SLICE;

(function(){

////////////////////////////////////////////////////////////////////////////////////////
//                                                                                    //
// packages/htmljs/preamble.js                                                        //
//                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////
                                                                                      //
HTML = {};                                                                            // 1
                                                                                      // 2
IDENTITY = function (x) { return x; };                                                // 3
SLICE = Array.prototype.slice;                                                        // 4
                                                                                      // 5
////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////
//                                                                                    //
// packages/htmljs/visitors.js                                                        //
//                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////
                                                                                      //
////////////////////////////// VISITORS                                               // 1
                                                                                      // 2
// _assign is like _.extend or the upcoming Object.assign.                            // 3
// Copy src's own, enumerable properties onto tgt and return                          // 4
// tgt.                                                                               // 5
var _hasOwnProperty = Object.prototype.hasOwnProperty;                                // 6
var _assign = function (tgt, src) {                                                   // 7
  for (var k in src) {                                                                // 8
    if (_hasOwnProperty.call(src, k))                                                 // 9
      tgt[k] = src[k];                                                                // 10
  }                                                                                   // 11
  return tgt;                                                                         // 12
};                                                                                    // 13
                                                                                      // 14
HTML.Visitor = function (props) {                                                     // 15
  _assign(this, props);                                                               // 16
};                                                                                    // 17
                                                                                      // 18
HTML.Visitor.def = function (options) {                                               // 19
  _assign(this.prototype, options);                                                   // 20
};                                                                                    // 21
                                                                                      // 22
HTML.Visitor.extend = function (options) {                                            // 23
  var curType = this;                                                                 // 24
  var subType = function HTMLVisitorSubtype(/*arguments*/) {                          // 25
    HTML.Visitor.apply(this, arguments);                                              // 26
  };                                                                                  // 27
  subType.prototype = new curType;                                                    // 28
  subType.extend = curType.extend;                                                    // 29
  subType.def = curType.def;                                                          // 30
  if (options)                                                                        // 31
    _assign(subType.prototype, options);                                              // 32
  return subType;                                                                     // 33
};                                                                                    // 34
                                                                                      // 35
HTML.Visitor.def({                                                                    // 36
  visit: function (content/*, ...*/) {                                                // 37
    if (content == null)                                                              // 38
      // null or undefined.                                                           // 39
      return this.visitNull.apply(this, arguments);                                   // 40
                                                                                      // 41
    if (typeof content === 'object') {                                                // 42
      if (content.htmljsType) {                                                       // 43
        switch (content.htmljsType) {                                                 // 44
        case HTML.Tag.htmljsType:                                                     // 45
          return this.visitTag.apply(this, arguments);                                // 46
        case HTML.CharRef.htmljsType:                                                 // 47
          return this.visitCharRef.apply(this, arguments);                            // 48
        case HTML.Comment.htmljsType:                                                 // 49
          return this.visitComment.apply(this, arguments);                            // 50
        case HTML.Raw.htmljsType:                                                     // 51
          return this.visitRaw.apply(this, arguments);                                // 52
        default:                                                                      // 53
          throw new Error("Unknown htmljs type: " + content.htmljsType);              // 54
        }                                                                             // 55
      }                                                                               // 56
                                                                                      // 57
      if (HTML.isArray(content))                                                      // 58
        return this.visitArray.apply(this, arguments);                                // 59
                                                                                      // 60
      return this.visitObject.apply(this, arguments);                                 // 61
                                                                                      // 62
    } else if ((typeof content === 'string') ||                                       // 63
               (typeof content === 'boolean') ||                                      // 64
               (typeof content === 'number')) {                                       // 65
      return this.visitPrimitive.apply(this, arguments);                              // 66
                                                                                      // 67
    } else if (typeof content === 'function') {                                       // 68
      return this.visitFunction.apply(this, arguments);                               // 69
    }                                                                                 // 70
                                                                                      // 71
    throw new Error("Unexpected object in htmljs: " + content);                       // 72
                                                                                      // 73
  },                                                                                  // 74
  visitNull: function (nullOrUndefined/*, ...*/) {},                                  // 75
  visitPrimitive: function (stringBooleanOrNumber/*, ...*/) {},                       // 76
  visitArray: function (array/*, ...*/) {},                                           // 77
  visitComment: function (comment/*, ...*/) {},                                       // 78
  visitCharRef: function (charRef/*, ...*/) {},                                       // 79
  visitRaw: function (raw/*, ...*/) {},                                               // 80
  visitTag: function (tag/*, ...*/) {},                                               // 81
  visitObject: function (obj/*, ...*/) {                                              // 82
    throw new Error("Unexpected object in htmljs: " + obj);                           // 83
  },                                                                                  // 84
  visitFunction: function (fn/*, ...*/) {                                             // 85
    throw new Error("Unexpected function in htmljs: " + obj);                         // 86
  }                                                                                   // 87
});                                                                                   // 88
                                                                                      // 89
HTML.TransformingVisitor = HTML.Visitor.extend();                                     // 90
HTML.TransformingVisitor.def({                                                        // 91
  visitNull: IDENTITY,                                                                // 92
  visitPrimitive: IDENTITY,                                                           // 93
  visitArray: function (array/*, ...*/) {                                             // 94
    var argsCopy = SLICE.call(arguments);                                             // 95
    var result = array;                                                               // 96
    for (var i = 0; i < array.length; i++) {                                          // 97
      var oldItem = array[i];                                                         // 98
      argsCopy[0] = oldItem;                                                          // 99
      var newItem = this.visit.apply(this, argsCopy);                                 // 100
      if (newItem !== oldItem) {                                                      // 101
        // copy `array` on write                                                      // 102
        if (result === array)                                                         // 103
          result = array.slice();                                                     // 104
        result[i] = newItem;                                                          // 105
      }                                                                               // 106
    }                                                                                 // 107
    return result;                                                                    // 108
  },                                                                                  // 109
  visitComment: IDENTITY,                                                             // 110
  visitCharRef: IDENTITY,                                                             // 111
  visitRaw: IDENTITY,                                                                 // 112
  visitObject: IDENTITY,                                                              // 113
  visitFunction: IDENTITY,                                                            // 114
  visitTag: function (tag/*, ...*/) {                                                 // 115
    var oldChildren = tag.children;                                                   // 116
    var argsCopy = SLICE.call(arguments);                                             // 117
    argsCopy[0] = oldChildren;                                                        // 118
    var newChildren = this.visitChildren.apply(this, argsCopy);                       // 119
                                                                                      // 120
    var oldAttrs = tag.attrs;                                                         // 121
    argsCopy[0] = oldAttrs;                                                           // 122
    var newAttrs = this.visitAttributes.apply(this, argsCopy);                        // 123
                                                                                      // 124
    if (newAttrs === oldAttrs && newChildren === oldChildren)                         // 125
      return tag;                                                                     // 126
                                                                                      // 127
    var newTag = HTML.getTag(tag.tagName).apply(null, newChildren);                   // 128
    newTag.attrs = newAttrs;                                                          // 129
    return newTag;                                                                    // 130
  },                                                                                  // 131
  visitChildren: function (children/*, ...*/) {                                       // 132
    return this.visitArray.apply(this, arguments);                                    // 133
  },                                                                                  // 134
  // Transform the `.attrs` property of a tag, which may be a dictionary,             // 135
  // an array, or in some uses, a foreign object (such as                             // 136
  // a template tag).                                                                 // 137
  visitAttributes: function (attrs/*, ...*/) {                                        // 138
    if (HTML.isArray(attrs)) {                                                        // 139
      var argsCopy = SLICE.call(arguments);                                           // 140
      var result = attrs;                                                             // 141
      for (var i = 0; i < attrs.length; i++) {                                        // 142
        var oldItem = attrs[i];                                                       // 143
        argsCopy[0] = oldItem;                                                        // 144
        var newItem = this.visitAttributes.apply(this, argsCopy);                     // 145
        if (newItem !== oldItem) {                                                    // 146
          // copy on write                                                            // 147
          if (result === attrs)                                                       // 148
            result = attrs.slice();                                                   // 149
          result[i] = newItem;                                                        // 150
        }                                                                             // 151
      }                                                                               // 152
      return result;                                                                  // 153
    }                                                                                 // 154
                                                                                      // 155
    if (attrs && HTML.isConstructedObject(attrs)) {                                   // 156
      throw new Error("The basic HTML.TransformingVisitor does not support " +        // 157
                      "foreign objects in attributes.  Define a custom " +            // 158
                      "visitAttributes for this case.");                              // 159
    }                                                                                 // 160
                                                                                      // 161
    var oldAttrs = attrs;                                                             // 162
    var newAttrs = oldAttrs;                                                          // 163
    if (oldAttrs) {                                                                   // 164
      var attrArgs = [null, null];                                                    // 165
      attrArgs.push.apply(attrArgs, arguments);                                       // 166
      for (var k in oldAttrs) {                                                       // 167
        var oldValue = oldAttrs[k];                                                   // 168
        attrArgs[0] = k;                                                              // 169
        attrArgs[1] = oldValue;                                                       // 170
        var newValue = this.visitAttribute.apply(this, attrArgs);                     // 171
        if (newValue !== oldValue) {                                                  // 172
          // copy on write                                                            // 173
          if (newAttrs === oldAttrs)                                                  // 174
            newAttrs = _assign({}, oldAttrs);                                         // 175
          newAttrs[k] = newValue;                                                     // 176
        }                                                                             // 177
      }                                                                               // 178
    }                                                                                 // 179
                                                                                      // 180
    return newAttrs;                                                                  // 181
  },                                                                                  // 182
  // Transform the value of one attribute name/value in an                            // 183
  // attributes dictionary.                                                           // 184
  visitAttribute: function (name, value, tag/*, ...*/) {                              // 185
    var args = SLICE.call(arguments, 2);                                              // 186
    args[0] = value;                                                                  // 187
    return this.visit.apply(this, args);                                              // 188
  }                                                                                   // 189
});                                                                                   // 190
                                                                                      // 191
                                                                                      // 192
HTML.ToTextVisitor = HTML.Visitor.extend();                                           // 193
HTML.ToTextVisitor.def({                                                              // 194
  visitNull: function (nullOrUndefined) {                                             // 195
    return '';                                                                        // 196
  },                                                                                  // 197
  visitPrimitive: function (stringBooleanOrNumber) {                                  // 198
    var str = String(stringBooleanOrNumber);                                          // 199
    if (this.textMode === HTML.TEXTMODE.RCDATA) {                                     // 200
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;');                        // 201
    } else if (this.textMode === HTML.TEXTMODE.ATTRIBUTE) {                           // 202
      // escape `&` and `"` this time, not `&` and `<`                                // 203
      return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;');                      // 204
    } else {                                                                          // 205
      return str;                                                                     // 206
    }                                                                                 // 207
  },                                                                                  // 208
  visitArray: function (array) {                                                      // 209
    var parts = [];                                                                   // 210
    for (var i = 0; i < array.length; i++)                                            // 211
      parts.push(this.visit(array[i]));                                               // 212
    return parts.join('');                                                            // 213
  },                                                                                  // 214
  visitComment: function (comment) {                                                  // 215
    throw new Error("Can't have a comment here");                                     // 216
  },                                                                                  // 217
  visitCharRef: function (charRef) {                                                  // 218
    if (this.textMode === HTML.TEXTMODE.RCDATA ||                                     // 219
        this.textMode === HTML.TEXTMODE.ATTRIBUTE) {                                  // 220
      return charRef.html;                                                            // 221
    } else {                                                                          // 222
      return charRef.str;                                                             // 223
    }                                                                                 // 224
  },                                                                                  // 225
  visitRaw: function (raw) {                                                          // 226
    return raw.value;                                                                 // 227
  },                                                                                  // 228
  visitTag: function (tag) {                                                          // 229
    // Really we should just disallow Tags here.  However, at the                     // 230
    // moment it's useful to stringify any HTML we find.  In                          // 231
    // particular, when you include a template within `{{#markdown}}`,                // 232
    // we render the template as text, and since there's currently                    // 233
    // no way to make the template be *parsed* as text (e.g. `<template               // 234
    // type="text">`), we hackishly support HTML tags in markdown                     // 235
    // in templates by parsing them and stringifying them.                            // 236
    return this.visit(this.toHTML(tag));                                              // 237
  },                                                                                  // 238
  visitObject: function (x) {                                                         // 239
    throw new Error("Unexpected object in htmljs in toText: " + x);                   // 240
  },                                                                                  // 241
  toHTML: function (node) {                                                           // 242
    return HTML.toHTML(node);                                                         // 243
  }                                                                                   // 244
});                                                                                   // 245
                                                                                      // 246
                                                                                      // 247
                                                                                      // 248
HTML.ToHTMLVisitor = HTML.Visitor.extend();                                           // 249
HTML.ToHTMLVisitor.def({                                                              // 250
  visitNull: function (nullOrUndefined) {                                             // 251
    return '';                                                                        // 252
  },                                                                                  // 253
  visitPrimitive: function (stringBooleanOrNumber) {                                  // 254
    var str = String(stringBooleanOrNumber);                                          // 255
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;');                          // 256
  },                                                                                  // 257
  visitArray: function (array) {                                                      // 258
    var parts = [];                                                                   // 259
    for (var i = 0; i < array.length; i++)                                            // 260
      parts.push(this.visit(array[i]));                                               // 261
    return parts.join('');                                                            // 262
  },                                                                                  // 263
  visitComment: function (comment) {                                                  // 264
    return '<!--' + comment.sanitizedValue + '-->';                                   // 265
  },                                                                                  // 266
  visitCharRef: function (charRef) {                                                  // 267
    return charRef.html;                                                              // 268
  },                                                                                  // 269
  visitRaw: function (raw) {                                                          // 270
    return raw.value;                                                                 // 271
  },                                                                                  // 272
  visitTag: function (tag) {                                                          // 273
    var attrStrs = [];                                                                // 274
                                                                                      // 275
    var tagName = tag.tagName;                                                        // 276
    var children = tag.children;                                                      // 277
                                                                                      // 278
    var attrs = tag.attrs;                                                            // 279
    if (attrs) {                                                                      // 280
      attrs = HTML.flattenAttributes(attrs);                                          // 281
      for (var k in attrs) {                                                          // 282
        if (k === 'value' && tagName === 'textarea') {                                // 283
          children = [attrs[k], children];                                            // 284
        } else {                                                                      // 285
          var v = this.toText(attrs[k], HTML.TEXTMODE.ATTRIBUTE);                     // 286
          attrStrs.push(' ' + k + '="' + v + '"');                                    // 287
        }                                                                             // 288
      }                                                                               // 289
    }                                                                                 // 290
                                                                                      // 291
    var startTag = '<' + tagName + attrStrs.join('') + '>';                           // 292
                                                                                      // 293
    var childStrs = [];                                                               // 294
    var content;                                                                      // 295
    if (tagName === 'textarea') {                                                     // 296
                                                                                      // 297
      for (var i = 0; i < children.length; i++)                                       // 298
        childStrs.push(this.toText(children[i], HTML.TEXTMODE.RCDATA));               // 299
                                                                                      // 300
      content = childStrs.join('');                                                   // 301
      if (content.slice(0, 1) === '\n')                                               // 302
        // TEXTAREA will absorb a newline, so if we see one, add                      // 303
        // another one.                                                               // 304
        content = '\n' + content;                                                     // 305
                                                                                      // 306
    } else {                                                                          // 307
      for (var i = 0; i < children.length; i++)                                       // 308
        childStrs.push(this.visit(children[i]));                                      // 309
                                                                                      // 310
      content = childStrs.join('');                                                   // 311
    }                                                                                 // 312
                                                                                      // 313
    var result = startTag + content;                                                  // 314
                                                                                      // 315
    if (children.length || ! HTML.isVoidElement(tagName)) {                           // 316
      // "Void" elements like BR are the only ones that don't get a close             // 317
      // tag in HTML5.  They shouldn't have contents, either, so we could             // 318
      // throw an error upon seeing contents here.                                    // 319
      result += '</' + tagName + '>';                                                 // 320
    }                                                                                 // 321
                                                                                      // 322
    return result;                                                                    // 323
  },                                                                                  // 324
  visitObject: function (x) {                                                         // 325
    throw new Error("Unexpected object in htmljs in toHTML: " + x);                   // 326
  },                                                                                  // 327
  toText: function (node, textMode) {                                                 // 328
    return HTML.toText(node, textMode);                                               // 329
  }                                                                                   // 330
});                                                                                   // 331
                                                                                      // 332
////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////
//                                                                                    //
// packages/htmljs/html.js                                                            //
//                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////
                                                                                      //
                                                                                      // 1
                                                                                      // 2
HTML.Tag = function () {};                                                            // 3
HTML.Tag.prototype.tagName = ''; // this will be set per Tag subclass                 // 4
HTML.Tag.prototype.attrs = null;                                                      // 5
HTML.Tag.prototype.children = Object.freeze ? Object.freeze([]) : [];                 // 6
HTML.Tag.prototype.htmljsType = HTML.Tag.htmljsType = ['Tag'];                        // 7
                                                                                      // 8
// Given "p" create the function `HTML.P`.                                            // 9
var makeTagConstructor = function (tagName) {                                         // 10
  // HTMLTag is the per-tagName constructor of a HTML.Tag subclass                    // 11
  var HTMLTag = function (/*arguments*/) {                                            // 12
    // Work with or without `new`.  If not called with `new`,                         // 13
    // perform instantiation by recursively calling this constructor.                 // 14
    // We can't pass varargs, so pass no args.                                        // 15
    var instance = (this instanceof HTML.Tag) ? this : new HTMLTag;                   // 16
                                                                                      // 17
    var i = 0;                                                                        // 18
    var attrs = arguments.length && arguments[0];                                     // 19
    if (attrs && (typeof attrs === 'object')) {                                       // 20
      // Treat vanilla JS object as an attributes dictionary.                         // 21
      if (! HTML.isConstructedObject(attrs)) {                                        // 22
        instance.attrs = attrs;                                                       // 23
        i++;                                                                          // 24
      } else if (attrs instanceof HTML.Attrs) {                                       // 25
        var array = attrs.value;                                                      // 26
        if (array.length === 1) {                                                     // 27
          instance.attrs = array[0];                                                  // 28
        } else if (array.length > 1) {                                                // 29
          instance.attrs = array;                                                     // 30
        }                                                                             // 31
        i++;                                                                          // 32
      }                                                                               // 33
    }                                                                                 // 34
                                                                                      // 35
                                                                                      // 36
    // If no children, don't create an array at all, use the prototype's              // 37
    // (frozen, empty) array.  This way we don't create an empty array                // 38
    // every time someone creates a tag without `new` and this constructor            // 39
    // calls itself with no arguments (above).                                        // 40
    if (i < arguments.length)                                                         // 41
      instance.children = SLICE.call(arguments, i);                                   // 42
                                                                                      // 43
    return instance;                                                                  // 44
  };                                                                                  // 45
  HTMLTag.prototype = new HTML.Tag;                                                   // 46
  HTMLTag.prototype.constructor = HTMLTag;                                            // 47
  HTMLTag.prototype.tagName = tagName;                                                // 48
                                                                                      // 49
  return HTMLTag;                                                                     // 50
};                                                                                    // 51
                                                                                      // 52
// Not an HTMLjs node, but a wrapper to pass multiple attrs dictionaries              // 53
// to a tag (for the purpose of implementing dynamic attributes).                     // 54
var Attrs = HTML.Attrs = function (/*attrs dictionaries*/) {                          // 55
  // Work with or without `new`.  If not called with `new`,                           // 56
  // perform instantiation by recursively calling this constructor.                   // 57
  // We can't pass varargs, so pass no args.                                          // 58
  var instance = (this instanceof Attrs) ? this : new Attrs;                          // 59
                                                                                      // 60
  instance.value = SLICE.call(arguments);                                             // 61
                                                                                      // 62
  return instance;                                                                    // 63
};                                                                                    // 64
                                                                                      // 65
////////////////////////////// KNOWN ELEMENTS                                         // 66
                                                                                      // 67
HTML.getTag = function (tagName) {                                                    // 68
  var symbolName = HTML.getSymbolName(tagName);                                       // 69
  if (symbolName === tagName) // all-caps tagName                                     // 70
    throw new Error("Use the lowercase or camelCase form of '" + tagName + "' here");
                                                                                      // 72
  if (! HTML[symbolName])                                                             // 73
    HTML[symbolName] = makeTagConstructor(tagName);                                   // 74
                                                                                      // 75
  return HTML[symbolName];                                                            // 76
};                                                                                    // 77
                                                                                      // 78
HTML.ensureTag = function (tagName) {                                                 // 79
  HTML.getTag(tagName); // don't return it                                            // 80
};                                                                                    // 81
                                                                                      // 82
HTML.isTagEnsured = function (tagName) {                                              // 83
  return HTML.isKnownElement(tagName);                                                // 84
};                                                                                    // 85
                                                                                      // 86
HTML.getSymbolName = function (tagName) {                                             // 87
  // "foo-bar" -> "FOO_BAR"                                                           // 88
  return tagName.toUpperCase().replace(/-/g, '_');                                    // 89
};                                                                                    // 90
                                                                                      // 91
HTML.knownElementNames = 'a abbr acronym address applet area article aside audio b base basefont bdi bdo big blockquote body br button canvas caption center cite code col colgroup command data datagrid datalist dd del details dfn dir div dl dt em embed eventsource fieldset figcaption figure font footer form frame frameset h1 h2 h3 h4 h5 h6 head header hgroup hr html i iframe img input ins isindex kbd keygen label legend li link main map mark menu meta meter nav noframes noscript object ol optgroup option output p param pre progress q rp rt ruby s samp script section select small source span strike strong style sub summary sup table tbody td textarea tfoot th thead time title tr track tt u ul var video wbr'.split(' ');
// (we add the SVG ones below)                                                        // 93
                                                                                      // 94
HTML.knownSVGElementNames = 'altGlyph altGlyphDef altGlyphItem animate animateColor animateMotion animateTransform circle clipPath color-profile cursor defs desc ellipse feBlend feColorMatrix feComponentTransfer feComposite feConvolveMatrix feDiffuseLighting feDisplacementMap feDistantLight feFlood feFuncA feFuncB feFuncG feFuncR feGaussianBlur feImage feMerge feMergeNode feMorphology feOffset fePointLight feSpecularLighting feSpotLight feTile feTurbulence filter font font-face font-face-format font-face-name font-face-src font-face-uri foreignObject g glyph glyphRef hkern image line linearGradient marker mask metadata missing-glyph path pattern polygon polyline radialGradient rect set stop style svg switch symbol text textPath title tref tspan use view vkern'.split(' ');
// Append SVG element names to list of known element names                            // 96
HTML.knownElementNames = HTML.knownElementNames.concat(HTML.knownSVGElementNames);    // 97
                                                                                      // 98
HTML.voidElementNames = 'area base br col command embed hr img input keygen link meta param source track wbr'.split(' ');
                                                                                      // 100
// Speed up search through lists of known elements by creating internal "sets"        // 101
// of strings.                                                                        // 102
var YES = {yes:true};                                                                 // 103
var makeSet = function (array) {                                                      // 104
  var set = {};                                                                       // 105
  for (var i = 0; i < array.length; i++)                                              // 106
    set[array[i]] = YES;                                                              // 107
  return set;                                                                         // 108
};                                                                                    // 109
var voidElementSet = makeSet(HTML.voidElementNames);                                  // 110
var knownElementSet = makeSet(HTML.knownElementNames);                                // 111
var knownSVGElementSet = makeSet(HTML.knownSVGElementNames);                          // 112
                                                                                      // 113
HTML.isKnownElement = function (tagName) {                                            // 114
  return knownElementSet[tagName] === YES;                                            // 115
};                                                                                    // 116
                                                                                      // 117
HTML.isKnownSVGElement = function (tagName) {                                         // 118
  return knownSVGElementSet[tagName] === YES;                                         // 119
};                                                                                    // 120
                                                                                      // 121
HTML.isVoidElement = function (tagName) {                                             // 122
  return voidElementSet[tagName] === YES;                                             // 123
};                                                                                    // 124
                                                                                      // 125
                                                                                      // 126
// Ensure tags for all known elements                                                 // 127
for (var i = 0; i < HTML.knownElementNames.length; i++)                               // 128
  HTML.ensureTag(HTML.knownElementNames[i]);                                          // 129
                                                                                      // 130
                                                                                      // 131
var CharRef = HTML.CharRef = function (attrs) {                                       // 132
  if (! (this instanceof CharRef))                                                    // 133
    // called without `new`                                                           // 134
    return new CharRef(attrs);                                                        // 135
                                                                                      // 136
  if (! (attrs && attrs.html && attrs.str))                                           // 137
    throw new Error(                                                                  // 138
      "HTML.CharRef must be constructed with ({html:..., str:...})");                 // 139
                                                                                      // 140
  this.html = attrs.html;                                                             // 141
  this.str = attrs.str;                                                               // 142
};                                                                                    // 143
CharRef.prototype.htmljsType = CharRef.htmljsType = ['CharRef'];                      // 144
                                                                                      // 145
var Comment = HTML.Comment = function (value) {                                       // 146
  if (! (this instanceof Comment))                                                    // 147
    // called without `new`                                                           // 148
    return new Comment(value);                                                        // 149
                                                                                      // 150
  if (typeof value !== 'string')                                                      // 151
    throw new Error('HTML.Comment must be constructed with a string');                // 152
                                                                                      // 153
  this.value = value;                                                                 // 154
  // Kill illegal hyphens in comment value (no way to escape them in HTML)            // 155
  this.sanitizedValue = value.replace(/^-|--+|-$/g, '');                              // 156
};                                                                                    // 157
Comment.prototype.htmljsType = Comment.htmljsType = ['Comment'];                      // 158
                                                                                      // 159
var Raw = HTML.Raw = function (value) {                                               // 160
  if (! (this instanceof Raw))                                                        // 161
    // called without `new`                                                           // 162
    return new Raw(value);                                                            // 163
                                                                                      // 164
  if (typeof value !== 'string')                                                      // 165
    throw new Error('HTML.Raw must be constructed with a string');                    // 166
                                                                                      // 167
  this.value = value;                                                                 // 168
};                                                                                    // 169
Raw.prototype.htmljsType = Raw.htmljsType = ['Raw'];                                  // 170
                                                                                      // 171
                                                                                      // 172
HTML.isArray = function (x) {                                                         // 173
  // could change this to use the more convoluted Object.prototype.toString           // 174
  // approach that works when objects are passed between frames, but does             // 175
  // it matter?                                                                       // 176
  // Patched: use Array.isArray for cross-context compatibility (vm sandbox)
  return Array.isArray(x);                                                             // 177
};                                                                                    // 178
                                                                                      // 179
HTML.isConstructedObject = function (x) {                                             // 180
  // Figure out if `x` is "an instance of some class" or just a plain                 // 181
  // object literal.  It correctly treats an object literal like                      // 182
  // `{ constructor: ... }` as an object literal.  It won't detect                    // 183
  // instances of classes that lack a `constructor` property (e.g.                    // 184
  // if you assign to a prototype when setting up the class as in:                    // 185
  // `Foo = function () { ... }; Foo.prototype = { ... }`, then                       // 186
  // `(new Foo).constructor` is `Object`, not `Foo`).                                 // 187
  // Patched: cross-context compatibility (vm sandbox).
  // Arrays should never be "constructed objects", and plain object literals
  // should not be either, regardless of which V8 context created them.
  if (Array.isArray(x)) return false;
  if (!(x && (typeof x === 'object'))) return false;
  // Check if it's a plain object literal by seeing if constructor.name is 'Object'
  // This works across V8 contexts unlike the `x.constructor !== Object` check.
  if (!x.constructor || x.constructor.name === 'Object') return false;
  return (typeof x.constructor === 'function') &&                                     // 190
         (x instanceof x.constructor);                                                // 191
};                                                                                    // 192
                                                                                      // 193
HTML.isNully = function (node) {                                                      // 194
  if (node == null)                                                                   // 195
    // null or undefined                                                              // 196
    return true;                                                                      // 197
                                                                                      // 198
  if (HTML.isArray(node)) {                                                           // 199
    // is it an empty array or an array of all nully items?                           // 200
    for (var i = 0; i < node.length; i++)                                             // 201
      if (! HTML.isNully(node[i]))                                                    // 202
        return false;                                                                 // 203
    return true;                                                                      // 204
  }                                                                                   // 205
                                                                                      // 206
  return false;                                                                       // 207
};                                                                                    // 208
                                                                                      // 209
HTML.isValidAttributeName = function (name) {                                         // 210
  return /^[:_A-Za-z][:_A-Za-z0-9.\-]*/.test(name);                                   // 211
};                                                                                    // 212
                                                                                      // 213
// If `attrs` is an array of attributes dictionaries, combines them                   // 214
// into one.  Removes attributes that are "nully."                                    // 215
HTML.flattenAttributes = function (attrs) {                                           // 216
  if (! attrs)                                                                        // 217
    return attrs;                                                                     // 218
                                                                                      // 219
  var isArray = HTML.isArray(attrs);                                                  // 220
  if (isArray && attrs.length === 0)                                                  // 221
    return null;                                                                      // 222
                                                                                      // 223
  var result = {};                                                                    // 224
  for (var i = 0, N = (isArray ? attrs.length : 1); i < N; i++) {                     // 225
    var oneAttrs = (isArray ? attrs[i] : attrs);                                      // 226
    if ((typeof oneAttrs !== 'object') ||                                             // 227
        HTML.isConstructedObject(oneAttrs))                                           // 228
      throw new Error("Expected plain JS object as attrs, found: " + oneAttrs);       // 229
    for (var name in oneAttrs) {                                                      // 230
      if (! HTML.isValidAttributeName(name))                                          // 231
        throw new Error("Illegal HTML attribute name: " + name);                      // 232
      var value = oneAttrs[name];                                                     // 233
      if (! HTML.isNully(value))                                                      // 234
        result[name] = value;                                                         // 235
    }                                                                                 // 236
  }                                                                                   // 237
                                                                                      // 238
  return result;                                                                      // 239
};                                                                                    // 240
                                                                                      // 241
                                                                                      // 242
                                                                                      // 243
////////////////////////////// TOHTML                                                 // 244
                                                                                      // 245
HTML.toHTML = function (content) {                                                    // 246
  return (new HTML.ToHTMLVisitor).visit(content);                                     // 247
};                                                                                    // 248
                                                                                      // 249
// Escaping modes for outputting text when generating HTML.                           // 250
HTML.TEXTMODE = {                                                                     // 251
  STRING: 1,                                                                          // 252
  RCDATA: 2,                                                                          // 253
  ATTRIBUTE: 3                                                                        // 254
};                                                                                    // 255
                                                                                      // 256
                                                                                      // 257
HTML.toText = function (content, textMode) {                                          // 258
  if (! textMode)                                                                     // 259
    throw new Error("textMode required for HTML.toText");                             // 260
  if (! (textMode === HTML.TEXTMODE.STRING ||                                         // 261
         textMode === HTML.TEXTMODE.RCDATA ||                                         // 262
         textMode === HTML.TEXTMODE.ATTRIBUTE))                                       // 263
    throw new Error("Unknown textMode: " + textMode);                                 // 264
                                                                                      // 265
  var visitor = new HTML.ToTextVisitor({textMode: textMode});;                        // 266
  return visitor.visit(content);                                                      // 267
};                                                                                    // 268
                                                                                      // 269
////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
Package.htmljs = {
  HTML: HTML
};

})();



