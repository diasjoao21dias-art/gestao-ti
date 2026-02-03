export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => boolean
  message: string
}

export interface ValidationRules {
  [key: string]: ValidationRule[]
}

export interface ValidationErrors {
  [key: string]: string
}

export const validate = (data: any, rules: ValidationRules): ValidationErrors => {
  const errors: ValidationErrors = {}

  for (const field in rules) {
    const value = data[field]
    const fieldRules = rules[field]

    for (const rule of fieldRules) {
      if (rule.required && (!value || value.toString().trim() === '')) {
        errors[field] = rule.message
        break
      }

      if (rule.minLength && value && value.toString().length < rule.minLength) {
        errors[field] = rule.message
        break
      }

      if (rule.maxLength && value && value.toString().length > rule.maxLength) {
        errors[field] = rule.message
        break
      }

      if (rule.pattern && value && !rule.pattern.test(value.toString())) {
        errors[field] = rule.message
        break
      }

      if (rule.custom && value && !rule.custom(value)) {
        errors[field] = rule.message
        break
      }
    }
  }

  return errors
}

export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const phonePattern = /^[\d\s\-\+\(\)]+$/
export const urlPattern = /^https?:\/\/.+/

export const commonRules = {
  email: (message = 'Email inválido'): ValidationRule => ({
    pattern: emailPattern,
    message
  }),
  phone: (message = 'Telefone inválido'): ValidationRule => ({
    pattern: phonePattern,
    message
  }),
  url: (message = 'URL inválida'): ValidationRule => ({
    pattern: urlPattern,
    message
  }),
  required: (message = 'Este campo é obrigatório'): ValidationRule => ({
    required: true,
    message
  }),
  minLength: (length: number, message?: string): ValidationRule => ({
    minLength: length,
    message: message || `Mínimo de ${length} caracteres`
  }),
  maxLength: (length: number, message?: string): ValidationRule => ({
    maxLength: length,
    message: message || `Máximo de ${length} caracteres`
  })
}
