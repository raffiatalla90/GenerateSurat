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

export function generateNomorSuratClient(sequence: number): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = String(now.getFullYear());
  const nomor = String(sequence).padStart(3, "0");
  return `${nomor}/GMJ/${mm}/${yyyy}`;
}
