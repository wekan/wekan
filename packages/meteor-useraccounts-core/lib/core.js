// ---------------------------------------------------------------------------------
// Patterns for methods" parameters
// ---------------------------------------------------------------------------------

STATE_PAT = {
  changePwd: Match.Optional(String),
  enrollAccount: Match.Optional(String),
  forgotPwd: Match.Optional(String),
  resetPwd: Match.Optional(String),
  signIn: Match.Optional(String),
  signUp: Match.Optional(String),
  verifyEmail: Match.Optional(String),
  resendVerificationEmail: Match.Optional(String),
};

ERRORS_PAT = {
  accountsCreationDisabled: Match.Optional(String),
  cannotRemoveService: Match.Optional(String),
  captchaVerification: Match.Optional(String),
  loginForbidden: Match.Optional(String),
  mustBeLoggedIn: Match.Optional(String),
  pwdMismatch: Match.Optional(String),
  validationErrors: Match.Optional(String),
  verifyEmailFirst: Match.Optional(String),
};

INFO_PAT = {
  emailSent: Match.Optional(String),
  emailVerified: Match.Optional(String),
  pwdChanged: Match.Optional(String),
  pwdReset: Match.Optional(String),
  pwdSet: Match.Optional(String),
  signUpVerifyEmail: Match.Optional(String),
  verificationEmailSent: Match.Optional(String),
};

INPUT_ICONS_PAT = {
  hasError: Match.Optional(String),
  hasSuccess: Match.Optional(String),
  isValidating: Match.Optional(String),
};

ObjWithStringValues = Match.Where(function (x) {
  check(x, Object);
  _.each(_.values(x), function(value) {
      check(value, String);
  });
  return true;
});

TEXTS_PAT = {
  button: Match.Optional(STATE_PAT),
  errors: Match.Optional(ERRORS_PAT),
  info: Match.Optional(INFO_PAT),
  inputIcons: Match.Optional(INPUT_ICONS_PAT),
  maxAllowedLength: Match.Optional(String),
  minRequiredLength: Match.Optional(String),
  navSignIn: Match.Optional(String),
  navSignOut: Match.Optional(String),
  optionalField: Match.Optional(String),
  pwdLink_link: Match.Optional(String),
  pwdLink_pre: Match.Optional(String),
  pwdLink_suff: Match.Optional(String),
  requiredField: Match.Optional(String),
  resendVerificationEmailLink_pre: Match.Optional(String),
  resendVerificationEmailLink_link: Match.Optional(String),
  resendVerificationEmailLink_suff: Match.Optional(String),
  sep: Match.Optional(String),
  signInLink_link: Match.Optional(String),
  signInLink_pre: Match.Optional(String),
  signInLink_suff: Match.Optional(String),
  signUpLink_link: Match.Optional(String),
  signUpLink_pre: Match.Optional(String),
  signUpLink_suff: Match.Optional(String),
  socialAdd: Match.Optional(String),
  socialConfigure: Match.Optional(String),
  socialIcons: Match.Optional(ObjWithStringValues),
  socialRemove: Match.Optional(String),
  socialSignIn: Match.Optional(String),
  socialSignUp: Match.Optional(String),
  socialWith: Match.Optional(String),
  termsAnd: Match.Optional(String),
  termsPreamble: Match.Optional(String),
  termsPrivacy: Match.Optional(String),
  termsTerms: Match.Optional(String),
  title: Match.Optional(STATE_PAT),
};

