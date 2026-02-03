import { query } from './database.js';

export const seedInventario = async () => {
  try {
    const categoriasExistentes = await query('SELECT COUNT(*) FROM categorias_ativos');
    const categoriasJaExistem = parseInt(categoriasExistentes.rows[0].count) > 0;
    
    if (!categoriasJaExistem) {
      console.log('📦 Criando categorias de ativos...');

      const categorias = [
        { nome: 'Notebook', tipo: 'hardware', descricao: 'Notebooks e laptops', icone: 'Laptop' },
        { nome: 'Desktop', tipo: 'hardware', descricao: 'Computadores de mesa', icone: 'Monitor' },
        { nome: 'Monitor', tipo: 'hardware', descricao: 'Monitores e displays', icone: 'Monitor' },
        { nome: 'Impressora', tipo: 'hardware', descricao: 'Impressoras e multifuncionais', icone: 'Printer' },
        { nome: 'Celular', tipo: 'hardware', descricao: 'Celulares corporativos', icone: 'Smartphone' },
        { nome: 'Tablet', tipo: 'hardware', descricao: 'Tablets corporativos', icone: 'Tablet' },
        { nome: 'Servidor', tipo: 'hardware', descricao: 'Servidores físicos', icone: 'Server' },
        { nome: 'Switch', tipo: 'rede', descricao: 'Switches de rede', icone: 'Network' },
        { nome: 'Roteador', tipo: 'rede', descricao: 'Roteadores', icone: 'Router' },
        { nome: 'Firewall', tipo: 'rede', descricao: 'Firewalls e appliances de segurança', icone: 'Shield' },
        { nome: 'Access Point', tipo: 'rede', descricao: 'Pontos de acesso wireless', icone: 'Wifi' },
        { nome: 'Rack', tipo: 'infraestrutura', descricao: 'Racks e gabinetes', icone: 'Server' },
        { nome: 'Patch Panel', tipo: 'infraestrutura', descricao: 'Patch panels', icone: 'Cable' },
        { nome: 'Nobreak', tipo: 'infraestrutura', descricao: 'Nobreaks e UPS', icone: 'Battery' },
        { nome: 'Estabilizador', tipo: 'infraestrutura', descricao: 'Estabilizadores de tensão', icone: 'Zap' },
        { nome: 'Memória RAM', tipo: 'componente', descricao: 'Módulos de memória RAM', icone: 'Cpu' },
        { nome: 'SSD', tipo: 'componente', descricao: 'Unidades SSD', icone: 'HardDrive' },
        { nome: 'HD', tipo: 'componente', descricao: 'Discos rígidos', icone: 'HardDrive' },
        { nome: 'Placa de Vídeo', tipo: 'componente', descricao: 'Placas de vídeo', icone: 'Cpu' },
        { nome: 'Placa de Rede', tipo: 'componente', descricao: 'Placas de rede', icone: 'Network' },
        { nome: 'Fonte', tipo: 'componente', descricao: 'Fontes de alimentação', icone: 'Zap' },
        { nome: 'Teclado', tipo: 'periferico', descricao: 'Teclados', icone: 'Keyboard' },
        { nome: 'Mouse', tipo: 'periferico', descricao: 'Mouses', icone: 'Mouse' },
        { nome: 'Headset', tipo: 'periferico', descricao: 'Headsets e fones', icone: 'Headphones' },
        { nome: 'Webcam', tipo: 'periferico', descricao: 'Webcams', icone: 'Camera' },
        { nome: 'Cabo de Rede', tipo: 'acessorio', descricao: 'Cabos de rede (patch cords)', icone: 'Cable' },
        { nome: 'Cabo HDMI', tipo: 'acessorio', descricao: 'Cabos HDMI', icone: 'Cable' },
        { nome: 'Adaptador', tipo: 'acessorio', descricao: 'Adaptadores diversos', icone: 'Plug' },
        { nome: 'Carregador', tipo: 'acessorio', descricao: 'Carregadores e fontes externas', icone: 'Battery' },
      ];

      for (const cat of categorias) {
        await query(
          'INSERT INTO categorias_ativos (nome, tipo, descricao, icone) VALUES ($1, $2, $3, $4)',
          [cat.nome, cat.tipo, cat.descricao, cat.icone]
        );
      }

      console.log('✅ Categorias de ativos criadas com sucesso!');
    } else {
      console.log('ℹ️  Categorias de ativos já existem');
    }

    const localizacoesExistentes = await query('SELECT COUNT(*) FROM localizacoes');
    let localizacaoId = null;
    
    if (parseInt(localizacoesExistentes.rows[0].count) === 0) {
      console.log('📦 Criando localizações padrão...');

      const matriz = await query(
        'INSERT INTO localizacoes (nome, tipo, endereco) VALUES ($1, $2, $3) RETURNING id',
        ['Matriz', 'filial', 'Endereço da Matriz']
      );
      const matrizId = matriz.rows[0].id;

      const terreo = await query(
        'INSERT INTO localizacoes (nome, tipo, parent_id) VALUES ($1, $2, $3) RETURNING id',
        ['Térreo', 'andar', matrizId]
      );

      const primeiroAndar = await query(
        'INSERT INTO localizacoes (nome, tipo, parent_id) VALUES ($1, $2, $3) RETURNING id',
        ['1º Andar', 'andar', matrizId]
      );

      await query(
        'INSERT INTO localizacoes (nome, tipo, parent_id) VALUES ($1, $2, $3)',
        ['Recepção', 'sala', terreo.rows[0].id]
      );
      
      const cpd = await query(
        'INSERT INTO localizacoes (nome, tipo, parent_id) VALUES ($1, $2, $3) RETURNING id',
        ['CPD', 'sala', terreo.rows[0].id]
      );
      localizacaoId = cpd.rows[0].id;
      
      await query(
        'INSERT INTO localizacoes (nome, tipo, parent_id) VALUES ($1, $2, $3)',
        ['Sala de Reuniões', 'sala', primeiroAndar.rows[0].id]
      );
      await query(
        'INSERT INTO localizacoes (nome, tipo, parent_id) VALUES ($1, $2, $3)',
        ['Escritório TI', 'sala', primeiroAndar.rows[0].id]
      );

      console.log('✅ Localizações padrão criadas com sucesso!');
    } else {
      const loc = await query('SELECT id FROM localizacoes LIMIT 1');
      if (loc.rows.length > 0) {
        localizacaoId = loc.rows[0].id;
      }
    }

    const fornecedoresExistentes = await query('SELECT COUNT(*) FROM fornecedores');
    if (parseInt(fornecedoresExistentes.rows[0].count) === 0) {
      console.log('📦 Criando fornecedores de exemplo...');

      const fornecedores = [
        { nome: 'TechSupply Informática', cnpj: '12.345.678/0001-90', contato: 'João Silva', telefone: '(11) 3456-7890', email: 'vendas@techsupply.com.br', endereco: 'Rua da Tecnologia, 100 - São Paulo/SP' },
        { nome: 'Dell Brasil', cnpj: '72.381.189/0001-10', contato: 'Departamento Comercial', telefone: '0800-970-3355', email: 'comercial@dell.com.br', endereco: 'Av. Industrial, 500 - Eldorado do Sul/RS' },
        { nome: 'Kalunga', cnpj: '43.283.811/0001-50', contato: 'Central de Atendimento', telefone: '(11) 3346-9999', email: 'empresas@kalunga.com.br', endereco: 'Rua do Comércio, 200 - São Paulo/SP' },
        { nome: 'HP Brasil', cnpj: '61.797.924/0001-55', contato: 'Vendas Corporativas', telefone: '0800-709-7751', email: 'vendas@hp.com.br', endereco: 'Av. Nações Unidas, 12901 - São Paulo/SP' },
        { nome: 'NetworkPro Soluções', cnpj: '33.456.789/0001-22', contato: 'Maria Santos', telefone: '(21) 2345-6789', email: 'contato@networkpro.com.br', endereco: 'Rua das Redes, 50 - Rio de Janeiro/RJ' },
      ];

      for (const forn of fornecedores) {
        await query(
          'INSERT INTO fornecedores (nome, cnpj, contato, telefone, email, endereco) VALUES ($1, $2, $3, $4, $5, $6)',
          [forn.nome, forn.cnpj, forn.contato, forn.telefone, forn.email, forn.endereco]
        );
      }

      console.log('✅ Fornecedores criados com sucesso!');
    } else {
      console.log('ℹ️  Fornecedores já existem');
    }

    const itensEstoqueExistentes = await query('SELECT COUNT(*) FROM itens_estoque');
    if (parseInt(itensEstoqueExistentes.rows[0].count) === 0) {
      console.log('📦 Criando itens de estoque de exemplo...');

      const itensEstoque = [
        { categoria: 'componente', nome: 'Memória RAM DDR4 8GB', marca: 'Kingston', modelo: 'KVR26N19S8/8', unidade: 'unidade', quantidade_atual: 25, quantidade_minima: 10, valor_unitario: 189.90 },
        { categoria: 'componente', nome: 'Memória RAM DDR4 16GB', marca: 'Kingston', modelo: 'KVR26N19D8/16', unidade: 'unidade', quantidade_atual: 15, quantidade_minima: 5, valor_unitario: 329.90 },
        { categoria: 'componente', nome: 'SSD 480GB SATA', marca: 'Kingston', modelo: 'SA400S37/480G', unidade: 'unidade', quantidade_atual: 20, quantidade_minima: 8, valor_unitario: 249.90 },
        { categoria: 'componente', nome: 'SSD 240GB SATA', marca: 'Kingston', modelo: 'SA400S37/240G', unidade: 'unidade', quantidade_atual: 30, quantidade_minima: 10, valor_unitario: 149.90 },
        { categoria: 'componente', nome: 'HD 1TB SATA', marca: 'Seagate', modelo: 'ST1000DM010', unidade: 'unidade', quantidade_atual: 12, quantidade_minima: 5, valor_unitario: 279.90 },
        { categoria: 'periferico', nome: 'Teclado USB', marca: 'Logitech', modelo: 'K120', unidade: 'unidade', quantidade_atual: 50, quantidade_minima: 20, valor_unitario: 69.90 },
        { categoria: 'periferico', nome: 'Mouse USB', marca: 'Logitech', modelo: 'M90', unidade: 'unidade', quantidade_atual: 45, quantidade_minima: 20, valor_unitario: 39.90 },
        { categoria: 'periferico', nome: 'Headset USB', marca: 'Logitech', modelo: 'H390', unidade: 'unidade', quantidade_atual: 8, quantidade_minima: 10, valor_unitario: 189.90 },
        { categoria: 'periferico', nome: 'Webcam HD', marca: 'Logitech', modelo: 'C920', unidade: 'unidade', quantidade_atual: 5, quantidade_minima: 5, valor_unitario: 399.90 },
        { categoria: 'acessorio', nome: 'Cabo de Rede Cat6 1.5m', marca: 'Furukawa', modelo: 'Cat6 UTP', unidade: 'unidade', quantidade_atual: 100, quantidade_minima: 50, valor_unitario: 12.90 },
        { categoria: 'acessorio', nome: 'Cabo de Rede Cat6 3m', marca: 'Furukawa', modelo: 'Cat6 UTP', unidade: 'unidade', quantidade_atual: 80, quantidade_minima: 40, valor_unitario: 18.90 },
        { categoria: 'acessorio', nome: 'Cabo HDMI 2m', marca: 'PIX', modelo: 'HDMI 2.0', unidade: 'unidade', quantidade_atual: 25, quantidade_minima: 15, valor_unitario: 29.90 },
        { categoria: 'acessorio', nome: 'Adaptador USB-C para HDMI', marca: 'Dell', modelo: 'DA310', unidade: 'unidade', quantidade_atual: 3, quantidade_minima: 5, valor_unitario: 299.90 },
        { categoria: 'acessorio', nome: 'Carregador Universal Notebook', marca: 'Multilaser', modelo: 'CB082', unidade: 'unidade', quantidade_atual: 10, quantidade_minima: 5, valor_unitario: 149.90 },
        { categoria: 'infraestrutura', nome: 'Patch Cord Cat6 1m', marca: 'Furukawa', modelo: 'Cat6 UTP', unidade: 'unidade', quantidade_atual: 150, quantidade_minima: 100, valor_unitario: 8.90 },
      ];

      const itensInseridos = [];
      for (const item of itensEstoque) {
        const result = await query(
          `INSERT INTO itens_estoque (categoria, nome, marca, modelo, unidade, quantidade_atual, quantidade_minima, localizacao_id, valor_unitario) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
          [item.categoria, item.nome, item.marca, item.modelo, item.unidade, item.quantidade_atual, item.quantidade_minima, localizacaoId, item.valor_unitario]
        );
        itensInseridos.push({ id: result.rows[0].id, nome: item.nome });
      }

      console.log('✅ Itens de estoque criados com sucesso!');

      console.log('📦 Criando movimentações de estoque de exemplo...');

      const admin = await query('SELECT id FROM usuarios WHERE email = $1', ['admin@itmanager.com']);
      const adminId = admin.rows.length > 0 ? admin.rows[0].id : null;

      const movimentacoes = [
        { item_index: 0, tipo: 'entrada', quantidade: 30, motivo: 'Compra inicial', documento: 'NF-001234' },
        { item_index: 0, tipo: 'saida', quantidade: 5, motivo: 'Upgrade de equipamentos', documento: 'REQ-0001' },
        { item_index: 2, tipo: 'entrada', quantidade: 25, motivo: 'Compra inicial', documento: 'NF-001235' },
        { item_index: 2, tipo: 'saida', quantidade: 5, motivo: 'Substituição de HD danificado', documento: 'REQ-0002' },
        { item_index: 5, tipo: 'entrada', quantidade: 60, motivo: 'Reposição de estoque', documento: 'NF-001240' },
        { item_index: 5, tipo: 'saida', quantidade: 10, motivo: 'Distribuição para novos funcionários', documento: 'REQ-0005' },
        { item_index: 6, tipo: 'entrada', quantidade: 50, motivo: 'Reposição de estoque', documento: 'NF-001241' },
        { item_index: 6, tipo: 'saida', quantidade: 5, motivo: 'Substituição por defeito', documento: 'REQ-0006' },
        { item_index: 7, tipo: 'entrada', quantidade: 15, motivo: 'Compra para home office', documento: 'NF-001250' },
        { item_index: 7, tipo: 'saida', quantidade: 7, motivo: 'Distribuição home office', documento: 'REQ-0010' },
        { item_index: 9, tipo: 'entrada', quantidade: 150, motivo: 'Compra em lote', documento: 'NF-001260' },
        { item_index: 9, tipo: 'saida', quantidade: 50, motivo: 'Infraestrutura novo andar', documento: 'REQ-0015' },
        { item_index: 12, tipo: 'entrada', quantidade: 10, motivo: 'Compra para sala de reuniões', documento: 'NF-001270' },
        { item_index: 12, tipo: 'saida', quantidade: 7, motivo: 'Instalação salas de reunião', documento: 'REQ-0020' },
      ];

      for (const mov of movimentacoes) {
        if (itensInseridos[mov.item_index]) {
          await query(
            `INSERT INTO movimentacoes_estoque (item_id, tipo, quantidade, motivo, documento, usuario_id) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [itensInseridos[mov.item_index].id, mov.tipo, mov.quantidade, mov.motivo, mov.documento, adminId]
          );
        }
      }

      console.log('✅ Movimentações de estoque criadas com sucesso!');
    } else {
      console.log('ℹ️  Itens de estoque já existem');
    }

  } catch (error) {
    console.error('❌ Erro ao criar dados de inventário:', error);
  }
};
