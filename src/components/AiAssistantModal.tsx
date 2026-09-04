"use client";

import { useState } from "react";
import { AiActionType, LetterTone, requestAiAssistant } from "@/lib/ai-assistant";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentIsiSurat: string;
  namaPenerima?: string;
  instansiTujuan?: string;
  perihal?: string;
  onApply: (newIsiSurat: string, suggestedPerihal?: string, suggestedPenerima?: string, suggestedInstansi?: string) => void;
}

export function AiAssistantModal({
  isOpen,
  onClose,
  currentIsiSurat,
  namaPenerima = "",
  instansiTujuan = "",
  perihal = "",
  onApply
}: Props) {
  const [activeTab, setActiveTab] = useState<"ide" | "poles" | "katalog">("ide");
  const [ideaPrompt, setIdeaPrompt] = useState("");
  const [tone, setTone] = useState<LetterTone>("formal_eksekutif");
  const [resultText, setResultText] = useState("");
  const [suggestedPerihal, setSuggestedPerihal] = useState<string | undefined>(undefined);
  const [suggestedPenerima, setSuggestedPenerima] = useState<string | undefined>(undefined);
  const [suggestedInstansi, setSuggestedInstansi] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerateFromIdea = async (customIdea?: string) => {
    const promptToUse = customIdea || ideaPrompt;
    if (!promptToUse.trim()) return;

    setIsLoading(true);
    setCopied(false);
    try {
      const res = await requestAiAssistant({
        action: "generate_from_idea",
        prompt: promptToUse,
        penerima: namaPenerima,
        instansi: instansiTujuan,
        perihal: perihal,
        tone: tone
      });
      setResultText(res.resultText);
      if (res.suggestedPerihal) {
        setSuggestedPerihal(res.suggestedPerihal);
      }
      if (res.suggestedPenerima) {
        setSuggestedPenerima(res.suggestedPenerima);
      }
      if (res.suggestedInstansi) {
        setSuggestedInstansi(res.suggestedInstansi);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnhance = async (action: AiActionType) => {
    const textToEnhance = currentIsiSurat.trim() || resultText.trim();
    if (!textToEnhance) {
      alert("Tuliskan atau pilih teks surat terlebih dahulu untuk diperbaiki.");
      return;
    }

    setIsLoading(true);
    setCopied(false);
    try {
      const res = await requestAiAssistant({
        action: action,
        currentText: textToEnhance,
        penerima: namaPenerima,
        instansi: instansiTujuan,
        perihal: perihal
      });
      setResultText(res.resultText);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!resultText) return;
    navigator.clipboard.writeText(resultText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyToForm = () => {
    if (!resultText) return;
    onApply(resultText, suggestedPerihal, suggestedPenerima, suggestedInstansi);
    onClose();
  };

  const quickIdeas = [
    { title: "Kemitraan UNS", prompt: "Mengajukan kerja sama strategis dengan Universitas Sebelas Maret (UNS) untuk integrasi platform GetMasjid di masjid kampus dan pengabdian masyarakat." },
    { title: "Audiensi Pimpinan", prompt: "Permohonan audiensi dan silaturahmi bersama pimpinan instansi untuk memaparkan solusi inovasi digitalisasi pengelolaan masjid." },
    { title: "Izin & Rekomendasi", prompt: "Permohonan izin dan dukungan kelembagaan untuk menyelenggarakan pelatihan tata kelola kas digital bagi takmir masjid." },
    { title: "Undangan Workshop", prompt: "Mengundang pimpinan dan pengurus masjid untuk hadir pada agenda workshop transformasi digital tata kelola keuangan masjid." },
    { title: "Penawaran Aplikasi", prompt: "Penyampaian proposal penawaran layanan platform digital GetMasjid untuk transparansi pembukuan dan infaq QRIS masjid." }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#FAF9F6] ring-1 ring-black/10 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header Modal */}
        <div className="p-4 sm:p-5 bg-white border-b border-black/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#0f6b4a] to-[#0096D6] text-white grid place-items-center shadow-md shadow-emerald-900/10">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-stone-900">Asisten AI Penulis Surat</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-semibold ring-1 ring-emerald-600/15">
                  GetMasjid AI
                </span>
              </div>
              <p className="text-[11px] text-stone-500">Bantu menyusun, memperhalus, dan mengoreksi kalimat surat dinas resmi.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center text-sm transition"
          >
            ✕
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-4 sm:px-5 pt-3 bg-white border-b border-black/5 flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("ide")}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition ${
              activeTab === "ide"
                ? "border-[#0f6b4a] text-[#0f6b4a]"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            ✨ Tulis Baru dari Ide
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("poles")}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition ${
              activeTab === "poles"
                ? "border-[#0f6b4a] text-[#0f6b4a]"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            ✍️ Poles Teks Aktif
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("katalog")}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition ${
              activeTab === "katalog"
                ? "border-[#0f6b4a] text-[#0f6b4a]"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            📋 Template Cepat
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Tab 1: Tulis dari Ide */}
          {activeTab === "ide" && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Apa pokok ide atau tujuan surat Anda?
                </label>
                <textarea
                  value={ideaPrompt}
                  onChange={(e) => setIdeaPrompt(e.target.value)}
                  placeholder="Contoh: Mau ngajak kerjasama UNS untuk memasang aplikasi GetMasjid di masjid kampus serta program pengabdian masyarakat..."
                  rows={3}
                  className="w-full rounded-2xl bg-white ring-1 ring-black/10 p-3 text-xs sm:text-sm text-stone-800 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-[#0f6b4a]/30 resize-none shadow-sm"
                />
              </div>

              {/* Quick Idea Chips */}
              <div>
                <span className="text-[11px] text-stone-500 block mb-1.5">Contoh ide populer:</span>
                <div className="flex flex-wrap gap-1.5">
                  {quickIdeas.map((qi) => (
                    <button
                      key={qi.title}
                      type="button"
                      onClick={() => {
                        setIdeaPrompt(qi.prompt);
                        handleGenerateFromIdea(qi.prompt);
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-full bg-white ring-1 ring-black/10 hover:bg-stone-50 text-stone-700 font-medium transition"
                    >
                      {qi.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tone Selection */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-600 font-medium">Gaya Bahasa:</span>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value as LetterTone)}
                    className="h-7 px-2 text-xs rounded-lg bg-white ring-1 ring-black/10 text-stone-800 outline-none"
                  >
                    <option value="formal_eksekutif">Formal Eksekutif</option>
                    <option value="persuasif_kemitraan">Persuasif & Ramah</option>
                    <option value="singkat_padat">Singkat & Padat</option>
                  </select>
                </div>

                <button
                  type="button"
                  disabled={isLoading || !ideaPrompt.trim()}
                  onClick={() => handleGenerateFromIdea()}
                  className="h-8 px-4 rounded-full bg-[#0f6b4a] hover:bg-[#0d5a3f] text-white text-xs font-semibold shadow-sm transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isLoading ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Menyusun...</span>
                    </>
                  ) : (
                    <>
                      <span>✨ Susun Draf Surat</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Poles Teks Aktif */}
          {activeTab === "poles" && (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-white ring-1 ring-black/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-700">Teks Surat Saat Ini</span>
                  <span className="text-[10.5px] text-stone-500">
                    {currentIsiSurat ? `${currentIsiSurat.length} karakter` : "Kosong"}
                  </span>
                </div>
                <div className="max-h-[100px] overflow-y-auto text-xs text-stone-600 italic bg-stone-50 p-2.5 rounded-xl border border-black/5">
                  {currentIsiSurat || "(Belum ada teks pada form surat. Anda bisa menulis di form atau membuat baru lewat tab Tulis Baru)."}
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-stone-700 block mb-2">Pilih Aksi Pemolesan AI:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={isLoading || !currentIsiSurat.trim()}
                    onClick={() => handleEnhance("formalize")}
                    className="p-2.5 rounded-xl bg-white ring-1 ring-black/10 hover:bg-stone-50 text-left transition disabled:opacity-50 group"
                  >
                    <div className="text-xs font-bold text-stone-800 group-hover:text-[#0f6b4a]">💎 Perhalus Bahasa Formal</div>
                    <div className="text-[10.5px] text-stone-500">Ubah gaya santai ke bahasa dinas baku</div>
                  </button>

                  <button
                    type="button"
                    disabled={isLoading || !currentIsiSurat.trim()}
                    onClick={() => handleEnhance("fix_grammar")}
                    className="p-2.5 rounded-xl bg-white ring-1 ring-black/10 hover:bg-stone-50 text-left transition disabled:opacity-50 group"
                  >
                    <div className="text-xs font-bold text-stone-800 group-hover:text-[#0f6b4a]">📝 Koreksi EYD & Tata Bahasa</div>
                    <div className="text-[10.5px] text-stone-500">Rapikan huruf kapital, ejaan, & tanda baca</div>
                  </button>

                  <button
                    type="button"
                    disabled={isLoading || !currentIsiSurat.trim()}
                    onClick={() => handleEnhance("expand")}
                    className="p-2.5 rounded-xl bg-white ring-1 ring-black/10 hover:bg-stone-50 text-left transition disabled:opacity-50 group"
                  >
                    <div className="text-xs font-bold text-stone-800 group-hover:text-[#0f6b4a]">📈 Kembangkan Lebih Rinci</div>
                    <div className="text-[10.5px] text-stone-500">Tambahkan poin penjelasan & komitmen</div>
                  </button>

                  <button
                    type="button"
                    disabled={isLoading || !currentIsiSurat.trim()}
                    onClick={() => handleEnhance("summarize")}
                    className="p-2.5 rounded-xl bg-white ring-1 ring-black/10 hover:bg-stone-50 text-left transition disabled:opacity-50 group"
                  >
                    <div className="text-xs font-bold text-stone-800 group-hover:text-[#0f6b4a]">✂️ Persingkat & Padatkan</div>
                    <div className="text-[10.5px] text-stone-500">Buat lebih ringkas to the point</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Template Cepat */}
          {activeTab === "katalog" && (
            <div className="space-y-2">
              <span className="text-xs text-stone-600 font-medium block">
                Pilih format resmi siap pakai:
              </span>
              <div className="space-y-2">
                {quickIdeas.map((qi, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-white ring-1 ring-black/5 flex items-center justify-between hover:ring-black/15 transition gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-stone-800">{qi.title}</div>
                      <div className="text-[11px] text-stone-500 truncate">{qi.prompt}</div>
                    </div>
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleGenerateFromIdea(qi.prompt)}
                      className="h-7 px-3 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] font-semibold shrink-0 transition"
                    >
                      Gunakan
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Output / Draf Hasil AI */}
          <div className="pt-2 border-t border-black/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <span>Draf Hasil Asisten AI</span>
                {resultText && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-normal">
                    Dapat diedit
                  </span>
                )}
              </span>
              {resultText && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="text-[11px] text-stone-600 hover:text-stone-900 flex items-center gap-1 underline"
                  >
                    {copied ? "✓ Tersalin!" : "Salin"}
                  </button>
                </div>
              )}
            </div>

            <textarea
              value={resultText}
              onChange={(e) => setResultText(e.target.value)}
              placeholder="Hasil draf surat buatan AI akan muncul di sini. Anda dapat langsung mengeditnya sebelum menerapkannya ke form..."
              rows={8}
              className="w-full rounded-2xl bg-white ring-1 ring-black/10 p-3.5 text-xs sm:text-sm text-stone-800 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-[#0f6b4a]/30 resize-y shadow-inner leading-relaxed"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-white border-t border-black/5 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition"
          >
            Tutup
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!resultText.trim()}
              onClick={handleApplyToForm}
              className="h-9 px-5 rounded-full bg-[#0f6b4a] hover:bg-[#0d5a3f] text-white text-xs font-bold shadow-md shadow-emerald-900/10 transition active:scale-95 disabled:opacity-40 flex items-center gap-1.5"
            >
              <span>✓ Terapkan ke Form Surat</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
