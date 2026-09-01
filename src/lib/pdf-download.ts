/**
 * Helper client-side untuk men-download file PDF murni (.pdf) secara langsung tanpa melalui browser print dialog.
 * Menghasilkan file PDF A4 bersih tanpa domain vercel atau header/footer bawaan browser.
 */
export async function downloadPdfFile(html: string, filename: string) {
  if (typeof window === "undefined") return;

  // Dynamic import html2pdf agar SSR safe
  const html2pdfModule = await import("html2pdf.js");
  const html2pdf = html2pdfModule.default || html2pdfModule;

  // Buat element container tersembunyi di koordinat (0, 0) agar html2canvas dapat merender dengan presisi
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "0";
  container.style.top = "0";
  container.style.width = "210mm";
  container.style.zIndex = "-99999";
  container.style.opacity = "0.999";
  container.style.pointerEvents = "none";
  container.style.background = "#ffffff";
  container.innerHTML = html;
  document.body.appendChild(container);

  // Pastikan script autoScale di dalam html tidak mengganggu rendering canvas
  const scripts = container.querySelectorAll("script");
  scripts.forEach((s) => s.remove());

  // Pastikan halaman .page memiliki dimensi persis A4
  const pages = container.querySelectorAll<HTMLElement>(".page");
  pages.forEach((p) => {
    p.style.transform = "none";
    p.style.zoom = "1";
    p.style.margin = "0 auto";
    p.style.boxShadow = "none";
    p.style.borderRadius = "0";
  });

  // Beri jeda 350ms agar gambar base64 (logo, ttd, cap) & font eksternal ter-render sempurna sebelum dimasukkan ke canvas
  await new Promise((resolve) => setTimeout(resolve, 350));

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
      windowWidth: 794, // 210mm at 96dpi
    },
    jsPDF: { unit: "mm" as const, format: "a4" as const, orientation: "portrait" as const },
    pagebreak: { mode: ["css", "legacy"], before: ".attachment-page" },
  };

  try {
    await html2pdf().set(opt).from(container).save();
  } catch (err) {
    console.error("Gagal generate PDF dengan html2pdf:", err);
    throw err;
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
