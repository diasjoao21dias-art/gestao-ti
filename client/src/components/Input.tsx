import { AlertCircle } from 'lucide-react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helpText?: string
  icon?: React.ReactNode
}

export default function Input({ label, error, helpText, icon, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {props.required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          {...props}
          className={`
            input
            ${error ? 'input-error border-danger-500 focus:ring-danger-500' : ''}
            ${icon ? 'pl-10' : ''}
            ${className}
          `}
        />
        {error && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <AlertCircle className="w-5 h-5 text-danger-500" />
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-danger-600 flex items-center gap-1 animate-fade-in">
          {error}
        </p>
      )}
      {helpText && !error && (
        <p className="mt-1.5 text-sm text-gray-500">{helpText}</p>
      )}
    </div>
  )
}
