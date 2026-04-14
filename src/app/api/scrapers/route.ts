import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('lag8_scrapers')
    .select('*, lag8_scraper_runs(id, stato, started_at, lead_trovati)')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ scrapers: data || [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.nome || !body.tipo) {
    return NextResponse.json({ error: 'nome and tipo are required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('lag8_scrapers')
    .insert({
      nome: body.nome,
      tipo: body.tipo,
      descrizione: body.descrizione || null,
      config: body.config || {},
      attivo: body.attivo ?? true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ scraper: data });
}
