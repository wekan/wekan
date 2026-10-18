#!/usr/bin/env python3
# Inject a single executable application's blob into an ELF Node.js - what
# `node --build-sea` does, but in a 64-bit process.
#
#   python3 sea-inject-elf.py <node> <sea-prep.blob> <out>
#
# Why. --build-sea injects with LIEF inside the Node.js that runs it, and a
# 32-bit target's blob must be written by a 32-bit Node.js (its lengths are
# size_t). The executable, the 180 MiB archive and LIEF's copies of both do
# not fit that process's address space: armhf (v12.53) and armv7 (v12.54, all
# three attempts) stopped with std::bad_alloc. So build.mjs has the 32-bit
# Node.js write only the blob (--experimental-sea-config, no LIEF) and this
# injects it with the same LIEF version Node vendors (1.0.0, from PyPI).
#
# Each step is node's src/node_sea_bin.cc, InjectIntoELF() and MarkSentinel(),
# in the same order and with the same names, so the result is the file
# --build-sea writes: tests/singleFileSeaInject.test.cjs compares the two
# byte for byte.
import os
import stat
import sys

import lief

RESOURCE = "NODE_SEA_BLOB"            # kSEAResourceName
SECTION = ".note.node.sea"            # kELFSectionName
NOTE_TYPE = 0                         # kNoteType
FUSE = b"NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2"


def fail(msg):
    print(f"sea-inject-elf: {msg}", file=sys.stderr)
    sys.exit(1)


def inject(exe_path, blob_path, out_path):
    with open(blob_path, "rb") as f:
        blob = f.read()
    binary = lief.ELF.parse(exe_path)
    if binary is None:
        fail("Failed to parse ELF binary")
    for n in binary.notes:
        # Node compares the raw name; one that is not even UTF-8 is not it.
        try:
            name = n.name
        except UnicodeDecodeError:
            continue
        if name.startswith(RESOURCE):
            fail(f"note section {RESOURCE} already exists in the ELF executable")
    note = lief.ELF.Note.create(RESOURCE, NOTE_TYPE, list(memoryview(blob)), SECTION)
    del blob
    if note is None:
        fail(f"Failed to create new ELF note {RESOURCE}")
    if (binary.header.file_type == lief.ELF.Header.FILE_TYPE.EXEC
            and binary.relocate_phdr_table(lief.ELF.Binary.PHDR_RELOC.BSS_END) == 0):
        fail("Failed to relocate ELF program headers")
    binary.add(note)
    cfg = lief.ELF.Builder.config_t()
    cfg.notes = True
    cfg.dynamic_section = True
    builder = lief.ELF.Builder(binary, cfg)
    builder.build()
    data = bytearray(builder.get_build())
    if not data:
        fail("Failed to build modified ELF binary")

    first = data.find(FUSE)
    if first < 0:
        fail(f"sentinel {FUSE.decode()} not found")
    if data.rfind(FUSE) != first:
        fail(f"found more than one occurrence of sentinel {FUSE.decode()}")
    colon = first + len(FUSE)
    if colon >= len(data) or data[colon:colon + 1] != b":":
        fail(f"missing ':' after sentinel {FUSE.decode()}")
    if colon + 1 >= len(data):
        fail("Sentinel index out of range")
    if data[colon + 1:colon + 2] == b"1":
        fail("Sentinel is already marked")
    if data[colon + 1:colon + 2] != b"0":
        fail(f"Sentinel has invalid value {data[colon + 1]}")
    data[colon + 1] = ord("1")

    with open(out_path, "wb") as f:
        f.write(data)
    # --build-sea copies the source executable's mode.
    os.chmod(out_path, stat.S_IMODE(os.stat(exe_path).st_mode))


if __name__ == "__main__":
    if len(sys.argv) != 4:
        fail("usage: sea-inject-elf.py <node> <sea-prep.blob> <out>")
    if lief.__version__.split("-")[0] != "1.0.0":
        fail(f"LIEF {lief.__version__} is not 1.0.0, the version Node.js vendors")
    inject(*sys.argv[1:])
