#!/usr/bin/env python3
"""Genera content/compare.html desde content/compare.json.
compare.json: {"lead", "measured":[{"criterion","why","values":{vN:str},"best":[vN]}], "rated":[{"criterion","why","scores":{vN:[n,"nota"]}}], "note"}"""
import json, os, html

KOI5 = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
E = lambda s: html.escape(str(s), quote=True)
V = [('v1', 'Galería', '#9C6B3F'), ('v2', 'Armador', '#B8741A'), ('v3', 'Express', '#C24A2C'), ('v4', 'Koi guía', '#8A63B8'), ('v5', 'Tablero', '#5E7F72')]


def main():
    d = json.load(open(os.path.join(KOI5, 'content', 'compare.json'), encoding='utf-8'))
    o = ['<section id="comparativa" aria-labelledby="comparativa-h">', '  <div class="sec-head">',
         '    <p class="eyebrow">Comparativa</p>', '    <h2 id="comparativa-h">Las cinco, lado a lado</h2>',
         f'    <p class="lede">{E(d["lead"])}</p>', '  </div>', '  <div class="tbl matrix"><table>']
    head = ''.join(f'<th scope="col" style="--v:{c}"><span class="vk"><i aria-hidden="true"></i>{E(n)}</span></th>' for _, n, c in V)
    o.append(f'    <thead><tr><th scope="col">Criterio</th>{head}</tr></thead><tbody>')
    for m in d['measured']:
        cells = ''
        for vid, _, c in V:
            best = vid in m.get('best', [])
            val = E(m['values'].get(vid, '—'))
            cells += f'<td style="--v:{c}" class="num">' + (f'<b>{val}</b>' if best else val) + '</td>'
        o.append(f'      <tr><th scope="row">{E(m["criterion"])}<small>{E(m["why"])}</small></th>{cells}</tr>')
    for r in d['rated']:
        cells = ''
        for vid, name, c in V:
            n, note = r['scores'][vid]
            dots = ''.join(f'<i class="{"on" if k < n else ""}"></i>' for k in range(5))
            cells += f'<td style="--v:{c}"><div class="score"><span class="dots5" role="img" aria-label="{n} de 5">{dots}</span><small>{E(note)}</small></div></td>'
        o.append(f'      <tr><th scope="row">{E(r["criterion"])}<small>{E(r["why"])}</small></th>{cells}</tr>')
    o.append('    </tbody></table></div>')
    o.append(f'  <p class="small muted" style="margin-top:12px;max-width:80ch">{E(d["note"])}</p>')
    o.append('</section>')
    out = '\n'.join(o) + '\n'
    open(os.path.join(KOI5, 'content', 'compare.html'), 'w', encoding='utf-8').write(out)
    print(f'  compare.html: {len(out)/1024:.1f} KB')


if __name__ == '__main__':
    main()
