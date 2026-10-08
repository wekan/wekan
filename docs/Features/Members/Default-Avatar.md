# Default avatar

A user who has not uploaded an avatar is shown with their initials. With
`DEFAULT_AVATAR_URL` set, WeKan shows an image from a server you choose
instead (#824) - for example the photos on an intranet server, or a
Gravatar-style service. It is set in the environment only (Docker, snap,
`start-wekan.sh` / `.bat`); there is no Admin Panel field, as the maintainer
asked.

The value is a URL template:

| Placeholder | Replaced with |
| --- | --- |
| `{username}` | the WeKan username |
| `{userId}` | the WeKan user id |
| `{emailMd5}` | MD5 of the user's first email, trimmed and lower-cased |
| `{emailSha256}` | SHA-256 of it |

```bash
DEFAULT_AVATAR_URL=http://192.168.1.200/avatars/{username}.png
DEFAULT_AVATAR_URL=https://gravatar.example/avatar/{emailSha256}?d=404
snap set wekan default-avatar-url='http://192.168.1.200/avatars/{username}.png'
```

Every value is URL-encoded, and only an `http` or `https` template is used.
The server fetches nothing: `/avatar-default/<userId>` redirects the browser
to the address, so whether that server may be reached - and what it learns -
is the administrator's choice. An avatar a user uploads always wins, and when
the default image does not load the initials are shown again.

Note that an outside avatar service learns which of your users are viewed
when; for GDPR reasons the maintainer recommends a server inside your own
network.
