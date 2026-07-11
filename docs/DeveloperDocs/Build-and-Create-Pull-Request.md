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

### 3. Install dependencies, build WeKan, and run the dev server

`rebuild-wekan.sh` shows a two-level menu. The top level is `1) Setup 2) Dev server 3) Tests 4) Docker 5) Tools 6) Quit`; pick a category number, then the item number inside it (each submenu also has a `Back` entry).

```
# Setup -> Install dependencies
./rebuild-wekan.sh
1        # Setup
1        # Install dependencies

# Setup -> Build WeKan
./rebuild-wekan.sh
1        # Setup
2        # Build WeKan

# Dev server -> localhost:3000
./rebuild-wekan.sh
2        # Dev server
1        # localhost:3000
```
That does:
- **Setup -> Install dependencies** installs dependencies,
- **Setup -> Build WeKan** builds wekan,
- **Dev server -> localhost:3000** starts wekan in development mode with command `meteor`, so it can detect if some file changes and try to rebuild automatically. If a dev server is already running on that port, it is stopped first and a fresh one started on the same port.

And then [register and login](../Login/Adding-users.md) with webbrowser at http://localhost:3000

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
