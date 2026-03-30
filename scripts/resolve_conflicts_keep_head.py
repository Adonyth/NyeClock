#!/usr/bin/env python3
"""Remove Git conflict markers, keeping the <<<<<<< HEAD ... ======= side only."""
import sys


def resolve_keep_head(text: str) -> str:
    start = "<<<<<<< HEAD\n"
    mid = "\n=======\n"
    end = "\n>>>>>>> origin/main\n"
    end_alt = "\n>>>>>>> origin/main"  # EOF without newline

    while True:
        i = text.find(start)
        if i == -1:
            return text
        j = text.find(mid, i)
        if j == -1:
            raise ValueError(f"Missing ======= after conflict at {i}")
        k = text.find(end, j)
        if k == -1:
            k = text.find(end_alt, j)
            if k == -1:
                raise ValueError(f"Missing >>>>>>> after conflict at {j}")
            tail_len = len(end_alt)
        else:
            tail_len = len(end)
        head_content = text[i + len(start) : j]
        text = text[:i] + head_content + text[k + tail_len :]


def main():
    for path in sys.argv[1:]:
        with open(path, encoding="utf-8") as f:
            raw = f.read()
        if "<<<<<<< HEAD" not in raw:
            print(f"skip (no conflicts): {path}")
            continue
        out = resolve_keep_head(raw)
        with open(path, "w", encoding="utf-8") as f:
            f.write(out)
        print(f"resolved: {path}")


if __name__ == "__main__":
    main()
