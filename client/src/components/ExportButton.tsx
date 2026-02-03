import { useState } from 'react'
import { Download, FileText, FileSpreadsheet, File } from 'lucide-react'
import { exportToCSV, exportToExcel, exportToPDF } from '../utils/export'

interface ExportButtonProps {
  data: any[]
  filename: string
  title?: string
  columns?: string[]
  formatRules?: { [key: string]: (value: any) => string }
}

export default function ExportButton({ data, filename, title, columns, formatRules }: ExportButtonProps) {
  const [showMenu, setShowMenu] = useState(false)

  const handleExport = (type: 'csv' | 'excel' | 'pdf') => {
    if (!data || data.length === 0) {
      alert('Não há dados para exportar.')
      setShowMenu(false)
      return
    }

    try {
      let exportData = data
      
      if (formatRules) {
        exportData = data.map(row => {
          const formatted: any = {}
          for (const key in row) {
            formatted[key] = formatRules[key] ? formatRules[key](row[key]) : row[key]
          }
          return formatted
        })
      }

      switch (type) {
        case 'csv':
          exportToCSV(exportData, filename)
          break
        case 'excel':
          exportToExcel(exportData, filename)
          break
        case 'pdf':
          exportToPDF(exportData, filename, title || filename, columns)
          break
      }
      
      console.log(`Export ${type.toUpperCase()} realizado com sucesso!`)
    } catch (error) {
      console.error(`Erro ao exportar ${type.toUpperCase()}:`, error)
      alert(`Erro ao exportar ${type.toUpperCase()}. Verifique o console para mais detalhes.`)
    } finally {
      setShowMenu(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="btn btn-outline flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">Exportar</span>
      </button>

      {showMenu && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowMenu(false)}
          ></div>
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 animate-fade-in">
            <button
              onClick={() => handleExport('csv')}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700"
            >
              <FileText className="w-4 h-4 text-gray-500" />
              <span className="text-sm">Exportar CSV</span>
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700"
            >
              <FileSpreadsheet className="w-4 h-4 text-green-600" />
              <span className="text-sm">Exportar Excel</span>
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700"
            >
              <File className="w-4 h-4 text-danger-600" />
              <span className="text-sm">Exportar PDF</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
