import express from 'express';
import { query } from '../database.js';
import { authMiddleware, checkModulePermission } from '../middleware/auth.js';
import { registrarAuditoria } from '../services/auditoria.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/categorias', async (req, res) => {
  try {
    const result = await query('SELECT * FROM categorias_ativos WHERE ativo = true ORDER BY tipo, nome');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/categorias', checkModulePermission('ativos', 'pode_criar'), async (req, res) => {
  const { nome, tipo, descricao, icone } = req.body;
  try {
    const result = await query(
      'INSERT INTO categorias_ativos (nome, tipo, descricao, icone) VALUES ($1, $2, $3, $4) RETURNING *',
      [nome, tipo, descricao, icone]
    );
    await registrarAuditoria(req.user.id, 'criar', 'categorias_ativos', result.rows[0].id, { nome, tipo }, req.ip);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/localizacoes', async (req, res) => {
  try {
    const result = await query(`
      SELECT l.*, p.nome as parent_nome, u.nome as responsavel_nome
      FROM localizacoes l
      LEFT JOIN localizacoes p ON l.parent_id = p.id
      LEFT JOIN usuarios u ON l.responsavel_id = u.id
      WHERE l.ativo = true
      ORDER BY l.tipo, l.nome
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/localizacoes/arvore', async (req, res) => {
  try {
    const result = await query(`
      WITH RECURSIVE loc_tree AS (
        SELECT id, nome, tipo, parent_id, 0 as level
        FROM localizacoes
        WHERE parent_id IS NULL AND ativo = true
        UNION ALL
        SELECT l.id, l.nome, l.tipo, l.parent_id, lt.level + 1
        FROM localizacoes l
        INNER JOIN loc_tree lt ON l.parent_id = lt.id
        WHERE l.ativo = true
      )
      SELECT * FROM loc_tree ORDER BY level, nome
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/localizacoes', checkModulePermission('ativos', 'pode_criar'), async (req, res) => {
  const { nome, tipo, parent_id, endereco, responsavel_id, observacoes } = req.body;
  try {
    const result = await query(
      'INSERT INTO localizacoes (nome, tipo, parent_id, endereco, responsavel_id, observacoes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [nome, tipo, parent_id || null, endereco, responsavel_id || null, observacoes]
    );
    await registrarAuditoria(req.user.id, 'criar', 'localizacoes', result.rows[0].id, { nome, tipo }, req.ip);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/localizacoes/:id', checkModulePermission('ativos', 'pode_editar'), async (req, res) => {
  const { nome, tipo, parent_id, endereco, responsavel_id, observacoes } = req.body;
  try {
    const result = await query(
      'UPDATE localizacoes SET nome = $1, tipo = $2, parent_id = $3, endereco = $4, responsavel_id = $5, observacoes = $6, atualizado_em = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *',
      [nome, tipo, parent_id || null, endereco, responsavel_id || null, observacoes, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Localização não encontrada' });
    }
    await registrarAuditoria(req.user.id, 'atualizar', 'localizacoes', parseInt(req.params.id), { nome, tipo }, req.ip);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/localizacoes/:id', checkModulePermission('ativos', 'pode_excluir'), async (req, res) => {
  try {
    const loc = await query('SELECT nome FROM localizacoes WHERE id = $1', [req.params.id]);
    await query('UPDATE localizacoes SET ativo = false WHERE id = $1', [req.params.id]);
    await registrarAuditoria(req.user.id, 'excluir', 'localizacoes', parseInt(req.params.id), { nome: loc.rows[0]?.nome }, req.ip);
    res.json({ message: 'Localização removida com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/fornecedores', async (req, res) => {
  try {
    const result = await query('SELECT * FROM fornecedores WHERE ativo = true ORDER BY nome');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/fornecedores', checkModulePermission('ativos', 'pode_criar'), async (req, res) => {
  const { nome, cnpj, contato, telefone, email, endereco, observacoes } = req.body;
  try {
    const result = await query(
      'INSERT INTO fornecedores (nome, cnpj, contato, telefone, email, endereco, observacoes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [nome, cnpj, contato, telefone, email, endereco, observacoes]
    );
    await registrarAuditoria(req.user.id, 'criar', 'fornecedores', result.rows[0].id, { nome, cnpj }, req.ip);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/fornecedores/:id', checkModulePermission('ativos', 'pode_editar'), async (req, res) => {
  const { nome, cnpj, contato, telefone, email, endereco, observacoes } = req.body;
  try {
    const result = await query(
      'UPDATE fornecedores SET nome = $1, cnpj = $2, contato = $3, telefone = $4, email = $5, endereco = $6, observacoes = $7, atualizado_em = CURRENT_TIMESTAMP WHERE id = $8 RETURNING *',
      [nome, cnpj, contato, telefone, email, endereco, observacoes, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fornecedor não encontrado' });
    }
    await registrarAuditoria(req.user.id, 'atualizar', 'fornecedores', parseInt(req.params.id), { nome }, req.ip);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/estoque', checkModulePermission('ativos', 'pode_visualizar'), async (req, res) => {
  try {
    const result = await query(`
      SELECT ie.*, l.nome as localizacao_nome
      FROM itens_estoque ie
      LEFT JOIN localizacoes l ON ie.localizacao_id = l.id
      WHERE ie.ativo = true
      ORDER BY ie.categoria, ie.nome
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/estoque', checkModulePermission('ativos', 'pode_criar'), async (req, res) => {
  const { categoria, nome, descricao, marca, modelo, unidade, quantidade_atual, quantidade_minima, localizacao_id, valor_unitario, observacoes } = req.body;
  try {
    const result = await query(
      'INSERT INTO itens_estoque (categoria, nome, descricao, marca, modelo, unidade, quantidade_atual, quantidade_minima, localizacao_id, valor_unitario, observacoes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
      [categoria, nome, descricao, marca, modelo, unidade || 'unidade', quantidade_atual || 0, quantidade_minima || 0, localizacao_id || null, valor_unitario, observacoes]
    );
    await registrarAuditoria(req.user.id, 'criar', 'estoque', result.rows[0].id, { nome, categoria }, req.ip);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/estoque/:id', checkModulePermission('ativos', 'pode_editar'), async (req, res) => {
  const { categoria, nome, descricao, marca, modelo, unidade, quantidade_minima, localizacao_id, valor_unitario, observacoes } = req.body;
  try {
    const result = await query(
      'UPDATE itens_estoque SET categoria = $1, nome = $2, descricao = $3, marca = $4, modelo = $5, unidade = $6, quantidade_minima = $7, localizacao_id = $8, valor_unitario = $9, observacoes = $10, atualizado_em = CURRENT_TIMESTAMP WHERE id = $11 RETURNING *',
      [categoria, nome, descricao, marca, modelo, unidade, quantidade_minima, localizacao_id || null, valor_unitario, observacoes, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/estoque/:id', checkModulePermission('ativos', 'pode_excluir'), async (req, res) => {
  try {
    const item = await query('SELECT nome FROM itens_estoque WHERE id = $1', [req.params.id]);
    await query('UPDATE itens_estoque SET ativo = false WHERE id = $1', [req.params.id]);
    await registrarAuditoria(req.user.id, 'excluir', 'estoque', parseInt(req.params.id), { nome: item.rows[0]?.nome }, req.ip);
    res.json({ message: 'Item de estoque removido com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/estoque/:id/movimentacao', checkModulePermission('ativos', 'pode_editar'), async (req, res) => {
  const { tipo, quantidade, motivo, usuario_destino_id, ativo_destino_id, documento, observacoes } = req.body;
  const itemId = req.params.id;
  const usuarioId = req.user.id;

  try {
    const item = await query('SELECT quantidade_atual FROM itens_estoque WHERE id = $1', [itemId]);
    if (item.rows.length === 0) {
      return res.status(404).json({ error: 'Item não encontrado' });
    }

    let novaQuantidade = item.rows[0].quantidade_atual;
    if (tipo === 'entrada') {
      novaQuantidade += quantidade;
    } else if (tipo === 'saida') {
      if (quantidade > novaQuantidade) {
        return res.status(400).json({ error: 'Quantidade insuficiente em estoque' });
      }
      novaQuantidade -= quantidade;
    }

    await query('UPDATE itens_estoque SET quantidade_atual = $1, atualizado_em = CURRENT_TIMESTAMP WHERE id = $2', [novaQuantidade, itemId]);

    const result = await query(
      'INSERT INTO movimentacoes_estoque (item_id, tipo, quantidade, motivo, usuario_destino_id, ativo_destino_id, documento, observacoes, usuario_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [itemId, tipo, quantidade, motivo, usuario_destino_id || null, ativo_destino_id || null, documento, observacoes, usuarioId]
    );

    res.status(201).json({ movimentacao: result.rows[0], nova_quantidade: novaQuantidade });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/estoque/:id/movimentacoes', checkModulePermission('ativos', 'pode_visualizar'), async (req, res) => {
  try {
    const result = await query(`
      SELECT m.*, u.nome as usuario_nome, ud.nome as destino_nome, a.nome as ativo_nome
      FROM movimentacoes_estoque m
      LEFT JOIN usuarios u ON m.usuario_id = u.id
      LEFT JOIN usuarios ud ON m.usuario_destino_id = ud.id
      LEFT JOIN ativos a ON m.ativo_destino_id = a.id
      WHERE m.item_id = $1
      ORDER BY m.criado_em DESC
    `, [req.params.id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/dashboard', checkModulePermission('ativos', 'pode_visualizar'), async (req, res) => {
  try {
    const totalAtivos = await query('SELECT COUNT(*) as total FROM ativos');
    const ativosEmUso = await query("SELECT COUNT(*) as total FROM ativos WHERE status = 'em_uso'");
    const ativosDisponiveis = await query("SELECT COUNT(*) as total FROM ativos WHERE status = 'disponivel'");
    const ativosManutencao = await query("SELECT COUNT(*) as total FROM ativos WHERE status = 'manutencao'");
    
    const garantiasVencidas = await query('SELECT COUNT(*) as total FROM ativos WHERE data_garantia < CURRENT_DATE AND data_garantia IS NOT NULL');
    const garantiasProximas = await query("SELECT COUNT(*) as total FROM ativos WHERE data_garantia BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'");
    
    const semResponsavel = await query('SELECT COUNT(*) as total FROM ativos WHERE responsavel_id IS NULL');
    
    const licencasTotal = await query('SELECT COALESCE(SUM(quantidade_total), 0) as total FROM licencas');
    const licencasUsadas = await query('SELECT COALESCE(SUM(quantidade_usada), 0) as total FROM licencas');
    const licencasVencendo = await query("SELECT COUNT(*) as total FROM licencas WHERE data_expiracao BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' AND status = 'ativa'");
    
    const estoqueAbaixoMinimo = await query('SELECT COUNT(*) as total FROM itens_estoque WHERE quantidade_atual < quantidade_minima AND ativo = true');
    
    const ativosPorTipo = await query(`
      SELECT tipo, COUNT(*) as quantidade 
      FROM ativos 
      GROUP BY tipo 
      ORDER BY quantidade DESC
    `);

    const ativosPorStatus = await query(`
      SELECT status, COUNT(*) as quantidade 
      FROM ativos 
      GROUP BY status
    `);

    res.json({
      ativos: {
        total: parseInt(totalAtivos.rows[0].total),
        em_uso: parseInt(ativosEmUso.rows[0].total),
        disponiveis: parseInt(ativosDisponiveis.rows[0].total),
        manutencao: parseInt(ativosManutencao.rows[0].total),
        sem_responsavel: parseInt(semResponsavel.rows[0].total),
      },
      garantias: {
        vencidas: parseInt(garantiasVencidas.rows[0].total),
        proximas_30_dias: parseInt(garantiasProximas.rows[0].total),
      },
      licencas: {
        total: parseInt(licencasTotal.rows[0].total),
        usadas: parseInt(licencasUsadas.rows[0].total),
        disponiveis: parseInt(licencasTotal.rows[0].total) - parseInt(licencasUsadas.rows[0].total),
        vencendo_30_dias: parseInt(licencasVencendo.rows[0].total),
      },
      estoque: {
        abaixo_minimo: parseInt(estoqueAbaixoMinimo.rows[0].total),
      },
      por_tipo: ativosPorTipo.rows,
      por_status: ativosPorStatus.rows,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
