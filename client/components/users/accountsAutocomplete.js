// The sign-in and sign-up text fields come from communitypackages:unstyled's
// atTextInput, whose <input> carries no autocomplete attribute: the
// "autocomplete: 'username'" WeKan configures in config/accounts.js never
// reached the page, and the sign-in name field (username_and_email, which the
// package adds itself) had none at all. A password manager then has to guess
// which field is the account (WCAG 1.3.5 Identify Input Purpose, 3.3.8
// Accessible Authentication). The field's own setting wins; the combined
// sign-in field and the e-mail field get theirs by purpose.
// tests/accountsAutocomplete.test.cjs, tests/playwright/specs/48-keyboard-only.e2e.js.
import { Template } from 'meteor/templating';
import { autocompleteFor } from '/models/lib/accountsAutocomplete';

if (Template.atTextInput) {
  Template.atTextInput.onRendered(function setAutocomplete() {
    const input = this.find('input');
    const value = autocompleteFor(this.data);
    if (input && value) input.setAttribute('autocomplete', value);
  });
}
