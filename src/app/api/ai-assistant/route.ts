import { NextRequest, NextResponse } from "next/server";
import { AiGenerateRequest, generateLetterLocally } from "@/lib/ai-assistant";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AiGenerateRequest;

    // Check if Gemini or OpenAI API Key is provided in server environment
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (geminiKey) {
      try {
        const systemPrompt = `Anda adalah asisten AI profesional untuk penyusunan surat dinas dan korespondensi bisnis resmi Indonesia (bahasa baku, formal, EYD/EBI sempurna, struktur elegan).`;
        let userPrompt = "";

        if (body.action === "generate_from_idea") {
          userPrompt = `Buatkan draf isi surat resmi kepada ${body.penerima || "Bapak/Ibu Pimpinan"} di ${body.instansi || "Instansi Tujuan"} mengenai perihal "${body.perihal || "Kerja Sama"}".
Ide/Tujuan: "${body.prompt || ""}"
Gaya bahasa: ${body.tone || "formal dan profesional"}.
Hanya berikan teks isi surat (tanpa kop dan tanpa nomor surat), lengkap dengan paragraf pembuka sopan, poin-poin pokok bahasan yang terstruktur rapi, dan paragraf penutup resmi.`;
        } else {
          userPrompt = `Tolong lakukan tindakan "${body.action}" pada teks surat berikut agar menjadi surat dinas/resmi yang sangat rapi dan baku:
Teks asli:
"""
${body.currentText || ""}
"""
Penerima: ${body.penerima || "Bapak/Ibu Pimpinan"} di ${body.instansi || "Instansi Tujuan"}.
Hanya berikan teks hasil perbaikan.`;
        }

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              { role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }
            ],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 1000
            }
          })
        });

        if (res.ok) {
          const data = await res.json();
          const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (generatedText && generatedText.trim().length > 10) {
            return NextResponse.json({
              resultText: generatedText.trim(),
              source: "llm"
            });
          }
        }
      } catch (llmErr) {
        console.warn("Gemini API call failed, falling back to local expert engine:", llmErr);
      }
    }

    // Default Expert Rule-Based Engine
    const localResult = generateLetterLocally(body);
    return NextResponse.json(localResult);
  } catch (error) {
    console.error("AI Assistant Route Error:", error);
    return NextResponse.json(
      { error: "Gagal memproses permintaan asisten AI." },
      { status: 500 }
    );
  }
}
