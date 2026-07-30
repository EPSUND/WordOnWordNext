/**
 * Genererar app-ikonerna i public/ genom att rendera ORD × ORD-korset från
 * välkomstskärmen (Welcome.tsx) med SPELETS EGNA tile-CSS och ta en skärmbild
 * med en headless Chromium (Edge eller Chrome). Brickorna blir därmed pixel-för-
 * pixel som in-game – samma gradient, ram, skugga och Georgia-serif – utan
 * handritade glyfer. Poängsiffrorna utelämnas medvetet (visuellt brus i ikonstorlek).
 *
 * Kör om vid designändring:
 *   node scripts/make-icons.mjs
 *
 * Förutsätter en lokal Chromium (Edge/Chrome) och att serif-typsnittet Georgia
 * finns (annars faller CSS:en tillbaka på Times/serif). Ikonerna är genererade
 * en gång och incheckade i public/ – detta är ett manuellt dev-verktyg, inte
 * en del av byggkedjan.
 */
import { execFileSync } from "node:child_process";
import { writeFileSync, mkdirSync, mkdtempSync, existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public");

// Hitta en headless Chromium att rendera med (Chrome eller Edge duger).
const BROWSERS = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];
const browser = BROWSERS.find((p) => existsSync(p));
if (!browser) {
  console.error("Hittade ingen Edge/Chrome. Installera en Chromium-webbläsare och kör igen.");
  process.exit(1);
}

// Korsets brickor (samma plusform som Welcome.tsx CROSS), placerade explicit i
// ett 3×3-rutnät så tomma rutor behåller sin höjd:
//   .  O  .
//   O  R  D
//   .  D  .
const CROSS = [
  { letter: "O", col: 2, row: 1 },
  { letter: "O", col: 1, row: 2 },
  { letter: "R", col: 2, row: 2 },
  { letter: "D", col: 3, row: 2 },
  { letter: "D", col: 2, row: 3 },
];

/** Bygger HTML för en ikon i storleken size×size med spelets tile-CSS. */
function html(size) {
  const tile = Math.round(size * 0.256);
  const gap = Math.round(size * 0.026);
  const radius = Math.round(tile * 0.13); // 8px vid 62px-brickan
  const border = Math.max(1, Math.round(tile * 0.016));
  const edge = Math.round(tile * 0.05); // 3D-underkant (box-shadow 0 3px 0)
  const soft = Math.round(tile * 0.065);
  const blur = Math.round(tile * 0.13);
  const font = Math.round(tile * 0.52); // font-size:calc(--tile-size*.52) från Board.css

  const cells = CROSS.map(
    (c) => `<div class="tile" style="grid-column:${c.col};grid-row:${c.row}">${c.letter}</div>`,
  ).join("");

  return `<!doctype html><html><head><meta charset="utf-8"><style>
  html,body{margin:0;padding:0}
  .icon{
    width:${size}px;height:${size}px;box-sizing:border-box;
    display:flex;align-items:center;justify-content:center;
    background:#22362e; /* --board */
  }
  .cross{
    display:grid;
    grid-template-columns:repeat(3,${tile}px);
    grid-template-rows:repeat(3,${tile}px);
    gap:${gap}px;
  }
  .tile{
    display:flex;align-items:center;justify-content:center;
    background:linear-gradient(160deg,#f5ebd7,#e7d6b4); /* --tile1 → --tile2 */
    color:#33261a; /* --ink */
    font-family:Georgia,"Times New Roman",serif;font-weight:700;
    font-size:${font}px;line-height:1;
    border-radius:${radius}px;border:${border}px solid #c9b58e;
    box-shadow:0 ${edge}px 0 #b39d76,0 ${soft}px ${blur}px #0006;
  }
  </style></head><body><div class="icon"><div class="cross">${cells}</div></div></body></html>`;
}

mkdirSync(OUT, { recursive: true });
// Färsk temp-katalog per körning så webbläsaren inte återanvänder en cachad sida.
const work = mkdtempSync(join(tmpdir(), "wow-icons-"));

for (const [name, size] of [
  ["icon-192.png", 192],
  ["icon-512.png", 512],
  ["apple-touch-icon.png", 180], // iOS kräver PNG – SVG i manifestet räcker inte
]) {
  const htmlPath = join(work, `icon-${size}.html`);
  const outPath = join(OUT, name);
  writeFileSync(htmlPath, html(size));

  execFileSync(
    browser,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--no-first-run",
      "--no-default-browser-check",
      `--user-data-dir=${join(work, `profile-${size}`)}`,
      "--force-device-scale-factor=1",
      "--run-all-compositor-stages-before-draw",
      "--virtual-time-budget=1000",
      `--window-size=${size},${size}`,
      `--screenshot=${outPath}`,
      `file:///${htmlPath.replace(/\\/g, "/")}`,
    ],
    { stdio: "ignore" },
  );

  if (!existsSync(outPath)) {
    console.error(`Skärmbilden för ${name} skapades inte – kontrollera webbläsaren.`);
    process.exit(1);
  }
  console.log(`${name.padEnd(22)} ${size}x${size}  ${(statSync(outPath).size / 1024).toFixed(1)} kB`);
}
