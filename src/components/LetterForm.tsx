"use client";

import { useState, useRef } from "react";
import { LetterData, PerihalOption } from "@/types/letter";
import { SURAT_TEMPLATES, PERIHAL_OPTIONS } from "@/lib/letter-templates";

interface Props {
  data: LetterData;
  onChange: (data: LetterData) => void;
  onPreview: () => void;
  onDownload: () => void;
  onSave: () => void;
  isGenerating: boolean;
}

export function LetterForm({ data, onChange, onPreview, onDownload, onSave, isGenerating }: Props) {
  const [perihalOption, setPerihalOption] = useState<PerihalOption>(
    (PERIHAL_OPTIONS as readonly string[]).includes(data.perihal) ? (data.perihal as PerihalOption) : "Custom"
  );
  const [customPerihal, setCustomPerihal] = useState(
    !(PERIHAL_OPTIONS as readonly string[]).includes(data.perihal) ? data.perihal : ""
  );
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const currentAttachments = data.attachments || [];
    if (currentAttachments.length + files.length > 3) {
      alert("Maksimal 3 gambar lampiran saja.");
      return;
    }

    const readers = Array.from(files).map((file) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then((base64Images) => {
      onChange({
        ...data,
        attachments: [...currentAttachments, ...base64Images]
      });
    });
  };

  const handleRemoveAttachment = (idx: number) => {
    const currentAttachments = data.attachments || [];
    onChange({
      ...data,
      attachments: currentAttachments.filter((_, i) => i !== idx)
    });
  };

  const handleSignerCountChange = (count: number) => {
    const currentList = data.signers || [];
    if (currentList.length === count) return;
    
    let newList = [...currentList];
    if (newList.length < count) {
      const defaults = [
        { nama: "Raffi Atalla Natha Atmaja", jabatan: "CEO GetMasjid", showSignature: true, showStamp: true },
        { nama: "Sekretaris GetMasjid", jabatan: "Sekretaris", showSignature: true, showStamp: false },
        { nama: "Bendahara GetMasjid", jabatan: "Bendahara", showSignature: true, showStamp: false },
        { nama: "Ketua DKM", jabatan: "Ketua DKM Masjid", showSignature: true, showStamp: true }
      ];
      
      for (let i = newList.length; i < count; i++) {
        newList.push(defaults[i] || { nama: "", jabatan: "", showSignature: true, showStamp: false });
      }
    } else {
      newList = newList.slice(0, count);
    }
    
    onChange({
      ...data,
      signers: newList,
      namaPenandatangan: newList[0]?.nama || "",
      jabatan: newList[0]?.jabatan || "",
    });
  };

  const handleSignerPropertyChange = (idx: number, key: string, val: any) => {
    const currentList = data.signers || [];
    const newList = currentList.map((signer, i) => {
      if (i === idx) {
        return { ...signer, [key]: val };
      }
      return signer;
    });
    
    onChange({
      ...data,
      signers: newList,
      namaPenandatangan: newList[0]?.nama || "",
      jabatan: newList[0]?.jabatan || "",
    });
  };


  const handlePerihalChange = (value: PerihalOption) => {
    setPerihalOption(value);
    if (value === "Custom") {
      onChange({ ...data, perihal: customPerihal || "" });
    } else {
      const templateIsi = SURAT_TEMPLATES[value];
      onChange({
        ...data,
        perihal: value,
        isiSurat: data.isiSurat.trim() === "" || Object.values(SURAT_TEMPLATES).includes(data.isiSurat) ? templateIsi : data.isiSurat,
      });
    }
  };
  const handleCustomPerihalChange = (v: string) => {
    setCustomPerihal(v);
    if (perihalOption === "Custom") onChange({ ...data, perihal: v });
  };
  const handleTemplateInsert = (key: string) => {
    const isi = SURAT_TEMPLATES[key];
    if (isi) { onChange({ ...data, perihal: key, isiSurat: isi }); setPerihalOption(key as PerihalOption); }
  };

  return (
    <div className="p-1 sm:p-1.5 rounded-[1.75rem] sm:rounded-[2rem] bg-black/[0.04] ring-1 ring-black/5">
      <div className="rounded-[calc(1.75rem-0.25rem)] sm:rounded-[calc(2rem-0.375rem)] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_20px_60px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="px-4 sm:px-6 md:px-8 pt-6 sm:pt-7 pb-5 sm:pb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="inline-flex rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] font-medium bg-black text-white">Form Surat Resmi</span>
              <p className="text-[13px] text-stone-500 mt-2.5 sm:mt-3 leading-relaxed max-w-[36ch]">Lengkapi data penerima & isi surat. Nomor otomatis ter-generate.</p>
            </div>
            <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-[#FDFBF7] ring-1 ring-black/5 text-stone-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Auto-save
            </span>
          </div>
        </div>

        <div className="px-4 sm:px-6 md:px-8 pb-6 space-y-5 sm:space-y-6">
          <div className="p-1 rounded-2xl bg-black/[0.03] ring-1 ring-black/5">
            <div className="rounded-[calc(1rem-4px)] bg-[#f0faf4] px-4 py-3.5 flex items-center justify-between">
              <div>
                <div className="text-[10px] tracking-[0.14em] uppercase font-medium text-emerald-700">Nomor Surat</div>
                <div className="text-[13px] font-mono font-semibold text-emerald-900 mt-0.5">{data.nomorSurat}</div>
                <div className="text-[11px] text-emerald-700/60 mt-0.5">XXX/GMJ/MM/YYYY • Auto increment</div>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#0f6b4a] text-white grid place-items-center font-bold text-xs">GM</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Nama Penerima" required placeholder="Bapak Ahmad Fauzi" value={data.namaPenerima} onChange={(v) => onChange({ ...data, namaPenerima: v })} />
            <Field label="Instansi / Organisasi" required placeholder="Takmir Masjid Al-Ikhlas" value={data.instansiTujuan} onChange={(v) => onChange({ ...data, instansiTujuan: v })} />
          </div>
          <Field label="Alamat Penerima" optional placeholder="Jl. Melati No. 12, Jakarta Selatan (opsional)" value={data.alamatPenerima || ""} onChange={(v) => onChange({ ...data, alamatPenerima: v })} />

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label required>Perihal Surat</Label>
              <select value={perihalOption} onChange={(e) => handlePerihalChange(e.target.value as PerihalOption)} className="w-full h-[44px] rounded-[1rem] bg-[#FDFBF7] ring-1 ring-black/5 px-3.5 text-[14px] text-stone-800 outline-none focus:ring-2 focus:ring-[#0f6b4a]/20 focus:bg-white transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]">
                {PERIHAL_OPTIONS.map((opt) => (<option key={opt} value={opt}>{opt === "Custom" ? "Lainnya (Custom)" : opt}</option>))}
              </select>
              {perihalOption === "Custom" && (
                <input value={customPerihal} onChange={(e) => handleCustomPerihalChange(e.target.value)} placeholder="Tulis perihal custom" className="w-full h-[44px] rounded-[1rem] bg-[#FDFBF7] ring-1 ring-black/5 px-3.5 text-[14px] outline-none focus:ring-2 focus:ring-[#0f6b4a]/20 focus:bg-white mt-2 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]" />
              )}
              <p className="text-[11px] text-stone-500">Template isi otomatis menyesuaikan</p>
            </div>
            <Field label="Tanggal Surat" type="date" required value={data.tanggal} onChange={(v) => onChange({ ...data, tanggal: v })} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between"><Label required>Isi Surat</Label><span className="text-[11px] px-2 py-1 rounded-full bg-black/[0.04] ring-1 ring-black/5">{data.isiSurat.length} karakter</span></div>
            <textarea value={data.isiSurat} onChange={(e) => onChange({ ...data, isiSurat: e.target.value })} placeholder="Tulis isi surat formal..." rows={13} className="w-full rounded-[1.25rem] bg-[#FDFBF7] ring-1 ring-black/5 p-4 text-[14px] leading-6 text-stone-800 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-[#0f6b4a]/20 focus:bg-white transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] resize-y min-h-[260px]" />
            <div className="flex flex-wrap gap-2">
              <span className="text-[11px] text-stone-500 py-1">Contoh cepat:</span>
              {["Kerja Sama","Pengajuan","Undangan"].map(k=>(
                <button key={k} type="button" onClick={()=>handleTemplateInsert(k)} className="text-[12px] px-3 py-1 rounded-full bg-white ring-1 ring-black/5 hover:ring-black/10 hover:bg-[#FDFBF7] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]">{k}</button>
              ))}
            </div>
          </div>

          {/* Section Lampiran Gambar */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label optional>Gambar Lampiran (Opsional)</Label>
              <span className="text-[11px] px-2 py-1 rounded-full bg-black/[0.04] ring-1 ring-black/5">
                {(data.attachments || []).length} Gambar
              </span>
            </div>
            
            <div className="p-4 rounded-2xl bg-black/[0.02] ring-1 ring-black/5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <button 
                  type="button" 
                  onClick={() => attachmentInputRef.current?.click()} 
                  className="h-9 px-4 rounded-full bg-white ring-1 ring-black/5 text-xs font-semibold text-stone-800 hover:bg-stone-50 transition active:scale-95 flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap shadow-sm w-fit"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Tambah Gambar Lampiran
                </button>
                <input 
                  ref={attachmentInputRef} 
                  type="file" 
                  accept="image/png,image/jpeg,image/jpg,image/webp" 
                  multiple 
                  className="hidden" 
                  onChange={handleAttachmentUpload} 
                />
                <span className="text-[11px] text-stone-500">Maks. 3 gambar (PNG, JPG, WebP)</span>
              </div>
              
              {(data.attachments || []).length > 0 && (
                <div className="grid grid-cols-3 gap-3 pt-1">
                  {(data.attachments || []).map((img, idx) => (
                    <div key={idx} className="relative aspect-[4/3] rounded-xl overflow-hidden ring-1 ring-black/5 bg-[#FDFBF7] group">
                      <img src={img} alt={`lampiran ${idx + 1}`} className="w-full h-full object-contain p-1" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
                        <button 
                          type="button" 
                          onClick={() => handleRemoveAttachment(idx)} 
                          className="w-7 h-7 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center active:scale-90 transition shadow-lg"
                          title="Hapus Lampiran"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                      </div>
                      <span className="absolute top-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded-md font-mono">
                        Hal {idx + 2}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section Penandatangan (1-4 Orang) */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-t border-black/5 pt-4">
              <Label required>Tanda Tangan & Penandatangan</Label>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-[11px] text-stone-400 font-medium hidden sm:inline">Jumlah:</span>
                <div className="flex bg-black/[0.04] ring-1 ring-black/5 rounded-full p-0.5">
                  {[1, 2, 3, 4].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleSignerCountChange(num)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                        (data.signers || []).length === num
                          ? "bg-white text-stone-900 shadow-sm"
                          : "text-stone-500 hover:text-stone-800"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {(data.signers || []).map((signer, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-black/[0.02] ring-1 ring-black/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Penandatangan {idx + 1}</span>
                    <div className="flex gap-3">
                      <label className="flex items-center gap-1.5 text-xs text-stone-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={signer.showSignature}
                          onChange={(e) => handleSignerPropertyChange(idx, "showSignature", e.target.checked)}
                          className="rounded text-[#0f6b4a]"
                        />
                        Ttd
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-stone-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={signer.showStamp}
                          onChange={(e) => handleSignerPropertyChange(idx, "showStamp", e.target.checked)}
                          className="rounded text-[#0f6b4a]"
                        />
                        Cap
                      </label>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    <Field
                      label={`Nama Orang #${idx + 1}`}
                      required
                      placeholder={`Nama Penandatangan ${idx + 1}`}
                      value={signer.nama}
                      onChange={(v) => handleSignerPropertyChange(idx, "nama", v)}
                    />
                    <Field
                      label={`Jabatan #${idx + 1}`}
                      required
                      placeholder={`Jabatan Penandatangan ${idx + 1}`}
                      value={signer.jabatan}
                      onChange={(v) => handleSignerPropertyChange(idx, "jabatan", v)}
                    />
                  </div>

                  {signer.showSignature && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 pt-1 bg-white p-2.5 rounded-xl border border-black/5">
                      <div className="w-[64px] h-[40px] rounded-lg border border-black/5 bg-[#FDFBF7] flex items-center justify-center overflow-hidden shrink-0">
                        {signer.signatureImage ? (
                          <img src={signer.signatureImage} alt={`ttd ${idx+1}`} className="max-w-full max-h-full object-contain" />
                        ) : (
                          <span className="text-[9px] text-stone-400 text-center">Default</span>
                        )}
                      </div>
                      <div className="flex-1 flex flex-wrap gap-2 items-center">
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.getElementById(`signer-sig-input-${idx}`);
                            input?.click();
                          }}
                          className="h-7 px-3 rounded-full bg-white ring-1 ring-black/5 text-[10px] font-semibold hover:bg-stone-50 whitespace-nowrap shrink-0"
                        >
                          Upload Tanda Tangan
                        </button>
                        {signer.signatureImage && (
                          <button
                            type="button"
                            onClick={() => handleSignerPropertyChange(idx, "signatureImage", undefined)}
                            className="h-7 px-2.5 rounded-full bg-red-50 text-red-600 text-[10px] font-semibold hover:bg-red-100 whitespace-nowrap shrink-0"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                      <input
                        id={`signer-sig-input-${idx}`}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const r = new FileReader();
                          r.onload = () => handleSignerPropertyChange(idx, "signatureImage", r.result as string);
                          r.readAsDataURL(file);
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 sm:px-8 py-5 bg-[#FDFBF7]/80 flex flex-col gap-3 border-t border-black/5">
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              type="button" 
              onClick={onPreview} 
              className="group flex-1 h-[48px] rounded-full bg-white ring-1 ring-stone-200 hover:ring-stone-300 text-stone-800 font-semibold text-[14px] hover:bg-stone-50 transition-all flex items-center justify-center gap-2.5 active:scale-[0.98] shadow-sm"
            >
              <span className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 group-hover:bg-stone-200 transition">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
              </span>
              <span>Lihat Preview Surat</span>
            </button>
            <button 
              type="button" 
              onClick={onDownload} 
              disabled={isGenerating} 
              className="group flex-1 h-[48px] rounded-full bg-[#0f6b4a] text-white font-semibold text-[14px] hover:bg-[#0d5a3f] disabled:opacity-60 flex items-center justify-center gap-2 pl-5 pr-2 active:scale-[0.98] transition-all shadow-[0_8px_20px_rgba(15,107,74,0.22)]"
            >
              {isGenerating ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <span>Download PDF</span>
                  <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition-all">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v12M8 11l4 4 4-4M3 17v3h18v-3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                </>
              )}
            </button>
          </div>
          <button 
            type="button" 
            onClick={onSave} 
            className="w-full h-[44px] rounded-full bg-stone-900 text-white font-medium text-[13px] hover:bg-stone-800 flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-sm"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>
            <span>Simpan ke Riwayat (save-first)</span>
          </button>
        </div>
        <p className="px-5 sm:px-8 pb-6 text-[11px] text-stone-500 text-center">Nomor tercatat otomatis saat download. Pastikan data benar.</p>
      </div>
    </div>
  );
}

function Label({ children, required, optional }: { children: React.ReactNode; required?: boolean; optional?: boolean }) {
  return <label className="text-[11px] tracking-[0.08em] uppercase font-medium text-stone-600 flex items-center gap-1.5">{children}{required && <span className="text-red-500">*</span>}{optional && <span className="text-stone-400 normal-case tracking-normal">(opsional)</span>}</label>;
}
function Field({ label, value, onChange, placeholder, required, optional, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean; optional?: boolean; type?: string }) {
  return (
    <div className="space-y-2">
      <Label required={required} optional={optional}>{label}</Label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full h-[44px] rounded-[1rem] bg-[#FDFBF7] ring-1 ring-black/5 px-3.5 text-[14px] text-stone-800 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-[#0f6b4a]/20 focus:bg-white transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]" />
    </div>
  );
}
