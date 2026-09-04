import { KopSuratConfig, SignatureConfig, LetterData } from "@/types/letter";
import { formatTanggalIndonesia } from "./utils";
import { DEFAULT_KOP, DEFAULT_SIG } from "./kop-defaults";
import { UNS_LOGO_SVG, GETMASJID_LOGO_SVG } from "./uns-logos";

// Base64 placeholder for signature and stamp - simple SVG as fallback so PDF tetap tampil rapi tanpa image eksternal
function svgToDataUrl(svg: string): string {
  if (typeof Buffer !== "undefined") {
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  }
  // browser fallback
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

const SIGNATURE_SVG_FALLBACK = svgToDataUrl(
  `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60" viewBox="0 0 200 60"><path d="M10 40 C 30 5, 50 45, 70 20 C 85 5, 95 30, 110 20 C 125 10, 140 35, 160 25 C 170 20, 180 15, 190 30" stroke="#0f6b4a" stroke-width="2.2" fill="none" stroke-linecap="round"/><text x="10" y="55" font-family="cursive" font-size="10" fill="#0f6b4a" opacity="0.7">tanda tangan</text></svg>`
);

const STAMP_SVG_FALLBACK = svgToDataUrl(
  `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140">
  <circle cx="70" cy="70" r="62" fill="none" stroke="#0f6b4a" stroke-width="2.2"/>
  <circle cx="70" cy="70" r="58" fill="none" stroke="#0f6b4a" stroke-width="1" opacity="0.9"/>
  <circle cx="70" cy="70" r="52" fill="none" stroke="#0f6b4a" stroke-width="0.8" stroke-dasharray="3 3" opacity="0.7"/>
  <defs>
    <path id="topArc" d="M 18 70 A 52 52 0 0 1 122 70"/>
    <path id="bottomArc" d="M 22 70 A 48 48 0 0 0 118 70"/>
  </defs>
  <text fill="#0f6b4a" font-family="sans-serif" font-size="5.2" font-weight="600" letter-spacing="1.1" text-anchor="middle" opacity="0.9">
    <textPath href="#bottomArc" startOffset="50%">TEMUKAN DAN TERHUBUNG KE MASJID</textPath>
  </text>
  <text x="70" y="64" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="900" fill="#0f6b4a" letter-spacing="0.8">GetMasjid</text>
  <text x="70" y="74" text-anchor="middle" font-family="sans-serif" font-size="4.5" font-weight="700" fill="#0f6b4a" letter-spacing="2" opacity="0.85">CAP RESMI</text>
  <text x="70" y="88" text-anchor="middle" font-family="monospace" font-size="4" fill="#0f6b4a" opacity="0.6">No. 001/GMJ</text>
  <g opacity="0.95">
    <circle cx="70" cy="70" r="1.8" fill="#0f6b4a"/>
    <text x="34" y="71" text-anchor="middle" font-size="5" fill="#0f6b4a">★</text>
    <text x="106" y="71" text-anchor="middle" font-size="5" fill="#0f6b4a">★</text>
  </g>
</svg>`
);

function renderKopSection(kop: KopSuratConfig, logoHtml: string, companyHtml: string): string {
  const template = kop.template || "default";

  if (template === "uns_colored_v1") {
    // UNS Version 1: Side Color Bars & Dual Logo Header (persis PDF dokumen kemitraan)
    const unsLogo = UNS_LOGO_SVG;
    const isOldWhitePng = kop.logoImage && kop.logoImage.startsWith("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAmwAAAESCAYAAABAVYkJ");
    const gmjLogo = GETMASJID_LOGO_SVG;

    const unsScale = kop.unsLogoScale ?? 1.0;
    const unsOffsetX = kop.unsLogoOffsetX ?? 0;
    const unsOffsetY = kop.unsLogoOffsetY ?? 0;

    const gmjScale = kop.logoScale ?? 1.0;
    const gmjOffsetX = kop.logoOffsetX ?? 0;
    const gmjOffsetY = kop.logoOffsetY ?? 0;

    return `
      <!-- UNS Colored Version 1: Side Color Bars & Dual Logo -->
      <div class="uns-v1-accents">
        <div class="uns-left-bar"></div>
        <div class="uns-right-bar-yellow"></div>
        <div class="uns-right-bar-blue"></div>
      </div>
      <table class="kop-table uns-kop-table" style="border-bottom: none; margin-bottom: 22px; padding-bottom: 4px;">
        <tr>
          <td class="kop-left-cell" style="vertical-align: middle; width: 56%;">
            <table style="border-collapse: collapse;">
              <tr>
                <td style="vertical-align: middle; padding-right: 10px;">
                  <div style="transform: translate(${unsOffsetX}px, ${unsOffsetY}px) scale(${unsScale}); transform-origin: left center; display: inline-block;">
                    <img src="${unsLogo}" alt="Logo UNS" style="height: 56px; max-width: 240px; object-fit: contain; display: block;" />
                  </div>
                </td>
                <td style="vertical-align: middle; padding: 0 10px;">
                  <div style="width: 1.5px; height: 42px; background: #0096D6; opacity: 0.85;"></div>
                </td>
                <td style="vertical-align: middle; padding-left: 4px;">
                  <div style="transform: translate(${gmjOffsetX}px, ${gmjOffsetY}px) scale(${gmjScale}); transform-origin: left center; display: inline-block;">
                    <img src="${gmjLogo}" alt="Logo GetMasjid" style="height: 52px; max-width: 200px; object-fit: contain; display: block;" />
                  </div>
                </td>
              </tr>
            </table>
          </td>
          <td class="kop-right-cell" style="vertical-align: middle; text-align: right; width: 44%; line-height: 1.42; padding-right: 4px;">
            <div style="font-size: 11.5pt; font-weight: 800; color: #0096D6; letter-spacing: 0.5px; margin-bottom: 3px;">GET MASJID</div>
            <div style="font-size: 7.2pt; color: #262626;">Jalan Ir. Sutami No. 36 A Kentingan, Jebres,</div>
            <div style="font-size: 7.2pt; color: #262626;">Surakarta, Jawa Tengah, Indonesia 57126.</div>
            <div style="font-size: 7.2pt; color: #262626;">+62 85188139451</div>
            <div style="font-size: 7.2pt; color: #262626; margin-top: 2px;">support@getmasjid.com &nbsp;|&nbsp; www.getmasjid.com</div>
          </td>
        </tr>
      </table>
    `;
  }

  // Default Standard GetMasjid Kop
  return `
    <table class="kop-table">
      <tr>
        <td class="kop-left-cell">
          <table style="border-collapse:collapse;">
            <tr>
              <td style="vertical-align:middle; padding-right:12px;">
                ${logoHtml}
              </td>
              <td style="vertical-align:middle;">
                <div class="kop-text">
                  <h1>${companyHtml}</h1>
                  <p>${escapeHtml(kop.tagline)}<br/>${escapeHtml(kop.subTagline)}</p>
                </div>
              </td>
            </tr>
          </table>
        </td>
        <td class="kop-right-cell">
          ${kop.legalName ? `<strong>${escapeHtml(kop.legalName)}</strong><br/>` : ""}
          ${escapeHtml(kop.alamat)}<br/>
          ${escapeHtml(kop.email)} &nbsp;|&nbsp; ${escapeHtml(kop.website)}<br/>
          ${escapeHtml(kop.phone)}
        </td>
      </tr>
    </table>
    <div class="kop-line-2"></div>
  `;
}

export function generateLetterHTML(
  data: LetterData,
  kop: KopSuratConfig = DEFAULT_KOP,
  sig: SignatureConfig = DEFAULT_SIG
): string {
  const tanggalFormatted = formatTanggalIndonesia(data.tanggal);
  const perihalDisplay = data.perihalCustom || data.perihal;
  const isiParagraphs = data.isiSurat
    .split("\n")
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join("\n");

  const signersList = data.signers && data.signers.length > 0 
    ? data.signers 
    : [{
        nama: data.namaPenandatangan || "Raffi Atalla Natha Atmaja",
        jabatan: data.jabatan || "CEO GetMasjid",
        signatureImage: sig.signatureImage,
        showSignature: sig.showSignature,
        showStamp: sig.showStamp
      }];

  let ttdHtml = '';
  if (signersList.length === 1) {
    const signer = signersList[0];
    const sImg = signer.showSignature ? (signer.signatureImage || sig.signatureImage || SIGNATURE_SVG_FALLBACK) : null;
    const stImg = signer.showStamp ? (sig.stampImage || STAMP_SVG_FALLBACK) : null;
    ttdHtml = `
      <div class="ttd-container">
        <table class="ttd-table">
          <tr>
            <td style="text-align: right; vertical-align: top;">
              <div class="ttd-box">
                <div class="tanggal">Hormat kami,</div>
                <div class="ttd-images">
                  ${sImg ? `<img class="signature" src="${sImg}" alt="tanda tangan" style="transform: translate(-50%, -50%) scale(${sig.signatureScale})" />` : `<div style="font-size:9pt;color:#999;font-style:italic;padding-top:20px;">(tanpa tanda tangan)</div>`}
                  ${stImg ? `<img class="stamp" src="${stImg}" alt="stempel" style="opacity:${sig.stampOpacity}" />` : ""}
                </div>
                <div class="ttd-name">${escapeHtml(signer.nama)}</div>
                <div class="ttd-jabatan">${escapeHtml(signer.jabatan)}</div>
              </div>
            </td>
          </tr>
        </table>
      </div>
    `;
  } else if (signersList.length <= 3) {
    ttdHtml = `
      <div class="ttd-container">
        <div style="font-size: 10pt; color: #333; margin-bottom: 8px;">Hormat kami,</div>
        <table class="ttd-table">
          <tr>
            ${signersList.map((signer) => {
              const sImg = signer.showSignature ? (signer.signatureImage || sig.signatureImage || SIGNATURE_SVG_FALLBACK) : null;
              const stImg = signer.showStamp ? (sig.stampImage || STAMP_SVG_FALLBACK) : null;
              return `
                <td class="ttd-cell">
                  <div class="ttd-box">
                    <div class="ttd-images">
                      ${sImg ? `<img class="signature" src="${sImg}" alt="tanda tangan" style="transform: translate(-50%, -50%) scale(${sig.signatureScale})" />` : `<div style="font-size:9pt;color:#999;font-style:italic;padding-top:20px;">(tanpa tanda tangan)</div>`}
                      ${stImg ? `<img class="stamp" src="${stImg}" alt="stempel" style="opacity:${sig.stampOpacity}" />` : ""}
                    </div>
                    <div class="ttd-name">${escapeHtml(signer.nama)}</div>
                    <div class="ttd-jabatan">${escapeHtml(signer.jabatan)}</div>
                  </div>
                </td>
              `;
            }).join('')}
          </tr>
        </table>
      </div>
    `;
  } else {
    const row1 = signersList.slice(0, 2);
    const row2 = signersList.slice(2, 4);
    ttdHtml = `
      <div class="ttd-container">
        <div style="font-size: 10pt; color: #333; margin-bottom: 8px;">Hormat kami,</div>
        <table class="ttd-table">
          <tr>
            ${row1.map((signer) => {
              const sImg = signer.showSignature ? (signer.signatureImage || sig.signatureImage || SIGNATURE_SVG_FALLBACK) : null;
              const stImg = signer.showStamp ? (sig.stampImage || STAMP_SVG_FALLBACK) : null;
              return `
                <td class="ttd-cell">
                  <div class="ttd-box">
                    <div class="ttd-images">
                      ${sImg ? `<img class="signature" src="${sImg}" alt="tanda tangan" style="transform: translate(-50%, -50%) scale(${sig.signatureScale})" />` : `<div style="font-size:9pt;color:#999;font-style:italic;padding-top:20px;">(tanpa tanda tangan)</div>`}
                      ${stImg ? `<img class="stamp" src="${stImg}" alt="stempel" style="opacity:${sig.stampOpacity}" />` : ""}
                    </div>
                    <div class="ttd-name">${escapeHtml(signer.nama)}</div>
                    <div class="ttd-jabatan">${escapeHtml(signer.jabatan)}</div>
                  </div>
                </td>
              `;
            }).join('')}
          </tr>
        </table>
        <table class="ttd-table" style="margin-top: 16px;">
          <tr>
            ${row2.map((signer) => {
              const sImg = signer.showSignature ? (signer.signatureImage || sig.signatureImage || SIGNATURE_SVG_FALLBACK) : null;
              const stImg = signer.showStamp ? (sig.stampImage || STAMP_SVG_FALLBACK) : null;
              return `
                <td class="ttd-cell">
                  <div class="ttd-box">
                    <div class="ttd-images">
                      ${sImg ? `<img class="signature" src="${sImg}" alt="tanda tangan" style="transform: translate(-50%, -50%) scale(${sig.signatureScale})" />` : `<div style="font-size:9pt;color:#999;font-style:italic;padding-top:20px;">(tanpa tanda tangan)</div>`}
                      ${stImg ? `<img class="stamp" src="${stImg}" alt="stempel" style="opacity:${sig.stampOpacity}" />` : ""}
                    </div>
                    <div class="ttd-name">${escapeHtml(signer.nama)}</div>
                    <div class="ttd-jabatan">${escapeHtml(signer.jabatan)}</div>
                  </div>
                </td>
              `;
            }).join('')}
          </tr>
        </table>
      </div>
    `;
  }
  const gmjScale = kop.logoScale ?? 1.0;
  const gmjOffsetX = kop.logoOffsetX ?? 0;
  const gmjOffsetY = kop.logoOffsetY ?? 0;

  const logoHtml = `<div style="transform: translate(${gmjOffsetX}px, ${gmjOffsetY}px) scale(${gmjScale}); transform-origin: left center; display: inline-block;"><img src="${GETMASJID_LOGO_SVG}" alt="Logo GetMasjid" style="width:48px;height:48px;object-fit:contain;display:block;" /></div>`;

  const companyHtml = kop.companyName.includes("GetMasjid") || kop.companyName.includes("Get")
    ? kop.companyName.replace("GetMasjid", "Get<span>Masjid</span>").replace("Get Masjid", "Get<span>Masjid</span>")
    : escapeHtml(kop.companyName);

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(perihalDisplay)} - ${escapeHtml(data.nomorSurat)}</title>
<style>
  @page {
    size: A4 portrait;
    margin: 0;
  }
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Merriweather:wght@400;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    color: #1a1a1a;
    background: #eef1f5;
    font-size: 10.5pt;
    line-height: 1.5;
    padding: 20px 10px;
    margin: 0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page {
    width: 210mm;
    height: 297mm;
    max-height: 297mm;
    min-height: 297mm;
    margin: 0 auto 20px auto;
    padding: 14mm 20mm 15mm 20mm;
    background: white;
    box-sizing: border-box;
    position: relative;
    overflow: hidden;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04);
    border-radius: 2px;
  }
  .page:last-child {
    margin-bottom: 0;
  }

  /* UNS Version 1 Side Accent Bars */
  .uns-v1-accents {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    pointer-events: none;
  }
  .uns-left-bar {
    position: absolute;
    left: 0;
    top: 14mm;
    width: 7mm;
    height: 18mm;
    background: #FBBF24;
  }
  .uns-right-bar-yellow {
    position: absolute;
    right: 0;
    top: 14mm;
    width: 7mm;
    height: 11mm;
    background: #FBBF24;
  }
  .uns-right-bar-blue {
    position: absolute;
    right: 0;
    top: 25mm;
    width: 7mm;
    height: 5mm;
    background: #0096D6;
  }

  /* Kop Surat Table Layout */
  .kop-table {
    width: 100%;
    border-collapse: collapse;
    border-bottom: 2px solid ${escapeHtml(kop.accentColor)};
    padding-bottom: 8px;
    margin-bottom: 4px;
    table-layout: fixed;
  }
  .kop-left-cell {
    vertical-align: middle;
    text-align: left;
  }
  .kop-right-cell {
    vertical-align: middle;
    text-align: right;
    font-size: 7.5pt;
    color: #555;
    line-height: 1.45;
    width: 210px;
  }
  .kop-right-cell strong { color: #1a1a1a; font-size: 7.5pt; }
  .logo {
    width: 44px;
    height: 44px;
    background: ${escapeHtml(kop.accentColor)};
    border-radius: 9px;
    display: inline-block;
    text-align: center;
    line-height: 44px;
    color: white;
    font-weight: 700;
    font-size: 17px;
    letter-spacing: -0.5px;
  }
  .kop-text h1 {
    font-size: 17px;
    font-weight: 800;
    color: ${escapeHtml(kop.accentColor)};
    letter-spacing: -0.3px;
    line-height: 1;
    margin: 0;
  }
  .kop-text h1 span { font-weight: 400; color: ${escapeHtml(kop.accentColor)}; }
  .kop-text p {
    font-size: 7.5pt;
    color: #555;
    margin-top: 3px;
    line-height: 1.35;
    max-width: 380px;
  }
  .kop-line-2 {
    height: 1px;
    background: ${escapeHtml(kop.accentColor)};
    opacity: 0.25;
    margin-bottom: 12px;
  }
  /* Meta Table Layout */
  .meta-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 12px;
    font-size: 9.5pt;
    table-layout: fixed;
  }
  .meta-left-cell {
    vertical-align: top;
    text-align: left;
  }
  .meta-right-cell {
    vertical-align: top;
    text-align: right;
    font-size: 9.5pt;
    color: #333;
    padding-top: 1px;
    width: 180px;
  }
  .meta-inner-table { border-collapse: collapse; }
  .meta-inner-table td { padding: 1px 0; vertical-align: top; }
  .meta-inner-table td.label-cell { width: 75px; color: #333; }
  .meta-inner-table td.colon-cell { width: 14px; text-align: center; }
  .meta-inner-table td.val-cell { font-weight: 500; }

  /* Tujuan */
  .tujuan {
    margin-bottom: 12px;
    font-size: 10pt;
    line-height: 1.45;
  }
  .tujuan .label { color: #555; font-size: 8.5pt; margin-bottom: 2px; }
  .isi {
    text-align: justify;
    font-size: 10pt;
    line-height: 1.5;
    color: #222;
    margin-bottom: 12px;
  }
  .isi p { margin-bottom: 8px; text-indent: 0; }
  .isi p:last-child { margin-bottom: 0; }

  /* TTD Table Layout */
  .ttd-container {
    margin-top: 14px;
    width: 100%;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
  .ttd-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }
  .ttd-cell {
    vertical-align: top;
    text-align: center;
  }
  .ttd-box {
    text-align: center;
    width: 200px;
    display: inline-block;
    position: relative;
    box-sizing: border-box;
  }
  .ttd-box .tanggal { font-size: 9.5pt; margin-bottom: 4px; color: #333; }
  .ttd-images {
    position: relative;
    height: 75px;
    min-height: 75px;
    margin: 4px 0;
  }
  .ttd-images .signature {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    max-height: 70px;
    max-width: 180px;
    object-fit: contain;
    z-index: 1;
    pointer-events: none;
  }
  .ttd-images .stamp {
    position: absolute;
    left: 48%;
    top: 48%;
    transform: translate(-50%, -50%);
    max-height: 80px;
    max-width: 80px;
    object-fit: contain;
    z-index: 2;
    pointer-events: none;
    mix-blend-mode: multiply;
  }
  .ttd-name { font-weight: 700; font-size: 9.5pt; text-decoration: underline; color: #111; }
  .ttd-jabatan { font-size: 8.5pt; color: #555; margin-top: 1px; }

  /* Footer */
  .footer {
    position: absolute;
    bottom: 12mm;
    left: 20mm;
    right: 20mm;
    border-top: 1px solid #e5e7eb;
    padding-top: 6px;
    font-size: 7.5pt;
    color: #888;
  }
  .footer-table { width: 100%; border-collapse: collapse; }
  .footer-table td { padding: 0; }

  /* Print specific */
  @media print {
    *, *:before, *:after {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    html, body {
      background: white !important;
      padding: 0 !important;
      margin: 0 !important;
      width: 210mm !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    .page {
      box-shadow: none !important;
      margin: 0 !important;
      padding: 14mm 20mm 15mm 20mm !important;
      border: none !important;
      border-radius: 0 !important;
      width: 210mm !important;
      height: 297mm !important;
      max-height: 297mm !important;
      min-height: 297mm !important;
      overflow: hidden !important;
      transform: none !important;
      page-break-after: always !important;
      break-after: page !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    .page:last-child {
      page-break-after: auto !important;
      break-after: auto !important;
    }
    .attachment-page {
      page-break-before: always !important;
      break-before: page !important;
      width: 210mm !important;
      height: 297mm !important;
      max-height: 297mm !important;
      overflow: hidden !important;
      padding: 14mm 20mm 15mm 20mm !important;
    }
    .kop-table, .meta-table, .tujuan, .isi, .ttd-container, .ttd-box, .footer {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    .uns-left-bar, .uns-right-bar-yellow, .uns-right-bar-blue {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
  }
</style>
</head>
<body>
  <div class="page">
    <!-- KOP -->
    ${renderKopSection(kop, logoHtml, companyHtml)}

    <!-- META -->
    <table class="meta-table">
      <tr>
        <td class="meta-left-cell">
          <table class="meta-inner-table">
            <tr>
              <td class="label-cell">Nomor</td>
              <td class="colon-cell">:</td>
              <td class="val-cell">${escapeHtml(data.nomorSurat)}</td>
            </tr>
            <tr>
              <td class="label-cell">Lampiran</td>
              <td class="colon-cell">:</td>
              <td class="val-cell">${data.attachments && data.attachments.length > 0 ? `${data.attachments.length} lembar` : "-"}</td>
            </tr>
            <tr>
              <td class="label-cell">Perihal</td>
              <td class="colon-cell">:</td>
              <td class="val-cell"><strong>${escapeHtml(perihalDisplay)}</strong></td>
            </tr>
          </table>
        </td>
        <td class="meta-right-cell">
          Surakarta, ${escapeHtml(tanggalFormatted)}
        </td>
      </tr>
    </table>

    <!-- TUJUAN -->
    <div class="tujuan">
      <div class="label">Kepada Yth.</div>
      <div style="font-weight:600; font-size:10.5pt;">${escapeHtml(data.namaPenerima)}</div>
      <div style="font-weight:500; color:#333;">${escapeHtml(data.instansiTujuan)}</div>
      ${data.alamatPenerima ? `<div style="color:#555; font-size:9pt; margin-top:2px;">${escapeHtml(data.alamatPenerima)}</div>` : ""}
      <div style="margin-top:6px;">di Tempat</div>
    </div>

    <!-- ISI -->
    <div class="isi">
      ${isiParagraphs}
    </div>

    <!-- TTD -->
    ${ttdHtml}

    <!-- FOOTER -->
    <div class="footer">
      <table class="footer-table">
        <tr>
          <td style="text-align:left;">Dokumen ini diterbitkan secara elektronik oleh GetMasjid &bull; Sah tanpa tanda tangan basah</td>
          <td style="text-align:right;">${escapeHtml(data.nomorSurat)}</td>
        </tr>
      </table>
    </div>
  </div>

  ${data.attachments && data.attachments.length > 0 ? data.attachments.map((img, idx) => `
    <div class="page attachment-page" style="page-break-before: always; break-before: page; position: relative;">
      <!-- Header Lampiran -->
      <table style="width: 100%; border-collapse: collapse; border-bottom: 1.5px solid #0f6b4a; padding-bottom: 8px; margin-bottom: 15px;">
        <tr>
          <td style="font-size: 10pt; font-weight: 700; color: #0f6b4a; text-transform: uppercase; letter-spacing: 0.5px;">Lampiran ${idx + 1}</td>
          <td style="font-size: 8.5pt; color: #666; font-family: monospace; text-align: right;">No. ${escapeHtml(data.nomorSurat)}</td>
        </tr>
      </table>
      
      <!-- Body Lampiran: Center Image -->
      <div style="text-align: center; margin: 20px 0;">
        <img src="${img}" alt="Lampiran ${idx + 1}" style="max-width: 100%; max-height: 200mm; object-fit: contain; border-radius: 8px; border: 1px solid #e5e7eb; box-shadow: 0 4px 12px rgba(0,0,0,0.05);" />
      </div>
      
      <!-- Footer Lampiran -->
      <div class="footer">
        <table class="footer-table">
          <tr>
            <td style="text-align:left;">Dokumen ini diterbitkan secara elektronik oleh GetMasjid</td>
            <td style="text-align:right;">Halaman ${idx + 2}</td>
          </tr>
        </table>
      </div>
    </div>
  `).join("") : ""}
  <script>
    let currentManualScale = 1;
    function autoScale() {
      const pages = document.querySelectorAll('.page');
      if (pages.length === 0) return;
      const width = window.innerWidth;
      const targetWidth = 794; // approx A4 width in px at 96dpi (210mm)
      const availableWidth = width - 20;
      let fitScale = 1;
      if (availableWidth < targetWidth) {
        fitScale = availableWidth / targetWidth;
      }
      const finalScale = fitScale * currentManualScale;

      if ('zoom' in document.body.style) {
        document.body.style.zoom = finalScale;
      } else {
        pages.forEach(function(page) {
          page.style.transform = 'scale(' + finalScale + ')';
          page.style.transformOrigin = 'top center';
        });
      }
    }

    window.addEventListener('message', function(event) {
      if (event.data && event.data.type === 'set-zoom') {
        currentManualScale = event.data.scale;
        autoScale();
      }
    });

    window.addEventListener('beforeprint', function() {
      if ('zoom' in document.body.style) {
        document.body.style.zoom = '1';
      }
      const pages = document.querySelectorAll('.page');
      pages.forEach(function(page) {
        page.style.transform = 'none';
      });
      document.body.style.width = '210mm';
    });

    window.addEventListener('afterprint', function() {
      autoScale();
    });

    window.addEventListener('load', autoScale);
    window.addEventListener('resize', autoScale);
    autoScale();
  </script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
