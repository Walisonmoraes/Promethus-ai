import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Cliente com service role key para bypass RLS no servidor
export const supabaseAdmin = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

// Tipos para as tabelas do Supabase
export interface Database {
  public: {
    Tables: {
      transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          category: string
          description: string
          kind: 'expense' | 'income'
          date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          category: string
          description: string
          kind: 'expense' | 'income'
          date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          category?: string
          description?: string
          kind?: 'expense' | 'income'
          date?: string
          updated_at?: string
        }
      }
      goals: {
        Row: {
          id: string
          user_id: string
          title: string
          category: string
          target: number
          progress: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          category: string
          target: number
          progress?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          category?: string
          target?: number
          progress?: number
          updated_at?: string
        }
      }
      agenda_items: {
        Row: {
          id: string
          user_id: string
          title: string
          due: string
          amount: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          due: string
          amount: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          due?: string
          amount?: number
          updated_at?: string
        }
      }
      sefaz_connections: {
        Row: {
          id: string
          user_id: string
          cpf_last4: string | null
          storage_state_encrypted: string
          created_at: string
          updated_at: string
          last_validated_at: string | null
          status: 'connected' | 'invalid'
        }
        Insert: {
          id?: string
          user_id: string
          cpf_last4?: string | null
          storage_state_encrypted: string
          created_at?: string
          updated_at?: string
          last_validated_at?: string | null
          status?: 'connected' | 'invalid'
        }
        Update: {
          id?: string
          user_id?: string
          cpf_last4?: string | null
          storage_state_encrypted?: string
          updated_at?: string
          last_validated_at?: string | null
          status?: 'connected' | 'invalid'
        }
      }
      whatsapp_user_mappings: {
        Row: {
          id: string
          user_id: string
          phone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          phone: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          phone?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export type Transaction = Database['public']['Tables']['transactions']['Row']
export type Goal = Database['public']['Tables']['goals']['Row']
export type AgendaItem = Database['public']['Tables']['agenda_items']['Row']
