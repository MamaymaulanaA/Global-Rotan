// Generates consistent, clearly-demo "studio render" placeholder images for Global Rotan.
// All images share the same lighting, backdrop, palette and aspect ratios.
// Replace them with real product photography through the admin dashboard.
// Usage: node scripts/generate-demo-images.mjs
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const OUT = path.resolve('public/demo');

export const TONES = {
  honey: { base: '#C89B5E', light: '#E4C28C', dark: '#9A6E3F', gap: '#5E4127' },
  walnut: { base: '#7E5636', light: '#A67B52', dark: '#553821', gap: '#2B1D11' },
  whitewash: { base: '#E4D8C3', light: '#F5EEE2', dark: '#C2B194', gap: '#8F7E63' },
  black: { base: '#37322D', light: '#5A534B', dark: '#201D1A', gap: '#0E0C0B' },
  sand: { base: '#A89F92', light: '#CBC3B7', dark: '#80786C', gap: '#4D4841' },
  charcoal: { base: '#58534D', light: '#7D766F', dark: '#3B3733', gap: '#1C1A18' },
  natural: { base: '#D2AE78', light: '#EACDA0', dark: '#A7824F', gap: '#6A4E2E' },
};
const TEAK = { base: '#9A6A3F', light: '#BE8F60', dark: '#6C4726' };
const FABRIC = { oat: '#E8E0D2', cream: '#F2ECE1', sage: '#B7BDA3', clay: '#C68B6E', stone: '#CEC6B8', ink: '#4A443E' };

// ---------------------------------------------------------------------------
// Shared defs
// ---------------------------------------------------------------------------
function defs(t, { patternScale = 1 } = {}) {
  const s = patternScale;
  return `
  <defs>
    <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#F4EDE2"/><stop offset="1" stop-color="#EBE1D2"/>
    </linearGradient>
    <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#E3D7C5"/><stop offset="1" stop-color="#D5C6AF"/>
    </linearGradient>
    <linearGradient id="wall2" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#EDE2D1"/><stop offset="1" stop-color="#E2D4BF"/>
    </linearGradient>
    <linearGradient id="floor2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#CDB999"/><stop offset="1" stop-color="#BBA482"/>
    </linearGradient>
    <radialGradient id="light" cx="0.3" cy="0.2" r="0.9">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="vignette" cx="0.5" cy="0.45" r="0.75">
      <stop offset="0.55" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#2B1D11" stop-opacity="0.28"/>
    </radialGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.35"/>
      <stop offset="0.5" stop-color="#FFFFFF" stop-opacity="0"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.12"/>
    </linearGradient>
    <linearGradient id="teak" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${TEAK.light}"/><stop offset="1" stop-color="${TEAK.dark}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#FFE3B0" stop-opacity="0.9"/>
      <stop offset="1" stop-color="#FFE3B0" stop-opacity="0"/>
    </radialGradient>
    <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="16"/></filter>
    <filter id="softer" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
    <pattern id="cane" width="${24 * s}" height="${24 * s}" patternUnits="userSpaceOnUse">
      <rect width="${24 * s}" height="${24 * s}" fill="${t.gap}"/>
      <g stroke="${t.base}" stroke-width="${3.2 * s}" stroke-linecap="round">
        <line x1="0" y1="0" x2="${24 * s}" y2="${24 * s}"/>
        <line x1="${24 * s}" y1="0" x2="0" y2="${24 * s}"/>
      </g>
      <rect x="0" y="${8.5 * s}" width="${24 * s}" height="${7 * s}" fill="${t.light}"/>
      <rect x="${8.5 * s}" y="0" width="${7 * s}" height="${24 * s}" fill="${t.base}"/>
      <rect x="0" y="${8.5 * s}" width="${24 * s}" height="${2 * s}" fill="#FFFFFF" opacity="0.18"/>
    </pattern>
    <pattern id="wicker" width="${22 * s}" height="${14 * s}" patternUnits="userSpaceOnUse">
      <rect width="${22 * s}" height="${14 * s}" fill="${t.gap}"/>
      <rect x="${1 * s}" y="${1 * s}" width="${20 * s}" height="${5.2 * s}" rx="${2.6 * s}" fill="${t.base}"/>
      <rect x="${1 * s}" y="${1 * s}" width="${20 * s}" height="${2 * s}" rx="${1 * s}" fill="${t.light}" opacity="0.7"/>
      <rect x="${-10 * s}" y="${8 * s}" width="${20 * s}" height="${5.2 * s}" rx="${2.6 * s}" fill="${t.base}"/>
      <rect x="${12 * s}" y="${8 * s}" width="${20 * s}" height="${5.2 * s}" rx="${2.6 * s}" fill="${t.base}"/>
      <rect x="${12 * s}" y="${8 * s}" width="${20 * s}" height="${2 * s}" rx="${1 * s}" fill="${t.light}" opacity="0.7"/>
      <rect x="${-10 * s}" y="${8 * s}" width="${20 * s}" height="${2 * s}" rx="${1 * s}" fill="${t.light}" opacity="0.7"/>
    </pattern>
    <pattern id="weave" width="${30 * s}" height="${30 * s}" patternUnits="userSpaceOnUse">
      <rect width="${30 * s}" height="${30 * s}" fill="${t.dark}"/>
      <rect x="${1 * s}" y="${1 * s}" width="${13 * s}" height="${28 * s}" rx="${3 * s}" fill="${t.base}"/>
      <rect x="${16 * s}" y="${1 * s}" width="${13 * s}" height="${13 * s}" rx="${3 * s}" fill="${t.light}"/>
      <rect x="${16 * s}" y="${16 * s}" width="${13 * s}" height="${13 * s}" rx="${3 * s}" fill="${t.base}"/>
      <rect x="${1 * s}" y="${1 * s}" width="${13 * s}" height="${4 * s}" rx="${2 * s}" fill="#FFFFFF" opacity="0.2"/>
    </pattern>
  </defs>`;
}

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------
const pole = (t, d, w = 14) => `
  <path d="${d}" fill="none" stroke="${t.dark}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="${d}" fill="none" stroke="${t.base}" stroke-width="${w * 0.7}" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="${d}" fill="none" stroke="${t.light}" stroke-width="${w * 0.22}" stroke-linecap="round" stroke-linejoin="round" transform="translate(${-w * 0.14} ${-w * 0.14})" opacity="0.8"/>`;

