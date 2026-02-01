'use client'

import { useState, useEffect } from 'react'
import { validateCredentials, login } from '@/lib/auth'
import { supabase, Operador } from '@/lib/supabase'
import { Locale, translations } from '@/lib/i18n'
import { LanguageSelector } from '@/components/language-selector'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface LoginFormProps {
  locale: Locale
  onLocaleChange: (locale: Locale) => void
  onSuccess: () => void
}

const RING_COLORS: Record<string, string> = {
  blue: '#3b82f6',
  purple: '#8b5cf6',
  orange: '#f97316',
}

const DOT_COLORS: Record<string, string> = {
  blue: '#3b82f6',
  purple: '#8b5cf6',
  orange: '#f97316',
}

export function LoginForm({ locale, onLocaleChange, onSuccess }: LoginFormProps) {
  const [operadores, setOperadores] = useState<Operador[]>([])
  const [selectedOperadorId, setSelectedOperadorId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const t = translations[locale]

  useEffect(() => {
    async function fetchOperadores() {
      const { data } = await supabase
        .from('operadores')
        .select('*')
        .order('nome')
      setOperadores(data || [])
      setIsLoading(false)
    }
    fetchOperadores()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const operador = operadores.find(o => o.id === selectedOperadorId)
    if (!operador) {
      setError(t.selecionarOperador)
      return
    }

    const validatedOperador = await validateCredentials(operador.username, password)
    if (validatedOperador) {
      login(validatedOperador)
      onSuccess()
    } else {
      setError(t.credenciaisInvalidas)
    }
  }

  const selectedOperador = operadores.find(o => o.id === selectedOperadorId)
  const ringColor = selectedOperador ? RING_COLORS[selectedOperador.cor] : undefined

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card
        className="w-full max-w-sm transition-all duration-300"
        style={ringColor ? { boxShadow: `0 0 0 2px ${ringColor}` } : undefined}
      >
        <CardHeader className="text-center">
          <div className="absolute top-4 right-4">
            <LanguageSelector locale={locale} onChange={onLocaleChange} />
          </div>
          <div className="mx-auto mb-2">
            <svg width="48" height="48" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="0" y="0" width="32" height="32" rx="8" fill="#6366f1"/>
              <path d="M10 22V12M10 12H20M10 12L20 22" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <CardTitle className="text-xl">Fin<span className="text-primary">ex</span></CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="operador">{t.operador}</Label>
              <Select
                value={selectedOperadorId}
                onValueChange={setSelectedOperadorId}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoading ? t.aCarregar : t.selecionarOperador} />
                </SelectTrigger>
                <SelectContent>
                  {operadores.map((op) => (
                    <SelectItem key={op.id} value={op.id}>
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: DOT_COLORS[op.cor] }}
                        />
                        {op.nome}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t.password}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={t.password}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {t.entrar}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
