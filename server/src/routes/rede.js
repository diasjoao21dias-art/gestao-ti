import express from 'express';
import { query } from '../database.js';
import { authMiddleware, checkModulePermission } from '../middleware/auth.js';
import { registrarAuditoria } from '../services/auditoria.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/vlans', checkModulePermission('ativos', 'pode_visualizar'), async (req, res) => {
  try {
    const result = await query(`
      SELECT v.*, l.nome as localizacao_nome,
             (SELECT COUNT(*) FROM subnets WHERE vlan_id = v.id) as total_subnets
      FROM vlans v
      LEFT JOIN localizacoes l ON v.localizacao_id = l.id
      WHERE v.ativo = true
      ORDER BY v.numero
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/vlans', checkModulePermission('ativos', 'pode_criar'), async (req, res) => {
  const { numero, nome, descricao, gateway, mascara, localizacao_id } = req.body;
  try {
    const result = await query(
      'INSERT INTO vlans (numero, nome, descricao, gateway, mascara, localizacao_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [numero, nome, descricao, gateway, mascara, localizacao_id || null]
    );
    await registrarAuditoria(req.user.id, 'criar', 'vlans', result.rows[0].id, { numero, nome }, req.ip);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/vlans/:id', checkModulePermission('ativos', 'pode_editar'), async (req, res) => {
  const { numero, nome, descricao, gateway, mascara, localizacao_id } = req.body;
  try {
    const result = await query(
      'UPDATE vlans SET numero = $1, nome = $2, descricao = $3, gateway = $4, mascara = $5, localizacao_id = $6, atualizado_em = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *',
      [numero, nome, descricao, gateway, mascara, localizacao_id || null, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'VLAN não encontrada' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/vlans/:id', checkModulePermission('ativos', 'pode_excluir'), async (req, res) => {
  try {
    const vlan = await query('SELECT nome, numero FROM vlans WHERE id = $1', [req.params.id]);
    await query('UPDATE vlans SET ativo = false WHERE id = $1', [req.params.id]);
    await registrarAuditoria(req.user.id, 'excluir', 'vlans', parseInt(req.params.id), { nome: vlan.rows[0]?.nome, numero: vlan.rows[0]?.numero }, req.ip);
    res.json({ message: 'VLAN removida com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/subnets', checkModulePermission('ativos', 'pode_visualizar'), async (req, res) => {
  try {
    const result = await query(`
      SELECT s.*, v.nome as vlan_nome, v.numero as vlan_numero,
             (SELECT COUNT(*) FROM enderecos_ip WHERE subnet_id = s.id) as total_ips
      FROM subnets s
      LEFT JOIN vlans v ON s.vlan_id = v.id
      WHERE s.ativo = true
      ORDER BY s.cidr
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/subnets', checkModulePermission('ativos', 'pode_criar'), async (req, res) => {
  const { cidr, nome, descricao, vlan_id, gateway, dns_primario, dns_secundario, dhcp_inicio, dhcp_fim } = req.body;
  try {
    const result = await query(
      'INSERT INTO subnets (cidr, nome, descricao, vlan_id, gateway, dns_primario, dns_secundario, dhcp_inicio, dhcp_fim) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [cidr, nome, descricao, vlan_id || null, gateway, dns_primario, dns_secundario, dhcp_inicio, dhcp_fim]
    );
    await registrarAuditoria(req.user.id, 'criar', 'subnets', result.rows[0].id, { cidr, nome }, req.ip);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/subnets/:id', checkModulePermission('ativos', 'pode_editar'), async (req, res) => {
  const { cidr, nome, descricao, vlan_id, gateway, dns_primario, dns_secundario, dhcp_inicio, dhcp_fim } = req.body;
  try {
    const result = await query(
      'UPDATE subnets SET cidr = $1, nome = $2, descricao = $3, vlan_id = $4, gateway = $5, dns_primario = $6, dns_secundario = $7, dhcp_inicio = $8, dhcp_fim = $9, atualizado_em = CURRENT_TIMESTAMP WHERE id = $10 RETURNING *',
      [cidr, nome, descricao, vlan_id || null, gateway, dns_primario, dns_secundario, dhcp_inicio, dhcp_fim, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subnet não encontrada' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/subnets/:id', checkModulePermission('ativos', 'pode_excluir'), async (req, res) => {
  try {
    const subnet = await query('SELECT cidr, nome FROM subnets WHERE id = $1', [req.params.id]);
    await query('UPDATE subnets SET ativo = false WHERE id = $1', [req.params.id]);
    await registrarAuditoria(req.user.id, 'excluir', 'subnets', parseInt(req.params.id), { cidr: subnet.rows[0]?.cidr, nome: subnet.rows[0]?.nome }, req.ip);
    res.json({ message: 'Subnet removida com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/ips', checkModulePermission('ativos', 'pode_visualizar'), async (req, res) => {
  try {
    const result = await query(`
      SELECT ip.*, s.cidr as subnet_cidr, s.nome as subnet_nome, a.nome as ativo_nome
      FROM enderecos_ip ip
      LEFT JOIN subnets s ON ip.subnet_id = s.id
      LEFT JOIN ativos a ON ip.ativo_id = a.id
      ORDER BY ip.ip
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/ips', checkModulePermission('ativos', 'pode_criar'), async (req, res) => {
  const { ip, subnet_id, ativo_id, hostname, mac_address, tipo, status, descricao, reservado } = req.body;
  try {
    const result = await query(
      'INSERT INTO enderecos_ip (ip, subnet_id, ativo_id, hostname, mac_address, tipo, status, descricao, reservado) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [ip, subnet_id || null, ativo_id || null, hostname, mac_address, tipo || 'dinamico', status || 'disponivel', descricao, reservado || false]
    );
    await registrarAuditoria(req.user.id, 'criar', 'enderecos_ip', result.rows[0].id, { ip, hostname }, req.ip);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/ips/:id', checkModulePermission('ativos', 'pode_editar'), async (req, res) => {
  const { ip, subnet_id, ativo_id, hostname, mac_address, tipo, status, descricao, reservado } = req.body;
  try {
    const result = await query(
      'UPDATE enderecos_ip SET ip = $1, subnet_id = $2, ativo_id = $3, hostname = $4, mac_address = $5, tipo = $6, status = $7, descricao = $8, reservado = $9, atualizado_em = CURRENT_TIMESTAMP WHERE id = $10 RETURNING *',
      [ip, subnet_id || null, ativo_id || null, hostname, mac_address, tipo, status, descricao, reservado, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'IP não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/ips/:id', checkModulePermission('ativos', 'pode_excluir'), async (req, res) => {
  try {
    const ipRec = await query('SELECT ip, hostname FROM enderecos_ip WHERE id = $1', [req.params.id]);
    await query('DELETE FROM enderecos_ip WHERE id = $1', [req.params.id]);
    await registrarAuditoria(req.user.id, 'excluir', 'enderecos_ip', parseInt(req.params.id), { ip: ipRec.rows[0]?.ip, hostname: ipRec.rows[0]?.hostname }, req.ip);
    res.json({ message: 'IP removido com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/switches/:id/portas', checkModulePermission('ativos', 'pode_visualizar'), async (req, res) => {
  try {
    const result = await query(`
      SELECT p.*, v.nome as vlan_nome, v.numero as vlan_numero
      FROM portas_switch p
      LEFT JOIN vlans v ON p.vlan_id = v.id
      WHERE p.ativo_id = $1
      ORDER BY p.numero_porta
    `, [req.params.id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/switches/:id/portas', checkModulePermission('ativos', 'pode_criar'), async (req, res) => {
  const { numero_porta, vlan_id, status, velocidade, descricao, dispositivo_conectado, mac_conectado } = req.body;
  try {
    const result = await query(
      'INSERT INTO portas_switch (ativo_id, numero_porta, vlan_id, status, velocidade, descricao, dispositivo_conectado, mac_conectado) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [req.params.id, numero_porta, vlan_id || null, status || 'disponivel', velocidade, descricao, dispositivo_conectado, mac_conectado]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/portas/:id', checkModulePermission('ativos', 'pode_editar'), async (req, res) => {
  const { vlan_id, status, velocidade, descricao, dispositivo_conectado, mac_conectado } = req.body;
  try {
    const result = await query(
      'UPDATE portas_switch SET vlan_id = $1, status = $2, velocidade = $3, descricao = $4, dispositivo_conectado = $5, mac_conectado = $6, atualizado_em = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *',
      [vlan_id || null, status, velocidade, descricao, dispositivo_conectado, mac_conectado, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Porta não encontrada' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/roteadores', checkModulePermission('ativos', 'pode_visualizar'), async (req, res) => {
  try {
    const result = await query(`
      SELECT r.*, l.nome as localizacao_nome, v.nome as vlan_nome, v.numero as vlan_numero
      FROM ativos r
      LEFT JOIN localizacoes l ON r.localizacao_id = l.id
      LEFT JOIN vlans v ON r.especificacoes->>'vlan_id' = v.id::text
      WHERE r.tipo = 'roteador'
      ORDER BY r.nome
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/roteadores', checkModulePermission('ativos', 'pode_criar'), async (req, res) => {
  const { nome, marca, modelo, numero_serie, ip_address, mac_address, localizacao_id, gateway, dns_primario, dns_secundario, ssid, senha_wifi, tipo_conexao, velocidade, firmware, observacoes } = req.body;
  try {
    const especificacoes = { gateway, dns_primario, dns_secundario, ssid, senha_wifi, tipo_conexao, velocidade, firmware };
    const result = await query(
      `INSERT INTO ativos (tipo, nome, marca, modelo, numero_serie, ip_address, mac_address, localizacao_id, especificacoes, observacoes, status) 
       VALUES ('roteador', $1, $2, $3, $4, $5, $6, $7, $8, $9, 'em_uso') RETURNING *`,
      [nome, marca, modelo, numero_serie, ip_address, mac_address, localizacao_id || null, JSON.stringify(especificacoes), observacoes]
    );
    await registrarAuditoria(req.user.id, 'criar', 'roteadores', result.rows[0].id, { nome, ip_address }, req.ip);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/roteadores/:id', checkModulePermission('ativos', 'pode_editar'), async (req, res) => {
  const { nome, marca, modelo, numero_serie, ip_address, mac_address, localizacao_id, gateway, dns_primario, dns_secundario, ssid, senha_wifi, tipo_conexao, velocidade, firmware, observacoes } = req.body;
  try {
    const especificacoes = { gateway, dns_primario, dns_secundario, ssid, senha_wifi, tipo_conexao, velocidade, firmware };
    const result = await query(
      `UPDATE ativos SET nome = $1, marca = $2, modelo = $3, numero_serie = $4, ip_address = $5, mac_address = $6, localizacao_id = $7, especificacoes = $8, observacoes = $9, atualizado_em = CURRENT_TIMESTAMP 
       WHERE id = $10 AND tipo = 'roteador' RETURNING *`,
      [nome, marca, modelo, numero_serie, ip_address, mac_address, localizacao_id || null, JSON.stringify(especificacoes), observacoes, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Roteador não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/roteadores/:id', checkModulePermission('ativos', 'pode_excluir'), async (req, res) => {
  try {
    const roteador = await query('SELECT nome, ip_address FROM ativos WHERE id = $1', [req.params.id]);
    await query('DELETE FROM ativos WHERE id = $1 AND tipo = $2', [req.params.id, 'roteador']);
    await registrarAuditoria(req.user.id, 'excluir', 'roteadores', parseInt(req.params.id), { nome: roteador.rows[0]?.nome, ip_address: roteador.rows[0]?.ip_address }, req.ip);
    res.json({ message: 'Roteador removido com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/dashboard', checkModulePermission('ativos', 'pode_visualizar'), async (req, res) => {
  try {
    const totalVlans = await query('SELECT COUNT(*) as total FROM vlans WHERE ativo = true');
    const totalSubnets = await query('SELECT COUNT(*) as total FROM subnets WHERE ativo = true');
    const totalIps = await query('SELECT COUNT(*) as total FROM enderecos_ip');
    const ipsEmUso = await query("SELECT COUNT(*) as total FROM enderecos_ip WHERE status = 'em_uso'");
    const ipsDisponiveis = await query("SELECT COUNT(*) as total FROM enderecos_ip WHERE status = 'disponivel'");
    
    const equipamentosRede = await query(`
      SELECT COUNT(*) as total FROM ativos 
      WHERE tipo IN ('rede', 'switch', 'roteador', 'firewall', 'access_point')
    `);

    res.json({
      vlans: parseInt(totalVlans.rows[0].total),
      subnets: parseInt(totalSubnets.rows[0].total),
      ips: {
        total: parseInt(totalIps.rows[0].total),
        em_uso: parseInt(ipsEmUso.rows[0].total),
        disponiveis: parseInt(ipsDisponiveis.rows[0].total),
      },
      equipamentos_rede: parseInt(equipamentosRede.rows[0].total),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
