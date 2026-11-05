/* Bebida en 3D (Three.js r149, MIT): vaso de plástico con reflejos de estudio, líquido en capas, perlas de tapioca,
   jelly o perlas explosivas, hielo, chorro al servir, tapa sellada impresa, popote y condensación.
   Todo depende solo de los parámetros (función pura del tiempo): sirve para el loop, el modo kiosco y la exportación.
   KT.drink3d.draw(ctx, cx, by, H, drink, s): dibuja el vaso con la base en (cx, by) y alto H (px del lienzo 1080×1920).
   s: {fill, pearls, ice, seal, straw, cond, spin, bob, t, alpha} — todos 0→1 salvo spin (rad), bob (px) y t (s). */
(function () {
  'use strict';
  const KT = window.KT, TAU = Math.PI * 2;
  const T = window.THREE;
  if (!T) { KT.drink3d = { ok: false, draw() { return false; } }; return; }

  const R_BOT = 0.24, R_TOP = 0.33, LIQ = 0.935, MAXL = 0.88, ASPECT = 0.8, FOV = 27;
  const rAt = y => R_BOT + (R_TOP - R_BOT) * y;
  const lin = hex => new T.Color(hex).convertSRGBToLinear();
  const clamp = KT.clamp, E = KT.E;
  let R = null; // estado compartido (renderer, escena, objetos)

  // perfil de capas: color (sRGB hex) a la altura relativa u (0 fondo → 1 borde)
  function layerColor(layers, u) {
    const L = layers.slice().sort((a, b) => a[0] - b[0]);
    if (u <= L[0][0]) return L[0][1];
    for (let i = 0; i < L.length - 1; i++) {
      const [a, ca] = L[i], [b, cb] = L[i + 1];
      if (u <= b) { const k = (u - a) / Math.max(1e-6, b - a); const s = k * k * (3 - 2 * k); return KT.mix(ca, cb, clamp((s - 0.5) * 1.6 + 0.5)); } // fronteras suaves pero definidas
    }
    return L[L.length - 1][1];
  }

  function shellPositions(y0, y1, rk, NY, NS, color) {
    const pos = [], nor = [], col = [], idx = [];
    for (let j = 0; j <= NY; j++) {
      const y = y0 + ((y1 - y0) * j) / NY, r = rAt(y) * rk, dr = (R_TOP - R_BOT) * rk;
      for (let i = 0; i <= NS; i++) {
        const a = (i / NS) * TAU, ca = Math.cos(a), sa = Math.sin(a);
        pos.push(r * ca, y, r * sa);
        const n = new T.Vector3(ca, -dr, sa).normalize(); nor.push(n.x, n.y, n.z);
        if (color) { const c = color(a, y); col.push(c.r, c.g, c.b); }
      }
    }
    for (let j = 0; j < NY; j++) for (let i = 0; i < NS; i++) { const a = j * (NS + 1) + i, b = a + NS + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
    if (color) g.setAttribute('color', new T.Float32BufferAttribute(col, 3));
    g.setIndex(idx); return g;
  }
  // cubo con esquinas redondeadas
  function roundedBox(s, rr, seg) {
    const g = new T.BoxGeometry(1, 1, 1, seg, seg, seg), p = g.attributes.position, v = new T.Vector3(), inner = 0.5 - rr;
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const c = new T.Vector3(clamp(v.x, -inner, inner), clamp(v.y, -inner, inner), clamp(v.z, -inner, inner));
      const d = v.clone().sub(c); if (d.lengthSq() > 0) d.normalize().multiplyScalar(rr);
      v.copy(c.add(d)).multiplyScalar(s); p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals(); return g;
  }
  // película de la tapa: impresión de Koi Tea (olas, koi rojo, logotipo)
  function filmTexture() {
    const c = KT.offscreen(512, 512), g = c.getContext('2d');
    g.fillStyle = '#FBF6EE'; g.beginPath(); g.arc(256, 256, 256, 0, TAU); g.fill();
    g.strokeStyle = KT.rgba(KT.C.ink, 0.55); g.lineWidth = 7; g.lineCap = 'round';
    for (let k = 0; k < 3; k++) { const y = 330 + k * 42; g.beginPath(); for (let x = 70; x <= 442; x += 6) { const yy = y + Math.sin(x / 34 + k) * 9; x === 70 ? g.moveTo(x, yy) : g.lineTo(x, yy); } g.stroke(); }
    g.strokeStyle = KT.C.koi; KT.icon.koi(g, 256, 180, 150, 4);
    KT.text(g, 'KOI TEA', 256, 290, { size: 46, weight: 600, family: KT.F.logo, color: KT.C.ink, align: 'center', ls: 9 });
    g.strokeStyle = KT.rgba(KT.C.ink, 0.25); g.lineWidth = 6; g.beginPath(); g.arc(256, 256, 236, 0, TAU); g.stroke();
    const tx = new T.CanvasTexture(c); tx.encoding = T.sRGBEncoding; tx.anisotropy = 4; return tx;
  }
  // gotas de condensación: mapa de alfa con gotas de distintos tamaños
  function dropsTexture() {
    const c = KT.offscreen(1024, 512), g = c.getContext('2d'), rnd = KT.rng(77);
    g.fillStyle = '#000'; g.fillRect(0, 0, 1024, 512);
    for (let i = 0; i < 900; i++) {
      const x = rnd() * 1024, y = 40 + rnd() * 470, r = 1.2 + Math.pow(rnd(), 3) * 7;
      const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
      gr.addColorStop(0, '#fff'); gr.addColorStop(0.5, '#9a9a9a'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, r, r * 1.15, 0, 0, TAU); g.fill();
    }
    const tx = new T.CanvasTexture(c); tx.wrapS = T.RepeatWrapping; return tx;
  }
  // reflejos de estudio: bandas verticales suaves (fijas respecto a la cámara)
  function stripTexture() {
    const c = KT.offscreen(512, 64), g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 512, 0);
    [[0, 0], [0.13, 0], [0.18, 0.95], [0.235, 0.35], [0.27, 0], [0.7, 0], [0.76, 0.22], [0.8, 0.5], [0.83, 0], [1, 0]].forEach(([u, a]) => gr.addColorStop(u, `rgba(255,255,255,${a})`));
    g.fillStyle = gr; g.fillRect(0, 0, 512, 64);
    const v = g.createLinearGradient(0, 0, 0, 64); v.addColorStop(0, 'rgba(0,0,0,0.6)'); v.addColorStop(0.15, 'rgba(0,0,0,0)'); v.addColorStop(0.9, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.8)');
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = v; g.fillRect(0, 0, 512, 64);
    const tx = new T.CanvasTexture(c); return tx;
  }
  // entorno de estudio cálido para los reflejos (PMREM a partir de una escena pequeña)
  function studioEnv(renderer) {
    const s = new T.Scene();
    const sky = new T.Mesh(new T.SphereGeometry(10, 32, 16), new T.MeshBasicMaterial({ side: T.BackSide, vertexColors: true }));
    const pa = sky.geometry.attributes.position, cols = [];
    for (let i = 0; i < pa.count; i++) { const y = pa.getY(i) / 10, c = lin(KT.mix('#9A8068', '#FFF3E2', clamp(y * 0.5 + 0.55))); cols.push(c.r, c.g, c.b); }
    sky.geometry.setAttribute('color', new T.Float32BufferAttribute(cols, 3)); s.add(sky);
    const box = (w, h, x, y, z, ry, k) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: new T.Color(k, k * 0.97, k * 0.92), side: T.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0.5, 0); s.add(m); };
    box(1.6, 5, -4.5, 2, 3.5, 0, 6);   // softbox principal, izquierda
    box(0.8, 5, 4.6, 1.5, 2.5, 0, 3.5); // contraluz derecha
    box(4, 2, 0, 6, 0, 0, 2.5);         // techo
    const pm = new T.PMREMGenerator(renderer), rt = pm.fromScene(s, 0.035);
    pm.dispose(); return rt.texture;
  }

  function init() {
    const canvas = KT.offscreen(8, 8);
    const renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true, premultipliedAlpha: true });
    renderer.setClearColor(0x000000, 0); renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; renderer.sortObjects = true;
    const scene = new T.Scene(); scene.environment = studioEnv(renderer);
    const camera = new T.PerspectiveCamera(FOV, ASPECT, 0.1, 50);
    camera.position.set(0, 2.05, 3.95); camera.lookAt(0, 0.47, 0);
    scene.add(new T.HemisphereLight(0xfff2e0, 0xb59a7c, 0.55));
    const key = new T.DirectionalLight(0xfff0dc, 1.3); key.position.set(-2.5, 3.2, 2.6); scene.add(key);
    const rim = new T.DirectionalLight(0xffe2c0, 0.7); rim.position.set(2.8, 1.6, -1.5); scene.add(rim);

    const cup = new T.Group(); scene.add(cup);
    // pared del vaso: Fresnel (bordes más visibles, centro casi transparente)
    const wallMat = new T.ShaderMaterial({
      transparent: true, depthWrite: false, side: T.DoubleSide,
      uniforms: { uA: { value: 1 } },
      vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform float uA; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(vN, vV)), 2.2); vec3 c = mix(vec3(0.93,0.95,0.96), vec3(0.62,0.62,0.64), f*0.6); gl_FragColor = vec4(c, (0.07 + 0.5*f) * uA); }'
    });
    const wall = new T.Mesh(shellPositions(0, 1, 1, 24, 96), wallMat); wall.renderOrder = 3; cup.add(wall);
    const ring = (r, tube, y, color, op) => { const m = new T.Mesh(new T.TorusGeometry(r, tube, 14, 120), new T.MeshPhysicalMaterial({ color: lin(color), roughness: 0.18, clearcoat: 1, transparent: op < 1, opacity: op })); m.rotation.x = Math.PI / 2; m.position.y = y; return m; };
    const lip = ring(R_TOP + 0.004, 0.014, 1.0, '#FFFFFF', 0.9); lip.renderOrder = 4; cup.add(lip);
    const foot = ring(R_BOT - 0.004, 0.008, 0.008, '#F3F1EE', 0.75); foot.renderOrder = 4; cup.add(foot);
    const baseDisk = new T.Mesh(new T.CircleGeometry(R_BOT, 64), new T.MeshPhysicalMaterial({ color: lin('#FFFFFF'), transparent: true, opacity: 0.3, roughness: 0.2 })); baseDisk.rotation.x = -Math.PI / 2; baseDisk.position.y = 0.004; cup.add(baseDisk);

    // líquido (se reconstruye cuando cambia el nivel o la bebida)
    const liqMat = new T.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.32, clearcoat: 0.35, clearcoatRoughness: 0.2, transparent: true, opacity: 0.97, envMapIntensity: 0.7 });
    const liquid = new T.Mesh(new T.BufferGeometry(), liqMat); liquid.renderOrder = 1; cup.add(liquid);
    const surfMat = new T.MeshPhysicalMaterial({ roughness: 0.12, clearcoat: 1, envMapIntensity: 1.1 });
    const surface = new T.Mesh(new T.CircleGeometry(1, 72), surfMat); surface.rotation.x = -Math.PI / 2; surface.renderOrder = 1; cup.add(surface);
    const streamMat = new T.MeshPhysicalMaterial({ roughness: 0.15, clearcoat: 1, transparent: true, opacity: 0.96 });
    const stream = new T.Mesh(new T.CylinderGeometry(0.026, 0.032, 1, 20, 1, true), streamMat); cup.add(stream);

    // toppings
    const pearlMat = new T.MeshPhysicalMaterial({ color: lin('#2B160C'), roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.4, sheen: 0.4, sheenColor: lin('#7A4A30') });
    const pearls = new T.InstancedMesh(new T.SphereGeometry(0.043, 22, 16), pearlMat, 40); cup.add(pearls);
    const popMat = new T.MeshPhysicalMaterial({ roughness: 0.1, clearcoat: 1, transparent: true, opacity: 0.85, envMapIntensity: 1.4 });
    const pops = new T.InstancedMesh(new T.SphereGeometry(0.04, 22, 16), popMat, 40); cup.add(pops);
    const jellyMat = new T.MeshPhysicalMaterial({ roughness: 0.12, clearcoat: 1, transparent: true, opacity: 0.78, envMapIntensity: 1.3 });
    const jelly = new T.InstancedMesh(roundedBox(0.075, 0.18, 4), jellyMat, 40); cup.add(jelly);
    const iceMat = new T.MeshPhysicalMaterial({ color: lin('#FFFFFF'), roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.42, envMapIntensity: 2.0, ior: 1.31 });
    const ice = new T.InstancedMesh(roundedBox(0.12, 0.16, 5), iceMat, 5); ice.renderOrder = 2; cup.add(ice);

    // tapa sellada y popote
    const film = new T.Mesh(new T.CircleGeometry(R_TOP + 0.012, 96), new T.MeshPhysicalMaterial({ map: filmTexture(), roughness: 0.28, clearcoat: 0.7, transparent: true, opacity: 0.93 }));
    film.rotation.x = -Math.PI / 2; film.renderOrder = 5; cup.add(film);
    const strawMat = new T.MeshPhysicalMaterial({ roughness: 0.14, clearcoat: 1, transparent: true, opacity: 0.82 });
    const straw = new T.Group(); const sTube = new T.Mesh(new T.CylinderGeometry(0.043, 0.043, 1.06, 32, 1, true), strawMat); sTube.position.y = 0.53; straw.add(sTube);
    const sEnd = new T.Mesh(new T.TorusGeometry(0.043, 0.006, 8, 32), strawMat); sEnd.rotation.x = Math.PI / 2; sEnd.position.y = 1.06; straw.add(sEnd);
    straw.renderOrder = 6; cup.add(straw);
    // condensación (capa apenas fuera de la pared)
    const condMat = new T.MeshPhysicalMaterial({ color: lin('#FFFFFF'), roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0, alphaMap: dropsTexture(), envMapIntensity: 2.2, depthWrite: false });
    const cond = new T.Mesh(shellPositions(0.03, 0.97, 1.006, 12, 96), condMat); cond.renderOrder = 4;
    { const uv = [], NS = 96, NY = 12; for (let j = 0; j <= NY; j++) for (let i = 0; i <= NS; i++) uv.push(i / NS * 2, j / NY); cond.geometry.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); }
    cup.add(cond);
    // reflejos de estudio fijos a la cámara (no giran con el vaso)
    const strips = new T.Mesh(shellPositions(0.02, 0.99, 1.012, 6, 96), new T.MeshBasicMaterial({ color: 0xffffff, map: stripTexture(), transparent: true, depthWrite: false, side: T.DoubleSide, opacity: 0.6 }));
    { const uv = [], NS = 96, NY = 6; for (let j = 0; j <= NY; j++) for (let i = 0; i <= NS; i++) { const a = (i / NS) * TAU; uv.push(a <= Math.PI ? 1 - a / Math.PI : 0, j / NY); } strips.geometry.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); }
    strips.renderOrder = 7; scene.add(strips);

    // proyección de la base y del borde para colocar el render sobre el lienzo 2D
    camera.updateMatrixWorld(); camera.updateProjectionMatrix();
    const pb = new T.Vector3(0, 0, R_BOT).project(camera), pt = new T.Vector3(0, 1, 0).project(camera);
    R = { renderer, scene, camera, cup, wall, wallMat, lip, liquid, liqMat, surface, surfMat, stream, streamMat, pearls, pops, popMat, jelly, jellyMat, ice, film, straw, strawMat, cond, condMat, strips, key: '', proj: { base: pb.y, top: pt.y }, fontsDone: KT._fontsDone };
  }

  function rebuildLiquid(d, level, key) {
    if (R.key === key) return;
    R.key = key;
    const layers = d.layers || [[0, d.c1], [1, d.c2 || d.c1]], brown = d.k === 'brown';
    const syrup = '#5A2E14', NS = brown ? 128 : 64;
    const col = (a, y) => {
      let c = layerColor(layers, y / MAXL);
      if (brown) { // vetas de azúcar morena que bajan por la pared desde el borde
        let m = 0; for (let k = 0; k < 9; k++) { const ak = (k / 9) * TAU + 0.35 * Math.sin(y * 7 + k * 1.7) + y * 0.9; let da = Math.abs(((a - ak) % TAU + TAU + Math.PI) % TAU - Math.PI); const w = 0.07 + 0.11 * (y / MAXL); m = Math.max(m, clamp(1 - da / w) * clamp(y / MAXL * 1.3 - 0.05)); }
        c = KT.mix(c, syrup, m * 0.85);
      }
      return lin(c);
    };
    if (R.liquid.geometry) R.liquid.geometry.dispose();
    const top = Math.max(0.02, level);
    R.liquid.geometry = shellPositions(0.015, top, LIQ, Math.max(2, Math.round(40 * top)), NS, col);
    R.liquid.visible = level > 0.02;
    R.surface.visible = level > 0.02; R.surface.position.y = top; const rs = rAt(top) * LIQ; R.surface.scale.set(rs, rs, 1);
    R.surfMat.color.copy(lin(KT.mix(layerColor(layers, top / MAXL), '#FFFFFF', d.k === 'fruit' ? 0.12 : 0.06)));
    R.liqMat.opacity = d.k === 'fruit' ? 0.9 : 0.97;
  }

  // caída con dos rebotes cortos
  const bounce = p => { if (p <= 0) return 0; if (p >= 1) return 1; const n = 7.5625, d = 2.75; if (p < 1 / d) return n * p * p; if (p < 2 / d) { p -= 1.5 / d; return n * p * p + 0.75; } if (p < 2.5 / d) { p -= 2.25 / d; return n * p * p + 0.9375; } p -= 2.625 / d; return n * p * p + 0.984375; };
  const M4 = new T.Matrix4(), Q = new T.Quaternion(), V = new T.Vector3(), S1 = new T.Vector3(1, 1, 1), EU = new T.Euler();
  // posiciones de reposo de los toppings (anillos apilados, los de afuera rozan la pared)
  function restSpots(r, n) {
    const out = []; let layer = 0;
    while (out.length < n && layer < 6) {
      const y = 0.02 + r + layer * r * 1.62, ringR = rAt(y) * 0.955 - r, cnt = Math.max(1, Math.floor((TAU * ringR) / (2.1 * r)));
      for (let i = 0; i < cnt && out.length < n; i++) { const a = (i / cnt) * TAU + layer * 0.37; out.push([Math.cos(a) * ringR, y, Math.sin(a) * ringR]); }
      if (layer === 0 && out.length < n) { const inner = ringR - 2.1 * r; if (inner > r) { const c2 = Math.floor((TAU * inner) / (2.1 * r)); for (let i = 0; i < c2 && out.length < n; i++) { const a = (i / c2) * TAU; out.push([Math.cos(a) * inner, y, Math.sin(a) * inner]); } } }
      layer++;
    }
    return out;
  }
  function placeToppings(mesh, n, r, drop, spinTilt, t, seed) {
    const spots = restSpots(r, n); mesh.count = n;
    for (let i = 0; i < n; i++) {
      const [x, y, z] = spots[i], p = clamp((drop - (i / n) * 0.55) / 0.45);
      const yy = KT.lerp(1.12 + KT.hash(i * 3 + seed) * 0.15, y, bounce(p)); // caída con rebote
      EU.set(KT.hash(i + seed) * 3, KT.hash(i * 7 + seed) * 3 + spinTilt, KT.hash(i * 5 + seed) * 3); Q.setFromEuler(EU);
      V.set(x + (1 - p) * (KT.hash(i * 11) - 0.5) * 0.1, p <= 0 ? -10 : yy, z); M4.compose(V, Q, S1); mesh.setMatrixAt(i, M4);
    }
    mesh.instanceMatrix.needsUpdate = true; mesh.visible = drop > 0;
  }

  KT.drink3d = {
    ok: true,
    draw(ctx, cx, by, H, d, s = {}) {
      if (!R) { try { init(); } catch (e) { console.error('drink3d', e); KT.drink3d.ok = false; return false; } }
      if (!R.fontsDone && KT._fontsDone) { R.film.material.map.dispose(); R.film.material.map = filmTexture(); R.film.material.needsUpdate = true; R.fontsDone = true; }
      const t = s.t || 0, fill = clamp(s.fill == null ? 1 : s.fill), alpha = s.alpha == null ? 1 : s.alpha;
      if (alpha <= 0) return true;
      // tamaño del render según la escala real del lienzo (nítido en pantalla completa y barato en la vista previa)
      const m = ctx.getTransform(), sc = Math.hypot(m.b, m.d) || 1;
      const frac = (R.proj.top - R.proj.base) / 2, hPx = H / frac, wPx = hPx * ASPECT;
      const dev = Math.min(1500, Math.max(64, Math.round(hPx * sc)));
      const rw = Math.round(dev * ASPECT), rh = dev;
      if (R.renderer.domElement.width !== rw || R.renderer.domElement.height !== rh) R.renderer.setSize(rw, rh, false);

      // líquido: nivel, capas y chorro
      const level = MAXL * E.inOutSine(fill);
      rebuildLiquid(d, level, (d.n || '') + '|' + level.toFixed(4));
      const wob = Math.sin(t * 5.3) * 0.02 * Math.sin(Math.PI * clamp(fill)) ;
      R.surface.rotation.set(-Math.PI / 2 + wob, wob * 0.6, 0);
      const pouring = fill > 0.005 && fill < 0.995;
      R.stream.visible = pouring;
      if (pouring) {
        const topY = 1.6, len = topY - level, thin = Math.min(1, fill * 8, (1 - fill) * 10);
        R.stream.scale.set(thin, len, thin); R.stream.position.set(0.04, level + len / 2, 0.02);
        R.streamMat.color.copy(lin(layerColor(d.layers || [[0, d.c1]], Math.min(1, level / MAXL + 0.04))));
      }
      // toppings
      const tp = s.top !== undefined ? s.top : (d.top || { type: 'tapioca' });
      const type = tp && tp.type;
      R.pearls.visible = R.pops.visible = R.jelly.visible = false;
      if (type === 'tapioca') placeToppings(R.pearls, 26, 0.043, clamp(s.pearls == null ? 1 : s.pearls), 0, t, 3);
      else if (type === 'pop') { R.popMat.color.copy(lin(tp.color || '#F2B33A')); placeToppings(R.pops, 24, 0.04, clamp(s.pearls == null ? 1 : s.pearls), 0, t, 5); }
      else if (type === 'jelly') { R.jellyMat.color.copy(lin(tp.color || '#F2ECE2')); placeToppings(R.jelly, 18, 0.05, clamp(s.pearls == null ? 1 : s.pearls), 0, t, 9); }
      // hielo: cae y flota cerca de la superficie
      const iceK = clamp(s.ice || 0); R.ice.visible = iceK > 0;
      if (iceK > 0) {
        const n = 4; R.ice.count = n;
        for (let i = 0; i < n; i++) {
          const p = E.outCubic(clamp((iceK - i * 0.12) / 0.6)), a = i * 1.7 + 0.4, rr = rAt(level) * 0.45 * (0.6 + 0.4 * KT.hash(i * 3));
          const yRest = Math.max(0.12, level - 0.07 - (i % 2) * 0.05) + Math.sin(t * 1.3 + i) * 0.006;
          EU.set(0.4 + i * 0.9 + Math.sin(t * 0.7 + i) * 0.05, i * 1.3, 0.3 * i); Q.setFromEuler(EU);
          V.set(Math.cos(a) * rr, p <= 0 ? -10 : KT.lerp(1.2, yRest, p), Math.sin(a) * rr); M4.compose(V, Q, S1); R.ice.setMatrixAt(i, M4);
        }
        R.ice.instanceMatrix.needsUpdate = true;
      }
      // tapa sellada: baja y se asienta
      const seal = clamp(s.seal || 0); R.film.visible = seal > 0;
      if (seal > 0) { const k = E.outCubic(seal); R.film.position.y = 1.004 + (1 - k) * 0.25; R.film.scale.setScalar(1 + (1 - k) * 0.06); R.film.material.opacity = 0.93 * clamp(seal * 2.5); }
      // popote: entra, perfora la tapa y se asienta inclinado
      const st = clamp(s.straw || 0); R.straw.visible = st > 0;
      if (st > 0) {
        const k = E.outBack ? E.outBack(st) : st;
        R.strawMat.color.copy(lin(s.strawColor || '#E9554A'));
        R.straw.rotation.set(0, 0, 0.17); R.straw.position.set(0.05, 0.1 + (1 - k) * 0.9, 0.04);
        R.strawMat.opacity = 0.82 * clamp(st * 3);
      }
      R.condMat.opacity = 0.85 * clamp(s.cond || 0);
      R.cond.visible = (s.cond || 0) > 0.01;
      // giro y vaivén
      R.cup.rotation.y = s.spin || 0;
      R.wallMat.uniforms.uA.value = 1;
      R.strips.material.opacity = 0.55;
      R.renderer.render(R.scene, R.camera);

      // al lienzo 2D: sombra de contacto suave y el render
      const yBase = (1 - (R.proj.base + 1) / 2) * hPx, x0 = cx - wPx / 2, y0 = by - yBase + (s.bob || 0);
      ctx.save(); ctx.globalAlpha *= alpha;
      const sw = H * R_BOT * 2.9, sh = H * 0.07, sg = ctx.createRadialGradient(cx, by + 4, 0, cx, by + 4, sw);
      sg.addColorStop(0, 'rgba(70,45,25,0.26)'); sg.addColorStop(0.55, 'rgba(70,45,25,0.08)'); sg.addColorStop(1, 'rgba(70,45,25,0)');
      ctx.save(); ctx.translate(cx, by + 4); ctx.scale(1, sh / sw); ctx.translate(-cx, -(by + 4)); ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(cx, by + 4, sw, 0, TAU); ctx.fill(); ctx.restore();
      let src = R.renderer.domElement;
      if (s.fadeTop != null) { // el chorro y el popote se desvanecen antes de llegar al texto de arriba
        if (!R.fc || R.fc.width !== rw || R.fc.height !== rh) R.fc = KT.offscreen(rw, rh);
        const g = R.fc.getContext('2d'); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, rw, rh); g.drawImage(src, 0, 0);
        const fy = ((s.fadeTop - y0) / hPx) * rh, fz = (90 / hPx) * rh;
        if (fy > 0) { const gr = g.createLinearGradient(0, fy, 0, fy + fz); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.globalCompositeOperation = 'destination-out'; g.fillStyle = gr; g.fillRect(0, 0, rw, fy + fz); g.fillStyle = '#000'; g.fillRect(0, 0, rw, Math.max(0, fy)); }
        src = R.fc;
      }
      ctx.drawImage(src, x0, y0, wPx, hPx);
      ctx.restore();
      return true;
    }
  };
})();
