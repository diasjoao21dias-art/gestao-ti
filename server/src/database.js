import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export const query = (text, params) => pool.query(text, params);

export const initDatabase = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        senha VARCHAR(255) NOT NULL,
        cargo VARCHAR(100),
        departamento VARCHAR(100),
        nivel_permissao VARCHAR(50) DEFAULT 'usuario',
        ativo BOOLEAN DEFAULT true,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS categorias_ativos (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL UNIQUE,
        tipo VARCHAR(50) NOT NULL,
        descricao TEXT,
        icone VARCHAR(50),
        ativo BOOLEAN DEFAULT true,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS localizacoes (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        tipo VARCHAR(50) NOT NULL,
        parent_id INTEGER REFERENCES localizacoes(id) ON DELETE CASCADE,
        endereco TEXT,
        responsavel_id INTEGER REFERENCES usuarios(id),
        observacoes TEXT,
        ativo BOOLEAN DEFAULT true,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS fornecedores (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        cnpj VARCHAR(20),
        contato VARCHAR(255),
        telefone VARCHAR(20),
        email VARCHAR(255),
        endereco TEXT,
        observacoes TEXT,
        ativo BOOLEAN DEFAULT true,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS ativos (
        id SERIAL PRIMARY KEY,
        tipo VARCHAR(50) NOT NULL,
        categoria_id INTEGER REFERENCES categorias_ativos(id),
        nome VARCHAR(255) NOT NULL,
        patrimonio VARCHAR(50),
        marca VARCHAR(100),
        modelo VARCHAR(100),
        numero_serie VARCHAR(100) UNIQUE,
        data_aquisicao DATE,
        valor_aquisicao DECIMAL(10,2),
        data_garantia DATE,
        fornecedor_id INTEGER REFERENCES fornecedores(id),
        localizacao_id INTEGER REFERENCES localizacoes(id),
        localizacao VARCHAR(255),
        responsavel_id INTEGER REFERENCES usuarios(id),
        status VARCHAR(50) DEFAULT 'disponivel',
        condicao VARCHAR(50) DEFAULT 'bom',
        vida_util_anos INTEGER,
        depreciacao_anual DECIMAL(5,2),
        ip_address VARCHAR(50),
        mac_address VARCHAR(50),
        hostname VARCHAR(100),
        especificacoes JSONB,
        observacoes TEXT,
        em_estoque BOOLEAN DEFAULT true,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS setores (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL UNIQUE,
        descricao TEXT,
        ativo BOOLEAN DEFAULT true,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS tickets (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        descricao TEXT NOT NULL,
        prioridade VARCHAR(20) DEFAULT 'media',
        status VARCHAR(50) DEFAULT 'aberto',
        categoria VARCHAR(100),
        solicitante_id INTEGER REFERENCES usuarios(id),
        atribuido_a_id INTEGER REFERENCES usuarios(id),
        setor_id INTEGER REFERENCES setores(id),
        ativo_id INTEGER REFERENCES ativos(id),
        solucao TEXT,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolvido_em TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS setor_tecnicos (
        id SERIAL PRIMARY KEY,
        setor_id INTEGER REFERENCES setores(id) ON DELETE CASCADE,
        tecnico_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(setor_id, tecnico_id)
      );

      CREATE TABLE IF NOT EXISTS projetos (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        descricao TEXT,
        status VARCHAR(50) DEFAULT 'planejamento',
        prioridade VARCHAR(20) DEFAULT 'media',
        data_inicio DATE,
        data_prevista_fim DATE,
        data_fim DATE,
        orcamento DECIMAL(12,2),
        gerente_id INTEGER REFERENCES usuarios(id),
        progresso INTEGER DEFAULT 0,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS licencas (
        id SERIAL PRIMARY KEY,
        software VARCHAR(255) NOT NULL,
        tipo_licenca VARCHAR(100),
        quantidade_total INTEGER,
        quantidade_usada INTEGER DEFAULT 0,
        chave_licenca TEXT,
        fornecedor VARCHAR(255),
        data_aquisicao DATE,
        data_expiracao DATE,
        valor DECIMAL(10,2),
        responsavel_id INTEGER REFERENCES usuarios(id),
        status VARCHAR(50) DEFAULT 'ativa',
        observacoes TEXT,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS artigos_conhecimento (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        conteudo TEXT NOT NULL,
        categoria VARCHAR(100),
        tags TEXT[],
        autor_id INTEGER REFERENCES usuarios(id),
        visualizacoes INTEGER DEFAULT 0,
        util INTEGER DEFAULT 0,
        publicado BOOLEAN DEFAULT true,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS artigos_conhecimento_anexos (
        id SERIAL PRIMARY KEY,
        artigo_id INTEGER REFERENCES artigos_conhecimento(id) ON DELETE CASCADE,
        nome_original VARCHAR(255) NOT NULL,
        caminho VARCHAR(500) NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        tamanho INTEGER NOT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS comentarios_ticket (
        id SERIAL PRIMARY KEY,
        ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
        usuario_id INTEGER REFERENCES usuarios(id),
        comentario TEXT NOT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS tarefas_projeto (
        id SERIAL PRIMARY KEY,
        projeto_id INTEGER REFERENCES projetos(id) ON DELETE CASCADE,
        titulo VARCHAR(255) NOT NULL,
        descricao TEXT,
        responsavel_id INTEGER REFERENCES usuarios(id),
        status VARCHAR(50) DEFAULT 'pendente',
        prioridade VARCHAR(20) DEFAULT 'media',
        data_prevista DATE,
        concluido BOOLEAN DEFAULT false,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS historico_ativos (
        id SERIAL PRIMARY KEY,
        ativo_id INTEGER REFERENCES ativos(id) ON DELETE CASCADE,
        usuario_id INTEGER REFERENCES usuarios(id),
        acao VARCHAR(100) NOT NULL,
        detalhes TEXT,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS componentes_ativo (
        id SERIAL PRIMARY KEY,
        ativo_id INTEGER REFERENCES ativos(id) ON DELETE CASCADE,
        tipo VARCHAR(100) NOT NULL,
        nome VARCHAR(255) NOT NULL,
        marca VARCHAR(100),
        modelo VARCHAR(100),
        numero_serie VARCHAR(100),
        capacidade VARCHAR(100),
        especificacoes JSONB,
        observacoes TEXT,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS itens_estoque (
        id SERIAL PRIMARY KEY,
        categoria VARCHAR(100) NOT NULL,
        nome VARCHAR(255) NOT NULL,
        descricao TEXT,
        marca VARCHAR(100),
        modelo VARCHAR(100),
        unidade VARCHAR(20) DEFAULT 'unidade',
        quantidade_atual INTEGER DEFAULT 0,
        quantidade_minima INTEGER DEFAULT 0,
        localizacao_id INTEGER REFERENCES localizacoes(id),
        valor_unitario DECIMAL(10,2),
        observacoes TEXT,
        ativo BOOLEAN DEFAULT true,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
        id SERIAL PRIMARY KEY,
        item_id INTEGER REFERENCES itens_estoque(id) ON DELETE CASCADE,
        tipo VARCHAR(20) NOT NULL,
        quantidade INTEGER NOT NULL,
        motivo VARCHAR(255),
        usuario_destino_id INTEGER REFERENCES usuarios(id),
        ativo_destino_id INTEGER REFERENCES ativos(id),
        documento VARCHAR(100),
        observacoes TEXT,
        usuario_id INTEGER REFERENCES usuarios(id),
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS atribuicoes_ativo (
        id SERIAL PRIMARY KEY,
        ativo_id INTEGER REFERENCES ativos(id) ON DELETE CASCADE,
        usuario_id INTEGER REFERENCES usuarios(id),
        data_atribuicao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        data_devolucao TIMESTAMP,
        status VARCHAR(50) DEFAULT 'ativo',
        observacoes TEXT,
        termo_id INTEGER,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS termos_responsabilidade (
        id SERIAL PRIMARY KEY,
        numero VARCHAR(50) UNIQUE,
        usuario_id INTEGER REFERENCES usuarios(id),
        data_emissao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'pendente',
        observacoes TEXT,
        assinatura_usuario TEXT,
        data_assinatura TIMESTAMP,
        assinatura_responsavel TEXT,
        data_assinatura_responsavel TIMESTAMP,
        pdf_path VARCHAR(500),
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS itens_termo (
        id SERIAL PRIMARY KEY,
        termo_id INTEGER REFERENCES termos_responsabilidade(id) ON DELETE CASCADE,
        ativo_id INTEGER REFERENCES ativos(id),
        descricao TEXT,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS vlans (
        id SERIAL PRIMARY KEY,
        numero INTEGER NOT NULL UNIQUE,
        nome VARCHAR(100) NOT NULL,
        descricao TEXT,
        gateway VARCHAR(50),
        mascara VARCHAR(50),
        localizacao_id INTEGER REFERENCES localizacoes(id),
        ativo BOOLEAN DEFAULT true,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS subnets (
        id SERIAL PRIMARY KEY,
        cidr VARCHAR(50) NOT NULL UNIQUE,
        nome VARCHAR(100),
        descricao TEXT,
        vlan_id INTEGER REFERENCES vlans(id),
        gateway VARCHAR(50),
        dns_primario VARCHAR(50),
        dns_secundario VARCHAR(50),
        dhcp_inicio VARCHAR(50),
        dhcp_fim VARCHAR(50),
        ativo BOOLEAN DEFAULT true,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS enderecos_ip (
        id SERIAL PRIMARY KEY,
        ip VARCHAR(50) NOT NULL UNIQUE,
        subnet_id INTEGER REFERENCES subnets(id),
        ativo_id INTEGER REFERENCES ativos(id),
        hostname VARCHAR(100),
        mac_address VARCHAR(50),
        tipo VARCHAR(50) DEFAULT 'dinamico',
        status VARCHAR(50) DEFAULT 'disponivel',
        descricao TEXT,
        reservado BOOLEAN DEFAULT false,
        ultimo_ping TIMESTAMP,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS portas_switch (
        id SERIAL PRIMARY KEY,
        ativo_id INTEGER REFERENCES ativos(id) ON DELETE CASCADE,
        numero_porta VARCHAR(20) NOT NULL,
        vlan_id INTEGER REFERENCES vlans(id),
        status VARCHAR(50) DEFAULT 'disponivel',
        velocidade VARCHAR(50),
        descricao TEXT,
        dispositivo_conectado VARCHAR(255),
        mac_conectado VARCHAR(50),
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS instalacoes_software (
        id SERIAL PRIMARY KEY,
        licenca_id INTEGER REFERENCES licencas(id) ON DELETE CASCADE,
        ativo_id INTEGER REFERENCES ativos(id) ON DELETE CASCADE,
        versao VARCHAR(100),
        data_instalacao DATE,
        chave_usada TEXT,
        observacoes TEXT,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(licenca_id, ativo_id)
      );

      CREATE TABLE IF NOT EXISTS notificacoes (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
        tipo VARCHAR(50) NOT NULL,
        titulo VARCHAR(255) NOT NULL,
        mensagem TEXT NOT NULL,
        link VARCHAR(500),
        lida BOOLEAN DEFAULT false,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS logs_auditoria (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id),
        acao VARCHAR(100) NOT NULL,
        modulo VARCHAR(50) NOT NULL,
        registro_id INTEGER,
        detalhes JSONB,
        ip_address VARCHAR(50),
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS anexos_ticket (
        id SERIAL PRIMARY KEY,
        ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
        nome_arquivo VARCHAR(255) NOT NULL,
        caminho_arquivo VARCHAR(500) NOT NULL,
        tamanho_bytes INTEGER,
        tipo_mime VARCHAR(100),
        usuario_id INTEGER REFERENCES usuarios(id),
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS configuracoes_sla (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        prioridade VARCHAR(20) NOT NULL,
        tempo_resposta_horas INTEGER NOT NULL,
        tempo_resolucao_horas INTEGER NOT NULL,
        ativo BOOLEAN DEFAULT true,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS qr_codes_ativos (
        id SERIAL PRIMARY KEY,
        ativo_id INTEGER REFERENCES ativos(id) ON DELETE CASCADE,
        qr_code_data TEXT NOT NULL UNIQUE,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS permissoes_usuario (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
        modulo VARCHAR(50) NOT NULL,
        pode_visualizar BOOLEAN DEFAULT false,
        pode_criar BOOLEAN DEFAULT false,
        pode_editar BOOLEAN DEFAULT false,
        pode_excluir BOOLEAN DEFAULT false,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(usuario_id, modulo)
      );

      CREATE TABLE IF NOT EXISTS maquinas_rede (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        ip VARCHAR(50),
        setor_id INTEGER REFERENCES setores(id),
        usuario_id INTEGER REFERENCES usuarios(id),
        setor_texto VARCHAR(255),
        usuario_texto VARCHAR(255),
        sistema_operacional VARCHAR(100),
        observacoes TEXT,
        ativo BOOLEAN DEFAULT true,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS componentes_maquina (
        id SERIAL PRIMARY KEY,
        maquina_id INTEGER REFERENCES maquinas_rede(id) ON DELETE CASCADE,
        tipo VARCHAR(100) NOT NULL,
        descricao VARCHAR(255) NOT NULL,
        marca VARCHAR(100),
        modelo VARCHAR(100),
        numero_serie VARCHAR(100),
        capacidade VARCHAR(100),
        observacoes TEXT,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS licenca_sistema (
        id SERIAL PRIMARY KEY,
        chave_licenca VARCHAR(500) NOT NULL UNIQUE,
        empresa VARCHAR(255) NOT NULL,
        data_ativacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        data_expiracao TIMESTAMP NOT NULL,
        ativa BOOLEAN DEFAULT true,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

    `);

    // Migração: Adicionar novas colunas à tabela ativos se não existirem
    const migrateAtivos = async () => {
      const columns = [
        { name: 'categoria_id', type: 'INTEGER REFERENCES categorias_ativos(id)' },
        { name: 'localizacao_id', type: 'INTEGER REFERENCES localizacoes(id)' },
        { name: 'fornecedor_id', type: 'INTEGER REFERENCES fornecedores(id)' },
        { name: 'patrimonio', type: 'VARCHAR(50)' },
        { name: 'responsavel_id', type: 'INTEGER REFERENCES usuarios(id)' },
        { name: 'condicao', type: 'VARCHAR(50) DEFAULT \'bom\'' },
        { name: 'vida_util_anos', type: 'INTEGER' },
        { name: 'depreciacao_anual', type: 'DECIMAL(5,2)' },
        { name: 'em_estoque', type: 'BOOLEAN DEFAULT true' },
        { name: 'data_garantia', type: 'DATE' },
        { name: 'valor_aquisicao', type: 'DECIMAL(10,2)' },
        { name: 'especificacoes', type: 'JSONB' },
        { name: 'observacoes', type: 'TEXT' },
        { name: 'ip_address', type: 'VARCHAR(50)' },
        { name: 'mac_address', type: 'VARCHAR(50)' },
        { name: 'hostname', type: 'VARCHAR(100)' },
      ];

      for (const col of columns) {
        try {
          await query(`
            ALTER TABLE ativos ADD COLUMN IF NOT EXISTS ${col.name} ${col.type};
          `);
        } catch (e) {
          // Ignora erros se a coluna já existir
        }
      }
    };

    await migrateAtivos();

    // Migração: Adicionar novas colunas à tabela maquinas_rede se não existirem
    const migrateMaquinas = async () => {
      const columns = [
        { name: 'setor_texto', type: 'VARCHAR(255)' },
        { name: 'usuario_texto', type: 'VARCHAR(255)' },
      ];

      for (const col of columns) {
        try {
          await query(`
            ALTER TABLE maquinas_rede ADD COLUMN IF NOT EXISTS ${col.name} ${col.type};
          `);
        } catch (e) {
          // Ignora erros se a coluna já existir
        }
      }
    };

    await migrateMaquinas();

    await query(`
      CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario ON notificacoes(usuario_id, lida);
      CREATE INDEX IF NOT EXISTS idx_permissoes_usuario ON permissoes_usuario(usuario_id, modulo);
      CREATE INDEX IF NOT EXISTS idx_logs_auditoria_usuario ON logs_auditoria(usuario_id, criado_em);
      CREATE INDEX IF NOT EXISTS idx_anexos_ticket ON anexos_ticket(ticket_id);
      
      CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
      CREATE INDEX IF NOT EXISTS idx_tickets_prioridade ON tickets(prioridade);
      CREATE INDEX IF NOT EXISTS idx_tickets_criado_em ON tickets(criado_em DESC);
      CREATE INDEX IF NOT EXISTS idx_tickets_setor ON tickets(setor_id);
      CREATE INDEX IF NOT EXISTS idx_setor_tecnicos_setor ON setor_tecnicos(setor_id);
      CREATE INDEX IF NOT EXISTS idx_setor_tecnicos_tecnico ON setor_tecnicos(tecnico_id);
      CREATE INDEX IF NOT EXISTS idx_ativos_tipo ON ativos(tipo);
      CREATE INDEX IF NOT EXISTS idx_ativos_status ON ativos(status);
      CREATE INDEX IF NOT EXISTS idx_projetos_status ON projetos(status);
      CREATE INDEX IF NOT EXISTS idx_projetos_criado_em ON projetos(criado_em DESC);
      CREATE INDEX IF NOT EXISTS idx_licencas_expiracao ON licencas(data_expiracao, status);
      
      CREATE INDEX IF NOT EXISTS idx_ativos_categoria ON ativos(categoria_id);
      CREATE INDEX IF NOT EXISTS idx_ativos_localizacao ON ativos(localizacao_id);
      CREATE INDEX IF NOT EXISTS idx_ativos_fornecedor ON ativos(fornecedor_id);
      CREATE INDEX IF NOT EXISTS idx_ativos_garantia ON ativos(data_garantia);
      CREATE INDEX IF NOT EXISTS idx_ativos_patrimonio ON ativos(patrimonio);
      CREATE INDEX IF NOT EXISTS idx_componentes_ativo ON componentes_ativo(ativo_id);
      CREATE INDEX IF NOT EXISTS idx_itens_estoque_categoria ON itens_estoque(categoria);
      CREATE INDEX IF NOT EXISTS idx_movimentacoes_item ON movimentacoes_estoque(item_id);
      CREATE INDEX IF NOT EXISTS idx_movimentacoes_data ON movimentacoes_estoque(criado_em DESC);
      CREATE INDEX IF NOT EXISTS idx_atribuicoes_ativo ON atribuicoes_ativo(ativo_id);
      CREATE INDEX IF NOT EXISTS idx_atribuicoes_usuario ON atribuicoes_ativo(usuario_id);
      CREATE INDEX IF NOT EXISTS idx_termos_usuario ON termos_responsabilidade(usuario_id);
      CREATE INDEX IF NOT EXISTS idx_termos_status ON termos_responsabilidade(status);
      CREATE INDEX IF NOT EXISTS idx_enderecos_ip_subnet ON enderecos_ip(subnet_id);
      CREATE INDEX IF NOT EXISTS idx_enderecos_ip_ativo ON enderecos_ip(ativo_id);
      CREATE INDEX IF NOT EXISTS idx_portas_switch_ativo ON portas_switch(ativo_id);
      CREATE INDEX IF NOT EXISTS idx_instalacoes_licenca ON instalacoes_software(licenca_id);
      CREATE INDEX IF NOT EXISTS idx_instalacoes_ativo ON instalacoes_software(ativo_id);
      CREATE INDEX IF NOT EXISTS idx_localizacoes_parent ON localizacoes(parent_id);
    `);

    console.log('✅ Banco de dados inicializado com sucesso!');
    
    const { seedAdmin } = await import('./seed.js');
    await seedAdmin();
    
    const { seedSLA } = await import('./seed-sla.js');
    await seedSLA();
    
    const { seedSetores } = await import('./seed-setores.js');
    await seedSetores();
    
    const { seedExampleData } = await import('./seed-data.js');
    await seedExampleData();
    
    const { seedInventario } = await import('./seed-inventario.js');
    await seedInventario();
    
    const { seedLicenca } = await import('./seed-licenca.js');
    await seedLicenca();
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
    throw error;
  }
};
