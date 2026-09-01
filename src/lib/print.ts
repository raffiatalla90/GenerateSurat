/**
 * Helper untuk mencetak surat langsung di browser menggunakan dialog print.
 * Pengguna dapat mencetak ke printer fisik atau memilih 'Save as PDF' (Simpan sebagai PDF).
 */
export function printLetter(html: string) {
  // Coba cetak menggunakan iframe tersembunyi agar transisi cepat dan mulus
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
  if (doc) {
    doc.open();
    doc.write(html);
    doc.close();

    // Beri jeda sejenak agar font eksternal (Inter/Merriweather) & image ter-load
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        console.warn("Iframe print gagal, membuka tab cetak baru:", e);
        // Fallback jika iframe diblokir browser tertentu
        const win = window.open("", "_blank");
        if (win) {
          win.document.write(html);
          win.document.close();
          win.focus();
          setTimeout(() => win.print(), 350);
        }
      } finally {
        setTimeout(() => {
          try {
            document.body.removeChild(iframe);
          } catch {}
        }, 2000);
      }
    }, 350);
  }
}
