export type FourCutTemplate = "2x2" | "strip" | "polaroid";

export type ComposeOptions = {
  width: number;
  height: number;
  background?: string;
  quoteText: string;
  bookTitle?: string;
  author?: string;
  photos: HTMLImageElement[];
  template: FourCutTemplate;
  fontFamily?: string;
  accentColor?: string;
  watermark?: string;
};

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(" ");
  let line = "", yy = y;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) { ctx.fillText(line, x, yy); line = words[n] + " "; yy += lineHeight; }
    else { line = testLine; }
  }
  ctx.fillText(line, x, yy);
  return yy;
}

export async function composeFourCut(options: ComposeOptions): Promise<Blob> {
  const {
    width, height, background = "#ffffff", quoteText, bookTitle, author, photos, template,
    fontFamily = "Pretendard, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
    accentColor = "#111827", watermark = "Literary Trip",
  } = options;

  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = background; ctx.fillRect(0, 0, width, height);

  const padding = Math.round(width * 0.06);
  const quoteAreaHeight = Math.round(height * 0.35);
  ctx.fillStyle = accentColor;
  ctx.font = `700 ${Math.round(width * 0.05)}px ${fontFamily}`;
  ctx.textBaseline = "top";

  const quoteMaxWidth = width - padding * 2;
  let yy = padding;
  yy = wrapText(ctx, `“${quoteText}”`, padding, yy, quoteMaxWidth, Math.round(width * 0.06)) + Math.round(width * 0.03);

  if (bookTitle || author) {
    ctx.font = `500 ${Math.round(width * 0.028)}px ${fontFamily}`;
    ctx.fillStyle = "#4b5563";
    const meta = [bookTitle, author].filter(Boolean).join(" · ");
    ctx.fillText(meta, padding, yy);
  }

  const photoAreaY = quoteAreaHeight;
  const photoAreaH = height - quoteAreaHeight - padding * 1.2;
  const gap = Math.round(width * 0.02);

  if (template === "2x2") {
    const cols = 2, rows = 2;
    const cellW = Math.floor((width - padding * 2 - gap) / cols);
    const cellH = Math.floor((photoAreaH - gap) / rows);
    for (let i = 0; i < Math.min(4, photos.length); i++) {
      const img = photos[i];
      const cx = padding + (i % cols) * (cellW + gap);
      const cy = photoAreaY + Math.floor(i / cols) * (cellH + gap);
      drawCoverImage(ctx, img, cx, cy, cellW, cellH, 12);
    }
  } else if (template === "strip") {
    const count = Math.min(4, photos.length);
    const cellH = Math.floor((photoAreaH - gap * (count - 1)) / count);
    const cellW = width - padding * 2;
    for (let i = 0; i < count; i++) {
      const img = photos[i];
      const cx = padding, cy = photoAreaY + i * (cellH + gap);
      drawCoverImage(ctx, img, cx, cy, cellW, cellH, 20);
    }
  } else if (template === "polaroid") {
    const cols = 2, cellW = Math.floor((width - padding * 2 - gap) / cols), cellH = photoAreaH;
    for (let i = 0; i < Math.min(2, photos.length); i++) {
      const img = photos[i];
      const cx = padding + (i % cols) * (cellW + gap), cy = photoAreaY;
      const frameR = 16; roundRect(ctx, cx, cy, cellW, cellH, frameR, "#fff");
      const innerPad = Math.round(cellW * 0.05); const imgH = Math.floor(cellH * 0.72);
      drawCoverImage(ctx, img, cx + innerPad, cy + innerPad, cellW - innerPad * 2, imgH - innerPad, 8);
      ctx.fillStyle = "#111827"; ctx.font = `600 ${Math.round(cellW * 0.06)}px ${fontFamily}`; ctx.textBaseline = "alphabetic";
      const caption = "여행의 한 장면"; const tw = ctx.measureText(caption).width;
      ctx.fillText(caption, cx + (cellW - tw) / 2, cy + cellH - innerPad * 1.5);
    }
  }

  ctx.fillStyle = "#9CA3AF"; ctx.font = `500 ${Math.round(width * 0.022)}px ${fontFamily}`; ctx.textBaseline = "bottom";
  ctx.fillText(watermark, padding, height - padding * 0.5);

  return new Promise((resolve) => { canvas.toBlob((blob) => resolve(blob!), "image/png", 0.95); });
}

function drawCoverImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number, radius = 12) {
  ctx.save(); roundPath(ctx, x, y, w, h, radius); ctx.clip();
  const imgRatio = img.width / img.height, boxRatio = w / h;
  let dw = w, dh = h, dx = x, dy = y;
  if (imgRatio > boxRatio) { dh = h; dw = h * imgRatio; dx = x + (w - dw) / 2; }
  else { dw = w; dh = w / imgRatio; dy = y + (h - dh) / 2; }
  ctx.drawImage(img, dx, dy, dw, dh); ctx.restore();
}

function roundPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill = "#fff") {
  ctx.save(); roundPath(ctx, x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); ctx.restore();
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result as string); reader.readAsDataURL(blob); });
}
