"use client";

import { KopSuratConfig, LetterData, SignatureConfig } from "@/types/letter";
import { generateLetterHTML } from "@/lib/letter-html";

export function LetterPreview({ data, kop, sig }: { data: LetterData; kop?: KopSuratConfig; sig?: SignatureConfig }) {
  const html = generateLetterHTML(data, kop, sig);
  return (
    <div className="p-1.5 rounded-[2rem] bg-black/[0.04] ring-1 ring-black/5">
      <div className="rounded-[calc(2rem-0.375rem)] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_20px_60px_rgba(0,0,0,0.07)] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4">
          <span className="text-[10px] tracking-[0.16em] uppercase font-medium text-stone-500">Preview Surat</span>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#FDFBF7] ring-1 ring-black/5 text-stone-700 font-mono">{data.nomorSurat}</span>
        </div>
        <div className="mx-2 mb-2 rounded-[1.25rem] overflow-hidden ring-1 ring-black/5 bg-[#FDFBF7]">
          <iframe title="Preview Surat" srcDoc={html} className="w-full h-[720px] md:h-[820px] border-0 bg-white" sandbox="allow-same-origin" />
        </div>
        <p className="text-[11px] text-stone-500 text-center px-6 pb-4">Preview real-time • Dokumen tercetak rapi A4</p>
      </div>
    </div>
  );
}
