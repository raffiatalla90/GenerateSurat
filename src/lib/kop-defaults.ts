import { KopSuratConfig, SignatureConfig } from "@/types/letter";

export const DEFAULT_KOP: KopSuratConfig = {
  logoText: "GM",
  logoImage: undefined,
  companyName: "GetMasjid",
  legalName: "PT GetMasjid Digital Indonesia",
  tagline: "Platform Digital Manajemen Masjid Terpadu",
  subTagline: "Mendigitalisasi Masjid Indonesia",
  alamat: "Jl. Teknologi No. 88, Jakarta Selatan",
  email: "hello@getmasjid.id",
  website: "www.getmasjid.id",
  phone: "+62 812-3456-7890",
  accentColor: "#0f6b4a",
};

export const DEFAULT_SIG: SignatureConfig = {
  signatureImage: undefined,
  stampImage: undefined,
  showSignature: true,
  showStamp: true,
  signatureScale: 1,
  stampOpacity: 0.85,
};

export const KOP_STORAGE_KEY = "getmasjid_kop_config";
export const SIG_STORAGE_KEY = "getmasjid_sig_config";

export function loadKopConfig(): KopSuratConfig {
  if (typeof window === "undefined") return DEFAULT_KOP;
  try {
    const raw = localStorage.getItem(KOP_STORAGE_KEY);
    if (raw) return { ...DEFAULT_KOP, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_KOP;
}

export function loadSigConfig(): SignatureConfig {
  if (typeof window === "undefined") return DEFAULT_SIG;
  try {
    const raw = localStorage.getItem(SIG_STORAGE_KEY);
    if (raw) return { ...DEFAULT_SIG, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_SIG;
}

export function saveKopConfig(c: KopSuratConfig) {
  try {
    localStorage.setItem(KOP_STORAGE_KEY, JSON.stringify(c));
  } catch {}
}
export function saveSigConfig(c: SignatureConfig) {
  try {
    localStorage.setItem(SIG_STORAGE_KEY, JSON.stringify(c));
  } catch {}
}
