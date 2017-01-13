# Wekan fork

[![Join the chat][rocket_badge]][rocket_chat]
[![Build Status][travis_badge]][travis_status]

[Wekan fork FAQ][fork_faq]

[Wekan fork announcement][fork_announcement]

[Translate Wekan fork at Transifex][translate_wefork]

Wekan is an open-source and collaborative kanban board application.

Whether you’re maintaining a personal todo list, planning your holidays with
some friends, or working in a team on your next revolutionary idea, Kanban
boards are an unbeatable tool to keep your things organized. They give you a
visual overview of the current state of your project, and make you productive by
allowing you to focus on the few items that matter the most.

[![Our roadmap is self-hosted on Wekan fork][screenshot]][roadmap]

Wekan supports most features you would expect of it including a real-time user
interface, cards comments, member assignations, customizable labels, filtered
views, and more.

Since it is a free software, you don’t have to trust us with your data and can
install Wekan on your own computer or server. In fact we encourage you to do
that by providing one-click installation on various platforms.

## Supported Platforms

[Install from source][install_source]

[Debian Wheezy 64bit][debian_wheezy]

[![Deploy][heroku_button]][heroku_deploy]
[![SignUp][indiehosters_button]][indiehosters_saas]
[![Deploy to Scalingo][scalingo_button]][scalingo_deploy]
[![Install on Cloudron][cloudron_button]][cloudron_install]
[![Try on Sandstorm][sandstorm_button]][sandstorm_appdemo]

## Upcoming Platforms

[Docker][docker_image]

[Docker on SUSE Linux Enterprise Server 12 SP1][sles]

[Autoinstall script][autoinstall] based on [this issue][autoinstall_issue]

[VirtualBox][virtualbox]: Needs to be updated for Wefork.

[Create Sandstorm .spk file from source][sandstorm_spk]

Email to work on already working Heroku: Use 3rd party
email like SendGrid, update process.env.MAIL_URL ,
change from email at Accounts.emailTeamplates.from ,
new file in server folder called smtp.js on code
`Meteor.startup(function () });` .
TODO: Test and find a way to use API keys instead.

Azure: Install from source. Azure endpoint needs to be added. Not tested yet.

OpenShift: Not tested yet.

Google Cloud: Needs info how to enable websockets.

## License

Wekan fork is released under the very permissive [MIT license](LICENSE), and made
with [Meteor](https://www.meteor.com).

## Roadmap

[Our roadmap is self-hosted on Wekan fork][roadmap]

[fork_faq]: https://github.com/wefork/wekan/wiki/FAQ
[fork_announcement]: https://github.com/wekan/wekan/issues/640#issuecomment-255091832
[screenshot]: http://i.imgur.com/ShX2OTk.png
[rocket_badge]: https://chat.indie.host/images/join-chat.svg
[rocket_chat]: https://chat.indie.host/channel/wekan
[roadmap]: https://wekan.indie.host/b/t2YaGmyXgNkppcFBq/wekan-fork-roadmap
[sandstorm_button]: https://img.shields.io/badge/try-Wekan%20on%20Sandstorm-783189.svg
[sandstorm_appdemo]: https://demo.sandstorm.io/appdemo/m86q05rdvj14yvn78ghaxynqz7u2svw6rnttptxx49g1785cdv1h
[docker_image]: https://hub.docker.com/r/...
[heroku_button]: https://www.herokucdn.com/deploy/button.png
[heroku_deploy]: https://heroku.com/deploy?template=https://github.com/wefork/wekan/tree/master
[indiehosters_button]: https://indie.host/signup.png
[indiehosters_saas]: https://indiehosters.net/shop/product/wekan-20
[scalingo_button]: https://cdn.scalingo.com/deploy/button.svg
[scalingo_deploy]: https://my.scalingo.com/deploy?source=https://github.com/wefork/wekan#master
[cloudron_button]: https://cloudron.io/img/button.svg
[cloudron_install]: https://cloudron.io/button.html?app=io.wekan.cloudronapp
[debian_wheezy]: https://github.com/soohwa/sps/blob/master/example/docs/1/wekan.md
[travis_badge]: https://travis-ci.org/wefork/wekan.svg?branch=devel
[travis_status]: https://travis-ci.org/wefork/wekan
[install_source]: https://github.com/wefork/wekan/wiki/Install-from-source
[sles]: https://github.com/wekan/wekan/wiki/Install-Wekan-Docker-on-SUSE-Linux-Enterprise-Server-12-SP1
[virtualbox]: https://github.com/wekan/wekan/wiki/virtual-appliance
[sandstorm_spk]: https://github.com/wefork/wekan/issues/36
[docker_image]: https://github.com/wefork/wekan/issues/33
[translate_wefork]: https://www.transifex.com/wefork/wefork/
[autoinstall]: https://github.com/wefork/wekan-autoinstall
[autoinstall_issue]: https://github.com/anselal/wekan/issues/18
