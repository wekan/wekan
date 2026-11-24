# Timezone

## What it is

WeKan stores every date in UTC and shows it in the time zone of the web browser
that reads it. So when times look wrong, it is almost always the clock or the
time zone of the server, the virtual machine or the computer of the browser
that is off. This page is a checklist for getting those right, and says how
WeKan itself turns a stored time into the time you see.

## Read more

- [Network Time Protocol](https://en.wikipedia.org/wiki/Network_Time_Protocol),
  [Coordinated Universal Time](https://en.wikipedia.org/wiki/Coordinated_Universal_Time)
  and the [tz database](https://en.wikipedia.org/wiki/Tz_database) (the IANA zone
  names such as `Europe/Oslo`) on Wikipedia.
- WeKan pages: [Board Settings / Date](../Board-Sidebar/Board-Settings/Date.md)
  for the date format, and [Friend](../../Platforms/FOSS/Container/Docker/Friend).

## How to use it

**Make the clocks right.**

1. At Windows, sync to ntp timeserver. Examples:
   - `time.windows.com`
   - `ntp.ubuntu.com`
   - `ntp1.kolumbus.fi`
2. Dual boot to Qubes OS. At desktop top right calendar/time, set timezone to
   Etc/UTC.
3. At server and its KVM VMs, edit `/etc/timezone` to `Etc/UTC`.
4. Update time at server:

   ```
   sudo apt -y install ntpdate

   sudo ntpdate ntp.ubuntu.com
   ```

5. Now local time shows correctly at webbrowser, like for example at Friend
   Desktop [Friend](../../Platforms/FOSS/Container/Docker/Friend).

**Testing other time related code.** For testing any other time related code,
that it shows correct local time, compare time functions results to this:

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

## How the numbers are calculated

A stored date is a UTC instant. In the browser it is shown with the browser's
own zone (`Date.getHours()` and so on). Where a date is printed on the server,
for PDF and Excel exports, `formatDateByUserPreference(date, format,
includeTime, timeZone)` in [imports/lib/dateUtils.js](../../../imports/lib/dateUtils.js)
reads the year, month, day, hours and minutes in the given IANA zone with
`Intl.DateTimeFormat` (24-hour clock; an hour reported as `24` is shown as
`00`). The format is `YYYY-MM-DD`, `DD-MM-YYYY` or `MM-DD-YYYY`, with ` HH:MM`
after it unless the format ends in `-date-only`. A zone the runtime does not
know falls back to the process's own zone.

## How it works in WeKan

- A user profile has no time zone setting. For a server-rendered export the
  browser sends its zone, `Intl.DateTimeFormat().resolvedOptions().timeZone`
  (`browserTimezone()` in [client/lib/exportLocale.js](../../../client/lib/exportLocale.js)),
  together with the language and date format (#6586, "-2h wrong for
  Europe/Berlin").
- Without a zone the card PDF renders UTC and says `UTC` after the time
  (`formatDateValue()` in [models/server/ExporterCardPDF.js](../../../models/server/ExporterCardPDF.js)),
  so the result does not depend on how the server was started.
- Notification schedules have their own optional `timezone`, checked with
  `Intl.DateTimeFormat` in [models/lib/notificationDelivery.js](../../../models/lib/notificationDelivery.js).

## Commits

 - [Card PDF and Excel exports in the reader's language, format and time zone](https://github.com/wekan/wekan/commit/698e980e27522b53f60ad6fce347727cb11eb017)
