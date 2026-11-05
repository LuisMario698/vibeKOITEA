export const meta = {
  name: 'koi-build-version',
  description: 'Construye una versión del menú Koi Tea, la revisan dos QA independientes, se corrige y se verifica',
  phases: [
    { title: 'Construir', detail: 'prototipo completo con autoprueba' },
    { title: 'Revisar', detail: 'QA funcional y QA de diseño/accesibilidad en paralelo' },
    { title: 'Corregir', detail: 'aplicar hallazgos confirmados' },
    { title: 'Verificar', detail: 'reprobar hallazgos y regresión completa' },
  ],
}

const KOI5 = '/tmp/claude-0/-home-user-vibeKOITEA/0b3b380c-8320-56fa-bf11-f547c3403f27/scratchpad/koi5'
const vid = (args && args.vid) || 'v1'
const vname = (args && args.name) || vid
const FILE = `${KOI5}/${vid}.html`

const READS = `Lee completos antes de empezar: ${KOI5}/BRIEF.md (cliente, marca, menú), ${KOI5}/SPEC.md (requisitos y protocolo de pruebas), ${KOI5}/shared/README.md (API de datos KOI y vasos KoiCup), ${KOI5}/DIRECTIONS.md (la sección ${vid} es la dirección de esta versión; las otras cuatro existen para que esta NO se parezca a ellas) y ${KOI5}/RESEARCH.md (hallazgos y reglas de la investigación).`

const FINDING = {
  type: 'object',
  properties: {
    id: { type: 'string', description: 'identificador corto, p. ej. F1, D3' },
    severity: { type: 'string', description: 'blocker | major | minor | nit' },
    area: { type: 'string', description: 'funcional | visual | accesibilidad | contenido | rendimiento' },
    title: { type: 'string' },
    repro: { type: 'string', description: 'pasos exactos para reproducir (ancho de pantalla, clics)' },
    expected: { type: 'string' },
    actual: { type: 'string' },
    evidence: { type: 'string', description: 'salida de la prueba o ruta de captura' },
    suggestion: { type: 'string', description: 'arreglo concreto' },
  },
  required: ['id', 'severity', 'area', 'title', 'repro', 'expected', 'actual', 'suggestion'],
}
const TEST = { type: 'object', properties: { name: { type: 'string' }, result: { type: 'string', description: 'pass | fail' }, detail: { type: 'string' } }, required: ['name', 'result'] }

const BUILD_SCHEMA = {
  type: 'object',
  properties: {
    file: { type: 'string' },
    summary: { type: 'string', description: 'qué se construyó, 2-4 frases, en español' },
    palette: { type: 'array', items: { type: 'object', properties: { hex: { type: 'string' }, role: { type: 'string' } }, required: ['hex', 'role'] } },
    fonts: { type: 'array', items: { type: 'string' } },
    features: { type: 'array', items: { type: 'string' }, description: 'funciones implementadas y probadas, en español, una frase cada una' },
    signature: { type: 'string', description: 'el rasgo distintivo de esta versión y cómo quedó implementado' },
    try_steps: { type: 'array', items: { type: 'string' }, description: '3-5 pasos para que el cliente pruebe lo mejor de esta versión' },
    tests: { type: 'array', items: TEST },
    axe_summary: { type: 'string' },
    known_issues: { type: 'array', items: { type: 'string' } },
    screenshots: { type: 'array', items: { type: 'string' } },
    size_kb: { type: 'number' },
  },
  required: ['file', 'summary', 'palette', 'fonts', 'features', 'signature', 'try_steps', 'tests', 'axe_summary', 'known_issues', 'screenshots', 'size_kb'],
}
const FINDINGS_SCHEMA = {
  type: 'object',
  properties: { findings: { type: 'array', items: FINDING }, verified_ok: { type: 'array', items: { type: 'string' } }, overall: { type: 'string' } },
  required: ['findings', 'verified_ok', 'overall'],
}
const FIX_SCHEMA = {
  type: 'object',
  properties: {
    fixed: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, change: { type: 'string' } }, required: ['id', 'change'] } },
    not_fixed: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, reason: { type: 'string' } }, required: ['id', 'reason'] } },
    regression: { type: 'array', items: TEST },
    notes: { type: 'string' },
  },
  required: ['fixed', 'not_fixed', 'regression', 'notes'],
}
const VERIFY_SCHEMA = {
  type: 'object',
  properties: {
    rechecked: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, status: { type: 'string', description: 'fixed | still_broken | partial | invalid' }, detail: { type: 'string' } }, required: ['id', 'status'] } },
    new_findings: { type: 'array', items: FINDING },
    regression: { type: 'array', items: TEST },
    remaining: { type: 'array', items: FINDING, description: 'hallazgos blocker/major/minor que siguen abiertos (reabiertos o nuevos)' },
    pass: { type: 'boolean' },
    overall: { type: 'string' },
  },
  required: ['rechecked', 'new_findings', 'regression', 'remaining', 'pass', 'overall'],
}

