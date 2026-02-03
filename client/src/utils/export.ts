import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    alert('Não há dados para exportar')
    return
  }

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        if (value === null || value === undefined) return ''
        const stringValue = String(value).replace(/"/g, '""')
        return `"${stringValue}"`
      }).join(',')
    )
  ].join('\n')

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

export const exportToExcel = (data: any[], filename: string, sheetName = 'Dados') => {
  if (!data || data.length === 0) {
    alert('Não há dados para exportar')
    return
  }

  // Formatar headers
  const headers = Object.keys(data[0])
  const formattedHeaders = headers.map(h => 
    h.replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  )

  // Formatar dados como array de arrays
  const formattedDataRows = data.map(row => {
    return headers.map(header => {
      const value = row[header]
      
      if (value === null || value === undefined) {
        return '-'
      } else if (typeof value === 'boolean') {
        return value ? 'Sim' : 'Não'
      } else if (header.toLowerCase().includes('data') && value) {
        const parsedDate = Date.parse(value)
        if (!isNaN(parsedDate)) {
          return new Date(value).toLocaleDateString('pt-BR')
        } else {
          return value
        }
      } else if (typeof value === 'number' && header.toLowerCase().includes('valor')) {
        return `R$ ${value.toFixed(2)}`
      } else {
        return value
      }
    })
  })

  // Construir worksheet do zero com todas as linhas
  const allRows = [
    ['HOSPITAL MED CENTER'],
    ['Sistema de Gestão de T.I.'],
    [sheetName],
    [`Gerado em: ${new Date().toLocaleString('pt-BR')}`],
    [`Total de registros: ${data.length}`],
    [], // Linha em branco
    formattedHeaders, // Headers
    ...formattedDataRows // Dados
  ]

  // Criar worksheet a partir do array de arrays
  const worksheet = XLSX.utils.aoa_to_sheet(allRows)

  // Calcular larguras de colunas otimizadas
  const colWidths = formattedHeaders.map((header, index) => {
    const headerKey = headers[index]
    const maxDataLength = Math.max(
      ...formattedDataRows.map(row => String(row[index] || '').length),
      header.length
    )
    
    // Larguras específicas por tipo de coluna
    if (headerKey.toLowerCase().includes('id') && headerKey.length < 5) {
      return { wch: 8 }
    } else if (headerKey.toLowerCase().includes('data')) {
      return { wch: 12 }
    } else if (headerKey.toLowerCase().includes('descricao') || headerKey.toLowerCase().includes('observ')) {
      return { wch: Math.min(maxDataLength + 2, 50) }
    } else if (headerKey.toLowerCase().includes('valor')) {
      return { wch: 15 }
    } else {
      return { wch: Math.min(maxDataLength + 2, 30) }
    }
  })
  worksheet['!cols'] = colWidths

  // Configurar filtros automáticos (range.e.r é zero-based, precisa +1 para row number)
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
  worksheet['!autofilter'] = { ref: `A7:${XLSX.utils.encode_col(formattedHeaders.length - 1)}${range.e.r + 1}` }

  // Congelar primeira linha (headers)
  worksheet['!freeze'] = { xSplit: 0, ySplit: 7, topLeft: 'A8', activePane: 'bottomLeft' }

  // Aplicar estilos aos headers e células - Cores do Hospital Med Center (Azul Ciano)
  const headerStyle = {
    font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
    fill: { fgColor: { rgb: '00A8E1' } }, // Azul ciano do Hospital Med Center
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top: { style: 'medium', color: { rgb: '0088B8' } },
      bottom: { style: 'medium', color: { rgb: '0088B8' } },
      left: { style: 'thin', color: { rgb: '0088B8' } },
      right: { style: 'thin', color: { rgb: '0088B8' } }
    }
  }

  const hospitalTitleStyle = {
    font: { bold: true, sz: 18, color: { rgb: '00A8E1' } },
    alignment: { horizontal: 'left', vertical: 'center' }
  }

  const titleStyle = {
    font: { bold: true, sz: 14, color: { rgb: '1F2937' } },
    alignment: { horizontal: 'left', vertical: 'center' }
  }

  const subtitleStyle = {
    font: { bold: true, sz: 12, color: { rgb: '00A8E1' } },
    alignment: { horizontal: 'left', vertical: 'center' }
  }

  const infoStyle = {
    font: { sz: 10, color: { rgb: '6B7280' } },
    alignment: { horizontal: 'left', vertical: 'center' }
  }

  // Aplicar estilos ao título e informações
  if (worksheet['A1']) worksheet['A1'].s = hospitalTitleStyle
  if (worksheet['A2']) worksheet['A2'].s = titleStyle
  if (worksheet['A3']) worksheet['A3'].s = subtitleStyle
  if (worksheet['A4']) worksheet['A4'].s = infoStyle
  if (worksheet['A5']) worksheet['A5'].s = infoStyle

  // Aplicar estilos aos headers
  formattedHeaders.forEach((_, index) => {
    const cellAddress = XLSX.utils.encode_cell({ r: 6, c: index })
    if (!worksheet[cellAddress]) worksheet[cellAddress] = { t: 's', v: formattedHeaders[index] }
    worksheet[cellAddress].s = headerStyle
  })

  // Aplicar estilos às células de dados (zebra striping com cores do Hospital)
  formattedDataRows.forEach((_row: any[], rowIndex: number) => {
    const isEvenRow = rowIndex % 2 === 0

    headers.forEach((header: string, colIndex: number) => {
      const cellAddress = XLSX.utils.encode_cell({ r: rowIndex + 7, c: colIndex })
      if (!worksheet[cellAddress]) return

      // Determinar alinhamento por tipo
      let horizontalAlign: 'center' | 'left' | 'right' = 'left'
      if (header.toLowerCase().includes('id') && header.length < 5) {
        horizontalAlign = 'center'
      } else if (header.toLowerCase().includes('valor')) {
        horizontalAlign = 'right'
      } else if (header.toLowerCase().includes('data') || header.toLowerCase().includes('status') || header.toLowerCase().includes('prioridade')) {
        horizontalAlign = 'center'
      }

      const cellStyle = {
        fill: { fgColor: { rgb: isEvenRow ? 'FFFFFF' : 'E6F7FC' } }, // Azul claro alternado
        border: {
          top: { style: 'thin', color: { rgb: 'C5E9F5' } },
          bottom: { style: 'thin', color: { rgb: 'C5E9F5' } },
          left: { style: 'thin', color: { rgb: 'C5E9F5' } },
          right: { style: 'thin', color: { rgb: 'C5E9F5' } }
        },
        alignment: { horizontal: horizontalAlign, vertical: 'center' },
        font: { sz: 10 }
      }

      worksheet[cellAddress].s = cellStyle
    })
  })

  // Criar workbook
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

  // Exportar
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}

