import { TAPi18n } from '/imports/i18n';

Template.passwordInput.onRendered(function() {
  const template = this;
  const input = template.find('input.password-field');
  const label = template.find('label');
  
  // Set the dynamic id and name based on the field _id
  if (template.data && template.data._id) {
    const fieldId = `at-field-${template.data._id}`;
    input.id = fieldId;
    input.name = fieldId;
    label.setAttribute('for', fieldId);
    
    // Ensure the input starts as password type for password fields
    input.type = 'password';
    
    // Initially hide the slash line since password starts hidden
    const slashLine = template.find('.eye-slash-line');
    if (slashLine) {
      slashLine.style.display = 'none';
    }
  }
});

Template.passwordInput.events({
  'click .password-toggle-btn'(event, template) {
    event.preventDefault();
    const input = template.find('input.password-field');
    const slashLine = template.find('.eye-slash-line');
    
    if (input.type === 'password') {
      input.type = 'text';
      // Show the slash line when password is visible
      if (slashLine) {
        slashLine.style.display = 'block';
      }
    } else {
      input.type = 'password';
      // Hide the slash line when password is hidden
      if (slashLine) {
        slashLine.style.display = 'none';
      }
    }
  },
});