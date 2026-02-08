'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { CalendarDays } from 'lucide-react'

interface DateInputProps {
  value: string // yyyy-MM-dd
  onChange: (value: string) => void
  className?: string
}

function toDisplay(iso: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function toISO(display: string): string | null {
  const match = display.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return null
  const [, d, m, y] = match
  const day = parseInt(d, 10)
  const month = parseInt(m, 10)
  const year = parseInt(y, 10)
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900) return null
  return `${y}-${m}-${d}`
}

function autoFormat(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

export function DateInput({ value, onChange, className }: DateInputProps) {
  const [text, setText] = useState(toDisplay(value))
  const inputRef = useRef<HTMLInputElement>(null)
  const datePickerRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!inputRef.current || inputRef.current !== document.activeElement) {
      setText(toDisplay(value))
    }
  }, [value])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = autoFormat(e.target.value)
    setText(formatted)
    const iso = toISO(formatted)
    if (iso) onChange(iso)
  }

  function handleBlur() {
    const iso = toISO(text)
    if (iso) {
      onChange(iso)
    }
    setText(toDisplay(value))
  }

  function handleDatePick(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.value) {
      onChange(e.target.value)
      datePickerRef.current?.blur()
    }
  }

  return (
    <div className="relative flex items-center">
      <Input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        placeholder="dd/mm/aaaa"
        value={text}
        onChange={handleChange}
        onBlur={handleBlur}
        className={`pr-9 ${className || ''}`}
        maxLength={10}
      />
      <div className="absolute right-0 h-full w-9 flex items-center justify-center">
        <CalendarDays className="h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          ref={datePickerRef}
          type="date"
          value={value}
          onChange={handleDatePick}
          className="absolute inset-0 opacity-0 cursor-pointer"
          tabIndex={-1}
        />
      </div>
    </div>
  )
}
