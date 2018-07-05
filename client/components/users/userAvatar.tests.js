/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */

import { Factory } from 'meteor/dburles:factory';
import { expect, should as shouldFunc } from 'meteor/practicalmeteor:chai';
import { Template } from 'meteor/templating';
import { $ } from 'meteor/jquery';
import { withRenderedTemplate } from '../../test-helpers.js';
import '../../../i18n/en.i18n.json';
import '../../lib/accessibility';
import '../../lib/cssEvents';
import '../../lib/datepicker';
import '../../lib/dropImage';
import '../../lib/escapeActions';
import '../../lib/filter';
import '../../lib/i18n';
import '../../lib/inlinedform';
import '../../lib/keyboard';
import '../../lib/mixins';
import '../../lib/modal';
import '../../lib/multiSelection';
import '../../lib/pasteImage';
import '../../lib/popup';
import '../../lib/textComplete';
import '../../lib/unsavedEdits';
import '../../lib/utils';

import './userAvatar.jade';
import './userAvatar.styl';
import './userAvatar';

// TODO yes, Template.keyboardShortcuts.helpers in lib directory is a bady idea
import '../main/keyboardShortcuts.jade';

/*const should = */ shouldFunc();
Meteor._debug('========================== 1 -=======================');
describe('userAvatar', function () {
  Meteor._debug('========================== 2 -=======================');
  beforeEach(function () {
    Meteor._debug('========================== 3 -=======================');

    Template.registerHelper('_', (key) => key);
  });

  afterEach(function () {
    Template.deregisterHelper('_');
  });

  describe('userAvatarInitials', function () {
    Meteor._debug('========================== 4 -=======================');

    it('renders correctly', function () {
      Meteor._debug('========================== 5 -=======================');

      withRenderedTemplate('userAvatarInitials', {}, (el) => {

        // expect($(el).find('input[type=text]').val(), todo.text);
        // expect($(el).find('.list-item.checked').length, 0);
        // expect($(el).find('.list-item.editing').length, 0);
      });

    });

  });
});
