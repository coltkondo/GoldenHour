// Generates the map pin PNGs (+ @2x/@3x) and their geometry.
//
// Run from the repo root (sharp is a mobile devDependency):
//   NODE_PATH=mobile/node_modules node scripts/generate-pin-assets.js
//
// Pins encode deal status, not venue type (almost every venue is a "bar"):
//   live  = gold beer-glass pin with a soft glow (happy hour on right now)
//   later = dark pin with a gold outline (happy hour later today)
//   none  = small grey dot (nothing today)
// Selected pins are larger, with a pink outline that follows the pin shape.
//
// Everything is drawn as one teardrop path on a padded canvas so the shadow,
// glow and outline are never clipped. Sizes below are in points; each pin is
// rendered at 1x, 2x and 3x so it stays sharp on retina screens.

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.join(__dirname, '..', 'mobile', 'src', 'components', 'assets', 'pins');
const GEOMETRY_FILE = path.join(OUTPUT_DIR, 'pinGeometry.json');

const GOLD = '#FFC23D';
const PINK = '#FF4F81';
const PLUM = '#2A1A33';
const INK = '#1A1020';
const GREY = '#8A7A90';
const WHITE = '#FFFFFF';

const PAD = 8; // room for glow / outline / shadow on every side
const TIP_RATIO = 1.5; // tip sits this many radii below the head's centre
const STROKE_W = 1.75;
const SELECTED_STROKE_W = 3;
const GLOW_EXTRA = 8;

// Beer glass with a foam head, in a 24x24 box. Drawn a touch left of centre
// so the handle doesn't make it look off-balance.
const BEER = {
  foam: 'M5.2 8.6a2.6 2.6 0 0 1 2.3-3.8 3.1 3.1 0 0 1 5.6-.2 2.6 2.6 0 0 1 3.4 4',
  body: 'M6 9h10v10.2A1.8 1.8 0 0 1 14.2 21H7.8A1.8 1.8 0 0 1 6 19.2z',
  handle: 'M16 11.5h1.6a1.9 1.9 0 0 1 1.9 1.9v2.2a1.9 1.9 0 0 1-1.9 1.9H16',
  bubbles: 'M9.3 12.5v5.2M12.7 12.5v5.2',
};

// status -> { default, selected } visual spec
const SPECS = {
  live: {
    default: { kind: 'pin', r: 14, fill: GOLD, stroke: WHITE, icon: INK, glow: true },
    selected: {
      kind: 'pin',
      r: 17,
      fill: GOLD,
      stroke: PINK,
      icon: INK,
      glow: true,
      selected: true,
    },
  },
  later: {
    default: { kind: 'pin', r: 11, fill: PLUM, stroke: GOLD, icon: GOLD },
    selected: { kind: 'pin', r: 17, fill: PLUM, stroke: PINK, icon: GOLD, selected: true },
  },
  none: {
    default: { kind: 'dot', r: 5, fill: GREY, stroke: WHITE },
    selected: { kind: 'pin', r: 17, fill: GREY, stroke: PINK, icon: WHITE, selected: true },
  },
};

function beerIcon(cx, cy, r, color) {
  const scale = (r * 1.25) / 24;
  const x = cx - 12 * scale - 0.6 * scale;
  const y = cy - 12 * scale;
  // Keep the stroke ~1.7pt wide whatever the pin size.
  const sw = 1.7 / scale;
  return `<g transform="translate(${x} ${y}) scale(${scale})" fill="none" stroke="${color}"
    stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">
    <path d="${BEER.body}"/><path d="${BEER.handle}"/>
    <path d="${BEER.foam}" fill="${color}" stroke-width="${sw * 0.9}"/>
    <path d="${BEER.bubbles}" stroke-width="${sw * 0.8}"/>
  </g>`;
}

