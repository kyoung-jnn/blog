import Image from 'next/image';

import GalleryCaption from '@/app/gallery/components/GalleryCaption';

interface Props {
  src: string;
  alt: string;
  blurDataURL?: string;
  width?: number;
  height?: number;
}

// Fallback when plaiceholder failed: 1x1 neutral grey
const FALLBACK_BLUR =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxIDEiPjxyZWN0IGZpbGw9IiNlNGU0ZTciIHdpZHRoPSIxIiBoZWlnaHQ9IjEiLz48L3N2Zz4=';

function GalleryPhoto({ src, alt, blurDataURL, width, height }: Props) {
  return (
    <figure className="all-unset">
      <article className="bg-gray-4 dark:bg-gray-5 relative h-[600px] w-full cursor-zoom-in overflow-hidden rounded">
        <Image
          src={src}
          fill
          alt={alt}
          style={{ objectFit: 'cover' }}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          placeholder="blur"
          blurDataURL={blurDataURL ?? FALLBACK_BLUR}
          data-pswp-src={src}
          data-pswp-width={width}
          data-pswp-height={height}
        />
      </article>
      <GalleryCaption>{alt}</GalleryCaption>
    </figure>
  );
}

export default GalleryPhoto;
