import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

await mkdir('public/icons', { recursive: true });
await mkdir('public/screenshots', { recursive: true });

const orb = `
<defs>
  <radialGradient id="orb" cx="29%" cy="22%" r="78%">
    <stop offset="0" stop-color="#fff"/><stop offset=".18" stop-color="#dff8ff"/>
    <stop offset=".45" stop-color="#71b8d8"/><stop offset=".72" stop-color="#f6821f"/>
    <stop offset="1" stop-color="#351812"/>
  </radialGradient>
  <radialGradient id="core" cx="45%" cy="38%" r="65%">
    <stop offset="0" stop-color="#fff3a8" stop-opacity=".9"/>
    <stop offset=".55" stop-color="#ff7a18" stop-opacity=".48"/>
    <stop offset="1" stop-color="#ff4f12" stop-opacity="0"/>
  </radialGradient>
  <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
    <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#05090d" flood-opacity=".48"/>
  </filter>
</defs>`;

const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img"><title>Tuiport orb</title>${orb}
  <rect width="512" height="512" rx="112" fill="#0b1118"/>
  <circle cx="256" cy="256" r="158" fill="url(#orb)" filter="url(#shadow)" stroke="#fff" stroke-opacity=".2" stroke-width="4"/>
  <circle cx="286" cy="294" r="92" fill="url(#core)" style="mix-blend-mode:screen"/>
  <path d="M161 225c31-70 105-100 174-74" fill="none" stroke="#fff" stroke-opacity=".72" stroke-width="24" stroke-linecap="round"/>
  <path d="M171 327c62 59 155 54 210-10" fill="none" stroke="#28120e" stroke-opacity=".25" stroke-width="18" stroke-linecap="round"/>
</svg>`;

const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img"><title>Tuiport maskable orb</title>${orb}
  <rect width="512" height="512" fill="#0b1118"/>
  <circle cx="256" cy="256" r="132" fill="url(#orb)" filter="url(#shadow)" stroke="#fff" stroke-opacity=".2" stroke-width="4"/>
  <circle cx="281" cy="288" r="76" fill="url(#core)" style="mix-blend-mode:screen"/>
  <path d="M178 230c27-58 87-82 144-61" fill="none" stroke="#fff" stroke-opacity=".72" stroke-width="20" stroke-linecap="round"/>
</svg>`;

const socialSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">${orb}
  <rect width="1200" height="630" fill="#0b1118"/>
  <g opacity=".12" stroke="#d8e7ef"><path d="M0 90h1200M0 180h1200M0 270h1200M0 360h1200M0 450h1200M0 540h1200"/><path d="M90 0v630M180 0v630M270 0v630M360 0v630M450 0v630M540 0v630M630 0v630M720 0v630M810 0v630M900 0v630M990 0v630M1080 0v630"/></g>
  <circle cx="958" cy="310" r="184" fill="url(#orb)" filter="url(#shadow)" stroke="#fff" stroke-opacity=".2" stroke-width="3"/>
  <circle cx="994" cy="354" r="108" fill="url(#core)" style="mix-blend-mode:screen"/>
  <path d="M846 274c38-79 123-110 197-79" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="25" stroke-linecap="round"/>
  <circle cx="84" cy="84" r="10" fill="#f6821f"/><text x="108" y="92" fill="#f7f9fb" font-family="Arial,sans-serif" font-size="25" font-weight="700">AGENT EXPERIENCE</text>
  <text x="76" y="238" fill="#f7f9fb" font-family="Arial,sans-serif" font-size="88" font-weight="750" letter-spacing="-5">Your terminal is</text>
  <text x="76" y="326" fill="#9ccfe2" font-family="Arial,sans-serif" font-size="88" font-weight="500" letter-spacing="-5">the interface.</text>
  <text x="80" y="392" fill="#c8d4dd" font-family="Arial,sans-serif" font-size="25">Agents and humans, one SSH command away.</text>
  <text x="80" y="532" fill="#f6821f" font-family="monospace" font-size="18" font-weight="600" letter-spacing="2">AGENT EXPERIENCE · TUIPORT</text>
</svg>`;

const mobileScreenshot = `<svg xmlns="http://www.w3.org/2000/svg" width="750" height="1334" viewBox="0 0 750 1334">${orb}
  <rect width="750" height="1334" fill="#0b1118"/><circle cx="590" cy="255" r="220" fill="url(#orb)" opacity=".38"/>
  <text x="50" y="78" fill="#f7f9fb" font-family="Arial,sans-serif" font-size="26" font-weight="700">AGENT EXPERIENCE</text>
  <text x="50" y="230" fill="#f7f9fb" font-family="Arial,sans-serif" font-size="72" font-weight="750">Your terminal is</text><text x="50" y="304" fill="#9ccfe2" font-family="Arial,sans-serif" font-size="72">the interface.</text>
  <rect x="38" y="412" width="674" height="570" rx="14" fill="#080d13" stroke="#4f6273"/>
  <text x="72" y="472" fill="#63d5a2" font-family="monospace" font-size="18">● LIVE SESSION</text>
  <text x="72" y="560" fill="#f6821f" font-family="monospace" font-size="24">$ ssh your-hostname</text>
  <text x="72" y="650" fill="#d7e2ec" font-family="monospace" font-size="22">┌────── tuiport ──────┐</text><text x="72" y="710" fill="#d7e2ec" font-family="monospace" font-size="22">│ OpenTUI is running  │</text><text x="72" y="750" fill="#d7e2ec" font-family="monospace" font-size="22">│ inside Cloudflare.  │</text><text x="72" y="810" fill="#d7e2ec" font-family="monospace" font-size="22">│ press q to leave    │</text><text x="72" y="870" fill="#d7e2ec" font-family="monospace" font-size="22">└─────────────────────┘</text>
  <text x="50" y="1110" fill="#f6821f" font-family="monospace" font-size="18">AGENT EXPERIENCE · TUIPORT</text><text x="50" y="1150" fill="#9baaba" font-family="monospace" font-size="18">OPEN PROTOCOL / BOUNDED RUNTIME</text>
</svg>`;

await Promise.all([
  Bun.write('public/icon.svg', iconSvg),
  Bun.write('public/icons/icon-maskable.svg', maskableSvg),
  sharp(Buffer.from(iconSvg)).resize(192, 192).png().toFile('public/icons/icon-192.png'),
  sharp(Buffer.from(iconSvg)).resize(512, 512).png().toFile('public/icons/icon-512.png'),
  sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png()
    .toFile('public/icons/icon-maskable-512.png'),
  sharp(Buffer.from(iconSvg)).resize(180, 180).png().toFile('public/icons/apple-touch-icon.png'),
  sharp(Buffer.from(iconSvg)).resize(32, 32).png().toFile('public/favicon-32x32.png'),
  sharp(Buffer.from(socialSvg)).png({ compressionLevel: 9 }).toFile('public/og-card.png'),
  sharp(Buffer.from(socialSvg))
    .resize(1280, 672)
    .png({ compressionLevel: 9 })
    .toFile('public/screenshots/desktop.png'),
  sharp(Buffer.from(mobileScreenshot))
    .png({ compressionLevel: 9 })
    .toFile('public/screenshots/mobile.png'),
]);

console.log('Generated Tuiport PWA and social assets.');
