import crypto from 'crypto';
import readline from 'readline';

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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n========================================');
console.log('   GERADOR DE LICENÇA - Sistema T.I.   ');
console.log('========================================\n');

rl.question('Nome da empresa: ', (empresa) => {
  if (!empresa.trim()) {
    console.log('\n❌ Nome da empresa é obrigatório!\n');
    rl.close();
    process.exit(1);
  }
  
  rl.question('Quantidade de dias de validade: ', (diasStr) => {
    const dias = parseInt(diasStr);
    
    if (isNaN(dias) || dias <= 0) {
      console.log('\n❌ Quantidade de dias inválida!\n');
      rl.close();
      process.exit(1);
    }
    
    const dataExpiracao = new Date();
    dataExpiracao.setDate(dataExpiracao.getDate() + dias);
    
    const chave = generateLicenseKey(empresa.trim(), dataExpiracao.toISOString());
    
    console.log('\n========================================');
    console.log('         LICENÇA GERADA COM SUCESSO     ');
    console.log('========================================\n');
    console.log('Empresa:', empresa.trim());
    console.log('Validade:', dias, 'dias');
    console.log('Expira em:', dataExpiracao.toLocaleDateString('pt-BR'));
    console.log('\n----------------------------------------');
    console.log('CHAVE DE LICENÇA (copie abaixo):');
    console.log('----------------------------------------\n');
    console.log(chave);
    console.log('\n----------------------------------------\n');
    
    rl.close();
  });
});
