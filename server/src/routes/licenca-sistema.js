import express from 'express';
import { query } from '../database.js';
import { authMiddleware } from '../middleware/auth.js';
import crypto from 'crypto';

const router = express.Router();

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

function decodeLicenseKey(chave) {
  try {
    const decipher = crypto.createDecipheriv('aes-256-cbc',
      crypto.createHash('sha256').update(SECRET_KEY).digest(),
      Buffer.alloc(16, 0)
    );
    
    let decrypted = decipher.update(chave, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  } catch (error) {
    return null;
  }
}

router.get('/status', async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM licenca_sistema 
      WHERE ativa = true 
      ORDER BY data_expiracao DESC 
      LIMIT 1
    `);
    
    if (result.rows.length === 0) {
      return res.json({
        valida: false,
        mensagem: 'Nenhuma licença ativa encontrada',
        diasRestantes: 0,
        expirada: true,
        whatsapp: process.env.LICENSE_WHATSAPP || ''
      });
    }
    
    const licenca = result.rows[0];
    const agora = new Date();
    const expiracao = new Date(licenca.data_expiracao);
    const diffTime = expiracao - agora;
    const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const expirada = diasRestantes <= 0;
    const proximoVencimento = diasRestantes > 0 && diasRestantes <= 7;
    
    res.json({
      valida: !expirada,
      empresa: licenca.empresa,
      dataExpiracao: licenca.data_expiracao,
      diasRestantes: Math.max(0, diasRestantes),
      expirada,
      proximoVencimento,
      whatsapp: process.env.LICENSE_WHATSAPP || ''
    });
  } catch (error) {
    console.error('Erro ao verificar licença:', error);
    res.status(500).json({ error: 'Erro ao verificar licença' });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.nivel_permissao !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    const result = await query(`
      SELECT * FROM licenca_sistema 
      ORDER BY criado_em DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar licenças:', error);
    res.status(500).json({ error: 'Erro ao listar licenças' });
  }
});

router.post('/ativar', authMiddleware, async (req, res) => {
  try {
    if (req.user.nivel_permissao !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    const { chave_licenca } = req.body;
    
    if (!chave_licenca) {
      return res.status(400).json({ error: 'Chave de licença é obrigatória' });
    }
    
    const dadosLicenca = decodeLicenseKey(chave_licenca);
    
    if (!dadosLicenca) {
      return res.status(400).json({ error: 'Chave de licença inválida' });
    }
    
    const dataExpiracao = new Date(dadosLicenca.expiracao);
    const agora = new Date();
    
    if (dataExpiracao <= agora) {
      return res.status(400).json({ error: 'Esta chave de licença já está expirada' });
    }
    
    await query(`UPDATE licenca_sistema SET ativa = false WHERE ativa = true`);
    
    const existente = await query(`SELECT id FROM licenca_sistema WHERE chave_licenca = $1`, [chave_licenca]);
    
    if (existente.rows.length > 0) {
      await query(`
        UPDATE licenca_sistema 
        SET ativa = true, data_ativacao = CURRENT_TIMESTAMP, atualizado_em = CURRENT_TIMESTAMP
        WHERE chave_licenca = $1
      `, [chave_licenca]);
    } else {
      await query(`
        INSERT INTO licenca_sistema (chave_licenca, empresa, data_expiracao, ativa)
        VALUES ($1, $2, $3, true)
      `, [chave_licenca, dadosLicenca.empresa, dataExpiracao]);
    }
    
    res.json({ 
      success: true, 
      mensagem: 'Licença ativada com sucesso!',
      empresa: dadosLicenca.empresa,
      dataExpiracao
    });
  } catch (error) {
    console.error('Erro ao ativar licença:', error);
    res.status(500).json({ error: 'Erro ao ativar licença' });
  }
});

router.post('/gerar', authMiddleware, async (req, res) => {
  try {
    if (req.user.nivel_permissao !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    const { empresa, dias } = req.body;
    
    if (!empresa || !dias) {
      return res.status(400).json({ error: 'Empresa e dias são obrigatórios' });
    }
    
    const dataExpiracao = new Date();
    dataExpiracao.setDate(dataExpiracao.getDate() + parseInt(dias));
    
    const chave = generateLicenseKey(empresa, dataExpiracao.toISOString());
    
    res.json({ 
      chave,
      empresa,
      dataExpiracao,
      dias: parseInt(dias)
    });
  } catch (error) {
    console.error('Erro ao gerar licença:', error);
    res.status(500).json({ error: 'Erro ao gerar licença' });
  }
});

export default router;
