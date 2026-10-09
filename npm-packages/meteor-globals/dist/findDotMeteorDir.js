'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = findDotMeteorDir;

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function findDotMeteorDir() {
  var depth = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

  if (_path2.default.resolve(process.env.PWD).split('/').length < depth) return null;
  var filePath = Array(depth + 1).join('../') + '.meteor/packages';
  var dotMeteor = _path2.default.resolve(process.env.PWD, filePath);
  if (_fs2.default.existsSync(dotMeteor)) return _path2.default.resolve(process.env.PWD, Array(depth + 1).join('../') + '.meteor');
  return findDotMeteorDir(depth + 1);
}