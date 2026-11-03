'use strict';

// The login page background colour an administrator can set (Admin Panel ->
// Lay-out). Pure and Meteor-free so the client, the server and plain-Node tests
// run the same decision (mirrors contrastColor.js).
//
// Only a hex colour (#rgb or #rrggbb) is accepted. Anything else - empty, a
// colour name, a CSS fragment - means "not set" and the page keeps its grey, so
// the value that ends up in a CSS custom property can never carry CSS of its own.

const { contrastText } = require('./contrastColor');

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

// -> { background, foreground } or null when the value is not a hex colour.
function loginBackgroundStyle(value) {
  if (typeof value !== 'string') return null;
  const background = value.trim();
  if (!HEX.test(background)) return null;
  return { background: background.toLowerCase(), foreground: contrastText(background) };
}

module.exports = { loginBackgroundStyle };
