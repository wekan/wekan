#!/bin/bash
# localhost-limit.sh - limit each WeKan container's localhost access to its own
# Node.js port and its database port only.
#
#   ./localhost-limit.sh [--host <ssh host>] [plan|apply|remove|status]
#
#   plan     what was found, and the rules; changes nothing (the default)
#   apply    replace the rules with the plan (as root on the server)
#   remove   remove the rules
#   status   the rules now in place
#
# Where it runs. Without --host, on this machine: this machine is the server.
# With --host (build.sh passes the server of its settings), the server is
# reached over SSH, and only for what is ON the server: its running containers
# (docker ps, docker inspect, their cgroups), its /etc/caddy/Caddyfile, and its
# firewall. The settings - 1createdb.sh, the customers' <name>.txt and
# restore/<name>/docker-compose.yml - are read HERE, in this directory, because
# they and their passwords are not necessarily copied to the server. Everything
# from the server comes back in one SSH call, and the rules go in one more.
#
# Why this way. The containers of this setup run with network_mode: host
# (restore/docker-start.yml), so they share the server's network: every
# customer's WeKan could open every other customer's 127.0.0.1:<port>, and any
# other local service. They cannot be told apart by address, but each one is a
# cgroup of its own, and the kernel knows which cgroup a socket belongs to. So:
# an iptables chain WEKAN-LOCALHOST, jumped to from OUTPUT for traffic to the
# loopback interface (every connection to a local address goes through lo,
# also one to the server's public address), lets a container's socket
#   - answer connections made to it (Caddy -> WeKan, established),
#   - connect to its own PORT,
#   - connect to the database port(s) in its MONGO_URL / MONGO_OPLOG_URL,
#   - ask the local DNS resolver (port 53),
# and rejects everything else it sends to a local port. Caddy and MongoDB are
# not in a container's cgroup, so Caddy -> WeKan and WeKan -> MongoDB work as
# before. Outgoing internet traffic (mail, webhooks) is not touched. Which
# database a container may read is still decided by MongoDB: each customer's
# user has rights to its own database only (1createdb.sh).
#
# Where the ports come from, compared and shown:
#   - the server's docker ps: running containers named *-app or *-tenant
#     (NAME_PATTERN), their PORT, MONGO_URL and MONGO_OPLOG_URL (docker inspect);
#   - here: restore/<customer>/docker-compose.yml - container_name, PORT,
#     MONGO_URL - used when a container's own environment has no PORT;
#   - the server's /etc/caddy/Caddyfile: "import wekan_proxy <port>" and
#     "reverse_proxy 127.0.0.1:<port>" / "localhost:<port>";
#   - here: 1createdb.sh's MONGO_PORT, and the <customer>.txt files it writes.
# A Caddyfile port with no container, or a container port Caddy does not
# proxy, is reported.
#
# A recreated container (update-docker-settings.sh, update-wekan-version.sh) has
# a new id and so a new cgroup: run "apply" again after those. The rules are
# not saved across a reboot; run "apply" after the containers have started.

set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
NAME_PATTERN="${NAME_PATTERN:-(-app|-tenant)\$}"
# On the server; the defaults are the real places, the tests point them elsewhere.
CADDYFILE="${CADDYFILE:-/etc/caddy/Caddyfile}"
PROC_ROOT="${PROC_ROOT:-/proc}"
CGROUP_ROOT="${CGROUP_ROOT:-/sys/fs/cgroup}"
DOCKER="${DOCKER:-docker}"
IPTABLES="${IPTABLES:-iptables}"
IP6TABLES="${IP6TABLES:-ip6tables}"
CHAIN=WEKAN-LOCALHOST
DEFAULT_MONGO_PORT=27017

SSH_HOST=""
if [ "${1:-}" = "--host" ]; then SSH_HOST="${2:-}"; shift 2 || true; fi
if [ -n "$SSH_HOST" ] && [[ ! "$SSH_HOST" =~ ^[A-Za-z0-9._@-]+$ || "$SSH_HOST" == -* ]]; then
	echo "Error: not a host name: $SSH_HOST" >&2; exit 2
fi

