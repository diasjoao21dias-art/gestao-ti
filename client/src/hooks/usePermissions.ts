import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface ModulePermissions {
  pode_visualizar: boolean;
  pode_criar: boolean;
  pode_editar: boolean;
  pode_excluir: boolean;
}

interface UserPermissions {
  [modulo: string]: ModulePermissions;
}

export const usePermissions = () => {
  const { user, token } = useAuth();
  const [permissions, setPermissions] = useState<UserPermissions>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!user || !token) {
        setPermissions({});
        setIsLoading(false);
        return;
      }

      // Admin sempre tem todas as permissões
      if (user.nivel_permissao === 'admin') {
        const adminPermissions: UserPermissions = {};
        const modules = ['ativos', 'tickets', 'projetos', 'licencas', 'usuarios', 'conhecimento', 'relatorios', 'auditoria'];
        
        modules.forEach(modulo => {
          adminPermissions[modulo] = {
            pode_visualizar: true,
            pode_criar: true,
            pode_editar: true,
            pode_excluir: true,
          };
        });

        setPermissions(adminPermissions);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/permissoes/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setPermissions(data.permissoes || {});
        } else {
          setPermissions({});
        }
      } catch (error) {
        console.error('Erro ao buscar permissões:', error);
        setPermissions({});
      } finally {
        setIsLoading(false);
      }
    };

    fetchPermissions();
  }, [user, token]);

  const hasPermission = (modulo: string, acao: 'pode_visualizar' | 'pode_criar' | 'pode_editar' | 'pode_excluir'): boolean => {
    // Admin sempre tem permissão
    if (user?.nivel_permissao === 'admin') {
      return true;
    }

    // Verifica se o módulo existe nas permissões
    if (!permissions[modulo]) {
      return false;
    }

    return permissions[modulo][acao] || false;
  };

  const canView = (modulo: string) => hasPermission(modulo, 'pode_visualizar');
  const canCreate = (modulo: string) => hasPermission(modulo, 'pode_criar');
  const canEdit = (modulo: string) => hasPermission(modulo, 'pode_editar');
  const canDelete = (modulo: string) => hasPermission(modulo, 'pode_excluir');

  return {
    permissions,
    isLoading,
    hasPermission,
    canView,
    canCreate,
    canEdit,
    canDelete,
  };
};
