import { query } from '../database.js';

export const verificarLicenca = async (req, res, next) => {
  if (req.path === '/api/licenca-sistema/status' || 
      req.path.includes('/api/auth/login') ||
      req.path.includes('/api/auth/registro') ||
      req.path.includes('/api/auth/verificar') ||
      req.path === '/api/health') {
    return next();
  }
  
  if (req.path === '/api/licenca-sistema/ativar') {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido. Faça login como administrador.' });
    }
    return next();
  }
  
  try {
    const result = await query(`
      SELECT * FROM licenca_sistema 
      WHERE ativa = true 
      ORDER BY data_expiracao DESC 
      LIMIT 1
    `);
    
    if (result.rows.length === 0) {
      return res.status(403).json({ 
        error: 'LICENSE_EXPIRED',
        mensagem: 'Sistema sem licença ativa. Entre em contato para renovar.',
        whatsapp: process.env.LICENSE_WHATSAPP || ''
      });
    }
    
    const licenca = result.rows[0];
    const agora = new Date();
    const expiracao = new Date(licenca.data_expiracao);
    
    if (expiracao <= agora) {
      return res.status(403).json({ 
        error: 'LICENSE_EXPIRED',
        mensagem: 'Licença expirada. Entre em contato para renovar.',
        whatsapp: process.env.LICENSE_WHATSAPP || ''
      });
    }
    
    next();
  } catch (error) {
    console.error('Erro ao verificar licença:', error);
    next();
  }
};
