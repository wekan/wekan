'use strict';

// The autocomplete token of a sign-in or sign-up text field
// (client/components/users/accountsAutocomplete.js). Pure:
// tests/accountsAutocomplete.test.cjs.
const BY_FIELD = Object.freeze({
  username_and_email: 'username',
  username: 'username',
  email: 'email',
});

function autocompleteFor(field) {
  if (!field || typeof field !== 'object') return '';
  if (typeof field.autocomplete === 'string' && field.autocomplete) return field.autocomplete;
  return BY_FIELD[field._id] || '';
}

module.exports = { autocompleteFor, BY_FIELD };
