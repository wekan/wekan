// ---------------------------------------------------------------------------------
// Field object
// ---------------------------------------------------------------------------------

Field = function(field) {
  check(field, FIELD_PAT);
  _.defaults(this, field);

  this.validating = new ReactiveVar(false);
  this.status = new ReactiveVar(null);
};

if (Meteor.isClient) {
  Field.prototype.clearStatus = function() {
    return this.status.set(null);
  };
}

if (Meteor.isServer) {
  Field.prototype.clearStatus = function() {
    // Nothing to do server-side
    return;
  };
}

Field.prototype.fixValue = function(value) {
  if (this.type === "checkbox") {
    return !!value;
  }

  if (this.type === "select") {
    // TODO: something working...
    return value;
  }

  if (this.type === "radio") {
    // TODO: something working...
    return value;
  }

  // Possibly applies required transformations to the input value
  if (this.trim) {
    value = value.trim();
  }

  if (this.lowercase) {
    value = value.toLowerCase();
  }

  if (this.uppercase) {
    value = value.toUpperCase();
  }

  if (!!this.transform) {
    value = this.transform(value);
  }

  return value;
};

if (Meteor.isClient) {
  Field.prototype.getDisplayName = function(state) {
    var displayName = this.displayName;

    if (_.isFunction(displayName)) {
      displayName = displayName();
    } else if (_.isObject(displayName)) {
      displayName = displayName[state] || displayName["default"];
    }

    if (!displayName) {
      displayName = capitalize(this._id);
    }

    return displayName;
  };
}

if (Meteor.isClient) {
  Field.prototype.getPlaceholder = function(state) {
    var placeholder = this.placeholder;

    if (_.isObject(placeholder)) {
      placeholder = placeholder[state] || placeholder["default"];
    }

    if (!placeholder) {
      placeholder = capitalize(this._id);
    }

    return placeholder;
  };
}

Field.prototype.getStatus = function() {
  return this.status.get();
};

if (Meteor.isClient) {
  Field.prototype.getValue = function(templateInstance) {
    if (this.type === "checkbox") {
      return !!(templateInstance.$("#at-field-" + this._id + ":checked").val());
    }

    if (this.type === "radio") {
      return templateInstance.$("[name=at-field-"+ this._id + "]:checked").val();
    }

    return templateInstance.$("#at-field-" + this._id).val();
  };
}

if (Meteor.isClient) {
  Field.prototype.hasError = function() {
    return this.negativeValidation && this.status.get();
  };
}

if (Meteor.isClient) {
  Field.prototype.hasIcon = function() {
    if (this.showValidating && this.isValidating()) {
      return true;
    }

    if (this.negativeFeedback && this.hasError()) {
      return true;
    }

    if (this.positiveFeedback && this.hasSuccess()) {
      return true;
    }
  };
}

if (Meteor.isClient) {
  Field.prototype.hasSuccess = function() {
    return this.positiveValidation && this.status.get() === false;
  };
}

if (Meteor.isClient)
  Field.prototype.iconClass = function() {
    if (this.isValidating()) {
      return AccountsTemplates.texts.inputIcons["isValidating"];
    }

    if (this.hasError()) {
      return AccountsTemplates.texts.inputIcons["hasError"];
    }

    if (this.hasSuccess()) {
      return AccountsTemplates.texts.inputIcons["hasSuccess"];
    }
  };

if (Meteor.isClient) {
  Field.prototype.isValidating = function() {
    return this.validating.get();
  };
}

if (Meteor.isClient) {
  Field.prototype.setError = function(err) {
    check(err, Match.OneOf(String, undefined, Boolean));

    if (err === false) {
      return this.status.set(false);
    }

    return this.status.set(err || true);
  };
}

if (Meteor.isServer) {
  Field.prototype.setError = function(err) {
    // Nothing to do server-side
    return;
  };
}

if (Meteor.isClient) {
  Field.prototype.setSuccess = function() {
    return this.status.set(false);
  };
}

if (Meteor.isServer) {
  Field.prototype.setSuccess = function() {
    // Nothing to do server-side
    return;
  };
}

if (Meteor.isClient) {
  Field.prototype.setValidating = function(state) {
    check(state, Boolean);
    return this.validating.set(state);
  };
}

if (Meteor.isServer) {
  Field.prototype.setValidating = function(state) {
    // Nothing to do server-side
    return;
  };
}

if (Meteor.isClient) {
  Field.prototype.setValue = function(templateInstance, value) {
    if (this.type === "checkbox") {
      templateInstance.$("#at-field-" + this._id).prop('checked', true);
      return;
    }

    if (this.type === "radio") {
      templateInstance.$("[name=at-field-"+ this._id + "]").prop('checked', true);
      return;
    }

    templateInstance.$("#at-field-" + this._id).val(value);
  };
}

Field.prototype.validate = function(value, strict) {
  check(value, Match.OneOf(undefined, String, Boolean));
  this.setValidating(true);
  this.clearStatus();

  if (_.isUndefined(value) || value === '') {
    if (!!strict) {
      if (this.required) {
        this.setError(AccountsTemplates.texts.requiredField);
        this.setValidating(false);

        return AccountsTemplates.texts.requiredField;
      } else {
        this.setSuccess();
        this.setValidating(false);

        return false;
      }
    } else {
      this.clearStatus();
      this.setValidating(false);

      return null;
    }
  }

  var valueLength = value.length;
  var minLength = this.minLength;
  if (minLength && valueLength < minLength) {
    this.setError(AccountsTemplates.texts.minRequiredLength + ": " + minLength);
    this.setValidating(false);

    return AccountsTemplates.texts.minRequiredLength + ": " + minLength;
  }

  var maxLength = this.maxLength;
  if (maxLength && valueLength > maxLength) {
    this.setError(AccountsTemplates.texts.maxAllowedLength + ": " + maxLength);
    this.setValidating(false);

    return AccountsTemplates.texts.maxAllowedLength + ": " + maxLength;
  }

  if (this.re && valueLength && !value.match(this.re)) {
    this.setError(this.errStr);
    this.setValidating(false);

    return this.errStr;
  }

  if (this.func) {
    var result = this.func(value);
    var err = result === true ? this.errStr || true : result;

    if (_.isUndefined(result)) {
      return err;
    }

    this.status.set(err);
    this.setValidating(false);

    return err;
  }

  this.setSuccess();
  this.setValidating(false);

  return false;
};
