import express from 'express';
import { query } from '../database.js';
import { authMiddleware, checkModulePermission } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/tickets', checkModulePermission('relatorios', 'pode_visualizar'), async (req, res) => {
  try {
    const { data_inicio, data_fim, status, prioridade } = req.query;
    
    let sql = `
      SELECT t.*, 
        u1.nome as solicitante_nome,
        u2.nome as atribuido_nome
      FROM tickets t
      LEFT JOIN usuarios u1 ON t.solicitante_id = u1.id
      LEFT JOIN usuarios u2 ON t.atribuido_a_id = u2.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;
    
    if (data_inicio) {
      sql += ` AND t.criado_em >= $${paramCount}`;
      params.push(data_inicio);
      paramCount++;
    }
    
    if (data_fim) {
      sql += ` AND t.criado_em <= $${paramCount}`;
      params.push(data_fim);
      paramCount++;
    }
    
    if (status) {
      sql += ` AND t.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    if (prioridade) {
      sql += ` AND t.prioridade = $${paramCount}`;
      params.push(prioridade);
      paramCount++;
    }
    
    sql += ' ORDER BY t.criado_em DESC';
    
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/ativos', checkModulePermission('relatorios', 'pode_visualizar'), async (req, res) => {
  try {
    const { tipo, status } = req.query;
    
    let sql = `
      SELECT a.*, u.nome as responsavel_nome
      FROM ativos a
      LEFT JOIN usuarios u ON a.responsavel_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;
    
    if (tipo) {
      sql += ` AND a.tipo = $${paramCount}`;
      params.push(tipo);
      paramCount++;
    }
    
    if (status) {
      sql += ` AND a.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    sql += ' ORDER BY a.criado_em DESC';
    
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/projetos', checkModulePermission('relatorios', 'pode_visualizar'), async (req, res) => {
  try {
    const { status, data_inicio, data_fim } = req.query;
    
    let sql = `
      SELECT p.*, u.nome as gerente_nome
      FROM projetos p
      LEFT JOIN usuarios u ON p.gerente_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;
    
    if (status) {
      sql += ` AND p.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    if (data_inicio) {
      sql += ` AND p.data_inicio >= $${paramCount}`;
      params.push(data_inicio);
      paramCount++;
    }
    
    if (data_fim) {
      sql += ` AND p.data_prevista_fim <= $${paramCount}`;
      params.push(data_fim);
      paramCount++;
    }
    
    sql += ' ORDER BY p.criado_em DESC';
    
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/licencas-vencimento', checkModulePermission('relatorios', 'pode_visualizar'), async (req, res) => {
  try {
    const result = await query(
      `SELECT l.*, u.nome as responsavel_nome
       FROM licencas l
       LEFT JOIN usuarios u ON l.responsavel_id = u.id
       WHERE l.data_expiracao IS NOT NULL
       AND l.data_expiracao <= CURRENT_DATE + INTERVAL '90 days'
       AND l.status = 'ativa'
       ORDER BY l.data_expiracao ASC`
    );
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/estatisticas', checkModulePermission('relatorios', 'pode_visualizar'), async (req, res) => {
  try {
    const stats = await query(`
      SELECT 
        (SELECT COUNT(*) FROM tickets WHERE status = 'aberto') as tickets_abertos,
        (SELECT COUNT(*) FROM tickets WHERE status = 'em_andamento') as tickets_em_andamento,
        (SELECT COUNT(*) FROM tickets WHERE status = 'resolvido') as tickets_resolvidos,
        (SELECT COUNT(*) FROM ativos WHERE status = 'disponivel') as ativos_disponiveis,
        (SELECT COUNT(*) FROM ativos WHERE status = 'em_uso') as ativos_em_uso,
        (SELECT COUNT(*) FROM projetos WHERE status = 'em_andamento') as projetos_ativos,
        (SELECT COUNT(*) FROM licencas WHERE status = 'ativa') as licencas_ativas,
        (SELECT COUNT(*) FROM usuarios WHERE ativo = true) as usuarios_ativos
    `);
    
    res.json(stats.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/inventario-estoque', checkModulePermission('relatorios', 'pode_visualizar'), async (req, res) => {
  try {
    const { categoria, abaixo_minimo } = req.query;
    
    let sql = `
      SELECT 
        ie.id,
        ie.categoria,
        ie.nome,
        ie.marca,
        ie.modelo,
        ie.unidade,
        ie.quantidade_atual,
        ie.quantidade_minima,
        ie.valor_unitario,
        (ie.quantidade_atual * COALESCE(ie.valor_unitario, 0)) as valor_total,
        l.nome as localizacao,
        CASE WHEN ie.quantidade_atual < ie.quantidade_minima THEN 'Abaixo do mínimo' ELSE 'OK' END as situacao
      FROM itens_estoque ie
      LEFT JOIN localizacoes l ON ie.localizacao_id = l.id
      WHERE ie.ativo = true
    `;
    const params = [];
    let paramCount = 1;
    
    if (categoria) {
      sql += ` AND ie.categoria = $${paramCount}`;
      params.push(categoria);
      paramCount++;
    }
    
    if (abaixo_minimo === 'true') {
      sql += ` AND ie.quantidade_atual < ie.quantidade_minima`;
    }
    
    sql += ' ORDER BY ie.categoria, ie.nome';
    
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/inventario-movimentacoes', checkModulePermission('relatorios', 'pode_visualizar'), async (req, res) => {
  try {
    const { data_inicio, data_fim, tipo, item_id } = req.query;
    
    let sql = `
      SELECT 
        m.id,
        m.criado_em as data,
        m.tipo,
        ie.nome as item,
        ie.categoria,
        m.quantidade,
        m.motivo,
        m.documento,
        u.nome as usuario,
        ud.nome as destino_usuario,
        a.nome as destino_ativo,
        m.observacoes
      FROM movimentacoes_estoque m
      INNER JOIN itens_estoque ie ON m.item_id = ie.id
      LEFT JOIN usuarios u ON m.usuario_id = u.id
      LEFT JOIN usuarios ud ON m.usuario_destino_id = ud.id
      LEFT JOIN ativos a ON m.ativo_destino_id = a.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;
    
    if (data_inicio) {
      sql += ` AND m.criado_em >= $${paramCount}`;
      params.push(data_inicio);
      paramCount++;
    }
    
    if (data_fim) {
      sql += ` AND m.criado_em <= $${paramCount}`;
      params.push(data_fim + ' 23:59:59');
      paramCount++;
    }
    
    if (tipo) {
      sql += ` AND m.tipo = $${paramCount}`;
      params.push(tipo);
      paramCount++;
    }
    
    if (item_id) {
      sql += ` AND m.item_id = $${paramCount}`;
      params.push(item_id);
      paramCount++;
    }
    
    sql += ' ORDER BY m.criado_em DESC';
    
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/inventario-localizacoes', checkModulePermission('relatorios', 'pode_visualizar'), async (req, res) => {
  try {
    const { tipo } = req.query;
    
    let sql = `
      SELECT 
        l.id,
        l.nome,
        l.tipo,
        p.nome as localizacao_pai,
        l.endereco,
        u.nome as responsavel,
        (SELECT COUNT(*) FROM ativos WHERE localizacao_id = l.id) as total_ativos,
        l.observacoes
      FROM localizacoes l
      LEFT JOIN localizacoes p ON l.parent_id = p.id
      LEFT JOIN usuarios u ON l.responsavel_id = u.id
      WHERE l.ativo = true
    `;
    const params = [];
    
    if (tipo) {
      sql += ` AND l.tipo = $1`;
      params.push(tipo);
    }
    
    sql += ' ORDER BY l.tipo, l.nome';
    
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/inventario-fornecedores', checkModulePermission('relatorios', 'pode_visualizar'), async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        f.id,
        f.nome,
        f.cnpj,
        f.contato,
        f.telefone,
        f.email,
        f.endereco,
        (SELECT COUNT(*) FROM ativos WHERE fornecedor_id = f.id) as total_ativos,
        f.observacoes
      FROM fornecedores f
      WHERE f.ativo = true
      ORDER BY f.nome
    `);
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/inventario-garantias', checkModulePermission('relatorios', 'pode_visualizar'), async (req, res) => {
  try {
    const { status_garantia } = req.query;
    
    let sql = `
      SELECT 
        a.id,
        a.patrimonio,
        a.nome,
        c.nome as categoria,
        a.marca,
        a.modelo,
        a.numero_serie,
        a.data_aquisicao,
        a.data_garantia,
        u.nome as responsavel,
        l.nome as localizacao,
        f.nome as fornecedor,
        CASE 
          WHEN a.data_garantia IS NULL THEN 'Sem garantia'
          WHEN a.data_garantia < CURRENT_DATE THEN 'Vencida'
          WHEN a.data_garantia <= CURRENT_DATE + INTERVAL '30 days' THEN 'Vence em 30 dias'
          WHEN a.data_garantia <= CURRENT_DATE + INTERVAL '90 days' THEN 'Vence em 90 dias'
          ELSE 'Vigente'
        END as status_garantia
      FROM ativos a
      LEFT JOIN categorias_ativos c ON a.categoria_id = c.id
      LEFT JOIN usuarios u ON a.responsavel_id = u.id
      LEFT JOIN localizacoes l ON a.localizacao_id = l.id
      LEFT JOIN fornecedores f ON a.fornecedor_id = f.id
      WHERE 1=1
    `;
    const params = [];
    
    if (status_garantia === 'vencida') {
      sql += ` AND a.data_garantia < CURRENT_DATE`;
    } else if (status_garantia === 'vencendo_30') {
      sql += ` AND a.data_garantia BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'`;
    } else if (status_garantia === 'vencendo_90') {
      sql += ` AND a.data_garantia BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days'`;
    } else if (status_garantia === 'vigente') {
      sql += ` AND a.data_garantia > CURRENT_DATE + INTERVAL '90 days'`;
    } else if (status_garantia === 'sem_garantia') {
      sql += ` AND a.data_garantia IS NULL`;
    }
    
    sql += ' ORDER BY a.data_garantia ASC NULLS LAST';
    
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/inventario-categorias', checkModulePermission('relatorios', 'pode_visualizar'), async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        c.id,
        c.nome,
        c.tipo,
        c.descricao,
        c.icone,
        (SELECT COUNT(*) FROM ativos WHERE categoria_id = c.id) as total_ativos,
        (SELECT COALESCE(SUM(valor_aquisicao), 0) FROM ativos WHERE categoria_id = c.id) as valor_total
      FROM categorias_ativos c
      WHERE c.ativo = true
      ORDER BY c.tipo, c.nome
    `);
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/maquinas', checkModulePermission('relatorios', 'pode_visualizar'), async (req, res) => {
  try {
    const { setor, data_inicio, data_fim } = req.query;
    
    let sql = `
      SELECT 
        m.id,
        m.nome,
        m.ip,
        COALESCE(m.setor_texto, s.nome) as setor,
        COALESCE(m.usuario_texto, u.nome) as usuario_responsavel,
        m.sistema_operacional,
        m.observacoes,
        m.criado_em,
        m.atualizado_em,
        (SELECT COUNT(*) FROM componentes_maquina WHERE maquina_id = m.id) as total_componentes
      FROM maquinas_rede m
      LEFT JOIN setores s ON m.setor_id = s.id
      LEFT JOIN usuarios u ON m.usuario_id = u.id
      WHERE m.ativo = true
    `;
    const params = [];
    let paramCount = 1;
    
    if (setor) {
      sql += ` AND (m.setor_texto ILIKE $${paramCount} OR s.nome ILIKE $${paramCount})`;
      params.push(`%${setor}%`);
      paramCount++;
    }
    
    if (data_inicio) {
      sql += ` AND m.criado_em >= $${paramCount}`;
      params.push(data_inicio);
      paramCount++;
    }
    
    if (data_fim) {
      sql += ` AND m.criado_em <= $${paramCount}`;
      params.push(data_fim + ' 23:59:59');
      paramCount++;
    }
    
    sql += ' ORDER BY m.nome ASC';
    
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao gerar relatório de máquinas:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/rede-vlans', checkModulePermission('relatorios', 'pode_visualizar'), async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        v.id,
        v.numero as numero_vlan,
        v.nome,
        v.descricao,
        v.gateway,
        v.mascara,
        l.nome as localizacao,
        (SELECT COUNT(*) FROM subnets WHERE vlan_id = v.id AND ativo = true) as total_subnets,
        v.criado_em
      FROM vlans v
      LEFT JOIN localizacoes l ON v.localizacao_id = l.id
      WHERE v.ativo = true
      ORDER BY v.numero
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao gerar relatório de VLANs:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/rede-subnets', checkModulePermission('relatorios', 'pode_visualizar'), async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        s.id,
        s.cidr,
        s.nome,
        s.descricao,
        v.numero as vlan_numero,
        v.nome as vlan_nome,
        s.gateway,
        s.dns_primario,
        s.dns_secundario,
        s.dhcp_inicio,
        s.dhcp_fim,
        (SELECT COUNT(*) FROM enderecos_ip WHERE subnet_id = s.id) as total_ips,
        s.criado_em
      FROM subnets s
      LEFT JOIN vlans v ON s.vlan_id = v.id
      WHERE s.ativo = true
      ORDER BY s.cidr
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao gerar relatório de subnets:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/rede-ips', checkModulePermission('relatorios', 'pode_visualizar'), async (req, res) => {
  try {
    const { status } = req.query;
    
    let sql = `
      SELECT 
        ip.id,
        ip.ip,
        ip.hostname,
        ip.mac_address,
        ip.tipo,
        ip.status,
        ip.reservado,
        s.cidr as subnet,
        s.nome as subnet_nome,
        a.nome as ativo_vinculado,
        ip.descricao,
        ip.criado_em
      FROM enderecos_ip ip
      LEFT JOIN subnets s ON ip.subnet_id = s.id
      LEFT JOIN ativos a ON ip.ativo_id = a.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;
    
    if (status) {
      sql += ` AND ip.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    sql += ' ORDER BY ip.ip';
    
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao gerar relatório de IPs:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/rede-equipamentos', checkModulePermission('relatorios', 'pode_visualizar'), async (req, res) => {
  try {
    const { tipo } = req.query;
    
    let sql = `
      SELECT 
        a.id,
        a.patrimonio,
        a.nome,
        a.tipo,
        a.marca,
        a.modelo,
        a.numero_serie,
        a.ip_address,
        a.mac_address,
        a.status,
        l.nome as localizacao,
        u.nome as responsavel,
        a.data_aquisicao,
        a.observacoes,
        a.criado_em
      FROM ativos a
      LEFT JOIN localizacoes l ON a.localizacao_id = l.id
      LEFT JOIN usuarios u ON a.responsavel_id = u.id
      WHERE a.tipo IN ('switch', 'roteador', 'firewall', 'access_point', 'rede')
    `;
    const params = [];
    let paramCount = 1;
    
    if (tipo) {
      sql += ` AND a.tipo = $${paramCount}`;
      params.push(tipo);
      paramCount++;
    }
    
    sql += ' ORDER BY a.tipo, a.nome';
    
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao gerar relatório de equipamentos de rede:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/inventario-ativos-completo', checkModulePermission('relatorios', 'pode_visualizar'), async (req, res) => {
  try {
    const { tipo, status, categoria_id, localizacao_id, responsavel_id } = req.query;
    
    let sql = `
      SELECT 
        a.id,
        a.patrimonio,
        a.nome,
        a.tipo,
        c.nome as categoria,
        a.marca,
        a.modelo,
        a.numero_serie,
        a.data_aquisicao,
        a.valor_aquisicao,
        a.data_garantia,
        a.status,
        a.condicao,
        u.nome as responsavel,
        l.nome as localizacao,
        f.nome as fornecedor,
        a.ip_address,
        a.mac_address,
        a.hostname,
        a.observacoes,
        a.criado_em
      FROM ativos a
      LEFT JOIN categorias_ativos c ON a.categoria_id = c.id
      LEFT JOIN usuarios u ON a.responsavel_id = u.id
      LEFT JOIN localizacoes l ON a.localizacao_id = l.id
      LEFT JOIN fornecedores f ON a.fornecedor_id = f.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;
    
    if (tipo) {
      sql += ` AND a.tipo = $${paramCount}`;
      params.push(tipo);
      paramCount++;
    }
    
    if (status) {
      sql += ` AND a.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    if (categoria_id) {
      sql += ` AND a.categoria_id = $${paramCount}`;
      params.push(categoria_id);
      paramCount++;
    }
    
    if (localizacao_id) {
      sql += ` AND a.localizacao_id = $${paramCount}`;
      params.push(localizacao_id);
      paramCount++;
    }
    
    if (responsavel_id) {
      sql += ` AND a.responsavel_id = $${paramCount}`;
      params.push(responsavel_id);
      paramCount++;
    }
    
    sql += ' ORDER BY a.criado_em DESC';
    
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
