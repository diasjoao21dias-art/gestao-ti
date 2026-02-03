import express from 'express';
import { query } from '../database.js';
import { authMiddleware, checkModulePermission } from '../middleware/auth.js';
import { registrarAuditoria } from '../services/auditoria.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', checkModulePermission('licencas', 'pode_visualizar'), async (req, res) => {
  try {
    const result = await query(`
      SELECT l.*, u.nome as responsavel_nome
      FROM licencas l
      LEFT JOIN usuarios u ON l.responsavel_id = u.id
      ORDER BY l.data_expiracao ASC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', checkModulePermission('licencas', 'pode_visualizar'), async (req, res) => {
  try {
    const result = await query(`
      SELECT l.*, u.nome as responsavel_nome
      FROM licencas l
      LEFT JOIN usuarios u ON l.responsavel_id = u.id
      WHERE l.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Licença não encontrada' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', checkModulePermission('licencas', 'pode_criar'), async (req, res) => {
  const { software, tipo_licenca, quantidade_total, chave_licenca, fornecedor, data_aquisicao, data_expiracao, valor, responsavel_id, observacoes } = req.body;
  try {
    const result = await query(
      'INSERT INTO licencas (software, tipo_licenca, quantidade_total, chave_licenca, fornecedor, data_aquisicao, data_expiracao, valor, responsavel_id, observacoes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [software, tipo_licenca, quantidade_total, chave_licenca, fornecedor, data_aquisicao, data_expiracao, valor, responsavel_id, observacoes]
    );
    await registrarAuditoria(req.user.id, 'criar', 'licencas', result.rows[0].id, { software, tipo_licenca }, req.ip);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', checkModulePermission('licencas', 'pode_editar'), async (req, res) => {
  const { software, tipo_licenca, quantidade_total, quantidade_usada, chave_licenca, fornecedor, data_aquisicao, data_expiracao, valor, responsavel_id, status, observacoes } = req.body;
  try {
    const result = await query(
      'UPDATE licencas SET software = $1, tipo_licenca = $2, quantidade_total = $3, quantidade_usada = $4, chave_licenca = $5, fornecedor = $6, data_aquisicao = $7, data_expiracao = $8, valor = $9, responsavel_id = $10, status = $11, observacoes = $12, atualizado_em = CURRENT_TIMESTAMP WHERE id = $13 RETURNING *',
      [software, tipo_licenca, quantidade_total, quantidade_usada, chave_licenca, fornecedor, data_aquisicao, data_expiracao, valor, responsavel_id, status, observacoes, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Licença não encontrada' });
    }
    await registrarAuditoria(req.user.id, 'atualizar', 'licencas', parseInt(req.params.id), { software, status }, req.ip);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', checkModulePermission('licencas', 'pode_excluir'), async (req, res) => {
  try {
    const licenca = await query('SELECT software FROM licencas WHERE id = $1', [req.params.id]);
    const result = await query('DELETE FROM licencas WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Licença não encontrada' });
    }
    await registrarAuditoria(req.user.id, 'excluir', 'licencas', parseInt(req.params.id), { software: licenca.rows[0]?.software }, req.ip);
    res.json({ message: 'Licença excluída com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
