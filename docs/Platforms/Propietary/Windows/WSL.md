https://learn.microsoft.com/en-us/windows/wsl/install

```
wsl --install

wsl --list --online

wsl --install -d Ubuntu-22.04
```

https://ubuntu.com/blog/ubuntu-wsl-enable-systemd

## If GitHub problems in WSL

If you have these problems in WSL:
```
~/repos/wekan$ git pull
ssh: Could not resolve hostname github.com: Name or service not known
fatal: Could not read from remote repository.

Please make sure you have the correct access rights
and the repository exists.
```
Then edit `/etc/wsl.conf`:
```
sudo nano /etc/wsl.conf
```
There have these:
```
[boot]
systemd=true

[network]
generateResolvConf = false
```
Then edit `/etc/resolf.conf`:
```
sudo nano /etc/resolv.conf
```
There have for example this, CloudFlare nameserver:
```
nameserver 1.1.1.1
```
Then edit Windows Internet network settings. There:
- Have only IPv4 enabled (not IPv6)
- DNS: 1.1.1.1 with HTTPS Automatic encryption settings.

## WeKan Snap amd64 on WSL2

1. At https://ubuntu.com/blog/ubuntu-wsl-enable-systemd read `How to enable systemd in Ubuntu WSL` to install WSL2 and SystemD.

2. `sudo snap install wekan --channel=latest/candidate`

3. Your Windows computer IP address, change there: `sudo snap set wekan root-url='http://192.168.0.200'`

4. Your Windows compoter webserver port: `sudo snap set wekan port='80'`

5. Use Chromium Edge (or Chromium/Firefox/Safari based browsers) to browse http://192.168.0.200 (your computer IP address there)

6. For mobile devices, make PWA icon like https://github.com/wekan/wekan/wiki/PWA

7. Optional: For SSL/TLS, look at Caddy/Apache/Nginx configs at https://github.com/wekan/wekan/wiki right menu, and https://github.com/wekan/wekan/wiki/Settings

## Related

- https://github.com/wekan/wekan/wiki/Offline
- https://ubuntu.com/blog/ubuntu-wsl-enable-systemd
- https://github.com/wekan/wekan-snap/wiki/Install
- https://github.com/wekan/wekan/wiki/Windows