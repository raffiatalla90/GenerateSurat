import { NextRequest, NextResponse } from "next/server";
import { generateLetterHTML } from "@/lib/letter-html";
import { generateNomorSurat } from "@/lib/letter-number";
import { GeneratePdfPayload } from "@/types/letter";
import { DEFAULT_KOP, DEFAULT_SIG } from "@/lib/kop-defaults";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Helper untuk generate PDF dengan Chromium (puppeteer)
// Di lokal: puppeteer bawaan + system Chrome fallback
// Di Vercel: gunakan @sparticuz/chromium untuk edge/runtime nodejs
async function getPdfBuffer(html: string): Promise<Buffer> {
  try {
    // Cek env untuk Vercel Edge
    const vercelEdge = process.env.VERCEL_EDGE === "true";
    if (vercelEdge) {
      // Edge: fallback return HTML dulu karena Puppeteer tidak support di Edge
      throw new Error("Puppeteer tidak support di Vercel Edge. Gunakan Runtime Node.js.");
    }

    // Node runtime: coba import sparticuz/chromium jika tersedia
    let puppeteer;
    try {
      const puppeteerModule = await import("puppeteer");
      puppeteer = puppeteerModule.default || puppeteerModule;
    } catch (e) {
      console.log("Puppeteer tidak dapat di-load");
      throw new Error("Puppeteer tidak tersedia di environment ini.");
    }

    const fs = await import("fs");
    const systemChromePaths = [
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Chromium.app/Contents/MacOS/Chromium",
      "/usr/bin/google-chrome",
      "/usr/bin/chromium-browser",
    ];
    let executablePath: string | undefined;
    for (const p of systemChromePaths) {
      try {
        if (fs.existsSync(p)) {
          executablePath = p;
          break;
        }
      } catch {}
    }

    const launchOpts: Parameters<typeof puppeteer.launch>[0] = {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
      ...(executablePath ? { executablePath } : {}),
    };

    const browser = await puppeteer.launch(launchOpts);

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 15000 });
      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "0", bottom: "0", left: "0", right: "0" },
      });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  } catch (e) {
    console.error("Error generate PDF via Puppeteer:", e);
    throw new Error("Gagal generate PDF. Silakan coba lagi atau gunakan Print PDF dari Preview.");
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GeneratePdfPayload;

    // Validation minimal
    if (!body.namaPenerima || !body.instansiTujuan || !body.perihal || !body.isiSurat) {
      return NextResponse.json({ error: "Data tidak lengkap." }, { status: 400 });
    }

    // Gunakan nomor surat yang sedang aktif di form/preview
    const nomorSurat = body.nomorSurat || generateNomorSurat();

    const kopConfig = body.kopConfig || DEFAULT_KOP;
    const signatureConfig = body.signatureConfig || DEFAULT_SIG;

    const data: GeneratePdfPayload = {
      ...body,
      nomorSurat,
      kopConfig,
      signatureConfig,
    };

    const html = generateLetterHTML(data, kopConfig, signatureConfig);

    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await getPdfBuffer(html);
    } catch (e) {
      console.error("PDF error:", e);
      return NextResponse.json(
        {
          error: "Gagal generate PDF. Silakan gunakan fitur Print PDF di tab Preview.",
          html,
          nomorSurat,
        },
        { status: 500 }
      );
    }

    const perihalDisplay = body.perihalCustom || body.perihal;
    const filename = `${nomorSurat.replace(/\//g, "-")} - ${perihalDisplay}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Nomor-Surat": nomorSurat,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
