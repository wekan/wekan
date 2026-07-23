#!/usr/bin/env bash
#
# Pull every security / code-quality report GitHub exposes for a repo - open
# AND closed - and save them as JSON + plain-text files, into a timestamped run
# directory with one subdirectory per category of the GitHub Security tab, and
# an open/ and closed/ subdirectory under each category:
#
#   reports/2026-07-23_21-05-44/
#     00-summary.txt
#     Repository/                        which security features are enabled
#     CodeQuality/StandardFindings/      CodeQL maintainability + reliability
#       open/  closed/
#     CodeQuality/AIFindings/            AI findings on recently changed files
#       open/  closed/
#     CodeScanning/                      CodeQL security alerts
#       open/  closed/                   (+ analyses, default setup, databases)
#     Dependabot/Vulnerabilities/        vulnerable dependency alerts
#       open/  closed/
#     Dependabot/Malware/                malicious package alerts
#       open/  closed/
#     SecretScanning/                    leaked credentials (values redacted)
#       open/  closed/
#     Advisories/                        repository security advisories
#       open/  closed/
#     DependencyGraph/                   SPDX SBOM
#     Raw/                               unsplit API responses
#
# "closed" means fixed + dismissed + resolved.
#
# Run this OUTSIDE the Flatpak VSCode sandbox (the sandbox has no `gh` and no
# network access to api.github.com), then point the assistant at the run
# directory.
#
#   ./docs/Security/gh/pull-security-reports.sh
#   ./docs/Security/gh/pull-security-reports.sh -r wekan/wekan -o /tmp/wekan-sec
#
# Requirements:
#   gh   - https://cli.github.com/  (authenticated: `gh auth login`)
#   jq   - used to split and summarize the responses
#
# Token scopes: the CodeQL / Dependabot / secret-scanning endpoints need the
# `security_events` scope on top of `repo`. If you get 403s, run:
#
#   gh auth refresh -h github.com -s security_events -s repo
#
# NOTE: the reports root gets a `.gitignore` that excludes everything. These
# reports describe unfixed vulnerabilities - do not commit them to a public
# repo. Secret-scanning values are redacted before being written.
#
# See README.md in this directory for the design and the output layout.

set -u

REPO=""
OUT=""
WANT_SARIF=0

usage() {
  cat <<'EOF'
Usage: pull-security-reports.sh [-r owner/repo] [-o outdir] [--sarif]

  -r, --repo    owner/repo to query (default: the current git remote, else wekan/wekan)
  -o, --out     reports root        (default: <this script's dir>/reports)
                a YYYY-MM-DD_HH-MM-SS/ run directory is created inside it
      --sarif   also download the full SARIF of the newest CodeQL analysis
                (large: every result with all code-flow steps)
  -h, --help    this text
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    -r|--repo)  REPO="${2:-}"; shift 2 ;;
    -o|--out)   OUT="${2:-}";  shift 2 ;;
    --sarif)    WANT_SARIF=1;  shift ;;
    -h|--help)  usage; exit 0 ;;
    *) echo "unknown argument: $1" >&2; usage >&2; exit 2 ;;
  esac
done

SCRIPT_DIR=$(cd -- "$(dirname -- "$0")" && pwd)
[ -n "$OUT" ] || OUT="$SCRIPT_DIR/reports"

if ! command -v gh >/dev/null 2>&1; then
  echo "error: 'gh' not found. Install GitHub CLI and run 'gh auth login'." >&2
  echo "       (Reminder: this script cannot work inside the VSCode Flatpak sandbox.)" >&2
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "error: gh is not authenticated. Run: gh auth login" >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "error: 'jq' not found - it is needed to split and summarize the reports." >&2
  echo "       Debian/Ubuntu: sudo apt install jq     Fedora: sudo dnf install jq" >&2
  echo "       macOS: brew install jq                 Snap:   sudo snap install jq" >&2
  exit 1
fi

if [ -z "$REPO" ]; then
  REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null)
  [ -n "$REPO" ] || REPO="wekan/wekan"
fi

STAMP=$(date '+%Y-%m-%d_%H-%M-%S')
RUN="$OUT/$STAMP"
NOW=$(date '+%Y-%m-%d %H:%M:%S %Z')

# Categories that hold alerts, and therefore get open/ and closed/ inside them.
ALERT_CATEGORIES="CodeQuality/StandardFindings
CodeQuality/AIFindings
CodeScanning
Dependabot/Vulnerabilities
Dependabot/Malware
SecretScanning
Advisories"