const wrap = (t, x, y, w = 18, angle = 0) => `
  <g transform="translate(${x} ${y}) rotate(${angle})" stroke="${t.dark}" stroke-width="2.2" stroke-linecap="round">
    <line x1="${-w / 2}" y1="-6" x2="${w / 2}" y2="-4"/><line x1="${-w / 2}" y1="-1" x2="${w / 2}" y2="1"/><line x1="${-w / 2}" y1="4" x2="${w / 2}" y2="6"/>
  </g>`;

const cushion = (x, y, w, h, r, color) => `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${color}"/>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="url(#sheen)"/>
  <rect x="${x + 6}" y="${y + h - 10}" width="${w - 12}" height="6" rx="3" fill="#000" opacity="0.06"/>`;

const shadow = (cx, cy, rx, ry = 26, o = 0.22) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#3B2A1A" opacity="${o}" filter="url(#soft)"/>`;

const panel = (d, fill, t) => `
  <path d="${d}" fill="url(#${fill})"/>
  <path d="${d}" fill="url(#sheen)" opacity="0.6"/>
  <path d="${d}" fill="none" stroke="${t.dark}" stroke-width="2" opacity="0.35"/>`;

// ---------------------------------------------------------------------------
// Furniture drawings — all in an 800 x 1000 frame, floor line at y ≈ 790
// ---------------------------------------------------------------------------
const FURNITURE = {
  loungeChair(t, fabric = FABRIC.oat) {
    return `
    ${shadow(400, 792, 250)}
    ${pole(t, 'M292 620 L300 760', 13)}${pole(t, 'M508 620 L500 760', 13)}
    ${panel('M258 470 C258 330 542 330 542 470 L542 600 L258 600 Z', 'cane', t)}
    ${pole(t, 'M258 600 L258 470 C258 330 542 330 542 470 L542 600', 16)}
    ${panel('M232 612 L568 612 L580 676 L220 676 Z', 'wicker', t)}
    ${cushion(214, 562, 372, 72, 26, fabric)}
    ${pole(t, 'M206 700 C186 560 214 486 262 478', 16)}${pole(t, 'M594 700 C614 560 586 486 538 478', 16)}
    ${pole(t, 'M226 676 L208 792', 15)}${pole(t, 'M574 676 L592 792', 15)}
    ${pole(t, 'M220 680 L580 680', 12)}
    ${wrap(t, 250, 486, 20, -40)}${wrap(t, 550, 486, 20, 40)}${wrap(t, 224, 680, 18, 90)}${wrap(t, 576, 680, 18, 90)}
    ${cushion(330, 480, 140, 92, 30, FABRIC.cream)}`;
  },

  diningChair(t, fabric = null, { arms = false } = {}) {
    return `
    ${shadow(400, 792, 170, 22)}
    ${pole(t, 'M322 610 L330 770', 11)}${pole(t, 'M478 610 L470 770', 11)}
    ${panel('M318 300 Q400 262 482 300 L482 540 L318 540 Z', 'cane', t)}
    ${pole(t, 'M318 560 L318 300 Q400 262 482 300 L482 560', 13)}
    ${pole(t, 'M318 540 L482 540', 10)}
    ${panel('M290 566 L510 566 L534 624 L266 624 Z', 'cane', t)}
    ${pole(t, 'M290 566 L510 566 L534 624 L266 624 Z', 12)}
    ${fabric ? cushion(292, 548, 216, 34, 14, fabric) : ''}
    ${pole(t, 'M270 626 L258 792', 13)}${pole(t, 'M530 626 L542 792', 13)}
    ${pole(t, 'M266 712 L534 712', 9)}
    ${arms ? `${pole(t, 'M262 640 C250 560 270 520 318 516', 12)}${pole(t, 'M538 640 C550 560 530 520 482 516', 12)}` : ''}
    ${wrap(t, 318, 560, 16, 90)}${wrap(t, 482, 560, 16, 90)}`;
  },

  outdoorArmchair(t, fabric = FABRIC.stone) {
    return `
    ${shadow(400, 794, 250)}
    <rect x="236" y="770" width="34" height="20" rx="4" fill="#2F2B27"/><rect x="530" y="770" width="34" height="20" rx="4" fill="#2F2B27"/>
    ${panel('M214 470 Q214 420 264 420 L536 420 Q586 420 586 470 L586 760 Q586 776 570 776 L230 776 Q214 776 214 760 Z', 'wicker', t)}
    ${cushion(262, 446, 276, 168, 30, fabric)}
    ${cushion(252, 596, 296, 90, 26, fabric)}
    <path d="M214 470 Q214 420 264 420 L536 420 Q586 420 586 470" fill="none" stroke="${t.light}" stroke-width="6" opacity="0.5"/>
    ${cushion(320, 476, 110, 86, 26, FABRIC.sage)}`;
  },

  sofa(t, fabric = FABRIC.oat, seats = 3) {
    const x0 = seats === 3 ? 110 : 190;
    const x1 = seats === 3 ? 690 : 610;
    const w = x1 - x0;
    const seatW = (w - 60) / seats;
    let cushions = '';
    let backs = '';
    for (let i = 0; i < seats; i += 1) {
      const cx = x0 + 30 + i * seatW;
      backs += cushion(cx + 4, 470, seatW - 8, 118, 30, fabric);
      cushions += cushion(cx, 586, seatW, 72, 22, fabric);
    }
    return `
    ${shadow(400, 794, w / 2 + 30)}
    ${pole(t, `M${x0 + 60} 660 L${x0 + 64} 770`, 12)}${pole(t, `M${x1 - 60} 660 L${x1 - 64} 770`, 12)}
    ${panel(`M${x0 + 20} 440 Q${x0 + 20} 400 ${x0 + 60} 400 L${x1 - 60} 400 Q${x1 - 20} 400 ${x1 - 20} 440 L${x1 - 20} 600 L${x0 + 20} 600 Z`, 'cane', t)}
    ${pole(t, `M${x0 + 20} 600 L${x0 + 20} 440 Q${x0 + 20} 400 ${x0 + 60} 400 L${x1 - 60} 400 Q${x1 - 20} 400 ${x1 - 20} 440 L${x1 - 20} 600`, 15)}
    ${backs}
    ${panel(`M${x0 + 10} 640 L${x1 - 10} 640 L${x1 - 4} 694 L${x0 + 4} 694 Z`, 'wicker', t)}
    ${cushions}
    ${pole(t, `M${x0} 704 C${x0 - 18} 580 ${x0 - 4} 520 ${x0 + 44} 510`, 17)}${pole(t, `M${x1} 704 C${x1 + 18} 580 ${x1 + 4} 520 ${x1 - 44} 510`, 17)}
    ${pole(t, `M${x0 + 10} 694 L${x0 - 2} 792`, 15)}${pole(t, `M${x1 - 10} 694 L${x1 + 2} 792`, 15)}
    ${pole(t, `M${x0 + 4} 698 L${x1 - 4} 698`, 11)}
    ${wrap(t, x0 + 36, 512, 20, -30)}${wrap(t, x1 - 36, 512, 20, 30)}
    ${seats === 3 ? cushion(x0 + 44, 520, 96, 76, 26, FABRIC.clay) : cushion(x0 + 44, 520, 90, 72, 24, FABRIC.sage)}`;
  },

  coffeeTable(t) {
    return `
    ${shadow(400, 790, 250, 30)}
    <path d="M190 560 C200 660 240 740 290 780 L510 780 C560 740 600 660 610 560 Z" fill="url(#wicker)"/>
    <path d="M190 560 C200 660 240 740 290 780 L510 780 C560 740 600 660 610 560 Z" fill="url(#sheen)" opacity="0.6"/>
    ${pole(t, 'M290 782 L510 782', 14)}
    <ellipse cx="400" cy="556" rx="232" ry="62" fill="url(#teak)"/>
    <ellipse cx="400" cy="548" rx="226" ry="56" fill="${TEAK.light}"/>
    <ellipse cx="370" cy="536" rx="140" ry="24" fill="#FFFFFF" opacity="0.14"/>
    <path d="M168 556 A232 62 0 0 0 632 556" fill="none" stroke="${t.dark}" stroke-width="12"/>
    <path d="M168 556 A232 62 0 0 0 632 556" fill="none" stroke="${t.base}" stroke-width="7"/>
    <g transform="translate(470 500)"><rect x="-26" y="-6" width="52" height="40" rx="8" fill="${FABRIC.cream}"/><path d="M0 -6 C-14 -50 14 -60 0 -96" stroke="#6F7A58" stroke-width="4" fill="none"/><ellipse cx="-10" cy="-60" rx="16" ry="7" fill="#7D8964" transform="rotate(-30 -10 -60)"/><ellipse cx="10" cy="-80" rx="16" ry="7" fill="#6F7A58" transform="rotate(25 10 -80)"/></g>`;
  },

  sideTable(t) {
    return `
    ${shadow(400, 790, 150, 22)}
    <path d="M280 470 C300 560 360 600 360 630 C360 660 300 700 290 780 L510 780 C500 700 440 660 440 630 C440 600 500 560 520 470 Z" fill="url(#weave)"/>
    <path d="M280 470 C300 560 360 600 360 630 C360 660 300 700 290 780 L510 780 C500 700 440 660 440 630 C440 600 500 560 520 470 Z" fill="url(#sheen)" opacity="0.7"/>
    ${pole(t, 'M290 782 L510 782', 13)}${pole(t, 'M356 630 L444 630', 11)}
    <ellipse cx="400" cy="468" rx="150" ry="40" fill="url(#teak)"/>
    <ellipse cx="400" cy="462" rx="146" ry="35" fill="${TEAK.light}"/>
    <path d="M250 468 A150 40 0 0 0 550 468" fill="none" stroke="${t.dark}" stroke-width="10"/>
    <g transform="translate(400 440)"><rect x="-40" y="-12" width="80" height="16" rx="3" fill="${FABRIC.clay}"/><rect x="-34" y="-26" width="68" height="14" rx="3" fill="${FABRIC.cream}"/></g>`;
  },

  diningTable(t) {
    return `
    ${shadow(400, 794, 300, 26)}
    ${pole(t, 'M190 590 L230 790', 16)}${pole(t, 'M610 590 L570 790', 16)}
    ${pole(t, 'M260 590 L300 760', 13)}${pole(t, 'M540 590 L500 760', 13)}
    ${pole(t, 'M222 700 L578 700', 11)}
    ${panel('M160 560 L640 560 L640 608 L160 608 Z', 'cane', t)}
    <path d="M110 520 L690 520 L700 560 L100 560 Z" fill="url(#teak)"/>
    <path d="M110 520 L690 520 L694 532 L106 532 Z" fill="#FFFFFF" opacity="0.18"/>
    ${pole(t, 'M160 610 L640 610', 10)}
    ${wrap(t, 205, 612, 20, 80)}${wrap(t, 595, 612, 20, 100)}
    <g transform="translate(400 490)"><ellipse cx="0" cy="26" rx="70" ry="10" fill="#000" opacity="0.08"/><path d="M-60 0 Q0 40 60 0 L50 24 Q0 44 -50 24 Z" fill="${t.base}"/><circle cx="-18" cy="0" r="16" fill="#C9A15E"/><circle cx="14" cy="-4" r="15" fill="#B8733F"/><circle cx="2" cy="-14" r="14" fill="#D9B879"/></g>`;
  },

  daybed(t, fabric = FABRIC.cream) {
    return `
    ${shadow(400, 800, 320, 34)}
    ${panel('M130 612 C130 300 670 300 670 612 Z', 'wicker', t)}
    <path d="M196 612 C196 400 604 400 604 612 Z" fill="${t.gap}" opacity="0.55"/>
    <path d="M196 612 C196 400 604 400 604 612 Z" fill="url(#light)" opacity="0.4"/>
    ${pole(t, 'M130 612 C130 300 670 300 670 612', 16)}
    ${panel('M110 640 Q110 610 150 610 L650 610 Q690 610 690 640 L690 740 Q690 770 650 770 L150 770 Q110 770 110 740 Z', 'wicker', t)}
    ${cushion(120, 584, 560, 62, 28, fabric)}
    ${cushion(230, 520, 120, 80, 28, FABRIC.stone)}${cushion(340, 514, 130, 86, 30, FABRIC.sage)}${cushion(456, 522, 116, 78, 28, FABRIC.stone)}
    <rect x="170" y="770" width="40" height="18" rx="4" fill="#2F2B27"/><rect x="590" y="770" width="40" height="18" rx="4" fill="#2F2B27"/>`;
  },

  pendant(t) {
    return `
    <ellipse cx="400" cy="640" rx="260" ry="200" fill="url(#glow)" opacity="0.7"/>
    <line x1="400" y1="0" x2="400" y2="300" stroke="#3A322B" stroke-width="3"/>
    <rect x="386" y="290" width="28" height="22" rx="4" fill="${t.dark}"/>
    ${panel('M400 306 C300 320 236 450 226 600 L574 600 C564 450 500 320 400 306 Z', 'cane', t)}
    <path d="M400 306 C300 320 236 450 226 600 L574 600 C564 450 500 320 400 306 Z" fill="url(#glow)" opacity="0.28"/>
    ${pole(t, 'M226 602 L574 602', 14)}
    <ellipse cx="400" cy="604" rx="160" ry="16" fill="#FFE8BE" opacity="0.8"/>
    ${shadow(400, 800, 140, 18, 0.1)}`;
  },

  baskets(t) {
    const basket = (x, y, w, h, fill) => `
      ${panel(`M${x} ${y} L${x + w} ${y} L${x + w - 14} ${y + h} L${x + 14} ${y + h} Z`, fill, t)}
      ${pole(t, `M${x - 4} ${y} L${x + w + 4} ${y}`, 14)}
      ${pole(t, `M${x + 14} ${y + h} L${x + w - 14} ${y + h}`, 10)}
      <path d="M${x + w * 0.3} ${y - 4} Q${x + w * 0.5} ${y - 40} ${x + w * 0.7} ${y - 4}" fill="none" stroke="${t.dark}" stroke-width="8" stroke-linecap="round"/>`;
    return `
    ${shadow(400, 792, 300, 24)}
    ${basket(120, 520, 220, 270, 'wicker')}
    ${basket(360, 600, 180, 190, 'weave')}
    ${basket(556, 660, 130, 130, 'wicker')}
    <rect x="160" y="500" width="140" height="30" rx="10" fill="${FABRIC.cream}" opacity="0.9"/>`;
  },

  lounger(t, fabric = FABRIC.cream) {
    return `
    ${shadow(400, 796, 320, 24)}
    <circle cx="150" cy="770" r="20" fill="#2F2B27"/><circle cx="150" cy="770" r="8" fill="#6B645C"/>
    <rect x="630" y="768" width="30" height="22" rx="4" fill="#2F2B27"/>
    ${panel('M110 680 L500 680 L640 500 Q660 476 684 492 L690 500 L560 720 Q548 740 520 740 L130 740 Q110 740 110 720 Z', 'wicker', t)}
    <path d="M118 664 L500 664 L630 496 Q646 478 664 490 L674 498 L540 690 L118 690 Q108 690 108 678 Z" fill="${fabric}"/>
    <path d="M118 664 L500 664 L630 496 Q646 478 664 490 L674 498 L540 690 L118 690 Q108 690 108 678 Z" fill="url(#sheen)"/>
    ${cushion(560, 470, 120, 60, 26, FABRIC.sage)}`;
  },

  wingChair(t, fabric = FABRIC.clay) {
    return `
    ${shadow(400, 794, 240)}
    ${pole(t, 'M262 740 L250 792', 14)}${pole(t, 'M538 740 L550 792', 14)}
    ${panel('M232 360 Q232 250 330 240 L470 240 Q568 250 568 360 L568 740 L232 740 Z', 'weave', t)}
    ${pole(t, 'M232 740 L232 360 Q232 250 330 240 L470 240 Q568 250 568 360 L568 740', 16)}
    ${panel('M196 520 Q196 470 240 470 L286 470 L286 740 L196 740 Z', 'wicker', t)}
    ${panel('M604 520 Q604 470 560 470 L514 470 L514 740 L604 740 Z', 'wicker', t)}
    ${cushion(282, 300, 236, 280, 36, fabric)}
    ${cushion(270, 572, 260, 96, 28, fabric)}
    ${pole(t, 'M196 740 L604 740', 14)}`;
  },

  barStool(t, fabric = FABRIC.ink) {
    return `
    ${shadow(400, 794, 150, 20)}
    ${pole(t, 'M322 420 L286 792', 13)}${pole(t, 'M478 420 L514 792', 13)}
    ${pole(t, 'M360 420 L350 760', 11)}${pole(t, 'M440 420 L450 760', 11)}
    <ellipse cx="400" cy="640" rx="118" ry="22" fill="none" stroke="${t.dark}" stroke-width="12"/>
    <ellipse cx="400" cy="640" rx="118" ry="22" fill="none" stroke="${t.base}" stroke-width="7"/>
    ${panel('M300 300 Q400 250 500 300 L500 380 L300 380 Z', 'cane', t)}
    ${pole(t, 'M300 400 L300 300 Q400 250 500 300 L500 400', 12)}
    <ellipse cx="400" cy="410" rx="120" ry="30" fill="${fabric}"/>
    <ellipse cx="400" cy="402" rx="116" ry="24" fill="#FFFFFF" opacity="0.08"/>`;
  },

  mirror(t) {
    return `
    ${shadow(400, 800, 180, 20, 0.14)}
    <path d="M240 780 L240 360 C240 180 560 180 560 360 L560 780 Z" fill="url(#cane)"/>
    ${pole(t, 'M240 780 L240 360 C240 180 560 180 560 360 L560 780', 18)}
    <path d="M292 740 L292 370 C292 238 508 238 508 370 L508 740 Z" fill="#DCE1DF"/>
    <path d="M292 740 L292 370 C292 238 508 238 508 370 L508 740 Z" fill="url(#sheen)"/>
    <path d="M330 330 L420 250 L440 262 L340 360 Z" fill="#FFFFFF" opacity="0.45"/>
    ${pole(t, 'M292 740 L292 370 C292 238 508 238 508 370 L508 740 Z', 9)}`;
  },
};

