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

[Wekan IRC FAQ](https://github.com/wekan/wekan/wiki/IRC-FAQ)

## FAQ

**NOTE**: 
- Please read the [FAQ](https://github.com/wekan/wekan/wiki/FAQ) first
- Please don't feed the trolls and spammers that are mentioned in the FAQ :)

## About Wekan

Wekan is an completely [Open Source][open_source] and [Free software][free_software]
collaborative kanban board application with MIT license.

Whether you’re maintaining a personal todo list, planning your holidays with some friends,
or working in a team on your next revolutionary idea, Kanban boards are an unbeatable tool
to keep your things organized. They give you a visual overview of the current state of your project,
and make you productive by allowing you to focus on the few items that matter the most.

Since Wekan is a free software, you don’t have to trust us with your data and can
install Wekan on your own computer or server. In fact we encourage you to do
that by providing one-click installation on various platforms.

- Wekan is used in [most countries of the world](https://snapcraft.io/wekan).
- Wekan largest user has 13k users using Wekan in their company.
- Wekan has been [translated](https://transifex.com/wekan/wekan) to about 50 languages.
- [Features][features]: Wekan has real-time user interface.
- [Platforms][platforms]: Wekan supports many platforms.
  Wekan is critical part of new platforms Wekan is currently being integrated to.
- [Integrations][integrations]: Current possible integrations and future plans.

## Requirements

- 64bit: Linux / Mac / Windows.
- 1 GB RAM minimum free for Wekan. Production server should have miminum total 4 GB RAM.
  For thousands of users, for example with Docker: 3 frontend servers, each having 2 CPU and 2 wekan-app containers. One backend wekan-db server with many CPUs.  
- Enough disk space and alerts about low disk space. If you run out disk space, MongoDB database gets corrupted.
- SECURITY: Updating to newest Wekan version very often. Please check you do not have automatic updates of Sandstorm or Snap turned off.
  Old versions have security issues because of old versions Node.js etc. Only newest Wekan is supported.
  Wekan on Sandstorm is not usually affected by any Standalone Wekan (Snap/Docker/Source) security issues.
- [Reporting all new bugs immediately](https://github.com/wekan/wekan/issues).
  New features and fixes are added to Wekan [many times a day](https://github.com/wekan/wekan/blob/devel/CHANGELOG.md).
- [Backups](https://github.com/wekan/wekan/wiki/Backup) of Wekan database once a day miminum.
  Bugs, updates, users deleting list or card, harddrive full, harddrive crash etc can eat your data. There is no undo yet.
  Some bug can cause Wekan board to not load at all, requiring manual fixing of database content.

## Roadmap

[Roadmap Milestones](https://github.com/wekan/wekan/milestones)

[Developer Documentation][dev_docs]

- There is many companies and individuals contributing code to Wekan, to add features and bugfixes
  [many times a day](https://github.com/wekan/wekan/blob/devel/CHANGELOG.md).
- [Please add Add new Feature Requests and Bug Reports immediately](https://github.com/wekan/wekan/issues).
- [Commercial Support](https://wekan.team).
- [Bounties](https://wekan.team/bounties/index.html).

We also welcome sponsors for features and bugfixes.
By working directly with Wekan you get the benefit of active maintenance and new features added by growing Wekan developer community.

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
