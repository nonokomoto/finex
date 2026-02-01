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

export type Operador = {
  id: string
  username: string
  nome: string
  cor: 'blue' | 'purple' | 'orange'
  created_at: string
}

export type Produto = {
  id: string
  nome: string
  codigo: string | null
  descricao: string | null
  preco_base: number
  categoria_id: string | null
  operador_id: string | null
  tipo: 'receita' | 'gasto'
  ativo: boolean
  created_at: string
  updated_at: string
  // Joined fields
  categoria?: Categoria
}

export type Movimento = {
  id: string
  salao_id?: string | null
  categoria_id: string | null
  operador_id?: string | null
  produto_id?: string | null
  tipo: 'receita' | 'gasto'
  valor: number
  descricao: string | null
  data: string
  created_at: string
  // Joined fields
  salao?: Salao
  categoria?: Categoria
  operador?: Operador
  produto?: Produto
}
