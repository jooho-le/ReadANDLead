// utils/canvas.ts
export type FourCutTemplate = '2x2' | 'strip' | 'polaroid';

export type ComposeOptions = {
  width: number;
  height: number;
  background?: string;
  quoteText: string;
  bookTitle?: string;
  author?: string;
  photos: HTMLImageElement[];
  template: FourCutTemplate;
  accentColor?: string;
  watermark?: string;
  /** 하단 해시태그/메모 등 */
  footerText?: string;
  /** 레이아웃 옵션 */
  padding?: number;        // 기본 48
  maxQuoteLines?: number;  // 기본 3 (가변 폰트 적용 시 상한으로 동작)
};

export async function composeFourCut(opts: ComposeOptions): Promise<Blob> {
  const {
    width, height,
    background = '#fff',
    quoteText,
    bookTitle,
    author,
    photos,
    template,
    accentColor = '#111827',
    watermark,
    footerText,
  } = opts;

  const padding = opts.padding ?? 48;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const dpr = (globalThis.devicePixelRatio || 1);

  // DPR 스케일링 (선명도)
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  // 배경
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  // 공통 텍스트
  const fontSans = 'Pretendard, Apple SD Gothic Neo, Noto Sans KR, system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
  const innerW = width - padding * 2;

  // 1) 상단 인용문: 박스 높이 안에 들어오도록 폰트 자동 축소 + 말줄임
  const quoteMaxBlockH = template === 'strip' ? height * 0.22 : height * 0.28;
  const quoteFit = fitTextBlock(ctx, {
    text: quoteText,
    maxWidth: innerW,
    maxBlockHeight: quoteMaxBlockH,
    maxLines: 5,
    baseSize: 48,
    minSize: 28,
    weight: 800,
    lineHeightFactor: 1.15,
    fontFamily: fontSans,
  });

  ctx.fillStyle = accentColor;
  ctx.textBaseline = 'top';
  ctx.font = `${quoteFit.weight} ${quoteFit.fontSize}px ${fontSans}`;

  let cy = padding;
  quoteFit.lines.forEach(line => {
    ctx.fillText(line, padding, cy);
    cy += quoteFit.lineHeight;
  });

  // 2) 메타(책/저자)
  ctx.fillStyle = '#1f2937';
  if (bookTitle) {
    cy += 6;
    const titleFit = fitTextBlock(ctx, {
      text: `《${bookTitle}》`,
      maxWidth: innerW,
      maxBlockHeight: 36 * 2, // 2줄
      maxLines: 2,
      baseSize: 28,
      minSize: 22,
      weight: 600,
      lineHeightFactor: 1.2,
      fontFamily: fontSans,
    });
    ctx.font = `${titleFit.weight} ${titleFit.fontSize}px ${fontSans}`;
    titleFit.lines.forEach(line => {
      ctx.fillText(line, padding, cy);
      cy += titleFit.lineHeight;
    });
  }
  if (author) {
    const authorFit = fitTextBlock(ctx, {
      text: author,
      maxWidth: innerW,
      maxBlockHeight: 36, // 1줄
      maxLines: 1,
      baseSize: 28,
      minSize: 22,
      weight: 600,
      lineHeightFactor: 1.2,
      fontFamily: fontSans,
    });
    ctx.font = `${authorFit.weight} ${authorFit.fontSize}px ${fontSans}`;
    authorFit.lines.forEach(line => {
      ctx.fillText(line, padding, cy);
      cy += authorFit.lineHeight;
    });
  }

  cy += 8;

  // 3) Footer(해시태그) 높이 미리 산출
  let footerLayout: ReturnType<typeof fitTextBlock> | null = null;
  if (footerText && footerText.trim()) {
    footerLayout = fitTextBlock(ctx, {
      text: footerText.trim(),
      maxWidth: innerW,
      maxBlockHeight: height * 0.18, // 최대 3줄 정도
      maxLines: 3,
      baseSize: 26,
      minSize: 20,
      weight: 500,
      lineHeightFactor: 1.23,
      fontFamily: fontSans,
    });
  }
  const reservedFooterH = footerLayout ? (footerLayout.lines.length * footerLayout.lineHeight + 16) : 0;
  const watermarkReserve = watermark ? 22 : 0;

  // 4) 사진 영역
  const photoTop = (template === 'strip' || template === '2x2') ? cy : Math.max(cy, height * 0.35);
  const photoBottom = height - padding - reservedFooterH - watermarkReserve;
  const photoAreaH = Math.max(0, photoBottom - photoTop - 8);
  const photoAreaW = innerW;

  drawPhotos(ctx, { template, photos, x: padding, y: photoTop, areaW: photoAreaW, areaH: photoAreaH });

  // 5) Footer 배경 바 + 텍스트
  if (footerLayout && footerLayout.lines.length) {
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.92)'; // 흰 배경(겹침 방지)
    ctx.fillRect(0, height - padding - reservedFooterH - 4, width, reservedFooterH + 8);
    ctx.restore();

    ctx.fillStyle = '#4b5563';
    ctx.textBaseline = 'top';
    ctx.font = `${footerLayout.weight} ${footerLayout.fontSize}px ${fontSans}`;

    let fy = height - padding - reservedFooterH + 8;
    footerLayout.lines.forEach(line => {
      ctx.fillText(line, padding, fy);
      fy += footerLayout.lineHeight;
    });
  }

  // 6) 워터마크
  if (watermark) {
    ctx.fillStyle = 'rgba(17,24,39,.3)';
    ctx.textBaseline = 'alphabetic';
    ctx.font = `600 20px ${fontSans}`;
    const m = ctx.measureText(watermark);
    ctx.fillText(watermark, width - padding - m.width, height - padding / 2);
  }

  return await new Promise<Blob>(resolve => canvas.toBlob(b => resolve(b!), 'image/png', 0.92));
}

