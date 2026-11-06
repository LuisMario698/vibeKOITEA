// Genera los íconos de la PWA y del sitio a partir de la mascota en SVG (sin depender de archivos externos).
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";

const HEAD = "M100 34C140 34 158 63 157 96C156 129 133 150 100 150C67 150 44 129 43 96C42 63 60 34 100 34Z";
const FIN = "M54 122C42 104 18 102 6 113C14 133 38 141 59 134";
const RAYS = "M58 127C46 121 32 118 20 118M58 131C46 130 34 132 24 136";
const WHISK = "M66 137C58 141 56 150 62 157";
const PATCH_A = "M73 60C74 43 91 33 108 34C127 32 147 43 152 61C156 72 152 82 144 81C141 92 129 94 124 87C118 97 103 98 100 88C91 93 78 88 81 78C71 76 69 67 73 60Z";
const PATCH_B = "M147 76C154 71 161 82 159 98C157 110 149 114 146 106C151 97 144 87 147 76Z";
const mirror = (d) => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_m, x, y) => `${200 - +x} ${y}`);
const PEARLS = [[84, 224], [96, 227], [108, 226], [119, 222], [90, 215], [102, 216], [114, 213]];
const INK = "#27211E";

function koi({ bg = "#FEF4EB", pad = 0, size = 512, circle = false } = {}) {
  const st = `fill="none" stroke="${INK}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"`;
  const th = `fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"`;
  // el dibujo mide 200×244: lo centramos en un cuadro con margen
  const S = 244 + pad * 2, ox = (S - 200) / 2 + 0, oy = pad;
  const bgEl = circle ? `<circle cx="${S / 2}" cy="${S / 2}" r="${S / 2}" fill="${bg}"/>` : `<rect width="${S}" height="${S}" fill="${bg}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${size}" height="${size}">${bgEl}
  <g transform="translate(${ox} ${oy})">
  <path d="M64 184L72 232Q73 238 79 238H121Q127 238 128 232L136 184Z" fill="#FFFFFF" fill-opacity=".72"/>
  <defs><clipPath id="c"><path d="M67 188L74 232Q75 236 79 236H121Q125 236 126 232L133 188Z"/></clipPath><clipPath id="h"><path d="${HEAD}"/></clipPath></defs>
  <g clip-path="url(#c)"><rect x="60" y="199" width="80" height="42" fill="#C99A78"/><path d="M60 200Q70 196 80 200T100 200T120 200T140 200V206H60Z" fill="#DDB696"/></g>
  ${PEARLS.map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="5" fill="#2A1A12"/><circle cx="${p[0] - 1.6}" cy="${p[1] - 1.7}" r="1.3" fill="#7A5A48"/>`).join("")}
  <path ${st} d="M64 184L72 232Q73 238 79 238H121Q127 238 128 232L136 184"/>
  <path d="M62 177H138V184H62Z" fill="#FFFDF9"/><path d="M68 177Q100 160 132 177Z" fill="#FFFDF9"/>
  <path ${st} d="M60 177H140V184H60ZM68 177Q100 160 132 177"/>
  <rect x="95.5" y="118" width="9" height="62" rx="1.5" fill="#F4ECE2" stroke="${INK}" stroke-width="2.6"/><path d="M98.5 124V174" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round"/>
  <path d="M87 40Q95 25 99 11Q104 25 114 39Z" fill="#FFFDF9"/><path ${st} d="M87 40Q95 25 99 11Q104 25 114 39"/>
  <path d="${FIN}Z" fill="#FFFDF9"/><path ${st} d="${FIN}"/><path ${th} d="${RAYS}"/>
  <path d="${mirror(FIN)}Z" fill="#FFFDF9"/><path ${st} d="${mirror(FIN)}"/><path ${th} d="${mirror(RAYS)}"/>
  <path d="${HEAD}" fill="#FFFDF9"/>
  <g clip-path="url(#h)" fill="#F2502E"><path d="${PATCH_A}"/><path d="${PATCH_B}"/></g>
  <path ${st} d="${HEAD}"/><path ${th} d="${WHISK}"/><path ${th} d="${mirror(WHISK)}"/>
  <ellipse cx="78" cy="104" rx="4.8" ry="5.8" fill="${INK}"/><circle cx="79.6" cy="101.8" r="1.5" fill="#fff"/>
  <ellipse cx="122" cy="104" rx="4.8" ry="5.8" fill="${INK}"/><circle cx="123.6" cy="101.8" r="1.5" fill="#fff"/>
  </g></svg>`;
}

mkdirSync("public/icons", { recursive: true });
mkdirSync("public/brand", { recursive: true });
writeFileSync("public/brand/koi-mark.svg", koi({ bg: "none", pad: 0, size: 200 }).replace(/<rect width="244" height="244" fill="none"\/>/, ""));
const out = async (file, svg, size) => sharp(Buffer.from(svg)).resize(size, size).png().toFile(file);
await out("public/icons/icon-192.png", koi({ pad: 30 }), 192);
await out("public/icons/icon-512.png", koi({ pad: 30 }), 512);
await out("public/icons/maskable-512.png", koi({ pad: 70 }), 512);
await out("src/app/icon.png", koi({ pad: 26, circle: true, bg: "#FEF4EB" }), 512);
await out("src/app/apple-icon.png", koi({ pad: 36 }), 180);
await out("public/icons/og-mark.png", koi({ pad: 30 }), 400);
console.log("icons ok");
