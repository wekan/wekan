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

# Meteor 2

### 1. Install git and configure it
```
sudo apt -y install git

git config --global user.name "Yourfirstname Yourlastname"

git config --global user.email email-address-you-use-at-github@example.com

git config --global push.default simple

nano .ssh/config
```
There add your User (GitHub username) and IdentityFile (Your ssh private key. Not public key that has .pub).
For indentation, use one tab.
```
Host *
        IdentitiesOnly=yes

Host github.com
        Hostname github.com
        User xet7
        IdentityFile ~/.ssh/id_xet7ed
```
Save and Exit with Ctrl-o Enter Ctrl-x Enter

If you do not have ssh key, create it:
```
ssh-keygen
```
And press Enter about 3 times, until you have private key at `~/.ssh/id_rsa` and public key at `~/.ssh/id_rsa.pub`

Add public key `.pub` to your github account web interface.

Add path to Meteor:
```
nano .bashrc
```
There at bottom add:
```
export PATH=~/.meteor:$PATH
```
Save and Exit with Ctrl-o Enter Ctrl-x Enter

### 2. Create fork of `https://github.com/wekan/wekan` at GitHub web page

```
mkdir repos

cd repos

git clone git@github.com:YourGithubUsername/wekan.git

cd wekan
```
### 3. Select option 1 to install dependencies, and then Enter.
```
./rebuild-wekan.sh

1

./rebuild-wekan.sh

2

./rebuild-wekan.sh

3
```
That does: 1 install dependencies, 2 builds wekan, 3 starts wekan in development mode with command `meteor`, so it can detect if some file changes and try to rebuild automatically and reload webbroser. But, still sometimes, it may need stopping with Ctrl-c and full build with option 2.

And then [register and login](Adding-users) at http://localhost:4000

### OPTIONAL, NOT NEEDED: 5. Add new plugin package
```
meteor npm install markdown-it-something --save
```

Edit file `wekan/packages/markdown/src-integration.js` and add using that new package, using code example from that new plugin page, or similar like emoji plugin was added.

### 7. Test

Test does that new plugin syntax work, for example in card title, card description etc on other input fields.

### 8. If it works, create pull request

If normal markdown, emoji, and your new added plugin syntax all work, commit your changes:
```
git add --all

git commit -m "Added plugin markdown-it-something."

git push
```
And then at your GitHub for `https://github.com/YOUR-GITHUB-USERNAME/wekan` click `Create pull request`.

# Meteor 3

At 2024-06-26, it looks like from https://nodejs.org/en that Node.js LTS version is 20.15.0 , so change to newest Node.js LTS, delete old Meteor:
```
sudo n 20.15.0

sudo npm -g install npm

cd

rm -rf .meteor
```
Check how to install newest Meteor from Meteor 3 PR at https://github.com/meteor/meteor/pull/13163 , for example:
```
npx meteor@rc
```
Check what branches there are:
```
cd repos/wekan

git branch -a
```
Change to Meteor 3 branch:
```
git checkout feature-meteor3
```
Build wekan:
```
./rebuild-wekan.sh

2
```
If there are errors, try to fix them.

Or try to run wekan:
```
./rebuild-wekan.sh

3
```
# Updating

There are usually updates both for npm packages and Meteor

Updating npm packages:
```
npm update
```
Checking for vulnerable packages:
```
npm audit
```
Fixing vulnerable npm packages by updating to newer packages:
```
npm audit fix
```
If that did not help, use force:
```
npm audit fix --force
```
If that did not help, read links from that `npm audit` command did show, remove deprecated dependencies, update to other maintained dependencies.

Updating to next Meteor release:
```
meteor update
```
Updating to specific Meteor release:
```
meteor update --release METEOR@3.0-rc.4
```
Trying to update all Meteor packages:
```
meteor update --release METEOR@3.0-rc.4 --all-packages
```
Allowing incompatible updates, that may sometime work:
```
meteor update --release METEOR@3.0-rc.4 --all-packages --allow-incompatible-update
```
If you are changing Meteor and Node.js versions, you may need to reset Meteor:
```
meteor reset
```
Or alternatively, delete wekan repo (if you did not need any changes you made), and clone wekan repo again, and then build etc.
