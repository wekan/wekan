#!/usr/bin/env bash
#
# strip-node.sh - take the symbol table and debug data out of a bundled node.
#
#   Usage: strip-node.sh <node binary>
#
# WHY. The node executables nodejs.org publishes carry their full symbol table
# and DWARF debug data: linux-x64 and linux-arm64 are 150 MB, 117 and 115 MB
# without. Every WeKan bundle, Docker image, snap, AppImage and Flatpak ships
# one, and nothing in WeKan reads those sections - they are for a debugger.
#
# WHAT IS KEPT. Native addons (bcrypt, argon2, sharp, canvas) find node's N-API
# functions in its DYNAMIC symbol table, which a full strip leaves alone:
#   ELF     eu-strip (elfutils) removes .symtab and the .debug_* sections and
#           keeps .dynsym. It is used, not GNU strip, because GNU strip only
#           knows the build machine's own CPU: an arm64 node stripped on an x64
#           runner fails with "Unable to recognise the architecture". Inside an
#           emulated target container, where the native strip DOES know the
#           CPU, that is used when eu-strip is missing.
#   Mach-O  strip -x removes the local symbols (901035 of 940771 in node 26 for
#           darwin-arm64) and keeps the exported ones addons bind to. Stripping
#           invalidates the code signature, and an arm64 Mac refuses to run an
#           unsigned binary, so it is re-signed ad hoc - as the .app already is
#           (releases/mac/package-app.sh).
#   PE      nothing: node.exe has no COFF symbols, and its debug data is a
#           separate .pdb nodejs.org does not ship.
#
# This runs AFTER the download was verified against the checksum its source
# published (embed-verified-node.sh, install-node-for-arch.sh), so what is
# verified is the original, and the provenance records that file.
#
# Checked afterwards: the result is still a binary of the same format, and an
# ELF still has its .dynsym. Checked by hand: the eu-stripped node 26.11.1 for
# linux-x64 loads bcrypt, argon2, sharp and @napi-rs/canvas and uses them.

set -uo pipefail

f="${1:?usage: strip-node.sh <node binary>}"
[ -s "$f" ] || { echo "::error::strip-node: $f is missing or empty." >&2; exit 1; }

fail() {
  echo "::error::strip-node: $*" >&2
  exit 1
}

size() { wc -c < "$1" | tr -d ' '; }
before="$(size "$f")"
magic="$(head -c 4 "$f" | od -An -tx1 | tr -d ' \n')"

case "$magic" in
  7f454c46)
    if command -v eu-strip >/dev/null 2>&1; then
      eu-strip "$f" || fail "eu-strip failed on $f."
    elif command -v strip >/dev/null 2>&1 && strip "$f" 2>/dev/null; then
      :   # the native strip knows this CPU (an emulated target container)
    else
      fail "no eu-strip (elfutils), and the native strip cannot read $f. Install elfutils."
    fi
    # .dynsym is what native addons resolve N-API against; it must survive.
    python3 - "$f" <<'EOP' || fail "$f lost its dynamic symbol table."
import struct, sys
b = open(sys.argv[1], 'rb').read()
if b[:4] != b'\x7fELF':
    sys.exit('not ELF any more')
is64, end = b[4] == 2, '<' if b[5] == 1 else '>'
if is64:
    shoff, = struct.unpack(end + 'Q', b[0x28:0x30]); shentsize, shnum, shstrndx = struct.unpack(end + 'HHH', b[0x3A:0x40])
else:
    shoff, = struct.unpack(end + 'I', b[0x20:0x24]); shentsize, shnum, shstrndx = struct.unpack(end + 'HHH', b[0x2E:0x34])
def sh(i):
    o = shoff + i * shentsize
    if is64:
        name, typ, _, _, off, size = struct.unpack(end + 'IIQQQQ', b[o:o + 40])
    else:
        name, typ, _, _, off, size = struct.unpack(end + 'IIIIII', b[o:o + 24])
    return name, typ, off, size
_, _, stroff, _ = sh(shstrndx)
names = {b[stroff + sh(i)[0]:].split(b'\0', 1)[0].decode() for i in range(shnum)}
if '.dynsym' not in names:
    sys.exit('.dynsym is gone')
left = sorted(n for n in names if n == '.symtab' or n.startswith('.debug'))
if left:
    sys.exit('still has ' + ', '.join(left))
EOP
    ;;
  cffaedfe|cefaedfe|cafebabe)
    command -v strip >/dev/null 2>&1 || fail "no strip on this Mac."
    strip -x "$f" || fail "strip -x failed on $f."
    command -v codesign >/dev/null 2>&1 || fail "no codesign: an unsigned arm64 binary does not run."
    codesign --force --sign - "$f" || fail "codesign could not re-sign $f."
    codesign --verify --strict "$f" || fail "$f does not verify after re-signing."
    ;;
  4d5a*)
    echo "strip-node: $f is a Windows executable; it carries no symbols to remove." >&2
    exit 0
    ;;
  *)
    fail "$f is not an ELF, Mach-O or PE binary (magic $magic)."
    ;;
esac

after="$(size "$f")"
[ "$after" -le "$before" ] || fail "$f grew from $before to $after bytes."
awk -v b="$before" -v a="$after" -v f="$f" \
  'BEGIN { printf "strip-node: %s %.1f MB -> %.1f MB\n", f, b / 1e6, a / 1e6 }' >&2
