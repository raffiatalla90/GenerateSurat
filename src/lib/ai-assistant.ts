// Asisten AI Penulis Surat Resmi (GetMasjid & UNS)

export type AiActionType = 
  | "generate_from_idea" 
  | "formalize" 
  | "fix_grammar" 
  | "expand" 
  | "summarize" 
  | "friendly_formal";

export type LetterTone = "formal_eksekutif" | "persuasif_kemitraan" | "singkat_padat";

export interface AiGenerateRequest {
  action: AiActionType;
  prompt?: string;
  currentText?: string;
  tone?: LetterTone;
  penerima?: string;
  instansi?: string;
  perihal?: string;
}

export interface AiGenerateResponse {
  resultText: string;
  suggestedPerihal?: string;
  source: "llm" | "expert_engine";
}

/**
 * Built-in Indonesian Official Business Letter Generator & Enhancer
 */
export function generateLetterLocally(req: AiGenerateRequest): AiGenerateResponse {
  const penerima = req.penerima || "Bapak/Ibu Pimpinan";
  const instansi = req.instansi || "Instansi Tujuan";
  const perihal = req.perihal || "Kerja Sama";
  const inputPrompt = (req.prompt || "").trim();
  const currentText = (req.currentText || "").trim();
  const tone = req.tone || "formal_eksekutif";

  if (req.action === "generate_from_idea") {
    return generateFromIdea(inputPrompt, penerima, instansi, perihal, tone);
  } else {
    return enhanceExistingText(currentText, req.action, penerima, instansi);
  }
}

