#!/usr/bin/env python3
"""Envuelve dist/index.html con el mismo esqueleto que agrega el host al publicar -> dist/preview.html (solo pruebas locales)."""
import os, sys
base = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'dist')
SKEL = ('<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover">'
        '<style>:root{color-scheme:light;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}'
        'html{scroll-padding-top:env(safe-area-inset-top,0px)}body{margin:0;padding:0;font:14px -apple-system,BlinkMacSystemFont,sans-serif;background:#fff;color:#000}'
        'img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}</style></head><body>\n')
src = open(os.path.join(base, 'index.html'), encoding='utf-8').read()
open(os.path.join(base, 'preview.html'), 'w', encoding='utf-8').write(SKEL + src + '\n</body></html>')
print('  preview.html listo')