phase('Construir')
const build = await agent(`Eres diseñador/a-desarrollador/a senior de producto (UI + front-end) en un estudio que hace menús digitales a la medida para negocios reales. Vas a construir la versión ${vid} «${vname}» del menú digital de Koi Tea: un prototipo FUNCIONAL, COMPLETO y PULIDO que se presentará al dueño junto con otras cuatro versiones hechas por otras personas.
${READS}
Mira con Read: ${KOI5}/img/logo.jpg, ${KOI5}/img/bar.jpg, ${KOI5}/img/fruit-teas.jpg (y las demás fotos que pienses usar) y ${KOI5}/shots/cups.png (vasos del generador KoiCup).

Escribe ${FILE} siguiendo SPEC.md al pie de la letra (documento completo, módulos compartidos con las etiquetas literales, imágenes desde img/, solo Google Fonts como recurso externo).
Proceso:
1. Antes de codificar, fija en un comentario al inicio del <style> el plan: tokens de color (con roles), escala tipográfica y el concepto de layout en una línea. Todo color y tamaño sale de esos tokens.
2. Construye todas las funciones obligatorias de SPEC.md y, sobre todo, el rasgo distintivo de tu dirección: es lo que el dueño va a recordar; hazlo memorable y útil, no un adorno que estorbe para pedir.
3. Diseño: tipografía con carácter y escala clara, espaciado consistente con gap/grid, alineaciones limpias, detalles propios del mundo del boba y de Koi Tea (no genéricos). Evita el look "hecho por IA" (degradados morado-azul, tarjetas con barra lateral de acento, emojis como íconos de sección, todo centrado, sombras y radios iguales en todo). Íconos en SVG en línea, simples y del mismo grosor. Microinteracciones con intención; respeta reduced motion.
4. Copy en español de México natural y cálido (la voz de la marca: agradecida, breve) y en inglés natural; textos reales, nada de relleno.
5. Pruebas: corre el protocolo COMPLETO de SPEC.md con ${KOI5}/tools/pw.js (scripts tuyos en ${KOI5}/qa/${vid}/build/). Mira cada captura con Read y corrige lo que no se vea profesional. Itera hasta que las pruebas pasen y el resultado se vea terminado. Guarda capturas finales en ${KOI5}/shots/${vid}-*.png.
6. Reporta con honestidad: solo marca pass lo que realmente probaste.
Todo el reporte en español.`, { label: `construir:${vid}`, phase: 'Construir', schema: BUILD_SCHEMA })

if (!build) return { vid, error: 'el constructor no entregó resultado' }

phase('Revisar')
const [funcQA, designQA] = await parallel([
  () => agent(`Eres QA senior de producto: escéptico, minucioso y con experiencia rompiendo apps de pedidos. Tu trabajo es encontrar todo lo que falle en el prototipo ${FILE} (versión ${vid} «${vname}» del menú de Koi Tea). NO edites ese archivo.
${READS}
Escribe tus scripts de Playwright en ${KOI5}/qa/${vid}/func/ usando ${KOI5}/tools/pw.js (open, overflow, axe, smallTargets). Prueba con clics reales:
- Cada control y cada flujo de SPEC.md de principio a fin (ver bebidas de las 3 categorías, ficha, personalización, carrito, ambas salidas de cierre).
- Bordes: doble toque rápido en agregar; cantidades (bajar de 1, subir mucho); límite de 3 toppings; topping agotado (pop-cereza) y bebida agotada (smooth-maracuya); smoothie sin dulzor ni hielo; quitar todos los toppings; vaciar el carrito con la hoja abierta; cerrar y reabrir; cambiar ES/EN y MXN/USD con la ficha abierta, con el carrito abierto y en el ticket.
- Cálculos: compara en la página (page.evaluate con window.KOI) el precio mostrado de líneas y total contra KOI.unitPrice/KOI.lineTotal/KOI.cartTotal en ambas monedas; revisa que el mensaje de WhatsApp mostrado coincida con KOI.waMessage del carrito y que el código de pedido no cambie al re-renderizar.
- Teclado: Tab, Enter/Espacio, Escape; foco al abrir/cerrar diálogos; scroll del fondo bloqueado con diálogos abiertos y restaurado al cerrar.
- Anchos 320, 360, 375, 390, 414, 430 y 1280 (overflow vacío, nada cortado ni encimado), reduced motion, consola limpia (errors de open), axe sin critical/serious, objetivos táctiles ≥44px.
Reporta solo problemas reales y reproducibles, con pasos exactos, esperado vs. real y evidencia (salida o ruta de captura). Severidad: blocker (impide pedir o rompe la app), major (función incorrecta o confusa, error visible), minor (detalle que un cliente notaría), nit (pulido). En verified_ok lista lo que comprobaste y funciona. Todo en español.`, { label: `qa-funcional:${vid}`, phase: 'Revisar', schema: FINDINGS_SCHEMA }),
  () => agent(`Eres director/a de arte y especialista en accesibilidad, con ojo fresco y exigente; tu firma va en esta revisión. Revisa el prototipo ${FILE} (versión ${vid} «${vname}» del menú de Koi Tea). NO edites ese archivo.
${READS}
Mira con Read el logo ${KOI5}/img/logo.jpg y la foto del local ${KOI5}/img/bar.jpg para tener la marca real en mente.
Con ${KOI5}/tools/pw.js toma capturas (scripts en ${KOI5}/qa/${vid}/design/, capturas en ${KOI5}/qa/${vid}/design/*.png, deviceScaleFactor 2 para ver detalle) de: pantalla inicial, recorrido del menú, ficha de una milk tea y de un smoothie, carrito con 3 líneas, ticket "mostrar en caja", vista de WhatsApp, la misma app en EN+USD, a 360 y 430 de ancho y a 1280. Míralas TODAS con Read.
Evalúa y reporta con evidencia: jerarquía visual y escaneabilidad (¿se entiende qué pedir y cuánto cuesta en 3 segundos?), alineaciones y espaciado consistente, recortes o textos encimados, legibilidad a tamaño real de teléfono, contraste (usa axe y calcula ratios de los pares dudosos), objetivos táctiles, foco visible, coherencia con la dirección ${vid} de DIRECTIONS.md y con la marca, calidad y consistencia de la ilustración, calidad del copy en ES y EN (ortografía, tildes, naturalidad, tono de la marca), consistencia entre pantallas, si algo se ve genérico o "hecho por IA", y si el rasgo distintivo de la dirección está bien logrado y ayuda a pedir. Sugerencias precisas (qué cambiar y con qué valores). Severidad: blocker | major | minor | nit. En verified_ok lo que está bien. Todo en español.`, { label: `qa-diseno:${vid}`, phase: 'Revisar', schema: FINDINGS_SCHEMA }),
])

