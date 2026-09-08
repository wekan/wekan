// #6681: OIDC_REDIRECTION_ENABLED auto-login sent the browser to the identity
// provider on EVERY render of the sign-in page (userFormsLayout), with no
// guard against re-firing. With `oauth2-login-style: redirect`, the IdP's
// callback lands back on that same sign-in page (Meteor's redirect-style
// OAuth has no dedicated callback route of its own) - and the actual login
// method call that follows a successful callback completes asynchronously,
// racing against this page's own re-render. When the auto-redirect check ran
// before that login had finished, it saw "not logged in" and fired a BRAND
// new navigation straight back to the identity provider, forever - until the
// provider started rate-limiting the repeated /authorize hits (the reporter's
// exact symptom: Microsoft Entra ID blocking further attempts).
//
// The fix: a one-shot flag in sessionStorage (survives the full-page
// navigation to the IdP and back, cleared when the tab closes) marks that
// this tab already sent the browser once. A second render of the sign-in
// page - the callback bounce-back - sees the flag and does NOT navigate
// again, leaving Meteor's own oauth completion to finish the login
// undisturbed. The flag is cleared on both a successful login and a login
// failure (config/accounts.js), so a genuine later logout, or a real error,
// can still trigger the auto-redirect again rather than being stuck forever
// the other way.
const OIDC_AUTO_REDIRECT_FLAG = 'wekan-oidc-auto-redirect-pending';

// sessionStorage can throw (private browsing in some older browsers, storage
// disabled by policy). Failing OPEN (treat as "not yet redirected") matches
// this code's behavior before the flag existed at all, rather than turning a
// storage restriction into a second, different way to break the same login.
function readFlag() {
  try {
    return sessionStorage.getItem(OIDC_AUTO_REDIRECT_FLAG) === '1';
  } catch (error) {
    return false;
  }
}

function setFlag() {
  try {
    sessionStorage.setItem(OIDC_AUTO_REDIRECT_FLAG, '1');
  } catch (error) {
    // Nothing to do: the auto-redirect will simply be able to fire again.
  }
}

function clearFlag() {
  try {
    sessionStorage.removeItem(OIDC_AUTO_REDIRECT_FLAG);
  } catch (error) {
    // Nothing to do.
  }
}

export const OidcAutoRedirect = { hasAlreadyFired: readFlag, markFired: setFlag, clear: clearFlag };
