-- Stylist conversation history
CREATE TABLE IF NOT EXISTS stylist_conversations (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL DEFAULT 'New conversation',
  messages    JSONB       NOT NULL DEFAULT '[]',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE stylist_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own stylist conversations"
  ON stylist_conversations FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS stylist_conversations_user_updated
  ON stylist_conversations (user_id, updated_at DESC);
