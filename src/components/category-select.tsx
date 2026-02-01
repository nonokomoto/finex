'use client'

import { useState, useRef, useEffect } from 'react'
import { Check, ChevronDown, Plus, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { supabase, type Categoria } from '@/lib/supabase'
import { translations, type Locale } from '@/lib/i18n'

interface CategorySelectProps {
  value: string
  onValueChange: (value: string) => void
  tipo: 'receita' | 'gasto'
  categorias: Categoria[]
  onCategoryCreated: () => void
  operadorColor?: string
  locale?: Locale
}

export function CategorySelect({
  value,
  onValueChange,
  tipo,
  categorias,
  onCategoryCreated,
  operadorColor = '#f97316',
  locale = 'pt',
}: CategorySelectProps) {
  const [open, setOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const t = translations[locale]

  const filteredCategorias = categorias.filter(c => c.tipo === tipo)
  const selectedCategory = filteredCategorias.find(c => c.id === value)

  async function handleCreateCategory() {
    if (!newCategoryName.trim() || isCreating) return

    // Validação de duplicados
    const duplicate = filteredCategorias.find(
      c => c.nome.toLowerCase() === newCategoryName.trim().toLowerCase()
    )

    if (duplicate) {
      // TODO: Substituir por toast quando implementado
      console.error(t.erroAdicionarCategoria + ': Categoria já existe')
      setNewCategoryName('')
      return
    }

    setIsCreating(true)

    const { data, error } = await supabase
      .from('categorias')
      .insert({
        nome: newCategoryName.trim(),
        tipo: tipo,
      })
      .select()
      .single()

    if (error) {
      // TODO: Substituir por toast quando implementado
      console.error(t.erroAdicionarCategoria + ':', error.message)
      setIsCreating(false)
      return
    }

    // Seleciona automaticamente a categoria recém-criada
    if (data) {
      onValueChange(data.id)
      setOpen(false) // Fecha o popover
    }

    setNewCategoryName('')
    setIsCreating(false)
    onCategoryCreated()
  }

  function handleSelect(categoryId: string) {
    onValueChange(categoryId)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {selectedCategory ? selectedCategory.nome : t.opcional}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <div className="flex flex-col">
          {/* Opção Nenhuma */}
          <button
            type="button"
            onClick={() => handleSelect('')}
            className={cn(
              "flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent cursor-pointer text-left",
              !value && "bg-accent"
            )}
          >
            <Check className={cn("h-4 w-4", !value || value === '' ? "opacity-100" : "opacity-0")} />
            {t.nenhuma}
          </button>

          {/* Separador */}
          {filteredCategorias.length > 0 && <div className="h-px bg-border" />}

          {/* Lista de categorias com scroll */}
          <div
            style={{ maxHeight: '180px', overflowY: 'auto' }}
            onWheel={(e) => {
              e.currentTarget.scrollTop += e.deltaY
            }}
          >
            {filteredCategorias.map(cat => (
              <button
                type="button"
                key={cat.id}
                onClick={() => handleSelect(cat.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-3 text-sm hover:bg-accent cursor-pointer text-left w-full",
                  value === cat.id && "bg-accent"
                )}
              >
                <Check className={cn("h-4 w-4", value === cat.id ? "opacity-100" : "opacity-0")} />
                {cat.nome}
              </button>
            ))}
          </div>

          {/* Separador */}
          <div className="h-px bg-border my-1" />

          {/* Input para criar nova categoria */}
          <div className="p-2">
            <div className="flex gap-1">
              <Input
                ref={inputRef}
                placeholder={t.novaCategoria}
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleCreateCategory()
                  }
                }}
                className="h-8 text-sm"
                disabled={isCreating}
              />
              <Button
                type="button"
                size="sm"
                onClick={handleCreateCategory}
                disabled={!newCategoryName.trim() || isCreating}
                style={{ backgroundColor: newCategoryName.trim() && !isCreating ? operadorColor : undefined }}
                className="h-8 w-8 p-0 text-white"
              >
                {isCreating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Plus className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
