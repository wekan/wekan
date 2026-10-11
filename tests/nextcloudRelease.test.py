#!/usr/bin/env python3
import importlib.util
from pathlib import Path
import tempfile
import tarfile
import io
import unittest
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

    def test_normalizes_semver_without_changing_wekan_image_tags(self):
        self.assertEqual(nc.app_version('13.00'), '13.0.0')
        self.assertEqual(nc.app_version('12.09'), '12.9.0')

    def test_rejects_malformed_version(self):
        for value in ['v12.28', '12.28;bad', 'latest']:
            with self.assertRaises(ValueError):
                nc.app_version(value)


if __name__ == '__main__':
    unittest.main()