// Composite pieces (sets)
const SETS = {
  diningSet(t) {
    return `
    <g transform="translate(-96 237) scale(0.7)">${FURNITURE.diningChair(t, FABRIC.oat)}</g>
    <g transform="translate(336 237) scale(0.7)">${FURNITURE.diningChair(t, FABRIC.oat)}</g>
    <g transform="translate(152 300) scale(0.62)">${FURNITURE.diningTable(t)}</g>`;
  },
  bistroSet(t) {
    return `
    <g transform="translate(-60 110) scale(0.72)">${FURNITURE.diningChair(t, FABRIC.sage)}</g>
    <g transform="translate(316 110) scale(0.72)">${FURNITURE.diningChair(t, FABRIC.sage)}</g>
    <g transform="translate(150 230) scale(0.62)">${FURNITURE.sideTable(t)}</g>`;
  },
};

// ---------------------------------------------------------------------------
// Scenes
// ---------------------------------------------------------------------------
const svg = (w, h, body, t, opts = {}) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${opts.viewBox ?? `0 0 ${w} ${h}`}" width="${w}" height="${h}" role="img">${defs(t, opts)}${body}</svg>`;

function studio(drawing, t) {
  return svg(
    800,
    1000,
    `<rect x="-100" y="-100" width="1000" height="1300" fill="url(#wall)"/>
     <path d="M-100 700 Q400 690 900 700 L900 1200 L-100 1200 Z" fill="url(#floor)"/>
     <rect width="800" height="1000" fill="url(#light)"/>
     <g>${drawing}</g>
     <text x="712" y="1004" text-anchor="end" font-family="Arial, sans-serif" font-size="13" letter-spacing="2" fill="#8C7B64" opacity="0.7">DEMO IMAGE</text>`,
    t,
    { viewBox: '60 195 680 850' },
  );
}

