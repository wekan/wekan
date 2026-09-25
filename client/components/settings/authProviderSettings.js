import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { TAPi18n } from '/imports/i18n';
import './authProviderSettings.jade';

Template.authProviderSettings.onCreated(function () {
  this.loaded = new ReactiveVar(false);
  this.busy = new ReactiveVar(false);
  this.error = new ReactiveVar('');
  this.config = new ReactiveVar({});
  this.refresh = () => Meteor.call(this.data.loadMethod, (error, result) => {
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
      return { ...field, value: value ?? '', effective: String(source.value ?? ''),
        booleanField: field.type === 'boolean', multiline: field.type === 'textarea',
        inherit: value === undefined, enabled: value === true, disabled: value === false,
        sourceLabel: source.source === 'admin' ? TAPi18n.__('admin-panel')
          : source.source === 'env' ? field.envVar : TAPi18n.__('default') };
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
    instance.busy.set(true);
    instance.error.set('');
    Meteor.call(instance.data.saveMethod, input, error => {
      instance.busy.set(false);
      if (error) instance.error.set(error.reason || TAPi18n.__('error'));
      else instance.refresh();
    });
  },
});