where() { if [ -n "$SSH_HOST" ]; then printf '%s (over SSH)' "$SSH_HOST"; else printf 'this machine'; fi; }

# on_server: the script on stdin runs on the server - over SSH, or here.
on_server() {
	if [ -n "$SSH_HOST" ]; then ssh -- "$SSH_HOST" bash -s; else bash -s; fi
}

# --- reading the settings (here) ------------------------------------------------

is_port() { [[ "$1" =~ ^[0-9]{1,5}$ ]] && [ "$1" -ge 1 ] && [ "$1" -le 65535 ]; }

# The ports of the hosts in a mongodb:// URL that are on the server itself
# (localhost, 127.x, ::1); a host elsewhere is not localhost traffic.
mongo_ports() {
	local url="$1" hosts h port list
	[ -n "$url" ] || return
	url="${url#*://}"; url="${url#*@}"; hosts="${url%%/*}"; hosts="${hosts%%\?*}"
	[ -z "$hosts" ] && return
	IFS=',' read -r -a list <<< "$hosts"
	for h in "${list[@]}"; do
		case "$h" in
			\[*\]:*) port="${h##*]:}"; h="${h%%]:*}]" ;;
			\[*\]) port="$DEFAULT_MONGO_PORT" ;;
			*:*) port="${h##*:}"; h="${h%:*}" ;;
			*) port="$DEFAULT_MONGO_PORT" ;;
		esac
		case "$h" in
			localhost|127.*|\[::1\]|::1) is_port "$port" && echo "$port" ;;
		esac
	done
}

# env_value <name> <lines of NAME=value>
env_value() { printf '%s\n' "$2" | sed -n "s/^[ \t-]*$1=//p" | head -n 1 | tr -d '\r'; }

# compose_field <container name> <NAME>: from restore/*/docker-compose.yml here.
compose_field() {
	local f
	for f in "$HERE"/restore/*/docker-compose.yml; do
		[ -f "$f" ] || continue
		grep -qE "container_name:[ \t]*\"?$1\"?[ \t]*$" "$f" || continue
		env_value "$2" "$(cat "$f")"
		return
	done
}

compose_ports() {
	local f
	for f in "$HERE"/restore/*/docker-compose.yml; do
		[ -f "$f" ] && env_value PORT "$(cat "$f")"
	done | grep -E '^[0-9]+$' | sort -un
}