function generateFromIdea(
  idea: string,
  penerima: string,
  instansi: string,
  perihal: string,
  tone: LetterTone
): AiGenerateResponse {
  const ideaLower = idea.toLowerCase();
  
  // Deteksi intent / tema dari ide pengguna
  if (ideaLower.includes("audiensi") || ideaLower.includes("bertemu") || ideaLower.includes("menghadap") || ideaLower.includes("silaturahmi")) {
    return {
      suggestedPerihal: "Permohonan Audiensi dan Silaturahmi",
      source: "expert_engine",
      resultText: `Sehubungan dengan upaya peningkatan sinergi program dan penguatan kemitraan strategis, kami dari manajemen GetMasjid bermaksud untuk mengajukan permohonan audiensi dan silaturahmi bersama ${penerima} beserta jajaran di ${instansi}.

Melalui pertemuan ini, kami bermaksud menyampaikan pemaparan program inovasi digitalisasi masjid serta menjajaki potensi kolaborasi yang dapat memberikan kebermanfaatan luas bagi umat dan sivitas akademika.

Adapun pokok pembahasan yang kami usulkan meliputi:
1. Pemaparan ekosistem platform GetMasjid dalam tata kelola keuangan dan kegiatan masjid yang transparan.
2. Penjajakan skema kemitraan strategis dan integrasi program bersama ${instansi}.
3. Diskusi teknis tindak lanjut rencana implementasi di lapangan.

Besar harapan kami Bapak/Ibu dapat berkenan meluangkan waktu untuk agenda pertemuan tersebut. Terkait waktu dan tempat pelaksanaan, kami siap menyesuaikan dengan jadwal luang yang Bapak/Ibu tentukan.

Demikian surat permohonan ini kami sampaikan. Atas perhatian, perkenan, dan kerja sama yang baik, kami ucapkan terima kasih.`
    };
  }

  if (ideaLower.includes("uns") || ideaLower.includes("kampus") || ideaLower.includes("universitas") || ideaLower.includes("akademik") || ideaLower.includes("riset") || ideaLower.includes("magang")) {
    return {
      suggestedPerihal: "Permohonan Kemitraan Strategis & Implementasi Program",
      source: "expert_engine",
      resultText: `Sehubungan dengan komitmen GetMasjid dalam mengakselerasi transformasi digital dan pemberdayaan ekosistem masjid di Indonesia, kami bermaksud mengajukan permohonan kerja sama kemitraan strategis dengan ${instansi}.

GetMasjid merupakan platform manajemen masjid terintegrasi yang memudahkan takmir dalam tata kelola keuangan yang akuntabel, pencatatan kas real-time, serta publikasi agenda dakwah kepada jamaah secara digital.

Berdasarkan kesamaan visi dalam mendorong inovasi dan pengabdian masyarakat, adapun bentuk sinergi yang kami tawarkan meliputi:
1. Implementasi sistem platform GetMasjid pada masjid-masjid di lingkungan binaan ${instansi}.
2. Program pelatihan dan pendampingan digitalisasi bagi pengurus takmir masjid.
3. Kolaborasi riset, program magang mahasiswa, dan pengabdian masyarakat berbasis teknologi digital.
4. Dukungan teknis berkelanjutan serta integrasi layanan dakwah digital.

Kami meyakini bahwa kolaborasi ini akan memberikan dampak positif yang signifikan dalam memodernisasi tata kelola masjid yang transparan dan profesional.

Demikian surat permohonan kerja sama ini kami sampaikan. Atas perhatian dan kesediaan Bapak/Ibu dalam menyambut inisiatif kolaborasi ini, kami ucapkan terima kasih.`
    };
  }

  if (ideaLower.includes("undangan") || ideaLower.includes("acara") || ideaLower.includes("workshop") || ideaLower.includes("seminar") || ideaLower.includes("sosialisasi")) {
    return {
      suggestedPerihal: "Undangan Menghadiri Acara Sosialisasi & Workshop",
      source: "expert_engine",
      resultText: `Dalam rangka sosialisasi penguatan tata kelola masjid berbasis teknologi digital dan peningkatan literasi keuangan takmir, GetMasjid mengundang ${penerima} beserta jajaran pengurus ${instansi} untuk hadir pada kegiatan:

Acara: Workshop & Sosialisasi Transformasi Digital Manajemen Masjid
Hari/Tanggal: [Isi Hari dan Tanggal]
Waktu: 09.00 WIB s.d. Selesai
Tempat / Media: [Isi Lokasi Gedung / Zoom Meeting Link]
Agenda Utama: Paparan implementasi sistem akuntansi masjid, transparansi donasi, dan pengelolaan aset digital.

Mengingat pentingnya agenda ini bagi kemajuan pengelolaan masjid modern yang akuntabel, kehadiran Bapak/Ibu sangat kami harapkan.

Demikian undangan ini kami sampaikan. Atas perhatian dan kehadiran Bapak/Ibu, kami haturkan terima kasih.`
    };
  }

  if (ideaLower.includes("izin") || ideaLower.includes("dispensasi") || ideaLower.includes("rekomendasi") || ideaLower.includes("dukungan")) {
    return {
      suggestedPerihal: "Permohonan Izin dan Dukungan Kegiatan",
      source: "expert_engine",
      resultText: `Sehubungan dengan rencana pelaksanaan program inisiatif digitalisasi masjid dan pelatihan pengurus takmir yang akan diselenggarakan oleh tim GetMasjid, kami mengajukan permohonan izin dan dukungan resmi kepada ${penerima} di ${instansi}.

Program ini bertujuan untuk membekali para pengurus masjid dengan instrumen teknologi modern guna menciptakan sistem pelaporan kas yang transparan, memudahkan penyaluran infak digital, dan memperluas jangkauan dakwah.

Demi kelancaran agenda tersebut, kami memohon perkenan Bapak/Ibu untuk memberikan:
1. Izin pelaksanaan sosialisasi dan koordinasi kepada masjid-masjid di bawah naungan ${instansi}.
2. Surat rekomendasi atau dukungan kelembagaan terhadap implementasi program ini.

Kami berkomitmen untuk menjalankan seluruh rangkaian kegiatan dengan tertib, profesional, dan berkoordinasi penuh bersama jajaran Bapak/Ibu.

Demikian surat permohonan ini kami sampaikan. Atas perhatian, arahan, dan dukungan yang Bapak/Ibu berikan, kami ucapkan terima kasih.`
    };
  }

  if (ideaLower.includes("penawaran") || ideaLower.includes("proposal") || ideaLower.includes("solusi") || ideaLower.includes("aplikasi")) {
    return {
      suggestedPerihal: "Penawaran Layanan Digitalisasi Manajemen Masjid",
      source: "expert_engine",
      resultText: `Bersama surat ini, kami dari manajemen GetMasjid bermaksud menyampaikan penawaran solusi platform digital manajemen masjid terpadu kepada ${penerima} di ${instansi}.

GetMasjid hadir sebagai ekosistem teknologi modern yang dirancang khusus untuk mempermudah operasional takmir masjid dengan ragam fitur unggulan:
1. Pembukuan & Laporan Kas Real-Time yang otomatis dapat diakses oleh jamaah.
2. Integrasi Pembayaran Infaq Digital (QRIS & Virtual Account) yang aman dan praktis.
3. Manajemen Jadwal Petugas Sholat, Kajian, dan Inventaris Aset Masjid.
4. Portal Web dan Mobile Ramah Pengguna dengan layanan pendampingan teknis gratis.

Melalui kemitraan ini, kami siap memberikan pendampingan implementasi menyeluruh tanpa biaya awal agar sistem dapat langsung dioperasikan secara optimal.

Sebagai bahan pertimbangan lebih lanjut, proposal rincian teknis dan portofolio layanan kami lampirkan bersama surat ini.

Demikian surat penawaran ini kami sampaikan. Atas perhatian dan kesempatan yang diberikan, kami ucapkan terima kasih.`
    };
  }

  // Generic Smart Generator based on idea snippet
  const cleanIdea = idea.length > 0 ? idea : "kerjasama strategis dan implementasi solusi digitalisasi";
  return {
    suggestedPerihal: `Permohonan ${perihal}`,
    source: "expert_engine",
    resultText: `Sehubungan dengan inisiatif penguatan tata kelola dan pengembangan kemitraan berkelanjutan, kami dari manajemen GetMasjid menyampaikan maksud dan tujuan permohonan resmi kepada ${penerima} di ${instansi}.

Mengenai hal tersebut, kami bermaksud menindaklanjuti rencana terkait: ${cleanIdea}.

Adapun pokok poin yang ingin kami sampaikan dan kerjasamakan meliputi:
1. Implementasi sistem dan koordinasi terpadu bersama tim ${instansi}.
2. Pendampingan teknis serta monitoring berkala untuk memastikan program berjalan optimal.
3. Penyelarasan tujuan bersama guna memberikan dampak positif bagi seluruh pihak.

Besar harapan kami agar inisiatif ini dapat disambut baik dan terjalin kerja sama yang saling menguntungkan serta berkelanjutan.

Demikian surat ini kami sampaikan. Atas perhatian, pertimbangan, dan kerja sama yang baik dari Bapak/Ibu, kami ucapkan terima kasih.`
  };
}

