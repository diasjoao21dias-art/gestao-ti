import jwt from 'jsonwebtoken';
import { query } from '../database.js';

const getJWTSecret = () => {
  if (!process.env.JWT_SECRET) {
    console.warn('⚠️  AVISO: JWT_SECRET não configurado! Usando fallback (INSEGURO para produção)');
    return 'fallback-jwt-secret-change-me';
  }
  return process.env.JWT_SECRET;
};

export const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const decoded = jwt.verify(token, getJWTSecret());
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

export const checkPermission = (requiredLevel) => {
  const levels = { usuario: 1, tecnico: 2, admin: 3 };
  
  return (req, res, next) => {
    const userLevel = levels[req.user.nivel_permissao] || 0;
    const required = levels[requiredLevel] || 99;
    
    if (userLevel < required) {
      return res.status(403).json({ error: 'Permissão negada' });
    }
    
    next();
  };
};

// Middleware para verificar permissões granulares
export const checkModulePermission = (modulo, acao) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      
      // Admin sempre tem permissão total
      if (req.user.nivel_permissao === 'admin') {
        return next();
      }
      
      // Validar ação
      const acoesValidas = ['pode_visualizar', 'pode_criar', 'pode_editar', 'pode_excluir'];
      if (!acoesValidas.includes(acao)) {
        return res.status(400).json({ error: 'Ação inválida' });
      }
      
      // Verificar permissão específica
      const result = await query(
        `SELECT 
          CASE 
            WHEN $3 = 'pode_visualizar' THEN pode_visualizar
            WHEN $3 = 'pode_criar' THEN pode_criar
            WHEN $3 = 'pode_editar' THEN pode_editar
            WHEN $3 = 'pode_excluir' THEN pode_excluir
            ELSE false
          END as permitido
        FROM permissoes_usuario 
        WHERE usuario_id = $1 AND modulo = $2`,
        [userId, modulo, acao]
      );
      
      const permitido = result.rows[0]?.permitido || false;
      
      if (!permitido) {
        return res.status(403).json({ 
          error: 'Sem permissão para esta ação',
          detalhes: `Você não tem permissão para ${acao.replace('pode_', '')} em ${modulo}`
        });
      }
      
      next();
    } catch (error) {
      console.error('Erro ao verificar permissão:', error);
      return res.status(500).json({ error: 'Erro ao verificar permissão' });
    }
  };
};

export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      nome: user.nome,
      nivel_permissao: user.nivel_permissao
    },
    getJWTSecret(),
    { expiresIn: '24h' }
  );
};
