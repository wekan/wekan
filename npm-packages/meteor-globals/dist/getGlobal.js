"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getGlobal;
function getGlobal(packageName, globalName) {
  if (!global.Package || !global.Package[packageName]) return undefined;
  if (globalName) return global.Package[packageName][globalName];
  return global.Package[packageName];
}