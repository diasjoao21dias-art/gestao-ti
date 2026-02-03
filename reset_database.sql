-- Script para resetar o banco de dados
-- Execute este script se precisar limpar e recriar o banco

-- ATENÇÃO: Isso irá APAGAR TODOS OS DADOS!

-- Desconectar todos os usuários do banco
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = 'gestao_ti'
  AND pid <> pg_backend_pid();

-- Dropar e recriar o banco
DROP DATABASE IF EXISTS gestao_ti;
CREATE DATABASE gestao_ti;

-- Mensagem de sucesso
\echo 'Banco de dados resetado com sucesso!'
\echo 'Execute: npm run dev para recriar as tabelas e dados'