function teardrop(cx, cy, r) {
  const tipY = cy + r * TIP_RATIO;
  return [
    `M${cx} ${tipY}`,
    `C ${cx - r * 0.3} ${cy + r * 1.1}, ${cx - r} ${cy + r * 0.62}, ${cx - r} ${cy}`,
    `A ${r} ${r} 0 1 1 ${cx + r} ${cy}`,
    `C ${cx + r} ${cy + r * 0.62}, ${cx + r * 0.3} ${cy + r * 1.1}, ${cx} ${tipY} Z`,
  ].join(' ');
}

/** Returns { svg, geometry } with sizes in points. */
function build(spec) {
  const defs = `<defs><filter id="s" x="-50%" y="-50%" width="200%" height="200%">
    <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-color="#000" flood-opacity="0.35"/>
  </filter></defs>`;

  if (spec.kind === 'dot') {
    const size = Math.ceil((spec.r + PAD) * 2);
    const c = size / 2;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      ${defs}<circle cx="${c}" cy="${c}" r="${spec.r}" fill="${spec.fill}" stroke="${spec.stroke}" stroke-width="1.5" filter="url(#s)"/>
    </svg>`;
    return {
      svg,
      geometry: {
        width: size,
        height: size,
        anchor: { x: 0.5, y: 0.5 },
        topAboveAnchor: spec.r + 1,
      },
    };
  }

  const { r } = spec;
  const sw = spec.selected ? SELECTED_STROKE_W : STROKE_W;
  const outer = (spec.glow ? r + GLOW_EXTRA : r + sw / 2) + PAD;
  // Whole points, so the @2x/@3x files are exact multiples of the 1x size.
  const width = Math.ceil(outer * 2);
  const cx = width / 2;
  const cy = outer;
  const tipY = cy + r * TIP_RATIO;
  const height = Math.ceil(tipY + PAD);

  const glow = spec.glow
    ? `<radialGradient id="g"><stop offset="0.55" stop-color="${GOLD}" stop-opacity="0.45"/>
         <stop offset="1" stop-color="${GOLD}" stop-opacity="0"/></radialGradient>
       <circle cx="${cx}" cy="${cy}" r="${r + GLOW_EXTRA}" fill="url(#g)"/>`
    : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    ${defs}${glow}
    <path d="${teardrop(cx, cy, r)}" fill="${spec.fill}" stroke="${spec.stroke}" stroke-width="${sw}"
      stroke-linejoin="round" filter="url(#s)"/>
    ${beerIcon(cx, cy, r, spec.icon)}
  </svg>`;

  return {
    svg,
    geometry: {
      width,
      height,
      anchor: { x: 0.5, y: +(tipY / height).toFixed(4) },
      // Distance from the tip up to the top of the visible head.
      topAboveAnchor: Math.ceil(tipY - (cy - r - sw / 2)),
    },
  };
}

async function generate() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  for (const f of fs.readdirSync(OUTPUT_DIR)) {
    if (f.endsWith('.png')) fs.unlinkSync(path.join(OUTPUT_DIR, f));
  }

  const geometry = {};
  for (const [status, states] of Object.entries(SPECS)) {
    geometry[status] = {};
    for (const [state, spec] of Object.entries(states)) {
      const { svg, geometry: g } = build(spec);
      geometry[status][state] = g;
      for (const scale of [1, 2, 3]) {
        const suffix = scale === 1 ? '' : `@${scale}x`;
        const file = `pin-${status}-${state}${suffix}.png`;
        await sharp(Buffer.from(svg), { density: 72 * scale })
          .resize(Math.round(g.width * scale), Math.round(g.height * scale))
          .png()
          .toFile(path.join(OUTPUT_DIR, file));
        console.log(`  ✓ ${file}`);
      }
    }
  }
  fs.writeFileSync(GEOMETRY_FILE, JSON.stringify(geometry, null, 2) + '\n');
  console.log(`  ✓ pinGeometry.json\n\nDone: ${OUTPUT_DIR}`);
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
