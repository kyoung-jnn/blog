import { ReactNode } from 'react';

import ImageViewer from '@/components/ImageViewer';

function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <section className="gallery-grid grid grid-cols-[repeat(auto-fit,minmax(350px,1fr))] gap-x-1.5 gap-y-3 p-2">
        {children}
      </section>
      <ImageViewer gallery=".gallery-grid" />
    </>
  );
}

export default Layout;
