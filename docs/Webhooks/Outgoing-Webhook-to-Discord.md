- [RocketChat Webhook workaround](https://github.com/wekan/univention/issues/15)

Note: Webhook to Slack and Rocket.Chat does not require adding anything to URL. Discord requires adding `/slack` to end of URL so that it works.

<img src="https://wekan.github.io/outgoing-webhook-discord.gif" alt="Outgoing Webhook to Discord" />

1. Add Webhook to Discord

2. On Wekan board, click 3 lines "hamburger" menu / Outgoing Webhooks.

3. Add /slack to end of your Discord Webhook URL and Save URL, like this: 

```
https://discordapp.com/api/webhooks/12345/abcde/slack
```

Wekan Outgoing Webhook URLs are in Slack/Rocket.Chat/Discord format.

Note: Not all Wekan activities create Outgoing Webhook events. Missing activities [have been added](https://github.com/wekan/wekan/issues?utf8=%E2%9C%93&q=is%3Aissue+is%3Aopen+webhook) to [Wekan Roadmap](https://github.com/wekan/wekan/projects/2). If you find some activity that does not yet have GitHub issue about it, please add new GitHub issue.

Wekan uses this type of JSON when sending to Outgoing Webhook:
https://github.com/wekan/wekan/wiki/Webhook-data

Discord supports incoming webhooks in different formats, like GitHub, Slack, etc. The incoming format needs to be specified by adding webhook format to end of URL.
https://discordapp.com/developers/docs/resources/webhook#execute-slackcompatible-webhook

Wekan generated webhooks are Slack compatible. Discord does not know anything about Wekan, Rocket.Chat, and other apps that produce Slack compatible Outgoing Webhook format. But using any other format like GitHub etc does not work, because Wekan Outgoing Webhooks are not in that format.

When making Wekan Outgoing Webhook to Rocket.Chat and Slack, there is no need to add anything to Webhook URL when those that is added to Wekan board. Discord in this case has decided to implement multiple Incoming Webhook formats and require specifying format in URL.

## Riot

Wekan boards have Outgoing Webhooks for board change messages, those can be bridged to Riot:
https://github.com/vector-im/riot-web/issues/4978

If you have some Riot bot, you can make it call Wekan REST API to make changes to Wekan.
First [login to API as form data, with admin username and password](REST-API#example-call---as-form-data). Then use that Bearer token [to edit Wekan](https://wekan.github.io/api/).