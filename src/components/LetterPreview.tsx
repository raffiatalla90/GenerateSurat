"use client";

import { useState, useRef, useEffect } from "react";
import { KopSuratConfig, LetterData, SignatureConfig } from "@/types/letter";
import { generateLetterHTML } from "@/lib/letter-html";

export function LetterPreview({ data, kop, sig }: { data: LetterData; kop?: KopSuratConfig; sig?: SignatureConfig }) {
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

  return (
    <div className="p-1.5 rounded-[2rem] bg-black/[0.04] ring-1 ring-black/5">
      <div className="rounded-[calc(2rem-0.375rem)] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_20px_60px_rgba(0,0,0,0.07)] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="text-[10px] tracking-[0.16em] uppercase font-medium text-stone-500">Preview Surat</span>
            {/* Zoom Capsule */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 ring-1 ring-black/5 text-stone-700">
              <button
                type="button"
                onClick={() => setZoomMultiplier((prev) => Math.max(0.5, prev - 0.1))}
                className="w-5 h-5 rounded-full bg-white ring-1 ring-black/5 flex items-center justify-center text-xs font-semibold hover:bg-stone-50 active:scale-95 transition"
                title="Zoom Out"
              >
                -
              </button>
              <span className="text-[10px] font-mono font-medium px-1 min-w-[32px] text-center">
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
                  className="text-[9px] underline ml-1 hover:text-black transition"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#FDFBF7] ring-1 ring-black/5 text-stone-700 font-mono">{data.nomorSurat}</span>
        </div>
        <div className="mx-2 mb-2 rounded-[1.25rem] overflow-hidden ring-1 ring-black/5 bg-[#FDFBF7]">
          <iframe
            ref={iframeRef}
            title="Preview Surat"
            srcDoc={html}
            className="w-full h-[720px] md:h-[820px] border-0 bg-white"
            sandbox="allow-same-origin"
          />
        </div>
        <p className="text-[11px] text-stone-500 text-center px-6 pb-4">Preview real-time • Dokumen tercetak rapi A4</p>
      </div>
    </div>
  );
}
