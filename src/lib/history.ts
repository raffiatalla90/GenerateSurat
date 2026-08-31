import { KopSuratConfig, LetterData, SignatureConfig } from "@/types/letter";

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
  return newItem;
}

export function deleteHistoryItem(id: string) {
  const history = loadHistory().filter(h => h.id !== id);
  saveHistory(history);
  return history;
}