// Configuration pattern to be checked with check
CONFIG_PAT = {
  // Behaviour
  confirmPassword: Match.Optional(Boolean),
  defaultState: Match.Optional(String),
  enablePasswordChange: Match.Optional(Boolean),
  enforceEmailVerification: Match.Optional(Boolean),
  focusFirstInput: Match.Optional(Boolean),
  forbidClientAccountCreation: Match.Optional(Boolean),
  lowercaseUsername: Match.Optional(Boolean),
  overrideLoginErrors: Match.Optional(Boolean),
  sendVerificationEmail: Match.Optional(Boolean),
  socialLoginStyle: Match.Optional(Match.OneOf("popup", "redirect")),

  // Appearance
  defaultLayout: Match.Optional(String),
  hideSignInLink: Match.Optional(Boolean),
  hideSignUpLink: Match.Optional(Boolean),
  showAddRemoveServices: Match.Optional(Boolean),
  showForgotPasswordLink: Match.Optional(Boolean),
  showResendVerificationEmailLink: Match.Optional(Boolean),
  showLabels: Match.Optional(Boolean),
  showPlaceholders: Match.Optional(Boolean),

  // Client-side Validation
  continuousValidation: Match.Optional(Boolean),
  negativeFeedback: Match.Optional(Boolean),
  negativeValidation: Match.Optional(Boolean),
  positiveFeedback: Match.Optional(Boolean),
  positiveValidation: Match.Optional(Boolean),
  showValidating: Match.Optional(Boolean),

  // Privacy Policy and Terms of Use
  privacyUrl: Match.Optional(String),
  termsUrl: Match.Optional(String),

  // Redirects
  homeRoutePath: Match.Optional(String),
  redirectTimeout: Match.Optional(Number),

  // Hooks
  onLogoutHook: Match.Optional(Function),
  onSubmitHook: Match.Optional(Function),
  preSignUpHook: Match.Optional(Function),
  postSignUpHook: Match.Optional(Function),

  texts: Match.Optional(TEXTS_PAT),

  //reCaptcha config
  reCaptcha: Match.Optional({
    data_type: Match.Optional(Match.OneOf("audio", "image")),
    secretKey: Match.Optional(String),
    siteKey: Match.Optional(String),
    theme: Match.Optional(Match.OneOf("dark", "light")),
  }),

  showReCaptcha: Match.Optional(Boolean),
};


FIELD_SUB_PAT = {
  "default": Match.Optional(String),
  changePwd: Match.Optional(String),
  enrollAccount: Match.Optional(String),
  forgotPwd: Match.Optional(String),
  resetPwd: Match.Optional(String),
  signIn: Match.Optional(String),
  signUp: Match.Optional(String),
};


// Field pattern
FIELD_PAT = {
  _id: String,
  type: String,
  required: Match.Optional(Boolean),
  displayName: Match.Optional(Match.OneOf(String, Match.Where(_.isFunction), FIELD_SUB_PAT)),
  placeholder: Match.Optional(Match.OneOf(String, FIELD_SUB_PAT)),
  select: Match.Optional([{text: String, value: Match.Any}]),
  minLength: Match.Optional(Match.Integer),
  maxLength: Match.Optional(Match.Integer),
  re: Match.Optional(RegExp),
  func: Match.Optional(Match.Where(_.isFunction)),
  errStr: Match.Optional(String),

  // Client-side Validation
  continuousValidation: Match.Optional(Boolean),
  negativeFeedback: Match.Optional(Boolean),
  negativeValidation: Match.Optional(Boolean),
  positiveValidation: Match.Optional(Boolean),
  positiveFeedback: Match.Optional(Boolean),

  // Transforms
  trim: Match.Optional(Boolean),
  lowercase: Match.Optional(Boolean),
  uppercase: Match.Optional(Boolean),
  transform: Match.Optional(Match.Where(_.isFunction)),

  // Custom options
  options: Match.Optional(Object),
  template: Match.Optional(String),
};

// -----------------------------------------------------------------------------
// AccountsTemplates object
// -----------------------------------------------------------------------------

// -------------------
// Client/Server stuff
// -------------------

// Constructor
AT = function() {

};

AT.prototype.CONFIG_PAT = CONFIG_PAT;

