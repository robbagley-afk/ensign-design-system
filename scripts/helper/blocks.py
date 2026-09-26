#!/usr/bin/env python3
"""blocks.py extract <css> <audit.json> <relpath> <out.json> [max]  -> numbered failing rule blocks
   blocks.py prompt <blocks.json> <from> <to> <out.txt>             -> compact prompt for helper
   blocks.py apply <css> <blocks.json> <reply.txt>                 -> replace blocks by exact text"""
import sys, json, re
def rules(css):
    # top-level and @media-nested simple rule blocks: (start,end,selector)
    out=[]; i=0
    for m in re.finditer(r'([^{}]+)\{([^{}]*)\}', css):
        out.append((m.start(1)+len(m.group(1))-len(m.group(1).lstrip()), m.end(), ' '.join(m.group(1).split('}')[-1].split()).strip()))
    return out
cmd=sys.argv[1]
if cmd=='extract':
    css=open(sys.argv[2]).read(); d=json.load(open(sys.argv[3])); d=list(d.values())[0]
    rel=sys.argv[4]; want={}
    for x in d:
        if x['severity']!='FAIL' or not x['where'].startswith(rel+' :: '): continue
        want.setdefault(x['where'].split(' :: ',1)[1],[]).append(x['code']+': '+x['message'])
    blocks=[]
    for s,e,sel in rules(css):
        key=next((k for k in want if sel==k or (len(k)>=60 and sel.startswith(k[:60]))),None)
        if key: blocks.append({'n':len(blocks)+1,'sel':sel,'text':css[s:e],'why':'; '.join(sorted(set(want[key])))})
    json.dump(blocks,open(sys.argv[5],'w'),indent=1); print(len(blocks),'blocks,',sum(len(b['text']) for b in blocks),'chars; audit selectors',len(want))
elif cmd=='prompt':
    b=json.load(open(sys.argv[2])); lo,hi=int(sys.argv[3]),int(sys.argv[4])
    import os
    head=open(os.environ.get('HELPER_RULES') or os.path.join(os.path.dirname(os.path.abspath(__file__)),'rules_ecc.txt')).read()
    sel=[x for x in b if lo<=x['n']<=hi]; same=len({x['why'] for x in sel})==1
    body=(f"FIX FOR ALL BLOCKS: {sel[0]['why']}\n\n" if same else '')+'\n'.join((f"/*#{x['n']}*/" if same else f"/*#{x['n']} fix: {x['why']} */")+f"\n{x['text']}\n" for x in sel)
    open(sys.argv[5],'w').write(head+"\nBLOCKS:\n"+body+"\nReply with ONE ```css code block containing every block above, rewritten, each preceded by its /*#n*/ marker line, same order, same selectors. No other text.\n")
    print(len(open(sys.argv[5]).read()),'chars')
elif cmd=='apply':
    css=open(sys.argv[2]).read(); b={x['n']:x for x in json.load(open(sys.argv[3]))}
    rep=re.sub(r'(?m)^\s*(Show more lines|Show less)\s*$\n?','',open(sys.argv[4]).read())
    parts=re.split(r'/\*\s*#(\d+)[^*]*\*/',rep)
    done=0
    for k in range(1,len(parts),2):
        n=int(parts[k]); new=parts[k+1].strip()
        new=re.sub(r'```.*','',new,flags=re.S).strip() if '```' in new else new
        old=b[n]['text']
        if css.count(old)!=1: print('SKIP',n,'old text count',css.count(old)); continue
        if ' '.join(new.split('{')[0].split())!=' '.join(old.split('{')[0].split()): print('SKIP',n,'selector changed'); continue
        css=css.replace(old,new,1); done+=1
    open(sys.argv[2],'w').write(css); print('applied',done,'of',len(b))
