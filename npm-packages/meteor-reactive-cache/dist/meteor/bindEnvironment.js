"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _meteorGlobals = require("@wekanteam/meteor-globals");
var Meteor = (0, _meteorGlobals.getGlobal)('meteor', 'Meteor');
var _default = exports["default"] = Meteor.bindEnvironment.bind(Meteor);