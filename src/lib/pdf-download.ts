/**
 * Helper client-side untuk men-download file PDF murni (.pdf) secara langsung tanpa melalui browser print dialog.
 * Menghasilkan file PDF A4 bersih tanpa domain vercel atau header/footer bawaan browser.
 */

export async function downloadPdfFile(html: string, filename: string): Promise<void> {
  if (typeof window === "undefined") return;

  const cleanFilename = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;

  try {
    // Buat iframe terisolasi untuk rendering styles & fonts lengkap
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.left = "-9999px";
    iframe.style.top = "0";
    iframe.style.width = "794px"; // A4 at 96 DPI
    iframe.style.height = "1123px";
    iframe.style.border = "0";
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";
    iframe.setAttribute("aria-hidden", "true");
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      if (document.body.contains(iframe)) document.body.removeChild(iframe);
      throw new Error("Cannot access iframe document");
    }

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

    // Ambil elemen surat .page
    const pageEl = (doc.querySelector(".page") as HTMLElement) || doc.body;

    const html2pdfModule = await import("html2pdf.js");
    const html2pdf = html2pdfModule.default || html2pdfModule;

    const opt = {
      margin: 0,
      filename: cleanFilename,
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        logging: false,
        backgroundColor: "#ffffff",
      },
      jsPDF: { unit: "mm" as const, format: "a4" as const, orientation: "portrait" as const },
    };

    // Generate dan langsung download file PDF
    await html2pdf().set(opt).from(pageEl).save();

    setTimeout(() => {
      try {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      } catch {}
    }, 1500);

    return;
  } catch (err) {
    console.error("Error generating PDF via html2pdf:", err);
    throw err;
  }
}
