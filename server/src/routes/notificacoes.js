import express from 'express';
import { query } from '../database.js';
import { io } from '../index.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { usuario_id, lida } = req.query;
    
    let sql = 'SELECT * FROM notificacoes WHERE 1=1';
    const params = [];
    let paramCount = 1;
    
    if (usuario_id) {
      sql += ` AND usuario_id = $${paramCount}`;
      params.push(usuario_id);
      paramCount++;
    }
    
    if (lida !== undefined) {
      sql += ` AND lida = $${paramCount}`;
      params.push(lida === 'true');
      paramCount++;
    }
    
    sql += ' ORDER BY criado_em DESC LIMIT 50';
    
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { usuario_id, tipo, titulo, mensagem, link } = req.body;
    
    const result = await query(
      `INSERT INTO notificacoes (usuario_id, tipo, titulo, mensagem, link) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [usuario_id, tipo, titulo, mensagem, link || null]
    );
    
    const notificacao = result.rows[0];
    
    io.to(`user_${usuario_id}`).emit('notificacao', notificacao);
    
    res.status(201).json(notificacao);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/ler', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'UPDATE notificacoes SET lida = true WHERE id = $1 RETURNING *',
      [id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/ler-todas/:usuario_id', async (req, res) => {
  try {
    const { usuario_id } = req.params;
    
    await query(
      'UPDATE notificacoes SET lida = true WHERE usuario_id = $1 AND lida = false',
      [usuario_id]
    );
    
    res.json({ message: 'Todas as notificações foram marcadas como lidas' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/nao-lidas/:usuario_id', async (req, res) => {
  try {
    const { usuario_id } = req.params;
    
    const result = await query(
      'SELECT COUNT(*) as total FROM notificacoes WHERE usuario_id = $1 AND lida = false',
      [usuario_id]
    );
    
    res.json({ total: parseInt(result.rows[0].total) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
