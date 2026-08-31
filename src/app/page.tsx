"use client";

import { useEffect, useState, useRef } from "react";
import { LetterForm } from "@/components/LetterForm";
import { LetterPreview } from "@/components/LetterPreview";
import { SettingsPanel } from "@/components/SettingsPanel";
import { KopSuratConfig, LetterData, SignatureConfig } from "@/types/letter";
import { SURAT_TEMPLATES } from "@/lib/letter-templates";
import { DEFAULT_KOP, DEFAULT_SIG, loadKopConfig, loadSigConfig, saveKopConfig, saveSigConfig } from "@/lib/kop-defaults";
import { HistoryPanel } from "@/components/HistoryPanel";
import { HistoryItem, loadHistory, addHistoryItem, deleteHistoryItem } from "@/lib/history";

function todayISO(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}


export default function Home() {
  const [nomorSurat, setNomorSurat] = useState("001/GMJ/--/----");
  const [data, setData] = useState<LetterData>({
    nomorSurat: "001/GMJ/--/----",
    namaPenerima: "Bapak Kepala DKM",
    instansiTujuan: "Masjid Al-Ikhlas Jakarta Selatan",
    alamatPenerima: "Jl. Melati No. 12, Kebayoran Baru, Jakarta Selatan 12130",
    perihal: "Kerja Sama",
    isiSurat: SURAT_TEMPLATES["Kerja Sama"],
    tanggal: todayISO(),
    namaPenandatangan: "Raffi Atalla Natha Atmaja",
    jabatan: "CEO GetMasjid",
    attachments: [],
    signers: [
      {
        nama: "Raffi Atalla Natha Atmaja",
        jabatan: "CEO GetMasjid",
        showSignature: true,
        showStamp: true,
      }
    ],
  });
  const [kopConfig, setKopConfig] = useState<KopSuratConfig>(DEFAULT_KOP);
  const [sigConfig, setSigConfig] = useState<SignatureConfig>(DEFAULT_SIG);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const previewRef = useRef<HTMLDivElement>(null);
  const [reveal, setReveal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => setReveal(true), []);
  useEffect(() => { setHistory(loadHistory()); }, []);

  useEffect(() => {
    setKopConfig(loadKopConfig());
    setSigConfig(loadSigConfig());
  }, []);
  useEffect(() => { saveKopConfig(kopConfig); }, [kopConfig]);
  useEffect(() => { saveSigConfig(sigConfig); }, [sigConfig]);

  useEffect(() => {
    fetch("/api/nomor-surat")
      .then((r) => r.json())
      .then((j) => {
        if (j.nomorSurat) {
          setNomorSurat(j.nomorSurat);
          setData((prev) => ({ ...prev, nomorSurat: j.nomorSurat }));
        }
      })
      .catch(() => {});
  }, []);
  useEffect(() => { setData((prev) => ({ ...prev, nomorSurat })); }, [nomorSurat]);

  const handlePreview = () => {
    if (window.innerWidth < 1024) {
      setShowMobilePreview(true);
      setTimeout(() => previewRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } else {
      previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleSave = () => {
    if (!data.namaPenerima.trim() || !data.instansiTujuan.trim() || !data.perihal.trim() || !data.isiSurat.trim()) {
      alert("Mohon lengkapi Nama Penerima, Instansi, Perihal, dan Isi Surat.");
      return;
    }
    const item = addHistoryItem({
      nomorSurat: data.nomorSurat,
      data: { ...data },
      kopConfig: { ...kopConfig },
      signatureConfig: { ...sigConfig },
      perihal: data.perihal,
      tujuan: data.instansiTujuan,
      penerima: data.namaPenerima,
    });
    setHistory(loadHistory());
    setToast(`Tersimpan: ${item.nomorSurat}`);
    setTimeout(() => setToast(null), 2500);
  };

  const handleLoadHistory = (item: HistoryItem) => {
    const updatedData = {
      ...item.data,
      signers: item.data.signers || [{
        nama: item.data.namaPenandatangan || "Raffi Atalla Natha Atmaja",
        jabatan: item.data.jabatan || "CEO GetMasjid",
        showSignature: true,
        showStamp: true,
      }]
    };
    setData(updatedData);
    setKopConfig(item.kopConfig);
    setSigConfig(item.signatureConfig);
    setNomorSurat(item.nomorSurat);
    setShowMobilePreview(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setToast(`Memuat: ${item.nomorSurat}`);
    setTimeout(() => setToast(null), 2000);
  };

  const handleDeleteHistory = (id: string) => {
    deleteHistoryItem(id);
    setHistory(loadHistory());
  };

  const handleDownloadHistory = async (item: HistoryItem) => {
    setIsGenerating(true);
    try {
      const payload = { ...item.data, kopConfig: item.kopConfig, signatureConfig: item.signatureConfig };
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const perihalFile = item.data.perihalCustom || item.data.perihal;
      const nomorFile = item.nomorSurat.replace(/\//g, "-");
      const filename = `${nomorFile} - ${perihalFile}.pdf`;

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        const htmlFallback = err?.html as string | undefined;
        if (htmlFallback) {
          const win = window.open("", "_blank");
          if (win) { win.document.write(htmlFallback); win.document.close(); win.focus(); setTimeout(() => win.print(), 500); }
          return;
        }
        throw new Error("Gagal");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch (e) { alert("Gagal unduh"); } finally { setIsGenerating(false); }
  };

  const handleDownload = async () => {
    if (!data.namaPenerima.trim() || !data.instansiTujuan.trim() || !data.perihal.trim() || !data.isiSurat.trim()) {
      alert("Mohon lengkapi Nama Penerima, Instansi, Perihal, dan Isi Surat.");
      return;
    }
    setIsGenerating(true);
    try {
      const payload = { ...data, kopConfig, signatureConfig: sigConfig };
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const perihalFile = data.perihalCustom || data.perihal;
      const nomorFile = data.nomorSurat.replace(/\//g, "-");
      const filename = `${nomorFile} - ${perihalFile}.pdf`;

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        const htmlFallback = err?.html as string | undefined;
        if (htmlFallback) {
          const win = window.open("", "_blank");
          if (win) { win.document.write(htmlFallback); win.document.close(); win.focus(); setTimeout(() => win.print(), 500); }
          return;
        }
        throw new Error(err?.error || "Gagal generate PDF");
      }
      const nomorFromHeader = res.headers.get("X-Nomor-Surat");
      if (nomorFromHeader) setNomorSurat(nomorFromHeader);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const finalNomorFile = (nomorFromHeader || data.nomorSurat).replace(/\//g, "-");
      const finalFilename = `${finalNomorFile} - ${perihalFile}.pdf`;
      a.href = url; a.download = finalFilename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      const nextRes = await fetch("/api/nomor-surat");
      const nextJson = await nextRes.json().catch(() => null);
      if (nextJson?.nomorSurat) setNomorSurat(nextJson.nomorSurat);
    } catch (e) { console.error(e); alert(e instanceof Error ? e.message : "Gagal mengunduh PDF. Coba lagi."); }
    finally { setIsGenerating(false); }
  };

  return (
    <div className="flex-1 flex flex-col min-h-[100dvh]">
      {/* Professional Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-stone-200">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 h-[64px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0f6b4a] text-white grid place-items-center font-bold text-[11px]">GM</div>
            <div>
              <div className="text-[14px] font-semibold tracking-tight leading-none">GetMasjid <span className="font-normal text-stone-500">— Surat Resmi</span></div>
              <div className="text-[11px] text-stone-500 hidden sm:block -mt-0.5">Platform manajemen masjid • Generator surat</div>
            </div>
            <span className="hidden lg:inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-stone-50 ring-1 ring-stone-200 text-stone-600 ml-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> {nomorSurat}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden md:inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-stone-50 ring-1 ring-stone-200 text-stone-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Siap cetak A4
            </span>
            <button onClick={handleDownload} disabled={isGenerating} className="group hidden sm:inline-flex items-center gap-2 pl-4 pr-1.5 py-1.5 h-9 rounded-full bg-[#0f6b4a] text-white text-[13px] font-medium hover:bg-[#0d5a3f] disabled:opacity-60 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]">
              <span>{isGenerating ? "Memproses" : "Download PDF"}</span>
              <span className="w-6 h-6 rounded-full bg-white/15 grid place-items-center group-hover:translate-x-0.5 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5"><path d="M12 5v10M8 11l4 4 4-4M3 17v3h18v-3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
            </button>
            <button onClick={() => setMenuOpen(!menuOpen)} className="w-9 h-9 rounded-full bg-stone-900 text-white grid place-items-center md:hidden relative">
              <span className={`absolute w-3.5 h-[1.2px] bg-white rounded-full transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${menuOpen ? "rotate-45" : "-translate-y-1"}`}></span>
              <span className={`absolute w-3.5 h-[1.2px] bg-white rounded-full transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${menuOpen ? "-rotate-45" : "translate-y-1"}`}></span>
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t border-stone-200 bg-white px-4 py-3 flex flex-col gap-2">
            <div className="text-xs font-mono px-3 py-2 rounded-lg bg-stone-50 ring-1 ring-stone-200">{nomorSurat}</div>
            <button onClick={handleDownload} className="h-9 rounded-full bg-[#0f6b4a] text-white text-sm">Download PDF</button>
          </div>
        )}
      </header>

      {/* Professional Hero - compact */}
      <section className="max-w-[1280px] w-full mx-auto px-4 md:px-6 pt-6 sm:pt-8 md:pt-10 pb-5 sm:pb-6 border-b border-stone-200 bg-white">
        <div className={`flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 sm:gap-6 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${reveal ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
          <div className="space-y-2.5 sm:space-y-3">
            <span className="inline-flex rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] font-medium bg-stone-900 text-white">Generator Surat Resmi</span>
            <h1 className="text-[24px] sm:text-[28px] md:text-[32px] font-semibold tracking-tight leading-tight text-stone-900">
              Buat surat resmi <span className="text-[#0f6b4a]">GetMasjid</span> yang rapi,<br className="hidden md:block" /> siap kirim ke masjid & instansi
            </h1>
            <p className="text-[13px] leading-relaxed sm:leading-6 text-stone-600 max-w-[560px]">Nomor otomatis <span className="font-mono bg-stone-50 px-1 py-0.5 rounded ring-1 ring-stone-200">XXX/GMJ/MM/YYYY</span> • Kop & TTD custom • PDF A4 presisi.</p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <button onClick={handlePreview} className="inline-flex items-center gap-2 px-5 py-2.5 sm:py-2 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-sm transition active:scale-95">
              <span>Lihat Preview</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        </div>
      </section>

      {/* Main Editorial Split - Form + Preview */}
      <main className="max-w-[1280px] w-full mx-auto px-3 sm:px-4 md:px-6 py-6 md:py-4">
        <div className="flex justify-center mb-5 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-2.5 sm:p-1 rounded-2xl sm:rounded-full bg-black/[0.04] ring-1 ring-black/5 w-full sm:w-auto text-center sm:text-left">
            <span className="text-xs px-2 sm:px-3 py-0.5 text-stone-700">💾 Riwayat save-first — simpan dulu baru muncul di riwayat</span>
            <button onClick={handleSave} className="w-full sm:w-auto px-4 py-2 sm:py-1.5 rounded-full bg-black text-white text-xs font-medium hover:bg-stone-800 transition shadow-sm">Simpan Surat ke Riwayat</button>
          </div>
        </div>
        <div className="grid lg:grid-cols-[580px_1fr] gap-6 md:gap-8 items-start">
          <div className={`${showMobilePreview ? "hidden lg:block" : "block"} space-y-6 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${reveal ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
            <SettingsPanel kop={kopConfig} sig={sigConfig} onKopChange={setKopConfig} onSigChange={setSigConfig} />
            <LetterForm data={data} onChange={setData} onPreview={handlePreview} onDownload={handleDownload} onSave={handleSave} isGenerating={isGenerating} />
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { k: "Format Nomor", v: nomorSurat },
                { k: "Kertas", v: "A4 Premium" },
                { k: "Output", v: "PDF 300dpi" },
              ].map(card => (
                <div key={card.k} className="p-0.5 sm:p-1 rounded-2xl bg-black/[0.04] ring-1 ring-black/5">
                  <div className="rounded-[calc(1rem-2px)] bg-white p-2.5 sm:p-3.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] overflow-hidden">
                    <div className="text-[9px] sm:text-[10px] tracking-[0.08em] sm:tracking-[0.14em] uppercase font-medium text-stone-500 truncate">{card.k}</div>
                    <div className="text-[10.5px] sm:text-xs font-mono font-semibold text-stone-800 mt-1 truncate" title={card.v}>{card.v}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div ref={previewRef} className={`${showMobilePreview ? "block" : "hidden lg:block"} lg:sticky lg:top-[104px] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] delay-200 ${reveal ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"} space-y-6`}>
            <LetterPreview data={data} kop={kopConfig} sig={sigConfig} />
            <HistoryPanel items={history} onLoad={handleLoadHistory} onDelete={handleDeleteHistory} onDownload={handleDownloadHistory} />
            {/* Floating Action Bar on Mobile Preview */}
            {showMobilePreview && (
              <div className="lg:hidden fixed bottom-5 left-3 right-3 sm:left-6 sm:right-6 z-40 flex gap-2.5 bg-white/95 backdrop-blur-xl p-2 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.18)] ring-1 ring-black/10 transition-all">
                <button onClick={() => setShowMobilePreview(false)} className="flex-1 h-12 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-900 font-semibold text-xs uppercase tracking-wider transition active:scale-95 flex items-center justify-center gap-1.5 shadow-sm">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  <span>Edit Surat</span>
                </button>
                <button onClick={handleDownload} disabled={isGenerating} className="flex-1 h-12 rounded-xl bg-[#0f6b4a] hover:bg-[#0d5a3f] text-white font-semibold text-xs uppercase tracking-wider disabled:opacity-60 transition active:scale-95 flex items-center justify-center gap-1.5 shadow-md">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v12M8 11l4 4 4-4M3 17v3h18v-3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span>{isGenerating ? "Memproses..." : "Download PDF"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
        {/* History also for mobile form view */}
        <div className={`${showMobilePreview ? "hidden" : "block lg:hidden"} mt-8`}>
          <HistoryPanel items={history} onLoad={handleLoadHistory} onDelete={handleDeleteHistory} onDownload={handleDownloadHistory} />
        </div>
      </main>

      <footer className="mt-auto border-t border-black/5 bg-white">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 h-14 flex items-center justify-between text-xs text-stone-500">
          <span>© {new Date().getFullYear()} GetMasjid • PT GetMasjid Digital Indonesia</span>
          <span className="hidden md:inline text-stone-400">Surat resmi • A4 • PDF</span>
        </div>
      </footer>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-full text-sm shadow-[0_12px_40px_rgba(0,0,0,0.2)] z-50 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]">
          {toast}
        </div>
      )}
    </div>
  );
}
