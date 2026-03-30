#!/usr/bin/env python3
"""Remove <<<<<<< HEAD / ======= / >>>>>>> markers, keep first side only."""
import re
import sys

PAT = re.compile(
    r"<<<<<<< HEAD\n(.*?)\n=======\n.*?\n>>>>>>> origin/main\n",
    re.DOTALL,
)


def strip_conflicts(text: str) -> str:
    prev = None
    while prev != text:
        prev = text
        text = PAT.sub(lambda m: m.group(1) + "\n", text, count=1)
    return text


def main():
    path = sys.argv[1]
    with open(path, encoding="utf-8") as f:
        raw = f.read()
    if "<<<<<<< HEAD" not in raw:
        print("no conflicts:", path)
        return
    out = strip_conflicts(raw)
    while "<<<<<<< HEAD" in out:
        out = PAT.sub(lambda m: m.group(1) + "\n", out, count=1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(out)
    print("stripped:", path)


if __name__ == "__main__":
    main()
