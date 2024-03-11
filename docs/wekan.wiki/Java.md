This page is about using Wekan from Java code.

Wekan is made with Javascript and uses MongoDB database.

## Using Wekan REST API

With Jython, you can use Wekan REST API [like with Python](New-card-with-Python3-and-REST-API)

## Global Webhooks

For Global Webhooks in Admin Panel, Wekan sends all events in all boards to webhook URL, like add card. Although, sending some messages for some events is not yet implemented, more could be added later.

Data is sent in [this kind of JSON format](Webhook-data).

[You can receive webhook data in Java like this](https://github.com/Esri/webhooks-samples/tree/master/java/receiver).

Then for each received data, your code can read content and based on incoming data call Wekan REST API, some Java interface, etc.

Outgoing Webhooks can also go to Slack, RocketChat, NodeRED, PowerShell etc. See right menu webhook links when scrolling down wiki page https://github.com/wekan/wekan/wiki

If you call some Java interface that returns some data, you can then write that data to Wekan card with Wekan REST API.