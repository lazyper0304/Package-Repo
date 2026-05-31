export interface Watermark {
  id: string;
  name: string;
}

export interface Position {
  value: string;
  label: string;
}

export type PositionValue = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';

export interface OptionsChange {
  position?: PositionValue;
  opacity?: number;
  size?: number;
  overlayOpacity?: number;
  tiled?: boolean;
}

export const watermarks: Watermark[] = [
  { id: 'buganle', name: '不干了' },
  { id: 'buxuele', name: '不学了' },
  { id: 'chiwanle', name: '吃完了' },
  { id: 'jinzhanshi', name: '仅展示' },
  { id: 'maidiaole', name: '卖掉了' },
  { id: 'peiqianhuo', name: '赔钱货' },
  { id: 'qiangfengle', name: '抢疯了' },
  { id: 'qiuzhizhong', name: '求职中' },
  { id: 'shoudaole', name: '收到了' },
  { id: 'shuizhaole', name: '睡着了' },
  { id: 'tuofenle', name: '脱粉了' },
  { id: 'xiangshougou', name: '想收购' },
];

export const positions: Position[] = [
  { value: 'top-right', label: '右上角' },
  { value: 'top-left', label: '左上角' },
  { value: 'bottom-right', label: '右下角' },
  { value: 'bottom-left', label: '左下角' },
  { value: 'center', label: '居中' },
];

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawGrayOverlay(ctx: CanvasRenderingContext2D, width: number, height: number, overlayOpacity: number): void {
  ctx.fillStyle = `rgba(128, 128, 128, ${overlayOpacity / 100})`;
  ctx.fillRect(0, 0, width, height);
}

function getPositionCoords(
  canvasW: number,
  canvasH: number,
  watermarkW: number,
  watermarkH: number,
  position: string,
  padding: number
): { x: number; y: number } {
  let x: number, y: number;
  switch (position) {
    case 'top-left':
      x = padding;
      y = padding;
      break;
    case 'top-right':
      x = canvasW - padding - watermarkW;
      y = padding;
      break;
    case 'bottom-left':
      x = padding;
      y = canvasH - padding - watermarkH;
      break;
    case 'bottom-right':
      x = canvasW - padding - watermarkW;
      y = canvasH - padding - watermarkH;
      break;
    case 'center':
    default:
      x = (canvasW - watermarkW) / 2;
      y = (canvasH - watermarkH) / 2;
      break;
  }
  return { x, y };
}

export async function drawWatermark(
  canvas: HTMLCanvasElement,
  image: string,
  watermarkId: string,
  position: string,
  opacity: number,
  sizePercent: number,
  overlayOpacity: number = 60
): Promise<void> {
  const [bgImg, wmImg] = await Promise.all([
    loadImage(image),
    loadImage(`${import.meta.env.BASE_URL}watermarks/${watermarkId}.png`),
  ]);

  canvas.width = bgImg.width;
  canvas.height = bgImg.height;
  const ctx = canvas.getContext('2d')!;

  // Draw background image
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bgImg, 0, 0);

  // Draw gray overlay
  drawGrayOverlay(ctx, canvas.width, canvas.height, overlayOpacity);

  // Calculate watermark size
  const baseSize = Math.max(canvas.width, canvas.height);
  const wmSize = baseSize * (sizePercent / 100);
  const scale = wmSize / Math.max(wmImg.width, wmImg.height);
  const wmW = wmImg.width * scale;
  const wmH = wmImg.height * scale;

  // Calculate position
  const padding = baseSize * 0.03;
  const { x, y } = getPositionCoords(canvas.width, canvas.height, wmW, wmH, position, padding);

  // Draw watermark with opacity
  ctx.save();
  ctx.globalAlpha = opacity / 100;
  ctx.drawImage(wmImg, x, y, wmW, wmH);
  ctx.restore();
}

export async function drawTiledWatermark(
  canvas: HTMLCanvasElement,
  image: string,
  watermarkId: string,
  _position: string,
  opacity: number,
  sizePercent: number,
  overlayOpacity: number = 60
): Promise<void> {
  const [bgImg, wmImg] = await Promise.all([
    loadImage(image),
    loadImage(`${import.meta.env.BASE_URL}watermarks/${watermarkId}.png`),
  ]);

  canvas.width = bgImg.width;
  canvas.height = bgImg.height;
  const ctx = canvas.getContext('2d')!;

  // Draw background image
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bgImg, 0, 0);

  // Draw gray overlay
  drawGrayOverlay(ctx, canvas.width, canvas.height, overlayOpacity);

  // Calculate watermark size
  const baseSize = Math.max(canvas.width, canvas.height);
  const wmSize = baseSize * (sizePercent / 100) * 0.6;
  const scale = wmSize / Math.max(wmImg.width, wmImg.height);
  const wmW = wmImg.width * scale;
  const wmH = wmImg.height * scale;

  // Tile the watermark
  const stepX = wmW * 1.5;
  const stepY = wmH * 1.5;
  const cols = Math.ceil(canvas.width / stepX) + 1;
  const rows = Math.ceil(canvas.height / stepY) + 1;

  ctx.save();
  ctx.globalAlpha = opacity / 100;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * stepX + (row % 2 === 0 ? 0 : stepX / 2) - stepX / 2;
      const y = row * stepY - stepY / 2;
      ctx.drawImage(wmImg, x, y, wmW, wmH);
    }
  }
  ctx.restore();
}
