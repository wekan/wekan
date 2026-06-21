# Build WeKan and Create Pull Request

WeKan currently uses Meteor 3.

Using newest Ubuntu amd64:

# Meteor 3

### 1. Install git and configure it
```
sudo apt -y install git

git config --global user.name "YOUR-FIRSTNAME YOUR-LASTNAME"

git config --global user.email YOUR-EMAIL-ADDRESS@gmail.com

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
        User YOUR-GITHUB-USERNAME
        IdentityFile ~/.ssh/id_github
```
Save and Exit with Ctrl-o Enter Ctrl-x Enter

If you do not have ssh key, create it:
```
ssh-keygen -t ed25519 -f ~/.ssh/id_github
```
And press Enter about 3 times, until you have private key at `~/.ssh/id_github` and public key at `~/.ssh/id_github.pub`

Add public key `.pub` to your GitHub SSH Keys at https://github.com/settings/keys

### 2. Click Create fork at https://github.com/wekan/wekan webpage

```
mkdir repos

cd repos

git clone git@github.com:YOUR-GITHUB-USERNAME/wekan.git

cd wekan
```

### IMPORTANT: Do NOT `npm audit fix --force`

Because it downgrades @meteorjs/rspack and breaks builds.

### 3. Select option 1 to install dependencies, and then Enter.


```
./rebuild-wekan.sh

1

./rebuild-wekan.sh

2

./rebuild-wekan.sh

3
```
That does:
- 1 install dependencies,
- 2 builds wekan
- 3 starts wekan in development mode with command `meteor`, so it can detect if some file changes and try to rebuild automatically.

And then [register and login](../Login/Adding-users.md) with webbrowser at http://localhost:4000

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
