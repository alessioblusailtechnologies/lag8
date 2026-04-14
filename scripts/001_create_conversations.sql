-- ============================================
-- lag8: Tabelle conversazioni e messaggi
-- Prefisso: lag8_
-- ============================================

CREATE TABLE IF NOT EXISTS lag8_conversations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text,
  user_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lag8_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES lag8_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lag8_messages_conversation
  ON lag8_messages (conversation_id, created_at);

CREATE INDEX IF NOT EXISTS idx_lag8_conversations_user
  ON lag8_conversations (user_id, updated_at DESC);

-- Auto-update updated_at quando viene inserito un nuovo messaggio
CREATE OR REPLACE FUNCTION lag8_update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE lag8_conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lag8_update_conv_ts ON lag8_messages;

CREATE TRIGGER trg_lag8_update_conv_ts
  AFTER INSERT ON lag8_messages
  FOR EACH ROW
  EXECUTE FUNCTION lag8_update_conversation_timestamp();