/*
  Each field object is represented by the following properties:
    _id:         String   (required)  // A unique field"s id / name
    type:        String   (required)  // Displayed input type
    required:    Boolean  (optional)  // Specifies Whether to fail or not when field is left empty
    displayName: String   (optional)  // The field"s name to be displayed as a label above the input element
    placeholder: String   (optional)  // The placeholder text to be displayed inside the input element
    minLength:   Integer  (optional)  // Possibly specifies the minimum allowed length
    maxLength:   Integer  (optional)  // Possibly specifies the maximum allowed length
    re:          RegExp   (optional)  // Regular expression for validation
    func:        Function (optional)  // Custom function for validation
    errStr:      String   (optional)  // Error message to be displayed in case re validation fails
*/


// Allowed input types
AT.prototype.INPUT_TYPES = [
  "checkbox",
  "email",
  "hidden",
  "password",
  "radio",
  "select",
  "tel",
  "text",
  "url",
];

// Current configuration values
AT.prototype.options = {
  // Appearance
  //defaultLayout: undefined,
  showAddRemoveServices: false,
  showForgotPasswordLink: false,
  showResendVerificationEmailLink: false,
  showLabels: true,
  showPlaceholders: true,

  // Behaviour
  confirmPassword: true,
  defaultState: "signIn",
  enablePasswordChange: false,
  focusFirstInput: !Meteor.isCordova,
  forbidClientAccountCreation: false,
  lowercaseUsername: false,
  overrideLoginErrors: true,
  sendVerificationEmail: false,
  socialLoginStyle: "popup",

  // Client-side Validation
  //continuousValidation: false,
  //negativeFeedback: false,
  //negativeValidation: false,
  //positiveValidation: false,
  //positiveFeedback: false,
  //showValidating: false,

  // Privacy Policy and Terms of Use
  privacyUrl: undefined,
  termsUrl: undefined,

  // Hooks
  onSubmitHook: undefined,
};

AT.prototype.texts = {
  button: {
    changePwd: "updateYourPassword",
    //enrollAccount: "createAccount",
    enrollAccount: "signUp",
    forgotPwd: "emailResetLink",
    resetPwd: "setPassword",
    signIn: "signIn",
    signUp: "signUp",
    resendVerificationEmail: "Send email again",
  },
  errors: {
    accountsCreationDisabled: "Client side accounts creation is disabled!!!",
    cannotRemoveService: "Cannot remove the only active service!",
    captchaVerification: "Captcha verification failed!",
    loginForbidden: "error.accounts.Login forbidden",
    mustBeLoggedIn: "error.accounts.Must be logged in",
    pwdMismatch: "error.pwdsDontMatch",
    validationErrors: "Validation Errors",
    verifyEmailFirst: "Please verify your email first. Check the email and follow the link!",
  },
  navSignIn: 'signIn',
  navSignOut: 'signOut',
  info: {
    emailSent: "info.emailSent",
    emailVerified: "info.emailVerified",
    pwdChanged: "info.passwordChanged",
    pwdReset: "info.passwordReset",
    pwdSet: "Password Set",
    signUpVerifyEmail: "Successful Registration! Please check your email and follow the instructions.",
    verificationEmailSent: "A new email has been sent to you. If the email doesn't show up in your inbox, be sure to check your spam folder.",
  },
  inputIcons: {
    isValidating: "fa fa-spinner fa-spin",
    hasSuccess: "fa fa-check",
    hasError: "fa fa-times",
  },
  maxAllowedLength: "Maximum allowed length",
  minRequiredLength: "Minimum required length",
  optionalField: "optional",
  pwdLink_pre: "",
  pwdLink_link: "forgotPassword",
  pwdLink_suff: "",
  requiredField: "Required Field",
  resendVerificationEmailLink_pre: "Verification email lost?",
  resendVerificationEmailLink_link: "Send again",
  resendVerificationEmailLink_suff: "",
  sep: "OR",
  signInLink_pre: "ifYouAlreadyHaveAnAccount",
  signInLink_link: "signin",
  signInLink_suff: "",
  signUpLink_pre: "dontHaveAnAccount",
  signUpLink_link: "signUp",
  signUpLink_suff: "",
  socialAdd: "add",
  socialConfigure: "configure",
  socialIcons: {
      "meteor-developer": "fa fa-rocket"
  },
  socialRemove: "remove",
  socialSignIn: "signIn",
  socialSignUp: "signUp",
  socialWith: "with",
  termsPreamble: "clickAgree",
  termsPrivacy: "privacyPolicy",
  termsAnd: "and",
  termsTerms: "terms",
  title: {
    changePwd: "changePassword",
    enrollAccount: "createAccount",
    forgotPwd: "resetYourPassword",
    resetPwd: "resetYourPassword",
    signIn: "signIn",
    signUp: "createAccount",
    verifyEmail: "",
    resendVerificationEmail: "Send the verification email again",
  },
};

