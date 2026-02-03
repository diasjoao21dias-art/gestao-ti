import { query } from '../database.js';

export async function registrarAuditoria(usuario_id, acao, modulo, registro_id = null, detalhes = null, ip_address = null) {
  try {
    await query(
      `INSERT INTO logs_auditoria (usuario_id, acao, modulo, registro_id, detalhes, ip_address) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [usuario_id, acao, modulo, registro_id, detalhes ? JSON.stringify(detalhes) : null, ip_address]
    );
  } catch (error) {
    console.error('Erro ao registrar auditoria:', error);
  }
}

export async function criarNotificacao(usuario_id, tipo, titulo, mensagem, link = null) {
  try {
    const result = await query(
      `INSERT INTO notificacoes (usuario_id, tipo, titulo, mensagem, link) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [usuario_id, tipo, titulo, mensagem, link]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    return null;
  }
}

export async function notificarTecnicosSetor(setor_id, tipo, titulo, mensagem, link = null) {
  try {
    const tecnicos = await query(
      `SELECT tecnico_id FROM setor_tecnicos WHERE setor_id = $1`,
      [setor_id]
    );
    
    for (const tecnico of tecnicos.rows) {
      await criarNotificacao(tecnico.tecnico_id, tipo, titulo, mensagem, link);
    }
  } catch (error) {
    console.error('Erro ao notificar técnicos:', error);
  }
}
