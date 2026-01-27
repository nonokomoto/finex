-- Tornar salao_id opcional (não obrigatório)
ALTER TABLE movimentos ALTER COLUMN salao_id DROP NOT NULL;
