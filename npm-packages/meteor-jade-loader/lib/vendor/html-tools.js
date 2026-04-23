(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var HTML = Package.htmljs.HTML;

/* Package-scope variables */
var HTMLTools, Scanner, makeRegexMatcher, getCharacterReference, getComment, getDoctype, getHTMLToken, getTagToken, TEMPLATE_TAG_POSITION, isLookingAtEndTag, codePointToString, getContent, getRCData;

(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// packages/html-tools/utils.js                                                                                //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                               //
                                                                                                               // 1
HTMLTools = {};                                                                                                // 2
HTMLTools.Parse = {};                                                                                          // 3
                                                                                                               // 4
var asciiLowerCase = HTMLTools.asciiLowerCase = function (str) {                                               // 5
  return str.replace(/[A-Z]/g, function (c) {                                                                  // 6
    return String.fromCharCode(c.charCodeAt(0) + 32);                                                          // 7
  });                                                                                                          // 8
};                                                                                                             // 9
                                                                                                               // 10
var svgCamelCaseAttributes = 'attributeName attributeType baseFrequency baseProfile calcMode clipPathUnits contentScriptType contentStyleType diffuseConstant edgeMode externalResourcesRequired filterRes filterUnits glyphRef glyphRef gradientTransform gradientTransform gradientUnits gradientUnits kernelMatrix kernelUnitLength kernelUnitLength kernelUnitLength keyPoints keySplines keyTimes lengthAdjust limitingConeAngle markerHeight markerUnits markerWidth maskContentUnits maskUnits numOctaves pathLength patternContentUnits patternTransform patternUnits pointsAtX pointsAtY pointsAtZ preserveAlpha preserveAspectRatio primitiveUnits refX refY repeatCount repeatDur requiredExtensions requiredFeatures specularConstant specularExponent specularExponent spreadMethod spreadMethod startOffset stdDeviation stitchTiles surfaceScale surfaceScale systemLanguage tableValues targetX targetY textLength textLength viewBox viewTarget xChannelSelector yChannelSelector zoomAndPan'.split(' ');
                                                                                                               // 12
var properAttributeCaseMap = (function (map) {                                                                 // 13
  for (var i = 0; i < svgCamelCaseAttributes.length; i++) {                                                    // 14
    var a = svgCamelCaseAttributes[i];                                                                         // 15
    map[asciiLowerCase(a)] = a;                                                                                // 16
  }                                                                                                            // 17
  return map;                                                                                                  // 18
})({});                                                                                                        // 19
                                                                                                               // 20
var properTagCaseMap = (function (map) {                                                                       // 21
  var knownElements = HTML.knownElementNames;                                                                  // 22
  for (var i = 0; i < knownElements.length; i++) {                                                             // 23
    var a = knownElements[i];                                                                                  // 24
    map[asciiLowerCase(a)] = a;                                                                                // 25
  }                                                                                                            // 26
  return map;                                                                                                  // 27
})({});                                                                                                        // 28
                                                                                                               // 29
// Take a tag name in any case and make it the proper case for HTML.                                           // 30
//                                                                                                             // 31
// Modern browsers let you embed SVG in HTML, but SVG elements are special                                     // 32
// in that they have a case-sensitive DOM API (nodeName, getAttribute,                                         // 33
// setAttribute).  For example, it has to be `setAttribute("viewBox")`,                                        // 34
// not `"viewbox"`.  However, the browser's HTML parser is NOT case sensitive                                  // 35
// and will fix the case for you, so if you write `<svg viewbox="...">`                                        // 36
// you actually get a `"viewBox"` attribute.  Any HTML-parsing toolchain                                       // 37
// must do the same.                                                                                           // 38
HTMLTools.properCaseTagName = function (name) {                                                                // 39
  var lowered = asciiLowerCase(name);                                                                          // 40
  return properTagCaseMap.hasOwnProperty(lowered) ?                                                            // 41
    properTagCaseMap[lowered] : lowered;                                                                       // 42
};                                                                                                             // 43
                                                                                                               // 44
// See docs for properCaseTagName.                                                                             // 45
HTMLTools.properCaseAttributeName = function (name) {                                                          // 46
  var lowered = asciiLowerCase(name);                                                                          // 47
  return properAttributeCaseMap.hasOwnProperty(lowered) ?                                                      // 48
    properAttributeCaseMap[lowered] : lowered;                                                                 // 49
};                                                                                                             // 50
                                                                                                               // 51
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// packages/html-tools/scanner.js                                                                              //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                               //
// This is a Scanner class suitable for any parser/lexer/tokenizer.                                            // 1
//                                                                                                             // 2
// A Scanner has an immutable source document (string) `input` and a current                                   // 3
// position `pos`, an index into the string, which can be set at will.                                         // 4
//                                                                                                             // 5
// * `new Scanner(input)` - constructs a Scanner with source string `input`                                    // 6
// * `scanner.rest()` - returns the rest of the input after `pos`                                              // 7
// * `scanner.peek()` - returns the character at `pos`                                                         // 8
// * `scanner.isEOF()` - true if `pos` is at or beyond the end of `input`                                      // 9
// * `scanner.fatal(msg)` - throw an error indicating a problem at `pos`                                       // 10
                                                                                                               // 11
Scanner = HTMLTools.Scanner = function (input) {                                                               // 12
  this.input = input; // public, read-only                                                                     // 13
  this.pos = 0; // public, read-write                                                                          // 14
};                                                                                                             // 15
                                                                                                               // 16
Scanner.prototype.rest = function () {                                                                         // 17
  // Slicing a string is O(1) in modern JavaScript VMs (including old IE).                                     // 18
  return this.input.slice(this.pos);                                                                           // 19
};                                                                                                             // 20
                                                                                                               // 21
Scanner.prototype.isEOF = function () {                                                                        // 22
  return this.pos >= this.input.length;                                                                        // 23
};                                                                                                             // 24
                                                                                                               // 25
Scanner.prototype.fatal = function (msg) {                                                                     // 26
  // despite this default, you should always provide a message!                                                // 27
  msg = (msg || "Parse error");                                                                                // 28
                                                                                                               // 29
  var CONTEXT_AMOUNT = 20;                                                                                     // 30
                                                                                                               // 31
  var input = this.input;                                                                                      // 32
  var pos = this.pos;                                                                                          // 33
  var pastInput = input.substring(pos - CONTEXT_AMOUNT - 1, pos);                                              // 34
  if (pastInput.length > CONTEXT_AMOUNT)                                                                       // 35
    pastInput = '...' + pastInput.substring(-CONTEXT_AMOUNT);                                                  // 36
                                                                                                               // 37
  var upcomingInput = input.substring(pos, pos + CONTEXT_AMOUNT + 1);                                          // 38
  if (upcomingInput.length > CONTEXT_AMOUNT)                                                                   // 39
    upcomingInput = upcomingInput.substring(0, CONTEXT_AMOUNT) + '...';                                        // 40
                                                                                                               // 41
  var positionDisplay = ((pastInput + upcomingInput).replace(/\n/g, ' ') + '\n' +                              // 42
                         (new Array(pastInput.length + 1).join(' ')) + "^");                                   // 43
                                                                                                               // 44
  var e = new Error(msg + "\n" + positionDisplay);                                                             // 45
                                                                                                               // 46
  e.offset = pos;                                                                                              // 47
  var allPastInput = input.substring(0, pos);                                                                  // 48
  e.line = (1 + (allPastInput.match(/\n/g) || []).length);                                                     // 49
  e.col = (1 + pos - allPastInput.lastIndexOf('\n'));                                                          // 50
  e.scanner = this;                                                                                            // 51
                                                                                                               // 52
  throw e;                                                                                                     // 53
};                                                                                                             // 54
                                                                                                               // 55
// Peek at the next character.                                                                                 // 56
//                                                                                                             // 57
// If `isEOF`, returns an empty string.                                                                        // 58
Scanner.prototype.peek = function () {                                                                         // 59
  return this.input.charAt(this.pos);                                                                          // 60
};                                                                                                             // 61
                                                                                                               // 62
// Constructs a `getFoo` function where `foo` is specified with a regex.                                       // 63
// The regex should start with `^`.  The constructed function will return                                      // 64
// match group 1, if it exists and matches a non-empty string, or else                                         // 65
// the entire matched string (or null if there is no match).                                                   // 66
//                                                                                                             // 67
// A `getFoo` function tries to match and consume a foo.  If it succeeds,                                      // 68
// the current position of the scanner is advanced.  If it fails, the                                          // 69
// current position is not advanced and a falsy value (typically null)                                         // 70
// is returned.                                                                                                // 71
makeRegexMatcher = function (regex) {                                                                          // 72
  return function (scanner) {                                                                                  // 73
    var match = regex.exec(scanner.rest());                                                                    // 74
                                                                                                               // 75
    if (! match)                                                                                               // 76
      return null;                                                                                             // 77
                                                                                                               // 78
    scanner.pos += match[0].length;                                                                            // 79
    return match[1] || match[0];                                                                               // 80
  };                                                                                                           // 81
};                                                                                                             // 82
                                                                                                               // 83
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// packages/html-tools/charref.js                                                                              //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                               //
                                                                                                               // 1
// http://www.whatwg.org/specs/web-apps/current-work/multipage/entities.json                                   // 2
                                                                                                               // 3
                                                                                                               // 4
// Note that some entities don't have a final semicolon!  These are used to                                    // 5
// make `&lt` (for example) with no semicolon a parse error but `&abcde` not.                                  // 6
                                                                                                               // 7
var ENTITIES = {                                                                                               // 8
  "&Aacute;": { "codepoints": [193], "characters": "\u00C1" },                                                 // 9
  "&Aacute": { "codepoints": [193], "characters": "\u00C1" },                                                  // 10
  "&aacute;": { "codepoints": [225], "characters": "\u00E1" },                                                 // 11
  "&aacute": { "codepoints": [225], "characters": "\u00E1" },                                                  // 12
  "&Abreve;": { "codepoints": [258], "characters": "\u0102" },                                                 // 13
  "&abreve;": { "codepoints": [259], "characters": "\u0103" },                                                 // 14
  "&ac;": { "codepoints": [8766], "characters": "\u223E" },                                                    // 15
  "&acd;": { "codepoints": [8767], "characters": "\u223F" },                                                   // 16
  "&acE;": { "codepoints": [8766, 819], "characters": "\u223E\u0333" },                                        // 17
  "&Acirc;": { "codepoints": [194], "characters": "\u00C2" },                                                  // 18
  "&Acirc": { "codepoints": [194], "characters": "\u00C2" },                                                   // 19
  "&acirc;": { "codepoints": [226], "characters": "\u00E2" },                                                  // 20
  "&acirc": { "codepoints": [226], "characters": "\u00E2" },                                                   // 21
  "&acute;": { "codepoints": [180], "characters": "\u00B4" },                                                  // 22
  "&acute": { "codepoints": [180], "characters": "\u00B4" },                                                   // 23
  "&Acy;": { "codepoints": [1040], "characters": "\u0410" },                                                   // 24
  "&acy;": { "codepoints": [1072], "characters": "\u0430" },                                                   // 25
  "&AElig;": { "codepoints": [198], "characters": "\u00C6" },                                                  // 26
  "&AElig": { "codepoints": [198], "characters": "\u00C6" },                                                   // 27
  "&aelig;": { "codepoints": [230], "characters": "\u00E6" },                                                  // 28
  "&aelig": { "codepoints": [230], "characters": "\u00E6" },                                                   // 29
  "&af;": { "codepoints": [8289], "characters": "\u2061" },                                                    // 30
  "&Afr;": { "codepoints": [120068], "characters": "\uD835\uDD04" },                                           // 31
  "&afr;": { "codepoints": [120094], "characters": "\uD835\uDD1E" },                                           // 32
  "&Agrave;": { "codepoints": [192], "characters": "\u00C0" },                                                 // 33
  "&Agrave": { "codepoints": [192], "characters": "\u00C0" },                                                  // 34
  "&agrave;": { "codepoints": [224], "characters": "\u00E0" },                                                 // 35
  "&agrave": { "codepoints": [224], "characters": "\u00E0" },                                                  // 36
  "&alefsym;": { "codepoints": [8501], "characters": "\u2135" },                                               // 37
  "&aleph;": { "codepoints": [8501], "characters": "\u2135" },                                                 // 38
  "&Alpha;": { "codepoints": [913], "characters": "\u0391" },                                                  // 39
  "&alpha;": { "codepoints": [945], "characters": "\u03B1" },                                                  // 40
  "&Amacr;": { "codepoints": [256], "characters": "\u0100" },                                                  // 41
  "&amacr;": { "codepoints": [257], "characters": "\u0101" },                                                  // 42
  "&amalg;": { "codepoints": [10815], "characters": "\u2A3F" },                                                // 43
  "&amp;": { "codepoints": [38], "characters": "\u0026" },                                                     // 44
  "&amp": { "codepoints": [38], "characters": "\u0026" },                                                      // 45
  "&AMP;": { "codepoints": [38], "characters": "\u0026" },                                                     // 46
  "&AMP": { "codepoints": [38], "characters": "\u0026" },                                                      // 47
  "&andand;": { "codepoints": [10837], "characters": "\u2A55" },                                               // 48
  "&And;": { "codepoints": [10835], "characters": "\u2A53" },                                                  // 49
  "&and;": { "codepoints": [8743], "characters": "\u2227" },                                                   // 50
  "&andd;": { "codepoints": [10844], "characters": "\u2A5C" },                                                 // 51
  "&andslope;": { "codepoints": [10840], "characters": "\u2A58" },                                             // 52
  "&andv;": { "codepoints": [10842], "characters": "\u2A5A" },                                                 // 53
  "&ang;": { "codepoints": [8736], "characters": "\u2220" },                                                   // 54
  "&ange;": { "codepoints": [10660], "characters": "\u29A4" },                                                 // 55
  "&angle;": { "codepoints": [8736], "characters": "\u2220" },                                                 // 56
  "&angmsdaa;": { "codepoints": [10664], "characters": "\u29A8" },                                             // 57
  "&angmsdab;": { "codepoints": [10665], "characters": "\u29A9" },                                             // 58
  "&angmsdac;": { "codepoints": [10666], "characters": "\u29AA" },                                             // 59
  "&angmsdad;": { "codepoints": [10667], "characters": "\u29AB" },                                             // 60
  "&angmsdae;": { "codepoints": [10668], "characters": "\u29AC" },                                             // 61
  "&angmsdaf;": { "codepoints": [10669], "characters": "\u29AD" },                                             // 62
  "&angmsdag;": { "codepoints": [10670], "characters": "\u29AE" },                                             // 63
  "&angmsdah;": { "codepoints": [10671], "characters": "\u29AF" },                                             // 64
  "&angmsd;": { "codepoints": [8737], "characters": "\u2221" },                                                // 65
  "&angrt;": { "codepoints": [8735], "characters": "\u221F" },                                                 // 66
  "&angrtvb;": { "codepoints": [8894], "characters": "\u22BE" },                                               // 67
  "&angrtvbd;": { "codepoints": [10653], "characters": "\u299D" },                                             // 68
  "&angsph;": { "codepoints": [8738], "characters": "\u2222" },                                                // 69
  "&angst;": { "codepoints": [197], "characters": "\u00C5" },                                                  // 70
  "&angzarr;": { "codepoints": [9084], "characters": "\u237C" },                                               // 71
  "&Aogon;": { "codepoints": [260], "characters": "\u0104" },                                                  // 72
  "&aogon;": { "codepoints": [261], "characters": "\u0105" },                                                  // 73
  "&Aopf;": { "codepoints": [120120], "characters": "\uD835\uDD38" },                                          // 74
  "&aopf;": { "codepoints": [120146], "characters": "\uD835\uDD52" },                                          // 75
  "&apacir;": { "codepoints": [10863], "characters": "\u2A6F" },                                               // 76
  "&ap;": { "codepoints": [8776], "characters": "\u2248" },                                                    // 77
  "&apE;": { "codepoints": [10864], "characters": "\u2A70" },                                                  // 78
  "&ape;": { "codepoints": [8778], "characters": "\u224A" },                                                   // 79
  "&apid;": { "codepoints": [8779], "characters": "\u224B" },                                                  // 80
  "&apos;": { "codepoints": [39], "characters": "\u0027" },                                                    // 81
  "&ApplyFunction;": { "codepoints": [8289], "characters": "\u2061" },                                         // 82
  "&approx;": { "codepoints": [8776], "characters": "\u2248" },                                                // 83
  "&approxeq;": { "codepoints": [8778], "characters": "\u224A" },                                              // 84
  "&Aring;": { "codepoints": [197], "characters": "\u00C5" },                                                  // 85
  "&Aring": { "codepoints": [197], "characters": "\u00C5" },                                                   // 86
  "&aring;": { "codepoints": [229], "characters": "\u00E5" },                                                  // 87
  "&aring": { "codepoints": [229], "characters": "\u00E5" },                                                   // 88
  "&Ascr;": { "codepoints": [119964], "characters": "\uD835\uDC9C" },                                          // 89
  "&ascr;": { "codepoints": [119990], "characters": "\uD835\uDCB6" },                                          // 90
  "&Assign;": { "codepoints": [8788], "characters": "\u2254" },                                                // 91
  "&ast;": { "codepoints": [42], "characters": "\u002A" },                                                     // 92
  "&asymp;": { "codepoints": [8776], "characters": "\u2248" },                                                 // 93
  "&asympeq;": { "codepoints": [8781], "characters": "\u224D" },                                               // 94
  "&Atilde;": { "codepoints": [195], "characters": "\u00C3" },                                                 // 95
  "&Atilde": { "codepoints": [195], "characters": "\u00C3" },                                                  // 96
  "&atilde;": { "codepoints": [227], "characters": "\u00E3" },                                                 // 97
  "&atilde": { "codepoints": [227], "characters": "\u00E3" },                                                  // 98
  "&Auml;": { "codepoints": [196], "characters": "\u00C4" },                                                   // 99
  "&Auml": { "codepoints": [196], "characters": "\u00C4" },                                                    // 100
  "&auml;": { "codepoints": [228], "characters": "\u00E4" },                                                   // 101
  "&auml": { "codepoints": [228], "characters": "\u00E4" },                                                    // 102
  "&awconint;": { "codepoints": [8755], "characters": "\u2233" },                                              // 103
  "&awint;": { "codepoints": [10769], "characters": "\u2A11" },                                                // 104
  "&backcong;": { "codepoints": [8780], "characters": "\u224C" },                                              // 105
  "&backepsilon;": { "codepoints": [1014], "characters": "\u03F6" },                                           // 106
  "&backprime;": { "codepoints": [8245], "characters": "\u2035" },                                             // 107
  "&backsim;": { "codepoints": [8765], "characters": "\u223D" },                                               // 108
  "&backsimeq;": { "codepoints": [8909], "characters": "\u22CD" },                                             // 109
  "&Backslash;": { "codepoints": [8726], "characters": "\u2216" },                                             // 110
  "&Barv;": { "codepoints": [10983], "characters": "\u2AE7" },                                                 // 111
  "&barvee;": { "codepoints": [8893], "characters": "\u22BD" },                                                // 112
  "&barwed;": { "codepoints": [8965], "characters": "\u2305" },                                                // 113
  "&Barwed;": { "codepoints": [8966], "characters": "\u2306" },                                                // 114
  "&barwedge;": { "codepoints": [8965], "characters": "\u2305" },                                              // 115
  "&bbrk;": { "codepoints": [9141], "characters": "\u23B5" },                                                  // 116
  "&bbrktbrk;": { "codepoints": [9142], "characters": "\u23B6" },                                              // 117
  "&bcong;": { "codepoints": [8780], "characters": "\u224C" },                                                 // 118
  "&Bcy;": { "codepoints": [1041], "characters": "\u0411" },                                                   // 119
  "&bcy;": { "codepoints": [1073], "characters": "\u0431" },                                                   // 120
  "&bdquo;": { "codepoints": [8222], "characters": "\u201E" },                                                 // 121
  "&becaus;": { "codepoints": [8757], "characters": "\u2235" },                                                // 122
  "&because;": { "codepoints": [8757], "characters": "\u2235" },                                               // 123
  "&Because;": { "codepoints": [8757], "characters": "\u2235" },                                               // 124
  "&bemptyv;": { "codepoints": [10672], "characters": "\u29B0" },                                              // 125
  "&bepsi;": { "codepoints": [1014], "characters": "\u03F6" },                                                 // 126
  "&bernou;": { "codepoints": [8492], "characters": "\u212C" },                                                // 127
  "&Bernoullis;": { "codepoints": [8492], "characters": "\u212C" },                                            // 128
  "&Beta;": { "codepoints": [914], "characters": "\u0392" },                                                   // 129
  "&beta;": { "codepoints": [946], "characters": "\u03B2" },                                                   // 130
  "&beth;": { "codepoints": [8502], "characters": "\u2136" },                                                  // 131
  "&between;": { "codepoints": [8812], "characters": "\u226C" },                                               // 132
  "&Bfr;": { "codepoints": [120069], "characters": "\uD835\uDD05" },                                           // 133
  "&bfr;": { "codepoints": [120095], "characters": "\uD835\uDD1F" },                                           // 134
  "&bigcap;": { "codepoints": [8898], "characters": "\u22C2" },                                                // 135
  "&bigcirc;": { "codepoints": [9711], "characters": "\u25EF" },                                               // 136
  "&bigcup;": { "codepoints": [8899], "characters": "\u22C3" },                                                // 137
  "&bigodot;": { "codepoints": [10752], "characters": "\u2A00" },                                              // 138
  "&bigoplus;": { "codepoints": [10753], "characters": "\u2A01" },                                             // 139
  "&bigotimes;": { "codepoints": [10754], "characters": "\u2A02" },                                            // 140
  "&bigsqcup;": { "codepoints": [10758], "characters": "\u2A06" },                                             // 141
  "&bigstar;": { "codepoints": [9733], "characters": "\u2605" },                                               // 142
  "&bigtriangledown;": { "codepoints": [9661], "characters": "\u25BD" },                                       // 143
  "&bigtriangleup;": { "codepoints": [9651], "characters": "\u25B3" },                                         // 144
  "&biguplus;": { "codepoints": [10756], "characters": "\u2A04" },                                             // 145
  "&bigvee;": { "codepoints": [8897], "characters": "\u22C1" },                                                // 146
  "&bigwedge;": { "codepoints": [8896], "characters": "\u22C0" },                                              // 147
  "&bkarow;": { "codepoints": [10509], "characters": "\u290D" },                                               // 148
  "&blacklozenge;": { "codepoints": [10731], "characters": "\u29EB" },                                         // 149
  "&blacksquare;": { "codepoints": [9642], "characters": "\u25AA" },                                           // 150
  "&blacktriangle;": { "codepoints": [9652], "characters": "\u25B4" },                                         // 151
  "&blacktriangledown;": { "codepoints": [9662], "characters": "\u25BE" },                                     // 152
  "&blacktriangleleft;": { "codepoints": [9666], "characters": "\u25C2" },                                     // 153
  "&blacktriangleright;": { "codepoints": [9656], "characters": "\u25B8" },                                    // 154
  "&blank;": { "codepoints": [9251], "characters": "\u2423" },                                                 // 155
  "&blk12;": { "codepoints": [9618], "characters": "\u2592" },                                                 // 156
  "&blk14;": { "codepoints": [9617], "characters": "\u2591" },                                                 // 157
  "&blk34;": { "codepoints": [9619], "characters": "\u2593" },                                                 // 158
  "&block;": { "codepoints": [9608], "characters": "\u2588" },                                                 // 159
  "&bne;": { "codepoints": [61, 8421], "characters": "\u003D\u20E5" },                                         // 160
  "&bnequiv;": { "codepoints": [8801, 8421], "characters": "\u2261\u20E5" },                                   // 161
  "&bNot;": { "codepoints": [10989], "characters": "\u2AED" },                                                 // 162
  "&bnot;": { "codepoints": [8976], "characters": "\u2310" },                                                  // 163
  "&Bopf;": { "codepoints": [120121], "characters": "\uD835\uDD39" },                                          // 164
  "&bopf;": { "codepoints": [120147], "characters": "\uD835\uDD53" },                                          // 165
  "&bot;": { "codepoints": [8869], "characters": "\u22A5" },                                                   // 166
  "&bottom;": { "codepoints": [8869], "characters": "\u22A5" },                                                // 167
  "&bowtie;": { "codepoints": [8904], "characters": "\u22C8" },                                                // 168
  "&boxbox;": { "codepoints": [10697], "characters": "\u29C9" },                                               // 169
  "&boxdl;": { "codepoints": [9488], "characters": "\u2510" },                                                 // 170
  "&boxdL;": { "codepoints": [9557], "characters": "\u2555" },                                                 // 171
  "&boxDl;": { "codepoints": [9558], "characters": "\u2556" },                                                 // 172
  "&boxDL;": { "codepoints": [9559], "characters": "\u2557" },                                                 // 173
  "&boxdr;": { "codepoints": [9484], "characters": "\u250C" },                                                 // 174
  "&boxdR;": { "codepoints": [9554], "characters": "\u2552" },                                                 // 175
  "&boxDr;": { "codepoints": [9555], "characters": "\u2553" },                                                 // 176
  "&boxDR;": { "codepoints": [9556], "characters": "\u2554" },                                                 // 177
  "&boxh;": { "codepoints": [9472], "characters": "\u2500" },                                                  // 178
  "&boxH;": { "codepoints": [9552], "characters": "\u2550" },                                                  // 179
  "&boxhd;": { "codepoints": [9516], "characters": "\u252C" },                                                 // 180
  "&boxHd;": { "codepoints": [9572], "characters": "\u2564" },                                                 // 181
  "&boxhD;": { "codepoints": [9573], "characters": "\u2565" },                                                 // 182
  "&boxHD;": { "codepoints": [9574], "characters": "\u2566" },                                                 // 183
  "&boxhu;": { "codepoints": [9524], "characters": "\u2534" },                                                 // 184
  "&boxHu;": { "codepoints": [9575], "characters": "\u2567" },                                                 // 185
  "&boxhU;": { "codepoints": [9576], "characters": "\u2568" },                                                 // 186
  "&boxHU;": { "codepoints": [9577], "characters": "\u2569" },                                                 // 187
  "&boxminus;": { "codepoints": [8863], "characters": "\u229F" },                                              // 188
  "&boxplus;": { "codepoints": [8862], "characters": "\u229E" },                                               // 189
  "&boxtimes;": { "codepoints": [8864], "characters": "\u22A0" },                                              // 190
  "&boxul;": { "codepoints": [9496], "characters": "\u2518" },                                                 // 191
  "&boxuL;": { "codepoints": [9563], "characters": "\u255B" },                                                 // 192
  "&boxUl;": { "codepoints": [9564], "characters": "\u255C" },                                                 // 193
  "&boxUL;": { "codepoints": [9565], "characters": "\u255D" },                                                 // 194
  "&boxur;": { "codepoints": [9492], "characters": "\u2514" },                                                 // 195
  "&boxuR;": { "codepoints": [9560], "characters": "\u2558" },                                                 // 196
  "&boxUr;": { "codepoints": [9561], "characters": "\u2559" },                                                 // 197
  "&boxUR;": { "codepoints": [9562], "characters": "\u255A" },                                                 // 198
  "&boxv;": { "codepoints": [9474], "characters": "\u2502" },                                                  // 199
  "&boxV;": { "codepoints": [9553], "characters": "\u2551" },                                                  // 200
  "&boxvh;": { "codepoints": [9532], "characters": "\u253C" },                                                 // 201
  "&boxvH;": { "codepoints": [9578], "characters": "\u256A" },                                                 // 202
  "&boxVh;": { "codepoints": [9579], "characters": "\u256B" },                                                 // 203
  "&boxVH;": { "codepoints": [9580], "characters": "\u256C" },                                                 // 204
  "&boxvl;": { "codepoints": [9508], "characters": "\u2524" },                                                 // 205
  "&boxvL;": { "codepoints": [9569], "characters": "\u2561" },                                                 // 206
  "&boxVl;": { "codepoints": [9570], "characters": "\u2562" },                                                 // 207
  "&boxVL;": { "codepoints": [9571], "characters": "\u2563" },                                                 // 208
  "&boxvr;": { "codepoints": [9500], "characters": "\u251C" },                                                 // 209
  "&boxvR;": { "codepoints": [9566], "characters": "\u255E" },                                                 // 210
  "&boxVr;": { "codepoints": [9567], "characters": "\u255F" },                                                 // 211
  "&boxVR;": { "codepoints": [9568], "characters": "\u2560" },                                                 // 212
  "&bprime;": { "codepoints": [8245], "characters": "\u2035" },                                                // 213
  "&breve;": { "codepoints": [728], "characters": "\u02D8" },                                                  // 214
  "&Breve;": { "codepoints": [728], "characters": "\u02D8" },                                                  // 215
  "&brvbar;": { "codepoints": [166], "characters": "\u00A6" },                                                 // 216
  "&brvbar": { "codepoints": [166], "characters": "\u00A6" },                                                  // 217
  "&bscr;": { "codepoints": [119991], "characters": "\uD835\uDCB7" },                                          // 218
  "&Bscr;": { "codepoints": [8492], "characters": "\u212C" },                                                  // 219
  "&bsemi;": { "codepoints": [8271], "characters": "\u204F" },                                                 // 220
  "&bsim;": { "codepoints": [8765], "characters": "\u223D" },                                                  // 221
  "&bsime;": { "codepoints": [8909], "characters": "\u22CD" },                                                 // 222
  "&bsolb;": { "codepoints": [10693], "characters": "\u29C5" },                                                // 223
  "&bsol;": { "codepoints": [92], "characters": "\u005C" },                                                    // 224
  "&bsolhsub;": { "codepoints": [10184], "characters": "\u27C8" },                                             // 225
  "&bull;": { "codepoints": [8226], "characters": "\u2022" },                                                  // 226
  "&bullet;": { "codepoints": [8226], "characters": "\u2022" },                                                // 227
  "&bump;": { "codepoints": [8782], "characters": "\u224E" },                                                  // 228
  "&bumpE;": { "codepoints": [10926], "characters": "\u2AAE" },                                                // 229
  "&bumpe;": { "codepoints": [8783], "characters": "\u224F" },                                                 // 230
  "&Bumpeq;": { "codepoints": [8782], "characters": "\u224E" },                                                // 231
  "&bumpeq;": { "codepoints": [8783], "characters": "\u224F" },                                                // 232
  "&Cacute;": { "codepoints": [262], "characters": "\u0106" },                                                 // 233
  "&cacute;": { "codepoints": [263], "characters": "\u0107" },                                                 // 234
  "&capand;": { "codepoints": [10820], "characters": "\u2A44" },                                               // 235
  "&capbrcup;": { "codepoints": [10825], "characters": "\u2A49" },                                             // 236
  "&capcap;": { "codepoints": [10827], "characters": "\u2A4B" },                                               // 237
  "&cap;": { "codepoints": [8745], "characters": "\u2229" },                                                   // 238
  "&Cap;": { "codepoints": [8914], "characters": "\u22D2" },                                                   // 239
  "&capcup;": { "codepoints": [10823], "characters": "\u2A47" },                                               // 240
  "&capdot;": { "codepoints": [10816], "characters": "\u2A40" },                                               // 241
  "&CapitalDifferentialD;": { "codepoints": [8517], "characters": "\u2145" },                                  // 242
  "&caps;": { "codepoints": [8745, 65024], "characters": "\u2229\uFE00" },                                     // 243
  "&caret;": { "codepoints": [8257], "characters": "\u2041" },                                                 // 244
  "&caron;": { "codepoints": [711], "characters": "\u02C7" },                                                  // 245
  "&Cayleys;": { "codepoints": [8493], "characters": "\u212D" },                                               // 246
  "&ccaps;": { "codepoints": [10829], "characters": "\u2A4D" },                                                // 247
  "&Ccaron;": { "codepoints": [268], "characters": "\u010C" },                                                 // 248
  "&ccaron;": { "codepoints": [269], "characters": "\u010D" },                                                 // 249
  "&Ccedil;": { "codepoints": [199], "characters": "\u00C7" },                                                 // 250
  "&Ccedil": { "codepoints": [199], "characters": "\u00C7" },                                                  // 251
  "&ccedil;": { "codepoints": [231], "characters": "\u00E7" },                                                 // 252
  "&ccedil": { "codepoints": [231], "characters": "\u00E7" },                                                  // 253
  "&Ccirc;": { "codepoints": [264], "characters": "\u0108" },                                                  // 254
  "&ccirc;": { "codepoints": [265], "characters": "\u0109" },                                                  // 255
  "&Cconint;": { "codepoints": [8752], "characters": "\u2230" },                                               // 256
  "&ccups;": { "codepoints": [10828], "characters": "\u2A4C" },                                                // 257
  "&ccupssm;": { "codepoints": [10832], "characters": "\u2A50" },                                              // 258
  "&Cdot;": { "codepoints": [266], "characters": "\u010A" },                                                   // 259
  "&cdot;": { "codepoints": [267], "characters": "\u010B" },                                                   // 260
  "&cedil;": { "codepoints": [184], "characters": "\u00B8" },                                                  // 261
  "&cedil": { "codepoints": [184], "characters": "\u00B8" },                                                   // 262
  "&Cedilla;": { "codepoints": [184], "characters": "\u00B8" },                                                // 263
  "&cemptyv;": { "codepoints": [10674], "characters": "\u29B2" },                                              // 264
  "&cent;": { "codepoints": [162], "characters": "\u00A2" },                                                   // 265
  "&cent": { "codepoints": [162], "characters": "\u00A2" },                                                    // 266
  "&centerdot;": { "codepoints": [183], "characters": "\u00B7" },                                              // 267
  "&CenterDot;": { "codepoints": [183], "characters": "\u00B7" },                                              // 268
  "&cfr;": { "codepoints": [120096], "characters": "\uD835\uDD20" },                                           // 269
  "&Cfr;": { "codepoints": [8493], "characters": "\u212D" },                                                   // 270
  "&CHcy;": { "codepoints": [1063], "characters": "\u0427" },                                                  // 271
  "&chcy;": { "codepoints": [1095], "characters": "\u0447" },                                                  // 272
  "&check;": { "codepoints": [10003], "characters": "\u2713" },                                                // 273
  "&checkmark;": { "codepoints": [10003], "characters": "\u2713" },                                            // 274
  "&Chi;": { "codepoints": [935], "characters": "\u03A7" },                                                    // 275
  "&chi;": { "codepoints": [967], "characters": "\u03C7" },                                                    // 276
  "&circ;": { "codepoints": [710], "characters": "\u02C6" },                                                   // 277
  "&circeq;": { "codepoints": [8791], "characters": "\u2257" },                                                // 278
  "&circlearrowleft;": { "codepoints": [8634], "characters": "\u21BA" },                                       // 279
  "&circlearrowright;": { "codepoints": [8635], "characters": "\u21BB" },                                      // 280
  "&circledast;": { "codepoints": [8859], "characters": "\u229B" },                                            // 281
  "&circledcirc;": { "codepoints": [8858], "characters": "\u229A" },                                           // 282
  "&circleddash;": { "codepoints": [8861], "characters": "\u229D" },                                           // 283
  "&CircleDot;": { "codepoints": [8857], "characters": "\u2299" },                                             // 284
  "&circledR;": { "codepoints": [174], "characters": "\u00AE" },                                               // 285
  "&circledS;": { "codepoints": [9416], "characters": "\u24C8" },                                              // 286
  "&CircleMinus;": { "codepoints": [8854], "characters": "\u2296" },                                           // 287
  "&CirclePlus;": { "codepoints": [8853], "characters": "\u2295" },                                            // 288
  "&CircleTimes;": { "codepoints": [8855], "characters": "\u2297" },                                           // 289
  "&cir;": { "codepoints": [9675], "characters": "\u25CB" },                                                   // 290
  "&cirE;": { "codepoints": [10691], "characters": "\u29C3" },                                                 // 291
  "&cire;": { "codepoints": [8791], "characters": "\u2257" },                                                  // 292
  "&cirfnint;": { "codepoints": [10768], "characters": "\u2A10" },                                             // 293
  "&cirmid;": { "codepoints": [10991], "characters": "\u2AEF" },                                               // 294
  "&cirscir;": { "codepoints": [10690], "characters": "\u29C2" },                                              // 295
  "&ClockwiseContourIntegral;": { "codepoints": [8754], "characters": "\u2232" },                              // 296
  "&CloseCurlyDoubleQuote;": { "codepoints": [8221], "characters": "\u201D" },                                 // 297
  "&CloseCurlyQuote;": { "codepoints": [8217], "characters": "\u2019" },                                       // 298
  "&clubs;": { "codepoints": [9827], "characters": "\u2663" },                                                 // 299
  "&clubsuit;": { "codepoints": [9827], "characters": "\u2663" },                                              // 300
  "&colon;": { "codepoints": [58], "characters": "\u003A" },                                                   // 301
  "&Colon;": { "codepoints": [8759], "characters": "\u2237" },                                                 // 302
  "&Colone;": { "codepoints": [10868], "characters": "\u2A74" },                                               // 303
  "&colone;": { "codepoints": [8788], "characters": "\u2254" },                                                // 304
  "&coloneq;": { "codepoints": [8788], "characters": "\u2254" },                                               // 305
  "&comma;": { "codepoints": [44], "characters": "\u002C" },                                                   // 306
  "&commat;": { "codepoints": [64], "characters": "\u0040" },                                                  // 307
  "&comp;": { "codepoints": [8705], "characters": "\u2201" },                                                  // 308
  "&compfn;": { "codepoints": [8728], "characters": "\u2218" },                                                // 309
  "&complement;": { "codepoints": [8705], "characters": "\u2201" },                                            // 310
  "&complexes;": { "codepoints": [8450], "characters": "\u2102" },                                             // 311
  "&cong;": { "codepoints": [8773], "characters": "\u2245" },                                                  // 312
  "&congdot;": { "codepoints": [10861], "characters": "\u2A6D" },                                              // 313
  "&Congruent;": { "codepoints": [8801], "characters": "\u2261" },                                             // 314
  "&conint;": { "codepoints": [8750], "characters": "\u222E" },                                                // 315
  "&Conint;": { "codepoints": [8751], "characters": "\u222F" },                                                // 316
  "&ContourIntegral;": { "codepoints": [8750], "characters": "\u222E" },                                       // 317
  "&copf;": { "codepoints": [120148], "characters": "\uD835\uDD54" },                                          // 318
  "&Copf;": { "codepoints": [8450], "characters": "\u2102" },                                                  // 319
  "&coprod;": { "codepoints": [8720], "characters": "\u2210" },                                                // 320
  "&Coproduct;": { "codepoints": [8720], "characters": "\u2210" },                                             // 321
  "&copy;": { "codepoints": [169], "characters": "\u00A9" },                                                   // 322
  "&copy": { "codepoints": [169], "characters": "\u00A9" },                                                    // 323
  "&COPY;": { "codepoints": [169], "characters": "\u00A9" },                                                   // 324
  "&COPY": { "codepoints": [169], "characters": "\u00A9" },                                                    // 325
  "&copysr;": { "codepoints": [8471], "characters": "\u2117" },                                                // 326
  "&CounterClockwiseContourIntegral;": { "codepoints": [8755], "characters": "\u2233" },                       // 327
  "&crarr;": { "codepoints": [8629], "characters": "\u21B5" },                                                 // 328
  "&cross;": { "codepoints": [10007], "characters": "\u2717" },                                                // 329
  "&Cross;": { "codepoints": [10799], "characters": "\u2A2F" },                                                // 330
  "&Cscr;": { "codepoints": [119966], "characters": "\uD835\uDC9E" },                                          // 331
  "&cscr;": { "codepoints": [119992], "characters": "\uD835\uDCB8" },                                          // 332
  "&csub;": { "codepoints": [10959], "characters": "\u2ACF" },                                                 // 333
  "&csube;": { "codepoints": [10961], "characters": "\u2AD1" },                                                // 334
  "&csup;": { "codepoints": [10960], "characters": "\u2AD0" },                                                 // 335
  "&csupe;": { "codepoints": [10962], "characters": "\u2AD2" },                                                // 336
  "&ctdot;": { "codepoints": [8943], "characters": "\u22EF" },                                                 // 337
  "&cudarrl;": { "codepoints": [10552], "characters": "\u2938" },                                              // 338
  "&cudarrr;": { "codepoints": [10549], "characters": "\u2935" },                                              // 339
  "&cuepr;": { "codepoints": [8926], "characters": "\u22DE" },                                                 // 340
  "&cuesc;": { "codepoints": [8927], "characters": "\u22DF" },                                                 // 341
  "&cularr;": { "codepoints": [8630], "characters": "\u21B6" },                                                // 342
  "&cularrp;": { "codepoints": [10557], "characters": "\u293D" },                                              // 343
  "&cupbrcap;": { "codepoints": [10824], "characters": "\u2A48" },                                             // 344
  "&cupcap;": { "codepoints": [10822], "characters": "\u2A46" },                                               // 345
  "&CupCap;": { "codepoints": [8781], "characters": "\u224D" },                                                // 346
  "&cup;": { "codepoints": [8746], "characters": "\u222A" },                                                   // 347
  "&Cup;": { "codepoints": [8915], "characters": "\u22D3" },                                                   // 348
  "&cupcup;": { "codepoints": [10826], "characters": "\u2A4A" },                                               // 349
  "&cupdot;": { "codepoints": [8845], "characters": "\u228D" },                                                // 350
  "&cupor;": { "codepoints": [10821], "characters": "\u2A45" },                                                // 351
  "&cups;": { "codepoints": [8746, 65024], "characters": "\u222A\uFE00" },                                     // 352
  "&curarr;": { "codepoints": [8631], "characters": "\u21B7" },                                                // 353
  "&curarrm;": { "codepoints": [10556], "characters": "\u293C" },                                              // 354
  "&curlyeqprec;": { "codepoints": [8926], "characters": "\u22DE" },                                           // 355
  "&curlyeqsucc;": { "codepoints": [8927], "characters": "\u22DF" },                                           // 356
  "&curlyvee;": { "codepoints": [8910], "characters": "\u22CE" },                                              // 357
  "&curlywedge;": { "codepoints": [8911], "characters": "\u22CF" },                                            // 358
  "&curren;": { "codepoints": [164], "characters": "\u00A4" },                                                 // 359
  "&curren": { "codepoints": [164], "characters": "\u00A4" },                                                  // 360
  "&curvearrowleft;": { "codepoints": [8630], "characters": "\u21B6" },                                        // 361
  "&curvearrowright;": { "codepoints": [8631], "characters": "\u21B7" },                                       // 362
  "&cuvee;": { "codepoints": [8910], "characters": "\u22CE" },                                                 // 363
  "&cuwed;": { "codepoints": [8911], "characters": "\u22CF" },                                                 // 364
  "&cwconint;": { "codepoints": [8754], "characters": "\u2232" },                                              // 365
  "&cwint;": { "codepoints": [8753], "characters": "\u2231" },                                                 // 366
  "&cylcty;": { "codepoints": [9005], "characters": "\u232D" },                                                // 367
  "&dagger;": { "codepoints": [8224], "characters": "\u2020" },                                                // 368
  "&Dagger;": { "codepoints": [8225], "characters": "\u2021" },                                                // 369
  "&daleth;": { "codepoints": [8504], "characters": "\u2138" },                                                // 370
  "&darr;": { "codepoints": [8595], "characters": "\u2193" },                                                  // 371
  "&Darr;": { "codepoints": [8609], "characters": "\u21A1" },                                                  // 372
  "&dArr;": { "codepoints": [8659], "characters": "\u21D3" },                                                  // 373
  "&dash;": { "codepoints": [8208], "characters": "\u2010" },                                                  // 374
  "&Dashv;": { "codepoints": [10980], "characters": "\u2AE4" },                                                // 375
  "&dashv;": { "codepoints": [8867], "characters": "\u22A3" },                                                 // 376
  "&dbkarow;": { "codepoints": [10511], "characters": "\u290F" },                                              // 377
  "&dblac;": { "codepoints": [733], "characters": "\u02DD" },                                                  // 378
  "&Dcaron;": { "codepoints": [270], "characters": "\u010E" },                                                 // 379
  "&dcaron;": { "codepoints": [271], "characters": "\u010F" },                                                 // 380
  "&Dcy;": { "codepoints": [1044], "characters": "\u0414" },                                                   // 381
  "&dcy;": { "codepoints": [1076], "characters": "\u0434" },                                                   // 382
  "&ddagger;": { "codepoints": [8225], "characters": "\u2021" },                                               // 383
  "&ddarr;": { "codepoints": [8650], "characters": "\u21CA" },                                                 // 384
  "&DD;": { "codepoints": [8517], "characters": "\u2145" },                                                    // 385
  "&dd;": { "codepoints": [8518], "characters": "\u2146" },                                                    // 386
  "&DDotrahd;": { "codepoints": [10513], "characters": "\u2911" },                                             // 387
  "&ddotseq;": { "codepoints": [10871], "characters": "\u2A77" },                                              // 388
  "&deg;": { "codepoints": [176], "characters": "\u00B0" },                                                    // 389
  "&deg": { "codepoints": [176], "characters": "\u00B0" },                                                     // 390
  "&Del;": { "codepoints": [8711], "characters": "\u2207" },                                                   // 391
  "&Delta;": { "codepoints": [916], "characters": "\u0394" },                                                  // 392
  "&delta;": { "codepoints": [948], "characters": "\u03B4" },                                                  // 393
  "&demptyv;": { "codepoints": [10673], "characters": "\u29B1" },                                              // 394
  "&dfisht;": { "codepoints": [10623], "characters": "\u297F" },                                               // 395
  "&Dfr;": { "codepoints": [120071], "characters": "\uD835\uDD07" },                                           // 396
  "&dfr;": { "codepoints": [120097], "characters": "\uD835\uDD21" },                                           // 397
  "&dHar;": { "codepoints": [10597], "characters": "\u2965" },                                                 // 398
  "&dharl;": { "codepoints": [8643], "characters": "\u21C3" },                                                 // 399
  "&dharr;": { "codepoints": [8642], "characters": "\u21C2" },                                                 // 400
  "&DiacriticalAcute;": { "codepoints": [180], "characters": "\u00B4" },                                       // 401
  "&DiacriticalDot;": { "codepoints": [729], "characters": "\u02D9" },                                         // 402
  "&DiacriticalDoubleAcute;": { "codepoints": [733], "characters": "\u02DD" },                                 // 403
  "&DiacriticalGrave;": { "codepoints": [96], "characters": "\u0060" },                                        // 404
  "&DiacriticalTilde;": { "codepoints": [732], "characters": "\u02DC" },                                       // 405
  "&diam;": { "codepoints": [8900], "characters": "\u22C4" },                                                  // 406
  "&diamond;": { "codepoints": [8900], "characters": "\u22C4" },                                               // 407
  "&Diamond;": { "codepoints": [8900], "characters": "\u22C4" },                                               // 408
  "&diamondsuit;": { "codepoints": [9830], "characters": "\u2666" },                                           // 409
  "&diams;": { "codepoints": [9830], "characters": "\u2666" },                                                 // 410
  "&die;": { "codepoints": [168], "characters": "\u00A8" },                                                    // 411
  "&DifferentialD;": { "codepoints": [8518], "characters": "\u2146" },                                         // 412
  "&digamma;": { "codepoints": [989], "characters": "\u03DD" },                                                // 413
  "&disin;": { "codepoints": [8946], "characters": "\u22F2" },                                                 // 414
  "&div;": { "codepoints": [247], "characters": "\u00F7" },                                                    // 415
  "&divide;": { "codepoints": [247], "characters": "\u00F7" },                                                 // 416
  "&divide": { "codepoints": [247], "characters": "\u00F7" },                                                  // 417
  "&divideontimes;": { "codepoints": [8903], "characters": "\u22C7" },                                         // 418
  "&divonx;": { "codepoints": [8903], "characters": "\u22C7" },                                                // 419
  "&DJcy;": { "codepoints": [1026], "characters": "\u0402" },                                                  // 420
  "&djcy;": { "codepoints": [1106], "characters": "\u0452" },                                                  // 421
  "&dlcorn;": { "codepoints": [8990], "characters": "\u231E" },                                                // 422
  "&dlcrop;": { "codepoints": [8973], "characters": "\u230D" },                                                // 423
  "&dollar;": { "codepoints": [36], "characters": "\u0024" },                                                  // 424
  "&Dopf;": { "codepoints": [120123], "characters": "\uD835\uDD3B" },                                          // 425
  "&dopf;": { "codepoints": [120149], "characters": "\uD835\uDD55" },                                          // 426
  "&Dot;": { "codepoints": [168], "characters": "\u00A8" },                                                    // 427
  "&dot;": { "codepoints": [729], "characters": "\u02D9" },                                                    // 428
  "&DotDot;": { "codepoints": [8412], "characters": "\u20DC" },                                                // 429
  "&doteq;": { "codepoints": [8784], "characters": "\u2250" },                                                 // 430
  "&doteqdot;": { "codepoints": [8785], "characters": "\u2251" },                                              // 431
  "&DotEqual;": { "codepoints": [8784], "characters": "\u2250" },                                              // 432
  "&dotminus;": { "codepoints": [8760], "characters": "\u2238" },                                              // 433
  "&dotplus;": { "codepoints": [8724], "characters": "\u2214" },                                               // 434
  "&dotsquare;": { "codepoints": [8865], "characters": "\u22A1" },                                             // 435
  "&doublebarwedge;": { "codepoints": [8966], "characters": "\u2306" },                                        // 436
  "&DoubleContourIntegral;": { "codepoints": [8751], "characters": "\u222F" },                                 // 437
  "&DoubleDot;": { "codepoints": [168], "characters": "\u00A8" },                                              // 438
  "&DoubleDownArrow;": { "codepoints": [8659], "characters": "\u21D3" },                                       // 439
  "&DoubleLeftArrow;": { "codepoints": [8656], "characters": "\u21D0" },                                       // 440
  "&DoubleLeftRightArrow;": { "codepoints": [8660], "characters": "\u21D4" },                                  // 441
  "&DoubleLeftTee;": { "codepoints": [10980], "characters": "\u2AE4" },                                        // 442
  "&DoubleLongLeftArrow;": { "codepoints": [10232], "characters": "\u27F8" },                                  // 443
  "&DoubleLongLeftRightArrow;": { "codepoints": [10234], "characters": "\u27FA" },                             // 444
  "&DoubleLongRightArrow;": { "codepoints": [10233], "characters": "\u27F9" },                                 // 445
  "&DoubleRightArrow;": { "codepoints": [8658], "characters": "\u21D2" },                                      // 446
  "&DoubleRightTee;": { "codepoints": [8872], "characters": "\u22A8" },                                        // 447
  "&DoubleUpArrow;": { "codepoints": [8657], "characters": "\u21D1" },                                         // 448
  "&DoubleUpDownArrow;": { "codepoints": [8661], "characters": "\u21D5" },                                     // 449
  "&DoubleVerticalBar;": { "codepoints": [8741], "characters": "\u2225" },                                     // 450
  "&DownArrowBar;": { "codepoints": [10515], "characters": "\u2913" },                                         // 451
  "&downarrow;": { "codepoints": [8595], "characters": "\u2193" },                                             // 452
  "&DownArrow;": { "codepoints": [8595], "characters": "\u2193" },                                             // 453
  "&Downarrow;": { "codepoints": [8659], "characters": "\u21D3" },                                             // 454
  "&DownArrowUpArrow;": { "codepoints": [8693], "characters": "\u21F5" },                                      // 455
  "&DownBreve;": { "codepoints": [785], "characters": "\u0311" },                                              // 456
  "&downdownarrows;": { "codepoints": [8650], "characters": "\u21CA" },                                        // 457
  "&downharpoonleft;": { "codepoints": [8643], "characters": "\u21C3" },                                       // 458
  "&downharpoonright;": { "codepoints": [8642], "characters": "\u21C2" },                                      // 459
  "&DownLeftRightVector;": { "codepoints": [10576], "characters": "\u2950" },                                  // 460
  "&DownLeftTeeVector;": { "codepoints": [10590], "characters": "\u295E" },                                    // 461
  "&DownLeftVectorBar;": { "codepoints": [10582], "characters": "\u2956" },                                    // 462
  "&DownLeftVector;": { "codepoints": [8637], "characters": "\u21BD" },                                        // 463
  "&DownRightTeeVector;": { "codepoints": [10591], "characters": "\u295F" },                                   // 464
  "&DownRightVectorBar;": { "codepoints": [10583], "characters": "\u2957" },                                   // 465
  "&DownRightVector;": { "codepoints": [8641], "characters": "\u21C1" },                                       // 466
  "&DownTeeArrow;": { "codepoints": [8615], "characters": "\u21A7" },                                          // 467
  "&DownTee;": { "codepoints": [8868], "characters": "\u22A4" },                                               // 468
  "&drbkarow;": { "codepoints": [10512], "characters": "\u2910" },                                             // 469
  "&drcorn;": { "codepoints": [8991], "characters": "\u231F" },                                                // 470
  "&drcrop;": { "codepoints": [8972], "characters": "\u230C" },                                                // 471
  "&Dscr;": { "codepoints": [119967], "characters": "\uD835\uDC9F" },                                          // 472
  "&dscr;": { "codepoints": [119993], "characters": "\uD835\uDCB9" },                                          // 473
  "&DScy;": { "codepoints": [1029], "characters": "\u0405" },                                                  // 474
  "&dscy;": { "codepoints": [1109], "characters": "\u0455" },                                                  // 475
  "&dsol;": { "codepoints": [10742], "characters": "\u29F6" },                                                 // 476
  "&Dstrok;": { "codepoints": [272], "characters": "\u0110" },                                                 // 477
  "&dstrok;": { "codepoints": [273], "characters": "\u0111" },                                                 // 478
  "&dtdot;": { "codepoints": [8945], "characters": "\u22F1" },                                                 // 479
  "&dtri;": { "codepoints": [9663], "characters": "\u25BF" },                                                  // 480
  "&dtrif;": { "codepoints": [9662], "characters": "\u25BE" },                                                 // 481
  "&duarr;": { "codepoints": [8693], "characters": "\u21F5" },                                                 // 482
  "&duhar;": { "codepoints": [10607], "characters": "\u296F" },                                                // 483
  "&dwangle;": { "codepoints": [10662], "characters": "\u29A6" },                                              // 484
  "&DZcy;": { "codepoints": [1039], "characters": "\u040F" },                                                  // 485
  "&dzcy;": { "codepoints": [1119], "characters": "\u045F" },                                                  // 486
  "&dzigrarr;": { "codepoints": [10239], "characters": "\u27FF" },                                             // 487
  "&Eacute;": { "codepoints": [201], "characters": "\u00C9" },                                                 // 488
  "&Eacute": { "codepoints": [201], "characters": "\u00C9" },                                                  // 489
  "&eacute;": { "codepoints": [233], "characters": "\u00E9" },                                                 // 490
  "&eacute": { "codepoints": [233], "characters": "\u00E9" },                                                  // 491
  "&easter;": { "codepoints": [10862], "characters": "\u2A6E" },                                               // 492
  "&Ecaron;": { "codepoints": [282], "characters": "\u011A" },                                                 // 493
  "&ecaron;": { "codepoints": [283], "characters": "\u011B" },                                                 // 494
  "&Ecirc;": { "codepoints": [202], "characters": "\u00CA" },                                                  // 495
  "&Ecirc": { "codepoints": [202], "characters": "\u00CA" },                                                   // 496
  "&ecirc;": { "codepoints": [234], "characters": "\u00EA" },                                                  // 497
  "&ecirc": { "codepoints": [234], "characters": "\u00EA" },                                                   // 498
  "&ecir;": { "codepoints": [8790], "characters": "\u2256" },                                                  // 499
  "&ecolon;": { "codepoints": [8789], "characters": "\u2255" },                                                // 500
  "&Ecy;": { "codepoints": [1069], "characters": "\u042D" },                                                   // 501
  "&ecy;": { "codepoints": [1101], "characters": "\u044D" },                                                   // 502
  "&eDDot;": { "codepoints": [10871], "characters": "\u2A77" },                                                // 503
  "&Edot;": { "codepoints": [278], "characters": "\u0116" },                                                   // 504
  "&edot;": { "codepoints": [279], "characters": "\u0117" },                                                   // 505
  "&eDot;": { "codepoints": [8785], "characters": "\u2251" },                                                  // 506
  "&ee;": { "codepoints": [8519], "characters": "\u2147" },                                                    // 507
  "&efDot;": { "codepoints": [8786], "characters": "\u2252" },                                                 // 508
  "&Efr;": { "codepoints": [120072], "characters": "\uD835\uDD08" },                                           // 509
  "&efr;": { "codepoints": [120098], "characters": "\uD835\uDD22" },                                           // 510
  "&eg;": { "codepoints": [10906], "characters": "\u2A9A" },                                                   // 511
  "&Egrave;": { "codepoints": [200], "characters": "\u00C8" },                                                 // 512
  "&Egrave": { "codepoints": [200], "characters": "\u00C8" },                                                  // 513
  "&egrave;": { "codepoints": [232], "characters": "\u00E8" },                                                 // 514
  "&egrave": { "codepoints": [232], "characters": "\u00E8" },                                                  // 515
  "&egs;": { "codepoints": [10902], "characters": "\u2A96" },                                                  // 516
  "&egsdot;": { "codepoints": [10904], "characters": "\u2A98" },                                               // 517
  "&el;": { "codepoints": [10905], "characters": "\u2A99" },                                                   // 518
  "&Element;": { "codepoints": [8712], "characters": "\u2208" },                                               // 519
  "&elinters;": { "codepoints": [9191], "characters": "\u23E7" },                                              // 520
  "&ell;": { "codepoints": [8467], "characters": "\u2113" },                                                   // 521
  "&els;": { "codepoints": [10901], "characters": "\u2A95" },                                                  // 522
  "&elsdot;": { "codepoints": [10903], "characters": "\u2A97" },                                               // 523
  "&Emacr;": { "codepoints": [274], "characters": "\u0112" },                                                  // 524
  "&emacr;": { "codepoints": [275], "characters": "\u0113" },                                                  // 525
  "&empty;": { "codepoints": [8709], "characters": "\u2205" },                                                 // 526
  "&emptyset;": { "codepoints": [8709], "characters": "\u2205" },                                              // 527
  "&EmptySmallSquare;": { "codepoints": [9723], "characters": "\u25FB" },                                      // 528
  "&emptyv;": { "codepoints": [8709], "characters": "\u2205" },                                                // 529
  "&EmptyVerySmallSquare;": { "codepoints": [9643], "characters": "\u25AB" },                                  // 530
  "&emsp13;": { "codepoints": [8196], "characters": "\u2004" },                                                // 531
  "&emsp14;": { "codepoints": [8197], "characters": "\u2005" },                                                // 532
  "&emsp;": { "codepoints": [8195], "characters": "\u2003" },                                                  // 533
  "&ENG;": { "codepoints": [330], "characters": "\u014A" },                                                    // 534
  "&eng;": { "codepoints": [331], "characters": "\u014B" },                                                    // 535
  "&ensp;": { "codepoints": [8194], "characters": "\u2002" },                                                  // 536
  "&Eogon;": { "codepoints": [280], "characters": "\u0118" },                                                  // 537
  "&eogon;": { "codepoints": [281], "characters": "\u0119" },                                                  // 538
  "&Eopf;": { "codepoints": [120124], "characters": "\uD835\uDD3C" },                                          // 539
  "&eopf;": { "codepoints": [120150], "characters": "\uD835\uDD56" },                                          // 540
  "&epar;": { "codepoints": [8917], "characters": "\u22D5" },                                                  // 541
  "&eparsl;": { "codepoints": [10723], "characters": "\u29E3" },                                               // 542
  "&eplus;": { "codepoints": [10865], "characters": "\u2A71" },                                                // 543
  "&epsi;": { "codepoints": [949], "characters": "\u03B5" },                                                   // 544
  "&Epsilon;": { "codepoints": [917], "characters": "\u0395" },                                                // 545
  "&epsilon;": { "codepoints": [949], "characters": "\u03B5" },                                                // 546
  "&epsiv;": { "codepoints": [1013], "characters": "\u03F5" },                                                 // 547
  "&eqcirc;": { "codepoints": [8790], "characters": "\u2256" },                                                // 548
  "&eqcolon;": { "codepoints": [8789], "characters": "\u2255" },                                               // 549
  "&eqsim;": { "codepoints": [8770], "characters": "\u2242" },                                                 // 550
  "&eqslantgtr;": { "codepoints": [10902], "characters": "\u2A96" },                                           // 551
  "&eqslantless;": { "codepoints": [10901], "characters": "\u2A95" },                                          // 552
  "&Equal;": { "codepoints": [10869], "characters": "\u2A75" },                                                // 553
  "&equals;": { "codepoints": [61], "characters": "\u003D" },                                                  // 554
  "&EqualTilde;": { "codepoints": [8770], "characters": "\u2242" },                                            // 555
  "&equest;": { "codepoints": [8799], "characters": "\u225F" },                                                // 556
  "&Equilibrium;": { "codepoints": [8652], "characters": "\u21CC" },                                           // 557
  "&equiv;": { "codepoints": [8801], "characters": "\u2261" },                                                 // 558
  "&equivDD;": { "codepoints": [10872], "characters": "\u2A78" },                                              // 559
  "&eqvparsl;": { "codepoints": [10725], "characters": "\u29E5" },                                             // 560
  "&erarr;": { "codepoints": [10609], "characters": "\u2971" },                                                // 561
  "&erDot;": { "codepoints": [8787], "characters": "\u2253" },                                                 // 562
  "&escr;": { "codepoints": [8495], "characters": "\u212F" },                                                  // 563
  "&Escr;": { "codepoints": [8496], "characters": "\u2130" },                                                  // 564
  "&esdot;": { "codepoints": [8784], "characters": "\u2250" },                                                 // 565
  "&Esim;": { "codepoints": [10867], "characters": "\u2A73" },                                                 // 566
  "&esim;": { "codepoints": [8770], "characters": "\u2242" },                                                  // 567
  "&Eta;": { "codepoints": [919], "characters": "\u0397" },                                                    // 568
  "&eta;": { "codepoints": [951], "characters": "\u03B7" },                                                    // 569
  "&ETH;": { "codepoints": [208], "characters": "\u00D0" },                                                    // 570
  "&ETH": { "codepoints": [208], "characters": "\u00D0" },                                                     // 571
  "&eth;": { "codepoints": [240], "characters": "\u00F0" },                                                    // 572
  "&eth": { "codepoints": [240], "characters": "\u00F0" },                                                     // 573
  "&Euml;": { "codepoints": [203], "characters": "\u00CB" },                                                   // 574
  "&Euml": { "codepoints": [203], "characters": "\u00CB" },                                                    // 575
  "&euml;": { "codepoints": [235], "characters": "\u00EB" },                                                   // 576
  "&euml": { "codepoints": [235], "characters": "\u00EB" },                                                    // 577
  "&euro;": { "codepoints": [8364], "characters": "\u20AC" },                                                  // 578
  "&excl;": { "codepoints": [33], "characters": "\u0021" },                                                    // 579
  "&exist;": { "codepoints": [8707], "characters": "\u2203" },                                                 // 580
  "&Exists;": { "codepoints": [8707], "characters": "\u2203" },                                                // 581
  "&expectation;": { "codepoints": [8496], "characters": "\u2130" },                                           // 582
  "&exponentiale;": { "codepoints": [8519], "characters": "\u2147" },                                          // 583
  "&ExponentialE;": { "codepoints": [8519], "characters": "\u2147" },                                          // 584
  "&fallingdotseq;": { "codepoints": [8786], "characters": "\u2252" },                                         // 585
  "&Fcy;": { "codepoints": [1060], "characters": "\u0424" },                                                   // 586
  "&fcy;": { "codepoints": [1092], "characters": "\u0444" },                                                   // 587
  "&female;": { "codepoints": [9792], "characters": "\u2640" },                                                // 588
  "&ffilig;": { "codepoints": [64259], "characters": "\uFB03" },                                               // 589
  "&fflig;": { "codepoints": [64256], "characters": "\uFB00" },                                                // 590
  "&ffllig;": { "codepoints": [64260], "characters": "\uFB04" },                                               // 591
  "&Ffr;": { "codepoints": [120073], "characters": "\uD835\uDD09" },                                           // 592
  "&ffr;": { "codepoints": [120099], "characters": "\uD835\uDD23" },                                           // 593
  "&filig;": { "codepoints": [64257], "characters": "\uFB01" },                                                // 594
  "&FilledSmallSquare;": { "codepoints": [9724], "characters": "\u25FC" },                                     // 595
  "&FilledVerySmallSquare;": { "codepoints": [9642], "characters": "\u25AA" },                                 // 596
  "&fjlig;": { "codepoints": [102, 106], "characters": "\u0066\u006A" },                                       // 597
  "&flat;": { "codepoints": [9837], "characters": "\u266D" },                                                  // 598
  "&fllig;": { "codepoints": [64258], "characters": "\uFB02" },                                                // 599
  "&fltns;": { "codepoints": [9649], "characters": "\u25B1" },                                                 // 600
  "&fnof;": { "codepoints": [402], "characters": "\u0192" },                                                   // 601
  "&Fopf;": { "codepoints": [120125], "characters": "\uD835\uDD3D" },                                          // 602
  "&fopf;": { "codepoints": [120151], "characters": "\uD835\uDD57" },                                          // 603
  "&forall;": { "codepoints": [8704], "characters": "\u2200" },                                                // 604
  "&ForAll;": { "codepoints": [8704], "characters": "\u2200" },                                                // 605
  "&fork;": { "codepoints": [8916], "characters": "\u22D4" },                                                  // 606
  "&forkv;": { "codepoints": [10969], "characters": "\u2AD9" },                                                // 607
  "&Fouriertrf;": { "codepoints": [8497], "characters": "\u2131" },                                            // 608
  "&fpartint;": { "codepoints": [10765], "characters": "\u2A0D" },                                             // 609
  "&frac12;": { "codepoints": [189], "characters": "\u00BD" },                                                 // 610
  "&frac12": { "codepoints": [189], "characters": "\u00BD" },                                                  // 611
  "&frac13;": { "codepoints": [8531], "characters": "\u2153" },                                                // 612
  "&frac14;": { "codepoints": [188], "characters": "\u00BC" },                                                 // 613
  "&frac14": { "codepoints": [188], "characters": "\u00BC" },                                                  // 614
  "&frac15;": { "codepoints": [8533], "characters": "\u2155" },                                                // 615
  "&frac16;": { "codepoints": [8537], "characters": "\u2159" },                                                // 616
  "&frac18;": { "codepoints": [8539], "characters": "\u215B" },                                                // 617
  "&frac23;": { "codepoints": [8532], "characters": "\u2154" },                                                // 618
  "&frac25;": { "codepoints": [8534], "characters": "\u2156" },                                                // 619
  "&frac34;": { "codepoints": [190], "characters": "\u00BE" },                                                 // 620
  "&frac34": { "codepoints": [190], "characters": "\u00BE" },                                                  // 621
  "&frac35;": { "codepoints": [8535], "characters": "\u2157" },                                                // 622
  "&frac38;": { "codepoints": [8540], "characters": "\u215C" },                                                // 623
  "&frac45;": { "codepoints": [8536], "characters": "\u2158" },                                                // 624
  "&frac56;": { "codepoints": [8538], "characters": "\u215A" },                                                // 625
  "&frac58;": { "codepoints": [8541], "characters": "\u215D" },                                                // 626
  "&frac78;": { "codepoints": [8542], "characters": "\u215E" },                                                // 627
  "&frasl;": { "codepoints": [8260], "characters": "\u2044" },                                                 // 628
  "&frown;": { "codepoints": [8994], "characters": "\u2322" },                                                 // 629
  "&fscr;": { "codepoints": [119995], "characters": "\uD835\uDCBB" },                                          // 630
  "&Fscr;": { "codepoints": [8497], "characters": "\u2131" },                                                  // 631
  "&gacute;": { "codepoints": [501], "characters": "\u01F5" },                                                 // 632
  "&Gamma;": { "codepoints": [915], "characters": "\u0393" },                                                  // 633
  "&gamma;": { "codepoints": [947], "characters": "\u03B3" },                                                  // 634
  "&Gammad;": { "codepoints": [988], "characters": "\u03DC" },                                                 // 635
  "&gammad;": { "codepoints": [989], "characters": "\u03DD" },                                                 // 636
  "&gap;": { "codepoints": [10886], "characters": "\u2A86" },                                                  // 637
  "&Gbreve;": { "codepoints": [286], "characters": "\u011E" },                                                 // 638
  "&gbreve;": { "codepoints": [287], "characters": "\u011F" },                                                 // 639
  "&Gcedil;": { "codepoints": [290], "characters": "\u0122" },                                                 // 640
  "&Gcirc;": { "codepoints": [284], "characters": "\u011C" },                                                  // 641
  "&gcirc;": { "codepoints": [285], "characters": "\u011D" },                                                  // 642
  "&Gcy;": { "codepoints": [1043], "characters": "\u0413" },                                                   // 643
  "&gcy;": { "codepoints": [1075], "characters": "\u0433" },                                                   // 644
  "&Gdot;": { "codepoints": [288], "characters": "\u0120" },                                                   // 645
  "&gdot;": { "codepoints": [289], "characters": "\u0121" },                                                   // 646
  "&ge;": { "codepoints": [8805], "characters": "\u2265" },                                                    // 647
  "&gE;": { "codepoints": [8807], "characters": "\u2267" },                                                    // 648
  "&gEl;": { "codepoints": [10892], "characters": "\u2A8C" },                                                  // 649
  "&gel;": { "codepoints": [8923], "characters": "\u22DB" },                                                   // 650
  "&geq;": { "codepoints": [8805], "characters": "\u2265" },                                                   // 651
  "&geqq;": { "codepoints": [8807], "characters": "\u2267" },                                                  // 652
  "&geqslant;": { "codepoints": [10878], "characters": "\u2A7E" },                                             // 653
  "&gescc;": { "codepoints": [10921], "characters": "\u2AA9" },                                                // 654
  "&ges;": { "codepoints": [10878], "characters": "\u2A7E" },                                                  // 655
  "&gesdot;": { "codepoints": [10880], "characters": "\u2A80" },                                               // 656
  "&gesdoto;": { "codepoints": [10882], "characters": "\u2A82" },                                              // 657
  "&gesdotol;": { "codepoints": [10884], "characters": "\u2A84" },                                             // 658
  "&gesl;": { "codepoints": [8923, 65024], "characters": "\u22DB\uFE00" },                                     // 659
  "&gesles;": { "codepoints": [10900], "characters": "\u2A94" },                                               // 660
  "&Gfr;": { "codepoints": [120074], "characters": "\uD835\uDD0A" },                                           // 661
  "&gfr;": { "codepoints": [120100], "characters": "\uD835\uDD24" },                                           // 662
  "&gg;": { "codepoints": [8811], "characters": "\u226B" },                                                    // 663
  "&Gg;": { "codepoints": [8921], "characters": "\u22D9" },                                                    // 664
  "&ggg;": { "codepoints": [8921], "characters": "\u22D9" },                                                   // 665
  "&gimel;": { "codepoints": [8503], "characters": "\u2137" },                                                 // 666
  "&GJcy;": { "codepoints": [1027], "characters": "\u0403" },                                                  // 667
  "&gjcy;": { "codepoints": [1107], "characters": "\u0453" },                                                  // 668
  "&gla;": { "codepoints": [10917], "characters": "\u2AA5" },                                                  // 669
  "&gl;": { "codepoints": [8823], "characters": "\u2277" },                                                    // 670
  "&glE;": { "codepoints": [10898], "characters": "\u2A92" },                                                  // 671
  "&glj;": { "codepoints": [10916], "characters": "\u2AA4" },                                                  // 672
  "&gnap;": { "codepoints": [10890], "characters": "\u2A8A" },                                                 // 673
  "&gnapprox;": { "codepoints": [10890], "characters": "\u2A8A" },                                             // 674
  "&gne;": { "codepoints": [10888], "characters": "\u2A88" },                                                  // 675
  "&gnE;": { "codepoints": [8809], "characters": "\u2269" },                                                   // 676
  "&gneq;": { "codepoints": [10888], "characters": "\u2A88" },                                                 // 677
  "&gneqq;": { "codepoints": [8809], "characters": "\u2269" },                                                 // 678
  "&gnsim;": { "codepoints": [8935], "characters": "\u22E7" },                                                 // 679
  "&Gopf;": { "codepoints": [120126], "characters": "\uD835\uDD3E" },                                          // 680
  "&gopf;": { "codepoints": [120152], "characters": "\uD835\uDD58" },                                          // 681
  "&grave;": { "codepoints": [96], "characters": "\u0060" },                                                   // 682
  "&GreaterEqual;": { "codepoints": [8805], "characters": "\u2265" },                                          // 683
  "&GreaterEqualLess;": { "codepoints": [8923], "characters": "\u22DB" },                                      // 684
  "&GreaterFullEqual;": { "codepoints": [8807], "characters": "\u2267" },                                      // 685
  "&GreaterGreater;": { "codepoints": [10914], "characters": "\u2AA2" },                                       // 686
  "&GreaterLess;": { "codepoints": [8823], "characters": "\u2277" },                                           // 687
  "&GreaterSlantEqual;": { "codepoints": [10878], "characters": "\u2A7E" },                                    // 688
  "&GreaterTilde;": { "codepoints": [8819], "characters": "\u2273" },                                          // 689
  "&Gscr;": { "codepoints": [119970], "characters": "\uD835\uDCA2" },                                          // 690
  "&gscr;": { "codepoints": [8458], "characters": "\u210A" },                                                  // 691
  "&gsim;": { "codepoints": [8819], "characters": "\u2273" },                                                  // 692
  "&gsime;": { "codepoints": [10894], "characters": "\u2A8E" },                                                // 693
  "&gsiml;": { "codepoints": [10896], "characters": "\u2A90" },                                                // 694
  "&gtcc;": { "codepoints": [10919], "characters": "\u2AA7" },                                                 // 695
  "&gtcir;": { "codepoints": [10874], "characters": "\u2A7A" },                                                // 696
  "&gt;": { "codepoints": [62], "characters": "\u003E" },                                                      // 697
  "&gt": { "codepoints": [62], "characters": "\u003E" },                                                       // 698
  "&GT;": { "codepoints": [62], "characters": "\u003E" },                                                      // 699
  "&GT": { "codepoints": [62], "characters": "\u003E" },                                                       // 700
  "&Gt;": { "codepoints": [8811], "characters": "\u226B" },                                                    // 701
  "&gtdot;": { "codepoints": [8919], "characters": "\u22D7" },                                                 // 702
  "&gtlPar;": { "codepoints": [10645], "characters": "\u2995" },                                               // 703
  "&gtquest;": { "codepoints": [10876], "characters": "\u2A7C" },                                              // 704
  "&gtrapprox;": { "codepoints": [10886], "characters": "\u2A86" },                                            // 705
  "&gtrarr;": { "codepoints": [10616], "characters": "\u2978" },                                               // 706
  "&gtrdot;": { "codepoints": [8919], "characters": "\u22D7" },                                                // 707
  "&gtreqless;": { "codepoints": [8923], "characters": "\u22DB" },                                             // 708
  "&gtreqqless;": { "codepoints": [10892], "characters": "\u2A8C" },                                           // 709
  "&gtrless;": { "codepoints": [8823], "characters": "\u2277" },                                               // 710
  "&gtrsim;": { "codepoints": [8819], "characters": "\u2273" },                                                // 711
  "&gvertneqq;": { "codepoints": [8809, 65024], "characters": "\u2269\uFE00" },                                // 712
  "&gvnE;": { "codepoints": [8809, 65024], "characters": "\u2269\uFE00" },                                     // 713
  "&Hacek;": { "codepoints": [711], "characters": "\u02C7" },                                                  // 714
  "&hairsp;": { "codepoints": [8202], "characters": "\u200A" },                                                // 715
  "&half;": { "codepoints": [189], "characters": "\u00BD" },                                                   // 716
  "&hamilt;": { "codepoints": [8459], "characters": "\u210B" },                                                // 717
  "&HARDcy;": { "codepoints": [1066], "characters": "\u042A" },                                                // 718
  "&hardcy;": { "codepoints": [1098], "characters": "\u044A" },                                                // 719
  "&harrcir;": { "codepoints": [10568], "characters": "\u2948" },                                              // 720
  "&harr;": { "codepoints": [8596], "characters": "\u2194" },                                                  // 721
  "&hArr;": { "codepoints": [8660], "characters": "\u21D4" },                                                  // 722
  "&harrw;": { "codepoints": [8621], "characters": "\u21AD" },                                                 // 723
  "&Hat;": { "codepoints": [94], "characters": "\u005E" },                                                     // 724
  "&hbar;": { "codepoints": [8463], "characters": "\u210F" },                                                  // 725
  "&Hcirc;": { "codepoints": [292], "characters": "\u0124" },                                                  // 726
  "&hcirc;": { "codepoints": [293], "characters": "\u0125" },                                                  // 727
  "&hearts;": { "codepoints": [9829], "characters": "\u2665" },                                                // 728
  "&heartsuit;": { "codepoints": [9829], "characters": "\u2665" },                                             // 729
  "&hellip;": { "codepoints": [8230], "characters": "\u2026" },                                                // 730
  "&hercon;": { "codepoints": [8889], "characters": "\u22B9" },                                                // 731
  "&hfr;": { "codepoints": [120101], "characters": "\uD835\uDD25" },                                           // 732
  "&Hfr;": { "codepoints": [8460], "characters": "\u210C" },                                                   // 733
  "&HilbertSpace;": { "codepoints": [8459], "characters": "\u210B" },                                          // 734
  "&hksearow;": { "codepoints": [10533], "characters": "\u2925" },                                             // 735
  "&hkswarow;": { "codepoints": [10534], "characters": "\u2926" },                                             // 736
  "&hoarr;": { "codepoints": [8703], "characters": "\u21FF" },                                                 // 737
  "&homtht;": { "codepoints": [8763], "characters": "\u223B" },                                                // 738
  "&hookleftarrow;": { "codepoints": [8617], "characters": "\u21A9" },                                         // 739
  "&hookrightarrow;": { "codepoints": [8618], "characters": "\u21AA" },                                        // 740
  "&hopf;": { "codepoints": [120153], "characters": "\uD835\uDD59" },                                          // 741
  "&Hopf;": { "codepoints": [8461], "characters": "\u210D" },                                                  // 742
  "&horbar;": { "codepoints": [8213], "characters": "\u2015" },                                                // 743
  "&HorizontalLine;": { "codepoints": [9472], "characters": "\u2500" },                                        // 744
  "&hscr;": { "codepoints": [119997], "characters": "\uD835\uDCBD" },                                          // 745
  "&Hscr;": { "codepoints": [8459], "characters": "\u210B" },                                                  // 746
  "&hslash;": { "codepoints": [8463], "characters": "\u210F" },                                                // 747
  "&Hstrok;": { "codepoints": [294], "characters": "\u0126" },                                                 // 748
  "&hstrok;": { "codepoints": [295], "characters": "\u0127" },                                                 // 749
  "&HumpDownHump;": { "codepoints": [8782], "characters": "\u224E" },                                          // 750
  "&HumpEqual;": { "codepoints": [8783], "characters": "\u224F" },                                             // 751
  "&hybull;": { "codepoints": [8259], "characters": "\u2043" },                                                // 752
  "&hyphen;": { "codepoints": [8208], "characters": "\u2010" },                                                // 753
  "&Iacute;": { "codepoints": [205], "characters": "\u00CD" },                                                 // 754
  "&Iacute": { "codepoints": [205], "characters": "\u00CD" },                                                  // 755
  "&iacute;": { "codepoints": [237], "characters": "\u00ED" },                                                 // 756
  "&iacute": { "codepoints": [237], "characters": "\u00ED" },                                                  // 757
  "&ic;": { "codepoints": [8291], "characters": "\u2063" },                                                    // 758
  "&Icirc;": { "codepoints": [206], "characters": "\u00CE" },                                                  // 759
  "&Icirc": { "codepoints": [206], "characters": "\u00CE" },                                                   // 760
  "&icirc;": { "codepoints": [238], "characters": "\u00EE" },                                                  // 761
  "&icirc": { "codepoints": [238], "characters": "\u00EE" },                                                   // 762
  "&Icy;": { "codepoints": [1048], "characters": "\u0418" },                                                   // 763
  "&icy;": { "codepoints": [1080], "characters": "\u0438" },                                                   // 764
  "&Idot;": { "codepoints": [304], "characters": "\u0130" },                                                   // 765
  "&IEcy;": { "codepoints": [1045], "characters": "\u0415" },                                                  // 766
  "&iecy;": { "codepoints": [1077], "characters": "\u0435" },                                                  // 767
  "&iexcl;": { "codepoints": [161], "characters": "\u00A1" },                                                  // 768
  "&iexcl": { "codepoints": [161], "characters": "\u00A1" },                                                   // 769
  "&iff;": { "codepoints": [8660], "characters": "\u21D4" },                                                   // 770
  "&ifr;": { "codepoints": [120102], "characters": "\uD835\uDD26" },                                           // 771
  "&Ifr;": { "codepoints": [8465], "characters": "\u2111" },                                                   // 772
  "&Igrave;": { "codepoints": [204], "characters": "\u00CC" },                                                 // 773
  "&Igrave": { "codepoints": [204], "characters": "\u00CC" },                                                  // 774
  "&igrave;": { "codepoints": [236], "characters": "\u00EC" },                                                 // 775
  "&igrave": { "codepoints": [236], "characters": "\u00EC" },                                                  // 776
  "&ii;": { "codepoints": [8520], "characters": "\u2148" },                                                    // 777
  "&iiiint;": { "codepoints": [10764], "characters": "\u2A0C" },                                               // 778
  "&iiint;": { "codepoints": [8749], "characters": "\u222D" },                                                 // 779
  "&iinfin;": { "codepoints": [10716], "characters": "\u29DC" },                                               // 780
  "&iiota;": { "codepoints": [8489], "characters": "\u2129" },                                                 // 781
  "&IJlig;": { "codepoints": [306], "characters": "\u0132" },                                                  // 782
  "&ijlig;": { "codepoints": [307], "characters": "\u0133" },                                                  // 783
  "&Imacr;": { "codepoints": [298], "characters": "\u012A" },                                                  // 784
  "&imacr;": { "codepoints": [299], "characters": "\u012B" },                                                  // 785
  "&image;": { "codepoints": [8465], "characters": "\u2111" },                                                 // 786
  "&ImaginaryI;": { "codepoints": [8520], "characters": "\u2148" },                                            // 787
  "&imagline;": { "codepoints": [8464], "characters": "\u2110" },                                              // 788
  "&imagpart;": { "codepoints": [8465], "characters": "\u2111" },                                              // 789
  "&imath;": { "codepoints": [305], "characters": "\u0131" },                                                  // 790
  "&Im;": { "codepoints": [8465], "characters": "\u2111" },                                                    // 791
  "&imof;": { "codepoints": [8887], "characters": "\u22B7" },                                                  // 792
  "&imped;": { "codepoints": [437], "characters": "\u01B5" },                                                  // 793
  "&Implies;": { "codepoints": [8658], "characters": "\u21D2" },                                               // 794
  "&incare;": { "codepoints": [8453], "characters": "\u2105" },                                                // 795
  "&in;": { "codepoints": [8712], "characters": "\u2208" },                                                    // 796
  "&infin;": { "codepoints": [8734], "characters": "\u221E" },                                                 // 797
  "&infintie;": { "codepoints": [10717], "characters": "\u29DD" },                                             // 798
  "&inodot;": { "codepoints": [305], "characters": "\u0131" },                                                 // 799
  "&intcal;": { "codepoints": [8890], "characters": "\u22BA" },                                                // 800
  "&int;": { "codepoints": [8747], "characters": "\u222B" },                                                   // 801
  "&Int;": { "codepoints": [8748], "characters": "\u222C" },                                                   // 802
  "&integers;": { "codepoints": [8484], "characters": "\u2124" },                                              // 803
  "&Integral;": { "codepoints": [8747], "characters": "\u222B" },                                              // 804
  "&intercal;": { "codepoints": [8890], "characters": "\u22BA" },                                              // 805
  "&Intersection;": { "codepoints": [8898], "characters": "\u22C2" },                                          // 806
  "&intlarhk;": { "codepoints": [10775], "characters": "\u2A17" },                                             // 807
  "&intprod;": { "codepoints": [10812], "characters": "\u2A3C" },                                              // 808
  "&InvisibleComma;": { "codepoints": [8291], "characters": "\u2063" },                                        // 809
  "&InvisibleTimes;": { "codepoints": [8290], "characters": "\u2062" },                                        // 810
  "&IOcy;": { "codepoints": [1025], "characters": "\u0401" },                                                  // 811
  "&iocy;": { "codepoints": [1105], "characters": "\u0451" },                                                  // 812
  "&Iogon;": { "codepoints": [302], "characters": "\u012E" },                                                  // 813
  "&iogon;": { "codepoints": [303], "characters": "\u012F" },                                                  // 814
  "&Iopf;": { "codepoints": [120128], "characters": "\uD835\uDD40" },                                          // 815
  "&iopf;": { "codepoints": [120154], "characters": "\uD835\uDD5A" },                                          // 816
  "&Iota;": { "codepoints": [921], "characters": "\u0399" },                                                   // 817
  "&iota;": { "codepoints": [953], "characters": "\u03B9" },                                                   // 818
  "&iprod;": { "codepoints": [10812], "characters": "\u2A3C" },                                                // 819
  "&iquest;": { "codepoints": [191], "characters": "\u00BF" },                                                 // 820
  "&iquest": { "codepoints": [191], "characters": "\u00BF" },                                                  // 821
  "&iscr;": { "codepoints": [119998], "characters": "\uD835\uDCBE" },                                          // 822
  "&Iscr;": { "codepoints": [8464], "characters": "\u2110" },                                                  // 823
  "&isin;": { "codepoints": [8712], "characters": "\u2208" },                                                  // 824
  "&isindot;": { "codepoints": [8949], "characters": "\u22F5" },                                               // 825
  "&isinE;": { "codepoints": [8953], "characters": "\u22F9" },                                                 // 826
  "&isins;": { "codepoints": [8948], "characters": "\u22F4" },                                                 // 827
  "&isinsv;": { "codepoints": [8947], "characters": "\u22F3" },                                                // 828
  "&isinv;": { "codepoints": [8712], "characters": "\u2208" },                                                 // 829
  "&it;": { "codepoints": [8290], "characters": "\u2062" },                                                    // 830
  "&Itilde;": { "codepoints": [296], "characters": "\u0128" },                                                 // 831
  "&itilde;": { "codepoints": [297], "characters": "\u0129" },                                                 // 832
  "&Iukcy;": { "codepoints": [1030], "characters": "\u0406" },                                                 // 833
  "&iukcy;": { "codepoints": [1110], "characters": "\u0456" },                                                 // 834
  "&Iuml;": { "codepoints": [207], "characters": "\u00CF" },                                                   // 835
  "&Iuml": { "codepoints": [207], "characters": "\u00CF" },                                                    // 836
  "&iuml;": { "codepoints": [239], "characters": "\u00EF" },                                                   // 837
  "&iuml": { "codepoints": [239], "characters": "\u00EF" },                                                    // 838
  "&Jcirc;": { "codepoints": [308], "characters": "\u0134" },                                                  // 839
  "&jcirc;": { "codepoints": [309], "characters": "\u0135" },                                                  // 840
  "&Jcy;": { "codepoints": [1049], "characters": "\u0419" },                                                   // 841
  "&jcy;": { "codepoints": [1081], "characters": "\u0439" },                                                   // 842
  "&Jfr;": { "codepoints": [120077], "characters": "\uD835\uDD0D" },                                           // 843
  "&jfr;": { "codepoints": [120103], "characters": "\uD835\uDD27" },                                           // 844
  "&jmath;": { "codepoints": [567], "characters": "\u0237" },                                                  // 845
  "&Jopf;": { "codepoints": [120129], "characters": "\uD835\uDD41" },                                          // 846
  "&jopf;": { "codepoints": [120155], "characters": "\uD835\uDD5B" },                                          // 847
  "&Jscr;": { "codepoints": [119973], "characters": "\uD835\uDCA5" },                                          // 848
  "&jscr;": { "codepoints": [119999], "characters": "\uD835\uDCBF" },                                          // 849
  "&Jsercy;": { "codepoints": [1032], "characters": "\u0408" },                                                // 850
  "&jsercy;": { "codepoints": [1112], "characters": "\u0458" },                                                // 851
  "&Jukcy;": { "codepoints": [1028], "characters": "\u0404" },                                                 // 852
  "&jukcy;": { "codepoints": [1108], "characters": "\u0454" },                                                 // 853
  "&Kappa;": { "codepoints": [922], "characters": "\u039A" },                                                  // 854
  "&kappa;": { "codepoints": [954], "characters": "\u03BA" },                                                  // 855
  "&kappav;": { "codepoints": [1008], "characters": "\u03F0" },                                                // 856
  "&Kcedil;": { "codepoints": [310], "characters": "\u0136" },                                                 // 857
  "&kcedil;": { "codepoints": [311], "characters": "\u0137" },                                                 // 858
  "&Kcy;": { "codepoints": [1050], "characters": "\u041A" },                                                   // 859
  "&kcy;": { "codepoints": [1082], "characters": "\u043A" },                                                   // 860
  "&Kfr;": { "codepoints": [120078], "characters": "\uD835\uDD0E" },                                           // 861
  "&kfr;": { "codepoints": [120104], "characters": "\uD835\uDD28" },                                           // 862
  "&kgreen;": { "codepoints": [312], "characters": "\u0138" },                                                 // 863
  "&KHcy;": { "codepoints": [1061], "characters": "\u0425" },                                                  // 864
  "&khcy;": { "codepoints": [1093], "characters": "\u0445" },                                                  // 865
  "&KJcy;": { "codepoints": [1036], "characters": "\u040C" },                                                  // 866
  "&kjcy;": { "codepoints": [1116], "characters": "\u045C" },                                                  // 867
  "&Kopf;": { "codepoints": [120130], "characters": "\uD835\uDD42" },                                          // 868
  "&kopf;": { "codepoints": [120156], "characters": "\uD835\uDD5C" },                                          // 869
  "&Kscr;": { "codepoints": [119974], "characters": "\uD835\uDCA6" },                                          // 870
  "&kscr;": { "codepoints": [120000], "characters": "\uD835\uDCC0" },                                          // 871
  "&lAarr;": { "codepoints": [8666], "characters": "\u21DA" },                                                 // 872
  "&Lacute;": { "codepoints": [313], "characters": "\u0139" },                                                 // 873
  "&lacute;": { "codepoints": [314], "characters": "\u013A" },                                                 // 874
  "&laemptyv;": { "codepoints": [10676], "characters": "\u29B4" },                                             // 875
  "&lagran;": { "codepoints": [8466], "characters": "\u2112" },                                                // 876
  "&Lambda;": { "codepoints": [923], "characters": "\u039B" },                                                 // 877
  "&lambda;": { "codepoints": [955], "characters": "\u03BB" },                                                 // 878
  "&lang;": { "codepoints": [10216], "characters": "\u27E8" },                                                 // 879
  "&Lang;": { "codepoints": [10218], "characters": "\u27EA" },                                                 // 880
  "&langd;": { "codepoints": [10641], "characters": "\u2991" },                                                // 881
  "&langle;": { "codepoints": [10216], "characters": "\u27E8" },                                               // 882
  "&lap;": { "codepoints": [10885], "characters": "\u2A85" },                                                  // 883
  "&Laplacetrf;": { "codepoints": [8466], "characters": "\u2112" },                                            // 884
  "&laquo;": { "codepoints": [171], "characters": "\u00AB" },                                                  // 885
  "&laquo": { "codepoints": [171], "characters": "\u00AB" },                                                   // 886
  "&larrb;": { "codepoints": [8676], "characters": "\u21E4" },                                                 // 887
  "&larrbfs;": { "codepoints": [10527], "characters": "\u291F" },                                              // 888
  "&larr;": { "codepoints": [8592], "characters": "\u2190" },                                                  // 889
  "&Larr;": { "codepoints": [8606], "characters": "\u219E" },                                                  // 890
  "&lArr;": { "codepoints": [8656], "characters": "\u21D0" },                                                  // 891
  "&larrfs;": { "codepoints": [10525], "characters": "\u291D" },                                               // 892
  "&larrhk;": { "codepoints": [8617], "characters": "\u21A9" },                                                // 893
  "&larrlp;": { "codepoints": [8619], "characters": "\u21AB" },                                                // 894
  "&larrpl;": { "codepoints": [10553], "characters": "\u2939" },                                               // 895
  "&larrsim;": { "codepoints": [10611], "characters": "\u2973" },                                              // 896
  "&larrtl;": { "codepoints": [8610], "characters": "\u21A2" },                                                // 897
  "&latail;": { "codepoints": [10521], "characters": "\u2919" },                                               // 898
  "&lAtail;": { "codepoints": [10523], "characters": "\u291B" },                                               // 899
  "&lat;": { "codepoints": [10923], "characters": "\u2AAB" },                                                  // 900
  "&late;": { "codepoints": [10925], "characters": "\u2AAD" },                                                 // 901
  "&lates;": { "codepoints": [10925, 65024], "characters": "\u2AAD\uFE00" },                                   // 902
  "&lbarr;": { "codepoints": [10508], "characters": "\u290C" },                                                // 903
  "&lBarr;": { "codepoints": [10510], "characters": "\u290E" },                                                // 904
  "&lbbrk;": { "codepoints": [10098], "characters": "\u2772" },                                                // 905
  "&lbrace;": { "codepoints": [123], "characters": "\u007B" },                                                 // 906
  "&lbrack;": { "codepoints": [91], "characters": "\u005B" },                                                  // 907
  "&lbrke;": { "codepoints": [10635], "characters": "\u298B" },                                                // 908
  "&lbrksld;": { "codepoints": [10639], "characters": "\u298F" },                                              // 909
  "&lbrkslu;": { "codepoints": [10637], "characters": "\u298D" },                                              // 910
  "&Lcaron;": { "codepoints": [317], "characters": "\u013D" },                                                 // 911
  "&lcaron;": { "codepoints": [318], "characters": "\u013E" },                                                 // 912
  "&Lcedil;": { "codepoints": [315], "characters": "\u013B" },                                                 // 913
  "&lcedil;": { "codepoints": [316], "characters": "\u013C" },                                                 // 914
  "&lceil;": { "codepoints": [8968], "characters": "\u2308" },                                                 // 915
  "&lcub;": { "codepoints": [123], "characters": "\u007B" },                                                   // 916
  "&Lcy;": { "codepoints": [1051], "characters": "\u041B" },                                                   // 917
  "&lcy;": { "codepoints": [1083], "characters": "\u043B" },                                                   // 918
  "&ldca;": { "codepoints": [10550], "characters": "\u2936" },                                                 // 919
  "&ldquo;": { "codepoints": [8220], "characters": "\u201C" },                                                 // 920
  "&ldquor;": { "codepoints": [8222], "characters": "\u201E" },                                                // 921
  "&ldrdhar;": { "codepoints": [10599], "characters": "\u2967" },                                              // 922
  "&ldrushar;": { "codepoints": [10571], "characters": "\u294B" },                                             // 923
  "&ldsh;": { "codepoints": [8626], "characters": "\u21B2" },                                                  // 924
  "&le;": { "codepoints": [8804], "characters": "\u2264" },                                                    // 925
  "&lE;": { "codepoints": [8806], "characters": "\u2266" },                                                    // 926
  "&LeftAngleBracket;": { "codepoints": [10216], "characters": "\u27E8" },                                     // 927
  "&LeftArrowBar;": { "codepoints": [8676], "characters": "\u21E4" },                                          // 928
  "&leftarrow;": { "codepoints": [8592], "characters": "\u2190" },                                             // 929
  "&LeftArrow;": { "codepoints": [8592], "characters": "\u2190" },                                             // 930
  "&Leftarrow;": { "codepoints": [8656], "characters": "\u21D0" },                                             // 931
  "&LeftArrowRightArrow;": { "codepoints": [8646], "characters": "\u21C6" },                                   // 932
  "&leftarrowtail;": { "codepoints": [8610], "characters": "\u21A2" },                                         // 933
  "&LeftCeiling;": { "codepoints": [8968], "characters": "\u2308" },                                           // 934
  "&LeftDoubleBracket;": { "codepoints": [10214], "characters": "\u27E6" },                                    // 935
  "&LeftDownTeeVector;": { "codepoints": [10593], "characters": "\u2961" },                                    // 936
  "&LeftDownVectorBar;": { "codepoints": [10585], "characters": "\u2959" },                                    // 937
  "&LeftDownVector;": { "codepoints": [8643], "characters": "\u21C3" },                                        // 938
  "&LeftFloor;": { "codepoints": [8970], "characters": "\u230A" },                                             // 939
  "&leftharpoondown;": { "codepoints": [8637], "characters": "\u21BD" },                                       // 940
  "&leftharpoonup;": { "codepoints": [8636], "characters": "\u21BC" },                                         // 941
  "&leftleftarrows;": { "codepoints": [8647], "characters": "\u21C7" },                                        // 942
  "&leftrightarrow;": { "codepoints": [8596], "characters": "\u2194" },                                        // 943
  "&LeftRightArrow;": { "codepoints": [8596], "characters": "\u2194" },                                        // 944
  "&Leftrightarrow;": { "codepoints": [8660], "characters": "\u21D4" },                                        // 945
  "&leftrightarrows;": { "codepoints": [8646], "characters": "\u21C6" },                                       // 946
  "&leftrightharpoons;": { "codepoints": [8651], "characters": "\u21CB" },                                     // 947
  "&leftrightsquigarrow;": { "codepoints": [8621], "characters": "\u21AD" },                                   // 948
  "&LeftRightVector;": { "codepoints": [10574], "characters": "\u294E" },                                      // 949
  "&LeftTeeArrow;": { "codepoints": [8612], "characters": "\u21A4" },                                          // 950
  "&LeftTee;": { "codepoints": [8867], "characters": "\u22A3" },                                               // 951
  "&LeftTeeVector;": { "codepoints": [10586], "characters": "\u295A" },                                        // 952
  "&leftthreetimes;": { "codepoints": [8907], "characters": "\u22CB" },                                        // 953
  "&LeftTriangleBar;": { "codepoints": [10703], "characters": "\u29CF" },                                      // 954
  "&LeftTriangle;": { "codepoints": [8882], "characters": "\u22B2" },                                          // 955
  "&LeftTriangleEqual;": { "codepoints": [8884], "characters": "\u22B4" },                                     // 956
  "&LeftUpDownVector;": { "codepoints": [10577], "characters": "\u2951" },                                     // 957
  "&LeftUpTeeVector;": { "codepoints": [10592], "characters": "\u2960" },                                      // 958
  "&LeftUpVectorBar;": { "codepoints": [10584], "characters": "\u2958" },                                      // 959
  "&LeftUpVector;": { "codepoints": [8639], "characters": "\u21BF" },                                          // 960
  "&LeftVectorBar;": { "codepoints": [10578], "characters": "\u2952" },                                        // 961
  "&LeftVector;": { "codepoints": [8636], "characters": "\u21BC" },                                            // 962
  "&lEg;": { "codepoints": [10891], "characters": "\u2A8B" },                                                  // 963
  "&leg;": { "codepoints": [8922], "characters": "\u22DA" },                                                   // 964
  "&leq;": { "codepoints": [8804], "characters": "\u2264" },                                                   // 965
  "&leqq;": { "codepoints": [8806], "characters": "\u2266" },                                                  // 966
  "&leqslant;": { "codepoints": [10877], "characters": "\u2A7D" },                                             // 967
  "&lescc;": { "codepoints": [10920], "characters": "\u2AA8" },                                                // 968
  "&les;": { "codepoints": [10877], "characters": "\u2A7D" },                                                  // 969
  "&lesdot;": { "codepoints": [10879], "characters": "\u2A7F" },                                               // 970
  "&lesdoto;": { "codepoints": [10881], "characters": "\u2A81" },                                              // 971
  "&lesdotor;": { "codepoints": [10883], "characters": "\u2A83" },                                             // 972
  "&lesg;": { "codepoints": [8922, 65024], "characters": "\u22DA\uFE00" },                                     // 973
  "&lesges;": { "codepoints": [10899], "characters": "\u2A93" },                                               // 974
  "&lessapprox;": { "codepoints": [10885], "characters": "\u2A85" },                                           // 975
  "&lessdot;": { "codepoints": [8918], "characters": "\u22D6" },                                               // 976
  "&lesseqgtr;": { "codepoints": [8922], "characters": "\u22DA" },                                             // 977
  "&lesseqqgtr;": { "codepoints": [10891], "characters": "\u2A8B" },                                           // 978
  "&LessEqualGreater;": { "codepoints": [8922], "characters": "\u22DA" },                                      // 979
  "&LessFullEqual;": { "codepoints": [8806], "characters": "\u2266" },                                         // 980
  "&LessGreater;": { "codepoints": [8822], "characters": "\u2276" },                                           // 981
  "&lessgtr;": { "codepoints": [8822], "characters": "\u2276" },                                               // 982
  "&LessLess;": { "codepoints": [10913], "characters": "\u2AA1" },                                             // 983
  "&lesssim;": { "codepoints": [8818], "characters": "\u2272" },                                               // 984
  "&LessSlantEqual;": { "codepoints": [10877], "characters": "\u2A7D" },                                       // 985
  "&LessTilde;": { "codepoints": [8818], "characters": "\u2272" },                                             // 986
  "&lfisht;": { "codepoints": [10620], "characters": "\u297C" },                                               // 987
  "&lfloor;": { "codepoints": [8970], "characters": "\u230A" },                                                // 988
  "&Lfr;": { "codepoints": [120079], "characters": "\uD835\uDD0F" },                                           // 989
  "&lfr;": { "codepoints": [120105], "characters": "\uD835\uDD29" },                                           // 990
  "&lg;": { "codepoints": [8822], "characters": "\u2276" },                                                    // 991
  "&lgE;": { "codepoints": [10897], "characters": "\u2A91" },                                                  // 992
  "&lHar;": { "codepoints": [10594], "characters": "\u2962" },                                                 // 993
  "&lhard;": { "codepoints": [8637], "characters": "\u21BD" },                                                 // 994
  "&lharu;": { "codepoints": [8636], "characters": "\u21BC" },                                                 // 995
  "&lharul;": { "codepoints": [10602], "characters": "\u296A" },                                               // 996
  "&lhblk;": { "codepoints": [9604], "characters": "\u2584" },                                                 // 997
  "&LJcy;": { "codepoints": [1033], "characters": "\u0409" },                                                  // 998
  "&ljcy;": { "codepoints": [1113], "characters": "\u0459" },                                                  // 999
  "&llarr;": { "codepoints": [8647], "characters": "\u21C7" },                                                 // 1000
  "&ll;": { "codepoints": [8810], "characters": "\u226A" },                                                    // 1001
  "&Ll;": { "codepoints": [8920], "characters": "\u22D8" },                                                    // 1002
  "&llcorner;": { "codepoints": [8990], "characters": "\u231E" },                                              // 1003
  "&Lleftarrow;": { "codepoints": [8666], "characters": "\u21DA" },                                            // 1004
  "&llhard;": { "codepoints": [10603], "characters": "\u296B" },                                               // 1005
  "&lltri;": { "codepoints": [9722], "characters": "\u25FA" },                                                 // 1006
  "&Lmidot;": { "codepoints": [319], "characters": "\u013F" },                                                 // 1007
  "&lmidot;": { "codepoints": [320], "characters": "\u0140" },                                                 // 1008
  "&lmoustache;": { "codepoints": [9136], "characters": "\u23B0" },                                            // 1009
  "&lmoust;": { "codepoints": [9136], "characters": "\u23B0" },                                                // 1010
  "&lnap;": { "codepoints": [10889], "characters": "\u2A89" },                                                 // 1011
  "&lnapprox;": { "codepoints": [10889], "characters": "\u2A89" },                                             // 1012
  "&lne;": { "codepoints": [10887], "characters": "\u2A87" },                                                  // 1013
  "&lnE;": { "codepoints": [8808], "characters": "\u2268" },                                                   // 1014
  "&lneq;": { "codepoints": [10887], "characters": "\u2A87" },                                                 // 1015
  "&lneqq;": { "codepoints": [8808], "characters": "\u2268" },                                                 // 1016
  "&lnsim;": { "codepoints": [8934], "characters": "\u22E6" },                                                 // 1017
  "&loang;": { "codepoints": [10220], "characters": "\u27EC" },                                                // 1018
  "&loarr;": { "codepoints": [8701], "characters": "\u21FD" },                                                 // 1019
  "&lobrk;": { "codepoints": [10214], "characters": "\u27E6" },                                                // 1020
  "&longleftarrow;": { "codepoints": [10229], "characters": "\u27F5" },                                        // 1021
  "&LongLeftArrow;": { "codepoints": [10229], "characters": "\u27F5" },                                        // 1022
  "&Longleftarrow;": { "codepoints": [10232], "characters": "\u27F8" },                                        // 1023
  "&longleftrightarrow;": { "codepoints": [10231], "characters": "\u27F7" },                                   // 1024
  "&LongLeftRightArrow;": { "codepoints": [10231], "characters": "\u27F7" },                                   // 1025
  "&Longleftrightarrow;": { "codepoints": [10234], "characters": "\u27FA" },                                   // 1026
  "&longmapsto;": { "codepoints": [10236], "characters": "\u27FC" },                                           // 1027
  "&longrightarrow;": { "codepoints": [10230], "characters": "\u27F6" },                                       // 1028
  "&LongRightArrow;": { "codepoints": [10230], "characters": "\u27F6" },                                       // 1029
  "&Longrightarrow;": { "codepoints": [10233], "characters": "\u27F9" },                                       // 1030
  "&looparrowleft;": { "codepoints": [8619], "characters": "\u21AB" },                                         // 1031
  "&looparrowright;": { "codepoints": [8620], "characters": "\u21AC" },                                        // 1032
  "&lopar;": { "codepoints": [10629], "characters": "\u2985" },                                                // 1033
  "&Lopf;": { "codepoints": [120131], "characters": "\uD835\uDD43" },                                          // 1034
  "&lopf;": { "codepoints": [120157], "characters": "\uD835\uDD5D" },                                          // 1035
  "&loplus;": { "codepoints": [10797], "characters": "\u2A2D" },                                               // 1036
  "&lotimes;": { "codepoints": [10804], "characters": "\u2A34" },                                              // 1037
  "&lowast;": { "codepoints": [8727], "characters": "\u2217" },                                                // 1038
  "&lowbar;": { "codepoints": [95], "characters": "\u005F" },                                                  // 1039
  "&LowerLeftArrow;": { "codepoints": [8601], "characters": "\u2199" },                                        // 1040
  "&LowerRightArrow;": { "codepoints": [8600], "characters": "\u2198" },                                       // 1041
  "&loz;": { "codepoints": [9674], "characters": "\u25CA" },                                                   // 1042
  "&lozenge;": { "codepoints": [9674], "characters": "\u25CA" },                                               // 1043
  "&lozf;": { "codepoints": [10731], "characters": "\u29EB" },                                                 // 1044
  "&lpar;": { "codepoints": [40], "characters": "\u0028" },                                                    // 1045
  "&lparlt;": { "codepoints": [10643], "characters": "\u2993" },                                               // 1046
  "&lrarr;": { "codepoints": [8646], "characters": "\u21C6" },                                                 // 1047
  "&lrcorner;": { "codepoints": [8991], "characters": "\u231F" },                                              // 1048
  "&lrhar;": { "codepoints": [8651], "characters": "\u21CB" },                                                 // 1049
  "&lrhard;": { "codepoints": [10605], "characters": "\u296D" },                                               // 1050
  "&lrm;": { "codepoints": [8206], "characters": "\u200E" },                                                   // 1051
  "&lrtri;": { "codepoints": [8895], "characters": "\u22BF" },                                                 // 1052
  "&lsaquo;": { "codepoints": [8249], "characters": "\u2039" },                                                // 1053
  "&lscr;": { "codepoints": [120001], "characters": "\uD835\uDCC1" },                                          // 1054
  "&Lscr;": { "codepoints": [8466], "characters": "\u2112" },                                                  // 1055
  "&lsh;": { "codepoints": [8624], "characters": "\u21B0" },                                                   // 1056
  "&Lsh;": { "codepoints": [8624], "characters": "\u21B0" },                                                   // 1057
  "&lsim;": { "codepoints": [8818], "characters": "\u2272" },                                                  // 1058
  "&lsime;": { "codepoints": [10893], "characters": "\u2A8D" },                                                // 1059
  "&lsimg;": { "codepoints": [10895], "characters": "\u2A8F" },                                                // 1060
  "&lsqb;": { "codepoints": [91], "characters": "\u005B" },                                                    // 1061
  "&lsquo;": { "codepoints": [8216], "characters": "\u2018" },                                                 // 1062
  "&lsquor;": { "codepoints": [8218], "characters": "\u201A" },                                                // 1063
  "&Lstrok;": { "codepoints": [321], "characters": "\u0141" },                                                 // 1064
  "&lstrok;": { "codepoints": [322], "characters": "\u0142" },                                                 // 1065
  "&ltcc;": { "codepoints": [10918], "characters": "\u2AA6" },                                                 // 1066
  "&ltcir;": { "codepoints": [10873], "characters": "\u2A79" },                                                // 1067
  "&lt;": { "codepoints": [60], "characters": "\u003C" },                                                      // 1068
  "&lt": { "codepoints": [60], "characters": "\u003C" },                                                       // 1069
  "&LT;": { "codepoints": [60], "characters": "\u003C" },                                                      // 1070
  "&LT": { "codepoints": [60], "characters": "\u003C" },                                                       // 1071
  "&Lt;": { "codepoints": [8810], "characters": "\u226A" },                                                    // 1072
  "&ltdot;": { "codepoints": [8918], "characters": "\u22D6" },                                                 // 1073
  "&lthree;": { "codepoints": [8907], "characters": "\u22CB" },                                                // 1074
  "&ltimes;": { "codepoints": [8905], "characters": "\u22C9" },                                                // 1075
  "&ltlarr;": { "codepoints": [10614], "characters": "\u2976" },                                               // 1076
  "&ltquest;": { "codepoints": [10875], "characters": "\u2A7B" },                                              // 1077
  "&ltri;": { "codepoints": [9667], "characters": "\u25C3" },                                                  // 1078
  "&ltrie;": { "codepoints": [8884], "characters": "\u22B4" },                                                 // 1079
  "&ltrif;": { "codepoints": [9666], "characters": "\u25C2" },                                                 // 1080
  "&ltrPar;": { "codepoints": [10646], "characters": "\u2996" },                                               // 1081
  "&lurdshar;": { "codepoints": [10570], "characters": "\u294A" },                                             // 1082
  "&luruhar;": { "codepoints": [10598], "characters": "\u2966" },                                              // 1083
  "&lvertneqq;": { "codepoints": [8808, 65024], "characters": "\u2268\uFE00" },                                // 1084
  "&lvnE;": { "codepoints": [8808, 65024], "characters": "\u2268\uFE00" },                                     // 1085
  "&macr;": { "codepoints": [175], "characters": "\u00AF" },                                                   // 1086
  "&macr": { "codepoints": [175], "characters": "\u00AF" },                                                    // 1087
  "&male;": { "codepoints": [9794], "characters": "\u2642" },                                                  // 1088
  "&malt;": { "codepoints": [10016], "characters": "\u2720" },                                                 // 1089
  "&maltese;": { "codepoints": [10016], "characters": "\u2720" },                                              // 1090
  "&Map;": { "codepoints": [10501], "characters": "\u2905" },                                                  // 1091
  "&map;": { "codepoints": [8614], "characters": "\u21A6" },                                                   // 1092
  "&mapsto;": { "codepoints": [8614], "characters": "\u21A6" },                                                // 1093
  "&mapstodown;": { "codepoints": [8615], "characters": "\u21A7" },                                            // 1094
  "&mapstoleft;": { "codepoints": [8612], "characters": "\u21A4" },                                            // 1095
  "&mapstoup;": { "codepoints": [8613], "characters": "\u21A5" },                                              // 1096
  "&marker;": { "codepoints": [9646], "characters": "\u25AE" },                                                // 1097
  "&mcomma;": { "codepoints": [10793], "characters": "\u2A29" },                                               // 1098
  "&Mcy;": { "codepoints": [1052], "characters": "\u041C" },                                                   // 1099
  "&mcy;": { "codepoints": [1084], "characters": "\u043C" },                                                   // 1100
  "&mdash;": { "codepoints": [8212], "characters": "\u2014" },                                                 // 1101
  "&mDDot;": { "codepoints": [8762], "characters": "\u223A" },                                                 // 1102
  "&measuredangle;": { "codepoints": [8737], "characters": "\u2221" },                                         // 1103
  "&MediumSpace;": { "codepoints": [8287], "characters": "\u205F" },                                           // 1104
  "&Mellintrf;": { "codepoints": [8499], "characters": "\u2133" },                                             // 1105
  "&Mfr;": { "codepoints": [120080], "characters": "\uD835\uDD10" },                                           // 1106
  "&mfr;": { "codepoints": [120106], "characters": "\uD835\uDD2A" },                                           // 1107
  "&mho;": { "codepoints": [8487], "characters": "\u2127" },                                                   // 1108
  "&micro;": { "codepoints": [181], "characters": "\u00B5" },                                                  // 1109
  "&micro": { "codepoints": [181], "characters": "\u00B5" },                                                   // 1110
  "&midast;": { "codepoints": [42], "characters": "\u002A" },                                                  // 1111
  "&midcir;": { "codepoints": [10992], "characters": "\u2AF0" },                                               // 1112
  "&mid;": { "codepoints": [8739], "characters": "\u2223" },                                                   // 1113
  "&middot;": { "codepoints": [183], "characters": "\u00B7" },                                                 // 1114
  "&middot": { "codepoints": [183], "characters": "\u00B7" },                                                  // 1115
  "&minusb;": { "codepoints": [8863], "characters": "\u229F" },                                                // 1116
  "&minus;": { "codepoints": [8722], "characters": "\u2212" },                                                 // 1117
  "&minusd;": { "codepoints": [8760], "characters": "\u2238" },                                                // 1118
  "&minusdu;": { "codepoints": [10794], "characters": "\u2A2A" },                                              // 1119
  "&MinusPlus;": { "codepoints": [8723], "characters": "\u2213" },                                             // 1120
  "&mlcp;": { "codepoints": [10971], "characters": "\u2ADB" },                                                 // 1121
  "&mldr;": { "codepoints": [8230], "characters": "\u2026" },                                                  // 1122
  "&mnplus;": { "codepoints": [8723], "characters": "\u2213" },                                                // 1123
  "&models;": { "codepoints": [8871], "characters": "\u22A7" },                                                // 1124
  "&Mopf;": { "codepoints": [120132], "characters": "\uD835\uDD44" },                                          // 1125
  "&mopf;": { "codepoints": [120158], "characters": "\uD835\uDD5E" },                                          // 1126
  "&mp;": { "codepoints": [8723], "characters": "\u2213" },                                                    // 1127
  "&mscr;": { "codepoints": [120002], "characters": "\uD835\uDCC2" },                                          // 1128
  "&Mscr;": { "codepoints": [8499], "characters": "\u2133" },                                                  // 1129
  "&mstpos;": { "codepoints": [8766], "characters": "\u223E" },                                                // 1130
  "&Mu;": { "codepoints": [924], "characters": "\u039C" },                                                     // 1131
  "&mu;": { "codepoints": [956], "characters": "\u03BC" },                                                     // 1132
  "&multimap;": { "codepoints": [8888], "characters": "\u22B8" },                                              // 1133
  "&mumap;": { "codepoints": [8888], "characters": "\u22B8" },                                                 // 1134
  "&nabla;": { "codepoints": [8711], "characters": "\u2207" },                                                 // 1135
  "&Nacute;": { "codepoints": [323], "characters": "\u0143" },                                                 // 1136
  "&nacute;": { "codepoints": [324], "characters": "\u0144" },                                                 // 1137
  "&nang;": { "codepoints": [8736, 8402], "characters": "\u2220\u20D2" },                                      // 1138
  "&nap;": { "codepoints": [8777], "characters": "\u2249" },                                                   // 1139
  "&napE;": { "codepoints": [10864, 824], "characters": "\u2A70\u0338" },                                      // 1140
  "&napid;": { "codepoints": [8779, 824], "characters": "\u224B\u0338" },                                      // 1141
  "&napos;": { "codepoints": [329], "characters": "\u0149" },                                                  // 1142
  "&napprox;": { "codepoints": [8777], "characters": "\u2249" },                                               // 1143
  "&natural;": { "codepoints": [9838], "characters": "\u266E" },                                               // 1144
  "&naturals;": { "codepoints": [8469], "characters": "\u2115" },                                              // 1145
  "&natur;": { "codepoints": [9838], "characters": "\u266E" },                                                 // 1146
  "&nbsp;": { "codepoints": [160], "characters": "\u00A0" },                                                   // 1147
  "&nbsp": { "codepoints": [160], "characters": "\u00A0" },                                                    // 1148
  "&nbump;": { "codepoints": [8782, 824], "characters": "\u224E\u0338" },                                      // 1149
  "&nbumpe;": { "codepoints": [8783, 824], "characters": "\u224F\u0338" },                                     // 1150
  "&ncap;": { "codepoints": [10819], "characters": "\u2A43" },                                                 // 1151
  "&Ncaron;": { "codepoints": [327], "characters": "\u0147" },                                                 // 1152
  "&ncaron;": { "codepoints": [328], "characters": "\u0148" },                                                 // 1153
  "&Ncedil;": { "codepoints": [325], "characters": "\u0145" },                                                 // 1154
  "&ncedil;": { "codepoints": [326], "characters": "\u0146" },                                                 // 1155
  "&ncong;": { "codepoints": [8775], "characters": "\u2247" },                                                 // 1156
  "&ncongdot;": { "codepoints": [10861, 824], "characters": "\u2A6D\u0338" },                                  // 1157
  "&ncup;": { "codepoints": [10818], "characters": "\u2A42" },                                                 // 1158
  "&Ncy;": { "codepoints": [1053], "characters": "\u041D" },                                                   // 1159
  "&ncy;": { "codepoints": [1085], "characters": "\u043D" },                                                   // 1160
  "&ndash;": { "codepoints": [8211], "characters": "\u2013" },                                                 // 1161
  "&nearhk;": { "codepoints": [10532], "characters": "\u2924" },                                               // 1162
  "&nearr;": { "codepoints": [8599], "characters": "\u2197" },                                                 // 1163
  "&neArr;": { "codepoints": [8663], "characters": "\u21D7" },                                                 // 1164
  "&nearrow;": { "codepoints": [8599], "characters": "\u2197" },                                               // 1165
  "&ne;": { "codepoints": [8800], "characters": "\u2260" },                                                    // 1166
  "&nedot;": { "codepoints": [8784, 824], "characters": "\u2250\u0338" },                                      // 1167
  "&NegativeMediumSpace;": { "codepoints": [8203], "characters": "\u200B" },                                   // 1168
  "&NegativeThickSpace;": { "codepoints": [8203], "characters": "\u200B" },                                    // 1169
  "&NegativeThinSpace;": { "codepoints": [8203], "characters": "\u200B" },                                     // 1170
  "&NegativeVeryThinSpace;": { "codepoints": [8203], "characters": "\u200B" },                                 // 1171
  "&nequiv;": { "codepoints": [8802], "characters": "\u2262" },                                                // 1172
  "&nesear;": { "codepoints": [10536], "characters": "\u2928" },                                               // 1173
  "&nesim;": { "codepoints": [8770, 824], "characters": "\u2242\u0338" },                                      // 1174
  "&NestedGreaterGreater;": { "codepoints": [8811], "characters": "\u226B" },                                  // 1175
  "&NestedLessLess;": { "codepoints": [8810], "characters": "\u226A" },                                        // 1176
  "&NewLine;": { "codepoints": [10], "characters": "\u000A" },                                                 // 1177
  "&nexist;": { "codepoints": [8708], "characters": "\u2204" },                                                // 1178
  "&nexists;": { "codepoints": [8708], "characters": "\u2204" },                                               // 1179
  "&Nfr;": { "codepoints": [120081], "characters": "\uD835\uDD11" },                                           // 1180
  "&nfr;": { "codepoints": [120107], "characters": "\uD835\uDD2B" },                                           // 1181
  "&ngE;": { "codepoints": [8807, 824], "characters": "\u2267\u0338" },                                        // 1182
  "&nge;": { "codepoints": [8817], "characters": "\u2271" },                                                   // 1183
  "&ngeq;": { "codepoints": [8817], "characters": "\u2271" },                                                  // 1184
  "&ngeqq;": { "codepoints": [8807, 824], "characters": "\u2267\u0338" },                                      // 1185
  "&ngeqslant;": { "codepoints": [10878, 824], "characters": "\u2A7E\u0338" },                                 // 1186
  "&nges;": { "codepoints": [10878, 824], "characters": "\u2A7E\u0338" },                                      // 1187
  "&nGg;": { "codepoints": [8921, 824], "characters": "\u22D9\u0338" },                                        // 1188
  "&ngsim;": { "codepoints": [8821], "characters": "\u2275" },                                                 // 1189
  "&nGt;": { "codepoints": [8811, 8402], "characters": "\u226B\u20D2" },                                       // 1190
  "&ngt;": { "codepoints": [8815], "characters": "\u226F" },                                                   // 1191
  "&ngtr;": { "codepoints": [8815], "characters": "\u226F" },                                                  // 1192
  "&nGtv;": { "codepoints": [8811, 824], "characters": "\u226B\u0338" },                                       // 1193
  "&nharr;": { "codepoints": [8622], "characters": "\u21AE" },                                                 // 1194
  "&nhArr;": { "codepoints": [8654], "characters": "\u21CE" },                                                 // 1195
  "&nhpar;": { "codepoints": [10994], "characters": "\u2AF2" },                                                // 1196
  "&ni;": { "codepoints": [8715], "characters": "\u220B" },                                                    // 1197
  "&nis;": { "codepoints": [8956], "characters": "\u22FC" },                                                   // 1198
  "&nisd;": { "codepoints": [8954], "characters": "\u22FA" },                                                  // 1199
  "&niv;": { "codepoints": [8715], "characters": "\u220B" },                                                   // 1200
  "&NJcy;": { "codepoints": [1034], "characters": "\u040A" },                                                  // 1201
  "&njcy;": { "codepoints": [1114], "characters": "\u045A" },                                                  // 1202
  "&nlarr;": { "codepoints": [8602], "characters": "\u219A" },                                                 // 1203
  "&nlArr;": { "codepoints": [8653], "characters": "\u21CD" },                                                 // 1204
  "&nldr;": { "codepoints": [8229], "characters": "\u2025" },                                                  // 1205
  "&nlE;": { "codepoints": [8806, 824], "characters": "\u2266\u0338" },                                        // 1206
  "&nle;": { "codepoints": [8816], "characters": "\u2270" },                                                   // 1207
  "&nleftarrow;": { "codepoints": [8602], "characters": "\u219A" },                                            // 1208
  "&nLeftarrow;": { "codepoints": [8653], "characters": "\u21CD" },                                            // 1209
  "&nleftrightarrow;": { "codepoints": [8622], "characters": "\u21AE" },                                       // 1210
  "&nLeftrightarrow;": { "codepoints": [8654], "characters": "\u21CE" },                                       // 1211
  "&nleq;": { "codepoints": [8816], "characters": "\u2270" },                                                  // 1212
  "&nleqq;": { "codepoints": [8806, 824], "characters": "\u2266\u0338" },                                      // 1213
  "&nleqslant;": { "codepoints": [10877, 824], "characters": "\u2A7D\u0338" },                                 // 1214
  "&nles;": { "codepoints": [10877, 824], "characters": "\u2A7D\u0338" },                                      // 1215
  "&nless;": { "codepoints": [8814], "characters": "\u226E" },                                                 // 1216
  "&nLl;": { "codepoints": [8920, 824], "characters": "\u22D8\u0338" },                                        // 1217
  "&nlsim;": { "codepoints": [8820], "characters": "\u2274" },                                                 // 1218
  "&nLt;": { "codepoints": [8810, 8402], "characters": "\u226A\u20D2" },                                       // 1219
  "&nlt;": { "codepoints": [8814], "characters": "\u226E" },                                                   // 1220
  "&nltri;": { "codepoints": [8938], "characters": "\u22EA" },                                                 // 1221
  "&nltrie;": { "codepoints": [8940], "characters": "\u22EC" },                                                // 1222
  "&nLtv;": { "codepoints": [8810, 824], "characters": "\u226A\u0338" },                                       // 1223
  "&nmid;": { "codepoints": [8740], "characters": "\u2224" },                                                  // 1224
  "&NoBreak;": { "codepoints": [8288], "characters": "\u2060" },                                               // 1225
  "&NonBreakingSpace;": { "codepoints": [160], "characters": "\u00A0" },                                       // 1226
  "&nopf;": { "codepoints": [120159], "characters": "\uD835\uDD5F" },                                          // 1227
  "&Nopf;": { "codepoints": [8469], "characters": "\u2115" },                                                  // 1228
  "&Not;": { "codepoints": [10988], "characters": "\u2AEC" },                                                  // 1229
  "&not;": { "codepoints": [172], "characters": "\u00AC" },                                                    // 1230
  "&not": { "codepoints": [172], "characters": "\u00AC" },                                                     // 1231
  "&NotCongruent;": { "codepoints": [8802], "characters": "\u2262" },                                          // 1232
  "&NotCupCap;": { "codepoints": [8813], "characters": "\u226D" },                                             // 1233
  "&NotDoubleVerticalBar;": { "codepoints": [8742], "characters": "\u2226" },                                  // 1234
  "&NotElement;": { "codepoints": [8713], "characters": "\u2209" },                                            // 1235
  "&NotEqual;": { "codepoints": [8800], "characters": "\u2260" },                                              // 1236
  "&NotEqualTilde;": { "codepoints": [8770, 824], "characters": "\u2242\u0338" },                              // 1237
  "&NotExists;": { "codepoints": [8708], "characters": "\u2204" },                                             // 1238
  "&NotGreater;": { "codepoints": [8815], "characters": "\u226F" },                                            // 1239
  "&NotGreaterEqual;": { "codepoints": [8817], "characters": "\u2271" },                                       // 1240
  "&NotGreaterFullEqual;": { "codepoints": [8807, 824], "characters": "\u2267\u0338" },                        // 1241
  "&NotGreaterGreater;": { "codepoints": [8811, 824], "characters": "\u226B\u0338" },                          // 1242
  "&NotGreaterLess;": { "codepoints": [8825], "characters": "\u2279" },                                        // 1243
  "&NotGreaterSlantEqual;": { "codepoints": [10878, 824], "characters": "\u2A7E\u0338" },                      // 1244
  "&NotGreaterTilde;": { "codepoints": [8821], "characters": "\u2275" },                                       // 1245
  "&NotHumpDownHump;": { "codepoints": [8782, 824], "characters": "\u224E\u0338" },                            // 1246
  "&NotHumpEqual;": { "codepoints": [8783, 824], "characters": "\u224F\u0338" },                               // 1247
  "&notin;": { "codepoints": [8713], "characters": "\u2209" },                                                 // 1248
  "&notindot;": { "codepoints": [8949, 824], "characters": "\u22F5\u0338" },                                   // 1249
  "&notinE;": { "codepoints": [8953, 824], "characters": "\u22F9\u0338" },                                     // 1250
  "&notinva;": { "codepoints": [8713], "characters": "\u2209" },                                               // 1251
  "&notinvb;": { "codepoints": [8951], "characters": "\u22F7" },                                               // 1252
  "&notinvc;": { "codepoints": [8950], "characters": "\u22F6" },                                               // 1253
  "&NotLeftTriangleBar;": { "codepoints": [10703, 824], "characters": "\u29CF\u0338" },                        // 1254
  "&NotLeftTriangle;": { "codepoints": [8938], "characters": "\u22EA" },                                       // 1255
  "&NotLeftTriangleEqual;": { "codepoints": [8940], "characters": "\u22EC" },                                  // 1256
  "&NotLess;": { "codepoints": [8814], "characters": "\u226E" },                                               // 1257
  "&NotLessEqual;": { "codepoints": [8816], "characters": "\u2270" },                                          // 1258
  "&NotLessGreater;": { "codepoints": [8824], "characters": "\u2278" },                                        // 1259
  "&NotLessLess;": { "codepoints": [8810, 824], "characters": "\u226A\u0338" },                                // 1260
  "&NotLessSlantEqual;": { "codepoints": [10877, 824], "characters": "\u2A7D\u0338" },                         // 1261
  "&NotLessTilde;": { "codepoints": [8820], "characters": "\u2274" },                                          // 1262
  "&NotNestedGreaterGreater;": { "codepoints": [10914, 824], "characters": "\u2AA2\u0338" },                   // 1263
  "&NotNestedLessLess;": { "codepoints": [10913, 824], "characters": "\u2AA1\u0338" },                         // 1264
  "&notni;": { "codepoints": [8716], "characters": "\u220C" },                                                 // 1265
  "&notniva;": { "codepoints": [8716], "characters": "\u220C" },                                               // 1266
  "&notnivb;": { "codepoints": [8958], "characters": "\u22FE" },                                               // 1267
  "&notnivc;": { "codepoints": [8957], "characters": "\u22FD" },                                               // 1268
  "&NotPrecedes;": { "codepoints": [8832], "characters": "\u2280" },                                           // 1269
  "&NotPrecedesEqual;": { "codepoints": [10927, 824], "characters": "\u2AAF\u0338" },                          // 1270
  "&NotPrecedesSlantEqual;": { "codepoints": [8928], "characters": "\u22E0" },                                 // 1271
  "&NotReverseElement;": { "codepoints": [8716], "characters": "\u220C" },                                     // 1272
  "&NotRightTriangleBar;": { "codepoints": [10704, 824], "characters": "\u29D0\u0338" },                       // 1273
  "&NotRightTriangle;": { "codepoints": [8939], "characters": "\u22EB" },                                      // 1274
  "&NotRightTriangleEqual;": { "codepoints": [8941], "characters": "\u22ED" },                                 // 1275
  "&NotSquareSubset;": { "codepoints": [8847, 824], "characters": "\u228F\u0338" },                            // 1276
  "&NotSquareSubsetEqual;": { "codepoints": [8930], "characters": "\u22E2" },                                  // 1277
  "&NotSquareSuperset;": { "codepoints": [8848, 824], "characters": "\u2290\u0338" },                          // 1278
  "&NotSquareSupersetEqual;": { "codepoints": [8931], "characters": "\u22E3" },                                // 1279
  "&NotSubset;": { "codepoints": [8834, 8402], "characters": "\u2282\u20D2" },                                 // 1280
  "&NotSubsetEqual;": { "codepoints": [8840], "characters": "\u2288" },                                        // 1281
  "&NotSucceeds;": { "codepoints": [8833], "characters": "\u2281" },                                           // 1282
  "&NotSucceedsEqual;": { "codepoints": [10928, 824], "characters": "\u2AB0\u0338" },                          // 1283
  "&NotSucceedsSlantEqual;": { "codepoints": [8929], "characters": "\u22E1" },                                 // 1284
  "&NotSucceedsTilde;": { "codepoints": [8831, 824], "characters": "\u227F\u0338" },                           // 1285
  "&NotSuperset;": { "codepoints": [8835, 8402], "characters": "\u2283\u20D2" },                               // 1286
  "&NotSupersetEqual;": { "codepoints": [8841], "characters": "\u2289" },                                      // 1287
  "&NotTilde;": { "codepoints": [8769], "characters": "\u2241" },                                              // 1288
  "&NotTildeEqual;": { "codepoints": [8772], "characters": "\u2244" },                                         // 1289
  "&NotTildeFullEqual;": { "codepoints": [8775], "characters": "\u2247" },                                     // 1290
  "&NotTildeTilde;": { "codepoints": [8777], "characters": "\u2249" },                                         // 1291
  "&NotVerticalBar;": { "codepoints": [8740], "characters": "\u2224" },                                        // 1292
  "&nparallel;": { "codepoints": [8742], "characters": "\u2226" },                                             // 1293
  "&npar;": { "codepoints": [8742], "characters": "\u2226" },                                                  // 1294
  "&nparsl;": { "codepoints": [11005, 8421], "characters": "\u2AFD\u20E5" },                                   // 1295
  "&npart;": { "codepoints": [8706, 824], "characters": "\u2202\u0338" },                                      // 1296
  "&npolint;": { "codepoints": [10772], "characters": "\u2A14" },                                              // 1297
  "&npr;": { "codepoints": [8832], "characters": "\u2280" },                                                   // 1298
  "&nprcue;": { "codepoints": [8928], "characters": "\u22E0" },                                                // 1299
  "&nprec;": { "codepoints": [8832], "characters": "\u2280" },                                                 // 1300
  "&npreceq;": { "codepoints": [10927, 824], "characters": "\u2AAF\u0338" },                                   // 1301
  "&npre;": { "codepoints": [10927, 824], "characters": "\u2AAF\u0338" },                                      // 1302
  "&nrarrc;": { "codepoints": [10547, 824], "characters": "\u2933\u0338" },                                    // 1303
  "&nrarr;": { "codepoints": [8603], "characters": "\u219B" },                                                 // 1304
  "&nrArr;": { "codepoints": [8655], "characters": "\u21CF" },                                                 // 1305
  "&nrarrw;": { "codepoints": [8605, 824], "characters": "\u219D\u0338" },                                     // 1306
  "&nrightarrow;": { "codepoints": [8603], "characters": "\u219B" },                                           // 1307
  "&nRightarrow;": { "codepoints": [8655], "characters": "\u21CF" },                                           // 1308
  "&nrtri;": { "codepoints": [8939], "characters": "\u22EB" },                                                 // 1309
  "&nrtrie;": { "codepoints": [8941], "characters": "\u22ED" },                                                // 1310
  "&nsc;": { "codepoints": [8833], "characters": "\u2281" },                                                   // 1311
  "&nsccue;": { "codepoints": [8929], "characters": "\u22E1" },                                                // 1312
  "&nsce;": { "codepoints": [10928, 824], "characters": "\u2AB0\u0338" },                                      // 1313
  "&Nscr;": { "codepoints": [119977], "characters": "\uD835\uDCA9" },                                          // 1314
  "&nscr;": { "codepoints": [120003], "characters": "\uD835\uDCC3" },                                          // 1315
  "&nshortmid;": { "codepoints": [8740], "characters": "\u2224" },                                             // 1316
  "&nshortparallel;": { "codepoints": [8742], "characters": "\u2226" },                                        // 1317
  "&nsim;": { "codepoints": [8769], "characters": "\u2241" },                                                  // 1318
  "&nsime;": { "codepoints": [8772], "characters": "\u2244" },                                                 // 1319
  "&nsimeq;": { "codepoints": [8772], "characters": "\u2244" },                                                // 1320
  "&nsmid;": { "codepoints": [8740], "characters": "\u2224" },                                                 // 1321
  "&nspar;": { "codepoints": [8742], "characters": "\u2226" },                                                 // 1322
  "&nsqsube;": { "codepoints": [8930], "characters": "\u22E2" },                                               // 1323
  "&nsqsupe;": { "codepoints": [8931], "characters": "\u22E3" },                                               // 1324
  "&nsub;": { "codepoints": [8836], "characters": "\u2284" },                                                  // 1325
  "&nsubE;": { "codepoints": [10949, 824], "characters": "\u2AC5\u0338" },                                     // 1326
  "&nsube;": { "codepoints": [8840], "characters": "\u2288" },                                                 // 1327
  "&nsubset;": { "codepoints": [8834, 8402], "characters": "\u2282\u20D2" },                                   // 1328
  "&nsubseteq;": { "codepoints": [8840], "characters": "\u2288" },                                             // 1329
  "&nsubseteqq;": { "codepoints": [10949, 824], "characters": "\u2AC5\u0338" },                                // 1330
  "&nsucc;": { "codepoints": [8833], "characters": "\u2281" },                                                 // 1331
  "&nsucceq;": { "codepoints": [10928, 824], "characters": "\u2AB0\u0338" },                                   // 1332
  "&nsup;": { "codepoints": [8837], "characters": "\u2285" },                                                  // 1333
  "&nsupE;": { "codepoints": [10950, 824], "characters": "\u2AC6\u0338" },                                     // 1334
  "&nsupe;": { "codepoints": [8841], "characters": "\u2289" },                                                 // 1335
  "&nsupset;": { "codepoints": [8835, 8402], "characters": "\u2283\u20D2" },                                   // 1336
  "&nsupseteq;": { "codepoints": [8841], "characters": "\u2289" },                                             // 1337
  "&nsupseteqq;": { "codepoints": [10950, 824], "characters": "\u2AC6\u0338" },                                // 1338
  "&ntgl;": { "codepoints": [8825], "characters": "\u2279" },                                                  // 1339
  "&Ntilde;": { "codepoints": [209], "characters": "\u00D1" },                                                 // 1340
  "&Ntilde": { "codepoints": [209], "characters": "\u00D1" },                                                  // 1341
  "&ntilde;": { "codepoints": [241], "characters": "\u00F1" },                                                 // 1342
  "&ntilde": { "codepoints": [241], "characters": "\u00F1" },                                                  // 1343
  "&ntlg;": { "codepoints": [8824], "characters": "\u2278" },                                                  // 1344
  "&ntriangleleft;": { "codepoints": [8938], "characters": "\u22EA" },                                         // 1345
  "&ntrianglelefteq;": { "codepoints": [8940], "characters": "\u22EC" },                                       // 1346
  "&ntriangleright;": { "codepoints": [8939], "characters": "\u22EB" },                                        // 1347
  "&ntrianglerighteq;": { "codepoints": [8941], "characters": "\u22ED" },                                      // 1348
  "&Nu;": { "codepoints": [925], "characters": "\u039D" },                                                     // 1349
  "&nu;": { "codepoints": [957], "characters": "\u03BD" },                                                     // 1350
  "&num;": { "codepoints": [35], "characters": "\u0023" },                                                     // 1351
  "&numero;": { "codepoints": [8470], "characters": "\u2116" },                                                // 1352
  "&numsp;": { "codepoints": [8199], "characters": "\u2007" },                                                 // 1353
  "&nvap;": { "codepoints": [8781, 8402], "characters": "\u224D\u20D2" },                                      // 1354
  "&nvdash;": { "codepoints": [8876], "characters": "\u22AC" },                                                // 1355
  "&nvDash;": { "codepoints": [8877], "characters": "\u22AD" },                                                // 1356
  "&nVdash;": { "codepoints": [8878], "characters": "\u22AE" },                                                // 1357
  "&nVDash;": { "codepoints": [8879], "characters": "\u22AF" },                                                // 1358
  "&nvge;": { "codepoints": [8805, 8402], "characters": "\u2265\u20D2" },                                      // 1359
  "&nvgt;": { "codepoints": [62, 8402], "characters": "\u003E\u20D2" },                                        // 1360
  "&nvHarr;": { "codepoints": [10500], "characters": "\u2904" },                                               // 1361
  "&nvinfin;": { "codepoints": [10718], "characters": "\u29DE" },                                              // 1362
  "&nvlArr;": { "codepoints": [10498], "characters": "\u2902" },                                               // 1363
  "&nvle;": { "codepoints": [8804, 8402], "characters": "\u2264\u20D2" },                                      // 1364
  "&nvlt;": { "codepoints": [60, 8402], "characters": "\u003C\u20D2" },                                        // 1365
  "&nvltrie;": { "codepoints": [8884, 8402], "characters": "\u22B4\u20D2" },                                   // 1366
  "&nvrArr;": { "codepoints": [10499], "characters": "\u2903" },                                               // 1367
  "&nvrtrie;": { "codepoints": [8885, 8402], "characters": "\u22B5\u20D2" },                                   // 1368
  "&nvsim;": { "codepoints": [8764, 8402], "characters": "\u223C\u20D2" },                                     // 1369
  "&nwarhk;": { "codepoints": [10531], "characters": "\u2923" },                                               // 1370
  "&nwarr;": { "codepoints": [8598], "characters": "\u2196" },                                                 // 1371
  "&nwArr;": { "codepoints": [8662], "characters": "\u21D6" },                                                 // 1372
  "&nwarrow;": { "codepoints": [8598], "characters": "\u2196" },                                               // 1373
  "&nwnear;": { "codepoints": [10535], "characters": "\u2927" },                                               // 1374
  "&Oacute;": { "codepoints": [211], "characters": "\u00D3" },                                                 // 1375
  "&Oacute": { "codepoints": [211], "characters": "\u00D3" },                                                  // 1376
  "&oacute;": { "codepoints": [243], "characters": "\u00F3" },                                                 // 1377
  "&oacute": { "codepoints": [243], "characters": "\u00F3" },                                                  // 1378
  "&oast;": { "codepoints": [8859], "characters": "\u229B" },                                                  // 1379
  "&Ocirc;": { "codepoints": [212], "characters": "\u00D4" },                                                  // 1380
  "&Ocirc": { "codepoints": [212], "characters": "\u00D4" },                                                   // 1381
  "&ocirc;": { "codepoints": [244], "characters": "\u00F4" },                                                  // 1382
  "&ocirc": { "codepoints": [244], "characters": "\u00F4" },                                                   // 1383
  "&ocir;": { "codepoints": [8858], "characters": "\u229A" },                                                  // 1384
  "&Ocy;": { "codepoints": [1054], "characters": "\u041E" },                                                   // 1385
  "&ocy;": { "codepoints": [1086], "characters": "\u043E" },                                                   // 1386
  "&odash;": { "codepoints": [8861], "characters": "\u229D" },                                                 // 1387
  "&Odblac;": { "codepoints": [336], "characters": "\u0150" },                                                 // 1388
  "&odblac;": { "codepoints": [337], "characters": "\u0151" },                                                 // 1389
  "&odiv;": { "codepoints": [10808], "characters": "\u2A38" },                                                 // 1390
  "&odot;": { "codepoints": [8857], "characters": "\u2299" },                                                  // 1391
  "&odsold;": { "codepoints": [10684], "characters": "\u29BC" },                                               // 1392
  "&OElig;": { "codepoints": [338], "characters": "\u0152" },                                                  // 1393
  "&oelig;": { "codepoints": [339], "characters": "\u0153" },                                                  // 1394
  "&ofcir;": { "codepoints": [10687], "characters": "\u29BF" },                                                // 1395
  "&Ofr;": { "codepoints": [120082], "characters": "\uD835\uDD12" },                                           // 1396
  "&ofr;": { "codepoints": [120108], "characters": "\uD835\uDD2C" },                                           // 1397
  "&ogon;": { "codepoints": [731], "characters": "\u02DB" },                                                   // 1398
  "&Ograve;": { "codepoints": [210], "characters": "\u00D2" },                                                 // 1399
  "&Ograve": { "codepoints": [210], "characters": "\u00D2" },                                                  // 1400
  "&ograve;": { "codepoints": [242], "characters": "\u00F2" },                                                 // 1401
  "&ograve": { "codepoints": [242], "characters": "\u00F2" },                                                  // 1402
  "&ogt;": { "codepoints": [10689], "characters": "\u29C1" },                                                  // 1403
  "&ohbar;": { "codepoints": [10677], "characters": "\u29B5" },                                                // 1404
  "&ohm;": { "codepoints": [937], "characters": "\u03A9" },                                                    // 1405
  "&oint;": { "codepoints": [8750], "characters": "\u222E" },                                                  // 1406
  "&olarr;": { "codepoints": [8634], "characters": "\u21BA" },                                                 // 1407
  "&olcir;": { "codepoints": [10686], "characters": "\u29BE" },                                                // 1408
  "&olcross;": { "codepoints": [10683], "characters": "\u29BB" },                                              // 1409
  "&oline;": { "codepoints": [8254], "characters": "\u203E" },                                                 // 1410
  "&olt;": { "codepoints": [10688], "characters": "\u29C0" },                                                  // 1411
  "&Omacr;": { "codepoints": [332], "characters": "\u014C" },                                                  // 1412
  "&omacr;": { "codepoints": [333], "characters": "\u014D" },                                                  // 1413
  "&Omega;": { "codepoints": [937], "characters": "\u03A9" },                                                  // 1414
  "&omega;": { "codepoints": [969], "characters": "\u03C9" },                                                  // 1415
  "&Omicron;": { "codepoints": [927], "characters": "\u039F" },                                                // 1416
  "&omicron;": { "codepoints": [959], "characters": "\u03BF" },                                                // 1417
  "&omid;": { "codepoints": [10678], "characters": "\u29B6" },                                                 // 1418
  "&ominus;": { "codepoints": [8854], "characters": "\u2296" },                                                // 1419
  "&Oopf;": { "codepoints": [120134], "characters": "\uD835\uDD46" },                                          // 1420
  "&oopf;": { "codepoints": [120160], "characters": "\uD835\uDD60" },                                          // 1421
  "&opar;": { "codepoints": [10679], "characters": "\u29B7" },                                                 // 1422
  "&OpenCurlyDoubleQuote;": { "codepoints": [8220], "characters": "\u201C" },                                  // 1423
  "&OpenCurlyQuote;": { "codepoints": [8216], "characters": "\u2018" },                                        // 1424
  "&operp;": { "codepoints": [10681], "characters": "\u29B9" },                                                // 1425
  "&oplus;": { "codepoints": [8853], "characters": "\u2295" },                                                 // 1426
  "&orarr;": { "codepoints": [8635], "characters": "\u21BB" },                                                 // 1427
  "&Or;": { "codepoints": [10836], "characters": "\u2A54" },                                                   // 1428
  "&or;": { "codepoints": [8744], "characters": "\u2228" },                                                    // 1429
  "&ord;": { "codepoints": [10845], "characters": "\u2A5D" },                                                  // 1430
  "&order;": { "codepoints": [8500], "characters": "\u2134" },                                                 // 1431
  "&orderof;": { "codepoints": [8500], "characters": "\u2134" },                                               // 1432
  "&ordf;": { "codepoints": [170], "characters": "\u00AA" },                                                   // 1433
  "&ordf": { "codepoints": [170], "characters": "\u00AA" },                                                    // 1434
  "&ordm;": { "codepoints": [186], "characters": "\u00BA" },                                                   // 1435
  "&ordm": { "codepoints": [186], "characters": "\u00BA" },                                                    // 1436
  "&origof;": { "codepoints": [8886], "characters": "\u22B6" },                                                // 1437
  "&oror;": { "codepoints": [10838], "characters": "\u2A56" },                                                 // 1438
  "&orslope;": { "codepoints": [10839], "characters": "\u2A57" },                                              // 1439
  "&orv;": { "codepoints": [10843], "characters": "\u2A5B" },                                                  // 1440
  "&oS;": { "codepoints": [9416], "characters": "\u24C8" },                                                    // 1441
  "&Oscr;": { "codepoints": [119978], "characters": "\uD835\uDCAA" },                                          // 1442
  "&oscr;": { "codepoints": [8500], "characters": "\u2134" },                                                  // 1443
  "&Oslash;": { "codepoints": [216], "characters": "\u00D8" },                                                 // 1444
  "&Oslash": { "codepoints": [216], "characters": "\u00D8" },                                                  // 1445
  "&oslash;": { "codepoints": [248], "characters": "\u00F8" },                                                 // 1446
  "&oslash": { "codepoints": [248], "characters": "\u00F8" },                                                  // 1447
  "&osol;": { "codepoints": [8856], "characters": "\u2298" },                                                  // 1448
  "&Otilde;": { "codepoints": [213], "characters": "\u00D5" },                                                 // 1449
  "&Otilde": { "codepoints": [213], "characters": "\u00D5" },                                                  // 1450
  "&otilde;": { "codepoints": [245], "characters": "\u00F5" },                                                 // 1451
  "&otilde": { "codepoints": [245], "characters": "\u00F5" },                                                  // 1452
  "&otimesas;": { "codepoints": [10806], "characters": "\u2A36" },                                             // 1453
  "&Otimes;": { "codepoints": [10807], "characters": "\u2A37" },                                               // 1454
  "&otimes;": { "codepoints": [8855], "characters": "\u2297" },                                                // 1455
  "&Ouml;": { "codepoints": [214], "characters": "\u00D6" },                                                   // 1456
  "&Ouml": { "codepoints": [214], "characters": "\u00D6" },                                                    // 1457
  "&ouml;": { "codepoints": [246], "characters": "\u00F6" },                                                   // 1458
  "&ouml": { "codepoints": [246], "characters": "\u00F6" },                                                    // 1459
  "&ovbar;": { "codepoints": [9021], "characters": "\u233D" },                                                 // 1460
  "&OverBar;": { "codepoints": [8254], "characters": "\u203E" },                                               // 1461
  "&OverBrace;": { "codepoints": [9182], "characters": "\u23DE" },                                             // 1462
  "&OverBracket;": { "codepoints": [9140], "characters": "\u23B4" },                                           // 1463
  "&OverParenthesis;": { "codepoints": [9180], "characters": "\u23DC" },                                       // 1464
  "&para;": { "codepoints": [182], "characters": "\u00B6" },                                                   // 1465
  "&para": { "codepoints": [182], "characters": "\u00B6" },                                                    // 1466
  "&parallel;": { "codepoints": [8741], "characters": "\u2225" },                                              // 1467
  "&par;": { "codepoints": [8741], "characters": "\u2225" },                                                   // 1468
  "&parsim;": { "codepoints": [10995], "characters": "\u2AF3" },                                               // 1469
  "&parsl;": { "codepoints": [11005], "characters": "\u2AFD" },                                                // 1470
  "&part;": { "codepoints": [8706], "characters": "\u2202" },                                                  // 1471
  "&PartialD;": { "codepoints": [8706], "characters": "\u2202" },                                              // 1472
  "&Pcy;": { "codepoints": [1055], "characters": "\u041F" },                                                   // 1473
  "&pcy;": { "codepoints": [1087], "characters": "\u043F" },                                                   // 1474
  "&percnt;": { "codepoints": [37], "characters": "\u0025" },                                                  // 1475
  "&period;": { "codepoints": [46], "characters": "\u002E" },                                                  // 1476
  "&permil;": { "codepoints": [8240], "characters": "\u2030" },                                                // 1477
  "&perp;": { "codepoints": [8869], "characters": "\u22A5" },                                                  // 1478
  "&pertenk;": { "codepoints": [8241], "characters": "\u2031" },                                               // 1479
  "&Pfr;": { "codepoints": [120083], "characters": "\uD835\uDD13" },                                           // 1480
  "&pfr;": { "codepoints": [120109], "characters": "\uD835\uDD2D" },                                           // 1481
  "&Phi;": { "codepoints": [934], "characters": "\u03A6" },                                                    // 1482
  "&phi;": { "codepoints": [966], "characters": "\u03C6" },                                                    // 1483
  "&phiv;": { "codepoints": [981], "characters": "\u03D5" },                                                   // 1484
  "&phmmat;": { "codepoints": [8499], "characters": "\u2133" },                                                // 1485
  "&phone;": { "codepoints": [9742], "characters": "\u260E" },                                                 // 1486
  "&Pi;": { "codepoints": [928], "characters": "\u03A0" },                                                     // 1487
  "&pi;": { "codepoints": [960], "characters": "\u03C0" },                                                     // 1488
  "&pitchfork;": { "codepoints": [8916], "characters": "\u22D4" },                                             // 1489
  "&piv;": { "codepoints": [982], "characters": "\u03D6" },                                                    // 1490
  "&planck;": { "codepoints": [8463], "characters": "\u210F" },                                                // 1491
  "&planckh;": { "codepoints": [8462], "characters": "\u210E" },                                               // 1492
  "&plankv;": { "codepoints": [8463], "characters": "\u210F" },                                                // 1493
  "&plusacir;": { "codepoints": [10787], "characters": "\u2A23" },                                             // 1494
  "&plusb;": { "codepoints": [8862], "characters": "\u229E" },                                                 // 1495
  "&pluscir;": { "codepoints": [10786], "characters": "\u2A22" },                                              // 1496
  "&plus;": { "codepoints": [43], "characters": "\u002B" },                                                    // 1497
  "&plusdo;": { "codepoints": [8724], "characters": "\u2214" },                                                // 1498
  "&plusdu;": { "codepoints": [10789], "characters": "\u2A25" },                                               // 1499
  "&pluse;": { "codepoints": [10866], "characters": "\u2A72" },                                                // 1500
  "&PlusMinus;": { "codepoints": [177], "characters": "\u00B1" },                                              // 1501
  "&plusmn;": { "codepoints": [177], "characters": "\u00B1" },                                                 // 1502
  "&plusmn": { "codepoints": [177], "characters": "\u00B1" },                                                  // 1503
  "&plussim;": { "codepoints": [10790], "characters": "\u2A26" },                                              // 1504
  "&plustwo;": { "codepoints": [10791], "characters": "\u2A27" },                                              // 1505
  "&pm;": { "codepoints": [177], "characters": "\u00B1" },                                                     // 1506
  "&Poincareplane;": { "codepoints": [8460], "characters": "\u210C" },                                         // 1507
  "&pointint;": { "codepoints": [10773], "characters": "\u2A15" },                                             // 1508
  "&popf;": { "codepoints": [120161], "characters": "\uD835\uDD61" },                                          // 1509
  "&Popf;": { "codepoints": [8473], "characters": "\u2119" },                                                  // 1510
  "&pound;": { "codepoints": [163], "characters": "\u00A3" },                                                  // 1511
  "&pound": { "codepoints": [163], "characters": "\u00A3" },                                                   // 1512
  "&prap;": { "codepoints": [10935], "characters": "\u2AB7" },                                                 // 1513
  "&Pr;": { "codepoints": [10939], "characters": "\u2ABB" },                                                   // 1514
  "&pr;": { "codepoints": [8826], "characters": "\u227A" },                                                    // 1515
  "&prcue;": { "codepoints": [8828], "characters": "\u227C" },                                                 // 1516
  "&precapprox;": { "codepoints": [10935], "characters": "\u2AB7" },                                           // 1517
  "&prec;": { "codepoints": [8826], "characters": "\u227A" },                                                  // 1518
  "&preccurlyeq;": { "codepoints": [8828], "characters": "\u227C" },                                           // 1519
  "&Precedes;": { "codepoints": [8826], "characters": "\u227A" },                                              // 1520
  "&PrecedesEqual;": { "codepoints": [10927], "characters": "\u2AAF" },                                        // 1521
  "&PrecedesSlantEqual;": { "codepoints": [8828], "characters": "\u227C" },                                    // 1522
  "&PrecedesTilde;": { "codepoints": [8830], "characters": "\u227E" },                                         // 1523
  "&preceq;": { "codepoints": [10927], "characters": "\u2AAF" },                                               // 1524
  "&precnapprox;": { "codepoints": [10937], "characters": "\u2AB9" },                                          // 1525
  "&precneqq;": { "codepoints": [10933], "characters": "\u2AB5" },                                             // 1526
  "&precnsim;": { "codepoints": [8936], "characters": "\u22E8" },                                              // 1527
  "&pre;": { "codepoints": [10927], "characters": "\u2AAF" },                                                  // 1528
  "&prE;": { "codepoints": [10931], "characters": "\u2AB3" },                                                  // 1529
  "&precsim;": { "codepoints": [8830], "characters": "\u227E" },                                               // 1530
  "&prime;": { "codepoints": [8242], "characters": "\u2032" },                                                 // 1531
  "&Prime;": { "codepoints": [8243], "characters": "\u2033" },                                                 // 1532
  "&primes;": { "codepoints": [8473], "characters": "\u2119" },                                                // 1533
  "&prnap;": { "codepoints": [10937], "characters": "\u2AB9" },                                                // 1534
  "&prnE;": { "codepoints": [10933], "characters": "\u2AB5" },                                                 // 1535
  "&prnsim;": { "codepoints": [8936], "characters": "\u22E8" },                                                // 1536
  "&prod;": { "codepoints": [8719], "characters": "\u220F" },                                                  // 1537
  "&Product;": { "codepoints": [8719], "characters": "\u220F" },                                               // 1538
  "&profalar;": { "codepoints": [9006], "characters": "\u232E" },                                              // 1539
  "&profline;": { "codepoints": [8978], "characters": "\u2312" },                                              // 1540
  "&profsurf;": { "codepoints": [8979], "characters": "\u2313" },                                              // 1541
  "&prop;": { "codepoints": [8733], "characters": "\u221D" },                                                  // 1542
  "&Proportional;": { "codepoints": [8733], "characters": "\u221D" },                                          // 1543
  "&Proportion;": { "codepoints": [8759], "characters": "\u2237" },                                            // 1544
  "&propto;": { "codepoints": [8733], "characters": "\u221D" },                                                // 1545
  "&prsim;": { "codepoints": [8830], "characters": "\u227E" },                                                 // 1546
  "&prurel;": { "codepoints": [8880], "characters": "\u22B0" },                                                // 1547
  "&Pscr;": { "codepoints": [119979], "characters": "\uD835\uDCAB" },                                          // 1548
  "&pscr;": { "codepoints": [120005], "characters": "\uD835\uDCC5" },                                          // 1549
  "&Psi;": { "codepoints": [936], "characters": "\u03A8" },                                                    // 1550
  "&psi;": { "codepoints": [968], "characters": "\u03C8" },                                                    // 1551
  "&puncsp;": { "codepoints": [8200], "characters": "\u2008" },                                                // 1552
  "&Qfr;": { "codepoints": [120084], "characters": "\uD835\uDD14" },                                           // 1553
  "&qfr;": { "codepoints": [120110], "characters": "\uD835\uDD2E" },                                           // 1554
  "&qint;": { "codepoints": [10764], "characters": "\u2A0C" },                                                 // 1555
  "&qopf;": { "codepoints": [120162], "characters": "\uD835\uDD62" },                                          // 1556
  "&Qopf;": { "codepoints": [8474], "characters": "\u211A" },                                                  // 1557
  "&qprime;": { "codepoints": [8279], "characters": "\u2057" },                                                // 1558
  "&Qscr;": { "codepoints": [119980], "characters": "\uD835\uDCAC" },                                          // 1559
  "&qscr;": { "codepoints": [120006], "characters": "\uD835\uDCC6" },                                          // 1560
  "&quaternions;": { "codepoints": [8461], "characters": "\u210D" },                                           // 1561
  "&quatint;": { "codepoints": [10774], "characters": "\u2A16" },                                              // 1562
  "&quest;": { "codepoints": [63], "characters": "\u003F" },                                                   // 1563
  "&questeq;": { "codepoints": [8799], "characters": "\u225F" },                                               // 1564
  "&quot;": { "codepoints": [34], "characters": "\u0022" },                                                    // 1565
  "&quot": { "codepoints": [34], "characters": "\u0022" },                                                     // 1566
  "&QUOT;": { "codepoints": [34], "characters": "\u0022" },                                                    // 1567
  "&QUOT": { "codepoints": [34], "characters": "\u0022" },                                                     // 1568
  "&rAarr;": { "codepoints": [8667], "characters": "\u21DB" },                                                 // 1569
  "&race;": { "codepoints": [8765, 817], "characters": "\u223D\u0331" },                                       // 1570
  "&Racute;": { "codepoints": [340], "characters": "\u0154" },                                                 // 1571
  "&racute;": { "codepoints": [341], "characters": "\u0155" },                                                 // 1572
  "&radic;": { "codepoints": [8730], "characters": "\u221A" },                                                 // 1573
  "&raemptyv;": { "codepoints": [10675], "characters": "\u29B3" },                                             // 1574
  "&rang;": { "codepoints": [10217], "characters": "\u27E9" },                                                 // 1575
  "&Rang;": { "codepoints": [10219], "characters": "\u27EB" },                                                 // 1576
  "&rangd;": { "codepoints": [10642], "characters": "\u2992" },                                                // 1577
  "&range;": { "codepoints": [10661], "characters": "\u29A5" },                                                // 1578
  "&rangle;": { "codepoints": [10217], "characters": "\u27E9" },                                               // 1579
  "&raquo;": { "codepoints": [187], "characters": "\u00BB" },                                                  // 1580
  "&raquo": { "codepoints": [187], "characters": "\u00BB" },                                                   // 1581
  "&rarrap;": { "codepoints": [10613], "characters": "\u2975" },                                               // 1582
  "&rarrb;": { "codepoints": [8677], "characters": "\u21E5" },                                                 // 1583
  "&rarrbfs;": { "codepoints": [10528], "characters": "\u2920" },                                              // 1584
  "&rarrc;": { "codepoints": [10547], "characters": "\u2933" },                                                // 1585
  "&rarr;": { "codepoints": [8594], "characters": "\u2192" },                                                  // 1586
  "&Rarr;": { "codepoints": [8608], "characters": "\u21A0" },                                                  // 1587
  "&rArr;": { "codepoints": [8658], "characters": "\u21D2" },                                                  // 1588
  "&rarrfs;": { "codepoints": [10526], "characters": "\u291E" },                                               // 1589
  "&rarrhk;": { "codepoints": [8618], "characters": "\u21AA" },                                                // 1590
  "&rarrlp;": { "codepoints": [8620], "characters": "\u21AC" },                                                // 1591
  "&rarrpl;": { "codepoints": [10565], "characters": "\u2945" },                                               // 1592
  "&rarrsim;": { "codepoints": [10612], "characters": "\u2974" },                                              // 1593
  "&Rarrtl;": { "codepoints": [10518], "characters": "\u2916" },                                               // 1594
  "&rarrtl;": { "codepoints": [8611], "characters": "\u21A3" },                                                // 1595
  "&rarrw;": { "codepoints": [8605], "characters": "\u219D" },                                                 // 1596
  "&ratail;": { "codepoints": [10522], "characters": "\u291A" },                                               // 1597
  "&rAtail;": { "codepoints": [10524], "characters": "\u291C" },                                               // 1598
  "&ratio;": { "codepoints": [8758], "characters": "\u2236" },                                                 // 1599
  "&rationals;": { "codepoints": [8474], "characters": "\u211A" },                                             // 1600
  "&rbarr;": { "codepoints": [10509], "characters": "\u290D" },                                                // 1601
  "&rBarr;": { "codepoints": [10511], "characters": "\u290F" },                                                // 1602
  "&RBarr;": { "codepoints": [10512], "characters": "\u2910" },                                                // 1603
  "&rbbrk;": { "codepoints": [10099], "characters": "\u2773" },                                                // 1604
  "&rbrace;": { "codepoints": [125], "characters": "\u007D" },                                                 // 1605
  "&rbrack;": { "codepoints": [93], "characters": "\u005D" },                                                  // 1606
  "&rbrke;": { "codepoints": [10636], "characters": "\u298C" },                                                // 1607
  "&rbrksld;": { "codepoints": [10638], "characters": "\u298E" },                                              // 1608
  "&rbrkslu;": { "codepoints": [10640], "characters": "\u2990" },                                              // 1609
  "&Rcaron;": { "codepoints": [344], "characters": "\u0158" },                                                 // 1610
  "&rcaron;": { "codepoints": [345], "characters": "\u0159" },                                                 // 1611
  "&Rcedil;": { "codepoints": [342], "characters": "\u0156" },                                                 // 1612
  "&rcedil;": { "codepoints": [343], "characters": "\u0157" },                                                 // 1613
  "&rceil;": { "codepoints": [8969], "characters": "\u2309" },                                                 // 1614
  "&rcub;": { "codepoints": [125], "characters": "\u007D" },                                                   // 1615
  "&Rcy;": { "codepoints": [1056], "characters": "\u0420" },                                                   // 1616
  "&rcy;": { "codepoints": [1088], "characters": "\u0440" },                                                   // 1617
  "&rdca;": { "codepoints": [10551], "characters": "\u2937" },                                                 // 1618
  "&rdldhar;": { "codepoints": [10601], "characters": "\u2969" },                                              // 1619
  "&rdquo;": { "codepoints": [8221], "characters": "\u201D" },                                                 // 1620
  "&rdquor;": { "codepoints": [8221], "characters": "\u201D" },                                                // 1621
  "&rdsh;": { "codepoints": [8627], "characters": "\u21B3" },                                                  // 1622
  "&real;": { "codepoints": [8476], "characters": "\u211C" },                                                  // 1623
  "&realine;": { "codepoints": [8475], "characters": "\u211B" },                                               // 1624
  "&realpart;": { "codepoints": [8476], "characters": "\u211C" },                                              // 1625
  "&reals;": { "codepoints": [8477], "characters": "\u211D" },                                                 // 1626
  "&Re;": { "codepoints": [8476], "characters": "\u211C" },                                                    // 1627
  "&rect;": { "codepoints": [9645], "characters": "\u25AD" },                                                  // 1628
  "&reg;": { "codepoints": [174], "characters": "\u00AE" },                                                    // 1629
  "&reg": { "codepoints": [174], "characters": "\u00AE" },                                                     // 1630
  "&REG;": { "codepoints": [174], "characters": "\u00AE" },                                                    // 1631
  "&REG": { "codepoints": [174], "characters": "\u00AE" },                                                     // 1632
  "&ReverseElement;": { "codepoints": [8715], "characters": "\u220B" },                                        // 1633
  "&ReverseEquilibrium;": { "codepoints": [8651], "characters": "\u21CB" },                                    // 1634
  "&ReverseUpEquilibrium;": { "codepoints": [10607], "characters": "\u296F" },                                 // 1635
  "&rfisht;": { "codepoints": [10621], "characters": "\u297D" },                                               // 1636
  "&rfloor;": { "codepoints": [8971], "characters": "\u230B" },                                                // 1637
  "&rfr;": { "codepoints": [120111], "characters": "\uD835\uDD2F" },                                           // 1638
  "&Rfr;": { "codepoints": [8476], "characters": "\u211C" },                                                   // 1639
  "&rHar;": { "codepoints": [10596], "characters": "\u2964" },                                                 // 1640
  "&rhard;": { "codepoints": [8641], "characters": "\u21C1" },                                                 // 1641
  "&rharu;": { "codepoints": [8640], "characters": "\u21C0" },                                                 // 1642
  "&rharul;": { "codepoints": [10604], "characters": "\u296C" },                                               // 1643
  "&Rho;": { "codepoints": [929], "characters": "\u03A1" },                                                    // 1644
  "&rho;": { "codepoints": [961], "characters": "\u03C1" },                                                    // 1645
  "&rhov;": { "codepoints": [1009], "characters": "\u03F1" },                                                  // 1646
  "&RightAngleBracket;": { "codepoints": [10217], "characters": "\u27E9" },                                    // 1647
  "&RightArrowBar;": { "codepoints": [8677], "characters": "\u21E5" },                                         // 1648
  "&rightarrow;": { "codepoints": [8594], "characters": "\u2192" },                                            // 1649
  "&RightArrow;": { "codepoints": [8594], "characters": "\u2192" },                                            // 1650
  "&Rightarrow;": { "codepoints": [8658], "characters": "\u21D2" },                                            // 1651
  "&RightArrowLeftArrow;": { "codepoints": [8644], "characters": "\u21C4" },                                   // 1652
  "&rightarrowtail;": { "codepoints": [8611], "characters": "\u21A3" },                                        // 1653
  "&RightCeiling;": { "codepoints": [8969], "characters": "\u2309" },                                          // 1654
  "&RightDoubleBracket;": { "codepoints": [10215], "characters": "\u27E7" },                                   // 1655
  "&RightDownTeeVector;": { "codepoints": [10589], "characters": "\u295D" },                                   // 1656
  "&RightDownVectorBar;": { "codepoints": [10581], "characters": "\u2955" },                                   // 1657
  "&RightDownVector;": { "codepoints": [8642], "characters": "\u21C2" },                                       // 1658
  "&RightFloor;": { "codepoints": [8971], "characters": "\u230B" },                                            // 1659
  "&rightharpoondown;": { "codepoints": [8641], "characters": "\u21C1" },                                      // 1660
  "&rightharpoonup;": { "codepoints": [8640], "characters": "\u21C0" },                                        // 1661
  "&rightleftarrows;": { "codepoints": [8644], "characters": "\u21C4" },                                       // 1662
  "&rightleftharpoons;": { "codepoints": [8652], "characters": "\u21CC" },                                     // 1663
  "&rightrightarrows;": { "codepoints": [8649], "characters": "\u21C9" },                                      // 1664
  "&rightsquigarrow;": { "codepoints": [8605], "characters": "\u219D" },                                       // 1665
  "&RightTeeArrow;": { "codepoints": [8614], "characters": "\u21A6" },                                         // 1666
  "&RightTee;": { "codepoints": [8866], "characters": "\u22A2" },                                              // 1667
  "&RightTeeVector;": { "codepoints": [10587], "characters": "\u295B" },                                       // 1668
  "&rightthreetimes;": { "codepoints": [8908], "characters": "\u22CC" },                                       // 1669
  "&RightTriangleBar;": { "codepoints": [10704], "characters": "\u29D0" },                                     // 1670
  "&RightTriangle;": { "codepoints": [8883], "characters": "\u22B3" },                                         // 1671
  "&RightTriangleEqual;": { "codepoints": [8885], "characters": "\u22B5" },                                    // 1672
  "&RightUpDownVector;": { "codepoints": [10575], "characters": "\u294F" },                                    // 1673
  "&RightUpTeeVector;": { "codepoints": [10588], "characters": "\u295C" },                                     // 1674
  "&RightUpVectorBar;": { "codepoints": [10580], "characters": "\u2954" },                                     // 1675
  "&RightUpVector;": { "codepoints": [8638], "characters": "\u21BE" },                                         // 1676
  "&RightVectorBar;": { "codepoints": [10579], "characters": "\u2953" },                                       // 1677
  "&RightVector;": { "codepoints": [8640], "characters": "\u21C0" },                                           // 1678
  "&ring;": { "codepoints": [730], "characters": "\u02DA" },                                                   // 1679
  "&risingdotseq;": { "codepoints": [8787], "characters": "\u2253" },                                          // 1680
  "&rlarr;": { "codepoints": [8644], "characters": "\u21C4" },                                                 // 1681
  "&rlhar;": { "codepoints": [8652], "characters": "\u21CC" },                                                 // 1682
  "&rlm;": { "codepoints": [8207], "characters": "\u200F" },                                                   // 1683
  "&rmoustache;": { "codepoints": [9137], "characters": "\u23B1" },                                            // 1684
  "&rmoust;": { "codepoints": [9137], "characters": "\u23B1" },                                                // 1685
  "&rnmid;": { "codepoints": [10990], "characters": "\u2AEE" },                                                // 1686
  "&roang;": { "codepoints": [10221], "characters": "\u27ED" },                                                // 1687
  "&roarr;": { "codepoints": [8702], "characters": "\u21FE" },                                                 // 1688
  "&robrk;": { "codepoints": [10215], "characters": "\u27E7" },                                                // 1689
  "&ropar;": { "codepoints": [10630], "characters": "\u2986" },                                                // 1690
  "&ropf;": { "codepoints": [120163], "characters": "\uD835\uDD63" },                                          // 1691
  "&Ropf;": { "codepoints": [8477], "characters": "\u211D" },                                                  // 1692
  "&roplus;": { "codepoints": [10798], "characters": "\u2A2E" },                                               // 1693
  "&rotimes;": { "codepoints": [10805], "characters": "\u2A35" },                                              // 1694
  "&RoundImplies;": { "codepoints": [10608], "characters": "\u2970" },                                         // 1695
  "&rpar;": { "codepoints": [41], "characters": "\u0029" },                                                    // 1696
  "&rpargt;": { "codepoints": [10644], "characters": "\u2994" },                                               // 1697
  "&rppolint;": { "codepoints": [10770], "characters": "\u2A12" },                                             // 1698
  "&rrarr;": { "codepoints": [8649], "characters": "\u21C9" },                                                 // 1699
  "&Rrightarrow;": { "codepoints": [8667], "characters": "\u21DB" },                                           // 1700
  "&rsaquo;": { "codepoints": [8250], "characters": "\u203A" },                                                // 1701
  "&rscr;": { "codepoints": [120007], "characters": "\uD835\uDCC7" },                                          // 1702
  "&Rscr;": { "codepoints": [8475], "characters": "\u211B" },                                                  // 1703
  "&rsh;": { "codepoints": [8625], "characters": "\u21B1" },                                                   // 1704
  "&Rsh;": { "codepoints": [8625], "characters": "\u21B1" },                                                   // 1705
  "&rsqb;": { "codepoints": [93], "characters": "\u005D" },                                                    // 1706
  "&rsquo;": { "codepoints": [8217], "characters": "\u2019" },                                                 // 1707
  "&rsquor;": { "codepoints": [8217], "characters": "\u2019" },                                                // 1708
  "&rthree;": { "codepoints": [8908], "characters": "\u22CC" },                                                // 1709
  "&rtimes;": { "codepoints": [8906], "characters": "\u22CA" },                                                // 1710
  "&rtri;": { "codepoints": [9657], "characters": "\u25B9" },                                                  // 1711
  "&rtrie;": { "codepoints": [8885], "characters": "\u22B5" },                                                 // 1712
  "&rtrif;": { "codepoints": [9656], "characters": "\u25B8" },                                                 // 1713
  "&rtriltri;": { "codepoints": [10702], "characters": "\u29CE" },                                             // 1714
  "&RuleDelayed;": { "codepoints": [10740], "characters": "\u29F4" },                                          // 1715
  "&ruluhar;": { "codepoints": [10600], "characters": "\u2968" },                                              // 1716
  "&rx;": { "codepoints": [8478], "characters": "\u211E" },                                                    // 1717
  "&Sacute;": { "codepoints": [346], "characters": "\u015A" },                                                 // 1718
  "&sacute;": { "codepoints": [347], "characters": "\u015B" },                                                 // 1719
  "&sbquo;": { "codepoints": [8218], "characters": "\u201A" },                                                 // 1720
  "&scap;": { "codepoints": [10936], "characters": "\u2AB8" },                                                 // 1721
  "&Scaron;": { "codepoints": [352], "characters": "\u0160" },                                                 // 1722
  "&scaron;": { "codepoints": [353], "characters": "\u0161" },                                                 // 1723
  "&Sc;": { "codepoints": [10940], "characters": "\u2ABC" },                                                   // 1724
  "&sc;": { "codepoints": [8827], "characters": "\u227B" },                                                    // 1725
  "&sccue;": { "codepoints": [8829], "characters": "\u227D" },                                                 // 1726
  "&sce;": { "codepoints": [10928], "characters": "\u2AB0" },                                                  // 1727
  "&scE;": { "codepoints": [10932], "characters": "\u2AB4" },                                                  // 1728
  "&Scedil;": { "codepoints": [350], "characters": "\u015E" },                                                 // 1729
  "&scedil;": { "codepoints": [351], "characters": "\u015F" },                                                 // 1730
  "&Scirc;": { "codepoints": [348], "characters": "\u015C" },                                                  // 1731
  "&scirc;": { "codepoints": [349], "characters": "\u015D" },                                                  // 1732
  "&scnap;": { "codepoints": [10938], "characters": "\u2ABA" },                                                // 1733
  "&scnE;": { "codepoints": [10934], "characters": "\u2AB6" },                                                 // 1734
  "&scnsim;": { "codepoints": [8937], "characters": "\u22E9" },                                                // 1735
  "&scpolint;": { "codepoints": [10771], "characters": "\u2A13" },                                             // 1736
  "&scsim;": { "codepoints": [8831], "characters": "\u227F" },                                                 // 1737
  "&Scy;": { "codepoints": [1057], "characters": "\u0421" },                                                   // 1738
  "&scy;": { "codepoints": [1089], "characters": "\u0441" },                                                   // 1739
  "&sdotb;": { "codepoints": [8865], "characters": "\u22A1" },                                                 // 1740
  "&sdot;": { "codepoints": [8901], "characters": "\u22C5" },                                                  // 1741
  "&sdote;": { "codepoints": [10854], "characters": "\u2A66" },                                                // 1742
  "&searhk;": { "codepoints": [10533], "characters": "\u2925" },                                               // 1743
  "&searr;": { "codepoints": [8600], "characters": "\u2198" },                                                 // 1744
  "&seArr;": { "codepoints": [8664], "characters": "\u21D8" },                                                 // 1745
  "&searrow;": { "codepoints": [8600], "characters": "\u2198" },                                               // 1746
  "&sect;": { "codepoints": [167], "characters": "\u00A7" },                                                   // 1747
  "&sect": { "codepoints": [167], "characters": "\u00A7" },                                                    // 1748
  "&semi;": { "codepoints": [59], "characters": "\u003B" },                                                    // 1749
  "&seswar;": { "codepoints": [10537], "characters": "\u2929" },                                               // 1750
  "&setminus;": { "codepoints": [8726], "characters": "\u2216" },                                              // 1751
  "&setmn;": { "codepoints": [8726], "characters": "\u2216" },                                                 // 1752
  "&sext;": { "codepoints": [10038], "characters": "\u2736" },                                                 // 1753
  "&Sfr;": { "codepoints": [120086], "characters": "\uD835\uDD16" },                                           // 1754
  "&sfr;": { "codepoints": [120112], "characters": "\uD835\uDD30" },                                           // 1755
  "&sfrown;": { "codepoints": [8994], "characters": "\u2322" },                                                // 1756
  "&sharp;": { "codepoints": [9839], "characters": "\u266F" },                                                 // 1757
  "&SHCHcy;": { "codepoints": [1065], "characters": "\u0429" },                                                // 1758
  "&shchcy;": { "codepoints": [1097], "characters": "\u0449" },                                                // 1759
  "&SHcy;": { "codepoints": [1064], "characters": "\u0428" },                                                  // 1760
  "&shcy;": { "codepoints": [1096], "characters": "\u0448" },                                                  // 1761
  "&ShortDownArrow;": { "codepoints": [8595], "characters": "\u2193" },                                        // 1762
  "&ShortLeftArrow;": { "codepoints": [8592], "characters": "\u2190" },                                        // 1763
  "&shortmid;": { "codepoints": [8739], "characters": "\u2223" },                                              // 1764
  "&shortparallel;": { "codepoints": [8741], "characters": "\u2225" },                                         // 1765
  "&ShortRightArrow;": { "codepoints": [8594], "characters": "\u2192" },                                       // 1766
  "&ShortUpArrow;": { "codepoints": [8593], "characters": "\u2191" },                                          // 1767
  "&shy;": { "codepoints": [173], "characters": "\u00AD" },                                                    // 1768
  "&shy": { "codepoints": [173], "characters": "\u00AD" },                                                     // 1769
  "&Sigma;": { "codepoints": [931], "characters": "\u03A3" },                                                  // 1770
  "&sigma;": { "codepoints": [963], "characters": "\u03C3" },                                                  // 1771
  "&sigmaf;": { "codepoints": [962], "characters": "\u03C2" },                                                 // 1772
  "&sigmav;": { "codepoints": [962], "characters": "\u03C2" },                                                 // 1773
  "&sim;": { "codepoints": [8764], "characters": "\u223C" },                                                   // 1774
  "&simdot;": { "codepoints": [10858], "characters": "\u2A6A" },                                               // 1775
  "&sime;": { "codepoints": [8771], "characters": "\u2243" },                                                  // 1776
  "&simeq;": { "codepoints": [8771], "characters": "\u2243" },                                                 // 1777
  "&simg;": { "codepoints": [10910], "characters": "\u2A9E" },                                                 // 1778
  "&simgE;": { "codepoints": [10912], "characters": "\u2AA0" },                                                // 1779
  "&siml;": { "codepoints": [10909], "characters": "\u2A9D" },                                                 // 1780
  "&simlE;": { "codepoints": [10911], "characters": "\u2A9F" },                                                // 1781
  "&simne;": { "codepoints": [8774], "characters": "\u2246" },                                                 // 1782
  "&simplus;": { "codepoints": [10788], "characters": "\u2A24" },                                              // 1783
  "&simrarr;": { "codepoints": [10610], "characters": "\u2972" },                                              // 1784
  "&slarr;": { "codepoints": [8592], "characters": "\u2190" },                                                 // 1785
  "&SmallCircle;": { "codepoints": [8728], "characters": "\u2218" },                                           // 1786
  "&smallsetminus;": { "codepoints": [8726], "characters": "\u2216" },                                         // 1787
  "&smashp;": { "codepoints": [10803], "characters": "\u2A33" },                                               // 1788
  "&smeparsl;": { "codepoints": [10724], "characters": "\u29E4" },                                             // 1789
  "&smid;": { "codepoints": [8739], "characters": "\u2223" },                                                  // 1790
  "&smile;": { "codepoints": [8995], "characters": "\u2323" },                                                 // 1791
  "&smt;": { "codepoints": [10922], "characters": "\u2AAA" },                                                  // 1792
  "&smte;": { "codepoints": [10924], "characters": "\u2AAC" },                                                 // 1793
  "&smtes;": { "codepoints": [10924, 65024], "characters": "\u2AAC\uFE00" },                                   // 1794
  "&SOFTcy;": { "codepoints": [1068], "characters": "\u042C" },                                                // 1795
  "&softcy;": { "codepoints": [1100], "characters": "\u044C" },                                                // 1796
  "&solbar;": { "codepoints": [9023], "characters": "\u233F" },                                                // 1797
  "&solb;": { "codepoints": [10692], "characters": "\u29C4" },                                                 // 1798
  "&sol;": { "codepoints": [47], "characters": "\u002F" },                                                     // 1799
  "&Sopf;": { "codepoints": [120138], "characters": "\uD835\uDD4A" },                                          // 1800
  "&sopf;": { "codepoints": [120164], "characters": "\uD835\uDD64" },                                          // 1801
  "&spades;": { "codepoints": [9824], "characters": "\u2660" },                                                // 1802
  "&spadesuit;": { "codepoints": [9824], "characters": "\u2660" },                                             // 1803
  "&spar;": { "codepoints": [8741], "characters": "\u2225" },                                                  // 1804
  "&sqcap;": { "codepoints": [8851], "characters": "\u2293" },                                                 // 1805
  "&sqcaps;": { "codepoints": [8851, 65024], "characters": "\u2293\uFE00" },                                   // 1806
  "&sqcup;": { "codepoints": [8852], "characters": "\u2294" },                                                 // 1807
  "&sqcups;": { "codepoints": [8852, 65024], "characters": "\u2294\uFE00" },                                   // 1808
  "&Sqrt;": { "codepoints": [8730], "characters": "\u221A" },                                                  // 1809
  "&sqsub;": { "codepoints": [8847], "characters": "\u228F" },                                                 // 1810
  "&sqsube;": { "codepoints": [8849], "characters": "\u2291" },                                                // 1811
  "&sqsubset;": { "codepoints": [8847], "characters": "\u228F" },                                              // 1812
  "&sqsubseteq;": { "codepoints": [8849], "characters": "\u2291" },                                            // 1813
  "&sqsup;": { "codepoints": [8848], "characters": "\u2290" },                                                 // 1814
  "&sqsupe;": { "codepoints": [8850], "characters": "\u2292" },                                                // 1815
  "&sqsupset;": { "codepoints": [8848], "characters": "\u2290" },                                              // 1816
  "&sqsupseteq;": { "codepoints": [8850], "characters": "\u2292" },                                            // 1817
  "&square;": { "codepoints": [9633], "characters": "\u25A1" },                                                // 1818
  "&Square;": { "codepoints": [9633], "characters": "\u25A1" },                                                // 1819
  "&SquareIntersection;": { "codepoints": [8851], "characters": "\u2293" },                                    // 1820
  "&SquareSubset;": { "codepoints": [8847], "characters": "\u228F" },                                          // 1821
  "&SquareSubsetEqual;": { "codepoints": [8849], "characters": "\u2291" },                                     // 1822
  "&SquareSuperset;": { "codepoints": [8848], "characters": "\u2290" },                                        // 1823
  "&SquareSupersetEqual;": { "codepoints": [8850], "characters": "\u2292" },                                   // 1824
  "&SquareUnion;": { "codepoints": [8852], "characters": "\u2294" },                                           // 1825
  "&squarf;": { "codepoints": [9642], "characters": "\u25AA" },                                                // 1826
  "&squ;": { "codepoints": [9633], "characters": "\u25A1" },                                                   // 1827
  "&squf;": { "codepoints": [9642], "characters": "\u25AA" },                                                  // 1828
  "&srarr;": { "codepoints": [8594], "characters": "\u2192" },                                                 // 1829
  "&Sscr;": { "codepoints": [119982], "characters": "\uD835\uDCAE" },                                          // 1830
  "&sscr;": { "codepoints": [120008], "characters": "\uD835\uDCC8" },                                          // 1831
  "&ssetmn;": { "codepoints": [8726], "characters": "\u2216" },                                                // 1832
  "&ssmile;": { "codepoints": [8995], "characters": "\u2323" },                                                // 1833
  "&sstarf;": { "codepoints": [8902], "characters": "\u22C6" },                                                // 1834
  "&Star;": { "codepoints": [8902], "characters": "\u22C6" },                                                  // 1835
  "&star;": { "codepoints": [9734], "characters": "\u2606" },                                                  // 1836
  "&starf;": { "codepoints": [9733], "characters": "\u2605" },                                                 // 1837
  "&straightepsilon;": { "codepoints": [1013], "characters": "\u03F5" },                                       // 1838
  "&straightphi;": { "codepoints": [981], "characters": "\u03D5" },                                            // 1839
  "&strns;": { "codepoints": [175], "characters": "\u00AF" },                                                  // 1840
  "&sub;": { "codepoints": [8834], "characters": "\u2282" },                                                   // 1841
  "&Sub;": { "codepoints": [8912], "characters": "\u22D0" },                                                   // 1842
  "&subdot;": { "codepoints": [10941], "characters": "\u2ABD" },                                               // 1843
  "&subE;": { "codepoints": [10949], "characters": "\u2AC5" },                                                 // 1844
  "&sube;": { "codepoints": [8838], "characters": "\u2286" },                                                  // 1845
  "&subedot;": { "codepoints": [10947], "characters": "\u2AC3" },                                              // 1846
  "&submult;": { "codepoints": [10945], "characters": "\u2AC1" },                                              // 1847
  "&subnE;": { "codepoints": [10955], "characters": "\u2ACB" },                                                // 1848
  "&subne;": { "codepoints": [8842], "characters": "\u228A" },                                                 // 1849
  "&subplus;": { "codepoints": [10943], "characters": "\u2ABF" },                                              // 1850
  "&subrarr;": { "codepoints": [10617], "characters": "\u2979" },                                              // 1851
  "&subset;": { "codepoints": [8834], "characters": "\u2282" },                                                // 1852
  "&Subset;": { "codepoints": [8912], "characters": "\u22D0" },                                                // 1853
  "&subseteq;": { "codepoints": [8838], "characters": "\u2286" },                                              // 1854
  "&subseteqq;": { "codepoints": [10949], "characters": "\u2AC5" },                                            // 1855
  "&SubsetEqual;": { "codepoints": [8838], "characters": "\u2286" },                                           // 1856
  "&subsetneq;": { "codepoints": [8842], "characters": "\u228A" },                                             // 1857
  "&subsetneqq;": { "codepoints": [10955], "characters": "\u2ACB" },                                           // 1858
  "&subsim;": { "codepoints": [10951], "characters": "\u2AC7" },                                               // 1859
  "&subsub;": { "codepoints": [10965], "characters": "\u2AD5" },                                               // 1860
  "&subsup;": { "codepoints": [10963], "characters": "\u2AD3" },                                               // 1861
  "&succapprox;": { "codepoints": [10936], "characters": "\u2AB8" },                                           // 1862
  "&succ;": { "codepoints": [8827], "characters": "\u227B" },                                                  // 1863
  "&succcurlyeq;": { "codepoints": [8829], "characters": "\u227D" },                                           // 1864
  "&Succeeds;": { "codepoints": [8827], "characters": "\u227B" },                                              // 1865
  "&SucceedsEqual;": { "codepoints": [10928], "characters": "\u2AB0" },                                        // 1866
  "&SucceedsSlantEqual;": { "codepoints": [8829], "characters": "\u227D" },                                    // 1867
  "&SucceedsTilde;": { "codepoints": [8831], "characters": "\u227F" },                                         // 1868
  "&succeq;": { "codepoints": [10928], "characters": "\u2AB0" },                                               // 1869
  "&succnapprox;": { "codepoints": [10938], "characters": "\u2ABA" },                                          // 1870
  "&succneqq;": { "codepoints": [10934], "characters": "\u2AB6" },                                             // 1871
  "&succnsim;": { "codepoints": [8937], "characters": "\u22E9" },                                              // 1872
  "&succsim;": { "codepoints": [8831], "characters": "\u227F" },                                               // 1873
  "&SuchThat;": { "codepoints": [8715], "characters": "\u220B" },                                              // 1874
  "&sum;": { "codepoints": [8721], "characters": "\u2211" },                                                   // 1875
  "&Sum;": { "codepoints": [8721], "characters": "\u2211" },                                                   // 1876
  "&sung;": { "codepoints": [9834], "characters": "\u266A" },                                                  // 1877
  "&sup1;": { "codepoints": [185], "characters": "\u00B9" },                                                   // 1878
  "&sup1": { "codepoints": [185], "characters": "\u00B9" },                                                    // 1879
  "&sup2;": { "codepoints": [178], "characters": "\u00B2" },                                                   // 1880
  "&sup2": { "codepoints": [178], "characters": "\u00B2" },                                                    // 1881
  "&sup3;": { "codepoints": [179], "characters": "\u00B3" },                                                   // 1882
  "&sup3": { "codepoints": [179], "characters": "\u00B3" },                                                    // 1883
  "&sup;": { "codepoints": [8835], "characters": "\u2283" },                                                   // 1884
  "&Sup;": { "codepoints": [8913], "characters": "\u22D1" },                                                   // 1885
  "&supdot;": { "codepoints": [10942], "characters": "\u2ABE" },                                               // 1886
  "&supdsub;": { "codepoints": [10968], "characters": "\u2AD8" },                                              // 1887
  "&supE;": { "codepoints": [10950], "characters": "\u2AC6" },                                                 // 1888
  "&supe;": { "codepoints": [8839], "characters": "\u2287" },                                                  // 1889
  "&supedot;": { "codepoints": [10948], "characters": "\u2AC4" },                                              // 1890
  "&Superset;": { "codepoints": [8835], "characters": "\u2283" },                                              // 1891
  "&SupersetEqual;": { "codepoints": [8839], "characters": "\u2287" },                                         // 1892
  "&suphsol;": { "codepoints": [10185], "characters": "\u27C9" },                                              // 1893
  "&suphsub;": { "codepoints": [10967], "characters": "\u2AD7" },                                              // 1894
  "&suplarr;": { "codepoints": [10619], "characters": "\u297B" },                                              // 1895
  "&supmult;": { "codepoints": [10946], "characters": "\u2AC2" },                                              // 1896
  "&supnE;": { "codepoints": [10956], "characters": "\u2ACC" },                                                // 1897
  "&supne;": { "codepoints": [8843], "characters": "\u228B" },                                                 // 1898
  "&supplus;": { "codepoints": [10944], "characters": "\u2AC0" },                                              // 1899
  "&supset;": { "codepoints": [8835], "characters": "\u2283" },                                                // 1900
  "&Supset;": { "codepoints": [8913], "characters": "\u22D1" },                                                // 1901
  "&supseteq;": { "codepoints": [8839], "characters": "\u2287" },                                              // 1902
  "&supseteqq;": { "codepoints": [10950], "characters": "\u2AC6" },                                            // 1903
  "&supsetneq;": { "codepoints": [8843], "characters": "\u228B" },                                             // 1904
  "&supsetneqq;": { "codepoints": [10956], "characters": "\u2ACC" },                                           // 1905
  "&supsim;": { "codepoints": [10952], "characters": "\u2AC8" },                                               // 1906
  "&supsub;": { "codepoints": [10964], "characters": "\u2AD4" },                                               // 1907
  "&supsup;": { "codepoints": [10966], "characters": "\u2AD6" },                                               // 1908
  "&swarhk;": { "codepoints": [10534], "characters": "\u2926" },                                               // 1909
  "&swarr;": { "codepoints": [8601], "characters": "\u2199" },                                                 // 1910
  "&swArr;": { "codepoints": [8665], "characters": "\u21D9" },                                                 // 1911
  "&swarrow;": { "codepoints": [8601], "characters": "\u2199" },                                               // 1912
  "&swnwar;": { "codepoints": [10538], "characters": "\u292A" },                                               // 1913
  "&szlig;": { "codepoints": [223], "characters": "\u00DF" },                                                  // 1914
  "&szlig": { "codepoints": [223], "characters": "\u00DF" },                                                   // 1915
  "&Tab;": { "codepoints": [9], "characters": "\u0009" },                                                      // 1916
  "&target;": { "codepoints": [8982], "characters": "\u2316" },                                                // 1917
  "&Tau;": { "codepoints": [932], "characters": "\u03A4" },                                                    // 1918
  "&tau;": { "codepoints": [964], "characters": "\u03C4" },                                                    // 1919
  "&tbrk;": { "codepoints": [9140], "characters": "\u23B4" },                                                  // 1920
  "&Tcaron;": { "codepoints": [356], "characters": "\u0164" },                                                 // 1921
  "&tcaron;": { "codepoints": [357], "characters": "\u0165" },                                                 // 1922
  "&Tcedil;": { "codepoints": [354], "characters": "\u0162" },                                                 // 1923
  "&tcedil;": { "codepoints": [355], "characters": "\u0163" },                                                 // 1924
  "&Tcy;": { "codepoints": [1058], "characters": "\u0422" },                                                   // 1925
  "&tcy;": { "codepoints": [1090], "characters": "\u0442" },                                                   // 1926
  "&tdot;": { "codepoints": [8411], "characters": "\u20DB" },                                                  // 1927
  "&telrec;": { "codepoints": [8981], "characters": "\u2315" },                                                // 1928
  "&Tfr;": { "codepoints": [120087], "characters": "\uD835\uDD17" },                                           // 1929
  "&tfr;": { "codepoints": [120113], "characters": "\uD835\uDD31" },                                           // 1930
  "&there4;": { "codepoints": [8756], "characters": "\u2234" },                                                // 1931
  "&therefore;": { "codepoints": [8756], "characters": "\u2234" },                                             // 1932
  "&Therefore;": { "codepoints": [8756], "characters": "\u2234" },                                             // 1933
  "&Theta;": { "codepoints": [920], "characters": "\u0398" },                                                  // 1934
  "&theta;": { "codepoints": [952], "characters": "\u03B8" },                                                  // 1935
  "&thetasym;": { "codepoints": [977], "characters": "\u03D1" },                                               // 1936
  "&thetav;": { "codepoints": [977], "characters": "\u03D1" },                                                 // 1937
  "&thickapprox;": { "codepoints": [8776], "characters": "\u2248" },                                           // 1938
  "&thicksim;": { "codepoints": [8764], "characters": "\u223C" },                                              // 1939
  "&ThickSpace;": { "codepoints": [8287, 8202], "characters": "\u205F\u200A" },                                // 1940
  "&ThinSpace;": { "codepoints": [8201], "characters": "\u2009" },                                             // 1941
  "&thinsp;": { "codepoints": [8201], "characters": "\u2009" },                                                // 1942
  "&thkap;": { "codepoints": [8776], "characters": "\u2248" },                                                 // 1943
  "&thksim;": { "codepoints": [8764], "characters": "\u223C" },                                                // 1944
  "&THORN;": { "codepoints": [222], "characters": "\u00DE" },                                                  // 1945
  "&THORN": { "codepoints": [222], "characters": "\u00DE" },                                                   // 1946
  "&thorn;": { "codepoints": [254], "characters": "\u00FE" },                                                  // 1947
  "&thorn": { "codepoints": [254], "characters": "\u00FE" },                                                   // 1948
  "&tilde;": { "codepoints": [732], "characters": "\u02DC" },                                                  // 1949
  "&Tilde;": { "codepoints": [8764], "characters": "\u223C" },                                                 // 1950
  "&TildeEqual;": { "codepoints": [8771], "characters": "\u2243" },                                            // 1951
  "&TildeFullEqual;": { "codepoints": [8773], "characters": "\u2245" },                                        // 1952
  "&TildeTilde;": { "codepoints": [8776], "characters": "\u2248" },                                            // 1953
  "&timesbar;": { "codepoints": [10801], "characters": "\u2A31" },                                             // 1954
  "&timesb;": { "codepoints": [8864], "characters": "\u22A0" },                                                // 1955
  "&times;": { "codepoints": [215], "characters": "\u00D7" },                                                  // 1956
  "&times": { "codepoints": [215], "characters": "\u00D7" },                                                   // 1957
  "&timesd;": { "codepoints": [10800], "characters": "\u2A30" },                                               // 1958
  "&tint;": { "codepoints": [8749], "characters": "\u222D" },                                                  // 1959
  "&toea;": { "codepoints": [10536], "characters": "\u2928" },                                                 // 1960
  "&topbot;": { "codepoints": [9014], "characters": "\u2336" },                                                // 1961
  "&topcir;": { "codepoints": [10993], "characters": "\u2AF1" },                                               // 1962
  "&top;": { "codepoints": [8868], "characters": "\u22A4" },                                                   // 1963
  "&Topf;": { "codepoints": [120139], "characters": "\uD835\uDD4B" },                                          // 1964
  "&topf;": { "codepoints": [120165], "characters": "\uD835\uDD65" },                                          // 1965
  "&topfork;": { "codepoints": [10970], "characters": "\u2ADA" },                                              // 1966
  "&tosa;": { "codepoints": [10537], "characters": "\u2929" },                                                 // 1967
  "&tprime;": { "codepoints": [8244], "characters": "\u2034" },                                                // 1968
  "&trade;": { "codepoints": [8482], "characters": "\u2122" },                                                 // 1969
  "&TRADE;": { "codepoints": [8482], "characters": "\u2122" },                                                 // 1970
  "&triangle;": { "codepoints": [9653], "characters": "\u25B5" },                                              // 1971
  "&triangledown;": { "codepoints": [9663], "characters": "\u25BF" },                                          // 1972
  "&triangleleft;": { "codepoints": [9667], "characters": "\u25C3" },                                          // 1973
  "&trianglelefteq;": { "codepoints": [8884], "characters": "\u22B4" },                                        // 1974
  "&triangleq;": { "codepoints": [8796], "characters": "\u225C" },                                             // 1975
  "&triangleright;": { "codepoints": [9657], "characters": "\u25B9" },                                         // 1976
  "&trianglerighteq;": { "codepoints": [8885], "characters": "\u22B5" },                                       // 1977
  "&tridot;": { "codepoints": [9708], "characters": "\u25EC" },                                                // 1978
  "&trie;": { "codepoints": [8796], "characters": "\u225C" },                                                  // 1979
  "&triminus;": { "codepoints": [10810], "characters": "\u2A3A" },                                             // 1980
  "&TripleDot;": { "codepoints": [8411], "characters": "\u20DB" },                                             // 1981
  "&triplus;": { "codepoints": [10809], "characters": "\u2A39" },                                              // 1982
  "&trisb;": { "codepoints": [10701], "characters": "\u29CD" },                                                // 1983
  "&tritime;": { "codepoints": [10811], "characters": "\u2A3B" },                                              // 1984
  "&trpezium;": { "codepoints": [9186], "characters": "\u23E2" },                                              // 1985
  "&Tscr;": { "codepoints": [119983], "characters": "\uD835\uDCAF" },                                          // 1986
  "&tscr;": { "codepoints": [120009], "characters": "\uD835\uDCC9" },                                          // 1987
  "&TScy;": { "codepoints": [1062], "characters": "\u0426" },                                                  // 1988
  "&tscy;": { "codepoints": [1094], "characters": "\u0446" },                                                  // 1989
  "&TSHcy;": { "codepoints": [1035], "characters": "\u040B" },                                                 // 1990
  "&tshcy;": { "codepoints": [1115], "characters": "\u045B" },                                                 // 1991
  "&Tstrok;": { "codepoints": [358], "characters": "\u0166" },                                                 // 1992
  "&tstrok;": { "codepoints": [359], "characters": "\u0167" },                                                 // 1993
  "&twixt;": { "codepoints": [8812], "characters": "\u226C" },                                                 // 1994
  "&twoheadleftarrow;": { "codepoints": [8606], "characters": "\u219E" },                                      // 1995
  "&twoheadrightarrow;": { "codepoints": [8608], "characters": "\u21A0" },                                     // 1996
  "&Uacute;": { "codepoints": [218], "characters": "\u00DA" },                                                 // 1997
  "&Uacute": { "codepoints": [218], "characters": "\u00DA" },                                                  // 1998
  "&uacute;": { "codepoints": [250], "characters": "\u00FA" },                                                 // 1999
  "&uacute": { "codepoints": [250], "characters": "\u00FA" },                                                  // 2000
  "&uarr;": { "codepoints": [8593], "characters": "\u2191" },                                                  // 2001
  "&Uarr;": { "codepoints": [8607], "characters": "\u219F" },                                                  // 2002
  "&uArr;": { "codepoints": [8657], "characters": "\u21D1" },                                                  // 2003
  "&Uarrocir;": { "codepoints": [10569], "characters": "\u2949" },                                             // 2004
  "&Ubrcy;": { "codepoints": [1038], "characters": "\u040E" },                                                 // 2005
  "&ubrcy;": { "codepoints": [1118], "characters": "\u045E" },                                                 // 2006
  "&Ubreve;": { "codepoints": [364], "characters": "\u016C" },                                                 // 2007
  "&ubreve;": { "codepoints": [365], "characters": "\u016D" },                                                 // 2008
  "&Ucirc;": { "codepoints": [219], "characters": "\u00DB" },                                                  // 2009
  "&Ucirc": { "codepoints": [219], "characters": "\u00DB" },                                                   // 2010
  "&ucirc;": { "codepoints": [251], "characters": "\u00FB" },                                                  // 2011
  "&ucirc": { "codepoints": [251], "characters": "\u00FB" },                                                   // 2012
  "&Ucy;": { "codepoints": [1059], "characters": "\u0423" },                                                   // 2013
  "&ucy;": { "codepoints": [1091], "characters": "\u0443" },                                                   // 2014
  "&udarr;": { "codepoints": [8645], "characters": "\u21C5" },                                                 // 2015
  "&Udblac;": { "codepoints": [368], "characters": "\u0170" },                                                 // 2016
  "&udblac;": { "codepoints": [369], "characters": "\u0171" },                                                 // 2017
  "&udhar;": { "codepoints": [10606], "characters": "\u296E" },                                                // 2018
  "&ufisht;": { "codepoints": [10622], "characters": "\u297E" },                                               // 2019
  "&Ufr;": { "codepoints": [120088], "characters": "\uD835\uDD18" },                                           // 2020
  "&ufr;": { "codepoints": [120114], "characters": "\uD835\uDD32" },                                           // 2021
  "&Ugrave;": { "codepoints": [217], "characters": "\u00D9" },                                                 // 2022
  "&Ugrave": { "codepoints": [217], "characters": "\u00D9" },                                                  // 2023
  "&ugrave;": { "codepoints": [249], "characters": "\u00F9" },                                                 // 2024
  "&ugrave": { "codepoints": [249], "characters": "\u00F9" },                                                  // 2025
  "&uHar;": { "codepoints": [10595], "characters": "\u2963" },                                                 // 2026
  "&uharl;": { "codepoints": [8639], "characters": "\u21BF" },                                                 // 2027
  "&uharr;": { "codepoints": [8638], "characters": "\u21BE" },                                                 // 2028
  "&uhblk;": { "codepoints": [9600], "characters": "\u2580" },                                                 // 2029
  "&ulcorn;": { "codepoints": [8988], "characters": "\u231C" },                                                // 2030
  "&ulcorner;": { "codepoints": [8988], "characters": "\u231C" },                                              // 2031
  "&ulcrop;": { "codepoints": [8975], "characters": "\u230F" },                                                // 2032
  "&ultri;": { "codepoints": [9720], "characters": "\u25F8" },                                                 // 2033
  "&Umacr;": { "codepoints": [362], "characters": "\u016A" },                                                  // 2034
  "&umacr;": { "codepoints": [363], "characters": "\u016B" },                                                  // 2035
  "&uml;": { "codepoints": [168], "characters": "\u00A8" },                                                    // 2036
  "&uml": { "codepoints": [168], "characters": "\u00A8" },                                                     // 2037
  "&UnderBar;": { "codepoints": [95], "characters": "\u005F" },                                                // 2038
  "&UnderBrace;": { "codepoints": [9183], "characters": "\u23DF" },                                            // 2039
  "&UnderBracket;": { "codepoints": [9141], "characters": "\u23B5" },                                          // 2040
  "&UnderParenthesis;": { "codepoints": [9181], "characters": "\u23DD" },                                      // 2041
  "&Union;": { "codepoints": [8899], "characters": "\u22C3" },                                                 // 2042
  "&UnionPlus;": { "codepoints": [8846], "characters": "\u228E" },                                             // 2043
  "&Uogon;": { "codepoints": [370], "characters": "\u0172" },                                                  // 2044
  "&uogon;": { "codepoints": [371], "characters": "\u0173" },                                                  // 2045
  "&Uopf;": { "codepoints": [120140], "characters": "\uD835\uDD4C" },                                          // 2046
  "&uopf;": { "codepoints": [120166], "characters": "\uD835\uDD66" },                                          // 2047
  "&UpArrowBar;": { "codepoints": [10514], "characters": "\u2912" },                                           // 2048
  "&uparrow;": { "codepoints": [8593], "characters": "\u2191" },                                               // 2049
  "&UpArrow;": { "codepoints": [8593], "characters": "\u2191" },                                               // 2050
  "&Uparrow;": { "codepoints": [8657], "characters": "\u21D1" },                                               // 2051
  "&UpArrowDownArrow;": { "codepoints": [8645], "characters": "\u21C5" },                                      // 2052
  "&updownarrow;": { "codepoints": [8597], "characters": "\u2195" },                                           // 2053
  "&UpDownArrow;": { "codepoints": [8597], "characters": "\u2195" },                                           // 2054
  "&Updownarrow;": { "codepoints": [8661], "characters": "\u21D5" },                                           // 2055
  "&UpEquilibrium;": { "codepoints": [10606], "characters": "\u296E" },                                        // 2056
  "&upharpoonleft;": { "codepoints": [8639], "characters": "\u21BF" },                                         // 2057
  "&upharpoonright;": { "codepoints": [8638], "characters": "\u21BE" },                                        // 2058
  "&uplus;": { "codepoints": [8846], "characters": "\u228E" },                                                 // 2059
  "&UpperLeftArrow;": { "codepoints": [8598], "characters": "\u2196" },                                        // 2060
  "&UpperRightArrow;": { "codepoints": [8599], "characters": "\u2197" },                                       // 2061
  "&upsi;": { "codepoints": [965], "characters": "\u03C5" },                                                   // 2062
  "&Upsi;": { "codepoints": [978], "characters": "\u03D2" },                                                   // 2063
  "&upsih;": { "codepoints": [978], "characters": "\u03D2" },                                                  // 2064
  "&Upsilon;": { "codepoints": [933], "characters": "\u03A5" },                                                // 2065
  "&upsilon;": { "codepoints": [965], "characters": "\u03C5" },                                                // 2066
  "&UpTeeArrow;": { "codepoints": [8613], "characters": "\u21A5" },                                            // 2067
  "&UpTee;": { "codepoints": [8869], "characters": "\u22A5" },                                                 // 2068
  "&upuparrows;": { "codepoints": [8648], "characters": "\u21C8" },                                            // 2069
  "&urcorn;": { "codepoints": [8989], "characters": "\u231D" },                                                // 2070
  "&urcorner;": { "codepoints": [8989], "characters": "\u231D" },                                              // 2071
  "&urcrop;": { "codepoints": [8974], "characters": "\u230E" },                                                // 2072
  "&Uring;": { "codepoints": [366], "characters": "\u016E" },                                                  // 2073
  "&uring;": { "codepoints": [367], "characters": "\u016F" },                                                  // 2074
  "&urtri;": { "codepoints": [9721], "characters": "\u25F9" },                                                 // 2075
  "&Uscr;": { "codepoints": [119984], "characters": "\uD835\uDCB0" },                                          // 2076
  "&uscr;": { "codepoints": [120010], "characters": "\uD835\uDCCA" },                                          // 2077
  "&utdot;": { "codepoints": [8944], "characters": "\u22F0" },                                                 // 2078
  "&Utilde;": { "codepoints": [360], "characters": "\u0168" },                                                 // 2079
  "&utilde;": { "codepoints": [361], "characters": "\u0169" },                                                 // 2080
  "&utri;": { "codepoints": [9653], "characters": "\u25B5" },                                                  // 2081
  "&utrif;": { "codepoints": [9652], "characters": "\u25B4" },                                                 // 2082
  "&uuarr;": { "codepoints": [8648], "characters": "\u21C8" },                                                 // 2083
  "&Uuml;": { "codepoints": [220], "characters": "\u00DC" },                                                   // 2084
  "&Uuml": { "codepoints": [220], "characters": "\u00DC" },                                                    // 2085
  "&uuml;": { "codepoints": [252], "characters": "\u00FC" },                                                   // 2086
  "&uuml": { "codepoints": [252], "characters": "\u00FC" },                                                    // 2087
  "&uwangle;": { "codepoints": [10663], "characters": "\u29A7" },                                              // 2088
  "&vangrt;": { "codepoints": [10652], "characters": "\u299C" },                                               // 2089
  "&varepsilon;": { "codepoints": [1013], "characters": "\u03F5" },                                            // 2090
  "&varkappa;": { "codepoints": [1008], "characters": "\u03F0" },                                              // 2091
  "&varnothing;": { "codepoints": [8709], "characters": "\u2205" },                                            // 2092
  "&varphi;": { "codepoints": [981], "characters": "\u03D5" },                                                 // 2093
  "&varpi;": { "codepoints": [982], "characters": "\u03D6" },                                                  // 2094
  "&varpropto;": { "codepoints": [8733], "characters": "\u221D" },                                             // 2095
  "&varr;": { "codepoints": [8597], "characters": "\u2195" },                                                  // 2096
  "&vArr;": { "codepoints": [8661], "characters": "\u21D5" },                                                  // 2097
  "&varrho;": { "codepoints": [1009], "characters": "\u03F1" },                                                // 2098
  "&varsigma;": { "codepoints": [962], "characters": "\u03C2" },                                               // 2099
  "&varsubsetneq;": { "codepoints": [8842, 65024], "characters": "\u228A\uFE00" },                             // 2100
  "&varsubsetneqq;": { "codepoints": [10955, 65024], "characters": "\u2ACB\uFE00" },                           // 2101
  "&varsupsetneq;": { "codepoints": [8843, 65024], "characters": "\u228B\uFE00" },                             // 2102
  "&varsupsetneqq;": { "codepoints": [10956, 65024], "characters": "\u2ACC\uFE00" },                           // 2103
  "&vartheta;": { "codepoints": [977], "characters": "\u03D1" },                                               // 2104
  "&vartriangleleft;": { "codepoints": [8882], "characters": "\u22B2" },                                       // 2105
  "&vartriangleright;": { "codepoints": [8883], "characters": "\u22B3" },                                      // 2106
  "&vBar;": { "codepoints": [10984], "characters": "\u2AE8" },                                                 // 2107
  "&Vbar;": { "codepoints": [10987], "characters": "\u2AEB" },                                                 // 2108
  "&vBarv;": { "codepoints": [10985], "characters": "\u2AE9" },                                                // 2109
  "&Vcy;": { "codepoints": [1042], "characters": "\u0412" },                                                   // 2110
  "&vcy;": { "codepoints": [1074], "characters": "\u0432" },                                                   // 2111
  "&vdash;": { "codepoints": [8866], "characters": "\u22A2" },                                                 // 2112
  "&vDash;": { "codepoints": [8872], "characters": "\u22A8" },                                                 // 2113
  "&Vdash;": { "codepoints": [8873], "characters": "\u22A9" },                                                 // 2114
  "&VDash;": { "codepoints": [8875], "characters": "\u22AB" },                                                 // 2115
  "&Vdashl;": { "codepoints": [10982], "characters": "\u2AE6" },                                               // 2116
  "&veebar;": { "codepoints": [8891], "characters": "\u22BB" },                                                // 2117
  "&vee;": { "codepoints": [8744], "characters": "\u2228" },                                                   // 2118
  "&Vee;": { "codepoints": [8897], "characters": "\u22C1" },                                                   // 2119
  "&veeeq;": { "codepoints": [8794], "characters": "\u225A" },                                                 // 2120
  "&vellip;": { "codepoints": [8942], "characters": "\u22EE" },                                                // 2121
  "&verbar;": { "codepoints": [124], "characters": "\u007C" },                                                 // 2122
  "&Verbar;": { "codepoints": [8214], "characters": "\u2016" },                                                // 2123
  "&vert;": { "codepoints": [124], "characters": "\u007C" },                                                   // 2124
  "&Vert;": { "codepoints": [8214], "characters": "\u2016" },                                                  // 2125
  "&VerticalBar;": { "codepoints": [8739], "characters": "\u2223" },                                           // 2126
  "&VerticalLine;": { "codepoints": [124], "characters": "\u007C" },                                           // 2127
  "&VerticalSeparator;": { "codepoints": [10072], "characters": "\u2758" },                                    // 2128
  "&VerticalTilde;": { "codepoints": [8768], "characters": "\u2240" },                                         // 2129
  "&VeryThinSpace;": { "codepoints": [8202], "characters": "\u200A" },                                         // 2130
  "&Vfr;": { "codepoints": [120089], "characters": "\uD835\uDD19" },                                           // 2131
  "&vfr;": { "codepoints": [120115], "characters": "\uD835\uDD33" },                                           // 2132
  "&vltri;": { "codepoints": [8882], "characters": "\u22B2" },                                                 // 2133
  "&vnsub;": { "codepoints": [8834, 8402], "characters": "\u2282\u20D2" },                                     // 2134
  "&vnsup;": { "codepoints": [8835, 8402], "characters": "\u2283\u20D2" },                                     // 2135
  "&Vopf;": { "codepoints": [120141], "characters": "\uD835\uDD4D" },                                          // 2136
  "&vopf;": { "codepoints": [120167], "characters": "\uD835\uDD67" },                                          // 2137
  "&vprop;": { "codepoints": [8733], "characters": "\u221D" },                                                 // 2138
  "&vrtri;": { "codepoints": [8883], "characters": "\u22B3" },                                                 // 2139
  "&Vscr;": { "codepoints": [119985], "characters": "\uD835\uDCB1" },                                          // 2140
  "&vscr;": { "codepoints": [120011], "characters": "\uD835\uDCCB" },                                          // 2141
  "&vsubnE;": { "codepoints": [10955, 65024], "characters": "\u2ACB\uFE00" },                                  // 2142
  "&vsubne;": { "codepoints": [8842, 65024], "characters": "\u228A\uFE00" },                                   // 2143
  "&vsupnE;": { "codepoints": [10956, 65024], "characters": "\u2ACC\uFE00" },                                  // 2144
  "&vsupne;": { "codepoints": [8843, 65024], "characters": "\u228B\uFE00" },                                   // 2145
  "&Vvdash;": { "codepoints": [8874], "characters": "\u22AA" },                                                // 2146
  "&vzigzag;": { "codepoints": [10650], "characters": "\u299A" },                                              // 2147
  "&Wcirc;": { "codepoints": [372], "characters": "\u0174" },                                                  // 2148
  "&wcirc;": { "codepoints": [373], "characters": "\u0175" },                                                  // 2149
  "&wedbar;": { "codepoints": [10847], "characters": "\u2A5F" },                                               // 2150
  "&wedge;": { "codepoints": [8743], "characters": "\u2227" },                                                 // 2151
  "&Wedge;": { "codepoints": [8896], "characters": "\u22C0" },                                                 // 2152
  "&wedgeq;": { "codepoints": [8793], "characters": "\u2259" },                                                // 2153
  "&weierp;": { "codepoints": [8472], "characters": "\u2118" },                                                // 2154
  "&Wfr;": { "codepoints": [120090], "characters": "\uD835\uDD1A" },                                           // 2155
  "&wfr;": { "codepoints": [120116], "characters": "\uD835\uDD34" },                                           // 2156
  "&Wopf;": { "codepoints": [120142], "characters": "\uD835\uDD4E" },                                          // 2157
  "&wopf;": { "codepoints": [120168], "characters": "\uD835\uDD68" },                                          // 2158
  "&wp;": { "codepoints": [8472], "characters": "\u2118" },                                                    // 2159
  "&wr;": { "codepoints": [8768], "characters": "\u2240" },                                                    // 2160
  "&wreath;": { "codepoints": [8768], "characters": "\u2240" },                                                // 2161
  "&Wscr;": { "codepoints": [119986], "characters": "\uD835\uDCB2" },                                          // 2162
  "&wscr;": { "codepoints": [120012], "characters": "\uD835\uDCCC" },                                          // 2163
  "&xcap;": { "codepoints": [8898], "characters": "\u22C2" },                                                  // 2164
  "&xcirc;": { "codepoints": [9711], "characters": "\u25EF" },                                                 // 2165
  "&xcup;": { "codepoints": [8899], "characters": "\u22C3" },                                                  // 2166
  "&xdtri;": { "codepoints": [9661], "characters": "\u25BD" },                                                 // 2167
  "&Xfr;": { "codepoints": [120091], "characters": "\uD835\uDD1B" },                                           // 2168
  "&xfr;": { "codepoints": [120117], "characters": "\uD835\uDD35" },                                           // 2169
  "&xharr;": { "codepoints": [10231], "characters": "\u27F7" },                                                // 2170
  "&xhArr;": { "codepoints": [10234], "characters": "\u27FA" },                                                // 2171
  "&Xi;": { "codepoints": [926], "characters": "\u039E" },                                                     // 2172
  "&xi;": { "codepoints": [958], "characters": "\u03BE" },                                                     // 2173
  "&xlarr;": { "codepoints": [10229], "characters": "\u27F5" },                                                // 2174
  "&xlArr;": { "codepoints": [10232], "characters": "\u27F8" },                                                // 2175
  "&xmap;": { "codepoints": [10236], "characters": "\u27FC" },                                                 // 2176
  "&xnis;": { "codepoints": [8955], "characters": "\u22FB" },                                                  // 2177
  "&xodot;": { "codepoints": [10752], "characters": "\u2A00" },                                                // 2178
  "&Xopf;": { "codepoints": [120143], "characters": "\uD835\uDD4F" },                                          // 2179
  "&xopf;": { "codepoints": [120169], "characters": "\uD835\uDD69" },                                          // 2180
  "&xoplus;": { "codepoints": [10753], "characters": "\u2A01" },                                               // 2181
  "&xotime;": { "codepoints": [10754], "characters": "\u2A02" },                                               // 2182
  "&xrarr;": { "codepoints": [10230], "characters": "\u27F6" },                                                // 2183
  "&xrArr;": { "codepoints": [10233], "characters": "\u27F9" },                                                // 2184
  "&Xscr;": { "codepoints": [119987], "characters": "\uD835\uDCB3" },                                          // 2185
  "&xscr;": { "codepoints": [120013], "characters": "\uD835\uDCCD" },                                          // 2186
  "&xsqcup;": { "codepoints": [10758], "characters": "\u2A06" },                                               // 2187
  "&xuplus;": { "codepoints": [10756], "characters": "\u2A04" },                                               // 2188
  "&xutri;": { "codepoints": [9651], "characters": "\u25B3" },                                                 // 2189
  "&xvee;": { "codepoints": [8897], "characters": "\u22C1" },                                                  // 2190
  "&xwedge;": { "codepoints": [8896], "characters": "\u22C0" },                                                // 2191
  "&Yacute;": { "codepoints": [221], "characters": "\u00DD" },                                                 // 2192
  "&Yacute": { "codepoints": [221], "characters": "\u00DD" },                                                  // 2193
  "&yacute;": { "codepoints": [253], "characters": "\u00FD" },                                                 // 2194
  "&yacute": { "codepoints": [253], "characters": "\u00FD" },                                                  // 2195
  "&YAcy;": { "codepoints": [1071], "characters": "\u042F" },                                                  // 2196
  "&yacy;": { "codepoints": [1103], "characters": "\u044F" },                                                  // 2197
  "&Ycirc;": { "codepoints": [374], "characters": "\u0176" },                                                  // 2198
  "&ycirc;": { "codepoints": [375], "characters": "\u0177" },                                                  // 2199
  "&Ycy;": { "codepoints": [1067], "characters": "\u042B" },                                                   // 2200
  "&ycy;": { "codepoints": [1099], "characters": "\u044B" },                                                   // 2201
  "&yen;": { "codepoints": [165], "characters": "\u00A5" },                                                    // 2202
  "&yen": { "codepoints": [165], "characters": "\u00A5" },                                                     // 2203
  "&Yfr;": { "codepoints": [120092], "characters": "\uD835\uDD1C" },                                           // 2204
  "&yfr;": { "codepoints": [120118], "characters": "\uD835\uDD36" },                                           // 2205
  "&YIcy;": { "codepoints": [1031], "characters": "\u0407" },                                                  // 2206
  "&yicy;": { "codepoints": [1111], "characters": "\u0457" },                                                  // 2207
  "&Yopf;": { "codepoints": [120144], "characters": "\uD835\uDD50" },                                          // 2208
  "&yopf;": { "codepoints": [120170], "characters": "\uD835\uDD6A" },                                          // 2209
  "&Yscr;": { "codepoints": [119988], "characters": "\uD835\uDCB4" },                                          // 2210
  "&yscr;": { "codepoints": [120014], "characters": "\uD835\uDCCE" },                                          // 2211
  "&YUcy;": { "codepoints": [1070], "characters": "\u042E" },                                                  // 2212
  "&yucy;": { "codepoints": [1102], "characters": "\u044E" },                                                  // 2213
  "&yuml;": { "codepoints": [255], "characters": "\u00FF" },                                                   // 2214
  "&yuml": { "codepoints": [255], "characters": "\u00FF" },                                                    // 2215
  "&Yuml;": { "codepoints": [376], "characters": "\u0178" },                                                   // 2216
  "&Zacute;": { "codepoints": [377], "characters": "\u0179" },                                                 // 2217
  "&zacute;": { "codepoints": [378], "characters": "\u017A" },                                                 // 2218
  "&Zcaron;": { "codepoints": [381], "characters": "\u017D" },                                                 // 2219
  "&zcaron;": { "codepoints": [382], "characters": "\u017E" },                                                 // 2220
  "&Zcy;": { "codepoints": [1047], "characters": "\u0417" },                                                   // 2221
  "&zcy;": { "codepoints": [1079], "characters": "\u0437" },                                                   // 2222
  "&Zdot;": { "codepoints": [379], "characters": "\u017B" },                                                   // 2223
  "&zdot;": { "codepoints": [380], "characters": "\u017C" },                                                   // 2224
  "&zeetrf;": { "codepoints": [8488], "characters": "\u2128" },                                                // 2225
  "&ZeroWidthSpace;": { "codepoints": [8203], "characters": "\u200B" },                                        // 2226
  "&Zeta;": { "codepoints": [918], "characters": "\u0396" },                                                   // 2227
  "&zeta;": { "codepoints": [950], "characters": "\u03B6" },                                                   // 2228
  "&zfr;": { "codepoints": [120119], "characters": "\uD835\uDD37" },                                           // 2229
  "&Zfr;": { "codepoints": [8488], "characters": "\u2128" },                                                   // 2230
  "&ZHcy;": { "codepoints": [1046], "characters": "\u0416" },                                                  // 2231
  "&zhcy;": { "codepoints": [1078], "characters": "\u0436" },                                                  // 2232
  "&zigrarr;": { "codepoints": [8669], "characters": "\u21DD" },                                               // 2233
  "&zopf;": { "codepoints": [120171], "characters": "\uD835\uDD6B" },                                          // 2234
  "&Zopf;": { "codepoints": [8484], "characters": "\u2124" },                                                  // 2235
  "&Zscr;": { "codepoints": [119989], "characters": "\uD835\uDCB5" },                                          // 2236
  "&zscr;": { "codepoints": [120015], "characters": "\uD835\uDCCF" },                                          // 2237
  "&zwj;": { "codepoints": [8205], "characters": "\u200D" },                                                   // 2238
  "&zwnj;": { "codepoints": [8204], "characters": "\u200C" }                                                   // 2239
};                                                                                                             // 2240
                                                                                                               // 2241
var ALPHANUMERIC = /^[a-zA-Z0-9]/;                                                                             // 2242
var getPossibleNamedEntityStart = makeRegexMatcher(/^&[a-zA-Z0-9]/);                                           // 2243
var getApparentNamedEntity = makeRegexMatcher(/^&[a-zA-Z0-9]+;/);                                              // 2244
                                                                                                               // 2245
var getNamedEntityByFirstChar = {};                                                                            // 2246
(function () {                                                                                                 // 2247
  var namedEntitiesByFirstChar = {};                                                                           // 2248
  for (var ent in ENTITIES) {                                                                                  // 2249
    var chr = ent.charAt(1);                                                                                   // 2250
    namedEntitiesByFirstChar[chr] = (namedEntitiesByFirstChar[chr] || []);                                     // 2251
    namedEntitiesByFirstChar[chr].push(ent.slice(2));                                                          // 2252
  }                                                                                                            // 2253
  for (var chr in namedEntitiesByFirstChar) {                                                                  // 2254
    getNamedEntityByFirstChar[chr] = makeRegexMatcher(                                                         // 2255
      new RegExp('^&' + chr + '(?:' +                                                                          // 2256
                 namedEntitiesByFirstChar[chr].join('|') + ')'));                                              // 2257
  }                                                                                                            // 2258
})();                                                                                                          // 2259
                                                                                                               // 2260
// Run a provided "matcher" function but reset the current position afterwards.                                // 2261
// Fatal failure of the matcher is not suppressed.                                                             // 2262
var peekMatcher = function (scanner, matcher) {                                                                // 2263
  var start = scanner.pos;                                                                                     // 2264
  var result = matcher(scanner);                                                                               // 2265
  scanner.pos = start;                                                                                         // 2266
  return result;                                                                                               // 2267
};                                                                                                             // 2268
                                                                                                               // 2269
// Returns a string like "&amp;" or a falsy value if no match.  Fails fatally                                  // 2270
// if something looks like a named entity but isn't.                                                           // 2271
var getNamedCharRef = function (scanner, inAttribute) {                                                        // 2272
  // look for `&` followed by alphanumeric                                                                     // 2273
  if (! peekMatcher(scanner, getPossibleNamedEntityStart))                                                     // 2274
    return null;                                                                                               // 2275
                                                                                                               // 2276
  var matcher = getNamedEntityByFirstChar[scanner.rest().charAt(1)];                                           // 2277
  var entity = null;                                                                                           // 2278
  if (matcher)                                                                                                 // 2279
    entity = peekMatcher(scanner, matcher);                                                                    // 2280
                                                                                                               // 2281
  if (entity) {                                                                                                // 2282
    if (entity.slice(-1) !== ';') {                                                                            // 2283
      // Certain character references with no semi are an error, like `&lt`.                                   // 2284
      // In attribute values, however, this is not fatal if the next character                                 // 2285
      // is alphanumeric.                                                                                      // 2286
      //                                                                                                       // 2287
      // This rule affects href attributes, for example, deeming "/?foo=bar&ltc=abc"                           // 2288
      // to be ok but "/?foo=bar&lt=abc" to not be.                                                            // 2289
      if (inAttribute && ALPHANUMERIC.test(scanner.rest().charAt(entity.length)))                              // 2290
        return null;                                                                                           // 2291
      scanner.fatal("Character reference requires semicolon: " + entity);                                      // 2292
    } else {                                                                                                   // 2293
      scanner.pos += entity.length;                                                                            // 2294
      return entity;                                                                                           // 2295
    }                                                                                                          // 2296
  } else {                                                                                                     // 2297
    // we couldn't match any real entity, so see if this is a bad entity                                       // 2298
    // or something we can overlook.                                                                           // 2299
    var badEntity = peekMatcher(scanner, getApparentNamedEntity);                                              // 2300
    if (badEntity)                                                                                             // 2301
      scanner.fatal("Invalid character reference: " + badEntity);                                              // 2302
    // `&aaaa` is ok with no semicolon                                                                         // 2303
    return null;                                                                                               // 2304
  }                                                                                                            // 2305
};                                                                                                             // 2306
                                                                                                               // 2307
// Returns the sequence of one or two codepoints making up an entity as an array.                              // 2308
// Codepoints in the array are integers and may be out of the single-char JavaScript                           // 2309
// range.                                                                                                      // 2310
var getCodePoints = function (namedEntity) {                                                                   // 2311
  return ENTITIES[namedEntity].codepoints;                                                                     // 2312
};                                                                                                             // 2313
                                                                                                               // 2314
var ALLOWED_AFTER_AMP = /^[\u0009\u000a\u000c <&]/;                                                            // 2315
                                                                                                               // 2316
var getCharRefNumber = makeRegexMatcher(/^(?:[xX][0-9a-fA-F]+|[0-9]+);/);                                      // 2317
                                                                                                               // 2318
var BIG_BAD_CODEPOINTS = (function (obj) {                                                                     // 2319
  var list = [0x1FFFE, 0x1FFFF, 0x2FFFE, 0x2FFFF, 0x3FFFE, 0x3FFFF,                                            // 2320
              0x4FFFE, 0x4FFFF, 0x5FFFE, 0x5FFFF, 0x6FFFE, 0x6FFFF,                                            // 2321
              0x7FFFE, 0x7FFFF, 0x8FFFE, 0x8FFFF, 0x9FFFE, 0x9FFFF,                                            // 2322
              0xAFFFE, 0xAFFFF, 0xBFFFE, 0xBFFFF, 0xCFFFE, 0xCFFFF,                                            // 2323
              0xDFFFE, 0xDFFFF, 0xEFFFE, 0xEFFFF, 0xFFFFE, 0xFFFFF,                                            // 2324
              0x10FFFE, 0x10FFFF];                                                                             // 2325
  for (var i = 0; i < list.length; i++)                                                                        // 2326
    obj[list[i]] = true;                                                                                       // 2327
                                                                                                               // 2328
  return obj;                                                                                                  // 2329
})({});                                                                                                        // 2330
                                                                                                               // 2331
var isLegalCodepoint = function (cp) {                                                                         // 2332
  if ((cp === 0) ||                                                                                            // 2333
      (cp >= 0x80 && cp <= 0x9f) ||                                                                            // 2334
      (cp >= 0xd800 && cp <= 0xdfff) ||                                                                        // 2335
      (cp >= 0x10ffff) ||                                                                                      // 2336
      (cp >= 0x1 && cp <= 0x8) ||                                                                              // 2337
      (cp === 0xb) ||                                                                                          // 2338
      (cp >= 0xd && cp <= 0x1f) ||                                                                             // 2339
      (cp >= 0x7f && cp <= 0x9f) ||                                                                            // 2340
      (cp >= 0xfdd0 && cp <= 0xfdef) ||                                                                        // 2341
      (cp === 0xfffe) ||                                                                                       // 2342
      (cp === 0xffff) ||                                                                                       // 2343
      (cp >= 0x10000 && BIG_BAD_CODEPOINTS[cp]))                                                               // 2344
    return false;                                                                                              // 2345
                                                                                                               // 2346
  return true;                                                                                                 // 2347
};                                                                                                             // 2348
                                                                                                               // 2349
// http://www.whatwg.org/specs/web-apps/current-work/multipage/tokenization.html#consume-a-character-reference
//                                                                                                             // 2351
// Matches a character reference if possible, including the initial `&`.                                       // 2352
// Fails fatally in error cases (assuming an initial `&` is matched), like a disallowed codepoint              // 2353
// number or a bad named character reference.                                                                  // 2354
//                                                                                                             // 2355
// `inAttribute` is truthy if we are in an attribute value.                                                    // 2356
//                                                                                                             // 2357
// `allowedChar` is an optional character that,                                                                // 2358
// if found after the initial `&`, aborts parsing silently rather than failing fatally.  In real use it is     // 2359
// either `"`, `'`, or `>` and is supplied when parsing attribute values.  NOTE: In the current spec, the      // 2360
// value of `allowedChar` doesn't actually seem to end up mattering, but there is still some debate about      // 2361
// the right approach to ampersands.                                                                           // 2362
getCharacterReference = HTMLTools.Parse.getCharacterReference = function (scanner, inAttribute, allowedChar) {
  if (scanner.peek() !== '&')                                                                                  // 2364
    // no ampersand                                                                                            // 2365
    return null;                                                                                               // 2366
                                                                                                               // 2367
  var afterAmp = scanner.rest().charAt(1);                                                                     // 2368
                                                                                                               // 2369
  if (afterAmp === '#') {                                                                                      // 2370
    scanner.pos += 2;                                                                                          // 2371
    // refNumber includes possible initial `x` and final semicolon                                             // 2372
    var refNumber = getCharRefNumber(scanner);                                                                 // 2373
    // At this point we've consumed the input, so we're committed to returning                                 // 2374
    // something or failing fatally.                                                                           // 2375
    if (! refNumber)                                                                                           // 2376
      scanner.fatal("Invalid numerical character reference starting with &#");                                 // 2377
    var codepoint;                                                                                             // 2378
    if (refNumber.charAt(0) === 'x' || refNumber.charAt(0) === 'X') {                                          // 2379
      // hex                                                                                                   // 2380
      var hex = refNumber.slice(1, -1);                                                                        // 2381
      while (hex.charAt(0) === '0')                                                                            // 2382
        hex = hex.slice(1);                                                                                    // 2383
      if (hex.length > 6)                                                                                      // 2384
        scanner.fatal("Numerical character reference too large: 0x" + hex);                                    // 2385
      codepoint = parseInt(hex || "0", 16);                                                                    // 2386
    } else {                                                                                                   // 2387
      var dec = refNumber.slice(0, -1);                                                                        // 2388
      while (dec.charAt(0) === '0')                                                                            // 2389
        dec = dec.slice(1);                                                                                    // 2390
      if (dec.length > 7)                                                                                      // 2391
        scanner.fatal("Numerical character reference too large: " + dec);                                      // 2392
      codepoint = parseInt(dec || "0", 10);                                                                    // 2393
    }                                                                                                          // 2394
    if (! isLegalCodepoint(codepoint))                                                                         // 2395
      scanner.fatal("Illegal codepoint in numerical character reference: &#" + refNumber);                     // 2396
    return { t: 'CharRef',                                                                                     // 2397
             v: '&#' + refNumber,                                                                              // 2398
             cp: [codepoint] };                                                                                // 2399
  } else if ((! afterAmp) // EOF                                                                               // 2400
             || (allowedChar && afterAmp === allowedChar)                                                      // 2401
             || ALLOWED_AFTER_AMP.test(afterAmp)) {                                                            // 2402
    return null;                                                                                               // 2403
  } else {                                                                                                     // 2404
    var namedEntity = getNamedCharRef(scanner, inAttribute);                                                   // 2405
    if (namedEntity) {                                                                                         // 2406
      return { t: 'CharRef',                                                                                   // 2407
               v: namedEntity,                                                                                 // 2408
               cp: getCodePoints(namedEntity) };                                                               // 2409
    } else {                                                                                                   // 2410
      return null;                                                                                             // 2411
    }                                                                                                          // 2412
  }                                                                                                            // 2413
};                                                                                                             // 2414
                                                                                                               // 2415
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// packages/html-tools/tokenize.js                                                                             //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                               //
// Token types:                                                                                                // 1
//                                                                                                             // 2
// { t: 'Doctype',                                                                                             // 3
//   v: String (entire Doctype declaration from the source),                                                   // 4
//   name: String,                                                                                             // 5
//   systemId: String (optional),                                                                              // 6
//   publicId: String (optional)                                                                               // 7
// }                                                                                                           // 8
//                                                                                                             // 9
// { t: 'Comment',                                                                                             // 10
//   v: String (not including "<!--" and "-->")                                                                // 11
// }                                                                                                           // 12
//                                                                                                             // 13
// { t: 'Chars',                                                                                               // 14
//   v: String (pure text like you might pass to document.createTextNode,                                      // 15
//              no character references)                                                                       // 16
// }                                                                                                           // 17
//                                                                                                             // 18
// { t: 'Tag',                                                                                                 // 19
//   isEnd: Boolean (optional),                                                                                // 20
//   isSelfClosing: Boolean (optional),                                                                        // 21
//   n: String (tag name, in lowercase or camel case),                                                         // 22
//   attrs: dictionary of { String: [tokens] }                                                                 // 23
//          OR [{ String: [tokens] }, TemplateTag tokens...]                                                   // 24
//     (only for start tags; required)                                                                         // 25
// }                                                                                                           // 26
//                                                                                                             // 27
// { t: 'CharRef',                                                                                             // 28
//   v: String (entire character reference from the source, e.g. "&amp;"),                                     // 29
//   cp: [Integer] (array of Unicode code point numbers it expands to)                                         // 30
// }                                                                                                           // 31
//                                                                                                             // 32
// We keep around both the original form of the character reference and its                                    // 33
// expansion so that subsequent processing steps have the option to                                            // 34
// re-emit it (if they are generating HTML) or interpret it.  Named and                                        // 35
// numerical code points may be more than 16 bits, in which case they                                          // 36
// need to passed through codePointToString to make a JavaScript string.                                       // 37
// Most named entities and all numeric character references are one codepoint                                  // 38
// (e.g. "&amp;" is [38]), but a few are two codepoints.                                                       // 39
//                                                                                                             // 40
// { t: 'TemplateTag',                                                                                         // 41
//   v: HTMLTools.TemplateTag                                                                                  // 42
// }                                                                                                           // 43
                                                                                                               // 44
// The HTML tokenization spec says to preprocess the input stream to replace                                   // 45
// CR(LF)? with LF.  However, preprocessing `scanner` would complicate things                                  // 46
// by making indexes not match the input (e.g. for error messages), so we just                                 // 47
// keep in mind as we go along that an LF might be represented by CRLF or CR.                                  // 48
// In most cases, it doesn't actually matter what combination of whitespace                                    // 49
// characters are present (e.g. inside tags).                                                                  // 50
var HTML_SPACE = /^[\f\n\r\t ]/;                                                                               // 51
                                                                                                               // 52
var convertCRLF = function (str) {                                                                             // 53
  return str.replace(/\r\n?/g, '\n');                                                                          // 54
};                                                                                                             // 55
                                                                                                               // 56
getComment = HTMLTools.Parse.getComment = function (scanner) {                                                 // 57
  if (scanner.rest().slice(0, 4) !== '<!--')                                                                   // 58
    return null;                                                                                               // 59
  scanner.pos += 4;                                                                                            // 60
                                                                                                               // 61
  // Valid comments are easy to parse; they end at the first `--`!                                             // 62
  // Our main job is throwing errors.                                                                          // 63
                                                                                                               // 64
  var rest = scanner.rest();                                                                                   // 65
  if (rest.charAt(0) === '>' || rest.slice(0, 2) === '->')                                                     // 66
    scanner.fatal("HTML comment can't start with > or ->");                                                    // 67
                                                                                                               // 68
  var closePos = rest.indexOf('-->');                                                                          // 69
  if (closePos < 0)                                                                                            // 70
    scanner.fatal("Unclosed HTML comment");                                                                    // 71
                                                                                                               // 72
  var commentContents = rest.slice(0, closePos);                                                               // 73
  if (commentContents.slice(-1) === '-')                                                                       // 74
    scanner.fatal("HTML comment must end at first `--`");                                                      // 75
  if (commentContents.indexOf("--") >= 0)                                                                      // 76
    scanner.fatal("HTML comment cannot contain `--` anywhere");                                                // 77
  if (commentContents.indexOf('\u0000') >= 0)                                                                  // 78
    scanner.fatal("HTML comment cannot contain NULL");                                                         // 79
                                                                                                               // 80
  scanner.pos += closePos + 3;                                                                                 // 81
                                                                                                               // 82
  return { t: 'Comment',                                                                                       // 83
           v: convertCRLF(commentContents) };                                                                  // 84
};                                                                                                             // 85
                                                                                                               // 86
var skipSpaces = function (scanner) {                                                                          // 87
  while (HTML_SPACE.test(scanner.peek()))                                                                      // 88
    scanner.pos++;                                                                                             // 89
};                                                                                                             // 90
                                                                                                               // 91
var requireSpaces = function (scanner) {                                                                       // 92
  if (! HTML_SPACE.test(scanner.peek()))                                                                       // 93
    scanner.fatal("Expected space");                                                                           // 94
  skipSpaces(scanner);                                                                                         // 95
};                                                                                                             // 96
                                                                                                               // 97
var getDoctypeQuotedString = function (scanner) {                                                              // 98
  var quote = scanner.peek();                                                                                  // 99
  if (! (quote === '"' || quote === "'"))                                                                      // 100
    scanner.fatal("Expected single or double quote in DOCTYPE");                                               // 101
  scanner.pos++;                                                                                               // 102
                                                                                                               // 103
  if (scanner.peek() === quote)                                                                                // 104
    // prevent a falsy return value (empty string)                                                             // 105
    scanner.fatal("Malformed DOCTYPE");                                                                        // 106
                                                                                                               // 107
  var str = '';                                                                                                // 108
  var ch;                                                                                                      // 109
  while ((ch = scanner.peek()), ch !== quote) {                                                                // 110
    if ((! ch) || (ch === '\u0000') || (ch === '>'))                                                           // 111
      scanner.fatal("Malformed DOCTYPE");                                                                      // 112
    str += ch;                                                                                                 // 113
    scanner.pos++;                                                                                             // 114
  }                                                                                                            // 115
                                                                                                               // 116
  scanner.pos++;                                                                                               // 117
                                                                                                               // 118
  return str;                                                                                                  // 119
};                                                                                                             // 120
                                                                                                               // 121
// See http://www.whatwg.org/specs/web-apps/current-work/multipage/syntax.html#the-doctype.                    // 122
//                                                                                                             // 123
// If `getDocType` sees "<!DOCTYPE" (case-insensitive), it will match or fail fatally.                         // 124
getDoctype = HTMLTools.Parse.getDoctype = function (scanner) {                                                 // 125
  if (HTMLTools.asciiLowerCase(scanner.rest().slice(0, 9)) !== '<!doctype')                                    // 126
    return null;                                                                                               // 127
  var start = scanner.pos;                                                                                     // 128
  scanner.pos += 9;                                                                                            // 129
                                                                                                               // 130
  requireSpaces(scanner);                                                                                      // 131
                                                                                                               // 132
  var ch = scanner.peek();                                                                                     // 133
  if ((! ch) || (ch === '>') || (ch === '\u0000'))                                                             // 134
    scanner.fatal('Malformed DOCTYPE');                                                                        // 135
  var name = ch;                                                                                               // 136
  scanner.pos++;                                                                                               // 137
                                                                                                               // 138
  while ((ch = scanner.peek()), ! (HTML_SPACE.test(ch) || ch === '>')) {                                       // 139
    if ((! ch) || (ch === '\u0000'))                                                                           // 140
      scanner.fatal('Malformed DOCTYPE');                                                                      // 141
    name += ch;                                                                                                // 142
    scanner.pos++;                                                                                             // 143
  }                                                                                                            // 144
  name = HTMLTools.asciiLowerCase(name);                                                                       // 145
                                                                                                               // 146
  // Now we're looking at a space or a `>`.                                                                    // 147
  skipSpaces(scanner);                                                                                         // 148
                                                                                                               // 149
  var systemId = null;                                                                                         // 150
  var publicId = null;                                                                                         // 151
                                                                                                               // 152
  if (scanner.peek() !== '>') {                                                                                // 153
    // Now we're essentially in the "After DOCTYPE name state" of the tokenizer,                               // 154
    // but we're not looking at space or `>`.                                                                  // 155
                                                                                                               // 156
    // this should be "public" or "system".                                                                    // 157
    var publicOrSystem = HTMLTools.asciiLowerCase(scanner.rest().slice(0, 6));                                 // 158
                                                                                                               // 159
    if (publicOrSystem === 'system') {                                                                         // 160
      scanner.pos += 6;                                                                                        // 161
      requireSpaces(scanner);                                                                                  // 162
      systemId = getDoctypeQuotedString(scanner);                                                              // 163
      skipSpaces(scanner);                                                                                     // 164
      if (scanner.peek() !== '>')                                                                              // 165
        scanner.fatal("Malformed DOCTYPE");                                                                    // 166
    } else if (publicOrSystem === 'public') {                                                                  // 167
      scanner.pos += 6;                                                                                        // 168
      requireSpaces(scanner);                                                                                  // 169
      publicId = getDoctypeQuotedString(scanner);                                                              // 170
      if (scanner.peek() !== '>') {                                                                            // 171
        requireSpaces(scanner);                                                                                // 172
        if (scanner.peek() !== '>') {                                                                          // 173
          systemId = getDoctypeQuotedString(scanner);                                                          // 174
          skipSpaces(scanner);                                                                                 // 175
          if (scanner.peek() !== '>')                                                                          // 176
            scanner.fatal("Malformed DOCTYPE");                                                                // 177
        }                                                                                                      // 178
      }                                                                                                        // 179
    } else {                                                                                                   // 180
      scanner.fatal("Expected PUBLIC or SYSTEM in DOCTYPE");                                                   // 181
    }                                                                                                          // 182
  }                                                                                                            // 183
                                                                                                               // 184
  // looking at `>`                                                                                            // 185
  scanner.pos++;                                                                                               // 186
  var result = { t: 'Doctype',                                                                                 // 187
                 v: scanner.input.slice(start, scanner.pos),                                                   // 188
                 name: name };                                                                                 // 189
                                                                                                               // 190
  if (systemId)                                                                                                // 191
    result.systemId = systemId;                                                                                // 192
  if (publicId)                                                                                                // 193
    result.publicId = publicId;                                                                                // 194
                                                                                                               // 195
  return result;                                                                                               // 196
};                                                                                                             // 197
                                                                                                               // 198
// The special character `{` is only allowed as the first character                                            // 199
// of a Chars, so that we have a chance to detect template tags.                                               // 200
var getChars = makeRegexMatcher(/^[^&<\u0000][^&<\u0000{]*/);                                                  // 201
                                                                                                               // 202
var assertIsTemplateTag = function (x) {                                                                       // 203
  if (! (x instanceof HTMLTools.TemplateTag))                                                                  // 204
    throw new Error("Expected an instance of HTMLTools.TemplateTag");                                          // 205
  return x;                                                                                                    // 206
};                                                                                                             // 207
                                                                                                               // 208
// Returns the next HTML token, or `null` if we reach EOF.                                                     // 209
//                                                                                                             // 210
// Note that if we have a `getTemplateTag` function that sometimes                                             // 211
// consumes characters and emits nothing (e.g. in the case of template                                         // 212
// comments), we may go from not-at-EOF to at-EOF and return `null`,                                           // 213
// while otherwise we always find some token to return.                                                        // 214
getHTMLToken = HTMLTools.Parse.getHTMLToken = function (scanner, dataMode) {                                   // 215
  var result = null;                                                                                           // 216
  if (scanner.getTemplateTag) {                                                                                // 217
    // Try to parse a template tag by calling out to the provided                                              // 218
    // `getTemplateTag` function.  If the function returns `null` but                                          // 219
    // consumes characters, it must have parsed a comment or something,                                        // 220
    // so we loop and try it again.  If it ever returns `null` without                                         // 221
    // consuming anything, that means it didn't see anything interesting                                       // 222
    // so we look for a normal token.  If it returns a truthy value,                                           // 223
    // the value must be instanceof HTMLTools.TemplateTag.  We wrap it                                         // 224
    // in a Special token.                                                                                     // 225
    var lastPos = scanner.pos;                                                                                 // 226
    result = scanner.getTemplateTag(                                                                           // 227
      scanner,                                                                                                 // 228
      (dataMode === 'rcdata' ? TEMPLATE_TAG_POSITION.IN_RCDATA :                                               // 229
       (dataMode === 'rawtext' ? TEMPLATE_TAG_POSITION.IN_RAWTEXT :                                            // 230
        TEMPLATE_TAG_POSITION.ELEMENT)));                                                                      // 231
                                                                                                               // 232
    if (result)                                                                                                // 233
      return { t: 'TemplateTag', v: assertIsTemplateTag(result) };                                             // 234
    else if (scanner.pos > lastPos)                                                                            // 235
      return null;                                                                                             // 236
  }                                                                                                            // 237
                                                                                                               // 238
  var chars = getChars(scanner);                                                                               // 239
  if (chars)                                                                                                   // 240
    return { t: 'Chars',                                                                                       // 241
             v: convertCRLF(chars) };                                                                          // 242
                                                                                                               // 243
  var ch = scanner.peek();                                                                                     // 244
  if (! ch)                                                                                                    // 245
    return null; // EOF                                                                                        // 246
                                                                                                               // 247
  if (ch === '\u0000')                                                                                         // 248
    scanner.fatal("Illegal NULL character");                                                                   // 249
                                                                                                               // 250
  if (ch === '&') {                                                                                            // 251
    if (dataMode !== 'rawtext') {                                                                              // 252
      var charRef = getCharacterReference(scanner);                                                            // 253
      if (charRef)                                                                                             // 254
        return charRef;                                                                                        // 255
    }                                                                                                          // 256
                                                                                                               // 257
    scanner.pos++;                                                                                             // 258
    return { t: 'Chars',                                                                                       // 259
             v: '&' };                                                                                         // 260
  }                                                                                                            // 261
                                                                                                               // 262
  // If we're here, we're looking at `<`.                                                                      // 263
                                                                                                               // 264
  if (scanner.peek() === '<' && dataMode) {                                                                    // 265
    // don't interpret tags                                                                                    // 266
    scanner.pos++;                                                                                             // 267
    return { t: 'Chars',                                                                                       // 268
             v: '<' };                                                                                         // 269
  }                                                                                                            // 270
                                                                                                               // 271
  // `getTag` will claim anything starting with `<` not followed by `!`.                                       // 272
  // `getComment` takes `<!--` and getDoctype takes `<!doctype`.                                               // 273
  result = (getTagToken(scanner) || getComment(scanner) || getDoctype(scanner));                               // 274
                                                                                                               // 275
  if (result)                                                                                                  // 276
    return result;                                                                                             // 277
                                                                                                               // 278
  scanner.fatal("Unexpected `<!` directive.");                                                                 // 279
};                                                                                                             // 280
                                                                                                               // 281
var getTagName = makeRegexMatcher(/^[a-zA-Z][^\f\n\r\t />{]*/);                                                // 282
var getClangle = makeRegexMatcher(/^>/);                                                                       // 283
var getSlash = makeRegexMatcher(/^\//);                                                                        // 284
var getAttributeName = makeRegexMatcher(/^[^>/\u0000"'<=\f\n\r\t ][^\f\n\r\t /=>"'<\u0000]*/);                 // 285
                                                                                                               // 286
// Try to parse `>` or `/>`, mutating `tag` to be self-closing in the latter                                   // 287
// case (and failing fatally if `/` isn't followed by `>`).                                                    // 288
// Return tag if successful.                                                                                   // 289
var handleEndOfTag = function (scanner, tag) {                                                                 // 290
  if (getClangle(scanner))                                                                                     // 291
    return tag;                                                                                                // 292
                                                                                                               // 293
  if (getSlash(scanner)) {                                                                                     // 294
    if (! getClangle(scanner))                                                                                 // 295
      scanner.fatal("Expected `>` after `/`");                                                                 // 296
    tag.isSelfClosing = true;                                                                                  // 297
    return tag;                                                                                                // 298
  }                                                                                                            // 299
                                                                                                               // 300
  return null;                                                                                                 // 301
};                                                                                                             // 302
                                                                                                               // 303
// Scan a quoted or unquoted attribute value (omit `quote` for unquoted).                                      // 304
var getAttributeValue = function (scanner, quote) {                                                            // 305
  if (quote) {                                                                                                 // 306
    if (scanner.peek() !== quote)                                                                              // 307
      return null;                                                                                             // 308
    scanner.pos++;                                                                                             // 309
  }                                                                                                            // 310
                                                                                                               // 311
  var tokens = [];                                                                                             // 312
  var charsTokenToExtend = null;                                                                               // 313
                                                                                                               // 314
  var charRef;                                                                                                 // 315
  while (true) {                                                                                               // 316
    var ch = scanner.peek();                                                                                   // 317
    var templateTag;                                                                                           // 318
    var curPos = scanner.pos;                                                                                  // 319
    if (quote && ch === quote) {                                                                               // 320
      scanner.pos++;                                                                                           // 321
      return tokens;                                                                                           // 322
    } else if ((! quote) && (HTML_SPACE.test(ch) || ch === '>')) {                                             // 323
      return tokens;                                                                                           // 324
    } else if (! ch) {                                                                                         // 325
      scanner.fatal("Unclosed attribute in tag");                                                              // 326
    } else if (quote ? ch === '\u0000' : ('\u0000"\'<=`'.indexOf(ch) >= 0)) {                                  // 327
      scanner.fatal("Unexpected character in attribute value");                                                // 328
    } else if (ch === '&' &&                                                                                   // 329
               (charRef = getCharacterReference(scanner, true,                                                 // 330
                                                quote || '>'))) {                                              // 331
      tokens.push(charRef);                                                                                    // 332
      charsTokenToExtend = null;                                                                               // 333
    } else if (scanner.getTemplateTag &&                                                                       // 334
               ((templateTag = scanner.getTemplateTag(                                                         // 335
                 scanner, TEMPLATE_TAG_POSITION.IN_ATTRIBUTE)) ||                                              // 336
                scanner.pos > curPos /* `{{! comment}}` */)) {                                                 // 337
      if (templateTag) {                                                                                       // 338
        tokens.push({t: 'TemplateTag',                                                                         // 339
                     v: assertIsTemplateTag(templateTag)});                                                    // 340
        charsTokenToExtend = null;                                                                             // 341
      }                                                                                                        // 342
    } else {                                                                                                   // 343
      if (! charsTokenToExtend) {                                                                              // 344
        charsTokenToExtend = { t: 'Chars', v: '' };                                                            // 345
        tokens.push(charsTokenToExtend);                                                                       // 346
      }                                                                                                        // 347
      charsTokenToExtend.v += (ch === '\r' ? '\n' : ch);                                                       // 348
      scanner.pos++;                                                                                           // 349
      if (quote && ch === '\r' && scanner.peek() === '\n')                                                     // 350
        scanner.pos++;                                                                                         // 351
    }                                                                                                          // 352
  }                                                                                                            // 353
};                                                                                                             // 354
                                                                                                               // 355
var hasOwnProperty = Object.prototype.hasOwnProperty;                                                          // 356
                                                                                                               // 357
getTagToken = HTMLTools.Parse.getTagToken = function (scanner) {                                               // 358
  if (! (scanner.peek() === '<' && scanner.rest().charAt(1) !== '!'))                                          // 359
    return null;                                                                                               // 360
  scanner.pos++;                                                                                               // 361
                                                                                                               // 362
  var tag = { t: 'Tag' };                                                                                      // 363
                                                                                                               // 364
  // now looking at the character after `<`, which is not a `!`                                                // 365
  if (scanner.peek() === '/') {                                                                                // 366
    tag.isEnd = true;                                                                                          // 367
    scanner.pos++;                                                                                             // 368
  }                                                                                                            // 369
                                                                                                               // 370
  var tagName = getTagName(scanner);                                                                           // 371
  if (! tagName)                                                                                               // 372
    scanner.fatal("Expected tag name after `<`");                                                              // 373
  tag.n = HTMLTools.properCaseTagName(tagName);                                                                // 374
                                                                                                               // 375
  if (scanner.peek() === '/' && tag.isEnd)                                                                     // 376
    scanner.fatal("End tag can't have trailing slash");                                                        // 377
  if (handleEndOfTag(scanner, tag))                                                                            // 378
    return tag;                                                                                                // 379
                                                                                                               // 380
  if (scanner.isEOF())                                                                                         // 381
    scanner.fatal("Unclosed `<`");                                                                             // 382
                                                                                                               // 383
  if (! HTML_SPACE.test(scanner.peek()))                                                                       // 384
    // e.g. `<a{{b}}>`                                                                                         // 385
    scanner.fatal("Expected space after tag name");                                                            // 386
                                                                                                               // 387
  // we're now in "Before attribute name state" of the tokenizer                                               // 388
  skipSpaces(scanner);                                                                                         // 389
                                                                                                               // 390
  if (scanner.peek() === '/' && tag.isEnd)                                                                     // 391
    scanner.fatal("End tag can't have trailing slash");                                                        // 392
  if (handleEndOfTag(scanner, tag))                                                                            // 393
    return tag;                                                                                                // 394
                                                                                                               // 395
  if (tag.isEnd)                                                                                               // 396
    scanner.fatal("End tag can't have attributes");                                                            // 397
                                                                                                               // 398
  tag.attrs = {};                                                                                              // 399
  var nondynamicAttrs = tag.attrs;                                                                             // 400
                                                                                                               // 401
  while (true) {                                                                                               // 402
    // Note: at the top of this loop, we've already skipped any spaces.                                        // 403
                                                                                                               // 404
    // This will be set to true if after parsing the attribute, we should                                      // 405
    // require spaces (or else an end of tag, i.e. `>` or `/>`).                                               // 406
    var spacesRequiredAfter = false;                                                                           // 407
                                                                                                               // 408
    // first, try for a template tag.                                                                          // 409
    var curPos = scanner.pos;                                                                                  // 410
    var templateTag = (scanner.getTemplateTag &&                                                               // 411
                       scanner.getTemplateTag(                                                                 // 412
                         scanner, TEMPLATE_TAG_POSITION.IN_START_TAG));                                        // 413
    if (templateTag || (scanner.pos > curPos)) {                                                               // 414
      if (templateTag) {                                                                                       // 415
        if (tag.attrs === nondynamicAttrs)                                                                     // 416
          tag.attrs = [nondynamicAttrs];                                                                       // 417
        tag.attrs.push({ t: 'TemplateTag',                                                                     // 418
                         v: assertIsTemplateTag(templateTag) });                                               // 419
      } // else, must have scanned a `{{! comment}}`                                                           // 420
                                                                                                               // 421
      spacesRequiredAfter = true;                                                                              // 422
    } else {                                                                                                   // 423
                                                                                                               // 424
      var attributeName = getAttributeName(scanner);                                                           // 425
      if (! attributeName)                                                                                     // 426
        scanner.fatal("Expected attribute name in tag");                                                       // 427
      // Throw error on `{` in attribute name.  This provides *some* error message                             // 428
      // if someone writes `<a x{{y}}>` or `<a x{{y}}=z>`.  The HTML tokenization                              // 429
      // spec doesn't say that `{` is invalid, but the DOM API (setAttribute) won't                            // 430
      // allow it, so who cares.                                                                               // 431
      if (attributeName.indexOf('{') >= 0)                                                                     // 432
        scanner.fatal("Unexpected `{` in attribute name.");                                                    // 433
      attributeName = HTMLTools.properCaseAttributeName(attributeName);                                        // 434
                                                                                                               // 435
      if (hasOwnProperty.call(nondynamicAttrs, attributeName))                                                 // 436
        scanner.fatal("Duplicate attribute in tag: " + attributeName);                                         // 437
                                                                                                               // 438
      nondynamicAttrs[attributeName] = [];                                                                     // 439
                                                                                                               // 440
      skipSpaces(scanner);                                                                                     // 441
                                                                                                               // 442
      if (handleEndOfTag(scanner, tag))                                                                        // 443
        return tag;                                                                                            // 444
                                                                                                               // 445
      var ch = scanner.peek();                                                                                 // 446
      if (! ch)                                                                                                // 447
        scanner.fatal("Unclosed <");                                                                           // 448
      if ('\u0000"\'<'.indexOf(ch) >= 0)                                                                       // 449
        scanner.fatal("Unexpected character after attribute name in tag");                                     // 450
                                                                                                               // 451
      if (ch === '=') {                                                                                        // 452
        scanner.pos++;                                                                                         // 453
                                                                                                               // 454
        skipSpaces(scanner);                                                                                   // 455
                                                                                                               // 456
        ch = scanner.peek();                                                                                   // 457
        if (! ch)                                                                                              // 458
          scanner.fatal("Unclosed <");                                                                         // 459
        if ('\u0000><=`'.indexOf(ch) >= 0)                                                                     // 460
          scanner.fatal("Unexpected character after = in tag");                                                // 461
                                                                                                               // 462
        if ((ch === '"') || (ch === "'"))                                                                      // 463
          nondynamicAttrs[attributeName] = getAttributeValue(scanner, ch);                                     // 464
        else                                                                                                   // 465
          nondynamicAttrs[attributeName] = getAttributeValue(scanner);                                         // 466
                                                                                                               // 467
        spacesRequiredAfter = true;                                                                            // 468
      }                                                                                                        // 469
    }                                                                                                          // 470
    // now we are in the "post-attribute" position, whether it was a template tag                              // 471
    // attribute (like `{{x}}`) or a normal one (like `x` or `x=y`).                                           // 472
                                                                                                               // 473
    if (handleEndOfTag(scanner, tag))                                                                          // 474
      return tag;                                                                                              // 475
                                                                                                               // 476
    if (scanner.isEOF())                                                                                       // 477
      scanner.fatal("Unclosed `<`");                                                                           // 478
                                                                                                               // 479
    if (spacesRequiredAfter)                                                                                   // 480
      requireSpaces(scanner);                                                                                  // 481
    else                                                                                                       // 482
      skipSpaces(scanner);                                                                                     // 483
                                                                                                               // 484
    if (handleEndOfTag(scanner, tag))                                                                          // 485
      return tag;                                                                                              // 486
  }                                                                                                            // 487
};                                                                                                             // 488
                                                                                                               // 489
TEMPLATE_TAG_POSITION = HTMLTools.TEMPLATE_TAG_POSITION = {                                                    // 490
  ELEMENT: 1,                                                                                                  // 491
  IN_START_TAG: 2,                                                                                             // 492
  IN_ATTRIBUTE: 3,                                                                                             // 493
  IN_RCDATA: 4,                                                                                                // 494
  IN_RAWTEXT: 5                                                                                                // 495
};                                                                                                             // 496
                                                                                                               // 497
// tagName must be proper case                                                                                 // 498
isLookingAtEndTag = function (scanner, tagName) {                                                              // 499
  var rest = scanner.rest();                                                                                   // 500
  var pos = 0; // into rest                                                                                    // 501
  var firstPart = /^<\/([a-zA-Z]+)/.exec(rest);                                                                // 502
  if (firstPart &&                                                                                             // 503
      HTMLTools.properCaseTagName(firstPart[1]) === tagName) {                                                 // 504
    // we've seen `</foo`, now see if the end tag continues                                                    // 505
    pos += firstPart[0].length;                                                                                // 506
    while (pos < rest.length && HTML_SPACE.test(rest.charAt(pos)))                                             // 507
      pos++;                                                                                                   // 508
    if (pos < rest.length && rest.charAt(pos) === '>')                                                         // 509
      return true;                                                                                             // 510
  }                                                                                                            // 511
  return false;                                                                                                // 512
};                                                                                                             // 513
                                                                                                               // 514
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// packages/html-tools/templatetag.js                                                                          //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                               //
// _assign is like _.extend or the upcoming Object.assign.                                                     // 1
// Copy src's own, enumerable properties onto tgt and return                                                   // 2
// tgt.                                                                                                        // 3
var _hasOwnProperty = Object.prototype.hasOwnProperty;                                                         // 4
var _assign = function (tgt, src) {                                                                            // 5
  for (var k in src) {                                                                                         // 6
    if (_hasOwnProperty.call(src, k))                                                                          // 7
      tgt[k] = src[k];                                                                                         // 8
  }                                                                                                            // 9
  return tgt;                                                                                                  // 10
};                                                                                                             // 11
                                                                                                               // 12
                                                                                                               // 13
HTMLTools.TemplateTag = function (props) {                                                                     // 14
  if (! (this instanceof HTMLTools.TemplateTag))                                                               // 15
    // called without `new`                                                                                    // 16
    return new HTMLTools.TemplateTag;                                                                          // 17
                                                                                                               // 18
  if (props)                                                                                                   // 19
    _assign(this, props);                                                                                      // 20
};                                                                                                             // 21
                                                                                                               // 22
_assign(HTMLTools.TemplateTag.prototype, {                                                                     // 23
  constructorName: 'HTMLTools.TemplateTag',                                                                    // 24
  toJS: function (visitor) {                                                                                   // 25
    return visitor.generateCall(this.constructorName,                                                          // 26
                                _assign({}, this));                                                            // 27
  }                                                                                                            // 28
});                                                                                                            // 29
                                                                                                               // 30
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// packages/html-tools/parse.js                                                                                //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                               //
                                                                                                               // 1
// Parse a "fragment" of HTML, up to the end of the input or a particular                                      // 2
// template tag (using the "shouldStop" option).                                                               // 3
HTMLTools.parseFragment = function (input, options) {                                                          // 4
  var scanner;                                                                                                 // 5
  if (typeof input === 'string')                                                                               // 6
    scanner = new Scanner(input);                                                                              // 7
  else                                                                                                         // 8
    // input can be a scanner.  We'd better not have a different                                               // 9
    // value for the "getTemplateTag" option as when the scanner                                               // 10
    // was created, because we don't do anything special to reset                                              // 11
    // the value (which is attached to the scanner).                                                           // 12
    scanner = input;                                                                                           // 13
                                                                                                               // 14
  // ```                                                                                                       // 15
  // { getTemplateTag: function (scanner, templateTagPosition) {                                               // 16
  //     if (templateTagPosition === HTMLTools.TEMPLATE_TAG_POSITION.ELEMENT) {                                // 17
  //       ...                                                                                                 // 18
  // ```                                                                                                       // 19
  if (options && options.getTemplateTag)                                                                       // 20
    scanner.getTemplateTag = options.getTemplateTag;                                                           // 21
                                                                                                               // 22
  // function (scanner) -> boolean                                                                             // 23
  var shouldStop = options && options.shouldStop;                                                              // 24
                                                                                                               // 25
  var result;                                                                                                  // 26
  if (options && options.textMode) {                                                                           // 27
    if (options.textMode === HTML.TEXTMODE.STRING) {                                                           // 28
      result = getRawText(scanner, null, shouldStop);                                                          // 29
    } else if (options.textMode === HTML.TEXTMODE.RCDATA) {                                                    // 30
      result = getRCData(scanner, null, shouldStop);                                                           // 31
    } else {                                                                                                   // 32
      throw new Error("Unsupported textMode: " + options.textMode);                                            // 33
    }                                                                                                          // 34
  } else {                                                                                                     // 35
    result = getContent(scanner, shouldStop);                                                                  // 36
  }                                                                                                            // 37
  if (! scanner.isEOF()) {                                                                                     // 38
    // If we aren't at the end of the input, we either stopped at an unmatched                                 // 39
    // HTML end tag or at a template tag (like `{{else}}` or `{{/if}}`).                                       // 40
    // Detect the former case (stopped at an HTML end tag) and throw a good                                    // 41
    // error.                                                                                                  // 42
                                                                                                               // 43
    var posBefore = scanner.pos;                                                                               // 44
                                                                                                               // 45
    try {                                                                                                      // 46
      var endTag = getHTMLToken(scanner);                                                                      // 47
    } catch (e) {                                                                                              // 48
      // ignore errors from getTemplateTag                                                                     // 49
    }                                                                                                          // 50
                                                                                                               // 51
    // XXX we make some assumptions about shouldStop here, like that it                                        // 52
    // won't tell us to stop at an HTML end tag.  Should refactor                                              // 53
    // `shouldStop` into something more suitable.                                                              // 54
    if (endTag && endTag.t === 'Tag' && endTag.isEnd) {                                                        // 55
      var closeTag = endTag.n;                                                                                 // 56
      var isVoidElement = HTML.isVoidElement(closeTag);                                                        // 57
      scanner.fatal("Unexpected HTML close tag" +                                                              // 58
                    (isVoidElement ?                                                                           // 59
                     '.  <' + endTag.n + '> should have no close tag.' : ''));                                 // 60
    }                                                                                                          // 61
                                                                                                               // 62
    scanner.pos = posBefore; // rewind, we'll continue parsing as usual                                        // 63
                                                                                                               // 64
    // If no "shouldStop" option was provided, we should have consumed the whole                               // 65
    // input.                                                                                                  // 66
    if (! shouldStop)                                                                                          // 67
      scanner.fatal("Expected EOF");                                                                           // 68
  }                                                                                                            // 69
                                                                                                               // 70
  return result;                                                                                               // 71
};                                                                                                             // 72
                                                                                                               // 73
// Take a numeric Unicode code point, which may be larger than 16 bits,                                        // 74
// and encode it as a JavaScript UTF-16 string.                                                                // 75
//                                                                                                             // 76
// Adapted from                                                                                                // 77
// http://stackoverflow.com/questions/7126384/expressing-utf-16-unicode-characters-in-javascript/7126661.      // 78
codePointToString = HTMLTools.codePointToString = function(cp) {                                               // 79
  if (cp >= 0 && cp <= 0xD7FF || cp >= 0xE000 && cp <= 0xFFFF) {                                               // 80
    return String.fromCharCode(cp);                                                                            // 81
  } else if (cp >= 0x10000 && cp <= 0x10FFFF) {                                                                // 82
                                                                                                               // 83
    // we substract 0x10000 from cp to get a 20-bit number                                                     // 84
    // in the range 0..0xFFFF                                                                                  // 85
    cp -= 0x10000;                                                                                             // 86
                                                                                                               // 87
    // we add 0xD800 to the number formed by the first 10 bits                                                 // 88
    // to give the first byte                                                                                  // 89
    var first = ((0xffc00 & cp) >> 10) + 0xD800;                                                               // 90
                                                                                                               // 91
    // we add 0xDC00 to the number formed by the low 10 bits                                                   // 92
    // to give the second byte                                                                                 // 93
    var second = (0x3ff & cp) + 0xDC00;                                                                        // 94
                                                                                                               // 95
    return String.fromCharCode(first) + String.fromCharCode(second);                                           // 96
  } else {                                                                                                     // 97
    return '';                                                                                                 // 98
  }                                                                                                            // 99
};                                                                                                             // 100
                                                                                                               // 101
getContent = HTMLTools.Parse.getContent = function (scanner, shouldStopFunc) {                                 // 102
  var items = [];                                                                                              // 103
                                                                                                               // 104
  while (! scanner.isEOF()) {                                                                                  // 105
    if (shouldStopFunc && shouldStopFunc(scanner))                                                             // 106
      break;                                                                                                   // 107
                                                                                                               // 108
    var posBefore = scanner.pos;                                                                               // 109
    var token = getHTMLToken(scanner);                                                                         // 110
    if (! token)                                                                                               // 111
      // tokenizer reached EOF on its own, e.g. while scanning                                                 // 112
      // template comments like `{{! foo}}`.                                                                   // 113
      continue;                                                                                                // 114
                                                                                                               // 115
    if (token.t === 'Doctype') {                                                                               // 116
      scanner.fatal("Unexpected Doctype");                                                                     // 117
    } else if (token.t === 'Chars') {                                                                          // 118
      pushOrAppendString(items, token.v);                                                                      // 119
    } else if (token.t === 'CharRef') {                                                                        // 120
      items.push(convertCharRef(token));                                                                       // 121
    } else if (token.t === 'Comment') {                                                                        // 122
      items.push(HTML.Comment(token.v));                                                                       // 123
    } else if (token.t === 'TemplateTag') {                                                                    // 124
      items.push(token.v);                                                                                     // 125
    } else if (token.t === 'Tag') {                                                                            // 126
      if (token.isEnd) {                                                                                       // 127
        // Stop when we encounter an end tag at the top level.                                                 // 128
        // Rewind; we'll re-parse the end tag later.                                                           // 129
        scanner.pos = posBefore;                                                                               // 130
        break;                                                                                                 // 131
      }                                                                                                        // 132
                                                                                                               // 133
      var tagName = token.n;                                                                                   // 134
      // is this an element with no close tag (a BR, HR, IMG, etc.) based                                      // 135
      // on its name?                                                                                          // 136
      var isVoid = HTML.isVoidElement(tagName);                                                                // 137
      if (token.isSelfClosing) {                                                                               // 138
        if (! (isVoid || HTML.isKnownSVGElement(tagName) || tagName.indexOf(':') >= 0))                        // 139
          scanner.fatal('Only certain elements like BR, HR, IMG, etc. (and foreign elements like SVG) are allowed to self-close');
      }                                                                                                        // 141
                                                                                                               // 142
      // result of parseAttrs may be null                                                                      // 143
      var attrs = parseAttrs(token.attrs);                                                                     // 144
      // arrays need to be wrapped in HTML.Attrs(...)                                                          // 145
      // when used to construct tags                                                                           // 146
      if (HTML.isArray(attrs))                                                                                 // 147
        attrs = HTML.Attrs.apply(null, attrs);                                                                 // 148
                                                                                                               // 149
      var tagFunc = HTML.getTag(tagName);                                                                      // 150
      if (isVoid || token.isSelfClosing) {                                                                     // 151
        items.push(attrs ? tagFunc(attrs) : tagFunc());                                                        // 152
      } else {                                                                                                 // 153
        // parse HTML tag contents.                                                                            // 154
                                                                                                               // 155
        // HTML treats a final `/` in a tag as part of an attribute, as in `<a href=/foo/>`, but the template author who writes `<circle r={{r}}/>`, say, may not be thinking about that, so generate a good error message in the "looks like self-close" case.
        var looksLikeSelfClose = (scanner.input.substr(scanner.pos - 2, 2) === '/>');                          // 157
                                                                                                               // 158
        var content = null;                                                                                    // 159
        if (token.n === 'textarea') {                                                                          // 160
          if (scanner.peek() === '\n')                                                                         // 161
            scanner.pos++;                                                                                     // 162
          var textareaValue = getRCData(scanner, token.n, shouldStopFunc);                                     // 163
          if (textareaValue) {                                                                                 // 164
            if (attrs instanceof HTML.Attrs) {                                                                 // 165
              attrs = HTML.Attrs.apply(                                                                        // 166
                null, attrs.value.concat([{value: textareaValue}]));                                           // 167
            } else {                                                                                           // 168
              attrs = (attrs || {});                                                                           // 169
              attrs.value = textareaValue;                                                                     // 170
            }                                                                                                  // 171
          }                                                                                                    // 172
        } else if (token.n === 'script' || token.n === 'style') {                                              // 173
          content = getRawText(scanner, token.n, shouldStopFunc);                                              // 174
        } else {                                                                                               // 175
          content = getContent(scanner, shouldStopFunc);                                                       // 176
        }                                                                                                      // 177
                                                                                                               // 178
        var endTag = getHTMLToken(scanner);                                                                    // 179
                                                                                                               // 180
        if (! (endTag && endTag.t === 'Tag' && endTag.isEnd && endTag.n === tagName))                          // 181
          scanner.fatal('Expected "' + tagName + '" end tag' + (looksLikeSelfClose ? ' -- if the "<' + token.n + ' />" tag was supposed to self-close, try adding a space before the "/"' : ''));
                                                                                                               // 183
        // XXX support implied end tags in cases allowed by the spec                                           // 184
                                                                                                               // 185
        // make `content` into an array suitable for applying tag constructor                                  // 186
        // as in `FOO.apply(null, content)`.                                                                   // 187
        if (content == null)                                                                                   // 188
          content = [];                                                                                        // 189
        else if (! Array.isArray(content))                                                                      // 190
          content = [content];                                                                                 // 191
                                                                                                               // 192
        items.push(HTML.getTag(tagName).apply(                                                                 // 193
          null, (attrs ? [attrs] : []).concat(content)));                                                      // 194
      }                                                                                                        // 195
    } else {                                                                                                   // 196
      scanner.fatal("Unknown token type: " + token.t);                                                         // 197
    }                                                                                                          // 198
  }                                                                                                            // 199
                                                                                                               // 200
  if (items.length === 0)                                                                                      // 201
    return null;                                                                                               // 202
  else if (items.length === 1)                                                                                 // 203
    return items[0];                                                                                           // 204
  else                                                                                                         // 205
    return items;                                                                                              // 206
};                                                                                                             // 207
                                                                                                               // 208
var pushOrAppendString = function (items, string) {                                                            // 209
  if (items.length &&                                                                                          // 210
      typeof items[items.length - 1] === 'string')                                                             // 211
    items[items.length - 1] += string;                                                                         // 212
  else                                                                                                         // 213
    items.push(string);                                                                                        // 214
};                                                                                                             // 215
                                                                                                               // 216
// get RCDATA to go in the lowercase (or camel case) tagName (e.g. "textarea")                                 // 217
getRCData = HTMLTools.Parse.getRCData = function (scanner, tagName, shouldStopFunc) {                          // 218
  var items = [];                                                                                              // 219
                                                                                                               // 220
  while (! scanner.isEOF()) {                                                                                  // 221
    // break at appropriate end tag                                                                            // 222
    if (tagName && isLookingAtEndTag(scanner, tagName))                                                        // 223
      break;                                                                                                   // 224
                                                                                                               // 225
    if (shouldStopFunc && shouldStopFunc(scanner))                                                             // 226
      break;                                                                                                   // 227
                                                                                                               // 228
    var token = getHTMLToken(scanner, 'rcdata');                                                               // 229
    if (! token)                                                                                               // 230
      // tokenizer reached EOF on its own, e.g. while scanning                                                 // 231
      // template comments like `{{! foo}}`.                                                                   // 232
      continue;                                                                                                // 233
                                                                                                               // 234
    if (token.t === 'Chars') {                                                                                 // 235
      pushOrAppendString(items, token.v);                                                                      // 236
    } else if (token.t === 'CharRef') {                                                                        // 237
      items.push(convertCharRef(token));                                                                       // 238
    } else if (token.t === 'TemplateTag') {                                                                    // 239
      items.push(token.v);                                                                                     // 240
    } else {                                                                                                   // 241
      // (can't happen)                                                                                        // 242
      scanner.fatal("Unknown or unexpected token type: " + token.t);                                           // 243
    }                                                                                                          // 244
  }                                                                                                            // 245
                                                                                                               // 246
  if (items.length === 0)                                                                                      // 247
    return null;                                                                                               // 248
  else if (items.length === 1)                                                                                 // 249
    return items[0];                                                                                           // 250
  else                                                                                                         // 251
    return items;                                                                                              // 252
};                                                                                                             // 253
                                                                                                               // 254
var getRawText = function (scanner, tagName, shouldStopFunc) {                                                 // 255
  var items = [];                                                                                              // 256
                                                                                                               // 257
  while (! scanner.isEOF()) {                                                                                  // 258
    // break at appropriate end tag                                                                            // 259
    if (tagName && isLookingAtEndTag(scanner, tagName))                                                        // 260
      break;                                                                                                   // 261
                                                                                                               // 262
    if (shouldStopFunc && shouldStopFunc(scanner))                                                             // 263
      break;                                                                                                   // 264
                                                                                                               // 265
    var token = getHTMLToken(scanner, 'rawtext');                                                              // 266
    if (! token)                                                                                               // 267
      // tokenizer reached EOF on its own, e.g. while scanning                                                 // 268
      // template comments like `{{! foo}}`.                                                                   // 269
      continue;                                                                                                // 270
                                                                                                               // 271
    if (token.t === 'Chars') {                                                                                 // 272
      pushOrAppendString(items, token.v);                                                                      // 273
    } else if (token.t === 'TemplateTag') {                                                                    // 274
      items.push(token.v);                                                                                     // 275
    } else {                                                                                                   // 276
      // (can't happen)                                                                                        // 277
      scanner.fatal("Unknown or unexpected token type: " + token.t);                                           // 278
    }                                                                                                          // 279
  }                                                                                                            // 280
                                                                                                               // 281
  if (items.length === 0)                                                                                      // 282
    return null;                                                                                               // 283
  else if (items.length === 1)                                                                                 // 284
    return items[0];                                                                                           // 285
  else                                                                                                         // 286
    return items;                                                                                              // 287
};                                                                                                             // 288
                                                                                                               // 289
// Input: A token like `{ t: 'CharRef', v: '&amp;', cp: [38] }`.                                               // 290
//                                                                                                             // 291
// Output: A tag like `HTML.CharRef({ html: '&amp;', str: '&' })`.                                             // 292
var convertCharRef = function (token) {                                                                        // 293
  var codePoints = token.cp;                                                                                   // 294
  var str = '';                                                                                                // 295
  for (var i = 0; i < codePoints.length; i++)                                                                  // 296
    str += codePointToString(codePoints[i]);                                                                   // 297
  return HTML.CharRef({ html: token.v, str: str });                                                            // 298
};                                                                                                             // 299
                                                                                                               // 300
// Input is always a dictionary (even if zero attributes) and each                                             // 301
// value in the dictionary is an array of `Chars`, `CharRef`,                                                  // 302
// and maybe `TemplateTag` tokens.                                                                             // 303
//                                                                                                             // 304
// Output is null if there are zero attributes, and otherwise a                                                // 305
// dictionary, or an array of dictionaries and template tags.                                                  // 306
// Each value in the dictionary is HTMLjs (e.g. a                                                              // 307
// string or an array of `Chars`, `CharRef`, and `TemplateTag`                                                 // 308
// nodes).                                                                                                     // 309
//                                                                                                             // 310
// An attribute value with no input tokens is represented as "",                                               // 311
// not an empty array, in order to prop open empty attributes                                                  // 312
// with no template tags.                                                                                      // 313
var parseAttrs = function (attrs) {                                                                            // 314
  var result = null;                                                                                           // 315
                                                                                                               // 316
  if (HTML.isArray(attrs)) {                                                                                   // 317
    // first element is nondynamic attrs, rest are template tags                                               // 318
    var nondynamicAttrs = parseAttrs(attrs[0]);                                                                // 319
    if (nondynamicAttrs) {                                                                                     // 320
      result = (result || []);                                                                                 // 321
      result.push(nondynamicAttrs);                                                                            // 322
    }                                                                                                          // 323
    for (var i = 1; i < attrs.length; i++) {                                                                   // 324
      var token = attrs[i];                                                                                    // 325
      if (token.t !== 'TemplateTag')                                                                           // 326
        throw new Error("Expected TemplateTag token");                                                         // 327
      result = (result || []);                                                                                 // 328
      result.push(token.v);                                                                                    // 329
    }                                                                                                          // 330
    return result;                                                                                             // 331
  }                                                                                                            // 332
                                                                                                               // 333
  for (var k in attrs) {                                                                                       // 334
    if (! result)                                                                                              // 335
      result = {};                                                                                             // 336
                                                                                                               // 337
    var inValue = attrs[k];                                                                                    // 338
    var outParts = [];                                                                                         // 339
    for (var i = 0; i < inValue.length; i++) {                                                                 // 340
      var token = inValue[i];                                                                                  // 341
      if (token.t === 'CharRef') {                                                                             // 342
        outParts.push(convertCharRef(token));                                                                  // 343
      } else if (token.t === 'TemplateTag') {                                                                  // 344
        outParts.push(token.v);                                                                                // 345
      } else if (token.t === 'Chars') {                                                                        // 346
        pushOrAppendString(outParts, token.v);                                                                 // 347
      }                                                                                                        // 348
    }                                                                                                          // 349
                                                                                                               // 350
    var outValue = (inValue.length === 0 ? '' :                                                                // 351
                    (outParts.length === 1 ? outParts[0] : outParts));                                         // 352
    var properKey = HTMLTools.properCaseAttributeName(k);                                                      // 353
    result[properKey] = outValue;                                                                              // 354
  }                                                                                                            // 355
                                                                                                               // 356
  return result;                                                                                               // 357
};                                                                                                             // 358
                                                                                                               // 359
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
Package['html-tools'] = {
  HTMLTools: HTMLTools
};

})();



