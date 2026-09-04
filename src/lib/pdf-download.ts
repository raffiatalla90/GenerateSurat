/**
 * Helper client-side untuk men-download file PDF murni (.pdf) secara langsung.
 * Menggunakan backend Puppeteer API route (/api/generate-pdf) untuk pixel-perfect A4 Chromium render.
 * Dilengkapi fallback client-side yang terisolasi dan stabil.
 */

import { LetterData, KopSuratConfig, SignatureConfig } from "@/types/letter";

export interface DownloadPdfOptions {
  data?: LetterData;
  kopConfig?: KopSuratConfig;
  signatureConfig?: SignatureConfig;
  url?: string;
}

/**
 * Trigger browser file download from Blob
 */
function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    window.URL.revokeObjectURL(url);
    if (document.body.contains(a)) {
      document.body.removeChild(a);
    }
  }, 2000);
}

/**
 * Fallback generator menggunakan html2pdf.js dalam iframe terisolasi
 */
async function fallbackClientSideDownload(html: string, cleanFilename: string): Promise<void> {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-9999px";
  iframe.style.top = "0";
  iframe.style.width = "794px"; // 210mm pada 96 DPI
  iframe.style.height = "1123px"; // 297mm pada 96 DPI
  iframe.style.border = "0";
  iframe.style.opacity = "0";
  iframe.style.pointerEvents = "none";
  iframe.setAttribute("aria-hidden", "true");
  document.body.appendChild(iframe);

  try {
    const doc = iframe.contentWindow?.document;
    if (!doc) throw new Error("Cannot access iframe document");

    doc.open();
    doc.write(html);
    doc.close();

    // Tunggu fonts & images selesai dimuat
    if (doc.fonts && doc.fonts.ready) {
      await doc.fonts.ready.catch(() => {});
    }

    const images = Array.from(doc.images);
    await Promise.all(
      images.map((img) => {
        if (img.complete) {
          return img.decode ? img.decode().catch(() => {}) : Promise.resolve();
        }
        return new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
          setTimeout(resolve, 800);
        });
      })
    );

    // Samakan styling agar 100% presisi A4
    doc.documentElement.style.background = "#ffffff";
    doc.documentElement.style.margin = "0";
    doc.documentElement.style.padding = "0";
    doc.body.style.background = "#ffffff";
    doc.body.style.margin = "0";
    doc.body.style.padding = "0";
    doc.body.style.width = "210mm";

    const allPages = doc.querySelectorAll<HTMLElement>(".page");
    allPages.forEach((p) => {
      p.style.boxShadow = "none";
      p.style.margin = "0";
      p.style.borderRadius = "0";
      p.style.border = "none";
      p.style.background = "#ffffff";
      p.style.width = "210mm";
      p.style.minHeight = "297mm";
      p.style.height = "297mm";
      p.style.boxSizing = "border-box";
    });

    const targetEl = allPages.length === 1 ? allPages[0] : doc.body;
    const html2pdfModule = await import("html2pdf.js");
    const html2pdf = html2pdfModule.default || html2pdfModule;

    const opt = {
      margin: 0,
      filename: cleanFilename,
      image: { type: "jpeg" as const, quality: 1.0 },
      html2canvas: {
        scale: 2.5,
        useCORS: true,
        letterRendering: true,
        logging: false,
        backgroundColor: "#ffffff",
        scrollX: 0,
        scrollY: 0,
        windowWidth: 794,
        windowHeight: 1123,
      },
      jsPDF: {
        unit: "mm" as const,
        format: "a4" as const,
        orientation: "portrait" as const,
        compress: true,
      },
      pagebreak: { mode: ["css", "legacy"] },
    };

    await html2pdf().set(opt).from(targetEl).save();
  } finally {
    setTimeout(() => {
      try {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      } catch {}
    }, 1500);
  }
}

/**
 * Main Download Function
 * Memanggil backend Puppeteer API route (/api/generate-pdf) dan fallback otomatis.
 */
export async function downloadPdfFile(
  html: string,
  filename: string,
  options?: DownloadPdfOptions
): Promise<void> {
  if (typeof window === "undefined") return;

  const cleanFilename = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;

  try {
    const payload = {
      html,
      filename: cleanFilename,
      url: options?.url,
      ...(options?.data || {}),
      kopConfig: options?.kopConfig,
      signatureConfig: options?.signatureConfig,
    };

    const response = await fetch("/api/generate-pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (response.ok && response.headers.get("content-type")?.includes("application/pdf")) {
      const blob = await response.blob();
      triggerBlobDownload(blob, cleanFilename);
      return;
    }

    console.warn("Puppeteer API returned non-OK status, activating client-side fallback...");
    await fallbackClientSideDownload(html, cleanFilename);
  } catch (err) {
    console.warn("Error calling /api/generate-pdf, activating client fallback:", err);
    await fallbackClientSideDownload(html, cleanFilename);
  }
}
