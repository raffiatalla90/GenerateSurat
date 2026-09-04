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
      alert("Mohon masukkan Perihal / Tujuan Dokumen.");
      return;
    }
    if (!penerima.trim()) {
      alert("Mohon masukkan Nama Penerima / Pihak Terkait.");
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
      showToastNotice(`Nomor daur ulang digunakan: ${newItem.nomorSurat}`);
    } else {
      showToastNotice(`Nomor berhasil dibuat: ${newItem.nomorSurat}`);
    }
  };

  const handleGenerateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!perihal.trim()) {
      alert("Mohon masukkan Perihal / Judul Kegiatan.");
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
    showToastNotice(`Berhasil membuat ${results.length} nomor ${category}`);
  };

  const handleDeleteItem = (id: string, nomor: string) => {
    if (confirm(`Hapus pencatatan nomor ${nomor}?\n\nNomor ini akan dikembalikan ke urutan yang tersedia dan dapat dipakai kembali.`)) {
      const { remaining } = deleteNumberRegistryItem(id);
      setRegistryItems(remaining);
      showToastNotice(`Nomor ${nomor} dihapus dan kembali tersedia`);
    }
  };

  const handleExportCSV = () => {
    const csv = exportRegistryToCSV(registryItems);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `buku-registrasi-nomor-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToastNotice("Buku registrasi berhasil diekspor ke CSV");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden my-auto max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-stone-200 bg-white flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0f6b4a] text-white flex items-center justify-center font-bold text-xs tracking-wider">
              GM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-stone-900 tracking-tight">
                  Generator & Buku Nomor Dokumen
                </h2>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 font-medium border border-stone-200">
                  {registryItems.length} Terdaftar
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Penomoran resmi untuk sertifikat, surat keputusan, dan surat keluar
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-800 flex items-center justify-center transition"
            title="Tutup"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-3 pb-2 border-b border-stone-100 bg-[#FDFBF7] flex items-center justify-between gap-3 shrink-0">
          <div className="flex bg-stone-200/70 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("generate")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "generate"
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Generate Nomor Baru</span>
            </button>
            <button
              onClick={() => setActiveTab("registry")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "registry"
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Buku Registrasi & Riwayat ({registryItems.length})</span>
            </button>
          </div>

          {activeTab === "registry" && registryItems.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-stone-50 text-stone-700 text-xs font-medium border border-stone-200 transition shadow-sm"
              title="Download format CSV"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Ekspor CSV</span>
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "generate" ? (
            <div className="space-y-6">
              {/* Category Selector */}
              <div>
                <label className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-2 block">
                  Kategori Dokumen
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                        className={`p-3 rounded-xl text-left border transition-all flex flex-col justify-between ${
                          isSelected
                            ? "bg-[#0f6b4a]/5 border-[#0f6b4a] ring-1 ring-[#0f6b4a]"
                            : "bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50/50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-stone-900">{def.label}</span>
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-medium ${
                            isSelected ? "bg-[#0f6b4a] text-white" : "bg-stone-100 text-stone-600"
                          }`}>
                            {def.code}
                          </span>
                        </div>
                        <div className="text-[11px] text-stone-500 mt-1 line-clamp-1">{def.description}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Number Preview Card */}
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="text-[10px] uppercase font-semibold text-stone-500 tracking-wider">
                      Format Nomor yang Digenerate
                    </div>
                    <div className="text-lg font-mono font-bold text-stone-900 mt-0.5">
                      {previewFormattedNumber}
                    </div>
                  </div>
                  {sequenceAnalysis.isRecycledSlot ? (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-200 self-start sm:self-auto">
                      <span>Nomor Daur Ulang #{String(sequenceAnalysis.recommendedSeq).padStart(3, "0")}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 self-start sm:self-auto">
                      <span>Nomor Urut #{String(sequenceAnalysis.recommendedSeq).padStart(3, "0")}</span>
                    </div>
                  )}
                </div>

                {sequenceAnalysis.isRecycledSlot && (
                  <p className="text-[11px] text-stone-600 leading-relaxed pt-0.5">
                    Nomor ini mengisi slot urutan yang sebelumnya dihapus agar penomoran tetap berurutan rapi.
                  </p>
                )}
              </div>

              {/* Mode Toggle */}
              <div className="flex items-center justify-between border-t border-stone-100 pt-4">
                <div className="text-xs font-medium text-stone-700">Mode:</div>
                <div className="flex bg-stone-100 p-0.5 rounded-lg border border-stone-200">
                  <button
                    type="button"
                    onClick={() => setIsBatchMode(false)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                      !isBatchMode ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800"
                    }`}
                  >
                    1 Dokumen
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsBatchMode(true)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                      isBatchMode ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800"
                    }`}
                  >
                    Banyak Peserta (Batch)
                  </button>
                </div>
              </div>

              {/* Form Input */}
              {!isBatchMode ? (
                <form onSubmit={handleGenerateSingle} className="space-y-4">
                  {category === "Custom" && (
                    <div>
                      <label className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-1 block">
                        Kode Kategori Custom <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={customCode}
                        onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                        placeholder="Contoh: PIAGAM, DKM, UND"
                        className="w-full h-10 rounded-xl bg-[#FDFBF7] border border-stone-200 px-3 text-sm uppercase font-mono outline-none focus:border-[#0f6b4a] focus:bg-white"
                        required
                      />
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-1 block">
                        Perihal / Untuk Apa <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={perihal}
                        onChange={(e) => setPerihal(e.target.value)}
                        placeholder={
                          category === "Sertifikat"
                            ? "Sertifikat Pemateri Workshop Masjid"
                            : category === "Surat Keputusan (SK)"
                            ? "SK Pengangkatan Pengurus DKM"
                            : "Perihal atau keperluan surat"
                        }
                        className="w-full h-10 rounded-xl bg-[#FDFBF7] border border-stone-200 px-3.5 text-sm text-stone-800 outline-none focus:border-[#0f6b4a] focus:bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-1 block">
                        Penerima / Untuk Siapa <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={penerima}
                        onChange={(e) => setPenerima(e.target.value)}
                        placeholder="Nama penerima atau instansi tujuan"
                        className="w-full h-10 rounded-xl bg-[#FDFBF7] border border-stone-200 px-3.5 text-sm text-stone-800 outline-none focus:border-[#0f6b4a] focus:bg-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-1 block">
                        Instansi Terkait (Opsional)
                      </label>
                      <input
                        value={instansi}
                        onChange={(e) => setInstansi(e.target.value)}
                        placeholder="Nama instansi / masjid"
                        className="w-full h-10 rounded-xl bg-[#FDFBF7] border border-stone-200 px-3.5 text-sm outline-none focus:border-[#0f6b4a] focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-1 block">
                        Tanggal Dokumen
                      </label>
                      <input
                        type="date"
                        value={tanggal}
                        onChange={(e) => setTanggal(e.target.value)}
                        className="w-full h-10 rounded-xl bg-[#FDFBF7] border border-stone-200 px-3.5 text-sm outline-none focus:border-[#0f6b4a] focus:bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-1 block">
                        Pembuat / Penanggung Jawab
                      </label>
                      <input
                        value={pembuat}
                        onChange={(e) => setPembuat(e.target.value)}
                        placeholder="Nama pembuat nomor"
                        className="w-full h-10 rounded-xl bg-[#FDFBF7] border border-stone-200 px-3.5 text-sm outline-none focus:border-[#0f6b4a] focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-1 block">
                      Catatan (Opsional)
                    </label>
                    <input
                      value={catatan}
                      onChange={(e) => setCatatan(e.target.value)}
                      placeholder="Keterangan tambahan"
                      className="w-full h-10 rounded-xl bg-[#FDFBF7] border border-stone-200 px-3.5 text-sm outline-none focus:border-[#0f6b4a] focus:bg-white"
                    />
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row gap-3">
                    <button
                      type="submit"
                      className="flex-1 h-10 rounded-xl bg-[#0f6b4a] hover:bg-[#0d5a3f] text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-sm"
                    >
                      <span>Generate & Simpan Nomor</span>
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
                        className="h-10 px-5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-sm"
                        title="Terapkan ke form surat yang sedang dibuka"
                      >
                        <span>Gunakan di Form Surat Ini</span>
                      </button>
                    )}
                  </div>
                </form>
              ) : (
                <form onSubmit={handleGenerateBatch} className="space-y-4">
                  <div>
                    <label className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-1 block">
                      Perihal / Kegiatan Sertifikat <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={perihal}
                      onChange={(e) => setPerihal(e.target.value)}
                      placeholder="Contoh: Sertifikat Pelatihan Keuangan Masjid 2026"
                      className="w-full h-10 rounded-xl bg-[#FDFBF7] border border-stone-200 px-3.5 text-sm text-stone-800 outline-none focus:border-[#0f6b4a] focus:bg-white"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider block">
                        Daftar Nama Peserta (1 baris per nama) <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[11px] text-stone-500 font-medium">
                        {batchNames.split("\n").filter((s) => s.trim()).length} Peserta
                      </span>
                    </div>
                    <textarea
                      value={batchNames}
                      onChange={(e) => setBatchNames(e.target.value)}
                      placeholder={"Ahmad Fauzi, S.Pd\nBudi Santoso\nSiti Rahmawati"}
                      rows={5}
                      className="w-full rounded-xl bg-[#FDFBF7] border border-stone-200 p-3 text-sm font-sans outline-none focus:border-[#0f6b4a] focus:bg-white"
                      required
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-1 block">
                        Tanggal Dokumen
                      </label>
                      <input
                        type="date"
                        value={tanggal}
                        onChange={(e) => setTanggal(e.target.value)}
                        className="w-full h-10 rounded-xl bg-[#FDFBF7] border border-stone-200 px-3.5 text-sm outline-none focus:border-[#0f6b4a] focus:bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-1 block">
                        Instansi Bersama (Opsional)
                      </label>
                      <input
                        value={instansi}
                        onChange={(e) => setInstansi(e.target.value)}
                        placeholder="GetMasjid"
                        className="w-full h-10 rounded-xl bg-[#FDFBF7] border border-stone-200 px-3.5 text-sm outline-none focus:border-[#0f6b4a] focus:bg-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full h-10 rounded-xl bg-[#0f6b4a] hover:bg-[#0d5a3f] text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span>Generate Semua Nomor Sekaligus</span>
                  </button>
                </form>
              )}

              {/* Result Notification */}
              {lastGenerated && (
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 mt-4 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-stone-900">
                      Nomor Berhasil Dibuat
                    </span>
                    <button
                      onClick={() => setActiveTab("registry")}
                      className="text-xs text-[#0f6b4a] font-semibold hover:underline"
                    >
                      Buka Buku Registrasi
                    </button>
                  </div>

                  {Array.isArray(lastGenerated) ? (
                    <div className="mt-3 space-y-1.5 max-h-40 overflow-y-auto">
                      {lastGenerated.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-white border border-stone-200 text-xs">
                          <div>
                            <span className="font-mono font-semibold text-stone-900">{item.nomorSurat}</span>
                            <span className="text-stone-500 ml-2">— {item.penerima}</span>
                          </div>
                          <button
                            onClick={() => handleCopyText(item.nomorSurat, item.id)}
                            className="px-2.5 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium text-[11px]"
                          >
                            {copiedId === item.id ? "Disalin" : "Salin"}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-lg border border-stone-200">
                      <div>
                        <div className="text-base font-mono font-bold text-stone-900">{lastGenerated.nomorSurat}</div>
                        <div className="text-xs text-stone-500 mt-0.5">
                          {lastGenerated.penerima} • {lastGenerated.perihal}
                        </div>
                      </div>
                      <button
                        onClick={() => handleCopyText(lastGenerated.nomorSurat, lastGenerated.id)}
                        className="h-8 px-4 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium transition"
                      >
                        {copiedId === lastGenerated.id ? "Tersalin" : "Salin Nomor"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* TAB REGISTRY */
            <div className="space-y-4">
              {/* Quick Stat Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <div className="text-[10px] uppercase font-semibold text-stone-500">Total Nomor</div>
                  <div className="text-base font-bold text-stone-900 mt-0.5">{stats.total}</div>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <div className="text-[10px] uppercase font-semibold text-stone-500">Sertifikat</div>
                  <div className="text-base font-bold text-stone-900 mt-0.5">{stats.sertifikat}</div>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <div className="text-[10px] uppercase font-semibold text-stone-500">Surat Keluar</div>
                  <div className="text-base font-bold text-stone-900 mt-0.5">{stats.suratResmi}</div>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <div className="text-[10px] uppercase font-semibold text-stone-500">Surat Keputusan</div>
                  <div className="text-base font-bold text-stone-900 mt-0.5">{stats.sk}</div>
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
                <div className="relative flex-1">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>
                  </svg>
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nomor, perihal, penerima..."
                    className="w-full h-8.5 rounded-lg bg-[#FDFBF7] border border-stone-200 pl-8 pr-3 text-xs outline-none focus:border-[#0f6b4a] focus:bg-white"
                  />
                </div>

                <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
                  {["ALL", "Sertifikat", "Surat Resmi", "Surat Keputusan (SK)", "Surat Keterangan (SKET)"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setFilterCategory(cat)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition ${
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
                <div className="rounded-xl bg-[#FDFBF7] border border-stone-200 p-8 text-center my-4">
                  <div className="text-sm font-medium text-stone-700">
                    {searchQuery ? "Tidak ditemukan nomor yang cocok" : "Belum ada nomor dokumen terdaftar"}
                  </div>
                  <div className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                    {searchQuery
                      ? "Gunakan kata kunci pencarian yang lain."
                      : "Gunakan tab Generate Nomor Baru untuk membuat nomor dokumen."}
                  </div>
                </div>
              ) : (
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl bg-[#FDFBF7] border border-stone-200 hover:bg-white hover:shadow-sm transition-all space-y-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-semibold text-xs bg-white px-2 py-0.5 rounded border border-stone-200 text-stone-900">
                            {item.nomorSurat}
                          </span>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                            {item.category}
                          </span>
                          {item.isRecycled && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                              Daur Ulang #{String(item.sequenceNumber).padStart(3, "0")}
                            </span>
                          )}
                          <span className="text-[11px] text-stone-500">
                            {item.tanggal}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-auto">
                          <button
                            onClick={() => handleCopyText(item.nomorSurat, item.id)}
                            className="h-7 px-2.5 rounded bg-white border border-stone-200 hover:bg-stone-50 text-xs font-medium text-stone-700"
                            title="Salin Nomor"
                          >
                            {copiedId === item.id ? "Disalin" : "Salin"}
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
                              className="h-7 px-2.5 rounded bg-[#0f6b4a] hover:bg-[#0d5a3f] text-white text-xs font-medium"
                              title="Terapkan ke formulir"
                            >
                              Gunakan
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteItem(item.id, item.nomorSurat)}
                            className="h-7 px-2 rounded bg-white hover:bg-red-50 text-red-600 text-xs font-medium border border-stone-200 hover:border-red-200 transition"
                            title="Hapus dan kembalikan nomor"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>

                      {/* Detail Info */}
                      <div className="grid sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-stone-100">
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-stone-400 block">Perihal:</span>
                          <span className="font-medium text-stone-800">{item.perihal}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-stone-400 block">Penerima:</span>
                          <span className="font-normal text-stone-700">
                            {item.penerima} {item.instansi && <span className="text-stone-500">({item.instansi})</span>}
                          </span>
                        </div>
                      </div>

                      {(item.pembuat || item.catatan) && (
                        <div className="text-[11px] text-stone-500 flex flex-wrap items-center gap-x-4 gap-y-0.5 pt-0.5">
                          {item.pembuat && <span>Pembuat: {item.pembuat}</span>}
                          {item.catatan && <span>Catatan: {item.catatan}</span>}
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
        <div className="px-6 py-3 border-t border-stone-200 bg-white text-[11px] text-stone-500 flex items-center justify-between gap-2 shrink-0">
          <span>
            Penomoran otomatis berurutan • Nomor surat yang dihapus akan kembali tersedia
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1 rounded-lg bg-stone-900 text-white text-xs font-medium hover:bg-stone-800 transition"
          >
            Tutup
          </button>
        </div>

        {notice && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-stone-900 text-white px-4 py-2 rounded-full text-xs font-medium shadow-lg z-50 animate-in fade-in">
            {notice}
          </div>
        )}
      </div>
    </div>
  );
}