createdb_mongo_ports() {
	local p f
	p="$(sed -n 's/^MONGO_PORT=\([0-9]*\).*/\1/p' "$HERE/1createdb.sh" 2>/dev/null | head -n 1)"
	[ -n "$p" ] && echo "$p"
	for f in "$HERE"/*.txt; do
		[ -f "$f" ] || continue
		mongo_ports "$(env_value MONGO_URL "$(cat "$f")")"
	done | sort -un
}

# --- reading the server (one call) ------------------------------------------------

# What runs on the server to describe it. Nothing in it writes.
gather_script() {
	printf 'DOCKER=%q CADDYFILE=%q PROC_ROOT=%q CGROUP_ROOT=%q\n' "$DOCKER" "$CADDYFILE" "$PROC_ROOT" "$CGROUP_ROOT"
	cat <<'EOS'
echo "@uid $(id -u)"
if [ -e "$CGROUP_ROOT/cgroup.controllers" ]; then echo "@cgroupv2 yes"; else echo "@cgroupv2 no"; fi
if [ -r "$CADDYFILE" ]; then echo "@caddy"; cat "$CADDYFILE"; echo; echo "@end"; else echo "@nocaddy"; fi
if command -v "$DOCKER" >/dev/null 2>&1; then
	"$DOCKER" ps --format '{{.ID}} {{.Names}}' 2>/dev/null | while read -r id name; do
		[ -n "$id" ] || continue
		pid="$("$DOCKER" inspect -f '{{.State.Pid}}' "$id" 2>/dev/null)"
		echo "@container $id $name"
		cg=""
		case "$pid" in ''|*[!0-9]*) ;; *) [ -r "$PROC_ROOT/$pid/cgroup" ] && cg="$(sed -n 's/^0::\(.*\)$/\1/p' "$PROC_ROOT/$pid/cgroup" | head -n 1)" ;; esac
		echo "@cgroup $cg"
		echo "@env"
		"$DOCKER" inspect -f '{{range .Config.Env}}{{println .}}{{end}}' "$id" 2>/dev/null | grep -E '^(PORT|MONGO_URL|MONGO_OPLOG_URL)='
		echo "@end"
	done
else
	echo "@nodocker"
fi
EOS
}

SERVER_UID=""; SERVER_CGROUPV2=""; CADDY_TEXT=""; SERVER_HAS_DOCKER=yes; SERVER_HAS_CADDY=yes
CONTAINERS=()   # name|id|cgroup path|own port|mongo port,port

read_server() {
	local out line section="" id="" name="" cg="" envs="" port mongo
	if ! out="$(gather_script | on_server)"; then
		echo "Error: could not read $(where)." >&2; exit 1
	fi
	CONTAINERS=(); CADDY_TEXT=""
	flush_container() {
		[ -n "$id" ] || return 0
		if [[ "$name" =~ $NAME_PATTERN ]]; then
			port="$(env_value PORT "$envs")"
			is_port "${port:-x}" || port="$(compose_field "$name" PORT)"
			mongo="$( { mongo_ports "$(env_value MONGO_URL "$envs")"; mongo_ports "$(env_value MONGO_OPLOG_URL "$envs")"; } | sort -un | paste -sd, -)"
			[ -n "$mongo" ] || mongo="$( { mongo_ports "$(compose_field "$name" MONGO_URL)"; mongo_ports "$(compose_field "$name" MONGO_OPLOG_URL)"; } | sort -un | paste -sd, -)"
			CONTAINERS+=("$name|$id|$cg|$port|$mongo")
		fi
		id=""; name=""; cg=""; envs=""
	}
	while IFS= read -r line; do
		case "$section" in
			caddy) if [ "$line" = "@end" ]; then section=""; else CADDY_TEXT+="$line"$'\n'; fi; continue ;;
			env) if [ "$line" = "@end" ]; then section=""; else envs+="$line"$'\n'; fi; continue ;;
		esac
		case "$line" in
			"@uid "*) SERVER_UID="${line#@uid }" ;;
			"@cgroupv2 "*) SERVER_CGROUPV2="${line#@cgroupv2 }" ;;
			"@caddy") section=caddy ;;
			"@nocaddy") SERVER_HAS_CADDY=no ;;
			"@nodocker") SERVER_HAS_DOCKER=no ;;
			"@container "*) flush_container; read -r _ id name <<< "$line" ;;
			"@cgroup "*) cg="${line#@cgroup }" ;;
			"@cgroup") cg="" ;;
			"@env") section=env ;;
		esac
	done <<< "$out"
	flush_container
}

caddy_ports() {
	printf '%s' "$CADDY_TEXT" | sed -e 's/#.*//' \
		| grep -oE 'import[ \t]+wekan_proxy[ \t]+[0-9]+|reverse_proxy[ \t]+(127\.0\.0\.1|localhost|\[::1\]):[0-9]+' \
		| grep -oE '[0-9]+$' | sort -un
}

part() { local p; IFS='|' read -r -a p <<< "$1"; printf '%s' "${p[$(($2 - 1))]:-}"; }

# --- the rules ----------------------------------------------------------------

# The rule arguments, one rule per line.
rules() {
	local entry name cgroup port mongo m ms
	for entry in "${CONTAINERS[@]}"; do
		name="$(part "$entry" 1)"; cgroup="$(part "$entry" 3)"; port="$(part "$entry" 4)"; mongo="$(part "$entry" 5)"
		[ -n "$cgroup" ] && is_port "${port:-x}" || continue
		# A cgroup path is /a/b.scope: nothing the shell would split or expand.
		[[ "$cgroup" =~ ^/[A-Za-z0-9._/@:-]+$ ]] || continue
		[[ "$name" =~ ^[A-Za-z0-9._-]+$ ]] || name=container
		local c="-m cgroup --path $cgroup -m comment --comment wekan:$name"
		echo "$c -m conntrack --ctstate ESTABLISHED,RELATED -j RETURN"
		echo "$c -p tcp --dport $port -j RETURN"
		IFS=',' read -r -a ms <<< "${mongo:-$DEFAULT_MONGO_PORT}"
		for m in "${ms[@]}"; do echo "$c -p tcp --dport $m -j RETURN"; done
		echo "$c -p udp --dport 53 -j RETURN"
		echo "$c -p tcp --dport 53 -j RETURN"
		echo "$c -p tcp -j REJECT --reject-with tcp-reset"
		echo "$c -j REJECT"
	done
}

