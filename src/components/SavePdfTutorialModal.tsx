"use client";

import { useState } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function SavePdfTutorialModal({ isOpen, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<"ios" | "desktop" | "android">("ios");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl ring-1 ring-black/10 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-emerald-800 to-[#0f6b4a] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-white/15 flex items-center justify-center text-lg shadow-inner">
              🖨️
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Panduan Simpan PDF via Menu Cetak</h3>
              <p className="text-xs text-emerald-100 mt-0.5">Hasil 100% vektor tajam, ukuran A4 presisi, & bebas watermark domain</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition active:scale-95"
          >
            ✕
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-2 p-2 bg-stone-100 border-b border-stone-200 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("ios")}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition ${
              activeTab === "ios"
                ? "bg-white text-stone-900 shadow-sm ring-1 ring-black/5"
                : "text-stone-600 hover:text-stone-900 hover:bg-white/50"
            }`}
          >
            <span>🍎</span>
            <span>iPhone / iPad (iOS)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("desktop")}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition ${
              activeTab === "desktop"
                ? "bg-white text-stone-900 shadow-sm ring-1 ring-black/5"
                : "text-stone-600 hover:text-stone-900 hover:bg-white/50"
            }`}
          >
            <span>💻</span>
            <span>Laptop / Komputer</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("android")}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition ${
              activeTab === "android"
                ? "bg-white text-stone-900 shadow-sm ring-1 ring-black/5"
                : "text-stone-600 hover:text-stone-900 hover:bg-white/50"
            }`}
          >
            <span>🤖</span>
            <span>HP Android</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-stone-800 text-xs sm:text-sm leading-relaxed">
          {activeTab === "ios" && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600/20 text-xs leading-relaxed flex items-start gap-2.5">
                <span className="text-base leading-none">💡</span>
                <div>
                  <strong>Cara Terbaik di iPhone:</strong> Menggunakan menu <b>Cetak</b> menghasilkan file PDF beresolusi vektor tinggi yang teksnya bisa di-copy dan logo tidak buram.
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex gap-3 items-start p-3 rounded-2xl bg-stone-50 ring-1 ring-black/5">
                  <div className="w-6 h-6 rounded-full bg-[#0f6b4a] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-stone-900">Klik tombol "Cetak" di atas dokumen</p>
                    <p className="text-stone-500 text-[11.5px] mt-0.5">Lembar pratinjau cetak (*Print Options*) bawaan iOS Safari akan terbuka.</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start p-3 rounded-2xl bg-stone-50 ring-1 ring-black/5">
                  <div className="w-6 h-6 rounded-full bg-[#0f6b4a] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-stone-900">Pilih Metode Simpan (Pilih salah satu):</p>
                    <div className="mt-2 space-y-2 text-[11.5px]">
                      <div className="p-2.5 rounded-xl bg-white ring-1 ring-black/5">
                        <span className="font-bold text-emerald-800">Metode A (Ikon Share):</span>
                        <p className="text-stone-600 mt-0.5">Klik ikon <b>Bagikan (Share)</b> di pojok kanan atas lembar cetak ➡️ pilih <b>"Simpan ke File" (Save to Files)</b> ➡️ pilih folder (iCloud / Di iPhone Saya) ➡️ klik <b>Simpan</b>.</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white ring-1 ring-black/5">
                        <span className="font-bold text-emerald-800">Metode B (Pinch to Zoom):</span>
                        <p className="text-stone-600 mt-0.5">Lakukan cubitan melebar (*zoom out*) dengan dua jari pada gambar halaman surat ➡️ surat akan terbuka sebagai PDF layar penuh ➡️ klik tombol Share di pojok bawah ➡️ <b>Simpan ke File</b>.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 items-start p-3 rounded-2xl bg-stone-50 ring-1 ring-black/5">
                  <div className="w-6 h-6 rounded-full bg-[#0f6b4a] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-stone-900">Selesai!</p>
                    <p className="text-stone-500 text-[11.5px] mt-0.5">Dokumen surat PDF resmi telah tersimpan rapi di aplikasi <b>Files (File)</b> iPhone Anda dan siap dikirim via WhatsApp/Email.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "desktop" && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-blue-50 text-blue-900 ring-1 ring-blue-600/20 text-xs leading-relaxed flex items-start gap-2.5">
                <span className="text-base leading-none">🖥️</span>
                <div>
                  <strong>Setelan Cetak Sempurna di Laptop / Komputer:</strong> Pastikan opsi <i>Background Graphics</i> dicentang agar garis warna dan background kop tampil penuh.
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex gap-3 items-start p-3 rounded-2xl bg-stone-50 ring-1 ring-black/5">
                  <div className="w-6 h-6 rounded-full bg-[#0f6b4a] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-stone-900">Klik tombol "Cetak" (atau tekan Ctrl + P / Cmd + P)</p>
                    <p className="text-stone-500 text-[11.5px] mt-0.5">Jendela print dialog browser akan muncul.</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start p-3 rounded-2xl bg-stone-50 ring-1 ring-black/5">
                  <div className="w-6 h-6 rounded-full bg-[#0f6b4a] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="w-full">
                    <p className="font-semibold text-stone-900">Sesuaikan Opsi Cetak:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-[11.5px]">
                      <div className="p-2 rounded-xl bg-white ring-1 ring-black/5">
                        <span className="font-bold text-stone-700">Tujuan / Destination:</span>
                        <p className="text-emerald-700 font-semibold">Simpan sebagai PDF (Save as PDF)</p>
                      </div>
                      <div className="p-2 rounded-xl bg-white ring-1 ring-black/5">
                        <span className="font-bold text-stone-700">Ukuran Kertas:</span>
                        <p className="text-emerald-700 font-semibold">A4</p>
                      </div>
                      <div className="p-2 rounded-xl bg-white ring-1 ring-black/5">
                        <span className="font-bold text-stone-700">Grafik Latar Belakang:</span>
                        <p className="text-emerald-700 font-semibold">✓ Centang (Aktif)</p>
                      </div>
                      <div className="p-2 rounded-xl bg-white ring-1 ring-black/5">
                        <span className="font-bold text-stone-700">Header & Footer:</span>
                        <p className="text-stone-600 font-semibold">✕ Hilangkan Centang (Nonaktif)</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 items-start p-3 rounded-2xl bg-stone-50 ring-1 ring-black/5">
                  <div className="w-6 h-6 rounded-full bg-[#0f6b4a] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-stone-900">Klik "Simpan" (Save)</p>
                    <p className="text-stone-500 text-[11.5px] mt-0.5">Pilih folder penyimpanan di komputer Anda.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "android" && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-900 ring-1 ring-amber-600/20 text-xs leading-relaxed flex items-start gap-2.5">
                <span className="text-base leading-none">📱</span>
                <div>
                  <strong>Panduan HP Android (Chrome):</strong> Mudah dan cepat melalui menu cetak sistem Android.
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex gap-3 items-start p-3 rounded-2xl bg-stone-50 ring-1 ring-black/5">
                  <div className="w-6 h-6 rounded-full bg-[#0f6b4a] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-stone-900">Klik tombol "Cetak"</p>
                    <p className="text-stone-500 text-[11.5px] mt-0.5">Layar pratinjau cetak sistem Android akan terbuka.</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start p-3 rounded-2xl bg-stone-50 ring-1 ring-black/5">
                  <div className="w-6 h-6 rounded-full bg-[#0f6b4a] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-stone-900">Pilih "Simpan sebagai PDF"</p>
                    <p className="text-stone-500 text-[11.5px] mt-0.5">Di bagian atas, pastikan printer dipilih ke <b>Simpan sebagai PDF (Save as PDF)</b>.</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start p-3 rounded-2xl bg-stone-50 ring-1 ring-black/5">
                  <div className="w-6 h-6 rounded-full bg-[#0f6b4a] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-stone-900">Klik Ikon PDF Kuning/Biru & Simpan</p>
                    <p className="text-stone-500 text-[11.5px] mt-0.5">Pilih folder penyimpanan di memori HP Anda (misal: folder *Download*) lalu klik <b>Simpan</b>.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <div className="px-5 sm:px-6 py-3.5 bg-stone-50 border-t border-stone-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-stone-500">GetMasjid Surat Resmi • Standar Dokumen A4</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition active:scale-95 shadow-sm"
          >
            Mengerti & Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
