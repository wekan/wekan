'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = ensureDependencies;

var _checkMeteor = require('./checkMeteor');

var _checkMeteor2 = _interopRequireDefault(_checkMeteor);

var _ensureDependency = require('./ensureDependency');

var _ensureDependency2 = _interopRequireDefault(_ensureDependency);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ensureDependencies() {
  var options = {
    restart: true,
    name: 'A recently installed npm package'
  };

  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  if (typeof args[args.length - 1] !== 'string') {
    var userOpts = args.pop();
    if (typeof userOpts === 'boolean') {
      options.restart = userOpts;
    } else {
      options = Object.assign(options, userOpts);
    }
  }

  var inMeteor = (0, _checkMeteor2.default)({
    fileCheck: true,
    globalCheck: true
  });
  if (!inMeteor) throw new Error(options.name + ' has to be installed inside a meteor project!');

  var deps = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
  var installedDeps = [];
  deps.forEach(function (dep) {
    var result = (0, _ensureDependency2.default)(dep, false);
    if (result && !result.neededVersion) installedDeps.push(dep);
    if (result && result.neededVersion) {
      console.log('=> ' + options.name + ' depends on ' + result.name + '@' + result.neededVersion + ' but version ' + result.installedVersion + ' is installed.');
    }
  });
  if (options.restart && installedDeps.length) {
    console.log();
    console.log('=> ' + options.name + ' depends on some meteor packages from atmosphere.');
    console.log('=> These dependencies were installed automatically.');
    console.log('=> Please restart meteor to continue.');
    console.log();
    process.exit(0);
  }
}