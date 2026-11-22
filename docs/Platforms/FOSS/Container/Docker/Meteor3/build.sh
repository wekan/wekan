#!/bin/bash
# build.sh - one menu for every script of this Meteor 3 Docker hosting setup.
#
#   ./build.sh                      the menu
#   ./build.sh <script> [args...]   run one script, e.g. ./build.sh backup.sh customer1
#   ./build.sh --list               the scripts the menu knows
#
# Settings are in settings.ini beside this file (mode 600):
#
#   [server]
#   host = c2          the server the scripts run on, a name from ~/.ssh/config
#                      ("ssh c2" signs in with an SSH key). Empty: this machine.
#   dir = /root/wekan  the directory on that server where they run: the one
#                      that holds admin.txt, <customer>.txt and restore/<customer>/.
#                      Empty: this directory (on this machine).
#   sync = yes         copy this directory's scripts and templates to dir before
#                      each run, so the server always runs the version here.
#
# With a host set nothing runs here: every script runs on the server, over SSH,
# in dir. The customers' passwords stay on the server, in the files the scripts
# write there, and this machine keeps only the server's name and the SSH key -
# so the place the menu is run from needs no passwords of its own.
set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
INI="${WEKAN_METEOR3_SETTINGS:-$HERE/settings.ini}"

# --- settings.ini ---------------------------------------------------------------

# ini_get <section> <key> [default]
ini_get() {
	local section="$1" key="$2" default="${3:-}" value
	value="$( [ -f "$INI" ] && awk -v s="[$section]" -v k="$key" '
		/^[ \t]*\[/ { in_s = ($0 ~ "^[ \t]*\\[" substr(s, 2, length(s) - 2) "\\][ \t]*$") ; next }
		in_s && $0 ~ "^[ \t]*" k "[ \t]*=" { sub(/^[^=]*=[ \t]*/, ""); sub(/[ \t]+$/, ""); print; exit }
	' "$INI")"
	printf '%s' "${value:-$default}"
}

# ini_set <section> <key> <value>: the file is rewritten whole, mode 600.
ini_set() {
	local section="$1" key="$2" value="$3" tmp
	tmp="$(mktemp "${INI}.XXXXXX")" || return 1
	chmod 600 "$tmp"
	{ [ -f "$INI" ] && cat "$INI"; } | awk -v s="$section" -v k="$key" -v v="$value" '
		BEGIN { done = 0; in_s = 0 }
		/^[ \t]*\[/ {
			if (in_s && !done) { print k " = " v; done = 1 }
			in_s = ($0 ~ "^[ \t]*\\[" s "\\][ \t]*$"); print; next
		}
		in_s && $0 ~ "^[ \t]*" k "[ \t]*=" { if (!done) print k " = " v; done = 1; next }
		{ print }
		END {
			if (!done) { if (!in_s) print "\n[" s "]"; print k " = " v }
		}
	' > "$tmp" && mv "$tmp" "$INI"
}

host() { ini_get server host ""; }
dir() { ini_get server dir ""; }
sync_on() { case "$(ini_get server sync yes)" in [Nn]*|0|false|off) return 1 ;; *) return 0 ;; esac; }

