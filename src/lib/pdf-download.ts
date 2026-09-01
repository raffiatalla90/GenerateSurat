/**
 * Helper client-side untuk men-download file PDF murni (.pdf) secara langsung tanpa melalui browser print dialog.
 * Menghasilkan file PDF A4 bersih tanpa domain vercel atau header/footer bawaan browser.
 */
export async function downloadPdfFile(html: string, filename: string) {
  if (typeof window === "undefined") return;

  // Dynamic import html2pdf agar SSR safe
  const html2pdfModule = await import("html2pdf.js");
  const html2pdf = html2pdfModule.default || html2pdfModule;

  // 1. Buat container wrapper dengan z-index positif di (0, 0) agar html2canvas merender dengan sempurna
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "0";
  container.style.top = "0";
  container.style.width = "794px"; // 210mm at 96dpi
  container.style.height = "1123px"; // 297mm at 96dpi
  container.style.zIndex = "99998";
  container.style.background = "#ffffff";
  container.style.overflow = "hidden";
  container.style.pointerEvents = "none";

  // 2. Buat iframe di dalam container agar dokumen HTML ter-parse secara native
  const iframe = document.createElement("iframe");
  iframe.style.width = "794px";
  iframe.style.height = "1123px";
  iframe.style.border = "0";
  iframe.style.background = "#ffffff";
  container.appendChild(iframe);
  document.body.appendChild(container);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    if (document.body.contains(container)) document.body.removeChild(container);
    throw new Error("Gagal membuat iframe dokumen PDF");
  }

  doc.open();
  doc.write(html);
  doc.close();

  // Beri jeda 450ms agar font & gambar base64 (logo, ttd, cap) ter-load penuh di iframe
  await new Promise((resolve) => setTimeout(resolve, 450));

  const targetBody = doc.body;

  // Pastikan style elemen .page di dalam iframe presisi A4 tanpa margin luar
  const pages = targetBody.querySelectorAll<HTMLElement>(".page");
  pages.forEach((p) => {
    p.style.transform = "none";
    p.style.zoom = "1";
    p.style.margin = "0 auto";
    p.style.boxShadow = "none";
    p.style.borderRadius = "0";
  });

  const cleanFilename = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;

  const opt = {
    margin: 0,
    filename: cleanFilename,
    image: { type: "jpeg" as const, quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      scrollY: 0,
      scrollX: 0,
      windowWidth: 794,
    },
    jsPDF: { unit: "mm" as const, format: "a4" as const, orientation: "portrait" as const },
    pagebreak: { mode: ["css", "legacy"], before: ".attachment-page" },
  };

  try {
    await html2pdf().set(opt).from(targetBody).save();
  } catch (err) {
    console.error("Gagal generate PDF dengan html2pdf:", err);
    throw err;
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
