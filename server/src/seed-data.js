import bcrypt from 'bcrypt';
import { query } from './database.js';

export const seedExampleData = async () => {
  try {
    // Verificar se já existem dados
    const checkAtivos = await query('SELECT COUNT(*) FROM ativos');
    if (parseInt(checkAtivos.rows[0].count) > 0) {
      console.log('ℹ️  Dados de exemplo já existem');
      return;
    }

    console.log('📦 Inserindo dados de exemplo...');

    // Buscar ID do admin
    const adminResult = await query("SELECT id FROM usuarios WHERE email = 'admin@itmanager.com'");
    const adminId = adminResult.rows[0]?.id || 1;

    // Criar mais alguns usuários
    const senhaHash = await bcrypt.hash('senha123', 10);
    
    await query(`
      INSERT INTO usuarios (nome, email, senha, cargo, departamento, nivel_permissao, ativo) VALUES
      ('João Silva', 'joao@empresa.com', $1, 'Analista de TI', 'TI', 'tecnico', true),
      ('Maria Santos', 'maria@empresa.com', $1, 'Desenvolvedora', 'Desenvolvimento', 'tecnico', true),
      ('Pedro Costa', 'pedro@empresa.com', $1, 'Gerente de TI', 'TI', 'admin', true),
      ('Ana Lima', 'ana@empresa.com', $1, 'Suporte N1', 'Suporte', 'usuario', true)
    `, [senhaHash]);

    // Criar ativos
    await query(`
      INSERT INTO ativos (tipo, nome, marca, modelo, numero_serie, data_aquisicao, valor_aquisicao, localizacao, responsavel_id, status) VALUES
      ('hardware', 'Notebook Dell Latitude 5420', 'Dell', 'Latitude 5420', 'DL2024001', '2024-01-15', 4500.00, 'TI - Sala 201', ${adminId}, 'em_uso'),
      ('hardware', 'Desktop HP EliteDesk 800', 'HP', 'EliteDesk 800 G6', 'HP2024002', '2024-02-20', 3200.00, 'Financeiro', ${adminId}, 'em_uso'),
      ('hardware', 'Monitor LG UltraWide 29"', 'LG', '29WK600-W', 'LG2024003', '2024-03-10', 1200.00, 'Desenvolvimento', ${adminId}, 'disponivel'),
      ('rede', 'Switch Cisco 24 portas', 'Cisco', 'SG350-24', 'CS2024004', '2024-01-05', 2800.00, 'Datacenter', ${adminId}, 'em_uso'),
      ('rede', 'Roteador TP-Link AC1750', 'TP-Link', 'Archer C7', 'TP2024005', '2024-04-01', 450.00, 'Recepção', ${adminId}, 'em_uso')
    `);

    // Criar tickets
    await query(`
      INSERT INTO tickets (titulo, descricao, prioridade, status, categoria, solicitante_id, atribuido_a_id) VALUES
      ('Problema na impressora do 3º andar', 'A impressora HP do 3º andar não está imprimindo documentos', 'alta', 'em_andamento', 'Hardware', ${adminId}, ${adminId}),
      ('Solicitação de novo notebook', 'Preciso de um novo notebook para trabalho remoto', 'media', 'aberto', 'Requisição', ${adminId}, ${adminId}),
      ('Email não está funcionando', 'Não consigo enviar emails desde ontem', 'alta', 'aberto', 'Software', ${adminId}, ${adminId}),
      ('Configurar acesso VPN', 'Necessito acesso VPN para trabalhar de casa', 'baixa', 'resolvido', 'Acesso', ${adminId}, ${adminId}),
      ('Lentidão no sistema ERP', 'O sistema ERP está muito lento nas últimas semanas', 'media', 'em_andamento', 'Sistema', ${adminId}, ${adminId})
    `);

    // Criar projetos
    await query(`
      INSERT INTO projetos (nome, descricao, status, prioridade, data_inicio, data_prevista_fim, orcamento, gerente_id, progresso) VALUES
      ('Migração para Cloud AWS', 'Migração completa da infraestrutura para AWS', 'em_andamento', 'alta', '2024-01-01', '2024-12-31', 150000.00, ${adminId}, 35),
      ('Implantação ERP SAP', 'Implementação do sistema SAP para toda empresa', 'em_andamento', 'alta', '2024-03-01', '2024-10-31', 280000.00, ${adminId}, 55),
      ('Atualização de Rede', 'Upgrade da infraestrutura de rede', 'planejamento', 'media', '2024-06-01', '2024-09-30', 75000.00, ${adminId}, 10),
      ('Sistema de Backup Automatizado', 'Implementar solução de backup em nuvem', 'concluido', 'alta', '2024-01-15', '2024-03-15', 45000.00, ${adminId}, 100)
    `);

    // Criar licenças
    await query(`
      INSERT INTO licencas (software, tipo_licenca, quantidade_total, quantidade_usada, fornecedor, data_aquisicao, data_expiracao, valor, responsavel_id, status) VALUES
      ('Microsoft Office 365', 'Subscription', 150, 125, 'Microsoft', '2024-01-01', '2025-01-01', 28000.00, ${adminId}, 'ativa'),
      ('Adobe Creative Cloud', 'Subscription', 25, 18, 'Adobe', '2024-02-01', '2025-02-01', 15000.00, ${adminId}, 'ativa'),
      ('AutoCAD 2024', 'Anual', 10, 10, 'Autodesk', '2024-03-01', '2025-03-01', 32000.00, ${adminId}, 'ativa'),
      ('Windows Server 2022', 'Perpétua', 5, 5, 'Microsoft', '2024-01-15', NULL, 18000.00, ${adminId}, 'ativa'),
      ('Antivírus Kaspersky', 'Anual', 200, 180, 'Kaspersky', '2024-01-01', '2025-01-01', 12000.00, ${adminId}, 'ativa')
    `);

    // Criar artigos de conhecimento
    await query(`
      INSERT INTO artigos_conhecimento (titulo, conteudo, categoria, tags, autor_id, publicado) VALUES
      ('Como configurar VPN no Windows', 'Tutorial passo a passo para configurar VPN corporativa no Windows 10/11...', 'Tutoriais', ARRAY['vpn', 'windows', 'rede'], ${adminId}, true),
      ('Solução para problemas de impressão', 'Guia de troubleshooting para problemas comuns de impressoras...', 'Suporte', ARRAY['impressora', 'hardware', 'troubleshooting'], ${adminId}, true),
      ('Política de Senhas da Empresa', 'Diretrizes e requisitos para criação de senhas seguras...', 'Políticas', ARRAY['segurança', 'senha', 'política'], ${adminId}, true),
      ('Backup e Restore de Dados', 'Procedimentos para backup e restauração de arquivos importantes...', 'Procedimentos', ARRAY['backup', 'dados', 'segurança'], ${adminId}, true)
    `);

    console.log('✅ Dados de exemplo inseridos com sucesso!');
    console.log('   - 5 Usuários criados');
    console.log('   - 5 Ativos cadastrados');
    console.log('   - 5 Tickets abertos');
    console.log('   - 4 Projetos criados');
    console.log('   - 5 Licenças registradas');
    console.log('   - 4 Artigos na base de conhecimento');
  } catch (error) {
    console.error('Erro ao inserir dados de exemplo:', error);
  }
};
