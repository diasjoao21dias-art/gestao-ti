import express from 'express';
import { query } from '../database.js';
import { authMiddleware, checkModulePermission } from '../middleware/auth.js';
import { registrarAuditoria } from '../services/auditoria.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', checkModulePermission('ativos', 'pode_visualizar'), async (req, res) => {
  try {
    const { tipo, status, categoria_id, localizacao_id, em_estoque, garantia_vencida } = req.query;
    
    let sql = `
      SELECT a.*, 
             u.nome as responsavel_nome,
             c.nome as categoria_nome,
             c.icone as categoria_icone,
             l.nome as localizacao_nome,
             f.nome as fornecedor_nome,
             (SELECT COUNT(*) FROM componentes_ativo WHERE ativo_id = a.id) as total_componentes
      FROM ativos a 
      LEFT JOIN usuarios u ON a.responsavel_id = u.id 
      LEFT JOIN categorias_ativos c ON a.categoria_id = c.id
      LEFT JOIN localizacoes l ON a.localizacao_id = l.id
      LEFT JOIN fornecedores f ON a.fornecedor_id = f.id
      WHERE 1=1
    `;
    const params = [];

    if (tipo) {
      params.push(tipo);
      sql += ` AND a.tipo = $${params.length}`;
    }
    if (status) {
      params.push(status);
      sql += ` AND a.status = $${params.length}`;
    }
    if (categoria_id) {
      params.push(categoria_id);
      sql += ` AND a.categoria_id = $${params.length}`;
    }
    if (localizacao_id) {
      params.push(localizacao_id);
      sql += ` AND a.localizacao_id = $${params.length}`;
    }
    if (em_estoque === 'true') {
      sql += ` AND a.em_estoque = true`;
    } else if (em_estoque === 'false') {
      sql += ` AND a.em_estoque = false`;
    }
    if (garantia_vencida === 'true') {
      sql += ` AND a.data_garantia < CURRENT_DATE`;
    }

    sql += ` ORDER BY a.criado_em DESC`;

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/disponiveis', checkModulePermission('ativos', 'pode_visualizar'), async (req, res) => {
  try {
    const result = await query(`
      SELECT a.*, c.nome as categoria_nome
      FROM ativos a 
      LEFT JOIN categorias_ativos c ON a.categoria_id = c.id
      WHERE a.status = 'disponivel' AND a.em_estoque = true
      ORDER BY a.nome
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', checkModulePermission('ativos', 'pode_visualizar'), async (req, res) => {
  try {
    const result = await query(`
      SELECT a.*, 
             u.nome as responsavel_nome,
             c.nome as categoria_nome,
             c.icone as categoria_icone,
             l.nome as localizacao_nome,
             f.nome as fornecedor_nome
      FROM ativos a 
      LEFT JOIN usuarios u ON a.responsavel_id = u.id 
      LEFT JOIN categorias_ativos c ON a.categoria_id = c.id
      LEFT JOIN localizacoes l ON a.localizacao_id = l.id
      LEFT JOIN fornecedores f ON a.fornecedor_id = f.id
      WHERE a.id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ativo não encontrado' });
    }

    const componentes = await query(
      'SELECT * FROM componentes_ativo WHERE ativo_id = $1 ORDER BY tipo, nome',
      [req.params.id]
    );

    const historico = await query(`
      SELECT h.*, u.nome as usuario_nome
      FROM historico_ativos h
      LEFT JOIN usuarios u ON h.usuario_id = u.id
      WHERE h.ativo_id = $1
      ORDER BY h.criado_em DESC
      LIMIT 50
    `, [req.params.id]);

    res.json({
      ...result.rows[0],
      componentes: componentes.rows,
      historico: historico.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', checkModulePermission('ativos', 'pode_criar'), async (req, res) => {
  const { 
    tipo, categoria_id, nome, patrimonio, marca, modelo, numero_serie, 
    data_aquisicao, valor_aquisicao, data_garantia, fornecedor_id,
    localizacao_id, localizacao, responsavel_id, status, condicao,
    vida_util_anos, depreciacao_anual, ip_address, mac_address, hostname,
    especificacoes, observacoes, em_estoque
  } = req.body;
  
  try {
    const result = await query(
      `INSERT INTO ativos (
        tipo, categoria_id, nome, patrimonio, marca, modelo, numero_serie,
        data_aquisicao, valor_aquisicao, data_garantia, fornecedor_id,
        localizacao_id, localizacao, responsavel_id, status, condicao,
        vida_util_anos, depreciacao_anual, ip_address, mac_address, hostname,
        especificacoes, observacoes, em_estoque
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24) 
      RETURNING *`,
      [
        tipo, categoria_id || null, nome, patrimonio, marca, modelo, numero_serie,
        data_aquisicao || null, valor_aquisicao || null, data_garantia || null, fornecedor_id || null,
        localizacao_id || null, localizacao, responsavel_id || null, status || 'disponivel', condicao || 'bom',
        vida_util_anos || null, depreciacao_anual || null, ip_address, mac_address, hostname,
        especificacoes ? JSON.stringify(especificacoes) : null, observacoes, em_estoque !== false
      ]
    );

    await query(
      'INSERT INTO historico_ativos (ativo_id, usuario_id, acao, detalhes) VALUES ($1, $2, $3, $4)',
      [result.rows[0].id, req.user.id, 'criacao', 'Ativo cadastrado no sistema']
    );

    await registrarAuditoria(req.user.id, 'criar', 'ativos', result.rows[0].id, { nome, patrimonio, tipo }, req.ip);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', checkModulePermission('ativos', 'pode_editar'), async (req, res) => {
  const { 
    tipo, categoria_id, nome, patrimonio, marca, modelo, numero_serie, 
    data_aquisicao, valor_aquisicao, data_garantia, fornecedor_id,
    localizacao_id, localizacao, responsavel_id, status, condicao,
    vida_util_anos, depreciacao_anual, ip_address, mac_address, hostname,
    especificacoes, observacoes, em_estoque
  } = req.body;
  
  try {
    const oldAtivo = await query('SELECT * FROM ativos WHERE id = $1', [req.params.id]);
    
    const result = await query(
      `UPDATE ativos SET 
        tipo = $1, categoria_id = $2, nome = $3, patrimonio = $4, marca = $5, 
        modelo = $6, numero_serie = $7, data_aquisicao = $8, valor_aquisicao = $9, 
        data_garantia = $10, fornecedor_id = $11, localizacao_id = $12, localizacao = $13,
        responsavel_id = $14, status = $15, condicao = $16, vida_util_anos = $17,
        depreciacao_anual = $18, ip_address = $19, mac_address = $20, hostname = $21,
        especificacoes = $22, observacoes = $23, em_estoque = $24, atualizado_em = CURRENT_TIMESTAMP 
      WHERE id = $25 RETURNING *`,
      [
        tipo, categoria_id || null, nome, patrimonio, marca, modelo, numero_serie,
        data_aquisicao || null, valor_aquisicao || null, data_garantia || null, fornecedor_id || null,
        localizacao_id || null, localizacao, responsavel_id || null, status, condicao,
        vida_util_anos || null, depreciacao_anual || null, ip_address, mac_address, hostname,
        especificacoes ? JSON.stringify(especificacoes) : null, observacoes, em_estoque,
        req.params.id
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ativo não encontrado' });
    }

    let detalhes = [];
    if (oldAtivo.rows[0].status !== status) {
      detalhes.push(`Status alterado de ${oldAtivo.rows[0].status} para ${status}`);
    }
    if (oldAtivo.rows[0].responsavel_id !== responsavel_id) {
      detalhes.push('Responsável alterado');
    }
    if (oldAtivo.rows[0].localizacao_id !== localizacao_id) {
      detalhes.push('Localização alterada');
    }

    if (detalhes.length > 0) {
      await query(
        'INSERT INTO historico_ativos (ativo_id, usuario_id, acao, detalhes) VALUES ($1, $2, $3, $4)',
        [req.params.id, req.user.id, 'atualizacao', detalhes.join('; ')]
      );
    }

    await registrarAuditoria(req.user.id, 'atualizar', 'ativos', parseInt(req.params.id), { nome, status }, req.ip);

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', checkModulePermission('ativos', 'pode_excluir'), async (req, res) => {
  try {
    const ativo = await query('SELECT nome, patrimonio FROM ativos WHERE id = $1', [req.params.id]);
    const result = await query('DELETE FROM ativos WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ativo não encontrado' });
    }
    await registrarAuditoria(req.user.id, 'excluir', 'ativos', parseInt(req.params.id), { nome: ativo.rows[0]?.nome, patrimonio: ativo.rows[0]?.patrimonio }, req.ip);
    res.json({ message: 'Ativo excluído com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/componentes', checkModulePermission('ativos', 'pode_visualizar'), async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM componentes_ativo WHERE ativo_id = $1 ORDER BY tipo, nome',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/componentes', checkModulePermission('ativos', 'pode_editar'), async (req, res) => {
  const { tipo, nome, marca, modelo, numero_serie, capacidade, especificacoes, observacoes } = req.body;
  try {
    const result = await query(
      `INSERT INTO componentes_ativo (ativo_id, tipo, nome, marca, modelo, numero_serie, capacidade, especificacoes, observacoes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [req.params.id, tipo, nome, marca, modelo, numero_serie, capacidade, especificacoes ? JSON.stringify(especificacoes) : null, observacoes]
    );

    await query(
      'INSERT INTO historico_ativos (ativo_id, usuario_id, acao, detalhes) VALUES ($1, $2, $3, $4)',
      [req.params.id, req.user.id, 'componente_adicionado', `Componente ${tipo}: ${nome} adicionado`]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/componentes/:id', checkModulePermission('ativos', 'pode_editar'), async (req, res) => {
  const { tipo, nome, marca, modelo, numero_serie, capacidade, especificacoes, observacoes } = req.body;
  try {
    const result = await query(
      `UPDATE componentes_ativo SET 
        tipo = $1, nome = $2, marca = $3, modelo = $4, numero_serie = $5, 
        capacidade = $6, especificacoes = $7, observacoes = $8, atualizado_em = CURRENT_TIMESTAMP 
       WHERE id = $9 RETURNING *`,
      [tipo, nome, marca, modelo, numero_serie, capacidade, especificacoes ? JSON.stringify(especificacoes) : null, observacoes, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Componente não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/componentes/:id', checkModulePermission('ativos', 'pode_excluir'), async (req, res) => {
  try {
    const comp = await query('SELECT ativo_id, tipo, nome FROM componentes_ativo WHERE id = $1', [req.params.id]);
    if (comp.rows.length === 0) {
      return res.status(404).json({ error: 'Componente não encontrado' });
    }

    await query('DELETE FROM componentes_ativo WHERE id = $1', [req.params.id]);

    await query(
      'INSERT INTO historico_ativos (ativo_id, usuario_id, acao, detalhes) VALUES ($1, $2, $3, $4)',
      [comp.rows[0].ativo_id, req.user.id, 'componente_removido', `Componente ${comp.rows[0].tipo}: ${comp.rows[0].nome} removido`]
    );

    res.json({ message: 'Componente excluído com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/historico', checkModulePermission('ativos', 'pode_visualizar'), async (req, res) => {
  try {
    const result = await query(`
      SELECT h.*, u.nome as usuario_nome
      FROM historico_ativos h
      LEFT JOIN usuarios u ON h.usuario_id = u.id
      WHERE h.ativo_id = $1
      ORDER BY h.criado_em DESC
    `, [req.params.id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
