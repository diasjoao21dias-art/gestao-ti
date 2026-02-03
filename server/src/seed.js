import bcrypt from 'bcrypt';
import { query } from './database.js';

export const seedAdmin = async () => {
  try {
    const existingAdmin = await query(
      "SELECT id FROM usuarios WHERE email = 'admin@itmanager.com'"
    );

    if (existingAdmin.rows.length === 0) {
      const senhaHash = await bcrypt.hash('admin123', 10);
      
      await query(
        `INSERT INTO usuarios (nome, email, senha, cargo, departamento, nivel_permissao, ativo)
         VALUES ($1, $2, $3, $4, $5, $6, true)`,
        ['Administrador', 'admin@itmanager.com', senhaHash, 'Administrador de Sistema', 'TI', 'admin']
      );

      console.log('✅ Usuário administrador criado:');
      console.log('   Email: admin@itmanager.com');
      console.log('   Senha: admin123');
    }
  } catch (error) {
    console.error('Erro ao criar usuário administrador:', error);
  }
};
