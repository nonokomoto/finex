'use client'

import { useRouter } from 'next/navigation'
import { Moon, Sun, LogOut, Package, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { LanguageSelector } from '@/components/language-selector'
import { getOperadorColor, getOperadorColors } from '@/components/operador-badge'
import { Locale, translations } from '@/lib/i18n'
import { Operador } from '@/lib/supabase'

interface AppHeaderProps {
    locale: Locale
    onLocaleChange: (locale: Locale) => void
    isDark: boolean
    onToggleDark: () => void
    currentOperador: Operador | null
    operadores?: Operador[]
    onOperadorChange?: (operadorId: string) => void
    onLogout: () => void
    currentPage?: 'home' | 'catalogo'
}

export function AppHeader({
    locale,
    onLocaleChange,
    isDark,
    onToggleDark,
    currentOperador,
    operadores = [],
    onOperadorChange,
    onLogout,
    currentPage = 'home'
}: AppHeaderProps) {
    const router = useRouter()
    const t = translations[locale]
    const operadorColor = getOperadorColor(currentOperador?.cor)
    const operadorColors = getOperadorColors(currentOperador?.cor)

    return (
        <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                {/* Logo */}
                <button
                    onClick={() => router.push('/')}
                    className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity"
                >
                    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="sm:w-8 sm:h-8">
                        <rect x="0" y="0" width="32" height="32" rx="8" fill={operadorColor} />
                        <path d="M10 22V12M10 12H20M10 12L20 22" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <h1 className="text-xl sm:text-2xl font-bold">Fin<span style={{ color: operadorColor }}>ex</span></h1>
                </button>

                {/* Seletor de operador (apenas na home) */}
                {currentPage === 'home' && currentOperador && operadores.length > 0 && onOperadorChange && (
                    <Select value={currentOperador.id} onValueChange={onOperadorChange}>
                        <SelectTrigger
                            className="w-auto gap-1.5 sm:gap-2 border-0 px-2 sm:px-3 h-8 sm:h-9"
                            style={{ backgroundColor: operadorColors.bgLight }}
                        >
                            <span
                                className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full shrink-0"
                                style={{ backgroundColor: operadorColor }}
                            />
                            <SelectValue className="text-sm">
                                {currentOperador.nome}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {operadores.map((op) => (
                                <SelectItem key={op.id} value={op.id}>
                                    {op.nome}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}

                {/* Badge do catálogo (apenas no catálogo) */}
                {currentPage === 'catalogo' && currentOperador && (
                    <div
                        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
                        style={{ backgroundColor: operadorColors.bgLight }}
                    >
                        <Package className="h-4 w-4" style={{ color: operadorColor }} />
                        <span className="font-medium">{t.catalogo}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">{currentOperador.nome}</span>
                    </div>
                )}
            </div>

            {/* Ações */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <LanguageSelector locale={locale} onChange={onLocaleChange} />
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 sm:h-9 sm:w-9"
                    onClick={onToggleDark}
                    title={isDark ? t.lightMode : t.darkMode}
                >
                    {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
                {currentPage === 'home' ? (
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 sm:h-9 sm:w-9"
                        onClick={() => router.push('/catalogo')}
                        title={t.catalogo}
                    >
                        <Package className="h-4 w-4" />
                    </Button>
                ) : (
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 sm:h-9 sm:w-9"
                        onClick={() => router.push('/')}
                        title={locale === 'pt' ? 'Início' : 'Accueil'}
                    >
                        <Home className="h-4 w-4" />
                    </Button>
                )}
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 sm:h-9 sm:w-9"
                    onClick={onLogout}
                    title={t.logout}
                >
                    <LogOut className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
