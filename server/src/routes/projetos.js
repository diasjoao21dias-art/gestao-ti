import express from 'express';
import { query } from '../database.js';
import { authMiddleware, checkModulePermission } from '../middleware/auth.js';
import { registrarAuditoria } from '../services/auditoria.js';

const router = express.Router();

router.use(authMiddleware);

const updateProjectProgress = async (projetoId) => {
  try {
    const tarefasResult = await query(
      'SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = $1 OR concluido = true) as concluidas FROM tarefas_projeto WHERE projeto_id = $2',
      ['concluido', projetoId]
    );
    
    const { total, concluidas } = tarefasResult.rows[0];
    const progresso = total > 0 ? Math.round((concluidas / total) * 100) : 0;
    
    let novoStatus;
    if (progresso === 100 && parseInt(total) > 0) {
      novoStatus = 'concluido';
    } else if (progresso > 0) {
      novoStatus = 'em_andamento';
    } else {
      novoStatus = 'planejamento';
    }
    
    await query(
      'UPDATE projetos SET progresso = $1, status = $2, atualizado_em = CURRENT_TIMESTAMP WHERE id = $3',
      [progresso, novoStatus, projetoId]
    );
    
    return progresso;
  } catch (error) {
    console.error('Erro ao atualizar progresso:', error);
    throw error;
  }
};

router.get('/', checkModulePermission('projetos', 'pode_visualizar'), async (req, res) => {
  try {
    const result = await query(`
      SELECT p.*, u.nome as gerente_nome
      FROM projetos p
      LEFT JOIN usuarios u ON p.gerente_id = u.id
      ORDER BY p.criado_em DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', checkModulePermission('projetos', 'pode_visualizar'), async (req, res) => {
  try {
    const projetoResult = await query(`
      SELECT p.*, u.nome as gerente_nome
      FROM projetos p
      LEFT JOIN usuarios u ON p.gerente_id = u.id
      WHERE p.id = $1
    `, [req.params.id]);
    
    if (projetoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    const tarefasResult = await query(`
      SELECT t.*, u.nome as responsavel_nome
      FROM tarefas_projeto t
      LEFT JOIN usuarios u ON t.responsavel_id = u.id
      WHERE t.projeto_id = $1
      ORDER BY t.criado_em DESC
    `, [req.params.id]);

    res.json({
      ...projetoResult.rows[0],
      tarefas: tarefasResult.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', checkModulePermission('projetos', 'pode_criar'), async (req, res) => {
  const { nome, descricao, prioridade, data_inicio, data_prevista_fim, orcamento, gerente_id } = req.body;
  try {
    const result = await query(
      'INSERT INTO projetos (nome, descricao, prioridade, data_inicio, data_prevista_fim, orcamento, gerente_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [nome, descricao, prioridade || 'media', data_inicio, data_prevista_fim, orcamento, gerente_id]
    );
    await registrarAuditoria(req.user.id, 'criar', 'projetos', result.rows[0].id, { nome, prioridade }, req.ip);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/tarefas', checkModulePermission('projetos', 'pode_editar'), async (req, res) => {
  const { titulo, descricao, responsavel_id, prioridade, data_prevista, status } = req.body;
  try {
    const result = await query(
      'INSERT INTO tarefas_projeto (projeto_id, titulo, descricao, responsavel_id, prioridade, data_prevista, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [req.params.id, titulo, descricao, responsavel_id, prioridade || 'media', data_prevista, status || 'pendente']
    );
    
    await updateProjectProgress(req.params.id);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', checkModulePermission('projetos', 'pode_editar'), async (req, res) => {
  const { nome, descricao, status, prioridade, data_inicio, data_prevista_fim, data_fim, orcamento, gerente_id, progresso } = req.body;
  try {
    const result = await query(
      'UPDATE projetos SET nome = $1, descricao = $2, status = $3, prioridade = $4, data_inicio = $5, data_prevista_fim = $6, data_fim = $7, orcamento = $8, gerente_id = $9, progresso = $10, atualizado_em = CURRENT_TIMESTAMP WHERE id = $11 RETURNING *',
      [nome, descricao, status, prioridade, data_inicio, data_prevista_fim, data_fim, orcamento, gerente_id, progresso, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }
    await registrarAuditoria(req.user.id, 'atualizar', 'projetos', parseInt(req.params.id), { nome, status }, req.ip);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/tarefas/:id', checkModulePermission('projetos', 'pode_editar'), async (req, res) => {
  try {
    const tarefaAtual = await query('SELECT projeto_id FROM tarefas_projeto WHERE id = $1', [req.params.id]);
    if (tarefaAtual.rows.length === 0) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }
    const projetoId = tarefaAtual.rows[0].projeto_id;
    
    const allowedFields = ['titulo', 'descricao', 'status', 'prioridade', 'concluido'];
    const updates = [];
    const values = [];
    let paramCount = 1;

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = $${paramCount}`);
        values.push(req.body[field]);
        paramCount++;
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    updates.push(`atualizado_em = CURRENT_TIMESTAMP`);
    values.push(req.params.id);

    const result = await query(
      `UPDATE tarefas_projeto SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    await updateProjectProgress(projetoId);

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/tarefas/:id', checkModulePermission('projetos', 'pode_excluir'), async (req, res) => {
  try {
    const tarefaAtual = await query('SELECT projeto_id FROM tarefas_projeto WHERE id = $1', [req.params.id]);
    if (tarefaAtual.rows.length === 0) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }
    const projetoId = tarefaAtual.rows[0].projeto_id;
    
    await query('DELETE FROM tarefas_projeto WHERE id = $1', [req.params.id]);
    
    await updateProjectProgress(projetoId);
    
    res.json({ message: 'Tarefa excluída com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', checkModulePermission('projetos', 'pode_excluir'), async (req, res) => {
  try {
    const projeto = await query('SELECT nome FROM projetos WHERE id = $1', [req.params.id]);
    const result = await query('DELETE FROM projetos WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }
    await registrarAuditoria(req.user.id, 'excluir', 'projetos', parseInt(req.params.id), { nome: projeto.rows[0]?.nome }, req.ip);
    res.json({ message: 'Projeto excluído com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
