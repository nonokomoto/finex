// Credenciais de acesso
// Password muda anualmente: admin_2026, admin_2027, etc.
const CREDENTIALS = {
  username: 'admin',
  getPassword: () => `admin_${new Date().getFullYear()}`
}

export function validateCredentials(username: string, password: string): boolean {
  return username === CREDENTIALS.username && password === CREDENTIALS.getPassword()
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('authenticated') === 'true'
}

export function login(): void {
  localStorage.setItem('authenticated', 'true')
}

export function logout(): void {
  localStorage.removeItem('authenticated')
}
