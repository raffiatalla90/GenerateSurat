// SVG Vector Data URLs for UNS (Universitas Sebelas Maret) & GetMasjid Dual Logos

function svgToDataUrl(svg: string): string {
  if (typeof Buffer !== "undefined") {
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  }
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * UNS Official Logo Vector (Emblem + UNS Universitas Sebelas Maret text)
 */
export const UNS_LOGO_SVG = svgToDataUrl(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 80" width="280" height="80">
    <!-- UNS Circular Emblem -->
    <g transform="translate(10, 5)">
      <!-- Outer Flower / Petals Ring -->
      <circle cx="35" cy="35" r="32" fill="none" stroke="#0096D6" stroke-width="2" />
      <circle cx="35" cy="35" r="28" fill="none" stroke="#0096D6" stroke-width="1.2" stroke-dasharray="3 2" />
      
      <!-- Internal Petals / Mandala Motif -->
      <path d="M35 8 C38 18 48 22 58 22 C48 26 44 36 44 46 C38 38 32 38 26 46 C26 36 22 26 12 22 C22 22 32 18 35 8 Z" fill="none" stroke="#0096D6" stroke-width="1.6" />
      
      <!-- Center Circle with Traditional Leaf Motif -->
      <circle cx="35" cy="35" r="14" fill="#0096D6" opacity="0.15" />
      <circle cx="35" cy="35" r="14" fill="none" stroke="#0096D6" stroke-width="1.5" />
      <circle cx="35" cy="35" r="7" fill="#0096D6" />
      
      <!-- Surrounding Flame/Petal Accents -->
      <circle cx="35" cy="11" r="2" fill="#0096D6"/>
      <circle cx="59" cy="35" r="2" fill="#0096D6"/>
      <circle cx="35" cy="59" r="2" fill="#0096D6"/>
      <circle cx="11" cy="35" r="2" fill="#0096D6"/>
    </g>

    <!-- UNS Bold Typography -->
    <text x="88" y="44" font-family="'Inter', 'Arial', sans-serif" font-weight="900" font-size="34" fill="#0096D6" letter-spacing="-0.5">UNS</text>
    
    <!-- UNIVERSITAS SEBELAS MARET Text -->
    <text x="89" y="58" font-family="'Inter', 'Arial', sans-serif" font-weight="700" font-size="9" fill="#0096D6" letter-spacing="1.2">UNIVERSITAS</text>
    <text x="89" y="69" font-family="'Inter', 'Arial', sans-serif" font-weight="700" font-size="9" fill="#0096D6" letter-spacing="1.2">SEBELAS MARET</text>
  </svg>`
);

/**
 * GetMasjid Colored Vector Logo
 */
export const GETMASJID_LOGO_SVG = svgToDataUrl(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80" width="240" height="80">
    <!-- Mosque Icon -->
    <g transform="translate(10, 8)">
      <!-- Base Mosque Dome with Gradient -->
      <path d="M25 8 C27 4 33 4 35 8 C40 18 52 26 52 42 L8 42 C8 26 20 18 25 8 Z" fill="#0f6b4a" />
      <path d="M30 4 L30 1 M28 2.5 L32 2.5" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" />
      <!-- Mosque Minarets / Pillars -->
      <rect x="5" y="24" width="6" height="26" rx="2" fill="#0096D6" />
      <path d="M5 24 L8 18 L11 24 Z" fill="#F59E0B" />
      <rect x="49" y="24" width="6" height="26" rx="2" fill="#0096D6" />
      <path d="M49 24 L52 18 L55 24 Z" fill="#F59E0B" />
      <!-- Arch Gate -->
      <path d="M24 50 L24 34 C24 28 36 28 36 34 L36 50 Z" fill="#FFFFFF" />
    </g>

    <!-- GetMasjid Brand Text -->
    <text x="75" y="44" font-family="'Inter', 'Arial', sans-serif" font-weight="800" font-size="26" fill="#1C1917" letter-spacing="-0.5">
      Get<tspan fill="#0f6b4a">Masjid</tspan>
    </text>
    <text x="76" y="58" font-family="'Inter', 'Arial', sans-serif" font-weight="600" font-size="8.5" fill="#0096D6" letter-spacing="0.8">
      PLATFORM DIGITAL
    </text>
  </svg>`
);