show_plan() {
	local entry caddy compose found problems=0 name port mongo cgroup
	echo "Server: $(where). Settings: $HERE"
	[ "$SERVER_HAS_DOCKER" = yes ] || { echo "  ! docker was not found on the server"; problems=1; }
	echo "Containers (docker ps on the server, names matching $NAME_PATTERN):"
	if [ "${#CONTAINERS[@]}" -eq 0 ]; then echo "  none found"; fi
	for entry in "${CONTAINERS[@]}"; do
		name="$(part "$entry" 1)"; cgroup="$(part "$entry" 3)"; port="$(part "$entry" 4)"; mongo="$(part "$entry" 5)"
		printf '  %-28s port %-6s database %-14s cgroup %s\n' "$name" "${port:-?}" "${mongo:-$DEFAULT_MONGO_PORT}" "${cgroup:-?}"
		if ! is_port "${port:-x}"; then echo "    ! no PORT in its environment or here in restore/*/docker-compose.yml: left without rules"; problems=1; fi
		if [ -z "$cgroup" ]; then echo "    ! its cgroup could not be read: left without rules"; problems=1; fi
	done
	caddy="$(caddy_ports | paste -sd' ' -)"
	compose="$(compose_ports | paste -sd' ' -)"
	if [ "$SERVER_HAS_CADDY" = yes ]; then echo "Caddy proxies to ($CADDYFILE on the server): ${caddy:-nothing found}"
	else echo "Caddy: $CADDYFILE was not found on the server"; fi
	echo "restore/*/docker-compose.yml PORTs here: ${compose:-none}"
	echo "1createdb.sh database ports here: $(createdb_mongo_ports | paste -sd' ' -)"
	found=" $(for entry in "${CONTAINERS[@]}"; do part "$entry" 4; echo; done | paste -sd' ' -) "
	for port in $caddy; do
		case "$found" in *" $port "*) ;; *) echo "  ! Caddy proxies to $port, but no running WeKan container has that PORT"; problems=1 ;; esac
	done
	for entry in "${CONTAINERS[@]}"; do
		port="$(part "$entry" 4)"
		case " $caddy " in *" $port "*) ;; *) [ -n "$caddy" ] && { echo "  ! $(part "$entry" 1) listens on $port, which the Caddyfile does not proxy"; problems=1; } ;; esac
	done
	echo
	echo "Rules ($CHAIN, jumped to from OUTPUT -o lo, for IPv4 and IPv6):"
	local r n=0
	while read -r r; do [ -n "$r" ] && { echo "  -A $CHAIN $r"; n=$((n + 1)); }; done < <(rules)
	[ "$n" -eq 0 ] && echo "  none: nothing to limit"
	return $problems
}

need_root() {
	if [ "$SERVER_UID" != 0 ] && [ -z "${LOCALHOST_LIMIT_NOT_ROOT_OK:-}" ]; then
		echo "Error: the firewall of $(where) is changed as root: sign in as root (sudo su, or root in ~/.ssh/config)." >&2; exit 1
	fi
}

need_cgroup_v2() {
	if [ "$SERVER_CGROUPV2" != yes ]; then
		echo "Error: $(where) does not use cgroup v2 ($CGROUP_ROOT/cgroup.controllers is missing);" >&2
		echo "the rules match a container by its cgroup v2 path." >&2; exit 1
	fi
}

