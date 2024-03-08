Also see:
- [API Login to get Bearer token](REST-API#example-call---as-form-data)
- [API docs and examples for various programming languages](https://wekan.github.io/api/), there is Boards / Export for exporting board with API
- In the right menu, scroll down REST API Docs etc links =====>
- Wekan-Gogs integration with Node.js https://github.com/wekan/wekan-gogs

# Install

Windows
```
choco install python3
# REBOOT
pip3 install pip --upgrade
pip3 install json
python3 wekan.py
```
Debian/Ubuntu
```
sudo apt-get -y install python3 python3-pip python3-simplejson
sudo pip3 install pip --upgrade
chmod +x wekan.py
./wekan.py
```

# api.py creating new card with Python3 and REST API

Below code works now, fixed at 2020-10-29.

Change these:
- wekanurl: https://boards.example.com => Your Wekan URL
- username (could be username or username@example.com)
- Only works with password login admin user. Does not work with LDAP, OAuth2 etc.

[Newest Wekan Python CLI api.py here](https://raw.githubusercontent.com/wekan/wekan/master/api.py)
