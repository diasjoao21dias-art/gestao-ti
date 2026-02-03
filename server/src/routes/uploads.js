import express from 'express';
import multer from 'multer';
import path from 'path';
import { query } from '../database.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|txt|zip|rar/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido!'));
    }
  }
});

router.post('/ticket/:ticket_id', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const { ticket_id } = req.params;
    const { usuario_id } = req.body;

    const result = await query(
      `INSERT INTO anexos_ticket (ticket_id, nome_arquivo, caminho_arquivo, tamanho_bytes, tipo_mime, usuario_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        ticket_id,
        req.file.originalname,
        req.file.path,
        req.file.size,
        req.file.mimetype,
        usuario_id
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/ticket/:ticket_id', async (req, res) => {
  try {
    const { ticket_id } = req.params;

    const result = await query(
      `SELECT a.*, u.nome as usuario_nome
       FROM anexos_ticket a
       LEFT JOIN usuarios u ON a.usuario_id = u.id
       WHERE a.ticket_id = $1
       ORDER BY a.criado_em DESC`,
      [ticket_id]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM anexos_ticket WHERE id = $1 RETURNING *',
      [id]
    );

    res.json({ message: 'Anexo excluído com sucesso', anexo: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
