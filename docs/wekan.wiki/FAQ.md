> **»The only stupid question is the one that is not asked.«**  
> *– Hull, E., K. Jackson, et al. (2005).*

## About Wekan

Wekan is an completely Open Source and Free software
collaborative [kanban board](https://en.wikipedia.org/wiki/Kanban_board) application with MIT license.

Whether you’re maintaining a personal todo list, planning your holidays with some friends,
or working in a team on your next revolutionary idea, Kanban boards are an unbeatable tool
to keep your things organized. They give you a visual overview of the current state of your project,
and make you productive by allowing you to focus on the few items that matter the most.

Since Wekan is a free software, you don’t have to trust us with your data and can
install Wekan on your own computer or server. In fact we encourage you to do
that by providing one-click installation on various platforms.

- Wekan is used in [most countries of the world](https://snapcraft.io/wekan).
- Wekan largest user has 30k users using Wekan in their company.
- Wekan has been [translated](https://app.transifex.com/wekan/) to about 70+ languages.
- [Features](Features): Wekan has real-time user interface.
- [Platforms](Platforms): Wekan supports many platforms.
  Wekan is critical part of new platforms Wekan is currently being integrated to.
- [Integrations](Integrations): Current possible integrations and future plans.

## About niche of WeKan

It's a very specific niche, with limited amount competitors, with all of this applied combined:

- Kanban with very many features, polish and usability
- Permissive MIT license (if some other changes to GPL, Open Core, has https://sso.tax , is propietary etc, it's not in same niche anymore)
- Self-hosted (or SaaS)
- All code https://github.com/wekan/wekan and docs https://github.com/wekan/wekan/wiki Open Source
- Available for many OS and CPU platforms, listed at download/install section of https://wekan.github.io
- Translated to 70+ languages at https://app.transifex.com/wekan
- Has optional affordable Commercial Support for Features/Fixes/Support/Hosting available https://wekan.team/commercial-support/ that funds development of WeKan. Commercial Support provides private support chat with maintainer of WeKan.
- Is actively maintained with major features and fixes being added
- Does not include any enabled telemetry or externally loaded dependencies by default, it does not ping home. Only Snap platform has number of servers per country counted by Canonical that provides Snap store https://snapcraft.io/wekan , not any more specific details.
- Alternative to Enterprise software that can cost 500k euro per year

## Requirements

- 64bit: Linux [Snap](https://github.com/wekan/wekan-snap/wiki/Install) or [Sandstorm](https://sandstorm.io) /
  [Mac](Mac) / [Windows](Install-Wekan-from-source-on-Windows).
  [More Platforms](Platforms). [ARM progress](https://github.com/wekan/wekan/issues/1053#issuecomment-410919264).
- 1 GB RAM minimum free for Wekan. Production server should have miminum total 4 GB RAM.
  For thousands of users, for example with [Docker](https://github.com/wekan/wekan/blob/main/docker-compose.yml): 3 frontend servers,
  each having 2 CPU and 2 wekan-app containers. One backend wekan-db server with many CPUs.
- Enough disk space and alerts about low disk space. If you run out disk space, MongoDB database gets corrupted.
- SECURITY: Updating to newest Wekan version very often. Please check you do not have automatic updates of Sandstorm or Snap turned off.
  Old versions have security issues because of old versions Node.js etc. Only newest Wekan is supported.
  Wekan on Sandstorm is not usually affected by any Standalone Wekan (Snap/Docker/Source) security issues.
- [Reporting all new bugs immediately](https://github.com/wekan/wekan/issues).
  New features and fixes are added to Wekan [many times a day](https://github.com/wekan/wekan/blob/main/CHANGELOG.md).
- [Backups](Backup) of Wekan database once a day miminum.
  Bugs, updates, users deleting list or card, harddrive full, harddrive crash etc can eat your data. There is no undo yet.
  Some bug can cause Wekan board to not load at all, requiring manual fixing of database content.

## What is Wekan Team?

[Wekan Team](https://wekan.team) is Wekan Commercial Support company run by CEO [xet7](https://github.com/xet7), current maintainer of Wekan. xet7 does respond to feedback at GitHub issues very actively, because Wekan is community driven Open Source project. Because conflicting opinions can not be implemented, sometimes xet7 has to behave like a benevolent dictator. Every Wekan team member is free to choose what to contribute and when. We can not force anybody to implement anything. Wekan development speed increases when new Wekan contributors join and start to send PRs to existing and new issues.

## What is Bio of xet7 ?

[Lauri Ojansivu](https://github.com/xet7) is CEO at [WeKan Team](https://wekan.team),
Cross-Platform FOSS maintainer,
Cloud Architect, Full-Stack Developer, SysAdmin and SysOp.
He has experience of [having added and removed over 4 million lines of code](https://github.com/wekan/wekan/blob/main/releases/count-lines-of-code-per-committer.sh) to
[Meteor Full-Stack Web Framework](https://www.meteor.com)
based [WeKan Open Source kanban](https://wekan.github.io),
that has been [translated to 70+ languages](https://explore.transifex.com/wekan/wekan/),
and is currently used at [most countries of the world](https://snapcraft.io/wekan).
At 2024-06-04, he is currently [4h most active GitHub committer at Finland](https://committers.top/finland).

He holds a BBA as computer designer and system engineer
at Kemi-Tornio AMK, Finland.
He is credited as having built quality control system
with comparisons of groups and fitness test calculations,
company infra, migration from On-Premises to Cloud,
SLA support, IT support, [games](https://github.com/xet7/notegame), database apps, websites,
[winner of 2th place at EU NGI ONTOCHAIN Hackathon](https://wekan.github.io/donated/ontochain-certificate.png),
[winner of 20i FOSS Awards](https://wekan.github.io/donated/foss-awards-2022/20i_FOSS_Awards_Winners_Announced_(Press_Release).pdf), and [porting to 30+ CPU/OS](https://github.com/xet7/darkesthour).

At MeteorJS Dispatches Video Podcast, he has been
interviewed [about WeKan](https://www.youtube.com/watch?v=ke-mbnZM3zE&t=1342s),
[Meteor Security](https://www.youtube.com/watch?v=zic-h8jG6F8), and other topics.
He teaches using computers at local nerd club.
At his free time, he is porting FOSS software to many CPU/OS,
and [translating them from English to Finnish](https://xet7.org).

## How to convince my company management that Wekan "is less evil" than Trello?

Yes, xet7 received this question in Email.

Trello:
- Code is proprietary. Only Atlassian personnel has access Trello source code.
- You can not install Trello to your own servers.
- Trello has access to all of your data.
- You can not run Trello in internal network that is not connected to Internet.

Wekan:
- All Wekan code is Open Source at https://github.com/wekan/wekan with MIT license, free also for commercial use.
- You don't need to pay monthly fee for using Wekan. Only if you need Commercial Support https://wekan.team for some bugfix, feature or integration, you can pay for that.
- You can download all Wekan code and run in internal network that is not connected to Internet. You can keep all your data to yourself.
- Snap/Docker/Sandstorm versions runs inside sandbox and does not have any access to elsewhere on server filesystem.
  - Snap version of Wekan is built directly from https://github.com/wekan/wekan repo on Canonical's build service that does security checks etc.
  - Docker version of Wekan is built directly from https://github.com/wekan/wekan by [Quay](https://quay.io/wekan/wekan) and [Docker Hub](https://hub.docker.com/r/wekanteam/wekan/) and they do security checks etc.
  - Sandstorm version is checked by [ocdtrekkie](https://github.com/ocdtrekkie) that it does not break anything, before he lets new version of Wekan into [Sandstorm App Market](https://apps.sandstorm.io/app/m86q05rdvj14yvn78ghaxynqz7u2svw6rnttptxx49g1785cdv1h).
- Wekan does not load any files from Internet, when starting Wekan. For further restrictions, you could on internal server only allow incoming and outgoing traffic from
  on internal server firewall to those computers that need to use Wekan.
- There is contributors to Wekan from all over the world, that add fixes and features to Wekan.
- There has been some code reviews done by security researchers https://wekan.github.io/hall-of-fame/ and there has been fixes to Wekan related to that.
- xet7 tries to be less evil by trying to listen to some user feedback. For example, someone suggested [inner shadow](https://github.com/wekan/wekan/issues/1690), so it was added, but because of feedback from users inner shadow was removed. Same with removing and adding back [SMTP settings in Admin Panel](https://github.com/wekan/wekan/issues/1790). Unfortunately it's not possible to make everyone happy because different people have different opinions, so xet7 tries to select something that makes some sense. Improvement suggestions welcome.

## When new version of Wekan will be released? When my pull request will be tested, commented or merged?

Usually:
* Fastest: multiple times a day. Sometimes this is 7 releases per day. This is usually because some bug is found and new releases are done in rapid schedule until bug is fixed. Also sometimes there is many new pull requests per day, or fast pace of adding new features. This is like said by Eric S. Raymond: ["Release early. Release often. And listen to your customers."](https://en.wikipedia.org/wiki/Release_early,_release_often)
* Slowest: Once a month.
* One release contains anything from one typo fix to many major features and bugfixes.

For [Wekan Platforms](Platforms), it means these choices:

* Snap: You get updates automatically immediately, or updates automatically scheduled at midnight
* Source/Docker/VirtualBox: You need to test and install new Wekan version yourself
* Sandstorm: ocdtrekkie tests before releasing to Sandstorm App Market, and you backup your grains and upgrade by clicking upgrade button when you wish

## What Wekan version number means?

* Every release has release date and release number.
* Every release increments release number by 0.01. This practise started at 2017-03-05 v0.12. Before it release number was much more compicated like v0.11.1-rc2. After v0.99 comes v1.00, v1.01, v1.02, etc.
* Version number is only incrementing number. Wekan has been in production use for a long time already, so v1.00 is not about being production ready. There has been many performance improvements, but there is still a lot to improve.
* Wekan still has bugs, like any other software. So this is not about being bug free.
* Wekan will keep changing, and providing migrations from old to newest version. In that sense, Wekan has been LTS release as long as it's been maintained already. There have been many fixes to make migrations possible, and adding more fixes will continue.
* Development happens in in edge branch. When release is made, edge branch is merge merged to devel/master/meteor-1.8 branches.

# Features

## Will my feature request be implemented?

There are alternative ways to have your feature implemented:

a) [Commercial Support](https://wekan.team/commercial-support/)

b) Pay someone from your company or some other developer to code feature and submit as pull request

c) Develop feature yourself and submit it as pull requests to devel [Wekan repo](https://github.com/wekan/wekan) branch.

[According to Open Hub](https://www.openhub.net/p/wekan), Wekan code is only about 10500 lines without Meteor.js framework and NPM modules, so it's very small when comparing to other software, and quite logically organized. With git history viewer like gitk it's possible to see how different features are implemented.

For Sandstorm-specific features, have the feature enabled in Sandstorm by using environment variable isSandstorm = true like is at wekan/sandstorm.js .

In wiki there is [Developer Documentation](Developer-Documentation).

## Will you accept my pull request?
We totally rely on pull requests for new features and bug fixes. If your pull request works, it's very likely to be accepted by xet7.

## How can I contribute to Wekan?
We’re glad you’re interested in helping the Wekan project! We welcome bug reports, enhancement ideas, and pull requests, in our GitHub bug tracker. Have a look at the [[Contributing notes|developer-documentation]] for more information how you can help improve and enhance Wekan. We are working to make it possible to have bounties for features. We welcome sponsors.

## Are there any tests?
There are near to zero tests, because nobody has contributed tests as pull request.

## Is there a plugin system?
No. It's not possible in web browser to a) Install npm modules inside Docker or b) Install code afterwards on Sandstorm, because application code is read-only and signed. All features in code are built in, and all data related to features is stored on MongoDB.

## Can Wekan be rewritten in another programming language?

[xet7 tried to rewrite, but it's only at very early steps](https://github.com/wekan/demo/wiki/Roadmap).

# History

## Weren't you called Libreboard before?
Yes, Libreboard was the old project name, which superseded the even older project name Metrello. As the original name suggests, Metrello was a Trello clone built with Meteor. It used a lot of the original assets from Trello and even the name was very similar. When the project turned more mature and gained more interest by the community, this was obviously a [problem]. To get its own identity and due to a DMCA from Trello, efforts started to [redesign] Metrello, which also included to find a new name and so Maxime Quandalle came up with “OpenBoard”, to underline the open source nature of the project. Unfortunately the com domain was already taken and so she replaced the Open with Libre, which stands for free (as in freedom) in many Latin derived languages.

After renaming it to Libreboard, a [new logo] was designed and the project continued to live on as Libreboard. Unfortunately it turned out, that the new logo was apparently ripped-off from a [concept] published at Dribbble, and so a new logo had to be found. There were a lot of [ideas from the community][logo-ticket], and at the end Maxime [proposed][wekan-proposal] a completely new name, Wekan, together with a design proposal for a new logo.

## What was Wekan fork / Wefork?
After 2016-09-02 there were no pull requests reviewed and integrated for nearly 2 months. At 2016-10-20 Wekan community created fork and started merging many bugfixes and new features into Wefork. 2017-01-29 Wekan author mquandalle gave access to Wekan and at 2017-01-31 xet7 started merging Wefork back to Wekan. 2017-02-08 All of Wefork is now merged and moved back to official Wekan. Wefork will not accept any new issues and pull requests. All development happens on Wekan. [Wefork announcement and merging back](https://github.com/wekan/wekan/issues/640#issuecomment-276383458), more info: [Team](Team)

## What is the difference between Wekan and Trello?
The main difference between the two is that Wekan is completely open source and available under the permissive MIT license. That makes it possible to host it on your own server (or your company's or organization's server) and you keep the full control over all data. No need to fear it will disappear some day, like a commercial service like Trello could.  
Additionally the long term goal is to have features that are not available on Trello or other alternatives, making Wekan flexible and suitable for complex project organizations.

## Why does Wekan look so different now compared to < v0.9?
Wekan started as a just for fun project to explore meteor and its features and the initial version had a lot of the Trello assets (CSS, Images, Fonts) in it and copied a lot of its design. Due to an DMCA takedown notice and obviously to get its own identity, the old design was dropped after v0.8 and a new UI was developed

See the related tickets [#92] and [#97] for more information.

[#92]: https://github.com/wekan/wekan/issues/92
[#97]: https://github.com/wekan/wekan/issues/97

# Etiquette

## Why am I called a troll?
* You use word "shame", that means you would like to have a feature or fix without contributing any code or payment yourself, worded in a way to make it itch conscience.
* You want a feature, but you add thumbs down emoji reactions
* You are adding image reactions
* You want priorities changed. Current priorities are:
  * [High priority](https://github.com/wekan/wekan/issues?q=is%3Aissue+is%3Aopen+label%3AHigh-priority): security issues and high severity bugs
  * Medium priority: Import/Export
  * Others. Actual roadmap will be updated later.
* You write that you are providing constructive criticism
* You think that free software includes free implemented features
* You are adding something other than:
  * Thumbs up reactions to existing posts
  * Feature specs
  * Technical details
  * Links to related documentation
  * Links to example code to get a feature implemented
  * Pull requests

## Why am I called a spammer?
* You are adding new comments that have only content like:
  * +1
  * +1 I can confirm this
  * +1 It would be great to have this
  * +1 This is the only feature for preventing my company to move to Wekan
* You are adding something other than:
  * Thumbs up reactions to existing posts
  * Feature specs
  * Technical details
  * Links to related documentation
  * Links to example code to get a feature implemented
  * Pull requests

## What you should do if you see a troll or a spammer?
Add only one link to this FAQ. Do not in any way comment or feed the trolls.

[problem]: https://github.com/wekan/wekan/issues/92
[redesign]: https://github.com/wekan/wekan/issues/94
[new logo]: https://github.com/wekan/wekan/issues/64#issuecomment-69005150
[concept]: https://dribbble.com/shots/746215-Pigeon
[logo-ticket]: https://github.com/wekan/wekan/issues/64#issuecomment-74357809
[wekan-proposal]: https://github.com/wekan/wekan/issues/64#issuecomment-135221046

---

# Sandstorm

## What Sandstorm is not anymore?
Not a Company, Not a Startup, Not a Product with Enterprise version. Everything is now [Open Source](https://en.wikipedia.org/wiki/Open-source_software) and [Free software](https://en.wikipedia.org/wiki/Free_software).

## What is Sandstorm?
[Sandstorm](https://sandstorm.io) is a open-source and free software security audited platform with grains, logging, admin settings, server clustering and App Market. App Market has Wekan as installable App. SSO options like LDAP, passwordless email, SAML, GitHub and Google Auth are already available on Sandstorm. Sandstorm is preferred platform for Wekan, as it would take a lot of work to reimplement everything in standalone Wekan. 

## How can you contribute to Sandstorm?
See [Sandstorm website about contributing pull requests](https://sandstorm.io) and [returning to Open Source community roots, including donation info](https://sandstorm.io/news/2017-02-06-sandstorm-returning-to-community-roots).

