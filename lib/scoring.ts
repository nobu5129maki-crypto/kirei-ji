import type { PracticeChar, StrokeFocus } from "./characters";

export type ScoreBreakdown = {
  overall: number;
  size: number;
  tilt: number;
  center: number;
  shape: number;
  comments: string[];
  praise: string;
  empty: boolean;
};

const SIZE = 160;

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

function principalAngle(mask: Mask): number {
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
  return 0.5 * Math.atan2(2 * sxy, sxx - syy);
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
  ctx.font = `700 ${Math.round(SIZE * 0.72)}px ${fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(char, SIZE / 2, SIZE / 2 + SIZE * 0.02);
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
    comments.push("マスの七〜八割を目安に、もう一回り大きく。");
  } else if (size < 78 && fill < 0.28) {
    comments.push("字が小さめです。余白を恐れず、枠の内側いっぱいに。");
  } else if (size > 96) {
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
    await document.fonts.load(`700 ${Math.round(SIZE * 0.72)}px "Klee One"`);
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

  const userW = user.maxX - user.minX + 1;
  const userH = user.maxY - user.minY + 1;
  const modelW = model.maxX - model.minX + 1;
  const modelH = model.maxY - model.minY + 1;
  const userFill = (userW * userH) / (SIZE * SIZE);
  const modelFill = (modelW * modelH) / (SIZE * SIZE);
  const fillRatio = userFill / Math.max(0.15, modelFill);
  const sizeScore = clampScore(100 - Math.abs(fillRatio - 1) * 140);

  const angleDiff = Math.abs(principalAngle(user) - principalAngle(model));
  const tiltScore = clampScore(100 - (angleDiff * 180) / Math.PI * 4.2);

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