function lifestyle(drawing, t) {
  return svg(
    800,
    1000,
    `<rect x="-100" y="-100" width="1000" height="1200" fill="url(#wall2)"/>
     <path d="M520 60 L760 60 L760 560 L520 560 Z" fill="#FFFFFF" opacity="0.28"/>
     <path d="M520 60 L760 60 L700 560 L460 560 Z" fill="#FFF7E8" opacity="0.18"/>
     <rect x="0" y="720" width="800" height="280" fill="url(#floor2)"/>
     ${[760, 810, 870, 940].map((y) => `<line x1="0" y1="${y}" x2="800" y2="${y}" stroke="#A88E6B" stroke-width="1.5" opacity="0.35"/>`).join('')}
     <ellipse cx="400" cy="800" rx="360" ry="70" fill="#E9DFCF" opacity="0.7"/>
     <g transform="translate(40 60) scale(0.9)">${drawing}</g>
     <g transform="translate(92 520)">
       <path d="M-40 250 L40 250 L30 320 L-30 320 Z" fill="#B7A48A"/>
       <path d="M0 250 C-10 160 -60 110 -90 60" stroke="#5E6B4A" stroke-width="5" fill="none"/>
       <path d="M0 250 C10 150 50 90 70 20" stroke="#5E6B4A" stroke-width="5" fill="none"/>
       <path d="M0 250 C0 170 -10 90 0 0" stroke="#5E6B4A" stroke-width="5" fill="none"/>
       <ellipse cx="-90" cy="60" rx="46" ry="16" fill="#6F7A58" transform="rotate(-40 -90 60)"/>
       <ellipse cx="70" cy="22" rx="46" ry="16" fill="#7D8964" transform="rotate(-60 70 22)"/>
       <ellipse cx="0" cy="4" rx="44" ry="15" fill="#65714F" transform="rotate(-85 0 4)"/>
       <ellipse cx="-40" cy="140" rx="40" ry="14" fill="#7D8964" transform="rotate(-20 -40 140)"/>
       <ellipse cx="40" cy="120" rx="40" ry="14" fill="#6F7A58" transform="rotate(-150 40 120)"/>
     </g>
     <text x="742" y="974" text-anchor="end" font-family="Arial, sans-serif" font-size="14" letter-spacing="2" fill="#FFFFFF" opacity="0.75">DEMO IMAGE</text>`,
    t,
    { viewBox: '30 100 720 900' },
  );
}

