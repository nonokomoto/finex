'use client'

import { Locale } from '@/lib/i18n'
import { Button } from '@/components/ui/button'

interface LanguageSelectorProps {
  locale: Locale
  onChange: (locale: Locale) => void
}

export function LanguageSelector({ locale, onChange }: LanguageSelectorProps) {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => onChange(locale === 'pt' ? 'fr' : 'pt')}
      title={locale === 'pt' ? 'Mudar para Francês' : 'Changer en Portugais'}
    >
      <span className="text-sm font-medium">
        {locale === 'pt' ? '🇵🇹' : '🇫🇷'}
      </span>
    </Button>
  )
}
