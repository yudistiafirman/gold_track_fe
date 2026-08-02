import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

interface OptionToggleProps {
  name: string
  value: string
  onValueChange: (value: string) => void
  options: { value: string; label: string }[]
  disabled?: boolean
}

/** Plain, visible horizontal radio buttons — used for the party-type / payment-mode toggles in transaction forms. */
export function OptionToggle({ name, value, onValueChange, options, disabled }: OptionToggleProps) {
  return (
    <RadioGroup
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      className="flex w-fit flex-row items-center gap-4"
    >
      {options.map((option) => (
        <div key={option.value} className="flex items-center gap-2">
          <RadioGroupItem value={option.value} id={`${name}-${option.value}`} />
          <Label htmlFor={`${name}-${option.value}`} className="cursor-pointer text-caption text-gray-700">
            {option.label}
          </Label>
        </div>
      ))}
    </RadioGroup>
  )
}
