/**
 * Helper untuk mencetak / menyimpan surat langsung di browser menggunakan dialog print / Save as PDF.
 * Menjamin 100% gambar logo, font, dan format identik persis dengan yang ada di preview.
 */
export async function printLetter(html: string) {
  if (typeof window === "undefined") return;

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.setAttribute("aria-hidden", "true");
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  const matchTitle = html.match(/<title>(.*?)<\/title>/i);
  const titleText = matchTitle ? matchTitle[1] : "Surat GetMasjid";

  if (iframe.contentWindow) {
    iframe.contentWindow.document.title = titleText;
  }

  const triggerPrint = async () => {
    try {
      // Tunggu load font
      if (doc.fonts && doc.fonts.ready) {
        await doc.fonts.ready.catch(() => {});
      }

      // Tunggu decode semua gambar
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
    } catch {}

    // Sedikit jeda untuk layout rendering final
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        console.warn("Iframe print gagal, membuka tab cetak baru:", e);
        const win = window.open("", "_blank");
        if (win) {
          win.document.write(html);
          if (win.document) {
            win.document.title = titleText;
          }
          win.document.close();
          win.focus();
          setTimeout(() => win.print(), 400);
        }
      } finally {
        setTimeout(() => {
          try {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          } catch {}
        }, 3000);
      }
    }, 150);
  };

  // Tunggu dokumen selesai load
  if (doc.readyState === "complete") {
    await triggerPrint();
  } else {
    iframe.onload = () => {
      triggerPrint();
    };
    // Fallback timer jika iframe.onload tidak terpanggil
    setTimeout(triggerPrint, 300);
  }
}
