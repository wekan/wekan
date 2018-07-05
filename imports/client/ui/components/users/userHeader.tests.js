// /* eslint-env mocha */
// /* eslint-disable func-names, prefer-arrow-callback */

// import { Factory } from 'meteor/dburles:factory';
// import { chai } from 'meteor/practicalmeteor:chai';
// import { Template } from 'meteor/templating';
// import { $ } from 'meteor/jquery';
// // import { withRenderedTemplate } from '../../test-helpers.js';
// import { withRenderedTemplate } from '../../../../imports/ui/test-helpers.js';
// // import '../../../../imports/ui/test-helpers.js';
// // import '../../../../client/components/users/userHeader.js';

// describe('headerUserBar', function () {
//   beforeEach(function () {
//     Template.registerHelper('_', (key) => key);
//   });

//   afterEach(function () {
//     Template.deregisterHelper('_');
//   });

//   it('renders correctly with simple data', function () {
//     const todo = Factory.build('todo', { checked: false });
//     const data = {
//       todo: Todos._transform(todo),
//       onEditingChange: () => 0,
//     };

//     withRenderedTemplate('headerUserBar', data, (el) => {
//       chai.assert.equal($(el).find('input[type=text]').val(), todo.text);
//       chai.assert.equal($(el).find('.list-item.checked').length, 0);
//       chai.assert.equal($(el).find('.list-item.editing').length, 0);
//     });
//   });
// });
