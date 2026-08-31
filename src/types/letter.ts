export type PerihalOption =
  | "Kerja Sama"
  | "Pengajuan"
  | "Undangan"
  | "Penawaran"
  | "Pemberitahuan"
  | "Permohonan"
  | "Custom";

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
}

export interface LetterFormData extends Omit<LetterData, "nomorSurat"> {
  perihalOption: PerihalOption;
}

export interface KopSuratConfig {
  logoText: string; // fallback jika tidak ada logo image, ex: GM
  logoImage?: string; // base64 dataURL
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

export interface GeneratePdfPayload extends LetterData {
  kopConfig?: KopSuratConfig;
  signatureConfig?: SignatureConfig;
}
