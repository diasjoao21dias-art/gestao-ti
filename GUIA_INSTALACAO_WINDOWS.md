# 🪟 Guia de Instalação para Windows

## ✅ Correção Aplicada

O código foi corrigido para funcionar no Windows! O comando que causava erro foi simplificado.

## 🔧 Como Corrigir o Erro do PostgreSQL

Você está recebendo este erro:
```
❌ Erro: autenticação do tipo senha falhou para o usuário "ti_admin"
```

### Solução Passo a Passo:

#### Opção 1: Usar o usuário padrão "postgres" (Mais Fácil)

1. **Abra o arquivo `.env`** na raiz do projeto (C:\Sistema-GestaoTi\.env)

2. **Substitua todas as linhas do banco de dados** por:

```env
# Configuração do Banco de Dados
DATABASE_URL=postgresql://postgres:SUA_SENHA_AQUI@localhost:5432/gestao_ti
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=SUA_SENHA_AQUI
PGDATABASE=gestao_ti
```

3. **Substitua `SUA_SENHA_AQUI`** pela senha que você definiu quando instalou o PostgreSQL

4. **Crie o banco de dados** (abra o SQL Shell ou pgAdmin):

**No SQL Shell (psql):**
```sql
-- Conecte com o usuário postgres
-- Digite a senha quando solicitado

-- Criar o banco de dados
CREATE DATABASE gestao_ti;

-- Sair
\q
```

**Ou no PowerShell/CMD:**
```bash
psql -U postgres -c "CREATE DATABASE gestao_ti"
```

5. **Execute os seeds** para criar as tabelas:
```bash
node server/src/seed.js
node server/src/seed-sla.js
```

6. **Inicie o sistema:**
```bash
npm run dev
```

---

#### Opção 2: Criar o usuário "ti_admin" (Seguir o manual)

1. **Abra o SQL Shell (psql)** ou pgAdmin

2. **Execute os comandos:**

```sql
-- Conectar como postgres
-- Digite a senha do postgres

-- Criar o banco de dados
CREATE DATABASE gestao_ti;

-- Criar o usuário ti_admin
CREATE USER ti_admin WITH ENCRYPTED PASSWORD 'SenhaSegura2024';

-- Conceder privilégios
GRANT ALL PRIVILEGES ON DATABASE gestao_ti TO ti_admin;

-- Conectar ao banco gestao_ti
\c gestao_ti

-- Conceder permissões no schema public
GRANT ALL ON SCHEMA public TO ti_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ti_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ti_admin;

-- Sair
\q
```

3. **Atualize o arquivo `.env`** com a senha que você definiu:

```env
DATABASE_URL=postgresql://ti_admin:SenhaSegura2024@localhost:5432/gestao_ti
PGHOST=localhost
PGPORT=5432
PGUSER=ti_admin
PGPASSWORD=SenhaSegura2024
PGDATABASE=gestao_ti
```

> ⚠️ **IMPORTANTE:** Se sua senha contiver caracteres especiais como `@`, `#`, `%`, etc., você precisa codificá-los na `DATABASE_URL`:
> - `@` vira `%40`
> - `#` vira `%23`
> - `%` vira `%25`
> 
> Exemplo: Se a senha for `Minha@Senha#123`, use:
> ```
> DATABASE_URL=postgresql://ti_admin:Minha%40Senha%23123@localhost:5432/gestao_ti
> PGPASSWORD=Minha@Senha#123
> ```

4. **Execute os seeds:**
```bash
node server/src/seed.js
node server/src/seed-sla.js
```

5. **Inicie o sistema:**
```bash
npm run dev
```

---

## 🎯 Checklist de Instalação Windows

- [ ] PostgreSQL instalado e rodando
- [ ] Banco de dados `gestao_ti` criado
- [ ] Arquivo `.env` configurado com a senha correta
- [ ] Dependências instaladas (`npm install` na raiz e em `client/`)
- [ ] Seeds executados (`node server/src/seed.js`)
- [ ] Sistema rodando (`npm run dev`)

---

## 🐛 Verificar se PostgreSQL está Rodando

### Método 1: Services.msc
1. Pressione `Win + R`
2. Digite: `services.msc`
3. Procure por "postgresql"
4. Se estiver parado, clique com botão direito → Iniciar

### Método 2: Linha de Comando
```bash
# Verificar se está rodando
psql -U postgres -c "SELECT version();"

# Se funcionar, o PostgreSQL está ativo
```

---

## 📝 Exemplo de Arquivo .env Completo

```env
# ===================================
# CONFIGURAÇÃO DO BANCO DE DADOS
# ===================================
DATABASE_URL=postgresql://postgres:minhasenha@localhost:5432/gestao_ti
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=minhasenha
PGDATABASE=gestao_ti

# ===================================
# CONFIGURAÇÃO DO SERVIDOR
# ===================================
PORT=3000
NODE_ENV=development

# ===================================
# SEGURANÇA - JWT
# ===================================
JWT_SECRET=sua_chave_secreta_super_segura_aqui_12345

# ===================================
# URLs DA APLICAÇÃO
# ===================================
FRONTEND_URL=http://localhost:5000
BACKEND_URL=http://localhost:3000
```

---

## 🆘 Ainda com Problemas?

### Erro: "psql não é reconhecido"
- Adicione o PostgreSQL ao PATH do Windows:
  1. Painel de Controle → Sistema → Configurações Avançadas
  2. Variáveis de Ambiente
  3. Em "Path", adicione: `C:\Program Files\PostgreSQL\15\bin`

### Erro: "porta 5432 em uso"
```bash
# Ver o que está usando a porta
netstat -ano | findstr :5432

# Reiniciar o PostgreSQL
# Via services.msc ou:
net stop postgresql-x64-15
net start postgresql-x64-15
```

### Testar Conexão com o Banco
```bash
# Testar se consegue conectar
psql -U postgres -d gestao_ti -h localhost

# Se conectar com sucesso, o problema está no arquivo .env
```

---

## 🎉 Sistema Funcionando!

Depois de seguir esses passos, acesse:
- **URL:** http://localhost:5000
- **Email:** admin@itmanager.com
- **Senha:** admin123

⚠️ **IMPORTANTE:** Altere a senha do administrador após o primeiro login!

---

**Precisa de mais ajuda?** Consulte o [MANUAL_INSTALACAO.md](MANUAL_INSTALACAO.md) para instruções detalhadas.
