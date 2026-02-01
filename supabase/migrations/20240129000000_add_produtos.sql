-- Criar tabela de produtos/serviços (catálogo)
CREATE TABLE produtos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  codigo TEXT UNIQUE,
  descricao TEXT,
  preco_base DECIMAL(10,2) NOT NULL DEFAULT 0,
  categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL DEFAULT 'gasto' CHECK (tipo IN ('receita', 'gasto')),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar referência ao produto no movimento (opcional)
ALTER TABLE movimentos ADD COLUMN produto_id UUID REFERENCES produtos(id) ON DELETE SET NULL;

-- Índices para melhor performance
CREATE INDEX idx_produtos_categoria ON produtos(categoria_id);
CREATE INDEX idx_produtos_tipo ON produtos(tipo);
CREATE INDEX idx_produtos_ativo ON produtos(ativo);
CREATE INDEX idx_produtos_codigo ON produtos(codigo);
CREATE INDEX idx_movimentos_produto ON movimentos(produto_id);

-- RLS policies
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura de produtos" ON produtos
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserção de produtos" ON produtos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização de produtos" ON produtos
  FOR UPDATE USING (true);

CREATE POLICY "Permitir eliminação de produtos" ON produtos
  FOR DELETE USING (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_produtos_updated_at
  BEFORE UPDATE ON produtos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
