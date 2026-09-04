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
  suggestedPenerima?: string;
  suggestedInstansi?: string;
  source: "llm" | "expert_engine";
}

/**
 * Intelligent Entity & Intent Extractor for Indonesian Official Correspondence
 */
function extractEntitiesFromPrompt(prompt: string, fallbackPenerima: string, fallbackInstansi: string) {
  const p = prompt.trim();
  const pLower = p.toLowerCase();

  let targetPenerima = fallbackPenerima;
  let targetInstansi = fallbackInstansi;
  let detectedType: "vokasi_uns" | "uns_kampus" | "masjid" | "dinas_pemerintah" | "perusahaan" | "umum" = "umum";

  // 1. Detect Sekolah Vokasi UNS / Fakultas Kampus
  if (pLower.includes("sekolah vokasi") || pLower.includes("vokasi")) {
    detectedType = "vokasi_uns";
    targetPenerima = "Dekan Sekolah Vokasi Universitas Sebelas Maret";
    targetInstansi = "Sekolah Vokasi Universitas Sebelas Maret (UNS)";
  } else if (pLower.includes("dekan") || pLower.includes("fakultas") || pLower.includes("rektor") || pLower.includes("uns") || pLower.includes("universitas")) {
    detectedType = "uns_kampus";
    if (pLower.includes("rektor")) {
      targetPenerima = "Rektor Universitas Sebelas Maret";
      targetInstansi = "Universitas Sebelas Maret (UNS)";
    } else if (pLower.includes("dekan")) {
      targetPenerima = "Dekan Fakultas / Pimpinan Akademik";
      targetInstansi = pLower.includes("uns") ? "Universitas Sebelas Maret (UNS)" : "Fakultas / Universitas";
    } else {
      targetPenerima = "Pimpinan Universitas Sebelas Maret";
      targetInstansi = "Universitas Sebelas Maret (UNS)";
    }
  } else if (pLower.includes("masjid") || pLower.includes("takmir") || pLower.includes("dkm")) {
    detectedType = "masjid";
    if (!fallbackInstansi || fallbackInstansi === "Instansi Tujuan") {
      targetPenerima = "Ketua DKM / Pengurus Takmir Masjid";
      targetInstansi = "Pengurus Takmir Masjid";
    }
  } else if (pLower.includes("dinas") || pLower.includes("bupati") || pLower.includes("walikota") || pLower.includes("kemenag") || pLower.includes("kantor")) {
    detectedType = "dinas_pemerintah";
    targetPenerima = "Kepala Dinas / Pimpinan Instansi";
    targetInstansi = "Instansi / Lembaga Terkait";
  }

  // Extract explicit recipient phrases if user writes "kepada ...", "dekan ...", etc.
  const dekanMatch = p.match(/(?:dekan|rektor|kepala|ketua|direktur)\s+[^,.\n]+/i);
  if (dekanMatch) {
    targetPenerima = capitalizeWords(dekanMatch[0]);
    if (pLower.includes("uns") && !targetPenerima.toLowerCase().includes("uns")) {
      targetPenerima += " UNS";
    }
  }

  return { targetPenerima, targetInstansi, detectedType };
}

function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Built-in Indonesian Official Business Letter Generator & Enhancer
 */
export function generateLetterLocally(req: AiGenerateRequest): AiGenerateResponse {
  const inputPrompt = (req.prompt || "").trim();
  const currentText = (req.currentText || "").trim();
  const tone = req.tone || "formal_eksekutif";

  const { targetPenerima, targetInstansi, detectedType } = extractEntitiesFromPrompt(
    inputPrompt,
    req.penerima || "Bapak/Ibu Pimpinan",
    req.instansi || "Instansi Tujuan"
  );

  const perihal = req.perihal || "Kerja Sama";

  if (req.action === "generate_from_idea") {
    return generateFromIdea(inputPrompt, targetPenerima, targetInstansi, detectedType, perihal, tone);
  } else {
    return enhanceExistingText(currentText, req.action, targetPenerima, targetInstansi);
  }
}

