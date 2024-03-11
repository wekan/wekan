## Standalone Wekan: Snap, (Docker, Source, VirtualBox)

1) [Install Wekan Snap](https://github.com/wekan/wekan-snap/wiki/Install)

2) Go to your Wekan URL like https://example.com/sign-up (your address + /sign-up)

3) Register your username, email address and password. First registered user will be admin, and next ones normal users. If you want other admins too, you can change their permission to admin at Admin Panel.

4) **If you get Internal Server Error when creating account, it's because you have not configured email, and you can ignore it. WORKING EMAIL IS NOT REQUIRED. Wekan works without setting up email.**

If you really want email sending, do for example:
```
sudo snap set wekan mail-url='smtps://user:pass@mailserver.example.com:457/'
sudo snap set wekan mail-from='Example Wekan Support <support@example.com>'
```
For more options see [Troubleshooting Email](Troubleshooting-Mail)

5) Login to Wekan at https://example.com/sign-in (your address + /sign-in)

6) Click on top right your username / Admin Panel. You can change permissions, name, email address and password in Admin Panel.

![Admin Panel](https://wekan.github.io/wekan-admin-panel.png)

7) For registering other users:

a) Let them self-register, or open webbrowser incongnito window, and register them at https://example.com/sign-up (your address + /sign-up)

b) If your email works, click Admin Panel / Settings / Registration / [X] Disable self-registration. Then invite new users to selected boards by email address.

## Deleting Users

[No delete feature yet](https://github.com/wekan/wekan/issues/1289)