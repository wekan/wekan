## Install

On [Ubuntu Core KVM Download page](https://ubuntu.com/download/kvm) local x64 VM:

```
ssh -p 8022 username@localhost

snap install wekan

snap set wekan root-url='http://localhost:8090'

snap set wekan port='80'
```
Then Wekan is visible at http://localhost:8090

[Adding users](Adding-users)

List of Wekan Snap settings:
```
wekan.help | less
```

More info about Wekan Snap [Snap Install page](https://github.com/wekan/wekan-snap/wiki/Install) and right menu on that page.

[Documentation](https://github.com/wekan/wekan/wiki)