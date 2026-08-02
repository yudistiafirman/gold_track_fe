import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'

interface FormFieldProps {
  label: string
  htmlFor?: string
  error?: string
  required?: boolean
  description?: string
  children: ReactNode
}

export function FormField({
  label,
  htmlFor,
  error,
  required,
  description,
  children,
}: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor} className="text-label text-gray-700">
        {label}
        {required && <span className="text-error"> *</span>}
      </Label>
      {children}
      {error ? (
        <p className="text-caption text-error">{error}</p>
      ) : description ? (
        <p className="text-caption text-gray-500">{description}</p>
      ) : null}
    </div>
  )
}
