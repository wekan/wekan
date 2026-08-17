import '/client/components/forms/datepicker.jade';
import '/client/components/forms/inlinedform.jade';

import '/client/lib/inlinedform';
// No separate datepicker.js: the template in datepicker.jade is `editDateForm`.
// Its shared event map lives in client/lib/datepicker.js; each including popup
// passes its own state and store/delete callbacks. The template this file used
// to wire up - a ninth
// copy of the same form, called `datepicker` - was included by nothing and
// could not be opened as a popup either (a popup's template name ends in
// `Popup`), so it went with the duplication.

import '/client/components/forms/datepicker.css';
import '/client/components/forms/forms.css';
