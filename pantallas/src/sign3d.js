/* Letrero de Koi Tea en 3D (Three.js): las letras de canal de la fachada, redibujadas a partir de la foto del
   letrero (gruesas, redondeadas, inclinadas, con remates más anchos en las puntas y la A sin barra), con cara
   roja, costados blancos y sombra suave sobre la pared. Función pura de sus parámetros.
   KT.sign3d.draw(ctx, cx, cy, W, s): letrero centrado en (cx, cy) con ancho W (px del lienzo 1080×1920).
   s: {intro (0→1, las letras se levantan una por una), sweep (−1→1 brillo que cruza, null = sin brillo), yaw (rad),
      alpha, shadow (0→1)} */
(function () {
  'use strict';
  const KT = window.KT, TAU = Math.PI * 2, T = window.THREE;
  if (!T) { KT.sign3d = { ok: false, draw() { return false; } }; return; }
  const lin = hex => new T.Color(hex).convertSRGBToLinear();
  const clamp = KT.clamp, E = KT.E;
  const SLANT = 0.2, U = 0.01, DEPTH = 0.2, STAND = 0.07, ASPECT = 2.3, FOV = 24;

  // esqueletos de las letras: trazos [x, y, radio] en una caja de 100 de alto (y hacia abajo); 'q' = curva cuadrática
  const Q = (a, c, b, n = 10) => { const out = []; for (let i = 0; i <= n; i++) { const u = i / n, v = 1 - u; out.push([v * v * a[0] + 2 * v * u * c[0] + u * u * b[0], v * v * a[1] + 2 * v * u * c[1] + u * u * b[1], v * a[2] + u * b[2]]); } return out; };
  const GLYPHS = {
    K: { w: 66, strokes: [[[14, 14, 16], [14, 50, 13], [14, 86, 16]], Q([20, 56, 12], [38, 46, 13], [58, 14, 16]), Q([28, 47, 12], [50, 54, 13], [60, 86, 16])] },
    O: { w: 80, strokes: [(() => { const p = []; for (let i = 0; i <= 44; i++) { const a = (i / 44) * TAU; p.push([40 + 26 * Math.cos(a), 50 + 36 * Math.sin(a), 13 + 3 * Math.abs(Math.cos(a))]); } return p; })()] },
    I: { w: 26, strokes: [[[13, 14, 16], [13, 50, 12], [13, 86, 16]]] },
    ' ': { w: 20, strokes: [] },
    T: { w: 74, strokes: [[[12, 15, 15], [37, 14, 13], [62, 15, 15]], [[37, 18, 13], [37, 55, 12], [37, 86, 15]]] },
    E: { w: 58, strokes: [[[50, 14, 14], [32, 14, 13]].concat(Q([32, 14, 13], [13, 14, 13], [13, 34, 13], 8)).concat([[13, 66, 13]]).concat(Q([13, 66, 13], [13, 86, 13], [32, 86, 13], 8)).concat([[50, 86, 14]]), [[15, 50, 12], [44, 50, 14]]] },
    A: { w: 78, strokes: [[[12, 86, 16], [27, 40, 13]].concat(Q([27, 40, 13], [39, 4, 14], [51, 40, 13], 10)).concat([[66, 86, 16]])] }
  };
  const WORD = 'KOI TEA', GAP = 6, KERN = { O: 4, A: 10 }; // aire extra antes de la Λ

  // envolvente convexa de dos círculos (trazo con grosor variable entre dos puntos)
  function hull(x0, y0, r0, x1, y1, r1, n = 10) {
    const dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy);
    const circ = (x, y, r) => { const p = []; for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * TAU; p.push(new T.Vector2(x + r * Math.cos(a), y + r * Math.sin(a))); } return p; };
    if (d + Math.min(r0, r1) <= Math.max(r0, r1) + 1e-6) return r0 > r1 ? circ(x0, y0, r0) : circ(x1, y1, r1);
    const th = Math.atan2(dy, dx), ph = Math.acos(clamp((r0 - r1) / d, -1, 1)), pts = [];
    for (let i = 0; i <= n; i++) { const a = th - ph + (2 * ph * i) / n; pts.push(new T.Vector2(x1 + r1 * Math.cos(a), y1 + r1 * Math.sin(a))); }
    for (let i = 0; i <= n; i++) { const a = th + ph + ((TAU - 2 * ph) * i) / n; pts.push(new T.Vector2(x0 + r0 * Math.cos(a), y0 + r0 * Math.sin(a))); }
    return pts;
  }
  // contorno limpio de una letra: se dibuja con sus trazos en un lienzo a 4 px por unidad y se traza el borde
  // con marching squares (puntos interpolados en cada arista), luego se simplifica (Ramer–Douglas–Peucker)
  const PX = 4, PAD = 12;
  function rdp(pts, eps) {
    if (pts.length < 3) return pts;
    let dmax = 0, idx = 0; const [ax, ay] = pts[0], [bx, by] = pts[pts.length - 1], L = Math.hypot(bx - ax, by - ay) || 1;
    for (let i = 1; i < pts.length - 1; i++) { const d = Math.abs((bx - ax) * (ay - pts[i][1]) - (ax - pts[i][0]) * (by - ay)) / L; if (d > dmax) { dmax = d; idx = i; } }
    if (dmax <= eps) return [pts[0], pts[pts.length - 1]];
    const l = rdp(pts.slice(0, idx + 1), eps), r = rdp(pts.slice(idx), eps); return l.slice(0, -1).concat(r);
  }
  function traceLetter(G) {
    const wU = G.w + SLANT * 100 + PAD * 2, hU = 100 + PAD * 2, W = Math.ceil(wU * PX), H = Math.ceil(hU * PX);
    const c = KT.offscreen(W, H), g = c.getContext('2d'); g.fillStyle = '#000';
    const tx = (px, py) => (px + (100 - py) * SLANT + PAD) * PX, ty = py => (py + PAD) * PX;
    G.strokes.forEach(st => { for (let i = 0; i < st.length - 1; i++) { const [ax, ay, ar] = st[i], [bx, by, br] = st[i + 1]; const pts = hull(tx(ax, ay), ty(ay), ar * PX, tx(bx, by), ty(by), br * PX, 16); g.beginPath(); pts.forEach((p, k) => (k ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y))); g.closePath(); g.fill(); } });
    const A = g.getImageData(0, 0, W, H).data, v = (x, y) => A[(y * W + x) * 4 + 3] / 255, TH = 0.5;
    const lerpP = (x0, y0, v0, x1, y1, v1) => { const k = (TH - v0) / ((v1 - v0) || 1e-6); return [x0 + (x1 - x0) * k, y0 + (y1 - y0) * k]; };
    const pt = {}, adj = {};
    const P = (key, x0, y0, v0, x1, y1, v1) => { if (!pt[key]) pt[key] = lerpP(x0, y0, v0, x1, y1, v1); return key; };
    const link = (k1, k2) => { (adj[k1] = adj[k1] || []).push(k2); (adj[k2] = adj[k2] || []).push(k1); };
    for (let y = 0; y < H - 1; y++) for (let x = 0; x < W - 1; x++) {
      const a = v(x, y), b = v(x + 1, y), cc = v(x + 1, y + 1), d = v(x, y + 1);
      const idx = (a > TH ? 8 : 0) | (b > TH ? 4 : 0) | (cc > TH ? 2 : 0) | (d > TH ? 1 : 0);
      if (idx === 0 || idx === 15) continue;
      const T_ = () => P('h' + x + ',' + y, x, y, a, x + 1, y, b), Rr = () => P('v' + (x + 1) + ',' + y, x + 1, y, b, x + 1, y + 1, cc);
      const B = () => P('h' + x + ',' + (y + 1), x, y + 1, d, x + 1, y + 1, cc), Ll = () => P('v' + x + ',' + y, x, y, a, x, y + 1, d);
      switch (idx) {
        case 1: case 14: link(Ll(), B()); break;
        case 2: case 13: link(B(), Rr()); break;
        case 3: case 12: link(Ll(), Rr()); break;
        case 4: case 11: link(T_(), Rr()); break;
        case 6: case 9: link(T_(), B()); break;
        case 7: case 8: link(Ll(), T_()); break;
        case 5: if ((a + b + cc + d) / 4 > TH) { link(Ll(), T_()); link(B(), Rr()); } else { link(Ll(), B()); link(T_(), Rr()); } break;
        case 10: if ((a + b + cc + d) / 4 > TH) { link(T_(), Rr()); link(Ll(), B()); } else { link(Ll(), T_()); link(B(), Rr()); } break;
      }
    }
    const seen = new Set(), loops = [];
    Object.keys(adj).forEach(k0 => {
      if (seen.has(k0)) return;
      const loop = []; let prev = null, cur = k0;
      while (cur && !seen.has(cur)) { seen.add(cur); loop.push(pt[cur]); const nx = (adj[cur] || []).find(n => n !== prev && !seen.has(n)); prev = cur; cur = nx; }
      if (loop.length > 8) loops.push(loop);
    });
    // a unidades del mundo (y hacia arriba, base en 0) y simplificado
    const toW = p => new T.Vector2((p[0] / PX - PAD) * U, (100 - (p[1] / PX - PAD)) * U);
    const area = l => { let s2 = 0; for (let i = 0; i < l.length; i++) { const [x1, y1] = l[i], [x2, y2] = l[(i + 1) % l.length]; s2 += x1 * y2 - x2 * y1; } return s2 / 2; };
    const inside = (p, l) => { let c2 = false; for (let i = 0, j = l.length - 1; i < l.length; j = i++) { const [xi, yi] = l[i], [xj, yj] = l[j]; if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) c2 = !c2; } return c2; };
    const simp = loops.map(l => { // lazo cerrado: se parte en el punto más lejano del inicio y se simplifica cada mitad
      let j = 0, dm = 0; l.forEach((q, i) => { const d = Math.hypot(q[0] - l[0][0], q[1] - l[0][1]); if (d > dm) { dm = d; j = i; } });
      const a1 = rdp(l.slice(0, j + 1), 0.35), a2 = rdp(l.slice(j).concat([l[0]]), 0.35);
      return a1.slice(0, -1).concat(a2.slice(0, -1));
    }).filter(l => l.length > 4);
    simp.sort((p, q) => Math.abs(area(q)) - Math.abs(area(p)));
    const shapes = [];
    simp.forEach(l => {
      const depth = simp.filter(o => o !== l && Math.abs(area(o)) > Math.abs(area(l)) && inside(l[0], o)).length;
      if (depth % 2 === 0) shapes.push({ outer: l, holes: [] });
      else { const host = shapes.slice().reverse().find(sh => inside(l[0], sh.outer)); if (host) host.holes.push(l); }
    });
    return shapes.map(sh => { const S = new T.Shape(sh.outer.map(toW)); sh.holes.forEach(h => S.holes.push(new T.Path(h.map(toW)))); return S; });
  }
  function buildLetters() {
    const letters = []; let x = 0;
    for (const ch of WORD) {
      const G = GLYPHS[ch]; x += KERN[ch] || 0;
      if (G.strokes.length) {
        const shapes = traceLetter(G);
        const geom = new T.ExtrudeGeometry(shapes, { depth: DEPTH, bevelEnabled: true, bevelThickness: 0.022, bevelSize: 0.012, bevelSegments: 3, curveSegments: 4 });
        letters.push({ geom, x0: x * U, w: (G.w + SLANT * 100) * U });
      }
      x += G.w + GAP;
    }
    return { letters, width: (x - GAP + SLANT * 100) * U };
  }

  let R = null;
  function init() {
    const canvas = KT.offscreen(8, 8);
    const renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setClearColor(0x000000, 0); renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.NoToneMapping;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
    const scene = new T.Scene();
    const { letters, width } = buildLetters();
    const front = new T.MeshPhysicalMaterial({ color: lin('#E8452B'), roughness: 0.5, clearcoat: 0.45, clearcoatRoughness: 0.3 });
    const side = new T.MeshPhysicalMaterial({ color: lin('#F1EEEA'), roughness: 0.45, clearcoat: 0.3 });
    const group = new T.Group(); scene.add(group);
    const meshes = letters.map(L => {
      const pivot = new T.Group(); pivot.position.set(L.x0 - width / 2 + L.w / 2, -0.5, STAND); // giro sobre la base de la letra
      const m = new T.Mesh(L.geom, [front, side]); m.position.set(-L.w / 2, 0, 0); m.castShadow = true;
      pivot.add(m); group.add(pivot); return pivot;
    });
    // pared que solo recibe la sombra
    const wall = new T.Mesh(new T.PlaneGeometry(20, 10), new T.ShadowMaterial({ opacity: 0.3 })); wall.position.set(0, 0, 0); wall.receiveShadow = true; scene.add(wall);
    scene.add(new T.HemisphereLight(0xfff6ec, 0xc9b8a6, 0.5));
    const key = new T.DirectionalLight(0xfff1e2, 0.52); key.position.set(-2.6, 3.4, 5.5); key.castShadow = true;
    key.shadow.mapSize.set(2048, 1024); Object.assign(key.shadow.camera, { left: -4, right: 4, top: 2, bottom: -2, near: 0.5, far: 16 }); key.shadow.bias = -0.0004; key.shadow.radius = 4;
    scene.add(key);
    const fill = new T.DirectionalLight(0xffe7d6, 0.18); fill.position.set(3, -1, 4); scene.add(fill);
    const glint = new T.PointLight(0xffffff, 0, 6, 1.6); scene.add(glint);
    const camera = new T.PerspectiveCamera(FOV, ASPECT, 0.1, 50);
    const halfH = Math.atan(Math.tan((FOV * Math.PI) / 360) * ASPECT), dist = (width * 0.56) / Math.tan(halfH);
    R = { renderer, scene, camera, meshes, glint, dist, width };
  }

  KT.sign3d = {
    ok: true,
    draw(ctx, cx, cy, W, s = {}) {
      if (!R) { try { init(); } catch (e) { console.error('sign3d', e); KT.sign3d.ok = false; return false; } }
      const a = s.alpha == null ? 1 : s.alpha; if (a <= 0) return true;
      const m = ctx.getTransform(), sc = Math.hypot(m.a, m.b) || 1, H = W / ASPECT;
      const rw = Math.min(2000, Math.max(64, Math.round(W * sc))), rh = Math.round(rw / ASPECT);
      if (R.renderer.domElement.width !== rw || R.renderer.domElement.height !== rh) R.renderer.setSize(rw, rh, false);
      const intro = s.intro == null ? 1 : s.intro, n = R.meshes.length;
      R.meshes.forEach((p, i) => {
        const k = clamp((intro - (i / n) * 0.55) / 0.45);
        p.rotation.x = (1 - E.outBack(k)) * 1.45; // de acostada hacia la cámara a parada, con un pequeño rebote
        p.visible = k > 0;
      });
      const yaw = s.yaw || 0;
      R.camera.position.set(Math.sin(yaw) * R.dist, -0.12, Math.cos(yaw) * R.dist); R.camera.lookAt(0, 0, 0.12);
      if (s.sweep == null) R.glint.intensity = 0; else { R.glint.intensity = 1.4 * Math.sin(Math.PI * clamp((s.sweep + 1) / 2)); R.glint.position.set(s.sweep * R.width * 0.6, 0.55, 1.1); }
      R.renderer.render(R.scene, R.camera);
      ctx.save(); ctx.globalAlpha *= a; ctx.drawImage(R.renderer.domElement, cx - W / 2, cy - H / 2, W, H); ctx.restore();
      return true;
    }
  };
})();
