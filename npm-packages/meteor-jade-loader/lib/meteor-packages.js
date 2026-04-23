/**
 * Bootstraps the Meteor packages (htmljs, html-tools, blaze-tools, spacebars-compiler)
 * into a sandboxed environment so they can be used outside of Meteor's build system.
 *
 * These packages were extracted from the mquandalle:jade Meteor build plugin.
 * They communicate via a global `Package` object. We set that up here,
 * run each file, then export the symbols the jade compiler needs.
 */

'use strict';

var vm = require('vm');
var fs = require('fs');
var path = require('path');

var vendorDir = path.join(__dirname, 'vendor');

// Cache the loaded packages so we only do this once per process
var _cached = null;

function loadMeteorPackages() {
  if (_cached) return _cached;

  // Create a sandbox with the minimal globals the packages expect
  var Package = {};
  var Meteor = {
    isClient: false,
    isServer: true,
  };

  // The packages expect Package.meteor.Meteor, Package.underscore._,
  // and Package.tracker.Tracker to exist.
  // blaze-tools.js uses _.each; spacebars-compiler.js uses _.each, _.extend,
  // _.indexOf, _.map.  Provide native-JS implementations for all four.
  Package.meteor = { Meteor: Meteor };
  Package.underscore = {
    _: {
      each: function(obj, fn) { obj.forEach(fn); },
      map: function(obj, fn) { return obj.map(fn); },
      indexOf: function(arr, val) { return arr.indexOf(val); },
      extend: function(dest) {
        for (var i = 1; i < arguments.length; i++) {
          var src = arguments[i];
          if (src) Object.assign(dest, src);
        }
        return dest;
      },
    },
  };
  Package.tracker = { Tracker: { autorun: function() {}, nonreactive: function(f) { return f(); } }, Deps: {} };

  // Build a shared context for all the package files
  var sandbox = {
    Package: Package,
    console: console,
    Array: Array,
    Object: Object,
    String: String,
    Number: Number,
    Boolean: Boolean,
    RegExp: RegExp,
    Error: Error,
    TypeError: TypeError,
    RangeError: RangeError,
    Math: Math,
    JSON: JSON,
    Date: Date,
    parseInt: parseInt,
    parseFloat: parseFloat,
    isNaN: isNaN,
    isFinite: isFinite,
    undefined: undefined,
    NaN: NaN,
    Infinity: Infinity,
    decodeURIComponent: decodeURIComponent,
    encodeURIComponent: encodeURIComponent,
  };

  vm.createContext(sandbox);

  // Load each package file in order (dependencies first)
  var files = [
    'htmljs.js',
    'html-tools.js',
    'blaze-tools.js',
    'spacebars-compiler.js',
  ];

  files.forEach(function(file) {
    var code = fs.readFileSync(path.join(vendorDir, file), 'utf8');
    vm.runInContext(code, sandbox, { filename: file });
  });

  _cached = {
    HTML: sandbox.Package.htmljs.HTML,
    HTMLTools: sandbox.Package['html-tools'].HTMLTools,
    BlazeTools: sandbox.Package['blaze-tools'].BlazeTools,
    SpacebarsCompiler: sandbox.Package['spacebars-compiler'].SpacebarsCompiler,
  };

  return _cached;
}

module.exports = loadMeteorPackages;
