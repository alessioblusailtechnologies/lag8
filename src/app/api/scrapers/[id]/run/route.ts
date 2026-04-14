import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const { data, error } = await supabaseAdmin
    .from('lag8_scraper_runs')
    .insert({
      scraper_id: id,
      parametri: body.parametri || {},
      stato: 'in_coda',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ run: data });
}
