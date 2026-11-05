#!/usr/bin/env python3
"""Ensambla la página final de propuestas de Koi Tea.

- Lee KOI5/v1.html … v5.html (documentos completos e independientes).
- Incrusta en línea los <script src="shared/…"> de cada versión.
- Inserta cada versión como cadena JSON (con '<' escapado) en KOI5/shell.html,
  reemplazando el marcador /*__VERSIONS__*/.
- Escribe KOI5/dist/index.html y copia KOI5/img a KOI5/dist/img.
Uso: python3 build.py [--check]
"""
import json, os, re, shutil, sys

KOI5 = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(KOI5, 'dist')
IDS = ['v1', 'v2', 'v3', 'v4', 'v5']
SCRIPT_RE = re.compile(r'<script\s+src="(shared/[\w.-]+\.js)"\s*>\s*</script>')


def inline_shared(html, vid):
    def rep(m):
        path = os.path.join(KOI5, m.group(1))
        with open(path, encoding='utf-8') as f:
            code = f.read()
        if '</script' in code.lower():
            raise SystemExit(f'{m.group(1)} contiene </script')
        return '<script>\n' + code + '\n</script>'
    out, n = SCRIPT_RE.subn(rep, html)
    if n == 0:
        print(f'  aviso: {vid} no referencia shared/*.js')
    leftovers = re.findall(r'<script[^>]+src="(?!https://)', out)
    if leftovers:
        raise SystemExit(f'{vid}: quedan scripts locales sin incrustar: {leftovers}')
    return out


def main():
    check_only = '--check' in sys.argv
    versions = {}
    for vid in IDS:
        p = os.path.join(KOI5, vid + '.html')
        if not os.path.exists(p):
            print(f'  falta {vid}.html')
            continue
        with open(p, encoding='utf-8') as f:
            html = f.read()
        versions[vid] = inline_shared(html, vid)
        print(f'  {vid}: {len(html)/1024:.1f} KB fuente → {len(versions[vid])/1024:.1f} KB con módulos')
    payload = json.dumps(versions, ensure_ascii=False).replace('<', '\\u003c').replace('\u2028', '\\u2028').replace('\u2029', '\\u2029')
    shell_p = os.path.join(KOI5, 'shell.html')
    if not os.path.exists(shell_p):
        print('  falta shell.html')
        return
    with open(shell_p, encoding='utf-8') as f:
        shell = f.read()
    marker = '/*__VERSIONS__*/'
    if shell.count(marker) != 1:
        raise SystemExit('shell.html debe tener exactamente un marcador ' + marker)
    page = shell.replace(marker, 'window.KOI_VERSIONS = ' + payload + ';')
    if check_only:
        print(f'  página: {len(page)/1024:.1f} KB')
        return
    os.makedirs(DIST, exist_ok=True)
    with open(os.path.join(DIST, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(page)
    # Copias independientes de cada versión tal como se incrusta (para correr la batería sobre lo publicado)
    sa = os.path.join(DIST, 'standalone')
    os.makedirs(sa, exist_ok=True)
    for vid, html in versions.items():
        with open(os.path.join(sa, vid + '.html'), 'w', encoding='utf-8') as f:
            f.write(html)
    sa_img = os.path.join(sa, 'img')
    if os.path.exists(sa_img):
        shutil.rmtree(sa_img)
    shutil.copytree(os.path.join(KOI5, 'img'), sa_img)
    img_dst = os.path.join(DIST, 'img')
    if os.path.exists(img_dst):
        shutil.rmtree(img_dst)
    shutil.copytree(os.path.join(KOI5, 'img'), img_dst)
    print(f'  dist/index.html: {len(page)/1024:.1f} KB · imágenes copiadas')


if __name__ == '__main__':
    main()
