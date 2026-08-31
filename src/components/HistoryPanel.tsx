"use client";

import { HistoryItem, deleteHistoryItem } from "@/lib/history";
import { useState } from "react";

interface Props {
  items: HistoryItem[];
  onLoad: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
  onDownload: (item: HistoryItem) => void;
}

export function HistoryPanel({ items, onLoad, onDelete, onDownload }: Props) {
  const [q, setQ] = useState("");
  const filtered = items.filter(i =>
    !q || `${i.nomorSurat} ${i.penerima} ${i.tujuan} ${i.perihal}`.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="p-1.5 rounded-[2rem] bg-black/[0.04] ring-1 ring-black/5">
      <div className="rounded-[calc(2rem-0.375rem)] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_12px_40px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="px-6 md:px-7 pt-6 pb-4 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-black text-white grid place-items-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.3"><path d="M3 5h18M3 12h18M3 19h18" strokeLinecap="round"/></svg>
              </span>
              <h3 className="text-[13px] font-medium tracking-tight">Riwayat Surat</h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#FDFBF7] ring-1 ring-black/5">{items.length} tersimpan</span>
            </div>
            <p className="text-[11px] text-stone-500 mt-2 leading-relaxed">Hanya surat yang <b>disimpan</b> muncul di sini. Klik Simpan setelah generate.</p>
          </div>
          <div className="hidden sm:block text-[11px] text-stone-500">Hapus background & crop ikut tersimpan</div>
        </div>

        <div className="px-5 md:px-6 pb-2">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
            <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Cari nomor, penerima, instansi, perihal..." className="w-full h-9 rounded-full bg-[#FDFBF7] ring-1 ring-black/5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-black/10 focus:bg-white transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]" />
          </div>
        </div>

        <div className="px-2 md:px-3 pb-4 max-h-[420px] overflow-auto">
          {filtered.length === 0 ? (
            <div className="mx-3 my-4 rounded-2xl bg-[#FDFBF7] ring-1 ring-black/5 p-8 text-center">
              <div className="w-10 h-10 rounded-full bg-white ring-1 ring-black/5 grid place-items-center mx-auto mb-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a8a29e" strokeWidth="1.3"><path d="M14 2H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V8z"/><path d="M14 2v6h6M10 13H8M16 17H8M13 13h3"/></svg>
              </div>
              <div className="text-sm font-medium text-stone-700">Belum ada riwayat</div>
              <div className="text-xs text-stone-500 mt-1">Generate surat lalu klik <b>Simpan ke Riwayat</b> untuk melihatnya di sini.</div>
            </div>
          ) : (
            <div className="space-y-2 p-1">
              {filtered.map(item => (
                <div key={item.id} className="group rounded-2xl bg-[#FDFBF7] ring-1 ring-black/5 p-3 md:p-4 hover:bg-white hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono px-2 py-1 rounded-full bg-white ring-1 ring-black/5">{item.nomorSurat}</span>
                        <span className="text-[11px] px-2 py-1 rounded-full bg-black text-white">{item.perihal}</span>
                        <span className="text-[11px] text-stone-500">{new Date(item.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <div className="text-sm font-medium truncate mt-2">{item.penerima} • <span className="font-normal text-stone-600">{item.tujuan}</span></div>
                      <div className="text-xs text-stone-500 truncate mt-1 line-clamp-1">{item.data.isiSurat.slice(0, 80)}...</div>
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button onClick={() => onLoad(item)} className="h-7 px-3 rounded-full bg-black text-white text-xs font-medium hover:bg-stone-800">Muat</button>
                      <button onClick={() => onDownload(item)} className="h-7 px-3 rounded-full bg-white ring-1 ring-black/5 text-xs">Unduh</button>
                      <button onClick={() => { if(confirm("Hapus riwayat ini?")) onDelete(item.id); }} className="h-7 px-3 rounded-full bg-white ring-1 ring-black/5 text-xs text-red-600 hover:bg-red-50">Hapus</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 pb-4 text-[11px] text-stone-500 text-center border-t border-black/5 pt-3">
          Maks 50 riwayat • Tersimpan di browser (localStorage) • Logo/TTD/Cap ikut tersimpan persis
        </div>
      </div>
    </div>
  );
}
