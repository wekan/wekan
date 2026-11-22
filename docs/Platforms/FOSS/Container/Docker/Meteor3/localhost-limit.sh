#!/bin/bash
# localhost-limit.sh - limit each WeKan container's localhost access to its own
# Node.js port and its database port only.
#
#   ./localhost-limit.sh            plan: what was found, and the rules (default)
#   ./localhost-limit.sh plan       the same
#   ./localhost-limit.sh apply      replace the rules with the plan (as root)
#   ./localhost-limit.sh remove     remove the rules (as root)
#   ./localhost-limit.sh status     the rules now in place
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
#   - docker ps: running containers named *-app or *-tenant (NAME_PATTERN),
#     their PORT, MONGO_URL and MONGO_OPLOG_URL from docker inspect;
#   - restore/<customer>/docker-compose.yml: container_name, PORT, MONGO_URL
#     (used when a container's own environment has no PORT);
#   - /etc/caddy/Caddyfile (CADDYFILE): "import wekan_proxy <port>" and
#     "reverse_proxy 127.0.0.1:<port>" / "localhost:<port>";
#   - 1createdb.sh: MONGO_PORT, and the <customer>.txt files it writes.
# A Caddyfile port with no container, or a container port Caddy does not
# proxy, is reported.
#
# A recreated container (update-docker-settings.sh, update-wekan-version.sh) has
# a new id and so a new cgroup: run "apply" again after those. The rules are
# not saved across a reboot; run "apply" after the containers have started.

set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
NAME_PATTERN="${NAME_PATTERN:-(-app|-tenant)\$}"
CADDYFILE="${CADDYFILE:-/etc/caddy/Caddyfile}"
PROC_ROOT="${PROC_ROOT:-/proc}"
CGROUP_ROOT="${CGROUP_ROOT:-/sys/fs/cgroup}"
DOCKER="${DOCKER:-docker}"
IPTABLES="${IPTABLES:-iptables}"
IP6TABLES="${IP6TABLES:-ip6tables}"
CHAIN=WEKAN-LOCALHOST
DEFAULT_MONGO_PORT=27017

# --- reading the settings ---------------------------------------------------

is_port() { [[ "$1" =~ ^[0-9]{1,5}$ ]] && [ "$1" -ge 1 ] && [ "$1" -le 65535 ]; }

# The ports of the hosts in a mongodb:// URL that are on this machine
# (localhost, 127.x, ::1, or no host given); a host elsewhere is not localhost
# traffic and needs no rule.
mongo_ports() {
	local url="$1" hosts h port
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
			localhost|127.*|\[::1\]|::1|"") is_port "$port" && echo "$port" ;;
		esac
	done
}

# env_value <name> <lines of NAME=value>
env_value() { printf '%s\n' "$2" | sed -n "s/^[ \t-]*$1=//p" | head -n 1 | tr -d '\r'; }

# The ports Caddy proxies to on this machine.
caddy_ports() {
	[ -r "$CADDYFILE" ] || return
	sed -e 's/#.*//' "$CADDYFILE" | grep -oE 'import[ \t]+wekan_proxy[ \t]+[0-9]+|reverse_proxy[ \t]+(127\.0\.0\.1|localhost|\[::1\]):[0-9]+' \
		| grep -oE '[0-9]+$' | sort -un
}

# compose_field <container name> <NAME>: from restore/*/docker-compose.yml.
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

# One line per running WeKan container:
#   name|id|cgroup path|own port|mongo port,port
CONTAINERS=()
read_containers() {
	CONTAINERS=()
	command -v "$DOCKER" >/dev/null 2>&1 || return
	local id name pid envs port mongo cgroup
	while read -r id name; do
		[ -n "$id" ] || continue
		[[ "$name" =~ $NAME_PATTERN ]] || continue
		pid="$("$DOCKER" inspect -f '{{.State.Pid}}' "$id" 2>/dev/null)"
		envs="$("$DOCKER" inspect -f '{{range .Config.Env}}{{println .}}{{end}}' "$id" 2>/dev/null)"
		port="$(env_value PORT "$envs")"
		is_port "${port:-x}" || port="$(compose_field "$name" PORT)"
		mongo="$( { mongo_ports "$(env_value MONGO_URL "$envs")"; mongo_ports "$(env_value MONGO_OPLOG_URL "$envs")"; } | sort -un | paste -sd, -)"
		if [ -z "$mongo" ]; then
			mongo="$( { mongo_ports "$(compose_field "$name" MONGO_URL)"; mongo_ports "$(compose_field "$name" MONGO_OPLOG_URL)"; } | sort -un | paste -sd, -)"
		fi
		cgroup=""
		if [[ "$pid" =~ ^[0-9]+$ ]] && [ "$pid" -gt 0 ] && [ -r "$PROC_ROOT/$pid/cgroup" ]; then
			cgroup="$(sed -n 's/^0::\(.*\)$/\1/p' "$PROC_ROOT/$pid/cgroup" | head -n 1)"
		fi
		CONTAINERS+=("$name|$id|$cgroup|$port|$mongo")
	done < <("$DOCKER" ps --format '{{.ID}} {{.Names}}' 2>/dev/null)
}

