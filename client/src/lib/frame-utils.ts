import { DEFAULT_FRAME_SIZE, JPEG_QUALITY, FRAME_DIFF_THRESHOLD } from 'shared';

/**
 * Resize and compress a video frame to a JPEG blob.
 * Draws the video element onto an offscreen canvas at the target size
 * and exports as JPEG at configured quality.
 */
export async function captureFrame(
  video: HTMLVideoElement,
  maxSize: number = DEFAULT_FRAME_SIZE,
  quality: number = JPEG_QUALITY,
): Promise<{ blob: Blob; width: number; height: number }> {
  const { videoWidth, videoHeight } = video;
  if (videoWidth === 0 || videoHeight === 0) {
    throw new Error('Video has no dimensions — camera may not be ready');
  }

  // Compute target size maintaining aspect ratio
  const scale = Math.min(1, maxSize / Math.max(videoWidth, videoHeight));
  const width = Math.round(videoWidth * scale);
  const height = Math.round(videoHeight * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2d context');

  // Mirror if front-facing camera (handled by CSS, not here)
  ctx.drawImage(video, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error('Canvas toBlob returned null'));
        resolve({ blob, width, height });
      },
      'image/jpeg',
      quality,
    );
  });
}

/**
 * Convert a JPEG blob to a base64-encoded data URI string and plain base64 string.
 */
export function blobToBase64(blob: Blob): Promise<{ dataUri: string; data: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUri = reader.result as string;
      // Strip the "data:image/jpeg;base64," prefix
      const data = dataUri.split(',')[1] || dataUri;
      resolve({ dataUri, data });
    };
    reader.onerror = () => reject(new Error('Failed to read blob'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Compute a simple hash of a base64 string for frame deduplication.
 * Uses a fast non-cryptographic 32-bit hash (djb2 variant).
 * This is NOT for security — only for cache key comparison.
 */
export function hashBase64(data: string): string {
  let hash = 5381;
  // Sample every 4th character for speed
  for (let i = 0; i < data.length; i += 4) {
    hash = ((hash << 5) + hash) ^ data.charCodeAt(i);
    hash = hash >>> 0; // Force unsigned 32-bit
  }
  return hash.toString(16).padStart(8, '0');
}

/**
 * Compute pixel difference between two frames as a percentage (0-100).
 * Works on raw ImageData or by drawing to canvas.
 * Returns a score where 0 = identical, 100 = completely different.
 */
export function computeFrameDiff(
  prevFrame: ImageData,
  currFrame: ImageData,
): number {
  if (prevFrame.width !== currFrame.width || prevFrame.height !== currFrame.height) {
    return 100; // Different sizes = completely different
  }

  const prevData = prevFrame.data;
  const currData = currFrame.data;
  const totalPixels = prevFrame.width * prevFrame.height;
  let diffPixels = 0;

  // Sample every 4th pixel for speed (grayscale approximation)
  for (let i = 0; i < prevData.length; i += 16) {
    const prevGray = (prevData[i] + prevData[i + 1] + prevData[i + 2]) / 3;
    const currGray = (currData[i] + currData[i + 1] + currData[i + 2]) / 3;
    if (Math.abs(prevGray - currGray) > 15) {
      diffPixels++;
    }
  }

  const sampledPixels = Math.ceil(totalPixels / 4);
  return Math.round((diffPixels / sampledPixels) * 100);
}

/**
 * Check if two frames are significantly different enough to send.
 * Returns true if the frame should be sent (changed enough).
 */
export function shouldSendFrame(diffScore: number, threshold: number = FRAME_DIFF_THRESHOLD): boolean {
  return diffScore >= threshold;
}

/**
 * Resize a video element onto a tiny canvas for fast diff computation.
 * Returns ImageData at 64x64 for pixel comparison.
 */
export function getThumbnailImageData(video: HTMLVideoElement): ImageData {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2d context');

  ctx.drawImage(video, 0, 0, size, size);
  return ctx.getImageData(0, 0, size, size);
}
