import { approximateLightBackground } from './gel/analysis.js';

self.onmessage = ({data}) => {
  try {
    const pixels = new Uint8ClampedArray(data.pixels);
    const corrected = approximateLightBackground(pixels, data.width, data.height, 50);
    self.postMessage({ id:data.id, pixels:corrected.buffer }, [corrected.buffer]);
  } catch (error) {
    self.postMessage({ id:data.id, error: String(error?.message || error) });
  }
};