function detail(t, pattern = 'cane') {
  return svg(
    800,
    1000,
    `<rect width="800" height="1000" fill="url(#${pattern})"/>
     ${pole(t, 'M-40 820 C200 700 520 620 860 580', 58)}
     ${wrap(t, 420, 650, 70, -12)}
     <rect width="800" height="1000" fill="url(#light)"/>
     <rect width="800" height="1000" fill="url(#vignette)"/>
     <text x="772" y="974" text-anchor="end" font-family="Arial, sans-serif" font-size="15" letter-spacing="2" fill="#FFFFFF" opacity="0.8">DEMO IMAGE</text>`,
    t,
    { patternScale: 3.2 },
  );
}

function wideScene(t, { width = 1600, height = 1000, pieces }) {
  return svg(
    width,
    height,
    `<rect width="${width}" height="${height}" fill="url(#wall2)"/>
     <path d="M${width * 0.58} 0 L${width * 0.86} 0 L${width * 0.74} ${height * 0.72} L${width * 0.42} ${height * 0.72} Z" fill="#FFF8EC" opacity="0.32"/>
     <rect x="0" y="${height * 0.72}" width="${width}" height="${height * 0.28}" fill="url(#floor2)"/>
     ${[0.76, 0.81, 0.87, 0.94].map((f) => `<line x1="0" y1="${height * f}" x2="${width}" y2="${height * f}" stroke="#A88E6B" stroke-width="1.5" opacity="0.3"/>`).join('')}
     <ellipse cx="${width * 0.5}" cy="${height * 0.83}" rx="${width * 0.38}" ry="${height * 0.08}" fill="#EDE3D3" opacity="0.75"/>
     ${pieces}
     <text x="${width - 28}" y="${height - 26}" text-anchor="end" font-family="Arial, sans-serif" font-size="16" letter-spacing="2" fill="#FFFFFF" opacity="0.75">DEMO IMAGE</text>`,
    t,
  );
}

