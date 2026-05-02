import { Metadata } from 'next';

import GalleryPhoto from '@/app/gallery/components/GalleryPhoto';
import GalleryVideo from '@/app/gallery/components/GalleryVideo';
import { METADATA_CONFIG, OPEN_GRAPH_CONFIG, SITE_CONFIG } from '@/config';
import { getGalleryItems } from '@/lib/gallery';

export const metadata: Metadata = {
  ...METADATA_CONFIG,
  title: 'Gallery',
  alternates: { canonical: '/gallery' },
  openGraph: OPEN_GRAPH_CONFIG,
};

const safeJsonLd = (obj: unknown): string =>
  JSON.stringify(obj).replace(/<\/script>/gi, '<\\/script>');

async function GalleryPage() {
  const items = await getGalleryItems();
  const images = items.filter((i) => i.type === 'image');

  const galleryJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    name: `Gallery | ${SITE_CONFIG.title}`,
    url: SITE_CONFIG.siteUrl ? `${SITE_CONFIG.siteUrl}/gallery` : undefined,
    image: images.map((img) => ({
      '@type': 'ImageObject',
      contentUrl: img.src,
      name: img.alt,
      ...(img.width && { width: img.width }),
      ...(img.height && { height: img.height }),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(galleryJsonLd) }}
      />
      {items.map((item) => {
        if (item.type === 'image') {
          return (
            <GalleryPhoto
              key={item.src}
              src={item.src}
              alt={item.alt}
              blurDataURL={item.blurDataURL}
              width={item.width}
              height={item.height}
            />
          );
        }
        return <GalleryVideo key={item.src} src={item.src} alt={item.alt} />;
      })}
    </>
  );
}

export default GalleryPage;
