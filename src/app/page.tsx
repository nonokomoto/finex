'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase, Categoria, Movimento } from '@/lib/supabase'
import { isAuthenticated, logout } from '@/lib/auth'
import { LoginForm } from '@/components/login-form'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { pt } from 'date-fns/locale'
import * as XLSX from 'xlsx'
import {
  Plus,
  Download,
  TrendingUp,
  TrendingDown,
  Wallet,
  Trash2,
  Settings,
  Moon,
  Sun,
  LogOut
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [movimentos, setMovimentos] = useState<Movimento[]>([])
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'))
  const [isAddingMovimento, setIsAddingMovimento] = useState(false)
  const [isManagingCategorias, setIsManagingCategorias] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [newCategoria, setNewCategoria] = useState({ nome: '', tipo: 'gasto' as 'receita' | 'gasto' })
  const [newMovimento, setNewMovimento] = useState({
    categoria_id: '',
    tipo: 'gasto' as 'receita' | 'gasto',
    valor: '',
    descricao: '',
    data: format(new Date(), 'yyyy-MM-dd')
  })

  useEffect(() => {
    setIsLoggedIn(isAuthenticated())
  }, [])

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  const fetchCategorias = useCallback(async () => {
    const { data } = await supabase.from('categorias').select('*').order('tipo').order('nome')
    setCategorias(data || [])
  }, [])

  const fetchMovimentos = useCallback(async () => {
    const [year, month] = selectedMonth.split('-').map(Number)
    const startDate = format(startOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd')
    const endDate = format(endOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd')

    const { data } = await supabase
      .from('movimentos')
      .select(`*, categoria:categorias(id, nome, tipo)`)
      .gte('data', startDate)
      .lte('data', endDate)
      .order('data', { ascending: false })

    setMovimentos(data || [])
  }, [selectedMonth])

  useEffect(() => {
    if (isLoggedIn) {
      setIsLoading(true)
      Promise.all([fetchCategorias(), fetchMovimentos()]).finally(() => setIsLoading(false))
    }
  }, [isLoggedIn, fetchCategorias, fetchMovimentos])

  if (isLoggedIn === null) {
    return <div className="min-h-screen bg-background" />
  }

  if (!isLoggedIn) {
    return <LoginForm onSuccess={() => setIsLoggedIn(true)} />
  }

  function handleLogout() {
    logout()
    setIsLoggedIn(false)
  }

  function toggleDarkMode() {
    const newIsDark = !isDark
    setIsDark(newIsDark)
    document.documentElement.classList.toggle('dark', newIsDark)
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light')
  }

  async function addMovimento() {
    if (!newMovimento.valor) return
    await supabase.from('movimentos').insert({
      categoria_id: newMovimento.categoria_id || null,
      tipo: newMovimento.tipo,
      valor: parseFloat(newMovimento.valor),
      descricao: newMovimento.descricao || null,
      data: newMovimento.data
    })
    setNewMovimento({ categoria_id: '', tipo: 'gasto', valor: '', descricao: '', data: format(new Date(), 'yyyy-MM-dd') })
    setIsAddingMovimento(false)
    fetchMovimentos()
  }

  async function deleteMovimento(id: string) {
    await supabase.from('movimentos').delete().eq('id', id)
    fetchMovimentos()
  }

  async function addCategoria() {
    if (!newCategoria.nome) return
    await supabase.from('categorias').insert(newCategoria)
    setNewCategoria({ nome: '', tipo: 'gasto' })
    fetchCategorias()
  }

  async function deleteCategoria(id: string) {
    await supabase.from('categorias').delete().eq('id', id)
    fetchCategorias()
  }

  function exportToExcel() {
    const data = movimentos.map(m => ({
      'Data': format(new Date(m.data), 'dd/MM/yyyy'),
      'Tipo': m.tipo === 'receita' ? 'Receita' : 'Gasto',
      'Categoria': (m.categoria as Categoria)?.nome || '-',
      'Descrição': m.descricao || '-',
      'Valor': m.valor
    }))
    const receitas = movimentos.filter(m => m.tipo === 'receita').reduce((sum, m) => sum + m.valor, 0)
    const gastos = movimentos.filter(m => m.tipo === 'gasto').reduce((sum, m) => sum + m.valor, 0)
    data.push({} as typeof data[0])
    data.push({ 'Data': 'RESUMO', 'Tipo': '', 'Categoria': '', 'Descrição': '', 'Valor': 0 })
    data.push({ 'Data': 'Total Receitas', 'Tipo': '', 'Categoria': '', 'Descrição': '', 'Valor': receitas })
    data.push({ 'Data': 'Total Gastos', 'Tipo': '', 'Categoria': '', 'Descrição': '', 'Valor': gastos })
    data.push({ 'Data': 'Saldo', 'Tipo': '', 'Categoria': '', 'Descrição': '', 'Valor': receitas - gastos })
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Movimentos')
    const [year, month] = selectedMonth.split('-')
    const monthName = format(new Date(parseInt(year), parseInt(month) - 1), 'MMMM', { locale: pt })
    XLSX.writeFile(wb, `financas_${monthName}_${year}.xlsx`)
  }

  const totalReceitas = movimentos.filter(m => m.tipo === 'receita').reduce((sum, m) => sum + m.valor, 0)
  const totalGastos = movimentos.filter(m => m.tipo === 'gasto').reduce((sum, m) => sum + m.valor, 0)
  const saldo = totalReceitas - totalGastos

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    return { value: format(date, 'yyyy-MM'), label: format(date, 'MMMM yyyy', { locale: pt }) }
  })

  const categoriasReceita = categorias.filter(c => c.tipo === 'receita')
  const categoriasGasto = categorias.filter(c => c.tipo === 'gasto')

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="0" y="0" width="32" height="32" rx="8" fill="#6366f1"/>
              <path d="M10 22V12M10 12H20M10 12L20 22" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h1 className="text-2xl font-bold">Fin<span className="text-primary">ex</span></h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={toggleDarkMode}>
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Dialog open={isManagingCategorias} onOpenChange={setIsManagingCategorias}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon"><Settings className="h-4 w-4" /></Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Gerir Categorias</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input placeholder="Nome da categoria" value={newCategoria.nome} onChange={e => setNewCategoria({ ...newCategoria, nome: e.target.value })} />
                    <Select value={newCategoria.tipo} onValueChange={(v: 'receita' | 'gasto') => setNewCategoria({ ...newCategoria, tipo: v })}>
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="receita">Receita</SelectItem>
                        <SelectItem value="gasto">Gasto</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={addCategoria}><Plus className="h-4 w-4" /></Button>
                  </div>
                  <Tabs defaultValue="gastos">
                    <TabsList className="w-full">
                      <TabsTrigger value="gastos" className="flex-1">Gastos</TabsTrigger>
                      <TabsTrigger value="receitas" className="flex-1">Receitas</TabsTrigger>
                    </TabsList>
                    <TabsContent value="gastos" className="space-y-2 mt-2">
                      {categoriasGasto.map(cat => (
                        <div key={cat.id} className="flex items-center justify-between p-2 bg-muted rounded">
                          <span>{cat.nome}</span>
                          <Button variant="ghost" size="icon" onClick={() => deleteCategoria(cat.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      ))}
                      {categoriasGasto.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">Sem categorias de gasto</p>}
                    </TabsContent>
                    <TabsContent value="receitas" className="space-y-2 mt-2">
                      {categoriasReceita.map(cat => (
                        <div key={cat.id} className="flex items-center justify-between p-2 bg-muted rounded">
                          <span>{cat.nome}</span>
                          <Button variant="ghost" size="icon" onClick={() => deleteCategoria(cat.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      ))}
                      {categoriasReceita.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">Sem categorias de receita</p>}
                    </TabsContent>
                  </Tabs>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="icon" onClick={handleLogout} title="Sair"><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>

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
              <CardTitle className="text-sm font-medium text-muted-foreground">Receitas</CardTitle>
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
              <CardTitle className="text-sm font-medium text-muted-foreground">Gastos</CardTitle>
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
              <CardTitle className="text-sm font-medium text-muted-foreground">Saldo</CardTitle>
              <Wallet className="h-4 w-4 text-primary" />
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
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Adicionar Movimento</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo Movimento</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select value={newMovimento.tipo} onValueChange={(v: 'receita' | 'gasto') => setNewMovimento({ ...newMovimento, tipo: v, categoria_id: '' })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="receita">Receita</SelectItem>
                        <SelectItem value="gasto">Gasto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Data</Label>
                    <Input type="date" value={newMovimento.data} onChange={e => setNewMovimento({ ...newMovimento, data: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={newMovimento.categoria_id} onValueChange={v => setNewMovimento({ ...newMovimento, categoria_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                    <SelectContent>
                      {(newMovimento.tipo === 'receita' ? categoriasReceita : categoriasGasto).map(cat => (<SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Valor (EUR)</Label>
                  <Input type="number" step="0.01" min="0" placeholder="0.00" value={newMovimento.valor} onChange={e => setNewMovimento({ ...newMovimento, valor: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Descricao</Label>
                  <Input placeholder="Opcional" value={newMovimento.descricao} onChange={e => setNewMovimento({ ...newMovimento, descricao: e.target.value })} />
                </div>
                <Button onClick={addMovimento} className="w-full">Guardar</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={exportToExcel}><Download className="h-4 w-4 mr-2" />Exportar Excel</Button>
        </div>

        {/* Movements Table */}
        <Card>
          <CardHeader><CardTitle>Movimentos</CardTitle></CardHeader>
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
              <p className="text-center text-muted-foreground py-8">Sem movimentos neste periodo</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Descricao</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movimentos.map(mov => (
                    <TableRow key={mov.id}>
                      <TableCell>{format(new Date(mov.data), 'dd/MM/yyyy')}</TableCell>
                      <TableCell><Badge variant={mov.tipo === 'receita' ? 'default' : 'destructive'}>{mov.tipo === 'receita' ? 'Receita' : 'Gasto'}</Badge></TableCell>
                      <TableCell>{(mov.categoria as Categoria)?.nome || '-'}</TableCell>
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
