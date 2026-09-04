import { KopSuratConfig, SignatureConfig } from "@/types/letter";
import { GETMASJID_LOGO_SVG, UNS_LOGO_SVG } from "./uns-logos";

export const DEFAULT_KOP: KopSuratConfig = {
  template: "uns_colored_v1",
  logoText: "GM",
  logoImage: GETMASJID_LOGO_SVG,
  unsLogoImage: UNS_LOGO_SVG,
  unsLogoScale: 1.0,
  unsLogoOffsetX: -16,
  unsLogoOffsetY: -1,
  logoScale: 1.2,
  logoOffsetX: 18,
  logoOffsetY: -2,
  companyName: "GetMasjid",
  legalName: "",
  tagline: "Temukan dan Terhubung Ke Masjid",
  subTagline: "Platform Manajemen dan Komunitas Masjid Modern",
  alamat: "Jalan Ir. Sutami No. 36 A Kentingan, Jebres, Surakarta 57126",
  email: "support@getmasjid.com",
  website: "www.getmasjid.com",
  phone: "+62 851-8813-9451",
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
    if (raw) {
      const parsed = JSON.parse(raw);
      return { 
        ...DEFAULT_KOP, 
        ...parsed,
        // Pastikan asset logo baku menggunakan versi HD transparan terbaru jika belum diubah
        logoImage: GETMASJID_LOGO_SVG,
        unsLogoImage: UNS_LOGO_SVG,
        // Paksa nilai brand name, tagline, alamat, email, telepon, dan website tetap terkunci
        companyName: DEFAULT_KOP.companyName,
        tagline: DEFAULT_KOP.tagline,
        website: DEFAULT_KOP.website,
        alamat: DEFAULT_KOP.alamat,
        email: DEFAULT_KOP.email,
        phone: DEFAULT_KOP.phone,
      };
    }
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