let open = []
;[funcQA, designQA].filter(Boolean).forEach((r, i) => (r.findings || []).forEach(f => open.push({ ...f, id: (i === 0 ? 'F-' : 'D-') + f.id })))
log(`${vid}: ${open.length} hallazgos (${open.filter(f => f.severity === 'blocker').length} blocker, ${open.filter(f => f.severity === 'major').length} major)`)

const rounds = []
let verify = null
for (let round = 1; round <= 2 && open.length; round++) {
  phase('Corregir')
  const fix = await agent(`Eres quien mantiene el prototipo ${FILE} (versión ${vid} «${vname}» del menú de Koi Tea). Revisores independientes reportaron los hallazgos de abajo.
${READS}
Corrige todos los blocker, major y minor; corrige los nit si el cambio es seguro. Antes de cada arreglo, reprodúcelo (scripts en ${KOI5}/qa/${vid}/fix${round}/ con ${KOI5}/tools/pw.js); después comprueba que quedó resuelto. Si un hallazgo no se reproduce o contradice SPEC.md/DIRECTIONS.md, no lo "arregles": explícalo en not_fixed. No cambies la dirección de diseño ni quites funciones. Al terminar corre el protocolo COMPLETO de SPEC.md como regresión y mira las capturas con Read. Actualiza las capturas finales ${KOI5}/shots/${vid}-*.png. Todo en español.

HALLAZGOS (JSON):
${JSON.stringify(open)}`, { label: `corregir:${vid}:r${round}`, phase: 'Corregir', schema: FIX_SCHEMA })

  phase('Verificar')
  verify = await agent(`Eres QA de verificación independiente para el prototipo ${FILE} (versión ${vid} «${vname}» del menú de Koi Tea). NO edites el archivo.
${READS}
Abajo están los hallazgos que se reportaron y lo que el corrector dice que hizo. Para CADA hallazgo, reprodúcelo de nuevo con Playwright (scripts en ${KOI5}/qa/${vid}/verify${round}/, helper ${KOI5}/tools/pw.js) y marca fixed | still_broken | partial | invalid (invalid solo si el hallazgo original estaba equivocado). Luego corre una regresión completa con el protocolo de SPEC.md (flujos, anchos 320–430 y 1280, consola, axe, objetivos táctiles, EN/USD, reduced motion) y busca problemas nuevos; mira tus capturas con Read. En remaining pon todo blocker/major/minor que siga abierto o sea nuevo. pass=true solo si remaining está vacío. Todo en español.

HALLAZGOS (JSON):
${JSON.stringify(open)}

REPORTE DEL CORRECTOR (JSON):
${JSON.stringify(fix)}`, { label: `verificar:${vid}:r${round}`, phase: 'Verificar', schema: VERIFY_SCHEMA })

  rounds.push({ round, fix, verify })
  open = verify ? (verify.remaining || []).filter(f => f.severity !== 'nit') : []
  log(`${vid} ronda ${round}: ${verify && verify.pass ? 'pasa' : open.length + ' pendientes'}`)
}

return { vid, name: vname, build, funcQA, designQA, rounds, remaining: open, pass: open.length === 0 }
