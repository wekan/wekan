# Wekan

[![Wekan Build Status][travis_badge]][travis_status]

[![Wekan chat][vanila_badge]][vanila_chat]

[Translate Wekan at Transifex][translate_wekan]

Please read [FAQ](https://github.com/wekan/wekan/wiki/FAQ).
Please don't feed the trolls and spammers that are mentioned in the FAQ :)

Wekan is an completely [Open Source][open_source] and [Free software][free_software]
collaborative kanban board application with MIT license.

Whether you’re maintaining a personal todo list, planning your holidays with
some friends, or working in a team on your next revolutionary idea, Kanban
boards are an unbeatable tool to keep your things organized. They give you a
visual overview of the current state of your project, and make you productive by
allowing you to focus on the few items that matter the most.

Wekan has real-time user interface. Not all features are implemented.

[Features][features]

[Integrations][integrations]

[Team](https://github.com/wekan/wekan/wiki/Team)

Wekan supports many [Platforms][platforms], and plan is to add more.

You don’t have to trust us with your data and can install Wekan on your own
computer or server. In fact we encourage you to do that by providing
one-click installation on various platforms.

## Roadmap

Upcoming Wekan App Development Platform will make possible
many use cases. If you don't find your feature or integration in
GitHub issues and [Features][features] or [Integrations][integrations]
page at wiki, please add them.

We are very welcoming to new developers and teams to submit new pull
requests to devel branch to make this Wekan App Development Platform possible
faster. Please see [Developer Documentation][dev_docs] to get started.
We also welcome sponsors for features, although we don't have any yet.
By working directly with Wekan you get the benefit of active maintenance
and new features added by growing Wekan developer community.

[Roadmap is self-hosted on Wekan][roadmap_wefork]

Roadmaps is not currently up-to-date. You can find more up-to-date
info from [Features][features] and [Integrations][integrations] pages,
where is links to [Wekan GitHub issues][wekan_issues] where actual
work happens.

## Screenshot

[![Screenshot of Wekan][screenshot_wefork]][roadmap_wefork]

Content is being copied from [old Wekan roadmap][roadmap_wekan] to
new one in process of merging Wefork back to Wekan.

Since Wekan is a free software, you don’t have to trust us with your data and can
install Wekan on your own computer or server. In fact we encourage you to do
that by providing one-click installation on various platforms.

## Cleanup and stats

[Wekan database cleanup script][wekan_cleanup]

[Docker cleanup](https://github.com/wekan/wekan/issues/985)

[Daily export of Wekan changes as JSON to Logstash and
ElasticSearch / Kibana (ELK)][wekan_logstash]

[Wekan stats][wekan_stats]

## Supported Platforms

Automatic generated newest builds are available for Docker, and platforms that
install directly from this repo. Automatic builds will be added later for more
platforms.

First registered Wekan user will get [Admin Panel][features] on new 
Docker and source based installs. You can also                            
[enable Admin Panel manually][enable_adminpanel].

[Docker](https://github.com/wekan/wekan/wiki/Docker)

[![Deploy][heroku_button]][heroku_deploy]
[![SignUp][indiehosters_button]][indiehosters_saas]
[![Deploy to Scalingo][scalingo_button]][scalingo_deploy]
[![Install on Cloudron][cloudron_button]][cloudron_install]
[![Try on Sandstorm][sandstorm_button]][sandstorm_appdemo]

[VirtualBox][virtualbox]

[Install from source][install_source]

[Install from source on Windows][installsource_windows]

[Debian Wheezy 64bit][debian_wheezy]

[More Platforms, and Upcoming Platforms](https://github.com/wekan/wekan/wiki/Platforms)

## License

Wekan is released under the very permissive [MIT license](LICENSE), and made
with [Meteor](https://www.meteor.com).

[vanila_badge]: https://vanila.io/img/join-chat-button2.png
[vanila_chat]: https://chat.vanila.io/channel/wekan
[screenshot_wekan]: http://i.imgur.com/cI4jW2h.png
[screenshot_wefork]: http://i.imgur.com/lzvpeS9.png
[features]: https://github.com/wekan/wekan/wiki/Features
[integrations]: https://github.com/wekan/wekan/wiki/Integrations
[roadmap_wekan]: http://try.wekan.io/b/MeSsFJaSqeuo9M6bs/wekan-roadmap
[roadmap_wefork]: https://wekan.indie.host/b/t2YaGmyXgNkppcFBq/wekan-fork-roadmap
[wekan_issues]: https://github.com/wekan/wekan/issues
[wefork_issues]: https://github.com/wefork/wekan/issues
[sandstorm_button]: https://img.shields.io/badge/try-Wekan%20on%20Sandstorm-783189.svg
[sandstorm_appdemo]: https://demo.sandstorm.io/appdemo/m86q05rdvj14yvn78ghaxynqz7u2svw6rnttptxx49g1785cdv1h
[docker_image]: https://hub.docker.com/r/wekanteam/wekan/
[heroku_button]: https://www.herokucdn.com/deploy/button.png
[heroku_deploy]: https://heroku.com/deploy?template=https://github.com/wekan/wekan/tree/master
[indiehosters_button]: https://indie.host/signup.png
[indiehosters_saas]: https://indiehosters.net/shop/product/wekan-20
[scalingo_button]: https://cdn.scalingo.com/deploy/button.svg
[scalingo_deploy]: https://my.scalingo.com/deploy?source=https://github.com/wekan/wekan#master
[cloudron_button]: https://cloudron.io/img/button.svg
[cloudron_install]: https://cloudron.io/button.html?app=io.wekan.cloudronapp
[debian_wheezy]: https://github.com/soohwa/sps/blob/master/example/docs/1/wekan.md
[travis_badge]: https://travis-ci.org/wekan/wekan.svg?branch=meteor-1.4
[travis_status]: https://travis-ci.org/wekan/wekan
[install_source]: https://github.com/wekan/wekan/wiki/Install-and-Update#install-manually-from-source
[installsource_windows]: https://github.com/wekan/wekan/wiki/Install-Wekan-from-source-on-Windows
[virtualbox]: https://github.com/wekan/wekan/wiki/virtual-appliance
[docker_image]: https://hub.docker.com/r/wekanteam/wekan/
[wekan_wiki]: https://github.com/wekan/wekan/wiki
[translate_wekan]: https://www.transifex.com/wekan/wekan/
[autoinstall]: https://github.com/wekan/wekan-autoinstall
[autoinstall_issue]: https://github.com/anselal/wekan/issues/18
[dev_docs]: https://github.com/wekan/wekan/wiki/Developer-Documentation
[wekan_mongodb]: https://github.com/wekan/wekan-mongodb
[wekan_postgresql]: https://github.com/wekan/wekan-postgresql
[wekan_cleanup]: https://github.com/wekan/wekan-cleanup
[wekan_logstash]: https://github.com/wekan/wekan-logstash
[wekan_stats]: https://github.com/wekan/wekan-stats
[logstash_issue]: https://github.com/wekan/wekan/issues/855
[enable_adminpanel]: https://github.com/wekan/wekan/blob/devel/CHANGELOG.md#v0111-rc2-2017-03-05-wekan-prerelease
[open_source]: https://en.wikipedia.org/wiki/Open-source_software
[free_software]: https://en.wikipedia.org/wiki/Free_software
[platforms]: https://github.com/wekan/wekan/wiki/Platforms
