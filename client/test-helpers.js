import { _ } from 'meteor/underscore';
import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';
import { Tracker } from 'meteor/tracker';
import { resetDatabase } from 'meteor/xolvio:cleaner';
import { Meteor } from 'meteor/meteor';

let withDiv;
if (Meteor.isTest) {
  withDiv = function withDiv(callback) {
    const el = document.createElement('div');
    document.body.appendChild(el);
    try {
      callback(el);
    } finally {
      document.body.removeChild(el);
    }
  };
}

export const withRenderedTemplate = function withRenderedTemplate(template, data, callback) {
  withDiv((el) => {
    const ourTemplate = _.isString(template) ? Template[template] : template;
    Blaze.renderWithData(ourTemplate, data, el);
    Tracker.flush();
    callback(el);
  });
};

if (Meteor.isTest) {
  Meteor.methods({
    'test.resetDatabase': () => resetDatabase(),
  });
}