const plant = (x, y, s = 1) => `
  <g transform="translate(${x} ${y}) scale(${s})">
    <path d="M-50 250 L50 250 L38 340 L-38 340 Z" fill="#B7A48A"/>
    <path d="M0 250 C-10 160 -70 110 -110 50" stroke="#5E6B4A" stroke-width="6" fill="none"/>
    <path d="M0 250 C10 150 60 80 90 10" stroke="#5E6B4A" stroke-width="6" fill="none"/>
    <path d="M0 250 C0 170 -10 90 0 -20" stroke="#5E6B4A" stroke-width="6" fill="none"/>
    <ellipse cx="-110" cy="50" rx="60" ry="20" fill="#6F7A58" transform="rotate(-40 -110 50)"/>
    <ellipse cx="90" cy="12" rx="60" ry="20" fill="#7D8964" transform="rotate(-60 90 12)"/>
    <ellipse cx="0" cy="-20" rx="56" ry="19" fill="#65714F" transform="rotate(-85 0 -20)"/>
    <ellipse cx="-50" cy="140" rx="52" ry="18" fill="#7D8964" transform="rotate(-20 -50 140)"/>
    <ellipse cx="50" cy="120" rx="52" ry="18" fill="#6F7A58" transform="rotate(-150 50 120)"/>
  </g>`;

