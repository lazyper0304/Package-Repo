import { ColorImageConverter } from 'vtracer';

export type VectorizeConfig = {
  mode: string;
  clusteringMode: string;
  hierarchical: string;
  cornerThreshold: number;
  lengthThreshold: number;
  maxIterations: number;
  spliceThreshold: number;
  filterSpeckle: number;
  colorPrecision: number;
  layerDifference: number;
  pathPrecision: number;
};

export type VectorizeResult = {
  svgContent: string;
  svgUrl: string;
  originalUrl: string;
};

function deg2rad(deg: number): number {
  return (deg / 180) * Math.PI;
}

export async function vectorizeImage(
  file: File,
  config: VectorizeConfig,
  onProgress: (progress: number) => void,
): Promise<VectorizeResult> {
  const canvas = document.createElement('canvas');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

  canvas.id = `canvas-${Date.now()}`;
  svg.id = `svg-${Date.now()}`;
  canvas.style.display = 'none';

  document.body.appendChild(canvas);
  document.body.appendChild(svg);

  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    await new Promise<void>((resolve, reject) => {
      img.onload = () => {
        const width = img.naturalWidth;
        const height = img.naturalHeight;

        canvas.width = width;
        canvas.height = height;
        svg.setAttribute('width', width.toString());
        svg.setAttribute('height', height.toString());
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0);
        }

        resolve();
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });

    const converterParams = JSON.stringify({
      canvas_id: canvas.id,
      svg_id: svg.id,
      mode: config.mode,
      clustering_mode: config.clusteringMode,
      hierarchical: config.hierarchical,
      corner_threshold: deg2rad(config.cornerThreshold),
      length_threshold: config.lengthThreshold,
      max_iterations: config.maxIterations,
      splice_threshold: deg2rad(config.spliceThreshold),
      filter_speckle: config.filterSpeckle * config.filterSpeckle,
      color_precision: 8 - config.colorPrecision,
      layer_difference: config.layerDifference,
      path_precision: config.pathPrecision,
    });

    const converter = ColorImageConverter.new_with_string(converterParams);
    converter.init();

    let done = false;
    while (!done) {
      done = converter.tick();
      onProgress(converter.progress());
    }

    const svgContent = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const originalUrl = URL.createObjectURL(file);

    converter.free();

    return { svgContent, svgUrl, originalUrl };
  } finally {
    document.body.removeChild(canvas);
    document.body.removeChild(svg);
  }
}

export function downloadSvg(svgContent: string, fileName: string) {
  const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
  const svgUrl = URL.createObjectURL(svgBlob);
  const a = document.createElement('a');
  a.href = svgUrl;
  a.download = fileName.replace(/\.[^.]+$/, '.svg');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(svgUrl);
}

export const DEFAULT_CONFIG: VectorizeConfig = {
  mode: 'none',
  clusteringMode: 'color',
  hierarchical: 'stacked',
  cornerThreshold: 180,
  lengthThreshold: 10,
  maxIterations: 20,
  spliceThreshold: 45,
  filterSpeckle: 0,
  colorPrecision: 4,
  layerDifference: 16,
  pathPrecision: 8,
};

export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.bmp', '.png', '.webp'];
