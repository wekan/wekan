'use strict';

const MAX_HEADER_LENGTH = 8192;

function parseOAuthHeader(header) {
  if (typeof header !== 'string' || header.length > MAX_HEADER_LENGTH || !header.startsWith('OAuth ')) {
    throw new Error('Invalid OAuth header');
  }
  const result = Object.create(null);
  // OAuth parameters are percent encoded, including commas and quotes. Split
  // once, then anchor each match so repeated oauth_ prefixes cannot cause the
  // engine to retry from every position in an attacker-controlled string.
  for (const part of header.slice(6).split(',')) {
    const match = /^(oauth_\w+|realm)="([^"]*)"$/.exec(part.trim());
    if (!match || Object.hasOwn(result, match[1])) throw new Error('Invalid OAuth header');
    result[match[1]] = decodeURIComponent(match[2]);
  }
  // realm is an authorization-header attribute, not a signature parameter.
  delete result.realm;
  return result;
}

module.exports = { parseOAuthHeader, MAX_HEADER_LENGTH };
