import express from 'express';
import bcrypt from 'bcrypt';
import { query } from '../database.js';
import { generateToken } from '../middleware/auth.js';
import { registrarAuditoria } from '../services/auditoria.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const result = await query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const user = result.rows[0];

    if (!user.ativo) {
      return res.status(403).json({ error: 'Usuário inativo' });
    }

    const senhaValida = await bcrypt.compare(senha, user.senha);

    if (!senhaValida) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = generateToken(user);

    const { senha: _, ...userData } = user;

    await registrarAuditoria(user.id, 'login', 'auth', user.id, { email: user.email }, req.ip);

    res.json({
      token,
      user: userData
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro ao realizar login' });
  }
});

router.post('/registro', async (req, res) => {
  try {
    const { nome, email, senha, cargo, departamento } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    }

    const existente = await query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email]
    );

    if (existente.rows.length > 0) {
      return res.status(409).json({ error: 'Email já cadastrado' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const result = await query(
      `INSERT INTO usuarios (nome, email, senha, cargo, departamento, nivel_permissao, ativo)
       VALUES ($1, $2, $3, $4, $5, 'usuario', true)
       RETURNING id, nome, email, cargo, departamento, nivel_permissao, ativo, criado_em`,
      [nome, email, senhaHash, cargo || null, departamento || null]
    );

    const user = result.rows[0];
    const token = generateToken(user);

    await registrarAuditoria(user.id, 'registro', 'auth', user.id, { email: user.email, nome: user.nome }, req.ip);

    res.status(201).json({
      token,
      user
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

router.post('/verificar', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ valid: false });
    }

    const jwt = await import('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-jwt-secret-change-me';
    
    const decoded = jwt.default.verify(token, JWT_SECRET);
    
    const result = await query(
      'SELECT id, nome, email, cargo, departamento, nivel_permissao, ativo FROM usuarios WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0 || !result.rows[0].ativo) {
      return res.status(401).json({ valid: false });
    }

    res.json({ valid: true, user: result.rows[0] });
  } catch (error) {
    res.status(401).json({ valid: false });
  }
});

export default router;
