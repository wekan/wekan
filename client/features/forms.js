import '/client/components/forms/datepicker.jade';
import '/client/components/forms/inlinedform.jade';

import '/client/lib/inlinedform';
// No datepicker.js: the template in datepicker.jade is `editDateForm`, which
// renders what it is passed and has no state of its own. The state and the
// handlers belong to the eight popups that include it, and come from
// client/lib/datepicker.js. The template this file used to wire up - a ninth
// copy of the same form, called `datepicker` - was included by nothing and
// could not be opened as a popup either (a popup's template name ends in
// `Popup`), so it went with the duplication.

import '/client/components/forms/datepicker.css';
import '/client/components/forms/forms.css';