# A host as ~/.ssh/config names it, never an ssh option: no leading dash, no space.
valid_host() { [[ "$1" =~ ^[A-Za-z0-9._@-]+$ && "$1" != -* ]]; }
valid_dir() { [[ "$1" == /* && "$1" != *$'\n'* ]]; }

# --- the scripts ----------------------------------------------------------------

# group|script|arguments|description - arguments: db = a customer database name,
# versions = old and new WeKan version, limit = plan, apply, remove or status,
# none. "show" scripts are config examples:
# shown, never run.
SCRIPTS=(
	"Server setup|apt/update.sh|none|apt update, dist-upgrade and snap refresh"
	"Server setup|apt/caddy.sh|none|install Caddy from its apt repository"
	"Server setup|apt/clean.sh|none|apt clean, autoclean and autoremove"
	"Server setup|ufw/install.sh|none|install ssh, ufw and mosh, and open the firewall"
	"Server setup|localhost-limit.sh|limit|Limit localhost access to current node.js port and database port only"
	"Server setup|keys.sh|none|create the MongoDB keyfile"
	"Server setup|mongo/init-replica-set.sh|none|initialize MongoDB's single-node replica set"
	"Server setup|encrypt-ram/encrypt-ram_etc-default-grub.sh|show|/etc/default/grub with RAM encryption (an example, shown)"
	"Customers|1createdb.sh|db|1) create the customer's MongoDB database and user"
	"Customers|2docker.sh|db|2) write the customer's docker-compose.yml"
	"Customers|3restoredb.sh|db|3) restore the customer's database dump"
	"Customers|4files.sh|db|4) copy the customer's attachments and avatars from the Snap server"
	"Customers|sh.sh|db|open mongosh on the customer's database"
	"Backups|backup.sh|db|back up one customer's database"
	"Backups|backup-all.sh|none|back up every customer"
	"Running|restart-docker.sh|none|restart every customer's containers"
	"Running|update-docker-settings.sh|none|recreate every customer's containers with their settings"
	"Running|update-wekan-version.sh|versions|move every customer to another WeKan version"
	"Running|update-changeStreams.sh|none|switch every customer to oplog and sockjs"
	"Running|snap-save-settings.sh|none|save the settings of every wekan_ Snap into <snap>.txt"
	"Running|check-sockjs.sh|none|is the DDP transport sockjs"
)

# field <entry> <n>: the n'th |-separated part.
field() { local parts; IFS='|' read -r -a parts <<< "$1"; printf '%s' "${parts[$(($2 - 1))]:-}"; }

# What is copied to the server: the scripts and the templates they read - never
# a settings.ini, a <customer>.txt, admin.txt or a restore/<customer>/ directory.
# Patterns, expanded in this directory when copying (not where the menu was
# started from). build.sh itself stays here: it is the menu, not a server script.
SYNC_PATTERNS='*.sh apt/*.sh ufw/*.sh mongo/*.sh mongo/mongod.conf encrypt-ram/*.sh caddy/Caddyfile
	restore/docker-start.yml restore/docker-end.yml restore/docker-middle-example.yml'

sync_list() {
	(cd "$HERE" && shopt -s nullglob && for f in $SYNC_PATTERNS; do
		[ -f "$f" ] && [ "$f" != build.sh ] && printf '%s\n' "$f"
	done)
}

sync_scripts() {
	local h d files=()
	h="$(host)"; d="$(dir)"
	[ -n "$h" ] || return 0
	mapfile -t files < <(sync_list)
	echo "==> Copying ${#files[@]} scripts and templates to $h:$d"
	(cd "$HERE" && tar -cf - -- "${files[@]}") | ssh -- "$h" "mkdir -p $(printf '%q' "$d") && tar -xf - -C $(printf '%q' "$d")"
}

# run_script <script> [args...]: here, or on the server over SSH.
run_script() {
	local script="$1"; shift
	local h d quoted="" a
	h="$(host)"; d="$(dir)"
	for a in "$@"; do quoted+=" $(printf '%q' "$a")"; done
	if [ -n "$h" ]; then
		if ! valid_host "$h"; then echo "The server '$h' in $INI is not a host name."; return 1; fi
		if [ -z "$d" ]; then echo "Set the server's directory first (Settings)."; return 1; fi
		if sync_on; then sync_scripts || { echo "Copying the scripts to $h failed."; return 1; }; fi
		echo "==> $h:$d\$ bash $script$quoted"
		ssh -t -- "$h" "cd $(printf '%q' "$d") && bash $(printf '%q' "$script")$quoted"
	else
		local where="${d:-$HERE}"
		echo "==> $where\$ bash $script$quoted"
		if [ ! -f "$where/$script" ] && [ -f "$HERE/$script" ]; then
			(cd "$where" && bash "$HERE/$script" "$@")
		else
			(cd "$where" && bash "./$script" "$@")
		fi
	fi
}

# --- the menu -------------------------------------------------------------------

ask() {
	local prompt="$1" default="${2:-}" v
	if [ -n "$default" ]; then read -r -p "$prompt [$default]: " v || v=""; else read -r -p "$prompt: " v || v=""; fi
	printf '%s' "${v:-$default}"
}

customer_name() {
	local v
	v="$(ask "Customer database name (short lowercase ascii, e.g. customer1)")"
	if [[ ! "$v" =~ ^[a-z0-9_]+$ ]]; then echo "Not a database name: lowercase letters, digits and _ only." >&2; return 1; fi
	printf '%s' "$v"
}

run_entry() {
	local entry="$1" script args
	script="$(field "$entry" 2)"; args="$(field "$entry" 3)"
	case "$args" in
		show) cat "$HERE/$script" ;;
		none) run_script "$script" ;;
		db) local n; n="$(customer_name)" || return; run_script "$script" "$n" ;;
		limit)
			# Each container to its own port and its database port; plan first.
			# With a server set it runs HERE: the settings (1createdb.sh, the
			# customers' <name>.txt and restore/<name>/) are read in this
			# directory, as they need not be on the server, and only the server's
			# containers, Caddyfile and firewall are reached over SSH.
			local a h; a="$(ask "plan, apply, remove or status" plan)"; h="$(host)"
			case "$a" in
				plan|apply|remove|status)
					if [ -n "$h" ]; then
						if ! valid_host "$h"; then echo "The server '$h' in $INI is not a host name."; return 1; fi
						echo "==> here: bash $script --host $h $a"
						(cd "$HERE" && bash "./$script" --host "$h" "$a")
					else
						run_script "$script" "$a"
					fi ;;
				*) echo "One of: plan, apply, remove, status." ;;
			esac ;;
		versions)
			local old new
			old="$(ask "Old WeKan version (e.g. 9.10)")"; new="$(ask "New WeKan version (e.g. 9.11)")"
			if [[ ! "$old" =~ ^[0-9]+\.[0-9]+$ || ! "$new" =~ ^[0-9]+\.[0-9]+$ ]]; then echo "Versions look like 9.10."; return; fi
			run_script "$script" "$old" "$new" ;;
	esac
}

menu_settings() {
	while true; do
		echo
		echo "Settings ($INI)"
		echo "  1) Server (ssh host from ~/.ssh/config, empty = this machine): $(host || true)"
		echo "  2) Directory on the server where the scripts run: $(dir || true)"
		echo "  3) Copy the scripts to the server before each run: $(ini_get server sync yes)"
		echo "  0) Back"
		case "$(ask "Choice")" in
			1)
				local v; v="$(ask "Server, e.g. c2 (\"-\" = this machine)" "$(host)")"
				[ "$v" = "-" ] && v=""
				if [ -n "$v" ] && ! valid_host "$v"; then echo "Not a host name."; continue; fi
				ini_set server host "$v" ;;
			2)
				local v; v="$(ask "Directory, e.g. /root/wekan (\"-\" = empty)" "$(dir)")"
				[ "$v" = "-" ] && v=""
				if [ -n "$v" ] && ! valid_dir "$v"; then echo "An absolute path, starting with /."; continue; fi
				ini_set server dir "$v" ;;
			3) if sync_on; then ini_set server sync no; else ini_set server sync yes; fi ;;
			""|0) return ;;
		esac
	done
}

menu() {
	while true; do
		local h d n=0 entry group last=""
		h="$(host)"; d="$(dir)"
		echo
		echo "WeKan Meteor 3 hosting     settings: $(basename "$INI")"
		if [ -n "$h" ]; then echo "Runs on: $h, in ${d:-(directory not set)}  (over SSH; nothing runs here)"
		else echo "Runs on: this machine, in ${d:-$HERE}"; fi
		echo
		echo "  s) Settings: server, directory, copying the scripts"
		echo "  c) Copy the scripts to the server now"
		echo "  t) Open a shell on the server, in its directory"
		for entry in "${SCRIPTS[@]}"; do
			n=$((n + 1)); group="$(field "$entry" 1)"
			if [ "$group" != "$last" ]; then echo; echo "  $group"; last="$group"; fi
			printf ' %2d) %-46s %s\n' "$n" "$(field "$entry" 2)" "$(field "$entry" 4)"
		done
		echo
		echo "  0) Quit"
		local c; c="$(ask "Choice")"
		case "$c" in
			""|0|q) return ;;
			s) menu_settings ;;
			c) if [ -n "$h" ]; then sync_scripts; else echo "No server set: the scripts are here already."; fi ;;
			t) if [ -n "$h" ]; then ssh -t -- "$h" "cd $(printf '%q' "${d:-.}") && exec \$SHELL -l"; else (cd "${d:-$HERE}" && "${SHELL:-bash}" -l); fi ;;
			*)
				if [[ "$c" =~ ^[0-9]+$ ]] && [ "$c" -ge 1 ] && [ "$c" -le "${#SCRIPTS[@]}" ]; then
					run_entry "${SCRIPTS[$((c - 1))]}"
				fi ;;
		esac
	done
}

known_script() {
	local entry
	for entry in "${SCRIPTS[@]}"; do [ "$(field "$entry" 2)" = "$1" ] && return 0; done
	return 1
}

case "${1:-}" in
	"") menu ;;
	--list) for entry in "${SCRIPTS[@]}"; do printf '%-46s %s\n' "$(field "$entry" 2)" "$(field "$entry" 4)"; done ;;
	--help|-h) sed -n '2,24p' "$0" ;;
	*)
		if ! known_script "$1"; then echo "Unknown script: $1 (./build.sh --list)"; exit 2; fi
		for entry in "${SCRIPTS[@]}"; do
			if [ "$(field "$entry" 2)" = "$1" ] && [ "$(field "$entry" 3)" = show ]; then cat "$HERE/$1"; exit 0; fi
		done
		run_script "$@" ;;
esac
