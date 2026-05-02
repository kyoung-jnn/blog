import { Metadata } from 'next';

import GalleryPhoto from '@/app/gallery/components/GalleryPhoto';
import GalleryVideo from '@/app/gallery/components/GalleryVideo';
import { getGalleryItems } from '@/lib/gallery';
import { METADATA_CONFIG, OPEN_GRAPH_CONFIG } from '@/config';

export const metadata: Metadata = {
  ...METADATA_CONFIG,
  title: 'Gallery',
  alternates: { canonical: '/gallery' },
  openGraph: OPEN_GRAPH_CONFIG,
};

async function GalleryPage() {
  const items = await getGalleryItems();

  return (
    <>
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
