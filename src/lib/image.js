import { supabase } from '../supabase.js';

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Returns true if the image has a meaningfully transparent background already removed —
// requires >5% of pixels at alpha < 128 to avoid false-positives from edge anti-aliasing
// or device-frame corner artifacts on screenshots saved as PNG.
async function hasTransparency(file) {
  if (!file.type.includes('png') && !file.type.includes('webp')) return false;
  return new Promise(resolve => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, 200 / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(img.naturalWidth  * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const total = data.length / 4;
      let transparent = 0;
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 128) transparent++;
      }
      resolve(transparent / total > 0.05);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(false); };
    img.src = url;
  });
}

async function convertToPng(file) {
  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d').drawImage(img, 0, 0);
      canvas.toBlob(blob => {
        resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.png'), { type: 'image/png' }));
      }, 'image/png');
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

export const MAX_IMAGE_PX = 600;
async function resizeImage(file) {
  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const longest = Math.max(img.naturalWidth, img.naturalHeight);
      if (longest <= MAX_IMAGE_PX) { resolve(file); return; }
      const scale = MAX_IMAGE_PX / longest;
      const w = Math.round(img.naturalWidth  * scale);
      const h = Math.round(img.naturalHeight * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      canvas.toBlob(blob => {
        resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.png'), { type: 'image/png' }));
      }, 'image/png');
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

export async function trimTransparentPixels(file) {
  return new Promise(resolve => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { naturalWidth: w, naturalHeight: h } = img;
      const src = document.createElement('canvas');
      src.width = w; src.height = h;
      const ctx = src.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      const { data } = ctx.getImageData(0, 0, w, h);
      // Sum alpha per column and per row; a column/row only counts as content
      // if its total alpha exceeds a meaningful threshold. This ignores isolated
      // ghost pixels (alpha 5–30) left by background-removal models while still
      // capturing genuine semi-transparent clothing edges.
      const COL_THRESHOLD = Math.max(255, h * 0.5);   // at least ~half a fully-opaque pixel per col
      const ROW_THRESHOLD = Math.max(255, w * 0.5);
      const colSum = new Float32Array(w);
      const rowSum = new Float32Array(h);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const a = data[(y * w + x) * 4 + 3];
          colSum[x] += a;
          rowSum[y] += a;
        }
      }
      let x0 = w, y0 = h, x1 = -1, y1 = -1;
      for (let x = 0; x < w; x++) { if (colSum[x] >= COL_THRESHOLD) { if (x < x0) x0 = x; if (x > x1) x1 = x; } }
      for (let y = 0; y < h; y++) { if (rowSum[y] >= ROW_THRESHOLD) { if (y < y0) y0 = y; if (y > y1) y1 = y; } }
      // No visible content — return original unchanged
      if (x1 < 0) { resolve(file); return; }
      const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
      // Add symmetric padding so the subject has breathing room and any minor
      // asymmetry from the bg-removal model is absorbed. Place the trimmed
      // content on a new canvas rather than cropping directly to the bounding box.
      const PAD = Math.max(8, Math.round(Math.min(cw, ch) * 0.04));
      const dst = document.createElement('canvas');
      dst.width = cw + PAD * 2; dst.height = ch + PAD * 2;
      dst.getContext('2d').drawImage(src, x0, y0, cw, ch, PAD, PAD, cw, ch);
      dst.toBlob(blob => {
        resolve(new File([blob], file.name || 'trimmed.png', { type: 'image/png' }));
      }, 'image/png');
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

export async function enrichItem({ imageUrl, imageFile, name, brand, category, material, color }) {
  const body = imageFile
    ? { imageBase64: await fileToBase64(imageFile), mediaType: imageFile.type, name, brand, category, material, color }
    : { imageUrl, name, brand, category, material, color };

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const res = await fetch('/api/enrich-item', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Enrichment failed');
  return res.json();
}

export const MAX_WORKER_PX = 1024;
async function resizeForWorker(file) {
  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const longest = Math.max(img.naturalWidth, img.naturalHeight);
      if (longest <= MAX_WORKER_PX) { resolve(file); return; }
      const scale = MAX_WORKER_PX / longest;
      const w = Math.round(img.naturalWidth  * scale);
      const h = Math.round(img.naturalHeight * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      canvas.toBlob(blob => {
        resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.png'), { type: 'image/png' }));
      }, 'image/png');
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

// Resolves with { processedFile, bgRemoved } — bgRemoved=false means worker failed,
// processedFile is still a usable (but un-cropped) image.
export function startBgRemoval(file) {
  return (async () => {
    if (await hasTransparency(file)) {
      return { processedFile: await trimTransparentPixels(await resizeImage(file)), bgRemoved: true };
    }
    const workerInput = await resizeForWorker(file);
    const buffer = await workerInput.arrayBuffer();
    try {
      const resultBlob = await new Promise((resolve, reject) => {
        const worker = new Worker(
          new URL('../bgRemovalWorker.js', import.meta.url),
          { type: 'module' },
        );
        worker.onmessage = ({ data }) => {
          worker.terminate();
          if (data.ok) resolve(new Blob([data.buffer], { type: 'image/png' }));
          else reject(new Error(data.message));
        };
        worker.onerror = (err) => { worker.terminate(); reject(err); };
        worker.postMessage({ buffer, name: workerInput.name, type: workerInput.type }, [buffer]);
      });
      const processedFile = new File([resultBlob], workerInput.name.replace(/\.[^.]+$/, '.png'), { type: 'image/png' });
      return { processedFile: await trimTransparentPixels(await resizeImage(processedFile)), bgRemoved: true };
    } catch (err) {
      console.error('[bg-removal] worker failed:', err?.message ?? err);
      const converted = await convertToPng(file);
      return { processedFile: await trimTransparentPixels(await resizeImage(converted)), bgRemoved: false };
    }
  })();
}
