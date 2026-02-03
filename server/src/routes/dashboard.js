import express from 'express';
import { query } from '../database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

let dashboardCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 30000;

router.use(authMiddleware);

router.get('/stats', async (req, res) => {
  try {
    const now = Date.now();
    const forceRefresh = req.query.refresh === 'true';
    
    if (!forceRefresh && dashboardCache && cacheTimestamp && (now - cacheTimestamp < CACHE_DURATION)) {
      return res.json({ ...dashboardCache, cached: true });
    }

    const statsResult = await query(`
      WITH resumo_stats AS (
        SELECT 
          (SELECT COUNT(*) FROM ativos) as total_ativos,
          (SELECT COUNT(*) FROM ativos WHERE status IN ('disponivel', 'em_uso')) as ativos_ativos,
          (SELECT COUNT(*) FROM tickets) as total_tickets,
          (SELECT COUNT(*) FROM tickets WHERE status IN ('aberto', 'em_andamento')) as tickets_abertos,
          (SELECT COUNT(*) FROM projetos) as total_projetos,
          (SELECT COUNT(*) FROM projetos WHERE status NOT IN ('concluido', 'cancelado')) as projetos_ativos,
          (SELECT COUNT(*) FROM licencas) as total_licencas,
          (SELECT COUNT(*) FROM licencas WHERE data_expiracao <= CURRENT_DATE + INTERVAL '30 days' AND status = 'ativa') as licencas_expirando
      ),
      tickets_status AS (
        SELECT status, COUNT(*) as quantidade FROM tickets GROUP BY status
      ),
      tickets_prioridade AS (
        SELECT prioridade, COUNT(*) as quantidade 
        FROM tickets 
        WHERE status NOT IN ('resolvido', 'fechado')
        GROUP BY prioridade
      ),
      ativos_tipo AS (
        SELECT tipo, COUNT(*) as quantidade FROM ativos GROUP BY tipo
      ),
      projetos_status AS (
        SELECT status, COUNT(*) as quantidade FROM projetos GROUP BY status
      )
      SELECT 
        (SELECT row_to_json(r) FROM resumo_stats r) as resumo,
        (SELECT json_agg(row_to_json(t)) FROM tickets_status t) as tickets_status,
        (SELECT json_agg(row_to_json(p)) FROM tickets_prioridade p) as tickets_prioridade,
        (SELECT json_agg(row_to_json(a)) FROM ativos_tipo a) as ativos_tipo,
        (SELECT json_agg(row_to_json(s)) FROM projetos_status s) as projetos_status
    `);

    const [ticketsRecentes, projetosRecentes] = await Promise.all([
      query(`
        SELECT t.id, t.titulo, t.prioridade, t.status, t.criado_em,
          u.nome as solicitante_nome
        FROM tickets t
        LEFT JOIN usuarios u ON t.solicitante_id = u.id
        ORDER BY t.criado_em DESC
        LIMIT 10
      `),
      query(`
        SELECT p.id, p.nome, p.status, p.progresso, p.data_prevista_fim,
          u.nome as gerente_nome
        FROM projetos p
        LEFT JOIN usuarios u ON p.gerente_id = u.id
        WHERE p.status NOT IN ('concluido', 'cancelado')
        ORDER BY p.criado_em DESC
        LIMIT 5
      `)
    ]);

    const stats = statsResult.rows[0];
    const resumo = stats.resumo || {};

    const resultado = {
      resumo: {
        totalAtivos: parseInt(resumo.total_ativos || 0),
        ativosAtivos: parseInt(resumo.ativos_ativos || 0),
        totalTickets: parseInt(resumo.total_tickets || 0),
        ticketsAbertos: parseInt(resumo.tickets_abertos || 0),
        totalProjetos: parseInt(resumo.total_projetos || 0),
        projetosAtivos: parseInt(resumo.projetos_ativos || 0),
        totalLicencas: parseInt(resumo.total_licencas || 0),
        licencasExpirando: parseInt(resumo.licencas_expirando || 0)
      },
      graficos: {
        ticketsPorStatus: (stats.tickets_status || []).map(r => ({ ...r, quantidade: parseInt(r.quantidade) })),
        ticketsPorPrioridade: (stats.tickets_prioridade || []).map(r => ({ ...r, quantidade: parseInt(r.quantidade) })),
        ativosPorTipo: (stats.ativos_tipo || []).map(r => ({ ...r, quantidade: parseInt(r.quantidade) })),
        projetosPorStatus: (stats.projetos_status || []).map(r => ({ ...r, quantidade: parseInt(r.quantidade) }))
      },
      recentes: {
        tickets: ticketsRecentes.rows,
        projetos: projetosRecentes.rows
      },
      cached: false
    };

    dashboardCache = resultado;
    cacheTimestamp = now;

    res.json(resultado);
  } catch (error) {
    console.error('Erro ao buscar stats do dashboard:', error);
    res.status(500).json({ error: 'Erro ao carregar estatísticas', details: error.message });
  }
});

export function invalidateDashboardCache() {
  dashboardCache = null;
  cacheTimestamp = null;
}

export default router;
