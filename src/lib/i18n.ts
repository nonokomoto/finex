export type Locale = 'pt' | 'fr'

export const translations = {
  pt: {
    // Header
    logout: 'Sair',
    darkMode: 'Modo escuro',
    lightMode: 'Modo claro',

    // Dashboard
    receitas: 'Receitas',
    gastos: 'Gastos',
    saldo: 'Saldo',

    // Movimentos
    movimentos: 'Movimentos',
    addMovimento: 'Adicionar Movimento',
    novoMovimento: 'Novo Movimento',
    semMovimentos: 'Sem movimentos neste período',
    tipo: 'Tipo',
    receita: 'Receita',
    gasto: 'Gasto',
    data: 'Data',
    categoria: 'Categoria',
    operador: 'Operador',
    descricao: 'Descrição',
    valor: 'Valor',
    valorEur: 'Valor (EUR)',
    opcional: 'Opcional',
    guardar: 'Guardar',
    cancelar: 'Cancelar',
    eliminar: 'Eliminar',

    // Categorias
    gerirCategorias: 'Gerir Categorias',
    nomeDaCategoria: 'Nome da categoria',
    semCategoriasReceita: 'Sem categorias de receita',
    semCategoriasGasto: 'Sem categorias de gasto',
    erroAdicionarCategoria: 'Erro ao adicionar categoria',
    erroEliminarCategoria: 'Erro ao eliminar categoria',
    nenhuma: 'Nenhuma',
    novaCategoria: 'Nova categoria...',
    criarCategoria: 'Criar',

    // Catálogo
    catalogo: 'Catálogo de Produtos/Serviços',
    novoProduto: 'Novo produto...',
    precoDoProduto: 'Preço (€)',
    pesquisarProdutos: 'Pesquisar produtos...',
    nome: 'Nome',
    codigo: 'Código',
    precoBase: 'Preço Base',
    precoBaseEur: 'Preço Base (EUR)',
    semProdutos: 'Sem produtos nesta categoria',
    aCarregar: 'A carregar...',
    guardarAlteracoes: 'Guardar Alterações',
    adicionarProduto: 'Adicionar Produto',
    produtoServicoCatalogo: 'Produto/Serviço do Catálogo',
    selecionarCatalogo: 'Selecionar do catálogo (opcional)',
    receitaServicoVenda: 'Receita (Serviço/Venda)',
    gastoCompraDespesa: 'Gasto (Compra/Despesa)',
    nomePrecoObrigatorios: 'Nome e preço são obrigatórios',
    precoInvalido: 'Preço inválido',
    erroAtualizarProduto: 'Erro ao atualizar produto',
    erroCriarProduto: 'Erro ao criar produto',
    erroEliminarProduto: 'Erro ao eliminar produto',
    descricaoOpcional: 'Descrição opcional',

    // Export
    exportarExcel: 'Exportar Excel',
    exportarMovimentos: 'Exportar Movimentos',
    selecionarIntervalo: 'Selecione o intervalo de datas para exportar:',
    dataInicio: 'Data Início',
    dataFim: 'Data Fim',
    exportar: 'Exportar',
    semMovimentosPeriodo: 'Sem movimentos neste período',

    // Login
    entrar: 'Entrar',
    selecionarOperador: 'Selecionar operador',
    password: 'Password',
    credenciaisInvalidas: 'Credenciais inválidas',
    erroLogin: 'Erro ao fazer login',

    // Erros
    valorInvalido: 'Valor inválido',
    erroGuardarMovimento: 'Erro ao guardar movimento',
    erroEliminarMovimento: 'Erro ao eliminar movimento',

    // Filtros
    todos: 'Todos',
    filtrarPorTipo: 'Filtrar por tipo',
    filtrarPorOperador: 'Filtrar por operador',
    intervaloPersonalizado: 'Intervalo personalizado',
    de: 'De',
    ate: 'Até',

    // Dashboard diário
    mes: 'Mês',
    totalMes: 'Total mês',
    dia: 'Dia',
    verMais: 'Ver mais',
  },
  fr: {
    // Header
    logout: 'Déconnexion',
    darkMode: 'Mode sombre',
    lightMode: 'Mode clair',

    // Dashboard
    receitas: 'Recettes',
    gastos: 'Dépenses',
    saldo: 'Solde',

    // Movimentos
    movimentos: 'Mouvements',
    addMovimento: 'Ajouter Mouvement',
    novoMovimento: 'Nouveau Mouvement',
    semMovimentos: 'Aucun mouvement pour cette période',
    tipo: 'Type',
    receita: 'Recette',
    gasto: 'Dépense',
    data: 'Date',
    categoria: 'Catégorie',
    operador: 'Opérateur',
    descricao: 'Description',
    valor: 'Valeur',
    valorEur: 'Valeur (EUR)',
    opcional: 'Optionnel',
    guardar: 'Enregistrer',
    cancelar: 'Annuler',
    eliminar: 'Supprimer',

    // Categorias
    gerirCategorias: 'Gérer Catégories',
    nomeDaCategoria: 'Nom de la catégorie',
    semCategoriasReceita: 'Aucune catégorie de recette',
    semCategoriasGasto: 'Aucune catégorie de dépense',
    erroAdicionarCategoria: 'Erreur lors de l\'ajout de la catégorie',
    erroEliminarCategoria: 'Erreur lors de la suppression de la catégorie',
    nenhuma: 'Aucune',
    novaCategoria: 'Nouvelle catégorie...',
    criarCategoria: 'Créer',

    // Catálogo
    catalogo: 'Catalogue de Produits/Services',
    novoProduto: 'Nouveau produit...',
    precoDoProduto: 'Prix (€)',
    pesquisarProdutos: 'Rechercher des produits...',
    nome: 'Nom',
    codigo: 'Code',
    precoBase: 'Prix de Base',
    precoBaseEur: 'Prix de Base (EUR)',
    semProdutos: 'Aucun produit dans cette catégorie',
    aCarregar: 'Chargement...',
    guardarAlteracoes: 'Enregistrer les modifications',
    adicionarProduto: 'Ajouter Produit',
    produtoServicoCatalogo: 'Produit/Service du Catalogue',
    selecionarCatalogo: 'Sélectionner du catalogue (optionnel)',
    receitaServicoVenda: 'Recette (Service/Vente)',
    gastoCompraDespesa: 'Dépense (Achat/Charge)',
    nomePrecoObrigatorios: 'Le nom et le prix sont obligatoires',
    precoInvalido: 'Prix invalide',
    erroAtualizarProduto: 'Erreur lors de la mise à jour du produit',
    erroCriarProduto: 'Erreur lors de la création du produit',
    erroEliminarProduto: 'Erreur lors de la suppression du produit',
    descricaoOpcional: 'Description optionnelle',

    // Export
    exportarExcel: 'Exporter Excel',
    exportarMovimentos: 'Exporter Mouvements',
    selecionarIntervalo: 'Sélectionnez la période à exporter:',
    dataInicio: 'Date de début',
    dataFim: 'Date de fin',
    exportar: 'Exporter',
    semMovimentosPeriodo: 'Aucun mouvement pour cette période',

    // Login
    entrar: 'Connexion',
    selecionarOperador: 'Sélectionner opérateur',
    password: 'Mot de passe',
    credenciaisInvalidas: 'Identifiants invalides',
    erroLogin: 'Erreur de connexion',

    // Erros
    valorInvalido: 'Valeur invalide',
    erroGuardarMovimento: 'Erreur lors de l\'enregistrement du mouvement',
    erroEliminarMovimento: 'Erreur lors de la suppression du mouvement',

    // Filtros
    todos: 'Tous',
    filtrarPorTipo: 'Filtrer par type',
    filtrarPorOperador: 'Filtrer par opérateur',
    intervaloPersonalizado: 'Période personnalisée',
    de: 'Du',
    ate: 'Au',

    // Dashboard diário
    mes: 'Mois',
    totalMes: 'Total mois',
    dia: 'Jour',
    verMais: 'Voir plus',
  }
} as const

// Excel é sempre em francês
export const excelTranslations = {
  data: 'Date',
  tipo: 'Type',
  categoria: 'Catégorie',
  operador: 'Opérateur',
  descricao: 'Description',
  valor: 'Valeur',
  receita: 'Recette',
  gasto: 'Dépense',
  resumo: 'RÉSUMÉ',
  totalReceitas: 'Total Recettes',
  totalGastos: 'Total Dépenses',
  saldo: 'Solde',
}

export type TranslationKey = keyof typeof translations.pt

export function getTranslation(locale: Locale, key: TranslationKey): string {
  return translations[locale][key]
}

export function useTranslations(locale: Locale) {
  return {
    t: (key: TranslationKey) => translations[locale][key],
    locale,
  }
}

// Guardar e obter idioma do localStorage
export function getStoredLocale(): Locale {
  if (typeof window === 'undefined') return 'pt'
  return (localStorage.getItem('locale') as Locale) || 'pt'
}

export function setStoredLocale(locale: Locale): void {
  localStorage.setItem('locale', locale)
}
