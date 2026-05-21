"""
Extract body text from a HWP 5 file as paragraph-per-line plain text.

Why this exists:
  hwp5txt (pyhwp CLI) flattens table contents and drops them as <표> placeholders.
  We need the table cell content for parsing the 사고도구어 word list, so we go
  one level lower and walk the BodyText/Section streams ourselves.

Usage:
  python scripts/extract-hwp-text.py <hwp-file> [output.txt]

Output format:
  Each non-empty paragraph on its own line, prefixed with `[N] ` where N is
  the running index. Suitable for scripts/extract-sago.mjs.
"""
import struct
import zlib
import sys
from pathlib import Path

import olefile

HWPTAG_BEGIN = 0x10
HWPTAG_PARA_HEADER = HWPTAG_BEGIN + 50
HWPTAG_PARA_TEXT = HWPTAG_BEGIN + 51

# Inline-control char codes (16-bit) in PARA_TEXT that consume 16 bytes total
# (1 leading wide-char + 7 trailing parameter wide-chars). Codes 10 (LF) and
# 13 (paragraph break) are kept as line breaks.
EXTENDED_CONTROLS = {1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23}


def parse_records(data: bytes):
    pos = 0
    while pos < len(data):
        if pos + 4 > len(data):
            break
        h = struct.unpack("<I", data[pos:pos + 4])[0]
        pos += 4
        tag = h & 0x3FF
        size = (h >> 20) & 0xFFF
        if size == 0xFFF:
            size = struct.unpack("<I", data[pos:pos + 4])[0]
            pos += 4
        payload = data[pos:pos + size]
        pos += size
        yield tag, payload


def decode_para_text(payload: bytes) -> str:
    out = []
    i = 0
    while i + 1 < len(payload):
        code = payload[i] | (payload[i + 1] << 8)
        if code >= 32:
            out.append(chr(code))
            i += 2
        else:
            if code in EXTENDED_CONTROLS:
                i += 16
            else:
                if code in (10, 13):
                    out.append("\n")
                i += 2
    return "".join(out)


def extract(src: str, dst: str) -> int:
    ole = olefile.OleFileIO(src)
    fh = ole.openstream("FileHeader").read()
    property_flags = struct.unpack("<I", fh[36:40])[0]
    compressed = bool(property_flags & 0x01)

    sections = sorted(
        [s for s in ole.listdir() if len(s) >= 2 and s[0] == "BodyText" and s[1].startswith("Section")],
        key=lambda s: int(s[1].replace("Section", "")),
    )
    paragraphs = []
    for s in sections:
        raw = ole.openstream("/".join(s)).read()
        data = zlib.decompress(raw, -15) if compressed else raw
        current = []
        for tag, payload in parse_records(data):
            if tag == HWPTAG_PARA_HEADER:
                if current:
                    paragraphs.append("".join(current).strip())
                    current = []
            elif tag == HWPTAG_PARA_TEXT:
                current.append(decode_para_text(payload))
        if current:
            paragraphs.append("".join(current).strip())

    paragraphs = [p for p in paragraphs if p]
    with open(dst, "w", encoding="utf-8") as f:
        for i, p in enumerate(paragraphs):
            f.write(f"[{i}] {p}\n")
    return len(paragraphs)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scripts/extract-hwp-text.py <hwp-file> [out.txt]", file=sys.stderr)
        sys.exit(2)
    src = sys.argv[1]
    dst = sys.argv[2] if len(sys.argv) > 2 else str(Path(src).with_suffix(".paras.txt"))
    n = extract(src, dst)
    print(f"Wrote {n} paragraphs → {dst}")
