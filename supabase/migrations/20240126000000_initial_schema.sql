-- Tabela de salões
CREATE TABLE saloes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de categorias (personalizáveis)
CREATE TABLE categorias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'gasto')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(nome, tipo)
);

-- Tabela de movimentos (receitas e gastos)
CREATE TABLE movimentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salao_id UUID NOT NULL REFERENCES saloes(id) ON DELETE CASCADE,
  categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'gasto')),
  valor DECIMAL(10,2) NOT NULL CHECK (valor > 0),
  descricao TEXT,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX idx_movimentos_salao ON movimentos(salao_id);
CREATE INDEX idx_movimentos_data ON movimentos(data);
CREATE INDEX idx_movimentos_tipo ON movimentos(tipo);

-- Inserir os 3 salões
INSERT INTO saloes (nome) VALUES
  ('Salão 1'),
  ('Salão 2'),
  ('Salão 3');

-- Habilitar RLS (Row Level Security)
ALTER TABLE saloes ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentos ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (permitir tudo para utilizadores autenticados)
-- Como é login único partilhado, todos têm acesso a tudo
CREATE POLICY "Permitir leitura de salões" ON saloes FOR SELECT USING (true);
CREATE POLICY "Permitir leitura de categorias" ON categorias FOR SELECT USING (true);
CREATE POLICY "Permitir todas operações em categorias" ON categorias FOR ALL USING (true);
CREATE POLICY "Permitir leitura de movimentos" ON movimentos FOR SELECT USING (true);
CREATE POLICY "Permitir todas operações em movimentos" ON movimentos FOR ALL USING (true);
