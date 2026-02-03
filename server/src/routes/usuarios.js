import express from 'express';
import bcrypt from 'bcrypt';
import { query } from '../database.js';
import { authMiddleware, checkModulePermission } from '../middleware/auth.js';
import { registrarAuditoria } from '../services/auditoria.js';

const router = express.Router();

router.use(authMiddleware);
const SALT_ROUNDS = 10;

router.get('/', checkModulePermission('usuarios', 'pode_visualizar'), async (req, res) => {
  try {
    const result = await query('SELECT id, nome, email, cargo, departamento, nivel_permissao, ativo, criado_em FROM usuarios ORDER BY nome');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', checkModulePermission('usuarios', 'pode_visualizar'), async (req, res) => {
  try {
    const result = await query('SELECT id, nome, email, cargo, departamento, nivel_permissao, ativo, criado_em FROM usuarios WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', checkModulePermission('usuarios', 'pode_criar'), async (req, res) => {
  const { nome, email, senha, cargo, departamento, nivel_permissao } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(senha, SALT_ROUNDS);
    const result = await query(
      'INSERT INTO usuarios (nome, email, senha, cargo, departamento, nivel_permissao) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, nome, email, cargo, departamento, nivel_permissao',
      [nome, email, hashedPassword, cargo, departamento, nivel_permissao || 'usuario']
    );
    await registrarAuditoria(req.user.id, 'criar', 'usuarios', result.rows[0].id, { nome, email, cargo }, req.ip);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', checkModulePermission('usuarios', 'pode_editar'), async (req, res) => {
  const { nome, email, senha, cargo, departamento, nivel_permissao, ativo } = req.body;
  try {
    let result;
    
    // Se uma nova senha foi fornecida, hashear e atualizar
    if (senha && senha.trim() !== '') {
      const hashedPassword = await bcrypt.hash(senha, SALT_ROUNDS);
      result = await query(
        'UPDATE usuarios SET nome = $1, email = $2, senha = $3, cargo = $4, departamento = $5, nivel_permissao = $6, ativo = $7, atualizado_em = CURRENT_TIMESTAMP WHERE id = $8 RETURNING id, nome, email, cargo, departamento, nivel_permissao, ativo',
        [nome, email, hashedPassword, cargo, departamento, nivel_permissao, ativo, req.params.id]
      );
    } else {
      // Se não foi fornecida senha, atualizar sem alterar a senha
      result = await query(
        'UPDATE usuarios SET nome = $1, email = $2, cargo = $3, departamento = $4, nivel_permissao = $5, ativo = $6, atualizado_em = CURRENT_TIMESTAMP WHERE id = $7 RETURNING id, nome, email, cargo, departamento, nivel_permissao, ativo',
        [nome, email, cargo, departamento, nivel_permissao, ativo, req.params.id]
      );
    }
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    await registrarAuditoria(req.user.id, 'atualizar', 'usuarios', parseInt(req.params.id), { nome, email, nivel_permissao }, req.ip);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', checkModulePermission('usuarios', 'pode_excluir'), async (req, res) => {
  try {
    const usuario = await query('SELECT nome, email FROM usuarios WHERE id = $1', [req.params.id]);
    const result = await query('DELETE FROM usuarios WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    await registrarAuditoria(req.user.id, 'excluir', 'usuarios', parseInt(req.params.id), { nome: usuario.rows[0]?.nome, email: usuario.rows[0]?.email }, req.ip);
    res.json({ message: 'Usuário excluído com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
