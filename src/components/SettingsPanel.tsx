"use client";

import { KopSuratConfig, SignatureConfig } from "@/types/letter";
import { DEFAULT_KOP, DEFAULT_SIG } from "@/lib/kop-defaults";
import { useRef, useState } from "react";
import { removeBackground, pdfToImageDataUrl } from "@/lib/bg-remove";
import { UNS_LOGO_SVG, GETMASJID_LOGO_SVG } from "@/lib/uns-logos";

interface Props {
  kop: KopSuratConfig;
  sig: SignatureConfig;
  onKopChange: (k: KopSuratConfig) => void;
  onSigChange: (s: SignatureConfig) => void;
}

export function SettingsPanel({ kop, sig, onKopChange, onSigChange }: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"kop" | "ttd">("kop");
  const logoRef = useRef<HTMLInputElement>(null);
  const unsLogoRef = useRef<HTMLInputElement>(null);
  const sigRef = useRef<HTMLInputElement>(null);
  const stampRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  // Logo crop states
  const [cropTarget, setCropTarget] = useState<"getmasjid" | "uns">("getmasjid");
  const [logoRaw, setLogoRaw] = useState<string | null>(null);
  const [showLogoCrop, setShowLogoCrop] = useState(false);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleImageFile = async (file: File | undefined, cb: (dataUrl: string) => void) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("File maksimal 5MB"); return; }
    const reader = new FileReader();
    reader.onload = () => cb(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = (file: File | undefined, target: "getmasjid" | "uns" = "getmasjid") => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("File maksimal 5MB"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCropTarget(target);
      setLogoRaw(dataUrl);
      setCropZoom(1);
      setCropOffset({ x: 0, y: 0 });
      setShowLogoCrop(true);
    };
    reader.readAsDataURL(file);
  };

  const applyLogoCrop = async () => {
    if (!logoRaw) return;
    try {
      setProcessing("logo-crop");
      const cropped = await cropToSquare(logoRaw, cropZoom, cropOffset.x, cropOffset.y);
      if (cropTarget === "uns") {
        onKopChange({ ...kop, unsLogoImage: cropped });
      } else {
        onKopChange({ ...kop, logoImage: cropped });
      }
      setShowLogoCrop(false);
    } catch (e) { console.error(e); alert("Gagal crop logo"); }
    finally { setProcessing(null); }
  };

  const reopenLogoCrop = (target: "getmasjid" | "uns" = "getmasjid") => {
    const currentImg = target === "uns" 
      ? (kop.unsLogoImage || UNS_LOGO_SVG) 
      : (kop.logoImage || DEFAULT_KOP.logoImage || GETMASJID_LOGO_SVG);
    if (!currentImg) return;
    setCropTarget(target);
    setLogoRaw(currentImg);
    setCropZoom(1);
    setCropOffset({ x: 0, y: 0 });
    setShowLogoCrop(true);
  };

  const handlePdfOrImage = async (file: File | undefined, cb: (dataUrl: string) => void) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("File maksimal 5MB"); return; }
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      try { setProcessing("pdf-sig"); const dataUrl = await pdfToImageDataUrl(file, 2); const cleaned = await removeBackground(dataUrl, { threshold: 225 }); cb(cleaned); }
      catch (e) { alert("Gagal baca PDF. Coba export ke JPG."); console.error(e); }
      finally { setProcessing(null); }
    } else handleImageFile(file, cb);
  };

  const doRemoveBg = async (dataUrl: string, setter: (v: string) => void, key: string) => {
    try { setProcessing(key); const cleaned = await removeBackground(dataUrl, { threshold: 228, feather: 18 }); setter(cleaned); }
    catch (e) { alert("Gagal hapus background"); console.error(e); } finally { setProcessing(null); }
  };

  const isUnsTemplate = kop.template === "uns_colored_v1";

  return (
    <div className="w-full min-w-0 p-1 rounded-[1.75rem] bg-black/[0.04] ring-1 ring-black/5">
      <div className="w-full min-w-0 rounded-[calc(1.75rem-0.25rem)] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden transition-all">
        <button 
          type="button" 
          onClick={() => setOpen((v) => !v)} 
          className="w-full flex items-center justify-between p-3.5 sm:px-6 sm:py-4.5 hover:bg-stone-50/70 transition-all text-left group"
        >
          <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 pr-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600/15 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-[13px] sm:text-[14px] font-semibold text-stone-900 tracking-tight">
                Pengaturan Kop & Tanda Tangan
              </div>
              <div className="text-[11px] text-stone-500 truncate mt-0.5">
                Kustom template kop, logo UNS / GetMasjid, cap & tanda tangan
              </div>
            </div>
          </div>
          <div className="shrink-0">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-semibold transition-all ${open ? "bg-[#0f6b4a] text-white shadow-sm" : "bg-stone-100 hover:bg-stone-200 text-stone-700 ring-1 ring-black/5"}`}>
              <span>{open ? "Tutup" : "Buka"}</span>
              <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${open ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </button>

        {open && (
          <div className="border-t border-black/5 bg-[#FAFAF8]/50">
            <div className="flex gap-1.5 p-1 bg-white ring-1 ring-black/5 rounded-full w-fit mx-4 sm:mx-6 mt-4 shadow-sm">
              <button 
                type="button"
                onClick={() => setTab("kop")} 
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${tab === "kop" ? "bg-[#0f6b4a] text-white shadow-sm" : "text-stone-600 hover:text-stone-900"}`}
              >
                Kop Surat
              </button>
              <button 
                type="button"
                onClick={() => setTab("ttd")} 
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${tab === "ttd" ? "bg-[#0f6b4a] text-white shadow-sm" : "text-stone-600 hover:text-stone-900"}`}
              >
                Tanda Tangan & Cap
              </button>
            </div>

            <div className="p-3.5 sm:p-5 md:p-6">
              {tab === "kop" && (
                <div className="space-y-5">
                  {/* Pilihan Template Kop */}
                  <div className="p-3.5 rounded-2xl bg-black/[0.03] ring-1 ring-black/5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-stone-800 tracking-tight">Pilihan Template Kop Surat</div>
                      <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-white ring-1 ring-black/5 text-stone-500 font-medium">2 Desain</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => onKopChange({ ...kop, template: "default" })}
                        className={`p-3 rounded-xl text-left border transition-all duration-300 ${
                          (!kop.template || kop.template === "default")
                            ? "bg-white border-emerald-600 ring-2 ring-emerald-600/10 shadow-sm"
                            : "bg-white/60 border-black/5 hover:bg-white hover:border-black/10"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#0f6b4a]"></span>
                          <span className="text-[12.5px] font-bold text-stone-900">Standar GetMasjid</span>
                        </div>
                        <div className="text-[11px] text-stone-500 mt-1 leading-snug">Header resmi GetMasjid warna hijau dengan garis horizontal bawah.</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => onKopChange({ ...kop, template: "uns_colored_v1" })}
                        className={`p-3 rounded-xl text-left border transition-all duration-300 ${
                          kop.template === "uns_colored_v1"
                            ? "bg-white border-[#0096D6] ring-2 ring-[#0096D6]/15 shadow-sm"
                            : "bg-white/60 border-black/5 hover:bg-white hover:border-black/10"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#FBBF24]"></span>
                          <span className="text-[12.5px] font-bold text-stone-900">Template UNS (Aksen Warna & Dual Logo)</span>
                        </div>
                        <div className="text-[11px] text-stone-500 mt-1 leading-snug">Aksen bar kuning-biru, dual logo UNS + GetMasjid (kedua logo bisa diganti).</div>
                      </button>
                    </div>
                  </div>

                  {/* Pengaturan Logo Berdasarkan Template */}
                  {isUnsTemplate ? (
                    <div className="space-y-4">
                      <div className="text-xs font-semibold text-stone-800 flex items-center justify-between">
                        <span>Pengaturan Logo Kop Surat (Dual Logo)</span>
                        <span className="text-[10.5px] text-stone-500 font-normal">Kedua logo dapat diatur ukuran, posisi, diganti, di-crop & dihapus BG</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Logo 1: Mitra / UNS (Kiri) */}
                        <div className="p-3.5 rounded-2xl bg-white ring-1 ring-black/5 shadow-sm space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-stone-800">1. Logo Kiri (UNS / Mitra)</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 font-semibold">Mitra / Kampus</span>
                          </div>
                          <div className="h-[80px] rounded-xl ring-1 ring-black/5 grid place-items-center overflow-hidden p-2 relative" style={{ background: checkerBg }}>
                            <div style={{ transform: `translate(${kop.unsLogoOffsetX ?? 0}px, ${kop.unsLogoOffsetY ?? 0}px) scale(${kop.unsLogoScale ?? 1})`, transformOrigin: "center center", transition: "transform 0.15s ease" }}>
                              <img 
                                src={kop.unsLogoImage || UNS_LOGO_SVG} 
                                alt="Logo UNS/Mitra" 
                                className="max-h-[56px] max-w-[140px] object-contain" 
                              />
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            <button 
                              type="button"
                              onClick={() => unsLogoRef.current?.click()} 
                              className="h-7 px-2.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] font-medium transition"
                            >
                              Ganti Logo
                            </button>
                            <button 
                              type="button"
                              onClick={() => reopenLogoCrop("uns")} 
                              className="h-7 px-2.5 rounded-full bg-black text-white text-[11px] font-medium"
                            >
                              ✂️ Crop
                            </button>
                            <button 
                              type="button"
                              disabled={processing === "logo-uns"} 
                              onClick={() => doRemoveBg(kop.unsLogoImage || UNS_LOGO_SVG, (v) => onKopChange({ ...kop, unsLogoImage: v }), "logo-uns")} 
                              className="h-7 px-2.5 rounded-full bg-[#0096D6] hover:bg-[#0084c7] text-white text-[11px] font-medium disabled:opacity-60 flex items-center gap-1"
                            >
                              {processing === "logo-uns" ? <span className="w-2.5 h-2.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : "✨ Hapus BG"}
                            </button>
                            {kop.unsLogoImage && (
                              <button 
                                type="button"
                                onClick={() => onKopChange({ ...kop, unsLogoImage: undefined })} 
                                className="h-7 px-2.5 rounded-full bg-white ring-1 ring-black/5 text-[11px] text-stone-600 hover:text-stone-900"
                              >
                                Reset UNS
                              </button>
                            )}
                          </div>

                          {/* Sliders Ukuran & Posisi Logo 1 */}
                          <div className="space-y-2 pt-2 border-t border-black/5">
                            <div>
                              <div className="flex items-center justify-between text-[11px] text-stone-600 mb-1">
                                <span>Ukuran: {Math.round((kop.unsLogoScale ?? 1) * 100)}%</span>
                                {(kop.unsLogoScale && kop.unsLogoScale !== 1) && (
                                  <button type="button" onClick={() => onKopChange({ ...kop, unsLogoScale: 1 })} className="text-[10px] text-blue-600 underline">Reset</button>
                                )}
                              </div>
                              <input 
                                type="range" 
                                min="0.5" 
                                max="2.2" 
                                step="0.05" 
                                value={kop.unsLogoScale ?? 1} 
                                onChange={(e) => onKopChange({ ...kop, unsLogoScale: parseFloat(e.target.value) })} 
                                className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#0096D6]" 
                              />
                            </div>
                            <div>
                              <div className="flex items-center justify-between text-[11px] text-stone-600 mb-1">
                                <span>Posisi Kanan-Kiri: {kop.unsLogoOffsetX ?? 0}px</span>
                                {(kop.unsLogoOffsetX && kop.unsLogoOffsetX !== 0) && (
                                  <button type="button" onClick={() => onKopChange({ ...kop, unsLogoOffsetX: 0 })} className="text-[10px] text-blue-600 underline">Reset</button>
                                )}
                              </div>
                              <input 
                                type="range" 
                                min="-45" 
                                max="45" 
                                step="1" 
                                value={kop.unsLogoOffsetX ?? 0} 
                                onChange={(e) => onKopChange({ ...kop, unsLogoOffsetX: parseInt(e.target.value) })} 
                                className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#0096D6]" 
                              />
                            </div>
                          </div>

                          <input 
                            ref={unsLogoRef} 
                            type="file" 
                            accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml" 
                            className="hidden" 
                            onChange={(e) => handleLogoUpload(e.target.files?.[0], "uns")} 
                          />
                        </div>

                        {/* Logo 2: GetMasjid (Kanan) */}
                        <div className="p-3.5 rounded-2xl bg-white ring-1 ring-black/5 shadow-sm space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-stone-800">2. Logo Kanan (GetMasjid)</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-semibold">GetMasjid</span>
                          </div>
                          <div className="h-[80px] rounded-xl ring-1 ring-black/5 grid place-items-center overflow-hidden p-2 relative" style={{ background: checkerBg }}>
                            <div style={{ transform: `translate(${kop.logoOffsetX ?? 0}px, ${kop.logoOffsetY ?? 0}px) scale(${kop.logoScale ?? 1})`, transformOrigin: "center center", transition: "transform 0.15s ease" }}>
                              <img 
                                src={kop.logoImage || GETMASJID_LOGO_SVG} 
                                alt="Logo GetMasjid" 
                                className="max-h-[56px] max-w-[140px] object-contain" 
                              />
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            <button 
                              type="button"
                              onClick={() => logoRef.current?.click()} 
                              className="h-7 px-2.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] font-medium transition"
                            >
                              Ganti Logo
                            </button>
                            <button 
                              type="button"
                              onClick={() => reopenLogoCrop("getmasjid")} 
                              className="h-7 px-2.5 rounded-full bg-black text-white text-[11px] font-medium"
                            >
                              ✂️ Crop
                            </button>
                            <button 
                              type="button"
                              disabled={processing === "logo-gmj"} 
                              onClick={() => doRemoveBg(kop.logoImage || GETMASJID_LOGO_SVG, (v) => onKopChange({ ...kop, logoImage: v }), "logo-gmj")} 
                              className="h-7 px-2.5 rounded-full bg-[#0f6b4a] hover:bg-[#0d5a3f] text-white text-[11px] font-medium disabled:opacity-60 flex items-center gap-1"
                            >
                              {processing === "logo-gmj" ? <span className="w-2.5 h-2.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : "✨ Hapus BG"}
                            </button>
                            {kop.logoImage && (
                              <button 
                                type="button"
                                onClick={() => onKopChange({ ...kop, logoImage: undefined })} 
                                className="h-7 px-2.5 rounded-full bg-white ring-1 ring-black/5 text-[11px] text-stone-600 hover:text-stone-900"
                              >
                                Reset GM
                              </button>
                            )}
                          </div>

                          {/* Sliders Ukuran & Posisi Logo 2 */}
                          <div className="space-y-2 pt-2 border-t border-black/5">
                            <div>
                              <div className="flex items-center justify-between text-[11px] text-stone-600 mb-1">
                                <span>Ukuran: {Math.round((kop.logoScale ?? 1) * 100)}%</span>
                                {(kop.logoScale && kop.logoScale !== 1) && (
                                  <button type="button" onClick={() => onKopChange({ ...kop, logoScale: 1 })} className="text-[10px] text-emerald-700 underline">Reset</button>
                                )}
                              </div>
                              <input 
                                type="range" 
                                min="0.5" 
                                max="2.2" 
                                step="0.05" 
                                value={kop.logoScale ?? 1} 
                                onChange={(e) => onKopChange({ ...kop, logoScale: parseFloat(e.target.value) })} 
                                className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#0f6b4a]" 
                              />
                            </div>
                            <div>
                              <div className="flex items-center justify-between text-[11px] text-stone-600 mb-1">
                                <span>Posisi Kanan-Kiri: {kop.logoOffsetX ?? 0}px</span>
                                {(kop.logoOffsetX && kop.logoOffsetX !== 0) && (
                                  <button type="button" onClick={() => onKopChange({ ...kop, logoOffsetX: 0 })} className="text-[10px] text-emerald-700 underline">Reset</button>
                                )}
                              </div>
                              <input 
                                type="range" 
                                min="-45" 
                                max="45" 
                                step="1" 
                                value={kop.logoOffsetX ?? 0} 
                                onChange={(e) => onKopChange({ ...kop, logoOffsetX: parseInt(e.target.value) })} 
                                className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#0f6b4a]" 
                              />
                            </div>
                          </div>

                          <input 
                            ref={logoRef} 
                            type="file" 
                            accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml" 
                            className="hidden" 
                            onChange={(e) => handleLogoUpload(e.target.files?.[0], "getmasjid")} 
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-white ring-1 ring-black/5 shadow-sm space-y-4">
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start">
                        <div className="w-[88px] h-[88px] rounded-2xl ring-1 ring-black/5 grid place-items-center overflow-hidden shrink-0 relative" style={{ background: checkerBg }}>
                          <div style={{ transform: `translate(${kop.logoOffsetX ?? 0}px, ${kop.logoOffsetY ?? 0}px) scale(${kop.logoScale ?? 1})`, transformOrigin: "center center", transition: "transform 0.15s ease" }}>
                            {kop.logoImage ? <img src={kop.logoImage} alt="logo" className="w-full h-full object-contain p-1.5" /> : <div className="w-12 h-12 rounded-xl grid place-items-center text-white font-bold text-sm" style={{ background: kop.accentColor }}>{kop.logoText}</div>}
                          </div>
                        </div>
                        <div className="flex-1 space-y-2 w-full min-w-0">
                          <div className="text-xs font-medium text-stone-700">Logo GetMasjid — Preview & Crop</div>
                          <p className="text-[11px] text-stone-500">Upload → geser & zoom di preview → crop. Bisa hapus background juga.</p>
                          <div className="flex flex-wrap gap-2">
                            <button onClick={() => logoRef.current?.click()} className="h-8 px-3 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium transition">Upload Logo</button>
                            {kop.logoImage && (
                              <>
                                <button onClick={() => reopenLogoCrop("getmasjid")} className="h-8 px-3 rounded-full bg-black text-white text-xs font-medium">✂️ Crop / Geser</button>
                                <button disabled={processing === "logo"} onClick={() => doRemoveBg(kop.logoImage!, (v) => onKopChange({ ...kop, logoImage: v }), "logo")} className="h-8 px-3 rounded-full bg-[#0f6b4a] text-white text-xs font-medium disabled:opacity-60 flex items-center gap-1.5">
                                  {processing === "logo" ? <><span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Memproses</> : <>✨ Hapus BG</>}
                                </button>
                                <button onClick={() => onKopChange({ ...kop, logoImage: undefined })} className="h-8 px-3 rounded-full bg-white ring-1 ring-black/5 text-xs">Hapus</button>
                              </>
                            )}
                          </div>
                          <input ref={logoRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml" className="hidden" onChange={(e) => handleLogoUpload(e.target.files?.[0], "getmasjid")} />
                          <div className="flex gap-2 items-center pt-1 flex-wrap">
                            <span className="text-xs text-stone-600">Inisial</span><input value={kop.logoText} onChange={(e) => onKopChange({ ...kop, logoText: e.target.value.slice(0, 4).toUpperCase() })} className="w-16 h-7 rounded-full bg-[#FDFBF7] ring-1 ring-black/5 px-2 text-xs text-center" placeholder="GM" />
                            <span className="text-xs text-stone-600">Warna</span><input type="color" value={kop.accentColor} onChange={(e) => onKopChange({ ...kop, accentColor: e.target.value })} className="w-7 h-7 rounded-full ring-1 ring-black/5 p-0.5" />
                          </div>
                        </div>
                      </div>

                      {/* Sliders Ukuran & Posisi Standard Logo */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-black/5">
                        <div>
                          <div className="flex items-center justify-between text-[11px] text-stone-600 mb-1">
                            <span>Ukuran Logo: {Math.round((kop.logoScale ?? 1) * 100)}%</span>
                            {(kop.logoScale && kop.logoScale !== 1) && (
                              <button type="button" onClick={() => onKopChange({ ...kop, logoScale: 1 })} className="text-[10px] text-emerald-700 underline">Reset</button>
                            )}
                          </div>
                          <input 
                            type="range" 
                            min="0.5" 
                            max="2.2" 
                            step="0.05" 
                            value={kop.logoScale ?? 1} 
                            onChange={(e) => onKopChange({ ...kop, logoScale: parseFloat(e.target.value) })} 
                            className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#0f6b4a]" 
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-[11px] text-stone-600 mb-1">
                            <span>Posisi Kanan-Kiri: {kop.logoOffsetX ?? 0}px</span>
                            {(kop.logoOffsetX && kop.logoOffsetX !== 0) && (
                              <button type="button" onClick={() => onKopChange({ ...kop, logoOffsetX: 0 })} className="text-[10px] text-emerald-700 underline">Reset</button>
                            )}
                          </div>
                          <input 
                            type="range" 
                            min="-45" 
                            max="45" 
                            step="1" 
                            value={kop.logoOffsetX ?? 0} 
                            onChange={(e) => onKopChange({ ...kop, logoOffsetX: parseInt(e.target.value) })} 
                            className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#0f6b4a]" 
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {showLogoCrop && logoRaw && (
                    <div className="p-1 rounded-[1.5rem] bg-black/[0.04] ring-1 ring-black/5">
                      <div className="rounded-[calc(1.5rem-4px)] bg-white p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-medium">
                            Preview & Crop Logo {cropTarget === "uns" ? "(Logo Mitra / UNS)" : "(Logo GetMasjid)"}
                          </div>
                          <span className="text-[11px] px-2 py-1 rounded-full bg-[#FDFBF7] ring-1 ring-black/5">Geser untuk posisi • Zoom untuk ukuran</span>
                        </div>
                        <div
                          className="relative w-full h-[220px] rounded-2xl overflow-hidden ring-1 ring-black/10 cursor-grab active:cursor-grabbing select-none"
                          style={{ background: checkerBg }}
                          onMouseDown={(e) => { setIsDragging(true); setDragStart({ x: e.clientX - cropOffset.x, y: e.clientY - cropOffset.y }); }}
                          onMouseMove={(e) => { if (isDragging) setCropOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }); }}
                          onMouseUp={() => setIsDragging(false)}
                          onMouseLeave={() => setIsDragging(false)}
                          onTouchStart={(e) => { const t=e.touches[0]; setIsDragging(true); setDragStart({ x: t.clientX - cropOffset.x, y: t.clientY - cropOffset.y }); }}
                          onTouchMove={(e) => { if (isDragging) { const t=e.touches[0]; setCropOffset({ x: t.clientX - dragStart.x, y: t.clientY - dragStart.y }); } }}
                          onTouchEnd={() => setIsDragging(false)}
                        >
                          <img src={logoRaw} alt="crop preview" draggable={false} className="absolute top-1/2 left-1/2 max-w-none select-none pointer-events-none" style={{ transform: `translate(-50%, -50%) translate(${cropOffset.x}px, ${cropOffset.y}px) scale(${cropZoom})`, maxWidth: "180px", maxHeight: "180px", width: "auto", height: "auto" }} />
                          <div className="absolute inset-0 pointer-events-none ring-1 ring-black/10 rounded-2xl" />
                          <div className="absolute top-2 left-2 text-[10px] px-2 py-1 rounded-full bg-black/70 text-white">Preview 1:1 • Hasil crop transparan</div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between"><span className="text-[11px] text-stone-600">Zoom</span><span className="text-xs font-mono">{Math.round(cropZoom*100)}%</span></div>
                          <input type="range" min={0.6} max={2.5} step={0.05} value={cropZoom} onChange={(e)=>setCropZoom(parseFloat(e.target.value))} className="w-full" />
                          <div className="flex gap-2">
                            <button onClick={()=>setCropOffset({x:0,y:0})} className="text-xs px-3 py-1.5 rounded-full bg-white ring-1 ring-black/5">Reset Posisi</button>
                            <span className="text-[11px] text-stone-500 self-center">Geser gambar di atas</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={()=>setShowLogoCrop(false)} className="flex-1 h-9 rounded-full bg-white ring-1 ring-black/5 text-sm">Batal</button>
                          <button disabled={processing==="logo-crop"} onClick={applyLogoCrop} className="flex-1 h-9 rounded-full bg-black text-white text-sm disabled:opacity-60 flex items-center justify-center gap-2">
                            {processing==="logo-crop" ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Memproses</> : <>✂️ Terapkan Crop</>}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4">
                    <Field label="Nama Brand" value={kop.companyName} disabled={true} />
                    <Field label="Nama Legal PT" value={kop.legalName || ""} onChange={(v) => onKopChange({ ...kop, legalName: v })} placeholder="Opsional (bisa dikosongi)" />
                  </div>
                  <Field label="Tagline" value={kop.tagline} disabled={true} />
                  <Field label="Alamat Lengkap" value={kop.alamat} disabled={true} />
                  <div className="grid md:grid-cols-3 gap-4">
                    <Field label="Email" value={kop.email} disabled={true} />
                    <Field label="Website" value={kop.website} disabled={true} />
                    <Field label="Telepon" value={kop.phone} disabled={true} />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => onKopChange(DEFAULT_KOP)} className="text-xs px-3 py-1.5 rounded-full bg-[#FDFBF7] ring-1 ring-black/5 hover:bg-white transition">Reset Default</button>
                    <span className="text-[11px] text-stone-500 self-center">Otomatis tampil di preview.</span>
                  </div>
                </div>
              )}

              {tab === "ttd" && (
                <div className="space-y-6">
                  <div className="p-1 rounded-[1.5rem] bg-emerald-50 ring-1 ring-emerald-100">
                    <div className="rounded-[calc(1.5rem-4px)] bg-white p-3.5 sm:p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-medium text-emerald-800">Tanda Tangan CEO — PDF / JPG / PNG</div>
                        <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={sig.showSignature} onChange={(e) => onSigChange({ ...sig, showSignature: e.target.checked })} className="rounded" /> Tampilkan</label>
                      </div>
                      <p className="text-[11px] text-stone-600 mb-3">Upload PDF scan atau JPG. Auto hapus background putih jadi transparan & autocrop.</p>
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <div className="w-full sm:flex-1 h-[110px] rounded-2xl ring-1 ring-black/5 grid place-items-center overflow-hidden p-2 relative" style={{ background: checkerBg }}>
                          {sig.signatureImage ? <img src={sig.signatureImage} alt="ttd" className="max-h-full max-w-full object-contain" style={{ transform: `scale(${sig.signatureScale})` }} /> : <span className="text-xs text-stone-500 text-center px-2">Belum ada • upload lalu hapus BG</span>}
                          {processing === "pdf-sig" && <div className="absolute inset-0 bg-white/80 grid place-items-center text-xs font-medium">Membaca PDF...</div>}
                        </div>
                        <div className="flex flex-col gap-2 w-full sm:w-auto sm:min-w-[132px]">
                          <button onClick={() => sigRef.current?.click()} className="h-8 px-3 rounded-full bg-white ring-1 ring-black/5 text-xs font-medium">Upload PDF/JPG</button>
                          {sig.signatureImage && (
                            <>
                              <button disabled={processing === "sig"} onClick={() => doRemoveBg(sig.signatureImage!, (v) => onSigChange({ ...sig, signatureImage: v }), "sig")} className="h-8 px-3 rounded-full bg-[#0f6b4a] text-white text-xs font-medium disabled:opacity-60 flex items-center justify-center gap-1">{processing === "sig" ? <><span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Proses</> : <>✨ Hapus BG</>}</button>
                              <button onClick={() => onSigChange({ ...sig, signatureImage: undefined })} className="h-8 px-3 rounded-full bg-black text-white text-xs">Hapus</button>
                            </>
                          )}
                          <input ref={sigRef} type="file" accept=".pdf,image/png,image/jpeg,image/jpg,application/pdf" className="hidden" onChange={(e) => handlePdfOrImage(e.target.files?.[0], (v) => onSigChange({ ...sig, signatureImage: v }))} />
                        </div>
                      </div>
                      <div className="mt-3"><div className="text-[11px] text-stone-600 mb-1">Ukuran: {Math.round(sig.signatureScale * 100)}%</div><input type="range" min={0.7} max={1.6} step={0.1} value={sig.signatureScale} onChange={(e) => onSigChange({ ...sig, signatureScale: parseFloat(e.target.value) })} className="w-full" /></div>
                    </div>
                  </div>

                  <div className="p-1 rounded-[1.5rem] bg-black/[0.03] ring-1 ring-black/5">
                    <div className="rounded-[calc(1.5rem-4px)] bg-white p-3.5 sm:p-4">
                      <div className="flex items-center justify-between mb-1"><div className="text-xs font-medium text-stone-700">Cap / Stempel Resmi — GetMasjid</div><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={sig.showStamp} onChange={(e) => onSigChange({ ...sig, showStamp: e.target.checked })} className="rounded" /> Tampilkan</label></div>
                      <p className="text-[11px] text-stone-500 mb-3">Default: cap resmi double-circle dengan text melingkar. Bisa upload PNG/JPG custom & hapus BG.</p>
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <div className="w-full sm:flex-1 h-[96px] rounded-2xl ring-1 ring-black/5 grid place-items-center overflow-hidden p-2 relative" style={{ background: checkerBg }}>
                          {sig.stampImage ? <img src={sig.stampImage} alt="cap" className="max-h-full max-w-full object-contain" style={{ opacity: sig.stampOpacity }} /> : <span className="text-xs text-stone-500 text-center">Default cap resmi • Upload jika punya</span>}
                        </div>
                        <div className="flex flex-col gap-2 w-full sm:w-auto sm:min-w-[132px]">
                          <button onClick={() => stampRef.current?.click()} className="h-8 px-3 rounded-full bg-white ring-1 ring-black/5 text-xs font-medium">Upload Cap</button>
                          {sig.stampImage && (<><button disabled={processing === "stamp"} onClick={() => doRemoveBg(sig.stampImage!, (v) => onSigChange({ ...sig, stampImage: v }), "stamp")} className="h-8 px-3 rounded-full bg-[#0f6b4a] text-white text-xs disabled:opacity-60">{processing === "stamp" ? "Proses..." : "✨ Hapus BG"}</button><button onClick={() => onSigChange({ ...sig, stampImage: undefined })} className="h-8 px-3 rounded-full bg-black text-white text-xs">Hapus</button></>)}
                          <input ref={stampRef} type="file" accept="image/png,image/jpeg,image/jpg" className="hidden" onChange={(e) => handleImageFile(e.target.files?.[0], (v) => onSigChange({ ...sig, stampImage: v }))} />
                        </div>
                      </div>
                      <div className="mt-3"><div className="text-[11px] text-stone-600 mb-1">Transparansi: {Math.round(sig.stampOpacity * 100)}%</div><input type="range" min={0.5} max={1} step={0.05} value={sig.stampOpacity} onChange={(e) => onSigChange({ ...sig, stampOpacity: parseFloat(e.target.value) })} className="w-full" /></div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button onClick={() => onSigChange(DEFAULT_SIG)} className="text-xs px-3 py-1.5 rounded-full bg-[#FDFBF7] ring-1 ring-black/5 hover:bg-white">Reset Default</button>
                    <span className="text-[11px] text-stone-500 self-center">Preview = PDF akhir, transparan.</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
const checkerBg = `repeating-conic-gradient(#f5f5f4 0% 25%, white 0% 50%) 0 0 / 16px 16px`;

async function cropToSquare(dataUrl: string, zoom: number, offsetX: number, offsetY: number, outSize = 600): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = outSize;
      canvas.height = outSize;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas error"));
      ctx.clearRect(0, 0, outSize, outSize);
      // preview container 220, output 600 -> factor
      const previewSize = 220;
      const fitScale = Math.min(180 / img.width, 180 / img.height);
      const base = fitScale * (outSize / previewSize);
      const finalZoom = base * zoom;
      ctx.save();
      ctx.translate(outSize / 2 + offsetX * (outSize / previewSize), outSize / 2 + offsetY * (outSize / previewSize));
      ctx.scale(finalZoom, finalZoom);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("Gagal load image"));
    img.src = dataUrl;
  });
}
function Field({ label, value, onChange, placeholder, disabled }: { label: string; value: string; onChange?: (v: string) => void; placeholder?: string; disabled?: boolean }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] tracking-[0.08em] uppercase font-medium text-stone-600">{label}</label>
      <input 
        disabled={disabled}
        value={value} 
        onChange={(e) => onChange?.(e.target.value)} 
        placeholder={placeholder} 
        className="w-full h-9 rounded-full bg-[#FDFBF7] ring-1 ring-black/5 px-3.5 text-sm outline-none focus:ring-2 focus:ring-[#0f6b4a]/20 focus:bg-white transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] disabled:opacity-60 disabled:cursor-not-allowed" 
      />
    </div>
  );
}
