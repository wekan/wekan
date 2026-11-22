# Google Cloud

## What it is

This page is about running WeKan on Google Cloud. It is not a login method:
to sign in to WeKan with a Google account, see [Google login](Google-login.md)
and [OAuth providers](OAuth-Providers.md). The one thing known about hosting
WeKan on Google Cloud is that it needs working WebSockets: WeKan's browser
page talks to the server over a WebSocket (Meteor's DDP), so whichever Google
Cloud product or load balancer serves WeKan must pass WebSockets through.
How to enable that on each Google Cloud product still needs more info.

## Read more

- [WebSocket on Wikipedia](https://en.wikipedia.org/wiki/WebSocket)
- [Google Cloud Run: Using WebSockets](https://cloud.google.com/run/docs/triggering/websockets)
- WeKan: [Google login](Google-login.md), [OAuth providers](OAuth-Providers.md),
  [Let's Encrypt and Google Auth](Let's-Encrypt-and-Google-Auth.md)

## How to use it

1. Deploy WeKan with the [Docker](../../Platforms/FOSS/Container/Docker)
   image on the Google Cloud product you use.
2. Make sure WebSockets reach WeKan through every proxy and load balancer in
   front of it.
3. Set `ROOT_URL` to the address people open WeKan at.

## How the numbers are calculated

This page has no numbers.

## How it works in WeKan

WeKan has no Google Cloud specific code. The browser keeps one DDP WebSocket
connection to the server (`/sockjs/...`); without it the page cannot load
boards.

## Commits

There are no commits of a Google Cloud feature. The page came with the
WeKan wiki:

 - [Added docs from wekan.wiki and wekan-snap.wiki](https://github.com/wekan/wekan/commit/73ae73d4c38640e9daedbe8ef9e5b25b877ee804)
