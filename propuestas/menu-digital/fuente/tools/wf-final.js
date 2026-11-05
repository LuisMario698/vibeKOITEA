export const meta = {
  name: 'koi-final-review',
  description: 'Revisión final independiente del artifact ensamblado de Koi Tea: funcional, contenido y visual',
  phases: [{ title: 'Revisar', detail: '3 revisores independientes del artifact completo' }],
}

const KOI5 = '/tmp/claude-0/-home-user-vibeKOITEA/0b3b380c-8320-56fa-bf11-f547c3403f27/scratchpad/koi5'
const PREVIEW = `${KOI5}/dist/preview.html`

const FINDING = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    severity: { type: 'string', description: 'blocker | major | minor | nit' },
    where: { type: 'string', description: 'página contenedora (sección) o versión vN' },
    title: { type: 'string' },
    repro: { type: 'string' },
    expected: { type: 'string' },
    actual: { type: 'string' },
    evidence: { type: 'string' },
    suggestion: { type: 'string' },
  },
  required: ['id', 'severity', 'where', 'title', 'repro', 'expected', 'actual', 'suggestion'],
}
const SCHEMA = {
  type: 'object',
  properties: { findings: { type: 'array', items: FINDING }, verified_ok: { type: 'array', items: { type: 'string' } }, overall: { type: 'string' } },
  required: ['findings', 'verified_ok', 'overall'],
}

const CONTEXT = `Contexto: ${KOI5}/BRIEF.md (cliente Koi Tea), ${KOI5}/DIRECTIONS.md (las 5 versiones), ${KOI5}/SPEC.md (requisitos), ${KOI5}/RESEARCH.md y ${KOI5}/research/ (investigación). El artifact final es la página ${KOI5}/dist/index.html; para probarla localmente usa ${PREVIEW} (la misma página con el esqueleto que agrega el host). Las 5 versiones van incrustadas como iframes srcdoc; sus copias independientes (idénticas a lo incrustado) están en ${KOI5}/dist/standalone/vN.html. Helper de Playwright: ${KOI5}/tools/pw.js (open, overflow, axe, smallTargets); batería común: node ${KOI5}/tools/suite.js <archivo>. NO edites ningún archivo: solo reporta. Todo en español.`

phase('Revisar')
const [func, content, visual] = await parallel([
  () => agent(`Eres QA final, escéptico. ${CONTEXT}
Prueba el artifact completo como lo usaría el cliente:
1. Corre la batería común sobre cada ${KOI5}/dist/standalone/vN.html (v1…v5) y reporta cualquier fallo.
2. Abre ${PREVIEW} a 1280×860, 768×1000 y 390×844 (también en modo oscuro): cambia entre las 5 versiones con las pestañas y con el teclado (flechas), confirma que cada iframe carga su versión sin errores, haz dentro de cada iframe un pedido rápido (frameLocator: abrir una bebida, agregar, abrir carrito, mostrar en caja), prueba "Pantalla completa" y su cierre (botón y Escape) sin que el prototipo se reinicie, prueba "Reiniciar", los enlaces de la barra, el hash #v3 al cargar, y revisa desbordes, consola y axe de la página contenedora.
Reporta solo problemas reales y reproducibles con evidencia.`, { label: 'final:funcional', phase: 'Revisar', schema: SCHEMA }),
  () => agent(`Eres editor/a y verificador/a de datos. ${CONTEXT}
Lee el texto visible de la página contenedora (extrae el texto de ${KOI5}/dist/index.html o renderízala con Playwright). Verifica: (a) que cada afirmación sobre la investigación (cifras, nombres de marcas, fechas, URLs) coincida con lo que hay en ${KOI5}/research/ y ${KOI5}/RESEARCH.md, sin inventar ni exagerar; (b) que los datos del cliente (dirección, horario, Instagram, menú) coincidan con BRIEF.md; (c) que la página sea honesta sobre los límites (precios ilustrativos, investigación por buscador porque la red bloqueó abrir sitios, datos por confirmar); (d) ortografía, tildes, gramática y naturalidad del español de México; (e) que las notas de cada versión describan lo que la versión realmente hace (ábrelas en ${KOI5}/dist/standalone/vN.html y compruébalo); (f) que la comparativa y la recomendación se sostengan con lo mostrado. Reporta cada problema con la frase exacta y la corrección propuesta.`, { label: 'final:contenido', phase: 'Revisar', schema: SCHEMA }),
  () => agent(`Eres director/a de arte con ojo fresco. ${CONTEXT}
Toma capturas de ${PREVIEW} (deviceScaleFactor 2) a 1440×900, 1280×860, 1024×768, 768×1000, 414×896, 390×844 y 360×780, en tema claro y oscuro (colorScheme), recorriendo toda la página (hero, selector y escenario con cada versión, investigación, comparativa, recomendación, pie) y en pantalla completa. Míralas con Read. Evalúa jerarquía, ritmo y espaciado, alineaciones, recortes o encimados, legibilidad de tablas en celular, contraste en ambos temas, consistencia de componentes, que el teléfono y las notas convivan bien en cada ancho, y si algo se ve genérico o "hecho por IA". Reporta problemas concretos con ruta de captura y arreglo preciso (selector y valores CSS).`, { label: 'final:visual', phase: 'Revisar', schema: SCHEMA }),
])

return { func, content, visual }
