import { query } from './database.js';

export const seedSetores = async () => {
  try {
    const checkSetores = await query('SELECT COUNT(*) FROM setores');
    if (parseInt(checkSetores.rows[0].count) > 0) {
      console.log('ℹ️  Setores já existem');
      return;
    }

    console.log('📦 Criando setores padrão...');

    await query(`
      INSERT INTO setores (nome, descricao, ativo) VALUES
      ('Suporte Técnico', 'Atendimento e suporte aos usuários', true),
      ('Infraestrutura', 'Gestão de servidores, redes e infraestrutura', true),
      ('Desenvolvimento', 'Desenvolvimento de sistemas e aplicações', true),
      ('Segurança da Informação', 'Segurança, políticas e compliance', true)
    `);

    console.log('✅ Setores padrão criados com sucesso!');
  } catch (error) {
    console.error('Erro ao criar setores:', error);
  }
};