function enhanceExistingText(
  text: string,
  action: AiActionType,
  penerima: string,
  instansi: string
): AiGenerateResponse {
  if (!text || text.length < 5) {
    return {
      resultText: `Sehubungan dengan surat permohonan kemitraan ini, kami bermaksud menyampaikan inisiatif kerja sama strategis bersama ${penerima} di ${instansi}.\n\nDemikian surat ini kami sampaikan. Atas perhatian dan kerja sama yang baik, kami ucapkan terima kasih.`,
      source: "expert_engine"
    };
  }

  let processed = text;

  if (action === "formalize") {
    // Replace informal phrases with formal Indonesian business correspondence phrasing
    const replacements: [RegExp, string][] = [
      [/\b(mau|pengen|kepingin)\b/gi, "bermaksud untuk"],
      [/\b(ngajak|ngajakin)\b/gi, "mengajak serta mengajukan kerja sama kepada"],
      [/\b(kasih|ngasih|memberi tahu)\b/gi, "menyampaikan"],
      [/\b(bikin|ngebuat)\b/gi, "mengembangkan serta menyusun"],
      [/\b(tolong|minta tolong)\b/gi, "memohon perkenan Bapak/Ibu untuk"],
      [/\b(makasih|makasi|thanks|terimakasih)\b/gi, "terima kasih"],
      [/\b(bisa gak|bisa tidak|gimana kalau)\b/gi, "kami mengharapkan kesediaan Bapak/Ibu agar dapat"],
      [/\b(udah|sudah selesai)\b/gi, "telah diselesaikan dengan baik"],
      [/\b(bagus|keren|mantap)\b/gi, "memberikan dampak yang sangat positif dan signifikan"],
      [/\b(kalo|kalau ada waktu)\b/gi, "apabila Bapak/Ibu berkenan meluangkan waktu"],
      [/\b(ngomongin|bahas)\b/gi, "mendiskusikan secara komprehensif"],
      [/\b(ketemu|ketemuan)\b/gi, "mengadakan agenda audiensi dan pertemuan resmi"],
      [/\b(biar|supaya)\b/gi, "guna memastikan"],
      [/\b(jadwalin)\b/gi, "menjadwalkan agenda tersebut"],
    ];

    replacements.forEach(([pattern, repl]) => {
      processed = processed.replace(pattern, repl);
    });

    // Ensure polite opening and closing
    if (!processed.toLowerCase().includes("sehubungan dengan") && !processed.toLowerCase().includes("dengan hormat")) {
      processed = `Sehubungan dengan permohonan ini, kami bermaksud menyampaikan hal-hal sebagai berikut:\n\n${processed}`;
    }
    if (!processed.toLowerCase().includes("demikian") && !processed.toLowerCase().includes("terima kasih")) {
      processed += `\n\nDemikian surat ini kami sampaikan. Atas perhatian, pertimbangan, dan kerja sama yang baik dari Bapak/Ibu, kami ucapkan terima kasih.`;
    }

    return { resultText: processed, source: "expert_engine" };
  }

  if (action === "fix_grammar") {
    // Fix common punctuation, spacing, and capitalization
    let fixed = text
      // Fix multiple spaces
      .replace(/[ \t]+/g, " ")
      // Fix comma and dot spacing
      .replace(/\s*([,.:;!?])\s*/g, "$1 ")
      .replace(/\(\s+/g, "(")
      .replace(/\s+\)/g, ")")
      // Capitalize first letter after dot or newline
      .replace(/(^|[.\n]\s*)([a-z])/g, (_, p1, p2) => p1 + p2.toUpperCase())
      // Common typo corrections in formal Indonesian
      .replace(/\bkerjasama\b/gi, "kerja sama")
      .replace(/\bmerubah\b/gi, "mengubah")
      .replace(/\bbertanggungjawab\b/gi, "bertanggung jawab")
      .replace(/\bmempertanggung jawabkan\b/gi, "mempertanggungjawabkan")
      .replace(/\bantar muka\b/gi, "antarmuka")
      .replace(/\bterimakasih\b/gi, "terima kasih")
      .replace(/\bdi lakukan\b/gi, "dilakukan")
      .replace(/\bdi laksanakan\b/gi, "dilaksanakan")
      .replace(/\bdi sampaikan\b/gi, "disampaikan")
      .replace(/\bke pada\b/gi, "kepada")
      .replace(/\bdi tempat\b/gi, "di tempat");

    return { resultText: fixed.trim(), source: "expert_engine" };
  }

  if (action === "expand") {
    const expanded = `Sehubungan dengan inisiatif kolaborasi dan peningkatan efisiensi program bersama ${penerima} di ${instansi}, izinkan kami menguraikan rencana kegiatan secara lebih terperinci.

${text}

Sebagai bagian dari komitmen kami dalam memastikan keberhasilan implementasi program ini, kami menyediakan dukungan menyeluruh yang mencakup:
1. Koordinasi berkala dan penyusunan lini masa kerja yang terukur.
2. Pendampingan teknis dan operasional secara berkesinambungan.
3. Evaluasi dan pelaporan berkala guna memastikan seluruh target dan manfaat dapat tercapai secara optimal.

Besar harapan kami Bapak/Ibu dapat mempertimbangkan inisiatif ini untuk ditindaklanjuti ke tahap implementasi bersama.

Demikian surat ini kami sampaikan. Atas perhatian dan kesediaan Bapak/Ibu dalam menyambut inisiatif ini, kami haturkan terima kasih.`;

    return { resultText: expanded, source: "expert_engine" };
  }

  if (action === "summarize") {
    const lines = text.split("\n").filter(p => p.trim().length > 0);
    const coreLines = lines.filter(l => !l.toLowerCase().includes("demikian") && !l.toLowerCase().includes("hormat kami"));
    const shortCore = coreLines.join(" ").slice(0, 320);

    const summarized = `Sehubungan dengan permohonan resmi kepada ${penerima} di ${instansi}, kami bermaksud menyampaikan hal pokok sebagai berikut:

${shortCore}...

Besar harapan kami usulan ini dapat diterima dan ditindaklanjuti melalui koordinasi lebih lanjut.

Demikian surat ini kami sampaikan. Atas perhatian dan kerja sama Bapak/Ibu, kami ucapkan terima kasih.`;

    return { resultText: summarized, source: "expert_engine" };
  }

  return { resultText: text, source: "expert_engine" };
}

/**
 * Request AI Assistant (calls /api/ai-assistant with fallback to local engine)
 */
export async function requestAiAssistant(req: AiGenerateRequest): Promise<AiGenerateResponse> {
  try {
    const response = await fetch("/api/ai-assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req)
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.resultText) {
        return data;
      }
    }
  } catch (err) {
    console.warn("API AI Assistant error, using local engine fallback:", err);
  }

  // Local fallback
  return generateLetterLocally(req);
}
