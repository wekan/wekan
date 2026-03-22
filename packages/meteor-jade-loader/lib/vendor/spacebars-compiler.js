(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var HTML = Package.htmljs.HTML;
var HTMLTools = Package['html-tools'].HTMLTools;
var BlazeTools = Package['blaze-tools'].BlazeTools;
var _ = Package.underscore._;

/* Package-scope variables */
var SpacebarsCompiler, TemplateTag, ReactComponentSiblingForbidder;

(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                     //
// packages/spacebars-compiler/templatetag.js                                                          //
//                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                       //
SpacebarsCompiler = {};                                                                                // 1
                                                                                                       // 2
// A TemplateTag is the result of parsing a single `{{...}}` tag.                                      // 3
//                                                                                                     // 4
// The `.type` of a TemplateTag is one of:                                                             // 5
//                                                                                                     // 6
// - `"DOUBLE"` - `{{foo}}`                                                                            // 7
// - `"TRIPLE"` - `{{{foo}}}`                                                                          // 8
// - `"EXPR"` - `(foo)`                                                                                // 9
// - `"COMMENT"` - `{{! foo}}`                                                                         // 10
// - `"BLOCKCOMMENT" - `{{!-- foo--}}`                                                                 // 11
// - `"INCLUSION"` - `{{> foo}}`                                                                       // 12
// - `"BLOCKOPEN"` - `{{#foo}}`                                                                        // 13
// - `"BLOCKCLOSE"` - `{{/foo}}`                                                                       // 14
// - `"ELSE"` - `{{else}}`                                                                             // 15
// - `"ESCAPE"` - `{{|`, `{{{|`, `{{{{|` and so on                                                     // 16
//                                                                                                     // 17
// Besides `type`, the mandatory properties of a TemplateTag are:                                      // 18
//                                                                                                     // 19
// - `path` - An array of one or more strings.  The path of `{{foo.bar}}`                              // 20
//   is `["foo", "bar"]`.  Applies to DOUBLE, TRIPLE, INCLUSION, BLOCKOPEN,                            // 21
//   and BLOCKCLOSE.                                                                                   // 22
//                                                                                                     // 23
// - `args` - An array of zero or more argument specs.  An argument spec                               // 24
//   is a two or three element array, consisting of a type, value, and                                 // 25
//   optional keyword name.  For example, the `args` of `{{foo "bar" x=3}}`                            // 26
//   are `[["STRING", "bar"], ["NUMBER", 3, "x"]]`.  Applies to DOUBLE,                                // 27
//   TRIPLE, INCLUSION, and BLOCKOPEN.                                                                 // 28
//                                                                                                     // 29
// - `value` - A string of the comment's text. Applies to COMMENT and                                  // 30
//   BLOCKCOMMENT.                                                                                     // 31
//                                                                                                     // 32
// These additional are typically set during parsing:                                                  // 33
//                                                                                                     // 34
// - `position` - The HTMLTools.TEMPLATE_TAG_POSITION specifying at what sort                          // 35
//   of site the TemplateTag was encountered (e.g. at element level or as                              // 36
//   part of an attribute value). Its absence implies                                                  // 37
//   TEMPLATE_TAG_POSITION.ELEMENT.                                                                    // 38
//                                                                                                     // 39
// - `content` and `elseContent` - When a BLOCKOPEN tag's contents are                                 // 40
//   parsed, they are put here.  `elseContent` will only be present if                                 // 41
//   an `{{else}}` was found.                                                                          // 42
                                                                                                       // 43
var TEMPLATE_TAG_POSITION = HTMLTools.TEMPLATE_TAG_POSITION;                                           // 44
                                                                                                       // 45
TemplateTag = SpacebarsCompiler.TemplateTag = function () {                                            // 46
  HTMLTools.TemplateTag.apply(this, arguments);                                                        // 47
};                                                                                                     // 48
TemplateTag.prototype = new HTMLTools.TemplateTag;                                                     // 49
TemplateTag.prototype.constructorName = 'SpacebarsCompiler.TemplateTag';                               // 50
                                                                                                       // 51
var makeStacheTagStartRegex = function (r) {                                                           // 52
  return new RegExp(r.source + /(?![{>!#/])/.source,                                                   // 53
                    r.ignoreCase ? 'i' : '');                                                          // 54
};                                                                                                     // 55
                                                                                                       // 56
// "starts" regexes are used to see what type of template                                              // 57
// tag the parser is looking at.  They must match a non-empty                                          // 58
// result, but not the interesting part of the tag.                                                    // 59
var starts = {                                                                                         // 60
  ESCAPE: /^\{\{(?=\{*\|)/,                                                                            // 61
  ELSE: makeStacheTagStartRegex(/^\{\{\s*else(?=[\s}])/i),                                             // 62
  DOUBLE: makeStacheTagStartRegex(/^\{\{\s*(?!\s)/),                                                   // 63
  TRIPLE: makeStacheTagStartRegex(/^\{\{\{\s*(?!\s)/),                                                 // 64
  BLOCKCOMMENT: makeStacheTagStartRegex(/^\{\{\s*!--/),                                                // 65
  COMMENT: makeStacheTagStartRegex(/^\{\{\s*!/),                                                       // 66
  INCLUSION: makeStacheTagStartRegex(/^\{\{\s*>\s*(?!\s)/),                                            // 67
  BLOCKOPEN: makeStacheTagStartRegex(/^\{\{\s*#\s*(?!\s)/),                                            // 68
  BLOCKCLOSE: makeStacheTagStartRegex(/^\{\{\s*\/\s*(?!\s)/)                                           // 69
};                                                                                                     // 70
                                                                                                       // 71
var ends = {                                                                                           // 72
  DOUBLE: /^\s*\}\}/,                                                                                  // 73
  TRIPLE: /^\s*\}\}\}/,                                                                                // 74
  EXPR: /^\s*\)/                                                                                       // 75
};                                                                                                     // 76
                                                                                                       // 77
var endsString = {                                                                                     // 78
  DOUBLE: '}}',                                                                                        // 79
  TRIPLE: '}}}',                                                                                       // 80
  EXPR: ')'                                                                                            // 81
};                                                                                                     // 82
                                                                                                       // 83
// Parse a tag from the provided scanner or string.  If the input                                      // 84
// doesn't start with `{{`, returns null.  Otherwise, either succeeds                                  // 85
// and returns a SpacebarsCompiler.TemplateTag, or throws an error (using                              // 86
// `scanner.fatal` if a scanner is provided).                                                          // 87
TemplateTag.parse = function (scannerOrString) {                                                       // 88
  var scanner = scannerOrString;                                                                       // 89
  if (typeof scanner === 'string')                                                                     // 90
    scanner = new HTMLTools.Scanner(scannerOrString);                                                  // 91
                                                                                                       // 92
  if (! (scanner.peek() === '{' &&                                                                     // 93
         (scanner.rest()).slice(0, 2) === '{{'))                                                       // 94
    return null;                                                                                       // 95
                                                                                                       // 96
  var run = function (regex) {                                                                         // 97
    // regex is assumed to start with `^`                                                              // 98
    var result = regex.exec(scanner.rest());                                                           // 99
    if (! result)                                                                                      // 100
      return null;                                                                                     // 101
    var ret = result[0];                                                                               // 102
    scanner.pos += ret.length;                                                                         // 103
    return ret;                                                                                        // 104
  };                                                                                                   // 105
                                                                                                       // 106
  var advance = function (amount) {                                                                    // 107
    scanner.pos += amount;                                                                             // 108
  };                                                                                                   // 109
                                                                                                       // 110
  var scanIdentifier = function (isFirstInPath) {                                                      // 111
    var id = BlazeTools.parseExtendedIdentifierName(scanner);                                          // 112
    if (! id) {                                                                                        // 113
      expected('IDENTIFIER');                                                                          // 114
    }                                                                                                  // 115
    if (isFirstInPath &&                                                                               // 116
        (id === 'null' || id === 'true' || id === 'false'))                                            // 117
      scanner.fatal("Can't use null, true, or false, as an identifier at start of path");              // 118
                                                                                                       // 119
    return id;                                                                                         // 120
  };                                                                                                   // 121
                                                                                                       // 122
  var scanPath = function () {                                                                         // 123
    var segments = [];                                                                                 // 124
                                                                                                       // 125
    // handle initial `.`, `..`, `./`, `../`, `../..`, `../../`, etc                                   // 126
    var dots;                                                                                          // 127
    if ((dots = run(/^[\.\/]+/))) {                                                                    // 128
      var ancestorStr = '.'; // eg `../../..` maps to `....`                                           // 129
      var endsWithSlash = /\/$/.test(dots);                                                            // 130
                                                                                                       // 131
      if (endsWithSlash)                                                                               // 132
        dots = dots.slice(0, -1);                                                                      // 133
                                                                                                       // 134
      _.each(dots.split('/'), function(dotClause, index) {                                             // 135
        if (index === 0) {                                                                             // 136
          if (dotClause !== '.' && dotClause !== '..')                                                 // 137
            expected("`.`, `..`, `./` or `../`");                                                      // 138
        } else {                                                                                       // 139
          if (dotClause !== '..')                                                                      // 140
            expected("`..` or `../`");                                                                 // 141
        }                                                                                              // 142
                                                                                                       // 143
        if (dotClause === '..')                                                                        // 144
          ancestorStr += '.';                                                                          // 145
      });                                                                                              // 146
                                                                                                       // 147
      segments.push(ancestorStr);                                                                      // 148
                                                                                                       // 149
      if (!endsWithSlash)                                                                              // 150
        return segments;                                                                               // 151
    }                                                                                                  // 152
                                                                                                       // 153
    while (true) {                                                                                     // 154
      // scan a path segment                                                                           // 155
                                                                                                       // 156
      if (run(/^\[/)) {                                                                                // 157
        var seg = run(/^[\s\S]*?\]/);                                                                  // 158
        if (! seg)                                                                                     // 159
          error("Unterminated path segment");                                                          // 160
        seg = seg.slice(0, -1);                                                                        // 161
        if (! seg && ! segments.length)                                                                // 162
          error("Path can't start with empty string");                                                 // 163
        segments.push(seg);                                                                            // 164
      } else {                                                                                         // 165
        var id = scanIdentifier(! segments.length);                                                    // 166
        if (id === 'this') {                                                                           // 167
          if (! segments.length) {                                                                     // 168
            // initial `this`                                                                          // 169
            segments.push('.');                                                                        // 170
          } else {                                                                                     // 171
            error("Can only use `this` at the beginning of a path.\nInstead of `foo.this` or `../this`, just write `foo` or `..`.");
          }                                                                                            // 173
        } else {                                                                                       // 174
          segments.push(id);                                                                           // 175
        }                                                                                              // 176
      }                                                                                                // 177
                                                                                                       // 178
      var sep = run(/^[\.\/]/);                                                                        // 179
      if (! sep)                                                                                       // 180
        break;                                                                                         // 181
    }                                                                                                  // 182
                                                                                                       // 183
    return segments;                                                                                   // 184
  };                                                                                                   // 185
                                                                                                       // 186
  // scan the keyword portion of a keyword argument                                                    // 187
  // (the "foo" portion in "foo=bar").                                                                 // 188
  // Result is either the keyword matched, or null                                                     // 189
  // if we're not at a keyword argument position.                                                      // 190
  var scanArgKeyword = function () {                                                                   // 191
    var match = /^([^\{\}\(\)\>#=\s"'\[\]]+)\s*=\s*/.exec(scanner.rest());                             // 192
    if (match) {                                                                                       // 193
      scanner.pos += match[0].length;                                                                  // 194
      return match[1];                                                                                 // 195
    } else {                                                                                           // 196
      return null;                                                                                     // 197
    }                                                                                                  // 198
  };                                                                                                   // 199
                                                                                                       // 200
  // scan an argument; succeeds or errors.                                                             // 201
  // Result is an array of two or three items:                                                         // 202
  // type , value, and (indicating a keyword argument)                                                 // 203
  // keyword name.                                                                                     // 204
  var scanArg = function () {                                                                          // 205
    var keyword = scanArgKeyword(); // null if not parsing a kwarg                                     // 206
    var value = scanArgValue();                                                                        // 207
    return keyword ? value.concat(keyword) : value;                                                    // 208
  };                                                                                                   // 209
                                                                                                       // 210
  // scan an argument value (for keyword or positional arguments);                                     // 211
  // succeeds or errors.  Result is an array of type, value.                                           // 212
  var scanArgValue = function () {                                                                     // 213
    var startPos = scanner.pos;                                                                        // 214
    var result;                                                                                        // 215
    if ((result = BlazeTools.parseNumber(scanner))) {                                                  // 216
      return ['NUMBER', result.value];                                                                 // 217
    } else if ((result = BlazeTools.parseStringLiteral(scanner))) {                                    // 218
      return ['STRING', result.value];                                                                 // 219
    } else if (/^[\.\[]/.test(scanner.peek())) {                                                       // 220
      return ['PATH', scanPath()];                                                                     // 221
    } else if (run(/^\(/)) {                                                                           // 222
      return ['EXPR', scanExpr('EXPR')];                                                               // 223
    } else if ((result = BlazeTools.parseExtendedIdentifierName(scanner))) {                           // 224
      var id = result;                                                                                 // 225
      if (id === 'null') {                                                                             // 226
        return ['NULL', null];                                                                         // 227
      } else if (id === 'true' || id === 'false') {                                                    // 228
        return ['BOOLEAN', id === 'true'];                                                             // 229
      } else {                                                                                         // 230
        scanner.pos = startPos; // unconsume `id`                                                      // 231
        return ['PATH', scanPath()];                                                                   // 232
      }                                                                                                // 233
    } else {                                                                                           // 234
      expected('identifier, number, string, boolean, null, or a sub expression enclosed in "(", ")"');
    }                                                                                                  // 236
  };                                                                                                   // 237
                                                                                                       // 238
  var scanExpr = function (type) {                                                                     // 239
    var endType = type;                                                                                // 240
    if (type === 'INCLUSION' || type === 'BLOCKOPEN')                                                  // 241
      endType = 'DOUBLE';                                                                              // 242
                                                                                                       // 243
    var tag = new TemplateTag;                                                                         // 244
    tag.type = type;                                                                                   // 245
    tag.path = scanPath();                                                                             // 246
    tag.args = [];                                                                                     // 247
    var foundKwArg = false;                                                                            // 248
    while (true) {                                                                                     // 249
      run(/^\s*/);                                                                                     // 250
      if (run(ends[endType]))                                                                          // 251
        break;                                                                                         // 252
      else if (/^[})]/.test(scanner.peek())) {                                                         // 253
        expected('`' + endsString[endType] + '`');                                                     // 254
      }                                                                                                // 255
      var newArg = scanArg();                                                                          // 256
      if (newArg.length === 3) {                                                                       // 257
        foundKwArg = true;                                                                             // 258
      } else {                                                                                         // 259
        if (foundKwArg)                                                                                // 260
          error("Can't have a non-keyword argument after a keyword argument");                         // 261
      }                                                                                                // 262
      tag.args.push(newArg);                                                                           // 263
                                                                                                       // 264
      // expect a whitespace or a closing ')' or '}'                                                   // 265
      if (run(/^(?=[\s})])/) !== '')                                                                   // 266
        expected('space');                                                                             // 267
    }                                                                                                  // 268
                                                                                                       // 269
    return tag;                                                                                        // 270
  };                                                                                                   // 271
                                                                                                       // 272
  var type;                                                                                            // 273
                                                                                                       // 274
  var error = function (msg) {                                                                         // 275
    scanner.fatal(msg);                                                                                // 276
  };                                                                                                   // 277
                                                                                                       // 278
  var expected = function (what) {                                                                     // 279
    error('Expected ' + what);                                                                         // 280
  };                                                                                                   // 281
                                                                                                       // 282
  // must do ESCAPE first, immediately followed by ELSE                                                // 283
  // order of others doesn't matter                                                                    // 284
  if (run(starts.ESCAPE)) type = 'ESCAPE';                                                             // 285
  else if (run(starts.ELSE)) type = 'ELSE';                                                            // 286
  else if (run(starts.DOUBLE)) type = 'DOUBLE';                                                        // 287
  else if (run(starts.TRIPLE)) type = 'TRIPLE';                                                        // 288
  else if (run(starts.BLOCKCOMMENT)) type = 'BLOCKCOMMENT';                                            // 289
  else if (run(starts.COMMENT)) type = 'COMMENT';                                                      // 290
  else if (run(starts.INCLUSION)) type = 'INCLUSION';                                                  // 291
  else if (run(starts.BLOCKOPEN)) type = 'BLOCKOPEN';                                                  // 292
  else if (run(starts.BLOCKCLOSE)) type = 'BLOCKCLOSE';                                                // 293
  else                                                                                                 // 294
    error('Unknown stache tag');                                                                       // 295
                                                                                                       // 296
  var tag = new TemplateTag;                                                                           // 297
  tag.type = type;                                                                                     // 298
                                                                                                       // 299
  if (type === 'BLOCKCOMMENT') {                                                                       // 300
    var result = run(/^[\s\S]*?--\s*?\}\}/);                                                           // 301
    if (! result)                                                                                      // 302
      error("Unclosed block comment");                                                                 // 303
    tag.value = result.slice(0, result.lastIndexOf('--'));                                             // 304
  } else if (type === 'COMMENT') {                                                                     // 305
    var result = run(/^[\s\S]*?\}\}/);                                                                 // 306
    if (! result)                                                                                      // 307
      error("Unclosed comment");                                                                       // 308
    tag.value = result.slice(0, -2);                                                                   // 309
  } else if (type === 'BLOCKCLOSE') {                                                                  // 310
    tag.path = scanPath();                                                                             // 311
    if (! run(ends.DOUBLE))                                                                            // 312
      expected('`}}`');                                                                                // 313
  } else if (type === 'ELSE') {                                                                        // 314
    if (! run(ends.DOUBLE))                                                                            // 315
      expected('`}}`');                                                                                // 316
  } else if (type === 'ESCAPE') {                                                                      // 317
    var result = run(/^\{*\|/);                                                                        // 318
    tag.value = '{{' + result.slice(0, -1);                                                            // 319
  } else {                                                                                             // 320
    // DOUBLE, TRIPLE, BLOCKOPEN, INCLUSION                                                            // 321
    tag = scanExpr(type);                                                                              // 322
  }                                                                                                    // 323
                                                                                                       // 324
  return tag;                                                                                          // 325
};                                                                                                     // 326
                                                                                                       // 327
// Returns a SpacebarsCompiler.TemplateTag parsed from `scanner`, leaving scanner                      // 328
// at its original position.                                                                           // 329
//                                                                                                     // 330
// An error will still be thrown if there is not a valid template tag at                               // 331
// the current position.                                                                               // 332
TemplateTag.peek = function (scanner) {                                                                // 333
  var startPos = scanner.pos;                                                                          // 334
  var result = TemplateTag.parse(scanner);                                                             // 335
  scanner.pos = startPos;                                                                              // 336
  return result;                                                                                       // 337
};                                                                                                     // 338
                                                                                                       // 339
// Like `TemplateTag.parse`, but in the case of blocks, parse the complete                             // 340
// `{{#foo}}...{{/foo}}` with `content` and possible `elseContent`, rather                             // 341
// than just the BLOCKOPEN tag.                                                                        // 342
//                                                                                                     // 343
// In addition:                                                                                        // 344
//                                                                                                     // 345
// - Throws an error if `{{else}}` or `{{/foo}}` tag is encountered.                                   // 346
//                                                                                                     // 347
// - Returns `null` for a COMMENT.  (This case is distinguishable from                                 // 348
//   parsing no tag by the fact that the scanner is advanced.)                                         // 349
//                                                                                                     // 350
// - Takes an HTMLTools.TEMPLATE_TAG_POSITION `position` and sets it as the                            // 351
//   TemplateTag's `.position` property.                                                               // 352
//                                                                                                     // 353
// - Validates the tag's well-formedness and legality at in its position.                              // 354
TemplateTag.parseCompleteTag = function (scannerOrString, position) {                                  // 355
  var scanner = scannerOrString;                                                                       // 356
  if (typeof scanner === 'string')                                                                     // 357
    scanner = new HTMLTools.Scanner(scannerOrString);                                                  // 358
                                                                                                       // 359
  var startPos = scanner.pos; // for error messages                                                    // 360
  var result = TemplateTag.parse(scannerOrString);                                                     // 361
  if (! result)                                                                                        // 362
    return result;                                                                                     // 363
                                                                                                       // 364
  if (result.type === 'BLOCKCOMMENT')                                                                  // 365
    return null;                                                                                       // 366
                                                                                                       // 367
  if (result.type === 'COMMENT')                                                                       // 368
    return null;                                                                                       // 369
                                                                                                       // 370
  if (result.type === 'ELSE')                                                                          // 371
    scanner.fatal("Unexpected {{else}}");                                                              // 372
                                                                                                       // 373
  if (result.type === 'BLOCKCLOSE')                                                                    // 374
    scanner.fatal("Unexpected closing template tag");                                                  // 375
                                                                                                       // 376
  position = (position || TEMPLATE_TAG_POSITION.ELEMENT);                                              // 377
  if (position !== TEMPLATE_TAG_POSITION.ELEMENT)                                                      // 378
    result.position = position;                                                                        // 379
                                                                                                       // 380
  if (result.type === 'BLOCKOPEN') {                                                                   // 381
    // parse block contents                                                                            // 382
                                                                                                       // 383
    // Construct a string version of `.path` for comparing start and                                   // 384
    // end tags.  For example, `foo/[0]` was parsed into `["foo", "0"]`                                // 385
    // and now becomes `foo,0`.  This form may also show up in error                                   // 386
    // messages.                                                                                       // 387
    var blockName = result.path.join(',');                                                             // 388
                                                                                                       // 389
    var textMode = null;                                                                               // 390
      if (blockName === 'markdown' ||                                                                  // 391
          position === TEMPLATE_TAG_POSITION.IN_RAWTEXT) {                                             // 392
        textMode = HTML.TEXTMODE.STRING;                                                               // 393
      } else if (position === TEMPLATE_TAG_POSITION.IN_RCDATA ||                                       // 394
                 position === TEMPLATE_TAG_POSITION.IN_ATTRIBUTE) {                                    // 395
        textMode = HTML.TEXTMODE.RCDATA;                                                               // 396
      }                                                                                                // 397
      var parserOptions = {                                                                            // 398
        getTemplateTag: TemplateTag.parseCompleteTag,                                                  // 399
        shouldStop: isAtBlockCloseOrElse,                                                              // 400
        textMode: textMode                                                                             // 401
      };                                                                                               // 402
    result.content = HTMLTools.parseFragment(scanner, parserOptions);                                  // 403
                                                                                                       // 404
    if (scanner.rest().slice(0, 2) !== '{{')                                                           // 405
      scanner.fatal("Expected {{else}} or block close for " + blockName);                              // 406
                                                                                                       // 407
    var lastPos = scanner.pos; // save for error messages                                              // 408
    var tmplTag = TemplateTag.parse(scanner); // {{else}} or {{/foo}}                                  // 409
                                                                                                       // 410
    if (tmplTag.type === 'ELSE') {                                                                     // 411
      // parse {{else}} and content up to close tag                                                    // 412
      result.elseContent = HTMLTools.parseFragment(scanner, parserOptions);                            // 413
                                                                                                       // 414
      if (scanner.rest().slice(0, 2) !== '{{')                                                         // 415
        scanner.fatal("Expected block close for " + blockName);                                        // 416
                                                                                                       // 417
      lastPos = scanner.pos;                                                                           // 418
      tmplTag = TemplateTag.parse(scanner);                                                            // 419
    }                                                                                                  // 420
                                                                                                       // 421
    if (tmplTag.type === 'BLOCKCLOSE') {                                                               // 422
      var blockName2 = tmplTag.path.join(',');                                                         // 423
      if (blockName !== blockName2) {                                                                  // 424
        scanner.pos = lastPos;                                                                         // 425
        scanner.fatal('Expected tag to close ' + blockName + ', found ' +                              // 426
                      blockName2);                                                                     // 427
      }                                                                                                // 428
    } else {                                                                                           // 429
      scanner.pos = lastPos;                                                                           // 430
      scanner.fatal('Expected tag to close ' + blockName + ', found ' +                                // 431
                    tmplTag.type);                                                                     // 432
    }                                                                                                  // 433
  }                                                                                                    // 434
                                                                                                       // 435
  var finalPos = scanner.pos;                                                                          // 436
  scanner.pos = startPos;                                                                              // 437
  validateTag(result, scanner);                                                                        // 438
  scanner.pos = finalPos;                                                                              // 439
                                                                                                       // 440
  return result;                                                                                       // 441
};                                                                                                     // 442
                                                                                                       // 443
var isAtBlockCloseOrElse = function (scanner) {                                                        // 444
  // Detect `{{else}}` or `{{/foo}}`.                                                                  // 445
  //                                                                                                   // 446
  // We do as much work ourselves before deferring to `TemplateTag.peek`,                              // 447
  // for efficiency (we're called for every input token) and to be                                     // 448
  // less obtrusive, because `TemplateTag.peek` will throw an error if it                              // 449
  // sees `{{` followed by a malformed tag.                                                            // 450
  var rest, type;                                                                                      // 451
  return (scanner.peek() === '{' &&                                                                    // 452
          (rest = scanner.rest()).slice(0, 2) === '{{' &&                                              // 453
          /^\{\{\s*(\/|else\b)/.test(rest) &&                                                          // 454
          (type = TemplateTag.peek(scanner).type) &&                                                   // 455
          (type === 'BLOCKCLOSE' || type === 'ELSE'));                                                 // 456
};                                                                                                     // 457
                                                                                                       // 458
// Validate that `templateTag` is correctly formed and legal for its                                   // 459
// HTML position.  Use `scanner` to report errors. On success, does                                    // 460
// nothing.                                                                                            // 461
var validateTag = function (ttag, scanner) {                                                           // 462
                                                                                                       // 463
  if (ttag.type === 'INCLUSION' || ttag.type === 'BLOCKOPEN') {                                        // 464
    var args = ttag.args;                                                                              // 465
    if (ttag.path[0] === 'each' && args[1] && args[1][0] === 'PATH' &&                                 // 466
        args[1][1][0] === 'in') {                                                                      // 467
      // For slightly better error messages, we detect the each-in case                                // 468
      // here in order not to complain if the user writes `{{#each 3 in x}}`                           // 469
      // that "3 is not a function"                                                                    // 470
    } else {                                                                                           // 471
      if (args.length > 1 && args[0].length === 2 && args[0][0] !== 'PATH') {                          // 472
        // we have a positional argument that is not a PATH followed by                                // 473
        // other arguments                                                                             // 474
        scanner.fatal("First argument must be a function, to be called on " +                          // 475
                      "the rest of the arguments; found " + args[0][0]);                               // 476
      }                                                                                                // 477
    }                                                                                                  // 478
  }                                                                                                    // 479
                                                                                                       // 480
  var position = ttag.position || TEMPLATE_TAG_POSITION.ELEMENT;                                       // 481
  if (position === TEMPLATE_TAG_POSITION.IN_ATTRIBUTE) {                                               // 482
    if (ttag.type === 'DOUBLE' || ttag.type === 'ESCAPE') {                                            // 483
      return;                                                                                          // 484
    } else if (ttag.type === 'BLOCKOPEN') {                                                            // 485
      var path = ttag.path;                                                                            // 486
      var path0 = path[0];                                                                             // 487
      if (! (path.length === 1 && (path0 === 'if' ||                                                   // 488
                                   path0 === 'unless' ||                                               // 489
                                   path0 === 'with' ||                                                 // 490
                                   path0 === 'each'))) {                                               // 491
        scanner.fatal("Custom block helpers are not allowed in an HTML attribute, only built-in ones like #each and #if");
      }                                                                                                // 493
    } else {                                                                                           // 494
      scanner.fatal(ttag.type + " template tag is not allowed in an HTML attribute");                  // 495
    }                                                                                                  // 496
  } else if (position === TEMPLATE_TAG_POSITION.IN_START_TAG) {                                        // 497
    if (! (ttag.type === 'DOUBLE')) {                                                                  // 498
      scanner.fatal("Reactive HTML attributes must either have a constant name or consist of a single {{helper}} providing a dictionary of names and values.  A template tag of type " + ttag.type + " is not allowed here.");
    }                                                                                                  // 500
    if (scanner.peek() === '=') {                                                                      // 501
      scanner.fatal("Template tags are not allowed in attribute names, only in attribute values or in the form of a single {{helper}} that evaluates to a dictionary of name=value pairs.");
    }                                                                                                  // 503
  }                                                                                                    // 504
                                                                                                       // 505
};                                                                                                     // 506
                                                                                                       // 507
/////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                     //
// packages/spacebars-compiler/optimizer.js                                                            //
//                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                       //
// Optimize parts of an HTMLjs tree into raw HTML strings when they don't                              // 1
// contain template tags.                                                                              // 2
                                                                                                       // 3
var constant = function (value) {                                                                      // 4
  return function () { return value; };                                                                // 5
};                                                                                                     // 6
                                                                                                       // 7
var OPTIMIZABLE = {                                                                                    // 8
  NONE: 0,                                                                                             // 9
  PARTS: 1,                                                                                            // 10
  FULL: 2                                                                                              // 11
};                                                                                                     // 12
                                                                                                       // 13
// We can only turn content into an HTML string if it contains no template                             // 14
// tags and no "tricky" HTML tags.  If we can optimize the entire content                              // 15
// into a string, we return OPTIMIZABLE.FULL.  If the we are given an                                  // 16
// unoptimizable node, we return OPTIMIZABLE.NONE.  If we are given a tree                             // 17
// that contains an unoptimizable node somewhere, we return OPTIMIZABLE.PARTS.                         // 18
//                                                                                                     // 19
// For example, we always create SVG elements programmatically, since SVG                              // 20
// doesn't have innerHTML.  If we are given an SVG element, we return NONE.                            // 21
// However, if we are given a big tree that contains SVG somewhere, we                                 // 22
// return PARTS so that the optimizer can descend into the tree and optimize                           // 23
// other parts of it.                                                                                  // 24
var CanOptimizeVisitor = HTML.Visitor.extend();                                                        // 25
CanOptimizeVisitor.def({                                                                               // 26
  visitNull: constant(OPTIMIZABLE.FULL),                                                               // 27
  visitPrimitive: constant(OPTIMIZABLE.FULL),                                                          // 28
  visitComment: constant(OPTIMIZABLE.FULL),                                                            // 29
  visitCharRef: constant(OPTIMIZABLE.FULL),                                                            // 30
  visitRaw: constant(OPTIMIZABLE.FULL),                                                                // 31
  visitObject: constant(OPTIMIZABLE.NONE),                                                             // 32
  visitFunction: constant(OPTIMIZABLE.NONE),                                                           // 33
  visitArray: function (x) {                                                                           // 34
    for (var i = 0; i < x.length; i++)                                                                 // 35
      if (this.visit(x[i]) !== OPTIMIZABLE.FULL)                                                       // 36
        return OPTIMIZABLE.PARTS;                                                                      // 37
    return OPTIMIZABLE.FULL;                                                                           // 38
  },                                                                                                   // 39
  visitTag: function (tag) {                                                                           // 40
    var tagName = tag.tagName;                                                                         // 41
    if (tagName === 'textarea') {                                                                      // 42
      // optimizing into a TEXTAREA's RCDATA would require being a little                              // 43
      // more clever.                                                                                  // 44
      return OPTIMIZABLE.NONE;                                                                         // 45
    } else if (tagName === 'script') {                                                                 // 46
      // script tags don't work when rendered from strings                                             // 47
      return OPTIMIZABLE.NONE;                                                                         // 48
    } else if (! (HTML.isKnownElement(tagName) &&                                                      // 49
                  ! HTML.isKnownSVGElement(tagName))) {                                                // 50
      // foreign elements like SVG can't be stringified for innerHTML.                                 // 51
      return OPTIMIZABLE.NONE;                                                                         // 52
    } else if (tagName === 'table') {                                                                  // 53
      // Avoid ever producing HTML containing `<table><tr>...`, because the                            // 54
      // browser will insert a TBODY.  If we just `createElement("table")` and                         // 55
      // `createElement("tr")`, on the other hand, no TBODY is necessary                               // 56
      // (assuming IE 8+).                                                                             // 57
      return OPTIMIZABLE.NONE;                                                                         // 58
    }                                                                                                  // 59
                                                                                                       // 60
    var children = tag.children;                                                                       // 61
    for (var i = 0; i < children.length; i++)                                                          // 62
      if (this.visit(children[i]) !== OPTIMIZABLE.FULL)                                                // 63
        return OPTIMIZABLE.PARTS;                                                                      // 64
                                                                                                       // 65
    if (this.visitAttributes(tag.attrs) !== OPTIMIZABLE.FULL)                                          // 66
      return OPTIMIZABLE.PARTS;                                                                        // 67
                                                                                                       // 68
    return OPTIMIZABLE.FULL;                                                                           // 69
  },                                                                                                   // 70
  visitAttributes: function (attrs) {                                                                  // 71
    if (attrs) {                                                                                       // 72
      var isArray = HTML.isArray(attrs);                                                               // 73
      for (var i = 0; i < (isArray ? attrs.length : 1); i++) {                                         // 74
        var a = (isArray ? attrs[i] : attrs);                                                          // 75
        if ((typeof a !== 'object') || (a instanceof HTMLTools.TemplateTag))                           // 76
          return OPTIMIZABLE.PARTS;                                                                    // 77
        for (var k in a)                                                                               // 78
          if (this.visit(a[k]) !== OPTIMIZABLE.FULL)                                                   // 79
            return OPTIMIZABLE.PARTS;                                                                  // 80
      }                                                                                                // 81
    }                                                                                                  // 82
    return OPTIMIZABLE.FULL;                                                                           // 83
  }                                                                                                    // 84
});                                                                                                    // 85
                                                                                                       // 86
var getOptimizability = function (content) {                                                           // 87
  return (new CanOptimizeVisitor).visit(content);                                                      // 88
};                                                                                                     // 89
                                                                                                       // 90
var toRaw = function (x) {                                                                             // 91
  return HTML.Raw(HTML.toHTML(x));                                                                     // 92
};                                                                                                     // 93
                                                                                                       // 94
var TreeTransformer = HTML.TransformingVisitor.extend();                                               // 95
TreeTransformer.def({                                                                                  // 96
  visitAttributes: function (attrs/*, ...*/) {                                                         // 97
    // pass template tags through by default                                                           // 98
    if (attrs instanceof HTMLTools.TemplateTag)                                                        // 99
      return attrs;                                                                                    // 100
                                                                                                       // 101
    return HTML.TransformingVisitor.prototype.visitAttributes.apply(                                   // 102
      this, arguments);                                                                                // 103
  }                                                                                                    // 104
});                                                                                                    // 105
                                                                                                       // 106
// Replace parts of the HTMLjs tree that have no template tags (or                                     // 107
// tricky HTML tags) with HTML.Raw objects containing raw HTML.                                        // 108
var OptimizingVisitor = TreeTransformer.extend();                                                      // 109
OptimizingVisitor.def({                                                                                // 110
  visitNull: toRaw,                                                                                    // 111
  visitPrimitive: toRaw,                                                                               // 112
  visitComment: toRaw,                                                                                 // 113
  visitCharRef: toRaw,                                                                                 // 114
  visitArray: function (array) {                                                                       // 115
    var optimizability = getOptimizability(array);                                                     // 116
    if (optimizability === OPTIMIZABLE.FULL) {                                                         // 117
      return toRaw(array);                                                                             // 118
    } else if (optimizability === OPTIMIZABLE.PARTS) {                                                 // 119
      return TreeTransformer.prototype.visitArray.call(this, array);                                   // 120
    } else {                                                                                           // 121
      return array;                                                                                    // 122
    }                                                                                                  // 123
  },                                                                                                   // 124
  visitTag: function (tag) {                                                                           // 125
    var optimizability = getOptimizability(tag);                                                       // 126
    if (optimizability === OPTIMIZABLE.FULL) {                                                         // 127
      return toRaw(tag);                                                                               // 128
    } else if (optimizability === OPTIMIZABLE.PARTS) {                                                 // 129
      return TreeTransformer.prototype.visitTag.call(this, tag);                                       // 130
    } else {                                                                                           // 131
      return tag;                                                                                      // 132
    }                                                                                                  // 133
  },                                                                                                   // 134
  visitChildren: function (children) {                                                                 // 135
    // don't optimize the children array into a Raw object!                                            // 136
    return TreeTransformer.prototype.visitArray.call(this, children);                                  // 137
  },                                                                                                   // 138
  visitAttributes: function (attrs) {                                                                  // 139
    return attrs;                                                                                      // 140
  }                                                                                                    // 141
});                                                                                                    // 142
                                                                                                       // 143
// Combine consecutive HTML.Raws.  Remove empty ones.                                                  // 144
var RawCompactingVisitor = TreeTransformer.extend();                                                   // 145
RawCompactingVisitor.def({                                                                             // 146
  visitArray: function (array) {                                                                       // 147
    var result = [];                                                                                   // 148
    for (var i = 0; i < array.length; i++) {                                                           // 149
      var item = array[i];                                                                             // 150
      if ((item instanceof HTML.Raw) &&                                                                // 151
          ((! item.value) ||                                                                           // 152
           (result.length &&                                                                           // 153
            (result[result.length - 1] instanceof HTML.Raw)))) {                                       // 154
        // two cases: item is an empty Raw, or previous item is                                        // 155
        // a Raw as well.  In the latter case, replace the previous                                    // 156
        // Raw with a longer one that includes the new Raw.                                            // 157
        if (item.value) {                                                                              // 158
          result[result.length - 1] = HTML.Raw(                                                        // 159
            result[result.length - 1].value + item.value);                                             // 160
        }                                                                                              // 161
      } else {                                                                                         // 162
        result.push(item);                                                                             // 163
      }                                                                                                // 164
    }                                                                                                  // 165
    return result;                                                                                     // 166
  }                                                                                                    // 167
});                                                                                                    // 168
                                                                                                       // 169
// Replace pointless Raws like `HTMl.Raw('foo')` that contain no special                               // 170
// characters with simple strings.                                                                     // 171
var RawReplacingVisitor = TreeTransformer.extend();                                                    // 172
RawReplacingVisitor.def({                                                                              // 173
  visitRaw: function (raw) {                                                                           // 174
    var html = raw.value;                                                                              // 175
    if (html.indexOf('&') < 0 && html.indexOf('<') < 0) {                                              // 176
      return html;                                                                                     // 177
    } else {                                                                                           // 178
      return raw;                                                                                      // 179
    }                                                                                                  // 180
  }                                                                                                    // 181
});                                                                                                    // 182
                                                                                                       // 183
SpacebarsCompiler.optimize = function (tree) {                                                         // 184
  tree = (new OptimizingVisitor).visit(tree);                                                          // 185
  tree = (new RawCompactingVisitor).visit(tree);                                                       // 186
  tree = (new RawReplacingVisitor).visit(tree);                                                        // 187
  return tree;                                                                                         // 188
};                                                                                                     // 189
                                                                                                       // 190
/////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                     //
// packages/spacebars-compiler/react.js                                                                //
//                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                       //
// A visitor to ensure that React components included via the `{{>                                     // 1
// React}}` template defined in the react-template-helper package are                                  // 2
// the only child in their parent component. Otherwise `React.render`                                  // 3
// would eliminate all of their sibling nodes.                                                         // 4
//                                                                                                     // 5
// It's a little strange that this logic is in spacebars-compiler if                                   // 6
// it's only relevant to a specific package but there's no way to have                                 // 7
// a package hook into a build plugin.                                                                 // 8
ReactComponentSiblingForbidder = HTML.Visitor.extend();                                                // 9
ReactComponentSiblingForbidder.def({                                                                   // 10
  visitArray: function (array, parentTag) {                                                            // 11
    for (var i = 0; i < array.length; i++) {                                                           // 12
      this.visit(array[i], parentTag);                                                                 // 13
    }                                                                                                  // 14
  },                                                                                                   // 15
  visitObject: function (obj, parentTag) {                                                             // 16
    if (obj.type === "INCLUSION" && obj.path.length === 1 && obj.path[0] === "React") {                // 17
      if (!parentTag) {                                                                                // 18
        throw new Error(                                                                               // 19
          "{{> React}} must be used in a container element"                                            // 20
            + (this.sourceName ? (" in " + this.sourceName) : "")                                      // 21
               + ". Learn more at https://github.com/meteor/meteor/wiki/React-components-must-be-the-only-thing-in-their-wrapper-element");
      }                                                                                                // 23
                                                                                                       // 24
      var numSiblings = 0;                                                                             // 25
      for (var i = 0; i < parentTag.children.length; i++) {                                            // 26
        var child = parentTag.children[i];                                                             // 27
        if (child !== obj && !(typeof child === "string" && child.match(/^\s*$/))) {                   // 28
          numSiblings++;                                                                               // 29
        }                                                                                              // 30
      }                                                                                                // 31
                                                                                                       // 32
      if (numSiblings > 0) {                                                                           // 33
        throw new Error(                                                                               // 34
          "{{> React}} must be used as the only child in a container element"                          // 35
            + (this.sourceName ? (" in " + this.sourceName) : "")                                      // 36
               + ". Learn more at https://github.com/meteor/meteor/wiki/React-components-must-be-the-only-thing-in-their-wrapper-element");
      }                                                                                                // 38
    }                                                                                                  // 39
  },                                                                                                   // 40
  visitTag: function (tag) {                                                                           // 41
    this.visitArray(tag.children, tag /*parentTag*/);                                                  // 42
  }                                                                                                    // 43
});                                                                                                    // 44
                                                                                                       // 45
/////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                     //
// packages/spacebars-compiler/codegen.js                                                              //
//                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                       //
// ============================================================                                        // 1
// Code-generation of template tags                                                                    // 2
                                                                                                       // 3
// The `CodeGen` class currently has no instance state, but in theory                                  // 4
// it could be useful to track per-function state, like whether we                                     // 5
// need to emit `var self = this` or not.                                                              // 6
var CodeGen = SpacebarsCompiler.CodeGen = function () {};                                              // 7
                                                                                                       // 8
var builtInBlockHelpers = SpacebarsCompiler._builtInBlockHelpers = {                                   // 9
  'if': 'Blaze.If',                                                                                    // 10
  'unless': 'Blaze.Unless',                                                                            // 11
  'with': 'Spacebars.With',                                                                            // 12
  'each': 'Blaze.Each',                                                                                // 13
  'let': 'Blaze.Let'                                                                                   // 14
};                                                                                                     // 15
                                                                                                       // 16
                                                                                                       // 17
// Mapping of "macros" which, when preceded by `Template.`, expand                                     // 18
// to special code rather than following the lookup rules for dotted                                   // 19
// symbols.                                                                                            // 20
var builtInTemplateMacros = {                                                                          // 21
  // `view` is a local variable defined in the generated render                                        // 22
  // function for the template in which `Template.contentBlock` or                                     // 23
  // `Template.elseBlock` is invoked.                                                                  // 24
  'contentBlock': 'view.templateContentBlock',                                                         // 25
  'elseBlock': 'view.templateElseBlock',                                                               // 26
                                                                                                       // 27
  // Confusingly, this makes `{{> Template.dynamic}}` an alias                                         // 28
  // for `{{> __dynamic}}`, where "__dynamic" is the template that                                     // 29
  // implements the dynamic template feature.                                                          // 30
  'dynamic': 'Template.__dynamic',                                                                     // 31
                                                                                                       // 32
  'subscriptionsReady': 'view.templateInstance().subscriptionsReady()'                                 // 33
};                                                                                                     // 34
                                                                                                       // 35
var additionalReservedNames = ["body", "toString", "instance",  "constructor",                         // 36
  "toString", "toLocaleString", "valueOf", "hasOwnProperty", "isPrototypeOf",                          // 37
  "propertyIsEnumerable", "__defineGetter__", "__lookupGetter__",                                      // 38
  "__defineSetter__", "__lookupSetter__", "__proto__", "dynamic",                                      // 39
  "registerHelper", "currentData", "parentData"];                                                      // 40
                                                                                                       // 41
// A "reserved name" can't be used as a <template> name.  This                                         // 42
// function is used by the template file scanner.                                                      // 43
//                                                                                                     // 44
// Note that the runtime imposes additional restrictions, for example                                  // 45
// banning the name "body" and names of built-in object properties                                     // 46
// like "toString".                                                                                    // 47
SpacebarsCompiler.isReservedName = function (name) {                                                   // 48
  return builtInBlockHelpers.hasOwnProperty(name) ||                                                   // 49
    builtInTemplateMacros.hasOwnProperty(name) ||                                                      // 50
    _.indexOf(additionalReservedNames, name) > -1;                                                     // 51
};                                                                                                     // 52
                                                                                                       // 53
var makeObjectLiteral = function (obj) {                                                               // 54
  var parts = [];                                                                                      // 55
  for (var k in obj)                                                                                   // 56
    parts.push(BlazeTools.toObjectLiteralKey(k) + ': ' + obj[k]);                                      // 57
  return '{' + parts.join(', ') + '}';                                                                 // 58
};                                                                                                     // 59
                                                                                                       // 60
_.extend(CodeGen.prototype, {                                                                          // 61
  codeGenTemplateTag: function (tag) {                                                                 // 62
    var self = this;                                                                                   // 63
    if (tag.position === HTMLTools.TEMPLATE_TAG_POSITION.IN_START_TAG) {                               // 64
      // Special dynamic attributes: `<div {{attrs}}>...`                                              // 65
      // only `tag.type === 'DOUBLE'` allowed (by earlier validation)                                  // 66
      return BlazeTools.EmitCode('function () { return ' +                                             // 67
          self.codeGenMustache(tag.path, tag.args, 'attrMustache')                                     // 68
          + '; }');                                                                                    // 69
    } else {                                                                                           // 70
      if (tag.type === 'DOUBLE' || tag.type === 'TRIPLE') {                                            // 71
        var code = self.codeGenMustache(tag.path, tag.args);                                           // 72
        if (tag.type === 'TRIPLE') {                                                                   // 73
          code = 'Spacebars.makeRaw(' + code + ')';                                                    // 74
        }                                                                                              // 75
        if (tag.position !== HTMLTools.TEMPLATE_TAG_POSITION.IN_ATTRIBUTE) {                           // 76
          // Reactive attributes are already wrapped in a function,                                    // 77
          // and there's no fine-grained reactivity.                                                   // 78
          // Anywhere else, we need to create a View.                                                  // 79
          code = 'Blaze.View(' +                                                                       // 80
            BlazeTools.toJSLiteral('lookup:' + tag.path.join('.')) + ', ' +                            // 81
            'function () { return ' + code + '; })';                                                   // 82
        }                                                                                              // 83
        return BlazeTools.EmitCode(code);                                                              // 84
      } else if (tag.type === 'INCLUSION' || tag.type === 'BLOCKOPEN') {                               // 85
        var path = tag.path;                                                                           // 86
        var args = tag.args;                                                                           // 87
                                                                                                       // 88
        if (tag.type === 'BLOCKOPEN' &&                                                                // 89
            builtInBlockHelpers.hasOwnProperty(path[0])) {                                             // 90
          // if, unless, with, each.                                                                   // 91
          //                                                                                           // 92
          // If someone tries to do `{{> if}}`, we don't                                               // 93
          // get here, but an error is thrown when we try to codegen the path.                         // 94
                                                                                                       // 95
          // Note: If we caught these errors earlier, while scanning, we'd be able to                  // 96
          // provide nice line numbers.                                                                // 97
          if (path.length > 1)                                                                         // 98
            throw new Error("Unexpected dotted path beginning with " + path[0]);                       // 99
          if (! args.length)                                                                           // 100
            throw new Error("#" + path[0] + " requires an argument");                                  // 101
                                                                                                       // 102
          var dataCode = null;                                                                         // 103
          // #each has a special treatment as it features two different forms:                         // 104
          // - {{#each people}}                                                                        // 105
          // - {{#each person in people}}                                                              // 106
          if (path[0] === 'each' && args.length >= 2 && args[1][0] === 'PATH' &&                       // 107
              args[1][1].length && args[1][1][0] === 'in') {                                           // 108
            // minimum conditions are met for each-in.  now validate this                              // 109
            // isn't some weird case.                                                                  // 110
            var eachUsage = "Use either {{#each items}} or " +                                         // 111
                  "{{#each item in items}} form of #each.";                                            // 112
            var inArg = args[1];                                                                       // 113
            if (! (args.length >= 3 && inArg[1].length === 1)) {                                       // 114
              // we don't have at least 3 space-separated parts after #each, or                        // 115
              // inArg doesn't look like ['PATH',['in']]                                               // 116
              throw new Error("Malformed #each. " + eachUsage);                                        // 117
            }                                                                                          // 118
            // split out the variable name and sequence arguments                                      // 119
            var variableArg = args[0];                                                                 // 120
            if (! (variableArg[0] === "PATH" && variableArg[1].length === 1 &&                         // 121
                   variableArg[1][0].replace(/\./g, ''))) {                                            // 122
              throw new Error("Bad variable name in #each");                                           // 123
            }                                                                                          // 124
            var variable = variableArg[1][0];                                                          // 125
            dataCode = 'function () { return { _sequence: ' +                                          // 126
              self.codeGenInclusionData(args.slice(2)) +                                               // 127
              ', _variable: ' + BlazeTools.toJSLiteral(variable) + ' }; }';                            // 128
          } else if (path[0] === 'let') {                                                              // 129
            var dataProps = {};                                                                        // 130
            _.each(args, function (arg) {                                                              // 131
              if (arg.length !== 3) {                                                                  // 132
                // not a keyword arg (x=y)                                                             // 133
                throw new Error("Incorrect form of #let");                                             // 134
              }                                                                                        // 135
              var argKey = arg[2];                                                                     // 136
              dataProps[argKey] =                                                                      // 137
                'function () { return Spacebars.call(' +                                               // 138
                self.codeGenArgValue(arg) + '); }';                                                    // 139
            });                                                                                        // 140
            dataCode = makeObjectLiteral(dataProps);                                                   // 141
          }                                                                                            // 142
                                                                                                       // 143
          if (! dataCode) {                                                                            // 144
            // `args` must exist (tag.args.length > 0)                                                 // 145
            dataCode = self.codeGenInclusionDataFunc(args) || 'null';                                  // 146
          }                                                                                            // 147
                                                                                                       // 148
          // `content` must exist                                                                      // 149
          var contentBlock = (('content' in tag) ?                                                     // 150
                              self.codeGenBlock(tag.content) : null);                                  // 151
          // `elseContent` may not exist                                                               // 152
          var elseContentBlock = (('elseContent' in tag) ?                                             // 153
                                  self.codeGenBlock(tag.elseContent) : null);                          // 154
                                                                                                       // 155
          var callArgs = [dataCode, contentBlock];                                                     // 156
          if (elseContentBlock)                                                                        // 157
            callArgs.push(elseContentBlock);                                                           // 158
                                                                                                       // 159
          return BlazeTools.EmitCode(                                                                  // 160
            builtInBlockHelpers[path[0]] + '(' + callArgs.join(', ') + ')');                           // 161
                                                                                                       // 162
        } else {                                                                                       // 163
          var compCode = self.codeGenPath(path, {lookupTemplate: true});                               // 164
          if (path.length > 1) {                                                                       // 165
            // capture reactivity                                                                      // 166
            compCode = 'function () { return Spacebars.call(' + compCode +                             // 167
              '); }';                                                                                  // 168
          }                                                                                            // 169
                                                                                                       // 170
          var dataCode = self.codeGenInclusionDataFunc(tag.args);                                      // 171
          var content = (('content' in tag) ?                                                          // 172
                         self.codeGenBlock(tag.content) : null);                                       // 173
          var elseContent = (('elseContent' in tag) ?                                                  // 174
                             self.codeGenBlock(tag.elseContent) : null);                               // 175
                                                                                                       // 176
          var includeArgs = [compCode];                                                                // 177
          if (content) {                                                                               // 178
            includeArgs.push(content);                                                                 // 179
            if (elseContent)                                                                           // 180
              includeArgs.push(elseContent);                                                           // 181
          }                                                                                            // 182
                                                                                                       // 183
          var includeCode =                                                                            // 184
                'Spacebars.include(' + includeArgs.join(', ') + ')';                                   // 185
                                                                                                       // 186
          // calling convention compat -- set the data context around the                              // 187
          // entire inclusion, so that if the name of the inclusion is                                 // 188
          // a helper function, it gets the data context in `this`.                                    // 189
          // This makes for a pretty confusing calling convention --                                   // 190
          // In `{{#foo bar}}`, `foo` is evaluated in the context of `bar`                             // 191
          // -- but it's what we shipped for 0.8.0.  The rationale is that                             // 192
          // `{{#foo bar}}` is sugar for `{{#with bar}}{{#foo}}...`.                                   // 193
          if (dataCode) {                                                                              // 194
            includeCode =                                                                              // 195
              'Blaze._TemplateWith(' + dataCode + ', function () { return ' +                          // 196
              includeCode + '; })';                                                                    // 197
          }                                                                                            // 198
                                                                                                       // 199
          // XXX BACK COMPAT - UI is the old name, Template is the new                                 // 200
          if ((path[0] === 'UI' || path[0] === 'Template') &&                                          // 201
              (path[1] === 'contentBlock' || path[1] === 'elseBlock')) {                               // 202
            // Call contentBlock and elseBlock in the appropriate scope                                // 203
            includeCode = 'Blaze._InOuterTemplateScope(view, function () { return '                    // 204
              + includeCode + '; })';                                                                  // 205
          }                                                                                            // 206
                                                                                                       // 207
          return BlazeTools.EmitCode(includeCode);                                                     // 208
        }                                                                                              // 209
      } else if (tag.type === 'ESCAPE') {                                                              // 210
        return tag.value;                                                                              // 211
      } else {                                                                                         // 212
        // Can't get here; TemplateTag validation should catch any                                     // 213
        // inappropriate tag types that might come out of the parser.                                  // 214
        throw new Error("Unexpected template tag type: " + tag.type);                                  // 215
      }                                                                                                // 216
    }                                                                                                  // 217
  },                                                                                                   // 218
                                                                                                       // 219
  // `path` is an array of at least one string.                                                        // 220
  //                                                                                                   // 221
  // If `path.length > 1`, the generated code may be reactive                                          // 222
  // (i.e. it may invalidate the current computation).                                                 // 223
  //                                                                                                   // 224
  // No code is generated to call the result if it's a function.                                       // 225
  //                                                                                                   // 226
  // Options:                                                                                          // 227
  //                                                                                                   // 228
  // - lookupTemplate {Boolean} If true, generated code also looks in                                  // 229
  //   the list of templates. (After helpers, before data context).                                    // 230
  //   Used when generating code for `{{> foo}}` or `{{#foo}}`. Only                                   // 231
  //   used for non-dotted paths.                                                                      // 232
  codeGenPath: function (path, opts) {                                                                 // 233
    if (builtInBlockHelpers.hasOwnProperty(path[0]))                                                   // 234
      throw new Error("Can't use the built-in '" + path[0] + "' here");                                // 235
    // Let `{{#if Template.contentBlock}}` check whether this template was                             // 236
    // invoked via inclusion or as a block helper, in addition to supporting                           // 237
    // `{{> Template.contentBlock}}`.                                                                  // 238
    // XXX BACK COMPAT - UI is the old name, Template is the new                                       // 239
    if (path.length >= 2 &&                                                                            // 240
        (path[0] === 'UI' || path[0] === 'Template')                                                   // 241
        && builtInTemplateMacros.hasOwnProperty(path[1])) {                                            // 242
      if (path.length > 2)                                                                             // 243
        throw new Error("Unexpected dotted path beginning with " +                                     // 244
                        path[0] + '.' + path[1]);                                                      // 245
      return builtInTemplateMacros[path[1]];                                                           // 246
    }                                                                                                  // 247
                                                                                                       // 248
    var firstPathItem = BlazeTools.toJSLiteral(path[0]);                                               // 249
    var lookupMethod = 'lookup';                                                                       // 250
    if (opts && opts.lookupTemplate && path.length === 1)                                              // 251
      lookupMethod = 'lookupTemplate';                                                                 // 252
    var code = 'view.' + lookupMethod + '(' + firstPathItem + ')';                                     // 253
                                                                                                       // 254
    if (path.length > 1) {                                                                             // 255
      code = 'Spacebars.dot(' + code + ', ' +                                                          // 256
        _.map(path.slice(1), BlazeTools.toJSLiteral).join(', ') + ')';                                 // 257
    }                                                                                                  // 258
                                                                                                       // 259
    return code;                                                                                       // 260
  },                                                                                                   // 261
                                                                                                       // 262
  // Generates code for an `[argType, argValue]` argument spec,                                        // 263
  // ignoring the third element (keyword argument name) if present.                                    // 264
  //                                                                                                   // 265
  // The resulting code may be reactive (in the case of a PATH of                                      // 266
  // more than one element) and is not wrapped in a closure.                                           // 267
  codeGenArgValue: function (arg) {                                                                    // 268
    var self = this;                                                                                   // 269
                                                                                                       // 270
    var argType = arg[0];                                                                              // 271
    var argValue = arg[1];                                                                             // 272
                                                                                                       // 273
    var argCode;                                                                                       // 274
    switch (argType) {                                                                                 // 275
    case 'STRING':                                                                                     // 276
    case 'NUMBER':                                                                                     // 277
    case 'BOOLEAN':                                                                                    // 278
    case 'NULL':                                                                                       // 279
      argCode = BlazeTools.toJSLiteral(argValue);                                                      // 280
      break;                                                                                           // 281
    case 'PATH':                                                                                       // 282
      argCode = self.codeGenPath(argValue);                                                            // 283
      break;                                                                                           // 284
    case 'EXPR':                                                                                       // 285
      // The format of EXPR is ['EXPR', { type: 'EXPR', path: [...], args: { ... } }]                  // 286
      argCode = self.codeGenMustache(argValue.path, argValue.args, 'dataMustache');                    // 287
      break;                                                                                           // 288
    default:                                                                                           // 289
      // can't get here                                                                                // 290
      throw new Error("Unexpected arg type: " + argType);                                              // 291
    }                                                                                                  // 292
                                                                                                       // 293
    return argCode;                                                                                    // 294
  },                                                                                                   // 295
                                                                                                       // 296
  // Generates a call to `Spacebars.fooMustache` on evaluated arguments.                               // 297
  // The resulting code has no function literals and must be wrapped in                                // 298
  // one for fine-grained reactivity.                                                                  // 299
  codeGenMustache: function (path, args, mustacheType) {                                               // 300
    var self = this;                                                                                   // 301
                                                                                                       // 302
    var nameCode = self.codeGenPath(path);                                                             // 303
    var argCode = self.codeGenMustacheArgs(args);                                                      // 304
    var mustache = (mustacheType || 'mustache');                                                       // 305
                                                                                                       // 306
    return 'Spacebars.' + mustache + '(' + nameCode +                                                  // 307
      (argCode ? ', ' + argCode.join(', ') : '') + ')';                                                // 308
  },                                                                                                   // 309
                                                                                                       // 310
  // returns: array of source strings, or null if no                                                   // 311
  // args at all.                                                                                      // 312
  codeGenMustacheArgs: function (tagArgs) {                                                            // 313
    var self = this;                                                                                   // 314
                                                                                                       // 315
    var kwArgs = null; // source -> source                                                             // 316
    var args = null; // [source]                                                                       // 317
                                                                                                       // 318
    // tagArgs may be null                                                                             // 319
    _.each(tagArgs, function (arg) {                                                                   // 320
      var argCode = self.codeGenArgValue(arg);                                                         // 321
                                                                                                       // 322
      if (arg.length > 2) {                                                                            // 323
        // keyword argument (represented as [type, value, name])                                       // 324
        kwArgs = (kwArgs || {});                                                                       // 325
        kwArgs[arg[2]] = argCode;                                                                      // 326
      } else {                                                                                         // 327
        // positional argument                                                                         // 328
        args = (args || []);                                                                           // 329
        args.push(argCode);                                                                            // 330
      }                                                                                                // 331
    });                                                                                                // 332
                                                                                                       // 333
    // put kwArgs in options dictionary at end of args                                                 // 334
    if (kwArgs) {                                                                                      // 335
      args = (args || []);                                                                             // 336
      args.push('Spacebars.kw(' + makeObjectLiteral(kwArgs) + ')');                                    // 337
    }                                                                                                  // 338
                                                                                                       // 339
    return args;                                                                                       // 340
  },                                                                                                   // 341
                                                                                                       // 342
  codeGenBlock: function (content) {                                                                   // 343
    return SpacebarsCompiler.codeGen(content);                                                         // 344
  },                                                                                                   // 345
                                                                                                       // 346
  codeGenInclusionData: function (args) {                                                              // 347
    var self = this;                                                                                   // 348
                                                                                                       // 349
    if (! args.length) {                                                                               // 350
      // e.g. `{{#foo}}`                                                                               // 351
      return null;                                                                                     // 352
    } else if (args[0].length === 3) {                                                                 // 353
      // keyword arguments only, e.g. `{{> point x=1 y=2}}`                                            // 354
      var dataProps = {};                                                                              // 355
      _.each(args, function (arg) {                                                                    // 356
        var argKey = arg[2];                                                                           // 357
        dataProps[argKey] = 'Spacebars.call(' + self.codeGenArgValue(arg) + ')';                       // 358
      });                                                                                              // 359
      return makeObjectLiteral(dataProps);                                                             // 360
    } else if (args[0][0] !== 'PATH') {                                                                // 361
      // literal first argument, e.g. `{{> foo "blah"}}`                                               // 362
      //                                                                                               // 363
      // tag validation has confirmed, in this case, that there is only                                // 364
      // one argument (`args.length === 1`)                                                            // 365
      return self.codeGenArgValue(args[0]);                                                            // 366
    } else if (args.length === 1) {                                                                    // 367
      // one argument, must be a PATH                                                                  // 368
      return 'Spacebars.call(' + self.codeGenPath(args[0][1]) + ')';                                   // 369
    } else {                                                                                           // 370
      // Multiple positional arguments; treat them as a nested                                         // 371
      // "data mustache"                                                                               // 372
      return self.codeGenMustache(args[0][1], args.slice(1),                                           // 373
                                  'dataMustache');                                                     // 374
    }                                                                                                  // 375
                                                                                                       // 376
  },                                                                                                   // 377
                                                                                                       // 378
  codeGenInclusionDataFunc: function (args) {                                                          // 379
    var self = this;                                                                                   // 380
    var dataCode = self.codeGenInclusionData(args);                                                    // 381
    if (dataCode) {                                                                                    // 382
      return 'function () { return ' + dataCode + '; }';                                               // 383
    } else {                                                                                           // 384
      return null;                                                                                     // 385
    }                                                                                                  // 386
  }                                                                                                    // 387
                                                                                                       // 388
});                                                                                                    // 389
                                                                                                       // 390
/////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                     //
// packages/spacebars-compiler/compiler.js                                                             //
//                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                       //
                                                                                                       // 1
SpacebarsCompiler.parse = function (input) {                                                           // 2
                                                                                                       // 3
  var tree = HTMLTools.parseFragment(                                                                  // 4
    input,                                                                                             // 5
    { getTemplateTag: TemplateTag.parseCompleteTag });                                                 // 6
                                                                                                       // 7
  return tree;                                                                                         // 8
};                                                                                                     // 9
                                                                                                       // 10
SpacebarsCompiler.compile = function (input, options) {                                                // 11
  var tree = SpacebarsCompiler.parse(input);                                                           // 12
  return SpacebarsCompiler.codeGen(tree, options);                                                     // 13
};                                                                                                     // 14
                                                                                                       // 15
SpacebarsCompiler._TemplateTagReplacer = HTML.TransformingVisitor.extend();                            // 16
SpacebarsCompiler._TemplateTagReplacer.def({                                                           // 17
  visitObject: function (x) {                                                                          // 18
    if (x instanceof HTMLTools.TemplateTag) {                                                          // 19
                                                                                                       // 20
      // Make sure all TemplateTags in attributes have the right                                       // 21
      // `.position` set on them.  This is a bit of a hack                                             // 22
      // (we shouldn't be mutating that here), but it allows                                           // 23
      // cleaner codegen of "synthetic" attributes like TEXTAREA's                                     // 24
      // "value", where the template tags were originally not                                          // 25
      // in an attribute.                                                                              // 26
      if (this.inAttributeValue)                                                                       // 27
        x.position = HTMLTools.TEMPLATE_TAG_POSITION.IN_ATTRIBUTE;                                     // 28
                                                                                                       // 29
      return this.codegen.codeGenTemplateTag(x);                                                       // 30
    }                                                                                                  // 31
                                                                                                       // 32
    return HTML.TransformingVisitor.prototype.visitObject.call(this, x);                               // 33
  },                                                                                                   // 34
  visitAttributes: function (attrs) {                                                                  // 35
    if (attrs instanceof HTMLTools.TemplateTag)                                                        // 36
      return this.codegen.codeGenTemplateTag(attrs);                                                   // 37
                                                                                                       // 38
    // call super (e.g. for case where `attrs` is an array)                                            // 39
    return HTML.TransformingVisitor.prototype.visitAttributes.call(this, attrs);                       // 40
  },                                                                                                   // 41
  visitAttribute: function (name, value, tag) {                                                        // 42
    this.inAttributeValue = true;                                                                      // 43
    var result = this.visit(value);                                                                    // 44
    this.inAttributeValue = false;                                                                     // 45
                                                                                                       // 46
    if (result !== value) {                                                                            // 47
      // some template tags must have been replaced, because otherwise                                 // 48
      // we try to keep things `===` when transforming.  Wrap the code                                 // 49
      // in a function as per the rules.  You can't have                                               // 50
      // `{id: Blaze.View(...)}` as an attributes dict because the View                                // 51
      // would be rendered more than once; you need to wrap it in a function                           // 52
      // so that it's a different View each time.                                                      // 53
      return BlazeTools.EmitCode(this.codegen.codeGenBlock(result));                                   // 54
    }                                                                                                  // 55
    return result;                                                                                     // 56
  }                                                                                                    // 57
});                                                                                                    // 58
                                                                                                       // 59
SpacebarsCompiler.codeGen = function (parseTree, options) {                                            // 60
  // is this a template, rather than a block passed to                                                 // 61
  // a block helper, say                                                                               // 62
  var isTemplate = (options && options.isTemplate);                                                    // 63
  var isBody = (options && options.isBody);                                                            // 64
  var sourceName = (options && options.sourceName);                                                    // 65
                                                                                                       // 66
  var tree = parseTree;                                                                                // 67
                                                                                                       // 68
  // The flags `isTemplate` and `isBody` are kind of a hack.                                           // 69
  if (isTemplate || isBody) {                                                                          // 70
    // optimizing fragments would require being smarter about whether we are                           // 71
    // in a TEXTAREA, say.                                                                             // 72
    tree = SpacebarsCompiler.optimize(tree);                                                           // 73
  }                                                                                                    // 74
                                                                                                       // 75
  // throws an error if using `{{> React}}` with siblings                                              // 76
  new ReactComponentSiblingForbidder({sourceName: sourceName})                                         // 77
    .visit(tree);                                                                                      // 78
                                                                                                       // 79
  var codegen = new SpacebarsCompiler.CodeGen;                                                         // 80
  tree = (new SpacebarsCompiler._TemplateTagReplacer(                                                  // 81
    {codegen: codegen})).visit(tree);                                                                  // 82
                                                                                                       // 83
  var code = '(function () { ';                                                                        // 84
  if (isTemplate || isBody) {                                                                          // 85
    code += 'var view = this; ';                                                                       // 86
  }                                                                                                    // 87
  code += 'return ';                                                                                   // 88
  code += BlazeTools.toJS(tree);                                                                       // 89
  code += '; })';                                                                                      // 90
                                                                                                       // 91
  code = SpacebarsCompiler._beautify(code);                                                            // 92
                                                                                                       // 93
  return code;                                                                                         // 94
};                                                                                                     // 95
                                                                                                       // 96
SpacebarsCompiler._beautify = function (code) {                                                        // 97
  if (Package.minifiers && Package.minifiers.UglifyJSMinify) {                                         // 98
    var result = Package.minifiers.UglifyJSMinify(                                                     // 99
      code,                                                                                            // 100
      { fromString: true,                                                                              // 101
        mangle: false,                                                                                 // 102
        compress: false,                                                                               // 103
        output: { beautify: true,                                                                      // 104
                  indent_level: 2,                                                                     // 105
                  width: 80 } });                                                                      // 106
    var output = result.code;                                                                          // 107
    // Uglify interprets our expression as a statement and may add a semicolon.                        // 108
    // Strip trailing semicolon.                                                                       // 109
    output = output.replace(/;$/, '');                                                                 // 110
    return output;                                                                                     // 111
  } else {                                                                                             // 112
    // don't actually beautify; no UglifyJS                                                            // 113
    return code;                                                                                       // 114
  }                                                                                                    // 115
};                                                                                                     // 116
                                                                                                       // 117
/////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
Package['spacebars-compiler'] = {
  SpacebarsCompiler: SpacebarsCompiler
};

})();



