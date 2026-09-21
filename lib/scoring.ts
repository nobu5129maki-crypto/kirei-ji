import type { PracticeChar, StrokeFocus } from "./characters";
import { loadStrokes } from "./kanjivg";

export type ScoreBreakdown = {
  overall: number;
  size: number;
  tilt: number;
  center: number;
  shape: number;
  comments: string[];
  praise: string;
  empty: boolean;
  /** 書いた字の上に、赤いお手本を重ねた添削画像 */
  correctionUrl?: string;
};

const SIZE = 160;
/** WritingPad のお手本と同じ。マスの 72% */
const GHOST_EM = 0.72;
const GHOST_NUDGE = 0.02;

function luminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

type Mask = {
  w: number;
  h: number;
  ink: Uint8Array;
  count: number;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  cx: number;
  cy: number;
};

function toMask(image: ImageData, threshold = 210): Mask {
  const w = image.width;
  const h = image.height;
  const ink = new Uint8Array(w * h);
  let count = 0;
  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  let sx = 0;
  let sy = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const lum = luminance(image.data[i], image.data[i + 1], image.data[i + 2]);
      if (lum < threshold && image.data[i + 3] > 40) {
        ink[y * w + x] = 1;
        count++;
        sx += x;
        sy += y;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  return {
    w,
    h,
    ink,
    count,
    minX: count ? minX : 0,
    minY: count ? minY : 0,
    maxX: count ? maxX : 0,
    maxY: count ? maxY : 0,
    cx: count ? sx / count : w / 2,
    cy: count ? sy / count : h / 2,
  };
}

function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function sizeScoreFromMasks(user: Mask, model: Mask): number {
  const uw = Math.max(1, user.maxX - user.minX + 1);
  const uh = Math.max(1, user.maxY - user.minY + 1);
  const mw = Math.max(1, model.maxX - model.minX + 1);
  const mh = Math.max(1, model.maxY - model.minY + 1);
  const wr = uw / mw;
  const hr = uh / mh;
  const aspect = mw / mh;
  // 一のような横画は「長さ」、縦に長い字は「高さ」が大きさ。
  const ratio =
    aspect >= 2.2 ? wr * 0.82 + hr * 0.18 : aspect <= 0.45 ? hr * 0.82 + wr * 0.18 : Math.sqrt((uw * uh) / (mw * mh));
  return clampScore(100 - Math.abs(ratio - 1) * 115);
}

function principalAngle(mask: Mask): number {
  const { sxx, syy, sxy } = secondMoments(mask);
  return 0.5 * Math.atan2(2 * sxy, sxx - syy);
}

function secondMoments(mask: Mask): { sxx: number; syy: number; sxy: number } {
  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  const { cx, cy, w, h, ink } = mask;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!ink[y * w + x]) continue;
      const dx = x - cx;
      const dy = y - cy;
      sxx += dx * dx;
      syy += dy * dy;
      sxy += dx * dy;
    }
  }
  return { sxx, syy, sxy };
}

function elongation(mask: Mask): number {
  const { sxx, syy } = secondMoments(mask);
  const sum = sxx + syy;
  return sum <= 0 ? 0 : Math.abs(sxx - syy) / sum;
}

