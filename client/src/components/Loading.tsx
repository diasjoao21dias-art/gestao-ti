interface LoadingProps {
  text?: string
  size?: 'sm' | 'md' | 'lg'
  fullScreen?: boolean
}

export default function Loading({ text = 'Carregando...', size = 'md', fullScreen = false }: LoadingProps) {
  const sizeClasses = {
    sm: 'h-8 w-8 border-2',
    md: 'h-12 w-12 border-4',
    lg: 'h-16 w-16 border-4'
  }

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  const content = (
    <div className="text-center">
      <div className={`animate-spin rounded-full border-primary-600 border-t-transparent mx-auto ${sizeClasses[size]}`}></div>
      {text && (
        <p className={`mt-4 text-gray-600 font-medium ${textSizes[size]}`}>{text}</p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        {content}
      </div>
    )
  }

  return content
}