# The script that puts the rules in place, run on the server. The new chain is
# built beside the old one and then the jump is swapped, so there is no moment
# without rules; a rule the firewall refuses leaves the old rules as they were.
apply_script() {
	local t r
	printf 'set -u\nfail=0\n'
	for t in "$IPTABLES" "$IP6TABLES"; do
		printf 'if command -v %q >/dev/null 2>&1; then\n' "$t"
		printf '  T=%q; C=%q\n' "$t" "$CHAIN"
		cat <<'EOS'
  "$T" -N "$C-new" 2>/dev/null || "$T" -F "$C-new"
  ok=1
EOS
		while read -r r; do
			[ -n "$r" ] || continue
			printf '  [ $ok = 1 ] && { "$T" -A "$C-new" %s || { echo "  ! $T refused: %s" >&2; ok=0; }; }\n' "$r" "$r"
		done < <(rules)
		cat <<'EOS'
  if [ $ok = 1 ]; then
    "$T" -I OUTPUT 1 -o lo -j "$C-new"
    while "$T" -C OUTPUT -o lo -j "$C" 2>/dev/null; do "$T" -D OUTPUT -o lo -j "$C"; done
    "$T" -F "$C" 2>/dev/null; "$T" -X "$C" 2>/dev/null
    "$T" -E "$C-new" "$C"
    echo "  $T: $("$T" -S "$C" 2>/dev/null | grep -c -- '^-A') rules in $C"
  else
    "$T" -F "$C-new"; "$T" -X "$C-new"; fail=1
  fi
else
  echo "  $T not found: skipped"
fi
EOS
	done
	printf 'exit $fail\n'
}

remove_script() {
	local t
	for t in "$IPTABLES" "$IP6TABLES"; do
		printf 'if command -v %q >/dev/null 2>&1; then T=%q; C=%q\n' "$t" "$t" "$CHAIN"
		cat <<'EOS'
  while "$T" -C OUTPUT -o lo -j "$C" 2>/dev/null; do "$T" -D OUTPUT -o lo -j "$C"; done
  "$T" -F "$C" 2>/dev/null; "$T" -X "$C" 2>/dev/null
fi
EOS
	done
}

# ufw (Ubuntu) accepts all loopback traffic in ufw-before-output
# (-o lo -j ACCEPT), so the jump to this chain has to come BEFORE ufw's jump in
# OUTPUT, or nothing here is ever reached. apply inserts it at position 1; a
# later "ufw reload" or "ufw enable" can put ufw's first again, which status
# shows - run apply again then.
status_script() {
	local t
	for t in "$IPTABLES" "$IP6TABLES"; do
		printf 'if command -v %q >/dev/null 2>&1; then T=%q; C=%q\n' "$t" "$t" "$CHAIN"
		cat <<'EOS'
  echo "$T:"
  if "$T" -S "$C" 2>/dev/null; then
    order="$("$T" -S OUTPUT 2>/dev/null | grep -nE -- "-j ($C|ufw-before-output)\$" | head -n 1)"
    case "$order" in
      *"-j $C") echo "  in effect: the jump to $C comes before ufw's" ;;
      *ufw-before-output) echo "  ! NOT in effect: ufw's loopback ACCEPT comes first (after a ufw reload?) - run apply again" ;;
    esac
  else
    echo "  no $C chain: not limited"
  fi
fi
EOS
	done
}

case "${1:-plan}" in
	plan)
		read_server
		show_plan
		echo
		echo "Nothing was changed. \"apply\" (as root on the server) puts these rules in place." ;;
	apply)
		read_server
		need_root; need_cgroup_v2
		show_plan || echo "(continuing: the containers above marked ! keep their access until fixed)"
		echo
		apply_script | on_server || { echo "Error: the rules were not changed on $(where)." >&2; exit 1; }
		status_script | on_server
		echo "Run this again after a container is recreated, after a reboot, and after \"ufw reload\"." ;;
	remove)
		read_server
		need_root
		remove_script | on_server
		echo "Removed $CHAIN on $(where): the containers reach every localhost port again." ;;
	status)
		status_script | on_server ;;
	-h|--help) sed -n '2,52p' "$0" ;;
	*) echo "Usage: $0 [--host <ssh host>] [plan|apply|remove|status]" >&2; exit 2 ;;
esac
