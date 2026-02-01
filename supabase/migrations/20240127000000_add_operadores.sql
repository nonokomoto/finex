-- Tabela de operadores
CREATE TABLE operadores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  cor TEXT NOT NULL CHECK (cor IN ('blue', 'green', 'orange')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar coluna operador_id aos movimentos
ALTER TABLE movimentos ADD COLUMN operador_id UUID REFERENCES operadores(id) ON DELETE SET NULL;

-- Índice para performance
CREATE INDEX idx_movimentos_operador ON movimentos(operador_id);

-- Inserir os 3 operadores
INSERT INTO operadores (username, nome, cor) VALUES
  ('operador1', 'Operador 1', 'blue'),
  ('operador2', 'Operador 2', 'green'),
  ('operador3', 'Operador 3', 'orange');

-- Habilitar RLS
ALTER TABLE operadores ENABLE ROW LEVEL SECURITY;

-- Política de acesso (todos podem ler)
CREATE POLICY "Permitir leitura de operadores" ON operadores FOR SELECT USING (true);
