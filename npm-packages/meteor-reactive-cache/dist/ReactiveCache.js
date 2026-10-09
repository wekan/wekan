"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _tracker = _interopRequireDefault(require("./meteor/tracker"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var ReactiveCache = exports["default"] = /*#__PURE__*/function () {
  function ReactiveCache(compare, shouldStop) {
    _classCallCheck(this, ReactiveCache);
    this.shouldStop = shouldStop || function () {
      return true;
    };
    this.compare = compare || function (a, b) {
      return a === b;
    };
    this.values = {};
    this.deps = {};
  }
  return _createClass(ReactiveCache, [{
    key: "ensureDependency",
    value: function ensureDependency(key) {
      if (!this.deps[key]) this.deps[key] = new _tracker["default"].Dependency();
      return this.deps[key];
    }
  }, {
    key: "checkDeletion",
    value: function checkDeletion(key) {
      var dep = this.ensureDependency(key);
      if (dep.hasDependents()) return false;
      delete this.values[key];
      delete this.deps[key];
      return true;
    }
  }, {
    key: "clear",
    value: function clear() {
      var _this = this;
      Object.keys(this.values).forEach(function (key) {
        return _this.del(key);
      });
    }
  }, {
    key: "del",
    value: function del(key) {
      var dep = this.ensureDependency(key);
      delete this.values[key];
      if (this.checkDeletion(key)) return;
      dep.changed();
    }
  }, {
    key: "set",
    value: function set(key, data, bypassCompare) {
      var dep = this.ensureDependency(key);
      var current = this.values[key];
      this.values[key] = data;
      if (!this.compare(current, data) || bypassCompare) {
        dep.changed();
      }
    }
  }, {
    key: "get",
    value: function get(key) {
      var _this2 = this;
      var data = this.values[key];
      if (_tracker["default"].currentComputation) {
        var dep = this.ensureDependency(key);
        dep.depend();
        _tracker["default"].currentComputation.onStop(function () {
          if (!_this2.shouldStop(key)) return;
          _this2.checkDeletion(key);
        });
      }
      return data;
    }
  }]);
}();