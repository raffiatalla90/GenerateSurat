export type DocCategory =
  | "Surat Resmi"
  | "Sertifikat"
  | "Surat Keputusan (SK)"
  | "Surat Keterangan (SKET)"
  | "Surat Tugas (ST)"
  | "MoU / Kerja Sama"
  | "Custom";

export interface CategoryDefinition {
  label: DocCategory;
  code: string;
  prefixPattern: string; // e.g., "{NUM}/{CODE}/{MM}/{YYYY}"
  icon: string;
  description: string;
}

export const CATEGORY_DEFINITIONS: Record<DocCategory, CategoryDefinition> = {
  "Surat Resmi": {
    label: "Surat Resmi",
    code: "GMJ",
    prefixPattern: "{NUM}/GMJ/{MM}/{YYYY}",
    icon: "📑",
    description: "Surat dinas resmi keluar GetMasjid ke pihak eksternal",
  },
  "Sertifikat": {
    label: "Sertifikat",
    code: "SERT",
    prefixPattern: "{NUM}/SERT/GMJ/{MM}/{YYYY}",
    icon: "📜",
    description: "Sertifikat pemateri, peserta webinar, apresiasi & piagam",
  },
  "Surat Keputusan (SK)": {
    label: "Surat Keputusan (SK)",
    code: "SK",
    prefixPattern: "{NUM}/SK/GMJ/{MM}/{YYYY}",
    icon: "⚖️",
    description: "Surat keputusan kepengurusan, legalitas, atau penetapan kebijakan",
  },
  "Surat Keterangan (SKET)": {
    label: "Surat Keterangan (SKET)",
    code: "SKET",
    prefixPattern: "{NUM}/SKET/GMJ/{MM}/{YYYY}",
    icon: "📋",
    description: "Surat keterangan aktif, rekomendasi, atau keterangan mitra",
  },
  "Surat Tugas (ST)": {
    label: "Surat Tugas (ST)",
    code: "ST",
    prefixPattern: "{NUM}/ST/GMJ/{MM}/{YYYY}",
    icon: "🎯",
    description: "Surat penugasan personil / perwakilan resmi di lapangan",
  },
  "MoU / Kerja Sama": {
    label: "MoU / Kerja Sama",
    code: "MOU",
    prefixPattern: "{NUM}/MOU/GMJ/{MM}/{YYYY}",
    icon: "🤝",
    description: "Nota kesepahaman atau perjanjian kemitraan resmi",
  },
  "Custom": {
    label: "Custom",
    code: "DOC",
    prefixPattern: "{NUM}/DOC/{MM}/{YYYY}",
    icon: "⚙️",
    description: "Format penomoran dokumen kustom sesuai kebutuhan",
  },
};

export interface NumberRegistryItem {
  id: string;
  nomorSurat: string;
  sequenceNumber: number;
  category: DocCategory;
  categoryCode: string;
  perihal: string; // "Untuk apa"
  penerima: string; // "Untuk siapa"
  instansi?: string; // Instansi tujuan/terkait
  tanggal: string; // YYYY-MM-DD
  pembuat: string; // Penanggung jawab pembuat nomor
  catatan?: string; // Keterangan tambahan
  source: "letter_generator" | "standalone_registry";
  letterHistoryId?: string; // ID jika terhubung dengan simpanan di HistoryPanel
  createdAt: string; // ISO
  isRecycled?: boolean; // Flag jika nomor ini hasil daur ulang slot kosong
}

const REGISTRY_KEY = "getmasjid_number_registry_v1";

/**
 * Load all items from localStorage
 */
export function loadNumberRegistry(): NumberRegistryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(REGISTRY_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as NumberRegistryItem[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

/**
 * Save items to localStorage
 */
export function saveNumberRegistry(items: NumberRegistryItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(items));
  } catch {}
}

/**
 * Extract sequence, month, year from date string (YYYY-MM-DD)
 */
