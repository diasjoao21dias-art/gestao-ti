import { query } from './database.js';
import crypto from 'crypto';

const SECRET_KEY = process.env.LICENSE_SECRET || 'gestao-ti-license-secret-2024';

function generateLicenseKey(empresa, dataExpiracao) {
  const data = {
    empresa,
    expiracao: dataExpiracao,
    random: crypto.randomBytes(8).toString('hex'),
    timestamp: Date.now()
  };
  
  const dataStr = JSON.stringify(data);
  const cipher = crypto.createCipheriv('aes-256-cbc', 
    crypto.createHash('sha256').update(SECRET_KEY).digest(),
    Buffer.alloc(16, 0)
  );
  
  let encrypted = cipher.update(dataStr, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  return encrypted;
}

export const seedLicenca = async () => {
  try {
    const existingLicense = await query(`SELECT id FROM licenca_sistema WHERE ativa = true LIMIT 1`);
    
    if (existingLicense.rows.length > 0) {
      console.log('ℹ️  Licença já existe');
      return;
    }
    
    const dataExpiracao = new Date();
    dataExpiracao.setDate(dataExpiracao.getDate() + 30);
    
    const chave = generateLicenseKey('Empresa Demo', dataExpiracao.toISOString());
    
    await query(`
      INSERT INTO licenca_sistema (chave_licenca, empresa, data_expiracao, ativa)
      VALUES ($1, $2, $3, true)
    `, [chave, 'Empresa Demo', dataExpiracao]);
    
    console.log('✅ Licença inicial criada (30 dias)');
    console.log('   Empresa: Empresa Demo');
    console.log('   Validade:', dataExpiracao.toLocaleDateString('pt-BR'));
  } catch (error) {
    console.error('❌ Erro ao criar licença inicial:', error);
  }
};
