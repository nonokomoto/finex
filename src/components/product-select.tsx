'use client'

import { useState, useRef } from 'react'
import { Check, ChevronDown, Plus, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { supabase, type Produto } from '@/lib/supabase'
import { translations, type Locale } from '@/lib/i18n'

interface ProductSelectProps {
    value: string
    onValueChange: (value: string, preco?: number) => void
    tipo: 'receita' | 'gasto'
    produtos: Produto[]
    onProductCreated: () => void
    operadorColor?: string
    locale?: Locale
    defaultPrice?: string
}

export function ProductSelect({
    value,
    onValueChange,
    tipo,
    produtos,
    onProductCreated,
    operadorColor = '#f97316',
    locale = 'pt',
    defaultPrice = '',
}: ProductSelectProps) {
    const [open, setOpen] = useState(false)
    const [newProductName, setNewProductName] = useState('')
    const [newProductPrice, setNewProductPrice] = useState(defaultPrice)
    const [isCreating, setIsCreating] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const t = translations[locale]

    const filteredProdutos = produtos.filter(p => p.tipo === tipo)
    const selectedProduct = filteredProdutos.find(p => p.id === value)

    async function handleCreateProduct() {
        if (!newProductName.trim() || !newProductPrice || isCreating) return

        const preco = parseFloat(newProductPrice)
        if (isNaN(preco) || preco <= 0) {
            console.error(t.valorInvalido)
            return
        }

        // Validação de duplicados
        const duplicate = filteredProdutos.find(
            p => p.nome.toLowerCase() === newProductName.trim().toLowerCase()
        )

        if (duplicate) {
            console.error('Produto já existe')
            setNewProductName('')
            setNewProductPrice('')
            return
        }

        setIsCreating(true)

        const { data, error } = await supabase
            .from('produtos')
            .insert({
                nome: newProductName.trim(),
                tipo: tipo,
                preco_base: preco,
                ativo: true,
                codigo: null,
                descricao: null,
                categoria_id: null,
            })
            .select()
            .single()

        if (error) {
            console.error('Erro ao criar produto:', error.message)
            setIsCreating(false)
            return
        }

        // Seleciona automaticamente o produto recém-criado e passa o preço
        if (data) {
            onValueChange(data.id, preco)
            setOpen(false) // Fecha o popover
        }

        setNewProductName('')
        setNewProductPrice('')
        setIsCreating(false)
        onProductCreated()
    }

    function handleSelect(productId: string, preco?: number) {
        onValueChange(productId, preco)
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
                    {selectedProduct ? selectedProduct.nome : t.opcional}
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
                            "flex items-center gap-2 px-3 py-3 text-sm hover:bg-accent cursor-pointer text-left",
                            !value && "bg-accent"
                        )}
                    >
                        <Check className={cn("h-4 w-4", !value || value === '' ? "opacity-100" : "opacity-0")} />
                        {t.nenhuma}
                    </button>

                    {/* Separador */}
                    {filteredProdutos.length > 0 && <div className="h-px bg-border" />}

                    {/* Lista de produtos com scroll */}
                    <div
                        style={{ maxHeight: '180px', overflowY: 'auto' }}
                        onWheel={(e) => {
                            e.currentTarget.scrollTop += e.deltaY
                        }}
                    >
                        {filteredProdutos.map(prod => (
                            <button
                                type="button"
                                key={prod.id}
                                onClick={() => handleSelect(prod.id, prod.preco_base)}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-3 text-sm hover:bg-accent cursor-pointer text-left w-full",
                                    value === prod.id && "bg-accent"
                                )}
                            >
                                <Check className={cn("h-4 w-4 shrink-0", value === prod.id ? "opacity-100" : "opacity-0")} />
                                <div className="flex-1 overflow-hidden">
                                    <div className="font-medium truncate">{prod.nome}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {prod.preco_base.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Separador visual para seção de criar */}
                    <div className="h-[2px] bg-gradient-to-r from-transparent via-border to-transparent" />

                    {/* Seção para criar novo produto */}
                    <div className="p-3 bg-muted/30 space-y-3">
                        <div className="flex items-center gap-2">
                            <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground">
                                {locale === 'pt' ? 'Criar novo produto' : 'Créer un produit'}
                            </span>
                        </div>
                        <div className="grid grid-cols-[1fr_80px_32px] gap-2">
                            <Input
                                ref={inputRef}
                                placeholder={t.novoProduto}
                                value={newProductName}
                                onChange={(e) => setNewProductName(e.target.value)}
                                className="h-9 text-sm"
                                disabled={isCreating}
                            />
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="€"
                                value={newProductPrice}
                                onChange={(e) => setNewProductPrice(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault()
                                        handleCreateProduct()
                                    }
                                }}
                                className="h-9 text-sm"
                                disabled={isCreating}
                            />
                            <Button
                                type="button"
                                size="sm"
                                onClick={handleCreateProduct}
                                disabled={!newProductName.trim() || !newProductPrice || isCreating}
                                style={{ backgroundColor: newProductName.trim() && newProductPrice && !isCreating ? operadorColor : undefined }}
                                className="h-9 w-9 p-0 text-white shrink-0"
                            >
                                {isCreating ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Plus className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
