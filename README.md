# Wekan - Open Source kanban

[![Contributors](https://img.shields.io/github/contributors/wekan/wekan.svg "Contributors")](https://github.com/wekan/wekan/graphs/contributors)
[![Docker Repository on Quay](https://quay.io/repository/wekan/wekan/status "Docker Repository on Quay")](https://quay.io/repository/wekan/wekan)
[![Docker Hub container status](https://img.shields.io/docker/build/wekanteam/wekan.svg "Docker Hub container status")](https://hub.docker.com/r/wekanteam/wekan)
[![Docker Hub pulls](https://img.shields.io/docker/pulls/wekanteam/wekan.svg "Docker Hub Pulls")](https://hub.docker.com/r/wekanteam/wekan)
[![Wekan Build Status][travis_badge]][travis_status]
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/02137ecec4e34c5aa303f57637196a93 "Codacy Badge")](https://www.codacy.com/app/xet7/wekan?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=wekan/wekan&amp;utm_campaign=Badge_Grade)
[![Code Climate](https://codeclimate.com/github/wekan/wekan/badges/gpa.svg "Code Climate")](https://codeclimate.com/github/wekan/wekan)
[![Project Dependencies](https://david-dm.org/wekan/wekan.svg "Project Dependencies")](https://david-dm.org/wekan/wekan)
[![Code analysis at Open Hub](https://img.shields.io/badge/code%20analysis-at%20Open%20Hub-brightgreen.svg "Code analysis at Open Hub")](https://www.openhub.net/p/wekan)

## [Translate Wekan at Transifex](https://transifex.com/wekan/wekan)

Translations to non-English languages are accepted only at [Transifex](https://transifex.com/wekan/wekan) using webbrowser.
New English strings of new features can be added as PRs to edge branch file wekan/i18n/en.i18n.json .

## [Wekan feature requests and bugs](https://github.com/wekan/wekan/issues)

Please add most of your questions as GitHub issue: [Wekan feature requests and bugs](https://github.com/wekan/wekan/issues).
It's better than at chat where details get lost when chat scrolls up.

## Chat

[![Wekan Vanila Chat][vanila_badge]][vanila_chat] - Most Wekan community and developers are here at #wekan chat channel.
Use webbrowser to register, and after that you can also alternatively use mobile app Rocket.Chat by Rocket.Chat with
address https://chat.vanila.io and same username and password.

[IRC FAQ - ANSWERS TO IRC QUESTIONS, READ BEFORE ASKING ANYTHING AT IRC](https://github.com/wekan/wekan/wiki/IRC-FAQ)
[![IRC #wekan](https://img.shields.io/badge/IRC%20%23wekan-on%20Freenode-brightgreen.svg "Freenode IRC")](http://webchat.freenode.net?channels=%23wekan&uio=d4)

## FAQ

**NOTE**: 
- Please read the [FAQ](https://github.com/wekan/wekan/wiki/FAQ) first
- Please don't feed the trolls and spammers that are mentioned in the FAQ :)

## About Wekan

Wekan is an completely [Open Source][open_source] and [Free software][free_software]
collaborative kanban board application with MIT license.

Whether you’re maintaining a personal todo list, planning your holidays with some friends, or working in a team on your next revolutionary idea, Kanban boards are an unbeatable tool to keep your things organized. They give you a visual overview of the current state of your project, and make you productive by allowing you to focus on the few items that matter the most.

Since Wekan is a free software, you don’t have to trust us with your data and can
install Wekan on your own computer or server. In fact we encourage you to do
that by providing one-click installation on various platforms.

- [Features][features]: Wekan has real-time user interface. Not all features are implemented, yet.
- [Platforms][platforms]: Wekan supports many platforms and plan is to add more. This will be the first place to look if you want to **install** it, test out and learn more in depth.
- [Integrations][integrations]: Current possible integrations and future plans.
- [Team](https://github.com/wekan/wekan/wiki/Team): The people who spends their time and make Wekan into what it is right now.

## Roadmap

[Roadmap](https://github.com/wekan/wekan/wiki/Roadmap)

Upcoming Wekan App Development Platform will make possible many use cases. If you don't find your feature or integration in
GitHub issues and [Features][features] or [Integrations][integrations] page at wiki, please add them.

We are very welcoming to new developers and teams to submit new pull requests to devel branch to make this Wekan App Development Platform possible faster. Please see [Developer Documentation][dev_docs] to get started.

We also welcome sponsors for features and bugfixes. By working directly with Wekan you get the benefit of active maintenance and new features added by growing Wekan developer community.

Actual work happens at [Wekan GitHub issues][wekan_issues].

See [Development links on Wekan wiki](https://github.com/wekan/wekan/wiki#Development) bottom of the page for more info.

If you want to know what is going on exactly this moment, you can check out the [project page](https://github.com/wekan/wekan/projects/2).

## Demo

[Wekan demo][roadmap_wefork]

## Screenshot

[More screenshots at Features page](https://github.com/wekan/wekan/wiki/Features)

[![Screenshot of Wekan][screenshot_wefork]][roadmap_wefork]

## Stable

- master+devel branch. At release, devel is merged to master.
- Receives fixes and features that have been tested at edge that they work.
- If you want automatic updates, [use Snap](https://github.com/wekan/wekan-snap/wiki/Install).
- If you want to test before update, [use Docker quay.io release tags](https://github.com/wekan/wekan/wiki/Docker).

## Edge

- edge branch. All new fixes and features are added to here first. [Testing Edge](https://github.com/wekan/wekan-snap/wiki/Snap-Developer-Docs).

## License

Wekan is released under the very permissive [MIT license](LICENSE), and made
with [Meteor](https://www.meteor.com).

[platforms]: https://github.com/wekan/wekan/wiki/Platforms
[dev_docs]: https://github.com/wekan/wekan/wiki/Developer-Documentation
[screenshot_wekan]: http://i.imgur.com/cI4jW2h.png
[screenshot_wefork]: https://wekan.github.io/wekan-markdown.png
[features]: https://github.com/wekan/wekan/wiki/Features
[integrations]: https://github.com/wekan/wekan/wiki/Integrations
[roadmap_wekan]: http://try.wekan.io/b/MeSsFJaSqeuo9M6bs/wekan-roadmap
[roadmap_wefork]: https://wekan.indie.host/b/t2YaGmyXgNkppcFBq/wekan-fork-roadmap
[wekan_issues]: https://github.com/wekan/wekan/issues
[wefork_issues]: https://github.com/wefork/wekan/issues
[docker_image]: https://hub.docker.com/r/wekanteam/wekan/
[travis_badge]: https://travis-ci.org/wekan/wekan.svg?branch=devel
[travis_status]: https://travis-ci.org/wekan/wekan
[wekan_wiki]: https://github.com/wekan/wekan/wiki
[translate_wekan]: https://www.transifex.com/wekan/wekan/
[open_source]: https://en.wikipedia.org/wiki/Open-source_software
[free_software]: https://en.wikipedia.org/wiki/Free_software
[vanila_badge]: https://vanila.io/img/join-chat-button2.png
[vanila_chat]: https://chat.vanila.io/channel/wekan
