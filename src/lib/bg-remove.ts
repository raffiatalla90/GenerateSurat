"use client";

// Remove white/light background -> transparent, keep dark strokes
// Works for TTD scan, logo on white, JPG with white bg
export async function removeBackground(
  dataUrl: string,
  opts: { threshold?: number; feather?: number } = {}
): Promise<string> {
  const threshold = opts.threshold ?? 230; // 0-255, higher = more aggressive (removes light gray too)
  const feather = opts.feather ?? 15;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // autocrop first to trim white margins, then bg remove
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not supported"));

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // luminance
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;

        if (lum >= threshold) {
          // pure white -> transparent
          // feather: near threshold make semi-transparent for smoother edge
          if (lum >= threshold + feather) {
            data[i + 3] = 0;
          } else {
            const ratio = (lum - threshold) / feather; // 0..1
            data[i + 3] = Math.round((1 - ratio) * 40); // fade to 0, keep subtle
          }
        } else if (lum > threshold - 30) {
          // soften edge: reduce alpha a bit for light gray edge
          // keep dark strokes opaque
        }
      }

      ctx.putImageData(imageData, 0, 0);

      // Autocrop transparent borders
      const cropped = autocropCanvas(canvas);
      resolve(cropped.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("Gagal load gambar"));
    img.src = dataUrl;
  });
}

function autocropCanvas(source: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = source.getContext("2d");
  if (!ctx) return source;
  const w = source.width;
  const h = source.height;
  const imgData = ctx.getImageData(0, 0, w, h).data;

  let minX = w, minY = h, maxX = 0, maxY = 0;
  let found = false;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4 + 3;
      if (imgData[idx] > 20) {
        // non-transparent
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
        found = true;
      }
    }
  }

  if (!found) return source;
  // add padding
  const pad = 6;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(w - 1, maxX + pad);
  maxY = Math.min(h - 1, maxY + pad);

  const cw = maxX - minX + 1;
  const ch = maxY - minY + 1;
  if (cw === w && ch === h) return source;

  const out = document.createElement("canvas");
  out.width = cw;
  out.height = ch;
  const octx = out.getContext("2d");
  if (!octx) return source;
  octx.drawImage(source, minX, minY, cw, ch, 0, 0, cw, ch);
  return out;
}

// Convert PDF first page to image dataUrl via pdf.js
export async function pdfToImageDataUrl(file: File, scale = 2): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  // use worker from cdn
  // @ts-ignore
  const workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
  // @ts-ignore
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

  const arrayBuffer = await file.arrayBuffer();
  // @ts-ignore
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  // @ts-ignore
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas.toDataURL("image/png");
}
