'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { Search, TrendingUp, TrendingDown, Plus, Check, Loader2 } from 'lucide-react'
import { supabase, Produto, Categoria } from '@/lib/supabase'
import { Locale, translations } from '@/lib/i18n'
import { getOperadorColor } from '@/components/operador-badge'

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

const ITEMS_PER_PAGE = 10

interface MovimentoDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    produtos: Produto[]
    operadorId: string
    operadorCor?: string
    locale: Locale
    onMovimentoCreated?: (produto: Produto, tipo: 'receita' | 'gasto', preco: number) => void
    onProdutoCreated?: () => void
}

export function MovimentoDialog({
    open,
    onOpenChange,
    produtos,
    operadorId,
    operadorCor,
    locale,
    onMovimentoCreated,
    onProdutoCreated
}: MovimentoDialogProps) {
    const [tipo, setTipo] = useState<'receita' | 'gasto'>('receita')
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null)
    const [precoAjustado, setPrecoAjustado] = useState('')
    const [isCreatingNew, setIsCreatingNew] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE)

    // Form para novo produto
    const [novoNome, setNovoNome] = useState('')
    const [novoPreco, setNovoPreco] = useState('')

    const searchInputRef = useRef<HTMLInputElement>(null)
    const listRef = useRef<HTMLDivElement>(null)
    const t = translations[locale]
    const operadorColor = getOperadorColor(operadorCor)

    // Filtrar produtos pelo tipo e pesquisa (todos os resultados)
    const allFilteredProducts = useMemo(() => {
        return produtos
            .filter(p => p.tipo === tipo)
            .filter(p => {
                if (!searchTerm) return true
                const termo = searchTerm.toLowerCase()
                return p.nome.toLowerCase().includes(termo) ||
                    (p.codigo && p.codigo.toLowerCase().includes(termo))
            })
    }, [produtos, tipo, searchTerm])

    // Produtos visíveis (lazy loading)
    const produtosFiltrados = useMemo(() => {
        return allFilteredProducts.slice(0, visibleCount)
    }, [allFilteredProducts, visibleCount])

    const hasMore = produtosFiltrados.length < allFilteredProducts.length

    // Scroll handler para lazy loading
    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
        if (scrollHeight - scrollTop <= clientHeight + 50) {
            setVisibleCount(prev => {
                const newCount = prev + ITEMS_PER_PAGE
                return newCount > allFilteredProducts.length ? allFilteredProducts.length : newCount
            })
        }
    }, [allFilteredProducts.length])

    // Reset quando abre/fecha
    useEffect(() => {
        if (open) {
            setSearchTerm('')
            setSelectedProduto(null)
            setPrecoAjustado('')
            setIsCreatingNew(false)
            setNovoNome('')
            setNovoPreco('')
            setVisibleCount(ITEMS_PER_PAGE)
            // Focus no search após abrir
            setTimeout(() => searchInputRef.current?.focus(), 100)
        }
    }, [open])

    // Reset visibleCount quando muda tipo ou pesquisa
    useEffect(() => {
        setVisibleCount(ITEMS_PER_PAGE)
    }, [tipo, searchTerm])

    // Quando seleciona produto, preenche o preço
    useEffect(() => {
        if (selectedProduto) {
            setPrecoAjustado(selectedProduto.preco_base.toString())
        }
    }, [selectedProduto])

    function handleTipoChange(novoTipo: 'receita' | 'gasto') {
        setTipo(novoTipo)
        setSelectedProduto(null)
        setSearchTerm('')
        setIsCreatingNew(false)
    }

    function handleSelectProduto(produto: Produto) {
        setSelectedProduto(produto)
        setIsCreatingNew(false)
    }

    function handleStartCreateNew() {
        setIsCreatingNew(true)
        setSelectedProduto(null)
        setNovoNome(searchTerm)
        setNovoPreco('')
    }

    async function handleCreateAndSelect() {
        if (!novoNome || !novoPreco) return

        setIsSaving(true)

        try {
            // Gerar código automático
            const prefix = novoNome.toUpperCase().slice(0, 3)
            const { data: existingCodes } = await supabase
                .from('produtos')
                .select('codigo')
                .eq('operador_id', operadorId)
                .like('codigo', `${prefix}%`)

            const codes = (existingCodes || []).map(p => {
                const num = parseInt(p.codigo?.replace(prefix, '') || '0')
                return isNaN(num) ? 0 : num
            })
            const nextNum = Math.max(0, ...codes) + 1
            const codigo = `${prefix}${String(nextNum).padStart(3, '0')}`

            const { data, error } = await supabase
                .from('produtos')
                .insert({
                    nome: novoNome,
                    codigo,
                    preco_base: parseFloat(novoPreco),
                    tipo,
                    operador_id: operadorId,
                    ativo: true
                })
                .select('*, categoria:categorias(id, nome, tipo)')
                .single()

            if (error) throw error

            // Notificar que produto foi criado
            onProdutoCreated?.()

            // Selecionar o produto criado
            if (data) {
                setSelectedProduto(data)
                setPrecoAjustado(novoPreco)
                setIsCreatingNew(false)
            }
        } catch (error) {
            console.error('Erro ao criar produto:', error)
        } finally {
            setIsSaving(false)
        }
    }

    function handleConfirm() {
        if (!selectedProduto) return

        const preco = parseFloat(precoAjustado) || selectedProduto.preco_base
        onMovimentoCreated?.(selectedProduto, tipo, preco)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl p-0 gap-0 overflow-hidden max-h-[90vh]">
                {/* Header com tabs */}
                <div className="border-b border-border">
                    <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-0">
                        <DialogTitle className="text-base sm:text-lg font-semibold">
                            {locale === 'pt' ? 'Registar Movimento' : 'Enregistrer Mouvement'}
                        </DialogTitle>
                    </DialogHeader>

                    {/* Tabs Receita/Despesa */}
                    <div className="flex px-4 sm:px-6 mt-4">
                        <button
                            onClick={() => handleTipoChange('receita')}
                            className={`relative flex-1 sm:flex-none flex items-center justify-center sm:justify-start gap-2 px-3 sm:px-5 py-3 text-sm font-medium transition-colors ${
                                tipo === 'receita'
                                    ? 'text-green-600'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <TrendingUp className="h-4 w-4" />
                            <span>{locale === 'pt' ? 'Receita' : 'Recette'}</span>
                            {tipo === 'receita' && (
                                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500 rounded-full" />
                            )}
                        </button>
                        <button
                            onClick={() => handleTipoChange('gasto')}
                            className={`relative flex-1 sm:flex-none flex items-center justify-center sm:justify-start gap-2 px-3 sm:px-5 py-3 text-sm font-medium transition-colors ${
                                tipo === 'gasto'
                                    ? 'text-red-600'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <TrendingDown className="h-4 w-4" />
                            <span>{locale === 'pt' ? 'Despesa' : 'Dépense'}</span>
                            {tipo === 'gasto' && (
                                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 rounded-full" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Conteúdo */}
                <div className="p-4 sm:p-6 overflow-y-auto">
                    {!selectedProduto && !isCreatingNew ? (
                        <>
                            {/* Pesquisa */}
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                    ref={searchInputRef}
                                    placeholder={tipo === 'receita'
                                        ? (locale === 'pt' ? 'Pesquisar produto...' : 'Rechercher produit...')
                                        : (locale === 'pt' ? 'Pesquisar despesa...' : 'Rechercher dépense...')
                                    }
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="pl-12 h-12 text-base"
                                />
                            </div>

                            {/* Lista de produtos */}
                            <div
                                ref={listRef}
                                className="mt-4 space-y-2 max-h-60 sm:max-h-72 overflow-y-auto"
                                onScroll={handleScroll}
                            >
                                {produtosFiltrados.length > 0 ? (
                                    <>
                                        {produtosFiltrados.map(produto => (
                                            <button
                                                key={produto.id}
                                                onClick={() => handleSelectProduto(produto)}
                                                className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-muted transition-colors text-left"
                                            >
                                                <div className="min-w-0">
                                                    <span className="font-medium text-foreground block truncate text-base">
                                                        {produto.nome}
                                                    </span>
                                                    {produto.categoria && (
                                                        <span className="text-sm text-muted-foreground mt-0.5 block">
                                                            {(produto.categoria as Categoria).nome}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className={`font-semibold tabular-nums shrink-0 ml-4 text-lg ${
                                                    tipo === 'receita' ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                    {produto.preco_base.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                                                </span>
                                            </button>
                                        ))}
                                        {/* Indicador de mais produtos */}
                                        {hasMore && (
                                            <div className="flex justify-center py-3 text-sm text-muted-foreground">
                                                <span>{locale === 'pt' ? 'Scroll para ver mais...' : 'Défiler pour voir plus...'}</span>
                                            </div>
                                        )}
                                    </>
                                ) : searchTerm ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <p>
                                            {locale === 'pt' ? 'Nenhum resultado para' : 'Aucun résultat pour'} "{searchTerm}"
                                        </p>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <p>
                                            {tipo === 'receita'
                                                ? (locale === 'pt' ? 'Pesquise ou crie um produto' : 'Recherchez ou créez un produit')
                                                : (locale === 'pt' ? 'Pesquise ou crie uma despesa' : 'Recherchez ou créez une dépense')
                                            }
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Criar novo */}
                            <div className="mt-4 pt-4 border-t border-border">
                                <button
                                    onClick={handleStartCreateNew}
                                    className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-border hover:border-muted-foreground hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
                                >
                                    <Plus className="h-5 w-5" />
                                    <span>
                                        {tipo === 'receita'
                                            ? (locale === 'pt' ? 'Criar novo produto' : 'Créer nouveau produit')
                                            : (locale === 'pt' ? 'Criar nova despesa' : 'Créer nouvelle dépense')
                                        }
                                    </span>
                                </button>
                            </div>
                        </>
                    ) : isCreatingNew ? (
                        /* Formulário de criação */
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <Label>{t.nome} *</Label>
                                <Input
                                    placeholder={tipo === 'receita'
                                        ? (locale === 'pt' ? 'Nome do produto' : 'Nom du produit')
                                        : (locale === 'pt' ? 'Nome da despesa' : 'Nom de la dépense')
                                    }
                                    value={novoNome}
                                    onChange={e => setNovoNome(e.target.value)}
                                    className="h-12 text-base"
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>{t.precoBaseEur} *</Label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">€</span>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        value={novoPreco}
                                        onChange={e => setNovoPreco(e.target.value)}
                                        className="h-12 pl-10 text-base"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsCreatingNew(false)}
                                    className="flex-1 h-12"
                                    disabled={isSaving}
                                >
                                    {t.cancelar}
                                </Button>
                                <Button
                                    onClick={handleCreateAndSelect}
                                    style={{ backgroundColor: tipo === 'receita' ? '#22c55e' : '#ef4444' }}
                                    className="flex-1 h-12 text-white"
                                    disabled={!novoNome || !novoPreco || isSaving}
                                >
                                    {isSaving ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Plus className="h-5 w-5 mr-2" />
                                            {locale === 'pt' ? 'Criar' : 'Créer'}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        /* Produto selecionado - confirmar */
                        <div className="space-y-5">
                            {/* Card do produto selecionado */}
                            <div className={`p-5 rounded-xl border-2 ${
                                tipo === 'receita' ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'
                            }`}>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <span className="font-semibold text-foreground text-lg">
                                            {selectedProduto.nome}
                                        </span>
                                        {selectedProduto.categoria && (
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {(selectedProduto.categoria as Categoria).nome}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setSelectedProduto(null)}
                                        className="text-sm text-muted-foreground hover:text-foreground underline"
                                    >
                                        {locale === 'pt' ? 'Alterar' : 'Changer'}
                                    </button>
                                </div>
                            </div>

                            {/* Preço ajustável */}
                            <div className="space-y-2">
                                <Label className="text-muted-foreground">
                                    {locale === 'pt' ? 'Valor' : 'Valeur'}
                                </Label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-2xl">€</span>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={precoAjustado}
                                        onChange={e => setPrecoAjustado(e.target.value)}
                                        className="h-16 pl-12 text-3xl font-semibold"
                                    />
                                </div>
                                {parseFloat(precoAjustado) !== selectedProduto.preco_base && (
                                    <p className="text-sm text-muted-foreground">
                                        {locale === 'pt' ? 'Preço original:' : 'Prix original:'} {selectedProduto.preco_base.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                                    </p>
                                )}
                            </div>

                            {/* Botão confirmar */}
                            <Button
                                onClick={handleConfirm}
                                style={{ backgroundColor: tipo === 'receita' ? '#22c55e' : '#ef4444' }}
                                className="w-full h-14 text-white text-base font-medium"
                            >
                                <Check className="h-5 w-5 mr-2" />
                                {tipo === 'receita'
                                    ? (locale === 'pt' ? 'Registar Receita' : 'Enregistrer Recette')
                                    : (locale === 'pt' ? 'Registar Despesa' : 'Enregistrer Dépense')
                                }
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