mkdir -p "$RUN/Repository" "$RUN/DependencyGraph" "$RUN/Raw" || exit 1
for category in $ALERT_CATEGORIES; do
  mkdir -p "$RUN/$category/open" "$RUN/$category/closed" || exit 1
done

# Never commit these: they describe unfixed vulnerabilities.
printf '*\n!.gitignore\n' > "$OUT/.gitignore"

# Convenience pointer to the newest run.
rm -f "$OUT/latest"
ln -s "$STAMP" "$OUT/latest" 2>/dev/null

SUMMARY="$RUN/00-summary.txt"
: > "$SUMMARY"
say() { echo "$*" | tee -a "$SUMMARY"; }

say "WeKan security + code quality report dump"
say "repo:         $REPO"
say "generated at: $NOW"
say "run dir:      $RUN"
say "gh version:   $(gh --version | head -1)"
say ""

# ---------------------------------------------------------------------------
# fetch <dir> <name> <endpoint> <description>
#   Saves the paginated JSON to <dir>/<name>.json. Never aborts the script: a
#   failing endpoint (feature disabled, missing scope) is recorded in
#   00-summary.txt and in <dir>/<name>.error.txt instead.
# ---------------------------------------------------------------------------
fetch() {
  dir=$1; name=$2; endpoint=$3; desc=$4
  raw="$RUN/$dir/$name.json"
  err="$RUN/$dir/$name.error.txt"
  rm -f "$err"

  if gh api --paginate --slurp -H "Accept: application/vnd.github+json" \
       "$endpoint" > "$raw" 2>"$err.tmp"; then
    rm -f "$err.tmp"
    n=$(jq 'if type=="array" then length else 1 end' < "$raw" 2>/dev/null)
    say "OK    $dir/$name  ($n)  - $desc"
    return 0
  fi

  mv "$err.tmp" "$err" 2>/dev/null
  say "FAIL  $dir/$name  - $desc"
  say "        $(head -3 "$err" 2>/dev/null | tr '\n' ' ')"
  rm -f "$raw"
  return 1
}

# ---------------------------------------------------------------------------
# split <src.json> <dir> <name> <jq-filter>
#   Writes the matching subset of src to <dir>/<name>.json.
# ---------------------------------------------------------------------------
split() {
  src=$1; dir=$2; name=$3; filter=$4
  [ -f "$src" ] || return 1
  jq "[ .[] | select($filter) ]" < "$src" > "$RUN/$dir/$name.json" 2>/dev/null
  say "      $dir/$name.json  ($(jq 'length' < "$RUN/$dir/$name.json" 2>/dev/null))"
}

# ---------------------------------------------------------------------------
# render <dir> <name> <jq-expr> <header>
# ---------------------------------------------------------------------------
render() {
  dir=$1; name=$2; expr=$3; header=$4
  raw="$RUN/$dir/$name.json"
  [ -f "$raw" ] || return 0
  {
    echo "$header"
    echo "repo: $REPO   generated: $NOW"
    echo
    jq -r "$expr" < "$raw" 2>/dev/null
  } > "$RUN/$dir/$name.txt"
}

# ===========================================================================
# Repository - which security features are even enabled
# ===========================================================================
fetch Repository security-settings "/repos/$REPO" \
  "repo metadata incl. security_and_analysis feature switches"