export const exportToPDF = (data: any[], filename: string, title: string, columns?: string[]) => {
  if (!data || data.length === 0) {
    alert('Não há dados para exportar')
    return
  }

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  
  // Header profissional com fundo colorido
  doc.setFillColor(31, 41, 55) // Cinza escuro
  doc.rect(0, 0, pageWidth, 35, 'F')
  
  // Título principal em branco
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(title, 14, 18)
  
  // Subtítulo com data
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const dataAtual = new Date().toLocaleString('pt-BR', { 
    dateStyle: 'long', 
    timeStyle: 'short' 
  })
  doc.text(`Gerado em: ${dataAtual}`, 14, 27)
  
  // Linha decorativa
  doc.setDrawColor(59, 130, 246) // Azul
  doc.setLineWidth(2)
  doc.line(14, 32, pageWidth - 14, 32)
  
  // Resumo executivo
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Resumo Executivo', 14, 45)
  
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Total de registros: ${data.length}`, 14, 52)
  
  // Preparar headers formatados
  const headers = columns || Object.keys(data[0])
  const formattedHeaders = headers.map(h => 
    h.replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  )
  
  const tableData = data.map(row => 
    headers.map(header => {
      const value = row[header]
      if (value === null || value === undefined) return '-'
      if (typeof value === 'boolean') return value ? 'Sim' : 'Não'
      if (typeof value === 'number' && header.toLowerCase().includes('valor')) {
        return `R$ ${value.toFixed(2)}`
      }
      if (header.toLowerCase().includes('data') && value) {
        const parsedDate = Date.parse(value)
        if (!isNaN(parsedDate)) {
          return new Date(value).toLocaleDateString('pt-BR')
        }
      }
      return String(value)
    })
  )

  // Tabela com estilo profissional
  autoTable(doc, {
    head: [formattedHeaders],
    body: tableData,
    startY: 60,
    theme: 'grid',
    styles: { 
      fontSize: 8,
      cellPadding: 2,
      lineColor: [220, 220, 220],
      lineWidth: 0.1,
      font: 'helvetica',
      overflow: 'linebreak',
      cellWidth: 'auto',
      minCellWidth: 15
    },
    headStyles: { 
      fillColor: [31, 41, 55],
      textColor: 255,
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle'
    },
    alternateRowStyles: { 
      fillColor: [249, 250, 251]
    },
    columnStyles: headers.reduce((acc: any, header: string, index: number) => {
      if (header.toLowerCase().includes('id') && header.length < 5) {
        acc[index] = { cellWidth: 10, halign: 'center' }
      } else if (header.toLowerCase().includes('valor')) {
        acc[index] = { cellWidth: 20, halign: 'right' }
      } else if (header.toLowerCase().includes('data')) {
        acc[index] = { cellWidth: 25, halign: 'center' }
      } else if (header.toLowerCase().includes('status') || header.toLowerCase().includes('prioridade')) {
        acc[index] = { cellWidth: 20, halign: 'center' }
      } else if (header.toLowerCase().includes('titulo') || header.toLowerCase().includes('descricao')) {
        acc[index] = { cellWidth: 'auto', halign: 'left' }
      } else {
        acc[index] = { cellWidth: 'auto', halign: 'left' }
      }
      return acc
    }, {}),
    margin: { top: 60, bottom: 20, left: 10, right: 10 },
    tableWidth: 'auto',
    didDrawPage: (data: any) => {
      // Footer com número de página
      doc.setFontSize(8)
      doc.setTextColor(100)
      doc.setFont('helvetica', 'normal')
      
      const footerText = `Sistema de Gestão de T.I. | Página ${data.pageNumber}`
      const footerWidth = doc.getTextWidth(footerText)
      doc.text(footerText, (pageWidth - footerWidth) / 2, pageHeight - 10)
      
      // Linha no footer
      doc.setDrawColor(220, 220, 220)
      doc.setLineWidth(0.5)
      doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15)
    }
  })

  doc.save(`${filename}.pdf`)
}

export const formatDataForExport = (data: any[], formatRules?: { [key: string]: (value: any) => string }) => {
  if (!formatRules) return data

  return data.map(row => {
    const formattedRow: any = {}
    for (const key in row) {
      formattedRow[key] = formatRules[key] ? formatRules[key](row[key]) : row[key]
    }
    return formattedRow
  })
}

export const exportOptions = [
  { value: 'csv', label: 'Exportar CSV', icon: '📄' },
  { value: 'excel', label: 'Exportar Excel', icon: '📊' },
  { value: 'pdf', label: 'Exportar PDF', icon: '📑' }
]
