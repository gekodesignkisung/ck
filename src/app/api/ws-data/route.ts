import { put, head } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

function blobPath(id: string) {
  return `ws/${id}.json`;
}

export async function GET(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json(null);
  try {
    const blob = await head(blobPath(id));
    const res = await fetch(blob.url, { cache: 'no-store' });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(null);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, data } = await req.json() as { id: string; data: unknown };
    if (!id) return NextResponse.json({ ok: false });
    await put(blobPath(id), JSON.stringify(data), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
