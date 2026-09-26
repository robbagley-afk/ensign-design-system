#!/usr/bin/env python3
"""Generate css/ecc-tokens.css from tokens/tokens.json + tokens/overrides.json.

Deterministic: same inputs, same bytes. Run after every tokens.json sync.
    python3 scripts/build_tokens.py          # write
    python3 scripts/build_tokens.py --check  # exit 1 if css is stale
"""
import hashlib, json, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "tokens" / "tokens.json"
OVR = ROOT / "tokens" / "overrides.json"
OUT = ROOT / "css" / "ecc-tokens.css"


def build() -> str:
    raw = SRC.read_bytes()
    t = json.loads(raw)
    o = json.loads(OVR.read_text())
    lines = [
        f"/* Ensign Career Coach design tokens: GENERATED, do not edit.",
        f"   Source: tokens/tokens.json (sha256 {hashlib.sha256(raw).hexdigest()[:16]}) + tokens/overrides.json",
        f"   Regenerate: python3 scripts/build_tokens.py */",
        "",
        ":root {",
        "  color-scheme: light;",
        "",
        "  /* color */",
    ]
    for c in t["color"]["tokens"]:
        lines.append(f"  --{c['name']}: {c['value']};")
    lines += ["", "  /* type */", f"  --font-sans: {t['type']['families']['sans']};"]
    for g in t["type"]["groups"]:
        for s in g["styles"]:
            lines.append(f"  --text-{s['name']}: {s['fontSize']};")
            lines.append(f"  --leading-{s['name']}: {s['lineHeight']};")
            lines.append(f"  --weight-{s['name']}: {s['fontWeight']};")
    for group in ("spacing", "radius", "shadow"):
        lines += ["", f"  /* {group} */"]
        for s in t[group]["tokens"]:
            lines.append(f"  --{s['name']}: {s['value']};")
    lines += ["", "  /* local overrides: see tokens/overrides.json for the reason behind each */"]
    for s in o["tokens"]:
        lines.append(f"  --{s['name']}: {s['value']};  /* {s['status']} */")
    lines += [
        "",
        "  /* fixed rules from the design system README */",
        "  --touch-min: 44px;",
        "  --text-floor: 17px;",
        "  --focus-ring: 2px solid var(--brand);",
        "  --focus-offset: 2px;",
        "}",
        "",
        "@media (prefers-reduced-motion: reduce) {",
        "  *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; }",
        "}",
        "",
    ]
    return "\n".join(lines)


if __name__ == "__main__":
    css = build()
    if "--check" in sys.argv:
        ok = OUT.exists() and OUT.read_text() == css
        print("ecc-tokens.css is current" if ok else "ecc-tokens.css is STALE: run scripts/build_tokens.py")
        sys.exit(0 if ok else 1)
    OUT.write_text(css)
    print(f"wrote {OUT.relative_to(ROOT)} ({len(css)} bytes)")
