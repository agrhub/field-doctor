import { assessQuality, toGrayscale, type QualityReport } from './quality';

export interface PreparedPhoto {
  /** JPEG resized to at most MAX_SIDE px — what is stored and sent to models. */
  blob: Blob;
  width: number;
  height: number;
  quality: QualityReport;
}

const MAX_SIDE = 1024;
const ANALYSIS_SIDE = 256;

function drawScaled(bitmap: ImageBitmap, maxSide: number): HTMLCanvasElement {
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function canvasToJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('JPEG encoding failed'))), 'image/jpeg', 0.85),
  );
}

/** Normalises any camera/gallery image and checks its quality, fully offline. */
export async function preparePhoto(file: Blob): Promise<PreparedPhoto> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  try {
    const full = drawScaled(bitmap, MAX_SIDE);
    const small = drawScaled(bitmap, ANALYSIS_SIDE);
    const pixels = small.getContext('2d')!.getImageData(0, 0, small.width, small.height).data;
    const quality = assessQuality(toGrayscale(pixels), small.width, small.height);
    return { blob: await canvasToJpeg(full), width: full.width, height: full.height, quality };
  } finally {
    bitmap.close();
  }
}

export async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  for (let i = 0; i < buffer.length; i += 0x8000) {
    binary += String.fromCharCode(...buffer.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}
