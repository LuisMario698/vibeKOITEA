#!/usr/bin/env python3
"""Genera content/vnotes.html desde content/notes.json (campos: name, kicker, accent, concept, why, refs, pros, cons, ideal, complexity, features?, try?, palette?, fonts?, metrics?)."""
import json, os, html

KOI5 = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
E = lambda s: html.escape(str(s), quote=True)


def note(vid, n, first):
    out = [f'<article class="vnote" id="note-{vid}" role="tabpanel" aria-labelledby="tab-{vid}" tabindex="0" style="--v:{E(n["accent"])}"{"" if first else " hidden"}>']
    out.append(f'  <div class="head"><p class="k">{E(n["kicker"])}</p><h3>{E(n["name"])}</h3></div>')
    out.append(f'  <p class="concept">{E(n["concept"])}</p>')
    meta = [f'<span class="chip">Complejidad: {E(n["complexity"])}</span>']
    if n.get('metrics'):
        for m in n['metrics']:
            meta.append(f'<span class="chip num">{E(m)}</span>')
    out.append('  <div class="meta-row">' + ''.join(meta) + '</div>')
    if n.get('features'):
        out.append('  <div><h4>Qué hace</h4><ul class="feat">' + ''.join(f'<li><span>{E(f)}</span></li>' for f in n['features']) + '</ul></div>')
    if n.get('try'):
        out.append('  <div class="try"><h4>Pruébala así</h4><ol>' + ''.join(f'<li>{E(t)}</li>' for t in n['try']) + '</ol></div>')
    out.append(f'  <div><h4>Por qué esta dirección</h4><p>{E(n["why"])}</p></div>')
    out.append('  <div class="pc"><div><h4>A favor</h4><ul>' + ''.join(f'<li>{E(p)}</li>' for p in n['pros']) + '</ul></div><div><h4>En contra</h4><ul>' + ''.join(f'<li>{E(c)}</li>' for c in n['cons']) + '</ul></div></div>')
    out.append(f'  <p class="small"><b>Ideal para:</b> {E(n["ideal"])}</p>')
    if n.get('palette') or n.get('fonts'):
        sw = ''.join(f'<span><i style="background:{E(c["hex"])}"></i>{E(c["hex"])}</span>' for c in n.get('palette', []))
        out.append(f'  <div><h4>Sistema visual</h4><div class="swatches">{sw}</div>' + (f'<p class="small muted" style="margin-top:8px">{E(" · ".join(n["fonts"]))}</p>' if n.get('fonts') else '') + '</div>')
    out.append('  <div><h4>Referencias de la investigación</h4><div class="refs">' + ''.join(f'<a href="{E(r["url"])}" target="_blank" rel="noopener">{E(r["name"])}</a>' for r in n['refs']) + '</div></div>')
    out.append('</article>')
    return '\n'.join(out)


def main():
    data = json.load(open(os.path.join(KOI5, 'content', 'notes.json'), encoding='utf-8'))
    html_out = '\n'.join(note(vid, data[vid], i == 0) for i, vid in enumerate(['v1', 'v2', 'v3', 'v4', 'v5']))
    open(os.path.join(KOI5, 'content', 'vnotes.html'), 'w', encoding='utf-8').write(html_out + '\n')
    print(f'  vnotes.html: {len(html_out)/1024:.1f} KB')


if __name__ == '__main__':
    main()
