import express from 'express';
import { query } from '../database.js';
import { authMiddleware, checkModulePermission } from '../middleware/auth.js';
import { registrarAuditoria, criarNotificacao, notificarTecnicosSetor } from '../services/auditoria.js';
import { io } from '../index.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', checkModulePermission('tickets', 'pode_visualizar'), async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.nivel_permissao;
    
    let sql = `
      SELECT t.*, 
        us.nome as solicitante_nome,
        ua.nome as atribuido_nome,
        a.nome as ativo_nome,
        s.nome as setor_nome
      FROM tickets t
      LEFT JOIN usuarios us ON t.solicitante_id = us.id
      LEFT JOIN usuarios ua ON t.atribuido_a_id = ua.id
      LEFT JOIN ativos a ON t.ativo_id = a.id
      LEFT JOIN setores s ON t.setor_id = s.id
    `;
    
    const params = [];
    
    if (userRole === 'usuario') {
      sql += ' WHERE t.solicitante_id = $1';
      params.push(userId);
    } else if (userRole === 'tecnico') {
      sql += ` WHERE (t.setor_id IN (
        SELECT setor_id FROM setor_tecnicos WHERE tecnico_id = $1
      ) OR t.atribuido_a_id = $1 OR t.solicitante_id = $1)`;
      params.push(userId);
    }
    
    sql += ' ORDER BY t.criado_em DESC';
    
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', checkModulePermission('tickets', 'pode_visualizar'), async (req, res) => {
  try {
    const ticketResult = await query(`
      SELECT t.*, 
        us.nome as solicitante_nome,
        ua.nome as atribuido_nome,
        a.nome as ativo_nome,
        s.nome as setor_nome
      FROM tickets t
      LEFT JOIN usuarios us ON t.solicitante_id = us.id
      LEFT JOIN usuarios ua ON t.atribuido_a_id = ua.id
      LEFT JOIN ativos a ON t.ativo_id = a.id
      LEFT JOIN setores s ON t.setor_id = s.id
      WHERE t.id = $1
    `, [req.params.id]);
    
    if (ticketResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }

    const comentariosResult = await query(`
      SELECT c.*, u.nome as usuario_nome
      FROM comentarios_ticket c
      LEFT JOIN usuarios u ON c.usuario_id = u.id
      WHERE c.ticket_id = $1
      ORDER BY c.criado_em ASC
    `, [req.params.id]);

    res.json({
      ...ticketResult.rows[0],
      comentarios: comentariosResult.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', checkModulePermission('tickets', 'pode_criar'), async (req, res) => {
  const { titulo, descricao, prioridade, categoria, solicitante_id, setor_id, ativo_id } = req.body;
  try {
    if (!setor_id) {
      return res.status(400).json({ error: 'Setor é obrigatório' });
    }
    
    const finalSolicitanteId = req.user.nivel_permissao === 'usuario' 
      ? req.user.id 
      : (solicitante_id || req.user.id);
    
    const result = await query(
      'INSERT INTO tickets (titulo, descricao, prioridade, categoria, solicitante_id, setor_id, ativo_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [titulo, descricao, prioridade || 'media', categoria, finalSolicitanteId, setor_id, ativo_id]
    );
    
    const ticket = result.rows[0];
    
    await registrarAuditoria(req.user.id, 'criar', 'tickets', ticket.id, { titulo, prioridade }, req.ip);
    
    await notificarTecnicosSetor(setor_id, 'info', 'Novo Ticket', `Novo ticket criado: ${titulo}`, `/tickets/${ticket.id}`);
    
    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/comentarios', checkModulePermission('tickets', 'pode_visualizar'), async (req, res) => {
  const { usuario_id, comentario } = req.body;
  try {
    const ticketResult = await query(
      'SELECT solicitante_id, atribuido_a_id FROM tickets WHERE id = $1',
      [req.params.id]
    );
    
    if (ticketResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }
    
    const ticket = ticketResult.rows[0];
    const userId = req.user.id;
    const userRole = req.user.nivel_permissao;
    
    if (userRole === 'usuario' && ticket.solicitante_id !== userId) {
      return res.status(403).json({ error: 'Você só pode comentar em seus próprios tickets' });
    }
    
    const result = await query(
      'INSERT INTO comentarios_ticket (ticket_id, usuario_id, comentario) VALUES ($1, $2, $3) RETURNING *',
      [req.params.id, usuario_id, comentario]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', checkModulePermission('tickets', 'pode_editar'), async (req, res) => {
  const { titulo, descricao, prioridade, status, categoria, setor_id, atribuido_a_id, solucao } = req.body;
  try {
    const resolvidoEm = status === 'resolvido' ? 'CURRENT_TIMESTAMP' : 'NULL';
    const ticketAnterior = await query('SELECT * FROM tickets WHERE id = $1', [req.params.id]);
    
    const result = await query(
      `UPDATE tickets SET 
        titulo = COALESCE($1, titulo), 
        descricao = COALESCE($2, descricao), 
        prioridade = COALESCE($3, prioridade), 
        status = COALESCE($4, status), 
        categoria = COALESCE($5, categoria), 
        setor_id = COALESCE($6, setor_id),
        atribuido_a_id = $7, 
        solucao = $8, 
        resolvido_em = ${resolvidoEm}, 
        atualizado_em = CURRENT_TIMESTAMP 
       WHERE id = $9 RETURNING *`,
      [titulo, descricao, prioridade, status, categoria, setor_id, atribuido_a_id, solucao, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }
    
    const ticket = result.rows[0];
    const anterior = ticketAnterior.rows[0];
    
    await registrarAuditoria(req.user.id, 'atualizar', 'tickets', ticket.id, { 
      status_anterior: anterior?.status, 
      status_novo: status,
      atribuido_anterior: anterior?.atribuido_a_id,
      atribuido_novo: atribuido_a_id
    }, req.ip);
    
    if (atribuido_a_id && atribuido_a_id !== anterior?.atribuido_a_id) {
      const notif = await criarNotificacao(atribuido_a_id, 'info', 'Ticket Atribuído', `O ticket "${ticket.titulo}" foi atribuído a você`, `/tickets/${ticket.id}`);
      if (notif) io.to(`user_${atribuido_a_id}`).emit('notificacao', notif);
    }
    
    if (status === 'resolvido' && anterior?.solicitante_id) {
      const notif = await criarNotificacao(anterior.solicitante_id, 'sucesso', 'Ticket Resolvido', `Seu ticket "${ticket.titulo}" foi resolvido`, `/tickets/${ticket.id}`);
      if (notif) io.to(`user_${anterior.solicitante_id}`).emit('notificacao', notif);
    }
    
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', checkModulePermission('tickets', 'pode_excluir'), async (req, res) => {
  try {
    const ticketAnterior = await query('SELECT titulo FROM tickets WHERE id = $1', [req.params.id]);
    const result = await query('DELETE FROM tickets WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }
    
    await registrarAuditoria(req.user.id, 'excluir', 'tickets', parseInt(req.params.id), { titulo: ticketAnterior.rows[0]?.titulo }, req.ip);
    
    res.json({ message: 'Ticket excluído com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
