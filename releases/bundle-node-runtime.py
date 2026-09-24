#!/usr/bin/env python3
"""Copy the build environment's matching libatomic into a Linux Node bundle.

Run inside the target architecture's builder, after installing libatomic1.
AppImage and Flatpak inherit this directory from the release ZIP. Never copy a
host library into a foreign-architecture bundle. Native Windows/macOS builds
remove the inherited Linux runtime directory instead.
"""
import argparse
from pathlib import Path
import shutil
import sys


def elf_target(path):
    with Path(path).open('rb') as stream:
        header = stream.read(20)
    if not header.startswith(b'\x7fELF'):
        return None
    if len(header) < 20 or header[4] not in (1, 2) or header[5] not in (1, 2):
        raise ValueError('Invalid ELF header: ' + str(path))
    return header[4], header[5], header[18:20]


def bundle_runtime(node, root=Path('/')):
    node = Path(node)
    target = elf_target(node)
    destination = node.parent / 'node-runtime'
    if target is None:
        if destination.exists():
            shutil.rmtree(destination)
        return
    candidates = []
    for base in ('lib', 'lib64', 'usr/lib', 'usr/lib64'):
        folder = root / base
        candidates.extend(folder.glob('libatomic.so.1'))
        candidates.extend(folder.glob('*/libatomic.so.1'))
    library = next((p for p in sorted(candidates) if p.is_file() and elf_target(p) == target), None)
    if library is None:
        raise ValueError('No matching libatomic.so.1; install libatomic1 in the target builder')
    copyright_file = root / 'usr/share/doc/libatomic1/copyright'
    if not copyright_file.is_file():
        raise ValueError('Missing libatomic1 copyright file in target builder')
    destination.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(library.resolve(), destination / 'libatomic.so.1')
    shutil.copyfile(copyright_file, destination / 'libatomic1.copyright')
    # Debian's copyright refers to the common GPL text.
    gpl = root / 'usr/share/common-licenses/GPL-3'
    if gpl.is_file():
        shutil.copyfile(gpl, destination / 'GPL-3')
    print('Bundled matching libatomic.so.1 for ' + str(node), file=sys.stderr)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('node', type=Path)
    args = parser.parse_args()
    try:
        bundle_runtime(args.node)
    except (OSError, ValueError) as error:
        parser.exit(1, str(error) + '\n')
