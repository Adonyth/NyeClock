#!/usr/bin/env python3
import pathlib
root = pathlib.Path(__file__).resolve().parent.parent
tw = (root / "tw_.html").read_text(encoding="utf-8")
idx = (root / "index.html").read_text(encoding="utf-8")
js_start = "    (function initNyeCloudSync() {"
js_end = "    })();\n    initLocale();"
a = tw.index(js_start)
b = tw.index(js_end, a)
if a < 0 or b < 0:
    raise SystemExit("tw markers missing")
block = tw[a : b + len(js_end)]
ia = idx.index(js_start)
ib = idx.index(js_end, ia)
out = idx[:ia] + block + idx[ib + len(js_end) :]
(root / "index.html").write_text(out, encoding="utf-8")
print("patched initNyeCloudSync, bytes", len(block))
