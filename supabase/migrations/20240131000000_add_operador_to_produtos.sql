-- Adicionar operador_id à tabela produtos
ALTER TABLE produtos ADD COLUMN operador_id UUID REFERENCES operadores(id) ON DELETE CASCADE;

-- Criar índice para performance
CREATE INDEX idx_produtos_operador ON produtos(operador_id);

-- Obter o ID da Josianne
DO $$
DECLARE
  josianne_id UUID;
  cat_terapia UUID;
  cat_cortes UUID;
  cat_madeixas UUID;
  cat_tratamentos UUID;
  cat_finalizacao UUID;
  cat_extras UUID;
BEGIN
  -- Buscar ID da Josianne
  SELECT id INTO josianne_id FROM operadores WHERE nome = 'Josianne' LIMIT 1;

  -- Criar categorias de serviços
  INSERT INTO categorias (nome, tipo) VALUES ('Terapia Capilar', 'receita') RETURNING id INTO cat_terapia;
  INSERT INTO categorias (nome, tipo) VALUES ('Cortes', 'receita') RETURNING id INTO cat_cortes;
  INSERT INTO categorias (nome, tipo) VALUES ('Madeixas', 'receita') RETURNING id INTO cat_madeixas;
  INSERT INTO categorias (nome, tipo) VALUES ('Tratamentos Especiais', 'receita') RETURNING id INTO cat_tratamentos;
  INSERT INTO categorias (nome, tipo) VALUES ('Tratamento + Finalização', 'receita') RETURNING id INTO cat_finalizacao;
  INSERT INTO categorias (nome, tipo) VALUES ('Extras', 'receita') RETURNING id INTO cat_extras;

  -- Inserir serviços da Josianne - Terapia Capilar
  INSERT INTO produtos (nome, preco_base, categoria_id, tipo, operador_id) VALUES
    ('Avaliação + tratamento (terapia capilar)', 120.00, cat_terapia, 'receita', josianne_id),
    ('Tratamento dermatite', 75.00, cat_terapia, 'receita', josianne_id),
    ('Tratamento psoríase', 85.00, cat_terapia, 'receita', josianne_id),
    ('Detox argila', 65.00, cat_terapia, 'receita', josianne_id),
    ('Blend de óleo', 65.00, cat_terapia, 'receita', josianne_id);

  -- Inserir serviços da Josianne - Cortes
  INSERT INTO produtos (nome, preco_base, categoria_id, tipo, operador_id) VALUES
    ('Cortes cabelo curto', 45.00, cat_cortes, 'receita', josianne_id),
    ('Cortes cabelo médio', 55.00, cat_cortes, 'receita', josianne_id),
    ('Corte cabelo comprido', 65.00, cat_cortes, 'receita', josianne_id);

  -- Inserir serviços da Josianne - Madeixas
  INSERT INTO produtos (nome, preco_base, categoria_id, tipo, operador_id) VALUES
    ('Madeixas cabelo curto', 145.00, cat_madeixas, 'receita', josianne_id),
    ('Madeixas cabelo médio', 165.00, cat_madeixas, 'receita', josianne_id),
    ('Madeixas cabelo longo', 185.00, cat_madeixas, 'receita', josianne_id);

  -- Inserir serviços da Josianne - Tratamentos Especiais
  INSERT INTO produtos (nome, preco_base, categoria_id, tipo, operador_id) VALUES
    ('Microagulhamento', 145.00, cat_tratamentos, 'receita', josianne_id),
    ('Alta frequência/hidratação', 75.00, cat_tratamentos, 'receita', josianne_id),
    ('Coloração dos fios brancos (Raiz + tratamento)', 95.00, cat_tratamentos, 'receita', josianne_id);

  -- Inserir serviços da Josianne - Tratamento + Finalização
  INSERT INTO produtos (nome, preco_base, categoria_id, tipo, operador_id) VALUES
    ('Tratamento + finalização em cabelo curto', 65.00, cat_finalizacao, 'receita', josianne_id),
    ('Tratamento + finalização em cabelo médio', 75.00, cat_finalizacao, 'receita', josianne_id),
    ('Tratamento + finalização em cabelo longo', 85.00, cat_finalizacao, 'receita', josianne_id);

  -- Inserir serviços da Josianne - Extras
  INSERT INTO produtos (nome, preco_base, categoria_id, tipo, operador_id) VALUES
    ('Queratina', 50.00, cat_extras, 'receita', josianne_id);

END $$;
