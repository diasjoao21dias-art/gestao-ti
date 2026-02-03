import express from 'express';
import { query } from '../database.js';

const router = express.Router();

router.post('/gerar/:ativo_id', async (req, res) => {
  try {
    const { ativo_id } = req.params;
    
    const ativoResult = await query(
      'SELECT * FROM ativos WHERE id = $1',
      [ativo_id]
    );
    
    if (ativoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ativo não encontrado' });
    }
    
    const qrData = `ATIVO-${ativo_id}-${Date.now()}`;
    
    const existingQR = await query(
      'SELECT * FROM qr_codes_ativos WHERE ativo_id = $1',
      [ativo_id]
    );
    
    if (existingQR.rows.length > 0) {
      return res.json(existingQR.rows[0]);
    }
    
    const result = await query(
      'INSERT INTO qr_codes_ativos (ativo_id, qr_code_data) VALUES ($1, $2) RETURNING *',
      [ativo_id, qrData]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/ativo/:ativo_id', async (req, res) => {
  try {
    const { ativo_id } = req.params;
    
    const result = await query(
      'SELECT * FROM qr_codes_ativos WHERE ativo_id = $1',
      [ativo_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'QR Code não encontrado para este ativo' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/scan/:qr_code_data', async (req, res) => {
  try {
    const { qr_code_data } = req.params;
    
    const result = await query(
      `SELECT qr.*, a.*, u.nome as responsavel_nome
       FROM qr_codes_ativos qr
       JOIN ativos a ON qr.ativo_id = a.id
       LEFT JOIN usuarios u ON a.responsavel_id = u.id
       WHERE qr.qr_code_data = $1`,
      [qr_code_data]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'QR Code inválido' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await query('DELETE FROM qr_codes_ativos WHERE id = $1', [id]);
    
    res.json({ message: 'QR Code excluído com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
