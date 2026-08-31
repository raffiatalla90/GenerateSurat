import { KopSuratConfig, SignatureConfig, LetterData } from "@/types/letter";
import { formatTanggalIndonesia } from "./utils";
import { DEFAULT_KOP, DEFAULT_SIG } from "./kop-defaults";

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
  <text fill="#0f6b4a" font-family="sans-serif" font-size="7.5" font-weight="700" letter-spacing="1.4" text-anchor="middle">
    <textPath href="#topArc" startOffset="50%">PT GETMASJID DIGITAL INDONESIA</textPath>
  </text>
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

  const sigImg = sig.showSignature ? (sig.signatureImage || SIGNATURE_SVG_FALLBACK) : "";
  const stampImg = sig.showStamp ? (sig.stampImage || STAMP_SVG_FALLBACK) : "";
  const logoHtml = kop.logoImage
    ? `<img src="${kop.logoImage}" alt="logo" style="width:46px;height:46px;object-fit:contain;border-radius:10px;background:white;border:1px solid #e5e7eb;" />`
    : `<div class="logo" style="background:${escapeHtml(kop.accentColor)}">${escapeHtml(kop.logoText || "GM")}</div>`;

  // Split company name for GetMasjid style if contains no space; otherwise full
  const companyHtml = kop.companyName.includes("GetMasjid") || kop.companyName.includes("Get")
    ? kop.companyName.replace("GetMasjid", "Get<span>Masjid</span>").replace("Get Masjid", "Get<span>Masjid</span>")
    : escapeHtml(kop.companyName);

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Merriweather:wght@400;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    color: #1a1a1a;
    background: #fff;
    font-size: 11.5pt;
    line-height: 1.6;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page {
    width: 210mm;
    min-height: 297mm;
    margin: 0 auto;
    padding: 18mm 22mm 18mm 22mm;
    background: white;
  }
  /* Kop Surat */
  .kop {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 2.5px solid ${escapeHtml(kop.accentColor)};
    padding-bottom: 12px;
    margin-bottom: 6px;
  }
  .kop-left {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .logo {
    width: 46px;
    height: 46px;
    background: ${escapeHtml(kop.accentColor)};
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 700;
    font-size: 18px;
    letter-spacing: -0.5px;
  }
  .kop-text h1 {
    font-size: 18px;
    font-weight: 800;
    color: ${escapeHtml(kop.accentColor)};
    letter-spacing: -0.3px;
    line-height: 1;
  }
  .kop-text h1 span { font-weight: 400; color: ${escapeHtml(kop.accentColor)}; }
  .kop-text p {
    font-size: 7.5pt;
    color: #555;
    margin-top: 3px;
    line-height: 1.4;
    max-width: 380px;
  }
  .kop-right {
    text-align: right;
    font-size: 7.5pt;
    color: #555;
    line-height: 1.5;
  }
  .kop-right strong { color: #1a1a1a; font-size: 7.5pt; }
  .kop-line-2 {
    height: 1px;
    background: ${escapeHtml(kop.accentColor)}22;
    margin-bottom: 18px;
  }
  /* Meta */
  .meta {
    display: flex;
    justify-content: space-between;
    margin-bottom: 18px;
    font-size: 10pt;
  }
  .meta table { border-collapse: collapse; }
  .meta td { padding: 1.5px 0; vertical-align: top; }
  .meta td:first-child { width: 90px; color: #333; }
  .meta td:nth-child(2) { width: 10px; text-align: center; }
  .meta td:last-child { font-weight: 500; }
  /* Tujuan */
  .tujuan { margin-bottom: 16px; font-size: 10.5pt; line-height: 1.6; }
  .tujuan .label { color: #555; font-size: 9pt; margin-bottom: 2px; }
  .isi {
    text-align: justify;
    font-size: 10.8pt;
    line-height: 1.75;
    color: #222;
    margin-bottom: 20px;
  }
  .isi p { margin-bottom: 10px; text-indent: 0; }
  .isi p:first-child { margin-top: 0; }
  .penutup {
    text-align: justify;
    font-size: 10.8pt;
    line-height: 1.7;
    margin-bottom: 28px;
  }
  /* TTD */
  .ttd-wrap {
    display: flex;
    justify-content: flex-end;
    margin-top: 10px;
  }
  .ttd-box {
    text-align: center;
    width: 260px;
    position: relative;
  }
  .ttd-box .tanggal { font-size: 10pt; margin-bottom: 6px; color: #333; }
  .ttd-box .jabatan-atas { font-size: 10pt; color: #333; margin-bottom: 8px; }
  .ttd-images {
    position: relative;
    height: 92px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 6px 0;
  }
  .ttd-images .stamp {
    position: absolute;
    right: 28px;
    top: 4px;
    width: 88px;
    height: 88px;
    opacity: 0.85;
    mix-blend-mode: multiply;
  }
  .ttd-images .signature {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 140px;
    height: 52px;
    object-fit: contain;
  }
  .ttd-name {
    font-weight: 700;
    font-size: 11pt;
    color: #111;
    border-bottom: 1.5px solid #111;
    display: inline-block;
    padding-bottom: 2px;
    margin-bottom: 3px;
  }
  .ttd-jabatan { font-size: 9pt; color: #555; }
  .footer {
    margin-top: 36px;
    border-top: 1px solid #e5e7eb;
    padding-top: 10px;
    display: flex;
    justify-content: space-between;
    font-size: 7pt;
    color: #888;
    letter-spacing: 0.2px;
  }
  @media print {
    body { background: white; }
    .page { padding: 16mm 20mm; box-shadow: none; }
  }
</style>
</head>
<body>
  <div class="page">
    <!-- KOP -->
    <div class="kop">
      <div class="kop-left">
        ${logoHtml}
        <div class="kop-text">
          <h1>${companyHtml}</h1>
          <p>${escapeHtml(kop.tagline)}<br/>${escapeHtml(kop.subTagline)}</p>
        </div>
      </div>
      <div class="kop-right">
        <strong>${escapeHtml(kop.legalName)}</strong><br/>
        ${escapeHtml(kop.alamat)}<br/>
        ${escapeHtml(kop.email)} &nbsp;|&nbsp; ${escapeHtml(kop.website)}<br/>
        ${escapeHtml(kop.phone)}
      </div>
    </div>
    <div class="kop-line-2"></div>

    <!-- META -->
    <div class="meta">
      <table>
        <tr><td>Nomor</td><td>:</td><td>${escapeHtml(data.nomorSurat)}</td></tr>
        <tr><td>Lampiran</td><td>:</td><td>-</td></tr>
        <tr><td>Perihal</td><td>:</td><td><strong>${escapeHtml(perihalDisplay)}</strong></td></tr>
      </table>
      <div style="text-align:right; font-size:10pt; color:#333;">
        Jakarta, ${escapeHtml(tanggalFormatted)}
      </div>
    </div>

    <!-- TUJUAN -->
    <div class="tujuan">
      <div class="label">Kepada Yth.</div>
      <div style="font-weight:600; font-size:11pt;">${escapeHtml(data.namaPenerima)}</div>
      <div style="font-weight:500; color:#333;">${escapeHtml(data.instansiTujuan)}</div>
      ${data.alamatPenerima ? `<div style="color:#555; font-size:9.5pt; margin-top:2px;">${escapeHtml(data.alamatPenerima)}</div>` : ""}
      <div style="margin-top:10px;">di Tempat</div>
    </div>

    <!-- ISI -->
    <div class="isi">
      ${isiParagraphs}
    </div>

    <div class="penutup">
      Demikian surat ini kami sampaikan. Atas perhatian dan kerja sama Bapak/Ibu, kami ucapkan terima kasih.
    </div>

    <!-- TTD -->
    <div class="ttd-wrap">
      <div class="ttd-box">
        <div class="tanggal">Hormat kami,</div>
        <div class="ttd-images">
          ${stampImg ? `<img class="stamp" src="${stampImg}" alt="stempel" style="opacity:${sig.stampOpacity}" />` : ""}
          ${sigImg ? `<img class="signature" src="${sigImg}" alt="tanda tangan" style="transform: translate(-50%, -50%) scale(${sig.signatureScale})" />` : `<div style="font-size:9pt;color:#999;font-style:italic;">(tanpa tanda tangan)</div>`}
        </div>
        <div class="ttd-name">${escapeHtml(data.namaPenandatangan)}</div>
        <div class="ttd-jabatan">${escapeHtml(data.jabatan)}</div>
      </div>
    </div>

    <div class="footer">
      <span>Dokumen ini diterbitkan secara elektronik oleh GetMasjid &bull; Sah tanpa tanda tangan basah</span>
      <span>${escapeHtml(data.nomorSurat)}</span>
    </div>
  </div>
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
