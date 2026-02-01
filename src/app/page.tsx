'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Categoria, Movimento, Operador, Produto } from '@/lib/supabase'
import { isAuthenticated, logout, getCurrentOperador, login } from '@/lib/auth'
import { LoginForm } from '@/components/login-form'
import { OperadorBadge, getOperadorBgLight, getOperadorColor, getOperadorColors } from '@/components/operador-badge'
import { CategorySelect } from '@/components/category-select'
import { ProductSelect } from '@/components/product-select'
import { cn } from '@/lib/utils'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { pt, fr } from 'date-fns/locale'
import * as XLSX from 'xlsx'
import { Locale, translations, excelTranslations, getStoredLocale, setStoredLocale } from '@/lib/i18n'
import { AppHeader } from '@/components/app-header'
import {
  Plus,
  Download,
  TrendingUp,
  TrendingDown,
  Wallet,
  Trash2
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

export default function Home() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)
  const [currentOperador, setCurrentOperador] = useState<Operador | null>(null)
  const [operadores, setOperadores] = useState<Operador[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [movimentos, setMovimentos] = useState<Movimento[]>([])
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'))
  const [isAddingMovimento, setIsAddingMovimento] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [locale, setLocale] = useState<Locale>('pt')
  const t = translations[locale]
  const [newMovimento, setNewMovimento] = useState({
    categoria_id: '',
    produto_id: '',
    tipo: 'receita' as 'receita' | 'gasto',
    valor: '',
    descricao: '',
    data: format(new Date(), 'yyyy-MM-dd')
  })
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [exportDateRange, setExportDateRange] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  })

  // Cor do operador atual
  const operadorColor = getOperadorColor(currentOperador?.cor)
  const operadorColors = getOperadorColors(currentOperador?.cor)

  useEffect(() => {
    setIsLoggedIn(isAuthenticated())
    setCurrentOperador(getCurrentOperador())
    setLocale(getStoredLocale())
  }, [])

  function handleLocaleChange(newLocale: Locale) {
    setLocale(newLocale)
    setStoredLocale(newLocale)
  }

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  const fetchCategorias = useCallback(async () => {
    const { data } = await supabase.from('categorias').select('*').order('tipo').order('nome')
    setCategorias(data || [])
  }, [])

  const fetchOperadores = useCallback(async () => {
    const { data } = await supabase.from('operadores').select('*').order('nome')
    setOperadores(data || [])
  }, [])

  const fetchProdutos = useCallback(async () => {
    const { data } = await supabase
      .from('produtos')
      .select('*, categoria:categorias(id, nome, tipo)')
      .eq('ativo', true)
      .order('nome')
    setProdutos(data || [])
  }, [])

  //Função para buscar movimentos na base de dados
  const fetchMovimentos = useCallback(async () => {
    const [year, month] = selectedMonth.split('-').map(Number)
    const startDate = format(startOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd')
    const endDate = format(endOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd')

    const { data } = await supabase
      .from('movimentos')
      .select(`*, categoria:categorias(id, nome, tipo), operador:operadores(id, nome, cor)`)
      .gte('data', startDate)
      .lte('data', endDate)
      .order('data', { ascending: false })

    setMovimentos(data || [])
  }, [selectedMonth])

  useEffect(() => {
    if (isLoggedIn) {
      setIsLoading(true)
      Promise.all([fetchCategorias(), fetchMovimentos(), fetchOperadores(), fetchProdutos()]).finally(() => setIsLoading(false))
    }
  }, [isLoggedIn, fetchCategorias, fetchMovimentos, fetchOperadores, fetchProdutos])

  if (isLoggedIn === null) {
    return <div className="min-h-screen bg-background" />
  }

  if (!isLoggedIn) {
    return <LoginForm
      locale={locale}
      onLocaleChange={handleLocaleChange}
      onSuccess={() => {
        setIsLoggedIn(true)
        setCurrentOperador(getCurrentOperador())
      }}
    />
  }

  function handleLogout() {
    logout()
    setIsLoggedIn(false)
    setCurrentOperador(null)
  }

  function handleOperadorChange(operadorId: string) {
    const operador = operadores.find(o => o.id === operadorId)
    if (operador) {
      login(operador)
      setCurrentOperador(operador)
    }
  }

  function toggleDarkMode() {
    const newIsDark = !isDark
    setIsDark(newIsDark)
    document.documentElement.classList.toggle('dark', newIsDark)
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light')
  }

  // Função que adiciona movimentos a base de dados
  async function addMovimento() {
    if (!newMovimento.valor) return

    const valorNumerico = parseFloat(newMovimento.valor)
    if (isNaN(valorNumerico)) {
      alert(t.valorInvalido)
      return
    }

    const { error } = await supabase.from('movimentos').insert({
      categoria_id: newMovimento.categoria_id || null,
      produto_id: newMovimento.produto_id || null,
      tipo: newMovimento.tipo,
      valor: valorNumerico,
      descricao: newMovimento.descricao || null,
      data: newMovimento.data,
      operador_id: currentOperador?.id || null
    })

    if (error) {
      alert(t.erroGuardarMovimento + ': ' + error.message)
      return
    }

    setNewMovimento({ categoria_id: '', produto_id: '', tipo: 'receita', valor: '', descricao: '', data: format(new Date(), 'yyyy-MM-dd') })
    setIsAddingMovimento(false)
    fetchMovimentos()
  }

  // Função que elimina movimentos a base de dados
  async function deleteMovimento(id: string) {
    const { error } = await supabase.from('movimentos').delete().eq('id', id)
    if (error) {
      alert(t.erroEliminarMovimento + ': ' + error.message)
      return
    }
    fetchMovimentos()
  }

  // Exportar para excel (sempre em francês)
  async function exportToExcel() {
    const { data: exportData } = await supabase
      .from('movimentos')
      .select(`*, categoria:categorias(id, nome, tipo), operador:operadores(id, nome, cor)`)
      .gte('data', exportDateRange.startDate)
      .lte('data', exportDateRange.endDate)
      .order('data', { ascending: false })

    if (!exportData || exportData.length === 0) {
      alert(t.semMovimentosPeriodo)
      return
    }

    // Excel sempre em francês
    const ex = excelTranslations
    const data = exportData.map(m => ({
      [ex.data]: format(new Date(m.data), 'dd/MM/yyyy'),
      [ex.tipo]: m.tipo === 'receita' ? ex.receita : ex.gasto,
      [ex.categoria]: (m.categoria as Categoria)?.nome || '-',
      [ex.operador]: (m.operador as Operador)?.nome || '-',
      [ex.descricao]: m.descricao || '-',
      [ex.valor]: m.valor
    }))

    const receitas = exportData.filter(m => m.tipo === 'receita').reduce((sum, m) => sum + m.valor, 0)
    const gastos = exportData.filter(m => m.tipo === 'gasto').reduce((sum, m) => sum + m.valor, 0)
    data.push({} as typeof data[0])
    data.push({ [ex.data]: ex.resumo, [ex.tipo]: '', [ex.categoria]: '', [ex.operador]: '', [ex.descricao]: '', [ex.valor]: 0 })
    data.push({ [ex.data]: ex.totalReceitas, [ex.tipo]: '', [ex.categoria]: '', [ex.operador]: '', [ex.descricao]: '', [ex.valor]: receitas })
    data.push({ [ex.data]: ex.totalGastos, [ex.tipo]: '', [ex.categoria]: '', [ex.operador]: '', [ex.descricao]: '', [ex.valor]: gastos })
    data.push({ [ex.data]: ex.saldo, [ex.tipo]: '', [ex.categoria]: '', [ex.operador]: '', [ex.descricao]: '', [ex.valor]: receitas - gastos })
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Mouvements')
    const startFormatted = format(new Date(exportDateRange.startDate), 'dd-MM-yyyy')
    const endFormatted = format(new Date(exportDateRange.endDate), 'dd-MM-yyyy')
    XLSX.writeFile(wb, `finances_${startFormatted}_a_${endFormatted}.xlsx`)
    setIsExportDialogOpen(false)
  }

  const totalReceitas = movimentos.filter(m => m.tipo === 'receita').reduce((sum, m) => sum + m.valor, 0)
  const totalGastos = movimentos.filter(m => m.tipo === 'gasto').reduce((sum, m) => sum + m.valor, 0)
  const saldo = totalReceitas - totalGastos

  const dateLocale = locale === 'pt' ? pt : fr
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const now = new Date()
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    return { value: format(date, 'yyyy-MM'), label: format(date, 'MMMM yyyy', { locale: dateLocale }) }
  })

  const produtosReceita = produtos.filter(p => p.tipo === 'receita')
  const produtosGasto = produtos.filter(p => p.tipo === 'gasto')

  function handleProdutoSelect(produtoId: string) {
    const produto = produtos.find(p => p.id === produtoId)
    if (produto) {
      setNewMovimento({
        ...newMovimento,
        produto_id: produtoId,
        valor: produto.preco_base.toString(),
        categoria_id: produto.categoria_id || '',
        descricao: produto.nome + (produto.descricao ? ` - ${produto.descricao}` : '')
      })
    }
  }

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <AppHeader
          locale={locale}
          onLocaleChange={handleLocaleChange}
          isDark={isDark}
          onToggleDark={toggleDarkMode}
          currentOperador={currentOperador}
          operadores={operadores}
          onOperadorChange={handleOperadorChange}
          currentPage="home"
        />

        {/* Filter */}
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            {monthOptions.map(opt => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}
          </SelectContent>
        </Select>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t.receitas}</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-32" /> : (
                <p className="text-2xl font-bold text-green-500">{totalReceitas.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t.gastos}</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-32" /> : (
                <p className="text-2xl font-bold text-red-500">{totalGastos.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t.saldo}</CardTitle>
              <Wallet className="h-4 w-4" style={{ color: operadorColor }} />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-32" /> : (
                <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-green-500' : 'text-red-500'}`}>{saldo.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Dialog open={isAddingMovimento} onOpenChange={setIsAddingMovimento}>
            <DialogTrigger asChild>
              <Button style={{ backgroundColor: operadorColor }}>
                <Plus className="h-4 w-4 mr-2" />{t.addMovimento}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{t.novoMovimento}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t.tipo}</Label>
                    <Select value={newMovimento.tipo} onValueChange={(v: 'receita' | 'gasto') => setNewMovimento({ ...newMovimento, tipo: v, categoria_id: '', produto_id: '' })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="receita">{t.receita}</SelectItem>
                        <SelectItem value="gasto">{t.gasto}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t.data}</Label>
                    <Input type="date" value={newMovimento.data} onChange={e => setNewMovimento({ ...newMovimento, data: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t.produtoServicoCatalogo}</Label>
                  <ProductSelect
                    value={newMovimento.produto_id}
                    onValueChange={(prodId: string, preco?: number) => {
                      if (!prodId) {
                        setNewMovimento({ ...newMovimento, produto_id: '' })
                        return
                      }
                      const produto = produtos.find(p => p.id === prodId)
                      if (produto) {
                        // Produto existente do catálogo - preenche tudo
                        handleProdutoSelect(prodId)
                      } else if (preco) {
                        // Produto criado inline - preenche ID e preço
                        setNewMovimento({
                          ...newMovimento,
                          produto_id: prodId,
                          valor: preco.toString()
                        })
                      } else {
                        setNewMovimento({ ...newMovimento, produto_id: prodId })
                      }
                    }}
                    tipo={newMovimento.tipo}
                    produtos={produtos}
                    onProductCreated={fetchProdutos}
                    operadorColor={operadorColor}
                    locale={locale}
                    defaultPrice={newMovimento.valor}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t.categoria}</Label>
                  <CategorySelect
                    value={newMovimento.categoria_id}
                    onValueChange={v => setNewMovimento({ ...newMovimento, categoria_id: v === 'none' ? '' : v })}
                    tipo={newMovimento.tipo}
                    categorias={categorias}
                    onCategoryCreated={fetchCategorias}
                    operadorColor={operadorColor}
                    locale={locale}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t.valorEur}</Label>
                  <Input type="number" step="0.01" min="0" placeholder="0.00" value={newMovimento.valor} onChange={e => setNewMovimento({ ...newMovimento, valor: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{t.descricao}</Label>
                  <Input placeholder={t.opcional} value={newMovimento.descricao} onChange={e => setNewMovimento({ ...newMovimento, descricao: e.target.value })} />
                </div>
                <Button onClick={addMovimento} className="w-full" style={{ backgroundColor: operadorColor }}>{t.guardar}</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />{t.exportarExcel}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{t.exportarMovimentos}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">{t.selecionarIntervalo}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t.dataInicio}</Label>
                    <Input
                      type="date"
                      value={exportDateRange.startDate}
                      onChange={e => setExportDateRange({ ...exportDateRange, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t.dataFim}</Label>
                    <Input
                      type="date"
                      value={exportDateRange.endDate}
                      onChange={e => setExportDateRange({ ...exportDateRange, endDate: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={exportToExcel} className="w-full" style={{ backgroundColor: operadorColor }}>
                  <Download className="h-4 w-4 mr-2" />{t.exportar}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Movements Table */}
        <Card>
          <CardHeader><CardTitle>{t.movimentos}</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32 flex-1" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : movimentos.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">{t.semMovimentos}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.data}</TableHead>
                    <TableHead>{t.tipo}</TableHead>
                    <TableHead>{t.categoria}</TableHead>
                    <TableHead>{t.operador}</TableHead>
                    <TableHead>{t.descricao}</TableHead>
                    <TableHead className="text-right">{t.valor}</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movimentos.map(mov => (
                    <TableRow key={mov.id}>
                      <TableCell>{format(new Date(mov.data), 'dd/MM/yyyy')}</TableCell>
                      <TableCell><Badge variant={mov.tipo === 'receita' ? 'default' : 'destructive'}>{mov.tipo === 'receita' ? t.receita : t.gasto}</Badge></TableCell>
                      <TableCell>{(mov.categoria as Categoria)?.nome || '-'}</TableCell>
                      <TableCell><OperadorBadge operador={mov.operador as Operador} size="sm" /></TableCell>
                      <TableCell>{mov.descricao || '-'}</TableCell>
                      <TableCell className={`text-right font-medium ${mov.tipo === 'receita' ? 'text-green-500' : 'text-red-500'}`}>{mov.valor.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</TableCell>
                      <TableCell><Button variant="ghost" size="icon" onClick={() => deleteMovimento(mov.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
