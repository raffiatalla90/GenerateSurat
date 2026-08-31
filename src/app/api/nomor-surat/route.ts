import { NextResponse } from "next/server";
import { generateNomorSurat, generateNomorSuratClient } from "@/lib/letter-number";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const increment = searchParams.get("increment") === "true";

  // Vercel: selalu random biar aman & scalable (stateless)
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = String(now.getFullYear());
  const rand = String(Math.floor(Math.random() * 900) + 100);
  const nomor = `${rand}/GMJ/${mm}/${yyyy}`;

  return NextResponse.json({ nomorSurat: nomor });
}
