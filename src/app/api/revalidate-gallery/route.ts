import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

const GALLERY_PATH = '/gallery';

const handle = (req: NextRequest) => {
  const secret = req.nextUrl.searchParams.get('secret');
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  revalidatePath(GALLERY_PATH);
  return NextResponse.json({ revalidated: true, path: GALLERY_PATH });
};

export const POST = handle;
