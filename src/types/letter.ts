export type PerihalOption =
  | "Kerja Sama"
  | "Pengajuan"
  | "Undangan"
  | "Penawaran"
  | "Pemberitahuan"
  | "Permohonan"
  | "Custom";

export interface Signer {
  nama: string;
  jabatan: string;
  signatureImage?: string;
  showSignature: boolean;
  showStamp: boolean;
}

export interface LetterData {
  nomorSurat: string;
  namaPenerima: string;
  instansiTujuan: string;
  alamatPenerima?: string;
  perihal: string;
  perihalCustom?: string;
  isiSurat: string;
  tanggal: string; // YYYY-MM-DD
  namaPenandatangan: string;
  jabatan: string;
  attachments?: string[];
  signers?: Signer[];
}

export interface LetterFormData extends Omit<LetterData, "nomorSurat"> {
  perihalOption: PerihalOption;
}

export type KopTemplateType = "default" | "uns_colored_v1";

export interface KopSuratConfig {
  template?: KopTemplateType; // "default" | "uns_colored_v1"
  logoText: string; // fallback jika tidak ada logo image, ex: GM
  logoImage?: string; // base64 dataURL (Logo GetMasjid)
  unsLogoImage?: string; // base64 dataURL (Logo Mitra / UNS)
  logoScale?: number; // 0.5 - 2.5 (default 1)
  logoOffsetX?: number; // -60 - 60 px
  logoOffsetY?: number; // -30 - 30 px
  unsLogoScale?: number; // 0.5 - 2.5 (default 1)
  unsLogoOffsetX?: number; // -60 - 60 px
  unsLogoOffsetY?: number; // -30 - 30 px
  companyName: string; // GetMasjid
  legalName: string; // PT GetMasjid Digital Indonesia
  tagline: string; // Platform Digital...
  subTagline: string; // Mendigitalisasi...
  alamat: string;
  email: string;
  website: string;
  phone: string;
  accentColor: string; // hex, default #0f6b4a
}

export interface SignatureConfig {
  signatureImage?: string; // base64 dataURL
  stampImage?: string; // base64 dataURL
  showSignature: boolean;
  showStamp: boolean;
  signatureScale: number; // 0.8 - 1.4
  stampOpacity: number; // 0.7 - 1
}

export interface GeneratePdfPayload extends Partial<LetterData> {
  kopConfig?: KopSuratConfig;
  signatureConfig?: SignatureConfig;
  html?: string;
  url?: string;
  filename?: string;
}

