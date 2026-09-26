#!/usr/bin/env python3
"""ecc_head.py <html>... : insert Montserrat + the four ECC stylesheet links before the first local stylesheet link.
Keeps the href prefix (e.g. /static/) of that link. Idempotent. Prints emoji found (replace with SVG by hand)."""
import re, sys
EMO=re.compile('[\U0001F300-\U0001FAFF☀-➿⭐⬆✅❌]')
for p in sys.argv[1:]:
    s=open(p).read()
    if 'ecc-tokens.css' in s: print(p,'already linked'); continue
    m=re.search(r'^([ \t]*)<link rel="stylesheet" href="(?!https?:)([^"]*?)([\w.-]+\.css)[^"]*"[^>]*>',s,re.M)
    if not m: print(p,'NO LOCAL STYLESHEET LINK'); continue
    ind,pre=m.group(1),m.group(2)
    blk=''.join(ind+l+'\n' for l in ['<link rel="preconnect" href="https://fonts.googleapis.com" />','<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />','<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" />']+[f'<link rel="stylesheet" href="{pre}{f}" />' for f in ('ecc-tokens.css','ecc-ces-compat.css','ecc-components.base.css','ecc-app.css')])
    # ECC files must load after ces-* but before the app's own styles.css
    locs=list(re.finditer(r'^[ \t]*<link rel="stylesheet" href="(?!https?:)[^"]*"[^>]*>\n',s,re.M))
    # ECC files go after the last ces-*.css link, otherwise before the first local stylesheet.
    # Order: ces-* -> ecc-* -> the app's own CSS (all of it), so app rules can still refine ECC.
    ces=[m for m in locs if re.search(r'/ces-[\w-]+\.css',m.group(0))]
    at=ces[-1].end() if ces else locs[0].start()
    s=s[:at]+blk+s[at:]
    s=re.sub(r'<meta name="theme-color" content="#[0-9a-fA-F]{6}"','<meta name="theme-color" content="#006645"',s)
    open(p,'w').write(s)
    print(p,'linked; emoji:',sorted(set(EMO.findall(s))))
