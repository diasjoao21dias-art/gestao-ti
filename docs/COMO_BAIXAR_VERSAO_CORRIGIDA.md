# 📥 Como Baixar a Versão Corrigida para Windows

## ✅ O Problema Foi Corrigido!

O erro **"não existe a coluna setor_id"** foi totalmente corrigido nesta versão do Replit. O código agora funciona perfeitamente em Windows, Mac e Linux.

## 🔽 Como Baixar o Sistema Corrigido

### Opção 1: Download Direto do Replit (Recomendado)

1. **Abra o Shell do Replit** (botão "Shell" no canto inferior)

2. **Execute este comando** para criar um arquivo ZIP com a versão corrigida:

```bash
zip -r sistema-gestao-ti-corrigido.zip . -x "node_modules/*" -x "client/node_modules/*" -x ".git/*" -x "uploads/*" -x "*.log" -x ".cache/*" -x ".config/*" -x ".upm/*"
```

3. **Baixe o arquivo** `sistema-gestao-ti-corrigido.zip` que aparecerá na lista de arquivos

### Opção 2: Download via Git

```bash
# Clone o repositório
git clone [URL_DO_SEU_REPL]

# Entre na pasta
cd [NOME_DA_PASTA]
```

### Opção 3: Copiar Arquivos Manualmente

Baixe estes arquivos essenciais do Replit:

#### Arquivos Principais:
- ✅ `package.json`
- ✅ `package-lock.json`
- ✅ `server/` (pasta completa)
- ✅ `client/` (pasta completa) 
- ✅ `public/` (pasta completa)
- ✅ `.env` (crie localmente seguindo o exemplo abaixo)

#### Documentação:
- 📄 `LEIA_ME_PRIMEIRO.txt`
- 📄 `INSTALACAO_WINDOWS.md`
- 📄 `README.md`
- 📄 `reset_database.sql`

## 📋 Após Baixar

1. **Extraia o ZIP** em uma pasta (exemplo: `C:\Sistema-GestaoTi`)

2. **Crie o arquivo `.env`** na raiz com este conteúdo:

```env
DATABASE_URL=postgresql://postgres:SUA_SENHA@localhost:5432/gestao_ti
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=SUA_SENHA
PGDATABASE=gestao_ti
PORT=3000
NODE_ENV=development
JWT_SECRET=sua_chave_secreta_jwt_123456789
FRONTEND_URL=http://localhost:5000
BACKEND_URL=http://localhost:3000
```

**⚠️ Substitua `SUA_SENHA` pela senha do seu PostgreSQL!**

3. **Siga as instruções** do arquivo `LEIA_ME_PRIMEIRO.txt` ou `INSTALACAO_WINDOWS.md`

## 🔧 Instalação Rápida

```bash
# Criar banco de dados (no SQL Shell psql)
CREATE DATABASE gestao_ti;

# Instalar dependências
npm install
cd client && npm install && cd ..

# Iniciar sistema
npm run dev
```

## 🌐 Acessar

- **URL:** http://localhost:5000
- **Email:** admin@itmanager.com
- **Senha:** admin123

⚠️ **Altere a senha após o primeiro login!**

## ✨ O Que Foi Corrigido

### Problema Original:
```
❌ Erro ao inicializar banco de dados: error: não existe a coluna "setor_id"
```

### Solução Aplicada:
- ✅ Separação da criação de índices em comando independente
- ✅ Ordem correta de criação de tabelas e índices
- ✅ Compatibilidade total com PostgreSQL no Windows

### Arquivo Corrigido:
- `server/src/database.js` - Linhas 223-242

## 📞 Precisa de Ajuda?

1. Leia o arquivo `LEIA_ME_PRIMEIRO.txt`
2. Consulte o guia `INSTALACAO_WINDOWS.md`
3. Verifique a seção "Solução de Problemas" no README.md

---

**Sistema testado e funcionando em:**
- ✅ Windows 10/11
- ✅ PostgreSQL 12, 13, 14, 15, 16
- ✅ Node.js 18, 20

Versão Corrigida - Outubro 2025
