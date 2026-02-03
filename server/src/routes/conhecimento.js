import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { query } from '../database.js';
import { authMiddleware, checkModulePermission } from '../middleware/auth.js';
import { registrarAuditoria } from '../services/auditoria.js';

const router = express.Router();

const uploadsDir = './uploads/conhecimento';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não permitido. Apenas PDF, PNG e JPEG.'), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.use(authMiddleware);

router.get('/', checkModulePermission('conhecimento', 'pode_visualizar'), async (req, res) => {
  try {
    const result = await query(`
      SELECT a.*, u.nome as autor_nome
      FROM artigos_conhecimento a
      LEFT JOIN usuarios u ON a.autor_id = u.id
      WHERE a.publicado = true
      ORDER BY a.criado_em DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', checkModulePermission('conhecimento', 'pode_visualizar'), async (req, res) => {
  try {
    const result = await query(`
      SELECT a.*, u.nome as autor_nome
      FROM artigos_conhecimento a
      LEFT JOIN usuarios u ON a.autor_id = u.id
      WHERE a.id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Artigo não encontrado' });
    }

    await query('UPDATE artigos_conhecimento SET visualizacoes = visualizacoes + 1 WHERE id = $1', [req.params.id]);
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', checkModulePermission('conhecimento', 'pode_criar'), async (req, res) => {
  const { titulo, conteudo, categoria, tags, autor_id, publicado } = req.body;
  try {
    const result = await query(
      'INSERT INTO artigos_conhecimento (titulo, conteudo, categoria, tags, autor_id, publicado) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [titulo, conteudo, categoria, tags, autor_id, publicado !== undefined ? publicado : true]
    );
    await registrarAuditoria(req.user.id, 'criar', 'conhecimento', result.rows[0].id, { titulo, categoria }, req.ip);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', checkModulePermission('conhecimento', 'pode_editar'), async (req, res) => {
  const { titulo, conteudo, categoria, tags, publicado } = req.body;
  try {
    const result = await query(
      'UPDATE artigos_conhecimento SET titulo = $1, conteudo = $2, categoria = $3, tags = $4, publicado = $5, atualizado_em = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *',
      [titulo, conteudo, categoria, tags, publicado, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Artigo não encontrado' });
    }
    await registrarAuditoria(req.user.id, 'atualizar', 'conhecimento', parseInt(req.params.id), { titulo, categoria }, req.ip);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/util', checkModulePermission('conhecimento', 'pode_visualizar'), async (req, res) => {
  try {
    await query('UPDATE artigos_conhecimento SET util = util + 1 WHERE id = $1', [req.params.id]);
    res.json({ message: 'Obrigado pelo feedback!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', checkModulePermission('conhecimento', 'pode_excluir'), async (req, res) => {
  try {
    const artigo = await query('SELECT titulo FROM artigos_conhecimento WHERE id = $1', [req.params.id]);
    const anexos = await query('SELECT caminho FROM artigos_conhecimento_anexos WHERE artigo_id = $1', [req.params.id]);
    for (const anexo of anexos.rows) {
      if (fs.existsSync(anexo.caminho)) {
        fs.unlinkSync(anexo.caminho);
      }
    }
    
    const result = await query('DELETE FROM artigos_conhecimento WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Artigo não encontrado' });
    }
    await registrarAuditoria(req.user.id, 'excluir', 'conhecimento', parseInt(req.params.id), { titulo: artigo.rows[0]?.titulo }, req.ip);
    res.json({ message: 'Artigo excluído com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/anexos', checkModulePermission('conhecimento', 'pode_visualizar'), async (req, res) => {
  try {
    const result = await query(
      'SELECT id, nome_original, mime_type, tamanho, criado_em FROM artigos_conhecimento_anexos WHERE artigo_id = $1 ORDER BY criado_em DESC',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/anexos', checkModulePermission('conhecimento', 'pode_editar'), upload.array('arquivos', 10), async (req, res) => {
  try {
    const artigo = await query('SELECT id FROM artigos_conhecimento WHERE id = $1', [req.params.id]);
    if (artigo.rows.length === 0) {
      return res.status(404).json({ error: 'Artigo não encontrado' });
    }

    const anexos = [];
    for (const file of req.files) {
      const result = await query(
        'INSERT INTO artigos_conhecimento_anexos (artigo_id, nome_original, caminho, mime_type, tamanho) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [req.params.id, file.originalname, file.path, file.mimetype, file.size]
      );
      anexos.push(result.rows[0]);
    }
    
    res.status(201).json(anexos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/anexos/:anexoId/download', authMiddleware, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM artigos_conhecimento_anexos WHERE id = $1',
      [req.params.anexoId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Anexo não encontrado' });
    }

    const anexo = result.rows[0];
    
    if (!fs.existsSync(anexo.caminho)) {
      return res.status(404).json({ error: 'Arquivo não encontrado no servidor' });
    }

    res.setHeader('Content-Type', anexo.mime_type);
    res.setHeader('Content-Disposition', `inline; filename="${anexo.nome_original}"`);
    
    const fileStream = fs.createReadStream(anexo.caminho);
    fileStream.pipe(res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/anexos/:anexoId', checkModulePermission('conhecimento', 'pode_editar'), async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM artigos_conhecimento_anexos WHERE id = $1',
      [req.params.anexoId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Anexo não encontrado' });
    }

    const anexo = result.rows[0];
    
    if (fs.existsSync(anexo.caminho)) {
      fs.unlinkSync(anexo.caminho);
    }

    await query('DELETE FROM artigos_conhecimento_anexos WHERE id = $1', [req.params.anexoId]);
    res.json({ message: 'Anexo excluído com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
