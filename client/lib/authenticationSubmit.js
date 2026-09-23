// Capture submission before the nested accounts form can start a password login.
// Keep that form mounted while resolving the selected authentication method.
function createAuthenticationSubmitHandler({
  isSignIn, readCredentials, resolveMethod, submitPassword, login, complete, setBusy,
}) {
  let pending = false;
  let replayingPassword = false;
  return async function submit(event) {
    if (event.target.id !== 'at-pwd-form' || !isSignIn() || replayingPassword) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (pending) return;
    const form = event.target;
    const { username, password } = readCredentials(form);
    pending = true;
    try {
      setBusy(true);
      const method = username && password ? await resolveMethod(username) : 'password';
      if (!['ldap', 'saml', 'cas'].includes(method)) {
        // Firefox suppresses a second submit event on the same form until the
        // original native dispatch finishes. A resolved Promise only yields to
        // microtasks, which still run inside that dispatch in Firefox. Replay
        // in the next task, keeping duplicate submissions blocked until then.
        await new Promise(resolve => setTimeout(resolve, 0));
        // Let useraccounts retain its validation, normalization and 2FA flow.
        setBusy(false);
        replayingPassword = true;
        try { submitPassword(form); } finally { replayingPassword = false; }
        return;
      }
      await new Promise((resolve, reject) => {
        login(method, username, password, error => error ? reject(error) : resolve());
      });
      setBusy(false);
      complete();
    } catch (error) {
      setBusy(false);
      complete(error);
    } finally {
      pending = false;
    }
  };
}

module.exports = { createAuthenticationSubmitHandler };
