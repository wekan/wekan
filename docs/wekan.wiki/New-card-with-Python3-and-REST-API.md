Wekan provides a python script to ease the call of the REST API from command line interface.

# Context

- [API Login to get Bearer token](REST-API#example-call---as-form-data)
- [API docs and examples for various programming languages](https://wekan.github.io/api/), there is Boards / Export for exporting board with API
- In the right menu, scroll down REST API Docs etc links =====>
- Wekan-Gogs integration with Node.js https://github.com/wekan/wekan-gogs

# Install

You need python3.

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

# Usage

Copy the api.py script to you machine. [Newest Wekan Python CLI api.py here](https://raw.githubusercontent.com/wekan/wekan/master/api.py).

Then, in this script, look for and change:
- wekanurl: https://boards.example.com => Your Wekan URL
- username (could be username or username@example.com)
- Only works with password login admin user. Does not work with LDAP, OAuth2 etc.

Keep in mind your Wekan credentials are potentially accessible in this file.

Then call it without any argument to see if everything is all right. You should just get usage examples.