/* ===== 텍스트 핏팅 유틸 ===== */
function fitTextBlock(
  ctx: CanvasRenderingContext2D,
  params: {
    text: string;
    maxWidth: number;
    maxBlockHeight: number;
    maxLines: number;
    baseSize: number;
    minSize: number;
    weight: number;
    lineHeightFactor: number;
    fontFamily: string;
  }
){
  const {
    text, maxWidth, maxBlockHeight, maxLines,
    baseSize, minSize, weight, lineHeightFactor, fontFamily
  } = params;

  const tokens = makeTokens(text);
  let chosen = { lines: [] as string[], fontSize: baseSize, lineHeight: baseSize * lineHeightFactor, weight };

  for (let size = baseSize; size >= minSize; size -= 1) {
    ctx.font = `${weight} ${size}px ${fontFamily}`;
    const lineHeight = Math.ceil(size * lineHeightFactor);

    const lines = wrapTokens(ctx, tokens, maxWidth, maxLines);
    const totalH = lines.length * lineHeight;

    if (totalH <= maxBlockHeight) {
      chosen = { lines, fontSize: size, lineHeight, weight };
      break;
    }

    if (size === minSize) {
      chosen = { lines, fontSize: size, lineHeight, weight };
    }
  }
  return chosen;
}

// 공백 있으면 단어 단위, 없으면 글자 단위
function makeTokens(text: string): string[] {
  if (/\s/.test(text)) return text.trim().split(/\s+/);
  return Array.from(text.trim());
}

