import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export type Salao = {
  id: string
  nome: string
  created_at: string
}

export type Categoria = {
  id: string
  nome: string
  tipo: 'receita' | 'gasto'
  created_at: string
}

export type Movimento = {
  id: string
  salao_id: string
  categoria_id: string | null
  tipo: 'receita' | 'gasto'
  valor: number
  descricao: string | null
  data: string
  created_at: string
  // Joined fields
  salao?: Salao
  categoria?: Categoria
}
