Meteor.startup(() => {

  if ( process.env.HEADER_LOGIN_ID ) {
    Meteor.settings.public.headerLoginId = process.env.HEADER_LOGIN_ID;
    Meteor.settings.public.headerLoginEmail = process.env.HEADER_LOGIN_EMAIL;
    Meteor.settings.public.headerLoginFirstname = process.env.HEADER_LOGIN_FIRSTNAME;
    Meteor.settings.public.headerLoginLastname = process.env.HEADER_LOGIN_LASTNAME;
  }

});
