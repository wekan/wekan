# Multitenancy

TLDR a) and b)

## a) Oplog sockjs

- One server/Many WeKan domains/One IPv4
- Multitenancy works

docker-compose.yml:
```
- METEOR_REACTIVITY_ORDER=oplog,polling
- DDP_TRANSPORT=uws
```

## b) changeStreams uws

- One server/One WeKan domain/One IPv4

Multitenancy does not work, causes bug: round robin changing
WeKan website at every webpage reload at same address.

For example:

1) At https://boards.wekan.team shows https://wekan.customer2.com
2) Reload webpage. https://boards.wekan.team shows https://wekan.customer3.com
3) Reload webpage. https://boards.wekan.team shows https://wekan.customer4.com
    - 4) Reload webpage. https://boards.wekan.team shows https://customer4.wekan.team
    - etc.

## Details

When multiple Meteor 3 applications are running on the same server using
`network_mode: "host"` and are shared across the same MongoDB server,
the combination `DDP_TRANSPORT=uws` and `METEOR_REACTIVITY_ORDER=changeStreams`
is subject to a very rare but critical **Context/Descriptor Confusion**.

Here is a detailed technical explanation of what is happening behind the scenes and why it breaks a multi-tenant environment:

### 1. µWebSockets (`uws`) and shared host networking

`uws` is an extremely high-performance WebSocket engine written in C++.
It bypasses many of the traditional networking layers of Node.js and
handles network sockets and their file handles (File Descriptors)
directly at a low level in its own Event Loop.

When containers are set to `network_mode: "host"`, they are not
network-level isolated. They share the same Linux kernel
network stack and memory space for network traffic.
When your browser does a WebSocket handshake (`Upgrade: websocket`)
after an HTTP request, `uws` allocates a memory address for the socket.

The bug occurs when multiple containers do this at the same time
in the same host network environment,
**the low-level C++ code in the `uws` engine can cross-identify socket identifiers from different processes**
if the framework (in this case, an early beta integration of Meteor 3)
is unable to keep connection ownership (v8 isolation) completely separate.

### 2. `changeStreams` and data misrouting

MongoDB's `changeStreams` relies on the application opening a long-lived,
real-time listening pipe to the database. It is heavier and more complex
than the old `oplog` table because it creates constantly changing,
stateful cursors between the application and the database.

When this is combined with `uws` WebSocket:

1. User A opens the `boards.wekan.team` page.

2. The browser requests a WebSocket connection, and Meteor creates a
   `changeStream` listener on the database for User A's container.

3. At the same time, User B loads the `kanban.buetzow.de` page.

4. Since both containers talk locally to the same MongoDB process
   and share the same host interface, the application layer's
   reactivity engine (multiplexer) confuses which `changeStream`
   data input belongs to which active `uws` socket address.

**Result:** A reactive data packet from the database (e.g. different customer 1 boards)
is pushed into the `uws` pipe that was locally open to the `boards.wekan.team` browser.
The browser gets a perfectly valid HTML body, but the Javascript layer draws the data
it received from the WebSocket.

### Why did good old `sockjs` and `oplog` fix the situation?

* **`sockjs`** is written in pure JavaScript (Node.js' native network stack).
  It strictly follows Node.js' own process boundaries, and does not perform
  direct C++-level optimizations beyond the kernel. Even though containers
  share the host network, Node.js makes sure that each process's sockets
  remain strictly within its own application window.

* **`oplog`** is a more passive way to read the database. The application
  reads the raw log file (`local.oplog.rs`) and filters its own data from
  there, instead of MongoDB's active `changeStream` engine trying to route
  and load balance cursors between different processes on the fly.

Simply put: `uws` and `changeStreams` are great tools when you are running
**only one large application** on a single server for which you want
maximum performance. In a multi-tenant environment
(many different clients on the same machine), they are too aggressive
and break the invisible boundaries between containers.
