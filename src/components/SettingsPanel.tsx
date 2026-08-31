"use client";

import { KopSuratConfig, SignatureConfig } from "@/types/letter";
import { DEFAULT_KOP, DEFAULT_SIG } from "@/lib/kop-defaults";
import { useRef, useState } from "react";
import { removeBackground, pdfToImageDataUrl } from "@/lib/bg-remove";

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
  const sigRef = useRef<HTMLInputElement>(null);
  const stampRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  // Logo crop states
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

  const handleLogoUpload = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("File maksimal 5MB"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
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
      onKopChange({ ...kop, logoImage: cropped });
      setShowLogoCrop(false);
    } catch (e) { console.error(e); alert("Gagal crop logo"); }
    finally { setProcessing(null); }
  };

  const reopenLogoCrop = () => {
    if (!kop.logoImage) return;
    setLogoRaw(kop.logoImage);
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

  return (
    <div className="p-1.5 rounded-[2rem] bg-black/[0.04] ring-1 ring-black/5">
      <div className="rounded-[calc(2rem-0.375rem)] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_12px_40px_rgba(0,0,0,0.06)] overflow-hidden">
        <button type="button" onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between px-6 md:px-7 py-5 hover:bg-black/[0.02] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#1c1a17] text-white grid place-items-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.3"><path d="M12 8a4 4 0 100 8 4 4 0 000-8z"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.42-1.42"/></svg>
            </div>
            <div className="text-left">
              <div className="text-[13px] font-medium tracking-tight text-[#1c1a17]">Pengaturan Kop & Tanda Tangan</div>
              <div className="text-[11px] text-stone-500">Hapus background otomatis • Cap resmi GetMasjid • Preview = PDF</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[11px] px-2.5 py-1 rounded-full ring-1 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? "bg-black text-white ring-black" : "bg-[#FDFBF7] ring-black/5 text-stone-600"}`}>{open ? "Tutup" : "Atur"}</span>
            <span className={`w-7 h-7 rounded-full bg-black text-white grid place-items-center transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? "rotate-180" : ""}`}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5"><path d="M6 9l6 6 6-6"/></svg>
            </span>
          </div>
        </button>

        {open && (
          <div className="border-t border-black/5">
            <div className="flex gap-1 p-1 bg-[#FDFBF7] ring-1 ring-black/5 rounded-full w-fit mx-5 mt-4">
              <button onClick={() => setTab("kop")} className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${tab === "kop" ? "bg-black text-white shadow" : "text-stone-600 hover:text-black"}`}>Kop Surat</button>
              <button onClick={() => setTab("ttd")} className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${tab === "ttd" ? "bg-black text-white shadow" : "text-stone-600 hover:text-black"}`}>Tanda Tangan & Cap</button>
            </div>

            <div className="p-5 md:p-6">
              {tab === "kop" && (
                <div className="space-y-5">
                  <div className="flex gap-4 items-start">
                    <div className="w-[88px] h-[88px] rounded-2xl ring-1 ring-black/5 grid place-items-center overflow-hidden shrink-0 relative" style={{ background: checkerBg }}>
                      {kop.logoImage ? <img src={kop.logoImage} alt="logo" className="w-full h-full object-contain p-1.5" /> : <div className="w-12 h-12 rounded-xl grid place-items-center text-white font-bold text-sm" style={{ background: kop.accentColor }}>{kop.logoText}</div>}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="text-xs font-medium text-stone-700">Logo GetMasjid — Preview & Crop</div>
                      <p className="text-[11px] text-stone-500">Upload → geser & zoom di preview → crop. Bisa hapus background juga.</p>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => logoRef.current?.click()} className="h-8 px-3 rounded-full bg-white ring-1 ring-black/5 text-xs font-medium hover:bg-[#FDFBF7] transition">Upload Logo</button>
                        {kop.logoImage && (
                          <>
                            <button onClick={reopenLogoCrop} className="h-8 px-3 rounded-full bg-black text-white text-xs font-medium">✂️ Crop / Geser</button>
                            <button disabled={processing === "logo"} onClick={() => doRemoveBg(kop.logoImage!, (v) => onKopChange({ ...kop, logoImage: v }), "logo")} className="h-8 px-3 rounded-full bg-[#0f6b4a] text-white text-xs font-medium disabled:opacity-60 flex items-center gap-1.5">
                              {processing === "logo" ? <><span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Memproses</> : <>✨ Hapus BG</>}
                            </button>
                            <button onClick={() => onKopChange({ ...kop, logoImage: undefined })} className="h-8 px-3 rounded-full bg-white ring-1 ring-black/5 text-xs">Hapus</button>
                          </>
                        )}
                      </div>
                      <input ref={logoRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" className="hidden" onChange={(e) => handleLogoUpload(e.target.files?.[0])} />
                      <div className="flex gap-2 items-center pt-1 flex-wrap">
                        <span className="text-xs text-stone-600">Inisial</span><input value={kop.logoText} onChange={(e) => onKopChange({ ...kop, logoText: e.target.value.slice(0, 4).toUpperCase() })} className="w-16 h-7 rounded-full bg-[#FDFBF7] ring-1 ring-black/5 px-2 text-xs text-center" placeholder="GM" />
                        <span className="text-xs text-stone-600">Warna</span><input type="color" value={kop.accentColor} onChange={(e) => onKopChange({ ...kop, accentColor: e.target.value })} className="w-7 h-7 rounded-full ring-1 ring-black/5 p-0.5" />
                      </div>
                    </div>
                  </div>

                  {showLogoCrop && logoRaw && (
                    <div className="p-1 rounded-[1.5rem] bg-black/[0.04] ring-1 ring-black/5">
                      <div className="rounded-[calc(1.5rem-4px)] bg-white p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-medium">Preview & Crop Logo</div>
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
                          <div className="absolute top-2 left-2 text-[10px] px-2 py-1 rounded-full bg-black/70 text-white">Preview 1:1 • Hasil crop jadi kotak transparan</div>
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
                    <Field label="Nama Brand" value={kop.companyName} onChange={(v) => onKopChange({ ...kop, companyName: v })} />
                    <Field label="Nama Legal PT" value={kop.legalName} onChange={(v) => onKopChange({ ...kop, legalName: v })} />
                  </div>
                  <Field label="Tagline 1" value={kop.tagline} onChange={(v) => onKopChange({ ...kop, tagline: v })} />
                  <Field label="Tagline 2" value={kop.subTagline} onChange={(v) => onKopChange({ ...kop, subTagline: v })} />
                  <Field label="Alamat Lengkap" value={kop.alamat} onChange={(v) => onKopChange({ ...kop, alamat: v })} />
                  <div className="grid md:grid-cols-3 gap-4">
                    <Field label="Email" value={kop.email} onChange={(v) => onKopChange({ ...kop, email: v })} />
                    <Field label="Website" value={kop.website} onChange={(v) => onKopChange({ ...kop, website: v })} />
                    <Field label="Telepon" value={kop.phone} onChange={(v) => onKopChange({ ...kop, phone: v })} />
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
                    <div className="rounded-[calc(1.5rem-4px)] bg-white p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-medium text-emerald-800">Tanda Tangan CEO — PDF / JPG / PNG</div>
                        <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={sig.showSignature} onChange={(e) => onSigChange({ ...sig, showSignature: e.target.checked })} className="rounded" /> Tampilkan</label>
                      </div>
                      <p className="text-[11px] text-stone-600 mb-3">Upload PDF scan atau JPG. Auto hapus background putih jadi transparan & autocrop.</p>
                      <div className="flex gap-4">
                        <div className="flex-1 h-[110px] rounded-2xl ring-1 ring-black/5 grid place-items-center overflow-hidden p-2 relative" style={{ background: checkerBg }}>
                          {sig.signatureImage ? <img src={sig.signatureImage} alt="ttd" className="max-h-full max-w-full object-contain" style={{ transform: `scale(${sig.signatureScale})` }} /> : <span className="text-xs text-stone-500 text-center px-2">Belum ada • upload lalu hapus BG</span>}
                          {processing === "pdf-sig" && <div className="absolute inset-0 bg-white/80 grid place-items-center text-xs font-medium">Membaca PDF...</div>}
                        </div>
                        <div className="flex flex-col gap-2 min-w-[132px]">
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
                    <div className="rounded-[calc(1.5rem-4px)] bg-white p-4">
                      <div className="flex items-center justify-between mb-1"><div className="text-xs font-medium text-stone-700">Cap / Stempel Resmi — GetMasjid</div><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={sig.showStamp} onChange={(e) => onSigChange({ ...sig, showStamp: e.target.checked })} className="rounded" /> Tampilkan</label></div>
                      <p className="text-[11px] text-stone-500 mb-3">Default: cap resmi double-circle dengan text melingkar. Bisa upload PNG/JPG custom & hapus BG.</p>
                      <div className="flex gap-4">
                        <div className="flex-1 h-[96px] rounded-2xl ring-1 ring-black/5 grid place-items-center overflow-hidden p-2 relative" style={{ background: checkerBg }}>
                          {sig.stampImage ? <img src={sig.stampImage} alt="cap" className="max-h-full max-w-full object-contain" style={{ opacity: sig.stampOpacity }} /> : <span className="text-xs text-stone-500 text-center">Default cap resmi • Upload jika punya</span>}
                        </div>
                        <div className="flex flex-col gap-2">
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
function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] tracking-[0.08em] uppercase font-medium text-stone-600">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full h-9 rounded-full bg-[#FDFBF7] ring-1 ring-black/5 px-3.5 text-sm outline-none focus:ring-2 focus:ring-[#0f6b4a]/20 focus:bg-white transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]" />
    </div>
  );
}
