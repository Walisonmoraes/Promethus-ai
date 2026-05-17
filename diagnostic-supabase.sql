-- Script de diagnóstico para o Prometheus AI
-- Execute este no SQL Editor do Supabase

-- 1. Verificar se as tabelas existem
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('transactions', 'goals', 'agenda_items')
ORDER BY table_name, ordinal_position;

-- 2. Verificar políticas RLS atuais
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('transactions', 'goals', 'agenda_items');

-- 3. Verificar dados existentes e formato de user_id
SELECT 
  'transactions' as table_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT user_id) as unique_users,
  array_agg(DISTINCT user_id) as user_ids
FROM transactions

UNION ALL

SELECT 
  'goals' as table_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT user_id) as unique_users,
  array_agg(DISTINCT user_id) as user_ids
FROM goals

UNION ALL

SELECT 
  'agenda_items' as table_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT user_id) as unique_users,
  array_agg(DISTINCT user_id) as user_ids
FROM agenda_items;

-- 4. Verificar amostra de dados com user_id
SELECT 'transactions' as source, id, user_id, amount, category, kind, created_at
FROM transactions
LIMIT 5;

SELECT 'goals' as source, id, user_id, title, category, target, created_at
FROM goals
LIMIT 5;

SELECT 'agenda_items' as source, id, user_id, title, due, amount, created_at
FROM agenda_items
LIMIT 5;

-- 5. Verificar se RLS está habilitado
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('transactions', 'goals', 'agenda_items');

-- 6. Verificar usuários no auth.users (se estiver usando Supabase Auth)
SELECT id, email, created_at, last_sign_in_at
FROM auth.users
LIMIT 10;
