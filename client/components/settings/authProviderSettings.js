import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { TAPi18n } from '/imports/i18n';
import './authProviderSettings.jade';

// `section` set: the catalog methods take the section name first
// (getAuthConfigSources / saveAuthConfigSettings, server/lib/authConfig.js).
// Unset: a method of its own, as SAML has.
function callWithSection(data, method, ...args) {
  return data.section ? Meteor.call(method, data.section, ...args) : Meteor.call(method, ...args);
}

Template.authProviderSettings.onCreated(function () {
  this.loaded = new ReactiveVar(false);
  this.busy = new ReactiveVar(false);
  this.error = new ReactiveVar('');
  this.config = new ReactiveVar({});
  this.refresh = () => callWithSection(this.data, this.data.loadMethod, (error, result) => {
    if (error) this.error.set(error.reason || TAPi18n.__('error'));
    else { this.config.set(result); this.loaded.set(true); }
  });
  this.refresh();
});
Template.authProviderSettings.helpers({
  loaded() { return Template.instance().loaded; },
  busy() { return Template.instance().busy; },
  error() { return Template.instance().error; },
  fields() {
    const { overrides = {}, sources = {} } = Template.instance().config.get();
    return this.fields.map(field => {
      const value = overrides[field.key];
      const source = sources[field.key] || {};
      const secretField = field.type === 'secret';
      return { ...field, value: value ?? '', effective: String(source.value ?? ''),
        booleanField: field.type === 'boolean', multiline: field.type === 'textarea',
        choiceField: field.type === 'choice', numberField: field.type === 'number',
        secretField,
        // The server reports a secret only as { source, hasValue }.
        secretStoredHere: secretField && source.source === 'admin',
        // A secret's line names where it comes from - the Admin Panel, the
        // variable, or the file <NAME>_FILE points at - and says so when that
        // file cannot be read; the server never sends the value or the path.
        secretStatus: !secretField ? ''
          : source.source === 'file-error' ? `${field.fileVar}: ${TAPi18n.__('error')}`
          : !source.hasValue ? TAPi18n.__('unset-color')
          : `${TAPi18n.__('password')}: ${source.source === 'admin' ? TAPi18n.__('admin-panel')
            : source.source === 'file' ? field.fileVar : field.envVar}`,
        choiceOptions: (field.choices || []).map(choice => ({ value: choice, selected: value === choice })),
        inherit: value === undefined, enabled: value === true, disabled: value === false,
        sourceLabel: source.source === 'admin' ? TAPi18n.__('admin-panel')
          : source.source === 'env' ? field.envVar
          // SAML fields left at Default follow the identity-provider profile.
          : source.source === 'profile' ? 'SAML_IDP_PROFILE' : TAPi18n.__('default') };
    });
  },
  urls() { return Object.values(Template.instance().config.get().urls || {}).map(url => ({ url })); },
});
Template.authProviderSettings.events({
  'submit .js-auth-provider-settings'(event, instance) {
    event.preventDefault();
    if (instance.busy.get()) return;
    const input = {};
    for (const field of instance.findAll('.js-auth-config-field')) {
      input[field.dataset.key] = field.dataset.boolean && field.value !== ''
        ? field.value === 'true' : field.value;
    }
    const clearSecrets = instance.findAll('.js-auth-secret-clear')
      .filter(box => box.checked).map(box => box.dataset.key);
    if (clearSecrets.length) input.clearSecrets = clearSecrets;
    instance.busy.set(true);
    instance.error.set('');
    callWithSection(instance.data, instance.data.saveMethod, input, error => {
      instance.busy.set(false);
      // A typed secret is never kept in the page after it was sent.
      for (const field of instance.findAll('input[type="password"].js-auth-config-field')) field.value = '';
      if (error) instance.error.set(error.reason || TAPi18n.__('error'));
      else instance.refresh();
    });
  },
});

Template.ldapTestConnection.onCreated(function () {
  this.result = new ReactiveVar('');
  this.success = new ReactiveVar(true);
});
Template.ldapTestConnection.helpers({
  result() { return Template.instance().result; },
  resultClass() {
    return Template.instance().success.get() ? 'ldap-test-success' : 'ldap-test-error';
  },
});
Template.ldapTestConnection.events({
  // "It should be possible to test at admin panel, does for example LDAP login
  // work": the admin-gated ldap_test_connection method
  // (packages/wekan-ldap/server/testConnection.js) against whichever value is
  // in effect, Admin Panel or environment variable.
  'click button.js-ldap-test-connection'(event, tpl) {
    tpl.result.set('...');
    Meteor.call('ldap_test_connection', (err) => {
      if (err) {
        tpl.success.set(false);
        tpl.result.set(
          TAPi18n.__('ldap-test-connection-error', {
            sprintf: [err.reason || err.message || ''],
          }),
        );
      } else {
        tpl.success.set(true);
        tpl.result.set(TAPi18n.__('ldap-test-connection-success'));
      }
    });
  },
});
