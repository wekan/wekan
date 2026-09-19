'use strict';

// Only an application path remembered by the sign-in guard can replace home.
function loginRedirectTarget(returnToPrevious, previousPath) {
  return returnToPrevious && typeof previousPath === 'string' &&
    previousPath.startsWith('/') && !previousPath.startsWith('//') &&
    !previousPath.includes('\\')
    ? previousPath : '/';
}

module.exports = { loginRedirectTarget };
