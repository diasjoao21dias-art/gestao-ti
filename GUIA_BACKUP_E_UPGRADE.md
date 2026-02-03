# 🔄 Guia de Backup e Upgrade Sem Perder Dados

## ⚠️ IMPORTANTE: Nunca Perca Seus Dados!

Este guia ensina como fazer upgrades do sistema **SEM PERDER DADOS**.

---

## 📦 1. BACKUP (Sempre Faça Antes de Atualizar!)

### Criar Backup Completo

**No PowerShell/CMD:**
```bash
# Backup completo do banco de dados
pg_dump -U postgres -d gestao_ti -F c -f backup_gestao_ti_%date:~0,10%.dump

# Ou com nome customizado
pg_dump -U postgres -d gestao_ti -F c -f backup_antes_upgrade.dump
```

**No SQL Shell (psql):**
```sql
\! pg_dump -U postgres -d gestao_ti -F c -f C:\Backups\gestao_ti.dump
```

### Backup Apenas dos Dados (sem estrutura)

```bash
pg_dump -U postgres -d gestao_ti --data-only -f backup_dados.sql
```

---

## 🔄 2. FAZER UPGRADE SEM PERDER DADOS

### Método 1: Usando Migrations (Recomendado) ⭐

**Quando baixar uma nova versão do sistema:**

1. **Faça backup primeiro!**
   ```bash
   pg_dump -U postgres -d gestao_ti -F c -f backup_antes_upgrade.dump
   ```

2. **Baixe a nova versão** e substitua os arquivos

3. **Execute as migrations** (na pasta do projeto):
   ```bash
   # Veja quais migrations existem
   dir server\migrations\*.sql
   
   # Execute cada migration na ordem
   psql -U postgres -d gestao_ti -f server/migrations/001_fix_indexes.sql
   ```

4. **Atualize as dependências** (se houver mudanças):
   ```bash
   npm install
   cd client && npm install && cd ..
   ```

5. **Inicie o sistema**:
   ```bash
   npm run dev
   ```

6. **Teste tudo** - verifique se seus dados estão intactos

7. **Se der problema, restaure o backup:**
   ```bash
   pg_restore -U postgres -d gestao_ti -c backup_antes_upgrade.dump
   ```

### Método 2: Backup e Restore Manual

**Para upgrades maiores ou quando não há migration:**

1. **Backup dos dados:**
   ```bash
   pg_dump -U postgres -d gestao_ti --data-only -f backup_dados.sql
   ```

2. **Apague e recrie o banco:**
   ```sql
   DROP DATABASE gestao_ti;
   CREATE DATABASE gestao_ti;
   ```

3. **Inicie a nova versão** (cria estrutura nova):
   ```bash
   npm run dev
   ```
   (Pare o servidor após criar as tabelas - Ctrl+C)

4. **Restaure seus dados:**
   ```bash
   psql -U postgres -d gestao_ti -f backup_dados.sql
   ```

5. **Reinicie o sistema:**
   ```bash
   npm run dev
   ```

---

## 🔙 3. RESTAURAR BACKUP (Se Der Errado)

### Restaurar Backup Completo

```bash
# Desconectar todos os usuários do banco
psql -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'gestao_ti';"

# Restaurar o backup
pg_restore -U postgres -d gestao_ti -c backup_antes_upgrade.dump
```

### Restaurar Apenas Dados

```bash
psql -U postgres -d gestao_ti -f backup_dados.sql
```

---

## 📅 4. ROTINA DE BACKUP RECOMENDADA

### Backup Diário Automático

**Crie um arquivo `backup_diario.bat`:**

```batch
@echo off
set DATA=%date:~6,4%%date:~3,2%%date:~0,2%
set HORA=%time:~0,2%%time:~3,2%
set BACKUP_DIR=C:\Backups\GestaoTI

if not exist %BACKUP_DIR% mkdir %BACKUP_DIR%

pg_dump -U postgres -d gestao_ti -F c -f %BACKUP_DIR%\backup_%DATA%_%HORA%.dump

echo Backup criado: %BACKUP_DIR%\backup_%DATA%_%HORA%.dump

REM Deletar backups com mais de 7 dias
forfiles /p %BACKUP_DIR% /m *.dump /d -7 /c "cmd /c del @path"
```

**Agende no Windows:**
1. Abra o **Agendador de Tarefas**
2. Criar Tarefa Básica
3. Configure para rodar todo dia às 23:00
4. Ação: Executar `backup_diario.bat`

---

## ✅ 5. CHECKLIST DE UPGRADE SEGURO

Antes de qualquer upgrade:

- [ ] Fazer backup completo do banco
- [ ] Salvar cópia do arquivo `.env`
- [ ] Testar a nova versão em ambiente de teste (se possível)
- [ ] Ter plano de rollback (como restaurar o backup)
- [ ] Fazer upgrade em horário de baixo uso
- [ ] Avisar os usuários sobre manutenção

Durante o upgrade:

- [ ] Executar migrations na ordem correta
- [ ] Verificar logs de erro
- [ ] Testar funcionalidades críticas

Após o upgrade:

- [ ] Confirmar que todos os dados estão intactos
- [ ] Testar todas as funcionalidades principais
- [ ] Manter backup antigo por pelo menos 1 semana

---

## 🚨 6. QUANDO É NECESSÁRIO RESETAR?

**Só em casos EXTREMOS:**

- ❌ Erro estrutural grave no banco (como desta vez)
- ❌ Corrupção de dados irreparável
- ❌ Mudança completa de arquitetura

**Nesses casos:**

1. **Exporte os dados importantes primeiro:**
   ```sql
   COPY (SELECT * FROM tickets) TO 'C:\Backup\tickets.csv' CSV HEADER;
   COPY (SELECT * FROM ativos) TO 'C:\Backup\ativos.csv' CSV HEADER;
   -- Etc...
   ```

2. **Resete o banco**

3. **Reimporte os dados:**
   ```sql
   COPY tickets FROM 'C:\Backup\tickets.csv' CSV HEADER;
   COPY ativos FROM 'C:\Backup\ativos.csv' CSV HEADER;
   ```

---

## 💡 DICAS IMPORTANTES

### ✅ BOM:
- Sempre fazer backup antes de qualquer mudança
- Usar migrations para mudanças estruturais
- Testar em ambiente separado primeiro
- Manter múltiplos backups (diário, semanal, mensal)

### ❌ EVITAR:
- Usar `DROP DATABASE` em banco com dados
- Fazer upgrade sem backup
- Pular migrations
- Aplicar mudanças direto em produção

---

## 🆘 EM CASO DE EMERGÊNCIA

Se você perdeu dados acidentalmente:

1. **PARE TUDO IMEDIATAMENTE**
2. **NÃO execute mais comandos no banco**
3. **Restaure o backup mais recente:**
   ```bash
   pg_restore -U postgres -d gestao_ti -c backup_mais_recente.dump
   ```
4. **Se não tem backup, procure por:**
   - Arquivos `.dump` em C:\Backups
   - Logs do PostgreSQL (podem ter os comandos executados)
   - Shadow copies do Windows (Versões Anteriores)

---

## 📞 Suporte

Para dúvidas sobre backup e upgrade, consulte:
- `server/migrations/README.md` - Documentação das migrations
- Este guia - Procedimentos de backup e restore

**Lembre-se: Backup é seguro de vida! Sempre faça backup antes de qualquer mudança!**

---

*Última atualização: Outubro 2025*
