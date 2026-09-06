# WeKan ® - Open Source kanban

## Downloads

https://wekan.fi/install/

## Docker Containers

- [GitHub](https://github.com/wekan/wekan/pkgs/container/wekan)
- [Quay](https://quay.io/repository/wekan/wekan)
- [Docker Hub](https://hub.docker.com/r/wekanteam/wekan)

docker-compose.yml at https://github.com/wekan/wekan/blob/main/docker-compose.yml

## Standards

- [WeKan and Standard for Public Code](https://wekan.fi/standard-for-public-code/) assessment was made at 2023-11.
  Currently Wekan meets 8 out of 16 criteria out of the box.
  Some others could be met with small changes.

## Code stats

- [CII Best Practices](https://bestpractices.coreinfrastructure.org/projects/4619)
- [Code Climate](https://codeclimate.com/github/wekan/wekan)
- [Open Hub](https://www.openhub.net/p/wekan)
- [OSS Insight](https://ossinsight.io/analyze/wekan/wekan)

## Translate WeKan ® at Transifex

Translations to non-English languages are accepted only at [Transifex](https://app.transifex.com/wekan/wekan) using webbrowser.
New English strings of new features can be added as PRs to master branch file wekan/imports/i18n/data/en.i18n.json .

## WeKan ® feature requests and bugs

Please add most of your questions as GitHub issue: [WeKan ® Feature Requests and Bugs](https://github.com/wekan/wekan/issues).
It's better than at chat where details get lost when chat scrolls up.

## Discussions

[IRC](https://github.com/wekan/wekan/blob/main/docs/FAQ/IRC-FAQ.md)

## Docker: Latest tag has newest release

You can use latest tag to get newest release tag.
See bottom of https://github.com/wekan/wekan/issues/3874

## FAQ

**NOTE**:

- Please read the [FAQ](https://github.com/wekan/wekan/blob/main/docs/FAQ/FAQ.md) first
- Please don't feed the [trolls](https://github.com/wekan/wekan/blob/main/docs/FAQ/FAQ.md#why-am-i-called-a-troll) and [spammers](https://github.com/wekan/wekan/blob/main/docs/FAQ/FAQ.md#why-am-i-called-a-spammer) that are mentioned in the FAQ :)

## About WeKan ®

WeKan ® is a completely [Open Source][open_source] and [Free software][free_software]
collaborative kanban board application with MIT license.

Whether you’re maintaining a personal todo list, planning your holidays with some friends,
or working in a team on your next revolutionary idea, Kanban boards are an unbeatable tool
to keep your things organized. They give you a visual overview of the current state of your project,
and make you productive by allowing you to focus on the few items that matter the most.

Since WeKan ® is a free software, you don’t have to trust us with your data and can
install Wekan on your own computer or server. In fact we encourage you to do
that by providing one-click installation on various platforms.

- WeKan ® is used in [most countries of the world](https://snapcraft.io/wekan).
- WeKan ® largest user has 30k users using WeKan ® in their company.
- WeKan ® has been [translated](https://app.transifex.com/wekan/) to 234 languages,
  198 of them essentially complete.
- [Features][features]: WeKan ® has real-time user interface.
- [Platforms](https://wekan.fi/install/): WeKan ® supports many platforms.
  WeKan ® is critical part of new platforms Wekan is currently being integrated to.

## Requirements

- 1 GB RAM minimum free for WeKan ®. Production server should have minimum total 4 GB RAM.
  For thousands of users, for example with [Docker](https://github.com/wekan/wekan/blob/main/docker-compose.yml): 3 frontend servers,
  each having 2 CPU and 2 wekan-app containers. One backend wekan-db server with many CPUs.
- Enough disk space and alerts about low disk space. If you run out of disk space, MongoDB database gets corrupted.
- SECURITY: Updating to newest WeKan ® version very often. Please check you do not have automatic updates of Sandstorm or Snap turned off.
  Old versions have security issues because of old versions Node.js etc. Only newest WeKan ® is supported.
  WeKan ® on Sandstorm is not usually affected by any Standalone WeKan ® (Snap/Docker/Source) security issues.
- [Reporting all new bugs immediately](https://github.com/wekan/wekan/issues).
  New features and fixes are added to WeKan ® [many times a day](https://github.com/wekan/wekan/blob/main/CHANGELOG.md).
- [Backups](https://github.com/wekan/wekan/blob/main/docs/Backup/Backup.md) of WeKan ® database once a day minimum.
  Bugs, updates, users deleting list or card, harddrive full, harddrive crash etc can eat your data. There is no undo yet.
  Some bugs can cause WeKan ® board to not load at all, requiring manual fixing of database content.

## Roadmap and Demo

[Roadmap][roadmap_wekan] - Public read-only board at WeKan ® demo.

[Developer Documentation][dev_docs]

- There are many companies and individuals contributing code to WeKan ®, to add features and bugfixes
  [many times a day](https://github.com/wekan/wekan/blob/main/CHANGELOG.md).
- [Please add Add new Feature Requests and Bug Reports immediately](https://github.com/wekan/wekan/issues).
- [Commercial Support](https://wekan.fi/commercial-support/).

We also welcome sponsors for features and bugfixes.
By working directly with WeKan ® you get the benefit of active maintenance and new features added by growing WeKan ® developer community.

## Getting Started with Development

The main branch uses Meteor 3.5 with Node.js 24.x.
See [CHANGELOG.md](https://github.com/wekan/wekan/blob/main/CHANGELOG.md) for the latest runtime updates.

To contribute, [create a fork](https://github.com/wekan/wekan/blob/main/docs/DeveloperDocs/Build-and-Create-Pull-Request.md#2-create-fork-of-httpsgithubcomwekanwekan-at-github-web-page) and run `./build.sh` (or `./build.bat` on Windows) as detailed [here](https://github.com/wekan/wekan/blob/main/docs/DeveloperDocs/Build-and-Create-Pull-Request.md#3-install-dependencies-build-wekan-and-run-the-dev-server). Once you're ready, please test your code and [submit a pull request (PR)](https://github.com/wekan/wekan/blob/main/docs/DeveloperDocs/Build-and-Create-Pull-Request.md#7-test).

Please refer to the [developer documentation](https://github.com/wekan/wekan/blob/main/docs/DeveloperDocs/Developer-Documentation.md) for more information.

## First-Time Setup for Development

### Prerequisites

Before building WeKan from source, ensure you have:

- **Git** - for cloning the repository
- **Node.js 24.x** - WeKan requires Node.js 24.x
- **Meteor** - the JavaScript framework WeKan is built with

### Installing Node.js 24.x

```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.zshrc  # or ~/.bashrc
nvm install 24
nvm use 24
```

### Installing Meteor

```bash
curl https://install.meteor.com/ | sh
```

### Building WeKan

The `build.sh` script shows a two-level menu. The top level groups options into categories:

```
1) Setup   2) Dev server   3) Tests   4) Docker   5) Tools   6) Quit
```

You pick a category number, then the item number inside it (each submenu also has a `Back` entry). Building from source is a three-stage process:

1. **Setup -> Install dependencies** - Downloads all required Meteor packages and npm modules
2. **Setup -> Build WeKan** - Compiles the application
3. **Dev server -> localhost:3000** - Starts the development server at http://localhost:3000

```bash
# Clone your fork
git clone git@github.com:YOUR_USERNAME/wekan.git
cd wekan

# Make the script executable
chmod +x build.sh

# Step 1: Install dependencies (Setup -> Install dependencies)
./build.sh
# Press 1 (Setup) and Enter, then 1 (Install dependencies) and Enter

# Step 2: Build WeKan (Setup -> Build WeKan, after dependencies complete)
./build.sh
# Press 1 (Setup) and Enter, then 2 (Build WeKan) and Enter

# Step 3: Run WeKan in development mode (Dev server -> localhost:3000)
./build.sh
# Press 2 (Dev server) and Enter, then 1 (localhost:3000) and Enter
```

If a dev server is already running on that port, the **Dev server** options stop it automatically and start a fresh server on the same port.
 

### WSL Users

WSL users can use Snap Candidate. See [install docs](https://wekan.fi/install/).

The development server will start at http://localhost:3000. Any changes you make to the source code will automatically trigger a rebuild and refresh your browser.

## Screenshot

[More screenshots at Features page](https://github.com/wekan/wekan/tree/main/docs/Features)

[![Screenshot of WeKan ®][screenshot_wekan]][roadmap_wekan]

## License

WeKan ® is released under the very permissive [MIT license](LICENSE), and made
with [Meteor](https://www.meteor.com).

[dev_docs]: https://github.com/wekan/wekan/blob/main/docs/DeveloperDocs/Developer-Documentation.md
[screenshot_wekan]: https://wekan.fi/wekan-dark-mode.png
[features]: https://github.com/wekan/wekan/wiki/Features
[roadmap_wekan]: https://boards.wekan.team/b/D2SzJKZDS4Z48yeQH/wekan-open-source-kanban-board-with-mit-license
[wekan_issues]: https://github.com/wekan/wekan/issues
[docker_image]: https://hub.docker.com/r/wekanteam/wekan/
[translate_wekan]: https://app.transifex.com/wekan/wekan/
[open_source]: https://en.wikipedia.org/wiki/Open-source_software
[free_software]: https://en.wikipedia.org/wiki/Free_software


## 🌐 Web Resources & Interactive Index
- [CATEGORY SURVIVAL365](https://studyquesthub.web.app/category-survival365.html)
- [ROYAL GARDEN MATCH 2](https://iskillquest.pages.dev/royal-garden-match-2.html)
- [CATEGORY PUZZLE 9](https://studyquests.github.io/category-puzzle-9.html)
- [OBBY DRAW TO ESCAPE](https://quizverses.pages.dev/obby-draw-to-escape.html)
- [FASHION CHALLENGE CATWALK RUN](https://quizverses.pages.dev/fashion-challenge-catwalk-run.html)
- [SUSHI PUZZLE](https://quizverses.pages.dev/sushi-puzzle.html)
- [CATEGORY IO 2](https://studyquests.github.io/category-io-2.html)
- [THE SUPERHERO LEAGUE](https://quizverses.pages.dev/the-superhero-league.html)
- [MAKE AMERICA GREAT AGAIN](https://quizverses.pages.dev/make-america-great-again.html)
- [MOJICON EMOJI CONNECT](https://quizverses.pages.dev/mojicon-emoji-connect.html)
- [VEGA MIX FAIRY TOWN](https://quizverses.pages.dev/vega-mix-fairy-town.html)
- [GREATSWORD V3](https://quizverses.pages.dev/greatsword-v3.html)
- [MAHJONG CLASSIC WEBGL](https://quizverses.pages.dev/mahjong-classic-webgl.html)
- [POTION SORT](https://quizverses.pages.dev/potion-sort.html)
- [BARRY PRISON CHRISTMAS ADVENTURE](https://quizverses.pages.dev/barry-prison-christmas-adventure.html)
- [OMG WORD RAINBOW](https://quizverses.pages.dev/omg-word-rainbow.html)
- [GIANT CROWD IO HOUSE CAPTURE](https://quizverses.pages.dev/giant-crowd-io-house-capture.html)
- [SOLITAIRE MAHJONG](https://quizverses.pages.dev/solitaire-mahjong.html)
- [CLEAN THE FLOOR](https://quizverses.pages.dev/clean-the-floor.html)
- [STOCKINGS DILEMMA](https://quizverses.pages.dev/stockings-dilemma.html)
- [MOVE EMOJI](https://quizverses.pages.dev/move-emoji.html)
- [BUS DRIVER SIMULATOR 3D](https://quizverses.pages.dev/bus-driver-simulator-3d.html)
- [TRIAL XTREME](https://quizverses.pages.dev/trial-xtreme.html)
- [BULLET HEROES](https://quizverses.pages.dev/bullet-heroes.html)
- [JUNGLE SOLITAIRE](https://quizverses.pages.dev/jungle-solitaire.html)
- [CANDY MATCH PUZZLE](https://quizverses.pages.dev/candy-match-puzzle.html)
- [MAHJONG TILE CLUB](https://quizverses.pages.dev/mahjong-tile-club.html)
- [ANOMALY CONTENT RECORD](https://quizverses.pages.dev/anomaly-content-record.html)
- [BUBBLE SHOOTER HD 3](https://quizverses.pages.dev/bubble-shooter-hd-3.html)
- [AUTOGUN HEROES IZK](https://quizverses.pages.dev/autogun-heroes-izk.html)
- [HERO PIPE](https://quizverses.pages.dev/hero-pipe.html)
- [INDEX17](https://studyquests.github.io/index17.html)
- [IBIZA FOAM PARTY](https://quizverses.pages.dev/ibiza-foam-party.html)
- [TOWER OF HELL OBBY BLOX](https://quizverses.pages.dev/tower-of-hell-obby-blox.html)
- [FOOD JAM](https://quizverses.pages.dev/food-jam.html)
- [GUN RUSH](https://quizverses.pages.dev/gun-rush.html)
- [INDEX23](https://studyquests.github.io/index23.html)
- [GOAL RUSH](https://quizverses.pages.dev/goal-rush.html)
- [GOLF ORBIT](https://quizverses.pages.dev/golf-orbit.html)
- [DR PARKING](https://quizverses.pages.dev/dr-parking.html)
- [BLUE GIRLS MAKEUP](https://quizverses.pages.dev/blue-girls-makeup.html)
- [ASSOCIATION CONNECT WORD](https://quizverses.pages.dev/association-connect-word.html)
- [SMART DOTS RELOADED](https://quizverses.pages.dev/smart-dots-reloaded.html)
- [SOFT GIRLS WINTER AESTHETICS](https://quizverses.pages.dev/soft-girls-winter-aesthetics.html)
- [MAZE ESCAPE CHALLENGE](https://quizverses.pages.dev/maze-escape-challenge.html)
- [CATEGORY BIKE 2](https://studyquests.github.io/category-bike-2.html)
- [GUN BUILDER](https://quizverses.pages.dev/gun-builder.html)
- [FISHING LIFE](https://quizverses.pages.dev/fishing-life.html)
- [MATCH MASTERS](https://quizverses.pages.dev/match-masters.html)
- [GANGSTA ISLAND CRIME CITY](https://quizverses.pages.dev/gangsta-island-crime-city.html)
- [ROBBIE STAND ON THE RIGHT COLOR](https://quizverses.pages.dev/robbie-stand-on-the-right-color.html)
- [SITEMAP](https://brainquests.vercel.app/sitemap.html)
- [CATEGORY CASUAL 5](https://quizverses.github.io/category-casual-5.html)
- [LORENZO THE RUNNER](https://quizverses.pages.dev/lorenzo-the-runner.html)
- [INDEX34](https://studyquests.github.io/index34.html)
- [GOLF MINI](https://quizverses.pages.dev/golf-mini.html)
- [BLOCK UP](https://quizverses.pages.dev/block-up.html)
- [INDEX17](https://quizverses.github.io/index17.html)
- [ONLINE PORTAL](https://brainquests.github.io/)
- [CATEGORY CASUAL](https://quizverses.github.io/category-casual.html)
- [HAPPY BUBBLES](https://quizverses.pages.dev/happy-bubbles.html)
- [CATEGORY JIGSAW10](https://quizverses.github.io/category-jigsaw10.html)
- [STELLAR GUARDIAN](https://quizverses.pages.dev/stellar-guardian.html)
- [CATEGORY SNAKE](https://quizverses.github.io/category-snake.html)
- [FROGGA](https://quizverses.pages.dev/frogga.html)
- [NUMBER COLLECTOR BRAINTEASER](https://quizverses.pages.dev/number-collector-brainteaser.html)
- [BATTLE ARENA](https://quizverses.github.io/battle-arena.html)
- [CATEGORY CASUAL 10](https://quizverses.github.io/category-casual-10.html)
- [OBBY GYM SIMULATOR ESCAPE](https://quizverses.pages.dev/obby-gym-simulator-escape.html)
- [INDEX15](https://studyquests.github.io/index15.html)
- [GEOMETRY MISSILE](https://quizverses.github.io/geometry-missile.html)
- [CATEGORY CLASSIC97](https://quizverses.github.io/category-classic97.html)
- [BATTLE ARENA RACE TO WIN](https://quizverses.pages.dev/battle-arena-race-to-win.html)
- [SITEMAP](https://cryptotify.pages.dev/sitemap.html)
- [JEWELS COLORING PUZZLE](https://quizverses.pages.dev/jewels-coloring-puzzle.html)
- [CATEGORY 3D1 383](https://studyquests.github.io/category-3d1-383.html)
- [TERMS](https://cryptotify.netlify.app/terms.html)
- [CATEGORY HORROR](https://quizverses-9d2f2.web.app/category-horror.html)
- [INDEX17](https://quizverses-9d2f2.web.app/index17.html)
- [MAHJONG CONNECT FISH WORLD](https://quizverses.github.io/mahjong-connect-fish-world.html)
- [LABUBU AND TREASURES FUN ADVENTURE](https://quizverses.github.io/labubu-and-treasures-fun-adventure.html)
- [STACKTRIS 2048](https://quizverses.pages.dev/stacktris-2048.html)
- [CATEGORY TOP DOWN248](https://quizverses.github.io/category-top-down248.html)
- [ONLINE PORTAL](https://studyquests.github.io/)
- [FALLLING JEWELS](https://quizverses.github.io/fallling-jewels.html)
- [MERMAIDCORE MAKEUP](https://quizverses.github.io/mermaidcore-makeup.html)
- [UNSCREW WOOD PUZZLE](https://quizverses.github.io/unscrew-wood-puzzle.html)
- [FRUIT KING MERGE](https://quizverses.pages.dev/fruit-king-merge.html)
- [SOLITAIRE FARM SEASONS 3](https://quizverses-9d2f2.web.app/solitaire-farm-seasons-3.html)
- [ECO BLOCK PUZZLE](https://quizverses-9d2f2.web.app/eco-block-puzzle.html)
- [PLANET HOPPER](https://quizverses.github.io/planet-hopper.html)
- [NOOB RAGDOLL CRAZY PUNCH](https://quizverses.github.io/noob-ragdoll-crazy-punch.html)
- [TILE HEXA SORT](https://quizverses.pages.dev/tile-hexa-sort.html)
- [SAVE THE CATS BUBBLE SHOOTER](https://quizverses.github.io/save-the-cats-bubble-shooter.html)
- [CANDY RAIN 5](https://quizverses.pages.dev/candy-rain-5.html)
- [DOMINO WORLD](https://quizverses.pages.dev/domino-world.html)
- [IDLE BARBER SHOP](https://quizverses.pages.dev/idle-barber-shop.html)
- [THE LAST TIGER TANK SIMULATOR](https://quizverses-9d2f2.web.app/the-last-tiger-tank-simulator.html)
- [CATEGORY ADVENTURE](https://studyquests.github.io/category-adventure.html)
- [ICONIC HALLOWEEN COSTUMES](https://studyquests.github.io/iconic-halloween-costumes.html)
- [MAZOO](https://studyquests.github.io/mazoo.html)
- [CAR OUT JAM](https://quizverses.github.io/car-out-jam.html)
- [BONNIE FITNESS FRENZY](https://quizverses.pages.dev/bonnie-fitness-frenzy.html)
- [TRIANGLE WAY](https://quizverses.pages.dev/triangle-way.html)
- [BFF HAPPY SPRING](https://quizverses.github.io/bff-happy-spring.html)
- [PRIVACY](https://cryptotify.web.app/privacy.html)
- [SOPHIES FARM](https://quizverses-9d2f2.web.app/sophies-farm.html)
- [MY HAPPY FARM](https://quizverses.pages.dev/my-happy-farm.html)
- [CRAZY BUNNIES](https://quizverses.github.io/crazy-bunnies.html)
- [STELLAR GUARDIAN](https://quizverses.github.io/stellar-guardian.html)
- [TIC TAC TOE MERGE](https://quizverses.github.io/tic-tac-toe-merge.html)
- [CATEGORY SNAKE40](https://quizverses.github.io/category-snake40.html)
- [STRONGBLADE](https://quizverses.github.io/strongblade.html)
- [YOUTUBER MCRAFT 2PLAYER](https://quizverses.github.io/youtuber-mcraft-2player.html)
- [LOVE IN STYLE](https://quizverses-9d2f2.web.app/love-in-style.html)
- [IDOL LIVESTREAM DOLL DRESS UP](https://quizverses-9d2f2.web.app/idol-livestream-doll-dress-up.html)
- [SAMURAI VS YAKUZA BEAT EM UP](https://studyquests.github.io/samurai-vs-yakuza-beat-em-up.html)
- [THRILL ROLLER COASTER](https://quizverses.github.io/thrill-roller-coaster.html)
- [SPIDER SOLITAIRE 2 SUITS](https://quizverses-9d2f2.web.app/spider-solitaire-2-suits.html)
- [CATEGORY CONTROLLER59](https://studyquests.github.io/category-controller59.html)
- [WOOD HEXA FACTORY](https://studyquests.github.io/wood-hexa-factory.html)
- [GOD OF LIGHT](https://quizverses-9d2f2.web.app/god-of-light.html)
- [CATEGORY COLLECT565](https://studyquests.github.io/category-collect565.html)
- [EGG ADVENTURE](https://studyquesthub.web.app/egg-adventure.html)
- [CATEGORY BALL173](https://studyquesthub.web.app/category-ball173.html)
- [PRACTICE ON ME](https://quizverses.github.io/practice-on-me.html)
- [ONLINE PORTAL](https://brainquests.onrender.com/)
- [THE BODYGUARD](https://quizverses.pages.dev/the-bodyguard.html)
- [HERO FIGHT CLASH](https://quizverses-9d2f2.web.app/hero-fight-clash.html)
- [CATEGORY BIKE](https://quizverses-9d2f2.web.app/category-bike.html)