function wrapTokens(
  ctx: CanvasRenderingContext2D,
  tokens: string[],
  maxWidth: number,
  maxLines: number
): string[] {
  const lines: string[] = [];
  let line = '';

  const joiner = tokens.some(t => /\s/.test(t)) ? ' ' : '';
  for (const tk of tokens) {
    const test = line ? `${line}${joiner}${tk}` : tk;
    if (ctx.measureText(test).width > maxWidth) {
      if (line) lines.push(line);
      if (lines.length >= maxLines - 1) {
        // 마지막 줄 말줄임
        let rest = tk;
        while (ctx.measureText(rest + '…').width > maxWidth && rest.length > 0) {
          rest = rest.slice(0, -1);
        }
        lines.push(rest + '…');
        return lines.slice(0, maxLines);
      }
      line = tk;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, maxLines);
}

/* ===== 이미지 렌더 ===== */
function drawPhotos(
  ctx: CanvasRenderingContext2D,
  params: { template: FourCutTemplate; photos: HTMLImageElement[]; x: number; y: number; areaW: number; areaH: number }
){
  const { template, photos, x, y, areaW, areaH } = params;

  const list = photos.slice(0, 4);
  const radius = 16;

  const clipRounded = (rx: number, ry: number, rw: number, rh: number, r = radius) => {
    ctx.save();
    roundedPath(ctx, rx, ry, rw, rh, r);
    ctx.clip();
    return () => ctx.restore();
  };

  if (template === '2x2') {
    const gap = 14;
    const cols = 2, rows = 2;
    const cellW = (areaW - gap) / cols;
    const cellH = (areaH - gap) / rows;

    // ★ 잘림 최소화: 정사각형 셀을 약간 세로로 늘리고 레터박스
    const adjustedH = cellH * 1.05; // 5% 늘림
    const offsetY = (cellH - adjustedH) / 2;

    list.forEach((img, i) => {
      const r = Math.floor(i / cols), c = i % cols;
      const rx = x + c * (cellW + gap);
      const ry = y + r * (cellH + gap) + offsetY;
      const restore = clipRounded(rx, ry, cellW, adjustedH);
      // contain으로 잘림 방지(위아래 흰 바 가능)
      containImage(ctx, img, rx, ry, cellW, adjustedH);
      restore();
    });
    return;
  }

  if (template === 'strip') {
    const pieces = Math.max(1, Math.min(list.length || 4, 4));
    const gap = 12;
    const cellH = (areaH - gap * (pieces - 1)) / pieces;
    const cellW = areaW;
    list.forEach((img, i) => {
      const rx = x;
      const ry = y + i * (cellH + gap);
      const restore = clipRounded(rx, ry, cellW, cellH);
      containImage(ctx, img, rx, ry, cellW, cellH);
      restore();
    });
    return;
  }

  // polaroid (옵션)
  if (template === 'polaroid') {
    const cols = 2, rows = 2, gap = 16;
    const outerW = (areaW - gap) / cols;
    const outerH = (areaH - gap) / rows;
    const pad = 16;
    const bottom = 36;

    list.forEach((img, i) => {
      const r = Math.floor(i / cols), c = i % cols;
      const rx = x + c * (outerW + gap);
      const ry = y + r * (outerH + gap);

      // 카드 배경
      ctx.fillStyle = '#fff';
      roundedPath(ctx, rx, ry, outerW, outerH, 20);
      ctx.fill();

      const px = rx + pad;
      const py = ry + pad;
      const pw = outerW - pad * 2;
      const ph = outerH - pad - bottom;

      const restore = clipRounded(px, py, pw, ph, 12);
      coverImage(ctx, img, px, py, pw, ph);
      restore();
    });
    return;
  }
}

function roundedPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number){
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

// cover(가득 채우기, 잘릴 수 있음)
function coverImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number){
  const iw = img.width, ih = img.height;
  const s = Math.max(w / iw, h / ih);
  const dw = iw * s, dh = ih * s;
  const dx = x + (w - dw) / 2;
  const dy = y + (h - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
}

// contain(레터박스, 잘림 없음)
function containImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number){
  const iw = img.width, ih = img.height;
  const s = Math.min(w / iw, h / ih);
  const dw = iw * s, dh = ih * s;
  const dx = x + (w - dw) / 2;
  const dy = y + (h - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise(resolve => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.readAsDataURL(blob);
  });
}
