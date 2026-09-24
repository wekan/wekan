#!/usr/bin/env python3
import importlib.util
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('runtime', Path(__file__).resolve().parents[1] / 'releases/bundle-node-runtime.py')
runtime = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runtime)


def elf(machine, bits=2, endian=1):
    data = bytearray(64)
    data[:6] = b'\x7fELF' + bytes((bits, endian))
    data[18:20] = machine.to_bytes(2, 'little' if endian == 1 else 'big')
    return data


class BundleRuntime(unittest.TestCase):
    def test_architectures_and_dereferenced_library(self):
        for machine, bits, endian in [(62, 2, 1), (183, 2, 1), (3, 1, 1),
                                      (40, 1, 1), (21, 2, 1), (22, 2, 2), (243, 2, 1), (258, 2, 1)]:
            with self.subTest(machine=machine), tempfile.TemporaryDirectory() as tmp:
                root = Path(tmp)
                node = root / 'bundle/node'
                node.parent.mkdir()
                node.write_bytes(elf(machine, bits, endian))
                lib = root / 'usr/lib/target/libatomic.so.1.2.0'
                lib.parent.mkdir(parents=True)
                lib.write_bytes(elf(machine, bits, endian))
                lib.with_name('libatomic.so.1').symlink_to(lib.name)
                license = root / 'usr/share/doc/libatomic1/copyright'
                license.parent.mkdir(parents=True)
                license.write_text('GCC runtime license')
                runtime.bundle_runtime(node, root)
                output = node.parent / 'node-runtime/libatomic.so.1'
                self.assertFalse(output.is_symlink())
                self.assertEqual(output.read_bytes(), lib.read_bytes())
                self.assertEqual((output.parent / 'libatomic1.copyright').read_text(), license.read_text())
                # A target change must never reuse the previous CPU's library.
                node.write_bytes(elf(999))
                with self.assertRaisesRegex(ValueError, 'No matching'):
                    runtime.bundle_runtime(node, root)

    def test_missing_license_is_fatal(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            node = root / 'node'
            node.write_bytes(elf(62))
            lib = root / 'lib/libatomic.so.1'
            lib.parent.mkdir()
            lib.write_bytes(elf(62))
            with self.assertRaisesRegex(ValueError, 'copyright'):
                runtime.bundle_runtime(node, root)

    def test_native_windows_and_mac_remove_inherited_linux_runtime(self):
        for header in [b'MZ', b'\xcf\xfa\xed\xfe']:
            with tempfile.TemporaryDirectory() as tmp:
                node = Path(tmp) / 'node'
                node.write_bytes(header)
                folder = node.parent / 'node-runtime'
                folder.mkdir()
                (folder / 'libatomic.so.1').write_bytes(elf(62))
                runtime.bundle_runtime(node, Path(tmp))
                self.assertFalse(folder.exists())


if __name__ == '__main__':
    unittest.main()
