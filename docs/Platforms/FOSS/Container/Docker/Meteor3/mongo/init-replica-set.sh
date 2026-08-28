#!/bin/bash
set -euo pipefail

# Initialize the single-node MongoDB replica set used by Meteor reactivity.
# Before the first admin exists MongoDB's localhost exception permits this;
# later runs reuse the saved admin URL and are harmless.
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ADMIN_FILE="${ROOT_DIR}/admin.txt"
MONGO_ADMIN_URL="mongodb://127.0.0.1:27017/admin"
if [ -f "$ADMIN_FILE" ]; then
  MONGO_ADMIN_URL="$(sed -n 's/^MONGO_URL=//p' "$ADMIN_FILE" | head -n 1)"
fi

mongosh "$MONGO_ADMIN_URL" --quiet --eval '
  try {
    const status = rs.status();
    if (status.ok !== 1) quit(1);
  } catch (error) {
    if (error.codeName !== "NotYetInitialized" &&
        !String(error.message).match(/not yet initialized|no replset config/i)) {
      throw error;
    }
    rs.initiate({ _id: "rs0", members: [{ _id: 0, host: "127.0.0.1:27017" }] });
  }
'

for _ in $(seq 1 60); do
  if mongosh "$MONGO_ADMIN_URL" --quiet --eval \
    'quit(db.hello().isWritablePrimary ? 0 : 1)' >/dev/null 2>&1; then
    echo "MongoDB replica set rs0 is writable."
    exit 0
  fi
  sleep 1
done

echo "MongoDB replica set rs0 did not elect a writable primary." >&2
exit 1
