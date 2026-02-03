import express from 'express';
import { query } from '../database.js';
import { io } from '../index.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM configuracoes_sla WHERE ativo = true ORDER BY prioridade'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { nome, prioridade, tempo_resposta_horas, tempo_resolucao_horas } = req.body;
    
    const result = await query(
      `INSERT INTO configuracoes_sla (nome, prioridade, tempo_resposta_horas, tempo_resolucao_horas)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [nome, prioridade, tempo_resposta_horas, tempo_resolucao_horas]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, prioridade, tempo_resposta_horas, tempo_resolucao_horas, ativo } = req.body;
    
    const result = await query(
      `UPDATE configuracoes_sla 
       SET nome = $1, prioridade = $2, tempo_resposta_horas = $3, 
           tempo_resolucao_horas = $4, ativo = $5, atualizado_em = CURRENT_TIMESTAMP
       WHERE id = $6 RETURNING *`,
      [nome, prioridade, tempo_resposta_horas, tempo_resolucao_horas, ativo, id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await query('DELETE FROM configuracoes_sla WHERE id = $1', [id]);
    
    res.json({ message: 'SLA excluído com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/violacoes', async (req, res) => {
  try {
    const result = await query(`
      SELECT t.*, 
        cs.tempo_resposta_horas,
        cs.tempo_resolucao_horas,
        EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - t.criado_em))/3600 as horas_decorridas,
        u1.nome as solicitante_nome,
        u2.nome as atribuido_nome
      FROM tickets t
      LEFT JOIN configuracoes_sla cs ON t.prioridade = cs.prioridade AND cs.ativo = true
      LEFT JOIN usuarios u1 ON t.solicitante_id = u1.id
      LEFT JOIN usuarios u2 ON t.atribuido_a_id = u2.id
      WHERE t.status != 'resolvido'
      AND cs.id IS NOT NULL
      AND (
        (EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - t.criado_em))/3600) > cs.tempo_resposta_horas
        OR (EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - t.criado_em))/3600) > cs.tempo_resolucao_horas
      )
      ORDER BY horas_decorridas DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/tickets/:ticket_id/status', async (req, res) => {
  try {
    const { ticket_id } = req.params;
    
    const result = await query(`
      SELECT t.*,
        cs.tempo_resposta_horas,
        cs.tempo_resolucao_horas,
        EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - t.criado_em))/3600 as horas_decorridas,
        CASE 
          WHEN t.status = 'resolvido' THEN 'cumprido'
          WHEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - t.criado_em))/3600 > cs.tempo_resolucao_horas THEN 'violado'
          WHEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - t.criado_em))/3600 > (cs.tempo_resolucao_horas * 0.8) THEN 'em_risco'
          ELSE 'dentro_prazo'
        END as sla_status
      FROM tickets t
      LEFT JOIN configuracoes_sla cs ON t.prioridade = cs.prioridade AND cs.ativo = true
      WHERE t.id = $1
    `, [ticket_id]);
    
    res.json(result.rows[0] || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
