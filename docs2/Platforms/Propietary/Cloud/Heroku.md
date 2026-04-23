[![Deploy][heroku_button]][heroku_deploy]

[Heroku deployment quide needed](https://github.com/wekan/wekan/issues/693)

[Deploy error](https://github.com/wekan/wekan/issues/638)

[Problem with Heroku](https://github.com/wekan/wekan/issues/532)

Email to work on already working Heroku: Use 3rd party email like SendGrid, update process.env.MAIL_URL ,
change from email at Accounts.emailTeamplates.from , new file in server folder called smtp.js on code
`Meteor.startup(function () });` . TODO: Test and find a way to use API keys instead.

[heroku_button]: https://www.herokucdn.com/deploy/button.png
[heroku_deploy]: https://heroku.com/deploy?template=https://github.com/wekan/wekan/tree/devel