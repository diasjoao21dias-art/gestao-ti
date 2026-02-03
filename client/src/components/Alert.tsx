import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react'

interface AlertProps {
  type?: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  onClose?: () => void
  className?: string
}

export default function Alert({ type = 'info', title, message, onClose, className = '' }: AlertProps) {
  const styles = {
    success: {
      container: 'bg-success-50 border-success-200 text-success-800',
      icon: <CheckCircle className="w-5 h-5 text-success-600" />,
      title: 'text-success-900'
    },
    error: {
      container: 'bg-danger-50 border-danger-200 text-danger-800',
      icon: <AlertCircle className="w-5 h-5 text-danger-600" />,
      title: 'text-danger-900'
    },
    warning: {
      container: 'bg-warning-50 border-warning-200 text-warning-800',
      icon: <AlertTriangle className="w-5 h-5 text-warning-600" />,
      title: 'text-warning-900'
    },
    info: {
      container: 'bg-info-50 border-info-200 text-info-800',
      icon: <Info className="w-5 h-5 text-info-600" />,
      title: 'text-info-900'
    }
  }

  const currentStyle = styles[type]

  return (
    <div className={`border rounded-lg p-4 animate-fade-in-up ${currentStyle.container} ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {currentStyle.icon}
        </div>
        <div className="flex-1">
          {title && (
            <h3 className={`font-semibold text-sm mb-1 ${currentStyle.title}`}>
              {title}
            </h3>
          )}
          <p className="text-sm">{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 ml-2 hover:opacity-70 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
