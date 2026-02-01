-- Gerar códigos automáticos para produtos existentes baseados na categoria

-- Terapia Capilar -> TER
UPDATE produtos SET codigo = 'TER001' WHERE nome = 'Alta frequência/hidratação' AND codigo IS NULL;
UPDATE produtos SET codigo = 'TER002' WHERE nome = 'Avaliação + tratamento (terapia capilar)' AND codigo IS NULL;
UPDATE produtos SET codigo = 'TER003' WHERE nome = 'Blend de óleo' AND codigo IS NULL;
UPDATE produtos SET codigo = 'TER004' WHERE nome = 'Coloração dos fios brancos (Raiz + tratamento)' AND codigo IS NULL;
UPDATE produtos SET codigo = 'TER005' WHERE nome = 'Detox argila' AND codigo IS NULL;

-- Cortes -> COR
UPDATE produtos SET codigo = 'COR001' WHERE nome = 'Corte cabelo comprido' AND codigo IS NULL;
UPDATE produtos SET codigo = 'COR002' WHERE nome = 'Cortes cabelo curto' AND codigo IS NULL;
UPDATE produtos SET codigo = 'COR003' WHERE nome = 'Cortes cabelo médio' AND codigo IS NULL;

-- Madeixas -> MAD
UPDATE produtos SET codigo = 'MAD001' WHERE nome = 'Madeixas cabelo curto' AND codigo IS NULL;
UPDATE produtos SET codigo = 'MAD002' WHERE nome = 'Madeixas cabelo longo' AND codigo IS NULL;
UPDATE produtos SET codigo = 'MAD003' WHERE nome = 'Madeixas cabelo médio' AND codigo IS NULL;

-- Tratamento + Finalização -> TRF
UPDATE produtos SET codigo = 'TRF001' WHERE nome = 'Tratamento + finalização (cabelo curto)' AND codigo IS NULL;
UPDATE produtos SET codigo = 'TRF002' WHERE nome = 'Tratamento + finalização (cabelo longo)' AND codigo IS NULL;
UPDATE produtos SET codigo = 'TRF003' WHERE nome = 'Tratamento + finalização (cabelo médio)' AND codigo IS NULL;

-- Tratamentos Especiais -> TRE
UPDATE produtos SET codigo = 'TRE001' WHERE nome = 'Tratamento especial (cabelo curto)' AND codigo IS NULL;
UPDATE produtos SET codigo = 'TRE002' WHERE nome = 'Tratamento especial (cabelo longo)' AND codigo IS NULL;
UPDATE produtos SET codigo = 'TRE003' WHERE nome = 'Tratamento especial (cabelo médio)' AND codigo IS NULL;

-- Extras -> EXT
UPDATE produtos SET codigo = 'EXT001' WHERE nome = 'Finalização' AND codigo IS NULL;