// ---------------------------------------------------------------------------
// Product catalog of drawings (must match the seed script)
// ---------------------------------------------------------------------------
export const PRODUCT_ART = {
  'kawi-lounge-chair': { draw: (t) => FURNITURE.loungeChair(t), tones: ['honey', 'walnut', 'whitewash'], pattern: 'cane' },
  'senja-cane-dining-chair': { draw: (t) => FURNITURE.diningChair(t, FABRIC.oat), tones: ['natural', 'black'], pattern: 'cane' },
  'nusa-outdoor-armchair': { draw: (t) => FURNITURE.outdoorArmchair(t), tones: ['sand', 'charcoal', 'honey'], pattern: 'wicker' },
  'kawi-three-seater-sofa': { draw: (t) => FURNITURE.sofa(t, FABRIC.oat, 3), tones: ['honey', 'walnut'], pattern: 'cane' },
  'senja-round-coffee-table': { draw: (t) => FURNITURE.coffeeTable(t), tones: ['natural', 'walnut'], pattern: 'wicker' },
  'nusa-outdoor-dining-set': { draw: (t) => SETS.diningSet(t), tones: ['sand', 'charcoal'], pattern: 'wicker' },
  'kawi-dining-table': { draw: (t) => FURNITURE.diningTable(t), tones: ['honey', 'walnut'], pattern: 'cane' },
  'segara-canopy-daybed': { draw: (t) => FURNITURE.daybed(t), tones: ['sand', 'whitewash'], pattern: 'wicker' },
  'anyam-pendant-lamp': { draw: (t) => FURNITURE.pendant(t), tones: ['natural', 'black'], pattern: 'cane' },
  'keranjang-storage-basket-set': { draw: (t) => FURNITURE.baskets(t), tones: ['honey', 'whitewash'], pattern: 'weave' },
  'senja-two-seater-sofa': { draw: (t) => FURNITURE.sofa(t, FABRIC.sage, 2), tones: ['natural', 'black'], pattern: 'cane' },
  'kawi-side-table': { draw: (t) => FURNITURE.sideTable(t), tones: ['honey', 'walnut'], pattern: 'weave' },
  'nusa-sun-lounger': { draw: (t) => FURNITURE.lounger(t), tones: ['sand', 'charcoal'], pattern: 'wicker' },
  'bespoke-hospitality-lounge-chair': { draw: (t) => FURNITURE.wingChair(t), tones: ['honey', 'walnut'], pattern: 'weave' },
  'senja-bistro-dining-set': { draw: (t) => SETS.bistroSet(t), tones: ['natural', 'black'], pattern: 'cane' },
  'kawi-bar-stool': { draw: (t) => FURNITURE.barStool(t), tones: ['honey', 'walnut'], pattern: 'cane' },
  'lengkung-arched-rattan-mirror': { draw: (t) => FURNITURE.mirror(t), tones: ['natural'], pattern: 'cane' },
  'sekar-rattan-bench': { draw: (t) => FURNITURE.sofa(t, FABRIC.stone, 2), tones: ['honey'], pattern: 'cane' },
};

