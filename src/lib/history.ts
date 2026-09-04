import { KopSuratConfig, LetterData, SignatureConfig } from "@/types/letter";
import {
  loadNumberRegistry,
  registerDocumentNumber,
  deleteRegistryByNomorSurat,
  saveNumberRegistry,
} from "./letter-number-registry";

export interface HistoryItem {
  id: string;
  nomorSurat: string;
  data: LetterData;
  kopConfig: KopSuratConfig;
  signatureConfig: SignatureConfig;
  createdAt: string; // ISO
  perihal: string;
  tujuan: string;
  penerima: string;
}

const KEY = "getmasjid_history_v1";

export function loadHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as HistoryItem[];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

export function saveHistory(items: HistoryItem[]) {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
}

export function addHistoryItem(item: Omit<HistoryItem, "id" | "createdAt">): HistoryItem {
  const history = loadHistory();
  const newItem: HistoryItem = {
    ...item,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
  };
  const updated = [newItem, ...history].slice(0, 50);
  saveHistory(updated);

  // Otomatis catat ke buku registrasi nomor jika belum tercatat
  try {
    const registry = loadNumberRegistry();
    const existing = registry.find((r) => r.nomorSurat === newItem.nomorSurat);
    if (!existing) {
      // Parse sequence number from nomorSurat (misal: "002/GMJ/09/2026" -> 2)
      const parts = newItem.nomorSurat.split("/");
      const parsedSeq = parseInt(parts[0], 10);
      const seq = isNaN(parsedSeq) ? undefined : parsedSeq;

      registerDocumentNumber({
        category: "Surat Resmi",
        categoryCode: "GMJ",
        perihal: newItem.perihal || newItem.data.perihal || "Surat Resmi",
        penerima: newItem.penerima || newItem.data.namaPenerima || "",
        instansi: newItem.tujuan || newItem.data.instansiTujuan || "",
        tanggal: newItem.data.tanggal,
        pembuat: newItem.data.namaPenandatangan || "Raffi Atalla Natha Atmaja",
        source: "letter_generator",
        letterHistoryId: newItem.id,
        customSequence: seq,
      });
    } else if (!existing.letterHistoryId) {
      existing.letterHistoryId = newItem.id;
      saveNumberRegistry(registry);
    }
  } catch (err) {
    console.warn("Gagal sinkronisasi nomor surat ke registry:", err);
  }

  return newItem;
}

export function deleteHistoryItem(id: string) {
  const history = loadHistory();
  const target = history.find((h) => h.id === id);
  const remaining = history.filter((h) => h.id !== id);
  saveHistory(remaining);

  // Saat surat dihapus, otomatis bebaskan / hapus dari registry nomor agar nomor kembali tersedia (didaur ulang)
  if (target?.nomorSurat) {
    try {
      deleteRegistryByNomorSurat(target.nomorSurat);
    } catch (err) {
      console.warn("Gagal menghapus nomor surat dari registry:", err);
    }
  }

  return remaining;
}
