import { supabase, Operador } from './supabase'

// Password partilhada por todos os operadores
const SHARED_PASSWORD = process.env.NEXT_PUBLIC_APP_PASSWORD || ''

export async function validateCredentials(
  username: string,
  password: string
): Promise<Operador | null> {
  // Verificar password partilhada primeiro
  if (password !== SHARED_PASSWORD) {
    return null
  }

  // Buscar operador pelo username
  const { data: operador } = await supabase
    .from('operadores')
    .select('*')
    .eq('username', username.toLowerCase().trim())
    .single()

  return operador
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('authenticated') === 'true'
}

export function getCurrentOperador(): Operador | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem('operador')
  return stored ? JSON.parse(stored) : null
}

export function login(operador: Operador): void {
  localStorage.setItem('authenticated', 'true')
  localStorage.setItem('operador', JSON.stringify(operador))
}

export function logout(): void {
  localStorage.removeItem('authenticated')
  localStorage.removeItem('operador')
}
