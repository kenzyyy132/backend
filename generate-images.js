/**
 * Generates a product image for every entry in seed/products.json.
 *
 * The images are drawn here as SVG rather than downloaded, so the catalogue
 * ships with real artwork that carries no licensing questions. Each product
 * gets a shape chosen from its category and a colour derived from its name,
 * so the grid looks varied but stays on-brand.
 *
 *   node seed/generate-images.js
 */

const fs = require('fs');
const path = require('path');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
const PRODUCTS = require('./products.json');

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

/** Stable hash so a product always gets the same colours. */
function hashOf(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

/** Two-stop palette per product, kept inside the brand's pink/orchid range. */
function paletteFor(name, category) {
  const ranges = {
    skincare: [280, 55],
    makeup: [330, 45],
    perfume: [265, 60],
    sets: [305, 50],
  };

  const [base, spread] = ranges[category] ?? [300, 50];
  const hue = base + (hashOf(name) % spread) - spread / 2;

  return {
    light: `hsl(${hue} 72% 93%)`,
    mid: `hsl(${hue} 58% 78%)`,
    deep: `hsl(${hue} 46% 56%)`,
    dark: `hsl(${hue} 44% 38%)`,
    bg1: `hsl(${hue} 80% 97%)`,
    bg2: `hsl(${hue + 18} 70% 92%)`,
  };
}

/* ------------------------------------------------------------------ */
/* Shapes                                                              */
/* ------------------------------------------------------------------ */

const dropper = (c) => `
  <rect x="178" y="92" width="44" height="34" rx="8" fill="${c.dark}"/>
  <rect x="188" y="124" width="24" height="18" fill="${c.mid}"/>
  <rect x="150" y="140" width="100" height="168" rx="22" fill="url(#body)"/>
  <rect x="150" y="226" width="100" height="82" rx="20" fill="${c.deep}" opacity=".32"/>
  <rect x="170" y="164" width="14" height="72" rx="7" fill="#fff" opacity=".65"/>
  <rect x="166" y="248" width="68" height="30" rx="7" fill="#fff" opacity=".55"/>`;

const jar = (c) => `
  <ellipse cx="200" cy="146" rx="86" ry="20" fill="${c.dark}"/>
  <rect x="114" y="146" width="172" height="34" fill="${c.dark}"/>
  <ellipse cx="200" cy="180" rx="86" ry="20" fill="${c.deep}"/>
  <rect x="120" y="180" width="160" height="112" fill="url(#body)"/>
  <ellipse cx="200" cy="292" rx="80" ry="18" fill="${c.deep}"/>
  <rect x="140" y="200" width="16" height="66" rx="8" fill="#fff" opacity=".6"/>
  <rect x="152" y="214" width="96" height="30" rx="7" fill="#fff" opacity=".5"/>`;

const tube = (c) => `
  <rect x="176" y="86" width="48" height="40" rx="9" fill="${c.dark}"/>
  <path d="M158 126 h84 l16 152 a24 24 0 0 1 -24 26 h-68 a24 24 0 0 1 -24 -26 Z" fill="url(#body)"/>
  <rect x="174" y="152" width="14" height="76" rx="7" fill="#fff" opacity=".62"/>
  <rect x="164" y="242" width="72" height="28" rx="7" fill="#fff" opacity=".5"/>`;

const flacon = (c) => `
  <rect x="180" y="80" width="40" height="30" rx="5" fill="${c.dark}"/>
  <rect x="190" y="108" width="20" height="20" fill="${c.mid}"/>
  <path d="M132 128 h136 a26 26 0 0 1 26 26 v122 a30 30 0 0 1 -30 30 h-128 a30 30 0 0 1 -30 -30 v-122 a26 26 0 0 1 26 -26 Z" fill="url(#body)"/>
  <path d="M132 214 h188 v62 a30 30 0 0 1 -30 30 h-128 a30 30 0 0 1 -30 -30 Z" fill="${c.deep}" opacity=".3"/>
  <rect x="152" y="154" width="16" height="70" rx="8" fill="#fff" opacity=".62"/>
  <rect x="158" y="238" width="84" height="32" rx="7" fill="#fff" opacity=".52"/>`;

const lipstick = (c) => `
  <path d="M176 92 h48 v54 l-48 18 Z" fill="${c.deep}"/>
  <rect x="170" y="150" width="60" height="26" rx="5" fill="${c.dark}"/>
  <rect x="166" y="176" width="68" height="132" rx="12" fill="url(#body)"/>
  <rect x="180" y="198" width="12" height="60" rx="6" fill="#fff" opacity=".6"/>
  <rect x="176" y="272" width="48" height="22" rx="6" fill="#fff" opacity=".5"/>`;

const compact = (c) => `
  <circle cx="200" cy="212" r="104" fill="url(#body)"/>
  <circle cx="200" cy="212" r="78" fill="${c.deep}" opacity=".38"/>
  <circle cx="200" cy="212" r="56" fill="${c.light}"/>
  <path d="M152 168 a68 68 0 0 1 44 -30" stroke="#fff" stroke-width="12" stroke-linecap="round" fill="none" opacity=".6"/>`;

const giftBox = (c) => `
  <rect x="104" y="170" width="192" height="140" rx="14" fill="url(#body)"/>
  <rect x="92" y="140" width="216" height="42" rx="12" fill="${c.deep}"/>
  <rect x="186" y="140" width="28" height="170" fill="#fff" opacity=".55"/>
  <path d="M200 140 c-30 -40 -74 -14 -46 12 M200 140 c30 -40 74 -14 46 12" stroke="${c.dark}" stroke-width="13" fill="none" stroke-linecap="round"/>
  <rect x="120" y="212" width="16" height="62" rx="8" fill="#fff" opacity=".45"/>`;

const soap = (c) => `
  <rect x="112" y="162" width="176" height="126" rx="26" fill="url(#body)"/>
  <rect x="112" y="238" width="176" height="50" rx="24" fill="${c.deep}" opacity=".3"/>
  <ellipse cx="200" cy="200" rx="52" ry="24" fill="#fff" opacity=".5"/>
  <circle cx="288" cy="156" r="14" fill="${c.light}" opacity=".9"/>
  <circle cx="312" cy="186" r="9" fill="${c.light}" opacity=".8"/>`;

/** Shapes are picked per product so two items in a category still differ. */
const SHAPES = {
  skincare: [dropper, jar, tube, soap],
  makeup: [lipstick, compact, tube, jar],
  perfume: [flacon, dropper, flacon, tube],
  sets: [giftBox, jar, flacon, giftBox],
};

/**
 * A product may name its shape explicitly via a `shape` field in
 * products.json. Without it the shape is hashed from the name, which gives
 * variety but can put a lipstick silhouette on a bar of soap.
 * Mongoose ignores the extra field, so it never reaches the database.
 */
const SHAPES_BY_NAME = { dropper, jar, tube, flacon, lipstick, compact, giftBox, soap };

/* ------------------------------------------------------------------ */

function svgFor(product) {
  const c = paletteFor(product.name, product.category);
  const options = SHAPES[product.category] ?? SHAPES.skincare;
  const shape =
    SHAPES_BY_NAME[product.shape] ??
    options[hashOf(product.brand + product.name) % options.length];

  // The background is deliberately transparent: the card behind the image
  // supplies it, so the same file looks right in both light and dark themes.
  // The brand name is not drawn here either — the card already prints it.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400" role="img" aria-label="${escapeXml(product.name)}">
  <defs>
    <linearGradient id="body" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset=".45" stop-color="${c.mid}"/>
      <stop offset="1" stop-color="${c.deep}"/>
    </linearGradient>
    <radialGradient id="halo" cx=".5" cy=".45" r=".5">
      <stop offset="0" stop-color="${c.light}" stop-opacity=".55"/>
      <stop offset="1" stop-color="${c.light}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <circle cx="200" cy="200" r="150" fill="url(#halo)"/>
  <circle cx="312" cy="92" r="48" fill="${c.mid}" opacity=".3"/>
  <circle cx="84" cy="318" r="62" fill="${c.mid}" opacity=".22"/>

  <ellipse cx="200" cy="326" rx="88" ry="15" fill="${c.dark}" opacity=".2"/>
  ${shape(c)}
</svg>`;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** URL-safe file name derived from the product name. */
function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function run() {
  const updated = PRODUCTS.map((product) => {
    const file = `product-${slugify(product.name)}.svg`;
    fs.writeFileSync(path.join(UPLOAD_DIR, file), svgFor(product), 'utf8');
    return { ...product, image: `/uploads/${file}` };
  });

  // Write the image paths back so `npm run seed` stores them on the documents.
  fs.writeFileSync(
    path.join(__dirname, 'products.json'),
    JSON.stringify(updated, null, 2) + '\n',
    'utf8',
  );

  console.log(`Generated ${updated.length} product images in uploads/`);
  console.log('Image paths written back into seed/products.json');
}

run();
