#!/bin/bash
set -euxo pipefail

#!/bin/bash

set -euo pipefail

# This file will store the config env variables needed by the app
readonly CONF=/build/env.config

# EMAIL_URL can also be set here by injecting another env variable in the template
# ROOT_URL can also be set at runtime, by querying AWS api or by using ingress annotations in the template for k8s.

cat >"${CONF}" <<'EOF'
export MONGO_URL=mongodb://{{DATABASE_USER}}:{{DATABASE_PASSWORD}}@{{DATABASE_HOST}}:{{DATABASE_PORT}}/{{DATABASE_NAME}}
export ROOT_URL=http://localhost
export PORT=3000
EOF

sed -i -e "s/{{DATABASE_USER}}/${DATABASE_USER}/" "${CONF}"
sed -i -e "s/{{DATABASE_PASSWORD}}/${DATABASE_PASSWORD}/" "${CONF}"
sed -i -e "s/{{DATABASE_HOST}}/${DATABASE_HOST}/" "${CONF}"
sed -i -e "s/{{DATABASE_PORT}}/${DATABASE_PORT}/" "${CONF}"
sed -i -e "s/{{DATABASE_NAME}}/${DATABASE_NAME}/" "${CONF}"