function topBand(mask: Mask, frac = 0.42): Mask {
  const cut = mask.minY + (mask.maxY - mask.minY) * frac;
  const ink = new Uint8Array(mask.ink.length);
  let count = 0;
  let minX = mask.w;
  let minY = mask.h;
  let maxX = 0;
  let maxY = 0;
  let sx = 0;
  let sy = 0;
  for (let y = 0; y < mask.h; y++) {
    if (y > cut) continue;
    for (let x = 0; x < mask.w; x++) {
      if (!mask.ink[y * mask.w + x]) continue;
      ink[y * mask.w + x] = 1;
      count++;
      sx += x;
      sy += y;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  return {
    ...mask,
    ink,
    count,
    minX: count ? minX : 0,
    minY: count ? minY : 0,
    maxX: count ? maxX : 0,
    maxY: count ? maxY : 0,
    cx: count ? sx / count : mask.w / 2,
    cy: count ? sy / count : mask.h / 2,
  };
}

function angleDiff(a: number, b: number): number {
  let d = Math.abs(a - b);
  if (d > Math.PI / 2) d = Math.PI - d;
  return d;
}

function tiltScoreFromMasks(user: Mask, model: Mask): number {
  const useBand = elongation(user) < 0.28 && elongation(model) < 0.28;
  const ua = principalAngle(useBand ? topBand(user) : user);
  const ma = principalAngle(useBand ? topBand(model) : model);
  return clampScore(100 - (angleDiff(ua, ma) * 180) / Math.PI * 4.2);
}

function resample(mask: Mask, out = 48): Uint8Array {
  const grid = new Uint8Array(out * out);
  const bw = Math.max(1, mask.maxX - mask.minX + 1);
  const bh = Math.max(1, mask.maxY - mask.minY + 1);
  const side = Math.max(bw, bh);
  const ox = mask.minX - (side - bw) / 2;
  const oy = mask.minY - (side - bh) / 2;
  for (let y = 0; y < out; y++) {
    for (let x = 0; x < out; x++) {
      const sx = Math.floor(ox + (x / out) * side);
      const sy = Math.floor(oy + (y / out) * side);
      if (sx < 0 || sy < 0 || sx >= mask.w || sy >= mask.h) continue;
      if (mask.ink[sy * mask.w + sx]) grid[y * out + x] = 1;
    }
  }
  return grid;
}

function iou(a: Uint8Array, b: Uint8Array): number {
  let inter = 0;
  let union = 0;
  for (let i = 0; i < a.length; i++) {
    const u = a[i] | b[i];
    const n = a[i] & b[i];
    union += u;
    inter += n;
  }
  return union === 0 ? 0 : inter / union;
}

function dilate(grid: Uint8Array, side: number, r = 1): Uint8Array {
  const out = new Uint8Array(grid.length);
  for (let y = 0; y < side; y++) {
    for (let x = 0; x < side; x++) {
      let v = 0;
      for (let dy = -r; dy <= r && !v; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= side || ny >= side) continue;
          if (grid[ny * side + nx]) {
            v = 1;
            break;
          }
        }
      }
      out[y * side + x] = v;
    }
  }
  return out;
}

