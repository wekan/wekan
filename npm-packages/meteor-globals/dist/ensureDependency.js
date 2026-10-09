'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.default = ensureDependency;

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _semver = require('semver');

var _semver2 = _interopRequireDefault(_semver);

var _getGlobal = require('./getGlobal');

var _getGlobal2 = _interopRequireDefault(_getGlobal);

var _checkMeteor = require('./checkMeteor');

var _checkMeteor2 = _interopRequireDefault(_checkMeteor);

var _findDotMeteorDir = require('./findDotMeteorDir');

var _findDotMeteorDir2 = _interopRequireDefault(_findDotMeteorDir);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ensureDependency(packageName) {
  var throwErrors = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

  if (process.env.NODE_ENV === 'production') return false;
  var meteor = (0, _getGlobal2.default)('meteor', 'Meteor');
  if (!meteor || meteor.isClient) return false;

  var _packageName$split = packageName.split('@'),
      _packageName$split2 = _slicedToArray(_packageName$split, 2),
      name = _packageName$split2[0],
      version = _packageName$split2[1];

  if (throwErrors && !(0, _checkMeteor2.default)({ fileCheck: true }, false)) throw new Error('cannot find .meteor/packages file. Are you in a meteor project?');
  var dotMeteor = (0, _findDotMeteorDir2.default)();
  var packageFile = dotMeteor + '/packages';
  var installedPackages = _fs2.default.readFileSync(packageFile).toString().split('\n').map(function (p) {
    return p.split('@')[0].trim();
  });
  if (installedPackages.indexOf(name) >= 0) {
    if (!version) return false;
    var versionsFile = dotMeteor + '/versions';
    var installed = _fs2.default.readFileSync(versionsFile).toString().split('\n').map(function (packageAndVersion) {
      var pack = packageAndVersion.split('@');
      return {
        name: pack[0],
        version: pack[1]
      };
    }).filter(function (p) {
      return p.name === name;
    })[0];

    if (installed && !_semver2.default.satisfies(installed.version, version)) {
      return { name: name, neededVersion: version, installedVersion: installed.version };
    }
    return false;
  }
  if ((0, _getGlobal2.default)(name)) return false;
  _fs2.default.appendFileSync(packageFile, '\n' + packageName);
  return true;
}