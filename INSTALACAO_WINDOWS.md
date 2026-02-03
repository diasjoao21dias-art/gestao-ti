# 🚀 Guia de Instalação - Sistema de Gestão T.I. (Windows)

## ✅ Problema Corrigido
A versão anterior tinha um erro na criação do banco de dados relacionado à ordem dos índices. **Este problema já foi corrigido!**

## 📋 Pré-requisitos

### 1. Node.js 18 ou superior
1. Baixe em: https://nodejs.org/
2. Instale com as opções padrão
3. Verifique a instalação:
```bash
node --version
npm --version
```

### 2. PostgreSQL 12 ou superior
1. Baixe em: https://www.postgresql.org/download/windows/
2. Durante a instalação:
   - **Senha do postgres**: Anote a senha que você definir
   - **Porta**: 5432 (padrão)
3. Verifique a instalação abrindo o "SQL Shell (psql)" no menu Iniciar

## 🔧 Passo a Passo

### 1️⃣ Criar Banco de Dados

Abra o **SQL Shell (psql)** e execute:

```sql
-- Conecte como usuário postgres (use a senha definida na instalação)
CREATE DATABASE gestao_ti;

-- Criar usuário (opcional, mas recomendado)
CREATE USER ti_admin WITH PASSWORD 'sua_senha_aqui';
GRANT ALL PRIVILEGES ON DATABASE gestao_ti TO ti_admin;
```

### 2️⃣ Configurar Variáveis de Ambiente

1. Crie um arquivo chamado `.env` na raiz do projeto
2. Adicione as seguintes configurações:

```env
# Banco de Dados PostgreSQL
DATABASE_URL=postgresql://postgres:SUA_SENHA@localhost:5432/gestao_ti

# Ou se criou o usuário ti_admin:
# DATABASE_URL=postgresql://ti_admin:sua_senha_aqui@localhost:5432/gestao_ti

PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=SUA_SENHA
PGDATABASE=gestao_ti

# Servidor
PORT=3000
NODE_ENV=development

# Segurança (IMPORTANTE: Mude em produção!)
JWT_SECRET=minha_chave_super_secreta_jwt_123456789

# URLs
FRONTEND_URL=http://localhost:5000
BACKEND_URL=http://localhost:3000
```

**⚠️ IMPORTANTE:** Substitua `SUA_SENHA` pela senha do PostgreSQL que você definiu!

### 3️⃣ Instalar Dependências

Abra o **PowerShell** ou **CMD** na pasta do projeto e execute:

```bash
# Instalar dependências do servidor
npm install

# Instalar dependências do cliente
cd client
npm install
cd ..
```

### 4️⃣ Iniciar o Sistema

```bash
npm run dev
```

Você verá algo como:
```
✅ Banco de dados inicializado com sucesso!
✅ Usuário administrador criado:
   Email: admin@itmanager.com
   Senha: admin123
🚀 Servidor rodando na porta 3000
🔌 WebSocket ativo
VITE v5.4.20  ready in 1140 ms
➜  Local:   http://localhost:5000/
```

### 5️⃣ Acessar o Sistema

1. Abra o navegador em: **http://localhost:5000**
2. Faça login com:
   - **Email:** admin@itmanager.com
   - **Senha:** admin123

⚠️ **IMPORTANTE:** Altere a senha do administrador após o primeiro login!

## 🐛 Solução de Problemas

### ❌ Erro: "não existe a coluna setor_id"
**Solução:** Este erro foi corrigido na versão mais recente. Se ainda aparecer:
1. Certifique-se de que baixou a versão atualizada
2. Delete o banco de dados e recrie:
```sql
DROP DATABASE gestao_ti;
CREATE DATABASE gestao_ti;
```
3. Execute `npm run dev` novamente

### ❌ Erro: "connect ECONNREFUSED 127.0.0.1:3000"
**Causa:** O servidor backend não está rodando.

**Solução:**
1. Verifique se o PostgreSQL está rodando
2. Confirme as credenciais no arquivo `.env`
3. Verifique se a porta 3000 não está em uso:
```bash
netstat -ano | findstr :3000
```

### ❌ Erro: "password authentication failed"
**Causa:** Senha incorreta no arquivo `.env`

**Solução:**
1. Abra o arquivo `.env`
2. Corrija a senha em `DATABASE_URL` e `PGPASSWORD`
3. Reinicie o servidor

### ❌ Erro: "FATAL: database gestao_ti does not exist"
**Causa:** Banco de dados não foi criado.

**Solução:**
1. Abra o SQL Shell (psql)
2. Execute: `CREATE DATABASE gestao_ti;`
3. Reinicie o servidor

### ❌ Porta 5000 em uso
**Solução:**
```bash
# Windows PowerShell (como Administrador)
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force
```

### ❌ PostgreSQL não está rodando
**Solução:**
1. Pressione `Win + R`
2. Digite `services.msc`
3. Procure por "postgresql-x64-XX" (onde XX é a versão)
4. Clique com botão direito → Iniciar

## 📦 Estrutura de Dados Criada

Ao iniciar, o sistema cria automaticamente:

- ✅ **Tabelas do banco:** usuarios, ativos, tickets, setores, projetos, licenças, etc.
- ✅ **Índices otimizados:** Para melhor performance
- ✅ **Usuário admin:** email: admin@itmanager.com, senha: admin123
- ✅ **Dados de exemplo:**
  - 5 usuários
  - 5 ativos
  - 5 tickets
  - 4 projetos
  - 5 licenças
  - 4 artigos na base de conhecimento
  - 4 setores
  - Configurações de SLA

## 🔒 Checklist de Segurança (PRODUÇÃO)

Antes de colocar em produção:

- [ ] Alterar senha do administrador
- [ ] Gerar novo JWT_SECRET (32+ caracteres aleatórios)
- [ ] Alterar senha do PostgreSQL
- [ ] Configurar HTTPS/SSL
- [ ] Configurar `NODE_ENV=production`
- [ ] Desabilitar dados de exemplo (comentar linha 249 no `database.js`)
- [ ] Configurar backup automático do banco
- [ ] Atualizar dependências: `npm audit fix`

## 🔄 Comandos Úteis

```bash
# Desenvolvimento (frontend + backend)
npm run dev

# Apenas backend
npm run server

# Apenas frontend  
npm run client

# Build para produção
cd client && npm run build

# Resetar banco (CUIDADO: apaga todos os dados!)
# No psql:
DROP DATABASE gestao_ti;
CREATE DATABASE gestao_ti;
# Depois:
npm run dev
```

## 📊 Backup do Banco de Dados

### Criar backup
```bash
# PowerShell ou CMD
pg_dump -U postgres -d gestao_ti -F c -f backup_gestao_ti.dump
```

### Restaurar backup
```bash
pg_restore -U postgres -d gestao_ti -F c backup_gestao_ti.dump
```

## 💡 Dicas

1. **Desenvolvimento:** Use o VS Code com extensões PostgreSQL e Node.js
2. **Depuração:** Veja os logs no terminal onde rodou `npm run dev`
3. **Performance:** Os índices já estão otimizados para consultas rápidas
4. **Personalização:** Edite os dados de exemplo em `server/src/seed-data.js`

## 📞 Suporte

Se encontrar problemas:
1. Verifique o terminal para mensagens de erro
2. Confirme que PostgreSQL está rodando
3. Verifique as configurações do arquivo `.env`
4. Consulte a seção "Solução de Problemas" acima

---

**Desenvolvido com ❤️ para facilitar a gestão de TI**

Versão atualizada - Outubro 2025