function renderModel(
  char: string,
  fontFamily: string,
): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.fillStyle = "#111111";
  ctx.font = `600 ${SIZE * GHOST_EM}px ${fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(char, SIZE / 2, SIZE / 2 + SIZE * GHOST_NUDGE);
  return ctx.getImageData(0, 0, SIZE, SIZE);
}

function drawUserToSquare(source: HTMLCanvasElement): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.drawImage(source, 0, 0, SIZE, SIZE);
  return ctx.getImageData(0, 0, SIZE, SIZE);
}

function commentFor(
  char: PracticeChar,
  size: number,
  tilt: number,
  center: number,
  shape: number,
  mask: Mask,
): string[] {
  const comments: string[] = [];
  const bw = mask.maxX - mask.minX + 1;
  const bh = mask.maxY - mask.minY + 1;
  const fill = (bw * bh) / (mask.w * mask.h);
  const midX = (mask.minX + mask.maxX) / 2;
  const midY = (mask.minY + mask.maxY) / 2;

  if (size < 62) {
    comments.push(
      char.char === "一"
        ? "短すぎます。マスの左右に、少し余白を残す長さで。"
        : "マスの七〜八割を目安に、もう一回り大きく。",
    );
  } else if (size < 78 && fill < 0.28) {
    comments.push("字が小さめです。余白を恐れず、枠の内側いっぱいに。");
  } else if (
    size > 96 &&
    (mask.minX < mask.w * 0.05 ||
      mask.maxX > mask.w * 0.95 ||
      mask.minY < mask.h * 0.05 ||
      mask.maxY > mask.h * 0.95)
  ) {
    comments.push("枠に当たっています。周囲に一画分の余白を残しましょう。");
  }

  if (center < 70) {
    if (midX < mask.w * 0.46) {
      comments.push("中心が左に寄っています。縦の中心線に乗せて。");
    } else if (midX > mask.w * 0.54) {
      comments.push("中心が右に寄っています。マスの十字を先に目で取ります。");
    }
    if (midY < mask.h * 0.45) {
      comments.push("上が詰まっています。少し下げて、頭の余白を。");
    } else if (midY > mask.h * 0.56) {
      comments.push("下が沈んでいます。字の重心をマスの中心へ。");
    }
  }

  if (tilt < 72) {
    comments.push("少し傾いています。最初の一画を水平（または垂直）に置くと整います。");
  }

  if (shape < 58) {
    comments.push("まずは大きな骨格。細部より、外の形を手本に近づけて。");
  } else if (shape < 74) {
    comments.push("骨格は見えてきました。交わる位置と、はらいの長さを揃えて。");
  }

  const focusLine: Record<StrokeFocus, string> = {
    tome: "とめは、動きを止めてから筆を離す。流さない。",
    hane: "はねは、止めて、小さく跳ねる。長くしない。",
    harai: "はらいは最後まで一気に。途中で細く切らない。",
    center: "十字の交点を、字の心臓だと思ってください。",
    balance: "左右のどちらかが勝っていないか、離れて見る。",
    size: "隣の字と同じ大きさになるよう、マスを基準に。",
    curve: "曲線は力を抜いて一拍。角にしない。",
    line: "直線は、終わる位置を先に目で決めてから引く。",
  };
  comments.push(focusLine[char.focus]);

  if (char.tips[0] && comments.length < 4) {
    comments.push(char.tips[0]);
  }

  return comments.slice(0, 4);
}

function drawCorrectionGrid(ctx: CanvasRenderingContext2D, size: number) {
  ctx.save();
  ctx.strokeStyle = "#C9BBA8";
  ctx.lineWidth = 1.4;
  ctx.strokeRect(size * 0.035, size * 0.035, size * 0.93, size * 0.93);
  ctx.strokeStyle = "#D8CCBA";
  ctx.lineWidth = 0.9;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(size / 2, size * 0.035);
  ctx.lineTo(size / 2, size * 0.965);
  ctx.moveTo(size * 0.035, size / 2);
  ctx.lineTo(size * 0.965, size / 2);
  ctx.stroke();
  ctx.restore();
}

function parseViewBox(viewBox: string): { w: number; h: number } {
  const parts = viewBox.trim().split(/[\s,]+/).map(Number);
  return { w: parts[2] || 109, h: parts[3] || 109 };
}

function pathEndPoint(d: string): { x: number; y: number } | null {
  const nums = [...d.matchAll(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi)].map((m) => Number(m[0]));
  if (nums.length < 2) return null;
  return { x: nums[nums.length - 2], y: nums[nums.length - 1] };
}

type Bounds = { w: number; h: number; cx: number; cy: number };
type Fit = { scale: number; dx: number; dy: number };

function maskBounds(mask: Mask): Bounds | null {
  if (!mask.count) return null;
  return {
    w: mask.maxX - mask.minX + 1,
    h: mask.maxY - mask.minY + 1,
    cx: (mask.minX + mask.maxX) / 2,
    cy: (mask.minY + mask.maxY) / 2,
  };
}

function measureDrawnBounds(
  size: number,
  paint: (ctx: CanvasRenderingContext2D) => void,
): Bounds | null {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  paint(ctx);
  return maskBounds(toMask(ctx.getImageData(0, 0, size, size)));
}

function fitBounds(src: Bounds, dst: Bounds): Fit {
  const scale = Math.min(dst.w / Math.max(1, src.w), dst.h / Math.max(1, src.h));
  return {
    scale,
    dx: dst.cx - src.cx * scale,
    dy: dst.cy - src.cy * scale,
  };
}

function drawModelGlyph(
  ctx: CanvasRenderingContext2D,
  char: string,
  fontFamily: string,
  size: number,
  color: string,
) {
  ctx.fillStyle = color;
  ctx.font = `600 ${size * GHOST_EM}px ${fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(char, size / 2, size / 2 + size * GHOST_NUDGE);
}

function drawModelStrokes(
  ctx: CanvasRenderingContext2D,
  paths: string[],
  viewBox: string,
  size: number,
  color: string,
  width: number,
) {
  const { w, h } = parseViewBox(viewBox);
  const scale = size / Math.max(w, h);
  ctx.save();
  ctx.scale(scale, scale);
  ctx.strokeStyle = color;
  ctx.lineWidth = width / scale;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const d of paths) {
    ctx.stroke(new Path2D(d));
  }
  ctx.restore();
}

