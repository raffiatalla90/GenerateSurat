import { NextRequest, NextResponse } from "next/server";
import { generateLetterHTML } from "@/lib/letter-html";
import { generateNomorSurat } from "@/lib/letter-number";
import { GeneratePdfPayload, LetterData, KopSuratConfig, SignatureConfig } from "@/types/letter";
import { DEFAULT_KOP, DEFAULT_SIG } from "@/lib/kop-defaults";
import { SURAT_TEMPLATES } from "@/lib/letter-templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Launch Puppeteer browser instance dynamically
 * Mendukung local Chrome (Mac/Linux/Windows) dan @sparticuz/chromium untuk Vercel Serverless.
 */
async function launchBrowser() {
  const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_VERSION;

  if (isServerless) {
    try {
      const chromiumModule = await import("@sparticuz/chromium");
      const chromium = (chromiumModule.default || chromiumModule) as unknown as {
        args: string[];
        executablePath: () => Promise<string>;
      };
      const puppeteerCore = (await import("puppeteer-core")).default;

      return await puppeteerCore.launch({
        args: [...(chromium.args || []), "--hide-scrollbars", "--disable-web-security"],
        defaultViewport: { width: 794, height: 1123, deviceScaleFactor: 2 },
        executablePath: await chromium.executablePath(),
        headless: true,
      });
    } catch (e) {
      console.warn("Serverless chromium launch failed, falling back to puppeteer standard:", e);
    }
  }

  // Local environment: gunakan puppeteer standard atau temukan system chrome
  try {
    const puppeteerModule = await import("puppeteer");
    const puppeteer = puppeteerModule.default || puppeteerModule;

    const systemChromePaths = [
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Chromium.app/Contents/MacOS/Chromium",
      "/usr/bin/google-chrome",
      "/usr/bin/google-chrome-stable",
      "/usr/bin/chromium-browser",
      "/usr/bin/chromium",
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    ];

    let executablePath: string | undefined = process.env.PUPPETEER_EXECUTABLE_PATH;
    if (!executablePath) {
      try {
        const fs = await import("fs");
        for (const p of systemChromePaths) {
          if (fs.existsSync(/* turbopackIgnore: true */ p)) {
            executablePath = p;
            break;
          }
        }
      } catch {}
    }

    return await (puppeteer as any).launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--font-render-hinting=none",
      ],
      ...(executablePath ? { executablePath } : {}),
    });
  } catch (err) {
    console.error("Failed to launch standard puppeteer:", err);
    throw new Error("Puppeteer tidak dapat dijalankan di environment ini.");
  }
}

/**
 * Generate binary PDF buffer dari string HTML atau URL murni
 */
