"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _bindEnvironment = _interopRequireDefault(require("./meteor/bindEnvironment"));
var _tracker = _interopRequireDefault(require("./meteor/tracker"));
var _ReactiveCache = _interopRequireDefault(require("./ReactiveCache"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var DataCache = exports["default"] = /*#__PURE__*/function () {
  function DataCache(getData, options) {
    _classCallCheck(this, DataCache);
    this.options = _objectSpread({
      timeout: 60 * 1000
    }, typeof options === 'function' ? {
      compare: options
    } : options);
    this.getData = getData;
    this.cache = new _ReactiveCache["default"](this.options.compare, function () {
      return false;
    });
    this.timeouts = {};
    this.computations = {};
  }
  return _createClass(DataCache, [{
    key: "ensureComputation",
    value: function ensureComputation(key) {
      var _this = this;
      if (this.timeouts[key]) {
        clearTimeout(this.timeouts[key]);
        delete this.timeouts[key];
      }
      if (this.computations[key] && !this.computations[key].stopped) return;
      this.computations[key] = _tracker["default"].nonreactive(function () {
        return _tracker["default"].autorun(function () {
          _this.cache.set(key, _this.getData(key));
        });
      });

      // stop the computation if the key doesn't have any dependants
      this.computations[key].onInvalidate(function () {
        return _this.checkStop(key);
      });
    }
  }, {
    key: "checkStop",
    value: function checkStop(key) {
      var _this2 = this;
      if (this.cache.ensureDependency(key).hasDependents()) return;
      if (this.timeouts[key]) {
        clearTimeout(this.timeouts[key]);
        delete this.timeouts[key];
      }
      this.timeouts[key] = setTimeout((0, _bindEnvironment["default"])(function () {
        if (!_this2.computations[key]) return;
        _this2.computations[key].stop();
        delete _this2.computations[key];
        _this2.cache.del(key);
      }), this.options.timeout);
    }
  }, {
    key: "get",
    value: function get(key) {
      var _this3 = this;
      if (!_tracker["default"].currentComputation) {
        var _data = this.cache.get(key);
        if (_data == null) {
          _data = this.getData(key);
          this.cache.set(key, _data);
          this.checkStop(key);
        }
        return _data;
      }
      this.ensureComputation(key);
      var data = this.cache.get(key);
      _tracker["default"].currentComputation.onStop(function () {
        return _this3.checkStop(key);
      });
      return data;
    }
  }]);
}();