import { useState, KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/utils/cn'

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  className?: string
}

export function TagInput({ value, onChange, placeholder = 'Add tag…', className }: TagInputProps) {
  const [input, setInput] = useState('')

  const add = (raw: string) => {
    const tag = raw.trim().toLowerCase()
    if (tag && !value.includes(tag)) onChange([...value, tag])
    setInput('')
  }

  const remove = (tag: string) => onChange(value.filter((t) => t !== tag))

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(input) }
    if (e.key === 'Backspace' && !input && value.length) remove(value[value.length - 1])
  }

  return (
    <div className={cn('flex flex-wrap gap-1.5 rounded-md border bg-background px-3 py-2 min-h-10 cursor-text', className)}
      onClick={() => document.getElementById('tag-input-field')?.focus()}>
      {value.map((tag) => (
        <Badge key={tag} variant="secondary" className="gap-1 pr-1 text-xs">
          {tag}
          <button type="button" className="hover:text-destructive" onClick={() => remove(tag)}>
            <X className="h-2.5 w-2.5" />
          </button>
        </Badge>
      ))}
      <Input
        id="tag-input-field"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => input && add(input)}
        placeholder={value.length === 0 ? placeholder : ''}
        className="border-0 p-0 h-5 flex-1 min-w-20 text-xs focus-visible:ring-0 bg-transparent shadow-none"
      />
    </div>
  )
}
