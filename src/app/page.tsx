'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Categoria, Movimento, Operador, Produto } from '@/lib/supabase'
import { isAuthenticated, logout, getCurrentOperador, login } from '@/lib/auth'
import { LoginForm } from '@/components/login-form'
import { OperadorBadge, getOperadorBgLight, getOperadorColor, getOperadorColors } from '@/components/operador-badge'
import { MovimentoDialog } from '@/components/movimento-dialog'
import { cn } from '@/lib/utils'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { pt, fr } from 'date-fns/locale'
import ExcelJS from 'exceljs'
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
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [exportDateRange, setExportDateRange] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  })
  const [filterTipo, setFilterTipo] = useState<'todos' | 'receita' | 'gasto'>('todos')
  const [filterOperador, setFilterOperador] = useState<string>('todos')
  const [customDateRange, setCustomDateRange] = useState({
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
    if (!currentOperador?.id) return
    const { data } = await supabase
      .from('produtos')
      .select('*, categoria:categorias(id, nome, tipo)')
      .eq('ativo', true)
      .eq('operador_id', currentOperador.id)
      .order('nome')
    setProdutos(data || [])
  }, [currentOperador?.id])

  //Função para buscar movimentos na base de dados
  const fetchMovimentos = useCallback(async () => {
    let startDate: string
    let endDate: string

    if (selectedMonth === 'custom') {
      startDate = customDateRange.startDate
      endDate = customDateRange.endDate
    } else {
      const [year, month] = selectedMonth.split('-').map(Number)
      startDate = format(startOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd')
      endDate = format(endOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd')
    }

    const { data } = await supabase
      .from('movimentos')
      .select(`*, categoria:categorias(id, nome, tipo), operador:operadores(id, nome, cor)`)
      .gte('data', startDate)
      .lte('data', endDate)
      .order('data', { ascending: false })

    setMovimentos(data || [])
  }, [selectedMonth, customDateRange])

  useEffect(() => {
    if (isLoggedIn) {
      setIsLoading(true)
      Promise.all([fetchCategorias(), fetchMovimentos(), fetchOperadores(), fetchProdutos()]).finally(() => setIsLoading(false))
    }
  }, [isLoggedIn, fetchCategorias, fetchMovimentos, fetchOperadores, fetchProdutos])

  // Filtrar movimentos (deve estar antes dos returns condicionais)
  const movimentosFiltrados = useMemo(() => {
    return movimentos.filter(m => {
      if (filterTipo !== 'todos' && m.tipo !== filterTipo) return false
      if (filterOperador !== 'todos' && (m.operador as Operador)?.id !== filterOperador) return false
      return true
    })
  }, [movimentos, filterTipo, filterOperador])

  const totalReceitas = movimentos.filter(m => m.tipo === 'receita').reduce((sum, m) => sum + m.valor, 0)
  const totalGastos = movimentos.filter(m => m.tipo === 'gasto').reduce((sum, m) => sum + m.valor, 0)
  const saldo = totalReceitas - totalGastos

  const dateLocale = locale === 'pt' ? pt : fr
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const now = new Date()
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    return { value: format(date, 'yyyy-MM'), label: format(date, 'MMMM yyyy', { locale: dateLocale }) }
  })

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
  async function handleMovimentoCreated(produto: Produto, tipo: 'receita' | 'gasto', valor: number) {
    const { error } = await supabase.from('movimentos').insert({
      categoria_id: produto.categoria_id || null,
      produto_id: produto.id,
      tipo,
      valor,
      descricao: produto.nome,
      data: format(new Date(), 'yyyy-MM-dd'),
      operador_id: currentOperador?.id || null
    })

    if (error) {
      alert(t.erroGuardarMovimento + ': ' + error.message)
      return
    }

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

  // Exportar para excel (sempre em francês) - documento profissional para contabilidade
  async function exportToExcel() {
    const { data: exportData } = await supabase
      .from('movimentos')
      .select(`*, categoria:categorias(id, nome, tipo), operador:operadores(id, nome, cor)`)
      .gte('data', exportDateRange.startDate)
      .lte('data', exportDateRange.endDate)
      .order('data', { ascending: true })

    if (!exportData || exportData.length === 0) {
      alert(t.semMovimentosPeriodo)
      return
    }

    const ex = excelTranslations
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Finex'
    workbook.created = new Date()

    const worksheet = workbook.addWorksheet('Rapport Financier', {
      views: [{ state: 'frozen', ySplit: 4 }]
    })

    // Cores
    const greenFill: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } }
    const redFill: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEAEA' } }
    const headerFill: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4A5568' } }
    const summaryFill: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7FAFC' } }

    const borderStyle: Partial<ExcelJS.Borders> = {
      top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
    }

    // Título
    const startFormatted = format(new Date(exportDateRange.startDate), 'dd/MM/yyyy')
    const endFormatted = format(new Date(exportDateRange.endDate), 'dd/MM/yyyy')

    worksheet.mergeCells('A1:F1')
    const titleCell = worksheet.getCell('A1')
    titleCell.value = 'RAPPORT FINANCIER'
    titleCell.font = { bold: true, size: 16, color: { argb: 'FF1A202C' } }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getRow(1).height = 30

    worksheet.mergeCells('A2:F2')
    const periodCell = worksheet.getCell('A2')
    periodCell.value = `Période: ${startFormatted} - ${endFormatted}`
    periodCell.font = { size: 11, color: { argb: 'FF718096' } }
    periodCell.alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getRow(2).height = 20

    // Linha vazia
    worksheet.getRow(3).height = 10

    // Cabeçalhos
    const headers = [ex.data, ex.tipo, ex.categoria, ex.operador, ex.descricao, ex.valor]
    const headerRow = worksheet.getRow(4)
    headers.forEach((header, i) => {
      const cell = headerRow.getCell(i + 1)
      cell.value = header
      cell.fill = headerFill
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
      cell.alignment = { horizontal: i === 5 ? 'right' : 'left', vertical: 'middle' }
      cell.border = borderStyle
    })
    headerRow.height = 25

    // Dados
    let rowIndex = 5
    exportData.forEach(m => {
      const row = worksheet.getRow(rowIndex)
      const isReceita = m.tipo === 'receita'

      row.getCell(1).value = format(new Date(m.data), 'dd/MM/yyyy')
      row.getCell(2).value = isReceita ? ex.receita : ex.gasto
      row.getCell(3).value = (m.categoria as Categoria)?.nome || '-'
      row.getCell(4).value = (m.operador as Operador)?.nome || '-'
      row.getCell(5).value = m.descricao || '-'
      row.getCell(6).value = m.valor
      row.getCell(6).numFmt = '#,##0.00 €'

      // Aplicar estilos
      for (let i = 1; i <= 6; i++) {
        const cell = row.getCell(i)
        cell.fill = isReceita ? greenFill : redFill
        cell.border = borderStyle
        cell.alignment = { horizontal: i === 6 ? 'right' : 'left', vertical: 'middle' }
        if (i === 2) {
          cell.font = { bold: true, color: { argb: isReceita ? 'FF22C55E' : 'FFEF4444' } }
        }
        if (i === 6) {
          cell.font = { bold: true, color: { argb: isReceita ? 'FF22C55E' : 'FFEF4444' } }
        }
      }
      row.height = 22
      rowIndex++
    })

    // Linha vazia antes do resumo
    rowIndex++

    // Resumo
    const receitas = exportData.filter(m => m.tipo === 'receita').reduce((sum, m) => sum + m.valor, 0)
    const gastos = exportData.filter(m => m.tipo === 'gasto').reduce((sum, m) => sum + m.valor, 0)
    const saldo = receitas - gastos

    const summaryData = [
      { label: ex.totalReceitas, value: receitas, color: 'FF22C55E' },
      { label: ex.totalGastos, value: gastos, color: 'FFEF4444' },
      { label: ex.saldo, value: saldo, color: saldo >= 0 ? 'FF22C55E' : 'FFEF4444' }
    ]

    summaryData.forEach(item => {
      const row = worksheet.getRow(rowIndex)
      worksheet.mergeCells(`A${rowIndex}:E${rowIndex}`)

      const labelCell = row.getCell(1)
      labelCell.value = item.label
      labelCell.font = { bold: true, size: 11 }
      labelCell.alignment = { horizontal: 'right', vertical: 'middle' }
      labelCell.fill = summaryFill
      labelCell.border = borderStyle

      const valueCell = row.getCell(6)
      valueCell.value = item.value
      valueCell.numFmt = '#,##0.00 €'
      valueCell.font = { bold: true, size: 12, color: { argb: item.color } }
      valueCell.alignment = { horizontal: 'right', vertical: 'middle' }
      valueCell.fill = summaryFill
      valueCell.border = borderStyle

      row.height = 25
      rowIndex++
    })

    // Largura das colunas
    worksheet.columns = [
      { width: 12 },  // Data
      { width: 12 },  // Tipo
      { width: 20 },  // Categoria
      { width: 15 },  // Operador
      { width: 35 },  // Descrição
      { width: 15 },  // Valor
    ]

    // Gerar e baixar arquivo
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `rapport_financier_${format(new Date(exportDateRange.startDate), 'dd-MM-yyyy')}_a_${format(new Date(exportDateRange.endDate), 'dd-MM-yyyy')}.xlsx`
    link.click()
    URL.revokeObjectURL(url)
    setIsExportDialogOpen(false)
  }

  return (
    <main className="min-h-screen bg-background p-4 md:p-8 overflow-x-hidden">
      <div className="max-w-5xl mx-auto space-y-6 overflow-hidden">
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

        {/* Date Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-full sm:w-52"><SelectValue /></SelectTrigger>
            <SelectContent>
              {monthOptions.map(opt => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}
              <SelectItem value="custom">{t.intervaloPersonalizado}</SelectItem>
            </SelectContent>
          </Select>

          {selectedMonth === 'custom' && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Label className="text-sm text-muted-foreground whitespace-nowrap">{t.de}:</Label>
                <Input
                  type="date"
                  value={customDateRange.startDate}
                  onChange={e => setCustomDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="flex-1 sm:w-36 h-9"
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Label className="text-sm text-muted-foreground whitespace-nowrap">{t.ate}:</Label>
                <Input
                  type="date"
                  value={customDateRange.endDate}
                  onChange={e => setCustomDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="flex-1 sm:w-36 h-9"
                />
              </div>
            </div>
          )}
        </div>

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
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={() => setIsAddingMovimento(true)} style={{ backgroundColor: operadorColor }} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />{t.addMovimento}
          </Button>

          <MovimentoDialog
            open={isAddingMovimento}
            onOpenChange={setIsAddingMovimento}
            produtos={produtos}
            operadorId={currentOperador?.id || ''}
            operadorCor={currentOperador?.cor}
            locale={locale}
            onMovimentoCreated={handleMovimentoCreated}
            onProdutoCreated={fetchProdutos}
          />
          <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
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
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>{t.movimentos}</CardTitle>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground whitespace-nowrap">{t.tipo}:</Label>
                <Select value={filterTipo} onValueChange={(v) => setFilterTipo(v as 'todos' | 'receita' | 'gasto')}>
                  <SelectTrigger
                    className="flex-1 sm:w-32 h-8 text-sm"
                    style={filterTipo !== 'todos' ? { borderColor: operadorColor } : undefined}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">{t.todos}</SelectItem>
                    <SelectItem value="receita">{t.receita}</SelectItem>
                    <SelectItem value="gasto">{t.gasto}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground whitespace-nowrap">{t.operador}:</Label>
                <Select value={filterOperador} onValueChange={setFilterOperador}>
                  <SelectTrigger
                    className="flex-1 sm:w-40 h-8 text-sm"
                    style={filterOperador !== 'todos' ? { borderColor: getOperadorColor(operadores.find(o => o.id === filterOperador)?.cor) } : undefined}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">{t.todos}</SelectItem>
                    {operadores.map(op => (
                      <SelectItem key={op.id} value={op.id}>{op.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
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
            ) : movimentosFiltrados.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">{t.semMovimentos}</p>
            ) : (
              <>
                {/* Mobile: Cards */}
                <div className="space-y-3 md:hidden">
                  {movimentosFiltrados.map(mov => (
                    <div key={mov.id} className="p-4 rounded-lg border border-border bg-card">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={mov.tipo === 'receita' ? 'default' : 'destructive'} className="shrink-0">
                              {mov.tipo === 'receita' ? t.receita : t.gasto}
                            </Badge>
                            <span className="text-sm text-muted-foreground">{format(new Date(mov.data), 'dd/MM/yyyy')}</span>
                          </div>
                          <p className="font-medium mt-2 truncate">{mov.descricao || '-'}</p>
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <span>{(mov.categoria as Categoria)?.nome || '-'}</span>
                            <span>•</span>
                            <OperadorBadge operador={mov.operador as Operador} size="sm" />
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`font-semibold ${mov.tipo === 'receita' ? 'text-green-500' : 'text-red-500'}`}>
                            {mov.valor.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                          </span>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteMovimento(mov.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop: Table */}
                <div className="hidden md:block overflow-x-auto">
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
                      {movimentosFiltrados.map(mov => (
                        <TableRow key={mov.id}>
                          <TableCell className="whitespace-nowrap">{format(new Date(mov.data), 'dd/MM/yyyy')}</TableCell>
                          <TableCell><Badge variant={mov.tipo === 'receita' ? 'default' : 'destructive'}>{mov.tipo === 'receita' ? t.receita : t.gasto}</Badge></TableCell>
                          <TableCell>{(mov.categoria as Categoria)?.nome || '-'}</TableCell>
                          <TableCell><OperadorBadge operador={mov.operador as Operador} size="sm" /></TableCell>
                          <TableCell className="max-w-[200px] truncate">{mov.descricao || '-'}</TableCell>
                          <TableCell className={`text-right font-medium whitespace-nowrap ${mov.tipo === 'receita' ? 'text-green-500' : 'text-red-500'}`}>{mov.valor.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</TableCell>
                          <TableCell><Button variant="ghost" size="icon" onClick={() => deleteMovimento(mov.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
