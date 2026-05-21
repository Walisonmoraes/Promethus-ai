-- Criar tabelas para o Prometheus AI no Supabase

-- Tabela de transações financeiras
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  kind VARCHAR(10) NOT NULL CHECK (kind IN ('expense', 'income')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de metas financeiras
CREATE TABLE IF NOT EXISTS goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  title VARCHAR(200) NOT NULL,
  category VARCHAR(100) NOT NULL,
  target DECIMAL(10,2) NOT NULL,
  progress DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de agenda financeira
CREATE TABLE IF NOT EXISTS agenda_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  title VARCHAR(200) NOT NULL,
  due DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de mapeamento WhatsApp -> usuário
CREATE TABLE IF NOT EXISTS whatsapp_user_mappings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_kind ON transactions(kind);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);

CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_category ON goals(category);

CREATE INDEX IF NOT EXISTS idx_agenda_items_user_id ON agenda_items(user_id);
CREATE INDEX IF NOT EXISTS idx_agenda_items_due ON agenda_items(due);
CREATE INDEX IF NOT EXISTS idx_whatsapp_mappings_user_id ON whatsapp_user_mappings(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_mappings_phone ON whatsapp_user_mappings(phone);

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger às tabelas
CREATE TRIGGER update_transactions_updated_at 
  BEFORE UPDATE ON transactions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at 
  BEFORE UPDATE ON goals 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agenda_items_updated_at 
  BEFORE UPDATE ON agenda_items 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_user_mappings_updated_at
  BEFORE UPDATE ON whatsapp_user_mappings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security (RLS)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_user_mappings ENABLE ROW LEVEL SECURITY;

-- Criar políticas de segurança (permitir acesso apenas ao próprio usuário)
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own transactions" ON transactions
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own transactions" ON transactions
  FOR DELETE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view own goals" ON goals
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own goals" ON goals
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own goals" ON goals
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own goals" ON goals
  FOR DELETE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view own agenda items" ON agenda_items
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own agenda items" ON agenda_items
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own agenda items" ON agenda_items
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own agenda items" ON agenda_items
  FOR DELETE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view own whatsapp mappings" ON whatsapp_user_mappings
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own whatsapp mappings" ON whatsapp_user_mappings
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own whatsapp mappings" ON whatsapp_user_mappings
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own whatsapp mappings" ON whatsapp_user_mappings
  FOR DELETE USING (auth.uid()::text = user_id);
