"use client";

import { useState, useEffect, useMemo } from "react";
import {
  DocCategory,
  CATEGORY_DEFINITIONS,
  NumberRegistryItem,
  loadNumberRegistry,
  registerDocumentNumber,
  deleteNumberRegistryItem,
  batchRegisterDocumentNumbers,
  getSequenceAnalysis,
  formatDocumentNumber,
  exportRegistryToCSV,
} from "@/lib/letter-number-registry";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApplyToLetter?: (nomorSurat: string, data?: { perihal?: string; penerima?: string; instansi?: string }) => void;
  defaultCategory?: DocCategory;
}

export function DocumentNumberModal({ isOpen, onClose, onApplyToLetter, defaultCategory = "Sertifikat" }: Props) {
  const [activeTab, setActiveTab] = useState<"generate" | "registry">("generate");
  const [category, setCategory] = useState<DocCategory>(defaultCategory);
  const [customCode, setCustomCode] = useState("");
  const [perihal, setPerihal] = useState("");
  const [penerima, setPenerima] = useState("");
  const [instansi, setInstansi] = useState("");
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().slice(0, 10));
  const [pembuat, setPembuat] = useState("Raffi Atalla Natha Atmaja");
  const [catatan, setCatatan] = useState("");
  
  // Batch Mode for certificates / multiple numbers
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [batchNames, setBatchNames] = useState("");

  // Registry state
  const [registryItems, setRegistryItems] = useState<NumberRegistryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useState<NumberRegistryItem | NumberRegistryItem[] | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setRegistryItems(loadNumberRegistry());
      setLastGenerated(null);
    }
  }, [isOpen]);

  const catDef = CATEGORY_DEFINITIONS[category] || CATEGORY_DEFINITIONS["Custom"];
  const currentCode = category === "Custom" ? (customCode.trim() || "DOC") : catDef.code;

  // Analysis of current sequence & recycled slots
  const sequenceAnalysis = useMemo(() => {
    return getSequenceAnalysis(currentCode, tanggal);
  }, [currentCode, tanggal, registryItems]);

  const previewFormattedNumber = useMemo(() => {
    return formatDocumentNumber(sequenceAnalysis.recommendedSeq, currentCode, tanggal);
  }, [sequenceAnalysis.recommendedSeq, currentCode, tanggal]);

  const showToastNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToastNotice(`Nomor disalin: ${text}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleGenerateSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!perihal.trim()) {
      alert("Mohon masukkan Perihal / Tujuan Dokumen (untuk apa nomor ini digunakan).");
      return;
    }
    if (!penerima.trim()) {
      alert("Mohon masukkan Nama Penerima / Pihak Terkait (untuk siapa dokumen ini).");
      return;
    }

    const newItem = registerDocumentNumber({
      category,
      categoryCode: currentCode,
      perihal,
      penerima,
      instansi,
      tanggal,
      pembuat,
      catatan,
      source: "standalone_registry",
    });

    const updated = loadNumberRegistry();
    setRegistryItems(updated);
    setLastGenerated(newItem);

    if (newItem.isRecycled) {
      showToastNotice(`Berhasil generate nomor daur ulang: ${newItem.nomorSurat}`);
    } else {
      showToastNotice(`Nomor berhasil digenerate: ${newItem.nomorSurat}`);
    }
  };

  const handleGenerateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!perihal.trim()) {
      alert("Mohon masukkan Perihal / Nama Acara Dokumen.");
      return;
    }
    const lines = batchNames.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      alert("Mohon masukkan setidaknya 1 nama penerima (1 nama per baris).");
      return;
    }

    const recipients = lines.map((name) => ({
      penerima: name,
      instansi,
      catatan,
    }));

    const results = batchRegisterDocumentNumbers({
      category,
      categoryCode: currentCode,
      perihal,
      recipients,
      tanggal,
      pembuat,
    });

    const updated = loadNumberRegistry();
    setRegistryItems(updated);
    setLastGenerated(results);
    showToastNotice(`Berhasil membuat ${results.length} nomor ${category}!`);
  };

  const handleDeleteItem = (id: string, nomor: string) => {
    if (confirm(`Hapus pencatatan nomor ${nomor}?\n\nNomor ini akan DIKEMBALIKAN (daur ulang) dan dapat digunakan kembali untuk surat/sertifikat berikutnya.`)) {
      const { remaining } = deleteNumberRegistryItem(id);
      setRegistryItems(remaining);
      showToastNotice(`Nomor ${nomor} dihapus & dikembalikan ke pool nomor tersedia`);
    }
  };

  const handleExportCSV = () => {
    const csv = exportRegistryToCSV(registryItems);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `buku-registrasi-nomor-surat-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToastNotice("Buku registrasi berhasil diexport ke CSV!");
  };

  const filteredItems = useMemo(() => {
    return registryItems.filter((item) => {
      const matchCat = filterCategory === "ALL" || item.category === filterCategory;
      const matchSearch =
        !searchQuery ||
        `${item.nomorSurat} ${item.perihal} ${item.penerima} ${item.instansi || ""} ${item.pembuat} ${item.category}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [registryItems, filterCategory, searchQuery]);

  // Count stats
  const stats = useMemo(() => {
    const total = registryItems.length;
    const sertifikat = registryItems.filter((i) => i.category === "Sertifikat").length;
    const suratResmi = registryItems.filter((i) => i.category === "Surat Resmi").length;
    const sk = registryItems.filter((i) => i.category === "Surat Keputusan (SK)").length;
    return { total, sertifikat, suratResmi, sk };
  }, [registryItems]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl ring-1 ring-black/10 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="px-6 py-4.5 border-b border-stone-200 bg-[#FDFBF7] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0f6b4a] text-white flex items-center justify-center text-lg shadow-sm">
              📘
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                  Generator & Buku Nomor Dokumen
                </h2>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                  {registryItems.length} Nomor Terdaftar
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Generate nomor untuk Sertifikat, Surat, SK & lacak histori penggunaannya
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition active:scale-90"
              title="Tutup"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-3 pb-2 border-b border-stone-100 bg-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex bg-stone-100 p-1 rounded-2xl ring-1 ring-stone-200">
            <button
              onClick={() => setActiveTab("generate")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "generate"
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <span>⚡ Generate Nomor Baru</span>
            </button>
            <button
              onClick={() => setActiveTab("registry")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "registry"
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <span>📋 Buku Registrasi & Riwayat ({registryItems.length})</span>
            </button>
          </div>

          {activeTab === "registry" && registryItems.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium ring-1 ring-stone-200 transition"
              title="Download data buku registrasi format CSV"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Export CSV</span>
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "generate" ? (
            <div className="space-y-6">
              {/* Category Selector */}
              <div>
                <label className="text-[11px] font-bold text-stone-600 tracking-wider uppercase mb-2.5 block">
                  Pilih Kategori Dokumen
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {(Object.keys(CATEGORY_DEFINITIONS) as DocCategory[]).map((catKey) => {
                    const def = CATEGORY_DEFINITIONS[catKey];
                    const isSelected = category === catKey;
                    return (
                      <button
                        key={catKey}
                        type="button"
                        onClick={() => {
                          setCategory(catKey);
                          setLastGenerated(null);
                        }}
                        className={`p-3 rounded-2xl text-left border transition-all flex flex-col justify-between ${
                          isSelected
                            ? "bg-[#0f6b4a]/5 border-[#0f6b4a] ring-2 ring-[#0f6b4a]/20 shadow-sm"
                            : "bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50/60"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xl">{def.icon}</span>
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                            isSelected ? "bg-[#0f6b4a] text-white" : "bg-stone-100 text-stone-600"
                          }`}>
                            {def.code}
                          </span>
                        </div>
                        <div className="mt-2 font-semibold text-xs text-stone-900">{def.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Number Preview & Recycling Banner */}
              <div className="p-4 rounded-2xl bg-[#F4F9F5] border border-emerald-200 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">
                      Nomor Dokumen yang Akan Ter-generate
                    </div>
                    <div className="text-lg sm:text-xl font-mono font-bold text-emerald-950 mt-0.5">
                      {previewFormattedNumber}
                    </div>
                  </div>
                  {sequenceAnalysis.isRecycledSlot ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold border border-amber-300 self-start sm:self-auto">
                      <span>🔄 Slot Daur Ulang #{String(sequenceAnalysis.recommendedSeq).padStart(3, "0")}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold self-start sm:self-auto">
                      <span>✨ Nomor Urut Baru #{String(sequenceAnalysis.recommendedSeq).padStart(3, "0")}</span>
                    </div>
                  )}
                </div>

                {sequenceAnalysis.isRecycledSlot && (
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    💡 <b>Daur Ulang Aktif:</b> Nomor ini diambil dari slot nomor sebelumnya yang pernah dihapus/dibatalkan, sehingga urutan nomor tetap rapi tanpa ada nomor yang bolong.
                  </p>
                )}
                {sequenceAnalysis.gaps.length > 1 && (
                  <div className="text-[11px] text-stone-600 pt-1">
                    Slot daur ulang lain yang siap dipakai:{" "}
                    {sequenceAnalysis.gaps.map((g) => (
                      <span key={g} className="font-mono font-bold bg-white px-1.5 py-0.5 rounded mr-1 ring-1 ring-black/10">
                        #{String(g).padStart(3, "0")}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Mode Toggle (Single vs Batch) */}
              <div className="flex items-center justify-between border-t border-stone-100 pt-4">
                <div className="text-xs font-semibold text-stone-700">Mode Penomoran:</div>
                <div className="flex bg-stone-100 p-0.5 rounded-full ring-1 ring-stone-200">
                  <button
                    type="button"
                    onClick={() => setIsBatchMode(false)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                      !isBatchMode ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800"
                    }`}
                  >
                    1 Dokumen
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsBatchMode(true)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                      isBatchMode ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800"
                    }`}
                  >
                    Banyak Peserta / Batch (Sertifikat)
                  </button>
                </div>
              </div>

              {/* Form Input */}
              {!isBatchMode ? (
                <form onSubmit={handleGenerateSingle} className="space-y-4">
                  {category === "Custom" && (
                    <div>
                      <label className="text-[11px] font-bold text-stone-600 tracking-wider uppercase mb-1 block">
                        Kode Kategori Custom <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={customCode}
                        onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                        placeholder="Contoh: PIAGAM, DKM, UND"
                        className="w-full h-10 rounded-xl bg-[#FDFBF7] ring-1 ring-black/5 px-3 text-sm uppercase font-mono outline-none focus:ring-2 focus:ring-[#0f6b4a]/20 focus:bg-white"
                        required
                      />
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-stone-600 tracking-wider uppercase mb-1 block">
                        Perihal / Untuk Apa Dokumen Ini? <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={perihal}
                        onChange={(e) => setPerihal(e.target.value)}
                        placeholder={
                          category === "Sertifikat"
                            ? "Sertifikat Pemateri Workshop Manajemen Masjid"
                            : category === "Surat Keputusan (SK)"
                            ? "SK Pengangkatan Pengurus DKM Periode 2026"
                            : "Perihal / keperluan dokumen resmi"
                        }
                        className="w-full h-10 rounded-xl bg-[#FDFBF7] ring-1 ring-black/5 px-3.5 text-sm text-stone-800 outline-none focus:ring-2 focus:ring-[#0f6b4a]/20 focus:bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-stone-600 tracking-wider uppercase mb-1 block">
                        Penerima / Untuk Siapa? <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={penerima}
                        onChange={(e) => setPenerima(e.target.value)}
                        placeholder="Contoh: Ust. Ahmad Fauzi, S.Pd.I"
                        className="w-full h-10 rounded-xl bg-[#FDFBF7] ring-1 ring-black/5 px-3.5 text-sm text-stone-800 outline-none focus:ring-2 focus:ring-[#0f6b4a]/20 focus:bg-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-stone-600 tracking-wider uppercase mb-1 block">
                        Instansi / Lembaga (Opsional)
                      </label>
                      <input
                        value={instansi}
                        onChange={(e) => setInstansi(e.target.value)}
                        placeholder="Masjid Al-Ikhlas"
                        className="w-full h-10 rounded-xl bg-[#FDFBF7] ring-1 ring-black/5 px-3.5 text-sm outline-none focus:ring-2 focus:ring-[#0f6b4a]/20 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-stone-600 tracking-wider uppercase mb-1 block">
                        Tanggal Dokumen
                      </label>
                      <input
                        type="date"
                        value={tanggal}
                        onChange={(e) => setTanggal(e.target.value)}
                        className="w-full h-10 rounded-xl bg-[#FDFBF7] ring-1 ring-black/5 px-3.5 text-sm outline-none focus:ring-2 focus:ring-[#0f6b4a]/20 focus:bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-stone-600 tracking-wider uppercase mb-1 block">
                        Penanggung Jawab / Pembuat
                      </label>
                      <input
                        value={pembuat}
                        onChange={(e) => setPembuat(e.target.value)}
                        placeholder="Nama penanggung jawab"
                        className="w-full h-10 rounded-xl bg-[#FDFBF7] ring-1 ring-black/5 px-3.5 text-sm outline-none focus:ring-2 focus:ring-[#0f6b4a]/20 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-stone-600 tracking-wider uppercase mb-1 block">
                      Catatan Tambahan (Opsional)
                    </label>
                    <input
                      value={catatan}
                      onChange={(e) => setCatatan(e.target.value)}
                      placeholder="Contoh: Dikirim via WhatsApp / Sertifikat cetak laminasi"
                      className="w-full h-10 rounded-xl bg-[#FDFBF7] ring-1 ring-black/5 px-3.5 text-sm outline-none focus:ring-2 focus:ring-[#0f6b4a]/20 focus:bg-white"
                    />
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row gap-3">
                    <button
                      type="submit"
                      className="flex-1 h-11 rounded-full bg-[#0f6b4a] hover:bg-[#0d5a3f] text-white font-semibold text-sm transition flex items-center justify-center gap-2 shadow-md active:scale-95"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Generate & Catat Nomor Ini</span>
                    </button>
                    {onApplyToLetter && (
                      <button
                        type="button"
                        onClick={() => {
                          if (!perihal.trim() || !penerima.trim()) {
                            alert("Lengkapi Perihal dan Penerima terlebih dahulu.");
                            return;
                          }
                          const item = registerDocumentNumber({
                            category,
                            categoryCode: currentCode,
                            perihal,
                            penerima,
                            instansi,
                            tanggal,
                            pembuat,
                            catatan,
                            source: "standalone_registry",
                          });
                          setRegistryItems(loadNumberRegistry());
                          onApplyToLetter(item.nomorSurat, {
                            perihal: item.perihal,
                            penerima: item.penerima,
                            instansi: item.instansi,
                          });
                          onClose();
                        }}
                        className="h-11 px-5 rounded-full bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm transition flex items-center justify-center gap-2 shadow-sm"
                        title="Generate dan langsung terapkan ke formulir surat utama"
                      >
                        <span>Gunakan di Form Surat Ini</span>
                      </button>
                    )}
                  </div>
                </form>
              ) : (
                <form onSubmit={handleGenerateBatch} className="space-y-4">
                  <div>
                    <label className="text-[11px] font-bold text-stone-600 tracking-wider uppercase mb-1 block">
                      Perihal / Judul Kegiatan Sertifikat <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={perihal}
                      onChange={(e) => setPerihal(e.target.value)}
                      placeholder="Contoh: Sertifikat Pelatihan Keuangan Masjid 2026"
                      className="w-full h-10 rounded-xl bg-[#FDFBF7] ring-1 ring-black/5 px-3.5 text-sm text-stone-800 outline-none focus:ring-2 focus:ring-[#0f6b4a]/20 focus:bg-white"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-stone-600 tracking-wider uppercase block">
                        Daftar Nama Penerima / Peserta <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[11px] text-stone-500">
                        {batchNames.split("\n").filter((s) => s.trim()).length} Nama Peserta
                      </span>
                    </div>
                    <textarea
                      value={batchNames}
                      onChange={(e) => setBatchNames(e.target.value)}
                      placeholder={"Tulis 1 nama per baris, contoh:\nAhmad Fauzi, S.Pd\nBudi Santoso\nSiti Rahmawati\nMuhammad Rizky"}
                      rows={5}
                      className="w-full rounded-2xl bg-[#FDFBF7] ring-1 ring-black/5 p-3.5 text-sm font-sans outline-none focus:ring-2 focus:ring-[#0f6b4a]/20 focus:bg-white"
                      required
                    />
                    <p className="text-[11px] text-stone-500 mt-1">
                      Sistem akan men-generate nomor urut resmi untuk masing-masing nama di atas sekaligus.
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-stone-600 tracking-wider uppercase mb-1 block">
                        Tanggal Sertifikat
                      </label>
                      <input
                        type="date"
                        value={tanggal}
                        onChange={(e) => setTanggal(e.target.value)}
                        className="w-full h-10 rounded-xl bg-[#FDFBF7] ring-1 ring-black/5 px-3.5 text-sm outline-none focus:ring-2 focus:ring-[#0f6b4a]/20 focus:bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-stone-600 tracking-wider uppercase mb-1 block">
                        Instansi Bersama (Opsional)
                      </label>
                      <input
                        value={instansi}
                        onChange={(e) => setInstansi(e.target.value)}
                        placeholder="GetMasjid / DKM Masjid"
                        className="w-full h-10 rounded-xl bg-[#FDFBF7] ring-1 ring-black/5 px-3.5 text-sm outline-none focus:ring-2 focus:ring-[#0f6b4a]/20 focus:bg-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full h-11 rounded-full bg-[#0f6b4a] hover:bg-[#0d5a3f] text-white font-semibold text-sm transition flex items-center justify-center gap-2 shadow-md active:scale-95"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Generate Semua Nomor Peserta Sekaligus</span>
                  </button>
                </form>
              )}

              {/* Result of Last Generated */}
              {lastGenerated && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 mt-4 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                      ✅ Nomor Berhasil Dibuat & Dicatat
                    </span>
                    <button
                      onClick={() => setActiveTab("registry")}
                      className="text-xs text-emerald-800 font-semibold underline hover:text-emerald-950"
                    >
                      Buka Buku Registrasi →
                    </button>
                  </div>

                  {Array.isArray(lastGenerated) ? (
                    <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                      {lastGenerated.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-2 rounded-xl bg-white ring-1 ring-emerald-200 text-xs">
                          <div>
                            <span className="font-mono font-bold text-emerald-900">{item.nomorSurat}</span>
                            <span className="text-stone-600 ml-2">— {item.penerima}</span>
                          </div>
                          <button
                            onClick={() => handleCopyText(item.nomorSurat, item.id)}
                            className="px-2.5 py-1 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-semibold text-[11px]"
                          >
                            {copiedId === item.id ? "✓ Disalin" : "Salin"}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-xl ring-1 ring-emerald-200">
                      <div>
                        <div className="text-base font-mono font-bold text-emerald-900">{lastGenerated.nomorSurat}</div>
                        <div className="text-xs text-stone-600 mt-0.5">
                          {lastGenerated.penerima} • <span className="text-stone-500">{lastGenerated.perihal}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopyText(lastGenerated.nomorSurat, lastGenerated.id)}
                          className="h-8 px-4 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                          </svg>
                          <span>{copiedId === lastGenerated.id ? "Tersalin!" : "Salin Nomor"}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* TAB REGISTRY / HISTORY */
            <div className="space-y-4">
              {/* Quick Stat Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-2xl bg-stone-50 ring-1 ring-stone-200">
                  <div className="text-[10px] uppercase font-bold text-stone-500">Total Nomor</div>
                  <div className="text-lg font-bold text-stone-900 mt-0.5">{stats.total} Dokumen</div>
                </div>
                <div className="p-3 rounded-2xl bg-amber-50/70 ring-1 ring-amber-200/60">
                  <div className="text-[10px] uppercase font-bold text-amber-800">📜 Sertifikat</div>
                  <div className="text-lg font-bold text-amber-950 mt-0.5">{stats.sertifikat}</div>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50/70 ring-1 ring-emerald-200/60">
                  <div className="text-[10px] uppercase font-bold text-emerald-800">📑 Surat Resmi</div>
                  <div className="text-lg font-bold text-emerald-950 mt-0.5">{stats.suratResmi}</div>
                </div>
                <div className="p-3 rounded-2xl bg-indigo-50/70 ring-1 ring-indigo-200/60">
                  <div className="text-[10px] uppercase font-bold text-indigo-800">⚖️ Surat Keputusan</div>
                  <div className="text-lg font-bold text-indigo-950 mt-0.5">{stats.sk}</div>
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
                <div className="relative flex-1">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>
                  </svg>
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nomor, keperluan (untuk apa), penerima (untuk siapa)..."
                    className="w-full h-9 rounded-full bg-[#FDFBF7] ring-1 ring-black/5 pl-9 pr-3 text-xs outline-none focus:ring-2 focus:ring-[#0f6b4a]/20 focus:bg-white"
                  />
                </div>

                <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {["ALL", "Sertifikat", "Surat Resmi", "Surat Keputusan (SK)", "Surat Keterangan (SKET)"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setFilterCategory(cat)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                        filterCategory === cat
                          ? "bg-stone-900 text-white"
                          : "bg-stone-100 hover:bg-stone-200 text-stone-600"
                      }`}
                    >
                      {cat === "ALL" ? "Semua" : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Registry Items List */}
              {filteredItems.length === 0 ? (
                <div className="rounded-2xl bg-[#FDFBF7] ring-1 ring-black/5 p-8 text-center my-4">
                  <div className="w-12 h-12 rounded-full bg-white ring-1 ring-black/5 flex items-center justify-center mx-auto mb-3 text-xl">
                    📭
                  </div>
                  <div className="text-sm font-semibold text-stone-800">
                    {searchQuery ? "Tidak ditemukan nomor yang cocok" : "Belum ada nomor dokumen terdaftar"}
                  </div>
                  <div className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                    {searchQuery
                      ? "Coba gunakan kata kunci pencarian yang lain."
                      : "Gunakan tab 'Generate Nomor Baru' untuk membuat nomor sertifikat, surat keputusan, atau surat resmi."}
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-[#FDFBF7] ring-1 ring-black/5 hover:bg-white hover:shadow-md transition-all space-y-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-xs bg-white px-2.5 py-1 rounded-full ring-1 ring-stone-200 text-stone-900">
                            {item.nomorSurat}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            item.category === "Sertifikat"
                              ? "bg-amber-100 text-amber-900"
                              : item.category === "Surat Keputusan (SK)"
                              ? "bg-indigo-100 text-indigo-900"
                              : "bg-emerald-100 text-emerald-900"
                          }`}>
                            {item.category}
                          </span>
                          {item.isRecycled && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 ring-1 ring-amber-300 font-medium" title="Nomor ini hasil daur ulang slot kosong yang pernah dihapus">
                              🔄 Daur Ulang #{String(item.sequenceNumber).padStart(3, "0")}
                            </span>
                          )}
                          <span className="text-[11px] text-stone-500">
                            📅 {item.tanggal}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-auto">
                          <button
                            onClick={() => handleCopyText(item.nomorSurat, item.id)}
                            className="h-7 px-3 rounded-full bg-white ring-1 ring-stone-200 hover:bg-stone-50 text-xs font-semibold text-stone-700 flex items-center gap-1"
                            title="Salin Nomor Dokumen"
                          >
                            <span>{copiedId === item.id ? "✓ Tersalin" : "Salin"}</span>
                          </button>

                          {onApplyToLetter && (
                            <button
                              onClick={() => {
                                onApplyToLetter(item.nomorSurat, {
                                  perihal: item.perihal,
                                  penerima: item.penerima,
                                  instansi: item.instansi,
                                });
                                onClose();
                              }}
                              className="h-7 px-3 rounded-full bg-[#0f6b4a] hover:bg-[#0d5a3f] text-white text-xs font-semibold"
                              title="Terapkan nomor ini ke formulir surat utama"
                            >
                              Gunakan
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteItem(item.id, item.nomorSurat)}
                            className="h-7 px-2.5 rounded-full bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold transition"
                            title="Hapus dan kembalikan nomor ini ke pool nomor bebas"
                          >
                            Hapus (Kembalikan)
                          </button>
                        </div>
                      </div>

                      {/* Detail Perihal (Untuk Apa) & Penerima (Untuk Siapa) */}
                      <div className="grid sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-black/5">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-stone-400 block">Untuk Apa (Perihal):</span>
                          <span className="font-semibold text-stone-800">{item.perihal}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-stone-400 block">Untuk Siapa (Penerima):</span>
                          <span className="font-medium text-stone-700">
                            {item.penerima} {item.instansi && <span className="text-stone-500 font-normal">({item.instansi})</span>}
                          </span>
                        </div>
                      </div>

                      {(item.pembuat || item.catatan) && (
                        <div className="text-[11px] text-stone-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                          {item.pembuat && <span>👤 Dibuat oleh: <b className="text-stone-700">{item.pembuat}</b></span>}
                          {item.catatan && <span>📝 Catatan: {item.catatan}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Note */}
        <div className="px-6 py-3 border-t border-stone-200 bg-[#FDFBF7] text-[11px] text-stone-500 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
          <div>
            ♻️ <b>Sistem Daur Ulang:</b> Menghapus surat/nomor akan otomatis mengembalikan nomor urut ke antrian awal.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-stone-900 text-white text-xs font-medium hover:bg-stone-800"
          >
            Tutup
          </button>
        </div>

        {notice && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-stone-900 text-white px-4 py-2 rounded-full text-xs font-semibold shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2">
            {notice}
          </div>
        )}
      </div>
    </div>
  );
}