export function parseDateComponents(dateStr?: string) {
  const d = dateStr ? new Date(dateStr) : new Date();
  const validDate = isNaN(d.getTime()) ? new Date() : d;
  const mm = String(validDate.getMonth() + 1).padStart(2, "0");
  const yyyy = String(validDate.getFullYear());
  return { mm, yyyy };
}

/**
 * Calculate active numbers and identify gaps (recycled / returned numbers)
 */
export function getSequenceAnalysis(categoryCode: string, dateStr?: string) {
  const { yyyy } = parseDateComponents(dateStr);
  const allItems = loadNumberRegistry();

  // Filter items in the same category code and year
  const filtered = allItems.filter((item) => {
    const itemYear = parseDateComponents(item.tanggal).yyyy;
    return (
      item.categoryCode.toUpperCase() === categoryCode.toUpperCase() &&
      itemYear === yyyy
    );
  });

  const activeSequences = new Set<number>(filtered.map((item) => item.sequenceNumber));
  const maxSeq = filtered.length > 0 ? Math.max(...filtered.map((i) => i.sequenceNumber)) : 0;

  // Find all missing positive integers between 1 and maxSeq (gaps)
  const gaps: number[] = [];
  for (let i = 1; i < maxSeq; i++) {
    if (!activeSequences.has(i)) {
      gaps.push(i);
    }
  }

  // Next natural sequential number (if no gaps)
  const nextNatural = maxSeq + 1;

  // Best next sequence: smallest available gap, or nextNatural
  const recommendedSeq = gaps.length > 0 ? gaps[0] : nextNatural;
  const isRecycledSlot = gaps.length > 0;

  return {
    activeCount: filtered.length,
    maxSequence: maxSeq,
    gaps,
    nextNatural,
    recommendedSeq,
    isRecycledSlot,
  };
}

/**
 * Build the formatted document number string
 */
export function formatDocumentNumber(
  sequence: number,
  categoryCode: string,
  dateStr?: string,
  customCodeOverride?: string
): string {
  const { mm, yyyy } = parseDateComponents(dateStr);
  const numStr = String(sequence).padStart(3, "0");
  const code = (customCodeOverride || categoryCode).toUpperCase().trim();

  if (code === "GMJ") {
    return `${numStr}/GMJ/${mm}/${yyyy}`;
  }
  return `${numStr}/${code}/GMJ/${mm}/${yyyy}`;
}

/**
 * Register a new document number in the registry
 */
