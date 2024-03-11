## About markdown changes

Wekan v4.29 changes markdown rendering from [marked](https://github.com/markedjs/marked) to [markdown-it](https://github.com/markdown-it/markdown-it).

## About emoji

With markdown-it, also [markdown-it-emoji](https://github.com/markdown-it/markdown-it-emoji) plugin has been added, supporting [full list of GitHub emojis](https://github.com/markdown-it/markdown-it-emoji/blob/master/lib/data/full.json).

Example emoji code, that you can add for example to card name, card description etc:
```
:rainbow: :thumbsup: :100:
```
That shows emojis :rainbow: :thumbsup: :100:

## About other markdown-it plugins

For markdown-it, there are also other [syntax extensions](https://github.com/markdown-it/markdown-it#syntax-extensions) where some are listed at that markdown-it page, and [others at npmjs.com](https://www.npmjs.org/browse/keyword/markdown-it-plugin).

For example, how to get some [mermaid plugin](https://www.npmjs.com/search?q=markdown-it-mermaid) working so that some syntax works for https://mermaid-js.github.io/mermaid/ ?

## How you could add another plugin

Using newest Ubuntu amd64:

### 1. Install git and configure it
```
sudo apt -y install git
git config --global user.name "Yourfirstname Yourlastname"
git config --global user.email email-address-you-use-at-github@example.com
git config --global push.default simple
```

### 2. Create fork of `https://github.com/wekan/wekan`
```
git clone git@github.com:YourGithubUsername/wekan.git
cd wekan
./rebuild-wekan.sh
```
### 3. Select option 1 to install dependencies, and then Enter.
```
./rebuild-wekan.sh
```
### 4. Select option 2 to build Wekan, and then Enter

### 5. Add new plugin package
```
meteor npm install markdown-it-something --save
```
### 5. Edit file

Edit file `wekan/packages/markdown/src-integration.js` and add using that new package, using code example from that new plugin page, or similar like emoji plugin was added.

### 6. Start meteor in Wekan directory

For example:
```
WRITABLE_PATH=.. meteor --port 4000
```
And then [register and login](Adding-users) at http://localhost:4000


### 7. Test

Test does that new plugin syntax work, for example in card title, card description etc on other input fields.

### 8. If it works

If normal markdown, emoji, and your new added plugin syntax all work, commit your changes:
```
git add --all
git commit -m "Added plugin markdown-it-something."
git push
```
And then at your GitHub for `https://github.com/YOUR-GITHUB-USERNAME/wekan` click `Create pull request`.


