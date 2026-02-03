-- Migration 001: Correção dos índices
-- Esta migration corrige o problema dos índices criados antes das tabelas
-- Aplique esta migration se você estava usando a versão antiga com erro

-- IMPORTANTE: Faça backup antes de executar!
-- pg_dump -U postgres -d gestao_ti -F c -f backup_antes_migration.dump

-- Verificar se os índices já existem e remover se necessário
DROP INDEX IF EXISTS idx_notificacoes_usuario;
DROP INDEX IF EXISTS idx_permissoes_usuario;
DROP INDEX IF EXISTS idx_logs_auditoria_usuario;
DROP INDEX IF EXISTS idx_anexos_ticket;
DROP INDEX IF EXISTS idx_tickets_status;
DROP INDEX IF EXISTS idx_tickets_prioridade;
DROP INDEX IF EXISTS idx_tickets_criado_em;
DROP INDEX IF EXISTS idx_tickets_setor;
DROP INDEX IF EXISTS idx_setor_tecnicos_setor;
DROP INDEX IF EXISTS idx_setor_tecnicos_tecnico;
DROP INDEX IF EXISTS idx_ativos_tipo;
DROP INDEX IF EXISTS idx_ativos_status;
DROP INDEX IF EXISTS idx_projetos_status;
DROP INDEX IF EXISTS idx_projetos_criado_em;
DROP INDEX IF EXISTS idx_licencas_expiracao;

-- Recriar os índices corretamente (só se as tabelas existirem)
CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario ON notificacoes(usuario_id, lida);
CREATE INDEX IF NOT EXISTS idx_permissoes_usuario ON permissoes_usuario(usuario_id, modulo);
CREATE INDEX IF NOT EXISTS idx_logs_auditoria_usuario ON logs_auditoria(usuario_id, criado_em);
CREATE INDEX IF NOT EXISTS idx_anexos_ticket ON anexos_ticket(ticket_id);

CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_prioridade ON tickets(prioridade);
CREATE INDEX IF NOT EXISTS idx_tickets_criado_em ON tickets(criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_setor ON tickets(setor_id);
CREATE INDEX IF NOT EXISTS idx_setor_tecnicos_setor ON setor_tecnicos(setor_id);
CREATE INDEX IF NOT EXISTS idx_setor_tecnicos_tecnico ON setor_tecnicos(tecnico_id);
CREATE INDEX IF NOT EXISTS idx_ativos_tipo ON ativos(tipo);
CREATE INDEX IF NOT EXISTS idx_ativos_status ON ativos(status);
CREATE INDEX IF NOT EXISTS idx_projetos_status ON projetos(status);
CREATE INDEX IF NOT EXISTS idx_projetos_criado_em ON projetos(criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_licencas_expiracao ON licencas(data_expiracao, status);

-- Mensagem de sucesso
SELECT 'Migration 001 aplicada com sucesso! Índices corrigidos.' as status;
