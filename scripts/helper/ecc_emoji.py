#!/usr/bin/env python3
"""ecc_emoji.py <file>... : replace emoji in UI markup and strings.
Icon-only elements (>emoji<) become an aria-hidden SVG when the emoji is in ICONS, otherwise are emptied.
Emoji before text (label prefixes) are stripped. Lines that contain `prompt +=` with ### headings are left alone
(LLM output templates). Dingbats like x, check and arrows are kept. Run once per file, then re-run the static audit."""
import re, sys
def svg(d, w=20): return f'<svg width="{w}" height="{w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{d}</svg>'
ICONS = {
 '🔍': '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
 '👤': '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
 '🖨': '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
 '📝': '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
 '✍': '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
 '🎯': '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
 '💼': '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
 '📎': '<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
 '📄': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
 '📥': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
 '🔄': '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
 '🔒': '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
 '🤝': '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
 '📊': '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
 '✉': '<path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><polyline points="22,6 12,13 2,6"/>',
 '📖': '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
 '✅': '<polyline points="20 6 9 17 4 12"/>',
 '⚡': '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
 '☕': '<path d="M17 8h1a4 4 0 0 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/>',
}
EM = '[\U0001F300-\U0001FAFF☀-⛿✅❌✨✍✉]️?'
for p in sys.argv[1:]:
    out=[]; n=0
    for l in open(p).read().split('\n'):
        if 'prompt +=' in l and '###' in l: out.append(l); continue
        def icon(m):
            global n
            e=m.group(2).rstrip('️'); n+=1
            return m.group(1)+(svg(ICONS[e]) if e in ICONS else '')+m.group(3)
        l2=re.sub(r'(>)\s*('+EM+r')\s*(</)',icon,l)
        l2=re.sub(EM+r'[ \t]*','',l2)
        n+= (l2!=l)
        out.append(l2)
    open(p,'w').write('\n'.join(out)); print(p,'changed lines',n)
# Safety net: report buttons or links left with no text and no aria-label (icon-only controls need a name).
for p in sys.argv[1:]:
    t=open(p).read()
    for m in re.finditer(r'<(button|a)\b(?![^>]*aria-label)[^>]*>\s*(?:<svg[^>]*>.*?</svg>)?\s*</\1>',t,re.S):
        print('WARN icon-only control without aria-label in',p,':',m.group(0)[:100].replace('\n',' '))
