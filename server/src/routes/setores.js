import express from 'express';
import { query } from '../database.js';
import { authMiddleware, checkPermission } from '../middleware/auth.js';
import { registrarAuditoria } from '../services/auditoria.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT s.*, 
        (SELECT COUNT(*) FROM setor_tecnicos WHERE setor_id = s.id) as total_tecnicos
       FROM setores s
       ORDER BY s.nome`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM setores WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Setor não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/tecnicos', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT u.id, u.nome, u.email, u.cargo, u.departamento, st.criado_em as vinculado_em
       FROM setor_tecnicos st
       JOIN usuarios u ON st.tecnico_id = u.id
       WHERE st.setor_id = $1
       ORDER BY u.nome`,
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', checkPermission('admin'), async (req, res) => {
  try {
    const { nome, descricao } = req.body;
    
    if (!nome) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }
    
    const result = await query(
      'INSERT INTO setores (nome, descricao, ativo) VALUES ($1, $2, true) RETURNING *',
      [nome, descricao || null]
    );
    
    await registrarAuditoria(req.user.id, 'criar', 'setores', result.rows[0].id, { nome }, req.ip);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Já existe um setor com este nome' });
    }
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', checkPermission('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, descricao, ativo } = req.body;
    
    const result = await query(
      `UPDATE setores 
       SET nome = COALESCE($1, nome),
           descricao = COALESCE($2, descricao),
           ativo = COALESCE($3, ativo),
           atualizado_em = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [nome, descricao, ativo, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Setor não encontrado' });
    }
    
    await registrarAuditoria(req.user.id, 'atualizar', 'setores', parseInt(id), { nome }, req.ip);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', checkPermission('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const checkTickets = await query(
      'SELECT COUNT(*) FROM tickets WHERE setor_id = $1',
      [id]
    );
    
    if (parseInt(checkTickets.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Não é possível excluir setor com tickets associados' 
      });
    }
    
    const result = await query('DELETE FROM setores WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Setor não encontrado' });
    }
    
    await registrarAuditoria(req.user.id, 'excluir', 'setores', parseInt(id), { nome: result.rows[0]?.nome }, req.ip);
    res.json({ message: 'Setor excluído com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/tecnicos', checkPermission('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { tecnico_id } = req.body;
    
    if (!tecnico_id) {
      return res.status(400).json({ error: 'ID do técnico é obrigatório' });
    }
    
    const checkTecnico = await query(
      "SELECT id FROM usuarios WHERE id = $1 AND nivel_permissao IN ('tecnico', 'admin')",
      [tecnico_id]
    );
    
    if (checkTecnico.rows.length === 0) {
      return res.status(400).json({ error: 'Usuário não é técnico ou admin' });
    }
    
    const result = await query(
      'INSERT INTO setor_tecnicos (setor_id, tecnico_id) VALUES ($1, $2) RETURNING *',
      [id, tecnico_id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Técnico já vinculado a este setor' });
    }
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id/tecnicos/:tecnicoId', checkPermission('admin'), async (req, res) => {
  try {
    const { id, tecnicoId } = req.params;
    
    const result = await query(
      'DELETE FROM setor_tecnicos WHERE setor_id = $1 AND tecnico_id = $2 RETURNING *',
      [id, tecnicoId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vínculo não encontrado' });
    }
    
    res.json({ message: 'Técnico removido do setor com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
