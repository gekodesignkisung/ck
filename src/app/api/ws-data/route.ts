import { put, list } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json(null);
  try {
    const { blobs } = await list({ prefix: `ws/${id}.json`, limit: 1 });
    if (blobs.length === 0) return NextResponse.json(null);
    const res = await fetch(blobs[0].url, { cache: 'no-store' });
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
    await put(`ws/${id}.json`, JSON.stringify(data), {
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
