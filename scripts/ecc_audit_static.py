#!/usr/bin/env python3
"""Static audit of an app repo against the Ensign Career Coach design system.

No dependencies. Same result from Claude, Codex, Antigravity or CI.

    python3 scripts/ecc_audit_static.py <repo> [<repo> ...] [--json out.json] [--ds <this repo>]

Exit code 1 if any FAIL. Severity: FAIL blocks a merge, WARN needs a reason in the PR, INFO is context.
"""
import argparse, hashlib, json, pathlib, re, subprocess, sys

DS = pathlib.Path(__file__).resolve().parent.parent
VENDORED = ("ecc-tokens.css", "ecc-ces-compat.css", "ecc-components.base.css", "ecc-app.css")
SKIP = re.compile(r"(node_modules|/dist/|/build/|\.min\.css$|ces-tokens\.css$|ces-components\.css$|ecc-[a-z.-]+\.css$)")
FLOOR_PX = 17
RULE = re.compile(r"([^{}@][^{}]*)\{([^{}]*)\}")
FONT = re.compile(r"font-size\s*:\s*([0-9.]+)(px|rem)\b")
EMOJI = re.compile("[\U0001F300-\U0001FAFF☀-➿]")
GOLD = re.compile(r"#fdb515|#d49e24|--ces-gold|--accent-gold", re.I)
# Containers where trapping the wheel is intended (they are fixed-height overlays)
OVERLAY = re.compile(r"modal|dialog|drawer|overlay|scrim|dropdown|popover|menu|ecc-sidebar", re.I)
LAYOUT_SEL = re.compile(r"container|app|shell|main|page|layout|wrapper|card|grid|view|workspace|feed|content", re.I)
OFF_FAMILY = re.compile(r"font-family\s*:[^;]*\b(Inter|Georgia|Libre Baskerville|Space Grotesk|Times)\b", re.I)


def tracked(repo):
    try:
        out = subprocess.check_output(["git", "-C", str(repo), "ls-files"], text=True)
        return [repo / p for p in out.splitlines()]
    except Exception:
        return [p for p in repo.rglob("*") if p.is_file()]


def css_of(path):
    txt = path.read_text(errors="ignore")
    if path.suffix == ".html":
        return "\n".join(re.findall(r"<style[^>]*>(.*?)</style>", txt, re.S)), txt
    return txt, ""


def lum(hexv):
    hexv = hexv.lstrip("#")
    if len(hexv) == 3:
        hexv = "".join(c * 2 for c in hexv)
    r, g, b = (int(hexv[i:i + 2], 16) / 255 for i in (0, 2, 4))
    f = lambda c: c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)


