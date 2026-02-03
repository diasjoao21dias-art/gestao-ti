import express from 'express';
import { query } from '../database.js';
import { authMiddleware } from '../middleware/auth.js';
import { registrarAuditoria } from '../services/auditoria.js';

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT m.*, 
        COALESCE(m.setor_texto, s.nome) as setor_nome,
        COALESCE(m.usuario_texto, u.nome) as usuario_nome,
        (SELECT COUNT(*) FROM componentes_maquina WHERE maquina_id = m.id) as total_componentes
      FROM maquinas_rede m
      LEFT JOIN setores s ON m.setor_id = s.id
      LEFT JOIN usuarios u ON m.usuario_id = u.id
      WHERE m.ativo = true
      ORDER BY m.nome ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar máquinas:', error);
    res.status(500).json({ error: 'Erro ao buscar máquinas' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT m.*, 
        s.nome as setor_nome,
        u.nome as usuario_nome
      FROM maquinas_rede m
      LEFT JOIN setores s ON m.setor_id = s.id
      LEFT JOIN usuarios u ON m.usuario_id = u.id
      WHERE m.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Máquina não encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar máquina:', error);
    res.status(500).json({ error: 'Erro ao buscar máquina' });
  }
});

router.get('/:id/manutencoes', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT m.*, u.nome as tecnico_nome
      FROM manutencoes_maquina m
      LEFT JOIN usuarios u ON m.tecnico_id = u.id
      WHERE m.maquina_id = $1
      ORDER BY m.data_manutencao DESC
    `, [id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar manutenções' });
  }
});

router.post('/:id/manutencoes', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo, data_manutencao, descricao, frequencia_meses } = req.body;
    
    console.log('Registrando manutenção:', { id, tipo, data_manutencao, descricao, frequencia_meses });
    console.log('Usuário autenticado:', req.user);

    const freq = frequencia_meses || 6;
    const proxima = new Date(data_manutencao);
    proxima.setMonth(proxima.getMonth() + parseInt(freq));

    const result = await query(`
      INSERT INTO manutencoes_maquina (maquina_id, tipo, data_manutencao, descricao, tecnico_id, proxima_manutencao)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [id, tipo, data_manutencao, descricao, req.user?.id || 1, proxima]);

    await query(`
      UPDATE maquinas_rede 
      SET ultima_manutencao = $1, 
          proxima_manutencao = $2,
          frequencia_manutencao_meses = $3
      WHERE id = $4
    `, [data_manutencao, proxima, freq, id]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro detalhado ao registrar manutenção:', error);
    res.status(500).json({ error: 'Erro ao registrar manutenção', details: error.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { nome, ip, setor, usuario, sistema_operacional, observacoes } = req.body;
    
    if (!nome) {
      return res.status(400).json({ error: 'Nome da máquina é obrigatório' });
    }
    
    const result = await query(`
      INSERT INTO maquinas_rede (nome, ip, setor_texto, usuario_texto, sistema_operacional, observacoes)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [nome, ip || null, setor || null, usuario || null, sistema_operacional || null, observacoes || null]);
    
    await registrarAuditoria(req.user.id, 'criar', 'maquinas', result.rows[0].id, { nome, ip }, req.ip);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar máquina:', error);
    res.status(500).json({ error: 'Erro ao criar máquina' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, ip, setor, usuario, sistema_operacional, observacoes } = req.body;
    
    if (!nome) {
      return res.status(400).json({ error: 'Nome da máquina é obrigatório' });
    }
    
    const result = await query(`
      UPDATE maquinas_rede 
      SET nome = $1, ip = $2, setor_texto = $3, usuario_texto = $4, 
          sistema_operacional = $5, observacoes = $6, atualizado_em = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `, [nome, ip || null, setor || null, usuario || null, sistema_operacional || null, observacoes || null, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Máquina não encontrada' });
    }
    
    await registrarAuditoria(req.user.id, 'atualizar', 'maquinas', parseInt(id), { nome, ip }, req.ip);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar máquina:', error);
    res.status(500).json({ error: 'Erro ao atualizar máquina' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const maquina = await query('SELECT nome FROM maquinas_rede WHERE id = $1', [id]);
    const result = await query(`
      UPDATE maquinas_rede SET ativo = false, atualizado_em = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Máquina não encontrada' });
    }
    
    await registrarAuditoria(req.user.id, 'excluir', 'maquinas', parseInt(id), { nome: maquina.rows[0]?.nome }, req.ip);
    res.json({ message: 'Máquina excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir máquina:', error);
    res.status(500).json({ error: 'Erro ao excluir máquina' });
  }
});

router.get('/:id/componentes', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT * FROM componentes_maquina 
      WHERE maquina_id = $1 
      ORDER BY tipo, descricao
    `, [id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar componentes:', error);
    res.status(500).json({ error: 'Erro ao buscar componentes' });
  }
});

router.post('/:id/componentes', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo, descricao, marca, modelo, numero_serie, capacidade, observacoes } = req.body;
    
    if (!tipo || !descricao) {
      return res.status(400).json({ error: 'Tipo e descrição são obrigatórios' });
    }
    
    const result = await query(`
      INSERT INTO componentes_maquina (maquina_id, tipo, descricao, marca, modelo, numero_serie, capacidade, observacoes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [id, tipo, descricao, marca || null, modelo || null, numero_serie || null, capacidade || null, observacoes || null]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar componente:', error);
    res.status(500).json({ error: 'Erro ao criar componente' });
  }
});

router.put('/componentes/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo, descricao, marca, modelo, numero_serie, capacidade, observacoes } = req.body;
    
    if (!tipo || !descricao) {
      return res.status(400).json({ error: 'Tipo e descrição são obrigatórios' });
    }
    
    const result = await query(`
      UPDATE componentes_maquina 
      SET tipo = $1, descricao = $2, marca = $3, modelo = $4, 
          numero_serie = $5, capacidade = $6, observacoes = $7, atualizado_em = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `, [tipo, descricao, marca || null, modelo || null, numero_serie || null, capacidade || null, observacoes || null, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Componente não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar componente:', error);
    res.status(500).json({ error: 'Erro ao atualizar componente' });
  }
});

router.delete('/componentes/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      DELETE FROM componentes_maquina WHERE id = $1 RETURNING *
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Componente não encontrado' });
    }
    
    res.json({ message: 'Componente excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir componente:', error);
    res.status(500).json({ error: 'Erro ao excluir componente' });
  }
});

router.put('/manutencoes/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo, data_manutencao, descricao, frequencia_meses } = req.body;
    
    const freq = frequencia_meses || 6;
    const proxima = new Date(data_manutencao);
    proxima.setMonth(proxima.getMonth() + parseInt(freq));

    const result = await query(`
      UPDATE manutencoes_maquina 
      SET tipo = $1, data_manutencao = $2, descricao = $3, proxima_manutencao = $4, atualizado_em = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `, [tipo, data_manutencao, descricao, proxima, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Manutenção não encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar manutenção:', error);
    res.status(500).json({ error: 'Erro ao atualizar manutenção' });
  }
});

router.delete('/manutencoes/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM manutencoes_maquina WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Manutenção não encontrada' });
    }
    
    res.json({ message: 'Manutenção excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir manutenção:', error);
    res.status(500).json({ error: 'Erro ao excluir manutenção' });
  }
});

export default router;