AT.prototype.SPECIAL_FIELDS = [
  "password_again",
  "username_and_email",
];

// SignIn / SignUp fields
AT.prototype._fields = [
  new Field({
    _id: "email",
    type: "email",
    required: true,
    lowercase: true,
    trim: true,
    func: function(email) {
        return !_.contains(email, '@');
    },
    errStr: 'Invalid email',
  }),
  new Field({
    _id: "password",
    type: "password",
    required: true,
    minLength: 6,
    displayName: {
        "default": "password",
        changePwd: "newPassword",
        resetPwd: "newPassword",
    },
    placeholder: {
        "default": "password",
        changePwd: "newPassword",
        resetPwd: "newPassword",
    },
  }),
];


AT.prototype._initialized = false;

// Input type validation
AT.prototype._isValidInputType = function(value) {
    return _.indexOf(this.INPUT_TYPES, value) !== -1;
};

AT.prototype.addField = function(field) {
    // Fields can be added only before initialization
    if (this._initialized) {
      throw new Error("AccountsTemplates.addField should strictly be called before AccountsTemplates.init!");
    }

    field = _.pick(field, _.keys(FIELD_PAT));
    check(field, FIELD_PAT);
    // Checks there"s currently no field called field._id
    if (_.indexOf(_.pluck(this._fields, "_id"), field._id) !== -1) {
      throw new Error("A field called " + field._id + " already exists!");
    }
    // Validates field.type
    if (!this._isValidInputType(field.type)) {
      throw new Error("field.type is not valid!");
    }
    // Checks field.minLength is strictly positive
    if (typeof field.minLength !== "undefined" && field.minLength <= 0) {
      throw new Error("field.minLength should be greater than zero!");
    }
    // Checks field.maxLength is strictly positive
    if (typeof field.maxLength !== "undefined" && field.maxLength <= 0) {
      throw new Error("field.maxLength should be greater than zero!");
    }
    // Checks field.maxLength is greater than field.minLength
    if (typeof field.minLength !== "undefined" && typeof field.minLength !== "undefined" && field.maxLength < field.minLength) {
      throw new Error("field.maxLength should be greater than field.maxLength!");
    }

    if (!(Meteor.isServer && _.contains(this.SPECIAL_FIELDS, field._id))) {
      this._fields.push(new Field(field));
    }

    return this._fields;
};

AT.prototype.addFields = function(fields) {
  var ok;

  try { // don"t bother with `typeof` - just access `length` and `catch`
    ok = fields.length > 0 && "0" in Object(fields);
  } catch (e) {
    throw new Error("field argument should be an array of valid field objects!");
  }
  if (ok) {
    _.map(fields, function(field) {
      this.addField(field);
    }, this);
  } else {
    throw new Error("field argument should be an array of valid field objects!");
  }

  return this._fields;
};

