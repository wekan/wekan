'use strict';
// Wait until the page shows the language a spec has just switched to.
//
// setLanguage saves the choice on the server; the client then loads that
// language and draws everything again - which closes a popup opened before
// that, and in WebKit keeps the page busy enough that a click waits it out.
// Specs that switched language and at once opened the board view popup, or a
// settings section, failed when the language arrived late (Latin, Corsican,
// Igbo ... in WebKit and Firefox). The client mirrors its current language into
// <html lang> (client/lib/i18n.js) in the same flush that redraws, so that
// attribute says when it has arrived.

// Runs in the page. Wraps Meteor.callAsync so that a 'setLanguage' call
// resolves only once <html lang> names the language and the redraw has run.
// It waits at most 10 s and then resolves anyway: a language the client
// resolves to another tag must not turn a wait into a failure.
function waitForLanguageOnSetLanguage() {
  const tag = value => String(value || '').toLowerCase().replace(/_/g, '-');
  const shown = wanted => new Promise(resolve => {
    const deadline = Date.now() + 10000;
    const check = () => {
      if (tag(document.documentElement.lang) === tag(wanted) || Date.now() > deadline) {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      } else setTimeout(check, 50);
    };
    check();
  });
  const install = () => {
    const meteor = window.Meteor;
    if (!meteor || typeof meteor.callAsync !== 'function') return false;
    if (meteor.callAsync.__waitsForLanguage) return true;
    const callAsync = meteor.callAsync;
    const wrapped = async function (name, ...args) {
      const result = await callAsync.call(this, name, ...args);
      if (name === 'setLanguage' && typeof args[0] === 'string') await shown(args[0]);
      return result;
    };
    wrapped.__waitsForLanguage = true;
    meteor.callAsync = wrapped;
    return true;
  };
  if (!install()) {
    const timer = setInterval(() => { if (install()) clearInterval(timer); }, 20);
  }
}

// For a page of a context a spec makes itself, which the fixture's init script
// does not reach.
async function untilLanguageShown(page, language) {
  await page.waitForFunction(wanted => {
    const tag = value => String(value || '').toLowerCase().replace(/_/g, '-');
    return tag(document.documentElement.lang) === tag(wanted);
  }, language, { timeout: 15_000 });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

module.exports = { waitForLanguageOnSetLanguage, untilLanguageShown };
