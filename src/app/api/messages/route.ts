import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { conversation_id, content, role = 'user', user_id } = body;

  if (!content?.trim()) {
    return NextResponse.json({ error: 'content is required' }, { status: 400 });
  }

  let convId = conversation_id;

  if (!convId) {
    const title = content.slice(0, 80) + (content.length > 80 ? '...' : '');
    const { data: conv, error: convErr } = await supabaseAdmin
      .from('lag8_conversations')
      .insert({ title, user_id: user_id || null })
      .select('id')
      .single();

    if (convErr) {
      return NextResponse.json({ error: convErr.message }, { status: 500 });
    }
    convId = conv.id;
  }

  const { data: message, error: msgErr } = await supabaseAdmin
    .from('lag8_messages')
    .insert({ conversation_id: convId, role, content: content.trim() })
    .select()
    .single();

  if (msgErr) {
    return NextResponse.json({ error: msgErr.message }, { status: 500 });
  }

  return NextResponse.json({ conversation_id: convId, message });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get('conversation_id');

  if (!conversationId) {
    const { data, error } = await supabaseAdmin
      .from('lag8_conversations')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ conversations: data });
  }

  const { data, error } = await supabaseAdmin
    .from('lag8_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ messages: data });
}
