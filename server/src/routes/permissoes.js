import express from 'express';
import { query } from '../database.js';
import { authMiddleware, checkPermission } from '../middleware/auth.js';
import { registrarAuditoria } from '../services/auditoria.js';

const router = express.Router();

// Módulos disponíveis no sistema
const MODULOS = [
  'ativos',
  'tickets',
  'projetos',
  'licencas',
  'usuarios',
  'conhecimento',
  'relatorios',
  'auditoria'
];

// Buscar permissões de um usuário
router.get('/:usuarioId', authMiddleware, async (req, res) => {
  try {
    const { usuarioId } = req.params;
    
    // Permitir que usuário acesse suas próprias permissões ou admin acesse de qualquer um
    if (req.user.id !== parseInt(usuarioId) && req.user.nivel_permissao !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    const result = await query(
      'SELECT * FROM permissoes_usuario WHERE usuario_id = $1',
      [usuarioId]
    );
    
    // Criar objeto com todas as permissões (default false)
    const permissoes = {};
    MODULOS.forEach(modulo => {
      permissoes[modulo] = {
        pode_visualizar: false,
        pode_criar: false,
        pode_editar: false,
        pode_excluir: false
      };
    });
    
    // Sobrescrever com permissões salvas
    result.rows.forEach(perm => {
      permissoes[perm.modulo] = {
        pode_visualizar: perm.pode_visualizar,
        pode_criar: perm.pode_criar,
        pode_editar: perm.pode_editar,
        pode_excluir: perm.pode_excluir
      };
    });
    
    res.json({ modulos: MODULOS, permissoes });
  } catch (error) {
    console.error('Erro ao buscar permissões:', error);
    res.status(500).json({ error: 'Erro ao buscar permissões' });
  }
});

// Salvar permissões de um usuário
router.post('/:usuarioId', authMiddleware, checkPermission('admin'), async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const { permissoes } = req.body;
    
    // Deletar permissões existentes
    await query('DELETE FROM permissoes_usuario WHERE usuario_id = $1', [usuarioId]);
    
    // Inserir novas permissões
    for (const [modulo, perms] of Object.entries(permissoes)) {
      if (MODULOS.includes(modulo)) {
        await query(
          `INSERT INTO permissoes_usuario 
           (usuario_id, modulo, pode_visualizar, pode_criar, pode_editar, pode_excluir) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            usuarioId,
            modulo,
            perms.pode_visualizar || false,
            perms.pode_criar || false,
            perms.pode_editar || false,
            perms.pode_excluir || false
          ]
        );
      }
    }
    
    await registrarAuditoria(req.user.id, 'atualizar', 'permissoes', parseInt(usuarioId), { permissoes }, req.ip);
    res.json({ message: 'Permissões salvas com sucesso' });
  } catch (error) {
    console.error('Erro ao salvar permissões:', error);
    res.status(500).json({ error: 'Erro ao salvar permissões' });
  }
});

// Verificar se usuário tem permissão específica
router.post('/verificar', authMiddleware, async (req, res) => {
  try {
    const { usuarioId, modulo, acao } = req.body;
    
    // Validar ação para prevenir SQL injection
    const acoesValidas = ['pode_visualizar', 'pode_criar', 'pode_editar', 'pode_excluir'];
    if (!acoesValidas.includes(acao)) {
      return res.status(400).json({ error: 'Ação inválida' });
    }
    
    // Admin sempre tem todas as permissões
    const userResult = await query(
      'SELECT nivel_permissao FROM usuarios WHERE id = $1',
      [usuarioId]
    );
    
    if (userResult.rows[0]?.nivel_permissao === 'admin') {
      return res.json({ permitido: true });
    }
    
    // Verificar permissão específica usando CASE para segurança
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
      [usuarioId, modulo, acao]
    );
    
    const permitido = result.rows[0]?.permitido || false;
    res.json({ permitido });
  } catch (error) {
    console.error('Erro ao verificar permissão:', error);
    res.status(500).json({ error: 'Erro ao verificar permissão' });
  }
});

export default router;
