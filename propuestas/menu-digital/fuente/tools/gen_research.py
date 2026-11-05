#!/usr/bin/env python3
"""Genera content/research.html desde content/research.json (curado a mano a partir de la síntesis).
research.json: {
  "lead": str, "benchmark_intro": str,
  "benchmark": [{"name","url","category","strengths","take","versions":["v1",...]}],
  "insights": [{"title","detail","rule","sources":[{"name","url"}]}],
  "iteration": [{"label","text"}],
  "method": [str], "limits": [str], "asof": str
}"""
import json, os, html

KOI5 = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
E = lambda s: html.escape(str(s), quote=True)
ACC = {'v1': '#9C6B3F', 'v2': '#B8741A', 'v3': '#C24A2C', 'v4': '#8A63B8', 'v5': '#5E7F72'}
NAMES = {'v1': 'V1 Galería', 'v2': 'V2 Armador', 'v3': 'V3 Express', 'v4': 'V4 Koi guía', 'v5': 'V5 Tablero'}


def main():
    d = json.load(open(os.path.join(KOI5, 'content', 'research.json'), encoding='utf-8'))
    o = []
    o.append('<section id="investigacion" aria-labelledby="investigacion-h">')
    o.append('  <div class="sec-head">')
    o.append(f'    <p class="eyebrow">Investigación · {E(d["asof"])}</p>')
    o.append('    <h2 id="investigacion-h">Lo que hacen los mejores menús de boba y lo que tomamos de cada uno</h2>')
    o.append(f'    <p class="lede">{E(d["lead"])}</p>')
    o.append('  </div>')
    # Iteración
    if d.get('iteration'):
        o.append('  <div class="method" style="margin-top:0;margin-bottom:28px">')
        for it in d['iteration']:
            o.append(f'    <div><h3>{E(it["label"])}</h3><p>{E(it["text"])}</p></div>')
        o.append('  </div>')
    # Benchmark
    o.append('  <h3 style="font-size:1.35rem;margin-bottom:6px">Comparación de referencias</h3>')
    o.append(f'  <p class="muted small" style="margin-bottom:14px;max-width:70ch">{E(d["benchmark_intro"])}</p>')
    o.append('  <div class="tbl"><table>')
    o.append('    <thead><tr><th scope="col">Referencia</th><th scope="col">Tipo</th><th scope="col">Qué hace bien</th><th scope="col">Qué tomamos</th></tr></thead><tbody>')
    for b in d['benchmark']:
        chips = ''.join(f'<span class="vchip" style="--v:{ACC[v]}">{E(NAMES[v])}</span>' for v in b.get('versions', []))
        o.append(f'      <tr><td><a href="{E(b["url"])}" target="_blank" rel="noopener">{E(b["name"])}</a></td><td><span class="cat">{E(b["category"])}</span></td><td>{E(b["strengths"])}</td><td>{E(b["take"])}<div>{chips}</div></td></tr>')
    o.append('    </tbody></table></div>')
    # Insights
    o.append('  <h3 style="font-size:1.35rem;margin:36px 0 14px">Hallazgos que se volvieron reglas de diseño</h3>')
    o.append('  <div class="insights">')
    for i in d['insights']:
        src = ''.join(f'<a href="{E(s["url"])}" target="_blank" rel="noopener">{E(s["name"])}</a>' for s in i.get('sources', []))
        o.append(f'    <article class="ins"><h3>{E(i["title"])}</h3><p class="small">{E(i["detail"])}</p><p class="rule"><b>Regla</b>{E(i["rule"])}</p>' + (f'<div class="src">{src}</div>' if src else '') + '</article>')
    o.append('  </div>')
    # Método y límites
    o.append('  <div class="method">')
    o.append('    <div><h3>Cómo se investigó</h3><ul>' + ''.join(f'<li>{E(m)}</li>' for m in d['method']) + '</ul></div>')
    o.append('    <div><h3>Límites, dichos con claridad</h3><ul>' + ''.join(f'<li>{E(m)}</li>' for m in d['limits']) + '</ul></div>')
    o.append('  </div>')
    o.append('</section>')
    out = '\n'.join(o) + '\n'
    open(os.path.join(KOI5, 'content', 'research.html'), 'w', encoding='utf-8').write(out)
    print(f'  research.html: {len(out)/1024:.1f} KB')


if __name__ == '__main__':
    main()
