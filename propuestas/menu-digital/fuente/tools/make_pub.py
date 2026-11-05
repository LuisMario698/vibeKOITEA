import sys,re,os,shutil
K, vid, title = sys.argv[1], sys.argv[2], sys.argv[3]
P=f'{K}/publish/{vid}'; os.makedirs(P+'/img',exist_ok=True)
for f in os.listdir(K+'/img'): shutil.copy(K+'/img/'+f, P+'/img/'+f)
s=open(f'{K}/{vid}.html').read()
for f in ['koi-data.js','koi-cup.js']:
    s=s.replace(f'<script src="shared/{f}"></script>','<script>\n'+open(K+'/shared/'+f).read()+'\n</script>')
assert 'src="shared/' not in s
s=re.sub(r'<!doctype html>\s*','',s,flags=re.I)
s=re.sub(r'<html[^>]*>','',s,flags=re.I); s=re.sub(r'</html>','',s,flags=re.I)
s=re.sub(r'</?head>','',s,flags=re.I)
m=re.search(r'<body([^>]*)>',s,flags=re.I)
if m and m.group(1).strip(): print('OJO atributos de body:',m.group(1))
s=re.sub(r'<body[^>]*>','',s,flags=re.I); s=re.sub(r'</body>','',s,flags=re.I)
s=re.sub(r'<meta charset[^>]*>','',s,flags=re.I); s=re.sub(r'<meta name="viewport"[^>]*>','',s,flags=re.I)
s=re.sub(r'<title>.*?</title>','',s,flags=re.S)
open(P+'/index.html','w').write(f'<title>{title}</title>\n<script>document.documentElement.lang="es";</script>\n'+s.strip()+'\n')
print(vid, len(s)//1024,'KB', sorted(set(re.findall(r'img/[\w.-]+\.jpg',s))))
