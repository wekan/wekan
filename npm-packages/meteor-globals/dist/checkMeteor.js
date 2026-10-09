'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = checkMeteor;

var _getGlobal = require('./getGlobal');

var _getGlobal2 = _interopRequireDefault(_getGlobal);

var _findDotMeteorDir = require('./findDotMeteorDir');

var _findDotMeteorDir2 = _interopRequireDefault(_findDotMeteorDir);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var checks = {
  fileCheck: function fileCheck() {
    if (process.env.NODE_ENV === 'production') return true;
    var meteor = (0, _getGlobal2.default)('meteor', 'Meteor');
    if (!meteor) return false;
    if (meteor.isClient) return true;
    var dotMeteor = (0, _findDotMeteorDir2.default)();
    return !!dotMeteor;
  },
  globalCheck: function globalCheck() {
    return !!global.Package;
  }
};

function checkMeteor(opts) {
  var exception = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

  var options = Object.assign({
    fileCheck: false,
    globalCheck: true
  }, opts);

  var result = true;
  Object.keys(options).forEach(function (key) {
    if (!result || !options[key]) return;
    result = checks[key]();
  });

  if (exception) throw new Error('meteor-globals has to be run inside a meteor project!');
  return result;
}