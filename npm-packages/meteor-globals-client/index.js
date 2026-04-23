'use strict';

// Client-safe shim for @wekanteam/meteor-globals.
// The real package barrel-imports findDotMeteorDir.js which uses
// Node.js built-ins (path, fs). Only getGlobal() is actually needed
// at runtime by @wekanteam/meteor-reactive-cache.

exports.getGlobal = function getGlobal(packageName, globalName) {
  if (typeof global === 'undefined' || !global.Package || !global.Package[packageName]) return undefined;
  if (globalName) return global.Package[packageName][globalName];
  return global.Package[packageName];
};

exports.checkMeteor = function checkMeteor() { return true; };
exports.ensureDependency = function ensureDependency() { return false; };
exports.ensureDependencies = function ensureDependencies() { return false; };
