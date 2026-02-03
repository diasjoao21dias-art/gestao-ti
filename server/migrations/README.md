# Sistema de Migrações - Preservar Dados

## 🎯 O que são Migrations?

Migrations são scripts SQL que atualizam a estrutura do banco de dados **sem apagar os dados existentes**.

## 📋 Como Usar

### Antes de Atualizar o Sistema

1. **SEMPRE faça backup primeiro:**
   ```bash
   pg_dump -U postgres -d gestao_ti -F c -f backup_antes_upgrade.dump
   ```

2. **Execute as migrations na ordem:**
   ```bash
   psql -U postgres -d gestao_ti -f server/migrations/001_fix_indexes.sql
   ```

3. **Teste o sistema:**
   ```bash
   npm run dev
   ```

4. **Se der erro, restaure o backup:**
   ```bash
   pg_restore -U postgres -d gestao_ti -c backup_antes_upgrade.dump
   ```

## 📝 Migrations Disponíveis

- `001_fix_indexes.sql` - Correção dos índices (primeira versão para corrigida)

## ⚠️ IMPORTANTE

**NUNCA use DROP DATABASE quando já tiver dados!**

Sempre use migrations para atualizar a estrutura preservando os dados.