async function generatePdfFromSource(source: { html?: string; url?: string }): Promise<Buffer> {
  const browser = await launchBrowser();

  try {
    const page = await browser.newPage();
    await (page as any).setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
    await (page as any).emulateMediaType("print");

    if (source.url) {
      await (page as any).goto(source.url, {
        waitUntil: ["domcontentloaded", "load"],
        timeout: 30000,
      });
    } else if (source.html) {
      // Muat konten HTML dan tunggu hingga network dan fonts selesai dimuat
      await (page as any).setContent(source.html, {
        waitUntil: ["domcontentloaded", "load"],
        timeout: 30000,
      });
    } else {
      throw new Error("Sumber HTML atau URL tidak diberikan.");
    }

    // Tunggu font Google & gambar selesai di-render 100%
    try {
      await (page as any).evaluate(async () => {
        if ((document as any).fonts && (document as any).fonts.ready) {
          await (document as any).fonts.ready;
        }
        const imgs = Array.from(document.images);
        await Promise.all(
          imgs.map((img) => {
            if (img.complete) return Promise.resolve();
            return new Promise((res) => {
              img.onload = res;
              img.onerror = res;
              setTimeout(res, 1000);
            });
          })
        );
      });
    } catch {}

    const pdfUint8 = await (page as any).pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
    });

    return Buffer.from(pdfUint8);
  } finally {
    await browser.close();
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GeneratePdfPayload;

    let html = body.html;
    let filename = body.filename;
    const nomorSurat = body.nomorSurat || generateNomorSurat();

    if (body.url) {
      const pdfBuffer = await generatePdfFromSource({ url: body.url });
      const cleanFilename = filename || `Surat-${Date.now()}.pdf`;
      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${cleanFilename}"`,
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      });
    }

    if (!html) {
      if (!body.namaPenerima || !body.instansiTujuan || !body.perihal || !body.isiSurat) {
        return NextResponse.json({ error: "Data surat belum lengkap." }, { status: 400 });
      }

      const kopConfig: KopSuratConfig = body.kopConfig || DEFAULT_KOP;
      const signatureConfig: SignatureConfig = body.signatureConfig || DEFAULT_SIG;

      const data: LetterData = {
        nomorSurat,
        namaPenerima: body.namaPenerima,
        instansiTujuan: body.instansiTujuan,
        alamatPenerima: body.alamatPenerima,
        perihal: body.perihal,
        perihalCustom: body.perihalCustom,
        isiSurat: body.isiSurat,
        tanggal: body.tanggal || new Date().toISOString().slice(0, 10),
        namaPenandatangan: body.namaPenandatangan || "Raffi Atalla Natha Atmaja",
        jabatan: body.jabatan || "CEO GetMasjid",
        attachments: body.attachments,
        signers: body.signers || [
          {
            nama: body.namaPenandatangan || "Raffi Atalla Natha Atmaja",
            jabatan: body.jabatan || "CEO GetMasjid",
            showSignature: true,
            showStamp: true,
          },
        ],
      };

      html = generateLetterHTML(data, kopConfig, signatureConfig);
      const perihalDisplay = body.perihalCustom || body.perihal;
      filename = `${nomorSurat.replace(/\//g, "-")} - ${perihalDisplay}.pdf`;
    }

    const pdfBuffer = await generatePdfFromSource({ html });
    const cleanFilename = filename || `${nomorSurat.replace(/\//g, "-")}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${cleanFilename}"`,
        "X-Nomor-Surat": nomorSurat,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (err: unknown) {
    console.error("API /api/generate-pdf error:", err);
    const message = err instanceof Error ? err.message : "Gagal generate PDF.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const nomorSurat = searchParams.get("nomorSurat") || generateNomorSurat();
    const namaPenerima = searchParams.get("namaPenerima") || "Bapak Kepala DKM";
    const instansiTujuan = searchParams.get("instansiTujuan") || "Masjid Al-Ikhlas Jakarta Selatan";
    const alamatPenerima = searchParams.get("alamatPenerima") || "Jl. Melati No. 12, Kebayoran Baru, Jakarta Selatan 12130";
    const perihal = searchParams.get("perihal") || "Kerja Sama";
    const perihalCustom = searchParams.get("perihalCustom") || undefined;
    const isiSurat = searchParams.get("isiSurat") || SURAT_TEMPLATES["Kerja Sama"];
    const tanggal = searchParams.get("tanggal") || new Date().toISOString().slice(0, 10);
    const namaPenandatangan = searchParams.get("namaPenandatangan") || "Raffi Atalla Natha Atmaja";
    const jabatan = searchParams.get("jabatan") || "CEO GetMasjid";
    const template = (searchParams.get("template") as "default" | "uns_colored_v1") || "uns_colored_v1";

    const data: LetterData = {
      nomorSurat,
      namaPenerima,
      instansiTujuan,
      alamatPenerima,
      perihal,
      perihalCustom,
      isiSurat,
      tanggal,
      namaPenandatangan,
      jabatan,
      signers: [
        {
          nama: namaPenandatangan,
          jabatan,
          showSignature: true,
          showStamp: true,
        },
      ],
    };

    const kopConfig: KopSuratConfig = {
      ...DEFAULT_KOP,
      template,
    };

    const html = generateLetterHTML(data, kopConfig, DEFAULT_SIG);
    const pdfBuffer = await generatePdfFromSource({ html });

    const perihalDisplay = perihalCustom || perihal;
    const filename = `${nomorSurat.replace(/\//g, "-")} - ${perihalDisplay}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Nomor-Surat": nomorSurat,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (err: unknown) {
    console.error("GET /api/generate-pdf error:", err);
    const message = err instanceof Error ? err.message : "Gagal generate PDF.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
