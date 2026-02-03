import { query } from './database.js';

export const seedSLA = async () => {
  try {
    const existingSLA = await query('SELECT COUNT(*) FROM configuracoes_sla');
    
    if (parseInt(existingSLA.rows[0].count) > 0) {
      console.log('✅ Configurações de SLA já existem');
      return;
    }

    await query(`
      INSERT INTO configuracoes_sla (nome, prioridade, tempo_resposta_horas, tempo_resolucao_horas)
      VALUES 
        ('SLA Alta Prioridade', 'alta', 1, 4),
        ('SLA Média Prioridade', 'media', 4, 24),
        ('SLA Baixa Prioridade', 'baixa', 24, 72)
    `);

    console.log('✅ Configurações de SLA criadas com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar configurações de SLA:', error);
  }
};
