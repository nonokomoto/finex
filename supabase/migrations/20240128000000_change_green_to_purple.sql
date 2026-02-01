-- Remover constraint antiga
ALTER TABLE operadores DROP CONSTRAINT IF EXISTS operadores_cor_check;

-- Atualizar Operador 2 de green para purple PRIMEIRO
UPDATE operadores SET cor = 'purple' WHERE cor = 'green';

-- Adicionar nova constraint
ALTER TABLE operadores ADD CONSTRAINT operadores_cor_check CHECK (cor IN ('blue', 'purple', 'orange'));
