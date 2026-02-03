# 📚 Manual de Instalação - Sistema de Gestão de T.I. TesteeGo

## 📋 Índice
1. [Requisitos do Sistema](#requisitos-do-sistema)
2. [Instalação do Node.js](#instalação-do-nodejs)
3. [Instalação do PostgreSQL](#instalação-do-postgresql)
4. [Configuração do Banco de Dados](#configuração-do-banco-de-dados)
5. [Instalação do Sistema](#instalação-do-sistema)
6. [Configuração das Variáveis de Ambiente](#configuração-das-variáveis-de-ambiente)
7. [Inicialização do Sistema](#inicialização-do-sistema)
8. [Acesso ao Sistema](#acesso-ao-sistema)
9. [Solução de Problemas](#solução-de-problemas)

---

## 1. Requisitos do Sistema

### Hardware Mínimo
- **Processador:** Dual-core 2.0 GHz ou superior
- **Memória RAM:** 4 GB (recomendado 8 GB)
- **Espaço em Disco:** 2 GB livres
- **Conexão:** Internet para download de dependências

### Software Necessário
- **Sistema Operacional:** Windows 10/11, macOS 10.15+, ou Linux (Ubuntu 20.04+)
- **Node.js:** Versão 18.x ou 20.x
- **PostgreSQL:** Versão 12 ou superior
- **Git:** Para download do projeto (opcional)

---

## 2. Instalação do Node.js

### Windows

1. Acesse o site oficial: [https://nodejs.org](https://nodejs.org)
2. Baixe a versão **LTS** (Long Term Support) - recomendado v20.x
3. Execute o instalador `.msi` baixado
4. Siga o assistente de instalação:
   - Aceite os termos de licença
   - Mantenha o caminho padrão de instalação
   - **IMPORTANTE:** Marque a opção "Automatically install the necessary tools"
5. Clique em "Install" e aguarde a conclusão
6. Reinicie o computador

**Verificar instalação:**
```bash
node --version
npm --version
```

### macOS

**Opção 1: Usando Homebrew (Recomendado)**
```bash
# Instalar Homebrew (se não tiver)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Instalar Node.js
brew install node@20
```

**Opção 2: Download Direto**
1. Acesse [https://nodejs.org](https://nodejs.org)
2. Baixe a versão LTS para macOS
3. Execute o instalador `.pkg`
4. Siga o assistente de instalação

**Verificar instalação:**
```bash
node --version
npm --version
```

### Linux (Ubuntu/Debian)

```bash
# Atualizar repositórios
sudo apt update

# Instalar Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalação
node --version
npm --version
```

---

## 3. Instalação do PostgreSQL

### Windows

1. Acesse: [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
2. Baixe o instalador para Windows
3. Execute o instalador:
   - Escolha o diretório de instalação
   - Selecione os componentes (mantenha todos marcados)
   - Escolha o diretório para dados
   - **IMPORTANTE:** Defina uma senha para o usuário `postgres` (anote essa senha!)
   - Porta padrão: `5432` (mantenha)
   - Locale: `Portuguese, Brazil` ou `Default locale`
4. Aguarde a instalação
5. Desmarque a opção "Stack Builder" ao finalizar

**Adicionar ao PATH (se necessário):**
```
C:\Program Files\PostgreSQL\15\bin
```

### macOS

**Opção 1: Usando Homebrew (Recomendado)**
```bash
# Instalar PostgreSQL
brew install postgresql@15

# Iniciar serviço
brew services start postgresql@15

# Criar usuário postgres (se necessário)
createuser -s postgres
```

**Opção 2: Postgres.app**
1. Baixe em: [https://postgresapp.com/](https://postgresapp.com/)
2. Arraste para a pasta Applications
3. Execute o Postgres.app
4. Clique em "Initialize" para criar o cluster

### Linux (Ubuntu/Debian)

```bash
# Instalar PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Iniciar serviço
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verificar status
sudo systemctl status postgresql
```

**Verificar instalação (todos os SOs):**
```bash
psql --version
```

---

## 4. Configuração do Banco de Dados

### Passo 1: Acessar o PostgreSQL

**Windows:**
```bash
# Abrir SQL Shell (psql) ou usar cmd/PowerShell:
psql -U postgres
# Digite a senha definida na instalação
```

**macOS/Linux:**
```bash
# Mudar para usuário postgres (Linux)
sudo -u postgres psql

# Ou diretamente (macOS com Homebrew)
psql postgres
```

### Passo 2: Criar o Banco de Dados

```sql
-- Criar banco de dados
CREATE DATABASE gestao_ti;

-- Criar usuário específico (opcional, mas recomendado)
CREATE USER ti_admin WITH ENCRYPTED PASSWORD 'suaSenhaSegura123';

-- Conceder privilégios
GRANT ALL PRIVILEGES ON DATABASE gestao_ti TO ti_admin;

-- Sair do psql
\q
```

### Passo 3: Verificar Conexão

```bash
# Testar conexão com o novo banco
psql -U ti_admin -d gestao_ti -h localhost

# Se funcionar, digite \q para sair
```

---

## 5. Instalação do Sistema

### Passo 1: Obter os Arquivos

**Opção A: Download Direto**
- Extraia o arquivo `TesteeGo.zip` em uma pasta de sua escolha
- Exemplo: `C:\Projetos\TesteeGo` ou `/home/usuario/projetos/TesteeGo`

**Opção B: Usando Git**
```bash
git clone [URL_DO_REPOSITORIO] TesteeGo
cd TesteeGo
```

### Passo 2: Instalar Dependências

Abra o terminal/prompt na pasta do projeto:

```bash
# Navegar até a pasta do projeto
cd caminho/para/TesteeGo

# Instalar dependências do backend (root)
npm install

# Instalar dependências do frontend
cd client
npm install

# Voltar para a raiz do projeto
cd ..
```

**Tempo estimado:** 3-5 minutos (depende da conexão)

---

## 6. Configuração das Variáveis de Ambiente

### Passo 1: Criar Arquivo .env

Na **raiz do projeto**, crie um arquivo chamado `.env`:

**Windows (PowerShell):**
```powershell
New-Item .env -ItemType File
notepad .env
```

**macOS/Linux:**
```bash
touch .env
nano .env
# ou use seu editor preferido: code .env, vim .env, etc.
```

### Passo 2: Configurar Variáveis

Copie e cole o conteúdo abaixo no arquivo `.env`, ajustando os valores:

```env
# Configuração do Banco de Dados
DATABASE_URL=postgresql://ti_admin:suaSenhaSegura123@localhost:5432/gestao_ti
PGHOST=localhost
PGPORT=5432
PGUSER=ti_admin
PGPASSWORD=suaSenhaSegura123
PGDATABASE=gestao_ti

# Configuração do Servidor
PORT=3000
NODE_ENV=development

# Segurança - JWT (IMPORTANTE: MUDE ESTE VALOR!)
JWT_SECRET=sua_chave_secreta_super_segura_aqui_12345

# URLs (ajuste conforme necessário)
FRONTEND_URL=http://localhost:5000
BACKEND_URL=http://localhost:3000
```

### Passo 3: Ajustar Configurações

**Importante:**
1. **Senha do Banco:** Substitua `suaSenhaSegura123` pela senha que você definiu
2. **JWT_SECRET:** Crie uma chave aleatória forte (mínimo 32 caracteres)
   - Exemplo: `minha-chave-jwt-super-secreta-2024-xyz789abc`
3. **Usuário do Banco:** Se usou `postgres` em vez de `ti_admin`, ajuste

**Gerar JWT_SECRET seguro:**
```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Ou online: https://randomkeygen.com/
```

---

## 7. Inicialização do Sistema

### Passo 1: Inicializar o Banco de Dados

```bash
# Na raiz do projeto, execute:
node server/src/seed.js
node server/src/seed-sla.js
```

**Saída esperada:**
```
✅ Banco de dados inicializado com sucesso!
✅ Usuário administrador criado:
   Email: admin@itmanager.com
   Senha: admin123
✅ Configurações de SLA criadas com sucesso!
📦 Inserindo dados de exemplo...
✅ Dados de exemplo inseridos com sucesso!
   - 5 Usuários criados
   - 5 Ativos cadastrados
   - 5 Tickets abertos
   - 4 Projetos criados
   - 5 Licenças registradas
   - 4 Artigos na base de conhecimento
```

### Passo 2: Iniciar o Sistema

```bash
# Iniciar backend e frontend simultaneamente
npm run dev
```

**Ou iniciar separadamente:**

**Terminal 1 - Backend:**
```bash
npm run server
```

**Terminal 2 - Frontend:**
```bash
npm run client
```

### Passo 3: Aguardar Inicialização

Aguarde as mensagens:
```
[0] 🚀 Servidor rodando na porta 3000
[0] 🔌 WebSocket ativo
[1] ➜  Local:   http://localhost:5000/
[1] ➜  Network: http://[seu_ip]:5000/
```

---

## 8. Acesso ao Sistema

### Acessar a Aplicação

Abra seu navegador e acesse:
```
http://localhost:5000
```

### Credenciais Padrão

**Administrador:**
- **Email:** `admin@itmanager.com`
- **Senha:** `admin123`

**⚠️ IMPORTANTE:** Altere a senha imediatamente após o primeiro login!

### Funcionalidades Disponíveis

✅ **Dashboard** - Visão geral com KPIs e gráficos  
✅ **Gestão de Ativos** - Hardware, software, equipamentos de rede  
✅ **Sistema de Tickets** - Helpdesk com Kanban e timeline  
✅ **Gestão de Projetos** - Acompanhamento de tarefas e prazos  
✅ **Controle de Licenças** - Software e validades  
✅ **Gestão de Usuários** - Controle de acesso e permissões  
✅ **Base de Conhecimento** - Artigos e documentação  
✅ **Relatórios** - Exportação em PDF e Excel  
✅ **Notificações em Tempo Real** - WebSocket  

---

## 9. Solução de Problemas

### ❌ Erro: "Cannot find module"

**Causa:** Dependências não instaladas corretamente

**Solução:**
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
rm -rf client/node_modules client/package-lock.json

npm install
cd client && npm install && cd ..
```

### ❌ Erro: "ECONNREFUSED" ou "Connection refused"

**Causa:** PostgreSQL não está rodando

**Solução:**

**Windows:**
```bash
# Verificar serviço
services.msc
# Procure por "postgresql" e inicie o serviço
```

**macOS:**
```bash
brew services start postgresql@15
```

**Linux:**
```bash
sudo systemctl start postgresql
sudo systemctl status postgresql
```

### ❌ Erro: "password authentication failed"

**Causa:** Senha incorreta no arquivo `.env`

**Solução:**
1. Verifique a senha no arquivo `.env`
2. Certifique-se de que corresponde à senha do PostgreSQL
3. Teste a conexão manual: `psql -U ti_admin -d gestao_ti -h localhost`

### ❌ Erro: "Port 5000 already in use"

**Causa:** Outra aplicação está usando a porta 5000

**Solução:**

**Opção 1: Mudar a porta**
```bash
# Editar client/vite.config.ts
# Mudar: server: { port: 5000 } para server: { port: 5001 }
```

**Opção 2: Liberar a porta**

**Windows:**
```bash
# Descobrir processo
netstat -ano | findstr :5000
# Matar processo (substitua PID)
taskkill /PID [numero_do_pid] /F
```

**macOS/Linux:**
```bash
# Descobrir e matar processo
lsof -ti:5000 | xargs kill -9
```

### ❌ Erro: "JWT_SECRET is required"

**Causa:** Variável de ambiente não configurada

**Solução:**
1. Verifique se o arquivo `.env` existe na raiz do projeto
2. Certifique-se de que contém `JWT_SECRET=sua_chave_aqui`
3. Reinicie o servidor

### ❌ Página em branco ou erro de conexão API

**Causa:** Backend não está rodando ou proxy não configurado

**Solução:**
1. Verifique se o backend está rodando na porta 3000
2. Verifique o arquivo `client/vite.config.ts`:
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true,
  }
}
```
3. Reinicie ambos os servidores

### 🔍 Logs e Debugging

**Ver logs detalhados:**
```bash
# Ativar modo debug
NODE_ENV=development npm run dev
```

**Verificar tabelas do banco:**
```bash
psql -U ti_admin -d gestao_ti

# No psql:
\dt                    # Listar todas as tabelas
SELECT * FROM usuarios; # Ver usuários
\q                      # Sair
```

---

## 📚 Recursos Adicionais

### Estrutura de Pastas do Projeto

```
TesteeGo/
├── client/              # Frontend React + Vite
│   ├── src/            # Código fonte do frontend
│   ├── public/         # Arquivos estáticos
│   └── package.json    # Dependências do frontend
├── server/             # Backend Node.js + Express
│   └── src/            # Código fonte do backend
│       ├── routes/     # Rotas da API
│       ├── controllers/# Lógica de negócio
│       ├── middleware/ # Autenticação, validação
│       └── database.js # Configuração do banco
├── uploads/            # Arquivos enviados
├── .env               # Variáveis de ambiente (criar)
├── package.json       # Dependências do backend
└── README.md          # Documentação
```

### Comandos Úteis

```bash
# Parar o sistema
Ctrl + C (no terminal onde está rodando)

# Reiniciar banco de dados (CUIDADO: apaga dados!)
node server/src/seed.js

# Verificar portas em uso
# Windows:
netstat -ano | findstr :3000
netstat -ano | findstr :5000

# macOS/Linux:
lsof -i :3000
lsof -i :5000

# Build para produção
cd client
npm run build
```

### Alterar Senha do Administrador

**Via Interface:**
1. Login como admin
2. Ir em "Usuários"
3. Editar usuário administrador
4. Atualizar senha

**Via SQL:**
```sql
-- Gerar hash de senha (use o Node.js)
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('novaSenha123', 10, (e, h) => console.log(h))"

-- Atualizar no banco (substitua o hash)
UPDATE usuarios 
SET senha = '$2b$10$hashGeradoAqui' 
WHERE email = 'admin@itmanager.com';
```

---

## 🔒 Segurança em Produção

### Checklist de Segurança

- [ ] Alterar senha do administrador padrão
- [ ] Gerar novo JWT_SECRET forte (32+ caracteres)
- [ ] Usar HTTPS (certificado SSL)
- [ ] Configurar firewall para portas 3000 e 5000
- [ ] Desabilitar dados de exemplo em produção
- [ ] Fazer backup regular do banco de dados
- [ ] Atualizar dependências regularmente (`npm audit`)
- [ ] Configurar variável `NODE_ENV=production`
- [ ] Usar gerenciador de processos (PM2, systemd)
- [ ] Configurar logs de auditoria

### Backup do Banco de Dados

```bash
# Fazer backup
pg_dump -U ti_admin -d gestao_ti -F c -f backup_gestao_ti_$(date +%Y%m%d).dump

# Restaurar backup
pg_restore -U ti_admin -d gestao_ti -F c backup_gestao_ti_20241012.dump
```

---

## 📞 Suporte

### Precisa de Ajuda?

- **Documentação PostgreSQL:** [https://www.postgresql.org/docs/](https://www.postgresql.org/docs/)
- **Documentação Node.js:** [https://nodejs.org/docs/](https://nodejs.org/docs/)
- **Documentação React:** [https://react.dev/](https://react.dev/)
- **Documentação Vite:** [https://vitejs.dev/](https://vitejs.dev/)

### Logs do Sistema

Verifique os logs em caso de erro:
```bash
# Ver logs do backend
npm run server

# Ver logs do frontend (console do navegador)
F12 -> Console
```

---

## ✅ Checklist de Instalação

Use este checklist para garantir que tudo foi instalado corretamente:

- [ ] Node.js 18+ instalado (`node --version`)
- [ ] PostgreSQL 12+ instalado (`psql --version`)
- [ ] Banco de dados `gestao_ti` criado
- [ ] Usuário do banco configurado
- [ ] Arquivo `.env` criado e configurado
- [ ] Dependências instaladas (`npm install` na raiz e em `/client`)
- [ ] Banco de dados inicializado (`node server/src/seed.js`)
- [ ] Sistema rodando em `http://localhost:5000`
- [ ] Login realizado com sucesso
- [ ] Senha do administrador alterada

---

**🎉 Parabéns! Sistema instalado com sucesso!**

O Sistema de Gestão de T.I. TesteeGo está pronto para uso. Aproveite todas as funcionalidades e gerencie sua infraestrutura de TI de forma eficiente!

---

*Última atualização: Outubro 2024*  
*Versão do Manual: 1.0*
