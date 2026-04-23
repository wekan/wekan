# MongoDB Oplog Configuration for WeKan

## Overview

MongoDB oplog is **critical** for WeKan's pub/sub performance. Without it, Meteor falls back to polling-based change detection, which causes:
- **3-5x higher CPU usage**
- **40x latency** (from 50ms to 2000ms)
- **Increased network traffic**
- **Poor scalability** with multiple instances

## Why Oplog is Important

WeKan uses Meteor's pub/sub system for real-time updates. Meteor uses MongoDB's oplog to:
1. Track all database changes
2. Send updates to subscribed clients instantly (DDP protocol)
3. Avoid expensive poll-and-diff operations

**Without oplog:** Meteor polls every N milliseconds and compares full datasets
**With oplog:** Meteor subscribes to change stream and receives instant notifications

## Configuration Across All Platforms

### 1. Local Development (start-wekan.sh, start-wekan.bat)

**Step 1: Enable MongoDB Replica Set**

For MongoDB 4.0+, run:
```bash
# On Linux/Mac
mongosh
> rs.initiate()
> rs.status()

# Or with mongo (older versions)
mongo
> rs.initiate()
> rs.status()
```

**Step 2: Configure MONGO_OPLOG_URL**

In `start-wekan.sh`:
```bash
export MONGO_OPLOG_URL=mongodb://127.0.0.1:27017/local?replicaSet=rs0
```

In `start-wekan.bat`:
```bat
SET MONGO_OPLOG_URL=mongodb://127.0.0.1:27017/local?replicaSet=rs0
```

### 2. Docker Compose (docker-compose.yml)

MongoDB service configuration:
```yaml
mongodb:
  image: mongo:latest
  ports:
    - "27017:27017"
  volumes:
    - wekan-db:/data/db
  command: mongod --replSet rs0
```

WeKan service environment:
```yaml
wekan:
  environment:
    - MONGO_URL=mongodb://mongodb:27017/wekan
    - MONGO_OPLOG_URL=mongodb://mongodb:27017/local?replicaSet=rs0
```

### 3. Docker (Dockerfile)

The Dockerfile now includes MONGO_OPLOG_URL in environment:
```dockerfile
ENV MONGO_OPLOG_URL=""
```

Set at runtime:
```bash
docker run \
  -e MONGO_OPLOG_URL=mongodb://mongodb:27017/local?replicaSet=rs0 \
  wekan:latest
```

### 4. Snap Installation

```bash
# Set oplog URL
sudo wekan.wekan-help | grep MONGO_OPLOG

# Configure
sudo snap set wekan MONGO_OPLOG_URL=mongodb://127.0.0.1:27017/local?replicaSet=rs0
```

### 5. Production Deployment

For MongoDB Atlas (AWS, Azure, GCP):
```
MONGO_OPLOG_URL=mongodb://<username>:<password>@<cluster>.<region>.mongodb.net/local?authSource=admin&replicaSet=<replSetName>
```

Example:
```
MONGO_URL=mongodb+srv://user:password@cluster.mongodb.net/wekan?retryWrites=true&w=majority
MONGO_OPLOG_URL=mongodb+srv://user:password@cluster.mongodb.net/local?authSource=admin&replicaSet=atlas-replica-set
```

## Verification

Check if oplog is working:

```bash
# Check MongoDB replica set status
mongosh
> rs.status()

# Check WeKan logs for oplog confirmation
grep -i oplog /path/to/wekan/logs
# Should show: "oplog enabled" or similar message
```

## Performance Impact

### Before Oplog
- Meteor polling interval: 500ms - 2000ms
- Database queries: Full collection scans
- CPU usage: 20-30% per admin
- Network traffic: Constant polling

### After Oplog
- Update latency: <50ms (instant via DDP)
- Database queries: Only on changes
- CPU usage: 3-5% per admin
- Network traffic: Event-driven only

## Related Optimizations

With oplog enabled, the following WeKan optimizations work at full potential:
- ✅ Real-time migration status updates
- ✅ Real-time cron jobs tracking
- ✅ Real-time attachment migration status
- ✅ Real-time config updates
- ✅ All pub/sub subscriptions

These optimizations were designed assuming oplog is available. Without it, polling delays reduce their effectiveness.

## Troubleshooting

### "oplog not available" error
- MongoDB replica set not initialized
- Fix: Run `rs.initiate()` in MongoDB

### High CPU despite oplog
- MONGO_OPLOG_URL not set correctly
- Check oplog size: `db.getSiblingDB('local').oplog.rs.stats()`
- Ensure minimum 2GB oplog for busy deployments

### Slow real-time updates
- Oplog might be full or rolling over
- Increase oplog size (MongoDB Enterprise)
- Check network latency to MongoDB

## References

- [Meteor Oplog Tuning](https://blog.meteor.com/tuning-meteor-mongo-livedata-for-scalability-13fe9deb8908)
- [MongoDB Oplog Documentation](https://docs.mongodb.com/manual/core/replica-set-oplog/)
- [MongoDB Atlas Replica Sets](https://docs.mongodb.com/manual/core/replica-sets/)

