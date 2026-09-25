// One automatic OIDC attempt per tab. A failed callback must leave the latch
// set: retrying automatically would repeat the same failure indefinitely.
// The ordinary OIDC button remains available for an explicit retry.
const OIDC_AUTO_REDIRECT_FLAG = 'wekan-oidc-auto-redirect-pending';

function readFlag() {
  try {
    return sessionStorage.getItem(OIDC_AUTO_REDIRECT_FLAG) === '1';
  } catch (error) {
    // Without persistent storage we cannot protect a full-page round trip.
    // Keep manual sign-in available instead of navigating automatically.
    return true;
  }
}

function setFlag() {
  try {
    sessionStorage.setItem(OIDC_AUTO_REDIRECT_FLAG, '1');
    return sessionStorage.getItem(OIDC_AUTO_REDIRECT_FLAG) === '1';
  } catch (error) {
    return false;
  }
}

function clearFlag() {
  try {
    sessionStorage.removeItem(OIDC_AUTO_REDIRECT_FLAG);
  } catch (error) {
    // Automatic login stays disabled when storage is unavailable.
  }
}

export const OidcAutoRedirect = { hasAlreadyFired: readFlag, markFired: setFlag, clear: clearFlag };
