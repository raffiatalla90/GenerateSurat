import "server-only";

const COUNTER_KEY = "getmasjid_counter_v1";

// Vercel: gunakan Next.js cookies + cache in-memory per instance
// Karena serverless stateless, kita pakai fallback timestamp-based untuk produksi
export function generateNomorSurat(): string {
  // Production: selalu random biar aman & scalable di Vercel
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = String(now.getFullYear());
  const rand = String(Math.floor(Math.random() * 900) + 100);
  return `${rand}/GMJ/${mm}/${yyyy}`;
}

export function generateNomorSuratClient(sequence: number): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = String(now.getFullYear());
  const nomor = String(sequence).padStart(3, "0");
  return `${nomor}/GMJ/${mm}/${yyyy}`;
}

export function formatTanggalIndonesia(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