AT.prototype.configure = function(config) {
  // Configuration options can be set only before initialization
  if (this._initialized) {
    throw new Error("Configuration options must be set before AccountsTemplates.init!");
  }

  // Updates the current configuration
  check(config, CONFIG_PAT);
  var options = _.omit(config, "texts", "reCaptcha");
  this.options = _.defaults(options, this.options);

  // Possibly sets up reCaptcha options
  var reCaptcha = config.reCaptcha;
  if (reCaptcha) {
    // Updates the current button object
    this.options.reCaptcha = _.defaults(reCaptcha, this.options.reCaptcha || {});
  }

  // Possibly sets up texts...
  if (config.texts) {
    var texts = config.texts;
    var simpleTexts = _.omit(texts, "button", "errors", "info", "inputIcons", "socialIcons", "title");

    this.texts = _.defaults(simpleTexts, this.texts);

    if (texts.button) {
      // Updates the current button object
      this.texts.button = _.defaults(texts.button, this.texts.button);
    }

    if (texts.errors) {
      // Updates the current errors object
      this.texts.errors = _.defaults(texts.errors, this.texts.errors);
    }

    if (texts.info) {
      // Updates the current info object
      this.texts.info = _.defaults(texts.info, this.texts.info);
    }

    if (texts.inputIcons) {
      // Updates the current inputIcons object
      this.texts.inputIcons = _.defaults(texts.inputIcons, this.texts.inputIcons);
    }

    if (texts.socialIcons) {
      // Updates the current socialIcons object
      this.texts.socialIcons = _.defaults(texts.socialIcons, this.texts.socialIcons);
    }

    if (texts.title) {
      // Updates the current title object
      this.texts.title = _.defaults(texts.title, this.texts.title);
    }
  }
};


AT.prototype.configureRoute = function(route, options) {
  console.warn('You now need a routing package like useraccounts:iron-routing or useraccounts:flow-routing to be able to configure routes!');
};


AT.prototype.hasField = function(fieldId) {
  return !!this.getField(fieldId);
};

AT.prototype.getField = function(fieldId) {
  var field = _.filter(this._fields, function(field) {
    return field._id === fieldId;
  });

  return (field.length === 1) ? field[0] : undefined;
};

AT.prototype.getFields = function() {
    return this._fields;
};

AT.prototype.getFieldIds = function() {
    return _.pluck(this._fields, "_id");
};

AT.prototype.getRoutePath = function(route) {
    return "#";
};

AT.prototype.oauthServices = function() {
  // Extracts names of available services
  var names;

  if (Meteor.isServer) {
    names = (Accounts.oauth && Accounts.oauth.serviceNames()) || [];
  } else {
    names = (Accounts.oauth && Accounts.loginServicesConfigured() && Accounts.oauth.serviceNames()) || [];
  }
  // Extracts names of configured services
  var configuredServices = [];

  if (Accounts.loginServiceConfiguration) {
    configuredServices = _.pluck(Accounts.loginServiceConfiguration.find().fetch(), "service");
  }

  // Builds a list of objects containing service name as _id and its configuration status
  var services = _.map(names, function(name) {
    return {
      _id : name,
      configured: _.contains(configuredServices, name),
    };
  });

  // Checks whether there is a UI to configure services...
  // XXX: this only works with the accounts-ui package
  var showUnconfigured = typeof Accounts._loginButtonsSession !== "undefined";

  // Filters out unconfigured services in case they"re not to be displayed
  if (!showUnconfigured) {
    services = _.filter(services, function(service) {
      return service.configured;
    });
  }

  // Sorts services by name
  services = _.sortBy(services, function(service) {
    return service._id;
  });

  return services;
};

AT.prototype.removeField = function(fieldId) {
  // Fields can be removed only before initialization
  if (this._initialized) {
    throw new Error("AccountsTemplates.removeField should strictly be called before AccountsTemplates.init!");
  }
  // Tries to look up the field with given _id
  var index = _.indexOf(_.pluck(this._fields, "_id"), fieldId);

  if (index !== -1) {
    return this._fields.splice(index, 1)[0];
  } else if (!(Meteor.isServer && _.contains(this.SPECIAL_FIELDS, fieldId))) {
    throw new Error("A field called " + fieldId + " does not exist!");
  }
};