render Repository security-settings \
  '(if type=="array" then .[0] else . end) as $r
   | "private: \($r.private)\nvisibility: \($r.visibility)\ndefault branch: \($r.default_branch)\n\nsecurity_and_analysis:\n"
     + (($r.security_and_analysis // {}) | to_entries
        | map("  \(.key): \(.value.status // .value)") | join("\n"))' \
  "=== Repository security settings ==="

# Is the vulnerability-alerts feature on at all (204 = yes, 404 = no).
if gh api -i "/repos/$REPO/vulnerability-alerts" 2>/dev/null | head -1 | grep -q ' 204'; then
  echo "vulnerability-alerts: enabled" > "$RUN/Repository/vulnerability-alerts.txt"
  say "OK    Repository/vulnerability-alerts  - enabled"
else
  echo "vulnerability-alerts: disabled, or not visible with this token" \
    > "$RUN/Repository/vulnerability-alerts.txt"
  say "NOTE  Repository/vulnerability-alerts  - disabled or not visible with this token"
fi
say ""

# ===========================================================================
# Code scanning alerts - fetched once for ALL states, then split three ways:
#   CodeQuality/StandardFindings  quality queries (maintainability/reliability)
#   CodeQuality/AIFindings        anything produced by an AI/Copilot tool
#   CodeScanning                  the security queries
# Each alert is one finding at one location, so these files ARE the per-rule
# file:line lists the web UI groups by rule.
# ===========================================================================
ALERTS="$RUN/Raw/code-scanning-alerts.json"
if fetch Raw code-scanning-alerts \
     "/repos/$REPO/code-scanning/alerts?per_page=100" \
     "every code scanning alert, all states, before splitting"; then

  IS_AI='((.tool.name // "") | test("copilot|autofix|\\bai\\b"; "i"))'
  IS_QUALITY='(((.rule.tags // []) | any(. == "maintainability" or . == "reliability" or . == "quality"))
               or (.rule.security_severity_level == null))'

  split "$ALERTS" CodeQuality/AIFindings/open        alerts "$IS_AI and .state == \"open\""
  split "$ALERTS" CodeQuality/AIFindings/closed      alerts "$IS_AI and .state != \"open\""
  split "$ALERTS" CodeQuality/StandardFindings/open   alerts "(($IS_AI) | not) and $IS_QUALITY and .state == \"open\""
  split "$ALERTS" CodeQuality/StandardFindings/closed alerts "(($IS_AI) | not) and $IS_QUALITY and .state != \"open\""
  split "$ALERTS" CodeScanning/open                  alerts "(($IS_AI) | not) and (($IS_QUALITY) | not) and .state == \"open\""
  split "$ALERTS" CodeScanning/closed                alerts "(($IS_AI) | not) and (($IS_QUALITY) | not) and .state != \"open\""

  cat > "$RUN/CodeQuality/AIFindings/NOTE.txt" <<'EOF'
"AI findings" (Security -> Findings -> AI findings) has no documented REST
endpoint. open/ and closed/ here are filled by matching code scanning alerts
whose tool name looks like Copilot / autofix / AI. If alerts.json is an empty
array, GitHub is not exposing those findings through the API and they have to
be read in the web UI:

  https://github.com/<owner>/<repo>/security/code-quality
