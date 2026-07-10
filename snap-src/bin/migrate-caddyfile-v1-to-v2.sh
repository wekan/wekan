#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Migrate an existing Caddy v1 Caddyfile (left in $SNAP_COMMON by the old WeKan
# snap) to Caddy 2 syntax. Runs before caddy starts (see caddy-control), only
# when caddy is enabled.
#
# Safe by construction:
#   1. If the current file already parses as Caddy 2, it is left untouched.
#   2. The original is always backed up to Caddyfile.v1.bak-<n> before any change.
#   3. The converted file is validated with `caddy adapt`; only a VALID result is
#      kept. If conversion cannot produce valid config, it falls back to a fresh
#      Caddy 2 config from the shipped template ($SNAP/etc/Caddyfile), so caddy
#      always starts with valid configuration.
# ─────────────────────────────────────────────────────────────────────────────
set -u

CADDY="${CADDY:-$SNAP/bin/caddy}"
CADDYFILE="${1:-$SNAP_COMMON/Caddyfile}"
TEMPLATE="$SNAP/etc/Caddyfile"

[ -f "$CADDYFILE" ] || exit 0        # nothing to migrate

adapt_ok() { env LC_ALL=C "$CADDY" adapt --config "$1" --adapter caddyfile >/dev/null 2>&1; }

# Already valid Caddy 2 config? Leave it alone.
if adapt_ok "$CADDYFILE"; then
    exit 0
fi

echo "Existing $CADDYFILE is not valid Caddy 2 config; migrating from Caddy v1 format..."

# Back up the original (never overwrite an existing backup).
i=0
while [ -e "${CADDYFILE}.v1.bak-${i}" ]; do i=$((i + 1)); done
cp -a "$CADDYFILE" "${CADDYFILE}.v1.bak-${i}"
echo "  backed up original to ${CADDYFILE}.v1.bak-${i}"

# Best-effort Caddy v1 -> v2 conversion for WeKan's simple reverse-proxy config:
#   - drop the http:// / https:// scheme prefix from site addresses
#   - "proxy / TARGET"        -> "reverse_proxy TARGET"
#   - drop the v1 "websocket" and "transparent" proxy presets (Caddy 2's
#     reverse_proxy handles WebSockets and X-Forwarded-* by default)
#   - "gzip"                  -> "encode gzip"
tmp="$(mktemp)"
sed -E \
    -e 's#^([[:space:]]*)https?://#\1#' \
    -e 's#\bproxy[[:space:]]+/[[:space:]]+([^ {]+)#reverse_proxy \1#' \
    -e '/^[[:space:]]*(websocket|transparent)[[:space:]]*$/d' \
    -e 's#\bgzip\b#encode gzip#' \
    "$CADDYFILE" > "$tmp"

if adapt_ok "$tmp"; then
    mv "$tmp" "$CADDYFILE"
    echo "  converted $CADDYFILE to Caddy 2 format."
else
    rm -f "$tmp"
    echo "  automatic conversion did not yield valid Caddy 2 config;"
    if [ -f "$TEMPLATE" ]; then
        cp -a "$TEMPLATE" "$CADDYFILE"
        echo "  regenerated a default Caddy 2 config from $TEMPLATE (review $CADDYFILE)."
    else
        echo "  WARNING: no template at $TEMPLATE; leaving the backed-up original in place." >&2
    fi
fi
