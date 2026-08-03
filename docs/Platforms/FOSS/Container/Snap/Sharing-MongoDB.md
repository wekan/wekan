## Share MongoDB to other snaps

- connect mongodb-slot with plug from corresponding snap(s)
- configure corresponding service to use mongodb unix socket in shared directory, socket file name is: mongodb-.sock

## Sharing MongoDB from other snap to wekan
- connect mongodb-plug with slot from snap providing mongodb
- disable mongodb in wekan by calling:

```
$ snap set wekan set disable-mongodb='true'
```

- set mongodb-bind-unix-socket to point to serving mongodb. Use relative path inside shared directory, e.g run/mongodb-27017.sock
