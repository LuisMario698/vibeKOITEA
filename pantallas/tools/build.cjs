// Construye dist/index.html (todo en línea, para publicar como artifact) y dev/index.html (scripts enlazados).
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), SRC = path.join(ROOT, 'src');
const read = p => fs.readFileSync(path.join(SRC, p), 'utf8');
const CORE = ['../vendor/three.min.js', 'kit.js', 'kanji.js', 'mascot.js', 'koi.js', 'cup.js', 'drink3d.js', 'data.js', 'boards.js'];
const versions = fs.readdirSync(path.join(SRC, 'versions')).filter(f => /^v\d+\.js$/.test(f)).sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1))).map(f => 'versions/' + f);
const ORDER = [...CORE, ...versions, 'engine.js'];
let page = read('page.html');
const contentDir = path.join(SRC, 'content');
const defaults = { HERO_LEDE: '', FACT_LOOPS: 'Loops de 36 y 60 s', COMPARE: '', RESEARCH_LEDE: '', RESEARCH: '', PROD_LEDE: '', PRODUCTION: '', RECO: '' };
for (let pass = 0; pass < 3; pass++) {
  for (const k of Object.keys(defaults)) {
    const f = path.join(contentDir, k + '.html');
    const v = fs.existsSync(f) ? fs.readFileSync(f, 'utf8').trim() : defaults[k];
    page = page.split('{{' + k + '}}').join(v);
  }
}
if (/\{\{[A-Z_]+\}\}/.test(page)) console.warn('placeholders sin reemplazar:', page.match(/\{\{[A-Z_]+\}\}/g));
const boot = '\n<script>KT.boot();</script>\n';
const inline = ORDER.map(f => `<script>/* ${f} */\n${read(f).replace(/<\/script/gi, '<\\/script')}\n</script>`).join('\n');
fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'dist', 'index.html'), page + '\n' + inline + boot);
const linked = ORDER.map(f => `<script src="../src/${f}"></script>`).join('\n');
fs.writeFileSync(path.join(ROOT, 'dev', 'index.html'), page + '\n' + linked + boot);
const size = fs.statSync(path.join(ROOT, 'dist', 'index.html')).size;
console.log('built', ORDER.length, 'scripts;', versions.length, 'versions; dist', (size / 1024).toFixed(1) + 'KB');
