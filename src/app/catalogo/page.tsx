'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Produto, Categoria, Operador } from '@/lib/supabase'
import { getCurrentOperador, isAuthenticated, logout } from '@/lib/auth'
import { Locale, translations, getStoredLocale } from '@/lib/i18n'
import { Plus, Trash2, Pencil, Search, Package, X, RotateCcw, Loader2, ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react'
import { getOperadorColor } from '@/components/operador-badge'
import { AppHeader } from '@/components/app-header'
import { setStoredLocale } from '@/lib/i18n'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { CategorySelect } from '@/components/category-select'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function CatalogoPage() {
    const router = useRouter()
    const [locale, setLocale] = useState<Locale>('pt')
    const [currentOperador, setCurrentOperador] = useState<Operador | null>(null)
    const [produtos, setProdutos] = useState<Produto[]>([])
    const [categorias, setCategorias] = useState<Categoria[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [editingProduto, setEditingProduto] = useState<Produto | null>(null)
    const [isAddingProduto, setIsAddingProduto] = useState(false)
    const [activeTab, setActiveTab] = useState<string>('all')
    const [mainTab, setMainTab] = useState<'produtos' | 'despesas'>('produtos')
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [itemToDelete, setItemToDelete] = useState<string | 'bulk' | null>(null)
    const [produtosInativos, setProdutosInativos] = useState<Produto[]>([])
    const [isSaving, setIsSaving] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [restoringId, setRestoringId] = useState<string | null>(null)
    const [permanentDeleteDialogOpen, setPermanentDeleteDialogOpen] = useState(false)
    const [itemToPermanentDelete, setItemToPermanentDelete] = useState<string | 'all' | null>(null)
    const [isPermanentDeleting, setIsPermanentDeleting] = useState(false)

    // Refs e estados para navegação das tabs
    const tabsContainerRef = useRef<HTMLDivElement>(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(false)
    const [isDark, setIsDark] = useState(false)

    const t = translations[locale]
    const operadorColor = getOperadorColor(currentOperador?.cor)

    const [formData, setFormData] = useState({
        nome: '',
        codigo: '',
        descricao: '',
        preco_base: '',
        categoria_id: '',
        tipo: 'receita' as 'receita' | 'gasto'
    })

    useEffect(() => {
        setLocale(getStoredLocale())
        const operador = getCurrentOperador()
        setCurrentOperador(operador)

        if (!isAuthenticated()) {
            router.push('/')
        }
    }, [router])

    useEffect(() => {
        setIsDark(document.documentElement.classList.contains('dark'))
    }, [])

    function handleLocaleChange(newLocale: Locale) {
        setLocale(newLocale)
        setStoredLocale(newLocale)
    }

    function toggleDarkMode() {
        const newIsDark = !isDark
        setIsDark(newIsDark)
        document.documentElement.classList.toggle('dark', newIsDark)
        localStorage.setItem('theme', newIsDark ? 'dark' : 'light')
    }

    const fetchCategorias = useCallback(async () => {
        const { data } = await supabase.from('categorias').select('*').order('tipo').order('nome')
        setCategorias(data || [])
    }, [])

    const fetchProdutos = useCallback(async () => {
        if (!currentOperador) return

        setIsLoading(true)
        const { data } = await supabase
            .from('produtos')
            .select('*, categoria:categorias(id, nome, tipo)')
            .eq('ativo', true)
            .eq('operador_id', currentOperador.id)
            .order('created_at', { ascending: false })
        setProdutos(data || [])
        setIsLoading(false)
    }, [currentOperador])

    const fetchProdutosInativos = useCallback(async () => {
        if (!currentOperador) return

        const { data } = await supabase
            .from('produtos')
            .select('*, categoria:categorias(id, nome, tipo)')
            .eq('ativo', false)
            .eq('operador_id', currentOperador.id)
            .order('nome')
        setProdutosInativos(data || [])
    }, [currentOperador])

    useEffect(() => {
        fetchCategorias()
    }, [fetchCategorias])

    // Verificar estado de scroll das tabs
    const checkTabsScroll = useCallback(() => {
        const container = tabsContainerRef.current
        if (!container) return

        const { scrollLeft, scrollWidth, clientWidth } = container
        setCanScrollLeft(scrollLeft > 0)
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
    }, [])

    // Função para navegar nas tabs
    const scrollTabs = useCallback((direction: 'left' | 'right') => {
        const container = tabsContainerRef.current
        if (!container) return

        const scrollAmount = 200
        container.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        })
    }, [])

    // Scroll automático para tab ativa
    useEffect(() => {
        const container = tabsContainerRef.current
        if (!container) return

        const activeButton = container.querySelector('[data-state="active"]') as HTMLElement
        if (activeButton) {
            const containerRect = container.getBoundingClientRect()
            const buttonRect = activeButton.getBoundingClientRect()

            // Se a tab ativa não está totalmente visível, fazer scroll
            if (buttonRect.left < containerRect.left || buttonRect.right > containerRect.right) {
                activeButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
            }
        }

        // Atualizar estado de scroll após mudança de tab
        setTimeout(checkTabsScroll, 300)
    }, [activeTab, checkTabsScroll])

    // Verificar scroll ao montar e quando produtos mudam
    useEffect(() => {
        // Múltiplos delays para garantir que o DOM foi atualizado
        const timeoutId1 = setTimeout(checkTabsScroll, 50)
        const timeoutId2 = setTimeout(checkTabsScroll, 200)
        const timeoutId3 = setTimeout(checkTabsScroll, 500)

        const container = tabsContainerRef.current
        if (container) {
            container.addEventListener('scroll', checkTabsScroll)
            window.addEventListener('resize', checkTabsScroll)

            // ResizeObserver para detectar mudanças no tamanho do container
            const resizeObserver = new ResizeObserver(() => {
                checkTabsScroll()
            })
            resizeObserver.observe(container)

            return () => {
                clearTimeout(timeoutId1)
                clearTimeout(timeoutId2)
                clearTimeout(timeoutId3)
                container.removeEventListener('scroll', checkTabsScroll)
                window.removeEventListener('resize', checkTabsScroll)
                resizeObserver.disconnect()
            }
        }
        return () => {
            clearTimeout(timeoutId1)
            clearTimeout(timeoutId2)
            clearTimeout(timeoutId3)
        }
    }, [checkTabsScroll, produtos, categorias])

    useEffect(() => {
        if (currentOperador) {
            fetchProdutos()
            fetchProdutosInativos()
        }
    }, [currentOperador, fetchProdutos, fetchProdutosInativos])

    // Gerar código automático baseado no operador: JOS001, NAN001, DEB001
    // Busca TODOS os produtos (incluindo inativos) para evitar conflitos de código
    const generateCode = useCallback(async (): Promise<string> => {
        if (!currentOperador) return 'PRD001'

        // Prefixo baseado nas 3 primeiras letras do nome do operador
        const prefix = currentOperador.nome
            .toUpperCase()
            .slice(0, 3)

        // Buscar todos os códigos existentes do operador (ativos e inativos)
        const { data: allProdutos } = await supabase
            .from('produtos')
            .select('codigo')
            .eq('operador_id', currentOperador.id)
            .like('codigo', `${prefix}%`)

        const existingCodes = (allProdutos || [])
            .map(p => {
                const num = parseInt(p.codigo?.replace(prefix, '') || '0')
                return isNaN(num) ? 0 : num
            })

        const nextNum = Math.max(0, ...existingCodes) + 1
        return `${prefix}${String(nextNum).padStart(3, '0')}`
    }, [currentOperador])


    // Filtrar produtos pelo main tab (receitas vs gastos)
    const produtosDoMainTab = useMemo(() => {
        const tipoFiltro = mainTab === 'produtos' ? 'receita' : 'gasto'
        return produtos.filter(p => p.tipo === tipoFiltro)
    }, [produtos, mainTab])

    // Agrupar produtos por categoria (já filtrados pelo mainTab)
    const produtosPorCategoria = useMemo(() => {
        const grupos: Record<string, Produto[]> = {}

        produtosDoMainTab.forEach(produto => {
            const categoriaId = produto.categoria_id || 'sem-categoria'
            if (!grupos[categoriaId]) {
                grupos[categoriaId] = []
            }
            grupos[categoriaId].push(produto)
        })

        return grupos
    }, [produtosDoMainTab])

    // Obter categorias que têm produtos (no mainTab atual)
    const categoriasComProdutos = useMemo(() => {
        const cats: { id: string; nome: string; count: number }[] = []

        Object.entries(produtosPorCategoria).forEach(([catId, prods]) => {
            const categoria = categorias.find(c => c.id === catId)
            cats.push({
                id: catId,
                nome: categoria?.nome || 'Sem Categoria',
                count: prods.length
            })
        })

        return cats.sort((a, b) => {
            if (a.id === 'sem-categoria') return 1
            if (b.id === 'sem-categoria') return -1
            return a.nome.localeCompare(b.nome)
        })
    }, [produtosPorCategoria, categorias])

    // Contadores para os main tabs
    const countReceitas = useMemo(() => produtos.filter(p => p.tipo === 'receita').length, [produtos])
    const countGastos = useMemo(() => produtos.filter(p => p.tipo === 'gasto').length, [produtos])

    // Produtos inativos filtrados pelo main tab atual
    const produtosInativosDoMainTab = useMemo(() => {
        const tipoFiltro = mainTab === 'produtos' ? 'receita' : 'gasto'
        return produtosInativos.filter(p => p.tipo === tipoFiltro)
    }, [produtosInativos, mainTab])

    // Filtrar produtos pela pesquisa (do mainTab atual)
    const produtosFiltrados = useMemo(() => {
        if (!searchTerm) return produtosDoMainTab

        const termo = searchTerm.toLowerCase()
        return produtosDoMainTab.filter(p =>
            p.nome.toLowerCase().includes(termo) ||
            (p.codigo && p.codigo.toLowerCase().includes(termo)) ||
            (p.descricao && p.descricao.toLowerCase().includes(termo))
        )
    }, [produtosDoMainTab, searchTerm])

    // Produtos para a tab atual
    const produtosTabAtual = useMemo(() => {
        if (activeTab === 'all') return produtosFiltrados
        return produtosFiltrados.filter(p => (p.categoria_id || 'sem-categoria') === activeTab)
    }, [produtosFiltrados, activeTab])

    // Seleção
    const isAllSelected = produtosTabAtual.length > 0 && produtosTabAtual.every(p => selectedIds.has(p.id))
    const isSomeSelected = produtosTabAtual.some(p => selectedIds.has(p.id))

    function toggleSelectAll() {
        if (isAllSelected) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(produtosTabAtual.map(p => p.id)))
        }
    }

    function toggleSelect(id: string) {
        const newSet = new Set(selectedIds)
        if (newSet.has(id)) {
            newSet.delete(id)
        } else {
            newSet.add(id)
        }
        setSelectedIds(newSet)
    }

    function clearSelection() {
        setSelectedIds(new Set())
    }

    function handleMainTabChange(tab: 'produtos' | 'despesas') {
        setMainTab(tab)
        setActiveTab('all') // Reset category tab when switching main tabs
        clearSelection()
    }

    function resetForm() {
        setFormData({
            nome: '',
            codigo: '',
            descricao: '',
            preco_base: '',
            categoria_id: '',
            tipo: 'receita' // Not used anymore, kept for compatibility
        })
        setEditingProduto(null)
        setIsAddingProduto(false)
    }

    function handleEdit(produto: Produto) {
        // Switch to the correct main tab for this product
        setMainTab(produto.tipo === 'receita' ? 'produtos' : 'despesas')
        setEditingProduto(produto)
        setFormData({
            nome: produto.nome,
            codigo: produto.codigo || '',
            descricao: produto.descricao || '',
            preco_base: produto.preco_base.toString(),
            categoria_id: produto.categoria_id || '',
            tipo: produto.tipo
        })
        setIsAddingProduto(true)
        clearSelection()
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // Gerar código quando categoria muda
    async function handleCategoriaChange(catId: string) {
        const categoria = categorias.find(c => c.id === catId)
        const novoFormData = { ...formData, categoria_id: catId === 'none' ? '' : catId }

        // Se não tem código e temos categoria, gerar automaticamente
        if (!formData.codigo && categoria) {
            novoFormData.codigo = await generateCode()
        }

        setFormData(novoFormData)
    }

    async function handleSave() {
        if (!formData.nome || !formData.preco_base) {
            alert(t.nomePrecoObrigatorios)
            return
        }

        const precoNumerico = parseFloat(formData.preco_base)
        if (isNaN(precoNumerico)) {
            alert(t.precoInvalido)
            return
        }

        setIsSaving(true)

        try {
            // Gerar código se não existir
            let codigo = formData.codigo
            if (!codigo) {
                codigo = await generateCode()
            }

            const tipo = mainTab === 'produtos' ? 'receita' : 'gasto'
            const produtoData = {
                nome: formData.nome,
                codigo,
                descricao: formData.descricao || null,
                preco_base: precoNumerico,
                categoria_id: formData.categoria_id || null,
                tipo,
                operador_id: currentOperador?.id || null
            }

            if (editingProduto) {
                const { error } = await supabase
                    .from('produtos')
                    .update(produtoData)
                    .eq('id', editingProduto.id)

                if (error) {
                    alert(t.erroAtualizarProduto + ': ' + error.message)
                    return
                }
            } else {
                const { error } = await supabase
                    .from('produtos')
                    .insert(produtoData)

                if (error) {
                    alert(t.erroCriarProduto + ': ' + error.message)
                    return
                }
            }

            resetForm()
            setActiveTab('all') // Mostrar tab "Todos" após adicionar/editar
            fetchProdutos()
        } finally {
            setIsSaving(false)
        }
    }

    function openDeleteDialog(id: string | 'bulk') {
        setItemToDelete(id)
        setDeleteDialogOpen(true)
    }

    async function confirmDelete() {
        if (!itemToDelete) return

        setIsDeleting(true)

        try {
            if (itemToDelete === 'bulk') {
                const idsArray = Array.from(selectedIds)
                if (idsArray.length === 0) return

                // Ao eliminar, limpar o código para permitir reutilização
                const { error } = await supabase
                    .from('produtos')
                    .update({ ativo: false, codigo: null })
                    .in('id', idsArray)

                if (error) {
                    alert(t.erroEliminarProduto + ': ' + error.message)
                    return
                }
                clearSelection()
            } else {
                // Ao eliminar, limpar o código para permitir reutilização
                const { error } = await supabase
                    .from('produtos')
                    .update({ ativo: false, codigo: null })
                    .eq('id', itemToDelete)

                if (error) {
                    alert(t.erroEliminarProduto + ': ' + error.message)
                    return
                }
                setSelectedIds(prev => {
                    const newSet = new Set(prev)
                    newSet.delete(itemToDelete)
                    return newSet
                })
            }

            fetchProdutos()
            fetchProdutosInativos()
        } finally {
            setDeleteDialogOpen(false)
            setItemToDelete(null)
            setIsDeleting(false)
        }
    }

    function getDeleteDialogContent() {
        if (itemToDelete === 'bulk') {
            return {
                title: locale === 'pt' ? 'Eliminar produtos selecionados?' : 'Supprimer les produits sélectionnés?',
                description: locale === 'pt'
                    ? `Tem a certeza que deseja eliminar ${selectedIds.size} produto${selectedIds.size > 1 ? 's' : ''}? Esta ação não pode ser desfeita.`
                    : `Êtes-vous sûr de vouloir supprimer ${selectedIds.size} produit${selectedIds.size > 1 ? 's' : ''}? Cette action ne peut pas être annulée.`
            }
        }
        const produto = produtos.find(p => p.id === itemToDelete)
        return {
            title: locale === 'pt' ? 'Eliminar produto?' : 'Supprimer le produit?',
            description: locale === 'pt'
                ? `Tem a certeza que deseja eliminar "${produto?.nome}"? Esta ação não pode ser desfeita.`
                : `Êtes-vous sûr de vouloir supprimer "${produto?.nome}"? Cette action ne peut pas être annulée.`
        }
    }

    async function handleRestore(id: string) {
        setRestoringId(id)

        try {
            // Gerar novo código para o produto restaurado
            const novoCodigo = await generateCode()

            const { error } = await supabase
                .from('produtos')
                .update({ ativo: true, codigo: novoCodigo })
                .eq('id', id)

            if (error) {
                alert((locale === 'pt' ? 'Erro ao restaurar produto' : 'Erreur lors de la restauration') + ': ' + error.message)
                return
            }

            fetchProdutos()
            fetchProdutosInativos()
        } finally {
            setRestoringId(null)
        }
    }

    function openPermanentDeleteDialog(id: string | 'all') {
        setItemToPermanentDelete(id)
        setPermanentDeleteDialogOpen(true)
    }

    async function confirmPermanentDelete() {
        if (!itemToPermanentDelete) return

        setIsPermanentDeleting(true)

        try {
            if (itemToPermanentDelete === 'all') {
                // Eliminar todos os inativos do mainTab atual
                const idsToDelete = produtosInativosDoMainTab.map(p => p.id)
                if (idsToDelete.length === 0) return

                const { error } = await supabase
                    .from('produtos')
                    .delete()
                    .in('id', idsToDelete)

                if (error) {
                    alert((locale === 'pt' ? 'Erro ao eliminar produtos' : 'Erreur lors de la suppression') + ': ' + error.message)
                    return
                }
            } else {
                const { error } = await supabase
                    .from('produtos')
                    .delete()
                    .eq('id', itemToPermanentDelete)

                if (error) {
                    alert((locale === 'pt' ? 'Erro ao eliminar produto' : 'Erreur lors de la suppression') + ': ' + error.message)
                    return
                }
            }

            fetchProdutosInativos()
        } finally {
            setPermanentDeleteDialogOpen(false)
            setItemToPermanentDelete(null)
            setIsPermanentDeleting(false)
        }
    }

    function getPermanentDeleteDialogContent() {
        if (itemToPermanentDelete === 'all') {
            return {
                title: locale === 'pt' ? 'Eliminar todos definitivamente?' : 'Supprimer tous définitivement?',
                description: locale === 'pt'
                    ? `Tem a certeza que deseja eliminar permanentemente ${produtosInativosDoMainTab.length} item${produtosInativosDoMainTab.length > 1 ? 's' : ''}? Esta ação é irreversível.`
                    : `Êtes-vous sûr de vouloir supprimer définitivement ${produtosInativosDoMainTab.length} élément${produtosInativosDoMainTab.length > 1 ? 's' : ''}? Cette action est irréversible.`
            }
        }
        const produto = produtosInativos.find(p => p.id === itemToPermanentDelete)
        return {
            title: locale === 'pt' ? 'Eliminar definitivamente?' : 'Supprimer définitivement?',
            description: locale === 'pt'
                ? `Tem a certeza que deseja eliminar permanentemente "${produto?.nome}"? Esta ação é irreversível.`
                : `Êtes-vous sûr de vouloir supprimer définitivement "${produto?.nome}"? Cette action est irréversible.`
        }
    }

    function handleEditProduto(produto: Produto) {
        // Switch to the correct main tab for this product
        setMainTab(produto.tipo === 'receita' ? 'produtos' : 'despesas')
        setEditingProduto(produto)
        setFormData({
            nome: produto.nome,
            codigo: produto.codigo || '',
            descricao: produto.descricao || '',
            preco_base: produto.preco_base.toString(),
            categoria_id: produto.categoria_id || '',
            tipo: produto.tipo
        })
        setIsAddingProduto(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }


    if (!currentOperador) {
        return (
            <main className="min-h-screen bg-background px-4 py-4 sm:px-6 md:px-8 md:py-8">
                <div className="max-w-6xl mx-auto">
                    <Skeleton className="h-10 w-64 mb-6" />
                    <Skeleton className="h-96 w-full" />
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-background px-4 py-4 sm:px-6 md:px-8 md:py-8">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <AppHeader
                    locale={locale}
                    onLocaleChange={handleLocaleChange}
                    isDark={isDark}
                    onToggleDark={toggleDarkMode}
                    currentOperador={currentOperador}
                    onLogout={() => { logout(); router.push('/') }}
                    currentPage="catalogo"
                />

                {/* Main Tabs: Produtos/Serviços vs Despesas */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 border-b border-border">
                        <button
                            onClick={() => handleMainTabChange('produtos')}
                            className={`relative flex items-center gap-1.5 sm:gap-2 pl-0 pr-3 sm:px-4 py-3 text-sm font-medium transition-colors ${
                                mainTab === 'produtos'
                                    ? 'text-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            <span className="hidden sm:inline">{locale === 'pt' ? 'Produtos/Serviços' : 'Produits/Services'}</span>
                            <span className="sm:hidden">{locale === 'pt' ? 'Produtos' : 'Produits'}</span>
                            <span className="text-xs text-muted-foreground/70 tabular-nums">{countReceitas}</span>
                            {mainTab === 'produtos' && (
                                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ backgroundColor: operadorColor }} />
                            )}
                        </button>
                        <button
                            onClick={() => handleMainTabChange('despesas')}
                            className={`relative flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-3 text-sm font-medium transition-colors ${
                                mainTab === 'despesas'
                                    ? 'text-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <TrendingDown className="h-4 w-4 text-red-500" />
                            <span>{locale === 'pt' ? 'Despesas' : 'Dépenses'}</span>
                            <span className="text-xs text-muted-foreground/70 tabular-nums">{countGastos}</span>
                            {mainTab === 'despesas' && (
                                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ backgroundColor: operadorColor }} />
                            )}
                        </button>
                        <div className="flex-1" />
                        <Button
                            onClick={() => setIsAddingProduto(true)}
                            style={{ backgroundColor: operadorColor }}
                            size="sm"
                            className="mb-2"
                        >
                            <Plus className="h-4 w-4 md:mr-2" />
                            <span className="hidden md:inline">
                                {mainTab === 'produtos'
                                    ? (locale === 'pt' ? 'Novo Produto' : 'Nouveau Produit')
                                    : (locale === 'pt' ? 'Nova Despesa' : 'Nouvelle Dépense')}
                            </span>
                        </Button>
                    </div>
                </div>

                {/* Modal de Adicionar/Editar Produto */}
                <style>{`
                    .catalogo-modal input:focus-visible,
                    .catalogo-modal button[data-slot="select-trigger"]:focus {
                        --tw-ring-color: ${operadorColor} !important;
                        border-color: ${operadorColor} !important;
                    }
                `}</style>
                <Dialog open={isAddingProduto} onOpenChange={(open) => !open && resetForm()}>
                    <DialogContent className="sm:max-w-lg catalogo-modal">
                        <DialogHeader>
                            <DialogTitle>
                                {editingProduto
                                    ? (mainTab === 'produtos'
                                        ? (locale === 'pt' ? 'Editar Produto' : 'Modifier le produit')
                                        : (locale === 'pt' ? 'Editar Despesa' : 'Modifier la dépense'))
                                    : (mainTab === 'produtos'
                                        ? (locale === 'pt' ? 'Adicionar Produto' : 'Ajouter un produit')
                                        : (locale === 'pt' ? 'Adicionar Despesa' : 'Ajouter une dépense'))}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 py-2">
                            {/* Nome e Categoria */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-sm">{t.nome} *</Label>
                                    <Input
                                        placeholder={t.nome}
                                        value={formData.nome}
                                        onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                        className="h-9"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-sm">{t.categoria}</Label>
                                    <CategorySelect
                                        value={formData.categoria_id}
                                        onValueChange={handleCategoriaChange}
                                        tipo={mainTab === 'produtos' ? 'receita' : 'gasto'}
                                        categorias={categorias}
                                        onCategoryCreated={fetchCategorias}
                                        operadorColor={operadorColor}
                                        locale={locale}
                                    />
                                </div>
                            </div>

                            {/* Código e Preço */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-sm text-muted-foreground">{t.codigo} ({locale === 'pt' ? 'auto' : 'auto'})</Label>
                                    <Input
                                        placeholder={locale === 'pt' ? 'Gerado automaticamente' : 'Généré automatiquement'}
                                        value={formData.codigo}
                                        onChange={e => setFormData({ ...formData, codigo: e.target.value })}
                                        className="h-9 font-mono text-sm"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-sm">{t.precoBaseEur} *</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        value={formData.preco_base}
                                        onChange={e => setFormData({ ...formData, preco_base: e.target.value })}
                                        className="h-9"
                                    />
                                </div>
                            </div>

                            {/* Descrição */}
                            <div className="space-y-1.5">
                                <Label className="text-sm text-muted-foreground">{t.descricao}</Label>
                                <Input
                                    placeholder={t.descricaoOpcional}
                                    value={formData.descricao}
                                    onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                                    className="h-9"
                                />
                            </div>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button variant="outline" onClick={resetForm} disabled={isSaving} className="h-9">
                                {t.cancelar}
                            </Button>
                            <Button
                                onClick={handleSave}
                                style={{ backgroundColor: operadorColor }}
                                disabled={isSaving}
                                className="h-9"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        {locale === 'pt' ? 'A guardar...' : 'Sauvegarde...'}
                                    </>
                                ) : (
                                    editingProduto
                                        ? t.guardarAlteracoes
                                        : (mainTab === 'produtos'
                                            ? (locale === 'pt' ? 'Adicionar Produto' : 'Ajouter le produit')
                                            : (locale === 'pt' ? 'Adicionar Despesa' : 'Ajouter la dépense'))
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Lista de Produtos por Categoria */}
                <div className="bg-card rounded-lg border border-border p-4 md:p-6">
                        {isLoading ? (
                            <div className="space-y-4">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-64 w-full" />
                            </div>
                        ) : produtosDoMainTab.length === 0 ? (
                            <div className="text-center py-12">
                                {mainTab === 'produtos' ? (
                                    <TrendingUp className="h-12 w-12 mx-auto text-green-500/50 mb-4" />
                                ) : (
                                    <TrendingDown className="h-12 w-12 mx-auto text-red-500/50 mb-4" />
                                )}
                                <h3 className="text-lg font-medium mb-2">
                                    {mainTab === 'produtos'
                                        ? (locale === 'pt' ? 'Sem produtos' : 'Aucun produit')
                                        : (locale === 'pt' ? 'Sem despesas' : 'Aucune dépense')}
                                </h3>
                                <p className="text-muted-foreground mb-4">
                                    {mainTab === 'produtos'
                                        ? (locale === 'pt'
                                            ? 'Comece adicionando produtos ou serviços ao seu catálogo'
                                            : 'Commencez par ajouter des produits ou services')
                                        : (locale === 'pt'
                                            ? 'Comece adicionando despesas ao seu catálogo'
                                            : 'Commencez par ajouter des dépenses')}
                                </p>
                                <Button
                                    onClick={() => setIsAddingProduto(true)}
                                    style={{ backgroundColor: operadorColor }}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    {mainTab === 'produtos'
                                        ? (locale === 'pt' ? 'Novo Produto' : 'Nouveau Produit')
                                        : (locale === 'pt' ? 'Nova Despesa' : 'Nouvelle Dépense')}
                                </Button>
                            </div>
                        ) : (
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="overflow-hidden">
                                {/* Linha com Tabs + Search */}
                                <div className="flex items-center gap-2 border-b border-border overflow-hidden">
                                    {/* Seta esquerda - sempre visível mas muda de estilo */}
                                    <button
                                        className={`p-1.5 rounded transition-all shrink-0 ${canScrollLeft
                                            ? 'text-foreground/80 hover:bg-muted'
                                            : 'text-muted-foreground/40 cursor-default'}`}
                                        onClick={() => canScrollLeft && scrollTabs('left')}
                                        aria-label={locale === 'pt' ? 'Ver categorias anteriores' : 'Voir catégories précédentes'}
                                        disabled={!canScrollLeft}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>

                                    {/* Tabs scrolláveis */}
                                    <div className="relative flex-1 min-w-0">
                                        {/* Fade direito */}
                                        <div className={`absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none transition-opacity ${canScrollRight ? 'opacity-100' : 'opacity-0'}`} />

                                        <div
                                            ref={tabsContainerRef}
                                            className="overflow-x-auto scrollbar-hide"
                                        >
                                            <TabsList className="inline-flex h-auto gap-0 bg-transparent p-0 w-max">
                                            <TabsTrigger
                                                value="all"
                                                className="relative px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground whitespace-nowrap rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none transition-colors"
                                            >
                                                {locale === 'pt' ? 'Todos' : 'Tous'}
                                                <span className="ml-1 text-xs text-muted-foreground/70 tabular-nums">{produtosDoMainTab.length}</span>
                                                {activeTab === 'all' && (
                                                    <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ backgroundColor: operadorColor }} />
                                                )}
                                            </TabsTrigger>
                                            {categoriasComProdutos.map(cat => (
                                                <TabsTrigger
                                                    key={cat.id}
                                                    value={cat.id}
                                                    className="relative px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground whitespace-nowrap rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none transition-colors"
                                                >
                                                    {cat.nome}
                                                    <span className="ml-1 text-xs text-muted-foreground/70 tabular-nums">{cat.count}</span>
                                                    {activeTab === cat.id && (
                                                        <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ backgroundColor: operadorColor }} />
                                                    )}
                                                </TabsTrigger>
                                            ))}
                                            {produtosInativosDoMainTab.length > 0 && (
                                                <TabsTrigger
                                                    value="deleted"
                                                    className="relative px-3 py-2.5 text-sm font-medium text-muted-foreground/70 hover:text-muted-foreground whitespace-nowrap rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-muted-foreground data-[state=active]:shadow-none transition-colors"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5 mr-1 inline" />
                                                    <span className="hidden sm:inline">{locale === 'pt' ? 'Eliminados' : 'Supprimés'}</span>
                                                    <span className="ml-1 text-xs tabular-nums">{produtosInativosDoMainTab.length}</span>
                                                    {activeTab === 'deleted' && (
                                                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-muted-foreground rounded-full" />
                                                    )}
                                                </TabsTrigger>
                                            )}
                                            </TabsList>
                                        </div>
                                    </div>

                                    {/* Seta direita - destacada quando há mais conteúdo */}
                                    <button
                                        className={`p-1.5 rounded transition-all shrink-0 ${canScrollRight
                                            ? 'text-foreground/80 hover:bg-muted bg-muted'
                                            : 'text-muted-foreground/40 cursor-default'}`}
                                        onClick={() => canScrollRight && scrollTabs('right')}
                                        aria-label={locale === 'pt' ? 'Ver mais categorias' : 'Voir plus de catégories'}
                                        disabled={!canScrollRight}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>

                                    {/* Search compacto - largura fixa */}
                                    <div className="relative shrink-0 hidden sm:block">
                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/70" />
                                        <Input
                                            placeholder={locale === 'pt' ? 'Pesquisar...' : 'Rechercher...'}
                                            className="w-40 h-8 pl-8 pr-8 text-sm border-border bg-muted focus:bg-card"
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                            aria-label={t.pesquisarProdutos}
                                        />
                                        {searchTerm && (
                                            <button
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-foreground/80"
                                                onClick={() => setSearchTerm('')}
                                                aria-label={locale === 'pt' ? 'Limpar' : 'Effacer'}
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Search mobile - linha separada */}
                                <div className="sm:hidden pt-3">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
                                        <Input
                                            placeholder={t.pesquisarProdutos}
                                            className="pl-9 pr-9 h-9 text-sm border-border"
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                            aria-label={t.pesquisarProdutos}
                                        />
                                        {searchTerm && (
                                            <button
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-foreground/80"
                                                onClick={() => setSearchTerm('')}
                                                aria-label={locale === 'pt' ? 'Limpar' : 'Effacer'}
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Toolbar de ações - aparece quando há seleção */}
                                {selectedIds.size > 0 && (
                                    <div className="flex items-center gap-2 p-2 sm:p-3 mt-3 mb-2 rounded-lg bg-muted border border-border">
                                        <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
                                            {selectedIds.size} {locale === 'pt' ? 'sel.' : 'sél.'}
                                        </span>
                                        <div className="flex-1" />
                                        {selectedIds.size === 1 && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8"
                                                onClick={() => {
                                                    const produto = produtos.find(p => selectedIds.has(p.id))
                                                    if (produto) handleEdit(produto)
                                                }}
                                            >
                                                <Pencil className="h-3.5 w-3.5 sm:mr-1.5" />
                                                <span className="hidden sm:inline text-xs">{locale === 'pt' ? 'Editar' : 'Modifier'}</span>
                                            </Button>
                                        )}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 text-destructive border-destructive hover:bg-destructive hover:text-white"
                                            onClick={() => openDeleteDialog('bulk')}
                                        >
                                            <Trash2 className="h-3.5 w-3.5 sm:mr-1.5" />
                                            <span className="hidden sm:inline text-xs">{locale === 'pt' ? 'Eliminar' : 'Supprimer'}</span>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={clearSelection}
                                            aria-label={locale === 'pt' ? 'Limpar seleção' : 'Effacer la sélection'}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}

                                {activeTab !== 'deleted' && (
                                <TabsContent value={activeTab} className="mt-4">
                                    {produtosTabAtual.length === 0 ? (
                                        <div className="text-center py-8">
                                            <p className="text-muted-foreground">
                                                {searchTerm
                                                    ? (locale === 'pt'
                                                        ? `Nenhum produto encontrado para "${searchTerm}"`
                                                        : `Aucun produit trouvé pour "${searchTerm}"`)
                                                    : (locale === 'pt'
                                                        ? 'Nenhum produto nesta categoria'
                                                        : 'Aucun produit dans cette catégorie')}
                                            </p>
                                            {searchTerm && (
                                                <Button
                                                    variant="link"
                                                    onClick={() => setSearchTerm('')}
                                                    className="mt-2"
                                                >
                                                    {locale === 'pt' ? 'Limpar pesquisa' : 'Effacer la recherche'}
                                                </Button>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            {/* Mobile View (Cards) */}
                                            <div className="md:hidden space-y-2">
                                                {produtosTabAtual.map((produto) => (
                                                    <div
                                                        key={produto.id}
                                                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-150 ${selectedIds.has(produto.id) ? 'border-border bg-muted' : 'border-border/50 bg-card'}`}
                                                        onClick={() => toggleSelect(produto.id)}
                                                    >
                                                        <Checkbox
                                                            checked={selectedIds.has(produto.id)}
                                                            onCheckedChange={() => toggleSelect(produto.id)}
                                                            aria-label={`${locale === 'pt' ? 'Selecionar' : 'Sélectionner'} ${produto.nome}`}
                                                            onClick={e => e.stopPropagation()}
                                                            className="shrink-0"
                                                        />

                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <h3 className="font-medium text-foreground truncate">{produto.nome}</h3>
                                                                <span className="font-medium tabular-nums text-foreground shrink-0">
                                                                    {produto.preco_base.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className="text-xs text-muted-foreground/60 font-mono">
                                                                    {produto.codigo || '—'}
                                                                </span>
                                                                <span className="text-xs text-muted-foreground/40">•</span>
                                                                <span className="text-xs text-muted-foreground/60 truncate">
                                                                    {(produto.categoria as Categoria)?.nome || (locale === 'pt' ? 'Sem categoria' : 'Sans catégorie')}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center shrink-0" onClick={e => e.stopPropagation()}>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                                onClick={() => handleEditProduto(produto)}
                                                                aria-label={`${locale === 'pt' ? 'Editar' : 'Modifier'} ${produto.nome}`}
                                                            >
                                                                <Pencil className="h-4 w-4 text-muted-foreground/50" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                                onClick={() => openDeleteDialog(produto.id)}
                                                                aria-label={`${locale === 'pt' ? 'Eliminar' : 'Supprimer'} ${produto.nome}`}
                                                            >
                                                                <Trash2 className="h-4 w-4 text-muted-foreground/50" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Desktop View (Table) - Minimalista */}
                                            <div className="hidden md:block overflow-x-auto">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className="border-b border-border hover:bg-transparent">
                                                            <TableHead className="w-10 py-3">
                                                                <Checkbox
                                                                    checked={isAllSelected}
                                                                    onCheckedChange={toggleSelectAll}
                                                                    aria-label={locale === 'pt' ? 'Selecionar todos' : 'Sélectionner tout'}
                                                                />
                                                            </TableHead>
                                                            <TableHead className="text-muted-foreground font-medium text-xs uppercase tracking-wider py-3 hidden lg:table-cell">{t.codigo}</TableHead>
                                                            <TableHead className="text-muted-foreground font-medium text-xs uppercase tracking-wider py-3">{t.nome}</TableHead>
                                                            <TableHead className="text-muted-foreground font-medium text-xs uppercase tracking-wider py-3 hidden xl:table-cell">{t.categoria}</TableHead>
                                                            <TableHead className="text-right text-muted-foreground font-medium text-xs uppercase tracking-wider py-3">{t.precoBase}</TableHead>
                                                            <TableHead className="w-16 py-3"></TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {produtosTabAtual.map((produto) => (
                                                            <TableRow
                                                                key={produto.id}
                                                                className={`group cursor-pointer transition-colors border-b border-border/50 ${selectedIds.has(produto.id) ? 'bg-muted' : 'bg-card hover:bg-muted/50'}`}
                                                                onClick={() => toggleSelect(produto.id)}
                                                            >
                                                                <TableCell className="py-3" onClick={e => e.stopPropagation()}>
                                                                    <Checkbox
                                                                        checked={selectedIds.has(produto.id)}
                                                                        onCheckedChange={() => toggleSelect(produto.id)}
                                                                        aria-label={`${locale === 'pt' ? 'Selecionar' : 'Sélectionner'} ${produto.nome}`}
                                                                    />
                                                                </TableCell>
                                                                <TableCell className="py-3 hidden lg:table-cell">
                                                                    <span className="text-sm text-muted-foreground/70 font-mono">
                                                                        {produto.codigo || '—'}
                                                                    </span>
                                                                </TableCell>
                                                                <TableCell className="py-3">
                                                                    <div>
                                                                        <span className="font-medium text-foreground">{produto.nome}</span>
                                                                        {/* Show code inline on tablet */}
                                                                        <span className="lg:hidden text-xs text-muted-foreground/60 font-mono ml-2">
                                                                            {produto.codigo || ''}
                                                                        </span>
                                                                        {produto.descricao && (
                                                                            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1 hidden lg:block">{produto.descricao}</p>
                                                                        )}
                                                                        {/* Show category on tablet */}
                                                                        <p className="text-xs text-muted-foreground/60 mt-0.5 xl:hidden">
                                                                            {(produto.categoria as Categoria)?.nome || ''}
                                                                        </p>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="py-3 hidden xl:table-cell">
                                                                    <span className="text-sm text-muted-foreground">
                                                                        {(produto.categoria as Categoria)?.nome || (locale === 'pt' ? 'Sem categoria' : 'Sans catégorie')}
                                                                    </span>
                                                                </TableCell>
                                                                <TableCell className="py-3 text-right">
                                                                    <span className="font-medium tabular-nums text-foreground">
                                                                        {produto.preco_base.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                                                                    </span>
                                                                </TableCell>
                                                                <TableCell className="py-3" onClick={e => e.stopPropagation()}>
                                                                    <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <button
                                                                            className="p-1.5 text-muted-foreground/70 hover:text-foreground/80 transition-colors"
                                                                            onClick={() => handleEditProduto(produto)}
                                                                            aria-label={`${locale === 'pt' ? 'Editar' : 'Modifier'} ${produto.nome}`}
                                                                        >
                                                                            <Pencil className="h-4 w-4" />
                                                                        </button>
                                                                        <button
                                                                            className="p-1.5 text-muted-foreground/70 hover:text-red-500 transition-colors"
                                                                            onClick={() => openDeleteDialog(produto.id)}
                                                                            aria-label={`${locale === 'pt' ? 'Eliminar' : 'Supprimer'} ${produto.nome}`}
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </button>
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </>
                                    )}
                                </TabsContent>
                                )}

                                {/* Tab de Produtos Eliminados */}
                                <TabsContent value="deleted" className="mt-4">
                                    {produtosInativosDoMainTab.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Trash2 className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                                            <p className="text-muted-foreground">
                                                {mainTab === 'produtos'
                                                    ? (locale === 'pt' ? 'Não há produtos eliminados' : 'Aucun produit supprimé')
                                                    : (locale === 'pt' ? 'Não há despesas eliminadas' : 'Aucune dépense supprimée')}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {/* Header com ação em massa */}
                                            <div className="flex items-center justify-between pb-2 border-b border-border">
                                                <span className="text-sm text-muted-foreground">
                                                    {produtosInativosDoMainTab.length} {produtosInativosDoMainTab.length === 1
                                                        ? (locale === 'pt' ? 'item eliminado' : 'élément supprimé')
                                                        : (locale === 'pt' ? 'itens eliminados' : 'éléments supprimés')}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openPermanentDeleteDialog('all')}
                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    {locale === 'pt' ? 'Eliminar todos' : 'Supprimer tous'}
                                                </Button>
                                            </div>

                                            {/* Lista de itens */}
                                            <div className="space-y-2">
                                                {produtosInativosDoMainTab.map((produto) => (
                                                    <div
                                                        key={produto.id}
                                                        className="group flex items-center gap-4 p-3 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors"
                                                    >
                                                        {/* Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium text-foreground/80">{produto.nome}</span>
                                                                <span className="text-xs text-muted-foreground/60">•</span>
                                                                <span className="text-sm text-muted-foreground/60">
                                                                    {produto.preco_base.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className="text-xs text-muted-foreground/50">
                                                                    {(produto.categoria as Categoria)?.nome || (locale === 'pt' ? 'Sem categoria' : 'Sans catégorie')}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Ações */}
                                                        <div className="flex items-center gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleRestore(produto.id)}
                                                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100"
                                                                disabled={restoringId === produto.id}
                                                                aria-label={`${locale === 'pt' ? 'Restaurar' : 'Restaurer'} ${produto.nome}`}
                                                            >
                                                                {restoringId === produto.id ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <RotateCcw className="h-4 w-4" />
                                                                )}
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => openPermanentDeleteDialog(produto.id)}
                                                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                aria-label={`${locale === 'pt' ? 'Eliminar definitivamente' : 'Supprimer définitivement'} ${produto.nome}`}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>
                        )}
                </div>
            </div>

            {/* Diálogo de confirmação de eliminação */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{getDeleteDialogContent().title}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {getDeleteDialogContent().description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>
                            {locale === 'pt' ? 'Cancelar' : 'Annuler'}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-destructive text-white hover:bg-destructive/90"
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {locale === 'pt' ? 'A eliminar...' : 'Suppression...'}
                                </>
                            ) : (
                                locale === 'pt' ? 'Eliminar' : 'Supprimer'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Diálogo de confirmação de eliminação permanente */}
            <AlertDialog open={permanentDeleteDialogOpen} onOpenChange={setPermanentDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-destructive">
                            {getPermanentDeleteDialogContent().title}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {getPermanentDeleteDialogContent().description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPermanentDeleting}>
                            {locale === 'pt' ? 'Cancelar' : 'Annuler'}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmPermanentDelete}
                            className="bg-destructive text-white hover:bg-destructive/90"
                            disabled={isPermanentDeleting}
                        >
                            {isPermanentDeleting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {locale === 'pt' ? 'A eliminar...' : 'Suppression...'}
                                </>
                            ) : (
                                locale === 'pt' ? 'Eliminar definitivamente' : 'Supprimer définitivement'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </main >
    )
}
