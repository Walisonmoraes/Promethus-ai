CREATE TABLE IF NOT EXISTS sefaz_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  cpf_last4 TEXT,
  storage_state_encrypted TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_validated_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'connected' CHECK (status IN ('connected', 'invalid'))
);

CREATE INDEX IF NOT EXISTS idx_sefaz_connections_user_id ON sefaz_connections(user_id);

CREATE TRIGGER update_sefaz_connections_updated_at 
  BEFORE UPDATE ON sefaz_connections 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE sefaz_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sefaz_connections" ON sefaz_connections
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own sefaz_connections" ON sefaz_connections
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own sefaz_connections" ON sefaz_connections
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own sefaz_connections" ON sefaz_connections
  FOR DELETE USING (auth.uid()::text = user_id);
