#!/usr/bin/env python3
"""Turn a saved Rob's Coding Helper reply ({"text": ...} from helper_chat.mjs extract) into a clean patch.
    python3 scripts/helper_diff_extract.py <reply.json> <out.patch>
Keeps diff lines, drops Copilot UI chrome, restores blank context lines, stops at trailing prose."""
import json, sys
CHROME = {"Show more lines", "Show less", "Copy", "Diff", "diff", "Code", "code"}
def extract(text):
    out, in_hunk = [], False
    for line in text.split("\n"):
        if line.strip() in CHROME: continue
        if line.startswith(("diff --git", "--- ", "+++ ", "index ")): out.append(line); in_hunk = False; continue
        if line.startswith("@@"): in_hunk = True; out.append(line); continue
        if in_hunk and line[:1] in (" ", "+", "-", "\\"): out.append(line); continue
        if in_hunk and line == "": out.append(" "); continue
        if in_hunk: in_hunk = False
    return "\n".join(out).rstrip(" \n") + "\n"
if __name__ == "__main__":
    if len(sys.argv) != 3: sys.exit("usage: helper_diff_extract.py <reply.json> <out.patch>")
    d = json.load(open(sys.argv[1])); t = d.get("text", "") if isinstance(d, dict) else str(d)
    if not t.strip(): sys.exit("EMPTY: no diff text in the saved reply")
    p = extract(t); h = sum(1 for l in p.splitlines() if l.startswith("@@"))
    if not h: sys.exit("NO HUNKS: reply is prose only or a MORE/CONTINUE marker")
    open(sys.argv[2], "w").write(p); print(f"wrote {sys.argv[2]}: {h} hunks, {len(p.splitlines())} lines")
