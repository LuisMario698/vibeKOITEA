/* Trazos de la mascota de Koi Tea, calcados del logo. Vista 200 × 244. */
export const HEAD = "M100 34C140 34 158 63 157 96C156 129 133 150 100 150C67 150 44 129 43 96C42 63 60 34 100 34Z";
export const FIN = "M54 122C42 104 18 102 6 113C14 133 38 141 59 134";
export const RAYS = "M58 127C46 121 32 118 20 118M58 131C46 130 34 132 24 136";
export const WHISK = "M66 137C58 141 56 150 62 157";
export const PATCH_A = "M73 60C74 43 91 33 108 34C127 32 147 43 152 61C156 72 152 82 144 81C141 92 129 94 124 87C118 97 103 98 100 88C91 93 78 88 81 78C71 76 69 67 73 60Z";
export const PATCH_B = "M147 76C154 71 161 82 159 98C157 110 149 114 146 106C151 97 144 87 147 76Z";
export const CUP = "M64 184L72 232Q73 238 79 238H121Q127 238 128 232L136 184";
export const CUP_CLIP = "M67 188L74 232Q75 236 79 236H121Q125 236 126 232L133 188Z";
export const PEARLS: Array<[number, number]> = [[84, 224], [96, 227], [108, 226], [119, 222], [90, 215], [102, 216], [114, 213]];
export const BUBS: Array<[number, number]> = [[92, 210], [110, 206], [101, 212]];
export const mirror = (d: string) => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_m, x, y) => `${200 - +x} ${y}`);
