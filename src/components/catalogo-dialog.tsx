'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase, Produto, Categoria } from '@/lib/supabase'
import { Locale, translations } from '@/lib/i18n'
import { Plus, Trash2, Pencil, Package, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CategorySelect } from '@/components/category-select'

interface CatalogoDialogProps {
  operadorColor: string
  categorias: Categoria[]
  locale: Locale
  onCategoriesChanged?: () => void
}

export function CatalogoDialog({ operadorColor, categorias, locale, onCategoriesChanged }: CatalogoDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null)
  const [isAddingProduto, setIsAddingProduto] = useState(false)

  const t = translations[locale]

  const [formData, setFormData] = useState({
    nome: '',
    codigo: '',
    descricao: '',
    preco_base: '',
    categoria_id: '',
    tipo: 'receita' as 'receita' | 'gasto'
  })

  const fetchProdutos = useCallback(async () => {
    setIsLoading(true)
    const { data } = await supabase
      .from('produtos')
      .select('*, categoria:categorias(id, nome, tipo)')
      .eq('ativo', true)
      .order('nome')
    setProdutos(data || [])
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (isOpen) {
      fetchProdutos()
    }
  }, [isOpen, fetchProdutos])

  function resetForm() {
    setFormData({
      nome: '',
      codigo: '',
      descricao: '',
      preco_base: '',
      categoria_id: '',
      tipo: 'receita'
    })
    setEditingProduto(null)
    setIsAddingProduto(false)
  }

  function handleEdit(produto: Produto) {
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

    const produtoData = {
      nome: formData.nome,
      codigo: formData.codigo || null,
      descricao: formData.descricao || null,
      preco_base: precoNumerico,
      categoria_id: formData.categoria_id || null,
      tipo: formData.tipo
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
    fetchProdutos()
  }

  async function handleDelete(id: string) {
    // Soft delete - apenas desativa
    const { error } = await supabase
      .from('produtos')
      .update({ ativo: false })
      .eq('id', id)

    if (error) {
      alert(t.erroEliminarProduto + ': ' + error.message)
      return
    }
    fetchProdutos()
  }

  const produtosFiltrados = produtos.filter(p =>
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.codigo && p.codigo.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.descricao && p.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const produtosReceita = produtosFiltrados.filter(p => p.tipo === 'receita')
  const produtosGasto = produtosFiltrados.filter(p => p.tipo === 'gasto')

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" title={t.catalogo}>
          <Package className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t.catalogo}</DialogTitle>
        </DialogHeader>

        {isAddingProduto ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.nome} *</Label>
                <Input
                  placeholder={t.nome}
                  value={formData.nome}
                  onChange={e => setFormData({ ...formData, nome: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t.codigo}</Label>
                <Input
                  placeholder="REF001"
                  value={formData.codigo}
                  onChange={e => setFormData({ ...formData, codigo: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.tipo} *</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(v: 'receita' | 'gasto') => setFormData({ ...formData, tipo: v, categoria_id: '' })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receita">{t.receitaServicoVenda}</SelectItem>
                    <SelectItem value="gasto">{t.gastoCompraDespesa}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t.precoBaseEur} *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.preco_base}
                  onChange={e => setFormData({ ...formData, preco_base: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t.categoria}</Label>
              <CategorySelect
                value={formData.categoria_id}
                onValueChange={v => setFormData({ ...formData, categoria_id: v === 'none' ? '' : v })}
                tipo={formData.tipo}
                categorias={categorias}
                onCategoryCreated={() => onCategoriesChanged?.()}
                operadorColor={operadorColor}
                locale={locale}
              />
            </div>

            <div className="space-y-2">
              <Label>{t.descricao}</Label>
              <Input
                placeholder={t.descricaoOpcional}
                value={formData.descricao}
                onChange={e => setFormData({ ...formData, descricao: e.target.value })}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={resetForm}>
                {t.cancelar}
              </Button>
              <Button onClick={handleSave} style={{ backgroundColor: operadorColor }}>
                {editingProduto ? t.guardarAlteracoes : t.adicionarProduto}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t.pesquisarProdutos}
                  className="pl-9"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <Button onClick={() => setIsAddingProduto(true)} style={{ backgroundColor: operadorColor }}>
                <Plus className="h-4 w-4 mr-2" />
                {t.novoProduto}
              </Button>
            </div>

            <Tabs defaultValue="receitas">
              <TabsList className="w-full">
                <TabsTrigger value="receitas" className="flex-1">
                  {t.receitas} ({produtosReceita.length})
                </TabsTrigger>
                <TabsTrigger value="gastos" className="flex-1">
                  {t.gastos} ({produtosGasto.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="receitas" className="mt-4">
                <ProdutosTable
                  produtos={produtosReceita}
                  isLoading={isLoading}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  locale={locale}
                />
              </TabsContent>

              <TabsContent value="gastos" className="mt-4">
                <ProdutosTable
                  produtos={produtosGasto}
                  isLoading={isLoading}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  locale={locale}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

interface ProdutosTableProps {
  produtos: Produto[]
  isLoading: boolean
  onEdit: (produto: Produto) => void
  onDelete: (id: string) => void
  locale: Locale
}

function ProdutosTable({ produtos, isLoading, onEdit, onDelete, locale }: ProdutosTableProps) {
  const t = translations[locale]

  if (isLoading) {
    return <p className="text-center text-muted-foreground py-8">{t.aCarregar}</p>
  }

  if (produtos.length === 0) {
    return <p className="text-center text-muted-foreground py-8">{t.semProdutos}</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t.codigo}</TableHead>
          <TableHead>{t.nome}</TableHead>
          <TableHead>{t.categoria}</TableHead>
          <TableHead className="text-right">{t.precoBase}</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {produtos.map(produto => (
          <TableRow key={produto.id}>
            <TableCell>
              {produto.codigo ? (
                <Badge variant="outline">{produto.codigo}</Badge>
              ) : '-'}
            </TableCell>
            <TableCell>
              <div>
                <span className="font-medium">{produto.nome}</span>
                {produto.descricao && (
                  <p className="text-xs text-muted-foreground">{produto.descricao}</p>
                )}
              </div>
            </TableCell>
            <TableCell>{(produto.categoria as Categoria)?.nome || '-'}</TableCell>
            <TableCell className="text-right font-medium">
              {produto.preco_base.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
            </TableCell>
            <TableCell>
              <div className="flex gap-1 justify-end">
                <Button variant="ghost" size="icon" onClick={() => onEdit(produto)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(produto.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