function generateFromIdea(
  idea: string,
  penerima: string,
  instansi: string,
  detectedType: string,
  perihal: string,
  tone: LetterTone
): AiGenerateResponse {
  const ideaLower = idea.toLowerCase();

  // 1. Kasus Spesifik: Kerjasama dengan Sekolah Vokasi UNS / Kampus
  if (detectedType === "vokasi_uns" || (ideaLower.includes("vokasi") && ideaLower.includes("uns"))) {
    const isAudiensi = ideaLower.includes("audiensi") || ideaLower.includes("silaturahmi") || ideaLower.includes("bertemu");
    
    if (isAudiensi) {
      return {
        suggestedPerihal: "Permohonan Audiensi dan Penjajakan Kerja Sama Kemitraan",
        suggestedPenerima: penerima || "Dekan Sekolah Vokasi UNS",
        suggestedInstansi: instansi || "Sekolah Vokasi Universitas Sebelas Maret (UNS)",
        source: "expert_engine",
        resultText: `Sehubungan dengan inisiatif penguatan sinergi antara dunia industri teknologi dan institusi pendidikan tinggi vokasi, kami dari manajemen GetMasjid bermaksud mengajukan permohonan audiensi dan silaturahmi resmi bersama ${penerima} beserta jajaran pimpinan di ${instansi}.

Melalui pertemuan ini, kami bermaksud memaparkan potensi kolaborasi strategis antara GetMasjid dan Sekolah Vokasi UNS dalam pengembangan ekosistem digital dan pemberdayaan masyarakat.

Adapun pokok bahasan yang ingin kami diskusikan meliputi:
1. Penjajakan program magang bersertifikat dan praktisi mengajar bagi mahasiswa Sekolah Vokasi UNS.
2. Kolaborasi riset terapan (applied research) dan pengembangan proyek teknologi sistem informasi manajemen masjid.
3. Program pengabdian masyarakat berbasis teknologi pada masjid-masjid binaan di wilayah Surakarta dan sekitarnya.
4. Rencana perumusan Nota Kesepahaman (MoU) dan Perjanjian Kerja Sama (PKS) kemitraan strategis.

Besar harapan kami Bapak/Ibu Dekan dapat berkenan meluangkan waktu untuk agenda pertemuan tersebut. Mengenai waktu dan tempat pelaksanaan, kami siap menyesuaikan sepenuhnya dengan jadwal luang Bapak/Ibu.

Demikian surat permohonan audiensi ini kami sampaikan. Atas perhatian, perkenan, dan kerja sama yang baik dari Bapak/Ibu, kami ucapkan terima kasih.`
      };
    }

    return {
      suggestedPerihal: "Permohonan Kerja Sama Kemitraan Strategis & Program Vokasi Terapan",
      suggestedPenerima: penerima || "Dekan Sekolah Vokasi UNS",
      suggestedInstansi: instansi || "Sekolah Vokasi Universitas Sebelas Maret (UNS)",
      source: "expert_engine",
      resultText: `Sehubungan dengan komitmen GetMasjid dalam mendorong percepatan transformasi digital serta mendukung implementasi Link and Match antara industri teknologi dan perguruan tinggi, bersama surat ini kami bermaksud mengajukan permohonan kerja sama kemitraan strategis bersama ${penerima} di ${instansi}.

GetMasjid merupakan platform teknologi tata kelola manajemen masjid terintegrasi yang berfokus pada digitalisasi pencatatan kas, transparansi infak digital, dan optimalisasi layanan umat.

Melihat rekam jejak keunggulan akademik dan keahlian terapan di Sekolah Vokasi UNS, kami menawarkan ruang kolaborasi yang komprehensif, meliputi:
1. Program Magang Mahasiswa & Proyek Capstone: Pelibatan mahasiswa dalam pengembangan sistem perangkat lunak dan implementasi operasional platform GetMasjid.
2. Kolaborasi Riset Terapan & Pengabdian Masyarakat: Sinergi dosen dan mahasiswa dalam riset tata kelola keuangan sosial Islam dan digitalisasi masjid binaan.
3. Program Praktisi Mengajar (Guest Lecturer): Berbagi pengalaman industri teknologi bersama mahasiswa vokasi terkait pengembangan produk digital.
4. Implementasi Perangkat Lunak Manajemen Masjid pada masjid kampus dan jaringan mitra binaan UNS.

Kami meyakini kolaborasi ini akan memberikan dampak positif yang nyata bagi peningkatan kompetensi lulusan vokasi sekaligus menghadirkan solusi teknologi yang bermanfaat bagi masyarakat luas.

Demikian surat permohonan kerja sama ini kami sampaikan. Atas perhatian, dukungan, dan kesediaan Bapak/Ibu dalam menyambut inisiatif ini, kami ucapkan terima kasih.`
    };
  }

  // 2. Kasus: Kampus UNS / Fakultas Umum
  if (detectedType === "uns_kampus" || ideaLower.includes("uns") || ideaLower.includes("universitas")) {
    return {
      suggestedPerihal: "Permohonan Kemitraan Strategis & Pengabdian Masyarakat",
      suggestedPenerima: penerima || "Pimpinan Universitas Sebelas Maret (UNS)",
      suggestedInstansi: instansi || "Universitas Sebelas Maret (UNS)",
      source: "expert_engine",
      resultText: `Sehubungan dengan inisiatif kolaborasi antara sektor teknologi digital dan institusi pendidikan tinggi, kami dari manajemen GetMasjid bermaksud mengajukan permohonan kerja sama kemitraan strategis bersama ${penerima} di ${instansi}.

GetMasjid merupakan platform manajemen masjid terintegrasi yang memudahkan pengurus dalam tata kelola keuangan yang transparan, pelaporan kas real-time, serta sentralisasi informasi dakwah kepada jamaah.

Adapun bentuk sinergi yang kami tawarkan meliputi:
1. Implementasi sistem platform GetMasjid pada masjid-masjid di lingkungan binaan ${instansi}.
2. Program kolaborasi riset, magang mahasiswa, dan pengabdian masyarakat berbasis teknologi informasi.
3. Pelatihan literasi keuangan digital bagi pengurus takmir masjid.
4. Dukungan teknis berkelanjutan serta integrasi layanan dakwah digital.

Kami sangat mengharapkan kesempatan untuk berdiskusi lebih lanjut guna menyusun langkah implementasi nyata yang bermanfaat bagi sivitas akademika dan masyarakat.

Demikian surat permohonan ini kami sampaikan. Atas perhatian dan kerja sama yang baik dari Bapak/Ibu, kami ucapkan terima kasih.`
    };
  }

  // 3. Kasus: Audiensi / Pertemuan Umum
  if (ideaLower.includes("audiensi") || ideaLower.includes("bertemu") || ideaLower.includes("menghadap") || ideaLower.includes("silaturahmi")) {
    return {
      suggestedPerihal: "Permohonan Audiensi dan Silaturahmi",
      suggestedPenerima: penerima,
      suggestedInstansi: instansi,
      source: "expert_engine",
      resultText: `Sehubungan dengan upaya peningkatan sinergi program dan penguatan kemitraan strategis, kami dari manajemen GetMasjid bermaksud untuk mengajukan permohonan audiensi dan silaturahmi bersama ${penerima} beserta jajaran di ${instansi}.

Melalui pertemuan ini, kami bermaksud menyampaikan pemaparan program inovasi digitalisasi masjid serta menjajaki potensi kolaborasi yang dapat memberikan kebermanfaatan luas bagi masyarakat dan seluruh pemangku kepentingan.

Adapun pokok pembahasan yang kami usulkan meliputi:
1. Pemaparan ekosistem platform GetMasjid dalam tata kelola keuangan dan kegiatan masjid yang transparan.
2. Penjajakan skema kemitraan strategis dan integrasi program bersama ${instansi}.
3. Diskusi teknis tindak lanjut rencana implementasi di lapangan.

Besar harapan kami Bapak/Ibu dapat berkenan meluangkan waktu untuk agenda pertemuan tersebut. Terkait waktu dan tempat pelaksanaan, kami siap menyesuaikan dengan jadwal luang yang Bapak/Ibu tentukan.

Demikian surat permohonan ini kami sampaikan. Atas perhatian, perkenan, dan kerja sama yang baik, kami ucapkan terima kasih.`
    };
  }

  // 4. Kasus: Undangan Acara / Workshop
  if (ideaLower.includes("undangan") || ideaLower.includes("acara") || ideaLower.includes("workshop") || ideaLower.includes("seminar") || ideaLower.includes("sosialisasi")) {
    return {
      suggestedPerihal: "Undangan Menghadiri Acara Sosialisasi & Workshop",
      suggestedPenerima: penerima,
      suggestedInstansi: instansi,
      source: "expert_engine",
      resultText: `Dalam rangka sosialisasi penguatan tata kelola masjid berbasis teknologi digital dan peningkatan literasi keuangan takmir, GetMasjid mengundang ${penerima} beserta jajaran pengurus di ${instansi} untuk hadir pada kegiatan:

Acara: Workshop & Sosialisasi Transformasi Digital Manajemen Masjid
Hari/Tanggal: [Isi Hari dan Tanggal]
Waktu: 09.00 WIB s.d. Selesai
Tempat / Media: [Isi Lokasi Gedung / Ruang Rapat / Zoom Meeting]
Agenda Utama: Pemaparan sistem akuntansi masjid modern, transparansi laporan donasi, dan pengelolaan aset digital.

Mengingat pentingnya agenda ini bagi kemajuan pengelolaan masjid yang akuntabel dan profesional, kehadiran Bapak/Ibu sangat kami harapkan.

Demikian undangan ini kami sampaikan. Atas perhatian dan kehadiran Bapak/Ibu, kami haturkan terima kasih.`
    };
  }

  // 5. Kasus: Izin & Rekomendasi
  if (ideaLower.includes("izin") || ideaLower.includes("dispensasi") || ideaLower.includes("rekomendasi") || ideaLower.includes("dukungan")) {
    return {
      suggestedPerihal: "Permohonan Izin dan Dukungan Kegiatan",
      suggestedPenerima: penerima,
      suggestedInstansi: instansi,
      source: "expert_engine",
      resultText: `Sehubungan dengan rencana pelaksanaan program inisiatif digitalisasi masjid dan pelatihan pengurus takmir yang akan diselenggarakan oleh tim GetMasjid, kami mengajukan permohonan izin dan dukungan resmi kepada ${penerima} di ${instansi}.

Program ini bertujuan untuk membekali para pengurus masjid dengan instrumen teknologi modern guna menciptakan sistem pelaporan kas yang transparan, memudahkan penyaluran infak digital, dan memperluas jangkauan dakwah.

Demi kelancaran agenda tersebut, kami memohon perkenan Bapak/Ibu untuk memberikan:
1. Izin pelaksanaan sosialisasi dan koordinasi kepada mitra di bawah naungan ${instansi}.
2. Surat rekomendasi atau dukungan kelembagaan terhadap implementasi program ini.

Kami berkomitmen untuk menjalankan seluruh rangkaian kegiatan dengan tertib, profesional, dan berkoordinasi penuh bersama jajaran Bapak/Ibu.

Demikian surat permohonan ini kami sampaikan. Atas perhatian, arahan, dan dukungan yang Bapak/Ibu berikan, kami ucapkan terima kasih.`
    };
  }

  // 6. Generic Generator tailored to user input
  const cleanIdea = idea.length > 0 ? idea : "kerja sama kemitraan strategis dan implementasi solusi digitalisasi";
  return {
    suggestedPerihal: `Permohonan Kerja Sama Terkait ${capitalizeWords(cleanIdea.slice(0, 40))}`,
    suggestedPenerima: penerima,
    suggestedInstansi: instansi,
    source: "expert_engine",
    resultText: `Sehubungan dengan komitmen GetMasjid dalam mengembangkan ekosistem teknologi yang bermanfaat serta memperluas jaringan kolaborasi institusional, kami menyampaikan permohonan resmi kepada ${penerima} di ${instansi}.

Bersama surat ini, kami bermaksud menindaklanjuti inisiatif kerja sama terkait: ${cleanIdea}.

Adapun ruang lingkup kolaborasi yang kami usulkan meliputi:
1. Sinergi implementasi program dan penyelarasan tujuan bersama tim ${instansi}.
2. Pendampingan teknis serta monitoring berkala guna memastikan seluruh agenda berjalan lancar dan optimal.
3. Evaluasi bersama untuk memaksimalkan dampak positif dan keberlanjutan kerja sama.

Besar harapan kami agar inisiatif kemitraan ini dapat disambut dengan baik sehingga tercipta kolaborasi yang produktif dan saling menguntungkan.

Demikian surat permohonan ini kami sampaikan. Atas perhatian, pertimbangan, dan kerja sama yang baik dari Bapak/Ibu, kami ucapkan terima kasih.`
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

    if (!processed.toLowerCase().includes("sehubungan dengan") && !processed.toLowerCase().includes("dengan hormat")) {
      processed = `Sehubungan dengan permohonan ini, kami bermaksud menyampaikan hal-hal sebagai berikut:\n\n${processed}`;
    }
    if (!processed.toLowerCase().includes("demikian") && !processed.toLowerCase().includes("terima kasih")) {
      processed += `\n\nDemikian surat ini kami sampaikan. Atas perhatian, pertimbangan, dan kerja sama yang baik dari Bapak/Ibu, kami ucapkan terima kasih.`;
    }

    return { resultText: processed, source: "expert_engine" };
  }

  if (action === "fix_grammar") {
    let fixed = text
      .replace(/[ \t]+/g, " ")
      .replace(/\s*([,.:;!?])\s*/g, "$1 ")
      .replace(/\(\s+/g, "(")
      .replace(/\s+\)/g, ")")
      .replace(/(^|[.\n]\s*)([a-z])/g, (_, p1, p2) => p1 + p2.toUpperCase())
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

  return generateLetterLocally(req);
}
