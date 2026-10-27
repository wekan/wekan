# ifdata -pa eth0
# `ip` is Linux (iproute2); macOS and the BSDs have ifconfig.
if command -v ip >/dev/null 2>&1; then
    ip address
else
    ifconfig
fi
