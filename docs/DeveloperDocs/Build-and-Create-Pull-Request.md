# Build WeKan and Create Pull Request

WeKan currently uses Meteor 3.

Using newest Ubuntu amd64:

# Meteor 3

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

### IMPORTANT: Do NOT `npm audit fix --force`

IMPORTANT: Do NOT `npm audit fix --force`, it downgrades @meteorjs/rspack and breaks builds.
`npm audit` shows false info, it does not recognize that elliptic is already updated
to 6.6.1 with override at package.json like you can see with  `npm list elliptic`.
https://github.com/wekan/wekan/blob/main/CHANGELOG.md#v850-2026-04-03-wekan--release

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

### 4. Make and test your changes

Use `rebuild-wekan.sh` to run all tests.

### 5. If it works, create pull request

When your changes work, commit them:
```
git add --all

git commit -m "Describe your change here."

git push
```
And then at your GitHub for `https://github.com/YOUR-GITHUB-USERNAME/wekan` click `Create pull request`.

## Updating

Updating to next Meteor release:
```
meteor update

meteor npm update
```
Updating to specific Meteor release:
```
meteor update --release METEOR@3.4
```
If you are changing Meteor and Node.js versions, you may need to reset Meteor:
```
meteor reset
```
Or alternatively, delete wekan repo (if you did not need any changes you made), and clone wekan repo again, and then build etc.