def audit(repo):
    findings = []
    add = lambda sev, code, where, msg: findings.append({"severity": sev, "code": code, "where": where, "message": msg})
    files = [p for p in tracked(repo) if p.suffix in (".css", ".html") and not SKIP.search(str(p))]

    # custom properties declared anywhere, so var(--x) page backgrounds resolve
    props = {}
    for p in files:
        for name, val in re.findall(r"(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{3,6})\b", css_of(p)[0]):
            props.setdefault(name, val)

    for p in files:
        rel = str(p.relative_to(repo))
        css, html = css_of(p)
        clean = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
        # U+00A0 is not CSS whitespace: outside strings it silently kills the next selector or declaration
        code = re.sub(r"\"(?:\\.|[^\"\\])*\"|'(?:\\.|[^'\\])*'", "", clean)
        if "\u00a0" in code:
            add("FAIL", "nbsp-in-css", rel, f"{code.count(chr(0xA0))} non-breaking space(s) outside strings; replace with a normal space or blank line")
        for m in RULE.finditer(clean):
            sel, body = " ".join(m.group(1).split()), m.group(2)
            if "forced-colors" in sel:
                continue
            for fm in FONT.finditer(body):
                px = float(fm.group(1)) * (16 if fm.group(2) == "rem" else 1)
                if px < FLOOR_PX:
                    add("FAIL", "text-below-floor", f"{rel} :: {sel[:80]}", f"font-size {fm.group(1)}{fm.group(2)} = {px:.1f}px, floor is {FLOOR_PX}px")
            if ":focus" in sel and re.search(r"outline\s*:\s*(none|0)\b", body) and "outline-color" not in body:
                add("FAIL", "focus-removed", f"{rel} :: {sel[:80]}", "outline removed on focus; keep a 2px brand outline")
            if re.search(r"color-scheme\s*:\s*dark", body):
                add("FAIL", "dark-theme", f"{rel} :: {sel[:80]}", "design system is light-only")
            if re.search(r"^(html|body|:root)\b", sel):
                bgs = re.findall(r"background(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,6})\b", body)
                bgs += [props[v] for v in re.findall(r"background(?:-color)?\s*:\s*var\((--[\w-]+)", body) if v in props]
                for hv in bgs:
                    if lum(hv) < 0.2:
                        add("FAIL", "dark-theme", f"{rel} :: {sel[:80]}", f"page background {hv} is dark")
            if GOLD.search(body) and re.search(r"btn|button|a\b|link|pill|badge|chip|border", sel, re.I):
                add("WARN", "gold-as-ui", f"{rel} :: {sel[:80]}", "gold is an identity mark only; UI actions use brand")
            if OFF_FAMILY.search(body):
                add("WARN", "off-family", f"{rel} :: {sel[:80]}", "Montserrat is the only family")
            # Scroll model: overscroll-behavior contain/none stops the wheel at that element. On a view or feed
            # this makes the page unscrollable over it, so the wheel only works over the margins.
            if re.search(r"overscroll-behavior(?:-y|-block)?\s*:\s*(contain|none)", body) and not OVERLAY.search(sel):
                add("FAIL", "scroll-trap", f"{rel} :: {sel[:80]}", "overscroll-behavior contain/none outside an overlay; use auto so the wheel reaches the page")
            # overflow-y:auto with no height bound never overflows but still latches the wheel in Chromium/Edge
            if re.search(r"overflow(?:-y)?\s*:\s*(auto|scroll)", body) and not re.search(r"(?<![-\w])(max-)?(height|block-size)\s*:", body) \
                    and not OVERLAY.search(sel) and LAYOUT_SEL.search(sel):
                add("WARN", "unbounded-scroller", f"{rel} :: {sel[:80]}", "inner scroller with no height in this rule; bound it (feed) or let the page scroll (views)")
            # Fill the width: a fixed px cap on the page shell or a view leaves side space
            wm = re.search(r"(?<![-\w])max-width\s*:\s*(\d+)px", body)
            if wm and int(wm.group(1)) >= 760 and LAYOUT_SEL.search(sel) and not OVERLAY.search(sel) and not re.search(r"@media|print", sel):
                add("FAIL", "width-cap", f"{rel} :: {sel[:80]}", f"max-width {wm.group(1)}px on a layout container; fill to the --gutter (max-width: 100vw or none)")
            if re.search(r"max-width\s*:\s*min\(\s*(1180|1320|1360)px", body) and re.search(r"message|feed|composer|input|container|shell|chat", sel, re.I):
                add("INFO", "width-cap", f"{rel} :: {sel[:80]}", "design system fills the width to the gutter; review this cap")
        if html:
            if "Montserrat" not in html and "<head" in html:
                add("WARN", "font-not-loaded", rel, "Montserrat is not linked from Google Fonts")
            if not re.search(r"ecc-tokens\.css", html) and "<head" in html:
                add("FAIL", "tokens-not-linked", rel, "ecc-tokens.css is not linked")
            body_txt = re.sub(r"<(script|style)[^>]*>.*?</\1>", "", html, flags=re.S)
            n = len(EMOJI.findall(body_txt))
            if n:
                add("WARN", "emoji-markers", rel, f"{n} emoji in markup; use aria-hidden SVG icons or plain labels")
            for m in re.finditer(r"<(textarea|input)(?![^>]*type=\"(?:hidden|file|checkbox|radio|submit|button)\")[^>]*>", html):
                tag = m.group(0)
                idm = re.search(r'id="([^"]+)"', tag)
                if idm and not re.search(rf'<label[^>]*for="{re.escape(idm.group(1))}"', html) and "aria-label" not in tag:
                    add("WARN", "field-unlabeled", f"{rel} #{idm.group(1)}", "text field has no <label for> or aria-label")

    # behavior checks in scripts: wheel hijacks, upload placement, response-format parity
    js_files = [p for p in tracked(repo) if p.suffix == ".js" and not SKIP.search(str(p)) and "_vercel" not in str(p)]
    streams = any("text/event-stream" in p.read_text(errors="ignore") for p in tracked(repo) if p.suffix == ".py")
    for p in js_files:
        rel = str(p.relative_to(repo))
        js = re.sub(r"//[^\n]*|/\*.*?\*/", "", p.read_text(errors="ignore"), flags=re.S)
        if re.search(r"addEventListener\(\s*['\"]wheel['\"]", js) or re.search(r"\bonwheel\s*=", js):
            add("FAIL", "wheel-hijack", rel, "custom wheel listener; native scroll chaining must own the wheel")
        if streams and re.search(r"fetch\(\s*['\"`][^'\"`]*/api/chat", js) and ".json()" in js and "event-stream" not in js:
            add("FAIL", "response-format-mismatch", rel, "a server path streams text/event-stream but this page only parses JSON; read both")
    for p in [p for p in tracked(repo) if p.suffix == ".html" and not SKIP.search(str(p))]:
        html = p.read_text(errors="ignore")
        feed = re.search(r'id="(chat-messages|chat-feed|messages|feed)"|class="[^"]*\becc-feed\b', html)
        files_after = feed and re.search(r'type="file"', html[feed.end():])
        if files_after:
            # a file input after the feed is fine only inside an intake form, not the chat composer
            tail = html[feed.end():feed.end() + files_after.end()]
            if not re.search(r"intake|modal|dialog", tail, re.I):
                add("WARN", "upload-below-feed", str(p.relative_to(repo)), "chat upload sits below the conversation; put it at the top of the chat workspace")

    # vendored design-system files: present, current, and public/static in sync
    ds_hash = {n: hashlib.sha256((DS / "css" / n).read_bytes()).hexdigest() for n in VENDORED if (DS / "css" / n).exists()}
    web_dirs = sorted({p.parent for p in tracked(repo) if p.name == "index.html" and not SKIP.search(str(p))})
    for d in web_dirs:
        rel = str(d.relative_to(repo)) or "."
        for n, h in ds_hash.items():
            f = d / n
            if not f.exists():
                add("FAIL", "ds-missing", f"{rel}/{n}", "vendored design-system file missing; run scripts/vendor_into_app.sh")
            elif hashlib.sha256(f.read_bytes()).hexdigest() != h:
                add("FAIL", "ds-stale", f"{rel}/{n}", "differs from ensign-design-system; re-vendor, never hand-edit")
    pub, sta = repo / "public", repo / "static"
    if pub.is_dir() and sta.is_dir():
        for p in pub.rglob("*"):
            q = sta / p.relative_to(pub)
            if p.is_file() and p.suffix in (".css", ".html", ".js") and q.exists() and p.read_bytes() != q.read_bytes():
                add("FAIL", "public-static-drift", str(p.relative_to(repo)), "public/ and static/ must stay byte-identical")
    return findings


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("repos", nargs="+")
    ap.add_argument("--json")
    a = ap.parse_args()
    report, worst = {}, 0
    for r in a.repos:
        repo = pathlib.Path(r).resolve()
        f = audit(repo)
        report[repo.name] = f
        counts = {s: sum(1 for x in f if x["severity"] == s) for s in ("FAIL", "WARN", "INFO")}
        worst = max(worst, 1 if counts["FAIL"] else 0)
        print(f"{repo.name}: {counts['FAIL']} FAIL  {counts['WARN']} WARN  {counts['INFO']} INFO")
        codes = {}
        for x in f:
            codes.setdefault((x["severity"], x["code"]), 0)
            codes[(x["severity"], x["code"])] += 1
        for (s, c), n in sorted(codes.items()):
            print(f"    {s:4} {c:22} x{n}")
    if a.json:
        pathlib.Path(a.json).write_text(json.dumps(report, indent=1))
        print(f"details: {a.json}")
    sys.exit(worst)


if __name__ == "__main__":
    main()