function withFit(
  ctx: CanvasRenderingContext2D,
  fit: Fit | null,
  paint: () => void,
) {
  if (!fit) {
    paint();
    return;
  }
  ctx.save();
  ctx.translate(fit.dx, fit.dy);
  ctx.scale(fit.scale, fit.scale);
  paint();
  ctx.restore();
}

function drawHaraiMarks(
  ctx: CanvasRenderingContext2D,
  paths: string[],
  viewBox: string,
  size: number,
) {
  const { w, h } = parseViewBox(viewBox);
  const scale = size / Math.max(w, h);
  const pad = size * 0.08;
  ctx.fillStyle = "#C45C4A";
  for (const d of paths) {
    const end = pathEndPoint(d);
    if (!end) continue;
    const x = end.x * scale;
    const y = end.y * scale;
    if (x < pad || y < pad || x > size - pad || y > size - pad) continue;
    ctx.beginPath();
    ctx.arc(x, y, Math.max(4, size * 0.018), 0, Math.PI * 2);
    ctx.fill();
  }
}

function punchUserInk(
  ctx: CanvasRenderingContext2D,
  user: HTMLCanvasElement,
  size: number,
) {
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  ctx.filter = "blur(4.5px)";
  ctx.drawImage(user, 0, 0, size, size);
  ctx.filter = "none";
  ctx.globalAlpha = 0.95;
  ctx.drawImage(user, 0, 0, size, size);
  ctx.restore();
}

function modelFitForGhost(
  char: string,
  fontFamily: string,
  paths: string[] | undefined,
  viewBox: string,
  size: number,
): Fit | null {
  const ghost = measureDrawnBounds(size, (ctx) => {
    drawModelGlyph(ctx, char, fontFamily, size, "#111111");
  });
  if (!ghost || !paths?.length) return null;
  const strokes = measureDrawnBounds(size, (ctx) => {
    drawModelStrokes(ctx, paths, viewBox, size, "#111111", 5.4);
  });
  if (!strokes) return null;
  return fitBounds(strokes, ghost);
}

/** 黒＝いまの字、赤＝足りないところ・直したい終わり方 */
async function renderCorrectionPreview(
  userCanvas: HTMLCanvasElement,
  char: PracticeChar,
  fontFamily: string,
): Promise<string> {
  const out = 420;
  const canvas = document.createElement("canvas");
  canvas.width = out;
  canvas.height = out;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.fillStyle = "#FBF7F0";
  ctx.fillRect(0, 0, out, out);
  drawCorrectionGrid(ctx, out);

  ctx.save();
  ctx.globalAlpha = 0.95;
  ctx.drawImage(userCanvas, 0, 0, out, out);
  ctx.restore();

  const strokes = await loadStrokes(char.char);
  const model = document.createElement("canvas");
  model.width = out;
  model.height = out;
  const mctx = model.getContext("2d");
  if (!mctx) return canvas.toDataURL("image/png");

  const fit = modelFitForGhost(
    char.char,
    fontFamily,
    strokes?.paths,
    strokes?.viewBox ?? "0 0 109 109",
    out,
  );

  if (strokes?.paths.length) {
    withFit(mctx, fit, () => {
      drawModelStrokes(mctx, strokes.paths, strokes.viewBox, out, "#C45C4A", 5.6);
    });
  } else {
    drawModelGlyph(mctx, char.char, fontFamily, out, "#C45C4A");
  }

  const miss = document.createElement("canvas");
  miss.width = out;
  miss.height = out;
  const xctx = miss.getContext("2d");
  if (xctx) {
    xctx.drawImage(model, 0, 0);
    punchUserInk(xctx, userCanvas, out);
    ctx.save();
    ctx.globalAlpha = 0.94;
    ctx.drawImage(miss, 0, 0);
    ctx.restore();

    if (strokes?.paths.length && (char.focus === "harai" || char.focus === "hane" || char.focus === "tome")) {
      const tips = document.createElement("canvas");
      tips.width = out;
      tips.height = out;
      const tctx = tips.getContext("2d");
      if (tctx) {
        const tipPaths =
          char.focus === "harai" ? strokes.paths.slice(-2) : strokes.paths.slice(-1);
        withFit(tctx, fit, () => {
          drawHaraiMarks(tctx, tipPaths, strokes.viewBox, out);
        });
        punchUserInk(tctx, userCanvas, out);
        ctx.drawImage(tips, 0, 0);
      }
    }
  }

  return canvas.toDataURL("image/png");
}

