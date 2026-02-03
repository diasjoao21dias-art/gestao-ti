# Teste do Sistema de Permissões

## Credenciais de Teste

### Usuário Administrador (Acesso Total)
- **Email**: `admin@itmanager.com`
- **Senha**: `admin123`
- **Permissões**: Acesso total a todos os módulos

### Usuário de Teste (Permissões Limitadas)
- **Email**: `teste@testcraft.com`
- **Senha**: `teste123`
- **Permissões**: 
  - ✅ **Tickets**: Pode visualizar e criar (NÃO pode editar ou excluir)
  - ❌ **Ativos**: Sem acesso
  - ❌ **Projetos**: Sem acesso
  - ❌ **Licenças**: Sem acesso
  - ❌ **Usuários**: Sem acesso
  - ❌ **Conhecimento**: Sem acesso
  - ❌ **Relatórios**: Sem acesso
  - ❌ **Auditoria**: Sem acesso

## Como Testar

### 1. Teste com Administrador
1. Faça login com `admin@itmanager.com` / `admin123`
2. Navegue para qualquer módulo
3. Verifique que TODOS os botões estão visíveis:
   - ✅ Botão "Novo" (criar)
   - ✅ Botão de Editar (ícone de lápis)
   - ✅ Botão de Excluir (ícone de lixeira)

### 2. Teste com Usuário Limitado
1. Faça logout do administrador
2. Faça login com `teste@testcraft.com` / `teste123`
3. **No módulo Tickets**:
   - ✅ Deve ver o botão "Novo Ticket" (pode criar)
   - ✅ Deve ver a lista de tickets (pode visualizar)
   - ❌ NÃO deve ver botões de Editar
   - ❌ NÃO deve ver botões de Excluir
4. **Nos outros módulos** (Ativos, Projetos, etc.):
   - ❌ Deve receber erro 403 ao tentar acessar
   - ❌ Nenhum botão deve estar visível

### 3. Teste de Criação de Ticket
1. Com o usuário de teste logado
2. Clique em "Novo Ticket"
3. Preencha os dados:
   - **Título**: "Teste de Permissões"
   - **Descrição**: "Verificando criação de ticket com permissões limitadas"
   - **Prioridade**: "média"
4. Salve o ticket
5. ✅ O ticket deve ser criado com sucesso
6. ❌ Mas NÃO deve aparecer botões de editar/excluir para este usuário

## Implementação Técnica

### Backend - Proteção de Rotas
Todas as rotas agora estão protegidas com middleware de autenticação e permissões:

```javascript
// Exemplo de rota protegida
router.get('/', checkModulePermission('tickets', 'pode_visualizar'), async (req, res) => {
  // ...
});

router.post('/', checkModulePermission('tickets', 'pode_criar'), async (req, res) => {
  // ...
});
```

### Frontend - Hook de Permissões
Criado hook customizado `usePermissions()` que:
- Carrega permissões do backend automaticamente
- Cacheia as permissões do usuário
- Fornece funções auxiliares: `canView`, `canCreate`, `canEdit`, `canDelete`

```typescript
// Exemplo de uso no frontend
const { canCreate, canEdit, canDelete } = usePermissions();

{canCreate('tickets') && (
  <button>Novo Ticket</button>
)}
```

### Módulos Protegidos
✅ **Backend**:
- tickets.js
- ativos.js
- licencas.js
- conhecimento.js
- projetos.js
- usuarios.js
- relatorios.js ← Adicionado proteção
- auditoria.js ← Adicionado proteção

✅ **Frontend**:
- Tickets.tsx
- Ativos.tsx
- Usuarios.tsx

## Resultados Esperados

### ✅ Usuário Admin
- Vê e pode usar TODOS os botões em TODOS os módulos
- Nenhuma restrição

### ✅ Usuário Teste
- **Módulo Tickets**: 
  - ✅ Vê botão "Novo Ticket"
  - ✅ Pode criar tickets
  - ❌ NÃO vê botões de editar/excluir
- **Outros Módulos**:
  - ❌ Erro 403 ao tentar acessar
  - ❌ Nenhum botão visível

## Verificação de Segurança

### Backend
- ✅ Todas as rotas verificam autenticação (authMiddleware)
- ✅ Todas as rotas CRUD verificam permissões granulares (checkModulePermission)
- ✅ Admin sempre tem acesso total
- ✅ Usuários não-admin dependem das permissões configuradas

### Frontend
- ✅ Botões são escondidos baseado em permissões
- ✅ Hook carrega permissões automaticamente no login
- ✅ Admin sempre vê todos os botões
- ✅ Usuários veem apenas botões permitidos