export function registerDocumentNumber(params: {
  category: DocCategory;
  categoryCode?: string;
  perihal: string;
  penerima: string;
  instansi?: string;
  tanggal?: string;
  pembuat?: string;
  catatan?: string;
  source?: "letter_generator" | "standalone_registry";
  letterHistoryId?: string;
  customSequence?: number;
}): NumberRegistryItem {
  const allItems = loadNumberRegistry();
  const dateStr = params.tanggal || new Date().toISOString().slice(0, 10);
  const catDef = CATEGORY_DEFINITIONS[params.category] || CATEGORY_DEFINITIONS["Custom"];
  const code = params.categoryCode || catDef.code;

  let seq = params.customSequence;
  let isRecycled = false;

  if (seq === undefined || seq === null) {
    const analysis = getSequenceAnalysis(code, dateStr);
    seq = analysis.recommendedSeq;
    isRecycled = analysis.isRecycledSlot;
  } else {
    // Check if the explicitly selected sequence is a gap / recycled number
    const analysis = getSequenceAnalysis(code, dateStr);
    isRecycled = analysis.gaps.includes(seq);
  }

  const nomorSurat = formatDocumentNumber(seq, code, dateStr);

  const newItem: NumberRegistryItem = {
    id: `reg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    nomorSurat,
    sequenceNumber: seq,
    category: params.category,
    categoryCode: code,
    perihal: params.perihal.trim(),
    penerima: params.penerima.trim(),
    instansi: params.instansi?.trim() || "",
    tanggal: dateStr,
    pembuat: params.pembuat?.trim() || "Admin GetMasjid",
    catatan: params.catatan?.trim() || "",
    source: params.source || "standalone_registry",
    letterHistoryId: params.letterHistoryId,
    createdAt: new Date().toISOString(),
    isRecycled,
  };

  // Add and persist
  const updated = [newItem, ...allItems];
  saveNumberRegistry(updated);

  return newItem;
}

/**
 * Delete an item by ID — this releases its sequence number back to the recycled pool!
 */
export function deleteNumberRegistryItem(id: string): {
  deletedItem?: NumberRegistryItem;
  remaining: NumberRegistryItem[];
} {
  const allItems = loadNumberRegistry();
  const target = allItems.find((i) => i.id === id);
  const remaining = allItems.filter((i) => i.id !== id);
  saveNumberRegistry(remaining);
  return { deletedItem: target, remaining };
}

/**
 * Delete registry item by full nomorSurat
 */
export function deleteRegistryByNomorSurat(nomorSurat: string): {
  deletedItem?: NumberRegistryItem;
  remaining: NumberRegistryItem[];
} {
  const allItems = loadNumberRegistry();
  const target = allItems.find((i) => i.nomorSurat === nomorSurat);
  const remaining = allItems.filter((i) => i.nomorSurat !== nomorSurat);
  saveNumberRegistry(remaining);
  return { deletedItem: target, remaining };
}

/**
 * Batch register numbers (e.g. for generating 10 certificate numbers for participants)
 */
export function batchRegisterDocumentNumbers(params: {
  category: DocCategory;
  categoryCode?: string;
  perihal: string;
  recipients: Array<{ penerima: string; instansi?: string; catatan?: string }>;
  tanggal?: string;
  pembuat?: string;
}): NumberRegistryItem[] {
  const dateStr = params.tanggal || new Date().toISOString().slice(0, 10);
  const catDef = CATEGORY_DEFINITIONS[params.category] || CATEGORY_DEFINITIONS["Custom"];
  const code = params.categoryCode || catDef.code;
  const pembuat = params.pembuat || "Admin GetMasjid";

  const results: NumberRegistryItem[] = [];

  for (const r of params.recipients) {
    if (!r.penerima.trim()) continue;
    const item = registerDocumentNumber({
      category: params.category,
      categoryCode: code,
      perihal: params.perihal,
      penerima: r.penerima,
      instansi: r.instansi,
      tanggal: dateStr,
      pembuat,
      catatan: r.catatan,
      source: "standalone_registry",
    });
    results.push(item);
  }

  return results;
}

/**
 * Convert registry items to CSV string for downloading
 */
export function exportRegistryToCSV(items: NumberRegistryItem[]): string {
  const headers = [
    "Nomor Surat",
    "Kategori",
    "Kode",
    "Perihal (Untuk Apa)",
    "Penerima (Untuk Siapa)",
    "Instansi",
    "Tanggal Surat",
    "Pembuat",
    "Catatan",
    "Tanggal Dibuat",
    "Status Daur Ulang",
  ];

  const rows = items.map((i) => [
    `"${i.nomorSurat.replace(/"/g, '""')}"`,
    `"${i.category.replace(/"/g, '""')}"`,
    `"${i.categoryCode.replace(/"/g, '""')}"`,
    `"${i.perihal.replace(/"/g, '""')}"`,
    `"${i.penerima.replace(/"/g, '""')}"`,
    `"${(i.instansi || "").replace(/"/g, '""')}"`,
    `"${i.tanggal}"`,
    `"${i.pembuat.replace(/"/g, '""')}"`,
    `"${(i.catatan || "").replace(/"/g, '""')}"`,
    `"${new Date(i.createdAt).toLocaleString("id-ID")}"`,
    i.isRecycled ? `"Daur Ulang"` : `"Baru"`,
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}