async function main() {
  await mkdir(path.join(OUT, 'products'), { recursive: true });
  await mkdir(path.join(OUT, 'site'), { recursive: true });
  let count = 0;
  const write = async (rel, content) => {
    await writeFile(path.join(OUT, rel), content, 'utf8');
    count += 1;
  };

  for (const [slug, art] of Object.entries(PRODUCT_ART)) {
    const [primary, ...others] = art.tones;
    const t = TONES[primary];
    await write(`products/${slug}-1.svg`, studio(art.draw(t), t));
    await write(`products/${slug}-2.svg`, lifestyle(art.draw(t), t));
    await write(`products/${slug}-3.svg`, detail(t, art.pattern));
    for (const tone of others) {
      await write(`products/${slug}-${tone}.svg`, studio(art.draw(TONES[tone]), TONES[tone]));
    }
  }

  const h = TONES.honey;
  // Hero (16:10)
  await write(
    'site/hero.svg',
    wideScene(h, {
      pieces: `
        <g transform="translate(470 60) scale(1)">${FURNITURE.loungeChair(h)}</g>
        <g transform="translate(980 250) scale(0.78)">${FURNITURE.sideTable(TONES.walnut)}</g>
        <g transform="translate(1010 -40) scale(0.72)">${FURNITURE.pendant(TONES.natural)}</g>
        ${plant(300, 470, 1.05)}`,
    }),
  );
  // Brand intro / workshop (4:5)
  const poles = Array.from({ length: 9 }, (_, i) => pole(h, `M120 ${560 + i * 26} L700 ${540 + i * 26}`, 22)).join('');
  await write(
    'site/craft.svg',
    svg(
      800,
      1000,
      `<rect width="800" height="1000" fill="url(#wall2)"/>
       <rect x="0" y="720" width="800" height="280" fill="url(#floor2)"/>
       <g transform="translate(60 -40)">${poles}</g>
       <g transform="translate(360 330) scale(0.55)">${FURNITURE.baskets(h)}</g>
       <rect x="80" y="90" width="300" height="380" fill="url(#cane)"/>
       <rect x="80" y="90" width="300" height="380" fill="url(#vignette)"/>
       ${pole(h, 'M80 90 L380 90 L380 470 L80 470 Z', 16)}
       <text x="772" y="974" text-anchor="end" font-family="Arial, sans-serif" font-size="15" letter-spacing="2" fill="#FFFFFF" opacity="0.75">DEMO IMAGE</text>`,
      h,
    ),
  );
  await write('site/weave-detail.svg', detail(h, 'cane'));
  await write('site/wicker-detail.svg', detail(TONES.sand, 'wicker'));
  // Project / hospitality scene (16:10)
  await write(
    'site/project.svg',
    wideScene(TONES.natural, {
      pieces: `
        <g transform="translate(120 -30) scale(0.6)">${FURNITURE.pendant(TONES.natural)}</g>
        <g transform="translate(560 -30) scale(0.6)">${FURNITURE.pendant(TONES.natural)}</g>
        <g transform="translate(1000 -30) scale(0.6)">${FURNITURE.pendant(TONES.natural)}</g>
        <g transform="translate(60 150) scale(0.9)">${SETS.bistroSet(TONES.natural)}</g>
        <g transform="translate(760 150) scale(0.9)">${SETS.bistroSet(TONES.natural)}</g>`,
    }),
  );
  // Custom furniture (4:5)
  await write('site/custom.svg', lifestyle(FURNITURE.wingChair(TONES.walnut), TONES.walnut));
  // Export / packing (16:10)
  const crate = (x, y, w, hh) => `
    <rect x="${x}" y="${y}" width="${w}" height="${hh}" fill="#C9A878"/>
    ${Array.from({ length: 5 }, (_, i) => `<line x1="${x}" y1="${y + (hh / 5) * i}" x2="${x + w}" y2="${y + (hh / 5) * i}" stroke="#9E7F55" stroke-width="3"/>`).join('')}
    <rect x="${x}" y="${y}" width="${w}" height="${hh}" fill="none" stroke="#8A6C45" stroke-width="10"/>
    <line x1="${x}" y1="${y}" x2="${x + w}" y2="${y + hh}" stroke="#8A6C45" stroke-width="10"/>`;
  await write(
    'site/export.svg',
    wideScene(h, {
      pieces: `
        ${crate(180, 420, 420, 300)}${crate(640, 520, 300, 200)}${crate(260, 250, 260, 170)}
        <g transform="translate(900 90) scale(0.9)">${FURNITURE.loungeChair(h)}</g>`,
    }),
  );
  // Categories (4:5)
  const cat = {
    chairs: lifestyle(FURNITURE.loungeChair(h), h),
    tables: lifestyle(FURNITURE.coffeeTable(TONES.natural), TONES.natural),
    sofas: lifestyle(FURNITURE.sofa(h, FABRIC.oat, 3), h),
    'dining-sets': lifestyle(SETS.diningSet(TONES.sand), TONES.sand),
    'outdoor-furniture': lifestyle(FURNITURE.daybed(TONES.sand), TONES.sand),
    'home-accessories': lifestyle(FURNITURE.pendant(TONES.natural), TONES.natural),
    'custom-furniture': lifestyle(FURNITURE.wingChair(TONES.walnut), TONES.walnut),
  };
  for (const [slug, content] of Object.entries(cat)) await write(`site/category-${slug}.svg`, content);
  // Collections (16:10)
  await write(
    'site/collection-kawi.svg',
    wideScene(h, { pieces: `<g transform="translate(160 60)">${FURNITURE.sofa(h, FABRIC.oat, 3)}</g><g transform="translate(860 220) scale(0.8)">${FURNITURE.sideTable(h)}</g>${plant(1360, 470, 1)}` }),
  );
  await write(
    'site/collection-senja.svg',
    wideScene(TONES.natural, { pieces: `<g transform="translate(260 60)">${FURNITURE.diningChair(TONES.natural, FABRIC.oat)}</g><g transform="translate(620 60)">${FURNITURE.diningChair(TONES.black, FABRIC.oat)}</g><g transform="translate(980 -30) scale(0.8)">${FURNITURE.pendant(TONES.natural)}</g>` }),
  );
  await write(
    'site/collection-nusa.svg',
    wideScene(TONES.sand, { pieces: `<g transform="translate(180 60)">${FURNITURE.daybed(TONES.sand)}</g><g transform="translate(820 60)">${FURNITURE.outdoorArmchair(TONES.charcoal)}</g>` }),
  );
  // Open Graph default (1200x630)
  await write(
    'site/og-default.svg',
    wideScene(h, { width: 1200, height: 630, pieces: `<g transform="translate(360 -20) scale(0.66)">${FURNITURE.loungeChair(h)}</g>${plant(220, 300, 0.7)}` }),
  );

  console.log(`Generated ${count} demo images in ${OUT}`);
}

main();
