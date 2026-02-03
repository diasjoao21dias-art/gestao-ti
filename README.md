# 🚀 Sistema de Gestão de T.I. - TesteeGo

Sistema completo de gestão de infraestrutura de TI com helpdesk profissional, gestão de ativos, projetos, licenças e base de conhecimento.

## ✅ VERSÃO CORRIGIDA (Outubro 2025)

**Problema corrigido:** O erro "não existe a coluna setor_id" que ocorria ao inicializar o banco de dados no Windows foi **TOTALMENTE CORRIGIDO**! A criação dos índices foi otimizada para garantir compatibilidade total com PostgreSQL em todos os sistemas operacionais.

## ⚡ Início Rápido

### Pré-requisitos
- Node.js 18+ ([Download](https://nodejs.org))
- PostgreSQL 12+ ([Download](https://www.postgresql.org/download/))

### Instalação Rápida

```bash
# 1. Instalar dependências
npm install
cd client && npm install && cd ..

# 2. Configurar banco de dados PostgreSQL
createdb gestao_ti

# 3. Configurar variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações

# 4. Inicializar banco de dados
node server/src/seed.js
node server/src/seed-sla.js

# 5. Iniciar o sistema
npm run dev
```

### Acesso

- **URL:** http://localhost:5000
- **Email:** admin@itmanager.com
- **Senha:** admin123

⚠️ **Altere a senha após o primeiro login!**

## 📚 Documentação Completa

Para instruções detalhadas de instalação, configuração e solução de problemas, consulte:

**[📖 Manual de Instalação Completo](MANUAL_INSTALACAO.md)**

O manual inclui:
- Guia passo a passo para Windows, macOS e Linux
- Configuração detalhada do PostgreSQL
- Variáveis de ambiente explicadas
- Solução de problemas comuns
- Checklist de segurança
- Comandos úteis

## ✨ Funcionalidades

### 📊 Dashboard
- Visão geral com KPIs em tempo real
- Gráficos de tickets, ativos e projetos
- Auto-refresh a cada 30 segundos

### 💻 Gestão de Ativos
- Controle de hardware, software e equipamentos de rede
- Histórico de movimentações
- Geração e leitura de QR Codes
- Busca avançada com filtros

### 🎫 Sistema de Tickets (Helpdesk)
- Visualização Kanban com drag-and-drop
- Timeline completa de comentários
- Templates de respostas rápidas
- Upload de arquivos (PDF, DOC, imagens, ZIP)
- Indicadores de SLA
- Notificações em tempo real
- Filtros inteligentes

### 📋 Gestão de Projetos
- Acompanhamento de tarefas
- Controle de prazos e orçamentos
- Progresso visual

### 📜 Controle de Licenças
- Gerenciamento de licenças de software
- Alertas de vencimento
- Controle de quantidades

### 👥 Gestão de Usuários
- Controle de acesso baseado em funções
- Perfis: Admin, Técnico, Usuário
- Departamentos e cargos

### 📚 Base de Conhecimento
- Artigos com categorias e tags
- Sistema de avaliação
- Contador de visualizações
- Busca inteligente

### 📈 Recursos Avançados
- **Notificações em Tempo Real** via WebSocket
- **Auditoria Completa** de ações do sistema
- **Relatórios** em PDF e Excel
- **SLA** configurável e monitoramento
- **QR Codes** para inventário

## 🏗️ Arquitetura

### Frontend
- **React 18** com TypeScript
- **Vite** para build otimizado
- **Tailwind CSS** para estilização
- **Recharts** para gráficos
- **React Router** para navegação

### Backend
- **Node.js** com Express
- **PostgreSQL** como banco de dados
- **Socket.IO** para WebSocket
- **JWT** para autenticação
- **Bcrypt** para hash de senhas

### Comunicação
- API RESTful (JSON)
- WebSocket para notificações em tempo real
- Proxy Vite para evitar CORS

## 📁 Estrutura do Projeto

```
TesteeGo/
├── client/              # Frontend React
│   ├── src/
│   │   ├── components/  # Componentes reutilizáveis
│   │   ├── pages/       # Páginas da aplicação
│   │   ├── services/    # Serviços e API
│   │   └── utils/       # Utilitários
│   └── package.json
├── server/              # Backend Node.js
│   └── src/
│       ├── routes/      # Rotas da API
│       ├── controllers/ # Lógica de negócio
│       ├── middleware/  # Autenticação
│       └── database.js  # Configuração DB
├── uploads/             # Arquivos enviados
├── .env                 # Variáveis de ambiente
└── package.json         # Dependências
```

## 🔧 Comandos Disponíveis

```bash
# Desenvolvimento (frontend + backend)
npm run dev

# Apenas backend
npm run server

# Apenas frontend
npm run client

# Build para produção
cd client && npm run build

# Resetar banco de dados
node server/src/seed.js
```

## 🔒 Segurança

### Checklist de Produção
- [ ] Alterar senha padrão do administrador
- [ ] Gerar JWT_SECRET forte e único
- [ ] Configurar HTTPS (SSL/TLS)
- [ ] Desabilitar dados de exemplo
- [ ] Configurar backup automático do banco
- [ ] Atualizar dependências (`npm audit`)
- [ ] Configurar `NODE_ENV=production`

### Backup do Banco

```bash
# Criar backup
pg_dump -U ti_admin -d gestao_ti -F c -f backup.dump

# Restaurar backup
pg_restore -U ti_admin -d gestao_ti -F c backup.dump
```

## 🐛 Solução de Problemas

### Porta em uso
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID [PID] /F

# macOS/Linux
lsof -ti:5000 | xargs kill -9
```

### Erro de conexão com banco
```bash
# Verificar se PostgreSQL está rodando
# Windows: services.msc
# macOS: brew services start postgresql
# Linux: sudo systemctl start postgresql
```

### Dependências não instaladas
```bash
rm -rf node_modules package-lock.json
rm -rf client/node_modules client/package-lock.json
npm install
cd client && npm install
```

Para problemas mais complexos, consulte o [Manual de Instalação](MANUAL_INSTALACAO.md).

## 📝 Variáveis de Ambiente (.env)

```env
# Banco de Dados
DATABASE_URL=postgresql://usuario:senha@localhost:5432/gestao_ti
PGHOST=localhost
PGPORT=5432
PGUSER=ti_admin
PGPASSWORD=sua_senha
PGDATABASE=gestao_ti

# Servidor
PORT=3000
NODE_ENV=development

# Segurança
JWT_SECRET=sua_chave_secreta_aqui

# URLs
FRONTEND_URL=http://localhost:5000
BACKEND_URL=http://localhost:3000
```

## 🎯 Roadmap

- [ ] Integração com Active Directory / LDAP
- [ ] App mobile (React Native)
- [ ] Chat interno para tickets
- [ ] Automações e workflows personalizados
- [ ] Dashboard customizável
- [ ] Integração com ferramentas de monitoramento
- [ ] API pública com documentação
- [ ] Multi-tenancy

## 📄 Licença

Este projeto está sob a licença ISC.

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📞 Suporte

- **Documentação:** [Manual de Instalação](MANUAL_INSTALACAO.md)
- **Issues:** Reporte bugs e sugira funcionalidades

---

**Desenvolvido com ❤️ para facilitar a gestão de TI**
