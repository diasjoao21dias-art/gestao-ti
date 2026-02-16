import { useState } from 'react';
import { FileText, Download, Calendar, Filter, Package, MapPin, Truck, Shield, Box, BarChart3, Wrench } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const tiposRelatorio = [
  { value: 'tickets', label: 'Tickets', icon: FileText, group: 'Geral' },
  { value: 'ativos', label: 'Ativos (Básico)', icon: Package, group: 'Geral' },
  { value: 'projetos', label: 'Projetos', icon: BarChart3, group: 'Geral' },
  { value: 'licencas-vencimento', label: 'Licenças Próximas do Vencimento', icon: FileText, group: 'Geral' },
  { value: 'estatisticas', label: 'Estatísticas Gerais', icon: BarChart3, group: 'Geral' },
  { value: 'maquinas', label: 'Máquinas de Rede', icon: Package, group: 'Rede' },
  { value: 'maquinas-manutencao', label: 'Manutenções de Máquinas', icon: Wrench, group: 'Rede' },
  { value: 'rede-vlans', label: 'VLANs', icon: Package, group: 'Rede' },
  { value: 'rede-subnets', label: 'Subnets', icon: Package, group: 'Rede' },
  { value: 'rede-ips', label: 'Endereços IP', icon: Package, group: 'Rede' },
  { value: 'rede-equipamentos', label: 'Equipamentos de Rede', icon: Package, group: 'Rede' },
  { value: 'inventario-ativos-completo', label: 'Ativos Completo', icon: Package, group: 'Inventário' },
  { value: 'inventario-estoque', label: 'Estoque de Componentes', icon: Box, group: 'Inventário' },
  { value: 'inventario-movimentacoes', label: 'Movimentações de Estoque', icon: Box, group: 'Inventário' },
  { value: 'inventario-localizacoes', label: 'Localizações', icon: MapPin, group: 'Inventário' },
  { value: 'inventario-fornecedores', label: 'Fornecedores', icon: Truck, group: 'Inventário' },
  { value: 'inventario-garantias', label: 'Garantias de Ativos', icon: Shield, group: 'Inventário' },
  { value: 'inventario-categorias', label: 'Categorias de Ativos', icon: Package, group: 'Inventário' },
];

