#!/usr/bin/env python3
import importlib.util
from pathlib import Path
import tempfile
import tarfile
import io
import unittest
import subprocess
import json
from unittest import mock
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('nextcloud_release', ROOT / 'releases/nextcloud-release.py')
nc = importlib.util.module_from_spec(spec)
spec.loader.exec_module(nc)


class NextcloudRelease(unittest.TestCase):
    def test_metadata_changes_only_app_version_and_image(self):
        with tempfile.TemporaryDirectory(prefix='nextcloud-release-') as directory:
            file = Path(directory) / 'info.xml'
            file.write_text('<info><id>wekan</id><version>1.0.0</version><dependencies><version>31</version></dependencies><external-app><docker-install><image-tag>old</image-tag></docker-install></external-app></info>')
            self.assertEqual(nc.prepare(file, '12.28'), 'wekan')
            root = ET.parse(file).getroot()
            self.assertEqual(root.findtext('version'), '12.28.0')
            self.assertEqual(root.findtext('dependencies/version'), '31')
            self.assertEqual(root.findtext('external-app/docker-install/image-tag'), 'v12.28')

    def test_catalog_requires_matching_app_and_version(self):
        data = [{'id': 'wekan', 'releases': [{'version': '12.28.0'}]}]
        self.assertTrue(nc.published(data, 'wekan', '12.28'))
        self.assertFalse(nc.published(data, 'other', '12.28'))
        self.assertFalse(nc.published(data, 'wekan', '12.29'))
        with self.assertRaises(ValueError):
            nc.published({'error': 'service unavailable'}, 'wekan', '12.28')

    def test_archive_checks_metadata_and_rejects_git_contents(self):
        with tempfile.TemporaryDirectory(prefix='nextcloud-package-') as directory:
            archive = Path(directory) / 'wekan.tar.gz'
            xml = b'<info><id>wekan</id><version>12.28.0</version><external-app><docker-install><image-tag>v12.28</image-tag></docker-install></external-app></info>'
            def package(private=False):
                with tarfile.open(archive, 'w:gz') as output:
                    info = tarfile.TarInfo('wekan/appinfo/info.xml')
                    info.size = len(xml)
                    output.addfile(info, io.BytesIO(xml))
                    if private:
                        output.addfile(tarfile.TarInfo('wekan/.git/config'), io.BytesIO(b''))
            package()
            nc.verify_archive(archive, 'wekan', '12.28')
            with self.assertRaises(ValueError):
                nc.verify_archive(archive, 'wekan', '12.29')
            package(private=True)
            with self.assertRaises(ValueError):
                nc.verify_archive(archive, 'wekan', '12.28')

    def test_archive_rejects_secrets_traversal_links_and_duplicate_metadata(self):
        xml = b'<info><id>wekan</id><version>12.28.0</version><external-app><docker-install><image-tag>v12.28</image-tag></docker-install></external-app></info>'
        for bad in ['wekan/.tools/token', 'wekan/.env', 'wekan/node_modules/package.json',
                    'wekan/certificate.pem', 'wekan/signing.key', '../escape', '/absolute',
                    'other/appinfo/info.xml', 'wekan/appinfo/info.xml', 'wekan/./appinfo/info.xml', 'wekan/link']:
            with self.subTest(member=bad), tempfile.TemporaryDirectory() as directory:
                archive = Path(directory) / 'wekan.tar.gz'
                with tarfile.open(archive, 'w:gz') as output:
                    metadata = tarfile.TarInfo('wekan/appinfo/info.xml')
                    metadata.size = len(xml)
                    output.addfile(metadata, io.BytesIO(xml))
                    member = tarfile.TarInfo(bad)
                    if bad.endswith('/link'):
                        member.type = tarfile.SYMTYPE
                        member.linkname = '/outside'
                    output.addfile(member)
                with self.assertRaises(ValueError):
                    nc.verify_archive(archive, 'wekan', '12.28')

    def test_main_skips_existing_release_without_rewriting_metadata_and_propagates_catalog_failure(self):
        with tempfile.TemporaryDirectory(prefix='nextcloud-plan-') as directory:
            root = Path(directory)
            info = root / 'info.xml'
            info.write_text('<info><id>wekan</id><version>keep-me</version></info>')
            output = root / 'output'
            catalog = io.BytesIO(json.dumps([{'id': 'wekan', 'releases': [{'version': '12.28.0'}]}]).encode())
            with mock.patch('sys.argv', ['nextcloud-release.py', '--version', '12.28', '--info', str(info)]), \
                 mock.patch.dict('os.environ', {'GITHUB_OUTPUT': str(output)}), \
                 mock.patch.object(nc.urllib.request, 'urlopen', return_value=catalog):
                nc.main()
            self.assertIn('keep-me', info.read_text())
            self.assertIn('skip=true', output.read_text())
            with mock.patch('sys.argv', ['nextcloud-release.py', '--version', '12.28', '--info', str(info)]), \
                 mock.patch.object(nc.urllib.request, 'urlopen', side_effect=OSError('offline')):
                with self.assertRaises(OSError):
                    nc.main()
            self.assertIn('keep-me', info.read_text())

    def test_workflow_tar_layout_is_accepted_without_git_or_temporary_files(self):
        with tempfile.TemporaryDirectory(prefix='nextcloud-tar-') as directory:
            root = Path(directory)
            source = root / 'source'
            (source / 'appinfo').mkdir(parents=True)
            (source / 'appinfo/info.xml').write_text('<info><id>wekan</id><version>12.28.0</version><external-app><docker-install><image-tag>v12.28</image-tag></docker-install></external-app></info>')
            for name in ['.git', '.tools', 'node_modules']:
                (source / name).mkdir()
                (source / name / 'private').write_text('must not be packaged')
            archive = root / 'wekan.tar.gz'
            subprocess.run(['tar', '--exclude=.git', '--exclude=.tools', '--exclude=.env', '--exclude=node_modules',
                            '-czf', str(archive), '--transform', r's,^\.$,wekan,;s,^\./,wekan/,',
                            '-C', str(source), '.'], check=True)
            nc.verify_archive(archive, 'wekan', '12.28')

    def test_real_signature_accepts_archive_and_rejects_tampering(self):
        # Test credentials exist only in the temporary directory, never in the package.
        with tempfile.TemporaryDirectory(prefix='nextcloud-signature-') as directory:
            root = Path(directory)
            def openssl(*args, check=True):
                return subprocess.run(['openssl', *map(str, args)], cwd=root, check=check,
                                      stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            openssl('req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', 'test.key',
                    '-out', 'test.crt', '-subj', '/CN=wekan-local-test', '-days', '1')
            (root / 'archive').write_bytes(b'local release fixture')
            openssl('dgst', '-sha512', '-sign', 'test.key', '-out', 'signature', 'archive')
            public = openssl('x509', '-pubkey', '-noout', '-in', 'test.crt').stdout
            (root / 'public').write_bytes(public)
            openssl('dgst', '-sha512', '-verify', 'public', '-signature', 'signature', 'archive')
            (root / 'archive').write_bytes(b'tampered release fixture')
            self.assertNotEqual(openssl('dgst', '-sha512', '-verify', 'public', '-signature',
                                       'signature', 'archive', check=False).returncode, 0)

    def test_normalizes_semver_without_changing_wekan_image_tags(self):
        self.assertEqual(nc.app_version('13.00'), '13.0.0')
        self.assertEqual(nc.app_version('12.09'), '12.9.0')

    def test_rejects_malformed_version(self):
        for value in ['v12.28', '12.28;bad', 'latest']:
            with self.assertRaises(ValueError):
                nc.app_version(value)


if __name__ == '__main__':
    unittest.main()
