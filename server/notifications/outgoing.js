const postCatchError = Meteor.wrapAsync((url, options, resolve) => {
  HTTP.post(url, options, (err, res) => {
    if (err) {
      resolve(null, err.response);
    } else {
      resolve(null, res);
    }
  });
});

let webhooksAtbts = ( (process.env.WEBHOOKS_ATTRIBUTES && process.env.WEBHOOKS_ATTRIBUTES.split(',') ) || ['cardId', 'listId', 'oldListId', 'boardId', 'comment', 'user', 'card', 'commentId']);

Meteor.methods({
  outgoingWebhooks(integrations, description, params) {
    check(integrations, Array);
    check(description, String);
    check(params, Object);

    const quoteParams = _.clone(params);
    ['card', 'list', 'oldList', 'board', 'comment'].forEach((key) => {
      if (quoteParams[key]) quoteParams[key] = `"${params[key]}"`;
    });

    const userId = (params.userId) ? params.userId : integrations[0].userId;
    const user = Users.findOne(userId);
    const text = `${params.user} ${TAPi18n.__(description, quoteParams, user.getLanguage())}\n${params.url}`;

    if (text.length === 0) return;

    const value = {
      text: `${text}`,
    };

    webhooksAtbts.forEach((key) => {
      if (params[key]) value[key] = params[key];
    });
    value.description = description;

    const options = {
      headers: {
        // 'Content-Type': 'application/json',
        // 'X-Wekan-Activities-Token': 'Random.Id()',
      },
      data: value,
    };

    integrations.forEach((integration) => {
      const response = postCatchError(integration.url, options);

      if (response && response.statusCode && response.statusCode === 200) {
        return true; // eslint-disable-line consistent-return
      } else {
        throw new Meteor.Error('error-invalid-webhook-response');
      }
    });
  },
});
