import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './database.js';

// Garantir que o dotenv carregue o arquivo .env da raiz do projeto
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
import authRoutes from './routes/auth.js';
import usuariosRoutes from './routes/usuarios.js';
import ativosRoutes from './routes/ativos.js';
import ticketsRoutes from './routes/tickets.js';
import projetosRoutes from './routes/projetos.js';
import licencasRoutes from './routes/licencas.js';
import conhecimentoRoutes from './routes/conhecimento.js';
import dashboardRoutes from './routes/dashboard.js';
import notificacoesRoutes from './routes/notificacoes.js';
import auditoriaRoutes from './routes/auditoria.js';
import relatoriosRoutes from './routes/relatorios.js';
import uploadsRoutes from './routes/uploads.js';
import slaRoutes from './routes/sla.js';
import qrcodeRoutes from './routes/qrcode.js';
import permissoesRoutes from './routes/permissoes.js';
import setoresRoutes from './routes/setores.js';
import inventarioRoutes from './routes/inventario.js';
import termosRoutes from './routes/termos.js';
import redeRoutes from './routes/rede.js';
import maquinasRoutes from './routes/maquinas.js';
import licencaSistemaRoutes from './routes/licenca-sistema.js';
import { verificarLicenca } from './middleware/licenca.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.BACKEND_PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

export { io };

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  next();
});

app.use('/api/licenca-sistema', licencaSistemaRoutes);

app.use(verificarLicenca);

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/ativos', ativosRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/projetos', projetosRoutes);
app.use('/api/licencas', licencasRoutes);
app.use('/api/conhecimento', conhecimentoRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notificacoes', notificacoesRoutes);
app.use('/api/auditoria', auditoriaRoutes);
app.use('/api/relatorios', relatoriosRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/sla', slaRoutes);
app.use('/api/qrcode', qrcodeRoutes);
app.use('/api/permissoes', permissoesRoutes);
app.use('/api/setores', setoresRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/termos', termosRoutes);
app.use('/api/rede', redeRoutes);
app.use('/api/maquinas', maquinasRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Sistema de Gestão de T.I. rodando!' });
});

io.on('connection', (socket) => {
  console.log('📱 Cliente conectado:', socket.id);

  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`👤 Usuário ${userId} entrou na sala`);
  });

  socket.on('leave', (userId) => {
    socket.leave(`user_${userId}`);
    console.log(`👋 Usuário ${userId} saiu da sala`);
  });

  socket.on('disconnect', () => {
    console.log('📴 Cliente desconectado:', socket.id);
  });
});

const startServer = async () => {
  try {
    await initDatabase();
    console.log('✅ Banco de dados conectado');
    
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`🔌 WebSocket ativo`);
    });
  } catch (error) {
    if (error.message && error.message.includes('client password must be a string')) {
      console.error('\n❌ ERRO DE CONFIGURAÇÃO:');
      console.error('A variável DATABASE_URL não foi encontrada ou está vazia.');
      console.error('No Windows, certifique-se de que o arquivo .env existe e contém a DATABASE_URL.');
      console.error('Exemplo no .env: DATABASE_URL=postgres://usuario:senha@localhost:5432/nome_do_banco\n');
    } else {
      console.error('❌ Erro ao iniciar servidor:', error);
    }
    process.exit(1);
  }
};

startServer();
