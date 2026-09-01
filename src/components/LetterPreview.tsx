"use client";

import { useState, useRef, useEffect } from "react";
import { KopSuratConfig, LetterData, SignatureConfig } from "@/types/letter";
import { generateLetterHTML } from "@/lib/letter-html";
import { printLetter } from "@/lib/print";

export function LetterPreview({
  data,
  kop,
  sig,
  onPrint,
}: {
  data: LetterData;
  kop?: KopSuratConfig;
  sig?: SignatureConfig;
  onPrint?: () => void;
}) {
  const html = generateLetterHTML(data, kop, sig);
  const [zoomMultiplier, setZoomMultiplier] = useState(1);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      iframe.contentWindow?.postMessage({ type: "set-zoom", scale: zoomMultiplier }, "*");
    };

    iframe.addEventListener("load", handleLoad);
    iframe.contentWindow?.postMessage({ type: "set-zoom", scale: zoomMultiplier }, "*");

    return () => iframe.removeEventListener("load", handleLoad);
  }, [zoomMultiplier, html]);

  const handlePrintClick = () => {
    if (onPrint) {
      onPrint();
    } else {
      printLetter(html);
    }
  };

  return (
    <div className="w-full min-w-0 p-1 sm:p-1.5 rounded-[1.75rem] sm:rounded-[2rem] bg-black/[0.04] ring-1 ring-black/5">
      <div className="w-full min-w-0 rounded-[calc(1.75rem-0.25rem)] sm:rounded-[calc(2rem-0.375rem)] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_20px_60px_rgba(0,0,0,0.07)] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-3.5 sm:px-6 py-3.5 gap-2 border-b border-black/5 flex-wrap">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="text-[10px] tracking-[0.16em] uppercase font-medium text-stone-500">Preview Surat</span>
            {/* Zoom Capsule */}
            <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-stone-100 ring-1 ring-black/5 text-stone-700">
              <button
                type="button"
                onClick={() => setZoomMultiplier((prev) => Math.max(0.5, prev - 0.1))}
                className="w-5 h-5 rounded-full bg-white ring-1 ring-black/5 flex items-center justify-center text-xs font-semibold hover:bg-stone-50 active:scale-95 transition"
                title="Zoom Out"
              >
                -
              </button>
              <span className="text-[10px] font-mono font-medium px-1 min-w-[28px] sm:min-w-[32px] text-center">
                {Math.round(zoomMultiplier * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomMultiplier((prev) => Math.min(2.0, prev + 0.1))}
                className="w-5 h-5 rounded-full bg-white ring-1 ring-black/5 flex items-center justify-center text-xs font-semibold hover:bg-stone-50 active:scale-95 transition"
                title="Zoom In"
              >
                +
              </button>
              {zoomMultiplier !== 1 && (
                <button
                  type="button"
                  onClick={() => setZoomMultiplier(1)}
                  className="text-[9px] underline ml-0.5 hover:text-black transition"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintClick}
              className="inline-flex items-center gap-1.5 px-3 py-1 sm:py-1.5 rounded-full bg-[#0f6b4a] hover:bg-[#0d5a3f] text-white text-[11px] sm:text-xs font-semibold transition active:scale-95 shadow-sm"
              title="Cetak Surat atau Simpan sebagai PDF"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6 14h12v8H6z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Cetak Surat</span>
            </button>
            <span className="text-[10.5px] sm:text-[11px] px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-[#FDFBF7] ring-1 ring-black/5 text-stone-700 font-mono truncate max-w-[130px] sm:max-w-none text-center" title={data.nomorSurat}>
              {data.nomorSurat}
            </span>
          </div>
        </div>
        <div className="mx-1.5 sm:mx-2 my-1.5 sm:my-2 rounded-[1rem] sm:rounded-[1.25rem] overflow-hidden ring-1 ring-black/5 bg-[#eef1f5]">
          <iframe
            ref={iframeRef}
            title="Preview Surat"
            srcDoc={html}
            className="w-full h-[540px] sm:h-[720px] md:h-[820px] border-0 bg-[#eef1f5]"
            sandbox="allow-same-origin"
          />
        </div>
        <p className="text-[11px] text-stone-500 text-center px-4 sm:px-6 pb-3 sm:pb-4 pt-1">Preview real-time • Dokumen tercetak rapi A4</p>
      </div>
    </div>
  );
}
