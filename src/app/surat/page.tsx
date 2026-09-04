"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { generateLetterHTML } from "@/lib/letter-html";
import { DEFAULT_KOP, DEFAULT_SIG } from "@/lib/kop-defaults";
import { LetterData, KopSuratConfig, SignatureConfig } from "@/types/letter";
import { SURAT_TEMPLATES } from "@/lib/letter-templates";

function SuratContent() {
  const searchParams = useSearchParams();

  // Ambil parameter dari query URL jika ada
  const nomorSurat = searchParams.get("nomorSurat") || "001/GMJ/09/2026";
  const namaPenerima = searchParams.get("namaPenerima") || "Bapak Kepala DKM";
  const instansiTujuan = searchParams.get("instansiTujuan") || "Masjid Al-Ikhlas Jakarta Selatan";
  const alamatPenerima = searchParams.get("alamatPenerima") || "Jl. Melati No. 12, Kebayoran Baru, Jakarta Selatan 12130";
  const perihal = searchParams.get("perihal") || "Kerja Sama";
  const perihalCustom = searchParams.get("perihalCustom") || undefined;
  const isiSurat = searchParams.get("isiSurat") || SURAT_TEMPLATES["Kerja Sama"];
  const tanggal = searchParams.get("tanggal") || new Date().toISOString().slice(0, 10);
  const namaPenandatangan = searchParams.get("namaPenandatangan") || "Raffi Atalla Natha Atmaja";
  const jabatan = searchParams.get("jabatan") || "CEO GetMasjid";
  const template = (searchParams.get("template") as "default" | "uns_colored_v1") || "uns_colored_v1";

  const data: LetterData = {
    nomorSurat,
    namaPenerima,
    instansiTujuan,
    alamatPenerima,
    perihal,
    perihalCustom,
    isiSurat,
    tanggal,
    namaPenandatangan,
    jabatan,
    signers: [
      {
        nama: namaPenandatangan,
        jabatan,
        showSignature: true,
        showStamp: true,
      },
    ],
  };

  const kop: KopSuratConfig = {
    ...DEFAULT_KOP,
    template,
  };

  const sig: SignatureConfig = {
    ...DEFAULT_SIG,
  };

  const html = generateLetterHTML(data, kop, sig);

  return (
    <div
      dangerouslySetInnerHTML={{ __html: html }}
      className="w-full min-h-screen bg-white"
    />
  );
}

export default function SuratPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-stone-500">Memuat template surat...</div>}>
      <SuratContent />
    </Suspense>
  );
}
