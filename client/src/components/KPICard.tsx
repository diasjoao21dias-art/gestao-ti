import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  icon?: React.ReactNode
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'secondary'
  onClick?: () => void
}

export default function KPICard({ 
  title, 
  value, 
  subtitle, 
  trend, 
  trendValue, 
  icon, 
  color = 'primary',
  onClick 
}: KPICardProps) {
  const colorClasses = {
    primary: {
      bg: 'from-primary-500 to-primary-600',
      icon: 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300',
      text: 'text-primary-600 dark:text-primary-400'
    },
    success: {
      bg: 'from-success-500 to-success-600',
      icon: 'bg-success-100 text-success-700 dark:bg-success-900/50 dark:text-success-300',
      text: 'text-success-600 dark:text-success-400'
    },
    warning: {
      bg: 'from-warning-500 to-warning-600',
      icon: 'bg-warning-100 text-warning-700 dark:bg-warning-900/50 dark:text-warning-300',
      text: 'text-warning-600 dark:text-warning-400'
    },
    danger: {
      bg: 'from-danger-500 to-danger-600',
      icon: 'bg-danger-100 text-danger-700 dark:bg-danger-900/50 dark:text-danger-300',
      text: 'text-danger-600 dark:text-danger-400'
    },
    secondary: {
      bg: 'from-secondary-500 to-secondary-600',
      icon: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/50 dark:text-secondary-300',
      text: 'text-secondary-600 dark:text-secondary-400'
    }
  }

  const currentColor = colorClasses[color]

  const trendIcons = {
    up: <TrendingUp className="w-4 h-4" />,
    down: <TrendingDown className="w-4 h-4" />,
    neutral: <Minus className="w-4 h-4" />
  }

  const trendColors = {
    up: 'text-success-600 bg-success-50 dark:text-success-400 dark:bg-success-900/30',
    down: 'text-danger-600 bg-danger-50 dark:text-danger-400 dark:bg-danger-900/30',
    neutral: 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-700'
  }

  return (
    <div 
      onClick={onClick}
      className={`card group relative overflow-hidden ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${currentColor.bg} opacity-10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-300`}></div>
      
      <div className="card-body relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</h3>
          </div>
          {icon && (
            <div className={`p-3 rounded-lg ${currentColor.icon} group-hover:scale-110 transition-transform duration-200`}>
              {icon}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
          )}
          {trend && trendValue && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${trendColors[trend]}`}>
              {trendIcons[trend]}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
      </div>

      {onClick && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20 dark:to-gray-700/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      )}
    </div>
  )
}
