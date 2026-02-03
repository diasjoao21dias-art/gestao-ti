import express from 'express';
import { query } from '../database.js';
import { authMiddleware, checkModulePermission } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', checkModulePermission('auditoria', 'pode_visualizar'), async (req, res) => {
  try {
    const { usuario_id, modulo, acao, data_inicio, data_fim, limit = 100 } = req.query;
    
    let sql = `
      SELECT la.*, u.nome as usuario_nome 
      FROM logs_auditoria la
      LEFT JOIN usuarios u ON la.usuario_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;
    
    if (usuario_id) {
      sql += ` AND la.usuario_id = $${paramCount}`;
      params.push(usuario_id);
      paramCount++;
    }
    
    if (modulo) {
      sql += ` AND la.modulo = $${paramCount}`;
      params.push(modulo);
      paramCount++;
    }
    
    if (acao) {
      sql += ` AND la.acao = $${paramCount}`;
      params.push(acao);
      paramCount++;
    }
    
    if (data_inicio) {
      sql += ` AND la.criado_em >= $${paramCount}`;
      params.push(data_inicio);
      paramCount++;
    }
    
    if (data_fim) {
      sql += ` AND la.criado_em <= $${paramCount}`;
      params.push(data_fim);
      paramCount++;
    }
    
    sql += ` ORDER BY la.criado_em DESC LIMIT $${paramCount}`;
    params.push(parseInt(limit));
    
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', checkModulePermission('auditoria', 'pode_criar'), async (req, res) => {
  try {
    const { usuario_id, acao, modulo, registro_id, detalhes, ip_address } = req.body;
    
    const result = await query(
      `INSERT INTO logs_auditoria (usuario_id, acao, modulo, registro_id, detalhes, ip_address) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [usuario_id, acao, modulo, registro_id || null, detalhes || null, ip_address || null]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/relatorio', checkModulePermission('auditoria', 'pode_visualizar'), async (req, res) => {
  try {
    const { data_inicio, data_fim } = req.query;
    
    const result = await query(
      `SELECT 
        modulo,
        acao,
        COUNT(*) as total,
        COUNT(DISTINCT usuario_id) as usuarios_unicos
      FROM logs_auditoria
      WHERE criado_em BETWEEN $1 AND $2
      GROUP BY modulo, acao
      ORDER BY total DESC`,
      [data_inicio, data_fim]
    );
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
