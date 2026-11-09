"""Generate the extension's geometric icon with Python's standard library."""
from pathlib import Path
import struct
import zlib

ROOT = Path(__file__).resolve().parents[1]


def rounded(x, y, left, top, right, bottom, radius):
    if not left <= x <= right or not top <= y <= bottom:
        return False
    cx = min(max(x, left + radius), right - radius)
    cy = min(max(y, top + radius), bottom - radius)
    return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2


def pixel(x, y):
    color = (0, 0, 0, 0)
    if rounded(x, y, 2, 2, 126, 126, 28):
        color = (20, 30, 49, 255)
    if rounded(x, y, 20, 27, 108, 99, 13):
        color = (174, 203, 255, 255)
    if rounded(x, y, 26, 33, 102, 93, 8):
        color = (20, 30, 49, 255)
    if 44 <= y <= 70 and 55 <= x <= 77 - abs(y - 57) * 22 / 13:
        color = (119, 232, 187, 255)
    if rounded(x, y, 39, 79, 62, 84, 2) or rounded(x, y, 67, 79, 89, 84, 2):
        color = (174, 203, 255, 255)
    return color


def chunk(kind, data):
    return struct.pack('!I', len(data)) + kind + data + struct.pack('!I', zlib.crc32(kind + data))


def generate(size):
    rows = bytearray()
    scale = 128 / size
    for y in range(size):
        rows.append(0)
        for x in range(size):
            samples = [pixel((x + (sx + .5) / 4) * scale, (y + (sy + .5) / 4) * scale)
                       for sy in range(4) for sx in range(4)]
            rows.extend(round(sum(p[c] for p in samples) / 16) for c in range(4))
    header = struct.pack('!IIBBBBB', size, size, 8, 6, 0, 0, 0)
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', header) + chunk(b'IDAT', zlib.compress(rows, 9)) + chunk(b'IEND', b'')


if __name__ == '__main__':
    target = ROOT / 'extension' / 'icons'
    target.mkdir(exist_ok=True)
    for size in (16, 32, 48, 128):
        (target / f'icon-{size}.png').write_bytes(generate(size))
    print('Generated icons: 16, 32, 48, 128 px')
