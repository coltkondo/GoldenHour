const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.join(__dirname, '..', 'mobile', 'src', 'components', 'assets', 'pins');

const STYLES = {
  default: { bg: '#2A2A2A', border: '#2A2A2A', icon: '#F5A623', arrow: '#2A2A2A' },
  selected: { bg: '#F5A623', border: '#F5A623', icon: '#0D0D0D', arrow: '#F5A623' },
};

const BUBBLE_W = 90;
const BUBBLE_H = 74;
const ARROW_H = 20;
const TOTAL_H = BUBBLE_H + ARROW_H;
const RADIUS = 40;
const STROKE_W = 2;

const ICON_VIEWBOX = 24;
const ICON_W = 36;
const ICON_H = 36;
const ICON_X = Math.round((BUBBLE_W - ICON_W) / 2);
const ICON_Y = Math.round((BUBBLE_H - ICON_H) / 2);
const ICON_SCALE = ICON_W / ICON_VIEWBOX;

const ICONS = {
  bar: {
    elements: [
      { tag: 'path', d: 'M17 11h2a3 3 0 010 6h-2', sw: 1.5, lc: 'round', lj: 'round' },
      { tag: 'path', d: 'M7 8h10v11a2 2 0 01-2 2H9a2 2 0 01-2-2V8z', sw: 1.5, lc: 'round', lj: 'round' },
      { tag: 'path', d: 'M7 8V6a1 1 0 011-1h4a1 1 0 011 1v2', sw: 1.5, lc: 'round', lj: 'round' },
    ],
  },
  food: {
    elements: [
      { tag: 'path', d: 'M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z', sw: 1.5, lc: 'round', lj: 'round' },
      { tag: 'path', d: 'M6 1v3M10 1v3M14 1v3', sw: 1.5, lc: 'round' },
    ],
  },
  music: {
    elements: [
      { tag: 'path', d: 'M9 18V5l12-2v13', sw: 1.5, lc: 'round', lj: 'round' },
      { tag: 'circle', cx: 6, cy: 18, r: 3, sw: 1.5 },
      { tag: 'circle', cx: 18, cy: 16, r: 3, sw: 1.5 },
    ],
  },
  wine: {
    elements: [
      { tag: 'path', d: 'M8 3h8M6 3h12a2 2 0 012 2v4c0 3-2 5-4 7v4a2 2 0 01-2 2h0a2 2 0 01-2-2v-4c-2-2-4-4-4-7V5a2 2 0 012-2z', sw: 1.5, lc: 'round', lj: 'round' },
    ],
  },
  cocktail: {
    elements: [
      { tag: 'path', d: 'M8 3l8 8-4 9-4-9L8 3z', sw: 1.5, lc: 'round', lj: 'round' },
      { tag: 'path', d: 'M5 21h14', sw: 1.5, lc: 'round' },
    ],
  },
  sport: {
    elements: [
      { tag: 'circle', cx: 12, cy: 12, r: 9, sw: 1.5 },
      { tag: 'path', d: 'M12 3v18M3 12h18', sw: 1.2 },
      { tag: 'path', d: 'M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4', sw: 1 },
    ],
  },
  default: {
    elements: [
      { tag: 'path', d: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z', sw: 1.5, lc: 'round', lj: 'round' },
      { tag: 'circle', cx: 12, cy: 9, r: 2.5, sw: 1.5 },
    ],
  },
};

function elSvg(el, color) {
  const stroke = ` stroke="${color}" stroke-width="${el.sw}" fill="none"`;
  const lc = el.lc ? ` stroke-linecap="${el.lc}"` : '';
  const lj = el.lj ? ` stroke-linejoin="${el.lj}"` : '';
  if (el.tag === 'circle') return `<circle cx="${el.cx}" cy="${el.cy}" r="${el.r}"${stroke}${lc}${lj}/>`;
  return `<path d="${el.d}"${stroke}${lc}${lj}/>`;
}

function pinSvg(state, iconKey) {
  const s = STYLES[state];
  const icon = ICONS[iconKey];
  const cx = Math.round(BUBBLE_W / 2);
  const al = cx - 14;
  const ar = cx + 14;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${BUBBLE_W}" height="${TOTAL_H}" viewBox="0 0 ${BUBBLE_W} ${TOTAL_H}">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.3"/>
    </filter>
  </defs>
  <rect x="${STROKE_W / 2}" y="2" width="${BUBBLE_W - STROKE_W}" height="${BUBBLE_H}" rx="${RADIUS}" fill="${s.bg}" stroke="${s.border}" stroke-width="${STROKE_W}" filter="url(#shadow)"/>
  <g transform="translate(${ICON_X}, ${ICON_Y + 2}) scale(${ICON_SCALE})">
      ${icon.elements.map((el) => elSvg(el, s.icon)).join('\n      ')}
  </g>
  <polygon points="${al},${BUBBLE_H + 2} ${ar},${BUBBLE_H + 2} ${cx},${TOTAL_H + 2}" fill="${s.arrow}"/>
</svg>`;
}

async function generate() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const states = ['default', 'selected'];
  for (const [iconKey] of Object.entries(ICONS)) {
    for (const state of states) {
      const svg = pinSvg(state, iconKey);
      const filename = `pin-${iconKey}-${state}.png`;
      await sharp(Buffer.from(svg)).png().toFile(path.join(OUTPUT_DIR, filename));
      console.log(`  ✓ ${filename}`);
    }
  }

  console.log(`\nDone — ${Object.keys(ICONS).length * states.length} PNGs in ${OUTPUT_DIR}`);
}

generate().catch(console.error);
