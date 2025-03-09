# Style guide

We follow the [meteor style guide](https://guide.meteor.com/code-style.html#javascript).

Please read the meteor style guide before making any significant contribution.

# Stories about how Wekan works, and developing Wekan

- [Login code](https://github.com/wekan/wekan/issues/5714)
- https://www.mongodb.com/docs/drivers/node/v3.7/fundamentals/promises/
- [Do not use code formatters like Prettier and ESLint](https://github.com/wekan/wekan/pull/4633#issuecomment-1214214591)
- [How realtime board updates work](https://github.com/wekan/wekan/issues/3788#issuecomment-834649553)
- [Mobile Web interface](https://github.com/wekan/wekan/issues/3566#issuecomment-778700604)
- [How to add RTL support](https://github.com/wekan/wekan/issues/3376#issuecomment-766092425)
- [How to code Part 1](https://blog.wekan.team/2019/04/howto-code-part-1-learning-to-learn/)
- [First time Wekan contributor easily figures out Wekan and develops big features](https://blog.wekan.team/2018/05/wekan-v1-00-released/)
- [Benefits of contributing your features to upstream Wekan](https://blog.wekan.team/2018/02/benefits-of-contributing-your-features-to-upstream-wekan/)
- [Excellent example how pull requests are improved and integrated, and not needed commits removed](https://github.com/wekan/wekan/pull/1470)
- [How to add dependency](https://github.com/wekan/wekan/discussions/5235)
- [How to add set default view feature](https://github.com/wekan/wekan/discussions/5233)
- [Adding SVG image](https://github.com/wekan/wekan/discussions/5211#discussioncomment-7765365)

## Building code and submitting pull request

- [Building code and submitting pull request](emoji#how-you-could-add-another-plugin)
- When you start `meteor` command, it watches for changes to files in wekan directory and subdirectories, and if it detects changed code, it starts rebuilding bundle and then reloads webbrowser after that automatically
- Also look at meteor changelog mentioned new feature `hot reload` how that could make reloading faster

## VSCode / VSCodium

- I use [VSCodium](https://vscodium.com) that has MS tracking code removed
- Plugin Prettier for right click format javascript code with prettier
- There could be other plugins for Meteor, Jade, Stylus, Dockerfile, etc

## Finding code

There is find.sh script that ignores generated directories, finds code in subdirectories, and paginates with less. For example, finding how search cards is implemented:
```
cd wekan
./find.sh js-search
```
When you run this, you see .jade template files where is search input box, and .js files where is the search code. CSS is in .styl files.

## Getting Started

- Currently Wekan development is done mainly at Ubuntu 20.10 64bit, but building Wekan does work on any Debian, Ubuntu, WSL Ubuntu 20.04, [Mac](Mac). Sametime maybe on [Windows](Windows) with `choco install -y meteor` and installing packages it then asks for with `meteor add ...` or `meteor npm install --save ...` and then running meteor again.
  - Look through old [pull requests](https://github.com/wekan/wekan/pulls)
  - Read Wekan source code, you can use some git history viewer GUI like gitk
  - Read [Meteor documentation](https://docs.meteor.com/) for [Meteor version](https://github.com/wekan/wekan/blob/main/.meteor/release) in use, other versions mentioned at [Dockerfile](https://github.com/wekan/wekan/blob/main/Dockerfile)
- Docker up-to-date way: You can  clone wekan/wekan repo and update docker-compose.yml file ROOT_URL etc as documented at https://github.com/wekan/wekan commented `docker-compose.yml` file, install docker, and build from source with docker with `docker compose up -d --build`
- Docker not up-to-date way: [Docker environment for Wekan development](https://github.com/wekan/wekan-dev). 

## Pull Request Workflow (Please read before submitting PR's)

- If package is available on meteor https://atmospherejs.com `meteor add packagename` or https://www.npmjs.com `meteor npm install packagename` then it's enough to add package that way, and there is no need to clone repo in [rebuild-wekan.sh](https://github.com/wekan/wekan-maintainer/tree/master/releases) script.
- When doing pull requests, only add additions and changes to English at wekan/i18n/en.i18n.json . Other translations are done at [https://app.transifex.com/wekan/](https://app.transifex.com/wekan/).
- If you have fix to some existing pull request, add your fix as comment. Do not post new pull request.
- For new features add new pull request, if there is none already.
- remove all console.log statements
- [Here is how to remove commits from pull request](https://stackoverflow.com/questions/36168839/how-to-remove-commits-from-pull-request)

## Preventing Travis CI lint errors before submitting pull requests

- NOTE: Travis is currently broken and always shows warnings and errors like variables not defined or not used, so if your code works, ignore Travis.
- Eslint for linting. To prevent Travis CI lint errors, you can test for lint errors by installing `npm install eslint` and running it with `npm run lint` and trying automatic fixing with `eslint --fix filename.js`
- There is also probably not-currently-working as of 2018-05-05 [jsbeautifer website](http://jsbeautifier.org) with settings Indent with 2 spaces (topmost dropdown), [X] Space before conditional: "if(x)" / "if (x)", [X] Use JSLint-happy formatting tweaks.

## Choosing issues to work on

- You are free to select what feature to work on.
  - Leave a comment on an issue saying that you're working on it, and give updates as needed.
  - Work and concentrate on one issue at a time and finish it, before moving to other issue.
- Keep list of your contributions on your personal website.
- Keep track of time it takes to implement each part of a feature, so you can estimate what time it would take to implement similar feature. After implementing feature, review your estimate was it correct, make improvements to your process and estimates, also keeping enough time allocated in estimate if something is harder to implement. Employers look for coders with proven track record.
- You can ask for comments from others, but usually those feature requests are clearly defined how they should work. You can place those Settings options there where it seems most logical for you.

Main point is to be friendly to those commenting of your code, and incorporate those suggestions that make most sense.

# Build Pipeline

- Templates are written in [JADE](https://naltatis.github.io/jade-syntax-docs/) instead of plain HTML. Also see [HTML to JADE converter](http://html2jade.org/).
- CSS is written in the [Stylus](http://stylus-lang.com/) precompiler - see [Stylus to CSS converter](https://mikethedj4.github.io/Stylus2CSS/), and
- Meteor templates are created as BlazeLayout templates.
- Instead of the allow/deny paradigm a lot of the `collections` defined in the project use `mutations` to define what kinds of operations are allowed.

For further details look for the 'feature summaries' in the Wiki (still in progress) otherwise go through the git history and see how old features were built. Might I suggest the Start and Due date feature [wefork#26](https://github.com/wefork/wekan/pull/26)

# Translations

If adding new features, please also support the internationalization features built in. Refer to the [[Translations]] wiki page. 

# Export From Trello

It's possible to import your existing boards from Trello. Instructions [[here|migrating-from-trello]]

# Directory Structure Details

[Directory Structure](Directory-Structure)

# Chat

[![Wekan chat][vanila_badge]][vanila_chat]


[rocket_chat]: https://chat.indie.host/channel/wekan
[vanila_badge]: https://vanila.io/img/join-chat-button2.png
[vanila_chat]: https://community.vanila.io/wekan