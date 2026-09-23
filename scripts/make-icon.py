#!/usr/bin/env python3
"""앱 아이콘 생성 — 포인트 컬러 바탕에 밥그릇과 젓가락.
   외부 라이브러리 없이 PNG를 직접 써서 만든다.  python3 scripts/make-icon.py"""
import zlib, struct, math, os

CORAL = (0xFB, 0x65, 0x45)
WHITE = (0xFF, 0xFF, 0xFF)
SS = 3                                   # 계단 현상을 없애려고 3배로 그려 평균 낸다

def png(path, w, h, rows):
    raw = b''.join(b'\x00' + bytes(r) for r in rows)
    def chunk(tag, data):
        c = struct.pack('>I', len(data)) + tag + data
        return c + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)
    out = (b'\x89PNG\r\n\x1a\n'
           + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0))
           + chunk(b'IDAT', zlib.compress(raw, 9))
           + chunk(b'IEND', b''))
    open(path, 'wb').write(out)

def capsule(p, a, b, r):
    (x, y), (x1, y1), (x2, y2) = p, a, b
    dx, dy = x2 - x1, y2 - y1
    L2 = dx*dx + dy*dy
    t = 0 if L2 == 0 else max(0, min(1, ((x-x1)*dx + (y-y1)*dy) / L2))
    ox, oy = x1 + t*dx - x, y1 + t*dy - y
    return ox*ox + oy*oy <= r*r

def art(x, y, S):
    """그릇에 젓가락을 꽂은 모양. S=1024 기준 좌표를 비율로 쓴다."""
    u = S / 1024.0
    # 젓가락 두 짝 (그릇보다 먼저 그려 그릇에 꽂힌 것처럼 보이게)
    if capsule((x, y), (700*u, 168*u), (612*u, 556*u), 21*u): return True
    if capsule((x, y), (790*u, 196*u), (700*u, 566*u), 21*u): return True
    # 그릇 아가리
    if capsule((x, y), (238*u, 586*u), (786*u, 586*u), 30*u): return True
    # 그릇 몸통 (아래쪽 반원)
    dx, dy = x - 512*u, y - 588*u
    if dy >= 0 and dx*dx + dy*dy <= (252*u)**2: return True
    return False

def render(size, bg, fg, scale=1.0, dy=0.0):
    """bg=None이면 배경을 투명하게 둔다. scale로 그림만 줄여 여백을 준다."""
    rows = []
    for py in range(size):
        row = bytearray()
        for px in range(size):
            hit = 0
            for sy in range(SS):
                for sx in range(SS):
                    X = (px + (sx + .5)/SS - size/2) / scale + size/2
                    Y = (py + (sy + .5)/SS - size/2) / scale + size/2 - dy*size
                    if art(X, Y, size): hit += 1
            a = hit / (SS*SS)
            if bg is None:
                row += bytes((fg[0], fg[1], fg[2], int(round(a*255))))
            else:
                row += bytes(tuple(int(round(bg[i]*(1-a) + fg[i]*a)) for i in range(3)) + (255,))
        rows.append(row)
    return rows

os.makedirs('assets', exist_ok=True)
jobs = [
    ('assets/icon.png',                     1024, CORAL, WHITE, 0.94, -0.03),  # 눈으로 봤을 때 가운데 오게 조금 올린다
    ('assets/android-icon-background.png',  1024, CORAL, CORAL, 1.00,  0.0),
    ('assets/android-icon-foreground.png',  1024, None,  WHITE, 0.60, -0.03),  # 안전 영역만큼 줄인다
    ('assets/android-icon-monochrome.png',  1024, None,  WHITE, 0.60, -0.03),
    ('assets/splash-icon.png',              1024, None,  CORAL, 0.74, -0.03),
    ('assets/favicon.png',                    64, CORAL, WHITE, 0.94, -0.03),
]
for path, size, bg, fg, scale, dy in jobs:
    png(path, size, size, render(size, bg, fg, scale, dy))
    print(f'  {path}  {size}×{size}')
