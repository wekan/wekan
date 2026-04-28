1. At Windows, sync to ntp timeserver. Examples:
  - `time.windows.com`
  - `ntp.ubuntu.com`
  - `ntp1.kolumbus.fi`

2. Dual boot to Qubes OS. At desktop top right calendar/time, set timezone to Etc/UTC.

3. At server and it's KVM VMs, edit `/etc/timezone` to `Etc/UTC`.

4. Update time at server:

```
sudo apt -y install ntpdate

sudo ntpdate ntp.ubuntu.com
```

5. Now local time shows correctly at webbrowser, like for example at Friend Desktop https://github.com/wekan/wekan/wiki/Friend

For testing any other time related code, that it shows correct local time, compare time functions results to this:

https://github.com/FriendUPCloud/friendup/blob/master/interfaces/web_desktop/apps/Convos/Scripts/chatlog.fui.js#L694

From Hogle Titlestad:

> Oh, and the most important thing.
> The first argument is a time string.
> Seconds. Not a normal date.
> Such that you can subtracck and add seconds to it.
> So input would be:
> ```
> this.parseDate( 1695981700956, false, 'Europe/Oslo' );
> ``` 
> e.g. Europe/Oslo is the server time zone.
> The timestamp is server time.
> For the event in question.


