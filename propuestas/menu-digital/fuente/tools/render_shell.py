#!/usr/bin/env python3
"""Arma KOI5/shell.html a partir de shell.tpl.html y los fragmentos de KOI5/content/*.html.
Marcadores: <!--@@HERO@@--> <!--@@VTABS@@--> <!--@@VNOTES@@--> <!--@@RESEARCH@@--> <!--@@COMPARE@@--> <!--@@RECO@@-->
Un fragmento faltante deja el marcador vacío (y lo avisa)."""
import os, re

KOI5 = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MARKERS = ['HERO', 'VTABS', 'VNOTES', 'RESEARCH', 'COMPARE', 'RECO']


def main():
    tpl = open(os.path.join(KOI5, 'shell.tpl.html'), encoding='utf-8').read()
    for m in MARKERS:
        tag = f'<!--@@{m}@@-->'
        if tpl.count(tag) != 1:
            raise SystemExit(f'plantilla: {tag} aparece {tpl.count(tag)} veces')
        p = os.path.join(KOI5, 'content', m.lower() + '.html')
        frag = open(p, encoding='utf-8').read() if os.path.exists(p) else ''
        if not frag:
            print(f'  aviso: falta content/{m.lower()}.html')
        tpl = tpl.replace(tag, frag)
    leftover = re.findall(r'<!--@@\w+@@-->', tpl)
    if leftover:
        raise SystemExit(f'marcadores sin reemplazar: {leftover}')
    open(os.path.join(KOI5, 'shell.html'), 'w', encoding='utf-8').write(tpl)
    print(f'  shell.html: {len(tpl)/1024:.1f} KB')


if __name__ == '__main__':
    main()