part() { local p; IFS='|' read -r -a p <<< "$1"; printf '%s' "${p[$(($2 - 1))]:-}"; }

# --- the rules ----------------------------------------------------------------

# The rule arguments, one rule per line, for one table.
rules() {
	local entry name cgroup port mongo m
	for entry in "${CONTAINERS[@]}"; do
		name="$(part "$entry" 1)"; cgroup="$(part "$entry" 3)"; port="$(part "$entry" 4)"; mongo="$(part "$entry" 5)"
		[ -n "$cgroup" ] && is_port "${port:-x}" || continue
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
	echo "Containers (docker ps, names matching $NAME_PATTERN):"
	if [ "${#CONTAINERS[@]}" -eq 0 ]; then echo "  none found"; fi
	for entry in "${CONTAINERS[@]}"; do
		name="$(part "$entry" 1)"; cgroup="$(part "$entry" 3)"; port="$(part "$entry" 4)"; mongo="$(part "$entry" 5)"
		printf '  %-28s port %-6s database %-14s cgroup %s\n' "$name" "${port:-?}" "${mongo:-$DEFAULT_MONGO_PORT}" "${cgroup:-?}"
		if ! is_port "${port:-x}"; then echo "    ! no PORT in its environment or restore/*/docker-compose.yml: left without rules"; problems=1; fi
		if [ -z "$cgroup" ]; then echo "    ! its cgroup could not be read: left without rules"; problems=1; fi
	done
	caddy="$(caddy_ports | paste -sd' ' -)"
	compose="$(compose_ports | paste -sd' ' -)"
	echo "Caddy proxies to ($CADDYFILE): ${caddy:-nothing found}"
	echo "restore/*/docker-compose.yml PORTs: ${compose:-none}"
	echo "1createdb.sh database ports: $(createdb_mongo_ports | paste -sd' ' -)"
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
	if [ "${EUID:-$(id -u)}" -ne 0 ] && [ -z "${LOCALHOST_LIMIT_NOT_ROOT_OK:-}" ]; then
		echo "Error: run as root (sudo su), it changes the firewall." >&2; exit 1
	fi
}

need_cgroup_v2() {
	if [ ! -e "$CGROUP_ROOT/cgroup.controllers" ]; then
		echo "Error: this server does not use cgroup v2 ($CGROUP_ROOT/cgroup.controllers is missing);" >&2
		echo "the rules match a container by its cgroup v2 path." >&2; exit 1
	fi
}

flush_table() {
	local t="$1"
	command -v "$t" >/dev/null 2>&1 || return 0
	while "$t" -C OUTPUT -o lo -j "$CHAIN" 2>/dev/null; do "$t" -D OUTPUT -o lo -j "$CHAIN"; done
	"$t" -F "$CHAIN" 2>/dev/null
	"$t" -X "$CHAIN" 2>/dev/null
	return 0
}

apply_table() {
	local t="$1" r
	command -v "$t" >/dev/null 2>&1 || { echo "  $t not found: skipped"; return 0; }
	# Build the new chain beside the old one, then swap the jump, so there is no
	# moment without rules.
	"$t" -N "$CHAIN-new" 2>/dev/null || "$t" -F "$CHAIN-new"
	while read -r r; do
		[ -n "$r" ] || continue
		# shellcheck disable=SC2086 # the rule is words by design
		"$t" -A "$CHAIN-new" $r || { echo "  ! $t refused: $r" >&2; "$t" -F "$CHAIN-new"; "$t" -X "$CHAIN-new"; return 1; }
	done < <(rules)
	"$t" -I OUTPUT 1 -o lo -j "$CHAIN-new"
	while "$t" -C OUTPUT -o lo -j "$CHAIN" 2>/dev/null; do "$t" -D OUTPUT -o lo -j "$CHAIN"; done
	"$t" -F "$CHAIN" 2>/dev/null; "$t" -X "$CHAIN" 2>/dev/null
	"$t" -E "$CHAIN-new" "$CHAIN"
	echo "  $t: $(rules | grep -c .) rules in $CHAIN"
}

case "${1:-plan}" in
	plan)
		read_containers
		show_plan
		echo
		echo "Nothing was changed. \"$0 apply\" (as root) puts these rules in place." ;;
	apply)
		need_root; need_cgroup_v2
		read_containers
		show_plan || echo "(continuing: the containers above marked ! keep their access until fixed)"
		echo
		apply_table "$IPTABLES" && apply_table "$IP6TABLES"
		echo "Run this again after a container is recreated, and after a reboot." ;;
	remove)
		need_root
		flush_table "$IPTABLES"; flush_table "$IP6TABLES"
		echo "Removed $CHAIN: the containers reach every localhost port again." ;;
	status)
		for t in "$IPTABLES" "$IP6TABLES"; do
			command -v "$t" >/dev/null 2>&1 || continue
			echo "$t:"; "$t" -S "$CHAIN" 2>/dev/null || echo "  no $CHAIN chain: not limited"
		done ;;
	-h|--help) sed -n '2,46p' "$0" ;;
	*) echo "Usage: $0 [plan|apply|remove|status]" >&2; exit 2 ;;
esac