EOF

  # Per-finding listing + the three grouped views, for every alert directory.
  for c in CodeQuality/StandardFindings CodeQuality/AIFindings CodeScanning; do
    for state in open closed; do
      d="$c/$state"
      render "$d" alerts \
        '.[] | "[\(.rule.security_severity_level // .rule.severity // "note")] \(.rule.id)  (\(.state))
  #\(.number)  \(.most_recent_instance.location.path):\(.most_recent_instance.location.start_line)-\(.most_recent_instance.location.end_line)
  tool:  \(.tool.name) \(.tool.version // "")
  msg:   \((.most_recent_instance.message.text // "") | gsub("\n"; " "))
  desc:  \(.rule.description // "")
  dismissed: \(.dismissed_reason // "-")  \((.dismissed_comment // "") | gsub("\n"; " "))
  url:   \(.html_url)
"' \
        "=== $c: $state alerts (one entry per finding) ==="

      src="$RUN/$d/alerts.json"
      [ -f "$src" ] || continue

      {
        echo "=== $c: $state alerts grouped by rule ==="
        echo "repo: $REPO   generated: $NOW"
        echo
        jq -r '
          group_by(.rule.id) | sort_by(-length) | .[] |
          "=== \(.[0].rule.id)  [\(.[0].rule.security_severity_level // .[0].rule.severity // "note")]  \(length) alerts ===\n"
          + "    \(.[0].rule.description // "")\n"
          + ([ .[] | "    \(.most_recent_instance.location.path):\(.most_recent_instance.location.start_line)"
                     + "  #\(.number)  \((.most_recent_instance.message.text // "") | gsub("\n"; " "))" ]
             | sort | join("\n"))
          + "\n"
        ' < "$src" 2>/dev/null
      } > "$RUN/$d/by-rule.txt"

      {
        echo "=== $c: $state alerts, count per rule ==="
        echo "repo: $REPO   generated: $NOW"
        echo
        jq -r '
          group_by(.rule.id) | sort_by(-length) | .[] |
          "\(length)\t\(.[0].rule.security_severity_level // .[0].rule.severity // "note")\t\(.[0].rule.id)\t\(.[0].rule.description // "")"
        ' < "$src" 2>/dev/null
      } > "$RUN/$d/counts.txt"

      {
        echo "=== $c: $state alerts, count per file ==="
        echo "repo: $REPO   generated: $NOW"
        echo
        jq -r '
          group_by(.most_recent_instance.location.path) | sort_by(-length) | .[] |
          "\(length)\t\(.[0].most_recent_instance.location.path)"
        ' < "$src" 2>/dev/null
      } > "$RUN/$d/by-file.txt"
    done
  done
fi
say ""

# CodeQL run metadata.
fetch CodeScanning analyses \
  "/repos/$REPO/code-scanning/analyses?per_page=100" \
  "code scanning analysis runs (which suite ran, when, on which commit)"
render CodeScanning analyses \
  '.[] | "\(.created_at)  \(.category // "-")  \(.tool.name) \(.tool.version // "")  ref=\(.ref)  results=\(.results_count)  commit=\(.commit_sha[0:9])"' \
  "=== Code scanning analysis runs ==="

fetch CodeScanning default-setup \
  "/repos/$REPO/code-scanning/default-setup" \
  "default CodeQL setup config (languages, query suite, schedule)"

fetch CodeScanning codeql-databases \
  "/repos/$REPO/code-scanning/codeql/databases" \
  "downloadable CodeQL databases"

# Optional: the raw SARIF of the newest analysis (every result + code flows).
if [ "$WANT_SARIF" = "1" ] && [ -f "$RUN/CodeScanning/analyses.json" ]; then
  aid=$(jq -r 'sort_by(.created_at) | last | .id // empty' < "$RUN/CodeScanning/analyses.json")
  if [ -n "$aid" ]; then
    if gh api -H "Accept: application/sarif+json" \
         "/repos/$REPO/code-scanning/analyses/$aid" \
         > "$RUN/CodeScanning/latest.sarif.json" 2>/dev/null; then
      say "OK    CodeScanning/latest.sarif  (analysis $aid)"
    else
      say "FAIL  CodeScanning/latest.sarif  (analysis $aid)"
      rm -f "$RUN/CodeScanning/latest.sarif.json"
    fi
  fi
fi
say ""

# ===========================================================================
# Dependabot - fetched once for all states, split into Malware and
# Vulnerabilities. GitHub flags malicious-package advisories in the advisory
# type/classification; the summary text is checked too, because that field is
# not always populated on repo alerts.
# ===========================================================================
DEPS="$RUN/Raw/dependabot-alerts.json"
if fetch Raw dependabot-alerts \
     "/repos/$REPO/dependabot/alerts?per_page=100" \
     "every Dependabot alert, all states, before splitting"; then

  IS_MALWARE='(((.security_advisory.type // .security_advisory.classification // "") | ascii_downcase == "malware")
               or (((.security_advisory.summary // "") + " " + (.security_advisory.description // ""))
                   | test("malicious code|malware|malicious package"; "i")))'

  split "$DEPS" Dependabot/Malware/open          alerts "$IS_MALWARE and .state == \"open\""
  split "$DEPS" Dependabot/Malware/closed        alerts "$IS_MALWARE and .state != \"open\""
  split "$DEPS" Dependabot/Vulnerabilities/open   alerts "(($IS_MALWARE) | not) and .state == \"open\""
  split "$DEPS" Dependabot/Vulnerabilities/closed alerts "(($IS_MALWARE) | not) and .state != \"open\""

  for c in Dependabot/Vulnerabilities Dependabot/Malware; do
    for state in open closed; do
      d="$c/$state"
      render "$d" alerts \
        '.[] | "[\(.security_advisory.severity | ascii_upcase)] \(.dependency.package.ecosystem):\(.dependency.package.name)  #\(.number)  (\(.state))
  advisory: \(.security_advisory.ghsa_id)  \((.security_advisory.cve_id // "no CVE"))
  summary:  \(.security_advisory.summary)
  manifest: \(.dependency.manifest_path)
  vulnerable: \(.security_vulnerability.vulnerable_version_range)
  patched in: \(.security_vulnerability.first_patched_version.identifier // "NO PATCH AVAILABLE")
  dismissed: \(.dismissed_reason // "-")  fixed: \(.fixed_at // "-")
  url: \(.html_url)
"' \
        "=== $c: $state Dependabot alerts ==="

      src="$RUN/$d/alerts.json"
      [ -f "$src" ] || continue
      {
        echo "=== $c: $state alerts, count per severity ==="
        echo "repo: $REPO   generated: $NOW"
        echo
        jq -r 'group_by(.security_advisory.severity) | sort_by(-length) | .[] |
               "\(length)\t\(.[0].security_advisory.severity)"' < "$src" 2>/dev/null
        echo
        echo "=== count per package ==="
        jq -r 'group_by(.dependency.package.name) | sort_by(-length) | .[] |
               "\(length)\t\(.[0].dependency.package.ecosystem):\(.[0].dependency.package.name)"' \
          < "$src" 2>/dev/null
        echo
        echo "=== count per manifest ==="
        jq -r 'group_by(.dependency.manifest_path) | sort_by(-length) | .[] |
               "\(length)\t\(.[0].dependency.manifest_path)"' < "$src" 2>/dev/null
      } > "$RUN/$d/counts.txt"
    done
  done
fi
say ""

# ===========================================================================
# SecretScanning - all states (open + resolved).
#   The API returns the live secret in .secret - deleted here so this dump can
#   never write a working credential to disk.
# ===========================================================================
if fetch Raw secret-scanning-alerts-with-secrets \
     "/repos/$REPO/secret-scanning/alerts?per_page=100" \
     "every secret scanning alert, all states (secret values redacted)"; then

  jq 'map(del(.secret))' < "$RUN/Raw/secret-scanning-alerts-with-secrets.json" \
    > "$RUN/Raw/secret-scanning-alerts.json" 2>/dev/null
  rm -f "$RUN/Raw/secret-scanning-alerts-with-secrets.json"

  split "$RUN/Raw/secret-scanning-alerts.json" SecretScanning/open   alerts '.state == "open"'
  split "$RUN/Raw/secret-scanning-alerts.json" SecretScanning/closed alerts '.state != "open"'

  for state in open closed; do
    render "SecretScanning/$state" alerts \
      '.[] | "[\(.state)] \(.secret_type_display_name // .secret_type)  #\(.number)
  created:  \(.created_at)
  validity: \(.validity // "unknown")   push_protection_bypassed: \(.push_protection_bypassed // false)
  resolution: \(.resolution // "-")  by: \(.resolved_by.login // "-")  at: \(.resolved_at // "-")
  url: \(.html_url)
"' \
      "=== Secret scanning: $state alerts (secret values NOT stored) ==="
  done
fi
say ""

# ===========================================================================
# Advisories - the ones you publish yourself, every state.
#   open = draft or triage, closed = published or closed/withdrawn.
# ===========================================================================
if fetch Raw security-advisories \
     "/repos/$REPO/security-advisories?per_page=100" \
     "repository security advisories, all states"; then

  split "$RUN/Raw/security-advisories.json" Advisories/open   advisories \
    '.state == "draft" or .state == "triage"'
  split "$RUN/Raw/security-advisories.json" Advisories/closed advisories \
    '.state != "draft" and .state != "triage"'

  for state in open closed; do
    render "Advisories/$state" advisories \
      '.[] | "[\(.severity // "-")] \(.ghsa_id // "no GHSA")  state=\(.state)
  \(.summary)
  cve: \(.cve_id // "-")   published: \(.published_at // "-")   withdrawn: \(.withdrawn_at // "-")
  url: \(.html_url)
"' \
      "=== Repository security advisories: $state ==="
  done
fi
say ""

# ===========================================================================
# DependencyGraph
# ===========================================================================
fetch DependencyGraph sbom "/repos/$REPO/dependency-graph/sbom" \
  "SPDX SBOM of the dependency graph"
render DependencyGraph sbom \
  '(if type=="array" then .[0] else . end) | .sbom.packages // []
   | "packages: \(length)\n\n"
     + ([ (.[] | "\(.name)\t\(.versionInfo // "-")") ] | sort | join("\n"))' \
  "=== Dependency graph (SBOM) ==="

# ===========================================================================
say ""
say "Counts (open / closed):"
for c in $ALERT_CATEGORIES; do
  o="-"; c_=""
  for name in alerts advisories; do
    [ -f "$RUN/$c/open/$name.json" ]   && o=$(jq 'length' < "$RUN/$c/open/$name.json" 2>/dev/null)
    [ -f "$RUN/$c/closed/$name.json" ] && c_=$(jq 'length' < "$RUN/$c/closed/$name.json" 2>/dev/null)
  done
  [ -n "$c_" ] || c_="-"
  say "  $c: $o / $c_"
done

say ""
say "Output directory: $RUN"
say ""
say "Files:"
(cd "$RUN" && find . -type f | sed 's|^\./|  |' | sort) | tee -a "$SUMMARY" >/dev/null
(cd "$RUN" && find . -type f | sed 's|^\./|  |' | sort)
say ""
say "Start with: 00-summary.txt"
say "            CodeQuality/StandardFindings/open/counts.txt"
say "            CodeQuality/StandardFindings/open/by-rule.txt"