export default function Relatorios() {
  const [tipoRelatorio, setTipoRelatorio] = useState('tickets');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [dados, setDados] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtroExtra, setFiltroExtra] = useState('');
  const [erro, setErro] = useState('');
  const [gerado, setGerado] = useState(false);

  const gerarRelatorio = async () => {
    setLoading(true);
    setErro('');
    setGerado(false);
    try {
      const params = new URLSearchParams();
      if (dataInicio) params.append('data_inicio', dataInicio);
      if (dataFim) params.append('data_fim', dataFim);
      
      if (tipoRelatorio === 'inventario-estoque' && filtroExtra) {
        params.append('abaixo_minimo', filtroExtra);
      }
      if (tipoRelatorio === 'inventario-garantias' && filtroExtra) {
        params.append('status_garantia', filtroExtra);
      }
      if (tipoRelatorio === 'inventario-movimentacoes' && filtroExtra) {
        params.append('tipo', filtroExtra);
      }
      if (tipoRelatorio === 'rede-ips' && filtroExtra) {
        params.append('status', filtroExtra);
      }
      if (tipoRelatorio === 'rede-equipamentos' && filtroExtra) {
        params.append('tipo', filtroExtra);
      }

      if (tipoRelatorio === 'maquinas-manutencao' && filtroExtra) {
        params.append('tipo', filtroExtra);
      }
      
      console.log('Gerando relatório:', tipoRelatorio, 'Params:', params.toString());

      const response = await fetch(`/api/relatorios/${tipoRelatorio}?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erro na resposta:', errorData);
        throw new Error(errorData.error || `Erro ${response.status}: Falha ao gerar relatório`);
      }
      
      const data = await response.json();
      console.log('Dados recebidos:', data);
      
      const dadosArray = Array.isArray(data) ? data : (data ? [data] : []);
      setDados(dadosArray);
      setGerado(true);
      
      if (dadosArray.length === 0) {
        setErro('Nenhum registro encontrado para os filtros selecionados.');
      }
    } catch (error: any) {
      console.error('Erro ao gerar relatório:', error);
      setErro(error.message || 'Erro ao gerar relatório. Verifique o console para mais detalhes.');
      setDados([]);
      setGerado(true);
    } finally {
      setLoading(false);
    }
  };

  const getTituloRelatorio = () => {
    const tipo = tiposRelatorio.find(t => t.value === tipoRelatorio);
    return tipo ? tipo.label : tipoRelatorio;
  };

  const exportarPDF = () => {
    if (!dados || dados.length === 0) {
      alert('Não há dados para exportar. Gere um relatório primeiro.');
      return;
    }

    try {
      const doc = new jsPDF('landscape');
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      
      doc.setFillColor(31, 41, 55);
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      const titulo = `Relatório: ${getTituloRelatorio()}`;
      doc.text(titulo, 14, 18);
      
      doc.setFontSize(10);
      const periodo = `Período: ${dataInicio ? new Date(dataInicio).toLocaleDateString('pt-BR') : 'Início'} até ${dataFim ? new Date(dataFim).toLocaleDateString('pt-BR') : 'Hoje'}`;
      doc.text(periodo, 14, 27);
      
      const dataGeracao = new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR');
      doc.text(`Gerado em: ${dataGeracao}`, 14, 33);
      
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(2);
      doc.line(14, 37, pageWidth - 14, 37);
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.text('Resumo Executivo', 14, 50);
      
      doc.setFontSize(10);
      doc.text(`Total de registros encontrados: ${dados.length}`, 14, 58);
      
      const colunas = Object.keys(dados[0]);
      const colunasFormatadas = colunas.map(col => 
        col.replace(/_/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      );
      
      const linhas = dados.map(item => 
        colunas.map(col => {
          const value = item[col];
          if (value === null || value === undefined) return '-';
          if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
          if (typeof value === 'number' && (col.toLowerCase().includes('valor') || col.toLowerCase().includes('total'))) {
            return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          }
          
          // Melhor detecção de colunas de data
          const isDateColumn = col.toLowerCase().includes('data') || 
                              col.toLowerCase().includes('criado_em') || 
                              col.toLowerCase().includes('proxima_manutencao') ||
                              col.toLowerCase().includes('vencimento') ||
                              col.toLowerCase().includes('expiracao') ||
                              col.toLowerCase().includes('aquisicao') ||
                              col.toLowerCase().includes('garantia');

          if (isDateColumn && value && value !== '-') {
            try {
              // Limpa a string da data para evitar problemas de fuso horário
              // Se vier no formato ISO (2026-08-16T00:00:00.000Z), pegamos apenas a parte da data
              const dateStr = typeof value === 'string' && value.includes('T') ? value.split('T')[0] : value;
              
              // Divide a string por hífen ou barra para pegar os componentes numéricos
              const parts = dateStr.split(/[-/]/);
              if (parts.length === 3) {
                let y, m, d;
                if (parts[0].length === 4) { // YYYY-MM-DD
                  [y, m, d] = parts.map(Number);
                } else { // DD-MM-YYYY
                  [d, m, y] = parts.map(Number);
                }
                
                const day = String(d).padStart(2, '0');
                const month = String(m).padStart(2, '0');
                return `${day}/${month}/${y}`;
              }
              
              const dateObj = new Date(dateStr);
              if (!isNaN(dateObj.getTime())) {
                const day = String(dateObj.getUTCDate()).padStart(2, '0');
                const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
                const year = dateObj.getUTCFullYear();
                return `${day}/${month}/${year}`;
              }
            } catch (e) {
              console.error('Erro ao formatar data no PDF:', e);
            }
          }
          return String(value);
        })
      );

      autoTable(doc, {
        head: [colunasFormatadas],
        body: linhas,
        startY: 68,
        theme: 'grid',
        styles: { 
          fontSize: 7,
          cellPadding: 2,
          lineColor: [220, 220, 220],
          lineWidth: 0.1,
          overflow: 'linebreak',
          cellWidth: 'auto',
          minCellWidth: 12
        },
        headStyles: { 
          fillColor: [31, 41, 55],
          textColor: 255,
          fontSize: 7,
          fontStyle: 'bold',
          halign: 'center',
          valign: 'middle'
        },
        alternateRowStyles: { 
          fillColor: [249, 250, 251]
        },
        columnStyles: colunas.reduce((acc: any, col: string, index: number) => {
          if (col.toLowerCase().includes('id') && col.length < 5) {
            acc[index] = { cellWidth: 10, halign: 'center' };
          } else {
            const isDateColumn = col.toLowerCase().includes('data') || 
                                col.toLowerCase().includes('criado_em') ||
                                col.toLowerCase().includes('proxima_manutencao') ||
                                col.toLowerCase().includes('vencimento') ||
                                col.toLowerCase().includes('expiracao') ||
                                col.toLowerCase().includes('aquisicao') ||
                                col.toLowerCase().includes('garantia');
            
            if (isDateColumn) {
              acc[index] = { cellWidth: 22, halign: 'center' };
            } else if (col.toLowerCase().includes('status') || col.toLowerCase().includes('prioridade') || col.toLowerCase().includes('tipo')) {
              acc[index] = { cellWidth: 20, halign: 'center' };
            } else if (col.toLowerCase().includes('quantidade')) {
              acc[index] = { cellWidth: 18, halign: 'center' };
            } else {
              acc[index] = { cellWidth: 'auto', halign: 'left' };
            }
          }
          return acc;
        }, {}),
        margin: { top: 68, bottom: 20, left: 10, right: 10 },
        tableWidth: 'auto',
        didDrawPage: (data: any) => {
          doc.setFontSize(8);
          doc.setTextColor(100);
          
          const footerText = `Sistema de Gestão de T.I. | ${titulo} | Página ${data.pageNumber}`;
          const footerWidth = doc.getTextWidth(footerText);
          doc.text(footerText, (pageWidth - footerWidth) / 2, pageHeight - 10);
          
          doc.setDrawColor(220, 220, 220);
          doc.setLineWidth(0.5);
          doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);
        }
      });

      doc.save(`relatorio-${tipoRelatorio}-${Date.now()}.pdf`);
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      alert(`Erro ao exportar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const exportarExcel = async () => {
    if (!dados || dados.length === 0) {
      alert('Não há dados para exportar. Gere um relatório primeiro.');
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Sistema de Gestão de T.I.';
      workbook.created = new Date();
      
      const sheetName = getTituloRelatorio().substring(0, 31);
      const worksheet = workbook.addWorksheet(sheetName, {
        properties: { tabColor: { argb: '2563EB' } },
        views: [{ state: 'frozen', ySplit: 6 }]
      });

      const brandColor = '1F2937';
      const accentColor = '2563EB';
      const lightGray = 'F8FAFC';
      const mediumGray = 'E5E7EB';
      const darkText = '111827';
      const whiteColor = 'FFFFFF';

      const colunas = Object.keys(dados[0]);
      const numColunas = colunas.length;

      worksheet.mergeCells(1, 1, 1, numColunas);
      const titleCell = worksheet.getCell('A1');
      titleCell.value = 'HOSPITAL MED CENTER';
      titleCell.font = { name: 'Calibri', size: 18, bold: true, color: { argb: whiteColor } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: brandColor } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getRow(1).height = 35;

      worksheet.mergeCells(2, 1, 2, numColunas);
      const subtitleCell = worksheet.getCell('A2');
      subtitleCell.value = 'Sistema de Gestão de Tecnologia da Informação';
      subtitleCell.font = { name: 'Calibri', size: 11, italic: true, color: { argb: whiteColor } };
      subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: brandColor } };
      subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getRow(2).height = 22;

      worksheet.mergeCells(3, 1, 3, numColunas);
      const reportTitleCell = worksheet.getCell('A3');
      reportTitleCell.value = `Relatório: ${getTituloRelatorio()}`;
      reportTitleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: whiteColor } };
      reportTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: accentColor } };
      reportTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getRow(3).height = 28;

      worksheet.mergeCells(4, 1, 4, Math.floor(numColunas / 2));
      const periodCell = worksheet.getCell('A4');
      const periodoTexto = `Período: ${dataInicio ? new Date(dataInicio).toLocaleDateString('pt-BR') : 'Início'} até ${dataFim ? new Date(dataFim).toLocaleDateString('pt-BR') : 'Hoje'}`;
      periodCell.value = periodoTexto;
      periodCell.font = { name: 'Calibri', size: 10, color: { argb: darkText } };
      periodCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: lightGray } };
      periodCell.alignment = { horizontal: 'left', vertical: 'middle' };
      periodCell.border = { bottom: { style: 'thin', color: { argb: mediumGray } } };

      if (numColunas > 1) {
        worksheet.mergeCells(4, Math.floor(numColunas / 2) + 1, 4, numColunas);
        const dateCell = worksheet.getCell(4, Math.floor(numColunas / 2) + 1);
        dateCell.value = `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`;
        dateCell.font = { name: 'Calibri', size: 10, color: { argb: darkText } };
        dateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: lightGray } };
        dateCell.alignment = { horizontal: 'right', vertical: 'middle' };
        dateCell.border = { bottom: { style: 'thin', color: { argb: mediumGray } } };
      }
      worksheet.getRow(4).height = 22;

      worksheet.mergeCells(5, 1, 5, numColunas);
      const statsCell = worksheet.getCell('A5');
      statsCell.value = `Total de Registros: ${dados.length}`;
      statsCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: darkText } };
      statsCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: lightGray } };
      statsCell.alignment = { horizontal: 'left', vertical: 'middle' };
      worksheet.getRow(5).height = 22;

      const headerRow = worksheet.getRow(6);
      colunas.forEach((col, index) => {
        const headerLabel = col.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        const cell = headerRow.getCell(index + 1);
        cell.value = headerLabel;
        cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: whiteColor } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: brandColor } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = {
          top: { style: 'thin', color: { argb: brandColor } },
          bottom: { style: 'thin', color: { argb: brandColor } },
          left: { style: 'thin', color: { argb: brandColor } },
          right: { style: 'thin', color: { argb: brandColor } }
        };
      });
      headerRow.height = 28;

      const numericColumns: number[] = [];
      const currencyColumns: number[] = [];

      dados.forEach((item, rowIndex) => {
        const dataRow = worksheet.getRow(rowIndex + 7);
        const isEvenRow = rowIndex % 2 === 0;
        
        colunas.forEach((col, colIndex) => {
          const cell = dataRow.getCell(colIndex + 1);
          let value = item[col];
          
          if (value === null || value === undefined) {
            cell.value = '-';
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          } else if (typeof value === 'boolean') {
            cell.value = value ? 'Sim' : 'Não';
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          } else if (typeof value === 'number') {
            if (col.toLowerCase().includes('valor') || col.toLowerCase().includes('total') || col.toLowerCase().includes('preco')) {
              cell.value = value;
              cell.numFmt = '"R$" #,##0.00';
              cell.alignment = { horizontal: 'right', vertical: 'middle' };
              if (!currencyColumns.includes(colIndex)) currencyColumns.push(colIndex);
            } else if (col.toLowerCase().includes('quantidade') || col.toLowerCase().includes('qtd')) {
              cell.value = value;
              cell.numFmt = '#,##0';
              cell.alignment = { horizontal: 'center', vertical: 'middle' };
              if (!numericColumns.includes(colIndex)) numericColumns.push(colIndex);
            } else {
              cell.value = value;
              cell.alignment = { horizontal: 'center', vertical: 'middle' };
              if (!numericColumns.includes(colIndex)) numericColumns.push(colIndex);
            }
          const isDateColumn = col.toLowerCase().includes('data') || 
                              col.toLowerCase().includes('criado_em') || 
                              col.toLowerCase().includes('atualizado_em') ||
                              col.toLowerCase().includes('proxima_manutencao') ||
                              col.toLowerCase().includes('vencimento') ||
                              col.toLowerCase().includes('expiracao') ||
                              col.toLowerCase().includes('aquisicao') ||
                              col.toLowerCase().includes('garantia');

          if (isDateColumn && value && value !== '-') {
            try {
              const dateStr = typeof value === 'string' && value.includes('T') ? value.split('T')[0] : value;
              
              const parts = dateStr.split(/[-/]/);
              if (parts.length === 3) {
                let y, m, d;
                if (parts[0].length === 4) { // YYYY-MM-DD
                  [y, m, d] = parts.map(Number);
                } else { // DD-MM-YYYY
                  [d, m, y] = parts.map(Number);
                }
                
                // No ExcelJS para o objeto Date, o mês é 0-indexado
                cell.value = new Date(y, m - 1, d);
                cell.numFmt = 'DD/MM/YYYY';
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
              } else {
                const dateObj = new Date(dateStr);
                if (!isNaN(dateObj.getTime())) {
                  cell.value = new Date(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate());
                  cell.numFmt = 'DD/MM/YYYY';
                  cell.alignment = { horizontal: 'center', vertical: 'middle' };
                } else {
                  cell.value = String(value);
                  cell.alignment = { horizontal: 'left', vertical: 'middle' };
                }
              }
            } catch (e) {
              cell.value = String(value);
              cell.alignment = { horizontal: 'left', vertical: 'middle' };
            }
          } else if (col.toLowerCase().includes('status') || col.toLowerCase().includes('situacao') || col.toLowerCase().includes('prioridade')) {
            cell.value = String(value);
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            
            const strValue = String(value).toLowerCase();
            if (strValue.includes('vencid') || strValue.includes('abaixo') || strValue.includes('critico') || strValue.includes('alta')) {
              cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'DC2626' } };
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEE2E2' } };
            } else if (strValue.includes('ok') || strValue.includes('vigente') || strValue.includes('ativo') || strValue.includes('concluido') || strValue.includes('resolvido')) {
              cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: '16A34A' } };
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DCFCE7' } };
            } else if (strValue.includes('pendente') || strValue.includes('andamento') || strValue.includes('media')) {
              cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'D97706' } };
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF3C7' } };
            } else {
              if (!cell.font) cell.font = { name: 'Calibri', size: 10 };
            }
          } else if (col.toLowerCase().includes('id') && col.length < 5) {
            cell.value = value;
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.font = { name: 'Calibri', size: 10, color: { argb: '6B7280' } };
          } else {
            cell.value = typeof value === 'object' ? JSON.stringify(value) : String(value);
            cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
          }

          if (!cell.font) {
            cell.font = { name: 'Calibri', size: 10, color: { argb: darkText } };
          }
          
          if (!cell.fill || (cell.fill as ExcelJS.FillPattern).pattern !== 'solid') {
            cell.fill = { 
              type: 'pattern', 
              pattern: 'solid', 
              fgColor: { argb: isEvenRow ? whiteColor : lightGray } 
            };
          }

          cell.border = {
            top: { style: 'thin', color: { argb: mediumGray } },
            bottom: { style: 'thin', color: { argb: mediumGray } },
            left: { style: 'thin', color: { argb: mediumGray } },
            right: { style: 'thin', color: { argb: mediumGray } }
          };
        });
        dataRow.height = 22;
      });

      const hasSummaryColumns = currencyColumns.length > 0 || numericColumns.length > 0;
      if (hasSummaryColumns && dados.length > 0) {
        const summaryRowNum = dados.length + 7;
        const summaryRow = worksheet.getRow(summaryRowNum);
        
        colunas.forEach((col, colIndex) => {
          const cell = summaryRow.getCell(colIndex + 1);
          
          if (colIndex === 0) {
            cell.value = 'TOTAIS';
            cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: whiteColor } };
          } else if (currencyColumns.includes(colIndex)) {
            const sum = dados.reduce((acc, item) => {
              const val = item[col];
              return acc + (typeof val === 'number' ? val : 0);
            }, 0);
            cell.value = sum;
            cell.numFmt = '"R$" #,##0.00';
            cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: whiteColor } };
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
          } else if (numericColumns.includes(colIndex) && (col.toLowerCase().includes('quantidade') || col.toLowerCase().includes('qtd'))) {
            const sum = dados.reduce((acc, item) => {
              const val = item[col];
              return acc + (typeof val === 'number' ? val : 0);
            }, 0);
            cell.value = sum;
            cell.numFmt = '#,##0';
            cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: whiteColor } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          } else {
            cell.value = '';
          }

          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: accentColor } };
          cell.border = {
            top: { style: 'medium', color: { argb: brandColor } },
            bottom: { style: 'medium', color: { argb: brandColor } },
            left: { style: 'thin', color: { argb: brandColor } },
            right: { style: 'thin', color: { argb: brandColor } }
          };
        });
        summaryRow.height = 26;
      }

      colunas.forEach((col, index) => {
        const colNum = index + 1;
        const headerLabel = col.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        
        let maxLength = headerLabel.length;
        dados.forEach(item => {
          const value = item[col];
          if (value !== null && value !== undefined) {
            const strValue = typeof value === 'number' 
              ? (col.toLowerCase().includes('valor') ? `R$ ${value.toFixed(2)}` : String(value))
              : String(value);
            maxLength = Math.max(maxLength, strValue.length);
          }
        });

        const width = Math.min(Math.max(maxLength + 4, 12), 50);
        worksheet.getColumn(colNum).width = width;
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `relatorio-${tipoRelatorio}-${Date.now()}.xlsx`);
      
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      alert('Erro ao exportar Excel. Verifique o console para mais detalhes.');
    }
  };

  const renderFiltrosExtras = () => {
    if (tipoRelatorio === 'inventario-estoque') {
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Situação do Estoque
          </label>
          <select
            value={filtroExtra}
            onChange={(e) => setFiltroExtra(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="">Todos os itens</option>
            <option value="true">Apenas abaixo do mínimo</option>
          </select>
        </div>
      );
    }

    if (tipoRelatorio === 'rede-ips') {
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status do IP
          </label>
          <select
            value={filtroExtra}
            onChange={(e) => setFiltroExtra(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="">Todos os IPs</option>
            <option value="disponivel">Disponíveis</option>
            <option value="em_uso">Em uso</option>
            <option value="reservado">Reservados</option>
          </select>
        </div>
      );
    }

    if (tipoRelatorio === 'rede-equipamentos') {
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tipo de Equipamento
          </label>
          <select
            value={filtroExtra}
            onChange={(e) => setFiltroExtra(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="">Todos os equipamentos</option>
            <option value="switch">Switches</option>
            <option value="roteador">Roteadores</option>
            <option value="firewall">Firewalls</option>
            <option value="access_point">Access Points</option>
          </select>
        </div>
      );
    }
    
    if (tipoRelatorio === 'inventario-garantias') {
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status da Garantia
          </label>
          <select
            value={filtroExtra}
            onChange={(e) => setFiltroExtra(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="">Todas as garantias</option>
            <option value="vencida">Vencidas</option>
            <option value="vencendo_30">Vencendo em 30 dias</option>
            <option value="vencendo_90">Vencendo em 90 dias</option>
            <option value="vigente">Vigentes</option>
            <option value="sem_garantia">Sem garantia</option>
          </select>
        </div>
      );
    }
    
    if (tipoRelatorio === 'inventario-movimentacoes') {
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Movimentação
          </label>
          <select
            value={filtroExtra}
            onChange={(e) => setFiltroExtra(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todas as movimentações</option>
            <option value="entrada">Entradas</option>
            <option value="saida">Saídas</option>
          </select>
        </div>
      );
    }
    
    return null;
  };

  const gruposRelatorio = ['Geral', 'Rede', 'Inventário'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Relatórios</h1>
          <p className="text-gray-600 dark:text-gray-400">Gere e exporte relatórios personalizados</p>
        </div>
        <FileText className="h-8 w-8 text-blue-600" />
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtros
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de Relatório
            </label>
            <select
              value={tipoRelatorio}
              onChange={(e) => {
                setTipoRelatorio(e.target.value);
                setFiltroExtra('');
                setDados([]);
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              {gruposRelatorio.map(grupo => (
                <optgroup key={grupo} label={`--- ${grupo} ---`}>
                  {tiposRelatorio.filter(t => t.group === grupo).map(tipo => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Data Início
            </label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Data Fim
            </label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        {renderFiltrosExtras() && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {renderFiltrosExtras()}
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button
            onClick={gerarRelatorio}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Gerando...' : 'Gerar Relatório'}
          </button>
        </div>
      </div>

      {erro && gerado && (
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
          <p className="text-yellow-800 dark:text-yellow-200">{erro}</p>
          <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
            Dica: Verifique se existem dados cadastrados para este tipo de relatório. 
            Abra o console do navegador (F12) para ver mais detalhes.
          </p>
        </div>
      )}

      {dados.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Resultados: {getTituloRelatorio()} ({dados.length} registros)
            </h2>
            <div className="flex gap-2">
              <button
                onClick={exportarPDF}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                <Download className="h-4 w-4" />
                Exportar PDF
              </button>
              <button
                onClick={exportarExcel}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <Download className="h-4 w-4" />
                Exportar Excel
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  {Object.keys(dados[0]).map(key => (
                    <th key={key} className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {key.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dados.slice(0, 100).map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    {Object.entries(item).map(([key, value]: [string, any], i) => (
                      <td key={i} className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {value === null || value === undefined ? (
                          <span className="text-gray-400">-</span>
                        ) : typeof value === 'boolean' ? (
                          value ? 'Sim' : 'Não'
                        ) : typeof value === 'number' && (key.toLowerCase().includes('valor') || key.toLowerCase().includes('total')) ? (
                          `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        ) : (key.toLowerCase().includes('data') || key.toLowerCase().includes('criado_em')) && value ? (
                          (() => {
                            const parsedDate = Date.parse(value);
                            return !isNaN(parsedDate) ? new Date(value).toLocaleDateString('pt-BR') : String(value);
                          })()
                        ) : key.toLowerCase().includes('status') || key.toLowerCase().includes('situacao') ? (
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            String(value).toLowerCase().includes('vencid') || String(value).toLowerCase().includes('abaixo') 
                              ? 'bg-red-100 text-red-800' 
                              : String(value).toLowerCase().includes('ok') || String(value).toLowerCase().includes('vigente')
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}>
                            {String(value)}
                          </span>
                        ) : typeof value === 'object' ? (
                          JSON.stringify(value)
                        ) : (
                          String(value)
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {dados.length > 100 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 text-center">
                Exibindo 100 de {dados.length} registros. Exporte para ver todos os dados.
              </p>
            )}
          </div>
        </div>
      )}

      {dados.length === 0 && !loading && (
        <div className="bg-white dark:bg-gray-800 p-12 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-center">
          <Package className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">Nenhum relatório gerado</h3>
          <p className="text-gray-500 dark:text-gray-500 mt-2">Selecione um tipo de relatório e clique em "Gerar Relatório"</p>
        </div>
      )}
    </div>
  );
}
