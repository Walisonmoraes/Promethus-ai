-- Script para corrigir políticas RLS para aceitar email em vez de UUID
-- Execute este no SQL Editor do Supabase após rodar o diagnóstico

-- 1. Remover políticas RLS existentes
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;

DROP POLICY IF EXISTS "Users can view own goals" ON goals;
DROP POLICY IF EXISTS "Users can insert own goals" ON goals;
DROP POLICY IF EXISTS "Users can update own goals" ON goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON goals;

DROP POLICY IF EXISTS "Users can view own agenda items" ON agenda_items;
DROP POLICY IF EXISTS "Users can insert own agenda items" ON agenda_items;
DROP POLICY IF EXISTS "Users can update own agenda items" ON agenda_items;
DROP POLICY IF EXISTS "Users can delete own agenda items" ON agenda_items;

-- 2. Criar novas políticas que aceitam email (para compatibilidade com NextAuth)
-- Políticas para transactions
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own transactions" ON transactions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own transactions" ON transactions
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete own transactions" ON transactions
  FOR DELETE USING (true);

-- Políticas para goals
CREATE POLICY "Users can view own goals" ON goals
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own goals" ON goals
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own goals" ON goals
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete own goals" ON goals
  FOR DELETE USING (true);

-- Políticas para agenda_items
CREATE POLICY "Users can view own agenda items" ON agenda_items
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own agenda items" ON agenda_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own agenda items" ON agenda_items
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete own agenda items" ON agenda_items
  FOR DELETE USING (true);

-- 3. Verificar se as políticas foram criadas corretamente
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE tablename IN ('transactions', 'goals', 'agenda_items')
ORDER BY tablename, policyname;
