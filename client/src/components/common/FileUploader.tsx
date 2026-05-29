import { useCallback, useState } from 'react'
import { Upload, X, FileText, Image } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatFileSize } from '@/utils/formatDate'
import { cn } from '@/utils/cn'

interface Props {
  onFilesSelected: (files: File[]) => void
  accept?: string
  maxFiles?: number
  maxSizeBytes?: number
  className?: string
}

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'image/png',
  'image/jpeg',
  'video/mp4',
]

export function FileUploader({ onFilesSelected, accept, maxFiles = 10, maxSizeBytes = 50 * 1024 * 1024, className }: Props) {
  const [dragging, setDragging] = useState(false)
  const [staged, setStaged] = useState<File[]>([])

  const processFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => {
      if (!ALLOWED_TYPES.includes(f.type)) return false
      if (f.size > maxSizeBytes) return false
      return true
    })
    const next = [...staged, ...arr].slice(0, maxFiles)
    setStaged(next)
    onFilesSelected(next)
  }, [staged, maxFiles, maxSizeBytes, onFilesSelected])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    processFiles(e.dataTransfer.files)
  }, [processFiles])

  const removeFile = (idx: number) => {
    const next = staged.filter((_, i) => i !== idx)
    setStaged(next)
    onFilesSelected(next)
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50'
        )}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm font-medium">Drop files here or click to browse</p>
        <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, XLSX, ZIP, PNG, JPG, MP4 up to {formatFileSize(maxSizeBytes)}</p>
        <input
          id="file-input"
          type="file"
          multiple
          className="hidden"
          accept={accept ?? ALLOWED_TYPES.join(',')}
          onChange={(e) => e.target.files && processFiles(e.target.files)}
        />
      </div>
      {staged.length > 0 && (
        <div className="space-y-2">
          {staged.map((f, i) => (
            <div key={i} className="flex items-center gap-2 rounded-md border p-2 text-sm">
              {f.type.startsWith('image/') ? <Image className="h-4 w-4 text-blue-500" /> : <FileText className="h-4 w-4 text-muted-foreground" />}
              <span className="flex-1 truncate">{f.name}</span>
              <span className="text-muted-foreground text-xs">{formatFileSize(f.size)}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(i)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
