import express from 'express';
import { query } from '../database.js';
import { authMiddleware, checkModulePermission } from '../middleware/auth.js';
import { registrarAuditoria } from '../services/auditoria.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', checkModulePermission('ativos', 'pode_visualizar'), async (req, res) => {
  try {
    const result = await query(`
      SELECT t.*, u.nome as usuario_nome, u.email as usuario_email, u.departamento,
             (SELECT COUNT(*) FROM itens_termo WHERE termo_id = t.id) as total_itens
      FROM termos_responsabilidade t
      LEFT JOIN usuarios u ON t.usuario_id = u.id
      ORDER BY t.criado_em DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', checkModulePermission('ativos', 'pode_visualizar'), async (req, res) => {
  try {
    const termo = await query(`
      SELECT t.*, u.nome as usuario_nome, u.email as usuario_email, u.departamento, u.cargo
      FROM termos_responsabilidade t
      LEFT JOIN usuarios u ON t.usuario_id = u.id
      WHERE t.id = $1
    `, [req.params.id]);

    if (termo.rows.length === 0) {
      return res.status(404).json({ error: 'Termo não encontrado' });
    }

    const itens = await query(`
      SELECT it.*, a.nome as ativo_nome, a.patrimonio, a.numero_serie, a.marca, a.modelo
      FROM itens_termo it
      LEFT JOIN ativos a ON it.ativo_id = a.id
      WHERE it.termo_id = $1
    `, [req.params.id]);

    res.json({ ...termo.rows[0], itens: itens.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', checkModulePermission('ativos', 'pode_criar'), async (req, res) => {
  const { usuario_id, observacoes, ativos_ids } = req.body;
  
  try {
    const countResult = await query('SELECT COUNT(*) FROM termos_responsabilidade');
    const numero = `TR-${new Date().getFullYear()}-${String(parseInt(countResult.rows[0].count) + 1).padStart(5, '0')}`;

    const result = await query(
      'INSERT INTO termos_responsabilidade (numero, usuario_id, observacoes) VALUES ($1, $2, $3) RETURNING *',
      [numero, usuario_id, observacoes]
    );

    const termoId = result.rows[0].id;

    if (ativos_ids && ativos_ids.length > 0) {
      for (const ativoId of ativos_ids) {
        await query(
          'INSERT INTO itens_termo (termo_id, ativo_id) VALUES ($1, $2)',
          [termoId, ativoId]
        );
        
        await query(
          "UPDATE ativos SET responsavel_id = $1, status = 'em_uso', em_estoque = false, atualizado_em = CURRENT_TIMESTAMP WHERE id = $2",
          [usuario_id, ativoId]
        );

        await query(
          'INSERT INTO atribuicoes_ativo (ativo_id, usuario_id, termo_id) VALUES ($1, $2, $3)',
          [ativoId, usuario_id, termoId]
        );

        await query(
          'INSERT INTO historico_ativos (ativo_id, usuario_id, acao, detalhes) VALUES ($1, $2, $3, $4)',
          [ativoId, req.user.id, 'atribuicao', `Atribuído ao usuário via termo ${numero}`]
        );
      }
    }

    await registrarAuditoria(req.user.id, 'criar', 'termos', termoId, { numero, usuario_id, total_ativos: ativos_ids?.length || 0 }, req.ip);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/assinar', checkModulePermission('ativos', 'pode_editar'), async (req, res) => {
  const { assinatura, tipo } = req.body;
  
  try {
    let updateQuery;
    if (tipo === 'usuario') {
      updateQuery = await query(
        'UPDATE termos_responsabilidade SET assinatura_usuario = $1, data_assinatura = CURRENT_TIMESTAMP, atualizado_em = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [assinatura, req.params.id]
      );
    } else {
      updateQuery = await query(
        'UPDATE termos_responsabilidade SET assinatura_responsavel = $1, data_assinatura_responsavel = CURRENT_TIMESTAMP, status = $2, atualizado_em = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
        [assinatura, 'assinado', req.params.id]
      );
    }

    await registrarAuditoria(req.user.id, 'atualizar', 'termos', parseInt(req.params.id), { acao: 'assinatura', tipo }, req.ip);
    res.json(updateQuery.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/devolver', checkModulePermission('ativos', 'pode_editar'), async (req, res) => {
  const { ativos_ids, observacoes } = req.body;
  
  try {
    const termo = await query('SELECT * FROM termos_responsabilidade WHERE id = $1', [req.params.id]);
    if (termo.rows.length === 0) {
      return res.status(404).json({ error: 'Termo não encontrado' });
    }

    for (const ativoId of ativos_ids) {
      await query(
        "UPDATE ativos SET responsavel_id = NULL, status = 'disponivel', em_estoque = true, atualizado_em = CURRENT_TIMESTAMP WHERE id = $1",
        [ativoId]
      );

      await query(
        'UPDATE atribuicoes_ativo SET data_devolucao = CURRENT_TIMESTAMP, status = $1, observacoes = $2 WHERE ativo_id = $3 AND termo_id = $4 AND data_devolucao IS NULL',
        ['devolvido', observacoes, ativoId, req.params.id]
      );

      await query(
        'INSERT INTO historico_ativos (ativo_id, usuario_id, acao, detalhes) VALUES ($1, $2, $3, $4)',
        [ativoId, req.user.id, 'devolucao', `Devolvido do termo ${termo.rows[0].numero}. ${observacoes || ''}`]
      );
    }

    const itensRestantes = await query(
      'SELECT COUNT(*) FROM itens_termo it INNER JOIN atribuicoes_ativo aa ON it.ativo_id = aa.ativo_id AND aa.termo_id = it.termo_id WHERE it.termo_id = $1 AND aa.data_devolucao IS NULL',
      [req.params.id]
    );

    if (parseInt(itensRestantes.rows[0].count) === 0) {
      await query(
        "UPDATE termos_responsabilidade SET status = 'encerrado', atualizado_em = CURRENT_TIMESTAMP WHERE id = $1",
        [req.params.id]
      );
    }

    await registrarAuditoria(req.user.id, 'atualizar', 'termos', parseInt(req.params.id), { acao: 'devolucao', ativos_devolvidos: ativos_ids?.length || 0 }, req.ip);
    res.json({ message: 'Itens devolvidos com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/usuario/:id', checkModulePermission('ativos', 'pode_visualizar'), async (req, res) => {
  try {
    const result = await query(`
      SELECT t.*, 
             (SELECT COUNT(*) FROM itens_termo WHERE termo_id = t.id) as total_itens
      FROM termos_responsabilidade t
      WHERE t.usuario_id = $1
      ORDER BY t.criado_em DESC
    `, [req.params.id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/ativo/:id/historico', checkModulePermission('ativos', 'pode_visualizar'), async (req, res) => {
  try {
    const result = await query(`
      SELECT aa.*, u.nome as usuario_nome, t.numero as termo_numero
      FROM atribuicoes_ativo aa
      LEFT JOIN usuarios u ON aa.usuario_id = u.id
      LEFT JOIN termos_responsabilidade t ON aa.termo_id = t.id
      WHERE aa.ativo_id = $1
      ORDER BY aa.data_atribuicao DESC
    `, [req.params.id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