function praiseFor(overall: number, shape: number): string {
  if (overall >= 90 && shape >= 82) return "骨格が整っています。この形を、体に残しましょう。";
  if (overall >= 82) return "よく整いました。もう一度、同じ大きさで書いて定着を。";
  if (overall >= 72) return "乗ってきました。中心と、終わり方だけ意識してもう一枚。";
  if (overall >= 60) return "方向は合っています。大きく、ゆっくり、一画ずつ。";
  return "うまくいかなくて当然です。お手本の外の形だけ見て、もう一度。";
}

export async function scoreHandwriting(
  userCanvas: HTMLCanvasElement,
  char: PracticeChar,
): Promise<ScoreBreakdown> {
  await document.fonts.ready;
  const fontFamily = `"Klee One", "Yu Mincho", "Hiragino Mincho ProN", serif`;
  try {
    await document.fonts.load(`600 ${SIZE * GHOST_EM}px "Klee One"`);
  } catch {
    /* keep fallback */
  }

  const userImg = drawUserToSquare(userCanvas);
  const modelImg = renderModel(char.char, fontFamily);
  const user = toMask(userImg);
  const model = toMask(modelImg);

  if (user.count < 40) {
    return {
      overall: 0,
      size: 0,
      tilt: 0,
      center: 0,
      shape: 0,
      comments: ["まだ線が見えません。マスの中を、もう少し太く、大きく。"],
      praise: "書けたら、見てみるを押してください。",
      empty: true,
    };
  }

  const sizeScore = sizeScoreFromMasks(user, model);
  const tiltScore = tiltScoreFromMasks(user, model);

  const dx = (user.cx - SIZE / 2) / SIZE;
  const dy = (user.cy - SIZE / 2) / SIZE;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const centerScore = clampScore(100 - dist * 280);

  const u = dilate(resample(user), 48, 1);
  const m = dilate(resample(model), 48, 1);
  const overlap = iou(u, m);
  const shapeScore = clampScore(overlap * 145);

  const overall = clampScore(
    sizeScore * 0.18 + tiltScore * 0.18 + centerScore * 0.22 + shapeScore * 0.42,
  );

  return {
    overall,
    size: sizeScore,
    tilt: tiltScore,
    center: centerScore,
    shape: shapeScore,
    comments: commentFor(char, sizeScore, tiltScore, centerScore, shapeScore, user),
    praise: praiseFor(overall, shapeScore),
    empty: false,
    correctionUrl: await renderCorrectionPreview(userCanvas, char, fontFamily),
  };
}

export function summarizeDiagnosis(
  samples: { size: number; tilt: number; center: number }[],
): import("./storage").Diagnosis {
  const avg = (key: "size" | "tilt" | "center") =>
    samples.reduce((a, s) => a + s[key], 0) / Math.max(1, samples.length);

  const sizeAvg = avg("size");
  const tiltAvg = avg("tilt");
  const centerAvg = avg("center");

  const size = sizeAvg < 70 ? "small" : sizeAvg > 94 ? "large" : "ok";
  const tilt = tiltAvg < 72 ? "right" : "ok";
  const center = centerAvg < 70 ? "left" : "ok";

  const bits: string[] = [];
  if (size === "small") bits.push("字が小さくなる");
  if (size === "large") bits.push("枠いっぱいに広がりすぎる");
  if (center === "left") bits.push("中心が左に寄る");
  if (tilt !== "ok") bits.push("わずかに傾く");
  const note = bits.length
    ? `いまの癖は「${bits.join("・")}」。マスの十字と、七〜八割の大きさから戻しましょう。`
    : "骨格は悪くありません。とめ・はね・はらいの終わり方を丁寧にすると、一段きれいになります。";

  return { size, tilt, center, note };
}
