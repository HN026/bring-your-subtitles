"""Build a reproducible, dependency-free extension ZIP and SHA-256 checksum."""
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]


def main():
    source = ROOT / 'extension'
    manifest = json.loads((source / 'manifest.json').read_text())
    version = manifest['version']
    if not re.fullmatch(r'\d+\.\d+\.\d+', version):
        raise ValueError('Expected a three-part numeric version')
    target = ROOT / 'dist'
    target.mkdir(exist_ok=True)
    archive = target / f'bring-your-subtitles-{version}.zip'
    with ZipFile(archive, 'w', compression=ZIP_DEFLATED) as output:
        for path in sorted(source.rglob('*')):
            if not path.is_file() or any(part.startswith('.') for part in path.relative_to(source).parts):
                continue
            info = ZipInfo(path.relative_to(source).as_posix(), (2026, 1, 1, 0, 0, 0))
            info.compress_type = ZIP_DEFLATED
            info.create_system = 3
            info.external_attr = 0o100644 << 16
            output.writestr(info, path.read_bytes())
        for filename in ('LICENSE', 'INSTALL.md'):
            info = ZipInfo(filename, (2026, 1, 1, 0, 0, 0))
            info.compress_type = ZIP_DEFLATED
            info.create_system = 3
            info.external_attr = 0o100644 << 16
            output.writestr(info, (ROOT / filename).read_bytes())
    with ZipFile(archive) as check:
        if check.testzip() is not None or 'manifest.json' not in check.namelist():
            raise ValueError('Invalid extension archive')
    digest = hashlib.sha256(archive.read_bytes()).hexdigest()
    (target / 'SHA256SUMS.txt').write_text(f'{digest}  {archive.name}\n')
    print(f'{archive}\nSHA-256: {digest}')


if __name__ == '__main__':
    main()
