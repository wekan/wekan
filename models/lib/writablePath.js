'use strict';

const path = require('node:path');

// Meteor changes process.cwd() to its generated server program before loading
// application modules. A relative WRITABLE_PATH, however, is supplied by the
// launcher and is relative to the launch directory recorded in PWD. Resolving
// it against the generated program directory makes every real attachment look
// outside the configured storage root and the containment check correctly
// refuses to read it.
function resolveWritablePath({ writablePath, launchDirectory, runtimeDirectory } = {}) {
  const runtime = runtimeDirectory || process.cwd();
  if (!writablePath) return path.resolve(runtime);
  if (path.isAbsolute(writablePath)) return path.normalize(writablePath);
  return path.resolve(launchDirectory || process.env.PWD || runtime, writablePath);
}

module.exports = { resolveWritablePath };
