# Wekan

[![Join the chat][gitter_badge]][gitter_chat]

2017-01-31 News: Wekan fork/Wefork is being merged back to official Wekan.

[Wefork announcement and merging back][fork_announcement]

[![Wefork chat][rocket_badge]][rocket_chat]

[![Wefork Build Status][travis_badge]][travis_status]

[Wefork FAQ][fork_faq]

[Newer Wefork translations at Transifex][translate_wefork]

[Wekan at Transifex][translate_wekan]

Wekan is an open-source and collaborative kanban board application.

Whether you’re maintaining a personal todo list, planning your holidays with
some friends, or working in a team on your next revolutionary idea, Kanban
boards are an unbeatable tool to keep your things organized. They give you a
visual overview of the current state of your project, and make you productive by
allowing you to focus on the few items that matter the most.

## Roadmap

Roadmap is handled using [Wekan GitHub issues][wekan_issues].

Newer [Wefork GitHub issues][wefork_issues] will be be moved to there also.

## Screenshots

[![Screenshot of Wekan][screenshot_wekan]][roadmap_wekan]

[![Screenshot of Wefork][screenshot_wefork]][roadmap_wefork]

Wekan supports most features you would expect of it including a real-time user
interface, cards comments, member assignations, customizable labels, filtered
views, and more.

Since it is a free software, you don’t have to trust us with your data and can
install Wekan on your own computer or server. In fact we encourage you to do
that by providing one-click installation on various platforms.

## Supported Platforms

[Install from source][install_source]

[VirtualBox][virtualbox]

Docker: [Docker image][docker_image] (needs updating), [Docs][docker_docs], [Docker Nginx proxy][docker_nginxproxy], [Docker Issue][docker_issue]

[Debian Wheezy 64bit][debian_wheezy]

[![Deploy][heroku_button]][heroku_deploy]
[![SignUp][indiehosters_button]][indiehosters_saas]
[![Deploy to Scalingo][scalingo_button]][scalingo_deploy]
[![Install on Cloudron][cloudron_button]][cloudron_install]
[![Try on Sandstorm][sandstorm_button]][sandstorm_appdemo]

## Upcoming Platforms

[Docker on SUSE Linux Enterprise Server 12 SP1][sles]

[Autoinstall script][autoinstall] based on [this issue][autoinstall_issue]

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

Wekan is released under the very permissive [MIT license](LICENSE), and made
with [Meteor](https://www.meteor.com).

[gitter_badge]: https://badges.gitter.im/Join%20Chat.svg
[gitter_chat]: https://gitter.im/wekan/wekan
[fork_faq]: https://github.com/wefork/wekan/wiki/FAQ
[fork_announcement]: https://github.com/wekan/wekan/issues/640#issuecomment-276383458
[screenshot_wekan]: http://i.imgur.com/cI4jW2h.png
[screenshot_wefork]: http://i.imgur.com/ShX2OTk.png
[roadmap_wekan]: http://try.wekan.io/b/MeSsFJaSqeuo9M6bs/wekan-roadmap
[roadmap_wefork]: https://wekan.indie.host/b/t2YaGmyXgNkppcFBq/wekan-fork-roadmap
[rocket_badge]: https://chat.indie.host/images/join-chat.svg
[rocket_chat]: https://chat.indie.host/channel/wekan
[wekan_issues]: https://github.com/wekan/wekan/issues
[wefork_issues]: https://github.com/wefork/wekan/issues
[sandstorm_button]: https://img.shields.io/badge/try-Wekan%20on%20Sandstorm-783189.svg
[sandstorm_appdemo]: https://demo.sandstorm.io/appdemo/m86q05rdvj14yvn78ghaxynqz7u2svw6rnttptxx49g1785cdv1h
[docker_image]: https://hub.docker.com/r/mquandalle/wekan/
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
[docker_image]: https://hub.docker.com/r/mquandalle/wekan/
[docker_docs]: https://github.com/wefork/wekan/wiki/Docker
[docker_nginxproxy]: https://github.com/wefork/wekan/wiki/Docker-NginxProxy
[docker_issue]: https://github.com/wefork/wekan/issues/33
[translate_wekan]: https://www.transifex.com/wekan/wekan/
[translate_wefork]: https://www.transifex.com/wefork/wefork/
[autoinstall]: https://github.com/wefork/wekan-autoinstall
[autoinstall_issue]: https://github.com/anselal/wekan/issues/18
