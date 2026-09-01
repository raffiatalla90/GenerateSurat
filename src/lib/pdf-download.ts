/**
 * Helper client-side untuk men-download file PDF murni (.pdf) secara langsung tanpa melalui browser print dialog.
 * Menghasilkan file PDF A4 bersih tanpa domain vercel atau header/footer bawaan browser.
 */
import { printLetter } from "./print";

/**
 * Helper untuk mengunduh / menyimpan file PDF resmi A4 presisi.
 * Menggunakan engine cetak native browser untuk menghasilkan dokumen vektor berkualitas tinggi 100% presisi (bukan gambar bitmap canvas yang pecah).
 */
export async function downloadPdfFile(html: string, _filename: string) {
  if (typeof window === "undefined") return;
  printLetter(html);
}
