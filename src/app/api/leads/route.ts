import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  let query = supabaseAdmin
    .from('lag8_leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);
  if (search) {
    query = query.or(
      `nome.ilike.%${search}%,cognome.ilike.%${search}%,email.ilike.%${search}%,azienda.ilike.%${search}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ leads: data || [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.nome || !body.cognome) {
    return NextResponse.json({ error: 'nome and cognome are required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('lag8_leads')
    .insert({
      nome: body.nome,
      cognome: body.cognome,
      email: body.email || null,
      telefono: body.telefono || null,
      azienda: body.azienda || null,
      ruolo: body.ruolo || null,
      citta: body.citta || null,
      status: body.status || 'nuovo',
      fonte: body.fonte || 'manuale',
      valore_stimato: body.valore_stimato ?? null,
      note: body.note || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ lead: data });
}
