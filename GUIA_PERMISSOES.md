# 📋 Guia de Uso: Sistema de Permissões

## ✅ Status do Sistema
- **API de Permissões**: Funcionando corretamente
- **Frontend**: Implementado e testado
- **Logs**: Melhorados para facilitar diagnóstico

## 🔧 Como Usar o Sistema de Permissões

### 1. Acessar a Gestão de Usuários
1. Faça login no sistema com **admin@itmanager.com** / **admin123**
2. No menu lateral, clique em **"Usuários"**
3. Você verá a lista de todos os usuários do sistema

### 2. Gerenciar Permissões de um Usuário
1. Localize o usuário desejado na tabela
2. Clique no ícone **🛡️ (escudo)** na coluna de Ações
3. O modal de permissões será aberto

### 3. Configurar Permissões
No modal de permissões você pode:

#### Módulos Disponíveis:
- **Ativos**: Gestão de ativos de TI
- **Tickets**: Sistema de chamados
- **Projetos**: Gestão de projetos
- **Licenças**: Controle de licenças
- **Usuários**: Gestão de usuários
- **Conhecimento**: Base de conhecimento
- **Relatórios**: Relatórios e exportações
- **Auditoria**: Logs de auditoria

#### Tipos de Permissão:
- 👁️ **Visualizar**: Pode ver os dados do módulo
- ➕ **Criar**: Pode criar novos registros
- ✏️ **Editar**: Pode editar registros existentes
- 🗑️ **Excluir**: Pode excluir registros

### 4. Atalhos Rápidos
- **Marcar Todas**: Concede todas as permissões em todos os módulos
- **Desmarcar Todas**: Remove todas as permissões
- **Todas (por coluna)**: Marca/desmarca uma ação específica em todos os módulos
- **✓/✗ (por linha)**: Marca/desmarca todas as ações de um módulo específico

### 5. Salvar as Permissões
1. Configure as permissões desejadas
2. Clique em **"Salvar Permissões"**
3. Aguarde a confirmação: "✅ Permissões salvas com sucesso!"

## ⚠️ Observações Importantes

### Hierarquia de Permissões:
1. **Administrador**: Tem acesso total, independente das permissões configuradas
2. **Técnico**: Depende das permissões configuradas
3. **Usuário**: Depende das permissões configuradas

### Dicas:
- Usuários **admin** sempre têm acesso completo (aviso amarelo no modal)
- As permissões são granulares por módulo e ação
- Você pode testar as permissões fazendo login com o usuário modificado

## 🧪 Página de Teste

Criamos uma página especial para testar a API:
👉 **http://localhost:5000/test-permissoes.html**

Esta página permite:

**Nota de Segurança**: Para usar a página de teste, você precisa fazer login manualmente com suas credenciais de administrador.
- Fazer login (digite suas credenciais manualmente)
- Buscar permissões de qualquer usuário
- Salvar permissões de exemplo
- Verificar permissões específicas

## 🔍 Resolução de Problemas

### Erro: "Token não fornecido"
- Faça logout e login novamente
- Limpe o cache do navegador

### Erro: "Permissão negada"
- Verifique se você está logado como administrador
- Apenas admins podem gerenciar permissões de outros usuários

### Modal não abre
1. Abra o console do navegador (F12)
2. Procure por erros em vermelho
3. Verifique os logs prefixados com `[ModalPermissoes]`

### Permissões não salvam
1. Abra o console do navegador
2. Verifique a mensagem de erro detalhada
3. Certifique-se de que está conectado à internet

## 📊 Logs de Debug

O sistema agora inclui logs detalhados:
- `[ModalPermissoes] Carregando permissões...`: Quando abre o modal
- `[ModalPermissoes] Permissões carregadas`: Sucesso ao carregar
- `[ModalPermissoes] Salvando permissões...`: Ao clicar em salvar
- `[ModalPermissoes] Permissões salvas com sucesso!`: Confirmação de salvamento

Para ver estes logs:
1. Pressione **F12** no navegador
2. Vá na aba **Console**
3. Filtre por "ModalPermissoes"

## ✨ Melhorias Implementadas

1. ✅ Melhor tratamento de erros
2. ✅ Mensagens de feedback mais claras
3. ✅ Logs detalhados para diagnóstico
4. ✅ Página de teste da API
5. ✅ Validação de tipos TypeScript

---

**Precisa de ajuda?** Verifique os logs do console ou use a página de teste!
