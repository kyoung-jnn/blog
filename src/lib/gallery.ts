import { unstable_cache } from 'next/cache';

import { list } from '@vercel/blob';
import { getPlaiceholder } from 'plaiceholder';

export type GalleryItem =
  | {
      type: 'image';
      src: string;
      alt: string;
      blurDataURL?: string;
      width?: number;
      height?: number;
    }
  | {
      type: 'video';
      src: string;
      alt: string;
    };

const GALLERY_CACHE_KEY = 'gallery';
const GALLERY_PREFIX = 'gallery/';
const VIDEO_EXT = /\.(mp4|webm|mov)$/i;

const filenameToAlt = (filename: string) =>
  filename
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .trim();

interface ImageMeta {
  blurDataURL?: string;
  width?: number;
  height?: number;
}

const generateImageMeta = async (url: string): Promise<ImageMeta> => {
  try {
    const res = await fetch(url);
    const buffer = Buffer.from(await res.arrayBuffer());
    const {
      base64,
      metadata: { width, height },
    } = await getPlaiceholder(buffer, { size: 10 });
    return { blurDataURL: base64, width, height };
  } catch (err) {
    console.warn(`[gallery] image meta generation failed for ${url}:`, err);
    return {};
  }
};

const fetchGallery = async (): Promise<GalleryItem[]> => {
  const { blobs } = await list({ prefix: GALLERY_PREFIX });
  const filtered = blobs
    .filter((b) => b.pathname.length > GALLERY_PREFIX.length && b.size > 0)
    .sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt));

  return Promise.all(
    filtered.map(async (b): Promise<GalleryItem> => {
      const filename = b.pathname.replace(GALLERY_PREFIX, '');
      const isVideo = VIDEO_EXT.test(filename);
      const alt = filenameToAlt(filename);

      if (isVideo) {
        return { type: 'video', src: b.url, alt };
      }

      const meta = await generateImageMeta(b.url);
      return { type: 'image', src: b.url, alt, ...meta };
    }),
  );
};

// Cached fetch — invalidate via revalidatePath('/gallery'). 24h ISR fallback.
export const getGalleryItems = unstable_cache(fetchGallery, [GALLERY_CACHE_KEY], {
  revalidate: 60 * 60 * 24,
});
