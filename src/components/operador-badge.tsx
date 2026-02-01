'use client'

import { Operador } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface OperadorBadgeProps {
  operador: Operador | null | undefined
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
  className?: string
}

export const OPERADOR_COLORS = {
  blue: {
    primary: '#3b82f6',
    text: '#2563eb',
    bgLight: 'rgba(59, 130, 246, 0.1)',
    bgMedium: 'rgba(59, 130, 246, 0.15)',
  },
  purple: {
    primary: '#8b5cf6',
    text: '#7c3aed',
    bgLight: 'rgba(139, 92, 246, 0.1)',
    bgMedium: 'rgba(139, 92, 246, 0.15)',
  },
  orange: {
    primary: '#f97316',
    text: '#ea580c',
    bgLight: 'rgba(249, 115, 22, 0.1)',
    bgMedium: 'rgba(249, 115, 22, 0.15)',
  },
}

export function OperadorBadge({
  operador,
  size = 'md',
  showName = true,
  className
}: OperadorBadgeProps) {
  if (!operador) return null

  const colors = OPERADOR_COLORS[operador.cor]

  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  }

  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      <span
        className={cn('rounded-full', sizeClasses[size])}
        style={{ backgroundColor: colors.primary }}
      />
      {showName && (
        <span
          className="text-sm font-medium"
          style={{ color: colors.text }}
        >
          {operador.nome}
        </span>
      )}
    </div>
  )
}

export function getOperadorBgLight(cor: 'blue' | 'purple' | 'orange') {
  return OPERADOR_COLORS[cor].bgLight
}

export function getOperadorColor(cor: 'blue' | 'purple' | 'orange' | undefined | null) {
  if (!cor) return '#6366f1' // default indigo
  return OPERADOR_COLORS[cor].primary
}

export function getOperadorColors(cor: 'blue' | 'purple' | 'orange' | undefined | null) {
  if (!cor) return { primary: '#6366f1', text: '#4f46e5', bgLight: 'rgba(99, 102, 241, 0.1)', bgMedium: 'rgba(99, 102, 241, 0.15)' }
  return OPERADOR_COLORS[cor]
}
